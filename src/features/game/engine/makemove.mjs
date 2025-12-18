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
  SQOFFBOARD,
} from './board';
import {
  whiteArcaneConfig,
  blackArcaneConfig,
  whiteArcaneSpellBook,
  blackArcaneSpellBook,
  ArcanaProgression,
  offerGrant,
  offerRevert,
  getMoriMoraState,
  applyMoriMoraRewards,
  getGainState,
  applyGainRewards,
  POWERBIT,
  canCastGlare,
  triggerArcanaUpdateCallback,
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
  KiDir,
  RkDir,
} from './defs';
import { ARCANE_BIT_VALUES, RtyChar } from './defs.mjs';

const royaltyIndexMapRestructure = [
  0, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
];

// CAPTURED extra validated move types by engine:
// cap 30 = capturable exile
// cap 31 =  magnet

// PROMOTED extra validated move types by engine:
// prom 30 = black hole
// prom 31 = eclipse
const ECLIPSE_CONST = 31;

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
  // 19: ['shftT'],
  20: ['sumnRV', 'modsEXT', 'modsINH'],
  21: ['dyadA', 'modsGLU', 'modsINH'],
  22: ['sumnH', 'toknHER', 'areaQ'],
  23: ['sumnH', 'toknHER', 'areaT'],
  24: ['sumnH', 'toknHER', 'areaM'],
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
  19: ['swapDEP'],
  20: ['sumnRV', 'modsEXT', 'modsINH'],
  21: ['dyadA', 'modsGLU', 'modsINH'],
  22: ['sumnH', 'toknHER', 'areaQ'],
  23: ['sumnH', 'toknHER', 'areaT'],
  24: ['sumnH', 'toknHER', 'areaM'],
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

  // Debug: Check if trying to clear an empty square
  if (pce === PIECES.EMPTY) {
    return;
  }

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

  if (t_pceNum === -1) {
    return;
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

function rebuildRoyaltyMaps() {
  // Clear existing maps
  for (const k in GameBoard.royaltyQ) GameBoard.royaltyQ[k] = 0;
  for (const k in GameBoard.royaltyT) GameBoard.royaltyT[k] = 0;
  for (const k in GameBoard.royaltyM) GameBoard.royaltyM[k] = 0;
  for (const k in GameBoard.royaltyV) GameBoard.royaltyV[k] = 0;
  // Note: royaltyE and royaltyF are not managed by hermitTracker (Hexlash/Frost)
  // EXCEPT for Hermit contributions which are additive/subtractive, but we don't rebuild them here
  // because we can't easily distinguish Hermit contributions from others if we wipe them.

  // Rebuild from tracker
  for (const id in GameBoard.hermitTracker) {
    const { type, squares, value } = GameBoard.hermitTracker[id];
    // Skip E, F, and N as they are managed manually
    if (type === 'E' || type === 'F' || type === 'N') continue;

    const map = GameBoard[`royalty${type}`];
    if (map) {
      for (const sq of squares) {
        map[sq] = (map[sq] || 0) + value;
      }
    }
  }
}

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
  // if (CAPTURED(move) === TELEPORT_CONST) return 'shftT';
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
    case PIECES.wK:
    case PIECES.bK:
      return 'shftK';

    case ECLIPSE_CONST:
      return 'shftI';
    default:
      return null;
  }
}

function decAllRoyaltyMaps() {
  // Decrement tracker values
  for (const id in GameBoard.hermitTracker) {
    const tracker = GameBoard.hermitTracker[id];
    tracker.value = Math.max(0, tracker.value - 1);
  }
  rebuildRoyaltyMaps();

  // Handle non-tracker maps (E, F, and N)
  const e = GameBoard.royaltyE;
  const f = GameBoard.royaltyF;
  const n = GameBoard.royaltyN;

  for (const k in e) e[k] = e[k] === undefined || e[k] <= 0 ? 0 : e[k] - 1;
  for (const k in f) f[k] = f[k] === undefined || f[k] <= 0 ? 0 : f[k] - 1;
  for (const k in n) n[k] = n[k] === undefined || n[k] <= 0 ? 0 : n[k] - 1;
}

function snapshotRoyaltyMapsTo(h) {
  h.hermitTracker = JSON.parse(JSON.stringify(GameBoard.hermitTracker || {}));

  const hE = h.royaltyE || (h.royaltyE = {});
  const hF = h.royaltyF || (h.royaltyF = {});
  const hN = h.royaltyN || (h.royaltyN = {});
  const e = GameBoard.royaltyE;
  const f = GameBoard.royaltyF;
  const n = GameBoard.royaltyN;

  for (const k in hE) delete hE[k];
  for (const k in e) hE[k] = e[k];
  for (const k in hF) delete hF[k];
  for (const k in f) hF[k] = f[k];
  for (const k in hN) delete hN[k];
  for (const k in n) hN[k] = n[k];
}

function restoreRoyaltyMapsFrom(h) {
  GameBoard.hermitTracker = JSON.parse(JSON.stringify(h.hermitTracker || {}));
  rebuildRoyaltyMaps();

  const e = GameBoard.royaltyE;
  const f = GameBoard.royaltyF;
  const n = GameBoard.royaltyN;
  const hE = h.royaltyE || {};
  const hF = h.royaltyF || {};
  const hN = h.royaltyN || {};

  for (const k in e) delete e[k];
  for (const k in f) delete f[k];
  for (const k in n) delete n[k];
  for (const k in hE) e[k] = hE[k];
  for (const k in hF) f[k] = hF[k];
  for (const k in hN) n[k] = hN[k];
}

