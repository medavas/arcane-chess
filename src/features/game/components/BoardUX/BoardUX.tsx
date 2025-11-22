import React from 'react';
import { Chessground, IChessgroundApi } from 'src/features/game/board/chessgroundMod';
import {
    RtyChar,
    PceChar,
} from 'src/features/game/engine/defs.mjs';

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
    };
    onMove: (orig: string, dest: string) => void;
    onDropNewPiece: (piece: string, key: string) => void;
    onSelect: (key: string) => void;
    onChange?: () => void;
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
    onMove,
    onDropNewPiece,
    onSelect,
    onChange,
    width = '100%',
    height = '100%',
    viewOnly = false,
    // theme,
    forwardedRef,
}) => {
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
                change: onChange || (() => { }),
                dropNewPiece: onDropNewPiece,
                move: onMove,
                select: onSelect,
            }}
        />
    );
};
