"""Scan rendered chunks for sporadic renderer tile dropouts (large pure-black blocks).
Prints scene id and frame numbers whose count of near-black pixels jumps far above its neighbours."""
import subprocess, sys
import numpy as np
scenes = sys.argv[1:] or ['S01','S02','S03','S04','S05','S06','S07','S08','S09','S10']
bad = {}
for ch in scenes:
    r = subprocess.run(['ffmpeg','-v','error','-i',f'output/work/chunk_{ch}.mp4','-vf','scale=270:480','-f','rawvideo','-pix_fmt','gray','-'],capture_output=True).stdout
    d = np.frombuffer(r,np.uint8).reshape(-1,480,270)
    cnt = np.array([(f < 3).sum() for f in d])
    med = np.array([np.median(cnt[max(0,i-6):i+7]) for i in range(len(cnt))])
    idx = [int(i) for i in np.where(cnt > med + 1500)[0]]
    if idx: bad[ch] = idx
    print(ch, 'frames', len(cnt), 'glitch frames', idx, flush=True)
print('BAD' if bad else 'CLEAN', bad)
