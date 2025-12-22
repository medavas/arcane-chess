import {
  PIECES,
  PceChar,
  PiecePawn,
  BOOL,
  PieceCol,
  RkDir,
  BiDir,
  WrDir,
  VaDir,
} from './defs.mjs';
import { GameBoard } from './board.mjs';
import arcanaData from '../../../shared/data/arcana.json' assert { type: 'json' };

// Helper function to get power value from arcana data
function getPowerByKey(key) {
  return arcanaData[key]?.value ?? 0;
}

// Dopl spell pools - spells that can replace dopl spells
export const DOPL_POOLS = {
  doplA: [
    'sumnP',
    'sumnRN',
    'sumnRF',
    'modsFUT',
    'modsIMP',
    'modsORA',
    'modsMAG',
    'modsRED',
    'swapADJ',
    'shftP',
    'shftB',
    'shftR',
    'gainPIN',
    'gainFOR',
    'gainOUT',
  ],
  doplB: [
    'dyadA',
    'sumnN',
    'sumnZ',
    'sumnU',
    'sumnB',
    'sumnR',
    'sumnRE',
    'sumnRY',
    'sumnRZ',
    'sumnRH',
    'shftI',
    'modsSUR',
    'modsSIL',
    'modsHEX',
    'modsBAN',
    'modsBOU',
    'swapDEP',
    'modsFLA',
  ],
  doplC: [
    'sumnS',
    'sumnW',
    'sumnX',
    'sumnRA',
    'sumnRI',
    // 'modsGLU',
    'modsGLA',
    'modsTRA',
    // 'modsPHA',
    // 'modsGLI',
    'shftG',
  ],
};

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
  triggerArcanaUpdateCallback();
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
  triggerArcanaUpdateCallback();
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

  // Reset check counts for gainCOM
  resetCheckCounts();
};

// Replace dopl spells with random spells from their respective pools
// @param {boolean} alsoReplaceInConfig - If true, also replaces dopl spells in the active config (for debug mode)
export const replaceDoplSpells = (alsoReplaceInConfig = false) => {
  let whiteDoplCount = 0;
  let blackDoplCount = 0;

  // Process white spellbook
  Object.keys(whiteArcaneSpellBook).forEach((key) => {
    if (key.startsWith('dopl') && DOPL_POOLS[key]) {
      const count = whiteArcaneSpellBook[key] | 0;
      if (count > 0) {
        whiteDoplCount += count;
        // Remove the dopl spell
        delete whiteArcaneSpellBook[key];

        // Add random spells from the pool
        for (let i = 0; i < count; i++) {
          const pool = DOPL_POOLS[key];
          const randomSpell = pool[Math.floor(Math.random() * pool.length)];
          whiteArcaneSpellBook[randomSpell] =
            (whiteArcaneSpellBook[randomSpell] | 0) + 1;
        }
      }
    }
  });

  // Process black spellbook
  Object.keys(blackArcaneSpellBook).forEach((key) => {
    if (key.startsWith('dopl') && DOPL_POOLS[key]) {
      const count = blackArcaneSpellBook[key] | 0;
      if (count > 0) {
        blackDoplCount += count;
        // Remove the dopl spell
        delete blackArcaneSpellBook[key];

        // Add random spells from the pool
        for (let i = 0; i < count; i++) {
          const pool = DOPL_POOLS[key];
          const randomSpell = pool[Math.floor(Math.random() * pool.length)];
          blackArcaneSpellBook[randomSpell] =
            (blackArcaneSpellBook[randomSpell] | 0) + 1;
        }
      }
    }
  });

  // Only replace dopl spells in config if specified (for debug mode where config is pre-populated)
  if (alsoReplaceInConfig) {
    Object.keys(whiteArcaneConfig).forEach((key) => {
      if (key.startsWith('dopl') && DOPL_POOLS[key]) {
        const count = whiteArcaneConfig[key] | 0;
        if (count > 0) {
          // Remove the dopl spell
          delete whiteArcaneConfig[key];

          // Add random spells from the pool (same ones added to spellbook)
          for (let i = 0; i < count; i++) {
            const pool = DOPL_POOLS[key];
            const randomSpell = pool[Math.floor(Math.random() * pool.length)];
            whiteArcaneConfig[randomSpell] =
              (whiteArcaneConfig[randomSpell] | 0) + 1;
          }
        }
      }
    });

    Object.keys(blackArcaneConfig).forEach((key) => {
      if (key.startsWith('dopl') && DOPL_POOLS[key]) {
        const count = blackArcaneConfig[key] | 0;
        if (count > 0) {
          // Remove the dopl spell
          delete blackArcaneConfig[key];

          // Add random spells from the pool (same ones added to spellbook)
          for (let i = 0; i < count; i++) {
            const pool = DOPL_POOLS[key];
            const randomSpell = pool[Math.floor(Math.random() * pool.length)];
            blackArcaneConfig[randomSpell] =
              (blackArcaneConfig[randomSpell] | 0) + 1;
          }
        }
      }
    });

    // Track that these spells were granted by dopl replacement, not progression
    // This prevents the progression system from granting extra spells
    if (whiteDoplCount > 0) {
      ArcanaProgression.creditGrantsGiven('white', whiteDoplCount);
    }
    if (blackDoplCount > 0) {
      ArcanaProgression.creditGrantsGiven('black', blackDoplCount);
    }
  }

  // Notify UI that arcana has changed
  triggerArcanaUpdateCallback();
};

