import _ from 'lodash';
import {
  GameBoard,
  FROMSQ,
  TOSQ,
  CAPTURED,
  PROMOTED,
  ARCANEFLAG,
  MFLAGSHFT,
  MFLAGCNSM,
  MFLAGSUMN,
  MFLAGSWAP,
  MFLAGCA,
  MFLAGEP,
  InCheck,
} from './board';
import {
  NOMOVE,
  FileChar,
  RankChar,
  FilesBrd,
  RanksBrd,
  PIECES,
  BOOL,
  COLOURS,
  PceChar,
  RtyChar,
  RANKS,
} from './defs';
import { MakeMove, TakeMove } from './makemove';
import { ARCANE_BIT_VALUES, prettyToSquare } from './defs.mjs';
import { generatePlayableOptions } from './movegen.mjs';

export function PrSq(sq) {
  return FileChar[FilesBrd[sq]] + RankChar[RanksBrd[sq]];
}

const royaltyMap = ['.', 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42];
// todo update to allow swapping your pawns into promotion, but not your opponents

const isInitPromotion = (move) => {
  if (GameBoard.pieces[FROMSQ(move)] === PIECES.wP) {
    if (
      GameBoard.whiteArcane[4] & 16 &&
      RanksBrd[TOSQ(move)] === RANKS.RANK_7
    ) {
      return true;
    }
    if (RanksBrd[TOSQ(move)] === RANKS.RANK_8) {
      return true;
    }
  } else if (GameBoard.pieces[FROMSQ(move)] === PIECES.bP) {
    if (
      GameBoard.blackArcane[4] & 16 &&
      RanksBrd[TOSQ(move)] === RANKS.RANK_2
    ) {
      return true;
    }
    if (RanksBrd[TOSQ(move)] === RANKS.RANK_1) {
      return true;
    }
  }
  return false;
};

