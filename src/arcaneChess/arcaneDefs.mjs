export const whiteArcaneConfig = {};
export const blackArcaneConfig = {};

export const whiteArcaneInventory = {};
export const blackArcaneInventory = {};

const grantedByKey = { white: Object.create(null), black: Object.create(null) };

export const setWhiteArcana = (pool) => {
  Object.keys(whiteArcaneInventory).forEach(
    (k) => delete whiteArcaneInventory[k]
  );
  Object.keys(pool || {}).forEach((k) => {
    whiteArcaneInventory[k] = pool[k] | 0;
  });
  Object.keys(whiteArcaneConfig).forEach((k) => delete whiteArcaneConfig[k]);
  grantedByKey.white = Object.create(null);
  ArcanaProgression.resetSide('white');
  return whiteArcaneInventory;
};

export const setBlackArcana = (pool) => {
  Object.keys(blackArcaneInventory).forEach(
    (k) => delete blackArcaneInventory[k]
  );
  Object.keys(pool || {}).forEach((k) => {
    blackArcaneInventory[k] = pool[k] | 0;
  });
  Object.keys(blackArcaneConfig).forEach((k) => delete blackArcaneConfig[k]);
  grantedByKey.black = Object.create(null);
  ArcanaProgression.resetSide('black');
  return blackArcaneInventory;
};

export const clearArcanaConfig = () => {
  Object.keys(whiteArcaneConfig).forEach(
    (key) => delete whiteArcaneConfig[key]
  );
  Object.keys(blackArcaneConfig).forEach(
    (key) => delete blackArcaneConfig[key]
  );
};

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
  sumnP: 1,
  sumnS: 2,
  sumnH: 4,
  sumnN: 8,
  sumnB: 16,
  sumnR: 32,
  sumnQ: 64,
  sumnT: 128,
  sumnM: 256,
  sumnV: 512,
  sumnZ: 1024,
  sumnU: 2048,
  sumnW: 4096,
  sumnX: 8192,
  sumnRQ: 16384,
  sumnRT: 32768,
  sumnRM: 65536,
  sumnRV: 131072,
  sumnRE: 262144,
  sumnRY: 524288,
  sumnRZ: 1048576,
  sumnRA: 2097152,
  sumnRF: 4194304,
  sumnRG: 8388608,
  sumnRH: 16777216,
  sumnRI: 33554432,

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
  shftT: 16, // active
  shftG: 32,
  shftH: 64,
  shftI: 128,
  shftA: 256,
  shftK: 512,

  // 2 active 2
  swapDEP: 1,
  swapADJ: 2,

  // 4 mods 25
  modsCON: 1, // passive
  // modsAET: 2, // ON BY DEFAULT
  modsFUG: 4, // inherent
  modsSIL: 8, // inherent
  modsINH: 16, // inherent
  modsSUS: 32, // active
  modsGLU: 64, // inherent
  modsFUT: 128, // active
  modsREA: 256, // inherent
  modsEXT: 512, // inherent
  // modsSKI: 1024, // DEPRECATED
  modsTRO: 2048, // inherent
  modsREI: 4096, // inherent
  modsSOV: 8192, // passive
  modsDOP: 16384, // passive
  modsMAG: 32768, // active
  modsBLA: 65536, // active
  modsSUR: 131072, // passive
  modsDIM: 262144, // passive
  modsRES: 524288, // passive
  modsHER: 1048576, // inherent
  modsBAN: 2097152, // inherent
  modsFOG: 4194304, // passive
  modsMIS: 8388608, // passive
  modsHUR: 16777216, // passive

  // 6 on your piece death 4
  moriDYA: 1, // inherent
  moriROY: 2, // inherent
  moriPAW: 4, // inherent
  moriNOR: 8, // inherent

  // 7 on opponent piece death 4
  moraDYA: 1, // inherent
  moraROY: 2, // inherent
  moraPAW: 4, // inherent
  moraNOR: 8, // inherent

  // 8 area inherent 4
  areaC: 1,
  areaM: 2,
  areaT: 4,
  areaQ: 8,

  // 9 gain passive 3
  gainDYA: 1,
  gainVAL: 2,
  gainPAW: 4,
};

export const varVars = {
  // insert things like 960, crazyhouse, summons vs freezes, koh, xcheck, horde,
};

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

