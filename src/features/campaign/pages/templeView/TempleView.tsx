import React, { createRef } from 'react';
import axios from 'axios';
import _ from 'lodash';
// import { Link, withRouter } from "react-router-dom";
// import { connect } from "react-redux";

// import "../styles/front-page.css";

import { ARCANEFLAG, CAPTURED } from 'src/features/game/engine/board.mjs';

import { audioManager } from 'src/shared/utils/audio/AudioManager';

import { connect } from 'react-redux';
import { withRouter } from 'src/shared/hooks/withRouter/withRouter';
import { Link } from 'react-router-dom';

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

import './TempleView.scss';
import 'src/features/game/board/styles/chessground.scss';
import 'src/features/game/board/styles/normal.scss';
import 'src/features/game/board/styles/lambda.scss';

// import arcanaJson from 'src/shared/data/arcana.json';

import {
  setLocalStorage,
  getLocalStorage,
} from 'src/shared/utils/handleLocalStorage';

import TactoriusModal from 'src/shared/components/Modal/Modal';

// const arcana: ArcanaMap = arcanaJson as ArcanaMap;

// import Hero from "../components/Hero";

// import arcaneChess from "./././validation-engine/arcaneChess";

import arcaneChess from 'src/features/game/engine/arcaneChess.mjs';
import { PerftTest } from 'src/features/game/engine/perft.mjs';

import {
  GameBoard,
  PrintBoard,
  PrintPieceLists,
} from 'src/features/game/engine/board.mjs';
import { PrMove } from 'src/features/game/engine/io.mjs';
import { generatePlayableOptions } from 'src/features/game/engine/movegen.mjs';
import { BOOL, PIECES } from 'src/features/game/engine/defs.mjs';
import { outputFenOfCurrentPosition } from 'src/features/game/engine/board.mjs';
import { SearchController } from 'src/features/game/engine/search.mjs';
import { CheckAndSet, CheckResult } from 'src/features/game/engine/gui.mjs';
import { TakeMove } from 'src/features/game/engine/makemove.mjs';
// import engine
// import arcaneChess from 'src/features/game/engine/arcaneChess.mjs';

// import arcaneChess correctly
// import arcaneChess from "@shared/arcaneChess/arcaneChess";

import Button from 'src/shared/components/Button/Button';
import ChessClock from 'src/features/game/components/Clock/Clock';

import {
  Chessground,
  IChessgroundApi,
} from 'src/features/game/board/chessgroundMod';
import GlobalVolumeControl from 'src/shared/utils/audio/GlobalVolumeControl';

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

// interface ArcanaDetail {
//   id: string;
//   name: string;
//   description: string;
//   type: string;
//   imagePath: string;
// }

// interface ArcanaMap {
//   [key: string]: ArcanaDetail;
// }

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
      // is arrows this a map?
      arrowsCircles?: {
        orig: string;
        brush: string;
        dest?: string | undefined;
      }[];
      // todo initRoyalties in arcaneChess return object
      royalties: {
        [key: string]: { [key: string]: number };
      };
      preset: string;
      whiteArcane?: { [key: string]: number | string };
      blackArcane?: { [key: string]: number | string };
      orientation: string;
      config: {
        [key: string]: boolean | string | number;
      };
      correctMoves: string[];
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
  playerClock: number | null;
  timeLeft: number | null;
  playerDec: number | null;
  playerColor: string;
  engineColor: string;
  currPanel: number;
  chapterNum: number;
  thinking: boolean;
  thinkingTime: number;
  history: string[];
  fenHistory: string[];
  correctMoves: string[];
  pvLine?: string[];
  hasMounted: boolean;
  nodeId: string;
  moveNumber: number;
  fen: string;
  engineLastMove: string[];
  whiteFaction: string;
  blackFaction: string;
  selected: string;
  orientation: string;
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
  arcaneHover: string;
  wArcana:
  | {
    [key: string]: number | string;
  }
  | undefined;
  bArcana:
  | {
    [key: string]: number | string;
  }
  | undefined;
  lastMove: string[];
  royalties: {
    [key: string]: { [key: string]: number };
  };
  hideCompletedPage: boolean;
  visitedPanels: string[];
  theme: string;
  hero: string;
  opponent: string;
  victoryMessage: string;
  defeatMessage: string;
  hintCount: number;
  hintsUsed: number;
}

