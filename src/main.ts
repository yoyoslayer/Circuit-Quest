import RAPIER from '@dimforge/rapier3d-compat';
import {Game} from './game';
import {levels} from './levels';
import './style.css';
async function boot(){await RAPIER.init();const id=new URLSearchParams(location.search).get('level');new Game(levels.find(l=>l.id===id)??levels[0]);}
void boot().catch(error=>{document.body.dataset.error=String(error);document.querySelector('#hud')!.textContent='Unable to start. Please reload.';console.error(error);});
