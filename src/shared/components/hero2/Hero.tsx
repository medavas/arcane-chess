import React from 'react';
import _ from 'lodash';

import './hero.scss';

import 'src/features/game/board/styles/normal.scss';
import 'src/features/game/board/styles/chi.scss';
import 'src/features/game/board/styles/psi.scss';
import 'src/features/game/board/styles/gamma.scss';
import 'src/features/game/board/styles/sigma.scss';
import 'src/features/game/board/styles/omega.scss';
import 'src/features/game/board/styles/lambda.scss';

import arcanaJson from 'src/shared/data/arcana.json';

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

const arcana: ArcanaMap = arcanaJson as ArcanaMap;

export interface HeroProps {
  rows?: number;
  columns?: number;
  variant?: 'default' | 'ghostSquares';
}

export default class Hero extends React.Component<HeroProps> {
  static defaultProps: Partial<HeroProps> = {
    rows: 50,
    columns: 50,
    variant: 'default',
  };

  constructor(props: HeroProps) {
    super(props);
    this.state = {};
  }

  // Helper to get a random integer between min and max, inclusive.
  getRandomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  // Returns the JSX for a random chess piece.
  getRandomPiece = () => {
    const colors = ['white', 'black'];
    const pieces = [
      'p-piece',
      's-piece',
      'h-piece',
      'n-piece',
      'b-piece',
      'r-piece',
      'q-piece',
      'k-piece',
      't-piece',
      'm-piece',
      'u-piece',
      'z-piece',
      'v-piece',
      'w-piece',
    ];
    const details = {
      piece: pieces[this.getRandomNumber(0, pieces.length - 1)],
      color: colors[this.getRandomNumber(0, colors.length - 1)],
      faction: 'normal',
    };

    return (
      <div
        className={`${details.piece} ${details.color} ${details.faction}`}
        style={{
          position: 'relative',
          width: details.piece === 'x-piece' ? '100px' : '40px',
          height: details.piece === 'x-piece' ? '100px' : '40px',
          transform: details.piece === 'x-piece' ? 'scale(.5)' : 'scale(1.5)',
          top: details.piece === 'x-piece' ? '-20px' : '9px',
          left: details.piece === 'x-piece' ? '-20px' : '9px',
        }}
      />
    );
  };

  // Returns the JSX for a random arcana.
  getRandomArcana = () => {
    const arcanaKeys = _.filter(
      Object.keys(arcana),
      (arcanaName) => arcanaName !== 'empty'
    );
    if (arcanaKeys.length === 0) return null;
    const randomIndex = this.getRandomNumber(0, arcanaKeys.length - 1);
    const randomArcana = arcana[arcanaKeys[randomIndex]];

    return (
      <div
        className="arcana-display"
        style={{
          backgroundImage: `url('/assets/arcanaImages${randomArcana.imagePath}.svg')`,
          justifySelf: 'center',
          alignSelf: 'center',
          width: '50px',
          height: '50px',
          padding: '5px',
          position: 'relative',
          margin: 'auto',
        }}
      ></div>
    );
  };

  /**
   * Decides what to display on a square.
   */
  getRandomDisplay = (
    arcanaChance: number = 0.1,
    pieceChance: number = 0.1
  ) => {
    const rand = Math.random();
    if (rand < arcanaChance) {
      return this.getRandomArcana();
    } else if (rand < arcanaChance + pieceChance) {
      return this.getRandomPiece();
    } else {
      return null;
    }
  };

  shouldComponentUpdate() {
    return false; // Prevent re-rendering
  }

  render() {
    const { rows, columns, variant } = this.props;
    // For ghostSquares variant, a 30% chance to render an empty (transparent) square.
    const ghostChance = 0.3;

    return (
      <div className="hero">
        <div className="hero-curtain"></div>
        <div
          className="hero-grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, 60px)`,
            gridTemplateRows: `repeat(${rows}, 60px)`,
          }}
        >
          {[...Array(rows!).keys()].map((x) =>
            [...Array(columns!).keys()].map((y) => {
              const squareClass =
                x % 2 === 0
                  ? y % 2 === 0
                    ? 'hero-square light'
                    : 'hero-square dark'
                  : y % 2 === 1
                  ? 'hero-square light'
                  : 'hero-square dark';

              const shouldGhost =
                variant === 'ghostSquares' && Math.random() < ghostChance;

              const squareStyle: React.CSSProperties = { display: 'flex' };
              if (shouldGhost) {
                // For ghosted squares, override any background so they appear empty/transparent.
                squareStyle.backgroundColor = 'transparent';
              }

              return (
                <div
                  key={`square-${x}-${y}`}
                  className={squareClass}
                  style={squareStyle}
                >
                  {!shouldGhost && this.getRandomDisplay(0.1, 0.1)}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
}
