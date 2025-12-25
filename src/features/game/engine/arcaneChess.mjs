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
  FROMSQ,
  TOSQ,
} from './board';
import {
  validMoves,
  validGroundMoves,
  validSummonMoves,
  validOfferingMoves,
  validMagnetMoves,
  validTrampleMoves,
  validBounceMoves,
  MakeUserMove,
  PreSearch,
  engineSuggestion,
} from './gui';
import { SearchPosition } from './search.mjs';

import {
  whiteArcaneConfig,
  blackArcaneConfig,
  whiteArcaneSpellBook,
  blackArcaneSpellBook,
  setWhiteArcana,
  setBlackArcana,
  replaceDoplSpells,
  triggerArcanaUpdateCallback,
  POWERBIT,
  ArcanaProgression,
} from './arcaneDefs.mjs';
import { COLOURS, PIECES, prettyToSquare, FILES, PCEINDEX } from './defs.mjs';
import { MakeMove, TakeMove } from './makemove.mjs';
import { PrSq } from './io';

export default function arcaneChess() {
  // toggle to debug - turns off turn slot unlocks
  // debug all spells
  let debugAllSpells = false; // prod
  // let debugAllSpells = true; // dev

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
    if (debugAllSpells) {
      // In debug mode, populate both config and spellBook and trigger callback
      Object.keys(whiteArcaneSpellBook).forEach(
        (k) => delete whiteArcaneSpellBook[k]
      );
      Object.keys(blackArcaneSpellBook).forEach(
        (k) => delete blackArcaneSpellBook[k]
      );
      Object.assign(whiteArcaneSpellBook, whiteConfig);
      Object.assign(blackArcaneSpellBook, blackConfig);
      Object.assign(whiteArcaneConfig, whiteConfig);
      Object.assign(blackArcaneConfig, blackConfig);
      // Replace dopl spells with random spells from their pools (including in config for debug mode)
      replaceDoplSpells(true);
      triggerArcanaUpdateCallback();
    } else {
      // Set how often arcana is granted
      ArcanaProgression.setEvery(5);

      setWhiteArcana({
        ...whiteConfig,
      });
      setBlackArcana({
        ...blackConfig,
      });
      // Replace dopl spells with random spells from their pools
      // Note: We pass true here because dopl spells should be immediately replaced and available
      // The config will only have the dopl replacement spells, other spells still come through progression
      replaceDoplSpells(true);
      // In prod mode, the config starts with only the dopl replacement spells
      // Other spells in the spellBook will be granted through progression as moves are made
    }

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

    // Log spells in hand at game start
    console.log('=== GAME START - SPELLS IN HAND ===');
    console.log('White hand:', Object.keys(whiteArcaneConfig).filter(k => whiteArcaneConfig[k] > 0).join(', ') || 'none');
    console.log('Black hand:', Object.keys(blackArcaneConfig).filter(k => blackArcaneConfig[k] > 0).join(', ') || 'none');
    console.log('===================================');
  };

  const activateDyad = (type) => {
    GameBoard.dyadName = type;
    GameBoard.dyad = POWERBIT[type];
    GameBoard.dyadClock = 0;
    GameBoard.dyadOwner = GameBoard.side === COLOURS.WHITE ? 'white' : 'black';
  };

  const deactivateDyad = () => {
    GameBoard.dyad = 0;
    GameBoard.dyadClock = 0;
    GameBoard.dyadName = '';
    GameBoard.dyadOwner = undefined;
  };

  const activateEvo = () => {
    GameBoard.evo = 1;
    GameBoard.evoClock = 0;
    GameBoard.evoOwner = GameBoard.side === COLOURS.WHITE ? 'white' : 'black';
  };

  const deactivateEvo = () => {
    // Only decrement if evolution was actually used (at least one move made)
    if (GameBoard.evo > 0 && GameBoard.evoOwner && GameBoard.evoClock > 0) {
      const ownerIsWhite = GameBoard.evoOwner === 'white';
      const config = ownerIsWhite ? whiteArcaneConfig : blackArcaneConfig;
      const spellBook = ownerIsWhite
        ? whiteArcaneSpellBook
        : blackArcaneSpellBook;

      if (config.modsEVO > 0) {
        config.modsEVO -= 1;
        spellBook.modsEVO = Math.max(0, (spellBook.modsEVO ?? 0) - 1);
        triggerArcanaUpdateCallback();
      }
    }

    GameBoard.evo = 0;
    GameBoard.evoClock = 0;
    GameBoard.evoOwner = undefined;
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
    activateEvo: () => activateEvo(),
    deactivateEvo: () => deactivateEvo(),
    getGroundMoves: (type2 = '') => {
      return validGroundMoves('', type2);
    },
    getSummonMoves: (piece) => {
      return validSummonMoves(piece);
    },
    getOfferingMoves: (type) => {
      return validOfferingMoves(type);
    },
    getMagnetMoves: (magnetType) => {
      return validMagnetMoves(magnetType);
    },
    getTrampleMoves: (trampleType) => {
      return validTrampleMoves(trampleType);
    },
    getBounceMoves: (bounceType) => {
      return validBounceMoves(bounceType);
    },
    getSwapMoves: (swapType) => {
      return validGroundMoves('', swapType);
    },
    isForcedEnPassantActive: () => {
      // Returns true if the current moving player is forced to make an en passant capture
      // This blocks spell usage when modsTRO is forcing a capture
      return GameBoard.troActive === 1;
    },
    getIfTrojanGambitExists: (playerColor) => {
      // Badge should only glow for the player who HAS the modsTRO spell forcing opponent to capture
      // Example: White has modsTRO, Black must capture → White's badge glows (in opponent panel)
      if (!GameBoard.troActive) return false;

      // Check which player's modsTRO is forcing the current player to capture
      const isWhiteTurn = GameBoard.side === 0;
      const isBlackTurn = GameBoard.side === 1;

      const whiteHasTrojan = (GameBoard.whiteArcane[4] & 2048) !== 0;
      const blackHasTrojan = (GameBoard.blackArcane[4] & 2048) !== 0;

      // White is moving AND must capture → Black has modsTRO forcing White
      if (isWhiteTurn && blackHasTrojan && playerColor === 'black') {
        return true;
      }

      // Black is moving AND must capture → White has modsTRO forcing Black
      if (isBlackTurn && whiteHasTrojan && playerColor === 'white') {
        return true;
      }

      return false;
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
    useBulletproof: async (playerColor) => {
      const playerArcana =
        playerColor === 'white' ? whiteArcaneConfig : blackArcaneConfig;
      playerArcana.modsSUS -= 1;
      GameBoard.suspend = 6;
    },
    useBlindingMist: (playerColor) => {
      const playerArcana =
        playerColor === 'white' ? whiteArcaneConfig : blackArcaneConfig;
      const opponentColorInt =
        playerColor === 'white' ? COLOURS.BLACK : COLOURS.WHITE;
      playerArcana.modsRED -= 1;
      GameBoard.mist[opponentColorInt] = 8;
    },
    swapFilePieces: (playerColor) => {
      const playerArcana =
        playerColor === 'white' ? whiteArcaneConfig : blackArcaneConfig;
      playerArcana.modsFLA -= 1;

      // Swap all pieces on A file (FILE_A = 0) with H file (FILE_H = 7)
      // The board uses 120-square representation, valid squares are 21-98
      // Iterate through all ranks (0-7), swap pieces between A and H files
      for (let rank = 0; rank < 8; rank++) {
        // Calculate square indices: 21 + file + rank * 10
        const aFileSq = 21 + FILES.FILE_A + rank * 10;
        const hFileSq = 21 + FILES.FILE_H + rank * 10;

        const pieceOnA = GameBoard.pieces[aFileSq];
        const pieceOnH = GameBoard.pieces[hFileSq];

        // Skip this rank if either square has a king
        if (
          pieceOnA === PIECES.wK ||
          pieceOnA === PIECES.bK ||
          pieceOnH === PIECES.wK ||
          pieceOnH === PIECES.bK
        ) {
          continue;
        }

        // Simple swap: store both pieces, clear both squares, place them on opposite sides
        GameBoard.pieces[aFileSq] = pieceOnH;
        GameBoard.pieces[hFileSq] = pieceOnA;

        // Update piece lists if pieces exist
        if (pieceOnH !== PIECES.EMPTY) {
          for (let index = 0; index < GameBoard.pceNum[pieceOnH]; index++) {
            if (GameBoard.pList[PCEINDEX(pieceOnH, index)] === hFileSq) {
              GameBoard.pList[PCEINDEX(pieceOnH, index)] = aFileSq;
              break;
            }
          }
        }

        if (pieceOnA !== PIECES.EMPTY) {
          for (let index = 0; index < GameBoard.pceNum[pieceOnA]; index++) {
            if (GameBoard.pList[PCEINDEX(pieceOnA, index)] === aFileSq) {
              GameBoard.pList[PCEINDEX(pieceOnA, index)] = hFileSq;
              break;
            }
          }
        }
      }

      // Switch turns
      GameBoard.side =
        GameBoard.side === COLOURS.WHITE ? COLOURS.BLACK : COLOURS.WHITE;
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
      let time = 1000;
      if (level === 3) {
        playerArcana.modsTEM -= 1;
        time = 3000;
      }
      const { bestMove, temporalPincer } = await engineSuggestion(time);

      if (level === 1) {
        return PrSq(FROMSQ(bestMove));
      }
      if (level === 2) {
        return PrSq(FROMSQ(bestMove)) + PrSq(TOSQ(bestMove));
      }
      if (level === 3) {
        return temporalPincer;
      }
      return '';
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
    getEnginePly: () => {
      return GameBoard.hisPly;
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

      // Revert charge progression for both sides by 2 turns (4 half-moves)
      // This ensures the charge state matches the reverted board position
      ArcanaProgression.rewindBy('white', 2);
      ArcanaProgression.rewindBy('black', 2);
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
        royaltyN: GameBoard.royaltyN,
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
        royaltyN: GameBoard.royaltyN,
      };
    },
    hasDivineReckoning: () => {
      if (GameBoard.side === COLOURS.WHITE) {
        return whiteArcaneConfig.modsDIV > 0;
      } else {
        return blackArcaneConfig.modsDIV > 0;
      }
    },
    clearRoyalties: () => {
      GameBoard.royaltyQ = {};
      GameBoard.royaltyT = {};
      GameBoard.royaltyM = {};
      GameBoard.royaltyV = {};
      GameBoard.royaltyE = {};
      GameBoard.royaltyF = {};
      GameBoard.royaltyN = {};
    },
    changeVarVars: (varVar) => {
      if (varVar === 'NORMAL') {
        console.log('');
      }
    },
    exposeForcedEpState: () => {
      return { forcedEpAvailable: GameBoard.troActive };
    },
    hasGluttony: (color) => {
      if (color === 'white') {
        return (whiteArcaneSpellBook.modsGLU || 0) > 0;
      } else {
        return (blackArcaneSpellBook.modsGLU || 0) > 0;
      }
    },
  };
}
