// Station registry: level.station names which bench a room holds (docs/EXPANSION_PLAN.md).
import type {Game} from '../game';
import type {Station,StationId} from './types';
import {ViaCounter} from './vias/station';
import {ArchiveDesk} from './archive/station';
import {Waterworks} from './waterworks/station';
import {ObservatoryBench} from './observatory/station';
import {ArcadeBench} from './arcade/station';
export function makeStation(id:StationId,game:Game):Station{
  switch(id){
    case 'vias':return new ViaCounter(game);
    case 'archive':return new ArchiveDesk(game);
    case 'waterworks':return new Waterworks(game);
    case 'observatory':return new ObservatoryBench(game);
    case 'arcade':return new ArcadeBench(game);
  }
}
