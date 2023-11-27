import _ from 'lodash';

// import all vars and functions from arcanechess folder that are not defined
import {
  FilesBrd,
  SQUARES,
  FR2SQ,
  BRD_SQ_NUM,
  PieceKeys,
  SideKey,
  CastleKeys,
  RANKS,
  FILES,
  COLOURS,
  PIECES,
  PieceCol,
  PieceVal,
  CASTLEBIT,
  BOOL,
  MAXPOSITIONMOVES,
  MAXDEPTH,
  PieceKnight,
  PieceRookQueen,
  PieceBishopQueen,
  PieceKing,
  PieceZebra,
  PieceUnicorn,
  RkDir,
  BiDir,
  KiDir,
  KnDir,
  VaDir,
  SpDir,
  HrDir,
  ZeDir,
  UnDir,
  PceDir,
  PieceSlides,
  PieceVanguard,
  PieceHerring,
  PieceSpectre,
  PceChar,
  FileChar,
  RankChar,
  SideChar,
  SQ120,
  updateStartFen,
  PCEINDEX,
  Kings,
} from './defs';
import { PrSq } from './io';
import { whiteArcaneConfig, blackArcaneConfig } from './arcaneDefs';

export function FROMSQ(m) {
  return m & 0x7f;
}
export function TOSQ(m) {
  return (m >> 7) & 0x7f;
}
export function CAPTURED(m) {
  return (m >> 14) & 0x1f;
}
export function PROMOTED(m) {
  return (m >> 21) & 0x1f;
}
export function ARCANEFLAG(m) {
  return (m >> 27) & 0x3f;
}

/*
  000 0000 0000 0000 0000 0000 0111 1111 -> From 0x7F
  000 0000 0000 0000 0011 1111 1000 0000 -> To >> 7, 0x7F
  000 0000 0000 0111 1100 0000 0000 0000 -> Captured >> 14, 0x1F
  000 0000 0000 1000 0000 0000 0000 0000 -> EP 0x80000
  000 0000 0001 0000 0000 0000 0000 0000 -> pawn start 0x100000
  000 0011 1110 0000 0000 0000 0000 0000 -> prom >> 21, 0x3E00000
  000 0100 0000 0000 0000 0000 0000 0000 -> Castle 0x4000000
*/

export const MFLAGEP = 0x80000;
export const MFLAGPS = 0x100000;
export const MFLAGCA = 0x4000000;

export const MFLAGCAP = 0xfc000;
export const MFLAGPROM = 0x3e00000;

// export const MFLAGSATK = 0x4000;
// export const MFLAGSDEP = 0x8000;
// export const MFLAGSADJ = 0x10000;

export const MFLAGSHFT = 0x8000000;
export const MFLAGCNSM = 0x10000000;
export const MFLAGSWAP = 0x20000000;
export const MFLAGSUMN = 0x40000000;
// export const MFLAGOFFR = 0x80000000;

export function SQOFFBOARD(sq) {
  if (FilesBrd[sq] === SQUARES.OFFBOARD) return BOOL.TRUE;
  return BOOL.FALSE;
}

export function HASH_PCE(pce, sq) {
  GameBoard.posKey ^= PieceKeys[pce * 120 + sq];
}
export function HASH_CA() {
  GameBoard.posKey ^= CastleKeys[GameBoard.castlePerm];
}
export function HASH_SIDE() {
  GameBoard.posKey ^= SideKey;
}
export function HASH_EP() {
  GameBoard.posKey ^= PieceKeys[GameBoard.enPas];
}

export const GameController = {};
GameController.EngineSide = COLOURS.BOTH;
GameController.PlayerSide = COLOURS.BOTH;
GameController.GameOver = BOOL.FALSE;

export const UserMove = {};
UserMove.from = SQUARES.NO_SQ;
UserMove.to = SQUARES.NO_SQ;

export const GameBoard = {};
export const SideText = GameBoard.side === COLOURS.WHITE ? 'White' : 'Black';

GameBoard.pieces = new Array(BRD_SQ_NUM);
GameBoard.side = COLOURS.WHITE;
GameBoard.fiftyMove = 0;
GameBoard.fenHistory = [];
GameBoard.hisPly = 0;
GameBoard.history = [];
GameBoard.ply = 0;
// Gameboard.SubPly = 0;
GameBoard.enPas = 0;
GameBoard.castlePerm = 0;
GameBoard.material = new Array(2); // WHITE, BLACK material of pieces
GameBoard.pceNum = new Array(30); // indexed by Pce
GameBoard.pList = new Array(30 * 36);

