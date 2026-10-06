"""Optional local Git route. ZIP itself never contains dot-prefixed paths."""
from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
target=root/'.github/workflows/update-and-deploy.yml'
if target.exists():
    raise SystemExit('Workflow already exists; compare manually rather than overwrite.')
target.parent.mkdir(parents=True,exist_ok=True)
shutil.copyfile(root/'automation/update-and-deploy.yml',target)
print('Created '+str(target))
print('Use git add / commit / push, not browser drag-and-drop, to upload this generated workflow.')
