import book1 from './books/book1.json';
import book2 from './books/book2.json';
import book3 from './books/book3.json';
import book4 from './books/book4.json';
import book5 from './books/book5.json';
import book6 from './books/book6.json';
import book7 from './books/book7.json';
import book8 from './books/book8.json';
import book9 from './books/book9.json';
import book10 from './books/book10.json';
import book11 from './books/book11.json';
import book12 from './books/book12.json';

export interface Node {
    id: string;
    title: string;
    time: number[][];
    nodeText: string;
    reward: (number | string)[];
    diagWinLose: {
        win1: string;
        win2: string;
        win3: string;
        victory: string;
        lose1: string;
        lose2: string;
        lose3: string;
        defeat: string;
    };
    prereq: string;
    opponent: string;
    hero: string;
    boss: boolean;
    theme: string;
    variant?: string;
    faction?: string;
    avatar?: string;
    dialogue?: Record<string, string>;
    arcana?: Record<string, any>;
    royalties?: Record<string, any>;
    preset?: string;
    panels: {
        [key: string]: {
            fen: string;
            fenHistory: string[];
            history: string[];
            panelText: string;
            arrowsCircles?: {
                orig: string;
                brush: string;
                dest?: string | undefined;
            }[];
            royalties: {
                [key: string]: { [key: string]: number };
            };
            preset: string;
            whiteArcane?: { [key: string]: number | string };
            blackArcane?: { [key: string]: number | string };
            config: {
                [key: string]: boolean | string | number;
            };
            correctMoves?: string[];
            orientation: string;
            turn?: string;
        };
    };
}

export const booksMap: { [key: string]: { [key: string]: Node } } = {
    book1: book1 as unknown as { [key: string]: Node },
    book2: book2 as unknown as { [key: string]: Node },
    book3: book3 as unknown as { [key: string]: Node },
    book4: book4 as unknown as { [key: string]: Node },
    book5: book5 as unknown as { [key: string]: Node },
    book6: book6 as unknown as { [key: string]: Node },
    book7: book7 as unknown as { [key: string]: Node },
    book8: book8 as unknown as { [key: string]: Node },
    book9: book9 as unknown as { [key: string]: Node },
    book10: book10 as unknown as { [key: string]: Node },
    book11: book11 as unknown as { [key: string]: Node },
    book12: book12 as unknown as { [key: string]: Node },
};
