import React, { createRef } from 'react';
import _ from 'lodash';

import { connect } from 'react-redux';
import { withRouter } from 'src/shared/hooks/withRouter/withRouter';

import './QuickPlay.scss';
import 'src/features/game/board/styles/chessground.scss';
import 'src/features/game/board/styles/normal.scss';
import 'src/features/game/board/styles/lambda.scss';

import {
  setLocalStorage,
  getLocalStorage,
} from 'src/shared/utils/handleLocalStorage';
import { audioManager } from 'src/shared/utils/audio/AudioManager';

import TactoriusModal from 'src/shared/components/Modal/Modal';
import PromotionModal from 'src/features/game/components/PromotionModal/PromotionModal';
import QuickplayModal from 'src/features/game/components/QuickplayModal/QuickplayModal';

import GlobalVolumeControl from 'src/shared/utils/audio/GlobalVolumeControl';

import arcanaJson from 'src/shared/data/arcana.json';

import arcaneChess from 'src/features/game/engine/arcaneChess.mjs';
// import {
//   arcane as arcaneChess,
//   arcaneChessWorker,
// } from 'src/features/game/engine/arcaneChessInstance.js';
import {
  GameBoard,
  InCheck,
  TOSQ,
  FROMSQ,
  PROMOTED,
  ARCANEFLAG,
  CAPTURED,
  MFLAGSUMN,
  MFLAGCNSM,
  MFLAGSHFT,
} from 'src/features/game/engine/board.mjs';
import { PrMove, PrSq } from 'src/features/game/engine/io.mjs';
import {
  prettyToSquare,
  PIECES,
  ARCANE_BIT_VALUES,
  COLOURS,
  RtyChar,
  PceChar,
} from 'src/features/game/engine/defs.mjs';
import { outputFenOfCurrentPosition } from 'src/features/game/engine/board.mjs';
import { SearchController } from 'src/features/game/engine/search.mjs';
import { CheckAndSet, CheckResult } from 'src/features/game/engine/gui.mjs';

import {
  whiteArcaneConfig,
  blackArcaneConfig,
  clearArcanaConfig,
} from 'src/features/game/engine/arcaneDefs.mjs';

import { IChessgroundApi } from 'src/features/game/board/chessgroundMod';

const pieces: PieceRoyaltyTypes = PIECES;
const royalties: PieceRoyaltyTypes = ARCANE_BIT_VALUES;
import ChessClock from '../../components/Clock/Clock';
import { SpellHandler } from 'src/features/game/utils/SpellHandler';
import Button from 'src/shared/components/Button/Button';
import { BoardUX } from 'src/features/game/components/BoardUX/BoardUX';
import { ArcanaSelector } from 'src/features/game/components/ArcanaSelector/ArcanaSelector';
import { GameEngineHandler } from 'src/features/game/utils/GameEngineHandler';
import { HistoryHandler } from 'src/features/game/utils/HistoryHandler';

const arcana: ArcanaMap = arcanaJson as ArcanaMap;

interface PieceRoyaltyTypes {
  [key: string]: number;
}

interface ArcanaDetail {
  id: string;
  name: string;
  description: string;
  type: string;
  imagePath: string;
}