// Glare: Recalculate all Glare effects for both sides using tracker system
// This is needed to handle discovered attacks when pieces move/are captured
function recalculateAllGlare(commit = true) {
  if (!commit) return;

  const n = GameBoard.royaltyN;

  // First, clear all existing Glare tracker entries and their contributions
  const glareTrackerKeys = Object.keys(GameBoard.hermitTracker).filter((k) =>
    k.startsWith('glare_')
  );
  for (const key of glareTrackerKeys) {
    const entry = GameBoard.hermitTracker[key];
    if (entry && entry.type === 'N') {
      // Manually clear the contributions
      for (const sq of entry.squares) {
        n[sq] = Math.max(0, (n[sq] || 0) - entry.value);
      }
    }
    delete GameBoard.hermitTracker[key];
  }

  // Recalculate Glare for both sides
  for (const side of [COLOURS.WHITE, COLOURS.BLACK]) {
    const arcane =
      side === COLOURS.WHITE ? GameBoard.whiteArcane : GameBoard.blackArcane;
    const hasGlare = (arcane[4] & POWERBIT.modsGLA) !== 0;

    if (!hasGlare) continue;

    // Find all Glare-casting pieces for this side
    for (let sq = 21; sq <= 98; sq++) {
      if (SQOFFBOARD(sq) === BOOL.TRUE) continue;

      const piece = GameBoard.pieces[sq];
      if (piece === PIECES.EMPTY) continue;
      if (PieceCol[piece] !== side) continue;

      if (canCastGlare(piece, side)) {
        // Calculate which squares this Rook attacks
        const attackedSquares = [];
        const opponentSide =
          side === COLOURS.WHITE ? COLOURS.BLACK : COLOURS.WHITE;

        for (let i = 0; i < 4; i++) {
          const dir = RkDir[i];
          let t_sq = sq + dir;

          while (SQOFFBOARD(t_sq) === BOOL.FALSE) {
            const targetPiece = GameBoard.pieces[t_sq];

            if (targetPiece !== PIECES.EMPTY) {
              if (PieceCol[targetPiece] === opponentSide) {
                attackedSquares.push(t_sq);
              }
              break;
            }

            t_sq += dir;
          }
        }

        // Create tracker entry for this Glare source
        if (attackedSquares.length > 0) {
          const trackerKey = `glare_${sq}`;
          GameBoard.hermitTracker[trackerKey] = {
            type: 'N',
            squares: attackedSquares,
            value: 100,
          };

          // Manually apply the contributions
          for (const t_sq of attackedSquares) {
            n[t_sq] = (n[t_sq] || 0) + 100;
          }
        }
      }
    }
  }
}

