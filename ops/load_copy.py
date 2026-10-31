#!/usr/bin/env python3
"""Run a paced public-read workload on an isolated copy; never sends mail."""
import hashlib,json,os,secrets,shutil,socket,subprocess,tempfile,time
from pathlib import Path
from urllib.parse import quote,urlencode
from recovery import DEFAULT_ENV,config,maintenance,pg_env,run

def main():
 env=config(DEFAULT_ENV);home=Path(env['BACKUP_HOME']);binary=Path(env['BACKUP_KEY_FILE']).parent
 temp=Path(tempfile.mkdtemp(prefix='cdr-load-copy-'));temp.chmod(0o700)
 pg_bin=Path(shutil.which('pg_ctl')).parent
 def port():
  with socket.socket() as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]
 pg_port,http_port=port(),port();password=secrets.token_urlsafe(32)
 pw=temp/'password';pw.write_text(password);pw.chmod(0o600)
 started=False;process=None
 try:
  snapshot=sorted(home.glob('active-*.dump.aes'))[-1]
  dump=temp/'database.dump';maintenance(env,'open',snapshot,dump)
  run([str(pg_bin/'initdb'),'-D',str(temp/'pg'),'--auth=scram-sha-256','--pwfile='+str(pw),'--no-locale','--encoding=UTF8','--username=cdr_load'])
  run([str(pg_bin/'pg_ctl'),'-D',str(temp/'pg'),'-l',str(temp/'postgres.log'),'-o',f'-h 127.0.0.1 -p {pg_port} -k {temp}','-w','start']);started=True
  connection=f'postgres://cdr_load:{quote(password,safe="")}@127.0.0.1:{pg_port}/postgres?sslmode=disable'
  run([str(pg_bin/'pg_restore'),'--exit-on-error','--no-owner','--no-acl','--dbname','postgres',str(dump)],pg_env(connection))
  query=urlencode({'sslmode':'disable','options':'-csearch_path=cdr_render_qa,public'})
  backend_env={'PATH':os.environ['PATH'],'ENV':'test','DATABASE_URL':connection.split('?')[0]+'?'+query,
   'JWT_SECRET':secrets.token_urlsafe(40),'PORT':str(http_port),'BASE_URL':f'http://127.0.0.1:{http_port}',
   'CLIENT_URL':'http://127.0.0.1:5173','DB_MAX_OPEN_CONNS':'3','BREVO_API_KEY':'','SENTRY_DSN':''}
  logfile=(temp/'backend.log').open('wb')
  process=subprocess.Popen([str(binary/'backend')],cwd=temp,env=backend_env,stdout=logfile,stderr=subprocess.STDOUT)
  import urllib.request
  for attempt in range(180):
   if process.poll() is not None:raise RuntimeError('Isolated backend failed to start')
   try:
    with urllib.request.urlopen(f'http://127.0.0.1:{http_port}/ready',timeout=2) as response:
     if response.status==200:break
   except OSError:time.sleep(.5)
  else:raise RuntimeError('Isolated backend readiness timed out')
  print('Isolated copy ready; provider credentials absent; PostgreSQL pool limited to 3.',flush=True)
  report=home/'load-local.json'
  result=subprocess.run([str(binary/'loadtest'),'--base',f'http://127.0.0.1:{http_port}','--requests','6000','--rps','25','--concurrency','50','--output',str(report)])
  raise SystemExit(result.returncode)
 finally:
  if process:
   process.terminate()
   try:process.wait(timeout=25)
   except subprocess.TimeoutExpired:process.kill();process.wait()
  if started:run([str(pg_bin/'pg_ctl'),'-D',str(temp/'pg'),'-m','fast','-w','stop'])
  shutil.rmtree(temp)
if __name__=='__main__':main()
