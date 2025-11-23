import React from 'react';
import { Chessground, IChessgroundApi } from 'src/features/game/board/chessgroundMod';
import {
    RtyChar,
    PceChar,
    prettyToSquare,
    PIECES,
    COLOURS,
} from 'src/features/game/engine/defs.mjs';
import {
    InCheck,
    PROMOTED,
    ARCANEFLAG,
    CAPTURED,
    MFLAGCNSM,
    MFLAGSHFT,
    GameBoard,
    outputFenOfCurrentPosition,
} from 'src/features/game/engine/board.mjs';
import { CheckAndSet, CheckResult } from 'src/features/game/engine/gui.mjs';
import { PrMove } from 'src/features/game/engine/io.mjs';
import { audioManager } from 'src/shared/utils/audio/AudioManager';
import _ from 'lodash';

interface BoardUXProps {
    game: any; // arcaneChess instance
    gameState: {
        fen: string;
        turnColor: string;
        orientation: string;
        lastMove: string[];
        check: boolean;
        royalties: any;
        whiteFaction: string;
        blackFaction: string;
        whiteVisible?: boolean;
        blackVisible?: boolean;
    };
    interactionState: {
        placingPiece: number;
        placingRoyalty: number;
        swapType: string;
        offeringType: string;
        isTeleport: boolean;
        thinking: boolean;
        playerColor: string;
        placingPromotion?: number;
        isDyadMove?: boolean;
    };
    onGameStateChange: (newState: any) => void;
    onGameOver: (result: any) => void;
    onPromotionRequest: (callback: (promotedPiece: number) => void) => void;
    onMove: (parsed: number, orig: string, dest: string) => void;
    width?: string | number;
    height?: string | number;
    viewOnly?: boolean;
    theme?: string;
    forwardedRef?: React.Ref<IChessgroundApi>;
}

