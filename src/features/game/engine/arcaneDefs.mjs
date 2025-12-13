import { PIECES, PceChar, PiecePawn, BOOL } from './defs.mjs';
import arcanaData from '../../../shared/data/arcana.json' assert { type: 'json' };

// Helper function to get power value from arcana data
function getPowerByKey(key) {
  return arcanaData[key]?.value ?? 0;
}

export const whiteArcaneConfig = {};
export const blackArcaneConfig = {};

export const whiteArcaneSpellBook = {};
export const blackArcaneSpellBook = {};

const grantedByKey = { white: Object.create(null), black: Object.create(null) };
const grantedByOffering = {
  white: Object.create(null),
  black: Object.create(null),
};

export const setWhiteArcana = (pool) => {
  Object.keys(whiteArcaneSpellBook).forEach(
    (k) => delete whiteArcaneSpellBook[k]
  );
  Object.keys(pool || {}).forEach((k) => {
    whiteArcaneSpellBook[k] = pool[k] | 0;
  });
  Object.keys(whiteArcaneConfig).forEach((k) => delete whiteArcaneConfig[k]);
  grantedByKey.white = Object.create(null);
  grantedByOffering.white = Object.create(null);
  ArcanaProgression.resetSide('white');
  return whiteArcaneSpellBook;
};

export const setBlackArcana = (pool) => {
  Object.keys(blackArcaneSpellBook).forEach(
    (k) => delete blackArcaneSpellBook[k]
  );
  Object.keys(pool || {}).forEach((k) => {
    blackArcaneSpellBook[k] = pool[k] | 0;
  });
  Object.keys(blackArcaneConfig).forEach((k) => delete blackArcaneConfig[k]);
  grantedByKey.black = Object.create(null);
  grantedByOffering.black = Object.create(null);
  ArcanaProgression.resetSide('black');
  return blackArcaneSpellBook;
};

export const clearArcanaConfig = () => {
  Object.keys(whiteArcaneConfig).forEach(
    (key) => delete whiteArcaneConfig[key]
  );
  Object.keys(blackArcaneConfig).forEach(
    (key) => delete blackArcaneConfig[key]
  );
};

export const clearAllArcanaState = () => {
  // Clear configs
  Object.keys(whiteArcaneConfig).forEach(
    (key) => delete whiteArcaneConfig[key]
  );
  Object.keys(blackArcaneConfig).forEach(
    (key) => delete blackArcaneConfig[key]
  );

  // Clear spell books
  Object.keys(whiteArcaneSpellBook).forEach(
    (key) => delete whiteArcaneSpellBook[key]
  );
  Object.keys(blackArcaneSpellBook).forEach(
    (key) => delete blackArcaneSpellBook[key]
  );

  // Clear tracking objects
  grantedByKey.white = Object.create(null);
  grantedByKey.black = Object.create(null);
  grantedByOffering.white = Object.create(null);
  grantedByOffering.black = Object.create(null);

  // Reset progression state
  ArcanaProgression.resetSide('white');
  ArcanaProgression.resetSide('black');
};

// Optional UI callback to notify the React layer that arcana state changed.
let arcanaUpdateCallback = null;
export function registerArcanaUpdateCallback(cb) {
  arcanaUpdateCallback = cb;
}
export function unregisterArcanaUpdateCallback() {
  arcanaUpdateCallback = null;
}

export const activateDyad = () => {
  // GameBoard.dyad = type;
};

// needs update 10/1/24
// 0000 0000 0000 0000 0000 0000 0000 0000 0000 1111 1111 1111 dyad
// 0000 0000 0000 0000 0000 0000 0000 0000 1111 0000 0000 0000 shft
// 0000 0000 0000 0000 0000 0000 0000 0111 0000 0000 0000 0000 swap
// 0000 0000 0000 1111 1111 1111 1111 1000 0000 0000 0000 0000 sumn
// 0011 1111 11411 0000 0000 0000 0000 0000 0000 0000 0000 0000 mods