GameBoard.whiteArcane = [0, 0, 0, 0, 0];
GameBoard.blackArcane = [0, 0, 0, 0, 0];

GameBoard.summonRankLimits = [6, 6];
GameBoard.crazyHouse = [false, false];

GameBoard.summonMoveList = [];
GameBoard.swapMoveList = [];

GameBoard.kohSquares = [];

GameBoard.royaltyQ = {};
GameBoard.royaltyT = {};
GameBoard.royaltyM = {};
GameBoard.royaltyV = {};
GameBoard.royaltyE = {};

GameBoard.suspend = 0; // += not =
GameBoard.racingKings = false;
GameBoard.invisibility = [0, 0];

GameBoard.xCheckLimit = [0, 0];
GameBoard.checks = [0, 0];

GameBoard.dyadName = '';
GameBoard.dyad = 0;
GameBoard.dyadMax = [2, 2];
GameBoard.dyadClock = 0;

GameBoard.pass = false;

GameBoard.posKey = 0;
GameBoard.moveList = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveScores = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveListStart = new Array(MAXDEPTH);

GameBoard.PvTable = [];
GameBoard.PvArray = new Array(MAXDEPTH);
GameBoard.searchHistory = new Array(29 * BRD_SQ_NUM);
GameBoard.searchKillers = new Array(3 * MAXDEPTH);

// [ score int, 1, 2, 3, 4, 5, 6, 7, 8 ]
GameBoard.cleanPV = [];

export function CheckBoard() {
  let t_pceNum = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0,
  ];
  let t_material = [0, 0];
  let sq64, t_piece, t_pce_num, sq120;

  for (t_piece = PIECES.wP; t_piece <= PIECES.bU; t_piece++) {
    for (t_pce_num = 0; t_pce_num < GameBoard.pceNum[t_piece]; t_pce_num++) {
      sq120 = GameBoard.pList[PCEINDEX(t_piece, t_pce_num)];
      if (GameBoard.pieces[sq120] !== t_piece) {
        console.log('Error Pce Lists');
        return BOOL.FALSE;
      }
    }
  }

  for (sq64 = 0; sq64 < 64; sq64++) {
    sq120 = SQ120(sq64);
    t_piece = GameBoard.pieces[sq120];
    t_pceNum[t_piece]++;
    t_material[PieceCol[t_piece]] += PieceVal[t_piece];
  }

  for (t_piece = PIECES.wP; t_piece <= PIECES.bU; t_piece++) {
    if (t_pceNum[t_piece] !== GameBoard.pceNum[t_piece]) {
      console.log('Error t_pceNum');
      return BOOL.FALSE;
    }
  }

  if (
    t_material[COLOURS.WHITE] !== GameBoard.material[COLOURS.WHITE] ||
    t_material[COLOURS.BLACK] !== GameBoard.material[COLOURS.BLACK]
  ) {
    console.log('Error t_material');
    return BOOL.FALSE;
  }

  if (GameBoard.side !== COLOURS.WHITE && GameBoard.side !== COLOURS.BLACK) {
    console.log('Error GameBoard.side');
    return BOOL.FALSE;
  }

  if (GeneratePosKey() !== GameBoard.posKey) {
    console.log('Error GameBoard.posKey');
    return BOOL.FALSE;
  }
  return BOOL.TRUE;
}

export function PrintBoard() {
  let sq, file, rank, piece;

  console.log('\nGame Board:\n');
  for (rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
    let line = RankChar[rank] + '  ';
    for (file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
      sq = FR2SQ(file, rank);
      piece = GameBoard.pieces[sq];
      line += ' ' + PceChar[piece] + ' ';
    }
    console.log(line);
  }

  console.log('');
  let line = '   ';
  for (file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
    line += ' ' + FileChar[file] + ' ';
  }

  console.log(line);
  console.log('side:' + SideChar[GameBoard.side]);
  console.log('enPas:' + GameBoard.enPas);
  line = '';

  if (GameBoard.castlePerm & CASTLEBIT.WKCA) line += 'K';
  if (GameBoard.castlePerm & CASTLEBIT.WQCA) line += 'Q';
  if (GameBoard.castlePerm & CASTLEBIT.BKCA) line += 'k';
  if (GameBoard.castlePerm & CASTLEBIT.BQCA) line += 'q';
  console.log('castle:' + line);
  console.log('key:' + GameBoard.posKey.toString(16));
}

