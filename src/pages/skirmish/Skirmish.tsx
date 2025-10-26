import React, { createRef } from 'react';
import _ from 'lodash';

import { connect } from 'react-redux';
import { withRouter } from 'src/components/withRouter/withRouter';

import 'src/pages/skirmish/Skirmish.scss';
import 'src/chessground/styles/chessground.scss';
import 'src/chessground/styles/normal.scss';
import 'src/chessground/styles/lambda.scss';

import { setLocalStorage, getLocalStorage } from 'src/utils/handleLocalStorage';
import { audioManager } from 'src/utils/audio/AudioManager';

import TactoriusModal from 'src/components/Modal/Modal';
import PromotionModal from 'src/components/PromotionModal/PromotionModal';
import SkirmishModal, {
  FACTIONS,
  GREEK_CAP,
} from 'src/components/Skirmish/SkirmishModal';

import GlobalVolumeControl from 'src/utils/audio/GlobalVolumeControl';

import arcanaJson from 'src/data/arcana.json';

import arcaneChess from '../../arcaneChess/arcaneChess.mjs';
// import {
//   arcane as arcaneChess,
//   arcaneChessWorker,
// } from '../../arcaneChess/arcaneChessInstance.js';
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
} from '../../arcaneChess/board.mjs';
import { PrMove, PrSq } from 'src/arcaneChess/io.mjs';
import {
  prettyToSquare,
  PIECES,
  ARCANE_BIT_VALUES,
  COLOURS,
  RtyChar,
  PceChar,
} from '../../arcaneChess/defs.mjs';
import { outputFenOfCurrentPosition } from '../../arcaneChess/board.mjs';
import { SearchController } from '../../arcaneChess/search.mjs';
import { CheckAndSet, CheckResult } from '../../arcaneChess/gui.mjs';

import {
  whiteArcaneConfig,
  blackArcaneConfig,
  clearArcanaConfig,
} from 'src/arcaneChess/arcaneDefs.mjs';

import Button from '../../components/Button/Button';
import ChessClock from '../../components/Clock/Clock';

import { Chessground, IChessgroundApi } from '../../chessground/chessgroundMod';

import { getProgressState } from '../../arcaneChess/arcaneDefs.mjs';

const arcana: ArcanaMap = arcanaJson as ArcanaMap;

