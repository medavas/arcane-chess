import React, { createRef } from 'react';
import axios from 'axios';
import _ from 'lodash';

import { connect } from 'react-redux';
import { withRouter } from 'src/shared/hooks/withRouter/withRouter';
import { Link } from 'react-router-dom';

import GlobalVolumeControl from 'src/shared/utils/audio/GlobalVolumeControl';

import { audioManager } from 'src/shared/utils/audio/AudioManager';

import './MissionView.scss';
import 'src/features/game/board/styles/chessground.scss';
import 'src/features/game/board/styles/normal.scss';
import 'src/features/game/board/styles/lambda.scss';

import {
  setLocalStorage,
  getLocalStorage,
} from 'src/shared/utils/handleLocalStorage';
import { swapArmies } from 'src/shared/utils/utils';

import TactoriusModal from 'src/shared/components/Modal/Modal';
import PromotionModal from 'src/features/game/components/PromotionModal/PromotionModal';

import arcaneChess from 'src/features/game/engine/arcaneChess.mjs';
// import {
//   arcane as arcaneChess,
//   arcaneChessWorker,
// } from 'src/features/game/engine/arcaneChessInstance.js';

import { GameBoard, InCheck } from 'src/features/game/engine/board.mjs';
import { PrSq } from 'src/features/game/engine/io.mjs';
import { PIECES } from 'src/features/game/engine/defs.mjs';
import { SearchController } from 'src/features/game/engine/search.mjs';

import {
  whiteArcaneConfig,
  blackArcaneConfig,
  clearArcanaConfig,
} from 'src/features/game/engine/arcaneDefs.mjs';

import { IChessgroundApi } from 'src/features/game/board/chessgroundMod';
import ChessClock from 'src/features/game/components/Clock/Clock';
import { SpellHandler } from 'src/features/game/utils/SpellHandler';
import Button from 'src/shared/components/Button/Button';
import { BoardUX } from 'src/features/game/components/BoardUX/BoardUX';
import { ArcanaSelector } from 'src/features/game/components/ArcanaSelector/ArcanaSelector';
import { GameEngineHandler } from 'src/features/game/utils/GameEngineHandler';
import { HistoryHandler } from 'src/features/game/utils/HistoryHandler';
import { OpponentPanel } from 'src/features/game/components/GamePanels/OpponentPanel';

import book1 from 'src/shared/data/books/book1.json';
import book2 from 'src/shared/data/books/book2.json';
import book3 from 'src/shared/data/books/book3.json';
import book4 from 'src/shared/data/books/book4.json';
import book5 from 'src/shared/data/books/book5.json';
import book6 from 'src/shared/data/books/book6.json';
import book7 from 'src/shared/data/books/book7.json';
import book8 from 'src/shared/data/books/book8.json';
import book9 from 'src/shared/data/books/book9.json';
import book10 from 'src/shared/data/books/book10.json';
import book11 from 'src/shared/data/books/book11.json';
import book12 from 'src/shared/data/books/book12.json';

const booksMap: { [key: string]: { [key: string]: Node } } = {
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  book7,
  book8,
  book9,
  book10,
  book11,
  book12,
};

const pieces: PieceRoyaltyTypes = PIECES;

interface PieceRoyaltyTypes {
  [key: string]: number;
}

interface Node {
  id: string;
  title: string;
  time: number[][];
  nodeText: string;
  reward: (number | string)[];
  diagWinLose: {
    win1: string;
    win2: string;
    win3: string;
    victory: string;
    lose1: string;
    lose2: string;
    lose3: string;
    defeat: string;
  };
  prereq: string;
  opponent: string;
  hero: string;
  boss: boolean;
  theme: string;
  panels: {
    [key: string]: {
      fen: string;
      fenHistory: string[];
      history: string[];
      panelText: string;
      arrowsCircles?: {
        orig: string;
        brush: string;
        dest?: string | undefined;
      }[];
      royalties: {
        [key: string]: { [key: string]: number };
      };
      preset: string;
      whiteArcane?: { [key: string]: number | string };
      blackArcane?: { [key: string]: number | string };
      // orientation: string;
      config: {
        [key: string]: boolean | string | number;
      };
      correctMoves?: string[];
      orientation: string;
      turn?: string;
      // dialogue: [
      //   // [ 'narrator', 'message']
      //   // [ 'medavas', 'message']
      //   // no text from creator, just put in a blank message that doesn't add anything to the ui
      //   [string | null, string | null],
      // ];
    };
  };
}