export function outputFenOfCurrentPosition() {
  let fenStr = '';
  let rank, file, sq, piece, emptyCount;

  for (rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
    emptyCount = 0;
    for (file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
      sq = FR2SQ(file, rank);
      piece = GameBoard.pieces[sq];
      if (piece === PIECES.EMPTY) {
        emptyCount++;
      } else {
        if (emptyCount !== 0) {
          fenStr += emptyCount;
          emptyCount = 0;
        }
        fenStr += PceChar[piece];
      }
    }
    if (emptyCount !== 0) {
      fenStr += emptyCount;
    }

    if (rank !== RANKS.RANK_1) {
      fenStr += '/';
    } else {
      fenStr += ' ';
    }
  }

  fenStr += SideChar[GameBoard.side] + ' ';
  if (
    GameBoard.castlePerm & CASTLEBIT.WKCA ||
    GameBoard.castlePerm & CASTLEBIT.WQCA ||
    GameBoard.castlePerm & CASTLEBIT.BKCA ||
    GameBoard.castlePerm & CASTLEBIT.BQCA
  ) {
    if (GameBoard.castlePerm & CASTLEBIT.WKCA) fenStr += 'K';
    if (GameBoard.castlePerm & CASTLEBIT.WQCA) fenStr += 'Q';
    if (GameBoard.castlePerm & CASTLEBIT.BKCA) fenStr += 'k';
    if (GameBoard.castlePerm & CASTLEBIT.BQCA) fenStr += 'q';
  } else {
    fenStr += '-';
  }
  fenStr += ' ';

  if (GameBoard.enPas === SQUARES.NO_SQ) {
    fenStr += '-';
  } else {
    fenStr += PrSq(GameBoard.enPas);
  }
  fenStr += ' ';
  fenStr += GameBoard.fiftyMove;
  fenStr += ' ';
  fenStr += Math.floor(GameBoard.hisPly / 2) + 1;

  return fenStr;
}

export function GeneratePosKey() {
  let finalKey = 0;
  let piece = PIECES.EMPTY;

  for (let sq = 0; sq < BRD_SQ_NUM; sq++) {
    piece = GameBoard.pieces[sq];
    if (piece !== PIECES.EMPTY && piece !== SQUARES.OFFBOARD) {
      finalKey ^= PieceKeys[piece * 120 + sq];
    }
  }

  if (GameBoard.side === COLOURS.WHITE) {
    finalKey ^= SideKey;
  }

  if (GameBoard.enPas !== SQUARES.NO_SQ) {
    finalKey ^= PieceKeys[GameBoard.enPas];
  }

  finalKey ^= CastleKeys[GameBoard.castlePerm];

  // console.log('final key', finalKey);

  return finalKey;
}

export function PrintPieceLists() {
  let piece, pceNum;

  for (piece = PIECES.wP; piece <= PIECES.bU; piece++) {
    for (pceNum = 0; pceNum < GameBoard.pceNum[piece]; pceNum++) {
      console.log(
        'Piece ' +
          PceChar[piece] +
          ' on ' +
          PrSq(GameBoard.pList[PCEINDEX(piece, pceNum)])
      );
    }
  }
}

export function UpdateListsMaterial() {
  let piece, sq, index, colour;

  for (index = 0; index < 29 * 120; index++) {
    GameBoard.pList[index] = PIECES.EMPTY;
  }

  for (index = 0; index < 2; index++) {
    GameBoard.material[index] = 0;
  }

  for (index = 0; index < 29; index++) {
    GameBoard.pceNum[index] = 0;
  }

  for (index = 0; index < 64; index++) {
    sq = SQ120(index);
    piece = GameBoard.pieces[sq];
    if (piece !== PIECES.EMPTY) {
      colour = PieceCol[piece];

      console.log(colour);
      GameBoard.material[colour] += PieceVal[piece];

      GameBoard.pList[PCEINDEX(piece, GameBoard.pceNum[piece])] = sq;
      GameBoard.pceNum[piece]++;
    }
  }
  // PrintPieceLists();
}

