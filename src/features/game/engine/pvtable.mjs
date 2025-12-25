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
    const move = GameBoard.PvTable[index].move;
    // Log if we're retrieving a potentially invalid move
    if (move !== NOMOVE) {
      const from = (move >> 7) & 0x7F;
      const to = move & 0x7F;
      if (from === undefined || from < 0 || from > 119 || to === undefined || to < 0 || to > 119) {
        console.error('ProbePvTable: Invalid move in PV table', { 
          move, 
          moveHex: move?.toString(16), 
          from, 
          to,
          posKey: GameBoard.posKey,
          index
        });
      }
    }
    return move;
  }

  return NOMOVE;
}

export function StorePvMove(move) {
  let index = GameBoard.posKey % PVENTRIES;
  GameBoard.PvTable[index].posKey = GameBoard.posKey;
  GameBoard.PvTable[index].move = move;
}
