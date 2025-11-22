// ArmySelect.tsx
import React from 'react';
import './ArmySelect.scss';

import 'src/features/game/board/styles/normal.scss';
import 'src/features/game/board/styles/chi.scss';
import 'src/features/game/board/styles/lambda.scss';
import 'src/features/game/board/styles/sigma.scss';
import 'src/features/game/board/styles/omega.scss';
import 'src/features/game/board/styles/psi.scss';
import 'src/features/game/board/styles/gamma.scss';

interface ArmySelectProps {
  army: string;
  isOpen: boolean;
  color: string;
  faction?: FactionId;
  updateArmy?: (army: string) => void;
  handleToggle?: () => void;
  updateHover?: (id: string) => void;
  readOnly?: boolean;
}

interface ArmySelectState {
  hoverArmy: number;
  army: string;
}

type FactionId = 'chi' | 'gamma' | 'omega' | 'lambda' | 'sigma' | 'psi' | 'tau';

export const armies = [
  'RNBQKBNR',
  'RNBTKBNR',
  'RNBMKBNR',
  'RNBVKBNR',
  'RSBQKBSR',
  'RSBTKBSR',
  'RSBMKBSR',
  'RSBVKBSR',
  'RNWQKWNR',
  'RNWTKWNR',
  'RNWMKWNR',
  'RNWVKWNR',
  'RSWQKWSR',
  'RSWTKWSR',
  'RSWMKWSR',
  'RSWVKWSR',
  'TMQVKQMT',
];

export default class ArmySelect extends React.Component<
  ArmySelectProps,
  ArmySelectState
> {
  constructor(props: ArmySelectProps) {
    super(props);
    this.state = {
      hoverArmy: 0,
      army: 'RNWMKWNR',
    };
  }

  render() {
    const {
      army,
      isOpen,
      color,
      faction,
      updateArmy,
      handleToggle,
      updateHover,
      readOnly,
    } = this.props;
    const cursorInteractive =
      "url('/assets/images/cursors/pointer.svg') 12 4, pointer";

    return (
      <div className="army-select">
        <div
          className={`army ${this.state.hoverArmy === -1 ? 'hover-army' : ''}`}
          onMouseEnter={
            readOnly
              ? undefined
              : () => {
                  this.setState({ hoverArmy: -1 });
                  updateHover?.('army');
                }
          }
          onMouseLeave={
            readOnly
              ? undefined
              : () => {
                  this.setState({ hoverArmy: -2 });
                  updateHover?.('');
                }
          }
          onClick={readOnly ? undefined : () => handleToggle?.()}
          aria-disabled={readOnly || undefined}
          style={{ cursor: cursorInteractive }}
        >
          {army.split('').map((piece, index) => (
            <div
              key={index}
              className={`${piece.toLowerCase()}-piece ${color} ${
                faction === 'tau' ? 'normal' : faction
              }`}
            />
          ))}
        </div>

        {isOpen && (
          <div className="army-block" aria-disabled={readOnly || undefined}>
            {armies.map((armyCode, armyIndex) => (
              <div
                key={armyIndex}
                className={`army-item ${
                  this.state.hoverArmy === armyIndex ? 'hover-army' : ''
                }`}
                onMouseEnter={
                  readOnly
                    ? undefined
                    : () => {
                        this.setState({ hoverArmy: armyIndex });
                        updateHover?.('army');
                      }
                }
                onMouseLeave={
                  readOnly
                    ? undefined
                    : () => {
                        this.setState({ hoverArmy: -2 });
                        updateHover?.('');
                      }
                }
                style={{ cursor: cursorInteractive }}
              >
                {armyCode.split('').map((piece, pieceIndex) => (
                  <div
                    key={pieceIndex}
                    className={`${piece.toLowerCase()}-piece ${color} ${
                      faction === 'tau' ? 'normal' : faction
                    } ${
                      this.state.hoverArmy === armyIndex ? 'hover-army' : ''
                    }`}
                    onClick={
                      readOnly
                        ? undefined
                        : () => {
                            updateArmy?.(
                              color === 'white'
                                ? armies[armyIndex]
                                : armies[armyIndex].toLowerCase()
                            );
                            this.setState(
                              { army: armies[armyIndex] },
                              () => handleToggle?.()
                            );
                          }
                    }
                    style={{ cursor: cursorInteractive }}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}
