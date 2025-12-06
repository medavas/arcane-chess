import React, { createRef } from 'react';
import _ from 'lodash';
import axios from 'axios';

import { connect } from 'react-redux';
import { withRouter } from 'src/shared/hooks/withRouter/withRouter';

import './MissionView.scss';
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

import GlobalVolumeControl from 'src/shared/utils/audio/GlobalVolumeControl';

import arcanaJson from 'src/shared/data/arcana.json';
import { booksMap } from 'src/shared/data/booksMap';

import arcaneChess from 'src/features/game/engine/arcaneChess.mjs';
import {
    GameBoard,
    InCheck,
} from 'src/features/game/engine/board.mjs';
import { PrSq } from 'src/features/game/engine/io.mjs';
import {
    PIECES,
    ARCANE_BIT_VALUES,
} from 'src/features/game/engine/defs.mjs';
import { SearchController } from 'src/features/game/engine/search.mjs';

import {
    whiteArcaneConfig,
    blackArcaneConfig,
    clearArcanaConfig,
} from 'src/features/game/engine/arcaneDefs.mjs';

import { IChessgroundApi } from 'src/features/game/board/chessgroundMod';

import ChessClock from '../../components/Clock/Clock';
import { SpellHandler } from 'src/features/game/utils/SpellHandler';
import { BoardUX } from 'src/features/game/components/BoardUX/BoardUX';
import { GameEngineHandler } from 'src/features/game/utils/GameEngineHandler';
import { HistoryHandler } from 'src/features/game/utils/HistoryHandler';
import { PromotionHandler } from 'src/features/game/utils/PromotionHandler';
import { OpponentPanel } from 'src/features/game/components/GamePanels/OpponentPanel';
import { PlayerPanel } from 'src/features/game/components/GamePanels/PlayerPanel';

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
            campaign: {
                topScores: number[];
            };
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
    navigate: any;
}

class UnwrappedMissionView extends React.Component<Props, State> {
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
    promotionHandler: PromotionHandler;

