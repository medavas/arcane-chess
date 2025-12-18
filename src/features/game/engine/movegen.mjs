import _ from 'lodash';

// import all vars and functions from arcanechess folder that are not defined
import {
  GameBoard,
  SqAttacked,
  SQOFFBOARD,
  MFLAGCA,
  MFLAGPS,
  MFLAGEP,
  MFLAGSHFT,
  MFLAGSUMN,
  MFLAGCNSM,
  MFLAGSWAP,
  CAPTURED,
  FROMSQ,
  TOSQ,
  PROMOTED,
} from './board';
import { whiteArcaneConfig, blackArcaneConfig, POWERBIT } from './arcaneDefs';
import {
  COLOURS,
  BOOL,
  CASTLEBIT,
  PIECES,
  RANKS,
  RanksBrd,
  SQUARES,
  PieceCol,
  PieceKing,
  PieceKnight,
  PieceZebra,
  PieceUnicorn,
  PieceDyad,
  LoopNonSlideDyad,
  LoopNonSlidePce,
  LoopSlideDyad,
  LoopSlidePce,
  LoopNonSlideIndex,
  LoopSlideIndex,
  loopSummon,
  loopSummonFlag,
  loopSummonIndex,
  DirNum,
  PceDir,
  RkDir,
  BiDir,
  KiDir,
  KnDir,
  WrDir,
  SpDir,
  ShoDir,
  HrDir,
  HerShftDir,
  HemlockHopA,
  BanDirSp,
  // BanDirWr,
  PCEINDEX,
  NOMOVE,
  MAXDEPTH,
  BRD_SQ_NUM,
  ARCANE_BIT_VALUES,
  royaltySliders,
  royaltyHoppers,
  royaltySliderMap,
  royaltyHopperMap,
  RtyChar,
  LoopPcePrime,
  LoopPcePrimeSymbols,
  LoopPcePrimeIndex,
} from './defs';
import { MakeMove, TakeMove } from './makemove';
import { validMoves } from './gui.mjs';

const MvvLvaValue = [
  0, 100, 500, 600, 700, 1200, 1400, 100, 500, 600, 700, 1200, 1400, 300, 900,
  1000, 1100, 1000, 1300, 900, 1000, 1100, 1000, 1300, 400, 300, 400, 300, 800,
  800, 300,
];
const MvvLvaScores = new Array(31 * 31);
export function InitMvvLva() {
  let Attacker;
  let Victim;

  for (Attacker = PIECES.wP; Attacker <= PIECES.bW; Attacker++) {
    for (Victim = PIECES.wP; Victim <= PIECES.bW; Victim++) {
      MvvLvaScores[Victim * 31 + Attacker] =
        MvvLvaValue[Victim] + 14 - MvvLvaValue[Attacker] / 100;
    }
  }
}

export function MoveExists(move) {
  generatePlayableOptions(true, false, 'COMP', 'COMP');

  let index;
  let moveFound = NOMOVE;
  for (
    index = GameBoard.moveListStart[GameBoard.ply];
    index < GameBoard.moveListStart[GameBoard.ply + 1];
    ++index
  ) {
    moveFound = GameBoard.moveList[index];
    if (MakeMove(moveFound) === BOOL.FALSE) {
      continue;
    }
    TakeMove();
    if (move === moveFound) {
      return BOOL.TRUE;
    }
  }
  return BOOL.FALSE;
}

export function MOVE(from, to, captured, promoted, flag) {
  return from | (to << 7) | (captured << 14) | (promoted << 21) | flag;
}

export function AddCaptureMove(move, consume = false, capturesOnly = false) {
  const targetSquare = TOSQ(move);
  const capturedPiece = GameBoard.pieces[targetSquare];

  let currentArcanaSide =
    GameBoard.side === 0 ? GameBoard.whiteArcane : GameBoard.blackArcane;
  let has5thDimensionSword = currentArcanaSide[4] & 262144;

  if (
    GameBoard.pieces[FROMSQ(move)] === PIECES.wX ||
    GameBoard.pieces[FROMSQ(move)] === PIECES.bX
  ) {
    return;
  }

  if (GameBoard.royaltyN[FROMSQ(move)] > 0) {
    return;
  }

  const isTargetExile =
    GameBoard.pieces[TOSQ(move)] === PIECES.wX ||
    GameBoard.pieces[TOSQ(move)] === PIECES.bX;

  if (
    isTargetExile &&
    !has5thDimensionSword
    // && move & MFLAGSHFT) // TBD
  ) {
    return;
  }

  if (capturedPiece === PIECES.wK || capturedPiece === PIECES.bK) {
    return;
  }

  // gluttony
  if (GameBoard.dyad > 0) {
    const hasGluttony =
      (GameBoard.side === COLOURS.WHITE && GameBoard.whiteArcane[4] & 64) ||
      (GameBoard.side === COLOURS.BLACK && GameBoard.blackArcane[4] & 64);

    if (!hasGluttony) {
      return;
    }

    // Check if the moving piece is allowed by the current dyad type
    const movingPiece = GameBoard.pieces[FROMSQ(move)];
    const pieceDyadValue = PieceDyad[movingPiece] || 0;

    // If the piece's dyad value doesn't match the active dyad, block the capture
    // Note: dyadA (value 1) allows all pieces, so we need to check if dyad matches OR dyad is 1
    if (GameBoard.dyad !== 1 && (pieceDyadValue & GameBoard.dyad) === 0) {
      return;
    }
  }

  // sixfold silk
  if (
    GameBoard.royaltyE[TOSQ(move)] > 0 &&
    ((GameBoard.side === COLOURS.WHITE && !(GameBoard.whiteArcane[4] & 8)) ||
      (GameBoard.side === COLOURS.BLACK && !(GameBoard.blackArcane[4] & 8)))
  )
    return;

  // TODO / TBD: if you want hermit or hemlock to not be capturable
  // fill this in for canceling /returning on the move if the captured piece is only hermit variant
  // if (capturedPiece === PIECES.wH || capturedPiece === PIECES.bH) {
  //   const capSide = PieceCol[capturedPiece];
  //   const capArcane =
  //     capSide === COLOURS.WHITE
  //       ? GameBoard.whiteArcane
  //       : GameBoard.blackArcane;
  //   const hasHermit = (capArcane[10] & 1) !== 0;
  //   const hasHemlock = (capArcane[10] & 2) !== 0;

  //   // If it has Hemlock token, it cannot be captured
  //   if ((hasHermit || hasHemlock) && !has5thDimensionSword) {
  //     return;
  //   }
  // }

  if ((capturesOnly && !consume) || !capturesOnly) {
    if (move & MFLAGSWAP) {
      GameBoard.moveList[GameBoard.moveListStart[GameBoard.ply + 1]] = move;
      GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]++] = 0;
    } else if (GameBoard.suspend <= 0) {
      GameBoard.moveList[GameBoard.moveListStart[GameBoard.ply + 1]] = move;
      if (consume) {
        GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]++] =
          MvvLvaScores[CAPTURED(move) * 30 + GameBoard.pieces[FROMSQ(move)]] +
          1000000;
      } else {
        GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]++] =
          MvvLvaScores[CAPTURED(move) * 30 + GameBoard.pieces[FROMSQ(move)]] +
          1000000;
      }
    }
  }
}

export function AddQuietMove(move, capturesOnly) {
  // if (move & MFLAGSWAP) return;
  if (!capturesOnly) {
    GameBoard.moveList[GameBoard.moveListStart[GameBoard.ply + 1]] = move;
    GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 0;
    if (move === GameBoard.searchKillers[GameBoard.ply]) {
      GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 900000;
    } else if (move === GameBoard.searchKillers[GameBoard.ply + MAXDEPTH]) {
      GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 800000;
    } else {
      GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] =
        GameBoard.searchHistory[
        GameBoard.pieces[FROMSQ(move)] * BRD_SQ_NUM + TOSQ(move)
        ];
    }
    GameBoard.moveListStart[GameBoard.ply + 1]++;
  }
}

export function AddEnPassantMove(move) {
  // if (move & MFLAGSWAP) return;
  GameBoard.moveList[GameBoard.moveListStart[GameBoard.ply + 1]] = move;
  GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] =
    105 + 1000000;
  GameBoard.moveListStart[GameBoard.ply + 1]++;
}

export function addSummonMove(move) {
  // TODO TBD uncomment one line below for suspend to block summons
  // if (GameBoard.suspend > 0) return;
  // if (move & MFLAGSWAP) return;
  // whiteArcaneConfig[
  //   `sumn${pieceEpsilon > 27 || pieceEpsilon === ARCANE_BIT_VALUES.RV ? 'R' : ''}${PceChar.split('')[
  //     pieceEpsilon
  //   ].toUpperCase()}`
  // ]
  // if (
  //   // [GameBoard[
  //   //   `${GameBoard.side === COLOURS.WHITE ? 'white' : 'black'}Arcane`
  //   // ][3] === POWERBIT[`sumn${PceChar.split('')[PROMOTED(move)]}`]
  //   (` ${GameBoard.side === COLOURS.WHITE ? 'white' : 'black'}ArcaneConfig`)[] ===
  // ) {
  GameBoard.moveList[GameBoard.moveListStart[GameBoard.ply + 1]] = move;
  GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 0;

  // todo for chessground translation
  // GameBoard.summonList.push(move);

  if (move === GameBoard.searchKillers[GameBoard.ply]) {
    GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 900000;
  } else if (move === GameBoard.searchKillers[GameBoard.ply + MAXDEPTH]) {
    GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 800000;
  } else {
    // todo update to treat like pieces on that square
    GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 0;
    // MvvLvaValue[summonPce] + 1000000;
  }
  GameBoard.moveListStart[GameBoard.ply + 1]++;
  // }
}

export function addOfferingMove(move) {
  if (PROMOTED(move) === 0) return;
  GameBoard.moveList[GameBoard.moveListStart[GameBoard.ply + 1]] = move;
  GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 0;

  if (move === GameBoard.searchKillers[GameBoard.ply]) {
    GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 900000;
  } else if (move === GameBoard.searchKillers[GameBoard.ply + MAXDEPTH]) {
    GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 800000;
  } else {
    // todo update to treat like pieces on that square
    GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 0;
    // MvvLvaValue[summonPce] + 1000000;
  }
  GameBoard.moveListStart[GameBoard.ply + 1]++;
}

export function AddWhitePawnCaptureMove(
  from,
  to,
  cap,
  eps,
  flag,
  capturesOnly
) {
  if (GameBoard.whiteArcane[4] & 16 && RanksBrd[to] === RANKS.RANK_7) {
    AddCaptureMove(MOVE(from, to, cap, PIECES.wQ, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wT, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wM, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wR, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wB, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wN, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wZ, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wU, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wS, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wW, flag), flag, capturesOnly);
    // If Divine Reckoning is active for white, also offer Valkyrie as a
    // promotion option.
    if (GameBoard.whiteArcane[4] & POWERBIT.modsDIV) {
      AddCaptureMove(MOVE(from, to, cap, PIECES.wV, flag), flag, capturesOnly);
    }
  }
  if (RanksBrd[to] === RANKS.RANK_8) {
    AddCaptureMove(MOVE(from, to, cap, PIECES.wQ, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wT, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wM, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wR, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wB, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wZ, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wU, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wN, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wS, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.wW, flag), flag, capturesOnly);
    // If Divine Reckoning is active for white, also offer Valkyrie as a
    // promotion option.
    if (GameBoard.whiteArcane[4] & POWERBIT.modsDIV) {
      AddCaptureMove(MOVE(from, to, cap, PIECES.wV, flag), flag, capturesOnly);
    }
  } else {
    AddCaptureMove(MOVE(from, to, cap, PIECES.EMPTY, flag), flag, capturesOnly);
  }
}

export function AddBlackPawnCaptureMove(
  from,
  to,
  cap,
  eps,
  flag,
  capturesOnly
) {
  if (GameBoard.blackArcane[4] & 16 && RanksBrd[to] === RANKS.RANK_2) {
    AddCaptureMove(MOVE(from, to, cap, PIECES.bQ, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bT, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bM, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bR, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bB, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bN, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bZ, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bU, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bS, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bW, flag), flag, capturesOnly);
    // Divine Reckoning: allow Valkyrie promotions for black
    if (GameBoard.blackArcane[4] & POWERBIT.modsDIV) {
      AddCaptureMove(MOVE(from, to, cap, PIECES.bV, flag), flag, capturesOnly);
    }
  }
  if (RanksBrd[to] === RANKS.RANK_1) {
    AddCaptureMove(MOVE(from, to, cap, PIECES.bQ, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bT, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bM, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bR, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bB, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bZ, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bU, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bN, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bS, flag), flag, capturesOnly);
    AddCaptureMove(MOVE(from, to, cap, PIECES.bW, flag), flag, capturesOnly);
    // Divine Reckoning: allow Valkyrie promotions for black
    if (GameBoard.blackArcane[4] & POWERBIT.modsDIV) {
      AddCaptureMove(MOVE(from, to, cap, PIECES.bV, flag), flag, capturesOnly);
    }
  } else {
    AddCaptureMove(MOVE(from, to, cap, PIECES.EMPTY, flag), flag, capturesOnly);
  }
}

