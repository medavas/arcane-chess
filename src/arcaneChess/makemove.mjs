import _ from 'lodash';

import {
  GameBoard,
  FROMSQ,
  TOSQ,
  CAPTURED,
  PROMOTED,
  ARCANEFLAG,
  MFLAGEP,
  MFLAGCA,
  MFLAGPS,
  MFLAGSHFT,
  MFLAGCNSM,
  MFLAGSWAP,
  MFLAGSUMN,
  HASH_PCE,
  HASH_CA,
  HASH_EP,
  HASH_SIDE,
  SqAttacked,
} from './board';
import {
  whiteArcaneConfig,
  blackArcaneConfig,
  ArcanaProgression,
  incLiveArcana,
  offerGrant,
  offerRevert,
} from './arcaneDefs';
import {
  COLOURS,
  PIECES,
  BOOL,
  Kings,
  PCEINDEX,
  CastlePerm,
  PiecePawn,
  PieceVal,
  PieceCol,
  SQUARES,
  PceChar,
  RANKS,
  RanksBrd,
} from './defs';
import { ARCANE_BIT_VALUES, RtyChar } from './defs.mjs';

const royaltyIndexMapRestructure = [
  0, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,
];

// cap 30 = capturable exile
// cap 31 = teleport
const TELEPORT_CONST = 31;
// eps 30 = myriad
const EPSILON_MYRIAD_CONST = 30;
// eps 31 = eclipse

const HISTORY_CAP_PLY = 128;

const RTY_CHARS = RtyChar.split('');

const THREE_SQUARE_OFFSETS = [-11, -10, -9, -1, 0, 1, 9, 10, 11];
const FIVE_SQUARE_OFFSETS = [
  -22, -21, -20, -19, -18, -12, -11, -10, -9, -8, -2, -1, 0, 1, 2, 12, 11, 10,
  9, 8, 22, 21, 20, 19, 18,
];

const FIVE_SQUARE_A = [-22, -20, -18, -11, -9, -2, 0, 2, 9, 11, 18, 20, 22];
const FIVE_SQUARE_B = [-21, -19, -12, -10, -8, -1, 1, 8, 10, 12, 19, 21];

const OFFER_STRING = '.ABCDEEFFGGHHIJKKKKLMNOOOZQR';
const OFFER_CHARS = OFFER_STRING.split('');

const WHITE_PIECE_TO_OFFERINGS = {
  1: [PIECES.wH],
  2: [PIECES.wR, PIECES.wR],
  3: [PIECES.wN, PIECES.wZ, PIECES.wU],
  4: [PIECES.wR],
  5: [PIECES.wT],
  6: [PIECES.wQ],
  7: [PIECES.wS],
  8: [PIECES.wW],
  9: [PIECES.wT],
  10: [PIECES.wQ],
  11: [PIECES.wS],
  12: [PIECES.wW],
  13: [PIECES.EMPTY],
  14: ['dyadA'],
  15: ['sumnRQ', 'sumnRQ', 'sumnRQ'],
  16: ['sumnRT', 'sumnRT', 'sumnRT'],
  17: ['sumnRM', 'sumnRM', 'sumnRM'],
  18: ['sumnRV', 'sumnRV', 'sumnRV'],
  19: ['shftT'],
  20: ['sumnRV', 'modsEXT', 'modsINH'],
  21: ['dyadA', 'modsGLU', 'modsINH'],
  22: ['sumnH', 'shftH', 'areaQ', 'modsHER'],
  23: ['sumnH', 'shftH', 'areaT', 'modsHER'],
  24: ['sumnH', 'shftH', 'areaM', 'modsHER'],
  25: ['dyadD', 'sumnS', 'modsBAN'],
  26: ['dyadC', 'sumnR', 'modsEXT', 'modsGLU'],
  27: ['sumnRE', 'sumnRE', 'sumnRE', 'modsSIL'],
};

const BLACK_PIECE_TO_OFFERINGS = {
  1: [PIECES.bH],
  2: [PIECES.bR, PIECES.bR],
  3: [PIECES.bN, PIECES.bZ, PIECES.bU],
  4: [PIECES.bR],
  5: [PIECES.bT, 'dyadD'],
  6: [PIECES.bQ, 'dyadD'],
  7: [PIECES.bS, 'dyadE'],
  8: [PIECES.bW, 'dyadE'],
  9: [PIECES.bT],
  10: [PIECES.bQ],
  11: [PIECES.bS],
  12: [PIECES.bW],
  13: [PIECES.EMPTY],
  14: ['dyadA'],
  15: ['sumnRQ', 'sumnRQ', 'sumnRQ'],
  16: ['sumnRT', 'sumnRT', 'sumnRT'],
  17: ['sumnRM', 'sumnRM', 'sumnRM'],
  18: ['sumnRV', 'sumnRV', 'sumnRV'],
  19: ['shftT'],
  20: ['sumnRV', 'modsEXT', 'modsINH'],
  21: ['dyadA', 'modsGLU', 'modsINH'],
  22: ['sumnH', 'shftH', 'areaQ', 'modsHER'],
  23: ['sumnH', 'shftH', 'areaT', 'modsHER'],
  24: ['sumnH', 'shftH', 'areaM', 'modsHER'],
  25: ['dyadD', 'sumnS', 'modsBAN'],
  26: ['dyadC', 'sumnR', 'modsEXT', 'modsGLU'],
  27: ['sumnRE', 'sumnRE', 'sumnRE', 'modsSIL'],
};

