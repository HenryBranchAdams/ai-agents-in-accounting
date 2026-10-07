"""Reconcile research packages without changing the canonical corpus."""
from pathlib import Path
import json, hashlib, collections, urllib.parse, re, os
ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
GROUPS = {'capital-property': {1,2,8,9}, 'specialist-reporting': {3,4,5,6}, 'cost-contracts-associations': {7,10,11,12}, 'operating-verticals': {13,14,15}}
REQUIRED = {'source_key','title','publisher','url','publication_date_or_edition','jurisdictions','entity_roles','accounting_bases','source_classification','areas','questions','inspected_summary','locators','verification_status','access_limits','effective_dates_and_supersession','rights','corpus_disposition','existing_record_ids','retrieved_at','evidence'}
VALID_STATUS = {'substantive-read','partial-read','discovery-only','restricted-access'}
VALID_DISPOSITION = {'reuse','enrich','add','discovery-only'}
def norm(url):
    u=urllib.parse.urlsplit(url)
    query=urllib.parse.urlencode([(k,v) for k,v in urllib.parse.parse_qsl(u.query) if not k.startswith('utm_')])
    return urllib.parse.urlunsplit((u.scheme.lower(),u.netloc.lower().removeprefix('www.'),u.path.rstrip('/'),query,''))
def write(name,data):
    (ROOT/name).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
def cell(value):
    return str(value).replace('|','/').replace('\n',' ')
corpus=json.loads((REPO/'data/corpus/source.json').read_text())
all_ids={x['id'] for p in (REPO/'data/corpus').glob('*.json') for x in json.loads(p.read_text())}
all_ids.update(x['id'] for x in json.loads((REPO/'data/coverage/research-questions.json').read_text())['questions'])
all_ids.update(x['id'] for x in json.loads((REPO/'data/coverage/assessments.json').read_text())['assessments'])
source_ids={x['id'] for x in corpus}
by_url=collections.defaultdict(list)
for x in corpus:
    if x.get('source_url'): by_url[norm(x['source_url'])].append(x['id'])
errors=[]; observations=[]; areas=[]; keys={}
for group, expected in GROUPS.items():
    sp=ROOT/group/'sources.json'; ap=ROOT/group/'areas.json'
    if not sp.exists() or not ap.exists():
        errors.append(f'{group}: package incomplete'); continue
    ss=json.loads(sp.read_text()); aa=json.loads(ap.read_text())
    if {a['number'] for a in aa} != expected: errors.append(f'{group}: assigned area mismatch')
    for s in ss:
        key=s.get('source_key','MISSING')
        missing=REQUIRED-set(s)
        if missing: errors.append(f'{key}: missing fields {sorted(missing)}')
        if key in keys: errors.append(f'{key}: duplicate key')
        keys[key]=s
        if s.get('verification_status') not in VALID_STATUS: errors.append(f'{key}: invalid verification status')
        if s.get('corpus_disposition') not in VALID_DISPOSITION: errors.append(f'{key}: invalid disposition')
        if not set(s.get('areas',[]))<=expected: errors.append(f'{key}: area outside ownership')
        if not set(s.get('existing_record_ids',[]))<=source_ids: errors.append(f'{key}: invalid existing source ID')
        if s.get('verification_status') in {'substantive-read','partial-read'} and (not s.get('locators') or not s.get('evidence')): errors.append(f'{key}: read lacks locators/evidence')
        s=dict(s,group=group)
        observations.append(s)
    for a in aa:
        if not set(a.get('existing_record_ids',[]))<=all_ids: errors.append(f"area {a['number']}: invalid existing record ID")
        if not (ROOT/group/a['brief']).is_file(): errors.append(f"area {a['number']}: missing brief")
        else:
            brief_text=(ROOT/group/a['brief']).read_text()
            for ref in set(re.findall(r'`((?:src_|guide-|rq-|wf-|example-|coverage-)[\w-]+)`',brief_text)):
                if ref not in all_ids: errors.append(f"area {a['number']}: invalid brief corpus ID {ref}")
            prefix=os.path.commonprefix([s['source_key'] for s in ss])
            if prefix:
                for ref in set(re.findall(re.escape(prefix)+r'[A-Za-z0-9_-]+',brief_text)):
                    if ref not in {s['source_key'] for s in ss}: errors.append(f"area {a['number']}: stale brief source key {ref}")
            if not re.search(r'https?://',brief_text): errors.append(f"area {a['number']}: brief lacks original-source links")
        if not a.get('questions'): errors.append(f"area {a['number']}: no question matrix")
        for q in a.get('questions',[]):
            if q.get('status') not in {'supported','partial','unresolved'}: errors.append(f"area {a['number']}: invalid question status")
            for key in q.get('source_keys',[]):
                if key not in {s['source_key'] for s in ss}: errors.append(f"area {a['number']}: unresolved source key {key}")
                elif a['number'] not in keys[key]['areas']: errors.append(f"area {a['number']}: source {key} lacks area linkage")
            if q.get('status')=='supported' and not q.get('source_keys'): errors.append(f"area {a['number']}: supported question lacks source")
            if q.get('status')=='supported' and q.get('source_keys') and all(keys.get(k,{}).get('verification_status') in {'discovery-only','restricted-access'} for k in q['source_keys']): errors.append(f"area {a['number']}: supported claim has no inspected source")
        areas.append(dict(a,group=group,brief=f"{group}/{a['brief']}"))
