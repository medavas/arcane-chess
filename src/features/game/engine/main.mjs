// import from files in validation-engine folder for vars that are not found
import {
  FilesBrd,
  RanksBrd,
  SQUARES,
  FR2SQ,
  RAND_32,
  BRD_SQ_NUM,
  PieceKeys,
  updateSideKey,
  CastleKeys,
  RANKS,
  FILES,
  Sq120ToSq64,
  Sq64ToSq120,
  MAXGAMEMOVES,
  NOMOVE,
  PVENTRIES,
} from './defs';
import { GameBoard } from './board';

export function InitFilesRanksBrd() {
  for (let index = 0; index < BRD_SQ_NUM; index++) {
    FilesBrd[index] = SQUARES.OFFBOARD;
    RanksBrd[index] = SQUARES.OFFBOARD;
  }

  for (let rank = RANKS.RANK_1; rank <= RANKS.RANK_8; rank++) {
    for (let file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
      let sq = FR2SQ(file, rank);
      FilesBrd[sq] = file;
      RanksBrd[sq] = rank;
    }
  }
}

export function InitHashKeys() {
  for (let index = 0; index < 29 * 120; index++) {
    PieceKeys[index] = RAND_32();
  }

  updateSideKey(RAND_32());

  for (let index = 0; index < 16; index++) {
    CastleKeys[index] = RAND_32();
  }
}

export function InitSq120To64() {
  let sq = SQUARES.A1;
  let sq64 = 0;

  for (let index = 0; index < BRD_SQ_NUM; index++) {
    Sq120ToSq64[index] = 65;
  }

  for (let index = 0; index < 64; index++) {
    Sq64ToSq120[index] = 120;
  }

  for (let rank = RANKS.RANK_1; rank <= RANKS.RANK_8; rank++) {
    for (let file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
      sq = FR2SQ(file, rank);
      Sq64ToSq120[sq64] = sq;
      Sq120ToSq64[sq] = sq64;
      sq64++;
    }
  }
}

export function InitBoardVars() {
  var index = 0;
  for (index = 0; index < MAXGAMEMOVES; index++) {
    GameBoard.history.push({
      move: NOMOVE,
      castlePerm: 0,
      enPas: 0,
      fiftyMove: 0,
      posKey: 0,
      // arcanes?
    });
  }

  for (index = 0; index < PVENTRIES; index++) {
    GameBoard.PvTable.push({
      move: NOMOVE,
      posKey: 0,
    });
  }
}