const isShift = (m) => (m & MFLAGSHFT) !== 0;
const isSwap = (m) => (m & MFLAGSWAP) !== 0;
const isSummon = (m) => (m & MFLAGSUMN) !== 0;
const isEp = (m) => (m & MFLAGEP) !== 0;
const isConsumeFlag = (m) => (m & MFLAGCNSM) !== 0;

function trimHistory(commit) {
  if (!commit) return;
  if (GameBoard.hisPly <= HISTORY_CAP_PLY) return;
  const drop = GameBoard.hisPly - HISTORY_CAP_PLY;
  GameBoard.history.splice(0, drop);
  GameBoard.hisPly -= drop;
}

export function ClearPiece(sq, summon = false) {
  let pce = GameBoard.pieces[sq];
  let col = PieceCol[pce];
  let index;
  let t_pceNum = -1;

  HASH_PCE(pce, sq);

  GameBoard.pieces[sq] = PIECES.EMPTY;
  if (!summon) {
    GameBoard.material[col] -= PieceVal[pce];
  }

  for (index = 0; index < GameBoard.pceNum[pce]; index++) {
    if (GameBoard.pList[PCEINDEX(pce, index)] === sq) {
      t_pceNum = index;
      break;
    }
  }

  GameBoard.pceNum[pce]--;
  GameBoard.pList[PCEINDEX(pce, t_pceNum)] =
    GameBoard.pList[PCEINDEX(pce, GameBoard.pceNum[pce])];
}

export function AddPiece(sq, pce, summon = false) {
  let col = PieceCol[pce];

  HASH_PCE(pce, sq);

  GameBoard.pieces[sq] = pce;
  if (!summon) {
    // I believe this is to prevent computer from just exhausting all summons right away
    GameBoard.material[col] += PieceVal[pce];
  }
  GameBoard.pList[PCEINDEX(pce, GameBoard.pceNum[pce])] = sq;
  GameBoard.pceNum[pce]++;
}

export function MovePiece(from, to) {
  let index = 0;
  let pce = GameBoard.pieces[from];

  HASH_PCE(pce, from);
  GameBoard.pieces[from] = PIECES.EMPTY;

  HASH_PCE(pce, to);
  GameBoard.pieces[to] = pce;

  for (index = 0; index < GameBoard.pceNum[pce]; index++) {
    if (GameBoard.pList[PCEINDEX(pce, index)] === from) {
      GameBoard.pList[PCEINDEX(pce, index)] = to;
      break;
    }
  }
}

const getPocketCaptureEpsilon = (move, side, captured) => {
  if ((move & (MFLAGSWAP | MFLAGSUMN)) !== 0) return PIECES.EMPTY;
  if ((move & MFLAGEP) !== 0) {
    return side === COLOURS.WHITE ? PIECES.bP : PIECES.wP;
  }
  if ((move & MFLAGSHFT) !== 0 && captured === TELEPORT_CONST) {
    return TELEPORT_CONST;
  }
  return captured;
};

const getSumnCaptureForRoyalty = (move, captured) => {
  return (move & MFLAGSUMN) !== 0 ? captured : PIECES.EMPTY;
};

function sumnKeyFromMove(move) {
  if ((move & MFLAGSUMN) === 0) return null;
  const cap = CAPTURED(move);
  const eps = PROMOTED(move);
  if (cap > 0) {
    const idx = royaltyIndexMapRestructure[cap];
    const sym = RTY_CHARS[idx];
    return `sumnR${sym}`;
  }
  if (eps > 0) {
    return `sumn${PceChar.charAt(eps).toUpperCase()}`;
  }
  return null;
}

function shiftKeyFromMove(move, moverPiece) {
  if ((move & MFLAGSHFT) === 0) return null;
  if (CAPTURED(move) === TELEPORT_CONST) return 'shftT';
  const p = PROMOTED(move);
  const piece = p || moverPiece || PIECES.EMPTY;
  switch (piece) {
    case PIECES.wP:
    case PIECES.bP:
      return 'shftP';
    case PIECES.wB:
    case PIECES.bB:
      return 'shftB';
    case PIECES.wR:
    case PIECES.bR:
      return 'shftR';
    case PIECES.wN:
    case PIECES.wZ:
    case PIECES.wU:
    case PIECES.bN:
    case PIECES.bZ:
    case PIECES.bU:
      return 'shftN';
    case PIECES.wS:
    case PIECES.wW:
    case PIECES.bS:
    case PIECES.bW:
      return 'shftG';
    case PIECES.wH:
    case PIECES.bH:
      return 'shftH';
    case EPSILON_MYRIAD_CONST:
      return 'shftA';
    default:
      return null;
  }
}

function decAllRoyaltyMaps() {
  const q = GameBoard.royaltyQ;
  const t = GameBoard.royaltyT;
  const m = GameBoard.royaltyM;
  const v = GameBoard.royaltyV;
  const e = GameBoard.royaltyE;
  const f = GameBoard.royaltyF;
  for (const k in q) q[k] = q[k] === undefined ? 0 : q[k] - 1;
  for (const k in t) t[k] = t[k] === undefined ? 0 : t[k] - 1;
  for (const k in m) m[k] = m[k] === undefined ? 0 : m[k] - 1;
  for (const k in v) v[k] = v[k] === undefined ? 0 : v[k] - 1;
  for (const k in e) e[k] = e[k] === undefined ? 0 : e[k] - 1;
  for (const k in f) f[k] = f[k] === undefined ? 0 : f[k] - 1;
}

