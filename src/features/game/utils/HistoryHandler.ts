import { audioManager } from 'src/shared/utils/audio/AudioManager';

export interface HistoryHandlerCallbacks {
    setState: (state: any, callback?: () => void) => void;
    getState: () => {
        historyPly: number;
        fenHistory: string[];
    };
    anySpellActive: () => boolean;
    deactivateAllSpells: () => void;
}

export class HistoryHandler {
    private callbacks: HistoryHandlerCallbacks;

    constructor(callbacks: HistoryHandlerCallbacks) {
        this.callbacks = callbacks;
    }

    navigateHistory(type: string, targetIndex?: number) {
        this.callbacks.setState((prevState: any) => {
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
                if (this.callbacks.anySpellActive()) {
                    this.callbacks.deactivateAllSpells();
                }
                break;
            default:
                break;
        }
    }
}
