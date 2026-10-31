#!/usr/bin/env python3
"""Encrypted database/storage recovery. All credentials stay in a private JSON file.

A restore drill accepts only a new disposable database on localhost. Remote
production databases can be backed up, but cannot be overwritten by this tool.
"""
import argparse
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import socket
import secrets
from urllib.parse import quote
import subprocess
import tempfile
from urllib.parse import unquote, urlsplit, parse_qs

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENV = Path.home() / '.local/share/casadelrey-operations/environment.json'


def config(path):
    if path.stat().st_mode & 0o077:
        raise RuntimeError('The operational environment must have private permissions (0600).')
    values = json.loads(path.read_text())
    return {**os.environ, **values}


def pg_env(connection):
    url = urlsplit(connection)
    if url.scheme not in ('postgres', 'postgresql') or not url.hostname:
        raise RuntimeError('Invalid PostgreSQL connection')
    query = parse_qs(url.query)
    env = os.environ.copy()
    env.update(PGHOST=url.hostname, PGPORT=str(url.port or 5432), PGUSER=unquote(url.username or ''),
               PGPASSWORD=unquote(url.password or ''), PGDATABASE=url.path.lstrip('/'),
               PGSSLMODE=query.get('sslmode', ['require'])[0], PGCONNECT_TIMEOUT='20',
               PGOPTIONS='-c statement_timeout=120000')
    return env


def run(args, env=None, input=None, timeout=300):
    result = subprocess.run(args, env=env, input=input, capture_output=True, timeout=timeout)
    if result.returncode:
        diagnostic = Path(env.get('BACKUP_HOME', tempfile.gettempdir()) if env else tempfile.gettempdir()) / 'recovery-error.local.txt'
        diagnostic.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        diagnostic.write_bytes(result.stderr); diagnostic.chmod(0o600)
        raise RuntimeError(f'Operation failed; protected diagnostics: {diagnostic}')
    return result.stdout


def query(connection, sql):
    return run(['psql', '-XAt', '-v', 'ON_ERROR_STOP=1'], pg_env(connection), sql.encode()).decode()


def identifier(value):
    if not re.fullmatch(r'[a-z_][a-z0-9_]*', value):
        raise RuntimeError('Unsafe database identifier')
    return '"' + value + '"'


def counts(connection, schema):
    tables = query(connection, "SELECT tablename FROM pg_tables WHERE schemaname=" + literal(schema) + " ORDER BY tablename;").splitlines()
    if not tables:
        raise RuntimeError('No tables found in expected schema')
    sql = 'BEGIN READ ONLY;\n' + '\n'.join(
        f"SELECT json_build_object('table',{literal(table)},'rows',count(*)) FROM {identifier(schema)}.{identifier(table)};"
        for table in tables) + '\nCOMMIT;'
    return [json.loads(line) for line in query(connection, sql).splitlines() if line.startswith('{')]


def literal(value):
    return "'" + str(value).replace("'", "''") + "'"


def maintenance(env, *args, timeout=5400):
    binary = Path(env['BACKUP_KEY_FILE']).parent / 'maintenance'
    if not binary.is_file():
        raise RuntimeError('Build backend/cmd/maintenance into the private operations directory first')
    result = subprocess.run([str(binary), *map(str, args)], env=env, timeout=timeout)
    if result.returncode:
        raise RuntimeError('Storage/encryption maintenance failed; no further operations were performed')


def backup(env, storage=False):
    directory = Path(env['BACKUP_HOME']); directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    stamp = dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    sources = [('active', env['DATABASE_URL'], 'cdr_render_qa'), ('historical', env['SOURCE_DATABASE_URL'], 'public')]
    report = {'created_at': stamp, 'databases': []}
    for label, connection, schema in sources:
        private = Path(tempfile.mkdtemp(prefix='.db-', dir=directory)); private.chmod(0o700)
        try:
            before = counts(connection, schema)
            dependencies = [{'schema':'auth','tables':counts(connection,'auth')}] if label=='historical' else []
            schemas = [schema] + [row['schema'] for row in dependencies]
            roles = query(connection, "SELECT DISTINCT unnest(roles) FROM pg_policies WHERE schemaname IN (" + ','.join(literal(value) for value in schemas) + ");").splitlines()

            dump = private / 'database.dump'
            dump.touch(mode=0o600)
            run(['pg_dump', '--format=custom', '--no-owner', '--no-acl'] + ['--schema='+value for value in schemas] + ['--file='+str(dump)], pg_env(connection), timeout=900)
            digest = hashlib.sha256(dump.read_bytes()).hexdigest()
            sealed = directory / f'{label}-{stamp}.dump.aes'
            maintenance(env, 'seal', dump, sealed)
            check = private / 'verified.dump'; maintenance(env, 'open', sealed, check)
            if hashlib.sha256(check.read_bytes()).hexdigest() != digest:
                raise RuntimeError('Database backup integrity mismatch')
            metadata = {'source': label, 'schema': schema, 'snapshot': sealed.name,
                        'sha256': digest, 'tables': before, 'dependencies':dependencies, 'policy_roles':roles}
            details = private / 'inventory.json'; details.write_text(json.dumps(metadata)); details.chmod(0o600)
            sealed_metadata = directory / f'{label}-{stamp}.manifest.aes'
            maintenance(env, 'seal', details, sealed_metadata)
            maintenance(env, 'upload-backup', sealed)
            maintenance(env, 'upload-backup', sealed_metadata)
            report['databases'].append({'source': label, 'tables': len(before), 'rows': sum(row['rows'] for row in before), 'snapshot': sealed.name})
            print(f"Database protected: {label}; {len(before)} tables", flush=True)
        finally:
            shutil.rmtree(private)
    if storage:
        maintenance(env, 'storage-backup', directory/'storage')
    report['storage_included'] = storage
    (directory/'latest-result.json').write_text(json.dumps(report, indent=2)); (directory/'latest-result.json').chmod(0o600)
    print(json.dumps(report), flush=True)