function snapshotRoyaltyMapsTo(h) {
  const hQ = h.royaltyQ || (h.royaltyQ = {});
  const hT = h.royaltyT || (h.royaltyT = {});
  const hM = h.royaltyM || (h.royaltyM = {});
  const hV = h.royaltyV || (h.royaltyV = {});
  const hE = h.royaltyE || (h.royaltyE = {});
  const hF = h.royaltyF || (h.royaltyF = {});
  const q = GameBoard.royaltyQ;
  const t = GameBoard.royaltyT;
  const m = GameBoard.royaltyM;
  const v = GameBoard.royaltyV;
  const e = GameBoard.royaltyE;
  const f = GameBoard.royaltyF;
  for (const k in hQ) delete hQ[k];
  for (const k in q) hQ[k] = q[k];
  for (const k in hT) delete hT[k];
  for (const k in t) hT[k] = t[k];
  for (const k in hM) delete hM[k];
  for (const k in m) hM[k] = m[k];
  for (const k in hV) delete hV[k];
  for (const k in v) hV[k] = v[k];
  for (const k in hE) delete hE[k];
  for (const k in e) hE[k] = e[k];
  for (const k in hF) delete hF[k];
  for (const k in f) hF[k] = f[k];
}

function restoreRoyaltyMapsFrom(h) {
  const q = GameBoard.royaltyQ;
  const t = GameBoard.royaltyT;
  const m = GameBoard.royaltyM;
  const v = GameBoard.royaltyV;
  const e = GameBoard.royaltyE;
  const f = GameBoard.royaltyF;
  const hQ = h.royaltyQ || {};
  const hT = h.royaltyT || {};
  const hM = h.royaltyM || {};
  const hV = h.royaltyV || {};
  const hE = h.royaltyE || {};
  const hF = h.royaltyF || {};
  for (const k in q) delete q[k];
  for (const k in t) delete t[k];
  for (const k in m) delete m[k];
  for (const k in v) delete v[k];
  for (const k in e) delete e[k];
  for (const k in f) delete f[k];
  for (const k in hQ) q[k] = hQ[k];
  for (const k in hT) t[k] = hT[k];
  for (const k in hM) m[k] = hM[k];
  for (const k in hV) v[k] = hV[k];
  for (const k in hE) e[k] = hE[k];
  for (const k in hF) f[k] = hF[k];
}

