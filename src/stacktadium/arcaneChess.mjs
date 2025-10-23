import _ from 'lodash';
import {
  InitFilesRanksBrd,
  InitHashKeys,
  InitSq120To64,
  InitBoardVars,
} from './main';
import {
  InitMvvLva,
  generatePlayableOptions,
  herrings,
  forcedEpAvailable,
} from './movegen';
import {
  GameBoard,
  randomize,
  ParseFen,
  outputFenOfCurrentPosition,
} from './board';
import {
  validMoves,
  validGroundMoves,
  validSummonMoves,
  validOfferingMoves,
  MakeUserMove,
  PreSearch,
  engineSuggestion,
} from './gui';
import { SearchPosition } from './search.mjs';

import {
  whiteArcaneConfig,
  blackArcaneConfig,
  setWhiteArcana,
  setBlackArcana,
  POWERBIT,
} from './arcaneDefs.mjs';
import { COLOURS, PIECES, prettyToSquare } from './defs.mjs';
import { MakeMove, TakeMove } from './makemove.mjs';
import { PrSq } from './io';

export default function arcaneChess() {
  const init = () => {
    InitFilesRanksBrd();
    InitHashKeys();
    InitSq120To64();
    InitBoardVars();
    InitMvvLva();
  };

  const getScoreAndLine = (fen) => {
    ParseFen(fen);
    generatePlayableOptions();
    SearchPosition(fen);

    // how to update real time
    return Promise.resolve(GameBoard.cleanPV);
  };

  const startGame = (
    startFen,
    whiteConfig,
    blackConfig,
    royalties,
    preset = 'CLEAR'
  ) => {
    setWhiteArcana({
      ...whiteConfig,
    });
    setBlackArcana({
      ...blackConfig,
    });

    _.forEach(royalties, (value, key) => {
      GameBoard[key] = {};
      _.forEach(value, (v, k) => {
        const square = prettyToSquare(k);
        GameBoard[key][square] = v;
      });
    });

    GameBoard.preset = preset;

    if (preset === 'XCHECK') GameBoard.xCheckLimit[COLOURS.WHITE] = 3;
    if (preset === 'XCHECK') GameBoard.xCheckLimit[COLOURS.BLACK] = 3;
    if (preset === 'CRAZYHOUSE') GameBoard.crazyHouse[COLOURS.WHITE] = true;
    if (preset === 'CRAZYHOUSE') GameBoard.crazyHouse[COLOURS.BLACK] = true;
    if (preset === 'THRONE') {
      GameBoard.kohSquares.push(54, 55, 64, 65);
    }
    if (preset === 'DELIVERANCE') {
      GameBoard.kohSquares.push(91, 92, 93, 94, 95, 96, 97, 98);
    }

    ParseFen(startFen);

    generatePlayableOptions(true, false, 'COMP', '');
  };

  const activateDyad = (type) => {
    GameBoard.dyadName = type;
    GameBoard.dyad = POWERBIT[type];
    GameBoard.dyadClock = 0;
  };

  const deactivateDyad = () => {
    GameBoard.dyad = 0;
    GameBoard.dyadClock = 0;
    GameBoard.dyadName = '';
  };

  return {
    // filesRanksBoard: () => InitFilesRanksBrd(),
    init: () => init(),
    startGame: (fen, whiteConfig, blackConfig, royalties, preset) =>
      startGame(fen, whiteConfig, blackConfig, royalties, preset),
    randomize: (whiteConfig, blackConfig) =>
      randomize(whiteConfig, blackConfig),
    getScoreAndLine: (fen) => {
      return getScoreAndLine(fen);
      // copilot
      // return {
      //   score: GameBoard.searchHistory[GameBoard.ply],
      //   line: GameBoard.searchKillers[GameBoard.ply],
      // };
    },
    parseCurrentFen: () => {
      ParseFen(outputFenOfCurrentPosition(), false);
    },
    activateDyad: (type) => activateDyad(type),
    deactivateDyad: () => deactivateDyad(),
    getGroundMoves: (type2 = '') => {
      return validGroundMoves('', type2);
    },
    getSummonMoves: (piece) => {
      return validSummonMoves(piece);
    },
    getOfferingMoves: (type) => {
      return validOfferingMoves(type);
    },
    getSwapMoves: (swapType) => {
      return validGroundMoves('', swapType);
    },
    makeUserMove: (
      orig,
      dest,
      pieceEpsilon = PIECES.EMPTY,
      swapType = '',
      royaltyEpsilon
    ) => {
      return MakeUserMove(orig, dest, pieceEpsilon, swapType, royaltyEpsilon);
    },
    engineReply: async (thinkingTime, depth, engineColor) => {
      const { bestMove, text } = await PreSearch(
        thinkingTime,
        depth,
        engineColor
      );
      return { bestMove, text };
    },
    engineGlitch: () => {
      const moves = validMoves();
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      MakeMove(randomMove);
      return { bestMove: randomMove, text: ['glitch activated!'] };
    },
    getInvisibility: () => {
      return GameBoard.invisibility;
    },
    subtractArcanaUse: (type, color) => {
      if (color === 'white') {
        whiteArcaneConfig[type] -= 1;
      }
      if (color === 'black') {
        blackArcaneConfig[type] -= 1;
      }
    },
    engineSuggestion: async (playerColor, level) => {
      const playerArcana =
        playerColor === 'white' ? whiteArcaneConfig : blackArcaneConfig;
      if (level === 1) {
        playerArcana.modsIMP -= 1;
      }
      if (level === 2) {
        playerArcana.modsORA -= 1;
      }
      if (level === 3) {
        playerArcana.modsTEM -= 1;
      }
      return await engineSuggestion();
    },
    getDyadClock: () => {
      return GameBoard.dyadClock;
    },
    getDyadName: () => {
      return GameBoard.dyadName;
    },
    getDyadOwner: () => {
      return GameBoard.dyadOwner;
    },
    takeBackHalfDyad: () => {
      TakeMove(true);
    },
    takeBackMove: (ply, side, history) => {
      if (side === 'white') {
        whiteArcaneConfig.modsFUT -= 1;
      }
      if (side === 'black') {
        blackArcaneConfig.modsFUT -= 1;
      }
      _.times(ply, () => {
        if (history.length > 0) {
          const lastMove = history.pop();
          if (Array.isArray(lastMove)) {
            // wasDyadMove true:
            TakeMove(true);
            TakeMove();
          } else {
            TakeMove();
          }
        }
        GameBoard.ply = 0;
      });
    },
    generatePlayableOptions: (
      forcedMoves = true,
      capturesOnly = false,
      type = '',
      type2 = '',
      userSummonPceRty = 0
    ) => {
      return generatePlayableOptions(
        forcedMoves,
        capturesOnly,
        type,
        type2,
        userSummonPceRty
      );
    },
    getForcingOptions: () => {
      herrings, forcedEpAvailable;
    },
    addRoyalty: (type, sq, turns) => {
      GameBoard[type] = { [prettyToSquare(sq)]: turns };
    },
    getPrettyRoyalties: () => {
      const royalties = {
        royaltyQ: GameBoard.royaltyQ,
        royaltyT: GameBoard.royaltyT,
        royaltyM: GameBoard.royaltyM,
        royaltyV: GameBoard.royaltyV,
        royaltyE: GameBoard.royaltyE,
        royaltyF: GameBoard.royaltyF,
      };
      const transformedRoyalties = _.mapValues(royalties, (value) => {
        return _.mapKeys(value, (subValue, key) => {
          return PrSq(parseInt(key, 10));
        });
      });
      return transformedRoyalties;
    },
    getRoyalties: () => {
      return {
        royaltyQ: GameBoard.royaltyQ,
        royaltyT: GameBoard.royaltyT,
        royaltyM: GameBoard.royaltyM,
        royaltyV: GameBoard.royaltyV,
        royaltyE: GameBoard.royaltyE,
        royaltyF: GameBoard.royaltyF,
      };
    },
    clearRoyalties: () => {
      GameBoard.royaltyQ = {};
      GameBoard.royaltyT = {};
      GameBoard.royaltyM = {};
      GameBoard.royaltyV = {};
      GameBoard.royaltyE = {};
      GameBoard.royaltyF = {};
    },
    changeVarVars: (varVar) => {
      if (varVar === 'NORMAL') {
        console.log('');
      }
    },
  };
}