interface State {
  turn: string;
  timeLeft: number | null;
  playerClock: number | null;
  playerInc: number | null;
  playerColor: string;
  engineColor: string;
  thinking: boolean;
  thinkingTime: number;
  engineDepth: number;
  historyPly: number;
  history: (string | string[])[];
  fenHistory: string[];
  lastMoveHistory: string[][];
  pvLine?: string[];
  hasMounted: boolean;
  nodeId: string;
  fen: string;
  engineLastMove: string[];
  whiteFaction: string;
  blackFaction: string;
  selected: string;
  config: {
    [key: string | number]: {
      disabled: boolean;
      powers: {
        [key: string | number]: string | number | readonly string[] | undefined;
      };
      picks: number;
    };
  };
  gameOver: boolean;
  gameOverType: string;
  whiteArcana: {
    [key: string]: number | string | undefined;
    modsIMP?: number | undefined;
    modsORA?: number | undefined;
    modsTEM?: number | undefined;
  };
  blackArcana: {
    [key: string]: number | string | undefined;
    modsIMP?: number | undefined;
    modsORA?: number | undefined;
    modsTEM?: number | undefined;
  };
  placingPiece: number;
  swapType: string;
  isTeleport: boolean;
  placingRoyalty: number;
  offeringType: string;
  isDyadMove: boolean;
  normalMovesOnly: boolean;
  selectedSide: string;
  hoverArcane: string;
  royalties: {
    [key: string]: { [key: string]: number | undefined };
  };
  orientation: string;
  preset: string;
  promotionModalOpen: boolean;
  placingPromotion: number;
  hint: string;
  theme: string;
  hideCompletedPage: boolean;
  hero: string;
  opponent: string;
  futureSightAvailable: boolean;
  victoryMessage: string;
  defeatMessage: string;
  dialogueList: Record<string, string>;
  dialogue: string[];
  glitchActive: boolean;
}

interface Props {
  auth: {
    user: {
      id: string;
      username: string;
    };
  };
  quickplayConfig: {
    color: string;
    clock: boolean;
    thinkingTime: number;
    depth: number;
    multiplier: number;
  };
}

