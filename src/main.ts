import RAPIER from '@dimforge/rapier3d-compat';
import {Game} from './game';
import {playground} from './levels/playground';
import {meeting} from './levels/meeting';
import {lunch} from './levels/lunch';
import './style.css';
async function boot(){await RAPIER.init();const id=new URLSearchParams(location.search).get('level');new Game(id==='lunch'?lunch:id==='meeting'?meeting:playground);}
void boot().catch(error=>{document.body.dataset.error=String(error);document.querySelector('#hud')!.textContent='Unable to start. Please reload.';console.error(error);});
