import React from 'react';
import _ from 'lodash';
import arcanaJson from 'src/shared/data/arcana.json';
import { getProgressState } from 'src/features/game/engine/arcaneDefs.mjs';
import './ArcanaSelector.scss';

interface ArcanaSelectorProps {
  color: 'white' | 'black';
  arcaneConfig: Record<string, number | string | undefined>;
  spellBook?: Record<string, number>;
  playerColor: string;
  thinking: boolean;
  historyLength: number;
  futureSightAvailable: boolean;
  hoverArcane: string;
  engineColor: string;
  dyadName: string;
  dyadOwner: string | undefined;
  trojanGambitExists: boolean;
  onSpellClick: (key: string) => void;
  onHover: (key: string) => void;
  isArcaneActive: (key: string, color?: string) => boolean;
  variant?: 'player' | 'opponent'; // New prop to differentiate layout
}

const arcana = arcanaJson as Record<string, any>;

export const OldArcanaSelector: React.FC<ArcanaSelectorProps> = ({
  color,
  arcaneConfig,
  playerColor,
  thinking,
  historyLength,
  futureSightAvailable,
  hoverArcane,
  // engineColor,
  dyadName,
  dyadOwner,
  trojanGambitExists,
  onSpellClick,
  onHover,
  isArcaneActive,
}) => {
  const progress = getProgressState(color);
  const pct = Math.round(progress.pct * 100);

  return (
    <div className="arcana-select-wrapper">
      <div className="arcana-select">
        {_.map(
          arcaneConfig,
          (value: number | string | undefined, key: string) => {
            const entry = arcana[key];
            if (!entry) return null;

            const isInherent = entry.type === 'inherent';

            // Skip if no value (unless inherent, but usually inherent has value 1 or similar in config?)
            // Original logic: if (!value || value <= 0) return null;
            if (!value || (typeof value === 'number' && value <= 0))
              return null;

            const isFutureSightAvailable =
              historyLength >= 4 && futureSightAvailable;

            const isDisabled =
              playerColor !== color ||
              thinking ||
              trojanGambitExists ||
              (!isFutureSightAvailable && key === 'modsFUT');

            const active = isArcaneActive(key, color);

            let dyadStillActive = false;
            if (key.startsWith('dyad') && dyadName === key) {
              // Only keep the dyad icon active in the list for the owner color.
              if (dyadOwner === color) {
                dyadStillActive = true;
              }
            }

            const isTrojanActive = trojanGambitExists && key === 'modsTRO';
            const effectiveActive = active || dyadStillActive;

            return (
              <div
                className="arcane-select__item"
                key={key}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  marginRight: 6,
                }}
              >
                <div className="arcane-select__item-count">
                  {isInherent ? 'INH' : value}
                </div>
                <img
                  key={key}
                  className={`arcane${effectiveActive ? ' is-active' : ''}${isTrojanActive
                    ? ' trojan-active'
                    : hoverArcane === key
                      ? ' focus'
                      : ''
                    }`}
                  src={`/assets/arcanaImages${entry.imagePath}.svg`}
                  style={{
                    opacity: isDisabled ? 0.4 : 1,
                    cursor: isDisabled
                      ? 'not-allowed'
                      : `url('/assets/images/cursors/pointer.svg') 12 4, pointer`,
                  }}
                  onClick={() => {
                    if (isDisabled) return;
                    onSpellClick(key);
                  }}
                  onMouseEnter={() => onHover(key)}
                  onMouseLeave={() => onHover('')}
                />
              </div>
            );
          }
        )}
      </div>
      <div className="arcana-charge-bar">
        <div className="arcana-charge-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const ArcanaSelectorComponent: React.FC<ArcanaSelectorProps> = ({
  color,
  arcaneConfig,
  spellBook,
  playerColor,
  thinking,
  historyLength,
  futureSightAvailable,
  hoverArcane,
  dyadName,
  dyadOwner,
  trojanGambitExists,
  onSpellClick,
  onHover,
  isArcaneActive,
  variant = 'player', // Default to player layout
}) => {
  const progress = getProgressState(color);

  // Local hover state for styling only
  const [localHover, setLocalHover] = React.useState<string>('');
  const hoverTimeoutRef = React.useRef<number | null>(null);

  // Debounced hover handler
  const handleHoverEnter = React.useCallback(
    (key: string) => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
      setLocalHover(key);
      onHover(key);
    },
    [onHover]
  );

  const handleHoverLeave = React.useCallback(() => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      setLocalHover('');
      onHover('');
    }, 50);
  }, [onHover]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Calculate progress bar segments - 8 segments for progression
  const totalProgressSegments = 8;
  const filledProgressSegments = React.useMemo(
    () => Math.round((progress.pct || 0) * totalProgressSegments),
    [progress.pct]
  );

  // Use spellBook if it has keys, otherwise fallback to arcaneConfig
  const sourceMap = React.useMemo(
    () =>
      spellBook && Object.keys(spellBook).length > 0 ? spellBook : arcaneConfig,
    [spellBook, arcaneConfig]
  );

  // Get hover spell details from shared hoverArcane prop (works for both player and opponent)
  const hoveredSpell = React.useMemo(
    () => (hoverArcane ? arcana[hoverArcane] : null),
    [hoverArcane]
  );

  // Opponent variant: horizontal layout without local hover text
  if (variant === 'opponent') {
    return (
      <div className="new-arcana-selector new-arcana-selector--opponent">
        <div className="new-arcana-selector__progress-bar">
          {Array.from({ length: totalProgressSegments }).map((_, index) => (
            <div
              key={index}
              className={`new-arcana-selector__progress-segment${index < filledProgressSegments ? ' is-filled' : ''
                }`}
            />
          ))}
        </div>
        <div className="new-arcana-selector__grid new-arcana-selector__grid--horizontal">
          {_.map(sourceMap, (_ignoredValue, key: string) => {
            const entry = arcana[key];
            if (!entry) return null;

            const value = arcaneConfig[key];
            const isInherent = entry.type === 'inherent';
            const isPassive = entry.type === 'passive';
            const isInstant = entry.type === 'instant';

            if (
              !spellBook &&
              (!value || (typeof value === 'number' && value <= 0))
            )
              return null;

            const isFutureSightAvailable =
              historyLength >= 4 && futureSightAvailable;

            const isDisabled =
              playerColor !== color ||
              thinking ||
              trojanGambitExists ||
              (!isFutureSightAvailable && key === 'modsFUT');

            const active = isArcaneActive(key, color);

            let dyadStillActive = false;
            if (key.startsWith('dyad') && dyadName === key) {
              if (dyadOwner === color) {
                dyadStillActive = true;
              }
            }

            const isTrojanActive = trojanGambitExists && key === 'modsTRO';
            const effectiveActive = active || dyadStillActive;

            const displayValue = typeof value === 'number' ? value : 0;
            const isExhausted = typeof value === 'number' && value === 0 && !isInherent;


            return (
              <div
                className={`new-arcana-selector__item${effectiveActive ? ' is-active' : ''
                  }${isTrojanActive ? ' trojan-active' : ''}${localHover === key ? ' is-hovered' : ''
                  }${isDisabled ? ' is-disabled' : ''}${isInherent ? ' is-inherent' : ''
                  }${isPassive ? ' is-passive' : ''}${isInstant ? ' is-instant' : ''
                  }${isExhausted ? ' is-exhausted' : ''}`}
                key={key}
                onClick={() => {
                  if (isDisabled || isInherent || isExhausted || trojanGambitExists) return;
                  onSpellClick(key);
                }}
                onMouseEnter={() => handleHoverEnter(key)}
                onMouseLeave={handleHoverLeave}
              >
                <div className={`new-arcana-selector__item-count${isExhausted ? ' is-zero' : ''}`}>
                  {isInherent ? 'INH' : displayValue}
                </div>
                <div className="new-arcana-selector__item-icon">
                  <img
                    src={`/assets/arcanaImages${entry.imagePath}.svg`}
                    alt={entry.name || key}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      console.warn(`Failed to load icon: ${entry.imagePath}`);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Player variant: vertical layout with hover text box
  return (
    <div className="new-arcana-selector">
      <div className="new-arcana-selector__left-panel">
        <div className="new-arcana-selector__progress-bar">
          {Array.from({ length: totalProgressSegments }).map((_, index) => (
            <div
              key={index}
              className={`new-arcana-selector__progress-segment${index < filledProgressSegments ? ' is-filled' : ''
                }`}
            />
          ))}
        </div>
        <div className="new-arcana-selector__hover-text">
          {hoveredSpell ? (
            <>
              <div className="new-arcana-selector__hover-text__name">
                {hoveredSpell.name}
              </div>
              <div className="new-arcana-selector__hover-text__description">
                {hoveredSpell.description ||
                  hoveredSpell.effect ||
                  'No description available'}
              </div>
            </>
          ) : (
            <div className="new-arcana-selector__hover-text__empty">
              Hover over a spell to see details
            </div>
          )}
        </div>
      </div>
      <div className="new-arcana-selector__grid-container">
        <div className="new-arcana-selector__grid">
          {/* Arcana Select - 2 column vertically scrollable grid */}
          {_.map(sourceMap, (_ignoredValue, key: string) => {
            const entry = arcana[key];
            if (!entry) return null;

            // Always get the current value from arcaneConfig (live charges)
            const value = arcaneConfig[key];

            const isInherent = entry.type === 'inherent';
            const isPassive = entry.type === 'passive';
            const isInstant = entry.type === 'instant';

            // If we are using spellBook, we show the item even if value is 0/undefined.
            // If we are NOT using spellBook (fallback), we hide it if value is 0/undefined.
            if (
              !spellBook &&
              (!value || (typeof value === 'number' && value <= 0))
            )
              return null;

            const isFutureSightAvailable =
              historyLength >= 4 && futureSightAvailable;

            const isDisabled =
              playerColor !== color ||
              thinking ||
              trojanGambitExists ||
              (!isFutureSightAvailable && key === 'modsFUT');

            const active = isArcaneActive(key, color);

            let dyadStillActive = false;
            if (key.startsWith('dyad') && dyadName === key) {
              if (dyadOwner === color) {
                dyadStillActive = true;
              }
            }

            const isTrojanActive = trojanGambitExists && key === 'modsTRO';
            const effectiveActive = active || dyadStillActive;

            const displayValue = typeof value === 'number' ? value : 0;
            const isExhausted = typeof value === 'number' && value === 0 && !isInherent;

            return (
              <div
                className={`new-arcana-selector__item${effectiveActive ? ' is-active' : ''
                  }${isTrojanActive ? ' trojan-active' : ''}${localHover === key ? ' is-hovered' : ''
                  }${isDisabled ? ' is-disabled' : ''}${isInherent ? ' is-inherent' : ''
                  }${isPassive ? ' is-passive' : ''}${isInstant ? ' is-instant' : ''
                  }${isExhausted ? ' is-exhausted' : ''}`}
                key={key}
                onClick={() => {
                  if (isDisabled || isInherent || isExhausted || trojanGambitExists) return;
                  onSpellClick(key);
                }}
                onMouseEnter={() => handleHoverEnter(key)}
                onMouseLeave={handleHoverLeave}
              >
                <div className={`new-arcana-selector__item-count${isExhausted ? ' is-zero' : ''}`}>
                  {isInherent ? 'INH' : displayValue}
                </div>
                <div className="new-arcana-selector__item-icon">
                  <img
                    src={`/assets/arcanaImages${entry.imagePath}.svg`}
                    alt={entry.name || key}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      console.warn(`Failed to load icon: ${entry.imagePath}`);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ArcanaSelector = React.memo(ArcanaSelectorComponent);
