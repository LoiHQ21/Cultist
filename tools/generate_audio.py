"""Original deterministic procedural score and foley. No samples or external music.
Seed 7031; soft pentatonic wooden/plucked tones, 64 BPM, periodic envelopes.
WAV source preserved. Ogg Vorbis runtime encoded with ffmpeg.
"""
import math,random,wave,struct,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SR=22050
src=ROOT/'assets-source/audio';dest=ROOT/'public/assets/audio'
src.mkdir(parents=True,exist_ok=True);dest.mkdir(parents=True,exist_ok=True)
rng=random.Random(7031)
def blank(d):return [0.0]*int(d*SR)
def tone(buf,at,f,d,amp=.1,decay=3,pluck=False):
    for j in range(int(d*SR)):
        t=j/SR;env=min(1,t/.012)*math.exp(-decay*t)*min(1,max(0,(d-t)/.08))
        v=math.sin(2*math.pi*f*t)
        if pluck:v+=.22*math.sin(2*math.pi*f*2.01*t)*math.exp(-t*4)+.1*math.sin(2*math.pi*f*3.98*t)*math.exp(-t*7)
        buf[(int(at*SR)+j)%len(buf)]+=v*env*amp

def noise(buf,d,amp=.1,decay=7,at=0):
    smooth=0
    for j in range(int(d*SR)):
        t=j/SR;smooth=.83*smooth+.17*rng.uniform(-1,1)
        buf[(int(at*SR)+j)%len(buf)]+=smooth*amp*min(1,t/.015)*math.exp(-decay*t)*min(1,(d-t)/.04)

def score(kind):
    d=60;b=blank(d);notes=[146.832,195.998,220,261.626,293.665,391.995]
    # 64 BPM, four 16-beat phrases = 60 seconds. Notes wrap their tails across the loop boundary.
    for phrase in range(4):
        for beat,n in [(0,0),(3,2),(7,4),(11,3),(14,1)]:
            f=notes[(n+phrase)%len(notes)]
            tone(b,phrase*15+beat*.9375,f,5,.055,1.3,True)
    for j in range(len(b)):
        t=j/SR
        drone=(math.sin(2*math.pi*73*t)+.35*math.sin(2*math.pi*110*t))*.018
        b[j]+=drone*(.75+.25*math.cos(2*math.pi*t/60))
    if kind=='awakening':
        for at in range(0,60,15):tone(b,at,55,12,.045,.24);tone(b,at+7,155.563,7,.018,.35)
    if kind in ['ending','ending_cold']:
        for at in range(0,60,15):tone(b,at,196 if kind=='ending' else 146.832,9,.04,.4);tone(b,at+.3,293.665 if kind=='ending' else 207.652,9,.028,.4)
    return b
specs={'ui_pick':.08,'ui_place':.12,'page_turn':.28,'ritual_bell':1.6,'stone_breath':.8,'offering_take':.5,'miracle_mercy':1.2,'miracle_dominion':1.2,'remnant_reveal':.45,'day_turn':.65,'awakening':2.6,'ending_warm':2.2,'ending_cold':2.2}
allbuf={k+'_loop':score(k) for k in ['shrine','awakening','ending','ending_cold']}
for id,d in specs.items():
    b=blank(d)
    if id=='ritual_bell':
        for f,a,dec in [(440,.1,2.1),(653,.045,3),(1139,.03,4),(1553,.015,6)]:tone(b,0,f,d,a,dec)
    elif id in ['ui_pick','ui_place']:
        noise(b,d,.22,25);tone(b,0,480 if id=='ui_pick' else 290,d,.05,35)
    elif id=='page_turn':noise(b,d,.35,10)
    elif id=='stone_breath':noise(b,d,.3,2);tone(b,0,69,d,.07,3)
    elif id=='offering_take':noise(b,d,.22,7);tone(b,.26,80,.22,.06,14)
    elif id=='miracle_mercy':tone(b,0,392,d,.07,3,True);tone(b,.22,587,.9,.06,3,True)
    elif id=='miracle_dominion':
        for f in [73,147,155]:tone(b,0,f,d,.04,2)
    elif id=='remnant_reveal':noise(b,d,.08,9);tone(b,0,784,d,.07,8,True)
    elif id=='day_turn':tone(b,0,880,.3,.035,9);tone(b,.28,740,.35,.03,7)
    elif id=='awakening':
        for f in [55,82.5,111,440]:tone(b,0,f,d,.04,.8)
    else:
        for f in ([196,293.665,392] if id=='ending_warm' else [146.832,207.652,293.665]):tone(b,0,f,d,.045,1.4,True)
    allbuf[id]=b
entries=[]
for id,b in allbuf.items():
    peak=max(abs(v) for v in b);gain=min(1,.42/peak)
    wav=src/(id+'.wav')
    with wave.open(str(wav),'wb') as w:
        w.setparams((1,2,SR,0,'NONE','not compressed'));w.writeframes(struct.pack('<'+'h'*len(b),*(int(v*gain*32767) for v in b)))
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-c:a','libvorbis','-q:a','4',str(dest/(id+'.ogg'))],check=True)
    entries.append({'id':id,'kind':'audio','path':f'/assets/audio/{id}.ogg','sourcePath':f'assets-source/audio/{id}.wav','generator':'tools/generate_audio.py','generationMethod':'deterministic-procedural-synthesis','seed':7031,'duration':len(b)/SR,'format':'ogg-vorbis','sampleRate':SR,'loop':id.endswith('_loop'),'peak':round(peak*gain,4),'status':'accepted'})
manifest=ROOT/'public/assets/manifest.json';data=json.loads(manifest.read_text());data['assets']=[a for a in data['assets'] if a['kind']!='audio']+entries;manifest.write_text(json.dumps(data,indent=2))
print(f'Generated {len(entries)} original audio assets; peak <= 0.42')
