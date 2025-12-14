import { audioManager } from 'src/shared/utils/audio/AudioManager';
import { PIECES, ARCANE_BIT_VALUES } from 'src/features/game/engine/defs.mjs';
import {
  GameBoard,
  outputFenOfCurrentPosition,
} from 'src/features/game/engine/board.mjs';
import arcanaJson from 'src/shared/data/arcana.json';

const pieces = PIECES;
const royalties = ARCANE_BIT_VALUES;

export interface SpellState {
  placingPiece: number;
  swapType: string;
  // isTeleport: boolean;
  placingRoyalty: number;
  offeringType: string;
  isDyadMove: boolean;
  normalMovesOnly: boolean;
  hoverArcane: string;
  glitchQueued: boolean;
  isEvoActive: boolean;
}

export interface SpellHandlerCallbacks {
  getArcaneChess: () => any;
  getPlayerColor: () => string;
  getSelectedSide: () => string;
  getTurn: () => string;
  getEngineColor: () => string;
  getThinking: () => boolean;
  getFutureSightAvailable: () => boolean;
  getHistory: () => (string | string[])[];
  getHistoryPly: () => number;
  getFenHistory: () => string[];
  getLastMoveHistory: () => string[][];
  getDialogue: () => string[];
  getChessgroundRef: () => React.RefObject<any>;
  getSpellState: () => SpellState;
  updateSpellState: (updates: Partial<SpellState>) => void;
  updateHistory: (
    updates: {
      historyPly?: number;
      history?: (string | string[])[];
      fen?: string;
      fenHistory?: string[];
      lastMoveHistory?: string[][];
      futureSightAvailable?: boolean;
      turn?: string;
    },
    callback?: () => void
  ) => void;
  addDialogue: (message: string) => void;
  activateGlitch: () => void;
  setThinking: (thinking: boolean) => void;
  engineGo: () => void;
}

export class SpellHandler {
  private callbacks: SpellHandlerCallbacks;

  constructor(callbacks: SpellHandlerCallbacks) {
    this.callbacks = callbacks;
  }

  anySpellActive = (): boolean => {
    const state = this.callbacks.getSpellState();
    return (
      state.placingPiece > 0 ||
      state.swapType !== '' ||
      // state.isTeleport === true ||
      state.placingRoyalty > 0 ||
      state.offeringType !== '' ||
      state.isDyadMove === true
    );
  };

  deactivateAllSpells = (): void => {
    try {
      const arcane = this.callbacks.getArcaneChess();
      const state = this.callbacks.getSpellState();
      const dyadClock =
        typeof arcane.getDyadClock === 'function' ? arcane.getDyadClock() : 0;

      if (state.isDyadMove) {
        if (dyadClock === 1 && typeof arcane.takeBackHalfDyad === 'function') {
          arcane.takeBackHalfDyad();
        }
        if (typeof arcane.deactivateDyad === 'function') {
          arcane.deactivateDyad();
        }
      }

      if (state.isEvoActive) {
        if (typeof arcane.deactivateEvo === 'function') {
          arcane.deactivateEvo();
        }
      }
    } catch (e) {
      console.warn(e);
    }

    this.callbacks.getChessgroundRef().current?.setAutoShapes([]);

    this.callbacks.updateSpellState({
      placingPiece: 0,
      swapType: '',
      // isTeleport: false,
      placingRoyalty: 0,
      offeringType: '',
      isDyadMove: false,
      normalMovesOnly: false,
      hoverArcane: '',
      glitchQueued: false,
      isEvoActive: false,
    });
  };

  toggleHover = (arcane: string): void => {
    this.callbacks.updateSpellState({ hoverArcane: arcane });
  };

