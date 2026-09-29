// Rebuilds Pip (public/models/pip.glb and pip.blend) with Blender on any OS: npm run assets.
// Uses $BLENDER, then the default Windows install path, then `blender` on PATH.
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
const win='C:/Program Files/Blender Foundation/Blender 5.1/blender.exe';
const blender=process.env.BLENDER||(existsSync(win)?win:'blender');
const r=spawnSync(blender,['--background','--python','tools/create_assets.py'],{stdio:'inherit'});
if(r.error){console.error(`Blender not found (${blender}). Install Blender 5.x or set BLENDER.`);process.exit(1);}
process.exit(r.status??1);
