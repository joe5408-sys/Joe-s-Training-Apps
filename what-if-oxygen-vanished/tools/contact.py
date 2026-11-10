"""Make a contact sheet of PNG stills: python tools/contact.py out.png a.png b.png ..."""
import sys, cv2, numpy as np
out, files = sys.argv[1], sys.argv[2:]
ims = []
for f in files:
    im = cv2.resize(cv2.imread(f), (360, 640), interpolation=cv2.INTER_AREA)
    cv2.putText(im, f.split('_')[-1][:-4], (8, 630), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1)
    ims.append(im)
cols = min(4, len(ims))
while len(ims) % cols: ims.append(np.zeros_like(ims[0]))
rows = [cv2.hconcat(ims[i:i + cols]) for i in range(0, len(ims), cols)]
cv2.imwrite(out, cv2.vconcat(rows))
