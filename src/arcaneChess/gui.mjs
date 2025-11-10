import _ from 'lodash';
import { GameBoard, FROMSQ, MFLAGSHFT, MFLAGCA } from './board';
import {
  generatePlayableOptions,
  GenerateMoves,
  generatePowers,
  forcedEpAvailable,
  herrings,
} from './movegen';
import { SearchController, SearchPosition } from './search';
import {
  MakeMove,
  TakeMove,
  MovePiece,
  ClearPiece,
  AddPiece,
} from './makemove';
import {
  NOMOVE,
  BOOL,
  prettyToSquare,
  GameController,
  PCEINDEX,
  COLOURS,
  PIECES,
  Kings,
  PceChar,
  RtyChar,
} from './defs';
import { PrMove, ParseMove, PrSq } from './io';
import { SqAttacked } from './board.mjs';
import { blackArcaneConfig, whiteArcaneConfig } from './arcaneDefs.mjs';

export function validGroundMoves(summon = '', swap = '') {
  const moveMap = new Map();
  const validMovesReturn = validMoves(summon, swap);
  // collect shift destinations per origin (moves with the shift flag)
  // Map: fromKey -> Set of toKeys
  const shiftDests = new Map();

  for (let move of validMovesReturn) {
    const from = PrMove(move, 'array')[0];
    const to = PrMove(move, 'array')[1];
    if (!moveMap.has(from)) {
      moveMap.set(from, []);
    }
    moveMap.get(from).push(to);
    try {
      // mark shift destinations, but prefer castling when both a castle
      // and a shift to the same destination exist. Some arcana (eg.
      // shogun) can generate a shift to the same square as a castle;
      // in that case we don't want to tag the square as a shift.
      const isShiftFlag =
        typeof MFLAGSHFT !== 'undefined' && (move & MFLAGSHFT) !== 0;
      if (isShiftFlag) {
        // detect whether any generated move with the same from->to is a castle
        const hasCastleVariant = validMovesReturn.some((m2) => {
          try {
            const f2 = PrMove(m2, 'array')[0];
            const t2 = PrMove(m2, 'array')[1];
            return (
              f2 === from &&
              t2 === to &&
              typeof MFLAGCA !== 'undefined' &&
              (m2 & MFLAGCA) !== 0
            );
          } catch (e) {
            return false;
          }
        });

        if (!hasCastleVariant) {
          if (!shiftDests.has(from)) shiftDests.set(from, new Set());
          shiftDests.get(from).add(to);
        }
      }
    } catch (e) {
      // ignore if flags are unavailable for any reason
    }
  }
  // Attach optional metadata so callers can opt-in to shift-aware rendering.
  // Backwards-compatible: callers that expect a Map still get one.
  // Attach optional metadata so callers can opt-in to shift-aware rendering.
  // Backwards-compatible: callers that expect a Map still get one. shiftDests
  // is a Map keyed by origin -> Set of destination keys.
  moveMap.shiftDests = shiftDests;
  // optional: expose a place for callers to mark one or more shift
  // destinations as "active". Callers can set this to a Set of keys
  // or a Map(origin->Set(dest)). Renderer will look for movable.shiftActive.
  moveMap.shiftActive = new Set();
  return moveMap;
}

export const validSummonMoves = (piece) => {
  const moveMap = new Map();
  const validMovesReturn = validMoves('SUMMON', '', piece);

  for (let move of validMovesReturn) {
    const from =
      piece >= 31
        ? `R${RtyChar.split('')[piece]}@`
        : `${PceChar.split('')[piece].toUpperCase()}@`;
    const to = PrMove(move, 'array')[1];

    if (!moveMap.has(from)) {
      moveMap.set(from, []);
    }
    moveMap.get(from).push(to);
  }
  return moveMap;
};

export const validOfferingMoves = (userSummonPceRty) => {
  const moveMap = new Map();
  const validMovesReturn = validMoves('OFFERING', '', userSummonPceRty);
  for (let move of validMovesReturn) {
    const from = `o${userSummonPceRty}@`;
    const to = PrSq(FROMSQ(move));
    if (!moveMap.has(from)) {
      moveMap.set(from, []);
    }
    moveMap.get(from).push(to);
  }
  return moveMap;
};

