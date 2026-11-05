// Fix-lunch check F: the layout audit (nothing starts overlapping).
import {launch} from '../cap.mjs';
const g=await launch('lunch');await g.advance(.2);console.log(JSON.stringify(await g.ev('return drive.audit()')));await g.close();
