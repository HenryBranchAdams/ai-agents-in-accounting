"""Reconcile follow-up research; never modify canonical inputs or the prior package."""
from pathlib import Path
import json, hashlib, collections, re, urllib.parse, copy
ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[2]
OLD=ROOT.parent/'2026-09-22-accounting-specialties'
GROUPS={'capital-property':{1,2,8,9},'specialist-reporting':{3,4,5,6},'cost-contracts-associations':{7,10,11,12},'operating-verticals':{13,14,15}}
FIELDS=set('source_key title publisher url publication_date_or_edition jurisdictions entity_roles accounting_bases source_classification areas questions inspected_summary locators verification_status access_limits effective_dates_and_supersession rights corpus_disposition existing_record_ids retrieved_at evidence'.split())
STATUSES={'supported','partial','unresolved'}
READS={'substantive-read','partial-read','discovery-only','restricted-access'}
def read(p): return json.loads(p.read_text())
def write(n,d): (ROOT/n).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
def norm(u):
 p=urllib.parse.urlsplit(u)
 return urllib.parse.urlunsplit((p.scheme.lower(),p.netloc.lower().removeprefix('www.'),p.path.rstrip('/'),urllib.parse.urlencode([(k,v) for k,v in urllib.parse.parse_qsl(p.query) if not k.startswith('utm_')]),''))
def cell(v): return str(v).replace('|','/').replace('\n',' ')
errors=[]; warnings=[]
prior=read(OLD/'source-inventory.json'); prior_keys={k for s in prior for k in s['source_keys']}
base=read(ROOT/'baseline-gap-ledger.json'); qbase={q['question_id']:q for q in base}
allids={r['id'] for p in (REPO/'data/corpus').glob('*.json') for r in read(p)}
for filename,key in [('research-questions.json','questions'),('assessments.json','assessments')]: allids.update(r['id'] for r in read(REPO/'data/coverage'/filename)[key])
sourceids={r['id'] for r in read(REPO/'data/corpus/source.json')}
corpusurls=collections.defaultdict(list)
for s in read(REPO/'data/corpus/source.json'):
 if s.get('source_url'): corpusurls[norm(s['source_url'])].append(s['id'])
obs=[]; areas=[]; updates=[]; newkeys={}
for group,owned in GROUPS.items():
 if any(not (ROOT/group/f).exists() for f in ['sources.json','areas.json','gap-updates.json']): errors.append(f'{group}: incomplete'); continue
 ss=read(ROOT/group/'sources.json'); aa=read(ROOT/group/'areas.json'); uu=read(ROOT/group/'gap-updates.json')
 if {a['number'] for a in aa}!=owned: errors.append(f'{group}: wrong area ownership')
 for s in ss: obs.append(dict(s,group=group,research_stage='followup'))
 expected={q['question_id'] for q in base if q['area'] in owned}
 if {u['question_id'] for u in uu}!=expected: errors.append(f'{group}: missing/extra question updates {expected ^ {u["question_id"] for u in uu}}')
 updates.extend(dict(u,group=group) for u in uu)
 for a in aa:
  brief=ROOT/group/a['brief']
  if not brief.exists(): errors.append(f'{group}: missing brief {brief.name}')
  else:
   txt=brief.read_text()
   for ref in re.findall(r'`((?:src_|guide-|rq-|coverage-)[\w-]+)`',txt):
    if ref not in allids: errors.append(f'{brief.name}: unknown corpus ID {ref}')
  if not set(a.get('existing_record_ids',[]))<=allids: errors.append(f'area{a["number"]}: invalid corpus IDs')
  areas.append(dict(a,group=group,brief=f'{group}/{a["brief"]}'))
obs.extend(dict(s,group='coordinator',research_stage='followup') for s in read(ROOT/'coordinator-sources.json'))
for s in obs:
 k=s.get('source_key','MISSING')
 if FIELDS-set(s): errors.append(f'{k}: missing metadata {FIELDS-set(s)}')
 if k in newkeys or k in prior_keys: errors.append(f'{k}: duplicate source key')
 newkeys[k]=s
 if s['group'] in GROUPS and not set(s.get('areas',[]))<=GROUPS[s['group']]: errors.append(f'{k}: source outside assigned areas')
 if s.get('verification_status') not in READS: errors.append(f'{k}: invalid read status')
 if not set(s.get('existing_record_ids',[]))<=sourceids: errors.append(f'{k}: invalid source ID')
 if not set(s.get('prior_source_keys',[]))<=prior_keys: errors.append(f'{k}: invalid prior key')
 if not s.get('evidence') or not s.get('locators'): warnings.append(f'{k}: no evidence/locators')
 if s.get('verification_status')=='substantive-read' and all('search' in e.get('method','').lower() and not any(t in e.get('method','').lower() for t in ['read','open','fetch']) for e in s.get('evidence',[])): warnings.append(f'{k}: substantive read has search-only method')
# Exact URL and explicitly reviewed aliases define identity. Prior IDs never change.
aliases=read(ROOT/'identity-aliases.json') if (ROOT/'identity-aliases.json').exists() else {}
inv=copy.deepcopy(prior); byurl={norm(s['url']):s for s in inv}
for s in inv:
 s['followup_change']='unchanged'; s['prior_inventory_id']=s['inventory_id']
 for o in s['observations']: o['research_stage']='prior'