export function PrMove(move, returnType) {
  const getPceChar = (pieceNum) => {
    return PceChar.split('')[pieceNum];
  };

  let MvStr;
  let tempFrom = FROMSQ(move) || 100;

  let ff = FilesBrd[tempFrom];
  let rf = RanksBrd[tempFrom];
  let ft = FilesBrd[TOSQ(move)];
  let rt = RanksBrd[TOSQ(move)];

  // promoted, summon, swap
  let pieceEpsilon = PROMOTED(move);
  let pchar;

  // pass
  if (pieceEpsilon === 31) {
    MvStr = 'pass';
  }
  // normal quiet
  if (
    TOSQ(move) !== 0 &&
    CAPTURED(move) === 0 &&
    pieceEpsilon === 0 &&
    ARCANEFLAG(move) === 0
  ) {
    MvStr =
      getPceChar(GameBoard.pieces[TOSQ(move)]) +
      FileChar[ff] +
      RankChar[rf] +
      FileChar[ft] +
      RankChar[rt];
  }
  // normal capture
  if (
    TOSQ(move) !== 0 &&
    CAPTURED(move) > 0 &&
    pieceEpsilon === 0 &&
    !(move & MFLAGSWAP)
    // &&
    // !(move & MFLAGOFFR)
  ) {
    MvStr =
      getPceChar(GameBoard.pieces[TOSQ(move)]) +
      FileChar[ff] +
      RankChar[rf] +
      'x' +
      getPceChar(CAPTURED(move)) +
      FileChar[ft] +
      RankChar[rt];
  }
  // trample capture (promoted === 30)
  if (
    TOSQ(move) !== 0 &&
    CAPTURED(move) > 0 &&
    pieceEpsilon === 30 &&
    !(move & MFLAGSWAP)
  ) {
    MvStr =
      getPceChar(GameBoard.pieces[FROMSQ(move)]) +
      FileChar[ff] +
      RankChar[rf] +
      '$' +
      getPceChar(CAPTURED(move)) +
      FileChar[ft] +
      RankChar[rt];
  }
  // consume capture
  if (TOSQ(move) !== 0 && move & MFLAGCNSM && pieceEpsilon !== 0) {
    MvStr =
      getPceChar(GameBoard.pieces[TOSQ(move)]) +
      FileChar[ff] +
      RankChar[rf] +
      'x' +
      getPceChar(CAPTURED(move)) +
      FileChar[ft] +
      RankChar[rt];
  }
  // swap
  if (TOSQ(move) !== 0 && move & MFLAGSWAP) {
    MvStr =
      getPceChar(GameBoard.pieces[FROMSQ(move)]) +
      PrSq(FROMSQ(move)) +
      '&' +
      getPceChar(GameBoard.pieces[TOSQ(move)]) +
      PrSq(TOSQ(move));
  }
  // summon
  if (TOSQ(move) !== 0 && move & MFLAGSUMN) {
    if (
      royaltyMap[CAPTURED(move)] === ARCANE_BIT_VALUES.RQ ||
      royaltyMap[CAPTURED(move)] === ARCANE_BIT_VALUES.RT ||
      royaltyMap[CAPTURED(move)] === ARCANE_BIT_VALUES.RM ||
      royaltyMap[CAPTURED(move)] === ARCANE_BIT_VALUES.RV ||
      royaltyMap[CAPTURED(move)] === ARCANE_BIT_VALUES.RE ||
      royaltyMap[CAPTURED(move)] === ARCANE_BIT_VALUES.RY ||
      royaltyMap[CAPTURED(move)] === ARCANE_BIT_VALUES.RZ ||
      royaltyMap[CAPTURED(move)] === ARCANE_BIT_VALUES.RA
    ) {
      MvStr =
        'R' +
        RtyChar.split('')[royaltyMap[CAPTURED(move)]] +
        '@' +
        PrSq(TOSQ(move));
    } else {
      MvStr =
        PceChar.split('')[PROMOTED(move)]?.toUpperCase() +
        '@' +
        PrSq(TOSQ(move));
    }
  }
  // magnet / black hole
  if (TOSQ(move) === 0 && (CAPTURED(move) === 31 || PROMOTED(move) === 30)) {
    const isMagnet = CAPTURED(move) === 31;
    MvStr = (isMagnet ? 'magnet@' : 'blackhole@') + PrSq(FROMSQ(move));
  }
  // offering
  if (
    TOSQ(move) === 0 &&
    CAPTURED(move) > 0 &&
    PROMOTED(move) > 0 &&
    CAPTURED(move) !== 31 &&
    PROMOTED(move) !== 30
  ) {
    MvStr =
      'o' +
      '.ABCDEEFFGGHHIJKKKKLMNOOOZZQR'.split('')[PROMOTED(move)] +
      '@' +
      PrSq(FROMSQ(move));
  }
  // shift
  if (TOSQ(move) !== 0 && move & MFLAGSHFT) {
    MvStr =
      getPceChar(GameBoard.pieces[TOSQ(move)]) +
      PrSq(FROMSQ(move)) +
      '^' +
      PrSq(TOSQ(move));
  }
  // promotion
  if (
    TOSQ(move) !== 0 &&
    pieceEpsilon !== 0 &&
    (move & MFLAGSHFT) === 0 &&
    !(move & MFLAGSUMN) &&
    !(move & MFLAGSWAP)
  ) {
    MvStr =
      `${GameBoard.side === COLOURS.WHITE ? 'P' : 'p'}` +
      FileChar[ff] +
      RankChar[rf] +
      (CAPTURED(move) & 0 || !(move & MFLAGCNSM)
        ? ''
        : `x${getPceChar(GameBoard.pieces[TOSQ(move)])}`) +
      FileChar[ft] +
      RankChar[rt];

    if (pieceEpsilon === PIECES.wQ) {
      pchar = '=Q';
    }
    if (pieceEpsilon === PIECES.bQ) {
      pchar = '=q';
    }
    if (pieceEpsilon === PIECES.wT) {
      pchar = '=T';
    }
    if (pieceEpsilon === PIECES.bT) {
      pchar = '=t';
    }
    if (pieceEpsilon === PIECES.wM) {
      pchar = '=M';
    }
    if (pieceEpsilon === PIECES.bM) {
      pchar = '=m';
    }
    if (pieceEpsilon === PIECES.wR) {
      pchar = '=R';
    }
    if (pieceEpsilon === PIECES.bR) {
      pchar = '=r';
    }
    if (pieceEpsilon === PIECES.wB) {
      pchar = '=B';
    }
    if (pieceEpsilon === PIECES.bB) {
      pchar = '=b';
    }
    if (pieceEpsilon === PIECES.wZ) {
      pchar = '=Z';
    }
    if (pieceEpsilon === PIECES.bZ) {
      pchar = '=z';
    }
    if (pieceEpsilon === PIECES.wU) {
      pchar = '=U';
    }
    if (pieceEpsilon === PIECES.bU) {
      pchar = '=u';
    }
    if (pieceEpsilon === PIECES.wS) {
      pchar = '=S';
    }
    if (pieceEpsilon === PIECES.bS) {
      pchar = '=s';
    }
    if (pieceEpsilon === PIECES.wN) {
      pchar = '=N';
    }
    if (pieceEpsilon === PIECES.bN) {
      pchar = '=n';
    }
    if (pieceEpsilon === PIECES.wW) {
      pchar = '=W';
    }
    if (pieceEpsilon === PIECES.bW) {
      pchar = '=w';
    }
    MvStr += pchar;
  }
  // castle
  if (move & MFLAGCA) {
    const WKR = _.lastIndexOf(GameBoard.pieces, 4);
    const WQR = _.indexOf(GameBoard.pieces, 4, 21);
    const BKR = _.lastIndexOf(GameBoard.pieces, 10);
    const BQR = _.indexOf(GameBoard.pieces, 10, 91);

    if (GameBoard.side === COLOURS.WHITE) {
      if (FROMSQ(move) - TOSQ(move) === -2 || TOSQ(move) === WKR) {
        MvStr = 'O-O';
      }
      if (FROMSQ(move) - TOSQ(move) === 2 || TOSQ(move) === WQR) {
        MvStr = 'O-O-O';
      }
    } else {
      if (FROMSQ(move) - TOSQ(move) === -2 || TOSQ(move) === BKR) {
        MvStr = 'O-O';
      }
      if (FROMSQ(move) - TOSQ(move) === 2 || TOSQ(move) === BQR) {
        MvStr = 'O-O-O';
      }
    }
  }
  // EP
  if (move & MFLAGEP) {
    MvStr =
      getPceChar(GameBoard.pieces[TOSQ(move)]) +
      PrSq(FROMSQ(move)) +
      'x' +
      getPceChar(GameBoard.pieces[TOSQ(move)]) +
      PrSq(TOSQ(move)) +
      'ep';
  }

  if (InCheck()) {
    MvStr += '+';
  }

  // from chessground translator
  if (returnType === 'array') {
    return [PrSq(FROMSQ(move)), PrSq(TOSQ(move))];
  }

  return MvStr;
}