    constructor(props: Props) {
        super(props);
        const LS = getLocalStorage(this.props.auth.user.username);
        this.state = {
            turn: 'white',
            playerInc: null,
            timeLeft: null,
            playerClock: null,
            playerColor: LS.config.playerColor,
            engineColor: LS.config.playerColor === 'white' ? 'black' : 'white',
            hasMounted: false,
            nodeId: getLocalStorage(this.props.auth.user.username).nodeId,
            gameOver: false,
            gameOverType: '',
            whiteSetup: this.props.config.whiteSetup,
            blackSetup: this.props.config.blackSetup,
            fen: this.getFen(LS),
            fenHistory: [this.getFen(LS)],
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
            selectedSide: LS.config.playerColor,
            hoverArcane: '',
            royalties: {},
            orientation: LS.config.playerColor,
            preset: '',
            promotionModalOpen: false,
            placingPromotion: 0,
            hint: '',
            theme: '',
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
        this.handleBeforeUnload = this.handleBeforeUnload.bind(this);

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
            setThinking: (thinking) => this.setState({ thinking }),
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

        this.promotionHandler = new PromotionHandler({
            setState: (state, callback) => this.setState(state, callback),
            getArcaneChess: () => this.arcaneChess(),
            getPlayerColor: () => this.state.playerColor,
        });
    }

    getFen = (LS: any) => {
        const node = booksMap[`book${LS.chapter}`][LS.nodeId];
        const panel = node.panels['panel-1'];
        // Basic implementation matching campaign view logic
        return panel.fen;
    };

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

    handlePromotion = (piece: string) => this.promotionHandler.handlePromotion(piece);

    promotionSelectAsync(callback: (piece: number) => void): Promise<void> {
        return this.promotionHandler.promotionSelectAsyncWithState(callback, () => this.state);
    }

    handleModalClose = (pieceType: string) => this.promotionHandler.handleModalClose(pieceType);

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

    handleBeforeUnload(event: BeforeUnloadEvent) {
        // Prevent the default behavior and trigger the confirmation dialog
        event.preventDefault();
        // Chrome requires returnValue to be set
        event.returnValue = 'Are you sure you want to leave?';
        // Legacy support
        return 'Are you sure you want to leave?';
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
        window.addEventListener('beforeunload', this.handleBeforeUnload);
        const LS = getLocalStorage(this.props.auth.user.username);
        const node = booksMap[`book${LS.chapter}`][LS.nodeId];
        this.setState(
            {
                whiteFaction: 'normal',
                blackFaction: 'normal',
                engineAvatar: node.opponent || 'normal',
                dialogueList: node.diagWinLose,
                whiteArcana:
                    this.state.playerColor === 'white'
                        ? LS.arcana
                        : node.panels['panel-1'].whiteArcane || {},
                blackArcana:
                    this.state.playerColor === 'black'
                        ? LS.arcana
                        : node.panels['panel-1'].blackArcane || {},
                royalties: node.panels['panel-1'].royalties || {},
                preset: node.panels['panel-1'].preset || '',
                theme: node.theme || 'normal',
            },
            () => {
                this.arcaneChess().init();
                this.arcaneChess().startGame(
                    this.state.fen,
                    this.state.whiteArcana,
                    this.state.blackArcana,
                    this.state.royalties,
                    this.state.preset
                );
                if (this.state.engineColor === this.state.turn) {
                    this.engineGo();
                }
            }
        );
        if (!this.hasMounted) this.hasMounted = true;
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('contextmenu', this.handleContextMenu);
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        clearArcanaConfig();
    }

    handleArcanaClick = (key: string) => this.spellHandler.handleArcanaClick(key);

    isArcaneActive = (key: string, color?: string) =>
        this.spellHandler.isArcaneActive(key, color);

    render() {
        const gameBoardTurn = GameBoard.side === 0 ? 'white' : 'black';
        const LS = getLocalStorage(this.props.auth.user.username);
        const sortedHistory = _.chunk(this.state.history, 2);
        const trojanActive = this.arcaneChess().getIfTrojanGambitExists(
            this.state.engineColor
        );
        const node = booksMap[`book${LS.chapter}`][LS.nodeId];

        return (
            <div className="mission-view-tactorius-board fade">
                <div
                    style={{
                        position: 'absolute',
                        height: '100vh',
                        width: '100vw',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundImage: `url(/assets/images/backgrounds/${this.state.theme}.webp)`,
                    }}
                >
                    <TactoriusModal
                        isOpen={this.state.gameOver}
                        handleClose={() => this.props.navigate('/campaign')}
                        message={this.state.gameOverType}
                        score={LS.nodeScores[this.state.nodeId]}
                        type={
                            this.state.gameOverType.split(' ')[1] === 'mates' &&
                                this.state.playerColor === this.state.gameOverType.split(' ')[0]
                                ? 'victory'
                                : 'defeat'
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
                                audioManager.playSFX('defeat');
                                this.setState({
                                    gameOver: true,
                                    gameOverType: `${this.state.playerColor} resigns`,
                                });
                            }}
                            avatar={this.state.engineAvatar}
                        />
                        <div className="time-board-time">
                            <div className="board-view tactorius-default-board">
                                <BoardUX
                                    forwardedRef={this.chessgroundRef}
                                    game={this.arcaneChess()}
                                    gameState={{
                                        fen: this.state.fen,
                                        turnColor: gameBoardTurn,
                                        orientation: this.state.playerColor,
                                        lastMove: this.state.lastMoveHistory[this.state.historyPly - 1],
                                        check: InCheck() ? true : false,
                                        royalties: this.state.royalties,
                                        whiteFaction:
                                            this.state.whiteFaction === 'tau'
                                                ? 'normal'
                                                : this.state.whiteFaction,
                                        blackFaction:
                                            this.state.blackFaction === 'tau'
                                                ? 'normal'
                                                : this.state.blackFaction,
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
                                    width="100%"
                                    height="100%"
                                />
                            </div>
                        </div>
                        <PlayerPanel
                            playerColor={this.state.playerColor}
                            engineColor={this.state.engineColor}
                            whiteFaction={this.state.whiteFaction}
                            blackFaction={this.state.blackFaction}
                            arcaneConfig={
                                this.state.playerColor === 'white'
                                    ? whiteArcaneConfig
                                    : blackArcaneConfig
                            }
                            history={this.state.history}
                            sortedHistory={sortedHistory}
                            navigateHistory={(type, targetIndex) => this.navigateHistory(type, targetIndex)}
                            thinking={this.state.thinking}
                            hoverArcane={this.state.hoverArcane}
                            dialogue={this.state.dialogue}
                            futureSightAvailable={this.state.futureSightAvailable}
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
                            trojanActive={trojanActive}
                            onSpellClick={this.handleArcanaClick}
                            onHover={this.toggleHover}
                            isArcaneActive={this.isArcaneActive}
                            onResign={() => {
                                audioManager.playSFX('defeat');
                                this.setState({
                                    gameOver: true,
                                    gameOverType: `${this.state.playerColor} resigns`,
                                });
                            }}
                            variantInfo={node.variant ? node.variant : ''}
                        />
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

export const MissionView = connect(
    mapStateToProps,
    {}
)(withRouter(UnwrappedMissionView));
