import {it,expect,vi} from 'vitest';
import * as T from 'three';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {toonGTAO,aoMaskBlend} from './post';

// render-2: the AO blend gets the composer's scene depth (with Pip) next to the AO pass's own depth
// (without him), so it can leave pixels alone where something the AO pass skipped stands in front.
it('feeds the AO blend the scene depth and the AO depth every frame',()=>{
  const inner=vi.spyOn(GTAOPass.prototype,'render').mockImplementation(()=>{});
  const camera=new T.PerspectiveCamera(30,1,.25,120),pass=toonGTAO(new T.Scene(),camera,64,64),u=pass.blendMaterial.uniforms;
  expect(pass.blendMaterial.fragmentShader).toBe(aoMaskBlend);expect(aoMaskBlend).toContain('tSceneDepth');expect(aoMaskBlend).toContain('gl_FragColor=vec4(1.)');
  const depth=new T.DepthTexture(64,64),read=new T.WebGLRenderTarget(64,64,{depthTexture:depth}),write=new T.WebGLRenderTarget(64,64),r={} as T.WebGLRenderer;
  pass.render(r,write,read,1/60,false);
  expect(u.tSceneDepth.value).toBe(depth);expect(u.tAODepth.value).toBe(pass.depthTexture);expect(u.tAODepth.value).not.toBe(depth);
  expect(u.cameraNear.value).toBe(.25);expect(u.cameraFar.value).toBe(120);expect(inner).toHaveBeenCalledWith(r,write,read,1/60,false);
  // No scene depth texture: compare the AO depth with itself, i.e. blend everywhere as before.
  pass.render(r,write,new T.WebGLRenderTarget(64,64),1/60,false);expect(u.tSceneDepth.value).toBe(pass.depthTexture);
  inner.mockRestore();
});