export function ResetBoard() {
  for (let index = 0; index < BRD_SQ_NUM; index++) {
    GameBoard.pieces[index] = SQUARES.OFFBOARD;
  }
  for (let index = 0; index < 64; index++) {
    GameBoard.pieces[SQ120(index)] = PIECES.EMPTY;
  }

  GameBoard.side = COLOURS.BOTH;
  GameBoard.enPas = SQUARES.NO_SQ;
  GameBoard.fiftyMove = 0;
  GameBoard.ply = 0;
  GameBoard.hisPly = 0;
  GameBoard.castlePerm = 0;
  GameBoard.posKey = 0;
  GameBoard.moveListStart[GameBoard.ply] = 0;

  GameBoard.whiteArcane = [0, 0, 0, 0, 0];
  GameBoard.blackArcane = [0, 0, 0, 0, 0];

  // GameBoard.crazyHouse = [false, false];

  GameBoard.summonMoveList = [];
  GameBoard.swapMoveList = [];

  GameBoard.kohSquares = [];

  // todo?
  // GameBoard.royaltyQ = {};
  // GameBoard.royaltyT = {};
  // GameBoard.royaltyM = {};
  // GameBoard.royaltyV = {};
  // GameBoard.royaltyE = {};

  GameBoard.suspend = 0; // += not =
  GameBoard.racingKings = false;
  GameBoard.invisibility = [0, 0];

  // GameBoard.xCheckLimit = [0, 0];
  // GameBoard.checks = [0, 0];

  GameBoard.dyadName = '';
  GameBoard.dyad = 0;
  GameBoard.dyadMax = [2, 2];
  GameBoard.dyadClock = 0;

  GameBoard.pass = false;
}

export function randomize(
  whiteConfig = {},
  blackConfig = {},
  WQT = 'T',
  BQT = 'Q'
) {
  function d(num) {
    return Math.floor(Math.random() * ++num);
  }

  function generateRandomRank(QT) {
    const rank = new Array(8).fill(null);
    rank[d(2) * 2] = 'B';
    rank[d(2) * 2 + 1] = 'B';
    rank[emptySquares(rank)[d(5)]] = QT;
    rank[emptySquares(rank)[d(4)]] = 'N';
    rank[emptySquares(rank)[d(3)]] = 'N';
    for (let x = 1; x <= 3; x++) {
      rank[emptySquares(rank)[0]] = x === 2 ? 'K' : 'R';
    }
    return rank;
  }

  function emptySquares(rank) {
    return rank
      .map((piece, index) => (piece === null ? index : null))
      .filter((index) => index !== null);
  }

  function mirrorRank(rank) {
    return rank.map((piece) => {
      if (piece === null) return null;
      return piece.toLowerCase();
    });
  }

  // if (preset) {
  //   const randomizeA = (QT) => generateRandomRank(QT);
  //   const blackRank = mirrorRank(randomizeA(BQT)).reverse().join('');
  //   console.log(
  //     `################################################## ${blackRank}/pppppppp/8/8/8/8/PPPPPPPP/${randomizeA(
  //       WQT
  //     ).join('')} w KQkq - 0 1`
  //   );
  //   return `${blackRank}/pppppppp/8/8/8/8/PPPPPPPP/${randomizeA(WQT).join(
  //     ''
  //   )} w KQkq - 0 1`;
  // } else
  if (whiteConfig.modsRAN === 'true' || blackConfig.modsRAN === 'true') {
    const randomRank = (QT) => generateRandomRank(QT);
    const whiteRank =
      blackConfig.modsRAN === 'true'
        ? randomRank(WQT).join('')
        : `RNB${WQT}KBNR`;
    const blackRank =
      whiteConfig.modsRAN === 'true'
        ? mirrorRank(randomRank(BQT)).reverse().join('')
        : `rnb${BQT.toLowerCase()}kbnr`;
    return `${blackRank}/pppppppp/8/8/8/8/PPPPPPPP/${whiteRank} w KQkq - 0 1`;
  } else {
    return `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`;
  }
}

