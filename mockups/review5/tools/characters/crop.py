import sys
from PIL import Image
src,dst,x,y,w,h=sys.argv[1],sys.argv[2],*map(int,sys.argv[3:7])
s=float(sys.argv[7]) if len(sys.argv)>7 else 2
im=Image.open(src).crop((x,y,x+w,y+h));im=im.resize((int(w*s),int(h*s)),Image.LANCZOS);im.save(dst)
