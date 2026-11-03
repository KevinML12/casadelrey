#!/usr/bin/env python3
"""Run the actual UI/API against a disposable PostgreSQL database and local files.

No cloud credentials or existing application database are loaded. All identities,
uploads, mail outbox rows and financial examples disappear with the test cluster.
"""
import argparse
import json
import os
from pathlib import Path
import secrets
import signal
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]

def port():
    with socket.socket() as endpoint:
        endpoint.bind(('127.0.0.1', 0))
        return endpoint.getsockname()[1]

def ready(url, process):
    for _ in range(150):
        if process.poll() is not None:
            raise RuntimeError('isolated test service stopped; inspect its local log')
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if response.status == 200: return
        except (OSError, TimeoutError): pass
        time.sleep(.2)
    raise RuntimeError('isolated test service did not become ready')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('suites', nargs='*', default=['roles-fullstack.spec.js'])
    parser.add_argument('--all', action='store_true', help='include every existing browser suite')
    parser.add_argument('--grep', help='run only matching browser scenarios')
    parser.add_argument('--output', type=Path, default=ROOT/'docs/e2e-2026-11-02')
    args = parser.parse_args()
    output = args.output.resolve(); output.mkdir(parents=True, exist_ok=True)
    # Whitelist runtime/toolchain settings; never inherit mail/storage/DB secrets.
    env = {key:value for key,value in os.environ.items() if key in {'PATH','HOME','TMPDIR','LANG','LC_ALL','GOPATH','GOCACHE','GOMODCACHE','GOROOT','SSL_CERT_FILE','NODE_EXTRA_CA_CERTS'}}
    services = []
    with tempfile.TemporaryDirectory(prefix='cdr-fullstack-') as temporary:
        home = Path(temporary); home.chmod(0o700)
        password = secrets.token_urlsafe(32)
        pwfile = home/'password'; pwfile.write_text(password); pwfile.chmod(0o600)
        pgport, apiport, webport = port(), port(), port()
        data = home/'pg'
        subprocess.run(['initdb','-D',str(data),'--username=cdr_test','--auth=scram-sha-256','--pwfile='+str(pwfile),'--no-locale','--encoding=UTF8'],stdout=subprocess.DEVNULL,check=True,env=env)
        subprocess.run(['pg_ctl','-D',str(data),'-l',str(home/'postgres.log'),'-o',f'-h 127.0.0.1 -p {pgport} -k {home}','-w','start'],stdout=subprocess.DEVNULL,check=True,env=env)
        try:
            # Keep the machine computing during long suites without changing
            # display/lock preferences or saving any persistent power setting.
            if shutil.which('caffeinate'):
                services.append(subprocess.Popen(['caffeinate','-i','-s'],env=env,start_new_session=True))
            pgenv = dict(env,PGPASSWORD=password)
            subprocess.run(['createdb','-h','127.0.0.1','-p',str(pgport),'-U','cdr_test','cdr_e2e'],check=True,env=pgenv)
            accounts = [{'role':role,'name':name,'email':f'{role}-{secrets.token_hex(4)}@example.invalid','password':secrets.token_urlsafe(24)} for role,name in [('admin','Administrador E2E'),('leader','Líder E2E'),('other_leader','Otro líder E2E'),('member','Miembro E2E'),('volunteer','Voluntario E2E')]]
            account_file = home/'accounts.json'; account_file.write_text(json.dumps(accounts)); account_file.chmod(0o600)
            api = f'http://127.0.0.1:{apiport}'; web = f'http://127.0.0.1:{webport}'
            env.update(DATABASE_URL=f'postgres://cdr_test:{password}@127.0.0.1:{pgport}/cdr_e2e?sslmode=disable',JWT_SECRET=secrets.token_urlsafe(48),ENV='e2e',PORT=str(apiport),BASE_URL=api,CLIENT_URL=web,DB_MAX_OPEN_CONNS='3',CDR_LOCAL_E2E='1',E2E_QA_USERS_FILE=str(account_file),E2E_ADMIN_EMAIL=accounts[0]['email'],E2E_ADMIN_PASSWORD=accounts[0]['password'],PW_BASE_URL=web,PW_API_URL=api,VITE_API_URL=api,CDR_E2E_OUTPUT=str(output),PLAYWRIGHT_HTML_OPEN='never')
            binary = home/'backend'
            subprocess.run(['go','build','-o',str(binary),'.'],cwd=ROOT/'backend',env=env,check=True)
            with (output/'seed.log').open('w') as seedlog:
                subprocess.run(['go','run','./cmd/e2eseed'],cwd=ROOT/'backend',env=env,stdout=seedlog,stderr=subprocess.STDOUT,check=True)
            with (output/'backend.log').open('w') as apilog, (output/'frontend.log').open('w') as weblog:
                backend = subprocess.Popen([str(binary)],cwd=home,env=env,stdout=apilog,stderr=subprocess.STDOUT,start_new_session=True); services.append(backend)
                ready(api+'/ready',backend)
                frontend = subprocess.Popen(['npm','run','dev','--','--host','127.0.0.1','--port',str(webport),'--strictPort'],cwd=ROOT/'frontend',env=env,stdout=weblog,stderr=subprocess.STDOUT,start_new_session=True); services.append(frontend)
                ready(web,frontend)
                print('Isolated UI/API ready; five temporary identities; cloud providers disabled.',flush=True)
                command = ['npx','playwright','test',*([] if args.all else args.suites),'--output',str(output/'artifacts')]
                if args.grep: command += ['--grep',args.grep]
                result = subprocess.run(command,cwd=ROOT/'frontend',env=env)
                return result.returncode
        finally:
            for process in reversed(services):
                if process.poll() is None:
                    os.killpg(process.pid,signal.SIGTERM)
                    try: process.wait(timeout=15)
                    except subprocess.TimeoutExpired: os.killpg(process.pid,signal.SIGKILL); process.wait()
            subprocess.run(['pg_ctl','-D',str(data),'-m','fast','-w','stop'],stdout=subprocess.DEVNULL,check=True,env=env)
            print('Temporary accounts, database, sessions and uploads removed.',flush=True)

if __name__ == '__main__': raise SystemExit(main())