interface Props {
  auth: {
    user: {
      username: string;
    };
  };
}

export const puzzleLimits = [0, 10, 10, 10, 8, 8, 8, 5, 5, 5, 3, 3, 3];

class UnwrappedTempleView extends React.Component<Props, State> {
  hasMounted = false;
  arcaneChess;
  chessgroundRef = createRef<IChessgroundApi>();
  chessclockRef = createRef<ChessClock>();

  getRandomPanelKey = () => {
    const LS = getLocalStorage(this.props.auth.user.username);
    const panels = booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].panels;
    const panelKeys = Object.keys(panels);
    const randomPanelIndex = Math.floor(Math.random() * panelKeys.length);
    return panelKeys[randomPanelIndex];
  };

  constructor(props: Props) {
    super(props);
    const LS = getLocalStorage(this.props.auth.user.username);
    const initialPanelKey = this.getRandomPanelKey();
    const initialPanelData =
      booksMap[`book${LS.chapter}`][`${LS.nodeId}`].panels[initialPanelKey];
    this.state = {
      playerClock:
        LS.config.color === 'white'
          ? booksMap[`book${LS.chapter}`]?.[LS.nodeId].time[0][0]
          : booksMap[`book${LS.chapter}`]?.[LS.nodeId].time[1][0],
      timeLeft: null,
      playerDec:
        LS.config.color === 'white'
          ? booksMap[`book${LS.chapter}`]?.[LS.nodeId].time[0][1]
          : booksMap[`book${LS.chapter}`]?.[LS.nodeId].time[1][1],
      turn:
        booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].panels[
          `panel-${parseInt(initialPanelKey.split('-')[1])}`
        ].fen.split(' ')[1] === 'w'
          ? 'white'
          : 'black',
      playerColor:
        booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].panels[
          `panel-${parseInt(initialPanelKey.split('-')[1])}`
        ].fen.split(' ')[1] === 'w'
          ? 'black'
          : 'white',
      engineColor:
        booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].panels[
          `panel-${parseInt(initialPanelKey.split('-')[1])}`
        ].fen.split(' ')[1] === 'w'
          ? 'white'
          : 'black',
      hasMounted: false,
      nodeId: LS.nodeId,
      moveNumber: 0,
      gameOver: false,
      gameOverType: '',
      fen: initialPanelData.fen,
      pvLine: [],
      history: [],
      fenHistory: [initialPanelData.fen],
      correctMoves:
        booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].panels[
          `panel-${parseInt(initialPanelKey.split('-')[1])}`
        ].correctMoves,
      chapterNum: LS.chapter,
      thinking: SearchController.thinking,
      engineLastMove: [],
      thinkingTime: 500,
      currPanel: parseInt(initialPanelKey.split('-')[1]),
      whiteFaction: 'normal',
      blackFaction: 'normal',
      selected: 'a',
      config: {
        // todo disable if no abilities selected
        a: { disabled: false, powers: {}, picks: 0 },
        b: { disabled: false, powers: {}, picks: 0 },
        c: { disabled: false, powers: {}, picks: 0 },
        d: { disabled: false, powers: {}, picks: 0 },
        e: { disabled: false, powers: {}, picks: 0 },
        f: { disabled: false, powers: {}, picks: 0 },
      },
      arcaneHover: '',
      wArcana:
        booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].panels[
          `panel-${parseInt(initialPanelKey.split('-')[1])}`
        ].whiteArcane,
      bArcana:
        booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].panels[
          `panel-${parseInt(initialPanelKey.split('-')[1])}`
        ].blackArcane,
      lastMove: [],
      royalties:
        booksMap[`book${LS.chapter}`]?.[LS.nodeId].panels[
          `panel-${parseInt(initialPanelKey.split('-')[1])}`
        ].royalties,
      hideCompletedPage:
        _.includes(Object.keys(LS.nodeScores), LS.nodeId) ||
        LS.nodeId?.split('-')[0] !== 'temple',
      visitedPanels: [initialPanelKey],
      orientation:
        booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].panels[
          `panel-${parseInt(initialPanelKey.split('-')[1])}`
        ].fen.split(' ')[1] === 'w'
          ? 'black'
          : 'white',
      theme: booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].theme,
      hero: booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].hero,
      opponent: booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].opponent,
      victoryMessage:
        booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].diagWinLose.victory,
      defeatMessage:
        booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].diagWinLose.defeat,
      hintCount: 0,
      hintsUsed: 0,
    };
    this.arcaneChess = () => {
      return arcaneChess();
    };
    this.chessgroundRef = React.createRef();
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
  }

  incrementMove = () => {
    this.setState((prevState) => {
      return {
        moveNumber: prevState.moveNumber + 1,
      };
    });
  };

  incrementPanel = () => {
    const LS = getLocalStorage(this.props.auth.user.username);
    const panels = booksMap[`book${LS.chapter}`]?.[`${LS.nodeId}`].panels;
    const panelKeys = Object.keys(panels).filter(
      (key) => !this.state.visitedPanels.includes(key)
    );
    const panelCount = panelKeys.length;
    const puzzleNum = puzzleLimits[this.state.chapterNum];

    if (this.state.visitedPanels.length >= puzzleNum) {
      const timeLeft = this.stopAndReturnTime() as number | null;
      this.handleVictory(timeLeft);
      return;
    }

    if (panelCount === 0) {
      // No more panels to visit
      console.log('All possible panels have been visited.');
      return;
    }

    const randomPanelIndex = Math.floor(Math.random() * panelCount); // Generate a random panel index
    const randomPanelKey = panelKeys[randomPanelIndex]; // Get the panel key corresponding to the random index

    this.setState(
      (prevState) => {
        const panelData = panels[randomPanelKey];
        this.chessgroundRef.current?.setAutoShapes([
          ...(panelData.arrowsCircles ?? []),
        ]);
        const newVisitedPanels = [...prevState.visitedPanels, randomPanelKey];
        return {
          gameOver: false,
          currPanel: parseInt(randomPanelKey.split('-')[1]), // Assumes your keys are in the format "panel-x"
          moveNumber: 0,
          turn: panelData.fen.split(' ')[1] === 'w' ? 'white' : 'black',
          playerColor: panelData.fen.split(' ')[1] === 'w' ? 'black' : 'white',
          engineColor: panelData.fen.split(' ')[1] === 'w' ? 'white' : 'black',
          fen: panelData.fen,
          fenHistory: [panelData.fen],
          correctMoves: panelData.correctMoves,
          wArcana: panelData.whiteArcane,
          bArcana: panelData.blackArcane,
          royalties: panelData.royalties,
          visitedPanels: newVisitedPanels,
          orientation: panelData.fen.split(' ')[1] === 'w' ? 'black' : 'white',
          hintCount: 0,
        };
      },
      () => {
        this.arcaneChess().init();
        this.arcaneChess().startGame(
          this.state.fen,
          this.state.wArcana,
          this.state.bArcana,
          this.state.royalties
        );
        this.compTempleMove();
      }
    );
  };

  perftTest = () => {
    PrintPieceLists();
    PrintBoard();
    PerftTest(3);
  };

  setFen = (fen: string) => {
    this.setState({ fen });
  };

  getHint = () => {
    const { hintCount, hintsUsed, correctMoves, moveNumber } = this.state;
    const currentMove = correctMoves[moveNumber];
    if (hintsUsed > 2) return;
    if (hintCount === 0) {
      audioManager.playSFX('spell');
      this.chessgroundRef.current?.setAutoShapes([
        {
          orig: currentMove.slice(0, 2),
          brush: 'yellow',
        },
      ]);
      this.setState((prevState) => ({
        hintCount: prevState.hintCount + 1,
        hintsUsed: prevState.hintsUsed + 1,
      }));
    } else if (hintCount === 1) {
      audioManager.playSFX('spell');
      this.chessgroundRef.current?.setAutoShapes([
        {
          orig: currentMove.slice(0, 2),
          dest: currentMove.slice(2, 4),
          brush: 'yellow',
        },
      ]);
      this.setState((prevState) => ({
        hintCount: prevState.hintCount + 1,
        hintsUsed: prevState.hintsUsed + 1,
      }));
    }
  };

  engineGo = () => {
    this.setState({
      thinking: true,
    });

    generatePlayableOptions();

    new Promise((resolve) => {
      setTimeout(() => {
        SearchController.thinking = BOOL.TRUE;
        const engineResult = this.arcaneChess().engineReply(
          this.state.thinkingTime
        );
        resolve(engineResult);
      }, this.state.thinkingTime);
    })
      .then((reply) => {
        this.setState(
          (prevState) => ({
            pvLine: GameBoard.cleanPV,
            history: [...prevState.history, PrMove(reply)],
            fenHistory: [...prevState.fenHistory, outputFenOfCurrentPosition()],
            thinking: false,
            turn: prevState.turn === 'white' ? 'black' : 'white',
          }),
          () => {
            if (CheckAndSet()) {
              this.setState({
                gameOver: true,
                gameOverType: CheckResult().gameResult,
              });
              return;
            }
          }
        );
      })
      .catch((error) => {
        console.error('An error occurred:', error);
      });
  };

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

  handleWrongMove = () => {
    this.chessclockRef.current?.templeTimeHandler();
    TakeMove();
    this.setState((prevState) => ({
      fen: outputFenOfCurrentPosition(),
      fenHistory: [...prevState.fenHistory, outputFenOfCurrentPosition()],
    }));
  };

  stopAndReturnTime = () => {
    return this.chessclockRef.current?.stopTimer();
  };

  toggleHover = (arcane: string) => {
    this.setState({ arcaneHover: arcane });
  };

  compTempleMove = () => {
    const gameBoardTurn = GameBoard.side === 0 ? 'white' : 'black';
    if (this.state.engineColor === this.state.turn) {
      const parsed = this.arcaneChess().makeUserMove(
        this.state.correctMoves[this.state.moveNumber].slice(0, 2),
        this.state.correctMoves[this.state.moveNumber].slice(2, 4),
        PIECES[
        `${gameBoardTurn === 'white' ? 'w' : 'b'}${(
          this.state.correctMoves[this.state.moveNumber][4] || ''
        ).toUpperCase()}` as keyof typeof PIECES
        ]
      );
      if (CAPTURED(parsed) > 0 && ARCANEFLAG(parsed) === 0) {
        audioManager.playSFX('capture');
      } else {
        audioManager.playSFX('move');
      }
      if (!PrMove(parsed)) {
        // console.log('invalid move');
      }
      this.setState((prevState) => ({
        history: [...prevState.history, PrMove(parsed)],
        fen: outputFenOfCurrentPosition(),
        fenHistory: [...prevState.fenHistory, outputFenOfCurrentPosition()],
        lastMove: [
          this.state.correctMoves[prevState.moveNumber].slice(0, 2),
          this.state.correctMoves[prevState.moveNumber].slice(2, 4),
        ],
        moveNumber: prevState.moveNumber + 1,
      }));
    }
  };

  handleVictory = (timeLeft: number | null) => {
    const LS = getLocalStorage(this.props.auth.user.username);
    const score = (timeLeft ? timeLeft : 1) * 1000 * LS.config.multiplier;
    const hintPenalty = score * 0.2 * this.state.hintsUsed;
    audioManager.playSFX('victory');
    this.setState({
      gameOver: true,
      gameOverType: 'puzzle victory',
    });
    setLocalStorage({
      ...getLocalStorage(this.props.auth.user.username),
      nodeScores: {
        ...getLocalStorage(this.props.auth.user.username).nodeScores,
        [this.state.nodeId]: score - hintPenalty,
      },
      chapterEnd: booksMap[`book${LS.chapter}`][this.state.nodeId].boss
        ? true
        : false,
    });
    if (booksMap[`book${LS.chapter}`][this.state.nodeId].boss) {
      const chapterPoints = _.reduce(
        getLocalStorage(this.props.auth.user.username).nodeScores,
        (accumulator, value) => {
          return accumulator + value;
        },
        0
      );
      // set user top score if new
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

        // Save the updated data back to local storage
        setLocalStorage(localStorageData);
        axios
          .post('/api/campaign/topScores', {
            userId: this.props.auth.user.username,
            chapterPoints,
            chapterNumber: getLocalStorage(this.props.auth.user.username)
              .chapter,
          })
          .then((res) => {
            console.log(res);
          })
          .catch((err) => {
            console.log('top score post err: ', err);
          });
      }
    }
  };

  handleBeforeUnload(event: BeforeUnloadEvent) {
    // Prevent the default behavior and trigger the confirmation dialog
    event.preventDefault();
    // Chrome requires returnValue to be set
    event.returnValue = 'Are you sure you want to leave?';
    // Legacy support
    return 'Are you sure you want to leave?';
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    const LS = getLocalStorage(this.props.auth.user.username);
    if (this.state.hideCompletedPage) {
      return;
    }
    if (!this.hasMounted && LS.chapter !== 0) {
      this.hasMounted = true;
      this.arcaneChess().init();
      this.arcaneChess().startGame(
        this.state.fen,
        this.state.wArcana,
        this.state.bArcana,
        this.state.royalties
        // this.state.preset)
      );
      this.compTempleMove();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  render() {
    // const greekLetters = ['X', 'Ω', 'Θ', 'Σ', 'Λ', 'Φ', 'M', 'N'];
    const { auth } = this.props;
    const gameBoardTurn = GameBoard.side === 0 ? 'white' : 'black';
    const LS = getLocalStorage(auth.user.username);
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
              // message={} // interpolate
              message={
                this.state.gameOverType === 'puzzle victory'
                  ? this.state.victoryMessage
                  : [
                    'stalemate',
                    '3-fold repetition',
                    'insufficient material',
                    'fifty move rule',
                  ].some((drawType) =>
                    this.state.gameOverType.toLowerCase().includes(drawType)
                  )
                    ? `Draw - ${this.state.gameOverType}. The puzzle ended in a draw.`
                    : this.state.defeatMessage
              }
              score={LS.nodeScores[this.state.nodeId]}
              type={
                this.state.gameOverType === 'puzzle victory'
                  ? 'victory'
                  : [
                    'stalemate',
                    '3-fold repetition',
                    'insufficient material',
                    'fifty move rule',
                  ].some((drawType) =>
                    this.state.gameOverType.toLowerCase().includes(drawType)
                  )
                    ? 'draw'
                    : 'defeat'
              }
            />
            <div className="temple-view">
              <div className="opponent-arcana-volume">
                <div className="info-avatar">
                  <div className="avatar">
                    {/* {this.state.opponent !== '' ? (
                      <img
                        src={`/assets/avatars/${this.state.opponent}.webp`}
                        style={{
                          height: '60px',
                          width: '60px',
                          objectFit: 'contain',
                        }}
                      />
                    ) : null} */}
                  </div>
                  <div className="arcana-select"></div>
                </div>
                <div className="global-volume-control">
                  <GlobalVolumeControl />
                </div>
              </div>
              <div className="time-board-time">
                <div className="opponent-time">{/* <h3>10:00</h3> */}</div>
                <div className="board-view tactorius-default-board">
                  <Chessground
                    forwardedRef={this.chessgroundRef}
                    // fen={this.state.fenHistory[this.state.fenHistory.length - 1]}
                    // check={this.tactorius.inCheck().isAttacked}
                    // viewOnly={this.isCheckmate()}
                    fen={
                      this.state.fenHistory[this.state.fenHistory.length - 1]
                    }
                    // coordinates={true}
                    // notation={true}
                    // onChange={(move) => {
                    //   console.log('hello', move);
                    // }}
                    resizable={true}
                    wFaction={this.state.whiteFaction}
                    bFaction={this.state.blackFaction}
                    royalties={this.state.royalties}
                    // wRoyalty={this.state.wRoyalty}
                    // bRoyalty={this.state.bRoyalty}
                    // wVisible={this.state.wVisCount === 0}
                    // bVisible={this.state.bVisCount === 0}
                    // width={520}
                    // height={520}
                    width={'100%'}
                    height={'100%'}
                    // inline styling for aspect ratio? OR interpolating in this case based on the page type, use a global state string?
                    // don't, just go by the page type
                    // width={360}
                    // height={360}
                    animation={{
                      enabled: true,
                      duration: 200,
                    }}
                    highlight={{
                      lastMove: true,
                      check: true,
                    }}
                    orientation={this.state.orientation}
                    disableContextMenu={false}
                    turnColor={GameBoard.side === 0 ? 'white' : 'black'}
                    movable={{
                      free: false,
                      color: this.state.playerColor,
                      dests: this.arcaneChess().getGroundMoves(),
                    }}
                    lastMove={this.state.lastMove}
                    viewOnly={false}
                    events={{
                      move: (orig: string, dest: string) => {
                        const correctPromotion = (
                          this.state.correctMoves[this.state.moveNumber][4] ||
                          ''
                        ).toLowerCase();
                        // audioManager.playSFX('move');
                        const parsed = this.arcaneChess().makeUserMove(
                          orig,
                          dest,
                          PIECES[
                          `${gameBoardTurn === 'white' ? 'w' : 'b'}${(
                            this.state.correctMoves[
                            this.state.moveNumber
                            ][4] || ''
                          ).toUpperCase()}` as keyof typeof PIECES
                          ]
                        );
                        if (CAPTURED(parsed) > 0 && ARCANEFLAG(parsed) === 0) {
                          audioManager.playSFX('capture');
                        } else {
                          audioManager.playSFX('move');
                        }
                        if (
                          `${orig}${dest}${correctPromotion}` ===
                          this.state.correctMoves[this.state.moveNumber]
                        ) {
                          this.setState(
                            (prevState) => ({
                              history: [...prevState.history, PrMove(parsed)],
                              fen: outputFenOfCurrentPosition(),
                              fenHistory: [
                                ...prevState.fenHistory,
                                outputFenOfCurrentPosition(),
                              ],
                              moveNumber: prevState.moveNumber + 1,
                              lastMove: [orig, dest],
                            }),
                            () => {
                              if (
                                this.state.moveNumber ===
                                this.state.correctMoves.length
                              ) {
                                this.incrementPanel();
                              } else {
                                this.compTempleMove();
                              }
                            }
                          );
                        } else {
                          this.handleWrongMove();
                        }
                      },
                    }}
                  />
                </div>
                <div className="player-time"></div>
              </div>
              <div className="temple-clock-buttons">
                <div className="global-volume-control">
                  <GlobalVolumeControl />
                </div>
                <div
                  className="temple-clock"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <ChessClock
                    ref={this.chessclockRef}
                    type="dec"
                    playerTurn={gameBoardTurn === this.state.playerColor}
                    turn={gameBoardTurn}
                    time={this.state.playerClock}
                    timePrime={this.state.playerDec}
                    playerTimeout={() => {
                      audioManager.playSFX('defeat');
                      this.setState({
                        gameOver: true,
                        gameOverType: 'player timed out',
                      });
                    }}
                  />
                  <div>
                    {puzzleLimits[this.state.chapterNum] -
                      this.state.visitedPanels.length}{' '}
                    PUZZLES REMAINING
                  </div>
                  <div>{this.state.hintsUsed} / 3 HINTS USED</div>
                  <div>({100 - 20 * this.state.hintsUsed}% OF FULL SCORE)</div>
                </div>
                <div className="temple-buttons">
                  <Button
                    className="tertiary"
                    onClick={() => {
                      this.getHint();
                    }}
                    color="S"
                    text="HINT"
                    width={250}
                    backgroundColorOverride="#11111188"
                  />
                  <Button
                    className="tertiary"
                    onClick={() => {
                      this.setState({
                        gameOver: true,
                        gameOverType: `${this.state.playerColor} resigns`,
                      });
                      audioManager.playSFX('defeat');
                    }}
                    color="S"
                    // strong={true}
                    text="RESIGN"
                    width={150}
                    // fontSize={30}
                    backgroundColorOverride="#11111188"
                  />
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
                  <div className="arcana-select"></div>
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

export const TempleView = connect(
  mapStateToProps,
  {}
)(withRouter(UnwrappedTempleView));

// connect(mapStateToProps)(
//   withRouter(UnwrappedFrontPage)
// );

// .hero-text {
//   font-size: 48px;
//   font-weight: 800;
// }
