import { audioManager } from 'src/shared/utils/audio/AudioManager';
import {
    GameBoard,
    TOSQ,
    FROMSQ,
    PROMOTED,
    ARCANEFLAG,
    CAPTURED,
    MFLAGSUMN,
    MFLAGCNSM,
    MFLAGSHFT,
    outputFenOfCurrentPosition,
} from 'src/features/game/engine/board.mjs';
import { CheckAndSet, CheckResult } from 'src/features/game/engine/gui.mjs';
import { PrMove, PrSq } from 'src/features/game/engine/io.mjs';
import { RtyChar } from 'src/features/game/engine/defs.mjs';
import _ from 'lodash';

export interface GameEngineHandlerCallbacks {
    setState: (state: any, callback?: () => void) => void;
    getArcaneChess: () => any;
    getChessgroundRef: () => any;
    getStopAndReturnTime: () => number | null;
    handleVictory: (timeLeft: number | null) => void;
    getState: () => {
        thinking: boolean;
        glitchActive: boolean;
        thinkingTime: number;
        engineDepth: number;
        engineColor: string;
        playerColor: string;
        dialogue: string[];
        dialogueList: Record<string, string>;
        history: (string | string[])[];
        fenHistory: string[];
        lastMoveHistory: string[][];
        royalties: any;
        turn: string;
        historyPly: number;
        placingRoyalty: number;
        gameOverType: string;
    };
}

export class GameEngineHandler {
    private callbacks: GameEngineHandlerCallbacks;

    constructor(callbacks: GameEngineHandlerCallbacks) {
        this.callbacks = callbacks;
    }

    engineGo = () => {
        const state = this.callbacks.getState();
        const arcaneChess = this.callbacks.getArcaneChess();

        this.callbacks.setState({
            thinking: true,
        });

        new Promise<{ bestMove: any; text: any }>((resolve) => {
            if (state.glitchActive) {
                const glitchMove = arcaneChess.engineGlitch();
                if (CAPTURED(glitchMove) > 0 && ARCANEFLAG(glitchMove) === 0) {
                    audioManager.playSFX('capture');
                } else {
                    audioManager.playSFX('move');
                }
                resolve(glitchMove);
            } else {
                arcaneChess
                    .engineReply(
                        state.thinkingTime,
                        state.engineDepth,
                        state.engineColor
                    )
                    .then(({ bestMove, text }: any) => {
                        if (
                            (CAPTURED(bestMove) !== 0 && (bestMove & MFLAGSUMN)) ||
                            text.some((t: string) => t.includes('phantom mist')) ||
                            text.some((t: string) => t.includes('bulletproof'))
                        ) {
                            audioManager.playSFX('freeze');
                        } else if (
                            PROMOTED(bestMove) ||
                            (bestMove & MFLAGSUMN) ||
                            (bestMove & MFLAGCNSM) ||
                            (bestMove & MFLAGSHFT) ||
                            (PROMOTED(bestMove) && (bestMove & MFLAGSUMN))
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
                this.callbacks.setState(
                    (prevState: any) => {
                        const updatedDialogue = [
                            ...prevState.dialogue,
                            ...(text || [])
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
                            history: [...prevState.history.slice(0, prevState.historyPly), PrMove(bestMove)],
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
                                ...arcaneChess.getPrettyRoyalties(),
                            },
                            glitchActive: false,
                        };
                    },
                    () => {
                        if (CheckAndSet()) {
                            this.callbacks.setState({
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
        const state = this.callbacks.getState();
        const arcaneChess = this.callbacks.getArcaneChess();
        const chessgroundRef = this.callbacks.getChessgroundRef();

        this.callbacks.setState(
            {
                thinking: true,
                hoverArcane: '',
            },
            () => {
                setTimeout(() => {
                    arcaneChess
                        .engineSuggestion(state.playerColor, level)
                        .then((reply: any) => {
                            const { bestMove, temporalPincer } = reply;
                            let newDialogue: string[] = [];
                            if (level === 1) {
                                newDialogue = [
                                    ...state.dialogue,
                                    PrSq(FROMSQ(bestMove)) || PrMove(bestMove).split('@')[0],
                                ];
                                chessgroundRef.current?.setAutoShapes([
                                    {
                                        orig: PrSq(FROMSQ(bestMove)) || 'a0',
                                        brush: 'yellow',
                                    },
                                ]);
                            } else if (level === 2) {
                                newDialogue = [...state.dialogue, PrMove(bestMove)];
                                chessgroundRef.current?.setAutoShapes([
                                    {
                                        orig: PrSq(FROMSQ(bestMove)) || PrSq(TOSQ(bestMove)),
                                        dest: !FROMSQ(bestMove) ? null : PrSq(TOSQ(bestMove)),
                                        brush: 'yellow',
                                    },
                                ]);
                            } else if (level === 3) {
                                newDialogue = [...state.dialogue, temporalPincer];
                            }
                            this.callbacks.setState(
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

    normalMoveStateAndEngineGo = (parsed: number, orig: string, dest: string) => {
        const state = this.callbacks.getState();
        const char = RtyChar.split('')[state.placingRoyalty];

        this.callbacks.setState(
            (prevState: any) => {
                // Slice history to the current ply to allow branching/overwriting future
                const newHistory = prevState.history.slice(0, prevState.historyPly);
                newHistory.push(PrMove(parsed));

                return {
                    historyPly: prevState.historyPly + 1,
                    history: newHistory,
                    fen: outputFenOfCurrentPosition(),
                    fenHistory: [...prevState.fenHistory.slice(0, prevState.historyPly + 1), outputFenOfCurrentPosition()],
                    lastMoveHistory:
                        prevState.historyPly < prevState.lastMoveHistory.length
                            ? prevState.lastMoveHistory.map((moves: any, index: number) =>
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
                    dialogue: [], // Clear dialogue when player makes a move
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
                    this.callbacks.setState(
                        {
                            gameOver: true,
                            gameOverType: CheckResult().gameResult,
                        },
                        () => {
                            const currentState = this.callbacks.getState();
                            if (
                                _.includes(
                                    currentState.gameOverType,
                                    `${currentState.playerColor} mates`
                                )
                            ) {
                                const timeLeft = this.callbacks.getStopAndReturnTime();
                                this.callbacks.handleVictory(timeLeft);
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
}