// Optional UI callback to notify the React layer that arcana state changed.
let arcanaUpdateCallback = null;
export function registerArcanaUpdateCallback(cb) {
  arcanaUpdateCallback = cb;
}
export function unregisterArcanaUpdateCallback() {
  arcanaUpdateCallback = null;
}
export function triggerArcanaUpdateCallback() {
  try {
    if (typeof arcanaUpdateCallback === 'function') arcanaUpdateCallback();
  } catch (e) {
    console.warn(e);
  }
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

  // 3 summons active 27
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

  // 5 active - DEPRECATED: offr system replaced by dopl
  // keeping these for backward compatibility with old book data
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

  // 5 dopl (doppelganger) - replaces offr system
  doplA: 1, // any tier
  doplB: 2, // basic
  doplC: 4, // advanced
  // doplD: 8, // elite

  // 1 passive 9
  shftP: 1,
  shftN: 2,
  shftB: 4,
  shftR: 8,
  // shftT: 16, // active
  shftG: 32,
  // shftH: 64,
  shftI: 128,
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
  modsEVO: 8192, // passive      berserking evolution
  modsRED: 16384, // passive     blinding mist - reduce slider scope
  modsMAG: 32768, // active      magnet
  modsBOU: 65536, // inherent    bishop bounce (Mirror Strike)
  modsSUR: 131072, // passive    pawn surge
  modsDIM: 262144, // passive    5th dimension sword
  // modsHER: 524288, // passive    hermit
  // modsHEM: 1048576, // inherent  hemlock
  modsBAN: 2097152, // inherent  // banshee
  modsGLA: 4194304, // inherent  // glare - rook attacks apply disarmament
  // modsZ: 8388608, // passive     // .
  modsFLA: 16777216, // passive  // hurricane
  modsHEX: 33554432, // passive  // hexlash
  modsTRA: 67108864, // active   // trample - equus eliminates attacked piece without moving

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

  // 8 aura inherent 6
  auraF: 1,
  auraM: 2,
  auraT: 4,
  auraQ: 8,
  auraE: 16,
  auraN: 32,
  // wildcard that lets you change?

  // 9 gain passive 7
  gainDYA: 1,
  gainVAL: 2,
  gainPAW: 4,
  gainFOR: 8,
  gainPIN: 16,
  gainOUT: 32,
  gainCOM: 64,

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

// Helper function to check if a piece can be evolved
export function canEvolve(piece) {
  // Check if this piece can be evolved
  // White pieces: wP, wR, wM, wQ
  // Black pieces: bP, bR, bM, bQ
  return (
    piece === PIECES.wP ||
    piece === PIECES.wR ||
    piece === PIECES.wM ||
    piece === PIECES.wQ ||
    piece === PIECES.bP ||
    piece === PIECES.bR ||
    piece === PIECES.bM ||
    piece === PIECES.bQ
  );
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
  'dopl',
  'shft',
  'swap',
  'dyad',
  'mori',
  'mora',
  'aura',
  'gain',
  'tokn',
];
const STACKING_EXCEPTIONS = new Set([
  'modsSUS',
  'modsMAG',
  'modsBOU',
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

  function creditGrantsGiven(sideInput, count) {
    const s = sideKey(sideInput);
    const n = count | 0;
    if (n <= 0) return;

    grantsGiven[s] = (grantsGiven[s] | 0) + n;

    // Also adjust moveCount so the next spell grant happens at the correct time
    // If we've granted N spells already, set moveCount to simulate that those grants happened
    // Formula: moveCount = firstAt + (N - 1) * every
    const totalGrantsNow = grantsGiven[s];
    moveCount[s] = firstAt + (totalGrantsNow - 1) * every;
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
    creditGrantsGiven,
  };
})();

function mapPieceToSummonKey(piece) {
  const L = PceChar.charAt(piece);
  if (!L) return null;
  return 'sumn' + L.toUpperCase();
}

// Check if piece type should be tracked for once-per-type rewards (PNZUBRSW)
function isPieceTypeTracked(piece) {
  const L = PceChar.charAt(piece)?.toUpperCase();
  return L && 'PNZUBRSW'.includes(L);
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
      const pieceChar = PceChar.charAt(context.piece)?.toUpperCase();
      const shouldTrack = isPieceTypeTracked(context.piece);

      if (shouldTrack) {
        const alreadyTriggered = GameBoard.moriDYATriggered[pieceChar];

        if (!alreadyTriggered) {
          offerGrant(context.victimSide, 'dyadA', 1);
          moriGifts.push('dyadA');
          GameBoard.moriDYATriggered[pieceChar] = true;
        }
      }
    } else if (mk === 'moriROY' && isQTMV(context.piece)) {
      offerGrant(context.victimSide, 'sumnRV', 1);
      moriGifts.push('sumnRV');
    } else if (mk === 'moriPAW' && PiecePawn[context.piece] === BOOL.TRUE) {
      offerGrant(context.victimSide, 'dyadA', 1);
      moriGifts.push('dyadA');
    } else if (mk === 'moriNOR') {
      const pieceChar = PceChar.charAt(context.piece)?.toUpperCase();
      const shouldTrack = isPieceTypeTracked(context.piece);

      if (shouldTrack) {
        const sKey = mapPieceToSummonKey(context.piece);
        if (sKey) {
          const alreadyTriggered = GameBoard.moriNORTriggered[pieceChar];

          if (!alreadyTriggered) {
            offerGrant(context.victimSide, sKey, 1);
            moriGifts.push(sKey);
            GameBoard.moriNORTriggered[pieceChar] = true;
          }
        }
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
      const pieceChar = PceChar.charAt(context.piece)?.toUpperCase();
      const shouldTrack = isPieceTypeTracked(context.piece);

      if (shouldTrack) {
        const alreadyTriggered = GameBoard.moraDYATriggered[pieceChar];

        if (!alreadyTriggered) {
          offerGrant(context.killerSide, 'dyadA', 1);
          moraGifts.push('dyadA');
          GameBoard.moraDYATriggered[pieceChar] = true;
        }
      }
    } else if (nk === 'moraROY' && isQTMV(context.piece)) {
      offerGrant(context.killerSide, 'sumnRV', 1);
      moraGifts.push('sumnRV');
    } else if (nk === 'moraPAW' && PiecePawn[context.piece] === BOOL.TRUE) {
      offerGrant(context.killerSide, 'dyadA', 1);
      moraGifts.push('dyadA');
    } else if (nk === 'moraNOR') {
      const pieceChar = PceChar.charAt(context.piece)?.toUpperCase();
      const shouldTrack = isPieceTypeTracked(context.piece);

      if (shouldTrack) {
        const sKey = mapPieceToSummonKey(context.piece);
        if (sKey) {
          const alreadyTriggered = GameBoard.moraNORTriggered[pieceChar];

          if (!alreadyTriggered) {
            offerGrant(context.killerSide, sKey, 1);
            moraGifts.push(sKey);
            GameBoard.moraNORTriggered[pieceChar] = true;
          }
        }
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

// =======================
// Tactical Gain Spells
// =======================

// Track check counts for gainCOM (Combo Berserker)
const checkCounts = { white: 0, black: 0 };

export function resetCheckCounts() {
  checkCounts.white = 0;
  checkCounts.black = 0;
}

export function getCheckCount(side) {
  return checkCounts[sideKey(side)] || 0;
}

/**
 * Check if a side has the gainFOR, gainPIN, gainOUT, or gainCOM spells active
 */
export function getGainTacticsState(side) {
  const s = sideKey(side);
  const live = s === 'white' ? whiteArcaneConfig : blackArcaneConfig;

  const getLiveKeys = (live, prefix) =>
    Object.keys(live).filter(
      (k) =>
        k.startsWith(prefix) &&
        ((live[k] | 0) > 0 || live[k] === true || live[k] === 'true')
    );

  const gainAll = getLiveKeys(live, 'gain');

  return {
    gainFOR: gainAll.includes('gainFOR'),
    gainPIN: gainAll.includes('gainPIN'),
    gainOUT: gainAll.includes('gainOUT'),
    gainCOM: gainAll.includes('gainCOM'),
  };
}

/**
 * Detect if a move creates a fork (one piece attacking 2+ valuable pieces)
 * @param {number} fromSq - square the piece moved from
 * @param {number} toSq - square the piece moved to
 * @param {number} piece - the piece that moved
 * @param {number} side - 0 for white, 1 for black
 * @param {Function} attacksFromSquare - function to get attacked squares from a position
 * @returns {boolean}
 */
export function detectFork(fromSq, toSq, piece, side, attacksFromSquare) {
  // Only certain pieces are eligible to fork: N, Z, U, B, R, M, T, Q
  const eligibleForkingPieces = new Set([
    PIECES.wP,
    PIECES.bP, // Pawn
    PIECES.wN,
    PIECES.bN, // Knight
    PIECES.wZ,
    PIECES.bZ, // Z piece
    PIECES.wU,
    PIECES.bU, // U piece
    PIECES.wB,
    PIECES.bB, // Bishop
    PIECES.wR,
    PIECES.bR, // Rook
    PIECES.wM,
    PIECES.bM, // M piece
    PIECES.wT,
    PIECES.bT, // T piece
    PIECES.wQ,
    PIECES.bQ, // Queen
  ]);

  if (!eligibleForkingPieces.has(piece)) return false;

  // Get all squares attacked by the piece from its new position
  const attacks = attacksFromSquare(toSq, piece, side);
  if (!attacks || attacks.length < 2) return false;

  // Count how many enemy pieces that are NOT pawns are being attacked
  const sideNum = side === 'white' || side === 0 ? 0 : 1;
  const enemySide = sideNum === 0 ? 1 : 0;

  let attackedNonPawnCount = 0;
  for (const sq of attacks) {
    const targetPiece = GameBoard.pieces[sq];
    if (targetPiece === PIECES.EMPTY) continue;

    // Check if it's an enemy piece
    const targetColor = PieceCol[targetPiece];
    if (targetColor !== enemySide) continue;

    // Skip pawns
    const isTargetPawn = PiecePawn[targetPiece] === BOOL.TRUE;
    if (isTargetPawn) continue;

    attackedNonPawnCount++;
    if (attackedNonPawnCount >= 2) return true;
  }

  return false;
}

/**
 * Helper: Check if a slider at a specific square creates a pin
 * @param {number} sq - square of the slider
 * @param {number} piece - the slider piece
 * @param {number} sideNum - numeric side (0=white, 1=black)
 * @param {number} enemySide - numeric enemy side
 * @param {number} enemyKing - enemy king piece value
 * @param {boolean} hasREA - whether the side has modsREA active
 * @returns {boolean}
 */
function checkSliderForPin(sq, piece, sideNum, enemySide, enemyKing, hasREA) {
  // Check if piece is a slider that can create pins
  const isRook = piece === (sideNum === 0 ? PIECES.wR : PIECES.bR);
  const isBishop = piece === (sideNum === 0 ? PIECES.wB : PIECES.bB);
  const isQueen = piece === (sideNum === 0 ? PIECES.wQ : PIECES.bQ);
  const isMystic = piece === (sideNum === 0 ? PIECES.wM : PIECES.bM);
  const isTemplar = piece === (sideNum === 0 ? PIECES.wT : PIECES.bT);
  const isWraith = hasREA && piece === (sideNum === 0 ? PIECES.wW : PIECES.bW);
  const isValkyrie =
    hasREA && piece === (sideNum === 0 ? PIECES.wV : PIECES.bV);

  const isSlider =
    isRook ||
    isBishop ||
    isQueen ||
    isMystic ||
    isTemplar ||
    isWraith ||
    isValkyrie;
  if (!isSlider) {
    return false;
  }

  // Determine which directions this piece can slide
  const directions = [];
  if (isRook || isQueen || isMystic) {
    directions.push(...RkDir); // Orthogonal
  }
  if (isBishop || isQueen || isTemplar) {
    directions.push(...BiDir); // Diagonal
  }
  if (isWraith) {
    directions.push(...WrDir); // Wraith moves
  }
  if (isValkyrie) {
    directions.push(...VaDir); // Valkyrie moves
  }

  // Check each direction for pin pattern: slider -> 1 enemy piece -> enemy king
  for (const dir of directions) {
    let enemyPieceCount = 0;
    let foundKing = false;
    let pinnedPiece = null;
    // let pinnedSq = null;
    let testSq = sq;
    const piecesFound = [];

    let continueScanning = true;
    while (continueScanning) {
      testSq += dir;
      const pieceAtSq = GameBoard.pieces[testSq];

      if (pieceAtSq === PIECES.EMPTY) {
        continue;
      }
      if (pieceAtSq === PIECES.OFFBOARD) {
        break;
      }

      const pieceColor = PieceCol[pieceAtSq];
      const isEnemyKing = pieceAtSq === enemyKing;
      piecesFound.push({
        sq: testSq,
        piece: pieceAtSq,
        color: pieceColor,
        isKing: isEnemyKing,
      });

      if (pieceColor === enemySide) {
        enemyPieceCount++;

        // Store the first enemy piece (the pinned piece)
        if (enemyPieceCount === 1) {
          pinnedPiece = pieceAtSq;
          // pinnedSq = testSq;
        }

        if (isEnemyKing) {
          foundKing = true;
          break;
        }

        if (enemyPieceCount > 1) {
          break;
        }
      } else {
        // Found a friendly piece - can't pin through it
        break;
      }
    }

    // Pin detected if we found exactly 2 enemy pieces, one is the king, and the pinned piece is NOT a pawn
    if (enemyPieceCount === 2 && foundKing && pinnedPiece) {
      const isPinnedPiecePawn = PiecePawn[pinnedPiece] === BOOL.TRUE;
      if (!isPinnedPiecePawn) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detect if a move creates a pin (any friendly slider now pins enemy piece to their king)
 * @param {number} fromSq - square the piece moved from
 * @param {number} toSq - square the piece moved to
 * @param {number} piece - the piece that moved
 * @param {number} side - string 'white'/'black' or number 0/1
 * @returns {boolean}
 */
export function detectPin(fromSq, toSq, piece, side) {
  // Convert side to numeric if it's a string
  const sideNum = side === 'white' || side === 0 ? 0 : 1;
  const enemySide = sideNum === 0 ? 1 : 0;
  const enemyKing = enemySide === 0 ? PIECES.wK : PIECES.bK;

  // Get player's arcane config to check for modsREA
  const cfg = sideNum === 0 ? whiteArcaneConfig : blackArcaneConfig;
  const hasREA = (cfg.modsREA || 0) > 0;

  // Check all squares on the board for friendly sliders
  for (let sq = 21; sq <= 98; sq++) {
    const pieceAtSq = GameBoard.pieces[sq];
    if (pieceAtSq === PIECES.EMPTY || pieceAtSq === PIECES.OFFBOARD) {
      continue;
    }

    const pieceColor = PieceCol[pieceAtSq];
    if (pieceColor !== sideNum) {
      continue; // Not our piece
    }

    // Check if this slider creates a pin
    if (
      checkSliderForPin(sq, pieceAtSq, sideNum, enemySide, enemyKing, hasREA)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Detect if a pawn move creates an outpost (protects a piece on opponent's side)
 * @param {number} toSq - square the pawn moved to
 * @param {number} piece - the piece that moved (should be a pawn)
 * @param {number} side - 0 for white, 1 for black
 * @returns {boolean}
 */
export function detectOutpostCreation(toSq, piece, side) {
  // Check if the moved piece is a pawn
  const isPawn = PiecePawn[piece] === BOOL.TRUE;
  if (!isPawn) return false;

  // Convert side to numeric if it's a string
  const sideNum = side === 'white' || side === 0 ? 0 : 1;

  // Get the squares that this pawn now protects (diagonally forward)
  // For white pawns: protect top-left and top-right (toSq + 9, toSq + 11)
  // For black pawns: protect bottom-left and bottom-right (toSq - 11, toSq - 9)
  const protectedSquares =
    sideNum === 0
      ? [toSq + 9, toSq + 11] // White pawn protects upward
      : [toSq - 11, toSq - 9]; // Black pawn protects downward

  // Check each protected square for a friendly piece in an outpost position
  for (const sq of protectedSquares) {
    const targetPiece = GameBoard.pieces[sq];
    if (targetPiece === PIECES.EMPTY) continue;

    // Check if it's a friendly piece
    const targetColor =
      targetPiece <= 6
        ? 0
        : targetPiece <= 12
        ? 1
        : targetPiece <= 18
        ? 0
        : targetPiece <= 23
        ? 1
        : targetPiece <= 25
        ? 0
        : targetPiece <= 27
        ? 1
        : targetPiece === 28
        ? 0
        : targetPiece === 29
        ? 1
        : targetPiece === 30
        ? 1
        : -1;
    if (targetColor !== sideNum) continue;

    // Must not be a King or Pawn
    const isKing = targetPiece === PIECES.wK || targetPiece === PIECES.bK;
    const isTargetPawn = PiecePawn[targetPiece] === BOOL.TRUE;
    if (isKing || isTargetPawn) continue;

    // Check if the piece is on opponent's side of the board
    const rank = Math.floor(sq / 10);
    const isOnOpponentSide = sideNum === 0 ? rank >= 6 : rank <= 5;

    if (isOnOpponentSide) {
      return true; // Found a piece that's now in an outpost position
    }
  }

  return false;
}

/**
 * Detect if a piece created an outpost (piece on opponent's side protected by a pawn)
 * @param {number} toSq - square the piece moved to
 * @param {number} piece - the piece that moved
 * @param {number} side - 0 for white, 1 for black
 * @returns {boolean}
 */
export function detectOutpost(toSq, piece, side) {
  // Piece must not be a King or Pawn
  const isKing = piece === PIECES.wK || piece === PIECES.bK;
  const isPawn = PiecePawn[piece] === BOOL.TRUE;

  if (isKing || isPawn) return false;

  // Convert side to numeric if it's a string
  const sideNum = side === 'white' || side === 0 ? 0 : 1;

  // Check if piece is on opponent's side of the board
  // Board representation: 20s, 30s, 40s, 50s for white; 60s, 70s, 80s, 90s for black
  // Opponent's side means past the halfway point:
  // - White pieces on opponent's side: rank 6+ (60s, 70s, 80s)
  // - Black pieces on opponent's side: rank 5- (50s, 40s, 30s, 20s)
  // Get rank from tens digit of square number
  const rank = Math.floor(toSq / 10);

  // White needs rank >= 6 to be on black's side
  // Black needs rank <= 5 to be on white's side
  const isOnOpponentSide = sideNum === 0 ? rank >= 6 : rank <= 5;

  if (!isOnOpponentSide) return false;

  // Check if the square is protected by a friendly pawn
  const friendlyPawn = sideNum === 0 ? PIECES.wP : PIECES.bP;

  // Pawns protect diagonally
  // For white pawns: they protect from squares below-left and below-right
  // For black pawns: they protect from squares above-left and above-right
  const pawnDefenderSquares =
    sideNum === 0
      ? [toSq - 11, toSq - 9] // White pawns defend from bottom-left and bottom-right
      : [toSq + 11, toSq + 9]; // Black pawns defend from top-left and top-right

  for (const sq of pawnDefenderSquares) {
    if (GameBoard.pieces[sq] === friendlyPawn) {
      return true;
    }
  }

  return false;
}

/**
 * Apply rewards for tactical gain spells
 * @param {Object} context - { side, move, piece, fromSq, toSq, isCheck }
 * @param {Object} tacticsState - result from getGainTacticsState
 * @param {Function} attacksFromSquare - function to get attacks (needed for fork detection)
 * @returns {Object} - { fired, gifts, checkTriggered }
 */
export function applyGainTacticsRewards(
  context,
  tacticsState,
  attacksFromSquare = null
) {
  const gifts = [];
  let fired = false;
  let checkTriggered = false;
  const s = sideKey(context.side);
  const cfg = s === 'white' ? whiteArcaneConfig : blackArcaneConfig;

  // gainFOR - Fork detection
  if (tacticsState.gainFOR && attacksFromSquare) {
    const isFork = detectFork(
      context.fromSq,
      context.toSq,
      context.piece,
      context.side,
      attacksFromSquare
    );
    if (isFork) {
      fired = true;
      offerGrant(s, 'dyadA', 1);
      gifts.push('dyadA');
      // Consume the spell
      cfg.gainFOR = (cfg.gainFOR || 0) - 1;
    }
  }

  // gainPIN - Pin detection
  if (tacticsState.gainPIN) {
    const isPin = detectPin(
      context.fromSq,
      context.toSq,
      context.piece,
      context.side
    );
    if (isPin) {
      fired = true;
      offerGrant(s, 'dyadA', 1);
      gifts.push('dyadA');
      // Consume the spell
      cfg.gainPIN = (cfg.gainPIN || 0) - 1;
    }
  }

  // gainOUT - Outpost detection (triggered by pawn creating outpost OR piece moving to outpost)
  if (tacticsState.gainOUT) {
    // Check both: pawn creating an outpost, or piece moving to an outpost square
    const isPawnCreatingOutpost = detectOutpostCreation(
      context.toSq,
      context.piece,
      context.side
    );
    const isPieceOnOutpost = detectOutpost(
      context.toSq,
      context.piece,
      context.side
    );

    if (isPawnCreatingOutpost || isPieceOnOutpost) {
      fired = true;
      offerGrant(s, 'dyadA', 1);
      gifts.push('dyadA');
      // Consume the spell
      cfg.gainOUT = (cfg.gainOUT || 0) - 1;
    }
  }

  // gainCOM - Check counter (Combo Berserker)
  if (tacticsState.gainCOM && context.isCheck) {
    checkCounts[s] = (checkCounts[s] || 0) + 1;
    if (checkCounts[s] >= 4) {
      fired = true;
      checkTriggered = true;
      offerGrant(s, 'dyadA', 1);
      gifts.push('dyadA');
      checkCounts[s] = 0; // Reset counter after granting
    }
  }

  return { fired, gifts, checkTriggered, checkCount: checkCounts[s] || 0 };
}

export { ArcanaProgression };