export function AddWhitePawnQuietMove(from, to, eps, flag, capturesOnly) {
  if (GameBoard.whiteArcane[4] & 16 && RanksBrd[to] === RANKS.RANK_7) {
    // if (GameBoard.suspend > 0) return;
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wQ, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wT, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wM, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wR, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wB, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wN, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wZ, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wU, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wS, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wW, flag), capturesOnly);
    // Divine Reckoning: include Valkyrie as a quiet promotion option for white
    if (GameBoard.whiteArcane[4] & POWERBIT.modsDIV) {
      AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wV, flag), capturesOnly);
    }
  }
  if (RanksBrd[to] === RANKS.RANK_8) {
    // if (GameBoard.suspend > 0) return;
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wQ, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wT, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wM, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wR, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wB, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wN, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wZ, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wU, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wS, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wW, flag), capturesOnly);
    // Divine Reckoning: include Valkyrie as a quiet promotion option for white
    if (GameBoard.whiteArcane[4] & POWERBIT.modsDIV) {
      AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wV, flag), capturesOnly);
    }
  } else {
    AddQuietMove(
      MOVE(from, to, PIECES.EMPTY, PIECES.EMPTY, flag),
      capturesOnly
    );
  }
}

export function AddBlackPawnQuietMove(from, to, eps, flag, capturesOnly) {
  if (GameBoard.blackArcane[4] & 16 && RanksBrd[to] === RANKS.RANK_2) {
    // if (GameBoard.suspend > 0) return;
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bQ, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bT, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bM, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bR, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bB, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bN, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bZ, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bU, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bS, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bW, flag), capturesOnly);
    // Divine Reckoning: include Valkyrie as a quiet promotion option for black
    if (GameBoard.blackArcane[4] & POWERBIT.modsDIV) {
      AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bV, flag), capturesOnly);
    }
  }
  if (RanksBrd[to] === RANKS.RANK_1) {
    // if (GameBoard.suspend > 0) return;
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bQ, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bT, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bM, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bR, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bB, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bN, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bZ, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bU, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bS, flag), capturesOnly);
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bW, flag), capturesOnly);
    // Divine Reckoning: include Valkyrie as a quiet promotion option for black
    if (GameBoard.blackArcane[4] & POWERBIT.modsDIV) {
      AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bV, flag), capturesOnly);
    }
  } else {
    AddQuietMove(
      MOVE(from, to, PIECES.EMPTY, PIECES.EMPTY, flag),
      capturesOnly
    );
  }
}

export const generatePlayableOptions = (
  forcedMoves,
  capturesOnly = false,
  type = '',
  type2 = '',
  userSummonPceRty = 0
) => {
  validMoves(type, type2, userSummonPceRty, capturesOnly);
};

// get binary representation of powers that are non-zero for the current player
export const generatePowers = () => {
  if (GameBoard.side === COLOURS.WHITE) {
    let powerBits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const powerTypes = {
      dyad: 0,
      sumn: 0,
      shft: 0,
      swap: 0,
      mods: 0,
      offr: 0,
      mori: 0,
      mora: 0,
      gain: 0,
      area: 0,
      tokn: 0,
    };

    // todo: this function needs to be generated on click on at least swap so piece movements like captures or other edge cases don't overlap

    _.forEach(whiteArcaneConfig, (value, key) => {
      const powerName = key.substring(0, 4);
      if (whiteArcaneConfig[key] > 0 || whiteArcaneConfig[key] === 'true') {
        powerTypes[powerName] |= POWERBIT[key];
      }
    });

    powerBits[0] |= powerTypes.dyad;
    powerBits[1] |= powerTypes.shft;
    powerBits[2] |= powerTypes.swap;
    powerBits[3] |= powerTypes.sumn;
    powerBits[4] |= powerTypes.mods;
    powerBits[5] |= powerTypes.offr;
    powerBits[6] |= powerTypes.mori;
    powerBits[7] |= powerTypes.mora;
    powerBits[8] |= powerTypes.gain;
    powerBits[9] |= powerTypes.area;
    powerBits[10] |= powerTypes.tokn;

    GameBoard.whiteArcane = powerBits;

    return powerBits;
  } else {
    let powerBits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const powerTypes = {
      dyad: 0,
      sumn: 0,
      shft: 0,
      swap: 0,
      mods: 0,
      offr: 0,
      mori: 0,
      mora: 0,
      gain: 0,
      area: 0,
      tokn: 0,
    };

    _.forEach(blackArcaneConfig, (value, key) => {
      const powerName = key.substring(0, 4);
      if (blackArcaneConfig[key] > 0 || blackArcaneConfig[key] === 'true') {
        powerTypes[powerName] |= POWERBIT[key];
      }
    });

    powerBits[0] |= powerTypes.dyad;
    powerBits[1] |= powerTypes.shft;
    powerBits[2] |= powerTypes.swap;
    powerBits[3] |= powerTypes.sumn;
    powerBits[4] |= powerTypes.mods;
    powerBits[5] |= powerTypes.offr;
    powerBits[6] |= powerTypes.mori;
    powerBits[7] |= powerTypes.mora;
    powerBits[8] |= powerTypes.gain;
    powerBits[9] |= powerTypes.area;
    powerBits[10] |= powerTypes.tokn;

    GameBoard.blackArcane = powerBits;

    return powerBits;
  }
};

export let herrings = [];
export let forcedEpAvailable;

export const getHerrings = (color) => {
  const herringsArr = [];

  // Get the OPPONENT's arcane to check their tokens
  // We need to know if the opponent's H-pieces are Hermit/Hemlock or base Herrings
  const opponentArcane =
    color === COLOURS.WHITE ? GameBoard.blackArcane : GameBoard.whiteArcane;

  // Check if opponent has Hermit or Hemlock token
  // If they do, their H-pieces are NOT herrings (don't need forced capture)
  const opponentHasHermitToken = (opponentArcane[10] & 1) !== 0;
  const opponentHasHemlockToken = (opponentArcane[10] & 2) !== 0;

  // Only collect opponent's H-pieces as herrings if opponent does NOT have Hermit or Hemlock token
  // When opponent has these tokens, their H-pieces become Hermit/Hemlock instead of Herring
  if (!opponentHasHermitToken && !opponentHasHemlockToken) {
    if (color === COLOURS.WHITE) {
      // White needs to capture Black's H-pieces (piece 20)
      GameBoard.pieces.forEach((piece, index) => {
        if (piece === 20) {
          herringsArr.push(index);
        }
      });
    }
    if (color === COLOURS.BLACK) {
      // Black needs to capture White's H-pieces (piece 15)
      GameBoard.pieces.forEach((piece, index) => {
        if (piece === 15) {
          herringsArr.push(index);
        }
      });
    }
  }

  return herringsArr;
};

// export const whiteTeleports = [
//   21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43,
//   44, 45, 46, 47, 48, 51, 52, 53, 54, 55, 56, 57, 58,
// ];
//
// export const blackTeleports = [
//   71, 72, 73, 74, 75, 76, 77, 78, 81, 82, 83, 84, 85, 86, 87, 88, 91, 92, 93,
//   94, 95, 96, 97, 98, 61, 62, 63, 64, 65, 66, 67, 68,
// ];

