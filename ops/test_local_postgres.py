"""Run backend race tests against a disposable loopback-only PostgreSQL cluster.
No application credentials are loaded. The cluster is removed even on failure.
"""
import os
from pathlib import Path
import secrets
import socket
import subprocess
import tempfile


def main():
    with tempfile.TemporaryDirectory(prefix='cdr-tests-') as temporary:
        root = Path(temporary)
        root.chmod(0o700)
        password = secrets.token_urlsafe(32)
        pwfile = root / 'password'
        pwfile.write_text(password)
        pwfile.chmod(0o600)
        data = root / 'pg'
        with socket.socket() as endpoint:
            endpoint.bind(('127.0.0.1', 0))
            port = endpoint.getsockname()[1]
        subprocess.run(['initdb', '-D', str(data), '--username=cdr_test', '--auth=scram-sha-256', '--pwfile='+str(pwfile), '--no-locale', '--encoding=UTF8'], stdout=subprocess.DEVNULL, check=True)
        subprocess.run(['pg_ctl', '-D', str(data), '-l', str(root/'postgres.log'), '-o', f'-h 127.0.0.1 -p {port} -k {root}', '-w', 'start'], stdout=subprocess.DEVNULL, check=True)
        try:
            env = os.environ.copy()
            env['CDR_TEST_POSTGRES_DSN'] = f'postgres://cdr_test:{password}@127.0.0.1:{port}/postgres?sslmode=disable'
            result = subprocess.run(['go', 'test', '-race', './...'], cwd=Path(__file__).resolve().parents[1]/'backend', env=env)
            return result.returncode
        finally:
            subprocess.run(['pg_ctl', '-D', str(data), '-m', 'fast', '-w', 'stop'], stdout=subprocess.DEVNULL, check=True)


if __name__ == '__main__':
    raise SystemExit(main())
