# Counts luma plateaus along diameters of the injected test sphere.
import sys, numpy as np
from PIL import Image
from collections import deque
S='mockups/review5/shots/'
def load(n):
    a=np.asarray(Image.open(S+n+'.png').convert('RGB')).astype(float); return a
def comp(a,seed):
    H,W,_=a.shape; L=a@[.299,.587,.114]; mx=a.max(2); mn=a.min(2); sat=(mx-mn)/(mx+1)
    ok=(sat<.12)&(L>95); seen=np.zeros((H,W),bool); q=deque([seed]); seen[seed[1],seed[0]]=True; pts=[]
    while q:
        x,y=q.popleft(); pts.append((x,y))
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            u,v=x+dx,y+dy
            if 0<=u<W and 0<=v<H and not seen[v,u] and ok[v,u]: seen[v,u]=True; q.append((u,v))
    p=np.array(pts); return L,p
def analyse(n,seed):
    a=load(n); L,p=comp(a,seed); cx,cy=p.mean(0); r=np.sqrt(len(p)/np.pi)
    best=None
    for ang in np.arange(0,180,7.5):
        t=np.radians(ang); d=np.array([np.cos(t),np.sin(t)])
        s=np.linspace(-.92*r,.92*r,int(1.84*r)); xs=(cx+s*d[0]).astype(int); ys=(cy+s*d[1]).astype(int)
        prof=L[ys,xs]; rng=np.percentile(prof,95)-np.percentile(prof,5)
        if best is None or rng>best[0]: best=(rng,ang,prof)
    rng,ang,prof=best
    sm=np.convolve(prof,np.ones(5)/5,'valid'); g=np.abs(np.gradient(sm)); N=len(sm)
    flat=g<max(.6,rng/N*0.5)  # slope well below the mean slope of a linear ramp
    runs=[];k=0
    while k<N:
        if flat[k]:
            j=k
            while j<N and flat[j]: j+=1
            if j-k>=.08*N: runs.append((k,j,sm[k:j].mean()))
            k=j
        else: k+=1
    # merge adjacent runs of similar level
    merged=[]
    for r0 in runs:
        if merged and abs(merged[-1][2]-r0[2])<6: merged[-1]=(merged[-1][0],r0[1],(merged[-1][2]+r0[2])/2)
        else: merged.append(r0)
    big=[m for m in merged if (m[1]-m[0])>=.15*N]
    q=lambda i: int(round(sm[int(i*(N-1))]))
    print(f"{n}: r={r:.0f}px dia-angle={ang} luma range={rng:.0f} profile[0,.25,.5,.75,1]={[q(i) for i in (0,.25,.5,.75,1)]} plateaus>=8%:{len(merged)} >=15%:{len(big)} levels={[int(m[2]) for m in merged]} cover={[round((m[1]-m[0])/N,2) for m in merged]}")
    hist=np.histogram(prof,bins=12)[0]; print('   hist',list(hist))
for n,seed in [(a,(int(b),int(c))) for a,b,c in (x.split(':') for x in sys.argv[1:])]:
    analyse(n,seed)
