#!/usr/bin/env python3
"""Recoverable production cleanup. Defaults to a read-only inventory.

Only the four documented demonstration events and two explicitly identified QA
accounts may be archived. Current content and financial rows are never deleted.
"""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import tempfile
import shutil
from recovery import DEFAULT_ENV, config, query, literal, identifier, maintenance


def decoded(env, source, directory):
    result=directory/'decoded.json'
    maintenance(env,'open',source,result)
    return json.loads(result.read_text())


def receipt_references(env, plan):
    allowed={'payment_receipts':['receipt_image_url'],'donations':['receipt_url']}
    found=[]
    for label,connection,schema in [('active',env['DATABASE_URL'],'cdr_render_qa'),('historical',env['SOURCE_DATABASE_URL'],'public')]:
        for item in plan:
            for table,columns in allowed.items():
                for column in columns:
                    sql=f'SELECT count(*) FROM {identifier(schema)}.{identifier(table)} WHERE {identifier(column)}={literal(item["public_url"])};'
                    found.append({'source':label,'schema':schema,'table':table,'column':column,'old':item['public_url'],'new':item['reference'],'count':int(query(connection,sql).strip())})
    return found


def protect_receipts(env, apply):
    home=Path(env['BACKUP_HOME']);temp=Path(tempfile.mkdtemp(prefix='.legacy-',dir=home));temp.chmod(0o700)
    try:
        plan_path=home/'legacy-plan.json.aes'
        if not plan_path.exists():maintenance(env,'legacy-stage',plan_path)
        plan=decoded(env,plan_path,temp)
        references=receipt_references(env,plan)
        report={'objects':len(plan),'references':sum(row['count'] for row in references),'applied':False}
        if apply:
            if not (home/'restore-result.json').is_file():raise RuntimeError('A successful restore drill is required before retiring public files')
            # One transaction changes existing receipt references only.
            for source,connection in [('active',env['DATABASE_URL']),('historical',env['SOURCE_DATABASE_URL'])]:
                sql=['BEGIN;']
                for row in references:
                    if row['source']==source:
                        sql.append(f'UPDATE {identifier(row["schema"])}.{identifier(row["table"])} SET {identifier(row["column"])}={literal(row["new"])} WHERE {identifier(row["column"])}={literal(row["old"])};')
                sql.append('COMMIT;');query(connection,'\n'.join(sql))
            if any(row['count'] for row in receipt_references(env,plan)):raise RuntimeError('Legacy references remain; public originals retained')
            maintenance(env,'upload-backup',plan_path)
            maintenance(env,'legacy-retire',plan_path)
            report.update(applied=True, public_originals_retired=True, recovery_copies_verified=True)
        print(json.dumps(report),flush=True)
        out=home/'legacy-result.json';out.write_text(json.dumps(report,indent=2));out.chmod(0o600)
    finally:shutil.rmtree(temp)


def archive(env, apply, accounts):
    manifest=json.loads((Path(__file__).resolve().parents[1]/'docs/release-2026-10-27/eventos-ejemplo.json').read_text())['events']
    qa=json.loads(accounts.read_text())
    emails=[row['email'] for row in qa]
    if len(emails)!=2 or {row['role'] for row in qa}!={'admin','member'}:raise RuntimeError('Exactly the two controlled QA accounts are required')
    connection=env['DATABASE_URL'];quoted_emails=','.join(literal(value) for value in emails)
    real_admins=int(query(connection,f"SELECT count(*) FROM cdr_render_qa.users WHERE role='admin' AND deleted_at IS NULL AND email NOT IN ({quoted_emails});").strip())
    if real_admins<1:raise RuntimeError('No active institutional administrator remains; accounts retained')
    selected=[]
    for event in manifest:
        rows=query(connection,f"SELECT row_to_json(e) FROM cdr_render_qa.events e WHERE id={int(event['id'])} AND deleted_at IS NULL;").strip()
        if not rows:continue
        current=json.loads(rows)
        if current['title']!=event['title'] or current['requires_payment'] or current['price_gtq']:
            raise RuntimeError('A demonstration event was changed by an administrator; review needed')
        registered=int(query(connection,f"SELECT count(*) FROM cdr_render_qa.event_registrations WHERE event_id={int(event['id'])} AND deleted_at IS NULL;").strip())
        receipts=int(query(connection,f"SELECT count(*) FROM cdr_render_qa.payment_receipts WHERE event_id={int(event['id'])} AND deleted_at IS NULL;").strip())
        if registered or receipts:raise RuntimeError('A demonstration event has registrations or receipts; it was retained for review')
        selected.append(current)
    users=[json.loads(line) for line in query(connection,f"SELECT row_to_json(u) FROM cdr_render_qa.users u WHERE email IN ({quoted_emails}) AND deleted_at IS NULL;").splitlines() if line.startswith('{')]
    report={'documented_demo_events':len(selected),'controlled_qa_accounts':len(users),'institutional_admins_remaining':real_admins,'applied':False}
    if apply:
        home=Path(env['BACKUP_HOME']);temp=Path(tempfile.mkdtemp(prefix='.archive-',dir=home));temp.chmod(0o700)
        try:
            original=temp/'original.json';original.write_text(json.dumps({'events':selected,'users':users}));original.chmod(0o600)
            stamp=dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
            journal=home/f'archived-demos-{stamp}.json.aes'
            maintenance(env,'seal',original,journal);maintenance(env,'upload-backup',journal)
            ids=','.join(str(row['id']) for row in selected)
            sql=['BEGIN;']
            if ids:sql.append(f'UPDATE cdr_render_qa.events SET is_active=false WHERE id IN ({ids});')
            sql.append(f"UPDATE cdr_render_qa.users SET deleted_at=now(),session_version=session_version+1,refresh_token=NULL,refresh_token_expiry=NULL,reset_token=NULL,reset_token_expiry=NULL WHERE email IN ({quoted_emails}) AND deleted_at IS NULL;")
            sql.append('COMMIT;');query(connection,'\n'.join(sql));report['applied']=True
        finally:shutil.rmtree(temp)
    print(json.dumps(report),flush=True)
    if apply:
        out=Path(env['BACKUP_HOME'])/'archive-result.json';out.write_text(json.dumps(report,indent=2));out.chmod(0o600)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['receipts','archive-demos'])
    parser.add_argument('--apply',action='store_true')
    parser.add_argument('--environment',type=Path,default=DEFAULT_ENV)
    parser.add_argument('--qa-accounts',type=Path)
    args=parser.parse_args();env=config(args.environment)
    if args.command=='receipts':protect_receipts(env,args.apply)
    else:
        if not args.qa_accounts:parser.error('--qa-accounts must identify the existing controlled accounts')
        archive(env,args.apply,args.qa_accounts)
if __name__=='__main__':
    try:main()
    except RuntimeError as error:raise SystemExit(str(error))
