"""Validate and reconcile the local family-office research package only."""
from pathlib import Path
import json,collections,hashlib,urllib.parse,re
ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[2]
GROUPS={'trust-estate':{'FO-T1','FO-T2','FO-T3'},'reporting-investments':{'FO-R1','FO-R2','FO-R3'},'office-philanthropy':{'FO-O1','FO-O2','FO-O3'},'loans-transfers':{'FO-L1','FO-L2'}}
FIELDS=set('source_key title publisher url publication_date_or_edition jurisdictions entity_roles accounting_bases source_classification questions inspected_summary locators verification_status evidence access_limits effective_dates_and_supersession rights corpus_disposition existing_record_ids prior_inventory_ids retrieved_at'.split())
def read(p):return json.loads(p.read_text())
def save(name,x):(ROOT/name).write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
def norm(u):
 p=urllib.parse.urlsplit(u)
 return urllib.parse.urlunsplit((p.scheme.lower(),p.netloc.lower().removeprefix('www.'),p.path.rstrip('/'),urllib.parse.urlencode([(k,v) for k,v in urllib.parse.parse_qsl(p.query) if not k.startswith('utm_')]),''))
def cell(v):return str(v).replace('|','/').replace('\n',' ')
corpus=read(REPO/'data/corpus/source.json');ids={x['id'] for x in corpus};byurl=collections.defaultdict(list)
for x in corpus:
 if x.get('source_url'):byurl[norm(x['source_url'])].append(x['id'])
prior=read(ROOT.parent/'2026-09-23-accounting-specialties-followup/source-inventory.json');priorids={x['inventory_id'] for x in prior};priorbyurl=collections.defaultdict(list)
for x in prior:priorbyurl[norm(x['url'])].append(x['inventory_id'])
baseline=read(ROOT/'baseline.json');qids={x['id'] for x in read(REPO/'data/coverage/research-questions.json')['questions']}
errors=[];warnings=[];sources=[];questions=[]
for group,expected in GROUPS.items():
 ss=read(ROOT/group/'sources.json');qq=read(ROOT/group/'questions.json')
 if {q['question_id'] for q in qq}!=expected:errors.append(group+': question IDs mismatch')
 for s in ss:sources.append(dict(s,group=group))
 for q in qq:questions.append(dict(q,group=group,brief=group+'/brief.md'))
keys={s['source_key'] for s in sources}
if len(keys)!=len(sources):errors.append('Duplicate source keys')
for s in sources:
 k=s['source_key']
 s['research_stage']='reused-prior-observation' if not s['retrieved_at'].startswith('2026-09-24') else 'follow-up-investigation'
 if FIELDS-set(s):errors.append(k+': missing fields '+str(FIELDS-set(s)))
 if not set(s['existing_record_ids'])<=ids:errors.append(k+': invalid existing IDs')
 if not set(s['prior_inventory_ids'])<=priorids:errors.append(k+': invalid prior IDs')
 if s['verification_status'] not in {'substantive-read','partial-read','discovery-only','restricted-access'}:errors.append(k+': verification enum')
 if not s['locators'] or not s['evidence']:warnings.append(k+': no evidence/locators')
 if set(s['questions'])-{q['question_id'] for q in questions}:errors.append(k+': question reference')
 s['existing_record_ids']=sorted(set(s['existing_record_ids']+byurl.get(norm(s['url']),[])))
 s['prior_inventory_ids']=sorted(set(s['prior_inventory_ids']+priorbyurl.get(norm(s['url']),[])))
for q in questions:
 if set(q['source_keys'])-keys:errors.append(q['question_id']+': unresolved source keys '+str(set(q['source_keys'])-keys))
 if set(q['existing_question_ids'])-qids:errors.append(q['question_id']+': existing question IDs')
 if q['disposition'] not in {'deepened','new-supported','partial','deferred'}:errors.append(q['question_id']+': disposition enum')
 if set(q['dependency_types'])-{'research','current-authority','entity-facts','rights'}:errors.append(q['question_id']+': dependency enum')
 if q['disposition']=='new-supported' and not any(s['source_key'] in q['source_keys'] and s['verification_status'] in {'substantive-read','partial-read'} for s in sources):errors.append(q['question_id']+': new support lacks read')
# Baseline direct sources are retained, not falsely relabeled as current rereads.
inv={}
for s in baseline['direct_sources']:
 u=norm(s['source_url']);inv[u]=dict(title=s['title'],url=s['source_url'],existing_record_ids=[s['id']],prior_inventory_ids=priorbyurl.get(u,[]),source_keys=[],questions=[],observations=[],baseline_record=s,change='retained-baseline')