export const POWERBIT = {
  // 0 dyad active 6
  dyadA: 1, // all
  dyadB: 2, // p h x
  dyadC: 4, // b n z u r
  dyadD: 8, // s w
  dyadE: 16, // m t q
  dyadF: 32, // v k

  // 3 summons active 26
  sumnP: 1, //         // a
  sumnS: 2, //         // a
  sumnH: 4, //         //
  sumnN: 8, //         //
  sumnB: 16, //        //
  sumnR: 32, //        //
  sumnQ: 64, //        //
  sumnT: 128, //       //
  sumnM: 256, //       //
  sumnV: 512, //       //
  sumnZ: 1024, //      //
  sumnU: 2048, //      //
  sumnW: 4096, //      //
  sumnX: 8192, //      //
  sumnRQ: 16384, //    //
  sumnRT: 32768, //    //
  sumnRM: 65536, //    //
  sumnRV: 131072, //   //
  sumnRE: 262144, //   //
  sumnRY: 524288, //   // file
  sumnRZ: 1048576, //  // rank
  sumnRA: 2097152, //  // tomb
  sumnRF: 4194304, //  // 3x3
  sumnRG: 8388608, //  // 5x5
  sumnRH: 16777216, // // entangle fog
  sumnRI: 33554432, // // ra
  sumnRN: 67108864, // // disarm

  // 5 active 18
  offrA: 1,
  offrB: 2,
  offrC: 4,
  offrD: 8,
  offrE: 16,
  offrF: 32,
  offrG: 64,
  offrH: 128,
  offrI: 256,
  offrJ: 512,
  offrK: 1024,
  offrL: 2048,
  offrM: 4096,
  offrN: 8192,
  offrO: 16384,
  // don't use P, it gets replaced in chessground UI
  offrZ: 32768,
  offrQ: 65536,
  offrR: 131072,

  // 1 passive 9
  shftP: 1,
  shftN: 2,
  shftB: 4,
  shftR: 8,
  // shftT: 16, // active
  shftG: 32,
  // shftH: 64,
  shftI: 128,
  shftA: 256,
  shftK: 512,

  // 2 active 2
  swapDEP: 1,
  swapADJ: 2,

  // 4 mods 26
  modsCON: 1, // passive
  modsAET: 2, // active
  modsFUG: 4, // inherent
  modsSIL: 8, // inherent
  modsINH: 16, // inherent
  modsSUS: 32, // active
  modsGLU: 64, // inherent
  modsFUT: 128, // active
  modsREA: 256, // inherent
  modsEXT: 512, // inherent
  modsDIV: 1024, //              divine reckoning
  modsTRO: 2048, // inherent     // trojan horse
  modsREI: 4096, // inherent     . reincarnet for cons and offr
  modsSOV: 8192, // passive      sovereign (summon pieces have square conditions - deprecate?
  modsDOP: 16384, // passive     doppleganger
  modsMAG: 32768, // active      magnet
  modsBLA: 65536, // active      black hole
  modsSUR: 131072, // passive    pawn surge
  modsDIM: 262144, // passive    5th dimension sword
  // modsHER: 524288, // passive    hermit
  // modsHEM: 1048576, // inherent  hemlock
  modsBAN: 2097152, // inherent  // banshee
  modsGLA: 4194304, // inherent  // glare - rook attacks apply disarmament
  modsZ: 8388608, // passive     // .
  modsHUR: 16777216, // passive  // hurricane
  modsHEX: 33554432, // passive  // hexlash

  // 6 on your piece death 4
  moriDYA: 1, // inherent
  moriROY: 2, // inherent
  moriPAW: 4, // inherent
  moriNOR: 8, // inherent
  moriMAN: 16, // inherent

  // 7 on opponent piece death 4
  moraDYA: 1, // inherent
  moraROY: 2, // inherent
  moraPAW: 4, // inherent
  moraNOR: 8, // inherent
  moraMAN: 16, // inherent

  // 8 area inherent 6
  areaF: 1,
  areaM: 2,
  areaT: 4,
  areaQ: 8,
  areaE: 16,
  areaN: 32,

  // 9 gain passive 3
  gainDYA: 1,
  gainVAL: 2,
  gainPAW: 4,

  // 10 tokens passive 2
  toknHER: 1,
  toknHEM: 2,
};

export const varVars = {
  // insert things like 960, crazyhouse, summons vs freezes, koh, xcheck, horde,
};