export function validMoves(
  summon = 'COMP',
  swap = 'COMP',
  userSummonPieceRoyalty = 0,
  capturesOnly = false
) {
  const moves = [];
  let moveFound = NOMOVE;

  generatePowers();
  GenerateMoves(true, capturesOnly, summon, swap, userSummonPieceRoyalty);

  for (
    let index = GameBoard.moveListStart[GameBoard.ply];
    index < GameBoard.moveListStart[GameBoard.ply + 1];
    ++index
  ) {
    moveFound = GameBoard.moveList[index];
    if (MakeMove(moveFound) === BOOL.FALSE) {
      continue;
    }
    TakeMove();
    moves.push(moveFound);
  }

  if (moves.length === 0 && (forcedEpAvailable || herrings.length)) {
    generatePowers();
    GenerateMoves(false, capturesOnly, summon, swap, userSummonPieceRoyalty);
    for (
      let index = GameBoard.moveListStart[GameBoard.ply];
      index < GameBoard.moveListStart[GameBoard.ply + 1];
      ++index
    ) {
      moveFound = GameBoard.moveList[index];
      if (MakeMove(moveFound) === BOOL.FALSE) {
        continue;
      }
      TakeMove();
      moves.push(moveFound);
    }
    return moves;
  }
  return moves;
}

export function editAddPiece(sq, pce) {
  AddPiece(prettyToSquare(sq), pce);
}

export function editClearPiece(sq) {
  ClearPiece(prettyToSquare(sq));
}

export function editMovePiece(orig, dest) {
  var from = prettyToSquare(orig);
  var to = prettyToSquare(dest);
  MovePiece(from, to);
}

export function MakeUserMove(
  orig,
  dest,
  pieceEpsilon = PIECES.EMPTY,
  swapType = '',
  royaltyEpsilon = PIECES.EMPTY
) {
  let moveResult = ParseMove(
    orig,
    dest,
    pieceEpsilon,
    swapType,
    royaltyEpsilon
  );

  if (moveResult.isInitPromotion && pieceEpsilon === PIECES.EMPTY) {
    if (GameBoard.side === COLOURS.WHITE && whiteArcaneConfig.modsDIV > 0) {
      moveResult = ParseMove(orig, dest, PIECES.wV, swapType, royaltyEpsilon);
    } else if (
      GameBoard.side === COLOURS.BLACK &&
      blackArcaneConfig.modsDIV > 0
    ) {
      moveResult = ParseMove(orig, dest, PIECES.bV, swapType, royaltyEpsilon);
    } else {
      return { parsed: moveResult.parsed, isInitPromotion: BOOL.TRUE };
    }
  }

  if (moveResult.parsed === NOMOVE) {
    return { parsed: moveResult.parsed, isInitPromotion: BOOL.FALSE };
  }

  const makeResult = MakeMove(moveResult.parsed, 'userMove');
  if (makeResult === BOOL.FALSE) {
    return { parsed: NOMOVE, isInitPromotion: BOOL.FALSE };
  }

  CheckAndSet();

  return { parsed: moveResult.parsed, isInitPromotion: BOOL.FALSE };
}