export function MakeMove(move, moveType = '') {
  let from = FROMSQ(move);
  let to = TOSQ(move);
  let side = GameBoard.side;

  // Validate square indices
  if (from > 0 && (from < 21 || from > 98 || GameBoard.pieces[from] === 100)) {
    return BOOL.FALSE;
  }

  if (to > 0 && (to < 21 || to > 98)) {
    return BOOL.FALSE;
  }

  // Check for board corruption at destination
  if (to > 0 && GameBoard.pieces[to] === 100) {
    return BOOL.FALSE;
  }

  let captured = CAPTURED(move);
  let pieceEpsilon = PROMOTED(move);

  const commit = moveType === 'userMove' || moveType === 'commit';
  const consume = isConsumeFlag(move);

  // MAGNET SPELL (with black hole behavior)
  // Magnet: captured=31
  if (captured === 31) {
    const targetSq = from; // The square user selected
    const maxRange = 7; // Black hole range
    const minRange = 2;

    // Initialize history entry (needed for undo)
    const h = GameBoard.history[GameBoard.hisPly];
    h.posKey = GameBoard.posKey;
    h.move = move;
    h.fiftyMove = GameBoard.fiftyMove;
    h.enPas = GameBoard.enPas;
    h.castlePerm = GameBoard.castlePerm;
    h.magnetMoves = [];

    // Only actually pull pieces on committed moves (not during validation)
    if (commit) {
      // Check 4 orthogonal directions from target and pull pieces
      const directions = [-10, 10, -1, 1]; // N, S, W, E
      for (const dir of directions) {
        for (let dist = minRange; dist <= maxRange; dist++) {
          const sq = targetSq + (dir * dist);
          if (SQOFFBOARD(sq) === BOOL.TRUE) break;

          const piece = GameBoard.pieces[sq];
          if (piece !== PIECES.EMPTY) {
            const newSq = sq - dir; // One square closer to target
            if (GameBoard.pieces[newSq] === PIECES.EMPTY && newSq !== targetSq) {
              MovePiece(sq, newSq);
              h.magnetMoves.push({ from: sq, to: newSq });
            }
          }
        }
      }

      // Decrement spell uses
      const cfg = side === COLOURS.WHITE ? whiteArcaneConfig : blackArcaneConfig;
      cfg.modsMAG -= 1;
    }

    // Increment history counters
    GameBoard.hisPly++;
    GameBoard.ply++;

    // Toggle side
    GameBoard.side ^= 1;
    HASH_SIDE();

    return BOOL.TRUE;
  }

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
  h.evo = GameBoard.evo;
  h.evoClock = GameBoard.evoClock;
  h.evoOwner = GameBoard.evoOwner;

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

      if (commit && !h.moriMoraApplied) {
        const killerSide = side === COLOURS.WHITE ? 'white' : 'black';
        const victimSide = side === COLOURS.WHITE ? 'black' : 'white';
        const context = {
          killerSide,
          victimSide,
          piece: victim,
          move,
          board: GameBoard,
        };
        const moriMoraKeys = getMoriMoraState(context);
        const mmResult = applyMoriMoraRewards(context, moriMoraKeys);
        if (mmResult && mmResult.moraFired) h.moraTag = true;
        if (mmResult && mmResult.moriFired) h.moriTag = true;
        if (mmResult && mmResult.moriGifts) {
          h.moriGifts = mmResult.moriGifts;
          h.moriSide = victimSide;
        }
        if (mmResult && mmResult.moraGifts) {
          h.moraGifts = mmResult.moraGifts;
          h.moraSide = killerSide;
        }
        if (mmResult && (mmResult.moraFired || mmResult.moriFired))
          h.moriMoraApplied = true;
        if (mmResult && mmResult.moriMana) {
          h.moriMana = mmResult.moriMana;
        }
        if (mmResult && mmResult.moraMana) {
          h.moraMana = mmResult.moraMana;
        }
        let io = '';
        if (mmResult && mmResult.moraFired) io += ' -N';
        if (mmResult && mmResult.moriFired) io += ' -L';
        if (io) h.ioSuffix = io;
      }

      GameBoard.fiftyMove = 0;
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
    // targetPieceAtTo !== TELEPORT_CONST &&
    (PieceCol[targetPieceAtTo] !== side || consume);

  // TRAMPLE MOVE: Piece stays in place, target is eliminated
  // Marked with PROMOTED === 30 and TOSQ > 0
  const isTrampleMove = to > 0 && captured > 0 && pieceEpsilon === 30;

  if (isTrampleMove) {
    const cfg = side === COLOURS.WHITE ? whiteArcaneConfig : blackArcaneConfig;
    // Remove the piece at the target square (it's trampled)
    ClearPiece(to);
    
    // Decrement modsTRA spell usage
    if (commit) {
      cfg.modsTRA = (cfg.modsTRA ?? 0) - 1;
      triggerArcanaUpdateCallback();
    }

    GameBoard.fiftyMove = 0;
    // Note: Piece at 'from' stays in place (no MovePiece call)
  }

  if (isNormalCapture) {
    const cfg = side === COLOURS.WHITE ? whiteArcaneConfig : blackArcaneConfig;
    ClearPiece(to);

    if (commit && !h.moriMoraApplied) {
      const killerSide = side === COLOURS.WHITE ? 'white' : 'black';
      const victimPiece = targetPieceAtTo;
      const victimSide =
        PieceCol[victimPiece] === COLOURS.WHITE ? 'white' : 'black';
      const sameSide = killerSide === victimSide;
      const context = {
        killerSide,
        victimSide,
        piece: victimPiece,
        move,
        board: GameBoard,
      };
      const moriMoraKeys = getMoriMoraState(context);
      if (sameSide) moriMoraKeys.moraKeys = [];
      const mmResult = applyMoriMoraRewards(context, moriMoraKeys);
      if (mmResult && mmResult.moraFired) h.moraTag = true;
      if (mmResult && mmResult.moriFired) h.moriTag = true;
      if (mmResult && mmResult.moriGifts) {
        h.moriGifts = mmResult.moriGifts;
        h.moriSide = victimSide;
      }
      if (mmResult && mmResult.moraGifts) {
        h.moraGifts = mmResult.moraGifts;
        h.moraSide = killerSide;
      }
      if (mmResult && (mmResult.moraFired || mmResult.moriFired))
        h.moriMoraApplied = true;
      if (mmResult && mmResult.moriMana) {
        h.moriMana = mmResult.moriMana;
      }
      if (mmResult && mmResult.moraMana) {
        h.moraMana = mmResult.moraMana;
      }
      let io = '';
      if (mmResult && mmResult.moraFired) io += ' -N';
      if (mmResult && mmResult.moriFired) io += ' -L';
      if (io) h.ioSuffix = io;
    }

    GameBoard.fiftyMove = 0;
    if (move & MFLAGPS) cfg['modsSUR'] -= 1;

    // Hermit AOE: Clear AOE if Hermit is captured
    const isHermitCapture =
      targetPieceAtTo === PIECES.wH || targetPieceAtTo === PIECES.bH;
    if (isHermitCapture) {
      const capturedSide = PieceCol[targetPieceAtTo];
      const capCfg =
        capturedSide === COLOURS.WHITE
          ? GameBoard.whiteArcane
          : GameBoard.blackArcane;
      const hasHermitToken = (capCfg[10] & 1) !== 0; // toknHER
      const hasHemlockToken = (capCfg[10] & 2) !== 0; // toknHEM
      const isHermit = hasHermitToken && !hasHemlockToken;
      const isNomad = hasHermitToken && hasHemlockToken;

      if (isHermit || isNomad) {
        // Remove AOE from captured position
        const trackerKey = `hermit_${to}`;
        const entry = GameBoard.hermitTracker[trackerKey];

        if (entry) {
          // Manually clear E, F, and N contributions
          if (entry.type === 'E' || entry.type === 'F' || entry.type === 'N') {
            const map = GameBoard[`royalty${entry.type}`];
            if (map) {
              for (const sq of entry.squares) {
                map[sq] = Math.max(0, (map[sq] || 0) - entry.value);
              }
            }
          }

          delete GameBoard.hermitTracker[trackerKey];
          rebuildRoyaltyMaps();
        }
      }
    }

    // modsHEX: Hexlash
    // When a Bishop, Knight, Zebra, Unicorn, Rook, Wraith, or Spectre is captured, the capturing piece becomes frozen.
    const victimSide = PieceCol[targetPieceAtTo];
    const victimConfig =
      victimSide === COLOURS.WHITE ? whiteArcaneConfig : blackArcaneConfig;
    // const hasHexlash = (victimArcane[4] & 33554432) !== 0; // modsHEX

    if (victimConfig.modsHEX > 0) {
      const isHexlashPiece =
        targetPieceAtTo === PIECES.wB ||
        targetPieceAtTo === PIECES.bB ||
        targetPieceAtTo === PIECES.wN ||
        targetPieceAtTo === PIECES.bN ||
        targetPieceAtTo === PIECES.wZ ||
        targetPieceAtTo === PIECES.bZ ||
        targetPieceAtTo === PIECES.wU ||
        targetPieceAtTo === PIECES.bU ||
        targetPieceAtTo === PIECES.wR ||
        targetPieceAtTo === PIECES.bR ||
        targetPieceAtTo === PIECES.wS ||
        targetPieceAtTo === PIECES.bS ||
        targetPieceAtTo === PIECES.wW ||
        targetPieceAtTo === PIECES.bW;

      if (isHexlashPiece) {
        GameBoard.royaltyE[to] = 4;
        victimConfig.modsHEX -= 1;
        h.modsHEXConsumed = true;
      }
    }
  }

  if (
    (move & MFLAGSUMN) === 0 &&
    TOSQ(move) > 0 &&
    !isTrampleMove && // Trample: piece stays in place
    // (TOSQ(move) > 0 || CAPTURED(move) === TELEPORT_CONST) &&
    (ARCANEFLAG(move) === 0 ||
      isShift(move) ||
      isEp(move) ||
      (move & MFLAGPS) !== 0 ||
      (consume && !isShift(move)))
  ) {
    MovePiece(from, to);

    // modsEVO: Berserking Evolution
    // Pawn → Knight → Rook; Zebra/Unicorn/Bishop → Rook → Wraith
    // Wraith/Spectre → Queen → Valkyrie; Mystic/Templar → Valkyrie
    // Spectre/Unicorn → Hermit (when modsEVOSupply active) → Queen
    // Evolution triggers on all moves while active
    // Captures are blocked unless Gluttony (modsGLU) is active
    const movedPiece = GameBoard.pieces[to];
    const cfg = side === COLOURS.WHITE ? whiteArcaneConfig : blackArcaneConfig;

    if (
      GameBoard.evo > 0 &&
      commit &&
      movedPiece !== PIECES.EMPTY
    ) {
      let evolvedPiece = PIECES.EMPTY;

      // Map each piece to its evolved form
      if (side === COLOURS.WHITE) {
        if (movedPiece === PIECES.wP) {
          evolvedPiece = PIECES.wN;
        } else if (movedPiece === PIECES.wN) {
          evolvedPiece = PIECES.wR;
        } else if (movedPiece === PIECES.wZ || movedPiece === PIECES.wB) {
          evolvedPiece = PIECES.wR;
        } else if (movedPiece === PIECES.wU || movedPiece === PIECES.wS) {
          evolvedPiece = PIECES.wH;
        } else if (movedPiece === PIECES.wR) {
          evolvedPiece = PIECES.wW;
        } else if (movedPiece === PIECES.wW) {
          evolvedPiece = PIECES.wQ;
        } else if (movedPiece === PIECES.wH) {
          evolvedPiece = PIECES.wQ;
        } else if (movedPiece === PIECES.wM || movedPiece === PIECES.wT) {
          evolvedPiece = PIECES.wV;
        } else if (movedPiece === PIECES.wQ) {
          evolvedPiece = PIECES.wV;
        }
      } else {
        // Black side
        if (movedPiece === PIECES.bP) {
          evolvedPiece = PIECES.bN;
        } else if (movedPiece === PIECES.bN) {
          evolvedPiece = PIECES.bR;
        } else if (movedPiece === PIECES.bZ || movedPiece === PIECES.bB) {
          evolvedPiece = PIECES.bR;
        } else if (movedPiece === PIECES.bU || movedPiece === PIECES.bS) {
          evolvedPiece = PIECES.bH;
        } else if (movedPiece === PIECES.bR) {
          evolvedPiece = PIECES.bW;
        } else if (movedPiece === PIECES.bW) {
          evolvedPiece = PIECES.bQ;
        } else if (movedPiece === PIECES.bH) {
          evolvedPiece = PIECES.bQ;
        } else if (movedPiece === PIECES.bM || movedPiece === PIECES.bT) {
          evolvedPiece = PIECES.bV;
        } else if (movedPiece === PIECES.bQ) {
          evolvedPiece = PIECES.bV;
        }
      }

      // Apply evolution if a valid transformation is defined
      if (evolvedPiece !== PIECES.EMPTY) {
        ClearPiece(to);
        AddPiece(to, evolvedPiece);
        h.modsEVOPiece = movedPiece;
        h.modsEVOEvolved = evolvedPiece;
        // Increment evoClock to track that evolution was used
        GameBoard.evoClock += 1;
        // Note: modsEVO is already decremented when evolution is activated
        // (both engine in gui.mjs and player in arcaneChess.mjs activateEvo)
      }
    }

    // Hermit AoE: Apply royalty effect to surrounding squares
    const isHermitPiece = moverPiece === PIECES.wH || moverPiece === PIECES.bH;
    if (isHermitPiece) {
      const cfg =
        side === COLOURS.WHITE ? GameBoard.whiteArcane : GameBoard.blackArcane;
      const hasHermitToken = (cfg[10] & 1) !== 0; // toknHER
      const hasHemlockToken = (cfg[10] & 2) !== 0; // toknHEM
      const isHermit = hasHermitToken && !hasHemlockToken;
      const isNomad = hasHermitToken && hasHemlockToken;

      if (isHermit || isNomad) {
        const arcCfg =
          side === COLOURS.WHITE ? whiteArcaneConfig : blackArcaneConfig;
        const hasAreaQ = arcCfg.areaQ > 0;
        const hasAreaT = arcCfg.areaT > 0;
        const hasAreaE = arcCfg.areaE > 0;
        const hasAreaF = arcCfg.areaF > 0;
        const hasAreaN = arcCfg.areaN > 0;

        let activeCount = 0;
        if (hasAreaQ) activeCount++;
        if (hasAreaT) activeCount++;
        if (hasAreaE) activeCount++;
        if (hasAreaF) activeCount++;
        if (hasAreaN) activeCount++;

        // Determine which royalty type to use
        let royaltyType = 'M';
        if (activeCount === 0) {
          royaltyType = 'M';
        } else if (activeCount > 1) {
          royaltyType = 'V';
        } else {
          // Exactly one active
          if (hasAreaQ) royaltyType = 'Q';
          else if (hasAreaT) royaltyType = 'T';
          else if (hasAreaE) royaltyType = 'E';
          else if (hasAreaF) royaltyType = 'F';
          else if (hasAreaN) royaltyType = 'N';
        }

        const hermitPattern = KiDir; // User requested King move pattern for AoE

        // Update tracker: Move from 'from' to 'to'
        const oldTrackerKey = `hermit_${from}`;
        const newTrackerKey = `hermit_${to}`;

        // Calculate new squares
        const newSquares = [];
        for (let i = 0; i < hermitPattern.length; i++) {
          const newSq = to + hermitPattern[i];
          if (newSq >= 0 && newSq < 120) {
            newSquares.push(newSq);
          }
        }

        // Handle old tracker entry
        const existingEntry = GameBoard.hermitTracker[oldTrackerKey];
        if (existingEntry) {
          // Manually clear old E, F, and N contributions
          if (
            existingEntry.type === 'E' ||
            existingEntry.type === 'F' ||
            existingEntry.type === 'N'
          ) {
            const map = GameBoard[`royalty${existingEntry.type}`];
            if (map) {
              for (const sq of existingEntry.squares) {
                map[sq] = Math.max(0, (map[sq] || 0) - existingEntry.value);
              }
            }
          }
          delete GameBoard.hermitTracker[oldTrackerKey];
        }

        // Add new tracker entry
        GameBoard.hermitTracker[newTrackerKey] = {
          type: royaltyType,
          squares: newSquares,
          value: 100,
        };

        // Manually apply new E, F, and N contributions
        if (royaltyType === 'E' || royaltyType === 'F' || royaltyType === 'N') {
          const map = GameBoard[`royalty${royaltyType}`];
          if (map) {
            for (const sq of newSquares) {
              map[sq] = (map[sq] || 0) + 100;
            }
          }
        }

        rebuildRoyaltyMaps();
      }
    }
  }

  if (
    TOSQ(move) > 0 &&
    promoEpsilon !== PIECES.EMPTY &&
    !isSummon(move) &&
    !isSwap(move)
  ) {
    ClearPiece(to);
    AddPiece(to, promoEpsilon);
    try {
      const cfg =
        side === COLOURS.WHITE ? GameBoard.whiteArcane : GameBoard.blackArcane;

      if (
        (promoEpsilon === PIECES.wV && side === COLOURS.WHITE) ||
        (promoEpsilon === PIECES.bV && side === COLOURS.BLACK)
      ) {
        if (cfg[4] & 1024) {
          if (side === COLOURS.WHITE) {
            whiteArcaneConfig.modsDIV -= 1;
            h.modsDIVConsumed = true;
            if ((GameBoard.whiteArcane[4] & POWERBIT.modsREA) === 0) {
              GameBoard.whiteArcane[4] |= POWERBIT.modsREA;
              whiteArcaneConfig.modsREA = 0;
            }
            whiteArcaneConfig.modsREA += 1;
          }
          if (side === COLOURS.BLACK) {
            blackArcaneConfig.modsDIV -= 1;
            h.modsDIVConsumed = true;
            if ((GameBoard.blackArcane[4] & POWERBIT.modsREA) === 0) {
              GameBoard.blackArcane[4] |= POWERBIT.modsREA;
              blackArcaneConfig.modsREA = 0;
            }
            blackArcaneConfig.modsREA += 1;
          }
        }
      }
    } catch (e) {
      /* defensive ignore */
    }
  }

  if (TOSQ(move) > 0 && isConsumeFlag(move) && !isShift(move)) {
    const consumingConfig =
      side === COLOURS.WHITE ? whiteArcaneConfig : blackArcaneConfig;
    consumingConfig.modsCON -= 1;

    // modsREI: Reincarnate
    // When Consume captures an opponent piece, grant the capturer a summon of that piece type.
    if (
      (consumingConfig.modsREI || 0) > 0 &&
      targetPieceAtTo !== PIECES.EMPTY &&
      commit
    ) {
      const victimCol = PieceCol[targetPieceAtTo];
      const isFriendlyPiece =
        victimCol === side && targetPieceAtTo !== PIECES.EMPTY;
      if (isFriendlyPiece) {
        const sumnKey = `sumn${PceChar.charAt(targetPieceAtTo).toUpperCase()}`;
        const playerSide = side === COLOURS.WHITE ? 'white' : 'black';
        offerGrant(playerSide, sumnKey, 1);
        h.modsREIConsumed = true;
        h.modsREIGift = sumnKey;
        h.modsREISide = playerSide;
      }
    }
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
        if (GameBoard.royaltyN[square] > 0) GameBoard.royaltyN[square] = 0;
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
        if (GameBoard.royaltyN[square] > 0) GameBoard.royaltyN[square] = 0;
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
        if (GameBoard.royaltyN[square] > 0) GameBoard.royaltyN[square] = 0;
        GameBoard.royaltyF[square] = 9;
      }
      GameBoard.hermitTracker[`pattern_9_${to}`] = {
        type: 'F',
        squares: THREE_SQUARE_OFFSETS.map((offset) => to + offset),
        value: 9,
      };
    } else if (captured === 10) {
      for (let i = 0; i < FIVE_SQUARE_OFFSETS.length; i++) {
        const square = to + FIVE_SQUARE_OFFSETS[i];
        if (GameBoard.royaltyQ[square] > 0) GameBoard.royaltyQ[square] = 0;
        if (GameBoard.royaltyT[square] > 0) GameBoard.royaltyT[square] = 0;
        if (GameBoard.royaltyM[square] > 0) GameBoard.royaltyM[square] = 0;
        if (GameBoard.royaltyV[square] > 0) GameBoard.royaltyV[square] = 0;
        if (GameBoard.royaltyE[square] > 0) GameBoard.royaltyE[square] = 0;
        if (GameBoard.royaltyN[square] > 0) GameBoard.royaltyN[square] = 0;
        GameBoard.royaltyF[square] = 9;
      }
      GameBoard.hermitTracker[`pattern_10_${to}`] = {
        type: 'F',
        squares: FIVE_SQUARE_OFFSETS.map((offset) => to + offset),
        value: 9,
      };
    } else if (captured === 11) {
      const squaresF = [];
      const squaresE = [];
      for (let i = 0; i < FIVE_SQUARE_A.length; i++) {
        const square = to + FIVE_SQUARE_A[i];
        if (GameBoard.royaltyQ[square] > 0) GameBoard.royaltyQ[square] = 0;
        if (GameBoard.royaltyT[square] > 0) GameBoard.royaltyT[square] = 0;
        if (GameBoard.royaltyM[square] > 0) GameBoard.royaltyM[square] = 0;
        if (GameBoard.royaltyV[square] > 0) GameBoard.royaltyV[square] = 0;
        if (GameBoard.royaltyE[square] > 0) GameBoard.royaltyE[square] = 0;
        if (GameBoard.royaltyN[square] > 0) GameBoard.royaltyN[square] = 0;
        GameBoard.royaltyF[square] = 9;
        squaresF.push(square);
      }
      for (let i = 0; i < FIVE_SQUARE_B.length; i++) {
        const square = to + FIVE_SQUARE_B[i];
        if (GameBoard.royaltyQ[square] > 0) GameBoard.royaltyQ[square] = 0;
        if (GameBoard.royaltyT[square] > 0) GameBoard.royaltyT[square] = 0;
        if (GameBoard.royaltyM[square] > 0) GameBoard.royaltyM[square] = 0;
        if (GameBoard.royaltyV[square] > 0) GameBoard.royaltyV[square] = 0;
        if (GameBoard.royaltyE[square] > 0) GameBoard.royaltyF[square] = 0;
        if (GameBoard.royaltyN[square] > 0) GameBoard.royaltyN[square] = 0;
        GameBoard.royaltyE[square] = 9;
        squaresE.push(square);
      }
      GameBoard.hermitTracker[`pattern_11_F_${to}`] = {
        type: 'F',
        squares: squaresF,
        value: 9,
      };
      GameBoard.hermitTracker[`pattern_11_E_${to}`] = {
        type: 'E',
        squares: squaresE,
        value: 9,
      };
    } else if (captured === 12) {
      if (GameBoard.royaltyQ[to] > 0) GameBoard.royaltyQ[to] = 0;
      if (GameBoard.royaltyT[to] > 0) GameBoard.royaltyT[to] = 0;
      if (GameBoard.royaltyM[to] > 0) GameBoard.royaltyM[to] = 0;
      if (GameBoard.royaltyV[to] > 0) GameBoard.royaltyE[to] = 0;
      if (GameBoard.royaltyE[to] > 0) GameBoard.royaltyF[to] = 0;
      if (GameBoard.royaltyF[to] > 0) GameBoard.royaltyF[to] = 0;
      if (GameBoard.royaltyN[to] > 0) GameBoard.royaltyN[to] = 0;
      GameBoard.royaltyM[to - 11] = 9;
      GameBoard.royaltyQ[to - 10] = 9;
      GameBoard.royaltyM[to - 9] = 9;
      GameBoard.royaltyT[to - 1] = 9;
      GameBoard.royaltyV[to] = 9;
      GameBoard.royaltyT[to + 1] = 9;
      GameBoard.royaltyM[to + 9] = 9;
      GameBoard.royaltyQ[to + 10] = 9;
      GameBoard.royaltyM[to + 11] = 9;

      GameBoard.hermitTracker[`pattern_12_M_${to}`] = {
        type: 'M',
        squares: [to - 11, to - 9, to + 9, to + 11],
        value: 9,
      };
      GameBoard.hermitTracker[`pattern_12_Q_${to}`] = {
        type: 'Q',
        squares: [to - 10, to + 10],
        value: 9,
      };
      GameBoard.hermitTracker[`pattern_12_T_${to}`] = {
        type: 'T',
        squares: [to - 1, to + 1],
        value: 9,
      };
      GameBoard.hermitTracker[`pattern_12_V_${to}`] = {
        type: 'V',
        squares: [to],
        value: 9,
      };
    } else if (sumnCap > 0) {
      const idx = royaltyIndexMapRestructure[sumnCap];
      const sym = RTY_CHARS[idx];
      const map = GameBoard[`royalty${sym}`];
      if (map && (map[to] === undefined || map[to] <= 0)) {
        map[to] = 9;
        // Add to tracker so it persists across turns
        const trackerKey = `summon_${to}`;
        GameBoard.hermitTracker[trackerKey] = {
          type: sym,
          squares: [to],
          value: 9,
        };
      }
    } else if (promoEpsilon > 0) {
      // Store any existing piece at the destination for proper undo
      const existingPiece = GameBoard.pieces[to];
      if (existingPiece !== PIECES.EMPTY) {
        h.summonOverwrittenPiece = existingPiece;
        ClearPiece(to);
      }
      AddPiece(to, promoEpsilon, true);

      // Instant AoE for summoned Hermit/Nomad
      if (promoEpsilon === PIECES.wH || promoEpsilon === PIECES.bH) {
        const cfg =
          side === COLOURS.WHITE
            ? GameBoard.whiteArcane
            : GameBoard.blackArcane;
        const hasHermitToken = (cfg[10] & 1) !== 0;
        // const hasHemlockToken = (cfg[10] & 2) !== 0;

        if (hasHermitToken) {
          // Hermit or Nomad
          const arcCfg =
            side === COLOURS.WHITE ? whiteArcaneConfig : blackArcaneConfig;
          const hasAreaQ = arcCfg.areaQ > 0;
          const hasAreaT = arcCfg.areaT > 0;
          const hasAreaE = arcCfg.areaE > 0;
          const hasAreaF = arcCfg.areaF > 0;
          const hasAreaN = arcCfg.areaN > 0;

          let activeCount = 0;
          if (hasAreaQ) activeCount++;
          if (hasAreaT) activeCount++;
          if (hasAreaE) activeCount++;
          if (hasAreaF) activeCount++;
          if (hasAreaN) activeCount++;

          // Determine which royalty type to use
          let royaltyType = 'M';
          if (activeCount === 0) {
            royaltyType = 'M';
          } else if (activeCount > 1) {
            royaltyType = 'V';
          } else {
            // Exactly one active
            if (hasAreaQ) royaltyType = 'Q';
            else if (hasAreaT) royaltyType = 'T';
            else if (hasAreaE) royaltyType = 'E';
            else if (hasAreaF) royaltyType = 'F';
            else if (hasAreaN) royaltyType = 'N';
          }

          const hermitPattern = KiDir;

          // Create tracker entry for summoned Hermit
          const trackerKey = `hermit_${to}`;
          const newSquares = [];
          for (let i = 0; i < hermitPattern.length; i++) {
            const newSq = to + hermitPattern[i];
            if (newSq >= 0 && newSq < 120) {
              newSquares.push(newSq);
            }
          }

          GameBoard.hermitTracker[trackerKey] = {
            type: royaltyType,
            squares: newSquares,
            value: 100,
          };

          // Manually apply E, F, and N contributions
          if (
            royaltyType === 'E' ||
            royaltyType === 'F' ||
            royaltyType === 'N'
          ) {
            const map = GameBoard[`royalty${royaltyType}`];
            if (map) {
              for (const sq of newSquares) {
                map[sq] = (map[sq] || 0) + 100;
              }
            }
          }

          rebuildRoyaltyMaps();
        }
      }
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
    const spellBook = side === COLOURS.WHITE ? whiteArcaneSpellBook : blackArcaneSpellBook;
    const sKey = sumnKeyFromMove(move);
    if (sKey && commit) {
      cfg[sKey] = (cfg[sKey] ?? 0) - 1;
      spellBook[sKey] = Math.max(0, (spellBook[sKey] ?? 0) - 1);
      h.spellKey = sKey;
      h.spellCfg = cfg;
      h.spellBook = spellBook;
      triggerArcanaUpdateCallback();
    }
    const shKey = shiftKeyFromMove(move, moverPiece);
    if (shKey && commit) {
      cfg[shKey] = (cfg[shKey] ?? 0) - 1;
      spellBook[shKey] = Math.max(0, (spellBook[shKey] ?? 0) - 1);
      h.shiftKey = shKey;
      h.shiftCfg = cfg;
      h.shiftBook = spellBook;
      triggerArcanaUpdateCallback();
    }
  }

  if (TOSQ(move) === 0 && FROMSQ(move) > 0 && CAPTURED(move) > 0) {
    const promoted = PROMOTED(move);
    const useWhite = GameBoard.side === COLOURS.WHITE;
    const arcaneConfig = useWhite ? whiteArcaneConfig : blackArcaneConfig;
    const pieceToOfferings = useWhite
      ? WHITE_PIECE_TO_OFFERINGS
      : BLACK_PIECE_TO_OFFERINGS;
    const offeringNumbers = pieceToOfferings[promoted];

    // Save the piece type BEFORE clearing (needed for Grave Offering)
    const offeredPiece = GameBoard.pieces[from];

    ClearPiece(from);

    // Special case for offrI (Grave Offering, index 13): grant summon of offered piece
    const isGraveOffering = promoted === 13;

    if (
      isGraveOffering ||
      (Array.isArray(offeringNumbers) && offeringNumbers.length > 0)
    ) {
      const offerSymbol = OFFER_CHARS[promoted];
      const offrKey = `offr${offerSymbol}`;
      const have = arcaneConfig[offrKey] ?? 0;

      if (have <= 0) {
        AddPiece(from, offeredPiece);
        return BOOL.FALSE;
      }

      if (commit) {
        arcaneConfig[offrKey] = have - 1;
        h.offrKey = offrKey;
        h.offrPromoted = promoted;
        h.offrGifts = [];

        if (isGraveOffering) {
          // For Grave Offering, grant a summon of the piece that was offered
          const sumnKey = `sumn${PceChar.charAt(offeredPiece).toUpperCase()}`;
          offerGrant(useWhite ? 'white' : 'black', sumnKey, 1);
          h.offrGifts.push(sumnKey);
        } else {
          // For other offerings, use the lookup table
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
  }

  // Check for gain spell triggers (pieces reaching opposite rank)
  if (commit && !isSwap(move) && !isSummon(move) && TOSQ(move) > 0) {
    const movedPiece = GameBoard.pieces[to];
    const toRank = RanksBrd[to];
    const moverSide = side === COLOURS.WHITE ? 'white' : 'black';

    // White pieces reaching rank 8, or black pieces reaching rank 1
    const reachedOppositeRank =
      (side === COLOURS.WHITE && toRank === RANKS.RANK_8) ||
      (side === COLOURS.BLACK && toRank === RANKS.RANK_1);

    if (reachedOppositeRank && movedPiece !== PIECES.EMPTY) {
      const gainContext = {
        side: moverSide,
        piece: movedPiece,
        move,
        board: GameBoard,
      };
      const gainKeys = getGainState(gainContext);
      if (gainKeys && gainKeys.length > 0) {
        const gainResult = applyGainRewards(gainContext, gainKeys);
        if (gainResult && gainResult.fired) {
          h.gainTag = true;
          h.gainGifts = gainResult.gifts;
          h.gainSide = moverSide;
          h.gainKeys = gainKeys;
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

  // Handle side switching and special move mechanics (dyad, evo)
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
  } else if (
    moveType === 'userMove' &&
    GameBoard.evo > 0
  ) {
    // Player move with Evolution active: consume modsEVO
    // Decrement modsEVO if it hasn't been decremented already (when evolution happened)
    if (!h.modsEVOPiece) {
      const evoOwnerIsWhite = GameBoard.evoOwner === 'white';
      const evoConfig = evoOwnerIsWhite ? whiteArcaneConfig : blackArcaneConfig;
      const evoBook = evoOwnerIsWhite ? whiteArcaneSpellBook : blackArcaneSpellBook;
      if (evoConfig && evoConfig.modsEVO > 0) {
        evoConfig.modsEVO -= 1;
        evoBook.modsEVO = Math.max(0, (evoBook.modsEVO ?? 0) - 1);
        // Mark that modsEVO was decremented for non-evolution case
        h.modsEVOConsumed = true;
        triggerArcanaUpdateCallback();
      }
    }

    // Clear evolution if turn is switching to opponent
    // Evolution should only persist across the owner's consecutive moves
    if (GameBoard.evo > 0 && GameBoard.evoOwner) {
      const nextSideIsWhite = (side ^ 1) === COLOURS.WHITE;
      const nextSideColor = nextSideIsWhite ? 'white' : 'black';

      // If the next side is NOT the owner, clear evolution and decrement spell
      if (nextSideColor !== GameBoard.evoOwner) {
        const ownerIsWhite = GameBoard.evoOwner === 'white';
        const config = ownerIsWhite ? whiteArcaneConfig : blackArcaneConfig;
        const spellBook = ownerIsWhite ? whiteArcaneSpellBook : blackArcaneSpellBook;

        if (config.modsEVO > 0) {
          config.modsEVO -= 1;
          spellBook.modsEVO = Math.max(0, (spellBook.modsEVO ?? 0) - 1);
          triggerArcanaUpdateCallback();
        }

        GameBoard.evo = 0;
        GameBoard.evoClock = 0;
        GameBoard.evoOwner = undefined;
      }
    }

    GameBoard.side ^= 1;
    HASH_SIDE();
  } else if (
    moveType === 'commit' &&
    GameBoard.evo > 0
  ) {
    // Non-player move (e.g., engine) with Evolution active - clear after use
    GameBoard.evo = 0;
    GameBoard.evoClock = 0;
    GameBoard.evoOwner = undefined;
    GameBoard.side ^= 1;
    HASH_SIDE();
  } else {
    GameBoard.side ^= 1;
    HASH_SIDE();
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
    GameBoard.preset === 'DELIVERANCE'
  ) {
    TakeMove();
    return BOOL.FALSE;
  }

  const isCommitted = moveType === 'userMove' || moveType === 'commit';

  // Only grant arcana when the move is a committed move and there is no active dyad.
  // If a dyad is in progress, wait until it finishes (GameBoard.dyad === 0).
  if (isCommitted && GameBoard.dyad === 0) {
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

  // Glare: Recalculate all Glare at the end of every move
  // This ensures Disarmament is removed when pieces move away from attacks
  recalculateAllGlare(commit);

  return BOOL.TRUE;
}

export function TakeMove(wasDyadMove = false) {
  if (GameBoard.hisPly > 0) GameBoard.hisPly--;
  if (GameBoard.ply > 0) GameBoard.ply--;

  let move = GameBoard.history[GameBoard.hisPly].move;
  let from = FROMSQ(move);
  let to = TOSQ(move);
  let captured = CAPTURED(move);
  let promoted = PROMOTED(move);


  // Undo MAGNET / BLACK HOLE piece movements
  // Note: Black hole has promoted=30 AND to=0, trample has promoted=30 AND to>0
  if (captured === 31 || (promoted === 30 && to === 0)) {
    const h = GameBoard.history[GameBoard.hisPly];

    // Undo side toggle
    GameBoard.side ^= 1;
    HASH_SIDE();

    // Undo the piece movements in reverse order
    if (h.magnetMoves && h.magnetMoves.length > 0) {
      for (let i = h.magnetMoves.length - 1; i >= 0; i--) {
        const { from: originalFrom, to: movedTo } = h.magnetMoves[i];
        MovePiece(movedTo, originalFrom);
      }
    }

    // Restore state
    GameBoard.posKey = h.posKey;
    GameBoard.fiftyMove = h.fiftyMove;
    GameBoard.enPas = h.enPas;
    GameBoard.castlePerm = h.castlePerm;

    return;
  }

  GameBoard.dyad = GameBoard.history[GameBoard.hisPly].dyad;
  GameBoard.dyadClock = GameBoard.history[GameBoard.hisPly].dyadClock;
  GameBoard.dyadOwner = GameBoard.history[GameBoard.hisPly].dyadOwner;
  GameBoard.evo = GameBoard.history[GameBoard.hisPly].evo;
  GameBoard.evoClock = GameBoard.history[GameBoard.hisPly].evoClock;
  GameBoard.evoOwner = GameBoard.history[GameBoard.hisPly].evoOwner;

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

  move = GameBoard.history[GameBoard.hisPly].move;
  from = FROMSQ(move);
  to = TOSQ(move);
  const capturedPiece = CAPTURED(move);
  const pieceEpsilon = PROMOTED(move);

  const consume = isConsumeFlag(move);

  const promoEpsilon = !isShift(move) ? pieceEpsilon : PIECES.EMPTY;

  // const moverAtTo = GameBoard.pieces[to];

  {
    const h = GameBoard.history[GameBoard.hisPly];
    if (h.spellKey && h.spellCfg) {
      h.spellCfg[h.spellKey] = (h.spellCfg[h.spellKey] ?? 0) + 1;
      if (h.spellBook) {
        h.spellBook[h.spellKey] = (h.spellBook[h.spellKey] ?? 0) + 1;
      }
      triggerArcanaUpdateCallback();
      h.spellKey = undefined;
      h.spellCfg = undefined;
      h.spellBook = undefined;
    }
    if (h.shiftKey && h.shiftCfg) {
      h.shiftCfg[h.shiftKey] = (h.shiftCfg[h.shiftKey] ?? 0) + 1;
      if (h.shiftBook) {
        h.shiftBook[h.shiftKey] = (h.shiftBook[h.shiftKey] ?? 0) + 1;
      }
      triggerArcanaUpdateCallback();
      h.shiftKey = undefined;
      h.shiftCfg = undefined;
      h.shiftBook = undefined;
    }
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

  // Revert gain spell rewards
  if (h && h.gainTag && h.gainGifts && h.gainKeys && h.gainSide) {
    const cfg = h.gainSide === 'white' ? whiteArcaneConfig : blackArcaneConfig;
    // Revert the granted arcana
    for (const gift of h.gainGifts) {
      offerRevert(h.gainSide, gift, 1);
    }
    // Restore the consumed gain spells
    for (const key of h.gainKeys) {
      cfg[key] = (cfg[key] || 0) + 1;
    }
    h.gainTag = undefined;
    h.gainGifts = undefined;
    h.gainKeys = undefined;
    h.gainSide = undefined;
  }

  if (TOSQ(move) > 0 && isConsumeFlag(move) && !isShift(move)) {
    (GameBoard.side === COLOURS.WHITE
      ? whiteArcaneConfig
      : blackArcaneConfig
    ).modsCON += 1;

    // Revert modsREI: Reincarnate
    if (h && h.modsREIConsumed && h.modsREIGift && h.modsREISide) {
      offerRevert(h.modsREISide, h.modsREIGift, 1);
      h.modsREIConsumed = undefined;
      h.modsREIGift = undefined;
      h.modsREISide = undefined;
    }
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
    TOSQ(move) > 0 &&
    // (TOSQ(move) > 0 || CAPTURED(move) === TELEPORT_CONST) &&
    (ARCANEFLAG(move) === 0 ||
      isShift(move) ||
      isEp(move) ||
      (move & MFLAGPS) !== 0 ||
      (consume && !isShift(move)))
  ) {
    // Skip MovePiece for trample moves (pieceEpsilon === 30)
    const isTrampleMove = to > 0 && captured > 0 && pieceEpsilon === 30;
    if (!isTrampleMove) {
      MovePiece(to, from);
    }

    // Hermit AoE: Restore AoE when undoing move
    // Logic is handled by restoreRoyaltyMapsFrom(h) which restores the tracker state.
    // No manual intervention needed here.
  }

  if (
    to > 0 &&
    captured !== PIECES.EMPTY &&
    // captured !== TELEPORT_CONST &&
    (move & (MFLAGSWAP | MFLAGSUMN | MFLAGEP)) === 0
  ) {
    AddPiece(to, captured);
    const h = GameBoard.history[GameBoard.hisPly];
    
    if (h && h.moriMana) {
      const { side, steps, keys = [] } = h.moriMana;
      const cfg = side === 'white' ? whiteArcaneConfig : blackArcaneConfig;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        cfg[k] = Math.max(0, (cfg[k] | 0) - 1);
      }
      ArcanaProgression.rewindBy(side, steps, keys);
      h.moriMana = undefined;
    }
    if (h && h.moraMana) {
      const { side, steps, keys = [] } = h.moraMana;
      const cfg = side === 'white' ? whiteArcaneConfig : blackArcaneConfig;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        cfg[k] = Math.max(0, (cfg[k] | 0) - 1);
      }
      ArcanaProgression.rewindBy(side, steps, keys);
      h.moraMana = undefined;
    }

    const cfg =
      GameBoard.side === COLOURS.WHITE ? whiteArcaneConfig : blackArcaneConfig;
    if (move & MFLAGPS) cfg['modsSUR'] += 1;

    if (h.modsHEXConsumed) {
      const victimSide = GameBoard.side ^ 1;
      const victimConfig =
        victimSide === COLOURS.WHITE ? whiteArcaneConfig : blackArcaneConfig;
      victimConfig.modsHEX += 1;
      h.modsHEXConsumed = undefined;
    }

    // Revert modsEVO: Berserking Evolution
    if (h && h.modsEVOPiece && h.modsEVOEvolved) {
      const cfg =
        GameBoard.side === COLOURS.WHITE
          ? whiteArcaneConfig
          : blackArcaneConfig;
      const to = TOSQ(move);
      if (to > 0 && GameBoard.pieces[to] === h.modsEVOEvolved) {
        ClearPiece(to);
        AddPiece(to, h.modsEVOPiece);
        cfg.modsEVO += 1;
        h.modsEVOPiece = undefined;
        h.modsEVOEvolved = undefined;
      }
    }
    // Revert modsEVO for non-evolution case (player move without evolution)
    if (h && h.modsEVOConsumed) {
      const evoOwnerSide = GameBoard.side === COLOURS.WHITE ? 1 : 0;
      const evoConfig =
        evoOwnerSide === COLOURS.WHITE
          ? whiteArcaneConfig
          : blackArcaneConfig;
      if (evoConfig && evoConfig.modsEVO !== undefined) {
        evoConfig.modsEVO += 1;
        triggerArcanaUpdateCallback();
      }
      h.modsEVOConsumed = undefined;
    }
  }

  if (
    TOSQ(move) > 0 &&
    promoEpsilon !== PIECES.EMPTY &&
    !isSummon(move) &&
    !isSwap(move)
  ) {
    // Use promoEpsilon directly as it already contains the correct color information
    // from the original move, including for condition-based promotions
    if (GameBoard.pieces[from] === promoEpsilon) {
      ClearPiece(from);
      // Determine the original pawn color from the promoted piece color
      const promotedPieceColor = PieceCol[promoEpsilon];
      const originalPawn =
        promotedPieceColor === COLOURS.WHITE ? PIECES.wP : PIECES.bP;
      AddPiece(from, originalPawn);

      try {
        if (
          (promoEpsilon === PIECES.wV && GameBoard.side === COLOURS.WHITE) ||
          (promoEpsilon === PIECES.bV && GameBoard.side === COLOURS.BLACK)
        ) {
          if (h.modsDIVConsumed) {
            if (GameBoard.side === COLOURS.WHITE) {
              whiteArcaneConfig.modsDIV += 1;
              whiteArcaneConfig.modsREA -= 1;
            }
            if (GameBoard.side === COLOURS.BLACK) {
              blackArcaneConfig.modsDIV += 1;
              blackArcaneConfig.modsREA -= 1;
            }
            h.modsDIVConsumed = undefined;
          }
        }
      } catch (e) {
        /* defensive ignore */
      }
    }
  } else if (TOSQ(move) > 0 && isSummon(move)) {
    if (promoEpsilon > 0) {
      ClearPiece(to, true);
      // Restore any piece that was overwritten by the summon
      if (
        h.summonOverwrittenPiece &&
        h.summonOverwrittenPiece !== PIECES.EMPTY
      ) {
        AddPiece(to, h.summonOverwrittenPiece);
        h.summonOverwrittenPiece = undefined;
      }
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

  // Glare: Recalculate all Glare after undoing a move
  // This ensures discovered attacks are properly handled on undo
  recalculateAllGlare(true);
}
