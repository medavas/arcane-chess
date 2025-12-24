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
import './OpponentPanel.scss';

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
  isDyadActive: boolean; // Is a dyad currently active?
  isEvoActive: boolean; // Is evo currently active?
  placingPiece?: number; // Summons active
  swapType?: string; // Swap active
  placingRoyalty?: number; // Royalty summon active
  offeringType?: string; // Offering active
  arcanaUpdateKey?: number; // Force re-render when arcana data changes
  onSpellClick: (key: string) => void;
  onHover: (arcane: string) => void;
  isArcaneActive: (key: string, color?: string) => boolean;
  onResign: () => void;
  showResign?: boolean; // Optional, as it might not be in all views or desired in all contexts
  volumeControl?: boolean;
  avatar?: string; // For QuickPlay/MissionView avatars if needed
  variantInfo?: string; // For MissionView variant explanation
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
  isDyadActive,
  isEvoActive,
  placingPiece = 0,
  swapType = '',
  placingRoyalty = 0,
  offeringType = '',
  arcanaUpdateKey,
  onSpellClick,
  onHover,
  isArcaneActive,
  onResign,
  showResign = true,
  volumeControl = true,
  variantInfo,
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
            arcanaUpdateKey={arcanaUpdateKey}
            trojanGambitExists={trojanActive}
            isDyadActive={isDyadActive}
            isEvoActive={isEvoActive}
            placingPiece={placingPiece}
            swapType={swapType}
            placingRoyalty={placingRoyalty}
            offeringType={offeringType}
            onSpellClick={onSpellClick}
            onHover={onHover}
            isArcaneActive={isArcaneActive}
            variant="opponent"
          />
        </div>
      </div>
      <div id="dialogue" className="dialogue">
        <ul style={{ padding: '0' }}>
          {variantInfo && <li>{variantInfo}</li>}
          {dialogue.map((item, key) => {
            return <li key={key}>{item}</li>;
          })}
          {!!thinking && <li>The engine is thinking...</li>}
        </ul>
      </div>
      {(showResign || volumeControl) && (
        <div className="controls-container">
          {showResign && (
            <Button
              className="tertiary"
              onClick={onResign}
              color={playerColor === 'white' ? 'B' : 'S'} // Heuristic based on existing code, might need prop
              text="RESIGN"
              width={100}
              backgroundColorOverride="#222222"
            />
          )}
          {volumeControl && <GlobalVolumeControl />}
        </div>
      )}
    </div>
  );
};
