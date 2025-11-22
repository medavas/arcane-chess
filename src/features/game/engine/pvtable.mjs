import { GameBoard } from './board';
import { NOMOVE, BOOL, PVENTRIES } from './defs';
import { MakeMove, TakeMove } from './makemove';
import { MoveExists } from './movegen';

export function GetPvLine(depth) {
  let move = ProbePvTable();
  let count = 0;

  while (move !== NOMOVE && count < depth) {
    if (MoveExists(move) === BOOL.TRUE) {
      MakeMove(move);
      GameBoard.PvArray[count++] = move;
    } else {
      break;
    }
    move = ProbePvTable();
  }

  while (GameBoard.ply > 0) {
    TakeMove();
  }

  return count;
}

export function ProbePvTable() {
  let index = GameBoard.posKey % PVENTRIES;

  if (GameBoard.PvTable[index].posKey === GameBoard.posKey) {
    return GameBoard.PvTable[index].move;
  }

  return NOMOVE;
}

export function StorePvMove(move) {
  let index = GameBoard.posKey % PVENTRIES;
  GameBoard.PvTable[index].posKey = GameBoard.posKey;
  GameBoard.PvTable[index].move = move;
}
