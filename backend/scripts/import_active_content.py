"""Publish active CMS content with separate source/destination credentials.

SOURCE_DATABASE_URL and TARGET_DATABASE_URL stay in the process environment.
Default is a complete transactional rehearsal ending in ROLLBACK. --apply
requires a pre-existing private recovery snapshot. No rows/tokens are logged.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
from urllib.parse import unquote, urlsplit

TABLES = ['users', 'events', 'cell_categories', 'cells', 'posts', 'announcements',
          'gallery_photos', 'social_posts', 'faqs', 'leaders', 'volunteer_areas',
          'donation_purposes', 'hero_settings', 'site_photos', 'site_settings']
TOKENS = ['reset_token', 'reset_token_expiry', 'verification_token',
          'verification_token_expiry', 'refresh_token', 'refresh_token_expiry']


def query(connection, sql):
    url = urlsplit(connection)
    env = os.environ.copy()
    env.update(PGHOST=url.hostname, PGPORT=str(url.port or 5432),
               PGUSER=unquote(url.username), PGPASSWORD=unquote(url.password),
               PGDATABASE=url.path.lstrip('/'), PGSSLMODE='require', PGCONNECT_TIMEOUT='15')
    result = subprocess.run(['psql', '-XAt', '-v', 'ON_ERROR_STOP=1'],
                            input=sql, env=env, capture_output=True, text=True)
    if result.returncode:
        log = Path('/tmp/cdr-content-import-error.txt')
        log.write_text(result.stderr)
        log.chmod(0o600)
        raise RuntimeError('Database operation failed; protected local diagnostics saved.')
    return result.stdout


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--backup', type=Path)
    args = parser.parse_args()
    if args.apply and (not args.backup or not args.backup.is_file() or args.backup.stat().st_size == 0):
        parser.error('--apply requires a recovery snapshot')
    source = os.environ['SOURCE_DATABASE_URL']
    target = os.environ['TARGET_DATABASE_URL']
    if source == target:
        parser.error('Source and destination connections must differ')
    statements = []
    for table in TABLES:
        expression = 'to_jsonb(r)'
        if table == 'users':
            expression += " - ARRAY[" + ','.join("'" + key + "'" for key in TOKENS) + ']'
        statements.append(f"SELECT jsonb_build_object('table','{table}','rows',coalesce(jsonb_agg({expression}),'[]')) FROM public.{table} r WHERE deleted_at IS NULL;")
    output = query(source, "BEGIN READ ONLY; SET LOCAL statement_timeout='30s';" + '\n'.join(statements) + 'COMMIT;')
    inventory = [json.loads(line) for line in output.splitlines() if line.startswith('{')]
    if {row['table'] for row in inventory} != set(TABLES):
        raise RuntimeError('Incomplete source inventory')
    staging = ['CREATE TEMP TABLE import_source (table_name text PRIMARY KEY, payload jsonb);']
    for row in inventory:
        data = json.dumps(row['rows'], ensure_ascii=False).replace("'", "''")
        table = row['table']
        staging.append(f"INSERT INTO import_source VALUES ('{table}','{data}'::jsonb);")
        staging.append(f"CREATE TEMP VIEW source_{table} AS SELECT * FROM jsonb_populate_recordset(NULL::cdr_render_qa.{table}, (SELECT payload FROM import_source WHERE table_name='{table}'));")
    script = Path(__file__).with_suffix('.sql').read_text()
    script = script.replace('BEGIN;', 'BEGIN;\n' + '\n'.join(staging), 1)
    if not args.apply:
        script = script.rsplit('COMMIT;', 1)[0] + 'ROLLBACK;\n'
    output = query(target, script)
    for line in output.splitlines():
        if '|' in line:
            print(line)
    print('Applied active content.' if args.apply else 'Rehearsal passed; rolled back.')


if __name__ == '__main__':
    main()