class UnwrappedMissionView extends React.Component<Props, State> {
  hasMounted = false;
  arcaneChess;
  chessgroundRef = createRef<IChessgroundApi>();
  chessclockRef = createRef<ChessClock>();
  intervalId: NodeJS.Timeout | null = null;
  spellHandler: SpellHandler;
  gameEngineHandler: GameEngineHandler;
  historyHandler: HistoryHandler;
  LS = getLocalStorage(this.props.auth.user.username);
  hasMissionArcana =
    Object.keys(
      booksMap[`book${this.LS.chapter}`]?.[`${this.LS.nodeId}`]?.panels[
        'panel-1'
      ].whiteArcane || {}
    ).length !== 0;
  constructor(props: Props) {
    super(props);
    const LS = getLocalStorage(this.props.auth.user.username);
    this.state = {
      turn:
        booksMap[
          `book${getLocalStorage(this.props.auth.user.username).chapter}`
        ]?.[getLocalStorage(this.props.auth.user.username).nodeId]?.panels[
          'panel-1'
        ]?.turn || 'white',
      playerInc:
        getLocalStorage(this.props.auth.user.username).config.color === 'white'
          ? booksMap[
              `book${getLocalStorage(this.props.auth.user.username).chapter}`
            ]?.[getLocalStorage(this.props.auth.user.username).nodeId]
              .time[0][1]
          : booksMap[
              `book${getLocalStorage(this.props.auth.user.username).chapter}`
            ]?.[getLocalStorage(this.props.auth.user.username).nodeId]
              .time[1][1],
      timeLeft: null,
      playerClock:
        getLocalStorage(this.props.auth.user.username).config.clock === false
          ? null
          : getLocalStorage(this.props.auth.user.username).config.color ===
            'white'
          ? booksMap[
              `book${getLocalStorage(this.props.auth.user.username).chapter}`
            ]?.[getLocalStorage(this.props.auth.user.username).nodeId]
              .time[0][0]
          : booksMap[
              `book${getLocalStorage(this.props.auth.user.username).chapter}`
            ]?.[getLocalStorage(this.props.auth.user.username).nodeId]
              .time[1][0],
      playerColor:
        booksMap[
          `book${getLocalStorage(this.props.auth.user.username).chapter}`
        ]?.[getLocalStorage(this.props.auth.user.username).nodeId]?.panels[
          'panel-1'
        ]?.turn || getLocalStorage(this.props.auth.user.username).config.color,
      engineColor:
        booksMap[
          `book${getLocalStorage(this.props.auth.user.username).chapter}`
        ]?.[getLocalStorage(this.props.auth.user.username).nodeId]?.panels[
          'panel-1'
        ]?.turn ||
        getLocalStorage(this.props.auth.user.username).config.color === 'white'
          ? 'black'
          : 'white',
      hasMounted: false,
      nodeId: getLocalStorage(this.props.auth.user.username).nodeId,
      gameOver: false,
      // getLocalStorage(this.props.auth.user.username).nodeScores[
      //   getLocalStorage(this.props.auth.user.username).nodeId
      // ] > 0,
      gameOverType: '',
      fen: this.getFen(),
      pvLine: [],
      historyPly: 0,
      history: [],
      fenHistory: [this.getFen()],
      lastMoveHistory: [],
      thinking: SearchController.thinking,
      engineLastMove: [],
      thinkingTime: getLocalStorage(this.props.auth.user.username).config
        .thinkingTime,
      engineDepth: getLocalStorage(this.props.auth.user.username).config.depth,
      whiteFaction: 'normal',
      blackFaction: 'normal',
      selected: 'a',
      config: {
        a: { disabled: false, powers: {}, picks: 0 },
        b: { disabled: false, powers: {}, picks: 0 },
        c: { disabled: false, powers: {}, picks: 0 },
        d: { disabled: false, powers: {}, picks: 0 },
        e: { disabled: false, powers: {}, picks: 0 },
        f: { disabled: false, powers: {}, picks: 0 },
      },
      // hacky code, but whiteArcana will always be player and blackArcana will always be engine
      whiteArcana:
        LS.config.color === 'white'
          ? this.hasMissionArcana
            ? booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`]?.panels['panel-1']
                .whiteArcane
            : LS.inventory
          : // black should always be engine arcana
            booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`]?.panels['panel-1']
              .blackArcane,
      blackArcana:
        LS.config.color === 'black'
          ? this.hasMissionArcana
            ? booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`]?.panels['panel-1']
                .whiteArcane
            : LS.inventory
          : // black should always be engine arcana
            booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`]?.panels['panel-1']
              .blackArcane,
      placingPiece: 0,
      swapType: '',
      isTeleport: false,
      placingRoyalty: 0,
      offeringType: '',
      isDyadMove: false,
      normalMovesOnly: false,
      selectedSide: getLocalStorage(this.props.auth.user.username).config.color,
      hoverArcane: '',
      royalties:
        booksMap[
          `book${getLocalStorage(this.props.auth.user.username).chapter}`
        ]?.[getLocalStorage(this.props.auth.user.username).nodeId].panels[
          'panel-1'
        ].royalties,
      orientation:
        booksMap[
          `book${getLocalStorage(this.props.auth.user.username).chapter}`
        ]?.[getLocalStorage(this.props.auth.user.username).nodeId]?.panels[
          'panel-1'
        ]?.turn || getLocalStorage(this.props.auth.user.username).config.color,
      preset:
        booksMap[
          `book${getLocalStorage(this.props.auth.user.username).chapter}`
        ]?.[getLocalStorage(this.props.auth.user.username).nodeId].panels[
          'panel-1'
        ].preset,
      promotionModalOpen: false,
      placingPromotion:
        getLocalStorage(this.props.auth.user.username).config.autopromotion ===
        'Select'
          ? 0
          : pieces[
              `${
                getLocalStorage(this.props.auth.user.username).config.color[0]
              }${
                getLocalStorage(this.props.auth.user.username).config
                  .autopromotion
              }`
            ],
      hint: '',
      theme: booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].theme,
      hideCompletedPage:
        _.includes(Object.keys(LS.nodeScores), LS.nodeId) ||
        LS.nodeId?.split('-')[0] !== 'mission',
      hero: booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].hero,
      opponent: booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].opponent,
      futureSightAvailable: true,
      victoryMessage:
        booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].diagWinLose.victory,
      defeatMessage:
        booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].diagWinLose.defeat,
      dialogueList: booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].diagWinLose,
      dialogue: [],
      glitchActive: false,
    };
    this.arcaneChess = () => {
      return arcaneChess();
    };
    clearArcanaConfig();
    this.chessgroundRef = React.createRef();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);

    // Initialize spell handler
    this.spellHandler = new SpellHandler({
      getArcaneChess: () => this.arcaneChess(),
      getPlayerColor: () => this.state.playerColor,
      getSelectedSide: () => this.state.selectedSide,
      getThinking: () => this.state.thinking,
      getFutureSightAvailable: () => this.state.futureSightAvailable,
      getHistory: () => this.state.history,
      getHistoryPly: () => this.state.historyPly,
      getFenHistory: () => this.state.fenHistory,
      getLastMoveHistory: () => this.state.lastMoveHistory,
      getDialogue: () => this.state.dialogue,
      getChessgroundRef: () => this.chessgroundRef,
      getSpellState: () => ({
        placingPiece: this.state.placingPiece,
        swapType: this.state.swapType,
        isTeleport: this.state.isTeleport,
        placingRoyalty: this.state.placingRoyalty,
        offeringType: this.state.offeringType,
        isDyadMove: this.state.isDyadMove,
        normalMovesOnly: this.state.normalMovesOnly,
        hoverArcane: this.state.hoverArcane,
      }),
      updateSpellState: (updates) => this.setState(updates as any),
      updateHistory: (updates) => this.setState(updates as any),
      addDialogue: (message) =>
        this.setState((prev) => ({ dialogue: [...prev.dialogue, message] })),
      activateGlitch: () => this.setState({ glitchActive: true }),
    });

    this.gameEngineHandler = new GameEngineHandler({
      setState: (state, callback) => this.setState(state, callback),
      getArcaneChess: () => this.arcaneChess(),
      getChessgroundRef: () => this.chessgroundRef,
      getStopAndReturnTime: () => this.stopAndReturnTime() as number | null,
      handleVictory: (timeLeft) => this.handleVictory(timeLeft),
      getState: () => ({
        thinking: this.state.thinking,
        glitchActive: this.state.glitchActive,
        thinkingTime: this.state.thinkingTime,
        engineDepth: this.state.engineDepth,
        engineColor: this.state.engineColor,
        playerColor: this.state.playerColor,
        dialogue: this.state.dialogue,
        dialogueList: this.state.dialogueList,
        history: this.state.history,
        fenHistory: this.state.fenHistory,
        lastMoveHistory: this.state.lastMoveHistory,
        royalties: this.state.royalties,
        turn: this.state.turn,
        historyPly: this.state.historyPly,
        placingRoyalty: this.state.placingRoyalty,
        gameOverType: this.state.gameOverType,
      }),
    });

    this.historyHandler = new HistoryHandler({
      setState: (state, callback) => this.setState(state, callback),
      getState: () => ({
        historyPly: this.state.historyPly,
        fenHistory: this.state.fenHistory,
      }),
      anySpellActive: () => this.anySpellActive(),
      deactivateAllSpells: () => this.deactivateAllSpells(),
    });
  }

  anySpellActive = () => this.spellHandler.anySpellActive();

  deactivateAllSpells = () => this.spellHandler.deactivateAllSpells();

  handleContextMenu(event: MouseEvent) {
    if (!this.anySpellActive()) return;
    event.preventDefault();
    this.deactivateAllSpells();
  }

  toggleHover = (arcane: string) => this.spellHandler.toggleHover(arcane);

  transformedPositions = (royaltyType: State['royalties']) =>
    _.reduce(
      royaltyType,
      (acc, value, key) => {
        if (typeof value === 'number') {
          acc[PrSq(Number(key))] = value;
        }
        return acc;
      },
      {} as Record<string, number>
    );

  engineGo = () => this.gameEngineHandler.engineGo();

  getHintAndScore = (level: number) =>
    this.gameEngineHandler.getHintAndScore(level);

  onChangeUses = (e: React.ChangeEvent<HTMLSelectElement>, power: string) => {
    const uses = Number(e.target.value) || e.target.value;
    this.setState((prevState) => ({
      ...prevState,
      config: {
        ...prevState.config,
        [this.state.selected]: {
          ...prevState.config[this.state.selected],
          powers: {
            ...prevState.config[this.state.selected].powers,
            [power]: uses,
          },
        },
      },
    }));
  };

  getFen() {
    let fen = '';
    if (
      !booksMap[
        `book${getLocalStorage(this.props.auth.user.username).chapter}`
      ]?.[getLocalStorage(this.props.auth.user.username).nodeId]?.panels[
        'panel-1'
      ]?.turn &&
      getLocalStorage(this.props.auth.user.username).config.color === 'black'
    ) {
      fen = swapArmies(
        booksMap[
          `book${getLocalStorage(this.props.auth.user.username).chapter}`
        ]?.[getLocalStorage(this.props.auth.user.username).nodeId].panels[
          'panel-1'
        ].fen
      );
    } else {
      fen =
        booksMap[
          `book${getLocalStorage(this.props.auth.user.username).chapter}`
        ]?.[getLocalStorage(this.props.auth.user.username).nodeId].panels[
          'panel-1'
        ].fen;
    }
    return fen;
  }

  stopAndReturnTime = () => {
    return this.chessclockRef.current?.stopTimer();
  };

  handleVictory = (timeLeft: number | null) => {
    const LS = getLocalStorage(this.props.auth.user.username);
    audioManager.playSFX('victory');
    setLocalStorage({
      ...getLocalStorage(this.props.auth.user.username),
      nodeScores: {
        ...getLocalStorage(this.props.auth.user.username).nodeScores,
        [this.state.nodeId]:
          Math.abs(
            GameBoard.material[this.state.playerColor === 'white' ? 0 : 1] -
              GameBoard.material[this.state.playerColor === 'white' ? 1 : 0]
          ) *
          (timeLeft || 1) *
          LS.config.multiplier,
      },
      chapterEnd: booksMap[`book${LS.chapter}`][this.state.nodeId].boss
        ? true
        : false,
    });
    // below updates score in modal
    this.setState({});
    if (booksMap[`book${LS.chapter}`][this.state.nodeId].boss) {
      const chapterPoints = _.reduce(
        getLocalStorage(this.props.auth.user.username).nodeScores,
        (accumulator, value) => {
          return accumulator + value;
        },
        0
      );
      // set user top score if new high
      if (
        chapterPoints >
        getLocalStorage(this.props.auth.user.username).auth.user.campaign
          .topScores[getLocalStorage(this.props.auth.user.username).chapter]
      ) {
        // Retrieve the entire data structure from local storage once
        const localStorageData = getLocalStorage(this.props.auth.user.username);

        // Calculate the chapter index
        const chapterIndex =
          getLocalStorage(this.props.auth.user.username).chapter - 1;

        // Update the specific chapter points in the campaign topScores array
        localStorageData.auth.user.campaign.topScores[chapterIndex] =
          chapterPoints;

        // set arcana at base of local storage user to be empty object
        localStorageData.arcana = {};

        // Save the updated data back to local storage
        setLocalStorage(localStorageData);

        if (LS.auth.user.id !== '0') {
          axios
            .post('/api/campaign/topScores', {
              userId: this.props.auth.user.id,
              chapterPoints,
              chapterNumber: getLocalStorage(this.props.auth.user.username)
                .chapter,
            })
            .then(() => {
              // console.log(res);
            })
            .catch((err) => {
              console.log('top score post err: ', err);
            });
        }
      }
    }
  };

  handlePromotion = (piece: string) => {
    this.setState((prevState) => ({
      ...prevState,
      placingPromotion:
        pieces[`${this.state.playerColor === 'white' ? 'w' : 'b'}${piece}`],
    }));
  };

  promotionSelectAsync(callback: (piece: number) => void): Promise<void> {
    return new Promise((resolve) => {
      if (this.arcaneChess().hasDivineReckoning()) {
        // Auto-promote to Valkyrie when Divine Reckoning is active
        const valkyriePiece = `${
          this.state.playerColor === 'white' ? 'w' : 'b'
        }V`;
        this.setState({ placingPromotion: pieces[valkyriePiece] }, () => {
          callback(this.state.placingPromotion!);
          resolve();
        });
      } else {
        this.setState({ promotionModalOpen: true });
        this.intervalId = setInterval(() => {
          if (this.state.placingPromotion) {
            clearInterval(this.intervalId!);
            this.intervalId = null;
            callback(this.state.placingPromotion);
            resolve();
          }
        }, 100);
      }
    });
  }

  handleModalClose = (pieceType: string) => {
    this.setState({
      placingPromotion:
        pieces[`${this.state.playerColor === 'white' ? 'w' : 'b'}${pieceType}`],
      gameOver: false,
      promotionModalOpen: false,
    });
  };

  handleArcanaClick = (key: string) => this.spellHandler.handleArcanaClick(key);

  normalMoveStateAndEngineGo = (parsed: number, orig: string, dest: string) =>
    this.gameEngineHandler.normalMoveStateAndEngineGo(parsed, orig, dest);

  navigateHistory(type: string, targetIndex?: number) {
    this.historyHandler.navigateHistory(type, targetIndex);
  }

  isArcaneActive = (key: string, color?: string) =>
    this.spellHandler.isArcaneActive(key, color);

  handleKeyDown(event: KeyboardEvent) {
    this.historyHandler.handleKeyDown(event);
  }

  componentWillUnmount(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('contextmenu', this.handleContextMenu);
  }

  componentDidUpdate() {
    const dialogueDiv = document.getElementById('dialogue');
    const historyDiv = document.getElementById('history');
    if (dialogueDiv) {
      dialogueDiv.scrollTop = dialogueDiv.scrollHeight;
    }
    if (historyDiv) {
      historyDiv.scrollTop = historyDiv.scrollHeight;
    }
  }

  componentDidMount() {
    const LS = getLocalStorage(this.props.auth.user.username);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('contextmenu', this.handleContextMenu);
    if (!this.hasMounted && LS.chapter !== 0) {
      this.hasMounted = true;
      this.arcaneChess().init();
      this.arcaneChess().startGame(
        this.getFen(),
        this.state.whiteArcana,
        this.state.blackArcana,
        this.state.royalties,
        this.state.preset
      );
      // if (this.state.turn === 'black') GameBoard.side = 1;
      this.setState(
        {
          turn: GameBoard.side === 0 ? 'white' : 'black',
          whiteArcana: {
            ...whiteArcaneConfig,
          },
          blackArcana: {
            ...blackArcaneConfig,
          },
        },
        () => {
          if (
            this.state.turn !== 'black' &&
            this.state.engineColor === this.state.turn
          ) {
            this.engineGo();
          }
        }
      );
    }
  }

  render() {
    // const greekLetters = ['X', 'Ω', 'Θ', 'Σ', 'Λ', 'Φ', 'M', 'N'];
    const gameBoardTurn = GameBoard.side === 0 ? 'white' : 'black';
    const LS = getLocalStorage(this.props.auth.user.username);
    const sortedHistory = _.chunk(this.state.history, 2);
    const trojanActive = this.arcaneChess().getIfTrojanGambitExists(
      this.state.engineColor
    );
    // const { auth } = this.props;
    const playerWins =
      this.state.gameOverType.split(' ')[1] === 'mates' &&
      getLocalStorage(this.props.auth.user.username).config.color ===
        this.state.gameOverType.split(' ')[0];

    // Check if game ended in a draw
    const isDraw = [
      'stalemate',
      '3-fold repetition',
      'insufficient material',
      'fifty move rule',
    ].some((drawType) =>
      this.state.gameOverType.toLowerCase().includes(drawType)
    );

    const variantExpos: Record<string, string> = {
      XCHECK: '3 checks equals a win.',
      CRAZYHOUSE:
        'Capturing a piece gives you a friendly summon of that same piece type',
      THRONE: 'A King in the center is a win.',
      HORDE: 'The horde must checkmate, the army must capture all Pawns.',
      DELIVERANCE: 'A King on the last rank is a win.',
      CAPALL: 'Capturing all opponent pieces is a win.',
      '': '',
    };
    return (
      <div className="tactorius-board fade">
        {LS.chapter === 0 ? (
          <div
            className="completed-node"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100vw',
              height: '100vh',
              background: `url('/assets/images/textures/random-grey-variations.png'),
                radial-gradient(
                  circle,
                  rgba(52, 120, 220, 0.6) 0%,
                  rgba(17, 17, 17, 0.2) 80%
                )`,
              backgroundSize: 'auto, cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <Link to="/campaign">
              <Button
                text="BACK TO CAMPAIGN"
                className="primary"
                color="S"
                height={200}
                width={400}
              />
            </Link>
          </div>
        ) : this.state.hideCompletedPage ? (
          <div
            className="completed-node"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100vw',
              height: '100vh',
              background: `url('/assets/images/textures/random-grey-variations.png'),
                radial-gradient(
                  circle,
                  rgba(52, 120, 220, 0.6) 0%,
                  rgba(17, 17, 17, 0.2) 80%
                )`,
              backgroundSize: 'auto, cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <Link to="/chapter">
              <Button
                text="BACK TO CHAPTER"
                className="primary"
                color="S"
                height={200}
                width={400}
              />
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100vw',
              height: '100vh',
              background: `url('/assets/images/textures/random-grey-variations.png'),
                radial-gradient(
                  circle,
                  rgba(52, 120, 220, 0.6) 0%,
                  rgba(17, 17, 17, 0.2) 80%
                )`,
              backgroundSize: 'auto, cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <TactoriusModal
              isOpen={this.state.gameOver}
              handleClose={() => this.setState({ gameOver: false })}
              // modalType={this.state.endScenario}
              message={`${isDraw ? 'Draw - ' : ''}${this.state.gameOverType} 
                ${
                  playerWins
                    ? this.state.victoryMessage
                    : isDraw
                    ? 'The game ended in a draw.'
                    : this.state.defeatMessage
                }`}
              score={LS.nodeScores[this.state.nodeId]}
              type={playerWins ? 'victory' : isDraw ? 'draw' : 'defeat'}
            />
            <PromotionModal
              isOpen={this.state.promotionModalOpen}
              playerColor={this.state.playerColor}
              playerFaction={'normal'}
              handleClose={(pieceType: string) =>
                this.handleModalClose(pieceType)
              }
            />
            <div className="mission-view">
              <OpponentPanel
                engineColor={this.state.engineColor}
                playerColor={this.state.playerColor}
                whiteFaction={this.state.whiteFaction}
                blackFaction={this.state.blackFaction}
                arcaneConfig={
                  this.state.engineColor === 'white'
                    ? whiteArcaneConfig
                    : blackArcaneConfig
                }
                thinking={this.state.thinking}
                hoverArcane={this.state.hoverArcane}
                dialogue={this.state.dialogue}
                trojanActive={trojanActive}
                futureSightAvailable={this.state.futureSightAvailable}
                historyLength={this.state.history.length}
                dyadName={
                  typeof this.arcaneChess().getDyadName === 'function'
                    ? this.arcaneChess().getDyadName()
                    : ''
                }
                dyadOwner={
                  typeof this.arcaneChess().getDyadOwner === 'function'
                    ? this.arcaneChess().getDyadOwner()
                    : undefined
                }
                onSpellClick={this.handleArcanaClick}
                onHover={this.toggleHover}
                isArcaneActive={this.isArcaneActive}
                onResign={() => {
                  this.stopAndReturnTime();
                  this.setState({
                    gameOver: true,
                    gameOverType: `${this.state.playerColor} resigns.`,
                  });
                }}
                avatar={this.state.opponent}
                showResign={true}
                volumeControl={true}
              />
              <div className="time-board-time">
                <div className="board-frame"></div>
                <div className="board-view tactorius-default-board">
                  <BoardUX
                    forwardedRef={this.chessgroundRef}
                    game={this.arcaneChess()}
                    gameState={{
                      fen: this.state.fen,
                      turnColor: gameBoardTurn,
                      orientation: this.state.orientation,
                      lastMove:
                        this.state.lastMoveHistory[this.state.historyPly - 1],
                      check: InCheck() ? true : false,
                      royalties: this.state.royalties,
                      whiteFaction: this.state.whiteFaction,
                      blackFaction: this.state.blackFaction,
                      whiteVisible:
                        this.arcaneChess().getInvisibility()[0] <= 0,
                      blackVisible:
                        this.arcaneChess().getInvisibility()[1] <= 0,
                    }}
                    interactionState={{
                      placingPiece: this.state.placingPiece,
                      placingRoyalty: this.state.placingRoyalty,
                      swapType: this.state.swapType,
                      offeringType: this.state.offeringType,
                      isTeleport: this.state.isTeleport,
                      thinking: this.state.thinking,
                      playerColor: this.state.playerColor,
                      placingPromotion: this.state.placingPromotion,
                      isDyadMove: this.state.isDyadMove,
                    }}
                    width={'100%'}
                    height={'100%'}
                    theme={this.state.theme}
                    onGameStateChange={(newState) => this.setState(newState)}
                    onGameOver={(result) => {
                      this.setState(result, () => {
                        if (
                          _.includes(
                            this.state.gameOverType,
                            `${this.state.playerColor} mates`
                          )
                        ) {
                          this.handleVictory(
                            this.stopAndReturnTime() as number | null
                          );
                        }
                      });
                    }}
                    onMove={(parsed, orig, dest) =>
                      this.gameEngineHandler.normalMoveStateAndEngineGo(
                        parsed,
                        orig,
                        dest
                      )
                    }
                    onPromotionRequest={(callback) =>
                      this.promotionSelectAsync(callback)
                    }
                  />
                </div>
              </div>
              <div className="nav-history-buttons-player">
                <div className="global-volume-control">
                  <GlobalVolumeControl />
                </div>
                <div className="buttons">
                  {/* <Button
                className="tertiary"
                onClick={() => {}}
                color="S"
                // strong={true}
                text="1/2"
                width={100}
                // fontSize={30}
                backgroundColorOverride="#222222"
              /> */}
                  <Button
                    className="tertiary"
                    onClick={() => {
                      audioManager.playSFX('defeat');
                      this.setState({
                        gameOver: true,
                        gameOverType: `${this.state.playerColor} resigns.`,
                      });
                    }}
                    color="S"
                    // strong={true}
                    text="RESIGN"
                    width={100}
                    // fontSize={30}
                    backgroundColorOverride="#222222"
                  />
                </div>
                <div id="history" className="history">
                  {sortedHistory.map((fullMove, fullMoveIndex) => {
                    return (
                      <p className="full-move" key={fullMoveIndex}>
                        <span className="move-number">
                          {fullMoveIndex + 1}.
                        </span>
                        <Button
                          className="tertiary"
                          text={fullMove[0]}
                          color="S"
                          height={20}
                          onClick={() => {
                            this.navigateHistory('jump', fullMoveIndex * 2 + 1);
                          }}
                          backgroundColorOverride="#00000000"
                        />
                        <Button
                          className="tertiary"
                          text={fullMove[1]}
                          color="S"
                          height={20}
                          onClick={() => {
                            this.navigateHistory('jump', fullMoveIndex * 2 + 2);
                          }}
                          backgroundColorOverride="#00000000"
                        />
                      </p>
                    );
                  })}
                </div>
                <div className="nav">
                  <Button
                    className="tertiary"
                    onClick={() => this.navigateHistory('start')}
                    color="S"
                    strong={true}
                    variant="<<"
                    width={100}
                    fontSize={30}
                    backgroundColorOverride="#222222"
                  />
                  <Button
                    className="tertiary"
                    onClick={() => this.navigateHistory('back')}
                    color="S"
                    strong={true}
                    variant="<"
                    width={100}
                    fontSize={30}
                    backgroundColorOverride="#222222"
                  />
                  <Button
                    className="tertiary"
                    onClick={() => this.navigateHistory('forward')}
                    color="S"
                    strong={true}
                    variant=">"
                    width={100}
                    fontSize={30}
                    backgroundColorOverride="#222222"
                  />
                  <Button
                    className="tertiary"
                    onClick={() => this.navigateHistory('end')}
                    color="S"
                    strong={true}
                    variant=">>"
                    width={100}
                    fontSize={30}
                    backgroundColorOverride="#222222"
                  />
                </div>
                <div className="timer">
                  <ChessClock
                    ref={this.chessclockRef}
                    type="inc"
                    playerTurn={this.state.turn === this.state.playerColor}
                    turn={gameBoardTurn}
                    time={this.state.playerClock}
                    timePrime={this.state.playerInc}
                    playerTimeout={() => {
                      this.setState({
                        gameOver: true,
                        gameOverType: 'player timed out.',
                      });
                    }}
                  />
                </div>
                <div id="dialogue" className="dialogue">
                  <ul style={{ padding: '0' }}>
                    <li>{variantExpos[this.state.preset]}</li>
                    {this.state.dialogue.map((item, key) => {
                      return <li key={key}>{item}</li>;
                    })}
                  </ul>
                </div>
                <div className="info-avatar">
                  <div className="avatar">
                    {/* <img
                      src={`assets/avatars/${
                        this.state.hero === '' ? 'hero' : this.state.hero
                      }.webp`}
                      style={{
                        height: '60px',
                        width: '60px',
                        objectFit: 'contain',
                      }}
                    /> */}
                  </div>
                  <div className="board-arcana">
                    <ArcanaSelector
                      color={this.state.playerColor as 'white' | 'black'}
                      arcaneConfig={
                        (this.state.playerColor === 'white'
                          ? whiteArcaneConfig
                          : blackArcaneConfig) as Record<
                          string,
                          number | string | undefined
                        >
                      }
                      playerColor={this.state.playerColor}
                      thinking={this.state.thinking}
                      historyLength={this.state.history.length}
                      futureSightAvailable={this.state.futureSightAvailable}
                      hoverArcane={this.state.hoverArcane}
                      engineColor={this.state.engineColor}
                      dyadName={
                        typeof this.arcaneChess().getDyadName === 'function'
                          ? this.arcaneChess().getDyadName()
                          : ''
                      }
                      dyadOwner={
                        typeof this.arcaneChess().getDyadOwner === 'function'
                          ? this.arcaneChess().getDyadOwner()
                          : undefined
                      }
                      trojanGambitExists={this.arcaneChess().getIfTrojanGambitExists(
                        this.state.engineColor
                      )}
                      onSpellClick={this.handleArcanaClick}
                      onHover={this.toggleHover}
                      isArcaneActive={this.isArcaneActive}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

function mapStateToProps({ auth }: { auth: object }) {
  return {
    auth,
  };
}

export const MissionView = connect(
  mapStateToProps,
  {}
)(withRouter(UnwrappedMissionView));
