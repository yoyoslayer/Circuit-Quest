import RAPIER from '@dimforge/rapier3d-compat';
import '@fontsource-variable/fredoka/wdth.css';
import {Game} from './game';
import {levels} from './levels';
import {lobby} from './levels/lobby';
import {isLocked} from './ui/store';
import './style.css';
import './ui/ui.css';
import './ui/screens.css';
// ?level=… loads that job; a bare URL (or ?level=lobby) opens the HQ lobby behind the title screen.
// A locked job (Rush before a B on its story job) opens the lobby instead; tests (?manual) may open it directly.
async function boot(){await RAPIER.init();const q=new URLSearchParams(location.search),id=q.get('level'),level=levels.find(l=>l.id===id);new Game(level&&(!isLocked(level)||q.has('manual'))?level:lobby);}
void boot().catch(error=>{document.body.dataset.error=String(error);document.querySelector('#hud')!.textContent='Unable to start. Please reload.';console.error(error);});