export function ParseFen(fen) {
  ResetBoard();

  // todo repopulate the board with arcanes?

  let rank = RANKS.RANK_8;
  let file = FILES.FILE_A;
  let piece = 0;
  let count = 0;
  let sq120 = 0;
  let fenCnt = 0; // fen[fenCnt]

  while (rank >= RANKS.RANK_1 && fenCnt < fen.length) {
    count = 1;
    switch (fen[fenCnt]) {
      case 'p':
        piece = PIECES.bP;
        break;
      case 'r':
        piece = PIECES.bR;
        break;
      case 'n':
        piece = PIECES.bN;
        break;
      case 'b':
        piece = PIECES.bB;
        break;
      case 'k':
        piece = PIECES.bK;
        break;
      case 'q':
        piece = PIECES.bQ;
        break;
      case 'P':
        piece = PIECES.wP;
        break;
      case 'R':
        piece = PIECES.wR;
        break;
      case 'N':
        piece = PIECES.wN;
        break;
      case 'B':
        piece = PIECES.wB;
        break;
      case 'K':
        piece = PIECES.wK;
        break;
      case 'Q':
        piece = PIECES.wQ;
        break;
      case 'X':
        piece = PIECES.EXILE;
        break;
      case 'S':
        piece = PIECES.wS;
        break;
      case 'H':
        piece = PIECES.wH;
        break;
      case 'T':
        piece = PIECES.wT;
        break;
      case 'M':
        piece = PIECES.wM;
        break;
      case 'V':
        piece = PIECES.wV;
        break;
      case 's':
        piece = PIECES.bS;
        break;
      case 'h':
        piece = PIECES.bH;
        break;
      case 't':
        piece = PIECES.bT;
        break;
      case 'm':
        piece = PIECES.bM;
        break;
      case 'v':
        piece = PIECES.bV;
        break;
      case 'Z':
        piece = PIECES.wZ;
        break;
      case 'U':
        piece = PIECES.wU;
        break;
      case 'z':
        piece = PIECES.bZ;
        break;
      case 'u':
        piece = PIECES.bU;
        break;

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
        piece = PIECES.EMPTY;
        count = fen[fenCnt].charCodeAt() - '0'.charCodeAt();
        break;

      case '/':
      case ' ':
        rank--;
        file = FILES.FILE_A;
        fenCnt++;
        continue;
      default:
        console.log('FEN error');
        return;
    }

    for (let i = 0; i < count; i++) {
      sq120 = FR2SQ(file, rank);
      GameBoard.pieces[sq120] = piece;
      file++;
    }
    fenCnt++;
  } // while loop end

  // rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
  GameBoard.side = fen[fenCnt] === 'w' ? COLOURS.WHITE : COLOURS.BLACK;
  fenCnt += 2;

  for (let i = 0; i < 4; i++) {
    if (fen[fenCnt] == ' ') {
      break;
    }
    switch (fen[fenCnt]) {
      case 'K':
        GameBoard.castlePerm |= CASTLEBIT.WKCA;
        break;
      case 'Q':
        GameBoard.castlePerm |= CASTLEBIT.WQCA;
        break;
      case 'k':
        GameBoard.castlePerm |= CASTLEBIT.BKCA;
        break;
      case 'q':
        GameBoard.castlePerm |= CASTLEBIT.BQCA;
        break;
      default:
        break;
    }
    fenCnt++;
  }
  fenCnt++;

  if (fen[fenCnt] !== '-') {
    file = fen[fenCnt].charCodeAt() - 'a'.charCodeAt();
    rank = fen[fenCnt + 1].charCodeAt() - '1'.charCodeAt();
    console.log(
      'fen[fenCnt]:' + fen[fenCnt] + ' File:' + file + ' Rank:' + rank
    );
    GameBoard.enPas = FR2SQ(file, rank);
  }

  GameBoard.fenHistory = [fen];

  GameBoard.posKey = GeneratePosKey();
  UpdateListsMaterial();
  // PrintSqAttacked();
}

export function PrintSqAttacked() {
  let sq, file, rank, piece;

  console.log('\nAttacked:\n');

  for (rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
    let line = rank + 1 + '  ';
    for (file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
      sq = FR2SQ(file, rank);
      // GameBoard.side ^ 1
      if (SqAttacked(sq, GameBoard.side ^ 1) === BOOL.TRUE) piece = 'X';
      else piece = '-';
      line += ' ' + piece + ' ';
    }
    console.log(line);
  }

  console.log('');
}

export let InCheck = () => {
  return SqAttacked(
    GameBoard.pList[PCEINDEX(Kings[GameBoard.side], 0)],
    GameBoard.side ^ 1
  );
};

