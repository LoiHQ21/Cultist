import json,hashlib
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'public/assets/manifest.json').read_text());plan=json.loads((root/'assets-source/asset-plan.json').read_text())
images={a['id']:a for a in m['assets'] if a['kind']=='image'}
assert len(images)==42
for p in plan['images']:
 a=images[p['id']];path=root/('public'+a['path']);assert path.is_file(),a['id']
 im=Image.open(path);assert im.size==(a['width'],a['height'])
 if p['alpha_required']:assert im.mode=='RGBA' and im.getchannel('A').getextrema()[0]==0,a['id']+' missing genuine alpha'
 assert (root/a['sourcePath']).stat().st_size>10000
 assert (root/a['promptPath']).is_file()
for a in m['assets']:
 if a['kind']=='audio':assert (root/('public'+a['path'])).is_file()
image_bytes=sum(a['bytes'] for a in images.values())
audio_bytes=sum((root/('public'+a['path'])).stat().st_size for a in m['assets'] if a['kind']=='audio')
print(json.dumps({'images':len(images),'audio':len([a for a in m['assets'] if a['kind']=='audio']),'image_bytes':image_bytes,'audio_bytes':audio_bytes,'content_sha256':hashlib.sha256((root/'content/game.json').read_bytes()).hexdigest()},indent=2))