export function MakeMove(move, moveType = '') {
  let from = FROMSQ(move);
  let to = TOSQ(move);
  let side = GameBoard.side;

  let captured = CAPTURED(move);
  let pieceEpsilon = PROMOTED(move);

  const commit = moveType === 'userMove' || moveType === 'commit';
  const consume = isConsumeFlag(move);

  let promoEpsilon = !isShift(move) ? pieceEpsilon : PIECES.EMPTY;

  const sumnCap = getSumnCaptureForRoyalty(move, captured);

  const moverPiece = GameBoard.pieces[from];
  const targetPieceAtTo = GameBoard.pieces[to];

  if (
    promoEpsilon !== PIECES.EMPTY &&
    !isSummon(move) &&
    PiecePawn[moverPiece] !== BOOL.TRUE
  ) {
    promoEpsilon = PIECES.EMPTY;
  }

  const h = GameBoard.history[GameBoard.hisPly];
  h.posKey = GameBoard.posKey;
  h.dyad = GameBoard.dyad;
  h.dyadClock = GameBoard.dyadClock;
  h.dyadOwner = GameBoard.dyadOwner;

  const getWhiteKingRookPos = _.lastIndexOf(GameBoard.pieces, 4);
  const getWhiteQueenRookPos = _.indexOf(GameBoard.pieces, 4, 22);

  const getBlackKingRookPos = _.lastIndexOf(GameBoard.pieces, 10);
  const getBlackQueenRookPos = _.indexOf(GameBoard.pieces, 10, 92);

  if (move & MFLAGEP) {
    const epSq = side === COLOURS.WHITE ? to - 10 : to + 10;
    const victim = side === COLOURS.WHITE ? PIECES.bP : PIECES.wP;
    if (
      GameBoard.pieces[to] === PIECES.EMPTY &&
      GameBoard.pieces[epSq] === victim
    ) {
      ClearPiece(epSq);
      GameBoard.fiftyMove = 0;
      const epPocket = getPocketCaptureEpsilon(move, side, captured);
      if (
        GameBoard.crazyHouse[side] &&
        epPocket !== PIECES.EMPTY &&
        epPocket !== TELEPORT_CONST &&
        PieceCol[epPocket] !== side
      ) {
        const key = `sumn${PceChar.charAt(epPocket).toUpperCase()}`;
        const sideKey = side === COLOURS.WHITE ? 'white' : 'black';
        incLiveArcana(sideKey, key, +1);
      }
    }
  } else if ((move & MFLAGCA) !== 0) {
    if (GameBoard.blackArcane[4] & 8) {
      switch (to) {
        case getWhiteQueenRookPos:
          MovePiece(getWhiteQueenRookPos, SQUARES.D1);
          break;
        case getWhiteKingRookPos:
          MovePiece(getWhiteKingRookPos, SQUARES.F1);
          break;
      }
    } else {
      switch (to) {
        case SQUARES.C1:
          MovePiece(SQUARES.A1, SQUARES.D1);
          break;
        case SQUARES.G1:
          MovePiece(SQUARES.H1, SQUARES.F1);
          break;
        default:
          break;
      }
    }
    if (GameBoard.whiteArcane[4] & 8) {
      switch (to) {
        case getBlackQueenRookPos:
          MovePiece(getBlackQueenRookPos, SQUARES.D8);
          break;
        case getBlackKingRookPos:
          MovePiece(getBlackKingRookPos, SQUARES.F8);
          break;
        default:
          break;
      }
    } else {
      switch (to) {
        case SQUARES.C8:
          MovePiece(SQUARES.A8, SQUARES.D8);
          break;
        case SQUARES.G8:
          MovePiece(SQUARES.H8, SQUARES.F8);
          break;
        default:
          break;
      }
    }
  }

  if (GameBoard.enPas !== SQUARES.NO_SQ) HASH_EP();
  HASH_CA();

  GameBoard.invisibility[0] -= 1;
  GameBoard.invisibility[1] -= 1;
  GameBoard.suspend -= 1;

  snapshotRoyaltyMapsTo(h);
  decAllRoyaltyMaps();

  h.move = move;
  h.prettyHistory = null;
  h.fiftyMove = GameBoard.fiftyMove;
  h.enPas = GameBoard.enPas;
  h.castlePerm = GameBoard.castlePerm;

  GameBoard.castlePerm &= CastlePerm[from];
  GameBoard.castlePerm &= CastlePerm[to];
  GameBoard.enPas = SQUARES.NO_SQ;

  HASH_CA();

  if (PiecePawn[GameBoard.pieces[from]] === BOOL.TRUE) {
    GameBoard.fiftyMove = 0;
    if ((move & MFLAGPS) !== 0) {
      const isTwoStep =
        ((side === COLOURS.WHITE && to - from === 20) ||
          (side === COLOURS.BLACK && from - to === 20)) &&
        (move & (MFLAGSHFT | MFLAGSUMN | MFLAGSWAP | MFLAGEP)) === 0;
      const fromOnStart =
        (side === COLOURS.WHITE &&
          (RanksBrd[from] === RANKS.RANK_1 ||
            RanksBrd[from] === RANKS.RANK_2)) ||
        (side === COLOURS.BLACK &&
          (RanksBrd[from] === RANKS.RANK_8 || RanksBrd[from] === RANKS.RANK_7));
      if (isTwoStep && fromOnStart) {
        const jumpedSq = side === COLOURS.WHITE ? from + 10 : from - 10;
        if (GameBoard.pieces[jumpedSq] === PIECES.EMPTY) {
          GameBoard.enPas = jumpedSq;
          HASH_EP();
        }
      }
    }
  }

  const isNormalCapture =
    to > 0 &&
    (move & (MFLAGSWAP | MFLAGSUMN | MFLAGEP)) === 0 &&
    targetPieceAtTo !== PIECES.EMPTY &&
    targetPieceAtTo !== TELEPORT_CONST &&
    (PieceCol[targetPieceAtTo] !== side || consume);

  if (isNormalCapture) {
    const cfg = side === COLOURS.WHITE ? whiteArcaneConfig : blackArcaneConfig;
    ClearPiece(to);
    GameBoard.fiftyMove = 0;
    if (move & MFLAGPS) cfg['modsSUR'] -= 1;
    const pocketCapNow = getPocketCaptureEpsilon(move, side, captured);
    if (
      GameBoard.crazyHouse[side] &&
      pocketCapNow !== PIECES.EMPTY &&
      pocketCapNow !== TELEPORT_CONST &&
      PieceCol[pocketCapNow] !== side
    ) {
      const key = `sumn${PceChar.charAt(pocketCapNow).toUpperCase()}`;
      const sideKey = side === COLOURS.WHITE ? 'white' : 'black';
      incLiveArcana(sideKey, key, +1);
    }
  }

  if (
    (move & MFLAGSUMN) === 0 &&
    (TOSQ(move) > 0 || CAPTURED(move) === TELEPORT_CONST) &&
    (ARCANEFLAG(move) === 0 ||
      isShift(move) ||
      isEp(move) ||
      (move & MFLAGPS) !== 0 ||
      (consume && !isShift(move)))
  ) {
    MovePiece(from, to);
  }

  if (
    TOSQ(move) > 0 &&
    promoEpsilon !== PIECES.EMPTY &&
    !isShift(move) &&
    !isSummon(move) &&
    !isSwap(move)
  ) {
    ClearPiece(to);
    AddPiece(to, promoEpsilon);
  }

  if (TOSQ(move) > 0 && isConsumeFlag(move) && !isShift(move)) {
    (side === COLOURS.WHITE
      ? whiteArcaneConfig
      : blackArcaneConfig
    ).modsCON -= 1;
  }

  if (TOSQ(move) > 0 && isSummon(move)) {
    if (captured === 6) {
      const onesDigit = to % 10;
      for (let i = 0; i < 8; i++) {
        const rank = (i + 2) * 10;
        const square = rank + onesDigit;
        if (GameBoard.royaltyQ[square] > 0) GameBoard.royaltyQ[square] = 0;
        if (GameBoard.royaltyT[square] > 0) GameBoard.royaltyT[square] = 0;
        if (GameBoard.royaltyM[square] > 0) GameBoard.royaltyM[square] = 0;
        if (GameBoard.royaltyV[square] > 0) GameBoard.royaltyV[square] = 0;
        if (GameBoard.royaltyF[square] > 0) GameBoard.royaltyF[square] = 0;
        GameBoard.royaltyE[square] = 9;
      }
    } else if (captured === 7) {
      const tensDigit = Math.floor(to / 10) * 10;
      for (let i = 0; i < 8; i++) {
        const square = tensDigit + (i + 1);
        if (GameBoard.royaltyQ[square] > 0) GameBoard.royaltyQ[square] = 0;
        if (GameBoard.royaltyT[square] > 0) GameBoard.royaltyT[square] = 0;
        if (GameBoard.royaltyM[square] > 0) GameBoard.royaltyM[square] = 0;
        if (GameBoard.royaltyV[square] > 0) GameBoard.royaltyV[square] = 0;
        if (GameBoard.royaltyF[square] > 0) GameBoard.royaltyF[square] = 0;
        GameBoard.royaltyE[square] = 9;
      }
    } else if (captured === 8) {
      for (let i = 0; i < THREE_SQUARE_OFFSETS.length; i++) {
        const square = to + THREE_SQUARE_OFFSETS[i];
        if (GameBoard.royaltyQ[square] > 0) GameBoard.royaltyQ[square] = 0;
        if (GameBoard.royaltyT[square] > 0) GameBoard.royaltyT[square] = 0;
        if (GameBoard.royaltyM[square] > 0) GameBoard.royaltyM[square] = 0;
        if (GameBoard.royaltyV[square] > 0) GameBoard.royaltyV[square] = 0;
        if (GameBoard.royaltyF[square] > 0) GameBoard.royaltyF[square] = 0;
        GameBoard.royaltyE[square] = 9;
      }
    } else if (captured === 9) {
      for (let i = 0; i < THREE_SQUARE_OFFSETS.length; i++) {
        const square = to + THREE_SQUARE_OFFSETS[i];
        if (GameBoard.royaltyQ[square] > 0) GameBoard.royaltyQ[square] = 0;
        if (GameBoard.royaltyT[square] > 0) GameBoard.royaltyT[square] = 0;
        if (GameBoard.royaltyM[square] > 0) GameBoard.royaltyM[square] = 0;
        if (GameBoard.royaltyV[square] > 0) GameBoard.royaltyV[square] = 0;
        if (GameBoard.royaltyE[square] > 0) GameBoard.royaltyE[square] = 0;
        GameBoard.royaltyF[square] = 9;
      }
    } else if (captured === 10) {
      for (let i = 0; i < FIVE_SQUARE_OFFSETS.length; i++) {
        const square = to + FIVE_SQUARE_OFFSETS[i];
        if (GameBoard.royaltyQ[square] > 0) GameBoard.royaltyQ[square] = 0;
        if (GameBoard.royaltyT[square] > 0) GameBoard.royaltyT[square] = 0;
        if (GameBoard.royaltyM[square] > 0) GameBoard.royaltyM[square] = 0;
        if (GameBoard.royaltyV[square] > 0) GameBoard.royaltyV[square] = 0;
        if (GameBoard.royaltyE[square] > 0) GameBoard.royaltyE[square] = 0;
        GameBoard.royaltyF[square] = 9;
      }
    } else if (captured === 11) {
      for (let i = 0; i < FIVE_SQUARE_A.length; i++) {
        const square = to + FIVE_SQUARE_A[i];
        if (GameBoard.royaltyQ[square] > 0) GameBoard.royaltyQ[square] = 0;
        if (GameBoard.royaltyT[square] > 0) GameBoard.royaltyT[square] = 0;
        if (GameBoard.royaltyM[square] > 0) GameBoard.royaltyM[square] = 0;
        if (GameBoard.royaltyV[square] > 0) GameBoard.royaltyV[square] = 0;
        if (GameBoard.royaltyE[square] > 0) GameBoard.royaltyE[square] = 0;
        GameBoard.royaltyF[square] = 9;
      }
      for (let i = 0; i < FIVE_SQUARE_B.length; i++) {
        const square = to + FIVE_SQUARE_B[i];
        if (GameBoard.royaltyQ[square] > 0) GameBoard.royaltyQ[square] = 0;
        if (GameBoard.royaltyT[square] > 0) GameBoard.royaltyT[square] = 0;
        if (GameBoard.royaltyM[square] > 0) GameBoard.royaltyM[square] = 0;
        if (GameBoard.royaltyV[square] > 0) GameBoard.royaltyV[square] = 0;
        if (GameBoard.royaltyE[square] > 0) GameBoard.royaltyF[square] = 0;
        GameBoard.royaltyE[square] = 9;
      }
    } else if (captured === 12) {
      if (GameBoard.royaltyQ[to] > 0) GameBoard.royaltyQ[to] = 0;
      if (GameBoard.royaltyT[to] > 0) GameBoard.royaltyT[to] = 0;
      if (GameBoard.royaltyM[to] > 0) GameBoard.royaltyM[to] = 0;
      if (GameBoard.royaltyV[to] > 0) GameBoard.royaltyE[to] = 0;
      if (GameBoard.royaltyE[to] > 0) GameBoard.royaltyF[to] = 0;
      GameBoard.royaltyM[to - 11] = 9;
      GameBoard.royaltyQ[to - 10] = 9;
      GameBoard.royaltyM[to - 9] = 9;
      GameBoard.royaltyT[to - 1] = 9;
      GameBoard.royaltyV[to] = 9;
      GameBoard.royaltyT[to + 1] = 9;
      GameBoard.royaltyM[to + 9] = 9;
      GameBoard.royaltyQ[to + 10] = 9;
      GameBoard.royaltyM[to + 11] = 9;
    } else if (sumnCap > 0) {
      const idx = royaltyIndexMapRestructure[sumnCap];
      const sym = RTY_CHARS[idx];
      const map = GameBoard[`royalty${sym}`];
      if (map && (map[to] === undefined || map[to] <= 0)) map[to] = 9;
    } else if (promoEpsilon > 0) {
      AddPiece(to, promoEpsilon, true);
    }
  }

  if (TOSQ(move) > 0 && isSwap(move)) {
    const fromPiece = GameBoard.pieces[from];
    ClearPiece(from);
    MovePiece(to, from);
    AddPiece(to, fromPiece);
    const swapType = pieceEpsilon;
    if (GameBoard.side === COLOURS.WHITE) {
      if (swapType === ARCANE_BIT_VALUES.DEP) whiteArcaneConfig.swapDEP -= 1;
      if (swapType === ARCANE_BIT_VALUES.ADJ) whiteArcaneConfig.swapADJ -= 1;
    } else {
      if (swapType === ARCANE_BIT_VALUES.DEP) blackArcaneConfig.swapDEP -= 1;
      if (swapType === ARCANE_BIT_VALUES.ADJ) blackArcaneConfig.swapADJ -= 1;
    }
  }

  {
    const cfg = side === COLOURS.WHITE ? whiteArcaneConfig : blackArcaneConfig;
    const sKey = sumnKeyFromMove(move);
    if (sKey) cfg[sKey] = (cfg[sKey] ?? 0) - 1;
    const shKey = shiftKeyFromMove(move, moverPiece);
    if (shKey) cfg[shKey] = (cfg[shKey] ?? 0) - 1;
  }

  if (TOSQ(move) === 0 && FROMSQ(move) > 0 && CAPTURED(move) > 0) {
    const promoted = PROMOTED(move);
    const useWhite = GameBoard.side === COLOURS.WHITE;
    const arcaneConfig = useWhite ? whiteArcaneConfig : blackArcaneConfig;
    const pieceToOfferings = useWhite
      ? WHITE_PIECE_TO_OFFERINGS
      : BLACK_PIECE_TO_OFFERINGS;
    const offeringNumbers = pieceToOfferings[promoted];

    ClearPiece(from);

    if (Array.isArray(offeringNumbers) && offeringNumbers.length > 0) {
      const offerSymbol = OFFER_CHARS[promoted];
      const offrKey = `offr${offerSymbol}`;
      const have = arcaneConfig[offrKey] ?? 0;

      if (have <= 0) {
        AddPiece(from, captured);
        return BOOL.FALSE;
      }

      if (commit) {
        arcaneConfig[offrKey] = have - 1;
        h.offrKey = offrKey;
        h.offrPromoted = promoted;
        h.offrGifts = [];
        for (let i = 0; i < offeringNumbers.length; i++) {
          const gift = offeringNumbers[i];
          if (typeof gift === 'string') {
            offerGrant(useWhite ? 'white' : 'black', gift, 1);
            h.offrGifts.push(gift);
          } else if (gift !== PIECES.EMPTY) {
            const sumnKey = `sumn${PceChar.charAt(gift).toUpperCase()}`;
            offerGrant(useWhite ? 'white' : 'black', sumnKey, 1);
            h.offrGifts.push(sumnKey);
          }
        }
      }
    }
  }

  if (
    SqAttacked(
      GameBoard.pList[PCEINDEX(Kings[GameBoard.side ^ 1], 0)],
      GameBoard.side
    )
  ) {
    GameBoard.checksGiven[GameBoard.side]++;
  }

  GameBoard.hisPly++;
  GameBoard.ply++;

  trimHistory(moveType === 'userMove');

  if (
    (moveType === 'userMove' || moveType === 'commit') &&
    GameBoard.dyad > 0
  ) {
    GameBoard.dyadClock++;
    if (GameBoard.dyadClock >= 2) {
      const owner =
        GameBoard.dyadOwner || (side === COLOURS.WHITE ? 'white' : 'black');
      const cfg = owner === 'white' ? whiteArcaneConfig : blackArcaneConfig;

      if (GameBoard.dyadName)
        cfg[GameBoard.dyadName] = (cfg[GameBoard.dyadName] | 0) - 1;

      GameBoard.dyad = 0;
      GameBoard.dyadClock = 0;
      GameBoard.dyadName = '';
      GameBoard.dyadOwner = undefined;

      GameBoard.side ^= 1;
      HASH_SIDE();
    }
  } else {
    GameBoard.side ^= 1;
    HASH_SIDE();
  }

  if (!move) {
    console.log('make move error', move);
  }

  if (SqAttacked(GameBoard.pList[PCEINDEX(Kings[side], 0)], side ^ 1)) {
    TakeMove();
    return BOOL.FALSE;
  }
  if (
    SqAttacked(
      GameBoard.pList[PCEINDEX(Kings[GameBoard.side], 0)],
      GameBoard.side ^ 1
    ) &&
    (GameBoard.preset === 'DELIVERANCE' || GameBoard.suspend > 0)
  ) {
    TakeMove();
    return BOOL.FALSE;
  }

  const isCommitted = moveType === 'userMove' || moveType === 'commit';

  if (isCommitted) {
    const sideKey = side === COLOURS.WHITE ? 'white' : 'black';
    const grantedKey = ArcanaProgression.onMoveCommitted(sideKey);
    if (grantedKey) {
      const h =
        GameBoard.history[GameBoard.hisPly - 1] ||
        GameBoard.history[GameBoard.hisPly];
      if (h) {
        h.grantedArcanaKey = grantedKey;
        h.grantedArcanaSide = sideKey;
      }
    }
  }

  return BOOL.TRUE;
}

