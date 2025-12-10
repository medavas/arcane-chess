import React from 'react';
import {
  Chessground,
  IChessgroundApi,
} from 'src/features/game/board/chessgroundMod';
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
import { PrMove } from 'src/features/game/engine/io.mjs';
import { audioManager } from 'src/shared/utils/audio/AudioManager';
import {
  whiteArcaneConfig,
  blackArcaneConfig,
} from 'src/features/game/engine/arcaneDefs.mjs';

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
  // Apply 'can-shift' class to pieces with shift abilities
  React.useEffect(() => {
    const applyShiftClasses = () => {
      const pieceElements = document.querySelectorAll('.cg-wrap piece');

      pieceElements.forEach((pieceEl) => {
        const classList = pieceEl.className;
        const isWhitePiece = classList.includes('white');
        const isBlackPiece = classList.includes('black');
        const isHPiece = classList.includes('h-piece');

        // Determine which config to use based on piece color
        const pieceConfig = isWhitePiece
          ? whiteArcaneConfig
          : isBlackPiece
          ? blackArcaneConfig
          : null;

        // Check if this H-piece has Hemlock token and add class
        if (isHPiece && pieceConfig) {
          const hasHemlockToken = ((pieceConfig as any)['toknHEM'] || 0) > 0;
          if (hasHemlockToken) {
            pieceEl.classList.add('is-hemlock');
          } else {
            pieceEl.classList.remove('is-hemlock');
          }
        }

        let canShift = false;
        let forceRed = false; // For spells that always make donut red
        let blockRed = false; // For spells that never turn red even with sword

        if (pieceConfig) {
          // Check for standard shift spells
          const pieceHasShftP = ((pieceConfig as any)['shftP'] || 0) > 0;
          const pieceHasShftN = ((pieceConfig as any)['shftN'] || 0) > 0;
          const pieceHasShftB = ((pieceConfig as any)['shftB'] || 0) > 0;
          const pieceHasShftR = ((pieceConfig as any)['shftR'] || 0) > 0;
          const pieceHasShftG = ((pieceConfig as any)['shftG'] || 0) > 0;
          const pieceHasShftK = ((pieceConfig as any)['shftK'] || 0) > 0;
          const pieceHasShftI = ((pieceConfig as any)['shftI'] || 0) > 0;
          const pieceHasShftA = ((pieceConfig as any)['shftA'] || 0) > 0;

          // Check for modifier spells
          const hasModsBAN = ((pieceConfig as any)['modsBAN'] || 0) > 0; // Banshee - Spectre only, white donut
          const hasModsREA = ((pieceConfig as any)['modsREA'] || 0) > 0; // Iron Reach - Wraith & Valkyrie, always red
          const hasModsSUR = ((pieceConfig as any)['modsSUR'] || 0) > 0; // Pawn Surge - pawns only, always red
          const hasModsAET = ((pieceConfig as any)['modsAET'] || 0) > 0; // Aetherstep - pawns only

          // Piece type checks
          const isPawn = classList.includes('p-piece');
          const isKnight =
            classList.includes('n-piece') ||
            classList.includes('z-piece') ||
            classList.includes('u-piece');
          const isBishop = classList.includes('b-piece');
          const isRook = classList.includes('r-piece');
          const isSpectre = classList.includes('s-piece');
          const isWraith = classList.includes('w-piece');
          const isKing = classList.includes('k-piece');
          const isValkyrie = classList.includes('v-piece');

          // Check if piece can shift based on standard shift spells
          // Note: Eclipse (shftI) doesn't work for pawns, so it's excluded
          if (isPawn && (pieceHasShftP || pieceHasShftA)) {
            canShift = true;
          } else if (
            isKnight &&
            (pieceHasShftN || pieceHasShftI || pieceHasShftA)
          ) {
            canShift = true;
          } else if (
            isBishop &&
            (pieceHasShftB || pieceHasShftI || pieceHasShftA)
          ) {
            canShift = true;
          } else if (
            isRook &&
            (pieceHasShftR || pieceHasShftI || pieceHasShftA)
          ) {
            canShift = true;
          } else if (
            (isSpectre || isWraith) &&
            (pieceHasShftG || pieceHasShftI || pieceHasShftA)
          ) {
            // For shftI and shftA, always show (they work universally)
            if (pieceHasShftI || pieceHasShftA) {
              canShift = true;
            } else if (pieceHasShftG) {
              // For shftG specifically, check if shift moves are available
              const transform = (pieceEl as HTMLElement).style.transform;
              const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);

              if (match) {
                const xStr = match[1].replace('px', '').trim();
                const yStr = match[2].replace('px', '').trim();
                const xPx = parseFloat(xStr);
                const yPx = parseFloat(yStr);

                const boardEl = (pieceEl as HTMLElement).closest('cg-board');
                if (boardEl) {
                  const boardWidth = boardEl.clientWidth;
                  const squareSize = boardWidth / 8;
                  const file = Math.round(xPx / squareSize);
                  const visualRank = Math.round(yPx / squareSize);
                  const boardRank = 8 - visualRank;
                  const sq = 21 + (boardRank - 1) * 10 + file;

                  // Define shift directions for Spectre and Wraith
                  // SpDir = [-21, -19, -12, -10, -8, -1, 1, 8, 10, 12, 19, 21]
                  // WrDir = [-22, -20, -18, -11, -9, -2, 2, 9, 11, 18, 20, 22]
                  const shiftDirs = isSpectre
                    ? [-21, -19, -12, -10, -8, -1, 1, 8, 10, 12, 19, 21]
                    : [-22, -20, -18, -11, -9, -2, 2, 9, 11, 18, 20, 22];

                  let hasShiftMove = false;
                  for (const dir of shiftDirs) {
                    const targetSq = sq + dir;
                    // Check if square is on board
                    if (targetSq >= 21 && targetSq <= 98) {
                      const targetFile = (targetSq - 21) % 10;
                      const targetRank = Math.floor((targetSq - 21) / 10);
                      if (
                        targetFile >= 0 &&
                        targetFile <= 7 &&
                        targetRank >= 0 &&
                        targetRank <= 7
                      ) {
                        const targetPiece = GameBoard.pieces[targetSq];
                        // Check if square is empty or contains enemy
                        if (
                          targetPiece === PIECES.EMPTY ||
                          (isWhitePiece &&
                            targetPiece >= 7 &&
                            targetPiece <= 30) ||
                          (isBlackPiece &&
                            ((targetPiece >= 1 && targetPiece <= 6) ||
                              (targetPiece >= 13 && targetPiece <= 28)))
                        ) {
                          hasShiftMove = true;
                          break;
                        }
                      }
                    }
                  }

                  if (hasShiftMove) {
                    canShift = true;
                  }
                }
              }
            }
          } else if (isKing && (pieceHasShftK || pieceHasShftA)) {
            // Note: Eclipse (shftI) doesn't work for kings, so it's excluded
            canShift = true;
          } else if (!isPawn && !isKing && (pieceHasShftI || pieceHasShftA)) {
            // Eclipse (shftI) and shftA work for all non-pawn, non-king pieces
            // For shftI specifically, only show if Eclipse moves are available
            if (pieceHasShftA) {
              canShift = true;
            } else if (pieceHasShftI) {
              // Check if Eclipse moves are actually available
              const transform = (pieceEl as HTMLElement).style.transform;
              const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);

              if (match) {
                const xStr = match[1].replace('px', '').trim();
                const yStr = match[2].replace('px', '').trim();
                const xPx = parseFloat(xStr);
                const yPx = parseFloat(yStr);

                const boardEl = (pieceEl as HTMLElement).closest('cg-board');
                if (boardEl) {
                  const boardWidth = boardEl.clientWidth;
                  const squareSize = boardWidth / 8;
                  const file = Math.round(xPx / squareSize);
                  const visualRank = Math.round(yPx / squareSize);
                  const boardRank = 8 - visualRank;
                  const sq = 21 + (boardRank - 1) * 10 + file;

                  // Check for adjacent hop-over Eclipse moves (orthogonal/diagonal)
                  const KiDir = [-11, -10, -9, -1, 1, 9, 10, 11];

                  // Check if this piece type should skip adjacent hops
                  // (Unicorn/Zebra/Wraith/Exile have overlapping natural movement)
                  const skipAdjacentHops =
                    classList.includes('u-piece') ||
                    classList.includes('z-piece') ||
                    classList.includes('w-piece') ||
                    classList.includes('x-piece');

                  let hasEclipseMove = false;

                  // Check adjacent hop-over moves (unless restricted)
                  if (!skipAdjacentHops) {
                    for (const dir of KiDir) {
                      const adj = sq + dir;
                      if (adj < 21 || adj > 98) continue;
                      const adjFile = (adj - 21) % 10;
                      const adjRank = Math.floor((adj - 21) / 10);
                      if (
                        adjFile < 0 ||
                        adjFile > 7 ||
                        adjRank < 0 ||
                        adjRank > 7
                      )
                        continue;

                      // Need a piece to hop over
                      if (GameBoard.pieces[adj] === PIECES.EMPTY) continue;

                      const land = adj + dir;
                      if (land < 21 || land > 98) continue;
                      const landFile = (land - 21) % 10;
                      const landRank = Math.floor((land - 21) / 10);
                      if (
                        landFile < 0 ||
                        landFile > 7 ||
                        landRank < 0 ||
                        landRank > 7
                      )
                        continue;

                      // Landing square must be empty
                      if (GameBoard.pieces[land] === PIECES.EMPTY) {
                        hasEclipseMove = true;
                        break;
                      }
                    }
                  }

                  // Check cross-board (edge-wrap) Eclipse moves
                  if (!hasEclipseMove) {
                    const sqFile = (sq - 21) % 10;
                    if (sqFile === 0 || sqFile === 7) {
                      const edgeOffsets =
                        sqFile === 0 ? [17, 7, -3] : [3, -7, -17];
                      for (const off of edgeOffsets) {
                        const dest = sq + off;
                        if (dest < 21 || dest > 98) continue;
                        const destFile = (dest - 21) % 10;
                        const destRank = Math.floor((dest - 21) / 10);
                        if (
                          destFile < 0 ||
                          destFile > 7 ||
                          destRank < 0 ||
                          destRank > 7
                        )
                          continue;

                        if (GameBoard.pieces[dest] === PIECES.EMPTY) {
                          hasEclipseMove = true;
                          break;
                        }
                      }
                    }
                  }

                  if (hasEclipseMove) {
                    canShift = true;
                  }
                }
              }
            }
          }

          // Check for modifier spell effects
          // modsBAN: Spectre only, white donut (blockRed)
          if (hasModsBAN && isSpectre) {
            canShift = true;
            blockRed = true;
          }

          // modsSUR: only pawns can shift, always red
          // Only show if pawn can actually make a surge move
          if (hasModsSUR && isPawn) {
            // Get square position from piece element
            const transform = (pieceEl as HTMLElement).style.transform;
            const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);

            if (match) {
              const xStr = match[1].replace('px', '').trim();
              const yStr = match[2].replace('px', '').trim();
              const xPx = parseFloat(xStr);
              const yPx = parseFloat(yStr);

              const boardEl = (pieceEl as HTMLElement).closest('cg-board');
              if (boardEl) {
                const boardWidth = boardEl.clientWidth;
                const squareSize = boardWidth / 8;
                const file = Math.round(xPx / squareSize);
                const visualRank = Math.round(yPx / squareSize);
                const boardRank = 8 - visualRank;
                const sq = 21 + (boardRank - 1) * 10 + file;

                if (isWhitePiece) {
                  // White pawn - check if surge is possible (two squares forward)
                  const oneAhead = GameBoard.pieces[sq + 10];
                  const twoAhead = GameBoard.pieces[sq + 20];

                  // Show donut if both squares are empty (can surge)
                  // OR if there's a blocking piece and player has aetherstep (can jump)
                  if (
                    (oneAhead === PIECES.EMPTY && twoAhead === PIECES.EMPTY) ||
                    (oneAhead !== PIECES.EMPTY && hasModsAET)
                  ) {
                    canShift = true;
                    forceRed = true;
                  }
                } else if (isBlackPiece) {
                  // Black pawn - check if surge is possible
                  const oneAhead = GameBoard.pieces[sq - 10];
                  const twoAhead = GameBoard.pieces[sq - 20];

                  // Show donut if both squares are empty (can surge)
                  // OR if there's a blocking piece and player has aetherstep (can jump)
                  if (
                    (oneAhead === PIECES.EMPTY && twoAhead === PIECES.EMPTY) ||
                    (oneAhead !== PIECES.EMPTY && hasModsAET)
                  ) {
                    canShift = true;
                    forceRed = true;
                  }
                }
              }
            }
          }

          // modsREA: Wraith and Valkyrie, always red
          if (hasModsREA && (isWraith || isValkyrie)) {
            canShift = true;
            forceRed = true;
          }

          // modsAET: Aetherstep - only show for pawns on starting rank with blocking piece
          if (hasModsAET && isPawn) {
            // Get square position from piece element
            const transform = (pieceEl as HTMLElement).style.transform;
            const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);

            if (match) {
              const xStr = match[1].replace('px', '').trim();
              const yStr = match[2].replace('px', '').trim();
              const xPx = parseFloat(xStr);
              const yPx = parseFloat(yStr);

              const boardEl = (pieceEl as HTMLElement).closest('cg-board');
              if (boardEl) {
                const boardWidth = boardEl.clientWidth;
                const squareSize = boardWidth / 8;
                const file = Math.round(xPx / squareSize);
                const visualRank = Math.round(yPx / squareSize);
                // Convert visual rank (0-7 from top) to board rank (1-8)
                // Visual 0 = Rank 8, Visual 7 = Rank 1
                const boardRank = 8 - visualRank;
                const sq = 21 + (boardRank - 1) * 10 + file;

                if (isWhitePiece && (boardRank === 2 || boardRank === 3)) {
                  // White pawns on board rank 2 or 3 (starting positions)
                  const blocking = GameBoard.pieces[sq + 10];
                  const destination = GameBoard.pieces[sq + 20];
                  if (
                    blocking !== PIECES.EMPTY &&
                    destination === PIECES.EMPTY
                  ) {
                    canShift = true;
                    blockRed = true; // Aetherstep is never red (5D sword doesn't apply)
                  }
                } else if (
                  isBlackPiece &&
                  (boardRank === 7 || boardRank === 6)
                ) {
                  // Black pawns on board rank 7 or 6 (starting positions)
                  const blocking = GameBoard.pieces[sq - 10];
                  const destination = GameBoard.pieces[sq - 20];
                  if (
                    blocking !== PIECES.EMPTY &&
                    destination === PIECES.EMPTY
                  ) {
                    canShift = true;
                    blockRed = true; // Aetherstep is never red (5D sword doesn't apply)
                  }
                } else if (pieceHasShftP || pieceHasShftA) {
                  // Pawn has moved but has shftP or shftA
                  canShift = true;
                }
              }
            }
          }
        }

        if (canShift) {
          pieceEl.classList.add('can-shift');

          // Determine if donut should be red
          if (forceRed) {
            // Always red for modsSUR (pawns) and modsREA (wraith/valkyrie)
            pieceEl.classList.add('has-sword');
          } else if (blockRed) {
            // Never red for modsBAN
            pieceEl.classList.remove('has-sword');
          } else if (pieceConfig) {
            // Standard behavior: red only if has 5th Dimension Sword (modsDIM)
            const hasSword = ((pieceConfig as any)['modsDIM'] || 0) > 0;
            if (hasSword) {
              pieceEl.classList.add('has-sword');
            } else {
              pieceEl.classList.remove('has-sword');
            }
          }
        } else {
          pieceEl.classList.remove('can-shift');
          pieceEl.classList.remove('has-sword');
        }
      });
    };

    // Run immediately to avoid flickering
    applyShiftClasses();

    // Also run after a short delay to catch any late-rendered pieces
    const timeoutId = setTimeout(applyShiftClasses, 10);
    return () => clearTimeout(timeoutId);
  }, [gameState.fen, whiteArcaneConfig, blackArcaneConfig]);

  const handleMove = (orig: string, dest: string) => {
    const swapOrTeleport = interactionState.isTeleport
      ? 'TELEPORT'
      : interactionState.swapType;

    if (forwardedRef && 'current' in forwardedRef && forwardedRef.current) {
      forwardedRef.current.setAutoShapes([]);
    }

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
        history: [...((gameState as any).history || []), PrMove(parsed)],
        fen: outputFenOfCurrentPosition(),
        fenHistory: [
          ...((gameState as any).fenHistory || []),
          outputFenOfCurrentPosition(),
        ],
        lastMoveHistory: [
          ...((gameState as any).lastMoveHistory || []),
          [orig, dest],
        ],
      });
    } else {
      if (PROMOTED(parsed) > 0 || parsed & MFLAGCNSM || parsed & MFLAGSHFT) {
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
        if ((CAPTURED(parsed) > 0 && ARCANEFLAG(parsed) === 0) || InCheck()) {
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
    if (forwardedRef && 'current' in forwardedRef && forwardedRef.current) {
      forwardedRef.current.setAutoShapes([]);
    }
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
      if (forwardedRef && 'current' in forwardedRef && forwardedRef.current) {
        forwardedRef.current.setAutoShapes([]);
      }

      // Get valid summon moves to check if this selection is allowed
      const validMoves = game.getSummonMoves(
        interactionState.placingRoyalty
      ) as Map<string, string[]>;
      const squareNum = prettyToSquare(key);
      let isValidSelection = false;

      // validMoves keys may come in different casings depending on engine.
      // Normalize by scanning keys case-insensitively and matching origins
      // that correspond to the royalty being placed.
      if (validMoves) {
        const originPrefix = `r${char.toLowerCase()}@`;
        for (const [fromKey, destinations] of Array.from(
          validMoves.entries()
        )) {
          if (fromKey.toLowerCase().startsWith(originPrefix)) {
            if (destinations && destinations.includes(key)) {
              isValidSelection = true;
              break;
            }
          }
        }
      }

      // Debug: if still not valid, log the available keys for inspection
      if (!isValidSelection && typeof console !== 'undefined') {
        try {
          const keys = validMoves ? Array.from(validMoves.keys()) : [];
          // eslint-disable-next-line no-console
          console.log(
            'Summon validMoves keys:',
            keys,
            'originPrefix:',
            `r${char.toLowerCase()}@`,
            'selectedKey:',
            key
          );
        } catch (e) {}
      }

      if (
        ((GameBoard.side === COLOURS.WHITE && squareNum < whiteLimit) ||
          (GameBoard.side === COLOURS.BLACK && squareNum > blackLimit)) &&
        GameBoard.pieces[squareNum] !== PIECES.EMPTY &&
        isValidSelection
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
        if (forwardedRef && 'current' in forwardedRef && forwardedRef.current) {
          forwardedRef.current.setAutoShapes([]);
        }
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
        change: () => {},
        dropNewPiece: handleDropNewPiece,
        move: handleMove,
        select: handleSelect,
      }}
    />
  );
};
