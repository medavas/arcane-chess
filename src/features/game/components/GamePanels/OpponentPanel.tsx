import React from 'react';
import { ArcanaSelector } from 'src/features/game/components/ArcanaSelector/ArcanaSelector';
import Button from 'src/shared/components/Button/Button';
import GlobalVolumeControl from 'src/shared/utils/audio/GlobalVolumeControl';
import {
  whiteArcaneConfig,
  blackArcaneConfig,
  whiteArcaneSpellBook,
  blackArcaneSpellBook,
} from 'src/features/game/engine/arcaneDefs.mjs';
import arcanaJson from 'src/shared/data/arcana.json';
import './OpponentPanel.scss';

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
}) => {
  return (
    <div className="opponent-dialogue-arcana">
      <div className="info-avatar">
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
            spellBook={
              (engineColor === 'white'
                ? whiteArcaneSpellBook
                : blackArcaneSpellBook) as Record<string, number>
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
            variant="opponent"
          />
        </div>
      </div>
      <div id="dialogue" className="dialogue">
        <ul style={{ padding: '0' }}>
          {dialogue.map((item, key) => {
            return <li key={key}>{item}</li>;
          })}
        </ul>
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