nextid=max(int(s['inventory_id'][1:]) for s in inv)+1
for o in sorted(obs,key=lambda s:(norm(s['url']),s['source_key'])):
 u=norm(o['url']); u=aliases.get(u,u)
 if u in byurl:
  s=byurl[u]
  if s.get('prior_inventory_id'): s['followup_change']='enriched-or-corrected'
 else:
  s={'inventory_id':f'R{nextid:03d}','title':o['title'],'url':o['url'],'normalized_url':u,'source_keys':[],'areas':[],'existing_record_ids':[],'observations':[],'followup_change':'addition','prior_inventory_id':None};nextid+=1; inv.append(s);byurl[u]=s
 s['observations'].append(o);s['source_keys']=sorted(set(s['source_keys']+[o['source_key']]))
 s['areas']=sorted(set(s['areas']+o['areas']));s['existing_record_ids']=sorted(set(s['existing_record_ids']+o['existing_record_ids']+corpusurls.get(u,[])))
 s['recommended_disposition']='enrich' if s['existing_record_ids'] else ('discovery-only' if all(x['verification_status'] in {'restricted-access','discovery-only'} or x.get('corpus_disposition') == 'discovery-only' for x in s['observations']) else 'add')
lookup={k:s['inventory_id'] for s in inv for k in s['source_keys']}
ledger=[]
if len({u['question_id'] for u in updates})!=len(updates): errors.append('Duplicate gap update')
for u in updates:
 q=qbase.get(u['question_id'])
 if not q: continue
 if u.get('after_status') not in STATUSES: errors.append(f'{u["question_id"]}: invalid status')
 for k in u.get('new_source_keys',[]):
  if k not in newkeys: errors.append(f'{u["question_id"]}: missing new source {k}')
  elif q['area'] not in newkeys[k]['areas']: errors.append(f'{u["question_id"]}: source area mismatch {k}')
 if u.get('after_status')!=q['before_status'] and not u.get('evidence_delta'): errors.append(f'{u["question_id"]}: unsupported status change')
 if q['before_status']!='supported' and u.get('after_status')=='supported' and not any(newkeys.get(k,{}).get('verification_status') in {'substantive-read','partial-read'} for k in u.get('new_source_keys',[])): errors.append(f'{u["question_id"]}: closure lacks inspected evidence')
 ledger.append(dict(q,**u,inventory_ids=sorted({lookup[k] for k in q['prior_source_keys']+u.get('new_source_keys',[]) if k in lookup})))
for a in areas:
 for q in a.get('questions',[]):
  for k in q.get('source_keys',[]):
   if k not in lookup: errors.append(f'area{a["number"]}: missing source key {k}')
  q['inventory_ids']=sorted({lookup[k] for k in q.get('source_keys',[]) if k in lookup})
checks=read(ROOT/'baseline-check.json')
for f,h in {**checks['current_input_sha256'],**checks['prior_package_sha256'],**checks.get('protected_repository_sha256',{})}.items():
 if hashlib.sha256((REPO/f).read_bytes()).hexdigest()!=h: errors.append(f'Protected input changed: {f}')
titles=collections.defaultdict(list)
for s in inv: titles[re.sub(r'[^a-z0-9]','',s['title'].lower())].append(s['inventory_id'])
report={'areas':len(areas),'gap_rows':len(ledger),'prior_sources':len(prior),'cumulative_sources':len(inv),'new_source_observations':len(obs),'source_changes':dict(collections.Counter(s['followup_change'] for s in inv)),'new_read_statuses':dict(collections.Counter(s['verification_status'] for s in obs)),'before_statuses':dict(collections.Counter(q['before_status'] for q in ledger)),'after_statuses':dict(collections.Counter(q['after_status'] for q in ledger)),'dispositions':dict(collections.Counter(q.get('disposition') for q in ledger)),'same_title_candidates':[v for v in titles.values() if len(v)>1],'protected_inputs_unchanged':not any(e.startswith('Protected input') for e in errors),'warnings':warnings,'errors':errors}
write('source-inventory.json',inv);write('coverage-matrix.json',sorted(areas,key=lambda a:a['number']));write('gap-ledger.json',sorted(ledger,key=lambda q:q['question_id']));write('validation.json',report)
lines=['# Cumulative source inventory','','Prior R001-R100 identities are retained. Follow-up observations preserve edition, access, rights and authority limits separately. An addition here is a research reference, not a canonical library addition. See [structured inventory](source-inventory.json).','','| ID | Source | Areas | Change | Existing corpus IDs |','|---|---|---|---|---|']
for s in inv: lines.append(f"| {s['inventory_id']} | [{cell(s['title'])}]({s['url']}) | {cell(s['areas'])} | {s['followup_change']} | {', '.join(s['existing_record_ids']) or 'None identified'} |")
(ROOT/'SOURCE-INVENTORY.md').write_text('\n'.join(lines)+'\n')
lines=['# Question-level gap ledger','','Statuses apply to bounded general questions, not full specialty sufficiency or entity application. Prior and new evidence are linked in [gap-ledger.json](gap-ledger.json).','','| ID | Question | Before | After | Disposition | New evidence / remaining gap |','|---|---|---|---|---|---|']
for q in sorted(ledger,key=lambda q:q['question_id']): lines.append(f"| {q['question_id']} | {cell(q['question'])} | {q['before_status']} | {q['after_status']} | {q.get('disposition')} | {cell(q.get('evidence_delta',''))} Remaining: {cell(q.get('remaining_gap',''))} |")
(ROOT/'GAP-LEDGER.md').write_text('\n'.join(lines)+'\n')
print(json.dumps(report,indent=2))
if errors: raise SystemExit(1)