// Glare: Configure which pieces can cast Glare (apply Disarmament to attacked squares)
// By default, only Rooks cast Glare. You can add other pieces here.
export const GLARE_CASTER_PIECES = {
  white: [PIECES.wR], // White Rooks
  black: [PIECES.bR], // Black Rooks
};

// Helper function to check if a piece can cast Glare
export function canCastGlare(piece, side) {
  const casters =
    side === 'white' || side === 0
      ? GLARE_CASTER_PIECES.white
      : GLARE_CASTER_PIECES.black;
  return casters.includes(piece);
}

// unneeded / depoerecated
export const POWERS = (config) => {
  return (
    config.dyad |
    (config.sumn << 15) |
    (config.shft << 37) |
    (config.swap << 42) |
    (config.mods << 44) |
    (config.offr << 56)
  );
};

function sideKey(x) {
  return x === 0 || x === 'white' ? 'white' : 'black';
}

export function incLiveArcana(side, key, delta = 1) {
  const spellBook =
    side === 'white' ? whiteArcaneSpellBook : blackArcaneSpellBook;
  const live = side === 'white' ? whiteArcaneConfig : blackArcaneConfig;
  const cap = spellBook[key] | 0;
  const cur = live[key] | 0;
  const next =
    delta > 0 ? Math.min(cap, cur + delta) : Math.max(0, cur + delta);
  live[key] = next;
  return next !== cur;
}

export function offerGrant(side, key, qty = 1) {
  const spellBook =
    side === 'white' ? whiteArcaneSpellBook : blackArcaneSpellBook;
  const live = side === 'white' ? whiteArcaneConfig : blackArcaneConfig;
  const offeringTracker =
    side === 'white' ? grantedByOffering.white : grantedByOffering.black;

  const curLive = live[key] | 0;
  const curCap = spellBook[key] | 0;

  if (isStackingKey(key)) {
    // Raise the spellBook cap FIRST so incLiveArcana can cap against the new limit
    const targetCap = Math.max(curCap, curLive + qty);
    spellBook[key] = targetCap;
    incLiveArcana(side, key, +qty);
    // Track that this key was granted by an offering
    offeringTracker[key] = (offeringTracker[key] | 0) + qty;
  } else {
    // For non-stacking, ensure spellBook is at least 1 so incLiveArcana can grant 1
    spellBook[key] = Math.max(curCap, 1);
    incLiveArcana(side, key, curLive >= 1 ? 0 : +1);
    // Track that this key was granted by an offering
    if (curLive < 1) offeringTracker[key] = 1;
  }
  // notify UI if registered
  try {
    if (typeof arcanaUpdateCallback === 'function') arcanaUpdateCallback();
  } catch (e) {
    console.warn(e);
  }
}

export function offerRevert(side, key, qty = 1) {
  const spellBook =
    side === 'white' ? whiteArcaneSpellBook : blackArcaneSpellBook;
  const live = side === 'white' ? whiteArcaneConfig : blackArcaneConfig;
  const offeringTracker =
    side === 'white' ? grantedByOffering.white : grantedByOffering.black;

  if (isStackingKey(key)) {
    incLiveArcana(side, key, -qty);
    const liveNow = live[key] | 0;
    spellBook[key] = Math.max(liveNow, (spellBook[key] | 0) - qty);
    // Remove from offering tracker
    offeringTracker[key] = Math.max(0, (offeringTracker[key] | 0) - qty);
    if (offeringTracker[key] === 0) delete offeringTracker[key];
  } else {
    if ((live[key] | 0) > 0) incLiveArcana(side, key, -1);
    spellBook[key] = Math.max(live[key] | 0, 0);
    // Remove from offering tracker
    if (offeringTracker[key]) delete offeringTracker[key];
  }
  // notify UI if registered
  try {
    if (typeof arcanaUpdateCallback === 'function') arcanaUpdateCallback();
  } catch (e) {
    console.warn(e);
  }
}

const STACKING_PREFIXES = [
  'sumn',
  'offr',
  'shft',
  'swap',
  'dyad',
  'mori',
  'mora',
  'area',
  'gain',
  'tokn',
];
const STACKING_EXCEPTIONS = new Set([
  'modsSUS',
  'modsMAG',
  'modsBLA',
  'modsFUT',
  'modsCON',
  'modsSUR',
  'modsHEX',
]);