// take move
export function TakeMove(wasDyadMove = false) {
  if (GameBoard.hisPly > 0) GameBoard.hisPly--;
  if (GameBoard.ply > 0) GameBoard.ply--;

  GameBoard.dyad = GameBoard.history[GameBoard.hisPly].dyad;
  GameBoard.dyadClock = GameBoard.history[GameBoard.hisPly].dyadClock;
  GameBoard.dyadOwner = GameBoard.history[GameBoard.hisPly].dyadOwner;

  if (wasDyadMove) {
    if (GameBoard.dyadClock > 0) {
      if (GameBoard.dyadClock === 1) {
        GameBoard.dyad = 0;
        GameBoard.dyadClock = 0;
        GameBoard.dyadName = '';
        GameBoard.dyadOwner = undefined;
      } else {
        GameBoard.dyadClock++;
        if (GameBoard.dyadClock === 2) {
          const owner = GameBoard.dyadOwner || 'white';
          const cfg = owner === 'white' ? whiteArcaneConfig : blackArcaneConfig;
          if (GameBoard.dyadName)
            cfg[GameBoard.dyadName] = (cfg[GameBoard.dyadName] | 0) + 1;

          GameBoard.dyad = 0;
          GameBoard.dyadClock = 0;
          GameBoard.dyadName = '';
          GameBoard.dyadOwner = undefined;
        }
      }
    }
  } else {
    GameBoard.side ^= 1;
    HASH_SIDE();
  }

  const sideStr = GameBoard.side === COLOURS.WHITE ? 'white' : 'black';

  if (
    SqAttacked(
      GameBoard.pList[PCEINDEX(Kings[GameBoard.side ^ 1], 0)],
      GameBoard.side
    )
  ) {
    GameBoard.checksGiven[GameBoard.side]--;
  }

  let move = GameBoard.history[GameBoard.hisPly].move;
  let from = FROMSQ(move);
  let to = TOSQ(move);
  let captured = CAPTURED(move);
  let pieceEpsilon = PROMOTED(move);

  const consume = isConsumeFlag(move);

  const promoEpsilon = !isShift(move) ? pieceEpsilon : PIECES.EMPTY;

  const moverAtTo = GameBoard.pieces[to];

  {
    const cfg =
      GameBoard.side === COLOURS.WHITE ? whiteArcaneConfig : blackArcaneConfig;
    const sKey = sumnKeyFromMove(move);
    if (sKey) cfg[sKey] = (cfg[sKey] ?? 0) + 1;
    const shKey = shiftKeyFromMove(move, moverAtTo);
    if (shKey) cfg[shKey] = (cfg[shKey] ?? 0) + 1;
  }

  if (GameBoard.enPas !== SQUARES.NO_SQ) HASH_EP();
  HASH_CA();

  GameBoard.castlePerm = GameBoard.history[GameBoard.hisPly].castlePerm;
  GameBoard.fiftyMove = GameBoard.history[GameBoard.hisPly].fiftyMove;
  GameBoard.enPas = GameBoard.history[GameBoard.hisPly].enPas;

  if (GameBoard.enPas !== SQUARES.NO_SQ) HASH_EP();
  HASH_CA();

  GameBoard.invisibility[0] += 1;
  GameBoard.invisibility[1] += 1;
  GameBoard.suspend += 1;

  if (GameBoard.suspend > 6) GameBoard.suspend = 0;
  if (GameBoard.invisibility[0] > 6) GameBoard.invisibility[0] = 0;
  if (GameBoard.invisibility[1] > 6) GameBoard.invisibility[1] = 0;

  const h = GameBoard.history[GameBoard.hisPly];

  restoreRoyaltyMapsFrom(h);

  if (h && h.grantedArcanaKey && h.grantedArcanaSide) {
    const cfg =
      h.grantedArcanaSide === 'white' ? whiteArcaneConfig : blackArcaneConfig;
    const k = h.grantedArcanaKey;
    cfg[k] = Math.max(0, (cfg[k] || 0) - 1);
    h.grantedArcanaKey = undefined;
    h.grantedArcanaSide = undefined;
  }

  if (TOSQ(move) > 0 && isConsumeFlag(move) && !isShift(move)) {
    (GameBoard.side === COLOURS.WHITE
      ? whiteArcaneConfig
      : blackArcaneConfig
    ).modsCON += 1;
  }

  if (move & MFLAGEP) {
    const moverPawn = GameBoard.side === COLOURS.WHITE ? PIECES.wP : PIECES.bP;
    const epSq = GameBoard.side === COLOURS.WHITE ? to - 10 : to + 10;
    const epPawn = GameBoard.side === COLOURS.WHITE ? PIECES.bP : PIECES.wP;
    const looksLikeEP =
      GameBoard.pieces[to] === moverPawn &&
      GameBoard.pieces[epSq] === PIECES.EMPTY;
    if (looksLikeEP) {
      AddPiece(epSq, epPawn);
    }
    const epPocket = getPocketCaptureEpsilon(move, GameBoard.side, captured);
    if (
      GameBoard.crazyHouse[GameBoard.side] &&
      epPocket !== PIECES.EMPTY &&
      epPocket !== TELEPORT_CONST &&
      PieceCol[epPocket] !== GameBoard.side
    ) {
      const key = `sumn${PceChar.charAt(epPocket).toUpperCase()}`;
      const cfg2 =
        GameBoard.side === COLOURS.WHITE
          ? whiteArcaneConfig
          : blackArcaneConfig;
      cfg2[key] = (cfg2[key] ?? 0) - 1;
    }
  } else if ((MFLAGCA & move) !== 0) {
    switch (to) {
      case SQUARES.C1:
        MovePiece(SQUARES.D1, SQUARES.A1);
        break;
      case SQUARES.C8:
        MovePiece(SQUARES.D8, SQUARES.A8);
        break;
      case SQUARES.G1:
        MovePiece(SQUARES.F1, SQUARES.H1);
        break;
      case SQUARES.G8:
        MovePiece(SQUARES.F8, SQUARES.H8);
        break;
      default:
        break;
    }
  }

  if (
    (move & MFLAGSUMN) === 0 &&
    (TOSQ(move) > 0 || CAPTURED(move) === TELEPORT_CONST) &&
    (ARCANEFLAG(move) === 0 ||
      isShift(move) ||
      isEp(move) ||
      (move & MFLAGPS) !== 0 ||
      (consume && !isShift(move)))
  ) {
    MovePiece(to, from);
  }

  if (
    to > 0 &&
    captured !== PIECES.EMPTY &&
    captured !== TELEPORT_CONST &&
    (move & (MFLAGSWAP | MFLAGSUMN | MFLAGEP)) === 0
  ) {
    AddPiece(to, captured);
    const pocketCap = getPocketCaptureEpsilon(move, GameBoard.side, captured);

    const cfg =
      GameBoard.side === COLOURS.WHITE ? whiteArcaneConfig : blackArcaneConfig;
    if (move & MFLAGPS) cfg['modsSUR'] += 1;

    if (
      GameBoard.crazyHouse[GameBoard.side] &&
      pocketCap !== PIECES.EMPTY &&
      pocketCap !== TELEPORT_CONST &&
      PieceCol[pocketCap] !== GameBoard.side
    ) {
      const key = `sumn${PceChar.charAt(pocketCap).toUpperCase()}`;
      const cfg2 =
        GameBoard.side === COLOURS.WHITE
          ? whiteArcaneConfig
          : blackArcaneConfig;
      cfg2[key] = (cfg2[key] ?? 0) - 1;
    }
  }

  if (
    TOSQ(move) > 0 &&
    promoEpsilon !== PIECES.EMPTY &&
    !isShift(move) &&
    !isSummon(move) &&
    !isSwap(move)
  ) {
    const L = PceChar.charAt(promoEpsilon).toUpperCase();
    const expectedPromo =
      GameBoard.side === COLOURS.WHITE ? PIECES[`w${L}`] : PIECES[`b${L}`];

    if (GameBoard.pieces[from] === expectedPromo) {
      ClearPiece(from);
      AddPiece(from, GameBoard.side === COLOURS.WHITE ? PIECES.wP : PIECES.bP);
    }
  } else if (TOSQ(move) > 0 && isSummon(move)) {
    if (promoEpsilon > 0) {
      ClearPiece(to, true);
    }
  } else if (TOSQ(move) > 0 && isSwap(move)) {
    const putBack = GameBoard.pieces[from];
    ClearPiece(from);
    MovePiece(to, from);
    AddPiece(to, putBack);

    const swapType = pieceEpsilon;
    if (GameBoard.side === COLOURS.WHITE) {
      if (swapType === ARCANE_BIT_VALUES.DEP) whiteArcaneConfig.swapDEP += 1;
      if (swapType === ARCANE_BIT_VALUES.ADJ) whiteArcaneConfig.swapADJ += 1;
    } else {
      if (swapType === ARCANE_BIT_VALUES.DEP) blackArcaneConfig.swapDEP += 1;
      if (swapType === ARCANE_BIT_VALUES.ADJ) blackArcaneConfig.swapADJ += 1;
    }
  } else if (TOSQ(move) === 0 && FROMSQ(move) > 0 && CAPTURED(move) > 0) {
    const useWhite = GameBoard.side === COLOURS.WHITE;
    const arcaneConfig = useWhite ? whiteArcaneConfig : blackArcaneConfig;

    AddPiece(from, captured);

    if (h.offrKey) {
      const offrKey = h.offrKey;
      const gifts = h.offrGifts || [];

      for (let i = 0; i < gifts.length; i++) {
        offerRevert(sideStr, gifts[i], 1);
      }
      arcaneConfig[offrKey] = (arcaneConfig[offrKey] ?? 0) + 1;

      h.offrKey = undefined;
      h.offrPromoted = undefined;
      h.offrGifts = undefined;
    }
  }
}
