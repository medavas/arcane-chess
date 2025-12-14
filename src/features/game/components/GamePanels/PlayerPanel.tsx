import React from 'react';
import { ArcanaSelector } from 'src/features/game/components/ArcanaSelector/ArcanaSelector';
import Button from 'src/shared/components/Button/Button';
import GlobalVolumeControl from 'src/shared/utils/audio/GlobalVolumeControl';
import ChessClock from 'src/features/game/components/Clock/Clock';

import {
  whiteArcaneConfig,
  blackArcaneConfig,
  whiteArcaneSpellBook,
  blackArcaneSpellBook,
} from 'src/features/game/engine/arcaneDefs.mjs';
import './PlayerPanel.scss';

interface PlayerPanelProps {
  playerColor: string;
  engineColor: string;
  whiteFaction: string;
  blackFaction: string;
  arcaneConfig: any;
  history: (string | string[])[];
  sortedHistory: (string | string[])[][];
  navigateHistory: (type: string, targetIndex?: number) => void;
  thinking: boolean;
  hoverArcane: string;
  dialogue: string[];
  futureSightAvailable: boolean;
  dyadName: string;
  dyadOwner: string | undefined;
  trojanActive: boolean;
  isDyadActive: boolean; // Is a dyad currently active?
  isEvoActive: boolean; // Is evo currently active?
  placingPiece?: number; // Summons active
  swapType?: string; // Swap active
  placingRoyalty?: number; // Royalty summon active
  offeringType?: string; // Offering active
  onSpellClick: (key: string) => void;
  onHover: (arcane: string) => void;
  isArcaneActive: (key: string, color?: string) => boolean;
  onResign: () => void;
  clockState?: {
    ref: React.RefObject<ChessClock>;
    type: string;
    playerTurn: boolean;
    turn: string;
    time: number | null;
    timePrime: number | null;
    playerTimeout: () => void;
  };
  variantInfo?: string; // For MissionView variant explanation
  avatar?: string;
  showResign?: boolean;
  volumeControl?: boolean;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  playerColor,
  engineColor,
  // arcaneConfig,
  history,
  sortedHistory,
  navigateHistory,
  thinking,
  hoverArcane,
  dialogue,
  futureSightAvailable,
  dyadName,
  dyadOwner,
  trojanActive,
  isDyadActive,
  isEvoActive,
  placingPiece = 0,
  swapType = '',
  placingRoyalty = 0,
  offeringType = '',
  onSpellClick,
  onHover,
  isArcaneActive,
  onResign,
  clockState,
  variantInfo,
  showResign = true,
  volumeControl = true,
}) => {
  return (
    <div className="nav-history-buttons-player">
      {(volumeControl || showResign) && (
        <div className="controls-container">
          {showResign && (
            <Button
              className="tertiary"
              onClick={onResign}
              color={playerColor === 'white' ? 'S' : 'B'} // Heuristic
              text="RESIGN"
              width={100}
              backgroundColorOverride="#222222"
            />
          )}
          {volumeControl && <GlobalVolumeControl />}
        </div>
      )}
      <div className="nav">
        <Button
          className="tertiary"
          onClick={() => navigateHistory('start')}
          color={playerColor === 'white' ? 'S' : 'B'}
          strong={true}
          variant="<<"
          width={100}
          fontSize={30}
          backgroundColorOverride="#222222"
        />
        <Button
          className="tertiary"
          onClick={() => navigateHistory('back')}
          color={playerColor === 'white' ? 'S' : 'B'}
          strong={true}
          variant="<"
          width={100}
          fontSize={30}
          backgroundColorOverride="#222222"
        />
        <Button
          className="tertiary"
          onClick={() => navigateHistory('forward')}
          color={playerColor === 'white' ? 'S' : 'B'}
          strong={true}
          variant=">"
          width={100}
          fontSize={30}
          backgroundColorOverride="#222222"
        />
        <Button
          className="tertiary"
          onClick={() => navigateHistory('end')}
          color={playerColor === 'white' ? 'S' : 'B'}
          strong={true}
          variant=">>"
          width={100}
          fontSize={30}
          backgroundColorOverride="#222222"
        />
      </div>
      {clockState && (
        <div className="timer">
          <ChessClock
            ref={clockState.ref}
            type={clockState.type}
            playerTurn={clockState.playerTurn}
            turn={clockState.turn}
            time={clockState.time}
            timePrime={clockState.timePrime}
            playerTimeout={clockState.playerTimeout}
          />
        </div>
      )}
      <div id="history" className="history">
        {sortedHistory.map((fullMove: any, fullMoveIndex: number) => {
          return (
            <p className="full-move" key={fullMoveIndex}>
              <span className="move-number">{fullMoveIndex + 1}.</span>
              <Button
                className="tertiary"
                text={fullMove[0]}
                color={playerColor === 'white' ? 'S' : 'B'}
                height={20}
                onClick={() => {
                  navigateHistory('jump', fullMoveIndex * 2 + 1);
                }}
                backgroundColorOverride="#00000000"
              />
              <Button
                className="tertiary"
                text={fullMove[1]}
                color={playerColor === 'white' ? 'S' : 'B'}
                height={20}
                onClick={() => {
                  navigateHistory('jump', fullMoveIndex * 2 + 2);
                }}
                backgroundColorOverride="#00000000"
              />
            </p>
          );
        })}
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
      <div className="info-avatar">
        <div className="board-arcana">
          <ArcanaSelector
            color={playerColor as 'white' | 'black'}
            arcaneConfig={
              (playerColor === 'white'
                ? whiteArcaneConfig
                : blackArcaneConfig) as Record<
                  string,
                  number | string | undefined
                >
            }
            spellBook={
              (playerColor === 'white'
                ? whiteArcaneSpellBook
                : blackArcaneSpellBook) as Record<string, number>
            }
            playerColor={playerColor}
            thinking={thinking}
            historyLength={history.length}
            futureSightAvailable={futureSightAvailable}
            hoverArcane={hoverArcane}
            engineColor={engineColor}
            dyadName={dyadName}
            dyadOwner={dyadOwner}
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
          />
        </div>
      </div>
    </div>
  );
};