interface ArcanaMap {
  [key: string]: ArcanaDetail;
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
  whiteSetup: string;
  blackSetup: string;
  fen: string;
  fenHistory: string[];
  lastMoveHistory: string[][];
  pvLine?: string[];
  hasMounted: boolean;
  nodeId: string;
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
  wArcana: {
    [key: string]: number | string | undefined;
    modsIMP?: number | undefined;
    modsORA?: number | undefined;
    modsTEM?: number | undefined;
  };
  bArcana: {
    [key: string]: number | string | boolean | undefined;
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
  quickPlayModalOpen: boolean;
  futureSightAvailable: boolean;
  glitchActive: boolean;
  engineAvatar: string;
  dialogue: string[];
  dialogueList: Record<string, string>;
}

interface Props {
  auth: {
    user: {
      id: string;
      username: string;
    };
  };
  config: {
    playerColor: string;
    engineColor: string;
    whiteSetup: string;
    blackSetup: string;
    whiteFaction: string;
    blackFaction: string;
    whiteArcana: { [key: string]: number };
    blackArcana: { [key: string]: number };
    thinkingTime: number;
    engineDepth: number;
    varVar: string;
    promotion: number;
  };
}

class UnwrappedQuickPlay extends React.Component<Props, State> {
  static defaultProps = {
    config: {
      playerColor: 'white',
      engineColor: 'black',
      whiteSetup: 'RNBQKBNR',
      blackSetup: 'rnbqkbnr',
      whiteFaction: 'normal',
      blackFaction: 'normal',
      whiteTime: 600,
      blackTime: 600,
      whiteInc: 0,
      blackInc: 0,
      whiteArcana: {},
      blackArcana: {},
      thinkingTime: 2,
      engineDepth: 1,
      varVar: 'normal',
      promotion: 'Select',
    },
  };
  hasMounted = false;
  arcaneChess;
  engineFaction = 'normal';
  chessgroundRef = createRef<IChessgroundApi>();
  chessclockRef = createRef<ChessClock>();
  intervalId: NodeJS.Timeout | null = null;
  spellHandler: SpellHandler;
  gameEngineHandler: GameEngineHandler;
  historyHandler: HistoryHandler;