  handleArcanaClick = (key: string): void => {
    const playerColor = this.callbacks.getPlayerColor();
    const arcane = this.callbacks.getArcaneChess();

    // === SUMMONS ===
    if (key.startsWith('sumn')) {
      // Check BEFORE clearing state
      const state = this.callbacks.getSpellState();
      const dyadClock = arcane.getDyadClock();

      // Block summons during dyad
      if (dyadClock > 0 || state.isDyadMove) return;

      // Block summon spells when forced en passant is active
      if (arcane.isForcedEnPassantActive && arcane.isForcedEnPassantActive()) {
        return;
      }
    }

    this.callbacks.updateSpellState({
      placingPiece: 0,
      placingRoyalty: 0,
      swapType: '',
      offeringType: '',
      // isTeleport: false,
      isDyadMove: false,
    });

    const state = this.callbacks.getSpellState();

    // === SUMMONS ===
    if (key.startsWith('sumn')) {
      const suffix = key.slice(4);
      const side = this.callbacks.getSelectedSide() === 'white' ? 'w' : 'b';

      if (key.startsWith('sumnR') && suffix.length > 1) {
        const rKey = suffix.toUpperCase();
        const royaltyCode = (royalties as Record<string, number>)[rKey];
        // toggle off if already selected
        if (state.placingRoyalty === royaltyCode) {
          this.callbacks.updateSpellState({ placingRoyalty: 0 });
          return;
        }
        this.callbacks.updateSpellState({
          placingRoyalty: royaltyCode || 0,
        });
        return;
      }

      const unit = suffix.toUpperCase();
      const pieceCode = (PIECES as Record<string, number>)[`${side}${unit}`];
      // toggle off when clicking same summon badge again
      if (state.placingPiece === pieceCode) {
        this.callbacks.updateSpellState({ placingPiece: 0 });
        return;
      }

      this.callbacks.updateSpellState({
        placingPiece: pieceCode || 0,
      });
      return;
    }

    // === SWAP ===
    if (key.startsWith('swap')) {
      const dyadClock = arcane.getDyadClock();
      if (dyadClock > 0 || state.isDyadMove) return;
      this.callbacks.updateSpellState({
        swapType: state.swapType === '' ? key.split('swap')[1] : '',
      });
      return;
    }

    // === OFFER ===
    if (key.startsWith('offr')) {
      const dyadClock = arcane.getDyadClock();
      if (dyadClock > 0 || state.isDyadMove) return;
      this.callbacks.updateSpellState({
        offeringType: state.offeringType === '' ? key.split('offr')[1] : '',
      });
      return;
    }

    // === SPELL: Bulletproof ===
    if (key === 'modsSUS') {
      if (GameBoard.suspend > 0) return;
      audioManager.playSFX('freeze');
      arcane.useBulletproof(playerColor);
      this.callbacks.addDialogue(
        `${playerColor} used Bulletproof — No captures for 3 turns!`
      );
      return;
    }

    // === DYAD ===
    if (key.startsWith('dyad')) {
      // Block dyad if forced EP is active and Gluttony is not present
      // (Gluttony allows captures during dyad, which is needed for the forced EP capture)
      if (arcane.isForcedEnPassantActive && arcane.isForcedEnPassantActive()) {
        // Check if player has Gluttony (modsGLU bit 64 in arcane[4])
        const playerArcane =
          this.callbacks.getSelectedSide() === 'white'
            ? GameBoard.whiteArcane
            : GameBoard.blackArcane;
        const hasGluttony =
          playerArcane && playerArcane[4] && (playerArcane[4] & 64) !== 0;
        if (!hasGluttony) {
          return;
        }
      }

      const dyadClock = arcane.getDyadClock();
      const dyadName =
        typeof arcane.getDyadName === 'function' ? arcane.getDyadName() : '';
      const dyadOwner =
        typeof arcane.getDyadOwner === 'function'
          ? arcane.getDyadOwner()
          : undefined;
      // if clicking the same dyad badge that is already active for the selected side,
      // revert if halfway through (dyadClock === 1), otherwise deactivate
      if (dyadName === key && dyadOwner === this.callbacks.getSelectedSide()) {
        if (dyadClock === 1) {
          try {
            if (typeof arcane.takeBackHalfDyad === 'function') {
              arcane.takeBackHalfDyad();
            }
          } catch (e) {
            console.warn(e);
          }
          this.callbacks.updateSpellState({
            isDyadMove: true,
            normalMovesOnly: true,
          });
          this.callbacks.updateHistory({
            historyPly: this.callbacks.getHistoryPly() - 1,
            fen: outputFenOfCurrentPosition(),
            fenHistory: this.callbacks.getFenHistory().slice(0, -1),
            lastMoveHistory: this.callbacks.getLastMoveHistory().slice(0, -1),
          });
          return;
        }
        try {
          if (typeof arcane.deactivateDyad === 'function') {
            arcane.deactivateDyad();
          }
        } catch (e) {
          console.warn(e);
        }
        this.callbacks.updateSpellState({
          isDyadMove: false,
          normalMovesOnly: false,
        });
        return;
      }

      if (state.isDyadMove && dyadClock === 0) {
        arcane.deactivateDyad();
        this.callbacks.updateSpellState({
          isDyadMove: false,
          normalMovesOnly: false,
        });
      } else if (dyadClock === 1) {
        arcane.takeBackHalfDyad();
        this.callbacks.updateSpellState({
          isDyadMove: true,
          normalMovesOnly: true,
        });
        this.callbacks.updateHistory({
          historyPly: this.callbacks.getHistoryPly() - 1,
          fen: outputFenOfCurrentPosition(),
          fenHistory: this.callbacks.getFenHistory().slice(0, -1),
          lastMoveHistory: this.callbacks.getLastMoveHistory().slice(0, -1),
        });
      } else {
        arcane.activateDyad(key);
        arcane.parseCurrentFen();
        arcane.generatePlayableOptions();
        const dests = arcane.getGroundMoves();
        if (dests.size === 0) {
          arcane.deactivateDyad();
          this.callbacks.updateSpellState({
            isDyadMove: false,
            normalMovesOnly: false,
          });
        } else {
          this.callbacks.updateSpellState({
            isDyadMove: true,
            normalMovesOnly: true,
          });
        }
      }
      return;
    }

    // === FUTURE SIGHT ===
    if (key === 'modsFUT') {
      const futureSightAvailable = this.callbacks.getFutureSightAvailable();
      if (!futureSightAvailable) return;
      audioManager.playSFX('spell');
      arcane.takeBackMove(4, playerColor, this.callbacks.getHistory());
      this.callbacks.updateHistory({
        historyPly: this.callbacks.getHistoryPly() - 4,
        fen: outputFenOfCurrentPosition(),
        fenHistory: this.callbacks.getFenHistory().slice(0, -4),
        lastMoveHistory: this.callbacks.getLastMoveHistory().slice(0, -4),
        futureSightAvailable: false,
      });
      return;
    }

    // === TELEPORT ===
    // if (key === 'shftT') {
    //   this.callbacks.updateSpellState({ isTeleport: !state.isTeleport });
    //   return;
    // }

    // === GLITCH ===
    if (key === 'modsGLI') {
      const state = this.callbacks.getSpellState();
      // Toggle glitch queued state (like dyad/summon spells)
      this.callbacks.updateSpellState({
        glitchQueued: !state.glitchQueued,
      });
      return;
    }

    // === EVO ===
    if (key === 'modsEVO') {
      const state = this.callbacks.getSpellState();
      // Toggle evo active state (like glitch, will apply on next move)
      if (state.isEvoActive) {
        if (typeof arcane.deactivateEvo === 'function') {
          arcane.deactivateEvo();
        }
        this.callbacks.updateSpellState({
          isEvoActive: false,
        });
      } else {
        if (typeof arcane.activateEvo === 'function') {
          arcane.activateEvo();
        }
        this.callbacks.updateSpellState({
          isEvoActive: true,
        });
      }
      return;
    }

    // === SPELL: Flank Inversion ===
    if (key === 'modsFLA') {
      audioManager.playSFX('spell');
      arcane.swapFilePieces(playerColor);
      arcane.parseCurrentFen();
      arcane.generatePlayableOptions();
      this.callbacks.addDialogue(
        `${playerColor} used Flank Inversion — A and H files swapped!`
      );
      // Since GameBoard.side is toggled in swapFilePieces, just update historyPly
      this.callbacks.updateHistory(
        {
          historyPly: this.callbacks.getHistoryPly() + 1,
          history: [
            ...this.callbacks
              .getHistory()
              .slice(0, this.callbacks.getHistoryPly()),
            'FI',
          ],
          fen: outputFenOfCurrentPosition(),
          fenHistory: [
            ...this.callbacks.getFenHistory(),
            outputFenOfCurrentPosition(),
          ],
        } as any,
        () => {
          // Trigger engine move if it's the engine's turn
          if (this.callbacks.getEngineColor() === this.callbacks.getTurn()) {
            this.callbacks.engineGo();
          }
        }
      );
      return;
    }

    // === ENGINE HINT: Tactical Vision (From Square Only) ===
    if (key === 'modsIMP') {
      audioManager.playSFX('spell');
      this.callbacks.setThinking(true);
      arcane.engineSuggestion(playerColor, 1).then((hint: any) => {
        this.callbacks.setThinking(false);
        if (hint) {
          this.callbacks.addDialogue(
            `${playerColor} used Tactical Vision — ${hint}`
          );
        }
      });
      return;
    }

    // === ENGINE HINT: Oracle Whisper (From and To Square) ===
    if (key === 'modsORA') {
      audioManager.playSFX('spell');
      this.callbacks.setThinking(true);
      arcane.engineSuggestion(playerColor, 2).then((hint: any) => {
        this.callbacks.setThinking(false);
        if (hint) {
          this.callbacks.addDialogue(
            `${playerColor} used Oracle Whisper — ${hint}`
          );
        }
      });
      return;
    }

    // === ENGINE HINT: Temporal Pincer (Best Line) ===
    if (key === 'modsTEM') {
      audioManager.playSFX('spell');
      this.callbacks.setThinking(true);
      arcane.engineSuggestion(playerColor, 3).then((hint: any) => {
        this.callbacks.setThinking(false);
        if (hint) {
          this.callbacks.addDialogue(
            `${playerColor} used Temporal Pincer — ${hint}`
          );
        }
      });
      return;
    }
  };