for s in sources:
 u=norm(s['url'])
 if u not in inv:inv[u]=dict(title=s['title'],url=s['url'],existing_record_ids=[],prior_inventory_ids=[],source_keys=[],questions=[],observations=[],change='new-research-reference')
 x=inv[u];x['observations'].append(s);x['source_keys'].append(s['source_key']);x['questions']=sorted(set(x['questions']+s['questions']));x['existing_record_ids']=sorted(set(x['existing_record_ids']+s['existing_record_ids']));x['prior_inventory_ids']=sorted(set(x['prior_inventory_ids']+s['prior_inventory_ids']))
 if x['existing_record_ids']:x['change']='existing-corpus-source-enrichment'
 elif x['prior_inventory_ids']:x['change']='reuse-prior-research'
# Include explicitly reused prior references even when no new URL read was necessary.
for pid in sorted({i for s in sources for i in s['prior_inventory_ids']}):
 p=next(x for x in prior if x['inventory_id']==pid);u=norm(p['url'])
 if u not in inv:inv[u]=dict(title=p['title'],url=p['url'],existing_record_ids=p['existing_record_ids'],prior_inventory_ids=[pid],source_keys=[],questions=[],observations=[],prior_reference=p,change='retained-prior-reference')
records=[];lookup={}
for i,(u,s) in enumerate(sorted(inv.items()),1):
 s['inventory_id']=f'FO-S{i:03}';s['normalized_url']=u
 s['intake_status']='retained-prior-only' if not s['observations'] else ('lead-only' if all(o['corpus_disposition']=='discovery-only' or o['verification_status'] in {'discovery-only','restricted-access'} for o in s['observations']) else 'scoped-metadata-review-candidate')
 records.append(s)
 for k in s['source_keys']:lookup[k]=s['inventory_id']
for q in questions:q['inventory_ids']=sorted({lookup[k] for k in q['source_keys'] if k in lookup})
for p in ROOT.rglob('*.md'):
 for target in re.findall(r'\]\(([^)]+)\)',p.read_text()):
  if not target.startswith(('http','mailto:','#')) and not (p.parent/target.split('#')[0]).exists():errors.append(f'{p.name}: missing local link {target}')
protected=read(ROOT/'protected-hashes.json')
for p,h in protected.items():
 if hashlib.sha256((REPO/p).read_bytes()).hexdigest()!=h:errors.append('Protected input changed: '+p)
report=dict(question_count=len(questions),source_observations=len(sources),source_identities=len(records),research_stages=dict(collections.Counter(s['research_stage'] for s in sources)),followup_verification_statuses=dict(collections.Counter(s['verification_status'] for s in sources if s['research_stage']=='follow-up-investigation')),source_changes=dict(collections.Counter(s['change'] for s in records)),verification_statuses=dict(collections.Counter(s['verification_status'] for s in sources)),question_dispositions=dict(collections.Counter(q['disposition'] for q in questions)),future_specialty_questions=len(read(ROOT/'deferred-specialty-gaps.json')),protected_file_count=len(protected),protected_inputs_unchanged=not any(e.startswith('Protected input') for e in errors),errors=errors,warnings=warnings)
save('source-inventory.json',records);save('question-ledger.json',sorted(questions,key=lambda q:q['question_id']));save('validation.json',report)
lines=['# Family-office source inventory','','This focused inventory retains the ten direct baseline sources and links new or enriched observations to canonical IDs and the prior specialty inventory. Retained sources are not claimed reread. Candidate means metadata/editorial review, not permission to copy full text or a canonical addition. See [full evidence](source-inventory.json).','','| ID | Source | Change | Canonical IDs | Prior specialty IDs | Intake |','|---|---|---|---|---|---|']
for s in records:lines.append(f"| {s['inventory_id']} | [{cell(s['title'])}]({s['url']}) | {s['change']} | {', '.join(s['existing_record_ids']) or 'None identified'} | {', '.join(s['prior_inventory_ids']) or 'None'} | {s['intake_status']} |")
(ROOT/'SOURCE-INVENTORY.md').write_text('\n'.join(lines)+'\n')
lines=['# Family-office question ledger','','These are bounded research dispositions, not changes to canonical coverage assessments. All six existing family-office questions remain assessed partial in the library.','','| Question | Prior treatment | Research result | Status | Remaining dependencies |','|---|---|---|---|---|']
for q in sorted(questions,key=lambda q:q['question_id']):lines.append(f"| [{q['question_id']}: {cell(q['question'])}]({q['brief']}) | {cell(q['prior_coverage'])} | {cell(q['new_finding'])} | {q['disposition']} | {cell('; '.join(q['remaining_gaps']))} |")
(ROOT/'QUESTION-LEDGER.md').write_text('\n'.join(lines)+'\n')
print(json.dumps(report,indent=2))
if errors:raise SystemExit(1)
