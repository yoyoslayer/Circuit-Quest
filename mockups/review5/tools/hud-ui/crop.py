import sys
from PIL import Image
src,dst,x,y,w,h,s=sys.argv[1],sys.argv[2],*map(int,sys.argv[3:7]),float(sys.argv[7]) if len(sys.argv)>7 else 1
im=Image.open(src).crop((x,y,x+w,y+h))
if s!=1: im=im.resize((int(w*s),int(h*s)),Image.LANCZOS)
im.save(dst)