export const BoardUX: React.FC<BoardUXProps> = ({
    game,
    gameState,
    interactionState,
    onGameStateChange,
    onPromotionRequest,
    onMove,
    width = '100%',
    height = '100%',
    viewOnly = false,
    // theme,
    forwardedRef,
}) => {
    const handleMove = (orig: string, dest: string) => {
        const swapOrTeleport = interactionState.isTeleport
            ? 'TELEPORT'
            : interactionState.swapType;

        // @ts-ignore
        forwardedRef?.current?.setAutoShapes([]);

        const { parsed, isInitPromotion = false } = game.makeUserMove(
            orig,
            dest,
            interactionState.placingPromotion,
            swapOrTeleport,
            interactionState.placingRoyalty
        );

        if (interactionState.isDyadMove) {
            game.generatePlayableOptions();
            game.parseCurrentFen();
            const dests = game.getGroundMoves();
            if (dests.size === 0) {
                game.takeBackHalfDyad();
                game.deactivateDyad();
                onGameStateChange({
                    isDyadMove: false,
                    normalMovesOnly: false,
                });
                return;
            }
            audioManager.playSFX('fire');
            onGameStateChange({
                history: [...(gameState as any).history || [], [PrMove(parsed)]], // Note: history needs to be passed in gameState or handled differently if not present
                fen: outputFenOfCurrentPosition(),
                fenHistory: [
                    ...(gameState as any).fenHistory || [],
                    outputFenOfCurrentPosition(),
                ],
                lastMoveHistory: [
                    ...(gameState as any).lastMoveHistory || [],
                    [orig, dest],
                ],
            });
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
            onPromotionRequest((promotedPiece: number) => {
                const { parsed } = game.makeUserMove(
                    orig,
                    dest,
                    promotedPiece,
                    swapOrTeleport,
                    interactionState.placingRoyalty
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
                if (interactionState.isDyadMove) {
                    onGameStateChange({
                        isDyadMove: false,
                        normalMovesOnly: true,
                    });
                } else {
                    onMove(parsed, orig, dest);
                }
            });
        } else {
            if (!PrMove(parsed)) {
                console.log('invalid move');
            }
            if (interactionState.isDyadMove) {
                onGameStateChange({
                    isDyadMove: false,
                    normalMovesOnly: true,
                });
            } else {
                onMove(parsed, orig, dest);
            }
        }
        onGameStateChange({
            futureSightAvailable: true,
        });
    };



    const handleDropNewPiece = (piece: string, key: string) => {
        // @ts-ignore
        forwardedRef?.current?.setAutoShapes([]);
        if (GameBoard.pieces[prettyToSquare(key)] === PIECES.EMPTY) {
            const { parsed } = game.makeUserMove(
                null,
                key,
                interactionState.placingPiece,
                '',
                interactionState.placingRoyalty
            );
            if (interactionState.placingPiece > 0) {
                audioManager.playSFX('fire');
            }
            if (interactionState.placingRoyalty > 0) {
                audioManager.playSFX('freeze');
            }
            if (!PrMove(parsed)) {
                console.log('invalid move', PrMove(parsed), piece);
            }

            onMove(parsed, 'a0', key); // Using 'a0' as placeholder for drop origin
        }
        if (interactionState.placingRoyalty !== 0) {
            onGameStateChange({
                royalties: {
                    ...gameState.royalties,
                    ...game.getPrettyRoyalties(),
                },
                placingRoyalty: 0,
            });
        }
    };

    const handleSelect = (key: string) => {
        let char = RtyChar.split('')[interactionState.placingRoyalty];
        const whiteLimit = 100 - 10 * (8 - GameBoard.summonRankLimits[0]);
        const blackLimit = 20 + 10 * (8 - GameBoard.summonRankLimits[1]);

        if (char === 'Y' || char === 'Z') {
            char = 'E';
        }

        if (interactionState.placingRoyalty > 0) {
            // @ts-ignore
            forwardedRef?.current?.setAutoShapes([]);
            if (
                ((GameBoard.side === COLOURS.WHITE &&
                    prettyToSquare(key) < whiteLimit) ||
                    (GameBoard.side === COLOURS.BLACK &&
                        prettyToSquare(key) > blackLimit)) &&
                GameBoard.pieces[prettyToSquare(key)] !== PIECES.EMPTY
            ) {
                if (
                    (gameState.royalties?.royaltyQ?.[key] ?? 0) > 0 ||
                    (gameState.royalties?.royaltyT?.[key] ?? 0) > 0 ||
                    (gameState.royalties?.royaltyM?.[key] ?? 0) > 0 ||
                    (gameState.royalties?.royaltyV?.[key] ?? 0) > 0 ||
                    (gameState.royalties?.royaltyE?.[key] ?? 0) > 0 ||
                    (gameState.royalties?.royaltyF?.[key] ?? 0) > 0
                ) {
                    onGameStateChange({
                        placingRoyalty: interactionState.placingRoyalty,
                    });
                    return;
                } else {
                    const { parsed } = game.makeUserMove(
                        null,
                        key,
                        interactionState.placingPiece,
                        '',
                        interactionState.placingRoyalty
                    );
                    audioManager.playSFX('freeze');
                    if (parsed === 0) {
                        console.log('parsed === 0');
                    }

                    onGameStateChange({
                        royalties: {
                            ...gameState.royalties,
                            ...game.getPrettyRoyalties(),
                        },
                    });

                    onMove(parsed, 'a0', key);
                }
            } else {
                onGameStateChange({
                    placingRoyalty: interactionState.placingRoyalty,
                });
            }
        } else if (interactionState.offeringType !== '') {
            const dests = game.getOfferingMoves(interactionState.offeringType);
            if (
                dests.has(`o${interactionState.offeringType}@`) &&
                dests.get(`o${interactionState.offeringType}@`).includes(key)
            ) {
                // @ts-ignore
                forwardedRef?.current?.setAutoShapes([]);
                const { parsed } = game.makeUserMove(
                    key,
                    null,
                    interactionState.placingPiece,
                    '',
                    interactionState.offeringType
                );
                audioManager.playSFX('spell');
                if (parsed === 0) {
                    console.log('parsed === 0');
                }

                onGameStateChange({
                    royalties: {
                        ...gameState.royalties,
                        ...game.getPrettyRoyalties(),
                    },
                });

                onMove(parsed, key, 'a0');
            } else {
                onGameStateChange({
                    offeringType: interactionState.offeringType,
                });
            }
        }
    };

    const getDests = () => {
        if (interactionState.thinking) return;
        let dests;
        if (interactionState.placingPiece === 0) {
            if (interactionState.placingRoyalty === 0) {
                if (interactionState.swapType === '') {
                    if (interactionState.offeringType === '') {
                        if (interactionState.isTeleport) {
                            dests = game.getGroundMoves('TELEPORT');
                        } else {
                            dests = game.getGroundMoves();
                        }
                    } else {
                        dests = game.getOfferingMoves(interactionState.offeringType);
                    }
                } else {
                    dests = game.getSwapMoves(interactionState.swapType);
                }
            } else {
                dests = game.getSummonMoves(interactionState.placingRoyalty);
            }
        } else {
            dests = game.getSummonMoves(interactionState.placingPiece);
        }
        return dests;
    };

    const getSelected = () => {
        return interactionState.placingPiece !== 0
            ? {
                role: `${PceChar.split('')[
                    interactionState.placingPiece
                ].toLowerCase()}-piece`,
                color: interactionState.playerColor,
            }
            : interactionState.placingRoyalty !== 0
                ? {
                    role: `r${RtyChar.split('')[
                        interactionState.placingRoyalty
                    ].toLowerCase()}-piece`,
                    color: interactionState.playerColor,
                }
                : interactionState.offeringType !== ''
                    ? {
                        role: `o${interactionState.offeringType.toLowerCase()}-piece`,
                        color: interactionState.playerColor,
                    }
                    : null;
    };

    return (
        <Chessground
            forwardedRef={forwardedRef}
            fen={gameState.fen}
            resizable={true}
            wFaction={gameState.whiteFaction}
            bFaction={gameState.blackFaction}
            royalties={gameState.royalties}
            wVisible={gameState.whiteVisible}
            bVisible={gameState.blackVisible}
            premovable={{
                enabled: false,
            }}
            width={width}
            height={height}
            check={gameState.check}
            animation={{
                enabled: true,
                duration: 200,
            }}
            highlight={{
                lastMove: true,
                check: true,
                royalties: true,
            }}
            lastMove={gameState.lastMove}
            orientation={gameState.orientation}
            disableContextMenu={false}
            turnColor={gameState.turnColor}
            movable={{
                free: false,
                rookCastle: false,
                color: viewOnly ? 'none' : 'both',
                dests: getDests(),
                events: {},
            }}
            selectable={{
                enabled: true,
                selected: getSelected(),
                fromPocket: false,
            }}
            events={{
                change: () => { },
                dropNewPiece: handleDropNewPiece,
                move: handleMove,
                select: handleSelect,
            }}
        />
    );
};