const pieces: PieceRoyaltyTypes = PIECES;
const royalties: PieceRoyaltyTypes = ARCANE_BIT_VALUES;

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
  whiteArcana: {
    [key: string]: number | string | undefined;
    modsIMP?: number | undefined;
    modsORA?: number | undefined;
    modsTEM?: number | undefined;
  };
  blackArcana: {
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
  skirmishModalOpen: boolean;
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

class UnwrappedSkirmish extends React.Component<Props, State> {
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
  engineFaction;
  chessgroundRef = createRef<IChessgroundApi>();
  chessclockRef = createRef<ChessClock>();
  intervalId: NodeJS.Timeout | null = null;
  constructor(props: Props) {
    super(props);
    this.engineFaction = this.getRandomFaction();
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
      // getLocalStorage(this.props.auth.user.username).nodeScores[
      //   getLocalStorage(this.props.auth.user.username).nodeId
      // ] > 0,
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
      whiteArcana: {},
      blackArcana: {},
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
      skirmishModalOpen: true,
      futureSightAvailable: true,
      glitchActive: false,
      engineAvatar: this.engineFaction,
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
  }

  anySpellActive = () =>
    this.state.placingPiece > 0 ||
    this.state.swapType !== '' ||
    this.state.isTeleport === true ||
    this.state.placingRoyalty > 0 ||
    this.state.offeringType !== '' ||
    this.state.isDyadMove === true;

  deactivateAllSpells = () => {
    try {
      const dyadClock =
        typeof this.arcaneChess().getDyadClock === 'function'
          ? this.arcaneChess().getDyadClock()
          : 0;

      if (this.state.isDyadMove) {
        if (
          dyadClock === 1 &&
          typeof this.arcaneChess().takeBackHalfDyad === 'function'
        ) {
          this.arcaneChess().takeBackHalfDyad();
        }
        if (typeof this.arcaneChess().deactivateDyad === 'function') {
          this.arcaneChess().deactivateDyad();
        }
      }
    } catch (e) {
      console.warn(e);
    }

    this.chessgroundRef.current?.setAutoShapes([]);

    this.setState({
      placingPiece: 0,
      swapType: '',
      isTeleport: false,
      placingRoyalty: 0,
      offeringType: '',
      isDyadMove: false,
      normalMovesOnly: false,
      hoverArcane: '',
    });
  };

  handleContextMenu(event: MouseEvent) {
    if (!this.anySpellActive()) return;
    event.preventDefault();
    this.deactivateAllSpells();
  }

  toggleHover = (arcane: string) => {
    this.setState({ hoverArcane: arcane });
  };

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

  engineGo = () => {
    this.setState({
      thinking: true,
    });
    new Promise<{ bestMove: any; text: any }>((resolve) => {
      if (this.state.glitchActive) {
        const glitchMove = arcaneChess().engineGlitch();
        if (CAPTURED(glitchMove) > 0 && ARCANEFLAG(glitchMove) === 0) {
          audioManager.playSFX('capture');
        } else {
          audioManager.playSFX('move');
        }
        resolve(glitchMove);
      } else {
        arcaneChess()
          .engineReply(
            this.state.thinkingTime,
            this.state.engineDepth,
            this.state.engineColor
          )
          .then(({ bestMove, text }) => {
            if (
              (CAPTURED(bestMove) !== 0 && bestMove & MFLAGSUMN) ||
              text.some((t: string) => t.includes('phantom mist')) ||
              text.some((t: string) => t.includes('bulletproof'))
            ) {
              audioManager.playSFX('freeze');
            } else if (
              PROMOTED(bestMove) ||
              bestMove & MFLAGSUMN ||
              bestMove & MFLAGCNSM ||
              bestMove & MFLAGSHFT ||
              (PROMOTED(bestMove) && bestMove & MFLAGSUMN)
            ) {
              audioManager.playSFX('fire');
            } else if (ARCANEFLAG(bestMove) > 0) {
              audioManager.playSFX('spell');
            } else if (CAPTURED(bestMove) > 0) {
              audioManager.playSFX('capture');
            } else {
              audioManager.playSFX('move');
            }
            resolve({ bestMove, text });
          });
      }
    })
      .then((reply) => {
        const { bestMove, text } = reply;
        this.setState(
          (prevState) => {
            const updatedDialogue = [
              ...prevState.dialogue,
              ...text
                .map((key: string) => {
                  if (key in prevState.dialogueList) {
                    const value = prevState.dialogueList[key];
                    return !prevState.dialogue.includes(value) ? '' : '';
                  }
                  return key;
                })
                .filter((value: string | null) => value),
            ];
            return {
              ...prevState,
              dialogue: [...updatedDialogue],
              pvLine: GameBoard.cleanPV,
              historyPly: prevState.historyPly + 1,
              history: [...prevState.history, PrMove(bestMove)],
              fen: outputFenOfCurrentPosition(),
              fenHistory: [
                ...prevState.fenHistory,
                outputFenOfCurrentPosition(),
              ],
              lastMoveHistory: [
                ...prevState.lastMoveHistory,
                [PrSq(FROMSQ(bestMove)), PrSq(TOSQ(bestMove))],
              ],
              thinking: false,
              turn: prevState.turn === 'white' ? 'black' : 'white',
              royalties: {
                ...prevState.royalties,
                ...this.arcaneChess().getPrettyRoyalties(),
              },
              glitchActive: false,
            };
          },
          () => {
            if (CheckAndSet()) {
              this.setState({
                gameOver: true,
                gameOverType: CheckResult().gameResult,
              });
              audioManager.playSFX('defeat');
              return;
            }
          }
        );
      })
      .catch((error) => {
        console.error('An error occurred:', error);
      });
  };

  getHintAndScore = (level: number) => {
    audioManager.playSFX('spell');
    this.setState(
      {
        thinking: true,
        hoverArcane: '',
      },
      () => {
        setTimeout(() => {
          arcaneChess()
            .engineSuggestion(this.state.playerColor, level)
            .then((reply: any) => {
              const { bestMove, temporalPincer } = reply;
              let newDialogue: string[] = [];
              if (level === 1) {
                newDialogue = [
                  ...this.state.dialogue,
                  PrSq(FROMSQ(bestMove)) || PrMove(bestMove).split('@')[0],
                ];
                this.chessgroundRef.current?.setAutoShapes([
                  {
                    orig: PrSq(FROMSQ(bestMove)) || 'a0',
                    brush: 'yellow',
                  },
                ]);
              } else if (level === 2) {
                newDialogue = [...this.state.dialogue, PrMove(bestMove)];
                this.chessgroundRef.current?.setAutoShapes([
                  {
                    orig: PrSq(FROMSQ(bestMove)) || PrSq(TOSQ(bestMove)),
                    dest: !FROMSQ(bestMove) ? null : PrSq(TOSQ(bestMove)),
                    brush: 'yellow',
                  },
                ]);
              } else if (level === 3) {
                newDialogue = [...this.state.dialogue, temporalPincer];
              }
              this.setState(
                {
                  dialogue: newDialogue,
                  thinking: false,
                  hoverArcane: '',
                },
                () => {
                  audioManager.playSFX('spell');
                }
              );
            });
        }, 0);
      }
    );
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

  promotionSelectAsync(callback: () => void): Promise<void> {
    return new Promise((resolve) => {
      this.setState({ promotionModalOpen: true });
      this.intervalId = setInterval(() => {
        if (this.state.placingPromotion) {
          clearInterval(this.intervalId!);
          this.intervalId = null;
          callback();
          resolve();
        }
      }, 100);
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

  normalMoveStateAndEngineGo = (parsed: number, orig: string, dest: string) => {
    const char = RtyChar.split('')[this.state.placingRoyalty];
    this.setState(
      (prevState) => {
        const newHistory = [...prevState.history];
        const lastIndex = newHistory.length - 1;
        if (Array.isArray(newHistory[lastIndex])) {
          newHistory[lastIndex] = [...newHistory[lastIndex], PrMove(parsed)];
        } else {
          newHistory.push(PrMove(parsed));
        }
        return {
          historyPly: prevState.historyPly + 1,
          history: newHistory,
          fen: outputFenOfCurrentPosition(),
          fenHistory: [...prevState.fenHistory, outputFenOfCurrentPosition()],
          lastMoveHistory:
            prevState.historyPly < prevState.lastMoveHistory.length
              ? prevState.lastMoveHistory.map((moves, index) =>
                  index === prevState.historyPly
                    ? [...moves, orig, dest]
                    : moves
                )
              : [...prevState.lastMoveHistory, [orig, dest]],
          placingPiece: 0,
          placingRoyalty: 0,
          placingPromotion: 0,
          promotionModalOpen: false,
          normalMovesOnly: false,
          swapType: '',
          isTeleport: false,
          offeringType: '',
          royalties: {
            ...prevState.royalties,
            royaltyQ: _.mapValues(prevState.royalties.royaltyQ, (value) => {
              return typeof value === 'undefined' ? value : (value -= 1);
            }),
            royaltyT: _.mapValues(prevState.royalties.royaltyT, (value) => {
              return typeof value === 'undefined' ? value : (value -= 1);
            }),
            royaltyM: _.mapValues(prevState.royalties.royaltyM, (value) => {
              return typeof value === 'undefined' ? value : (value -= 1);
            }),
            royaltyV: _.mapValues(prevState.royalties.royaltyV, (value) => {
              return typeof value === 'undefined' ? value : (value -= 1);
            }),
            royaltyE: _.mapValues(prevState.royalties.royaltyE, (value) => {
              return typeof value === 'undefined' ? value : (value -= 1);
            }),
            royaltyF: _.mapValues(prevState.royalties.royaltyF, (value) => {
              return typeof value === 'undefined' ? value : (value -= 1);
            }),
            [`royalty${char}`]: {
              ...prevState.royalties[`royalty${char}`],
              [dest]: 8,
            },
          },
        };
      },
      () => {
        if (CheckAndSet()) {
          this.setState(
            {
              gameOver: true,
              gameOverType: CheckResult().gameResult,
            },
            () => {
              if (
                _.includes(
                  this.state.gameOverType,
                  `${this.state.playerColor} mates`
                )
              ) {
                this.handleVictory(this.stopAndReturnTime() as number | null);
              }
            }
          );
          return;
        } else {
          this.engineGo();
        }
      }
    );
  };

  navigateHistory(type: string, targetIndex?: number) {
    this.setState((prevState) => {
      let newFenIndex = prevState.historyPly;
      switch (type) {
        case 'back':
          if (newFenIndex > 0) {
            audioManager.playSFX('move');
            newFenIndex -= 1;
          }
          break;
        case 'forward':
          if (newFenIndex < prevState.fenHistory.length - 1) {
            audioManager.playSFX('move');
            newFenIndex += 1;
          }
          break;
        case 'start':
          if (newFenIndex !== 0) {
            audioManager.playSFX('move');
            newFenIndex = 0;
          }
          break;
        case 'end':
          if (newFenIndex !== prevState.fenHistory.length - 1) {
            audioManager.playSFX('move');
            newFenIndex = prevState.fenHistory.length - 1;
          }
          break;
        case 'jump':
          if (
            targetIndex !== undefined &&
            targetIndex >= 0 &&
            targetIndex < prevState.fenHistory.length
          ) {
            audioManager.playSFX('move');
            newFenIndex = targetIndex;
          }
          break;
      }
      return {
        ...prevState,
        historyPly: newFenIndex,
        fen: prevState.fenHistory[newFenIndex],
      };
    });
  }

  handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
        this.navigateHistory('back');
        break;
      case 'ArrowRight':
        this.navigateHistory('forward');
        break;
      case 'Escape':
        if (this.anySpellActive()) {
          this.deactivateAllSpells();
        }
        break;
      default:
        break;
    }
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

  updateSkirmishState = (property: string, value: any) => {
    if (property === 'whiteArcana' || property === 'blackArcana') {
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

  arcanaSelect = (color: string) => {
    const progress = getProgressState(color as 'white' | 'black');
    const pct = Math.round(progress.pct * 100);
    const untilNext = progress.untilNext;
    const tier = progress.tier;

    return (
      <div className="arcana-select-wrapper">
        <div className="arcana-select">
          {_.map(
            color === 'white' ? whiteArcaneConfig : blackArcaneConfig,
            (value: number, key: string) => {
              const entry = arcana[key];
              if (!entry) return null;

              const isInherent = entry.type === 'inherent';
              if (!isInherent && (!value || value <= 0)) return null;

              const futureSightAvailable =
                this.state.history.length >= 4 &&
                this.state.futureSightAvailable;

              const isDisabled =
                this.state.playerColor !== color ||
                this.state.thinking ||
                (!futureSightAvailable && key === 'modsFUT');

              const active = this.isArcaneActive(key, color);
              const dyadName =
                typeof this.arcaneChess().getDyadName === 'function'
                  ? this.arcaneChess().getDyadName()
                  : '';
              const dyadOwner =
                typeof this.arcaneChess().getDyadOwner === 'function'
                  ? this.arcaneChess().getDyadOwner()
                  : undefined;
              let dyadStillActive = false;
              if (key.startsWith('dyad') && dyadName === key) {
                if (dyadOwner === color) dyadStillActive = true;
              }
              const effectiveActive = active || dyadStillActive;
              const trojanActive =
                this.arcaneChess().getIfTrojanGambitExists(
                  this.state.engineColor
                ) && key === 'modsTRO';

              return (
                <div
                  key={key}
                  style={{ position: 'relative', display: 'inline-block' }}
                >
                  <div style={{ position: 'absolute' }}>
                    {isInherent ? 'INH' : value}
                  </div>
                  <img
                    key={key}
                    className={`arcane${effectiveActive ? ' is-active' : ''}${
                      trojanActive
                        ? ' trojan-active'
                        : this.state.hoverArcane === key
                        ? ' focus'
                        : ''
                    }`}
                    src={`/assets/arcanaImages${entry.imagePath}.svg`}
                    style={{
                      opacity: isDisabled ? 0.5 : 1,
                      cursor: isDisabled
                        ? 'not-allowed'
                        : `url('/assets/images/cursors/pointer.svg') 12 4, pointer`,
                    }}
                    onClick={() => {
                      if (isDisabled) return;
                      this.handleArcanaClick(key);
                    }}
                    onMouseEnter={() => this.toggleHover(key)}
                    onMouseLeave={() => this.toggleHover('')}
                  />
                </div>
              );
            }
          )}
        </div>
        <div
          className="mana-bar"
          title={`Tier ${tier} – ${untilNext} move${
            untilNext === 1 ? '' : 's'
          } to next`}
        >
          <div className="mana-bar__fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  handleArcanaClick = (key: string) => {
    const { playerColor } = this.state;
    const arcane = this.arcaneChess();
    const entry = arcana[key];
    if (!entry) return;

    if (this.state.thinking || this.state.playerColor !== playerColor) return;

    this.setState({
      placingPiece: 0,
      placingRoyalty: 0,
      swapType: '',
      offeringType: '',
      isTeleport: false,
      isDyadMove: false,
    });

    // === SUMMONS ===
    if (key.startsWith('sumn')) {
      const dyadClock = arcane.getDyadClock();
      if (dyadClock > 0 || this.state.isDyadMove) return;

      const suffix = key.slice(4);
      const side = this.state.selectedSide === 'white' ? 'w' : 'b';

      if (key.startsWith('sumnR') && suffix.length > 1) {
        const rKey = suffix.toUpperCase();
        const royaltyCode = royalties[rKey];
        // toggle off if already selected
        if (this.state.placingRoyalty === royaltyCode) {
          this.setState({ placingRoyalty: 0 });
          return;
        }
        this.setState({
          placingRoyalty: royaltyCode || 0,
        });
        return;
      }

      const unit = suffix.toUpperCase();
      const pieceCode = pieces[`${side}${unit}`];
      // toggle off when clicking same summon badge again
      if (this.state.placingPiece === pieceCode) {
        this.setState({ placingPiece: 0 });
        return;
      }

      this.setState({
        placingPiece: pieceCode || 0,
      });
      return;
    }

    // === SWAP ===
    if (key.startsWith('swap')) {
      const dyadClock = arcane.getDyadClock();
      if (dyadClock > 0 || this.state.isDyadMove) return;
      this.setState({
        swapType: this.state.swapType === '' ? key.split('swap')[1] : '',
      });
      return;
    }

    // === OFFER ===
    if (key.startsWith('offr')) {
      const dyadClock = arcane.getDyadClock();
      if (dyadClock > 0 || this.state.isDyadMove) return;
      this.setState({
        offeringType:
          this.state.offeringType === '' ? key.split('offr')[1] : '',
      });
      return;
    }

    // === SPELL: Bulletproof ===
    if (key === 'modsSUS') {
      if (GameBoard.suspend > 0) return;
      audioManager.playSFX('freeze');
      arcane.useBulletproof(playerColor);
      this.setState((prev) => ({
        dialogue: [
          ...prev.dialogue,
          `${playerColor} used bulletproof — no captures, checks, or promotions for 3 turns!`,
        ],
      }));
      return;
    }

    // === DYAD ===
    if (key.startsWith('dyad')) {
      const dyadClock = arcane.getDyadClock();
      const dyadName =
        typeof arcane.getDyadName === 'function' ? arcane.getDyadName() : '';
      const dyadOwner =
        typeof arcane.getDyadOwner === 'function'
          ? arcane.getDyadOwner()
          : undefined;
      // if clicking the same dyad badge that is already active for the selected side,
      // revert if halfway through (dyadClock === 1), otherwise deactivate
      if (dyadName === key && dyadOwner === this.state.selectedSide) {
        if (dyadClock === 1) {
          try {
            if (typeof arcane.takeBackHalfDyad === 'function') {
              arcane.takeBackHalfDyad();
            }
          } catch (e) {
            console.warn(e);
          }
          this.setState((prev) => ({
            isDyadMove: true,
            normalMovesOnly: true,
            history: prev.history.slice(0, -1),
            fen: outputFenOfCurrentPosition(),
            fenHistory: prev.fenHistory.slice(0, -1),
            lastMoveHistory: prev.lastMoveHistory.slice(0, -1),
          }));
          return;
        }
        try {
          if (typeof arcane.deactivateDyad === 'function') {
            arcane.deactivateDyad();
          }
        } catch (e) {
          console.warn(e);
        }
        this.setState({ isDyadMove: false, normalMovesOnly: false });
        return;
      }

      const dyadClock2 = arcane.getDyadClock();
      if (this.state.isDyadMove && dyadClock2 === 0) {
        arcane.deactivateDyad();
        this.setState({ isDyadMove: false, normalMovesOnly: false });
      } else if (dyadClock2 === 1) {
        arcane.takeBackHalfDyad();
        this.setState((prev) => ({
          isDyadMove: true,
          normalMovesOnly: true,
          history: prev.history.slice(0, -1),
          fen: outputFenOfCurrentPosition(),
          fenHistory: prev.fenHistory.slice(0, -1),
          lastMoveHistory: prev.lastMoveHistory.slice(0, -1),
        }));
      } else {
        arcane.activateDyad(key);
        arcane.parseCurrentFen();
        arcane.generatePlayableOptions();
        const dests = arcane.getGroundMoves();
        if (dests.size === 0) {
          arcane.deactivateDyad();
          this.setState({ isDyadMove: false, normalMovesOnly: false });
        } else {
          this.setState({ isDyadMove: true, normalMovesOnly: true });
        }
      }
      return;
    }

    // === FUTURE SIGHT ===
    if (key === 'modsFUT') {
      const { futureSightAvailable } = this.state;
      if (!futureSightAvailable) return;
      audioManager.playSFX('spell');
      arcane.takeBackMove(4, playerColor, this.state.history);
      this.setState((prev) => ({
        historyPly: prev.historyPly - 4,
        fen: outputFenOfCurrentPosition(),
        fenHistory: prev.fenHistory.slice(0, -4),
        lastMoveHistory: prev.lastMoveHistory.slice(0, -4),
        futureSightAvailable: false,
      }));
      return;
    }

    // === TELEPORT ===
    if (key === 'shftT') {
      this.setState({ isTeleport: !this.state.isTeleport });
      return;
    }

    // === GLITCH ===
    if (key === 'modsGLI') {
      audioManager.playSFX('spell');
      arcane.subtractArcanaUse('modsGLI', playerColor);
      this.setState({ glitchActive: true });
    }
  };

  renderManaBar = (color: 'white' | 'black') => {
    const prog = getProgressState(color);
    const fill = Math.round(prog.pct * 100);

    return (
      <div
        className="mana-bar"
        title={`Tier ${prog.tier} • ${prog.untilNext} move(s) to next grant`}
      >
        <div className="mana-bar__fill" style={{ width: `${fill}%` }} />
      </div>
    );
  };

  getRandomFaction = () => {
    const factions = ['chi', 'omega', 'sigma', 'lambda', 'nu', 'mu'];
    const randomIndex = Math.floor(Math.random() * factions.length);
    return factions[randomIndex];
  };

  isArcaneActive = (key: string, color?: string) => {
    // Only show active for badges that belong to the currently selected side
    if (typeof color !== 'undefined' && color !== this.state.selectedSide)
      return false;

    if (key === 'shftT') return this.state.isTeleport;

    if (key.includes('dyad')) return this.state.isDyadMove;

    if (key.includes('swap')) {
      const type = key.split('swap')[1];
      return this.state.swapType === type;
    }

    if (key.includes('offr')) {
      const type = key.split('offr')[1];
      return this.state.offeringType === type;
    }

    if (!key.startsWith('sumn')) return false;

    if (key.includes('sumnR') && key !== 'sumnR') {
      const rKey = key.split('sumn')[1];
      const expected = royalties[rKey] ?? -1;
      return this.state.placingRoyalty === expected;
    }
    const id = key.slice(4);
    if (!id) return false;
    const pieceKey =
      id.toUpperCase() === 'X'
        ? `${this.state.selectedSide === 'white' ? 'w' : 'b'}X`
        : `${this.state.selectedSide === 'white' ? 'w' : 'b'}${id}`;

    const expectedPiece = (PIECES as Record<string, number>)[pieceKey] ?? -1;
    return this.state.placingPiece === expectedPiece;
  };

  render() {
    // const greekLetters = ['X', 'Ω', 'Θ', 'Σ', 'Λ', 'Φ', 'M', 'N'];
    const gameBoardTurn = GameBoard.side === 0 ? 'white' : 'black';
    const LS = getLocalStorage(this.props.auth.user.username);
    const sortedHistory = _.chunk(this.state.history, 2);
    const trojanActive = this.arcaneChess().getIfTrojanGambitExists(
      this.state.engineColor
    );
    const mapFaction = (f: string) => (f === 'normal' ? 'tau' : f);

    const engineAccent = this.state.engineColor
      ? FACTIONS[
          mapFaction(
            this.state.engineColor === 'white'
              ? this.state.whiteFaction
              : this.state.blackFaction
          ) as keyof typeof FACTIONS
        ].color
      : undefined;

    const playerAccent = this.state.playerColor
      ? FACTIONS[
          mapFaction(
            this.state.playerColor === 'white'
              ? this.state.whiteFaction
              : this.state.blackFaction
          ) as keyof typeof FACTIONS
        ].color
      : undefined;

    return (
      <div className="skirmish-tactorius-board fade">
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
          <SkirmishModal
            isOpen={this.state.skirmishModalOpen}
            handleClose={() => {
              this.setState({ skirmishModalOpen: false }, () => {
                this.arcaneChess().init();
                this.arcaneChess().startGame(
                  this.state.fen,
                  this.state.whiteArcana,
                  this.state.blackArcana,
                  this.state.royalties,
                  this.state.preset
                );
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
                      `${
                        this.state.playerColor === 'white' ? 'w' : 'b'
                      }${value}`
                    ];
                }
              }
              this.updateSkirmishState(property, value);
            }}
            type="skirmish"
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
            className="skirmish-view"
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
                  <div
                    style={
                      engineAccent
                        ? { borderColor: engineAccent, color: engineAccent }
                        : {}
                    }
                    title={`${
                      this.state.playerColor === 'white'
                        ? this.state.blackFaction
                        : this.state.whiteFaction
                    } faction`}
                  >
                    <span className="badge-glyph">
                      {
                        GREEK_CAP[
                          (this.state.playerColor === 'white'
                            ? this.state.blackFaction
                            : this.state.whiteFaction) as keyof typeof GREEK_CAP
                        ]
                      }
                    </span>
                  </div>
                </div>
                <div className="board-arcana">
                  {this.arcanaSelect(this.state.engineColor)}
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
                <Chessground
                  // theme={this.state.theme}
                  forwardedRef={this.chessgroundRef}
                  // viewOnly={this.isCheckmate()}
                  fen={this.state.fen}
                  resizable={true}
                  wFaction={
                    this.state.whiteFaction === 'tau'
                      ? 'normal'
                      : this.state.whiteFaction
                  }
                  bFaction={
                    this.state.blackFaction === 'tau'
                      ? 'normal'
                      : this.state.blackFaction
                  }
                  royalties={this.state.royalties}
                  wVisible={this.arcaneChess().getInvisibility()[0] <= 0}
                  bVisible={this.arcaneChess().getInvisibility()[1] <= 0}
                  premovable={{
                    enabled: false,
                    // premoveFunc: () => {},
                    // showDests: true,
                    // autoCastle: true,
                    // dests: this.arcaneChess().getGroundMoves(),
                  }}
                  width={'100%'}
                  height={'100%'}
                  check={InCheck() ? true : false}
                  animation={{
                    enabled: true,
                    duration: 200,
                  }}
                  highlight={{
                    lastMove: true,
                    check: true,
                    royalties: true,
                  }}
                  lastMove={
                    this.state.lastMoveHistory[this.state.historyPly - 1]
                  }
                  orientation={this.state.playerColor}
                  disableContextMenu={false}
                  turnColor={gameBoardTurn}
                  movable={{
                    free: false,
                    rookCastle: false,
                    color: 'both',
                    dests: (() => {
                      if (this.state.thinking) return;
                      let dests;
                      if (this.state.placingPiece === 0) {
                        if (this.state.placingRoyalty === 0) {
                          if (this.state.swapType === '') {
                            if (this.state.offeringType === '') {
                              if (this.state.isTeleport) {
                                dests =
                                  this.arcaneChess().getGroundMoves('TELEPORT');
                              } else {
                                dests = this.arcaneChess().getGroundMoves();
                              }
                            } else {
                              dests = this.arcaneChess().getOfferingMoves(
                                this.state.offeringType
                              );
                              console.log('offering dests', dests);
                            }
                          } else {
                            dests = this.arcaneChess().getSwapMoves(
                              this.state.swapType
                            );
                          }
                        } else {
                          dests = this.arcaneChess().getSummonMoves(
                            this.state.placingRoyalty
                          );
                        }
                      } else {
                        dests = this.arcaneChess().getSummonMoves(
                          this.state.placingPiece
                        );
                      }
                      return dests;
                    })(),
                    events: {},
                  }}
                  selectable={{
                    enabled: true,
                    selected:
                      this.state.placingPiece !== 0
                        ? {
                            role: `${PceChar.split('')[
                              this.state.placingPiece
                            ].toLowerCase()}-piece`,
                            color: this.state.playerColor,
                          }
                        : this.state.placingRoyalty !== 0
                        ? {
                            role: `r${RtyChar.split('')[
                              this.state.placingRoyalty
                            ].toLowerCase()}-piece`,
                            color: this.state.playerColor,
                          }
                        : this.state.offeringType !== ''
                        ? {
                            role: `o${this.state.offeringType.toLowerCase()}-piece`,
                            color: this.state.playerColor,
                          }
                        : null,
                    fromPocket: false,
                  }}
                  events={{
                    change: () => {},
                    dropNewPiece: (piece: string, key: string) => {
                      this.chessgroundRef.current?.setAutoShapes([]);
                      if (
                        GameBoard.pieces[prettyToSquare(key)] === PIECES.EMPTY
                      ) {
                        const { parsed } = this.arcaneChess().makeUserMove(
                          null,
                          key,
                          this.state.placingPiece,
                          '',
                          this.state.placingRoyalty
                        );
                        if (this.state.placingPiece > 0) {
                          audioManager.playSFX('fire');
                        }
                        if (this.state.placingRoyalty > 0) {
                          audioManager.playSFX('freeze');
                        }
                        if (!PrMove(parsed)) {
                          console.log('invalid move', PrMove(parsed), piece);
                        }
                        this.setState(
                          (prevState) => ({
                            historyPly: prevState.historyPly + 1,
                            history: [...prevState.history, PrMove(parsed)],
                            fen: outputFenOfCurrentPosition(),
                            fenHistory: [
                              ...prevState.fenHistory,
                              outputFenOfCurrentPosition(),
                            ],
                            lastMoveHistory: [
                              ...prevState.lastMoveHistory,
                              ['a0', key],
                            ],
                            placingPiece: 0,
                            placingRoyalty: 0,
                            swapType: '',
                            offeringType: '',
                            isTeleport: false,
                            futureSightAvailable: true,
                          }),
                          () => {
                            if (CheckAndSet()) {
                              this.setState(
                                {
                                  gameOver: true,
                                  gameOverType: CheckResult().gameResult,
                                },
                                () => {
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
                                }
                              );
                              return;
                            } else {
                              this.engineGo();
                            }
                          }
                        );
                      }
                      if (this.state.placingRoyalty !== 0) {
                        this.setState((prevState) => ({
                          ...prevState,
                          royalties: {
                            ...prevState.royalties,
                            ...this.arcaneChess().getPrettyRoyalties(),
                          },
                          placingRoyalty: 0,
                        }));
                      }
                    },
                    move: (orig: string, dest: string) => {
                      const swapOrTeleport = this.state.isTeleport
                        ? 'TELEPORT'
                        : this.state.swapType;
                      this.chessgroundRef.current?.setAutoShapes([]);
                      const { parsed, isInitPromotion = false } =
                        this.arcaneChess().makeUserMove(
                          orig,
                          dest,
                          this.state.placingPromotion,
                          swapOrTeleport,
                          this.state.placingRoyalty
                        );
                      if (this.state.isDyadMove) {
                        this.arcaneChess().generatePlayableOptions();
                        this.arcaneChess().parseCurrentFen();
                        const dests = this.arcaneChess().getGroundMoves();
                        if (dests.size === 0) {
                          this.arcaneChess().takeBackHalfDyad();
                          this.arcaneChess().deactivateDyad();
                          this.setState((prevState) => ({
                            ...prevState,
                            isDyadMove: false,
                            normalMovesOnly: false,
                          }));
                          return;
                        }
                        audioManager.playSFX('fire');
                        this.setState((prevState) => ({
                          ...prevState,
                          history: [...prevState.history, [PrMove(parsed)]],
                          fen: outputFenOfCurrentPosition(),
                          fenHistory: [
                            ...prevState.fenHistory,
                            outputFenOfCurrentPosition(),
                          ],
                          lastMoveHistory: [
                            ...prevState.lastMoveHistory,
                            [orig, dest],
                          ],
                        }));
                      } else {
                        if (
                          PROMOTED(parsed) > 0 ||
                          parsed & MFLAGCNSM ||
                          parsed & MFLAGSHFT
                        ) {
                          audioManager.playSFX('fire');
                        } else if (ARCANEFLAG(parsed) > 0) {
                          audioManager.playSFX('spell');
                        } else if (CAPTURED(parsed) > 0) {
                          audioManager.playSFX('capture');
                        } else {
                          audioManager.playSFX('move');
                        }
                      }
                      if (isInitPromotion) {
                        this.promotionSelectAsync(() => {
                          const { parsed } = this.arcaneChess().makeUserMove(
                            orig,
                            dest,
                            this.state.placingPromotion,
                            swapOrTeleport,
                            this.state.placingRoyalty
                          );
                          if (
                            (CAPTURED(parsed) > 0 &&
                              ARCANEFLAG(parsed) === 0) ||
                            InCheck()
                          ) {
                            audioManager.playSFX('capture');
                          } else {
                            audioManager.playSFX('move');
                          }
                          if (!PrMove(parsed)) {
                            console.log('invalid move');
                          }
                          if (this.state.isDyadMove) {
                            this.setState({
                              isDyadMove: false,
                              normalMovesOnly: true,
                            });
                          } else {
                            this.normalMoveStateAndEngineGo(parsed, orig, dest);
                          }
                        });
                      } else {
                        if (!PrMove(parsed)) {
                          console.log('invalid move');
                        }
                        if (this.state.isDyadMove) {
                          this.setState((prevState) => ({
                            ...prevState,
                            isDyadMove: false,
                            normalMovesOnly: true,
                          }));
                        } else {
                          this.normalMoveStateAndEngineGo(parsed, orig, dest);
                        }
                      }
                      this.setState({
                        futureSightAvailable: true,
                      });
                    },
                    select: (key: string) => {
                      let char = RtyChar.split('')[this.state.placingRoyalty];
                      const whiteLimit =
                        100 - 10 * (8 - GameBoard.summonRankLimits[0]);
                      const blackLimit =
                        20 + 10 * (8 - GameBoard.summonRankLimits[1]);

                      if (char === 'Y' || char === 'Z') {
                        char = 'E';
                      }

                      if (this.state.placingRoyalty > 0) {
                        this.chessgroundRef.current?.setAutoShapes([]);
                        if (
                          ((GameBoard.side === COLOURS.WHITE &&
                            prettyToSquare(key) < whiteLimit) ||
                            (GameBoard.side === COLOURS.BLACK &&
                              prettyToSquare(key) > blackLimit)) &&
                          GameBoard.pieces[prettyToSquare(key)] !== PIECES.EMPTY
                        ) {
                          if (
                            (this.state.royalties?.royaltyQ?.[key] ?? 0) > 0 ||
                            (this.state.royalties?.royaltyT?.[key] ?? 0) > 0 ||
                            (this.state.royalties?.royaltyM?.[key] ?? 0) > 0 ||
                            (this.state.royalties?.royaltyV?.[key] ?? 0) > 0 ||
                            (this.state.royalties?.royaltyE?.[key] ?? 0) > 0
                          ) {
                            this.setState({
                              placingRoyalty: this.state.placingRoyalty,
                            });
                            return;
                          } else {
                            const { parsed } = this.arcaneChess().makeUserMove(
                              null,
                              key,
                              this.state.placingPiece,
                              '',
                              this.state.placingRoyalty
                            );
                            audioManager.playSFX('freeze');
                            if (parsed === 0) {
                              console.log('parsed === 0');
                            }
                            this.setState(
                              (prevState) => ({
                                ...prevState,
                                historyPly: prevState.historyPly + 1,
                                history: [...prevState.history, PrMove(parsed)],
                                fen: outputFenOfCurrentPosition(),
                                fenHistory: [
                                  ...prevState.fenHistory,
                                  outputFenOfCurrentPosition(),
                                ],
                                lastMoveHistory: [
                                  ...prevState.lastMoveHistory,
                                  ['a0', key],
                                ],
                                royalties: {
                                  ...prevState.royalties,
                                  ...this.arcaneChess().getPrettyRoyalties(),
                                },
                                placingPiece: 0,
                                placingRoyalty: 0,
                                swapType: '',
                                offeringType: '',
                                isTeleport: false,
                                futureSightAvailable: true,
                              }),
                              () => {
                                if (CheckAndSet()) {
                                  this.setState(
                                    {
                                      gameOver: true,
                                      gameOverType: CheckResult().gameResult,
                                    },
                                    () => {
                                      if (
                                        _.includes(
                                          this.state.gameOverType,
                                          `${this.state.playerColor} mates`
                                        )
                                      ) {
                                        this.handleVictory(
                                          this.stopAndReturnTime() as
                                            | number
                                            | null
                                        );
                                      }
                                    }
                                  );
                                  return;
                                } else {
                                  this.engineGo();
                                }
                              }
                            );
                          }
                        } else {
                          this.setState({
                            placingRoyalty: this.state.placingRoyalty,
                          });
                        }
                      } else if (this.state.offeringType !== '') {
                        const dests = this.arcaneChess().getOfferingMoves(
                          this.state.offeringType
                        );
                        if (
                          dests.has(`o${this.state.offeringType}@`) &&
                          dests
                            .get(`o${this.state.offeringType}@`)
                            .includes(key)
                        ) {
                          this.chessgroundRef.current?.setAutoShapes([]);
                          const { parsed } = this.arcaneChess().makeUserMove(
                            key,
                            null,
                            this.state.placingPiece,
                            '',
                            this.state.offeringType
                          );
                          audioManager.playSFX('spell');
                          if (parsed === 0) {
                            console.log('parsed === 0');
                          }
                          this.setState(
                            (prevState) => ({
                              ...prevState,
                              historyPly: prevState.historyPly + 1,
                              history: [...prevState.history, PrMove(parsed)],
                              fen: outputFenOfCurrentPosition(),
                              fenHistory: [
                                ...prevState.fenHistory,
                                outputFenOfCurrentPosition(),
                              ],
                              lastMoveHistory: [
                                ...prevState.lastMoveHistory,
                                [key, 'a0'],
                              ],
                              royalties: {
                                ...prevState.royalties,
                                ...this.arcaneChess().getPrettyRoyalties(),
                              },
                              placingPiece: 0,
                              placingRoyalty: 0,
                              swapType: '',
                              offeringType: '',
                              isTeleport: false,
                              futureSightAvailable: true,
                            }),
                            () => {
                              if (CheckAndSet()) {
                                this.setState(
                                  {
                                    gameOver: true,
                                    gameOverType: CheckResult().gameResult,
                                  },
                                  () => {
                                    if (
                                      _.includes(
                                        this.state.gameOverType,
                                        `${this.state.playerColor} mates`
                                      )
                                    ) {
                                      this.handleVictory(
                                        this.stopAndReturnTime() as
                                          | number
                                          | null
                                      );
                                    }
                                  }
                                );
                                return;
                              } else {
                                this.engineGo();
                              }
                            }
                          );
                        } else {
                          this.setState({
                            offeringType: this.state.offeringType,
                          });
                        }
                      }
                    },
                  }}
                  draggable={{
                    enabled:
                      this.state.placingRoyalty === 0 ||
                      this.state.offeringType === ''
                        ? true
                        : false,
                  }}
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
                  <div
                    style={
                      playerAccent
                        ? { borderColor: playerAccent, color: playerAccent }
                        : {}
                    }
                    title={`${
                      this.state.playerColor === 'white'
                        ? this.state.whiteFaction
                        : this.state.blackFaction
                    } faction`}
                  >
                    <span className="badge-glyph">
                      {
                        GREEK_CAP[
                          (this.state.playerColor === 'white'
                            ? this.state.whiteFaction
                            : this.state.blackFaction) as keyof typeof GREEK_CAP
                        ]
                      }
                    </span>
                  </div>
                </div>
                <div className="board-arcana">
                  {this.arcanaSelect(this.state.playerColor)}
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

export const Skirmish = connect(
  mapStateToProps,
  {}
)(withRouter(UnwrappedSkirmish));