function isStackingKey(key) {
  if (!key) return false;
  if (STACKING_EXCEPTIONS.has(key)) return true;
  for (const p of STACKING_PREFIXES) if (key.startsWith(p)) return true;
  return false;
}

function remainingFor(side, key) {
  const spellBook =
    side === 'white' ? whiteArcaneSpellBook : blackArcaneSpellBook;
  const live = side === 'white' ? whiteArcaneConfig : blackArcaneConfig;
  return (spellBook[key] | 0) - (live[key] | 0);
}
function universeFor(side) {
  const spellBook =
    side === 'white' ? whiteArcaneSpellBook : blackArcaneSpellBook;
  return Object.keys(spellBook).filter((k) => (spellBook[k] | 0) > 0);
}

const ArcanaProgression = (() => {
  const moveCount = { white: 0, black: 0 };
  const grantsGiven = { white: 0, black: 0 };

  let every = 6;
  let firstAt = 1;
  let enabled = true;

  function setEvery(n) {
    every = Math.max(1, n | 0);
  }
  function setFirstAt(n) {
    firstAt = Math.max(0, n | 0);
  }
  function setEnabled(b) {
    enabled = !!b;
  }
  function resetSide(s) {
    moveCount[s] = 0;
    grantsGiven[s] = 0;
  }

  // Tier grows every two successful grants, capped at 6
  function tier(s) {
    const g = grantsGiven[s] | 0;
    const t = 1 + Math.floor(g / 2);
    return t > 6 ? 6 : t;
  }

  // Core—choose one key to grant based on tier & remaining capacity
  function grantOne(s) {
    const t = tier(s);
    const offeringTracker =
      s === 'white' ? grantedByOffering.white : grantedByOffering.black;

    // Exclude keys that were granted by offerings from progression grants
    let pool = universeFor(s).filter(
      (k) =>
        (getPowerByKey(k) || 1) <= t &&
        remainingFor(s, k) > 0 &&
        !offeringTracker[k]
    );

    // If nothing fits current tier, fall back to the smallest POWER_BY_KEY that still has remaining
    if (!pool.length) {
      const all = universeFor(s).filter(
        (k) => remainingFor(s, k) > 0 && !offeringTracker[k]
      );
      if (!all.length) return null;
      let minP = Infinity;
      for (const k of all) {
        const p = getPowerByKey(k) || 1;
        if (p < minP) minP = p;
      }
      pool = all.filter((k) => (getPowerByKey(k) || 1) === minP);
    }

    // Prefer strongest among the pool (deterministic tie-break by random index)
    let maxP = 1;
    for (const k of pool) {
      const p = getPowerByKey(k) || 1;
      if (p > maxP) maxP = p;
    }
    const strongest = pool.filter((k) => (getPowerByKey(k) || 1) === maxP);
    const key = strongest[(Math.random() * strongest.length) | 0];

    // Actually increment; only count a grant if the live value changed
    if (incLiveArcana(s, key, +1)) {
      grantsGiven[s] += 1;
      return key;
    }
    return null;
  }

  // Call this from MakeMove() when a move is committed
  function onMoveCommitted(colOrSide) {
    if (!enabled) return null;
    const s = sideKey(colOrSide);
    const m = ++moveCount[s];
    if (m < firstAt) return null;
    if ((m - firstAt) % every !== 0) return null;
    return grantOne(s);
  }

  // Expose a UI-friendly progress snapshot for a side
  function getProgressState(colOrSide) {
    const s = sideKey(colOrSide);
    const mc = moveCount[s] | 0;

    const beforeFirst = mc < firstAt;
    const denom = beforeFirst ? Math.max(1, firstAt) : Math.max(1, every);

    // steps within current cycle (0..denom)
    const steps = beforeFirst ? mc : (((mc - firstAt) % every) + every) % every;

    // 0..1 for a fill bar
    const pct = Math.max(0, Math.min(1, steps / denom));

    // moves until the next grant
    const untilNext = beforeFirst ? firstAt - mc : every - steps || every;

    return {
      side: s,
      moveCount: mc,
      firstAt,
      every,
      pct,
      steps,
      denom,
      untilNext,
      grantsGiven: grantsGiven[s] | 0,
      tier: tier(s),
    };
  }

  function advanceBy(sideInput, steps) {
    const s = sideKey(sideInput);
    if (!enabled || (steps | 0) <= 0) return [];
    let mc = moveCount[s] | 0;
    const grants = [];

    for (let i = 0; i < steps; i++) {
      mc++;
      if (mc >= firstAt && (mc - firstAt) % every === 0) {
        const k = grantOne(s);
        if (k) grants.push(k);
      }
    }
    moveCount[s] = mc;
    return grants;
  }

  function rewindBy(sideInput, steps, revokedKeys = []) {
    const s = sideKey(sideInput);
    const n = revokedKeys.length | 0;
    moveCount[s] = Math.max(0, (moveCount[s] | 0) - (steps | 0));
    grantsGiven[s] = Math.max(0, (grantsGiven[s] | 0) - n);
  }

  return {
    setEvery,
    setFirstAt,
    setEnabled,
    resetSide,
    onMoveCommitted,
    getProgressState,
    advanceBy,
    rewindBy,
  };
})();

