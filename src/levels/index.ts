import {playground} from './playground';
import {meeting} from './meeting';
import {lunch} from './lunch';
import {qfn} from './qfn';
import {observatory} from './observatory';
import {arcade,arcadeRush} from './arcade';
import {garage} from './garage';
import {spectrum} from './spectrum';
// The eight rooms kept after the 2026-10-30 cut (via counter, archive, waterworks, clockwork and depot
// were removed: see docs/PROGRESS.md). Order is the lobby and job-board order.
export const levels=[playground,meeting,lunch,arcade,arcadeRush,garage,qfn,observatory,spectrum];