export function DrawMaterial() {
  if (GameBoard.pceNum[PIECES.wP] != 0 || GameBoard.pceNum[PIECES.bP] != 0)
    return BOOL.FALSE;
  if (
    GameBoard.pceNum[PIECES.wQ] != 0 ||
    GameBoard.pceNum[PIECES.bQ] != 0 ||
    GameBoard.pceNum[PIECES.wR] != 0 ||
    GameBoard.pceNum[PIECES.bR] != 0 ||
    GameBoard.pceNum[PIECES.wT] != 0 ||
    GameBoard.pceNum[PIECES.bT] != 0 ||
    GameBoard.pceNum[PIECES.wM] != 0 ||
    GameBoard.pceNum[PIECES.bM] != 0
  )
    return BOOL.FALSE;
  if (GameBoard.pceNum[PIECES.wB] > 1 || GameBoard.pceNum[PIECES.bB] > 1) {
    return BOOL.FALSE;
  }
  if (GameBoard.pceNum[PIECES.wN] > 1 || GameBoard.pceNum[PIECES.bN] > 1) {
    return BOOL.FALSE;
  }

  if (GameBoard.pceNum[PIECES.wN] != 0 && GameBoard.pceNum[PIECES.wB] != 0) {
    return BOOL.FALSE;
  }
  if (GameBoard.pceNum[PIECES.bN] != 0 && GameBoard.pceNum[PIECES.bB] != 0) {
    return BOOL.FALSE;
  }

  // spectre and wraith combos depending on what square complex they are on can mate
  // 2 wraiths on different
  // 2 spectres on different
  // 1 of each on same

  return BOOL.TRUE;
}

export function ThreeFoldRep() {
  var i = 0,
    r = 0;

  for (i = 0; i < GameBoard.hisPly; ++i) {
    if (GameBoard.history[i].posKey == GameBoard.posKey) {
      r++;
    }
  }
  return r;
}

export function CheckResult(preset = GameBoard.preset) {
  if (GameBoard.fiftyMove >= 100) {
    return {
      gameOver: true,
      gameResult: 'fifty move rule',
    };
  }

  if (ThreeFoldRep() >= 2) {
    return {
      gameOver: true,
      gameResult: '3-fold repetition',
    };
  }

  if (DrawMaterial() === BOOL.TRUE) {
    return {
      gameOver: true,
      gameResult: 'insufficient material',
    };
  }

  if (preset === 'HORDE') {
    if (GameBoard.material[COLOURS.WHITE] === 150000) {
      return {
        gameOver: true,
        gameResult: 'black mates (all white material captured)',
      };
    }
  }
  if (preset === 'THRONE' || preset === 'DELIVERANCE') {
    let gameOverObj = null;
    for (const sq of GameBoard.kohSquares) {
      if (GameBoard.pieces[sq] === PIECES.wK) {
        gameOverObj = {
          gameOver: true,
          gameResult: 'white mates (king has been delivered)',
        };
        break;
      } else if (GameBoard.pieces[sq] === PIECES.bK) {
        gameOverObj = {
          gameOver: true,
          gameResult: 'black mates (king has been delivered)',
        };
        break;
      }
    }
    if (gameOverObj) return gameOverObj;
  }

  if (preset === 'XCHECK') {
    const opponent = GameBoard.side ^ 1;
    if (
      GameBoard.xCheckLimit[opponent] > 0 &&
      GameBoard.checksGiven[opponent] >= GameBoard.xCheckLimit[opponent]
    ) {
      if (GameBoard.side === COLOURS.WHITE) {
        return {
          gameOver: true,
          gameResult: 'black mates (3 check ending)',
        };
      } else {
        return {
          gameOver: true,
          gameResult: 'white mates (3 check ending)',
        };
      }
    }
  }

  if (preset === 'CAPALL') {
    if (
      GameBoard.material[COLOURS.WHITE] === 150000 ||
      GameBoard.material[COLOURS.WHITE] === 0
    ) {
      return {
        gameOver: true,
        gameResult: 'black mates (all white material captured)',
      };
    }
    if (
      GameBoard.material[COLOURS.BLACK] === 150000 ||
      GameBoard.material[COLOURS.BLACK] === 0
    ) {
      return {
        gameOver: true,
        gameResult: 'white mates (all black material captured)',
      };
    }
  }

  generatePlayableOptions(true, false, 'COMP', 'COMP');

  var MoveNum = 0;
  var found = 0;

  for (
    MoveNum = GameBoard.moveListStart[GameBoard.ply];
    MoveNum < GameBoard.moveListStart[GameBoard.ply + 1];
    ++MoveNum
  ) {
    if (MakeMove(GameBoard.moveList[MoveNum]) === BOOL.FALSE) {
      continue;
    }
    found++;
    TakeMove();
    break;
  }

  if (found !== 0) return BOOL.FALSE;

  var InCheck = SqAttacked(
    GameBoard.pList[PCEINDEX(Kings[GameBoard.side], 0)],
    GameBoard.side ^ 1
  );

  if (InCheck === BOOL.TRUE) {
    if (GameBoard.side === COLOURS.WHITE) {
      return {
        gameOver: true,
        gameResult: 'black mates',
      };
    } else {
      return {
        gameOver: true,
        gameResult: 'white mates',
      };
    }
  } else {
    return {
      gameOver: true,
      gameResult: 'stalemate',
    };
  }
}

