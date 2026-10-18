"""Prepare the eight authorized Higgsfield results for local game playback."""
import json, os, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'node_modules/media-tools'))
import imageio_ffmpeg
from PIL import Image,ImageDraw
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
source=ROOT/'files/videos/story-source-20261018'
review=ROOT/'docs/reviews/story-video-frames'
target=ROOT/'assets/videos/story'
review.mkdir(parents=True,exist_ok=True);target.mkdir(parents=True,exist_ok=True)
durations={'intro':[5,4,8,7],'outro':[4,6,6,8]}
def run(args):
    subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y',*args],check=True)
report=[]
for kind,lengths in durations.items():
    sheet=Image.new('RGB',(1280,4*204),'#13231d');draw=ImageDraw.Draw(sheet)
    clips=[]
    for i,seconds in enumerate(lengths,1):
        name=f'{kind}-0{i}';original=source/(name+'.mp4');encoded=source/(name+'-web.mp4')
        for col,at in enumerate([0,seconds*.35,seconds*.7,seconds-.2]):
            frame=review/f'{name}-{col}.jpg'
            run(['-threads','1','-ss',str(at),'-i',str(original),'-frames:v','1','-vf','scale=320:180','-threads','1',str(frame)])
            sheet.paste(Image.open(frame),(col*320,(i-1)*204+24));draw.text((col*320+6,(i-1)*204+5),f'{name} {at:.1f}s',fill='white')
        run(['-threads','1','-i',str(original),'-t',str(seconds),'-vf','fps=24,setsar=1','-an','-c:v','libx264','-preset','medium','-crf','22','-pix_fmt','yuv420p','-threads','2','-movflags','+faststart',str(encoded)])
        clips.append(encoded)
        print(f'Prepared {name}',flush=True)
    sheet.save(review/f'{kind}-contact.jpg',quality=90)
    manifest=source/f'{kind}-concat.txt';manifest.write_text(''.join("file '"+str(p).replace('\\','/')+"'\n" for p in clips),encoding='utf-8')
    output=target/f'{kind}.mp4'
    run(['-f','concat','-safe','0','-i',str(manifest),'-c','copy','-movflags','+faststart',str(output)])
    reader=imageio_ffmpeg.read_frames(str(output));meta=next(reader);reader.close()
    report.append({'file':str(output.relative_to(ROOT)).replace('\\','/'),'bytes':output.stat().st_size,**meta})
    print(f'{kind}: {meta["duration"]}s, {output.stat().st_size/1024/1024:.2f}MiB',flush=True)
(ROOT/'docs/STORY-VIDEO-ENCODE-20261018.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