export function PrintMoveList() {
  let index;
  let move;
  let num = 1;
  console.log('MoveList:');

  for (
    index = GameBoard.moveListStart[GameBoard.ply];
    index < GameBoard.moveListStart[GameBoard.ply + 1];
    index++
  ) {
    move = GameBoard.moveList[index];
    console.log(
      'IMove:' +
        num +
        ':(' +
        index +
        '):' +
        PrMove(move) +
        ' Score:' +
        GameBoard.moveScores[index]
    );
    num++;
  }
  console.log('End MoveList');
}

export function ParseMove(
  from,
  to,
  pieceEpsilon = PIECES.EMPTY,
  // swap type used for 'TELEPORT' due to running out of validation
  swapType = '',
  royaltyEpsilon = PIECES.EMPTY
) {
  // Check if this is a magnet/black hole spell or trample
  const isMagnetType = swapType === 'modsMAG';
  const isTrampleType = swapType === 'modsTRA';

  const arcaneType = isMagnetType
    ? swapType // Use the magnet type directly
    : isTrampleType
    ? swapType // Use the trample type directly
    : to === null
    ? 'OFFERING'
    : (pieceEpsilon > 0 && from === null) || royaltyEpsilon > 0
    ? 'SUMMON'
    : 'COMP';

  const royaltyOrPieceSummon =
    royaltyEpsilon !== 0 ? royaltyEpsilon : pieceEpsilon;
  generatePlayableOptions(
    true,
    false,
    arcaneType,
    isMagnetType || isTrampleType ? '' : swapType,
    royaltyOrPieceSummon
  );

  let Move = NOMOVE;
  let found = BOOL.FALSE;

  for (
    let index = GameBoard.moveListStart[GameBoard.ply];
    index < GameBoard.moveListStart[GameBoard.ply + 1];
    ++index
  ) {
    Move = GameBoard.moveList[index];
    if (from === 0 && to === 0) {
      if (PROMOTED(Move) === pieceEpsilon) {
        found = BOOL.TRUE;
        break;
      }
      continue;
    } else if (
      (from === 0 && TOSQ(Move) === prettyToSquare(to)) ||
      (FROMSQ(Move) === prettyToSquare(from) &&
        TOSQ(Move) === prettyToSquare(to)) ||
      // For magnet/black hole, TOSQ is 0, match by FROMSQ only
      (isMagnetType &&
        FROMSQ(Move) === prettyToSquare(from) &&
        TOSQ(Move) === 0)
    ) {
      // Magnet: cap=31, TOSQ=0; Black Hole: prom=30, TOSQ=0
      if (isMagnetType && TOSQ(Move) === 0 && CAPTURED(Move) === 31) {
        found = BOOL.TRUE;
        break;
      } else if (TOSQ(Move) === 0 && CAPTURED(Move) > 0) {
        found = BOOL.TRUE;
        break;
      } else if (isInitPromotion(Move) && PROMOTED(Move) === PIECES.EMPTY) {
        found = BOOL.TRUE;
        break;
      } else if (Move & MFLAGSWAP && swapType !== '') {
        if (CAPTURED(Move) > 0 && PROMOTED(Move) > 0) {
          found = BOOL.TRUE;
          break;
        }
        continue;
      } else if (isTrampleType && PROMOTED(Move) === 30 && TOSQ(Move) > 0) {
        // Trample moves: PROMOTED = 30, TOSQ > 0 (target square), CAPTURED > 0
        found = BOOL.TRUE;
        break;
      } else if (Move & MFLAGSUMN) {
        if (pieceEpsilon !== PIECES.EMPTY) {
          found = BOOL.TRUE;
          break;
        } else if (royaltyEpsilon !== PIECES.EMPTY) {
          found = BOOL.TRUE;
          break;
        }
        continue;
      } else if (pieceEpsilon !== PIECES.EMPTY) {
        if (PROMOTED(Move) === pieceEpsilon) {
          found = BOOL.TRUE;
          break;
        }
        continue;
      }
      found = BOOL.TRUE;
      break;
    }
  }

  PrMove(Move);

  if (found !== BOOL.FALSE) {
    if (MakeMove(Move) === BOOL.FALSE) {
      return {
        parsed: NOMOVE,
        isInitPromotion: isInitPromotion(Move) ? BOOL.TRUE : BOOL.FALSE,
      };
    }
    TakeMove();
    return {
      parsed: Move,
      isInitPromotion: isInitPromotion(Move) ? BOOL.TRUE : BOOL.FALSE,
    };
  }
  return {
    parsed: NOMOVE,
    isInitPromotion: isInitPromotion(Move) ? BOOL.TRUE : BOOL.FALSE,
  };
}