export function SqAttacked(sq, side) {
  let pce;
  let dir;
  let t_sq;
  let index;

  let overridePresent = (t_sq) =>
    GameBoard.royaltyQ[t_sq] > 0 ||
    GameBoard.royaltyT[t_sq] > 0 ||
    GameBoard.royaltyM[t_sq] > 0 ||
    GameBoard.royaltyV[t_sq] > 0 ||
    GameBoard.royaltyE[t_sq] > 0;

  // note OVERRIDES

  // note TEMPLAR MYSTIC
  for (index = 0; index < 8; index++) {
    pce = GameBoard.pieces[sq + KnDir[index]];
    if (
      pce !== SQUARES.OFFBOARD &&
      PieceCol[pce] === side &&
      (GameBoard.royaltyT[sq + KnDir[index]] > 0 ||
        GameBoard.royaltyM[sq + KnDir[index]] > 0) &&
      !(GameBoard.royaltyE[sq + KnDir[index]] > 0)
    ) {
      return BOOL.TRUE;
    }
  }

  // note QUEEN TEMPLAR
  for (index = 0; index < 4; index++) {
    dir = RkDir[index];
    t_sq = sq + dir;
    pce = GameBoard.pieces[t_sq];

    while (pce !== SQUARES.OFFBOARD) {
      if (pce !== PIECES.EMPTY) {
        if (
          (GameBoard.royaltyQ[t_sq] > 0 || GameBoard.royaltyT[t_sq] > 0) &&
          PieceCol[pce] === side &&
          !(GameBoard.royaltyE[t_sq] > 0)
        ) {
          return BOOL.TRUE;
        }
        break;
      }
      t_sq += dir;
      pce = GameBoard.pieces[t_sq];
    }
  }

  // note QUEEN MYSTIC
  for (index = 0; index < 4; index++) {
    dir = BiDir[index];
    t_sq = sq + dir;
    pce = GameBoard.pieces[t_sq];

    while (pce !== SQUARES.OFFBOARD) {
      if (pce !== PIECES.EMPTY) {
        if (
          (GameBoard.royaltyQ[t_sq] > 0 || GameBoard.royaltyM[t_sq] > 0) &&
          PieceCol[pce] === side &&
          !(GameBoard.royaltyE[t_sq] > 0)
        ) {
          return BOOL.TRUE;
        }
        break;
      }
      t_sq += dir;
      pce = GameBoard.pieces[t_sq];
    }
  }

  // vanguard
  for (index = 0; index < 24; index++) {
    pce = GameBoard.pieces[sq + VaDir[index]];
    if (
      pce !== SQUARES.OFFBOARD &&
      PieceCol[pce] === side &&
      GameBoard.royaltyV[sq + VaDir[index]] > 0 &&
      !(GameBoard.royaltyE[sq + VaDir[index]] > 0)
    ) {
      return BOOL.TRUE;
    }
  }

  // NO OVERRIDE

  // knight mystic templar
  for (index = 0; index < 8; index++) {
    pce = GameBoard.pieces[sq + KnDir[index]];
    if (
      pce !== SQUARES.OFFBOARD &&
      PieceCol[pce] === side &&
      PieceKnight[pce] === BOOL.TRUE &&
      !overridePresent(sq + KnDir[index]) &&
      !(GameBoard.royaltyE[sq + KnDir[index]] > 0)
    ) {
      return BOOL.TRUE;
    }
  }

  // rook queen templar
  for (index = 0; index < 4; index++) {
    dir = RkDir[index];
    t_sq = sq + dir;
    pce = GameBoard.pieces[t_sq];

    while (pce !== SQUARES.OFFBOARD) {
      if (pce !== PIECES.EMPTY) {
        if (
          PieceRookQueen[pce] === BOOL.TRUE &&
          PieceCol[pce] === side &&
          !overridePresent(t_sq) &&
          !(GameBoard.royaltyE[t_sq] > 0)
        ) {
          return BOOL.TRUE;
        }
        break;
      }
      t_sq += dir;
      pce = GameBoard.pieces[t_sq];
    }
  }

  // bishop queen mystic
  for (index = 0; index < 4; index++) {
    dir = BiDir[index];
    t_sq = sq + dir;
    pce = GameBoard.pieces[t_sq];

    while (pce !== SQUARES.OFFBOARD) {
      if (pce !== PIECES.EMPTY) {
        if (
          PieceBishopQueen[pce] === BOOL.TRUE &&
          PieceCol[pce] === side &&
          !overridePresent(t_sq) &&
          !(GameBoard.royaltyE[t_sq] > 0)
        ) {
          return BOOL.TRUE;
        }
        break;
      }
      t_sq += dir;
      pce = GameBoard.pieces[t_sq];
    }
  }

  // vanguard
  for (index = 0; index < 24; index++) {
    pce = GameBoard.pieces[sq + VaDir[index]];
    if (
      pce !== SQUARES.OFFBOARD &&
      PieceCol[pce] === side &&
      PieceVanguard[pce] === BOOL.TRUE &&
      !overridePresent(sq + VaDir[index]) &&
      !(GameBoard.royaltyE[sq + VaDir[index]] > 0)
    ) {
      return BOOL.TRUE;
    }
  }

  // king
  for (index = 0; index < 8; index++) {
    pce = GameBoard.pieces[sq + KiDir[index]];
    if (
      pce !== SQUARES.OFFBOARD &&
      PieceCol[pce] === side &&
      PieceKing[pce] === BOOL.TRUE &&
      !overridePresent(sq + KiDir[index]) &&
      !(GameBoard.royaltyE[sq + KiDir[index]] > 0)
    ) {
      return BOOL.TRUE;
    }
  }

  // pawn
  if (side === COLOURS.WHITE) {
    if (
      (GameBoard.pieces[sq - 11] === PIECES.wP &&
        !overridePresent(sq - 11) &&
        !(GameBoard.royaltyE[sq - 11] > 0)) ||
      (GameBoard.pieces[sq - 9] === PIECES.wP &&
        !overridePresent(sq - 9) &&
        !(GameBoard.royaltyE[sq - 9] > 0))
    ) {
      return BOOL.TRUE;
    }
  } else {
    if (
      (GameBoard.pieces[sq + 11] === PIECES.bP &&
        !overridePresent(sq + 11) &&
        !(GameBoard.royaltyE[sq + 11] > 0)) ||
      (GameBoard.pieces[sq + 9] === PIECES.bP &&
        !overridePresent(sq + 9) &&
        !(GameBoard.royaltyE[sq + 9] > 0))
    ) {
      return BOOL.TRUE;
    }
  }

  // spectre
  for (index = 0; index < 6; index++) {
    pce = GameBoard.pieces[sq + SpDir[index]];
    if (
      pce !== SQUARES.OFFBOARD &&
      PieceCol[pce] === side &&
      PieceSpectre[pce] === BOOL.TRUE &&
      !overridePresent(sq + SpDir[index]) &&
      !(GameBoard.royaltyE[sq + SpDir[index]] > 0)
    ) {
      return BOOL.TRUE;
    }
  }

  // herring
  for (index = 0; index < 4; index++) {
    pce = GameBoard.pieces[sq + HrDir[index]];
    if (
      pce !== SQUARES.OFFBOARD &&
      PieceCol[pce] === side &&
      PieceHerring[pce] === BOOL.TRUE &&
      !overridePresent(sq + HrDir[index]) &&
      !(GameBoard.royaltyE[sq + HrDir[index]] > 0)
    ) {
      return BOOL.TRUE;
    }
  }

  // Zebra
  for (index = 0; index < 8; index++) {
    pce = GameBoard.pieces[sq + ZeDir[index]];
    if (
      pce !== SQUARES.OFFBOARD &&
      PieceCol[pce] === side &&
      PieceZebra[pce] === BOOL.TRUE &&
      !overridePresent(sq + ZeDir[index]) &&
      !(GameBoard.royaltyE[sq + ZeDir[index]] > 0)
    ) {
      return BOOL.TRUE;
    }
  }

  // Unicorn
  for (index = 0; index < 8; index++) {
    pce = GameBoard.pieces[sq + UnDir[index]];
    if (
      pce !== SQUARES.OFFBOARD &&
      PieceCol[pce] === side &&
      PieceUnicorn[pce] === BOOL.TRUE &&
      !overridePresent(sq + UnDir[index]) &&
      !(GameBoard.royaltyE[sq + UnDir[index]] > 0)
    ) {
      return BOOL.TRUE;
    }
  }

  return BOOL.FALSE;
}