function mapPieceToSummonKey(piece) {
  const L = PceChar.charAt(piece);
  if (!L) return null;
  return 'sumn' + L.toUpperCase();
}

function isQTMV(piece) {
  return (
    piece === PIECES.wQ ||
    piece === PIECES.bQ ||
    piece === PIECES.wT ||
    piece === PIECES.bT ||
    piece === PIECES.wM ||
    piece === PIECES.bM ||
    piece === PIECES.wV ||
    piece === PIECES.bV
  );
}

export function getMoriMoraState(context) {
  const { killerSide, victimSide, piece } = context;

  const killerLive =
    killerSide === 'white' ? whiteArcaneConfig : blackArcaneConfig;
  const victimLive =
    victimSide === 'white' ? whiteArcaneConfig : blackArcaneConfig;

  const getLiveKeys = (live, prefix) =>
    Object.keys(live).filter(
      (k) =>
        k.startsWith(prefix) &&
        ((live[k] | 0) > 0 || live[k] === true || live[k] === 'true')
    );

  const moriAll = getLiveKeys(victimLive, 'mori');
  const moraAll = getLiveKeys(killerLive, 'mora');

  const isPawn = PiecePawn[piece] === BOOL.TRUE;
  const isRoyaltyV = isQTMV(piece);

  const filterKeys = (arr) =>
    arr.filter((k) => {
      if (k.endsWith('PAW')) return isPawn;
      if (k.endsWith('ROY')) return isRoyaltyV;
      return true;
    });

  return {
    moriKeys: filterKeys(moriAll),
    moraKeys: filterKeys(moraAll),
  };
}

function pickMMKey(keys, piece, base) {
  if (!keys || !keys.length) return null;
  if (PiecePawn[piece] === BOOL.TRUE && keys.indexOf(base + 'PAW') >= 0)
    return base + 'PAW';
  if (isQTMV(piece) && keys.indexOf(base + 'ROY') >= 0) return base + 'ROY';
  if (keys.indexOf(base + 'NOR') >= 0) return base + 'NOR';
  if (keys.indexOf(base + 'DYA') >= 0) return base + 'DYA';
  if (keys.indexOf(base + 'MAN') >= 0) return base + 'MAN';
  return keys[0];
}

