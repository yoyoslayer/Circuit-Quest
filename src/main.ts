import RAPIER from '@dimforge/rapier3d-compat';
import {Game} from './game';
import {playground} from './levels/playground';
import {meeting} from './levels/meeting';
import './style.css';
async function boot(){await RAPIER.init();new Game(new URLSearchParams(location.search).get('level')==='meeting'?meeting:playground);}
void boot().catch(error=>{document.body.dataset.error=String(error);document.querySelector('#hud')!.textContent='Unable to start. Please reload.';console.error(error);});
