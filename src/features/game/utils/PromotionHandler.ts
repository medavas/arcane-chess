import { PIECES } from 'src/features/game/engine/defs.mjs';

export interface PromotionHandlerCallbacks {
    setState: (state: any, callback?: () => void) => void;
    getArcaneChess: () => any;
    getPlayerColor: () => string;
}

export class PromotionHandler {
    private callbacks: PromotionHandlerCallbacks;
    private intervalId: NodeJS.Timeout | null = null;

    constructor(callbacks: PromotionHandlerCallbacks) {
        this.callbacks = callbacks;
    }

    handlePromotion = (piece: string) => {
        const playerColor = this.callbacks.getPlayerColor();
        this.callbacks.setState((prevState: any) => ({
            ...prevState,
            placingPromotion:
                PIECES[`${playerColor === 'white' ? 'w' : 'b'}${piece}` as keyof typeof PIECES],
        }));
    };

    promotionSelectAsync(callback: (piece: number) => void): Promise<void> {
        return new Promise((resolve) => {
            const arcaneChess = this.callbacks.getArcaneChess();
            const playerColor = this.callbacks.getPlayerColor();

            if (arcaneChess.hasDivineReckoning()) {
                // Auto-promote to Valkyrie when Divine Reckoning is active
                const valkyriePiece = `${playerColor === 'white' ? 'w' : 'b'}V` as keyof typeof PIECES;
                this.callbacks.setState({ placingPromotion: PIECES[valkyriePiece] }, () => {
                    // We need to access the state to get the value we just set, 
                    // or just use the value directly since we know it.
                    // However, the original code used this.state.placingPromotion.
                    // For safety, we pass the value we just calculated.
                    callback(PIECES[valkyriePiece]);
                    resolve();
                });
            } else {
                this.callbacks.setState({ promotionModalOpen: true });
                // We need to poll for the selection, similar to the original code
                // This relies on the component updating the state via handlePromotion
                // which is triggered by the modal.
                // But wait, the modal needs to call handlePromotion on THIS handler?
                // Or the component's wrapper method?
                // The component will pass `this.promotionHandler.handlePromotion` to the modal.

                // We need a way to check the state of the COMPONENT.
                // The handler doesn't have direct access to read the component state unless we pass a getter.
                // But we can just use a local variable if we want, but the modal interacts with the component state.
                // Actually, the original code checks `this.state.placingPromotion`.
                // So we need a `getState` callback.

                // Let's assume the component will update its state using the setState callback we provided.
                // We need a way to READ that state.
                // I'll add a getState callback to the interface.
            }
        });
    }

    // Revised to include getState for polling
    promotionSelectAsyncWithState(
        callback: (piece: number) => void,
        getState: () => any
    ): Promise<void> {
        return new Promise((resolve) => {
            const arcaneChess = this.callbacks.getArcaneChess();
            const playerColor = this.callbacks.getPlayerColor();

            if (arcaneChess.hasDivineReckoning()) {
                const valkyriePiece = `${playerColor === 'white' ? 'w' : 'b'}V` as keyof typeof PIECES;
                this.callbacks.setState({ placingPromotion: PIECES[valkyriePiece] }, () => {
                    callback(PIECES[valkyriePiece]);
                    resolve();
                });
            } else {
                this.callbacks.setState({ promotionModalOpen: true });
                this.intervalId = setInterval(() => {
                    const currentState = getState();
                    if (currentState.placingPromotion) {
                        clearInterval(this.intervalId!);
                        this.intervalId = null;
                        callback(currentState.placingPromotion);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    handleModalClose = (pieceType: string) => {
        const playerColor = this.callbacks.getPlayerColor();
        this.callbacks.setState({
            placingPromotion:
                PIECES[`${playerColor === 'white' ? 'w' : 'b'}${pieceType}` as keyof typeof PIECES],
            gameOver: false,
            promotionModalOpen: false,
        });
    };
}
