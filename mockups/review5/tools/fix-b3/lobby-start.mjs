// R5-241: lobby first frame after Start (dev server on 4173).
import {launch} from '../cap.mjs';
const g=await launch('lobby');await g.advance(1.5);await g.shot('fix-b3-lobby-start');console.log(JSON.stringify(await g.close()));