// for timeslot unlocks
const POWER_BY_KEY = {
  dyadA: 1,
  dyadB: 1,
  dyadC: 2,
  dyadD: 3,
  dyadE: 3,
  dyadF: 4,
  shftP: 1,
  shftN: 2,
  shftB: 2,
  shftR: 2,
  shftT: 3,
  shftG: 3,
  shftH: 3,
  shftI: 3,
  shftA: 2,
  swapDEP: 2,
  swapADJ: 2,
  sumnP: 1,
  sumnS: 2,
  sumnH: 2,
  sumnN: 2,
  sumnB: 2,
  sumnR: 3,
  sumnQ: 3,
  sumnT: 3,
  sumnM: 4,
  sumnV: 4,
  sumnZ: 4,
  sumnU: 4,
  sumnW: 4,
  sumnX: 4,
  sumnRQ: 4,
  sumnRT: 4,
  sumnRM: 5,
  sumnRV: 5,
  sumnRE: 5,
  sumnRY: 5,
  sumnRZ: 5,
  sumnRA: 5,
  sumnRF: 5,
  sumnRG: 5,
  sumnRH: 5,
  sumnRI: 5,
  modsCON: 1,
  modsAET: 3,
  modsFUG: 3,
  modsSIL: 4,
  modsINH: 4,
  modsSUS: 2,
  modsGLU: 3,
  modsFUT: 3,
  modsREA: 2,
  modsEXT: 4,
  modsTRO: 3,
  modsREI: 3,
  modsSOV: 2,
  modsDOP: 2,
  modsMAG: 3,
  modsBLA: 3,
  modsSUR: 1,
  modsDIM: 2,
  modsRES: 2,
  modsHER: 4,
  modsBAN: 5,
  modsFOG: 2,
  modsMIS: 2,
  modsHUR: 3,
  offrA: 1,
  offrB: 1,
  offrC: 1,
  offrD: 2,
  offrE: 2,
  offrF: 2,
  offrG: 2,
  offrH: 2,
  offrI: 3,
  offrJ: 3,
  offrK: 3,
  offrL: 3,
  offrM: 4,
  offrN: 4,
  offrO: 4,
  offrZ: 4,
  offrQ: 4,
  offrR: 4,
};

function sideKey(x) {
  return x === 0 || x === 'white' ? 'white' : 'black';
}

export function incLiveArcana(side, key, delta = 1) {
  const inv = side === 'white' ? whiteArcaneInventory : blackArcaneInventory;
  const live = side === 'white' ? whiteArcaneConfig : blackArcaneConfig;
  const cap = inv[key] | 0;
  const cur = live[key] | 0;
  const next =
    delta > 0 ? Math.min(cap, cur + delta) : Math.max(0, cur + delta);
  live[key] = next;
  return next !== cur;
}

export function offerGrant(side, key, qty = 1) {
  const inv = side === 'white' ? whiteArcaneInventory : blackArcaneInventory;
  const live = side === 'white' ? whiteArcaneConfig : blackArcaneConfig;

  const curLive = live[key] | 0;
  const curCap = inv[key] | 0;

  if (isStackingKey(key)) {
    const targetCap = Math.max(curCap, curLive + qty);
    inv[key] = targetCap;
    incLiveArcana(side, key, +qty);
  } else {
    inv[key] = Math.max(curCap, 1);
    incLiveArcana(side, key, curLive >= 1 ? 0 : +1);
  }
}

export function offerRevert(side, key, qty = 1) {
  const inv = side === 'white' ? whiteArcaneInventory : blackArcaneInventory;
  const live = side === 'white' ? whiteArcaneConfig : blackArcaneConfig;

  if (isStackingKey(key)) {
    incLiveArcana(side, key, -qty);
    const liveNow = live[key] | 0;
    inv[key] = Math.max(liveNow, (inv[key] | 0) - qty);
  } else {
    if ((live[key] | 0) > 0) incLiveArcana(side, key, -1);
    inv[key] = Math.max(live[key] | 0, 0);
  }
}

const STACKING_PREFIXES = ['sumn', 'offr', 'shft', 'swap', 'dyad'];
const STACKING_EXCEPTIONS = new Set([
  'modsSUS',
  'modsMAG',
  'modsBLA',
  'modsFUT',
  'modsCON',
  'modsSUR',
]);

function isStackingKey(key) {
  if (!key) return false;
  if (STACKING_EXCEPTIONS.has(key)) return true;
  for (const p of STACKING_PREFIXES) if (key.startsWith(p)) return true;
  return false;
}

function remainingFor(side, key) {
  const inv = side === 'white' ? whiteArcaneInventory : blackArcaneInventory;
  const live = side === 'white' ? whiteArcaneConfig : blackArcaneConfig;
  return (inv[key] | 0) - (live[key] | 0);
}
function universeFor(side) {
  const inv = side === 'white' ? whiteArcaneInventory : blackArcaneInventory;
  return Object.keys(inv).filter((k) => (inv[k] | 0) > 0);
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

    let pool = universeFor(s).filter(
      (k) => (POWER_BY_KEY[k] ?? 1) <= t && remainingFor(s, k) > 0
    );

    // If nothing fits current tier, fall back to the smallest POWER_BY_KEY that still has remaining
    if (!pool.length) {
      const all = universeFor(s).filter((k) => remainingFor(s, k) > 0);
      if (!all.length) return null;
      let minP = Infinity;
      for (const k of all) {
        const p = POWER_BY_KEY[k] ?? 1;
        if (p < minP) minP = p;
      }
      pool = all.filter((k) => (POWER_BY_KEY[k] ?? 1) === minP);
    }

    // Prefer strongest among the pool (deterministic tie-break by random index)
    let maxP = 1;
    for (const k of pool) {
      const p = POWER_BY_KEY[k] ?? 1;
      if (p > maxP) maxP = p;
    }
    const strongest = pool.filter((k) => (POWER_BY_KEY[k] ?? 1) === maxP);
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

  return {
    setEvery,
    setFirstAt,
    setEnabled,
    resetSide,
    onMoveCommitted,
    getProgressState,
  };
})();

export function getProgressState(side) {
  return ArcanaProgression.getProgressState(side);
}

export { ArcanaProgression };
