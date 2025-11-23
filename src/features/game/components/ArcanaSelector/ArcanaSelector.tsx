import React from 'react';
import _ from 'lodash';
import arcanaJson from 'src/shared/data/arcana.json';
import { getProgressState } from 'src/features/game/engine/arcaneDefs.mjs';

interface ArcanaSelectorProps {
    color: 'white' | 'black';
    arcaneConfig: Record<string, number | string | undefined>;
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
}

const arcana = arcanaJson as Record<string, any>;

export const ArcanaSelector: React.FC<ArcanaSelectorProps> = ({
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
    const untilNext = progress.untilNext;
    const tier = progress.tier;

    return (
        <div className="arcana-select-wrapper">
            <div className="arcana-select">
                {_.map(arcaneConfig, (value: number | string | undefined, key: string) => {
                    const entry = arcana[key];
                    if (!entry) return null;

                    const numericValue = typeof value === 'number' ? value : 0;
                    const isInherent = entry.type === 'inherent';

                    // Skip if no value (unless inherent, but usually inherent has value 1 or similar in config?)
                    // Original logic: if (!value || value <= 0) return null;
                    if (!value || (typeof value === 'number' && value <= 0)) return null;

                    const isFutureSightAvailable =
                        historyLength >= 4 && futureSightAvailable;

                    const isDisabled =
                        playerColor !== color ||
                        thinking ||
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
                })}
            </div>
            <div
                className="mana-bar"
                title={`Tier ${tier} – ${untilNext} move${untilNext === 1 ? '' : 's'
                    } to next`}
            >
                <div className="mana-bar__fill" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};
