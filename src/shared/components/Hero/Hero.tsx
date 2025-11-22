import React from 'react';

import './Hero.scss';

import 'src/features/game/board/styles/normal.scss';
import 'src/features/game/board/styles/chi.scss';
import 'src/features/game/board/styles/gamma.scss';
import 'src/features/game/board/styles/psi.scss';
import 'src/features/game/board/styles/sigma.scss';
import 'src/features/game/board/styles/omega.scss';
import 'src/features/game/board/styles/lambda.scss';

export default class Hero extends React.Component {
  constructor(props: object) {
    super(props);
    this.state = {};
  }

  // figure out seeds?

  getRandomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  randomizeHelper = (
    getAppears: boolean
  ): {
    piece: string;
    color: string;
    faction: string;
  } | null => {
    if (getAppears && Math.random() < 0.6) {
      return null;
    }

    const color = ['white', 'black'];
    const piece = [
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
      'x-piece',
    ];
    const faction = ['tau', 'chi', 'psi', 'gamma', 'sigma', 'omega', 'lambda'];

    return {
      piece: piece[this.getRandomNumber(0, 13)],
      color: color[this.getRandomNumber(0, 1)],
      faction: faction[this.getRandomNumber(0, 6)],
    };
  };

  getRandomPiece = () => {
    const piece = this.randomizeHelper(false)?.piece;

    return this.randomizeHelper(true) ? (
      <div
        className={`
              ${piece} 
              ${this.randomizeHelper(false)?.color} 
              ${this.randomizeHelper(false)?.faction}
            `}
        style={{
          position: 'relative',
          width: piece === 'x-piece' ? '100px' : '40px',
          height: piece === 'x-piece' ? '100px' : '40px',
          transform: piece === 'x-piece' ? 'scale(.5)' : 'scale(1.5)',
          top: piece === 'x-piece' ? '-20px' : '9px',
          left: piece === 'x-piece' ? '-20px' : '9px',
        }}
      />
    ) : null;
  };

  shouldComponentUpdate() {
    return false; // Prevents the component from re-rendering
  }

  render() {
    return (
      <div className="hero">
        <div className="hero-curtain"></div>
        <div className="hero-grid">
          {[...Array(10).keys()].map((x) => {
            return [...Array(15).keys()].map((y) => {
              return x % 2 === 0 ? (
                y % 2 === 0 ? (
                  <div key={y} className="hero-square light">
                    {this.getRandomPiece()}
                  </div>
                ) : (
                  <div key={y} className="hero-square dark">
                    {this.getRandomPiece()}
                  </div>
                )
              ) : y % 2 === 1 ? (
                <div key={y} className="hero-square light">
                  {this.getRandomPiece()}
                </div>
              ) : (
                <div key={y} className="hero-square dark">
                  {this.getRandomPiece()}
                </div>
              );
            });
          })}
        </div>
      </div>
    );
  }
}