def restore_check(env):
    directory = Path(env['BACKUP_HOME'])
    pg_bin = Path(shutil.which('pg_ctl') or '')
    if not pg_bin.is_file():
        raise RuntimeError('A local PostgreSQL installation with pg_ctl is required')
    pg_bin = pg_bin.parent
    temp = Path(tempfile.mkdtemp(prefix='cdr-restore-')); temp.chmod(0o700)
    with socket.socket() as sock:
        sock.bind(('127.0.0.1',0)); port = sock.getsockname()[1]
    password=secrets.token_urlsafe(32)
    password_file=temp/'password'; password_file.write_text(password);password_file.chmod(0o600)
    started = False
    result = {'databases': [], 'storage_objects_verified': 0}
    try:
        run([str(pg_bin/'initdb'), '-D', str(temp/'pg'), '--auth=scram-sha-256', '--pwfile='+str(password_file), '--no-locale', '--encoding=UTF8', '--username=cdr_restore'])
        run([str(pg_bin/'pg_ctl'), '-D', str(temp/'pg'), '-l', str(temp/'server.log'), '-o', f'-h 127.0.0.1 -p {port} -k {temp}', '-w', 'start']); started=True
        for label in ['active', 'historical']:
            snapshot = sorted(directory.glob(f'{label}-*.dump.aes'))[-1]
            manifest = snapshot.with_name(snapshot.name.replace('.dump.aes','.manifest.aes'))
            decoded = temp/f'{label}.json'; maintenance(env,'open',manifest,decoded)
            metadata=json.loads(decoded.read_text())
            dump=temp/f'{label}.dump'; maintenance(env,'open',snapshot,dump)
            if hashlib.sha256(dump.read_bytes()).hexdigest()!=metadata['sha256']:
                raise RuntimeError('Snapshot checksum failed')
            dbname='restore_'+label
            local=f'postgres://cdr_restore:{quote(password,safe="")}@127.0.0.1:{port}/{dbname}?sslmode=disable'
            run([str(pg_bin/'createdb'),'-h','127.0.0.1','-p',str(port),'-U','cdr_restore',dbname],pg_env(local))
            if metadata['schema']=='public': query(local, 'DROP SCHEMA public;')
            for role in metadata.get('policy_roles',[]):
                if role!='public' and query(local,'SELECT count(*) FROM pg_roles WHERE rolname='+literal(role)+';').strip()=='0':
                    query(local, 'CREATE ROLE '+identifier(role)+' NOLOGIN;')
            run([str(pg_bin/'pg_restore'),'--exit-on-error','--no-owner','--no-acl','--dbname',dbname,str(dump)],pg_env(local),timeout=900)
            restored=counts(local,metadata['schema'])
            if restored!=metadata['tables']:
                raise RuntimeError('Restored table counts differ from the snapshot inventory')
            for dependency in metadata.get('dependencies',[]):
                if counts(local,dependency['schema'])!=dependency['tables']:
                    raise RuntimeError('Provider authentication dependency did not restore completely')
            # Validate constraints and foreign keys on the restored copy, not on production.
            invalid=query(local,"SELECT count(*) FROM pg_constraint WHERE NOT convalidated AND connamespace="+literal(metadata['schema'])+"::regnamespace;").strip()
            if invalid!='0': raise RuntimeError('Restored database contains unvalidated constraints')
            result['databases'].append({'source':label,'tables':len(restored),'rows':sum(row['rows'] for row in restored),'restored':True})
            print(f'Restoration verified: {label}; {len(restored)} tables',flush=True)
        manifests=sorted((directory/'storage').glob('storage-*.json.aes'))
        if manifests:
            decoded=temp/'storage.json';maintenance(env,'open',manifests[-1],decoded)
            for index,row in enumerate(json.loads(decoded.read_text())['objects']):
                output=temp/'object';maintenance(env,'open',directory/'storage/objects'/(row['sha256']+'.aes'),output)
                if hashlib.sha256(output.read_bytes()).hexdigest()!=row['sha256'] or output.stat().st_size!=row['size']:
                    raise RuntimeError('Storage recovery checksum mismatch')
                output.unlink();result['storage_objects_verified']+=1
                if (index+1)%100==0:print(f'Storage recovery verified: {index+1}',flush=True)
        result['verified_at']=dt.datetime.now(dt.timezone.utc).isoformat()
        output=directory/'restore-result.json';output.write_text(json.dumps(result,indent=2));output.chmod(0o600)
        print(json.dumps(result),flush=True)
    finally:
        if started: run([str(pg_bin/'pg_ctl'),'-D',str(temp/'pg'),'-m','fast','-w','stop'])
        shutil.rmtree(temp)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['backup','restore-check'])
    parser.add_argument('--environment',type=Path,default=DEFAULT_ENV)
    parser.add_argument('--storage',action='store_true')
    args=parser.parse_args();env=config(args.environment)
    lock_path=Path(env['BACKUP_KEY_FILE']).parent/'maintenance.lock'
    with lock_path.open('w') as lock:
        os.chmod(lock_path,0o600)
        try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError: raise SystemExit('Another maintenance operation is already running')
        if args.command=='backup':backup(env,args.storage)
        else:restore_check(env)

if __name__=='__main__':
    try: main()
    except (RuntimeError,subprocess.TimeoutExpired) as error: raise SystemExit(str(error))