  constructor(props: Props) {
    super(props);
    this.state = {
      turn: 'white',
      playerInc: null,
      timeLeft: null,
      playerClock: null,
      playerColor: this.props.config.playerColor,
      engineColor: this.props.config.engineColor,
      hasMounted: false,
      nodeId: getLocalStorage(this.props.auth.user.username).nodeId,
      gameOver: false,
      gameOverType: '',
      whiteSetup: this.props.config.whiteSetup,
      blackSetup: this.props.config.blackSetup,
      fen: `${this.props.config.blackSetup}/pppppppp/8/8/8/8/PPPPPPPP/${this.props.config.whiteSetup} w KQkq - 0 1`,
      fenHistory: [
        `${this.props.config.blackSetup}/pppppppp/8/8/8/8/PPPPPPPP/${this.props.config.whiteSetup} w KQkq - 0 1`,
      ],
      lastMoveHistory: [],
      pvLine: [],
      historyPly: 0,
      history: [],
      thinking: SearchController.thinking,
      thinkingTime: this.props.config.thinkingTime,
      engineDepth: this.props.config.engineDepth,
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
      wArcana: {},
      bArcana: {},
      placingPiece: 0,
      swapType: '',
      isTeleport: false,
      placingRoyalty: 0,
      offeringType: '',
      isDyadMove: false,
      normalMovesOnly: false,
      selectedSide: this.props.config.playerColor,
      hoverArcane: '',
      royalties: {},
      orientation: this.props.config.playerColor,
      preset: '',
      promotionModalOpen: false,
      placingPromotion: 0,
      hint: '',
      theme: '',
      quickPlayModalOpen: true,
      futureSightAvailable: true,
      glitchActive: false,
      engineAvatar: 'normal',
      dialogueList: {
        win1: '',
        win2: '',
        win3: '',
        lose1: '',
        lose2: '',
        lose3: '',
      },
      dialogue: [],
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
      addDialogue: (message) => this.setState((prev) => ({ dialogue: [...prev.dialogue, message] })),
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

  getHintAndScore = (level: number) => this.gameEngineHandler.getHintAndScore(level);

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
            100000 -
            Math.abs(
              GameBoard.material[this.state.playerColor === 'white' ? 0 : 1] -
              GameBoard.material[this.state.playerColor === 'white' ? 1 : 0]
            )
          ) *
          (timeLeft || 1) *
          LS.config.multiplier,
      },
      // chapterEnd: booksMap[`book${LS.chapter}`][this.state.nodeId].boss
      //   ? true
      //   : false,
    });
    // below updates score in modal
    this.setState({});
    // if (booksMap[`book${LS.chapter}`][this.state.nodeId].boss) {
    //   const chapterPoints = _.reduce(
    //     getLocalStorage(this.props.auth.user.username).nodeScores,
    //     (accumulator, value) => {
    //       return accumulator + value;
    //     },
    //     0
    //   );
    //   // set user top score if new
    //   if (
    //     chapterPoints >
    //     getLocalStorage(this.props.auth.user.username).auth.user.campaign
    //       .topScores[getLocalStorage(this.props.auth.user.username).chapter]
    //   ) {
    //     // Retrieve the entire data structure from local storage once
    //     const localStorageData = getLocalStorage(this.props.auth.user.username);

    //     // Calculate the chapter index
    //     const chapterIndex =
    //       getLocalStorage(this.props.auth.user.username).chapter - 1;

    //     // Update the specific chapter points in the campaign topScores array
    //     localStorageData.auth.user.campaign.topScores[chapterIndex] =
    //       chapterPoints;

    //     // Save the updated data back to local storage
    //     setLocalStorage(localStorageData);

    //     if (LS.auth.user.id !== '0') {
    //       axios
    //         .post('/api/campaign/topScores', {
    //           userId: this.props.auth.user.id,
    //           chapterPoints,
    //           chapterNumber: getLocalStorage(this.props.auth.user.username)
    //             .chapter,
    //         })
    //         .then((res) => {
    //           // console.log(res);
    //         })
    //         .catch((err) => {
    //           console.log('top score post err: ', err);
    //         });
    //     }
    //   }
    // }
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
        const valkyriePiece = `${this.state.playerColor === 'white' ? 'w' : 'b'
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

  analyzeGame = () => {
    this.setState({
      gameOver: false,
    });
  };

  normalMoveStateAndEngineGo = (parsed: number, orig: string, dest: string) =>
    this.gameEngineHandler.normalMoveStateAndEngineGo(parsed, orig, dest);

  navigateHistory(type: string, targetIndex?: number) {
    this.historyHandler.navigateHistory(type, targetIndex);
  }

  handleKeyDown(event: KeyboardEvent) {
    this.historyHandler.handleKeyDown(event);
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
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('contextmenu', this.handleContextMenu);
    if (!this.hasMounted) this.hasMounted = true;
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('contextmenu', this.handleContextMenu);
    clearArcanaConfig();
  }

  updateQuickPlayState = (property: string, value: any) => {
    if (property === 'wArcana' || property === 'bArcana') {
      this.setState((prevState) => ({
        ...prevState,
        [property]: {
          ...value,
        },
      }));
    } else {
      this.setState(
        (prevState) => ({
          ...prevState,
          [property]: value,
        }),
        () => {
          this.setState({
            fen: `${this.state.blackSetup}/pppppppp/8/8/8/8/PPPPPPPP/${this.state.whiteSetup} w KQkq - 0 1`,
            fenHistory: [
              `${this.state.blackSetup}/pppppppp/8/8/8/8/PPPPPPPP/${this.state.whiteSetup} w KQkq - 0 1`,
            ],
            orientation: this.state.playerColor,
            selectedSide: this.state.playerColor,
          });
        }
      );
    }
  };



  getRandomFaction = () => {
    const factions = ['chi', 'omega', 'sigma', 'lambda', 'nu', 'mu'];
    const randomIndex = Math.floor(Math.random() * factions.length);
    return factions[randomIndex];
  };

  handleArcanaClick = (key: string) => this.spellHandler.handleArcanaClick(key);

  isArcaneActive = (key: string, color?: string) =>
    this.spellHandler.isArcaneActive(key, color);

  render() {
    // const greekLetters = ['X', 'Ω', 'Θ', 'Σ', 'Λ', 'Φ', 'M', 'N'];
    const gameBoardTurn = GameBoard.side === 0 ? 'white' : 'black';
    const LS = getLocalStorage(this.props.auth.user.username);
    const sortedHistory = _.chunk(this.state.history, 2);
    const trojanActive = this.arcaneChess().getIfTrojanGambitExists(
      this.state.engineColor
    );
    return (
      <div className="quickplay-tactorius-board fade">
        <div
          style={{
            position: 'absolute',
            height: '100vh',
            width: '100vw',
            // background: 'url(/assets/pages/tactorius.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <QuickplayModal
            isOpen={this.state.quickPlayModalOpen}
            handleClose={() => {
              this.setState({ quickPlayModalOpen: false }, () => {
                this.arcaneChess().init();
                this.arcaneChess().startGame(
                  this.state.fen,
                  this.state.wArcana,
                  this.state.bArcana,
                  this.state.royalties,
                  this.state.preset
                );
                this.setState(
                  {
                    turn: GameBoard.side === 0 ? 'white' : 'black',
                    wArcana: {
                      ...whiteArcaneConfig,
                    },
                    bArcana: {
                      ...blackArcaneConfig,
                    },
                  },
                  () => {
                    if (this.state.engineColor === this.state.turn) {
                      this.engineGo();
                    }
                  }
                );
              });
            }}
            updateConfig={(
              property: string,
              value: number | string | { [key: string]: number }
            ) => {
              if (property === 'placingPromotion') {
                if (value === 'select') {
                  value = 0;
                } else {
                  value =
                    pieces[
                    `${this.state.playerColor === 'white' ? 'w' : 'b'
                    }${value}`
                    ];
                }
              }
              this.updateQuickPlayState(property, value);
            }}
            type="quickPlay"
          />
          <TactoriusModal
            isOpen={this.state.gameOver}
            handleClose={() => this.analyzeGame()}
            // modalType={this.state.endScenario}
            message={this.state.gameOverType} // interpolate
            score={LS.nodeScores[this.state.nodeId]}
            type={
              this.state.gameOverType.split(' ')[1] === 'mates' &&
                this.state.playerColor === this.state.gameOverType.split(' ')[0]
                ? 'victory-qp'
                : 'defeat-qp'
            }
          />
          <PromotionModal
            isOpen={this.state.promotionModalOpen}
            playerColor={this.state.playerColor}
            playerFaction={'normal'}
            handleClose={(pieceType: string) =>
              this.handleModalClose(pieceType)
            }
          />
          <div
            className="quickplay-view"
          // style={{
          //   background:
          //     this.state.theme === 'black'
          //       ? ''
          //       : `url(assets/pages/tactoriusb.webp) no-repeat center center fixed`,
          // }}
          >
            <div className="opponent-dialogue-arcana">
              <div className="info-avatar">
                <div className="avatar">
                  {/* <img
                    src={`/assets/avatars/${this.state.engineAvatar}.webp`}
                    style={{
                      height: '60px',
                      width: '60px',
                      objectFit: 'contain',
                    }}
                  /> */}
                </div>
                <div>
                  <ArcanaSelector
                    color={this.state.engineColor as 'white' | 'black'}
                    arcaneConfig={
                      (this.state.engineColor === 'white'
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
              <div id="dialogue" className="dialogue">
                {this.state.hoverArcane !== '' ? (
                  <div className="arcana-detail">
                    <h3>{arcana[this.state.hoverArcane].name}</h3>
                    <p>{arcana[this.state.hoverArcane].description}</p>
                  </div>
                ) : (
                  <ul style={{ padding: '0' }}>
                    {this.state.thinking ? (
                      'The engine is thinking...'
                    ) : trojanActive ? (
                      <li>
                        Trojan Gambit activated! Must take via en passant.
                      </li>
                    ) : (
                      this.state.dialogue.map((item, key) => {
                        return <li key={key}>{item}</li>;
                      })
                    )}
                  </ul>
                )}
              </div>
              <div className="buttons">
                <Button
                  className="tertiary"
                  onClick={() => {
                    audioManager.playSFX('defeat');
                    this.setState({
                      gameOver: true,
                      gameOverType: `${this.state.playerColor} resigns`,
                    });
                  }}
                  color="B"
                  // strong={true}
                  text="RESIGN"
                  width={100}
                  // fontSize={30}
                  backgroundColorOverride="#222222"
                />
              </div>
              <div className="global-volume-control">
                <GlobalVolumeControl />
              </div>
            </div>
            <div className="time-board-time">
              <div className="board-view tactorius-default-board">
                <BoardUX
                  forwardedRef={this.chessgroundRef}
                  game={this.arcaneChess()}
                  gameState={{
                    fen: this.state.fen,
                    turnColor: gameBoardTurn,
                    orientation: this.state.playerColor,
                    lastMove:
                      this.state.lastMoveHistory[this.state.historyPly - 1],
                    check: InCheck() ? true : false,
                    royalties: this.state.royalties,
                    whiteFaction: this.state.whiteFaction,
                    blackFaction: this.state.blackFaction,
                    whiteVisible: this.arcaneChess().getInvisibility()[0] <= 0,
                    blackVisible: this.arcaneChess().getInvisibility()[1] <= 0,
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
                  // theme={this.state.theme}
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
                  onEngineTrigger={() => this.engineGo()}
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
                <Button
                  className="tertiary"
                  onClick={() => {
                    audioManager.playSFX('defeat');
                    this.setState({
                      gameOver: true,
                      gameOverType: `${this.state.playerColor} resigns`,
                    });
                  }}
                  color="B"
                  // strong={true}
                  text="RESIGN"
                  width={100}
                  // fontSize={30}
                  backgroundColorOverride="#222222"
                />
              </div>
              <div className="nav">
                <Button
                  className="tertiary"
                  onClick={() => this.navigateHistory('start')}
                  color="B"
                  strong={true}
                  variant="<<"
                  width={100}
                  fontSize={30}
                  backgroundColorOverride="#222222"
                />
                <Button
                  className="tertiary"
                  onClick={() => this.navigateHistory('back')}
                  color="B"
                  strong={true}
                  variant="<"
                  width={100}
                  fontSize={30}
                  backgroundColorOverride="#222222"
                />
                <Button
                  className="tertiary"
                  onClick={() => this.navigateHistory('forward')}
                  color="B"
                  strong={true}
                  variant=">"
                  width={100}
                  fontSize={30}
                  backgroundColorOverride="#222222"
                />
                <Button
                  className="tertiary"
                  onClick={() => this.navigateHistory('end')}
                  color="B"
                  strong={true}
                  variant=">>"
                  width={100}
                  fontSize={30}
                  backgroundColorOverride="#222222"
                />
              </div>
              <div id="history" className="history">
                {sortedHistory.map((fullMove, fullMoveIndex) => {
                  return (
                    <p className="full-move" key={fullMoveIndex}>
                      <span className="move-number">{fullMoveIndex + 1}.</span>
                      <Button
                        className="tertiary"
                        text={fullMove[0]}
                        color="B"
                        height={20}
                        onClick={() => {
                          this.navigateHistory('jump', fullMoveIndex * 2 + 1);
                        }}
                        backgroundColorOverride="#00000000"
                      />
                      <Button
                        className="tertiary"
                        text={fullMove[1]}
                        color="B"
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
              <div id="dialogue" className="dialogue">
                {this.state.hoverArcane !== '' ? (
                  <div className="arcana-detail">
                    <h3>{arcana[this.state.hoverArcane].name}</h3>
                    <p>{arcana[this.state.hoverArcane].description}</p>
                  </div>
                ) : (
                  <ul style={{ padding: '0' }}>
                    {this.state.dialogue.map((item, key) => {
                      return <li key={key}>{item}</li>;
                    })}
                  </ul>
                )}
              </div>
              <div className="info-avatar">
                <div className="avatar">
                  {/* <img
                    src="/assets/avatars/normal.webp"
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
      </div>
    );
  }
}

function mapStateToProps({ auth }: { auth: object }) {
  return {
    auth,
  };
}

export const QuickPlay = connect(
  mapStateToProps,
  {}
)(withRouter(UnwrappedQuickPlay));
