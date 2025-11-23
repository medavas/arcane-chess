import React from 'react';
import { ArcanaSelector } from 'src/features/game/components/ArcanaSelector/ArcanaSelector';
import Button from 'src/shared/components/Button/Button';
import GlobalVolumeControl from 'src/shared/utils/audio/GlobalVolumeControl';
import { FACTIONS, GREEK_CAP } from 'src/shared/components/Skirmish/SkirmishModal';
import { whiteArcaneConfig, blackArcaneConfig } from 'src/features/game/engine/arcaneDefs.mjs';
import arcanaJson from 'src/shared/data/arcana.json';

const arcana: any = arcanaJson;

interface OpponentPanelProps {
    engineColor: string;
    playerColor: string;
    whiteFaction: string;
    blackFaction: string;
    arcaneConfig: any; // Using any for now to match loose typing in original files, strictly it's Record<string, number | string | undefined>
    thinking: boolean;
    hoverArcane: string;
    dialogue: string[];
    trojanActive: boolean;
    futureSightAvailable: boolean;
    historyLength: number;
    dyadName: string;
    dyadOwner: string | undefined;
    onSpellClick: (key: string) => void;
    onHover: (arcane: string) => void;
    isArcaneActive: (key: string, color?: string) => boolean;
    onResign: () => void;
    showResign?: boolean; // Optional, as it might not be in all views or desired in all contexts
    volumeControl?: boolean;
    avatar?: string; // For QuickPlay/MissionView avatars if needed
}

export const OpponentPanel: React.FC<OpponentPanelProps> = ({
    engineColor,
    playerColor,
    whiteFaction,
    blackFaction,
    // arcaneConfig,
    thinking,
    hoverArcane,
    dialogue,
    trojanActive,
    futureSightAvailable,
    historyLength,
    dyadName,
    dyadOwner,
    onSpellClick,
    onHover,
    isArcaneActive,
    onResign,
    showResign = true,
    volumeControl = true,
    avatar
}) => {
    const mapFaction = (f: string) => (f === 'normal' ? 'tau' : f);

    const engineAccent = engineColor
        ? FACTIONS[
            mapFaction(
                engineColor === 'white'
                    ? whiteFaction
                    : blackFaction
            ) as keyof typeof FACTIONS
        ]?.color
        : undefined;

    return (
        <div className="opponent-dialogue-arcana">
            <div className="info-avatar">
                <div className="avatar">
                    {!avatar && (
                        <div
                            style={
                                engineAccent
                                    ? { borderColor: engineAccent, color: engineAccent }
                                    : {}
                            }
                            title={`${playerColor === 'white'
                                ? blackFaction
                                : whiteFaction
                                } faction`}
                        >
                            <span className="badge-glyph">
                                {
                                    GREEK_CAP[
                                    (playerColor === 'white'
                                        ? blackFaction
                                        : whiteFaction) as keyof typeof GREEK_CAP
                                    ]
                                }
                            </span>
                        </div>
                    )}
                </div>
                <div className="board-arcana">
                    <ArcanaSelector
                        color={engineColor as 'white' | 'black'}
                        arcaneConfig={
                            (engineColor === 'white'
                                ? whiteArcaneConfig
                                : blackArcaneConfig) as Record<
                                    string,
                                    number | string | undefined
                                >
                        }
                        playerColor={playerColor}
                        thinking={thinking}
                        historyLength={historyLength}
                        futureSightAvailable={futureSightAvailable}
                        hoverArcane={hoverArcane}
                        engineColor={engineColor}
                        dyadName={dyadName}
                        dyadOwner={dyadOwner}
                        trojanGambitExists={trojanActive}
                        onSpellClick={onSpellClick}
                        onHover={onHover}
                        isArcaneActive={isArcaneActive}
                    />
                </div>
            </div>
            <div id="dialogue" className="dialogue">
                {hoverArcane !== '' ? (
                    <div className="arcana-detail">
                        <h3>{arcana[hoverArcane]?.name}</h3>
                        <p>{arcana[hoverArcane]?.description}</p>
                    </div>
                ) : (
                    <ul style={{ padding: '0' }}>
                        {thinking ? (
                            'The engine is thinking...'
                        ) : trojanActive ? (
                            <li className="banner banner--trojan">
                                Trojan Gambit activated! Must take via en passant.
                            </li>
                        ) : (
                            dialogue.map((item, key) => {
                                return <li key={key}>{item}</li>;
                            })
                        )}
                    </ul>
                )}
            </div>
            {showResign && (
                <div className="buttons">
                    <Button
                        className="tertiary"
                        onClick={onResign}
                        color={playerColor === 'white' ? 'B' : 'S'} // Heuristic based on existing code, might need prop
                        text="RESIGN"
                        width={100}
                        backgroundColorOverride="#222222"
                    />
                </div>
            )}
            {volumeControl && (
                <div className="global-volume-control">
                    <GlobalVolumeControl />
                </div>
            )}
        </div>
    );
};