export function CheckAndSet() {
  if (CheckResult().gameOver) {
    GameController.GameOver = BOOL.TRUE;
    return true;
  } else {
    GameController.GameOver = BOOL.FALSE;
    return false;
  }
}

export async function PreSearch(thinkingTime, depth, engineColor) {
  // not sure if needed but fixed problem with white not moving first
  // if (GameController.GameOver === BOOL.FALSE) {
  SearchController.thinking = BOOL.TRUE;
  await new Promise((resolve) => setTimeout(resolve, 200));
  const { bestMove, bestScore, text } = startSearch(
    thinkingTime,
    depth,
    engineColor
  );
  return { bestMove, bestScore, text };
  // }
}

export function engineSuggestion() {
  SearchController.depth = 7;
  SearchController.time = 8 * 1000;
  const { bestMove, bestScore, temporalPincer } = SearchPosition();
  return { bestMove, bestScore, temporalPincer };
}

const returnDialogueTypes = (score) => {
  const dialogue = [];

  if (score >= 700) {
    dialogue.push('lose1');
  }
  if (score >= 1500) {
    dialogue.push('lose2');
  }
  if (score >= 3000) {
    dialogue.push('lose3');
  }

  if (score <= -700) {
    dialogue.push('win1');
  }
  if (score <= -1500) {
    dialogue.push('win2');
  }
  if (score <= -3000) {
    dialogue.push('win3');
  }

  return dialogue;
};

export function startSearch(thinkingTime, depth, engineColor) {
  const engineArcana =
    engineColor === 'white' ? whiteArcaneConfig : blackArcaneConfig;
  const colorInt = engineColor === 'white' ? COLOURS.WHITE : COLOURS.BLACK;

  SearchController.depth = depth || 7;
  SearchController.time = thinkingTime * 1000;

  const { bestMove, bestScore } = SearchPosition();
  let text = [...returnDialogueTypes(bestScore)];

  if (
    _.some(_.keys(engineArcana), (key) => key === 'modsPHA') &&
    GameBoard.invisibility[colorInt] <= 0 &&
    engineArcana.modsPHA > 0
  ) {
    if (bestScore > 500 || bestScore < -500) {
      if (Math.random() > 0.15) {
        GameBoard.invisibility[colorInt] = 6;
        if (colorInt === COLOURS.WHITE) {
          whiteArcaneConfig.modsPHA -= 1;
        } else {
          blackArcaneConfig.modsPHA -= 1;
        }
        text.push(`${engineColor} used phantom mist!`);
      }
    }
  }
  if (
    _.some(_.keys(engineArcana), (key) => key === 'modsSUS') &&
    GameBoard.suspend <= 0 &&
    engineArcana.modsSUS > 0 &&
    GameBoard.invisibility[colorInt] <= 0
  ) {
    if (bestScore < -900) {
      if (Math.random() > 0.15) {
        // GameBoard.suspend = 6;
        if (colorInt === COLOURS.WHITE) {
          whiteArcaneConfig.modsSUS -= 1;
        } else {
          blackArcaneConfig.modsSUS -= 1;
        }

        const { bestMove, bestScore } = SearchPosition();

        text = [...returnDialogueTypes(bestScore)];
        text.push(
          `${engineColor} used bulletproof. No captures, checks, or promotions for 3 turns!`
        );

        MakeMove(bestMove, 'commit');
        CheckAndSet();
        return { bestMove, bestScore, text };
      }
    }
  }

  MakeMove(bestMove, 'commit');
  CheckAndSet();
  return { bestMove, bestScore, text };
}