export function GenerateMoves(
  forcedMoves = true,
  capturesOnly = false,
  type = '',
  type2 = '',
  userSummonPceRty = 0
) {
  GameBoard.moveListStart[GameBoard.ply + 1] =
    GameBoard.moveListStart[GameBoard.ply];

  let pceType;
  let pceNum;
  let sq;
  // let sqP;
  let pceIndex = 0;
  let pce;
  let t_sq;
  let dir;
  let dyad;

  let currentArcanaSide =
    GameBoard.side === 0 ? GameBoard.whiteArcane : GameBoard.blackArcane;

  let has5thDimensionSword = currentArcanaSide[4] & 262144;
  let hasHermit = (currentArcanaSide[10] & 1) !== 0; // toknHER
  let hasHemlock = (currentArcanaSide[10] & 2) !== 0; // toknHEM

  let pawnCanShift = currentArcanaSide[1] & 1;
  let equusCanShift = currentArcanaSide[1] & 2;
  let bishopCanShift = currentArcanaSide[1] & 4;
  let rookCanShift = currentArcanaSide[1] & 8;
  let ghostCanShift = currentArcanaSide[1] & 32;
  let kingCanShift = currentArcanaSide[1] & 512;

  const herringArray = getHerrings(GameBoard.side);

  // note might need to revisit for computer having a herring
  // Don't force capture if player has Hermit OR Hemlock token
  if (forcedMoves && !hasHermit && !hasHemlock) {
    const herringsAttacked = () => {
      const tempHerrings = [];
      _.forEach(herringArray, (herringSq) => {
        if (SqAttacked(herringSq, GameBoard.side)) {
          tempHerrings.push(herringSq);
        }
      });
      return tempHerrings;
    };

    herrings = herringsAttacked();
  } else {
    herrings = [];
  }

  // White has modsTRO, so if Black is moving and can EP capture White, they must
  const activeWhiteForcedEpCapture =
    forcedMoves &&
    GameBoard.side === COLOURS.BLACK &&
    GameBoard.whiteArcane[4] & 2048 &&
    GameBoard.enPas !== SQUARES.NO_SQ &&
    GameBoard.suspend <= 0 &&
    (GameBoard.pieces[GameBoard.enPas + 9] === PIECES.bP ||
      GameBoard.pieces[GameBoard.enPas + 11] === PIECES.bP);
  // Black has modsTRO, so if White is moving and can EP capture Black, they must
  const activeBlackForcedEpCapture =
    forcedMoves &&
    GameBoard.side === COLOURS.WHITE &&
    GameBoard.blackArcane[4] & 2048 &&
    GameBoard.enPas !== SQUARES.NO_SQ &&
    GameBoard.suspend <= 0 &&
    (GameBoard.pieces[GameBoard.enPas - 9] === PIECES.wP ||
      GameBoard.pieces[GameBoard.enPas - 11] === PIECES.wP);

  forcedEpAvailable = activeWhiteForcedEpCapture || activeBlackForcedEpCapture;

  if (forcedEpAvailable) {
    GameBoard.troActive = 1;
  } else {
    GameBoard.troActive = 0;
  }

  const NZUBRMTQSWSQS = [[], []];

  // todo note does swap override entangle and suspend? I think so maybe no entangle though

  if (!activeWhiteForcedEpCapture && !activeBlackForcedEpCapture) {
    // SWAP ADJACENT 4
    for (let sq = 21; sq <= 98; sq++) {
      if (GameBoard.pieces[sq] === PIECES.EMPTY) {
        continue;
      }
      if (SQOFFBOARD(sq) === BOOL.TRUE) {
        continue;
      }
      if (PieceKing[GameBoard.pieces[sq]] === BOOL.TRUE) {
        continue;
      }
      if (herrings.length) {
        break;
      }
      if (type2 === 'ADJ' || type2 === 'COMP') {
        for (let i = 0; i < 4; i++) {
          dir = RkDir[i];
          t_sq = sq + dir;
          pce = GameBoard.pieces[t_sq];

          if (PieceKing[GameBoard.pieces[t_sq]] === BOOL.TRUE) {
            continue;
          }

          // no swapping into promotion
          if (
            (GameBoard.pieces[sq] === PIECES.wP &&
              GameBoard.whiteArcane[4] & 16 &&
              RanksBrd[t_sq] === RANKS.RANK_7) ||
            (pce === PIECES.wP &&
              GameBoard.whiteArcane[4] & 16 &&
              RanksBrd[sq] === RANKS.RANK_7) ||
            (GameBoard.pieces[sq] === PIECES.wP &&
              RanksBrd[t_sq] === RANKS.RANK_8) ||
            (pce === PIECES.wP && RanksBrd[sq] === RANKS.RANK_8)
          ) {
            continue;
          }
          if (
            (GameBoard.pieces[sq] === PIECES.bP &&
              GameBoard.blackArcane[4] & 16 &&
              RanksBrd[t_sq] === RANKS.RANK_2) ||
            (pce === PIECES.bP &&
              GameBoard.blackArcane[4] & 16 &&
              RanksBrd[sq] === RANKS.RANK_2) ||
            (GameBoard.pieces[sq] === PIECES.bP &&
              RanksBrd[t_sq] === RANKS.RANK_1) ||
            (pce === PIECES.bP && RanksBrd[sq] === RANKS.RANK_1)
          ) {
            continue;
          }

          if (GameBoard.pieces[sq] === GameBoard.pieces[t_sq]) {
            continue;
          }

          if (
            SQOFFBOARD(t_sq) === BOOL.FALSE &&
            pce !== PIECES.EMPTY &&
            GameBoard.pieces[sq] !== PIECES.EMPTY &&
            GameBoard.side === COLOURS.WHITE &&
            GameBoard.whiteArcane[2] & 2
          ) {
            AddCaptureMove(
              MOVE(
                sq,
                t_sq,
                GameBoard.pieces[t_sq],
                ARCANE_BIT_VALUES.ADJ,
                MFLAGSWAP
              ),
              false,
              capturesOnly
            );
          }
          if (
            SQOFFBOARD(t_sq) === BOOL.FALSE &&
            pce !== PIECES.EMPTY &&
            GameBoard.pieces[sq] !== PIECES.EMPTY &&
            GameBoard.side === COLOURS.BLACK &&
            GameBoard.blackArcane[2] & 2
          ) {
            AddCaptureMove(
              MOVE(
                sq,
                t_sq,
                GameBoard.pieces[t_sq],
                ARCANE_BIT_VALUES.ADJ,
                MFLAGSWAP
              ),
              false,
              capturesOnly
            );
          }
        }
      }
      if (
        PieceCol[GameBoard.pieces[sq]] === COLOURS.WHITE &&
        (GameBoard.pieces[sq] === PIECES.wN ||
          GameBoard.pieces[sq] === PIECES.wZ ||
          GameBoard.pieces[sq] === PIECES.wU ||
          GameBoard.pieces[sq] === PIECES.wB ||
          GameBoard.pieces[sq] === PIECES.wR ||
          GameBoard.pieces[sq] === PIECES.wM ||
          GameBoard.pieces[sq] === PIECES.wT ||
          GameBoard.pieces[sq] === PIECES.wQ ||
          GameBoard.pieces[sq] === PIECES.wS ||
          GameBoard.pieces[sq] === PIECES.wW)
      ) {
        NZUBRMTQSWSQS[COLOURS.WHITE].push(sq);
      }
      if (
        PieceCol[GameBoard.pieces[sq]] === COLOURS.BLACK &&
        (GameBoard.pieces[sq] === PIECES.bN ||
          GameBoard.pieces[sq] === PIECES.bZ ||
          GameBoard.pieces[sq] === PIECES.bU ||
          GameBoard.pieces[sq] === PIECES.bB ||
          GameBoard.pieces[sq] === PIECES.bR ||
          GameBoard.pieces[sq] === PIECES.bM ||
          GameBoard.pieces[sq] === PIECES.bT ||
          GameBoard.pieces[sq] === PIECES.bQ ||
          GameBoard.pieces[sq] === PIECES.bS ||
          GameBoard.pieces[sq] === PIECES.bW)
      ) {
        NZUBRMTQSWSQS[COLOURS.BLACK].push(sq);
      }
    }

    // SWAP DEP 2
    if (!herrings.length && (type2 === 'DEP' || type2 === 'COMP')) {
      for (let i = 0; i < NZUBRMTQSWSQS[GameBoard.side].length; i++) {
        for (let j = 0; j < NZUBRMTQSWSQS[GameBoard.side].length; j++) {
          if (
            i === j ||
            GameBoard.pieces[NZUBRMTQSWSQS[GameBoard.side][i]] ===
            GameBoard.pieces[NZUBRMTQSWSQS[GameBoard.side][j]]
          ) {
            continue;
          }
          if (
            GameBoard.side === COLOURS.WHITE &&
            GameBoard.whiteArcane[2] & 1 &&
            !herrings.length
          ) {
            AddCaptureMove(
              MOVE(
                NZUBRMTQSWSQS[COLOURS.WHITE][i],
                NZUBRMTQSWSQS[COLOURS.WHITE][j],
                GameBoard.pieces[NZUBRMTQSWSQS[COLOURS.WHITE][j]],
                ARCANE_BIT_VALUES.DEP,
                MFLAGSWAP
              ),
              false,
              capturesOnly
            );
          }
          if (
            GameBoard.side === COLOURS.BLACK &&
            GameBoard.blackArcane[2] & 1 &&
            !herrings.length
          ) {
            AddCaptureMove(
              MOVE(
                NZUBRMTQSWSQS[COLOURS.BLACK][i],
                NZUBRMTQSWSQS[COLOURS.BLACK][j],
                GameBoard.pieces[NZUBRMTQSWSQS[COLOURS.BLACK][j]],
                ARCANE_BIT_VALUES.DEP,
                MFLAGSWAP
              ),
              false,
              capturesOnly
            );
          }
        }
      }
    }

    if (type2 === 'ADJ' || type2 === 'DEP') return;

    // TRAMPLE - Generate trample moves for Equus pieces (Knight, Zebra, Unicorn)
    if (!herrings.length && !forcedEpAvailable && type === 'modsTRA') {
      const hasTrample = currentArcanaSide[4] & 67108864; // modsTRA bit
      
      if (hasTrample) {
        const equusPieces = GameBoard.side === COLOURS.WHITE
          ? [PIECES.wN, PIECES.wZ, PIECES.wU]
          : [PIECES.bN, PIECES.bZ, PIECES.bU];
        
        for (const pce of equusPieces) {
          const count = GameBoard.pceNum[pce] || 0;
          for (let idx = 0; idx < count; idx++) {
            const sq = GameBoard.pList[PCEINDEX(pce, idx)];
            
            // Check all knight-move directions
            for (let index = 0; index < 8; index++) {
              const dir = KnDir[index];
              const t_sq = sq + dir;
              
              if (SQOFFBOARD(t_sq) === BOOL.TRUE) continue;
              if (t_sq < 0 || t_sq > 119) continue;
              
              const targetPiece = GameBoard.pieces[t_sq];
              if (targetPiece === PIECES.EMPTY) continue;
              
              const targetPieceColor = PieceCol[targetPiece];
              if (targetPieceColor === GameBoard.side || targetPieceColor === COLOURS.BOTH) continue;
              
              // Add trample move: piece stays at sq, but eliminates target at t_sq
              // Using PROMOTED arg of 30 to mark this as a trample move
              AddCaptureMove(
                MOVE(sq, t_sq, targetPiece, 30, 0),
                false,
                capturesOnly
              );
            }
          }
        }
      }
    }
    
    if (type === 'modsTRA') return;

    // if (!herrings.length && !forcedEpAvailable && (type2 === 'TELEPORT' || type2 === 'COMP')) {
    //   const side = GameBoard.side;
    //   const arcanaOK =
    //     (side === COLOURS.WHITE && GameBoard.whiteArcane[1] & 16) ||
    //     (side === COLOURS.BLACK && GameBoard.blackArcane[1] & 16);
    //
    //   if (arcanaOK) {
    //     const teleportSquares =
    //       side === COLOURS.WHITE ? whiteTeleports : blackTeleports;
    //
    //     // Allowed pieces by side: N, U, Z, B, R
    //     const allowedPieces =
    //       side === COLOURS.WHITE
    //         ? [PIECES.wN, PIECES.wU, PIECES.wZ, PIECES.wB, PIECES.wR]
    //         : [PIECES.bN, PIECES.bU, PIECES.bZ, PIECES.bB, PIECES.bR];
    //
    //     for (const pce of allowedPieces) {
    //       const count = GameBoard.pceNum[pce] || 0;
    //       for (let idx = 0; idx < count; idx++) {
    //         const fromSq = GameBoard.pList[PCEINDEX(pce, idx)];
    //
    //         for (const toSq of teleportSquares) {
    //           if (GameBoard.pieces[toSq] === PIECES.EMPTY) {
    //             AddQuietMove(
    //               MOVE(fromSq, toSq, 31, 0, MFLAGSHFT),
    //               capturesOnly
    //             );
    //           }
    //         }
    //       }
    //     }
    //     return;
    //   }
    // }
    //
    // if (type2 === 'TELEPORT') return;

    // OFFERINGS
    let offeringIndex = LoopPcePrimeIndex[GameBoard.side];
    let offeringPce = LoopPcePrime[offeringIndex];
    let offeringSymbol = LoopPcePrimeSymbols[offeringIndex++];

    if (
      !herrings.length &&
      !forcedEpAvailable &&
      (type === 'OFFERING' || type === 'COMP')
    ) {
      while (offeringPce !== 0) {
        let offeringArcanaSide =
          GameBoard.side === COLOURS.WHITE
            ? GameBoard.whiteArcane[5]
            : GameBoard.blackArcane[5];

        let pceType = offeringPce;

        for (let pceNum = 0; pceNum < GameBoard.pceNum[offeringPce]; pceNum++) {
          let sq = GameBoard.pList[PCEINDEX(pceType, pceNum)];
          if (PieceCol[offeringPce] === GameBoard.side) {
            // pawn for herring
            if (
              offeringArcanaSide & 1 &&
              (('A' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (offeringSymbol === 'P') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 1, 0));
              }
            }
            // Q or T for 2 R
            if (
              offeringArcanaSide & 2 &&
              (('B' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (offeringSymbol === 'Q' || offeringSymbol === 'T') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 2, 0));
              }
            }
            // templar queen for equus family
            if (
              offeringArcanaSide & 4 &&
              (('C' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (offeringSymbol === 'Q' || offeringSymbol === 'T') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 3, 0));
              }
            }
            // B for R
            if (
              offeringArcanaSide & 8 &&
              (('D' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (
                offeringSymbol === 'N' ||
                offeringSymbol === 'Z' ||
                offeringSymbol === 'U' ||
                offeringSymbol === 'B'
              ) {
                addOfferingMove(MOVE(sq, 0, offeringPce, 4, 0));
              }
            }

            //////////
            // T / Q cha
            if (
              offeringArcanaSide & 16 &&
              (('E' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (offeringSymbol === 'Q') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 5, 0));
              }
              if (offeringSymbol === 'T') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 6, 0));
              }
            }
            // W / S cha
            if (
              offeringArcanaSide & 32 &&
              (('F' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (offeringSymbol === 'S') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 7, 0));
              }
              if (offeringSymbol === 'W') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 8, 0));
              }
            }

            //////////
            // M for Q or T
            if (
              offeringArcanaSide & 64 &&
              (('G' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (offeringSymbol === 'M') {
                addOfferingMove(MOVE(sq, 0, offeringPce, _.sample([9, 10]), 0));
              }
            }
            // R for S or W
            if (
              offeringArcanaSide & 128 &&
              (('H' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (offeringSymbol === 'R') {
                addOfferingMove(
                  MOVE(sq, 0, offeringPce, _.sample([11, 12]), 0)
                );
              }
            }

            // any
            if (
              offeringArcanaSide & 256 &&
              (('I' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              addOfferingMove(MOVE(sq, 0, offeringPce, 13, 0));
            }

            // offer for arcana
            if (
              offeringArcanaSide & 512 &&
              (('J' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (
                offeringSymbol === 'N' ||
                offeringSymbol === 'Z' ||
                offeringSymbol === 'U' ||
                offeringSymbol === 'B'
              ) {
                addOfferingMove(MOVE(sq, 0, offeringPce, 14, 0));
              }
            }
            // K
            if (
              offeringArcanaSide & 1024 &&
              (('K' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (offeringSymbol === 'Q') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 15, 0));
              }
              if (offeringSymbol === 'T') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 16, 0));
              }
              if (offeringSymbol === 'M') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 17, 0));
              }
              if (offeringSymbol === 'V') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 18, 0));
              }
            }
            // L
            if (
              offeringArcanaSide & 2048 &&
              (('L' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (offeringSymbol === 'P') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 19, 0));
              }
            }
            // M
            if (
              offeringArcanaSide & 4096 &&
              (('M' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (
                offeringSymbol === 'M' ||
                offeringSymbol === 'Q' ||
                offeringSymbol === 'T'
              ) {
                addOfferingMove(MOVE(sq, 0, offeringPce, 20, 0));
              }
            }
            // N
            if (
              offeringArcanaSide & 8192 &&
              (('N' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (
                offeringSymbol === 'M' ||
                offeringSymbol === 'Q' ||
                offeringSymbol === 'T'
              ) {
                addOfferingMove(MOVE(sq, 0, offeringPce, 21, 0));
              }
            }
            // O
            if (
              offeringArcanaSide & 16384 &&
              (('O' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (offeringSymbol === 'Q') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 22, 0));
              }
              if (offeringSymbol === 'T') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 23, 0));
              }
              if (offeringSymbol === 'M') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 24, 0));
              }
            }
            // Z
            if (
              offeringArcanaSide & 32768 &&
              (('Z' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (offeringSymbol === 'V') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 25, 0));
              }
            }
            // Q
            if (
              offeringArcanaSide & 65536 &&
              (('Q' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (offeringSymbol === 'Q' || offeringSymbol === 'T') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 26, 0));
              }
            }
            // R
            if (
              offeringArcanaSide & 131072 &&
              (('R' === userSummonPceRty && type === 'OFFERING') ||
                type !== 'OFFERING')
            ) {
              if (offeringSymbol === 'S' || offeringSymbol === 'W') {
                addOfferingMove(MOVE(sq, 0, offeringPce, 27, 0));
              }
            }
          }
        }
        offeringPce = LoopPcePrime[offeringIndex];
        offeringSymbol = LoopPcePrimeSymbols[offeringIndex++];
      }
    }

    if (type === 'OFFERING') return;

    // MAGNET (with black hole behavior)
    if (!herrings.length && !forcedEpAvailable && type === 'modsMAG') {
      const hasModsMAG = (GameBoard.side === COLOURS.WHITE && GameBoard.whiteArcane[4] & 32768) ||
        (GameBoard.side === COLOURS.BLACK && GameBoard.blackArcane[4] & 32768);

      if (hasModsMAG) {
        // Allow selecting any square on the board as magnet target
        for (let sq = 21; sq <= 98; sq++) {
          if (SQOFFBOARD(sq) === BOOL.FALSE) {
            // Magnet with black hole behavior: cap=31, prom=0
            addSummonMove(MOVE(sq, 0, 31, 0, 0));
          }
        }
      }
    }

    if (type === 'modsMAG') return;

    // SUMMONS
    let summonIndex = loopSummonIndex[GameBoard.side];
    let summonPce = loopSummon[summonIndex];
    let summonFlag = loopSummonFlag[summonIndex++];

    const whiteLimit =
      100 - 10 * (8 - (GameBoard.whiteArcane[4] & 512 ? 8 : 6));
    const blackLimit = 20 + 10 * (8 - (GameBoard.blackArcane[4] & 512 ? 8 : 6));

    GameBoard.summonRankLimits[0] = whiteLimit;
    GameBoard.summonRankLimits[1] = blackLimit;

    // todo remove to allow blocking with pieces or royalty or not?
    if (!herrings.length && !forcedEpAvailable) {
      // todo remove parent conditional with herring check because sumnE can block from a piece attacking herring
      const royaltyIndexes = {
        31: 1,
        32: 2,
        33: 3,
        34: 4,
        35: 5,
        36: 6,
        37: 7,
        38: 8,
        39: 9,
        40: 10,
        41: 11,
        42: 12,
        43: 13,
      };
      if (
        userSummonPceRty > 0 ||
        userSummonPceRty !== '' ||
        type !== 'SUMMON'
      ) {
        while (summonPce !== 0) {
          for (let sq = 21; sq <= 98; sq++) {
            if (
              SQOFFBOARD(sq) === BOOL.TRUE ||
              herrings.length ||
              capturesOnly
            ) {
              continue;
            }
            // Block summoning to en passant square when forced EP is active
            if (forcedEpAvailable && sq === GameBoard.enPas) {
              continue;
            }
            if (summonPce === PIECES.wP && summonFlag < 16384) {
              if (
                GameBoard.whiteArcane[4] & 16 &&
                RanksBrd[sq] === RANKS.RANK_7
              ) {
                continue;
              }
              if (RanksBrd[sq] === RANKS.RANK_8) {
                continue;
              }
            }
            if (summonPce === PIECES.bP && summonFlag < 16384) {
              if (
                GameBoard.blackArcane[4] & 16 &&
                RanksBrd[sq] === RANKS.RANK_2
              ) {
                continue;
              }
              if (RanksBrd[sq] === RANKS.RANK_1) {
                continue;
              }
            }
            if (GameBoard.side === COLOURS.WHITE) {
              if (sq < whiteLimit) {
                if (
                  summonFlag < 16384 &&
                  ((summonPce === userSummonPceRty && type === 'SUMMON') ||
                    type !== 'SUMMON') &&
                  GameBoard.pieces[sq] === PIECES.EMPTY &&
                  GameBoard.whiteArcane[3] & summonFlag
                ) {
                  addSummonMove(
                    MOVE(0, sq, PIECES.EMPTY, summonPce, MFLAGSUMN)
                  );
                } else if (
                  ((summonPce === userSummonPceRty && type === 'SUMMON') ||
                    type !== 'SUMMON') &&
                  summonFlag >= 16384 &&
                  summonFlag ===
                  POWERBIT[`sumnR${RtyChar.split('')[summonPce]}`] &&
                  summonFlag & GameBoard.whiteArcane[3]
                ) {
                  if (
                    GameBoard.royaltyQ[sq] > 0 ||
                    GameBoard.royaltyT[sq] > 0 ||
                    GameBoard.royaltyM[sq] > 0 ||
                    GameBoard.royaltyV[sq] > 0 ||
                    GameBoard.royaltyE[sq] > 0 ||
                    GameBoard.royaltyN[sq] > 0
                  ) {
                    continue;
                  }
                  // Check if trying to place royalty on a king in check
                  const pieceAtSq = GameBoard.pieces[sq];
                  const isKing =
                    pieceAtSq === PIECES.wK || pieceAtSq === PIECES.bK;
                  if (isKing && PieceCol[pieceAtSq] === GameBoard.side) {
                    // Check if king is in check (sq is the king's position)
                    if (SqAttacked(sq, GameBoard.side ^ 1) === BOOL.TRUE) {
                      // Only allow royalties that affect checking squares: E, X, Y, A, I
                      const royaltyChar = RtyChar.split('')[summonPce];
                      if (
                        royaltyChar !== 'E' &&
                        royaltyChar !== 'X' &&
                        royaltyChar !== 'Y' &&
                        royaltyChar !== 'A' &&
                        royaltyChar !== 'I'
                      ) {
                        continue;
                      }
                    }
                  }
                  addSummonMove(
                    MOVE(
                      0,
                      sq,
                      royaltyIndexes[summonPce],
                      PIECES.EMPTY,
                      MFLAGSUMN
                    )
                  );
                } else {
                  continue;
                }
              }
            } else if (GameBoard.side === COLOURS.BLACK) {
              if (sq > blackLimit) {
                if (
                  summonFlag < 16384 &&
                  ((summonPce === userSummonPceRty && type === 'SUMMON') ||
                    type !== 'SUMMON') &&
                  GameBoard.pieces[sq] === PIECES.EMPTY &&
                  GameBoard.blackArcane[3] & summonFlag
                ) {
                  addSummonMove(
                    MOVE(0, sq, PIECES.EMPTY, summonPce, MFLAGSUMN)
                  );
                } else if (
                  ((summonPce === userSummonPceRty && type === 'SUMMON') ||
                    type !== 'SUMMON') &&
                  summonFlag >= 16384 &&
                  summonFlag ===
                  POWERBIT[`sumnR${RtyChar.split('')[summonPce]}`] &&
                  summonFlag & GameBoard.blackArcane[3]
                ) {
                  if (
                    GameBoard.royaltyQ[sq] > 0 ||
                    GameBoard.royaltyT[sq] > 0 ||
                    GameBoard.royaltyM[sq] > 0 ||
                    GameBoard.royaltyV[sq] > 0 ||
                    GameBoard.royaltyE[sq] > 0 ||
                    GameBoard.royaltyF[sq] > 0
                  ) {
                    continue;
                  }
                  // Check if trying to place royalty on a king in check
                  const pieceAtSq = GameBoard.pieces[sq];
                  const isKing =
                    pieceAtSq === PIECES.wK || pieceAtSq === PIECES.bK;
                  if (isKing && PieceCol[pieceAtSq] === GameBoard.side) {
                    // Check if king is in check (sq is the king's position)
                    if (SqAttacked(sq, GameBoard.side ^ 1) === BOOL.TRUE) {
                      // Only allow royalties that affect checking squares: E, X, Y, A, I
                      const royaltyChar = RtyChar.split('')[summonPce];
                      if (
                        royaltyChar !== 'E' &&
                        royaltyChar !== 'X' &&
                        royaltyChar !== 'Y' &&
                        royaltyChar !== 'A' &&
                        royaltyChar !== 'I'
                      ) {
                        continue;
                      }
                    }
                  }
                  addSummonMove(
                    MOVE(
                      0,
                      sq,
                      royaltyIndexes[summonPce],
                      PIECES.EMPTY,
                      MFLAGSUMN
                    )
                  );
                } else {
                  continue;
                }
              }
            }
          }
          summonPce = loopSummon[summonIndex];
          summonFlag = loopSummonFlag[summonIndex++];
        }
      }
    }

    if (type === 'SUMMON') return;

    // if force ep or force herring?
    if (!herrings.length) {
      if (
        GameBoard.side === COLOURS.WHITE &&
        GameBoard.whiteArcane[4] &&
        16384
      ) {
        AddQuietMove(MOVE(0, 0, PIECES.EMPTY, 31, 0), capturesOnly);
      }
      if (
        GameBoard.side === COLOURS.BLACK &&
        GameBoard.blackArcane[4] &&
        16384
      ) {
        AddQuietMove(MOVE(0, 0, PIECES.EMPTY, 31, 0), capturesOnly);
      }
    }
  }

  // NOTE WHITE PAWN AND SPECIAL MOVES
  if (GameBoard.side === COLOURS.WHITE) {
    pceType = PIECES.wP;

    for (pceNum = 0; pceNum < GameBoard.pceNum[pceType]; pceNum++) {
      sq = GameBoard.pList[PCEINDEX(pceType, pceNum)];

      if (
        GameBoard.royaltyQ[sq] > 0 ||
        GameBoard.royaltyT[sq] > 0 ||
        GameBoard.royaltyM[sq] > 0 ||
        GameBoard.royaltyV[sq] > 0 ||
        GameBoard.royaltyE[sq] > 0
      ) {
        continue;
      }

      // note WHITE PAWN QUIET MOVES
      if (
        !activeBlackForcedEpCapture &&
        (GameBoard.dyad === 0 ||
          GameBoard.dyad === 1 ||
          GameBoard.dyad === 2) &&
        !herrings.length
      ) {
        // NORMAL PAWN MOVES
        if (GameBoard.pieces[sq + 10] === PIECES.EMPTY) {
          AddWhitePawnQuietMove(sq, sq + 10, 0, 0, capturesOnly);
        }
        if (
          (GameBoard.pieces[sq + 10] === PIECES.EMPTY &&
            GameBoard.pieces[sq + 20] === PIECES.EMPTY) ||
          // aetherstep
          (GameBoard.pieces[sq + 20] === PIECES.EMPTY &&
            GameBoard.whiteArcane[4] & 2)
        ) {
          if (RanksBrd[sq] === RANKS.RANK_1 || RanksBrd[sq] === RANKS.RANK_2) {
            if (GameBoard.pieces[sq + 20] === PIECES.EMPTY) {
              AddQuietMove(
                MOVE(sq, sq + 20, PIECES.EMPTY, PIECES.EMPTY, MFLAGPS),
                capturesOnly
              );
            }
          }
        }

        // note WHITE PAWN SHIFTS
        if (pawnCanShift) {
          if (GameBoard.pieces[sq - 1] === PIECES.EMPTY) {
            AddWhitePawnQuietMove(sq, sq - 1, 1, MFLAGSHFT, capturesOnly);
          }
          if (
            has5thDimensionSword &&
            (PieceCol[GameBoard.pieces[sq - 1]] === COLOURS.BLACK ||
              GameBoard.pieces[sq - 1] === PIECES.bX)
          ) {
            AddWhitePawnCaptureMove(
              sq,
              sq - 1,
              GameBoard.pieces[sq - 1],
              1,
              MFLAGSHFT,
              capturesOnly
            );
          }

          if (GameBoard.pieces[sq + 1] === PIECES.EMPTY) {
            AddWhitePawnQuietMove(sq, sq + 1, 1, MFLAGSHFT, capturesOnly);
          }
          if (
            has5thDimensionSword &&
            (PieceCol[GameBoard.pieces[sq + 1]] === COLOURS.BLACK ||
              GameBoard.pieces[sq + 1] === PIECES.bX)
          ) {
            AddWhitePawnCaptureMove(
              sq,
              sq + 1,
              GameBoard.pieces[sq + 1],
              1,
              MFLAGSHFT,
              capturesOnly
            );
          }

          if (GameBoard.pieces[sq - 10] === PIECES.EMPTY) {
            AddWhitePawnQuietMove(sq, sq - 10, 1, MFLAGSHFT, capturesOnly);
          }
          if (
            has5thDimensionSword &&
            (PieceCol[GameBoard.pieces[sq - 10]] === COLOURS.BLACK ||
              GameBoard.pieces[sq - 10] === PIECES.bX)
          ) {
            AddWhitePawnCaptureMove(
              sq,
              sq - 10,
              GameBoard.pieces[sq - 10],
              1,
              MFLAGSHFT,
              capturesOnly
            );
          }
        }
      }

      // note WHITE PAWN CAPTURES AND CONSUME

      // aether surge
      if (
        !activeBlackForcedEpCapture &&
        GameBoard.whiteArcane[4] & 131072 &&
        (RanksBrd[sq] === RANKS.RANK_2 || RanksBrd[sq] === RANKS.RANK_1) &&
        GameBoard.pieces[sq + 10] === PIECES.EMPTY &&
        (PieceCol[GameBoard.pieces[sq + 20]] === COLOURS.BLACK ||
          GameBoard.pieces[sq + 20] === PIECES.bX) &&
        (!herrings.length || _.includes(herrings, sq + 20))
      ) {
        AddCaptureMove(
          MOVE(sq, sq + 20, GameBoard.pieces[sq + 20], PIECES.EMPTY, MFLAGPS),
          capturesOnly
        );
      }

      if (
        !activeBlackForcedEpCapture &&
        ((SQOFFBOARD(sq + 9) === BOOL.FALSE && !herrings.length) ||
          (SQOFFBOARD(sq + 9) === BOOL.FALSE &&
            herrings.length &&
            _.includes(herrings, sq + 9)))
      ) {
        if (PieceCol[GameBoard.pieces[sq + 9]] === COLOURS.BLACK) {
          AddWhitePawnCaptureMove(
            sq,
            sq + 9,
            GameBoard.pieces[sq + 9],
            0,
            0,
            capturesOnly
          );
        }
        // note white pawn consume
        if (
          PieceCol[GameBoard.pieces[sq + 9]] === COLOURS.WHITE &&
          GameBoard.whiteArcane[4] & 1 &&
          !PieceKing[GameBoard.pieces[sq + 9]]
        ) {
          AddWhitePawnCaptureMove(
            sq,
            sq + 9,
            GameBoard.pieces[sq + 9],
            0,
            MFLAGCNSM,
            capturesOnly
          );
        }
      }

      if (
        (SQOFFBOARD(sq + 11) === BOOL.FALSE &&
          !herrings.length &&
          !activeBlackForcedEpCapture) ||
        (SQOFFBOARD(sq + 11) === BOOL.FALSE &&
          herrings.length &&
          _.includes(herrings, sq + 11))
      ) {
        if (PieceCol[GameBoard.pieces[sq + 11]] === COLOURS.BLACK) {
          AddWhitePawnCaptureMove(
            sq,
            sq + 11,
            GameBoard.pieces[sq + 11],
            0,
            0,
            capturesOnly
          );
        }
        // note white pawn consume
        if (
          PieceCol[GameBoard.pieces[sq + 11]] === COLOURS.WHITE &&
          GameBoard.whiteArcane[4] & 1 &&
          !PieceKing[GameBoard.pieces[sq + 11]]
        ) {
          AddWhitePawnCaptureMove(
            sq,
            sq + 11,
            GameBoard.pieces[sq + 11],
            0,
            MFLAGCNSM,
            capturesOnly
          );
        }
      }

      // NOTE WHITE EP
      const whiteHasGluttony = GameBoard.whiteArcane[4] & 64;
      const whiteDyadAorB = GameBoard.dyad === 1 || GameBoard.dyad === 2;
      const allowForcedDyadEP =
        activeBlackForcedEpCapture && whiteHasGluttony && whiteDyadAorB;

      if (GameBoard.dyad === 0 || allowForcedDyadEP) {
        // NOTE WHITE EP
        if (
          (GameBoard.enPas !== SQUARES.NO_SQ && !herrings.length) ||
          activeWhiteForcedEpCapture
        ) {
          if (sq + 9 === GameBoard.enPas) {
            if (
              GameBoard.whiteArcane[4] & 16 &&
              RanksBrd[sq + 9] === RANKS.RANK_7
            ) {
              AddEnPassantMove(
                MOVE(sq, sq + 9, GameBoard.pieces[sq - 1], PIECES.wQ, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 9, GameBoard.pieces[sq - 1], PIECES.wT, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 9, GameBoard.pieces[sq - 1], PIECES.wM, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 9, GameBoard.pieces[sq - 1], PIECES.wR, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 9, GameBoard.pieces[sq - 1], PIECES.wB, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 9, GameBoard.pieces[sq - 1], PIECES.wN, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 9, GameBoard.pieces[sq - 1], PIECES.wZ, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 9, GameBoard.pieces[sq - 1], PIECES.wU, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 9, GameBoard.pieces[sq - 1], PIECES.wS, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 9, GameBoard.pieces[sq - 1], PIECES.wW, MFLAGEP)
              );
            } else {
              AddEnPassantMove(
                MOVE(
                  sq,
                  sq + 9,
                  GameBoard.pieces[sq - 1],
                  PIECES.EMPTY,
                  MFLAGEP
                )
              );
            }
          }
          if (sq + 11 === GameBoard.enPas) {
            if (
              GameBoard.whiteArcane[4] & 16 &&
              RanksBrd[sq + 11] === RANKS.RANK_7
            ) {
              AddEnPassantMove(
                MOVE(sq, sq + 11, GameBoard.pieces[sq + 1], PIECES.wQ, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 11, GameBoard.pieces[sq + 1], PIECES.wT, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 11, GameBoard.pieces[sq + 1], PIECES.wM, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 11, GameBoard.pieces[sq + 1], PIECES.wR, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 11, GameBoard.pieces[sq + 1], PIECES.wB, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 11, GameBoard.pieces[sq + 1], PIECES.wN, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 11, GameBoard.pieces[sq + 1], PIECES.wZ, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 11, GameBoard.pieces[sq + 1], PIECES.wU, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 11, GameBoard.pieces[sq + 1], PIECES.wS, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq + 11, GameBoard.pieces[sq + 1], PIECES.wW, MFLAGEP)
              );
            } else {
              AddEnPassantMove(
                MOVE(
                  sq,
                  sq + 11,
                  GameBoard.pieces[sq + 1],
                  PIECES.EMPTY,
                  MFLAGEP
                )
              );
            }
          }
        }
      }
    }

    // WARNING, this will only work in a vanilla setup, no extra rooks
    if (!activeWhiteForcedEpCapture) {
      if (
        GameBoard.castlePerm & CASTLEBIT.WKCA &&
        !herrings.length &&
        GameBoard.pieces[SQUARES.E1] === PIECES.wK
      ) {
        if (GameBoard.blackArcane[4] & 8) {
          // todo remove
        } else {
          if (
            GameBoard.pieces[SQUARES.F1] === PIECES.EMPTY &&
            GameBoard.pieces[SQUARES.G1] === PIECES.EMPTY
          ) {
            if (
              (SqAttacked(SQUARES.F1, COLOURS.BLACK) === BOOL.FALSE &&
                SqAttacked(SQUARES.E1, COLOURS.BLACK) === BOOL.FALSE) ||
              GameBoard.whiteArcane[4] & 4
            ) {
              AddQuietMove(
                MOVE(
                  SQUARES.E1,
                  SQUARES.G1,
                  PIECES.EMPTY,
                  PIECES.EMPTY,
                  MFLAGCA
                ),
                capturesOnly
              );
            }
          }
        }
      }

      if (
        GameBoard.castlePerm & CASTLEBIT.WQCA &&
        !herrings.length &&
        GameBoard.pieces[SQUARES.E1] === PIECES.wK
      ) {
        if (GameBoard.blackArcane[4] & 8) {
          // randomize plus castle remove
        } else {
          if (
            GameBoard.pieces[SQUARES.D1] === PIECES.EMPTY &&
            GameBoard.pieces[SQUARES.C1] === PIECES.EMPTY &&
            GameBoard.pieces[SQUARES.B1] === PIECES.EMPTY
          ) {
            if (
              (SqAttacked(SQUARES.D1, COLOURS.BLACK) === BOOL.FALSE &&
                SqAttacked(SQUARES.E1, COLOURS.BLACK) === BOOL.FALSE) ||
              GameBoard.whiteArcane[4] & 4
            ) {
              AddQuietMove(
                MOVE(
                  SQUARES.E1,
                  SQUARES.C1,
                  PIECES.EMPTY,
                  PIECES.EMPTY,
                  MFLAGCA
                ),
                capturesOnly
              );
            }
          }
        }
      }
    }
  } else {
    // note BLACK PAWN AND SPECIAL MOVES
    pceType = PIECES.bP;

    for (pceNum = 0; pceNum < GameBoard.pceNum[pceType]; pceNum++) {
      sq = GameBoard.pList[PCEINDEX(pceType, pceNum)];

      if (
        GameBoard.royaltyQ[sq] > 0 ||
        GameBoard.royaltyT[sq] > 0 ||
        GameBoard.royaltyM[sq] > 0 ||
        GameBoard.royaltyV[sq] > 0 ||
        GameBoard.royaltyE[sq] > 0 ||
        GameBoard.royaltyF[sq] > 0
      ) {
        continue;
      }

      // note BLACK PAWN QUIET MOVES
      if (
        !activeWhiteForcedEpCapture &&
        (GameBoard.dyad === 0 ||
          GameBoard.dyad === 1 ||
          GameBoard.dyad === 2) &&
        !herrings.length
      ) {
        // NORMAL PAWN MOVES
        if (GameBoard.pieces[sq - 10] === PIECES.EMPTY) {
          AddBlackPawnQuietMove(sq, sq - 10, 0, 0, capturesOnly);
        }
        if (
          (GameBoard.pieces[sq - 10] === PIECES.EMPTY &&
            GameBoard.pieces[sq - 20] === PIECES.EMPTY) ||
          // aetherstep
          (GameBoard.pieces[sq - 20] === PIECES.EMPTY &&
            GameBoard.blackArcane[4] & 2)
        ) {
          if (RanksBrd[sq] === RANKS.RANK_8 || RanksBrd[sq] === RANKS.RANK_7) {
            if (GameBoard.pieces[sq - 20] === PIECES.EMPTY) {
              AddQuietMove(
                MOVE(sq, sq - 20, PIECES.EMPTY, PIECES.EMPTY, MFLAGPS),
                capturesOnly
              );
            }
          }
        }

        // note BLACK PAWN SHIFTS
        if (pawnCanShift) {
          if (GameBoard.pieces[sq - 1] === PIECES.EMPTY) {
            AddBlackPawnQuietMove(sq, sq - 1, 7, MFLAGSHFT, capturesOnly);
          }
          if (
            has5thDimensionSword &&
            (PieceCol[GameBoard.pieces[sq - 1]] === COLOURS.WHITE ||
              GameBoard.pieces[sq - 1] === PIECES.wX)
          ) {
            AddBlackPawnCaptureMove(
              sq,
              sq - 1,
              GameBoard.pieces[sq - 1],
              7,
              MFLAGSHFT,
              capturesOnly
            );
          }

          if (GameBoard.pieces[sq + 1] === PIECES.EMPTY) {
            AddBlackPawnQuietMove(sq, sq + 1, 7, MFLAGSHFT, capturesOnly);
          }
          if (
            has5thDimensionSword &&
            (PieceCol[GameBoard.pieces[sq + 1]] === COLOURS.WHITE ||
              GameBoard.pieces[sq + 1] === PIECES.wX)
          ) {
            AddBlackPawnCaptureMove(
              sq,
              sq + 1,
              GameBoard.pieces[sq + 1],
              7,
              MFLAGSHFT,
              capturesOnly
            );
          }

          if (GameBoard.pieces[sq + 10] === PIECES.EMPTY) {
            AddBlackPawnQuietMove(sq, sq + 10, 7, MFLAGSHFT, capturesOnly);
          }
          if (
            has5thDimensionSword &&
            (PieceCol[GameBoard.pieces[sq + 10]] === COLOURS.WHITE ||
              GameBoard.pieces[sq + 10] === PIECES.wX)
          ) {
            AddBlackPawnCaptureMove(
              sq,
              sq + 10,
              GameBoard.pieces[sq + 10],
              7,
              MFLAGSHFT,
              capturesOnly
            );
          }
        }
      }

      // note BLACK PAWN CAPTURES AND CONSUME

      // aether surge
      if (
        !activeWhiteForcedEpCapture &&
        GameBoard.blackArcane[4] & 131072 &&
        (RanksBrd[sq] === RANKS.RANK_7 || RanksBrd[sq] === RANKS.RANK_8) &&
        GameBoard.pieces[sq - 10] === PIECES.EMPTY &&
        (PieceCol[GameBoard.pieces[sq - 20]] === COLOURS.WHITE ||
          GameBoard.pieces[sq - 20] === PIECES.wX) &&
        (!herrings.length || _.includes(herrings, sq - 20))
      ) {
        AddCaptureMove(
          MOVE(sq, sq - 20, GameBoard.pieces[sq - 20], PIECES.EMPTY, MFLAGPS),
          capturesOnly
        );
      }

      if (
        (SQOFFBOARD(sq - 9) === BOOL.FALSE &&
          !herrings.length &&
          !activeWhiteForcedEpCapture) ||
        (SQOFFBOARD(sq - 9) === BOOL.FALSE &&
          herrings.length &&
          _.includes(herrings, sq - 9))
      ) {
        if (PieceCol[GameBoard.pieces[sq - 9]] === COLOURS.WHITE) {
          AddBlackPawnCaptureMove(
            sq,
            sq - 9,
            GameBoard.pieces[sq - 9],
            0,
            0,
            capturesOnly
          );
        }
        // note black pawn consume
        if (
          PieceCol[GameBoard.pieces[sq - 9]] === COLOURS.BLACK &&
          GameBoard.blackArcane[4] & 1 &&
          !PieceKing[GameBoard.pieces[sq - 9]]
        ) {
          AddBlackPawnCaptureMove(
            sq,
            sq - 9,
            GameBoard.pieces[sq - 9],
            0,
            MFLAGCNSM,
            capturesOnly
          );
        }
      }

      if (
        !activeWhiteForcedEpCapture &&
        ((SQOFFBOARD(sq - 11) === BOOL.FALSE && !herrings.length) ||
          (SQOFFBOARD(sq - 11) === BOOL.FALSE &&
            herrings.length &&
            _.includes(herrings, sq - 11)))
      ) {
        if (PieceCol[GameBoard.pieces[sq - 11]] === COLOURS.WHITE) {
          AddBlackPawnCaptureMove(
            sq,
            sq - 11,
            GameBoard.pieces[sq - 11],
            0,
            0,
            capturesOnly
          );
        }
        // note black pawn consume
        if (
          PieceCol[GameBoard.pieces[sq - 11]] === COLOURS.BLACK &&
          GameBoard.blackArcane[4] & 1 &&
          !PieceKing[GameBoard.pieces[sq - 11]]
        ) {
          AddBlackPawnCaptureMove(
            sq,
            sq - 11,
            GameBoard.pieces[sq - 11],
            0,
            MFLAGCNSM,
            capturesOnly
          );
        }
      }

      // note BLACK EP
      // note BLACK EP
      const blackHasGluttony = GameBoard.blackArcane[4] & 64;
      const blackDyadAorB = GameBoard.dyad === 1 || GameBoard.dyad === 2;
      const allowForcedDyadEP =
        activeWhiteForcedEpCapture && blackHasGluttony && blackDyadAorB;

      if (GameBoard.dyad === 0 || allowForcedDyadEP) {
        if (
          (GameBoard.enPas !== SQUARES.NO_SQ && !herrings.length) ||
          activeBlackForcedEpCapture
        ) {
          if (sq - 9 === GameBoard.enPas) {
            if (
              GameBoard.blackArcane[4] & 16 &&
              RanksBrd[sq - 9] === RANKS.RANK_2
            ) {
              AddEnPassantMove(
                MOVE(sq, sq - 9, GameBoard.pieces[sq + 1], PIECES.bQ, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 9, GameBoard.pieces[sq + 1], PIECES.bT, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 9, GameBoard.pieces[sq + 1], PIECES.bM, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 9, GameBoard.pieces[sq + 1], PIECES.bR, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 9, GameBoard.pieces[sq + 1], PIECES.bB, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 9, GameBoard.pieces[sq + 1], PIECES.bN, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 9, GameBoard.pieces[sq + 1], PIECES.bZ, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 9, GameBoard.pieces[sq + 1], PIECES.bU, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 9, GameBoard.pieces[sq + 1], PIECES.bS, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 9, GameBoard.pieces[sq + 1], PIECES.bW, MFLAGEP)
              );
            } else {
              AddEnPassantMove(
                MOVE(
                  sq,
                  sq - 9,
                  GameBoard.pieces[sq + 1],
                  PIECES.EMPTY,
                  MFLAGEP
                )
              );
            }
          }

          if (sq - 11 === GameBoard.enPas) {
            if (
              GameBoard.blackArcane[4] & 16 &&
              RanksBrd[sq - 11] === RANKS.RANK_2
            ) {
              AddEnPassantMove(
                MOVE(sq, sq - 11, GameBoard.pieces[sq - 1], PIECES.bQ, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 11, GameBoard.pieces[sq - 1], PIECES.bT, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 11, GameBoard.pieces[sq - 1], PIECES.bM, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 11, GameBoard.pieces[sq - 1], PIECES.bR, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 11, GameBoard.pieces[sq - 1], PIECES.bB, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 11, GameBoard.pieces[sq - 1], PIECES.bN, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 11, GameBoard.pieces[sq - 1], PIECES.bZ, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 11, GameBoard.pieces[sq - 1], PIECES.bU, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 11, GameBoard.pieces[sq - 1], PIECES.bZ, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 11, GameBoard.pieces[sq - 1], PIECES.bU, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 11, GameBoard.pieces[sq - 1], PIECES.bS, MFLAGEP)
              );
              AddEnPassantMove(
                MOVE(sq, sq - 11, GameBoard.pieces[sq - 1], PIECES.bW, MFLAGEP)
              );
            } else {
              AddEnPassantMove(
                MOVE(
                  sq,
                  sq - 11,
                  GameBoard.pieces[sq - 1],
                  PIECES.EMPTY,
                  MFLAGEP
                )
              );
            }
          }
        }
      }
    }

    // WARNING, this will only work in a vanilla setup, no extra rooks
    if (!forcedEpAvailable) {
      if (GameBoard.castlePerm & CASTLEBIT.BKCA && !herrings.length) {
        if (GameBoard.whiteArcane[4] & 8) {
          // removed randomize arcane
        } else {
          if (
            GameBoard.pieces[SQUARES.F8] === PIECES.EMPTY &&
            GameBoard.pieces[SQUARES.G8] === PIECES.EMPTY
          ) {
            if (
              (SqAttacked(SQUARES.F8, COLOURS.WHITE) === BOOL.FALSE &&
                SqAttacked(SQUARES.E8, COLOURS.WHITE) === BOOL.FALSE) ||
              GameBoard.blackArcane[4] & 4
            ) {
              AddQuietMove(
                MOVE(
                  SQUARES.E8,
                  SQUARES.G8,
                  PIECES.EMPTY,
                  PIECES.EMPTY,
                  MFLAGCA
                ),
                capturesOnly
              );
            }
          }
        }
      }

      if (GameBoard.castlePerm & CASTLEBIT.BQCA && !herrings.length) {
        if (GameBoard.whiteArcane[4] & 8) {
          // removed randomize arcane
        } else {
          if (
            GameBoard.pieces[SQUARES.D8] === PIECES.EMPTY &&
            GameBoard.pieces[SQUARES.C8] === PIECES.EMPTY &&
            GameBoard.pieces[SQUARES.B8] === PIECES.EMPTY
          ) {
            if (
              (SqAttacked(SQUARES.D8, COLOURS.WHITE) === BOOL.FALSE &&
                SqAttacked(SQUARES.E8, COLOURS.WHITE) === BOOL.FALSE) ||
              GameBoard.blackArcane[4] & 4
            ) {
              AddQuietMove(
                MOVE(
                  SQUARES.E8,
                  SQUARES.C8,
                  PIECES.EMPTY,
                  PIECES.EMPTY,
                  MFLAGCA
                ),
                capturesOnly
              );
            }
          }
        }
      }
    }
  }

  if (forcedEpAvailable && !herrings.length) return;

  // HOPPERS ROYALTY
  for (let i = 0; i < royaltyHoppers.length; i++) {
    const currentRoyalty = GameBoard[royaltyHopperMap[i]];
    _.forEach(currentRoyalty, (value, sqA) => {
      const sq = Number(sqA);
      const piece = GameBoard.pieces[sq];

      if (value <= 0) return;
      if (piece === PIECES.EMPTY) return;
      if (GameBoard.royaltyE[sq] > 0) return;
      if (PieceCol[piece] !== GameBoard.side) return;

      // KING WITH CASTLING RIGHTS NO ROYALTY
      if (
        GameBoard.side === COLOURS.WHITE &&
        GameBoard.castlePerm & CASTLEBIT.WKCA &&
        GameBoard.castlePerm & CASTLEBIT.WQCA &&
        piece === PIECES.wK
      ) {
        return;
      }
      if (
        GameBoard.side === COLOURS.BLACK &&
        GameBoard.castlePerm & CASTLEBIT.BKCA &&
        GameBoard.castlePerm & CASTLEBIT.BQCA &&
        piece === PIECES.bK
      ) {
        return;
      }

      for (let index = 0; index < DirNum[royaltyHoppers[i]]; index++) {
        dir = PceDir[royaltyHoppers[i]][index];
        t_sq = sq + dir;

        if (
          SQOFFBOARD(t_sq) === BOOL.TRUE ||
          GameBoard.pieces[t_sq] === undefined
        ) {
          continue;
        }
        if (GameBoard.pieces[t_sq] !== PIECES.EMPTY) {
          // note ROYALTY HOPPERS CAPTURES
          if (
            !herrings.length ||
            (herrings.length && _.includes(herrings, t_sq))
          ) {
            if (
              PieceCol[GameBoard.pieces[t_sq]] !== GameBoard.side &&
              PieceCol[GameBoard.pieces[t_sq]] !== COLOURS.BOTH
            ) {
              if (GameBoard.pieces[sq] === PIECES.wP) {
                AddWhitePawnCaptureMove(
                  sq,
                  t_sq,
                  GameBoard.pieces[t_sq],
                  PIECES.EMPTY,
                  0,
                  capturesOnly
                );
              } else if (GameBoard.pieces[sq] === PIECES.bP) {
                AddBlackPawnCaptureMove(
                  sq,
                  t_sq,
                  GameBoard.pieces[t_sq],
                  PIECES.EMPTY,
                  0,
                  capturesOnly
                );
              } else {
                AddCaptureMove(
                  MOVE(sq, t_sq, GameBoard.pieces[t_sq], PIECES.EMPTY, 0),
                  false,
                  capturesOnly
                );
              }
            }
          }

          // note ROYALTY HOPPERS CONSUME
          if (!herrings.length) {
            if (
              PieceCol[GameBoard.pieces[t_sq]] === GameBoard.side &&
              !PieceKing[GameBoard.pieces[t_sq]]
            ) {
              if (
                GameBoard.side === COLOURS.WHITE &&
                GameBoard.whiteArcane[4] & 1
              ) {
                if (GameBoard.pieces[sq] === PIECES.wP) {
                  AddWhitePawnCaptureMove(
                    sq,
                    t_sq,
                    GameBoard.pieces[t_sq],
                    PIECES.EMPTY,
                    MFLAGCNSM,
                    capturesOnly
                  );
                } else {
                  AddCaptureMove(
                    MOVE(
                      sq,
                      t_sq,
                      GameBoard.pieces[t_sq],
                      PIECES.EMPTY,
                      MFLAGCNSM
                    ),
                    true,
                    capturesOnly
                  );
                }
              }
              if (
                GameBoard.side === COLOURS.BLACK &&
                GameBoard.blackArcane[4] & 1
              ) {
                if (GameBoard.pieces[sq] === PIECES.bP) {
                  AddBlackPawnCaptureMove(
                    sq,
                    t_sq,
                    GameBoard.pieces[t_sq],
                    PIECES.EMPTY,
                    MFLAGCNSM,
                    capturesOnly
                  );
                } else {
                  AddCaptureMove(
                    MOVE(
                      sq,
                      t_sq,
                      GameBoard.pieces[t_sq],
                      PIECES.EMPTY,
                      MFLAGCNSM
                    ),
                    true,
                    capturesOnly
                  );
                }
              }
            }
          }
        }

        // note ROYALTY HOPPERS QUIET MOVES
        if (
          (GameBoard.dyad === 0 ||
            GameBoard.dyad === 1 ||
            GameBoard.dyad === dyad) &&
          !herrings.length &&
          GameBoard.pieces[t_sq] === PIECES.EMPTY
        ) {
          if (GameBoard.pieces[sq] === PIECES.wP) {
            AddWhitePawnQuietMove(sq, t_sq, PIECES.EMPTY, 0, capturesOnly);
          } else if (GameBoard.pieces[sq] === PIECES.bP) {
            AddBlackPawnQuietMove(sq, t_sq, PIECES.EMPTY, 0, capturesOnly);
          } else {
            AddQuietMove(
              MOVE(sq, t_sq, PIECES.EMPTY, PIECES.EMPTY, 0),
              capturesOnly
            );
          }
        }
      }
    });
  }

  // SLIDERS ROYALTY
  for (let i = 0; i < royaltySliders.length; i++) {
    if (type2 === 'TELEPORT') break;
    const currentRoyalty = GameBoard[royaltySliderMap[i]];
    _.forEach(currentRoyalty, (value, sqA) => {
      const sq = Number(sqA);
      const piece = GameBoard.pieces[sq];

      if (value <= 0) return;
      if (piece === PIECES.EMPTY) return;
      if (GameBoard.royaltyE[sq] > 0) return;
      if (PieceCol[piece] !== GameBoard.side) return;

      // KING WITH CASTLING RIGHTS NO ROYALTY
      if (
        GameBoard.side === COLOURS.WHITE &&
        GameBoard.castlePerm & CASTLEBIT.WKCA &&
        GameBoard.castlePerm & CASTLEBIT.WQCA &&
        piece === PIECES.wK
      ) {
        return;
      }
      if (
        GameBoard.side === COLOURS.BLACK &&
        GameBoard.castlePerm & CASTLEBIT.BKCA &&
        GameBoard.castlePerm & CASTLEBIT.BQCA &&
        piece === PIECES.bK
      ) {
        return;
      }

      for (let index = 0; index < DirNum[royaltySliders[i]]; index++) {
        dir = PceDir[royaltySliders[i]][index];
        t_sq = sq + dir;

        while (
          SQOFFBOARD(t_sq) === BOOL.FALSE &&
          GameBoard.pieces[t_sq] !== undefined
        ) {
          // Check if we encountered a piece
          if (GameBoard.pieces[t_sq] !== PIECES.EMPTY) {
            // note ROYALTY SLIDERS CAPTURES
            if (
              PieceCol[GameBoard.pieces[t_sq]] !== GameBoard.side &&
              PieceCol[GameBoard.pieces[t_sq]] !== COLOURS.BOTH
            ) {
              if (
                !herrings.length ||
                (herrings.length && _.includes(herrings, t_sq))
              ) {
                if (GameBoard.pieces[sq] === PIECES.wP) {
                  AddWhitePawnCaptureMove(
                    sq,
                    t_sq,
                    GameBoard.pieces[t_sq],
                    PIECES.EMPTY,
                    0,
                    capturesOnly
                  );
                } else if (GameBoard.pieces[sq] === PIECES.bP) {
                  AddBlackPawnCaptureMove(
                    sq,
                    t_sq,
                    GameBoard.pieces[t_sq],
                    PIECES.EMPTY,
                    0,
                    capturesOnly
                  );
                } else {
                  AddCaptureMove(
                    MOVE(sq, t_sq, GameBoard.pieces[t_sq], PIECES.EMPTY, 0),
                    false,
                    capturesOnly
                  );
                }
              }
            }

            // note ROYALTY SLIDERS CONSUME
            else if (
              PieceCol[GameBoard.pieces[t_sq]] === GameBoard.side &&
              !PieceKing[GameBoard.pieces[t_sq]] &&
              !herrings.length
            ) {
              if (
                (GameBoard.side === COLOURS.WHITE &&
                  GameBoard.whiteArcane[4] & 1) ||
                (GameBoard.side === COLOURS.BLACK &&
                  GameBoard.blackArcane[4] & 1)
              ) {
                if (GameBoard.pieces[sq] === PIECES.wP) {
                  AddWhitePawnCaptureMove(
                    sq,
                    t_sq,
                    GameBoard.pieces[t_sq],
                    PIECES.EMPTY,
                    MFLAGCNSM,
                    capturesOnly
                  );
                } else if (GameBoard.pieces[sq] === PIECES.bP) {
                  AddBlackPawnCaptureMove(
                    sq,
                    t_sq,
                    GameBoard.pieces[t_sq],
                    PIECES.EMPTY,
                    MFLAGCNSM,
                    capturesOnly
                  );
                } else {
                  AddCaptureMove(
                    MOVE(
                      sq,
                      t_sq,
                      GameBoard.pieces[t_sq],
                      PIECES.EMPTY,
                      MFLAGCNSM
                    ),
                    true,
                    capturesOnly
                  );
                }
              }
            }
            break;
          }

          // note ROYALTY SLIDERS QUIET MOVES
          if (
            (GameBoard.dyad === 0 ||
              GameBoard.dyad === 1 ||
              GameBoard.dyad === dyad) &&
            GameBoard.pieces[t_sq] === PIECES.EMPTY
          ) {
            if (
              !herrings.length ||
              (herrings.length && _.includes(herrings, t_sq))
            ) {
              if (GameBoard.pieces[sq] === PIECES.wP) {
                AddWhitePawnQuietMove(sq, t_sq, PIECES.EMPTY, 0, capturesOnly);
              } else if (GameBoard.pieces[sq] === PIECES.bP) {
                AddBlackPawnQuietMove(sq, t_sq, PIECES.EMPTY, 0, capturesOnly);
              } else {
                AddQuietMove(
                  MOVE(sq, t_sq, PIECES.EMPTY, PIECES.EMPTY, 0),
                  capturesOnly
                );
              }
            }
          }
          t_sq += dir;
        }
      }
    });
  }

  pceIndex = LoopNonSlideIndex[GameBoard.side];
  pce = LoopNonSlidePce[pceIndex];
  dyad = LoopNonSlideDyad[pceIndex++];

  // HOPPERS
  while (pce !== 0) {
    for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; pceNum++) {
      sq = GameBoard.pList[PCEINDEX(pce, pceNum)];

      const isOverrided =
        GameBoard.royaltyQ[sq] > 0 ||
        GameBoard.royaltyT[sq] > 0 ||
        GameBoard.royaltyM[sq] > 0 ||
        GameBoard.royaltyV[sq] > 0 ||
        GameBoard.royaltyE[sq] > 0;

      if (!isOverrided) {
        let dirVariants = DirNum[pce];
        let dirArray = PceDir[pce];

        // H-pieces don't use standard PceDir if they have tokens (Hermit/Hemlock)
        // This ensures Hermit/Hemlock don't inherit the base Herring movement
        if (pce === PIECES.wH || pce === PIECES.bH) {
          const arcane =
            GameBoard.side === COLOURS.WHITE
              ? GameBoard.whiteArcane
              : GameBoard.blackArcane;
          if ((arcane[10] & 1) !== 0 || (arcane[10] & 2) !== 0) {
            dirVariants = 0;
            dirArray = [];
          }
        }

        if (
          pce === PIECES.wT ||
          pce === PIECES.bT ||
          pce === PIECES.wM ||
          pce === PIECES.bM
        ) {
          dirVariants = 8;
          dirArray = KnDir;
        }

        let eCanShift = false;
        if (pce === PIECES.wN || pce === PIECES.wZ || pce === PIECES.wU) {
          eCanShift = equusCanShift;
        } else if (
          pce === PIECES.bN ||
          pce === PIECES.bZ ||
          pce === PIECES.bU
        ) {
          eCanShift = equusCanShift;
        }

        let sCanShift = false;
        if (pce === PIECES.wS) {
          sCanShift = ghostCanShift;
        } else if (pce === PIECES.bS) {
          sCanShift = ghostCanShift;
        }

        let wCanShift = false;
        if (pce === PIECES.wW) {
          wCanShift = ghostCanShift;
        } else if (pce === PIECES.bW) {
          wCanShift = ghostCanShift;
        }

        for (let index = 0; index < dirVariants; index++) {
          let dir = dirArray[index];
          t_sq = sq + dir;

          if (SQOFFBOARD(t_sq) === BOOL.TRUE) {
            continue;
          }

          if (t_sq < 0 || t_sq > 119) continue;

          if (
            !herrings.length ||
            (herrings.length && _.includes(herrings, t_sq))
          ) {
            if (GameBoard.pieces[t_sq] !== PIECES.EMPTY) {
              const targetPieceColor = PieceCol[GameBoard.pieces[t_sq]];

              // H-piece uses shift movement system, skip standard capture
              // UNLESS it is a Nomad (Hermit + Hemlock tokens) AND has 5D Sword
              if (pce === PIECES.wH || pce === PIECES.bH) {
                const hasHermit = (currentArcanaSide[10] & 1) !== 0;
                const hasHemlock = (currentArcanaSide[10] & 2) !== 0;

                if (hasHermit || hasHemlock) continue;
              }

              if (
                targetPieceColor !== GameBoard.side &&
                targetPieceColor !== COLOURS.BOTH
              ) {
                AddCaptureMove(
                  MOVE(sq, t_sq, GameBoard.pieces[t_sq], PIECES.EMPTY, 0),
                  false,
                  capturesOnly
                );
              }
            }
          }

          if (SQOFFBOARD(t_sq) === BOOL.FALSE && !herrings.length) {
            if (
              PieceCol[GameBoard.pieces[t_sq]] === GameBoard.side &&
              !PieceKing[GameBoard.pieces[t_sq]]
            ) {
              const canConsume =
                (GameBoard.side === COLOURS.WHITE &&
                  GameBoard.whiteArcane[4] & 1 &&
                  !(
                    pce === PIECES.wK &&
                    GameBoard.castlePerm & CASTLEBIT.WKCA &&
                    GameBoard.castlePerm & CASTLEBIT.WQCA
                  )) ||
                (GameBoard.side === COLOURS.BLACK &&
                  GameBoard.blackArcane[4] & 1 &&
                  !(
                    pce === PIECES.bK &&
                    GameBoard.castlePerm & CASTLEBIT.BKCA &&
                    GameBoard.castlePerm & CASTLEBIT.BQCA
                  ));

              if (
                (pce === PIECES.wH || pce === PIECES.bH) &&
                !(currentArcanaSide[4] & 1048576)
              )
                continue;
              if (canConsume) {
                AddCaptureMove(
                  MOVE(
                    sq,
                    t_sq,
                    GameBoard.pieces[t_sq],
                    PIECES.EMPTY,
                    MFLAGCNSM
                  ),
                  true,
                  capturesOnly
                );
              }
            }
          }

          if (
            (GameBoard.dyad === 0 ||
              GameBoard.dyad === 1 ||
              GameBoard.dyad === dyad) &&
            !herrings.length &&
            SQOFFBOARD(t_sq) === BOOL.FALSE &&
            GameBoard.pieces[t_sq] === PIECES.EMPTY
          ) {
            AddQuietMove(
              MOVE(sq, t_sq, PIECES.EMPTY, PIECES.EMPTY, 0),
              capturesOnly
            );
          }
        }

        const pieces = GameBoard.pieces;
        const side = GameBoard.side;
        const wantE = eCanShift;
        const wantS = sCanShift;
        const wantW = wCanShift;

        const hasHermit = (currentArcanaSide[10] & 1) !== 0;
        const hasHemlock = (currentArcanaSide[10] & 2) !== 0;
        const isNomad = hasHermit && hasHemlock;
        const isHermit = hasHermit && (pce === PIECES.wH || pce === PIECES.bH);
        const isHemlock =
          hasHemlock && (pce === PIECES.wH || pce === PIECES.bH);
        const isHUnit = pce === PIECES.wH || pce === PIECES.bH;

        const wantHermit = isHermit;
        const wantHemlock = isHemlock;
        const wantNomad = isNomad && (pce === PIECES.wH || pce === PIECES.bH);

        // Shogun is a king-specific shift: only enable it when the mover is a King
        const wantShogun =
          kingCanShift && (pce === PIECES.wK || pce === PIECES.bK);

        const wantBanS =
          currentArcanaSide[4] & 2097152 &&
          (pce === PIECES.wS || pce === PIECES.bS);
        // const wantBanW =
        //   currentArcanaSide[4] & 2097152 &&
        //   (pce === PIECES.wW || pce === PIECES.bW);

        const canQuiet = !capturesOnly && !herrings.length;

        const runShift = (dirCount, getDir, canCapture = true) => {
          for (let i = 0; i < dirCount; i++) {
            const targetSq = sq + getDir(i);
            if (SQOFFBOARD(targetSq) === BOOL.TRUE) continue;

            const targetPiece = pieces[targetSq];

            // Your array-based herring filter (allow all if none provided)
            const herringAllowed =
              !herrings.length ||
              (herrings.length && _.includes(herrings, targetSq));

            // QUIET shift only if empty
            if (targetPiece === PIECES.EMPTY) {
              if (canQuiet && herringAllowed) {
                AddQuietMove(
                  MOVE(sq, targetSq, PIECES.EMPTY, pce, MFLAGSHFT),
                  capturesOnly
                );
              }
              continue; // don’t also consider capture on the same empty square
            }

            // CAPTURE shift only if enemy present
            if (
              canCapture &&
              (has5thDimensionSword || wantShogun) &&
              GameBoard.pieces[targetSq] !== PIECES.EMPTY &&
              PieceCol[targetPiece] !== side &&
              herringAllowed
            ) {
              AddCaptureMove(
                MOVE(sq, targetSq, targetPiece, pce, MFLAGSHFT),
                false,
                capturesOnly
              );
            }
          }
        };

        if (wantE) runShift(8, (i) => KiDir[i]);
        if (wantS) runShift(12, (i) => WrDir[i]);
        if (wantW) runShift(12, (i) => SpDir[i]);

        // H-Unit Logic: Token-driven movement generation
        if (isHUnit) {
          // Helper function for H-Unit natural movement (no shift flag)
          const runNaturalMovement = (dirCount, getDir) => {
            for (let i = 0; i < dirCount; i++) {
              const targetSq = sq + getDir(i);
              if (SQOFFBOARD(targetSq) === BOOL.TRUE) continue;

              const targetPiece = pieces[targetSq];

              const herringAllowed =
                !herrings.length ||
                (herrings.length && _.includes(herrings, targetSq));

              // QUIET moves only (H-Units cannot capture without 5D Sword)
              if (targetPiece === PIECES.EMPTY) {
                if (canQuiet && herringAllowed) {
                  AddQuietMove(
                    MOVE(
                      sq,
                      targetSq,
                      PIECES.EMPTY,
                      PIECES.EMPTY,
                      0 // NO SHIFT FLAG - this is natural movement
                    ),
                    capturesOnly
                  );
                }
              }
              // CAPTURE: Allow with 5D Sword OR if this is a Hemlock piece
              else if (
                (has5thDimensionSword || isHemlock) &&
                PieceCol[targetPiece] !== side &&
                herringAllowed
              ) {
                AddCaptureMove(
                  MOVE(
                    sq,
                    targetSq,
                    targetPiece,
                    PIECES.EMPTY,
                    0 // NO SHIFT FLAG - this is natural movement
                  ),
                  false,
                  capturesOnly
                );
              }
            }
          };

          // 1. Herring Pattern (HrDir)
          // Handled by standard loop (PceDir) for Pure Herring.
          // For Nomad (who has tokens), standard loop is disabled, so we add it here.
          // This is NATURAL movement for Nomad - does NOT require shift spells
          if (wantNomad) {
            runNaturalMovement(6, (i) => HrDir[i]);
          }

          // 2. Hermit Pattern (HerShftDir)
          // Active for: Hermit OR Nomad
          // This is the Hermit's NATURAL movement pattern - does NOT require shift spells
          if (wantHermit || wantNomad) {
            runNaturalMovement(6, (i) => HerShftDir[i]);
          }

          // 3. Hemlock Pattern (HemlockHopA)
          // Active for: Hemlock OR Nomad
          // This is the Hemlock's NATURAL movement pattern - does NOT require shift spells
          if (wantHemlock || wantNomad) {
            runNaturalMovement(12, (i) => HemlockHopA[i]);
            // uncomment below for hemlock ext (HemlockHopB pattern)
            // runNaturalMovement(4, (i) => HemlockHopB[i]);
          }
        }

        if (wantBanS) runShift(12, (i) => BanDirSp[i], false);
        // if (wantBanW) runShift(12, (i) => BanDirWr[i], false);

        if (wantShogun) runShift(16, (i) => ShoDir[i], true);
      }
    }
    pce = LoopNonSlidePce[pceIndex];
    dyad = LoopNonSlideDyad[pceIndex++];

    // --- ECLIPSE (shftI) generic hop-over shift ---
    // Prevent Eclipse's adjacent-hop from applying to Unicorn/Zebra,
    // but still allow the cross-board (edge-wrap) Eclipse for them.
    const hasShftIBit = (currentArcanaSide[1] & POWERBIT.shftI) !== 0;

    for (let sqIter = 21; sqIter <= 98; sqIter++) {
      if (SQOFFBOARD(sqIter) === BOOL.TRUE) continue;
      const mover = GameBoard.pieces[sqIter];
      if (mover === PIECES.EMPTY) continue;
      if (PieceCol[mover] !== GameBoard.side) continue;

      // exclude pawns/kings from Eclipse logic
      if (
        mover === PIECES.wP ||
        mover === PIECES.bP ||
        mover === PIECES.wK ||
        mover === PIECES.bK
      )
        continue;

      // if mover is currently overridden by a royalty effect, skip
      if (
        GameBoard.royaltyQ[sqIter] > 0 ||
        GameBoard.royaltyT[sqIter] > 0 ||
        GameBoard.royaltyM[sqIter] > 0 ||
        GameBoard.royaltyV[sqIter] > 0 ||
        GameBoard.royaltyE[sqIter] > 0
      )
        continue;

      // Detect if the side has more-specific shifts for this mover.
      const cs = currentArcanaSide[1];
      let pieceHasSpecific = false;
      if (
        (cs & 2) !== 0 &&
        (mover === PIECES.wZ ||
          mover === PIECES.bZ ||
          mover === PIECES.wU ||
          mover === PIECES.bU ||
          mover === PIECES.wW ||
          mover === PIECES.bW ||
          mover === PIECES.wX ||
          mover === PIECES.bX)
      )
        pieceHasSpecific = true;
      if ((cs & 32) !== 0 && (mover === PIECES.wS || mover === PIECES.bS))
        pieceHasSpecific = true;
      if ((cs & 32) !== 0 && (mover === PIECES.wW || mover === PIECES.bW))
        pieceHasSpecific = true;
      // shftH (bit 64) removed - Hermit no longer has a specific shift spell
      if ((cs & 512) !== 0 && (mover === PIECES.wK || mover === PIECES.bK))
        pieceHasSpecific = true;

      // If shftI is not available skip entirely.
      if (!hasShftIBit) continue;

      const canQuiet = !capturesOnly && !herrings.length;

      // BLOCK ECLIPSE ADJACENT-HOP FOR PIECES WITH OVERLAPPING NATURAL MOVEMENT
      // Unicorn/Zebra/Wraith/Exile: natural knight-like jumps overlap with Eclipse hops
      const isUnicornOrZebraOrWraithOrExile =
        mover === PIECES.wU ||
        mover === PIECES.bU ||
        mover === PIECES.wZ ||
        mover === PIECES.bZ ||
        mover === PIECES.wW ||
        mover === PIECES.bW ||
        mover === PIECES.wX ||
        mover === PIECES.bX;

      // ----- Adjacent hop (orth/diag) -----
      if (!isUnicornOrZebraOrWraithOrExile) {
        for (let dirIndex = 0; dirIndex < KiDir.length; dirIndex++) {
          const dir = KiDir[dirIndex];
          const adj = sqIter + dir;
          if (SQOFFBOARD(adj) === BOOL.TRUE) continue;
          if (adj < 0 || adj > 119) continue;

          // need a piece to hop over
          if (GameBoard.pieces[adj] === PIECES.EMPTY) continue;

          const land = adj + dir;
          if (SQOFFBOARD(land) === BOOL.TRUE) continue;
          if (land < 0 || land > 119) continue;
          if (GameBoard.pieces[land] !== PIECES.EMPTY) continue;

          if (herrings.length && !_.includes(herrings, land)) continue;

          // choose what to consume: specific shift > shftI > mover
          let promotedForMove;
          if (pieceHasSpecific) promotedForMove = mover;
          else if (hasShftIBit) promotedForMove = 31;
          else promotedForMove = mover;

          if (canQuiet) {
            AddQuietMove(
              MOVE(sqIter, land, PIECES.EMPTY, promotedForMove, MFLAGSHFT),
              capturesOnly
            );
          }
        }
      }

      // ----- Cross-board (edge-wrap) Eclipse — ALWAYS allowed (incl. U/Z) -----
      const file = sqIter % 10;
      if (file === 1 || file === 8) {
        const edgeOffsets = file === 1 ? [17, 7, -3] : [3, -7, -17];
        for (const off of edgeOffsets) {
          const dest = sqIter + off;
          if (dest < 0 || dest > 119) continue;
          if (SQOFFBOARD(dest) === BOOL.TRUE) continue;
          if (GameBoard.pieces[dest] !== PIECES.EMPTY) continue;
          if (herrings.length && !_.includes(herrings, dest)) continue;

          let promotedForEdge;
          if (pieceHasSpecific) promotedForEdge = mover;
          else if (hasShftIBit) promotedForEdge = 31;
          else promotedForEdge = mover;

          AddQuietMove(
            MOVE(sqIter, dest, PIECES.EMPTY, promotedForEdge, MFLAGSHFT),
            capturesOnly
          );
        }
      }
    }
  }

  pceIndex = LoopSlideIndex[GameBoard.side];
  pce = LoopSlidePce[pceIndex];
  dyad = LoopSlideDyad[pceIndex++];

  // SLIDERS
  while (pce !== 0) {
    for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; pceNum++) {
      const sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
      const isOverrided =
        GameBoard.royaltyQ[sq] > 0 ||
        GameBoard.royaltyT[sq] > 0 ||
        GameBoard.royaltyM[sq] > 0 ||
        GameBoard.royaltyV[sq] > 0 ||
        GameBoard.royaltyE[sq] > 0;

      if (!isOverrided) {
        const origPce = pce;
        let slidePce = origPce;
        const arc4 =
          GameBoard.side === COLOURS.WHITE
            ? GameBoard.whiteArcane[4]
            : GameBoard.blackArcane[4];

        if (origPce === PIECES.wV) {
          if (arc4 & 256) {
            slidePce = PIECES.wQ;
          } else {
            continue;
          }
        }
        if (origPce === PIECES.bV) {
          if (arc4 & 256) {
            slidePce = PIECES.bQ;
          } else {
            continue;
          }
        }
        if (origPce === PIECES.wW) {
          if (arc4 & 256) {
            slidePce = PIECES.wB;
          } else {
            continue;
          }
        }
        if (origPce === PIECES.bW) {
          if (arc4 & 256) {
            slidePce = PIECES.bB;
          } else {
            continue;
          }
        }

        for (let index = 0; index < DirNum[slidePce]; index++) {
          const dir = PceDir[slidePce][index];
          let t_sq = sq + dir;
          let rDir, bDir, shft_t_R_sq, shft_t_B_sq;

          if (
            slidePce === PIECES.wB ||
            slidePce === PIECES.wR ||
            slidePce === PIECES.bB ||
            slidePce === PIECES.bR
          ) {
            rDir = RkDir[index];
            bDir = BiDir[index];

            shft_t_B_sq = sq + rDir;
            shft_t_R_sq = sq + bDir;
          }

          while (
            SQOFFBOARD(t_sq) === BOOL.FALSE &&
            GameBoard.pieces[t_sq] !== undefined
          ) {
            // note SLIDERS CAPTURES
            if (GameBoard.pieces[t_sq] !== PIECES.EMPTY) {
              if (
                PieceCol[GameBoard.pieces[t_sq]] !== GameBoard.side &&
                PieceCol[GameBoard.pieces[t_sq]] !== COLOURS.BOTH
              ) {
                if (
                  !herrings.length ||
                  (herrings.length && _.includes(herrings, t_sq))
                ) {
                  AddCaptureMove(
                    MOVE(sq, t_sq, GameBoard.pieces[t_sq], PIECES.EMPTY, 0),
                    false,
                    capturesOnly
                  );
                }
              }

              // note SLIDERS CONSUME
              else if (
                PieceCol[GameBoard.pieces[t_sq]] === GameBoard.side &&
                !PieceKing[GameBoard.pieces[t_sq]] &&
                !herrings.length
              ) {
                if (
                  (GameBoard.side === COLOURS.WHITE &&
                    GameBoard.whiteArcane[4] & 1) ||
                  (GameBoard.side === COLOURS.BLACK &&
                    GameBoard.blackArcane[4] & 1)
                ) {
                  AddCaptureMove(
                    MOVE(
                      sq,
                      t_sq,
                      GameBoard.pieces[t_sq],
                      PIECES.EMPTY,
                      MFLAGCNSM
                    ),
                    true,
                    capturesOnly
                  );
                }
              }
              break;
            }

            // note SLIDERS QUIET MOVES
            if (
              (GameBoard.dyad === 0 ||
                GameBoard.dyad === 1 ||
                GameBoard.dyad === dyad) &&
              GameBoard.pieces[t_sq] === PIECES.EMPTY
            ) {
              if (
                !herrings.length ||
                (herrings.length && _.includes(herrings, t_sq))
              ) {
                AddQuietMove(
                  MOVE(sq, t_sq, PIECES.EMPTY, PIECES.EMPTY, 0),
                  capturesOnly
                );
              }
            }
            t_sq += dir;
          }

          const moverPce = GameBoard.pieces[sq];
          const dyadOk =
            GameBoard.dyad === 0 ||
            GameBoard.dyad === 1 ||
            GameBoard.dyad === dyad;

          if (moverPce === PIECES.wR || moverPce === PIECES.bR) {
            if (SQOFFBOARD(shft_t_R_sq) === BOOL.FALSE) {
              // quiet shift (side-aware, no duplicate branches)
              if (
                dyadOk &&
                !herrings.length &&
                GameBoard.pieces[shft_t_R_sq] === PIECES.EMPTY &&
                rookCanShift
              ) {
                AddQuietMove(
                  MOVE(sq, shft_t_R_sq, PIECES.EMPTY, pce, MFLAGSHFT),
                  capturesOnly
                );
              }

              // 5th-D Sword capture shift
              const rTargetPce = GameBoard.pieces[shft_t_R_sq];
              if (
                rTargetPce !== PIECES.EMPTY &&
                PieceCol[rTargetPce] !== GameBoard.side &&
                has5thDimensionSword &&
                GameBoard.pieces[t_sq] !== PIECES.EMPTY &&
                rookCanShift &&
                (!herrings.length || _.includes(herrings, shft_t_R_sq))
              ) {
                AddCaptureMove(
                  MOVE(sq, shft_t_R_sq, rTargetPce, pce, MFLAGSHFT),
                  false,
                  capturesOnly
                );
              }
            }
          }

          // --- BISHOP SHIFT (if the mover is a bishop) ---
          if (moverPce === PIECES.wB || moverPce === PIECES.bB) {
            if (SQOFFBOARD(shft_t_B_sq) === BOOL.FALSE) {
              // quiet shift
              if (
                dyadOk &&
                !herrings.length &&
                GameBoard.pieces[shft_t_B_sq] === PIECES.EMPTY &&
                bishopCanShift
              ) {
                AddQuietMove(
                  MOVE(
                    sq,
                    shft_t_B_sq,
                    GameBoard.pieces[shft_t_B_sq],
                    pce,
                    MFLAGSHFT
                  ),
                  capturesOnly
                );
              }

              // 5th-D Sword capture shift
              const bTargetPce = GameBoard.pieces[shft_t_B_sq];
              if (
                bTargetPce !== PIECES.EMPTY &&
                PieceCol[bTargetPce] !== GameBoard.side &&
                has5thDimensionSword &&
                GameBoard.pieces[t_sq] !== PIECES.EMPTY &&
                bishopCanShift &&
                (!herrings.length || _.includes(herrings, shft_t_B_sq))
              ) {
                AddCaptureMove(
                  MOVE(
                    sq,
                    shft_t_B_sq,
                    GameBoard.pieces[shft_t_B_sq],
                    pce,
                    MFLAGSHFT
                  ),
                  false,
                  capturesOnly
                );
              }
            }
          }
        }
      }
    }
    pce = LoopSlidePce[pceIndex];
    dyad = LoopSlideDyad[pceIndex++];
  }
}
