import RAPIER from '@dimforge/rapier3d-compat';
import '@fontsource-variable/fredoka/wdth.css';
import {Game} from './game';
import {levels} from './levels';
import {nextUnfinished} from './ui/store';
import './style.css';
import './ui/ui.css';
import './ui/screens.css';
// ?level=… loads that job; a bare URL loads the next unfinished one behind the title screen.
async function boot(){await RAPIER.init();const id=new URLSearchParams(location.search).get('level');new Game(levels.find(l=>l.id===id)??nextUnfinished(levels));}
void boot().catch(error=>{document.body.dataset.error=String(error);document.querySelector('#hud')!.textContent='Unable to start. Please reload.';console.error(error);});