  isArcaneActive = (key: string, color?: string): boolean => {
    const state = this.callbacks.getSpellState();
    // Only show active for badges that belong to the currently selected side
    if (
      typeof color !== 'undefined' &&
      color !== this.callbacks.getSelectedSide()
    )
      return false;

    // if (key === 'shftT') return state.isTeleport;

    if (key === 'modsGLI') {
      return state.glitchQueued;
    }

    if (key === 'modsEVO') {
      return state.isEvoActive;
    }

    if (key.includes('dyad')) {
      const arcane = this.callbacks.getArcaneChess();
      const dyadName =
        typeof arcane.getDyadName === 'function' ? arcane.getDyadName() : '';
      return state.isDyadMove && dyadName === key;
    }

    if (key.includes('swap')) {
      const type = key.split('swap')[1];
      return state.swapType === type;
    }

    if (key.includes('offr')) {
      const type = key.split('offr')[1];
      return state.offeringType === type;
    }

    if (!key.startsWith('sumn')) return false;

    if (key.includes('sumnR') && key !== 'sumnR') {
      const rKey = key.split('sumn')[1];
      const expected = (royalties as Record<string, number>)[rKey] ?? -1;
      return state.placingRoyalty === expected;
    }
    const id = key.slice(4);
    if (!id) return false;
    const pieceKey =
      id.toUpperCase() === 'X'
        ? `${this.callbacks.getSelectedSide() === 'white' ? 'w' : 'b'}X`
        : `${this.callbacks.getSelectedSide() === 'white' ? 'w' : 'b'}${id}`;

    const expectedPiece = (PIECES as Record<string, number>)[pieceKey] ?? -1;
    return state.placingPiece === expectedPiece;
  };
}