# Shared source identity is exact normalized URL. Retain all observations, editions,
# authority classifications, access scopes and rights statements without silent union.
buckets=collections.defaultdict(list)
for s in observations: buckets[norm(s['url'])].append(s)
inventory=[]
for i,(url,ss) in enumerate(sorted(buckets.items()),1):
    observed_ids=sorted({i for s in ss for i in s.get('existing_record_ids',[])})
    exact_ids=by_url.get(url,[])
    disposition='enrich' if (observed_ids or exact_ids) else ('discovery-only' if all(s['verification_status'] in {'discovery-only','restricted-access'} for s in ss) else 'add')
    inventory.append({'inventory_id':f'R{i:03d}','title':ss[0]['title'],'url':ss[0]['url'],'normalized_url':url,'source_keys':[s['source_key'] for s in ss],'areas':sorted({a for s in ss for a in s['areas']}),'existing_record_ids':sorted(set(observed_ids+exact_ids)),'recommended_disposition':disposition,'observations':ss})
lookup={k:s['inventory_id'] for s in inventory for k in s['source_keys']}
for a in areas:
    for q in a.get('questions',[]): q['inventory_ids']=sorted({lookup[k] for k in q.get('source_keys',[]) if k in lookup})
# Same-title records on different URLs require human identity/edition reconciliation.
titles=collections.defaultdict(list)
for s in inventory: titles[re.sub(r'[^a-z0-9]','',s['title'].lower())].append(s['inventory_id'])
title_candidates=[ids for ids in titles.values() if len(ids)>1]
baseline=json.loads((ROOT/'baseline.json').read_text())
for name,expected_hash in baseline['input_sha256'].items():
    if hashlib.sha256((REPO/name).read_bytes()).hexdigest()!=expected_hash: errors.append(f'Canonical input changed: {name}')
areas.sort(key=lambda a:a['number'])
write('source-inventory.json',inventory); write('coverage-matrix.json',areas)
report={'area_count':len(areas),'source_observations':len(observations),'unique_normalized_source_urls':len(inventory),'shared_sources':[s['inventory_id'] for s in inventory if len(s['observations'])>1],'same_title_identity_candidates':title_candidates,'verification_counts':dict(collections.Counter(s['verification_status'] for s in observations)),'question_status_counts':dict(collections.Counter(q['status'] for a in areas for q in a.get('questions',[]))),'canonical_input_hashes_unchanged':not any(e.startswith('Canonical input changed:') for e in errors),'errors':errors}
write('validation.json',report)
lines=['# Source inventory','','One row per normalized original URL. Source observations, edition and access limits remain in [source-inventory.json](source-inventory.json). Same title is not automatically the same edition. Recommendations do not add records to the corpus.','','| ID | Source | Areas | Existing source IDs | Disposition | Read scope |','|---|---|---|---|---|---|']
for s in inventory:
    statuses=', '.join(sorted({o['verification_status'] for o in s['observations']}))
    lines.append(f"| {s['inventory_id']} | [{cell(s['title'])}]({s['url']}) | {', '.join(map(str,s['areas']))} | {', '.join(s['existing_record_ids']) or 'None identified'} | {s['recommended_disposition']} | {statuses} |")
(ROOT/'SOURCE-INVENTORY.md').write_text('\n'.join(lines)+'\n')
print(json.dumps(report,indent=2))
if errors: raise SystemExit(1)
