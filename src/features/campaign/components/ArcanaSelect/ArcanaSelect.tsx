import React from 'react';
import _ from 'lodash';

import './ArcanaSelect.scss';
import 'src/features/game/board/styles/normal.scss';

import arcanaJson from 'src/shared/data/arcana.json';

interface ArcanaDetail {
  id: string;
  name: string;
  description: string;
  type: string;
  imagePath: string;
}

interface ArcanaSelectProps {
  spellBook: ArcanaDetail[];
  color: string;
  isOpen: boolean;
  updateSpellBook?: (spellBook: ArcanaDetail[]) => void;
  updateHover?: (arcane: ArcanaDetail) => void;
  handleToggle?: () => void;
  /** When true, disables hovering and clicking. */
  readOnly?: boolean;
  /** Object of unlocked arcana with their counts from all chapters */
  unlockedArcana?: { [key: string]: number };
}

interface ArcanaSelectState {
  hoverId: string;
  currentSpellBookSlot: number;
}

interface ArcanaMap {
  [key: string]: ArcanaDetail;
}

const arcana: ArcanaMap = arcanaJson as ArcanaMap;

// Helper function to extract spell category from spell ID
const getSpellCategory = (spellId: string): string => {
  // Match sumnR followed by another capital letter (royalty/conditions: sumnRQ, sumnRT, etc.)
  // But NOT plain "sumnR" which is Summon Rook
  if (/^sumnR[A-Z]/.test(spellId)) {
    return 'sumnR';
  }
  // Match common prefixes: sumn, dyad, mods, offr (deprecated), dopl (new), shft, swap, mori, mora, gain, aura
  const match = spellId.match(
    /^(sumn|dyad|mods|offr|dopl|shft|swap|mori|mora|gain|aura|tokn)/
  );
  return match ? match[1] : '';
};

export default class ArcanaSelect extends React.Component<
  ArcanaSelectProps,
  ArcanaSelectState
> {
  constructor(props: ArcanaSelectProps) {
    super(props);
    this.state = {
      hoverId: '',
      currentSpellBookSlot: -1,
    };
  }

  updateSlot = (newValue: ArcanaDetail) => {
    const { spellBook, updateSpellBook, handleToggle, updateHover, readOnly } =
      this.props;
    const { currentSpellBookSlot } = this.state;

    if (readOnly) return;

    const updatedSpellBook = [...spellBook];
    updatedSpellBook[currentSpellBookSlot] = newValue;

    updateSpellBook?.(updatedSpellBook);
    handleToggle?.();
    updateHover?.(newValue);

    this.setState({
      currentSpellBookSlot: -1,
      hoverId: '',
    });
  };

  render() {
    const { spellBook, isOpen, updateHover, handleToggle, readOnly } =
      this.props;
    const { hoverId, currentSpellBookSlot } = this.state;
    const cursorInteractive =
      "url('/assets/images/cursors/pointer.svg') 12 4, pointer";

    return (
      <div className="arcane-select">
        <div className="spellBook">
          {spellBook.map((arcane, key) => (
            <div
              key={key}
              className={`arcane-wrapper ${
                key === currentSpellBookSlot ? 'active' : ''
              }`}
              onMouseEnter={() => {
                updateHover?.(arcane);
                this.setState({
                  hoverId: arcane.id,
                  currentSpellBookSlot: key,
                });
              }}
              onMouseLeave={() => {
                updateHover?.({} as ArcanaDetail);
                if (!isOpen) {
                  this.setState({
                    hoverId: '',
                    currentSpellBookSlot: -1,
                  });
                }
              }}
              onClick={
                readOnly
                  ? undefined
                  : () => {
                      handleToggle?.();
                      this.setState({
                        currentSpellBookSlot: key,
                      });
                    }
              }
              aria-disabled={readOnly || undefined}
            >
              <img
                className="arcane"
                src={`/assets/arcanaImages${arcane.imagePath}.svg`}
                style={{
                  cursor: cursorInteractive,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                alt={arcane.name}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {isOpen && (
          <div className="arcana-block" aria-disabled={readOnly || undefined}>
            <button
              className="arcana-block-close"
              onClick={handleToggle}
              aria-label="Close"
            >
              ✕
            </button>
            {_.map(arcana, (arcaneObject: ArcanaDetail, key: string) => {
              // Filter to only show unlocked arcana if unlockedArcana prop is provided
              if (
                this.props.unlockedArcana &&
                !(key in this.props.unlockedArcana)
              ) {
                return null;
              }
              const category = getSpellCategory(key);
              const categoryClass = category ? `category-${category}` : '';
              return (
                <img
                  key={key}
                  className={`arcane ${categoryClass} ${
                    hoverId === key ? 'focus' : ''
                  }`}
                  src={`/assets/arcanaImages${arcana[key].imagePath}.svg`}
                  style={{
                    cursor: cursorInteractive,
                  }}
                  onMouseEnter={
                    readOnly
                      ? undefined
                      : () => {
                          updateHover?.(arcaneObject);
                          this.setState({ hoverId: key });
                        }
                  }
                  onMouseLeave={
                    readOnly
                      ? undefined
                      : () => {
                          updateHover?.({} as ArcanaDetail);
                          this.setState({ hoverId: '' });
                        }
                  }
                  onClick={
                    readOnly ? undefined : () => this.updateSlot(arcaneObject)
                  }
                  alt={arcaneObject.name}
                  draggable={false}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }
}
