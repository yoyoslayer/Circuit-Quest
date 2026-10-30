// Station registry: level.station names which bench a room holds (docs/EXPANSION_PLAN.md).
import type {Game} from '../game';
import type {Station,StationId} from './types';
import {QfnBench} from './qfn/station';
import {ObservatoryBench} from './observatory/station';
import {ArcadeBench} from './arcade/station';
import {GarageBench} from './garage/station';
import {SpectrumDesk} from './spectrum/station';
export function makeStation(id:StationId,game:Game):Station{
  switch(id){
    case 'qfn':return new QfnBench(game);
    case 'observatory':return new ObservatoryBench(game);
    case 'arcade':return new ArcadeBench(game);
    case 'garage':return new GarageBench(game);
    case 'spectrum':return new SpectrumDesk(game);
  }
}
