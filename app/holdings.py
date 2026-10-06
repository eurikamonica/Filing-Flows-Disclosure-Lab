"""13F adapter, retaining parsed filings in the published snapshot for durable reuse."""
from core import now
from holdings13f.build import filing_list, load_filing
from holdings13f.core import resolve, compare

class SECAdapter:
    def __init__(self, client): self.client=client
    def get(self,url,immutable=False): return self.client.get(url,sec=True)
    def json(self,url,immutable=False): return self.client.json(url,sec=True)

def collect_holdings(client,cfg,old,revalidate=False):
    adapter=SECAdapter(client)
    old_managers={str(int(m['cik'])):m for m in old.get('managers',[])}
    managers,errors=[],[]
    for item in cfg['managers']:
        cik=str(int(item['cik']))
        cached=old_managers.get(cik,{})
        # Refuse to mix a previous as-of/range build with another request.
        if cached.get('since') != cfg['since'] or cached.get('as_of') != cfg.get('as_of'):
            cached={}
        try:
            name,metas=filing_list(adapter,cik,cfg['since'])
            prior={f['accession']:f for f in cached.get('filings',[])}
            filings,notices=[],[]
            for meta in metas:
                if cfg.get('as_of') and meta['filed']>cfg['as_of']:continue
                if meta['form'].startswith('13F-NT'):
                    notices.append(meta);continue
                filing=prior.get(meta['accession']) if not revalidate else None
                if filing is None:filing=load_filing(adapter,meta)
                filings.append(filing)
            snapshots=resolve(filings,cfg.get('as_of'))
            for i,s in enumerate(snapshots):
                s['changes']=compare(snapshots[i-1],s) if i else []
                s['baseline_period']=snapshots[i-1]['period'] if i else None
            managers.append({'cik':cik,'name':name,'label':item.get('name',name),'since':cfg['since'],
                             'as_of':cfg.get('as_of'),'filings':filings,'snapshots':snapshots,
                             'notices':notices,'last_success':now(),'stale':False})
        except Exception as exc:
            errors.append({'cik':cik,'error':str(exc)})
            if cached:managers.append({**cached,'stale':True})
    return {'managers':managers,'errors':errors,'status':'partial' if errors else 'ok',
            'coverage':'Configured managers only; public 13F positions, not real-time portfolios. XML-era history only.'}
