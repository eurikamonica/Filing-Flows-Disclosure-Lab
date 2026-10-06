import argparse
import json
from pathlib import Path
from core import Client, read_json, now, publish, refresh_module, collect_cot, collect_banks, collect_npx, write_json, VERSION

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser(description='Collect official public disclosures; demo never substitutes for real data')
    parser.add_argument('--only',choices=['all','cot','banks','npx'],default='all')
    parser.add_argument('--config',type=Path,default=ROOT/'config/settings.json')
    parser.add_argument('--output',type=Path,default=ROOT/'docs/data')
    parser.add_argument('--storage',type=Path,default=ROOT/'storage')
    parser.add_argument('--revalidate',action='store_true',help='Re-download already parsed N-PX documents')
    args = parser.parse_args()
    cfg = read_json(args.config,{})
    data = read_json(args.output/'live.json', {'version':VERSION,'mode':'official','modules':{}})
    data['version'] = VERSION
    client = Client(args.storage,cfg.get('http',{}))
    failed = False
    for key,func in [('cot',collect_cot),('banks',collect_banks),('npx',collect_npx)]:
        if args.only not in ('all',key):
            continue
        print('Collecting '+key,flush=True)
        result = refresh_module(data['modules'].get(key,{}),func,client,cfg[key],args.revalidate)
        data['modules'][key] = result
        failed |= result['status'] != 'ok'
        print(key+': '+result['status']+((' — '+result['error']) if result.get('error') else ''),flush=True)
        data['generated_at'] = now()
        publish(args.output,data)
    write_json(args.storage/'last-run-manifest.json',client.manifest)
    if failed:
        print('One or more sources failed/partial. Previous valid data retained; inspect source status.')
    return 1 if failed else 0

if __name__ == '__main__':
    raise SystemExit(main())
