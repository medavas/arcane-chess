import React, { useState, useEffect } from 'react';
import { audioManager } from './AudioManager';
import './GlobalVolumeControl.scss';

const GlobalVolumeControl: React.FC = () => {
  const [musicVolume, setMusicVolume] = useState<number>(
    audioManager.getMusicVolume() as number
  );

  const [sfxVolume, setSFXVolume] = useState<number>(
    audioManager.getSFXVolume() as number
  );

  useEffect(() => {
    audioManager.setMusicVolume(musicVolume);
  }, [musicVolume]);

  useEffect(() => {
    audioManager.setSFXVolume(sfxVolume);
  }, [sfxVolume]);

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setMusicVolume(newVolume);
    audioManager.setMusicVolume(newVolume);
  };

  const handleSFXVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setSFXVolume(newVolume);
    audioManager.setSFXVolume(newVolume);
  };

  return (
    <div className="global-volume-control">
      <div className="volume-group">
        <div className="volume-bar">
          <div className="volume-level">MUSIC</div>
          <input
            id="music-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={musicVolume}
            onChange={handleMusicVolumeChange}
            style={
              {
                '--fill': `${musicVolume * 100}%`,
                cursor: `url('/assets/images/cursors/pointer.svg') 12 4, pointer`,
              } as React.CSSProperties
            }
            className="volume-slider"
          />
        </div>
      </div>
      <div className="volume-group">
        <div className="volume-bar">
          <div className="volume-level">SDFX</div>
          <input
            id="sfx-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={sfxVolume}
            onChange={handleSFXVolumeChange}
            style={
              {
                '--fill': `${sfxVolume * 100}%`,
                cursor: `url('/assets/images/cursors/pointer.svg') 12 4, pointer`,
              } as React.CSSProperties
            }
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  );
};

export default GlobalVolumeControl;
