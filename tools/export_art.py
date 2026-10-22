"""Convert generated originals to browser WebP; no drawing, cropping or visual edits."""
import json,shutil
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
log=json.loads((root/'assets-source/generation-log.json').read_text())
plan=json.loads((root/'assets-source/asset-plan.json').read_text())
assets=[]
for role in plan['images']:
    id=role['id']
    if id not in log: continue
    rec=log[id]; source=root/f'assets-source/images/{id}.png'; source.parent.mkdir(exist_ok=True,parents=True)
    if (root/rec['source']).resolve()!=source.resolve(): shutil.copyfile(root/rec['source'],source)
    prompt=root/f'assets-source/prompts/{id}.md'
    prompt.write_text(rec['prompt']+'\n\nReferences:\n'+'\n'.join(rec.get('referenced_image_paths',[])))
    im=Image.open(source); original=im.size
    size=1536 if id.startswith(('bg_','awakening_','ending_')) else 800 if id.startswith('statue_') else 640 if role['path'].split('/')[2] in ['characters','ui'] else 640 if id=='fg_altar' else 320
    im.thumbnail((size,size),Image.Resampling.LANCZOS)
    dest=root/('public'+role['path']);dest.parent.mkdir(parents=True,exist_ok=True)
    im.save(dest,'WEBP',quality=85,method=6)
    alpha=im.mode=='RGBA' and im.getchannel('A').getextrema()[0]<255
    anchor={'mouth':{'x':.58 if id=='statue_possessive' else .59,'y':.46 if id=='statue_possessive' else .47}} if id.startswith('statue_') else {}
    assets.append({'id':id,'kind':'image','path':role['path'],'sourcePath':str(source.relative_to(root)),'promptPath':str(prompt.relative_to(root)),'references':rec.get('referenced_image_paths',[]),'width':im.width,'height':im.height,'originalDimensions':list(original),'alpha':alpha,'pivot':{'x':.5,'y':.97},'anchors':anchor,'generationMethod':'image-generation-tool','status':rec.get('status','pending-visual-review'),'bytes':dest.stat().st_size})
out=root/'public/assets/manifest.json'
existing=json.loads(out.read_text()) if out.exists() else {'assets':[]}
assets += [a for a in existing['assets'] if a['kind']!='image']
out.write_text(json.dumps({'version':'1.0.0','assets':assets},indent=2))
print(f'Exported {len(log)} image assets')