export function applyMoriMoraRewards(context, keys) {
  let moriFired = false;
  let moraFired = false;
  const moriGifts = [];
  const moraGifts = [];

  let moriMana = null;
  let moraMana = null;

  const mk = pickMMKey(keys.moriKeys, context.piece, 'mori');
  if (mk) {
    moriFired = true;
    if (mk === 'moriDYA') {
      offerGrant(context.victimSide, 'dyadA', 1);
      moriGifts.push('dyadA');
    } else if (mk === 'moriROY' && isQTMV(context.piece)) {
      offerGrant(context.victimSide, 'sumnRV', 1);
      moriGifts.push('sumnRV');
    } else if (mk === 'moriPAW' && PiecePawn[context.piece] === BOOL.TRUE) {
      offerGrant(context.victimSide, 'dyadA', 1);
      moriGifts.push('dyadA');
    } else if (mk === 'moriNOR') {
      const sKey = mapPieceToSummonKey(context.piece);
      if (sKey) {
        offerGrant(context.victimSide, sKey, 1);
        moriGifts.push(sKey);
      }
    } else if (mk === 'moriMAN') {
      const keysGranted = ArcanaProgression.advanceBy(context.victimSide, 2);
      moriMana = { side: context.victimSide, steps: 2, keys: keysGranted };
    }
  }

  const nk = pickMMKey(keys.moraKeys, context.piece, 'mora');
  if (nk) {
    moraFired = true;
    if (nk === 'moraDYA') {
      offerGrant(context.killerSide, 'dyadA', 1);
      moraGifts.push('dyadA');
    } else if (nk === 'moraROY' && isQTMV(context.piece)) {
      offerGrant(context.killerSide, 'sumnRV', 1);
      moraGifts.push('sumnRV');
    } else if (nk === 'moraPAW' && PiecePawn[context.piece] === BOOL.TRUE) {
      offerGrant(context.killerSide, 'dyadA', 1);
      moraGifts.push('dyadA');
    } else if (nk === 'moraNOR') {
      const sKey = mapPieceToSummonKey(context.piece);
      if (sKey) {
        offerGrant(context.killerSide, sKey, 1);
        moraGifts.push(sKey);
      }
    } else if (nk === 'moraMAN') {
      const keysGranted = ArcanaProgression.advanceBy(context.killerSide, 2);
      moraMana = { side: context.killerSide, steps: 2, keys: keysGranted };
    }
  }

  return { moriFired, moraFired, moriGifts, moraGifts, moriMana, moraMana };
}

export function getGainState(context) {
  const { side, piece } = context;

  const live = side === 'white' ? whiteArcaneConfig : blackArcaneConfig;

  const getLiveKeys = (live, prefix) =>
    Object.keys(live).filter(
      (k) =>
        k.startsWith(prefix) &&
        ((live[k] | 0) > 0 || live[k] === true || live[k] === 'true')
    );

  const gainAll = getLiveKeys(live, 'gain');

  // Check piece type eligibility
  const isPawn = PiecePawn[piece] === BOOL.TRUE;
  const isValkyrie = piece === PIECES.wV || piece === PIECES.bV;
  const isMinorPiece =
    piece === PIECES.wB ||
    piece === PIECES.bB ||
    piece === PIECES.wN ||
    piece === PIECES.bN ||
    piece === PIECES.wZ ||
    piece === PIECES.bZ ||
    piece === PIECES.wU ||
    piece === PIECES.bU;

  const filterKeys = (arr) =>
    arr.filter((k) => {
      if (k === 'gainPAW') return isPawn;
      if (k === 'gainVAL') return isValkyrie;
      if (k === 'gainDYA') return isMinorPiece;
      return false;
    });

  return filterKeys(gainAll);
}

export function applyGainRewards(context, keys) {
  if (!keys || keys.length === 0) return { fired: false, gifts: [] };

  const gifts = [];
  let fired = false;

  for (const key of keys) {
    fired = true;
    if (key === 'gainDYA') {
      offerGrant(context.side, 'dyadA', 1);
      gifts.push('dyadA');
      // Consume the gain spell
      const cfg =
        context.side === 'white' ? whiteArcaneConfig : blackArcaneConfig;
      cfg[key] = (cfg[key] || 0) - 1;
    } else if (key === 'gainVAL') {
      offerGrant(context.side, 'sumnRV', 1);
      gifts.push('sumnRV');
      // Consume the gain spell
      const cfg =
        context.side === 'white' ? whiteArcaneConfig : blackArcaneConfig;
      cfg[key] = (cfg[key] || 0) - 1;
    } else if (key === 'gainPAW') {
      offerGrant(context.side, 'sumnP', 1);
      gifts.push('sumnP');
      // Consume the gain spell
      const cfg =
        context.side === 'white' ? whiteArcaneConfig : blackArcaneConfig;
      cfg[key] = (cfg[key] || 0) - 1;
    }
  }

  return { fired, gifts };
}

export function getProgressState(side) {
  return ArcanaProgression.getProgressState(side);
}

export { ArcanaProgression };
