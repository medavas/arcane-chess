import { GameBoard } from './board';
import { PCEINDEX, PIECES, SQ64, COLOURS, MIRROR64 } from './defs';
import { whiteArcaneConfig, blackArcaneConfig } from './arcaneDefs.mjs';
import { unlockableArcana } from 'src/features/campaign/pages/book/ArcanaSelect';

// prettier-ignore
const PawnTable = [
  0, 0, 0, 0, 0, 0, 0, 0,
  10, 10, 0, -10, -10, 0, 10, 10,
  5, 0, 0, 5, 5, 0, 0, 5,
  0, 0, 10, 20, 20, 10, 0, 0,
  5, 5, 5, 10, 10, 5, 5, 5,
  10, 10, 10, 20, 20, 10, 10, 10, 
  20, 20, 20, 30, 30, 20, 20, 20,
  0, 0, 0, 0, 0, 0, 0, 0,
];
// prettier-ignore
const KnightTable = [
  0, -10, 0, 0, 0, 0, -10, 0,
  0, 0, 0, 5, 5, 0, 0, 0,
  0, 0, 10, 10, 10, 10, 0, 0,
  0, 0, 10, 20, 20, 10, 5, 0,
  5, 10, 15, 20, 20, 15, 10, 5,
  5, 10, 10, 20, 20, 10, 10, 5,
  0, 0, 5, 10, 10, 5, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
];
// prettier-ignore
const BishopTable = [
  0, 0, -10, 0, 0, -10, 0, 0,
  0, 0, 0, 10, 10, 0, 0, 0,
  0, 0, 10, 10, 10, 10, 0, 0,
  0, 10, 20, 20, 20, 20, 10, 0,
  0, 15, 15, 20, 20, 15, 15, 0,
  0, 0, 10, 15, 15, 10, 0, 0, 
  0, 0, 0, 10, 10, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
];
// prettier-ignore
const RookTable = [
  0, 0, 5, 10, 10, 5, 0, 0,
  0, 0, 5, 10, 10, 5, 0, 0,
  0, 0, 5, 10, 10, 5, 0, 0,
  0, 0, 5, 10, 10, 5, 0, 0,
  0, 0, 5, 10, 10, 5, 0, 0,
  0, 0, 5, 10, 10, 5, 0, 0,
  25, 25, 25, 25, 25, 25, 25, 25,
  0, 0, 5, 10, 10, 5, 0, 0,
];

// prettier-ignore
const KohTable = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 10, 10, 0, 0, 0,
  0, 0, 10, 15, 15, 10, 0, 0,
  0, 10, 15, 1000, 1000, 15, 10, 0,
  0, 10, 15, 1000, 1000, 15, 10, 0,
  0, 0, 10, 15, 15, 10, 0, 0, 
  0, 0, 0, 10, 10, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
];

// prettier-ignore
const deliverance = [
  99000, 99000, 99000, 99000, 99000, 99000, 99000, 99000,
  900, 900, 900, 900, 900, 900, 900, 900,
  800, 800, 800, 800, 800, 800, 800, 800,
  700, 700, 700, 700, 700, 700, 700, 700,
  600, 600, 600, 600, 600, 600, 600, 600,
  500, 500, 500, 500, 500, 500, 500, 500,
  -400, -400, -400, -400, -400, -400, -400, -400,
  -800, -800, -800, -800, -800, -800, -800, -800,
]

const BishopPair = 40;

// teleport not included
export const arcanaValues = () => {
  const allArcanaValues = unlockableArcana.reduce((acc, current) => {
    const multipliedCurrent = Object.entries(current).reduce(
      (obj, [key, val]) => {
        obj[key] = val * 100;
        return obj;
      },
      {}
    );
    return { ...acc, ...multipliedCurrent };
  }, {});
  return allArcanaValues;
};

export const arcanaScore = () => {
  const multipliedArcana = arcanaValues();
  const allKeys = new Set([
    ...Object.keys(whiteArcaneConfig),
    ...Object.keys(blackArcaneConfig),
  ]);

  const totalScore = [...allKeys].reduce((score, key) => {
    const whiteCount = whiteArcaneConfig[key] || 0;
    const blackCount = blackArcaneConfig[key] || 0;
    const arcanaVal = multipliedArcana[key] || 0;
    return score + whiteCount * arcanaVal - blackCount * arcanaVal;
  }, 0);

  return totalScore;
};

export function EvalPosition() {
  let score =
    GameBoard.material[COLOURS.WHITE] -
    GameBoard.material[COLOURS.BLACK] +
    arcanaScore();

  let pce;
  let sq;
  let pceNum;

  pce = PIECES.wP;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += PawnTable[SQ64(sq)];
  }

  pce = PIECES.bP;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= PawnTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wN;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += KnightTable[SQ64(sq)];
  }

  pce = PIECES.bN;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= KnightTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wH;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += KnightTable[SQ64(sq)];
  }

  pce = PIECES.bH;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= KnightTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wS;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += KnightTable[SQ64(sq)];
  }

  pce = PIECES.bS;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= KnightTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wV;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += KnightTable[SQ64(sq)];
  }

  pce = PIECES.bV;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= KnightTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wB;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += BishopTable[SQ64(sq)];
  }

  pce = PIECES.bB;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= BishopTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wM;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += BishopTable[SQ64(sq)];
  }

  pce = PIECES.bM;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= BishopTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wR;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += RookTable[SQ64(sq)];
  }

  pce = PIECES.bR;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= RookTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wQ;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += RookTable[SQ64(sq)];
  }

  pce = PIECES.bQ;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= RookTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wT;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += RookTable[SQ64(sq)];
  }

  pce = PIECES.bT;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= RookTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wZ;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += KnightTable[SQ64(sq)];
  }

  pce = PIECES.bZ;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= KnightTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wU;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += KnightTable[SQ64(sq)];
  }

  pce = PIECES.bU;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= KnightTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wW;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += KnightTable[SQ64(sq)];
  }

  pce = PIECES.bW;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= KnightTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wW;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += KnightTable[SQ64(sq)];
  }

  pce = PIECES.bW;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= KnightTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wX;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score += RookTable[SQ64(sq)];
  }

  pce = PIECES.bX;
  for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
    sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
    score -= RookTable[MIRROR64(SQ64(sq))];
  }

  if (GameBoard.preset === 'THRONE') {
    pce = PIECES.wK;
    for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
      sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
      score += KohTable[SQ64(sq)];
    }
  }

  if (GameBoard.preset === 'THRONE') {
    pce = PIECES.bK;
    for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
      sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
      score -= KohTable[MIRROR64(SQ64(sq))];
    }
  }

  if (GameBoard.preset === 'DELIVERANCE') {
    pce = PIECES.wK;
    for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
      sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
      score += deliverance[MIRROR64(SQ64(sq))];
    }
  }

  if (GameBoard.preset === 'DELIVERANCE') {
    pce = PIECES.bK;
    for (pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
      sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
      score -= deliverance[MIRROR64(SQ64(sq))];
    }
  }

  if (GameBoard.pceNum[PIECES.wB] >= 2) {
    score += BishopPair;
  }

  if (GameBoard.pceNum[PIECES.bB] >= 2) {
    score -= BishopPair;
  }

  if (GameBoard.side === COLOURS.WHITE) {
    return score;
  } else {
    return -score;
  }
}
