import React, { useEffect } from 'react';
import { audioManager } from './AudioManager';

// Sound Effects
import impact from '/assets/noise/sounds/explosion.wav';
import move from '/assets/noise/sounds/footstep_concrete_000.mp3';
import capture from '/assets/noise/sounds/impactGeneric_light_001.mp3';
import fire from '/assets/noise/sounds/Fire1.mp3';
import spell from '/assets/noise/sounds/Spell1.mp3';
import freeze from '/assets/noise/sounds/freeze.mp3';
import victory from '/assets/noise/sounds/levelup.wav';
import defeat from '/assets/noise/sounds/ghost_2.mp3';
import cheer from '/assets/noise/sounds/01_start2.wav';

// Music Tracks
import tactoriusmenu from '/assets/noise/music/tactoriusmenu.wav';
// import caller from '/assets/noise/music/caller.mp3';
import darkcity from '/assets/noise/music/darkcity.mp3';
import Dream2Ambience from '/assets/noise/music/Dream2Ambience.mp3';
import monoliths from '/assets/noise/music/monoliths.mp3';
import booyab from '/assets/noise/music/booyab.mp3';
import v312 from '/assets/noise/music/v312.mp3';
import darkamb from '/assets/noise/music/Dark-Amb.mp3';

const ConditionalAudioPlayer: React.FC<{ location: any }> = ({ location }) => {
  useEffect(() => {
    // Register Sound Effects
    if (!audioManager.isSoundRegistered('move'))
      audioManager.registerSFX('move', move);
    if (!audioManager.isSoundRegistered('capture'))
      audioManager.registerSFX('capture', capture);
    if (!audioManager.isSoundRegistered('spell'))
      audioManager.registerSFX('spell', spell);
    if (!audioManager.isSoundRegistered('fire'))
      audioManager.registerSFX('fire', fire);
    if (!audioManager.isSoundRegistered('freeze'))
      audioManager.registerSFX('freeze', freeze);
    if (!audioManager.isSoundRegistered('victory'))
      audioManager.registerSFX('victory', victory);
    if (!audioManager.isSoundRegistered('defeat'))
      audioManager.registerSFX('defeat', defeat);
    if (!audioManager.isSoundRegistered('impact'))
      audioManager.registerSFX('impact', impact);
    if (!audioManager.isSoundRegistered('cheer'))
      audioManager.registerSFX('cheer', cheer);

    // Register Background Music
    // if (!audioManager.isSoundRegistered('lesson1'))
    //   audioManager.registerMusic('lesson1', caller);
    if (!audioManager.isSoundRegistered('menu'))
      audioManager.registerMusic('menu', tactoriusmenu);

    if (!audioManager.isSoundRegistered('game1'))
      audioManager.registerMusic('game1', darkcity);
    if (!audioManager.isSoundRegistered('game2'))
      audioManager.registerMusic('game2', Dream2Ambience);
    if (!audioManager.isSoundRegistered('game3'))
      audioManager.registerMusic('game3', monoliths);
    if (!audioManager.isSoundRegistered('game4'))
      audioManager.registerMusic('game4', booyab);
    if (!audioManager.isSoundRegistered('game5'))
      audioManager.registerMusic('game5', v312);
    if (!audioManager.isSoundRegistered('game6'))
      audioManager.registerMusic('game6', darkamb);
  }, []);

  // Trigger Music Play/Stop based on Route
  useEffect(() => {
    const gameRoutes = [
      '/temple',
      '/mission',
      '/quickplay',
      '/skirmish',
      '/stacktadium',
      '/lexicon',
      '/lesson',
    ];
    const menuRoutes = [
      '/',
      '/campaign',
      '/chapter',
      '/profile',
      '/leaderboard',
    ];

    if (gameRoutes.includes(location.pathname)) {
      audioManager.stopMusic('menu');
      // audioManager.stopMusic('lesson1');
      audioManager.stopMusic('game1');
      audioManager.stopMusic('game2');
      audioManager.stopMusic('game3');
      audioManager.stopMusic('game4');
      audioManager.stopMusic('game5');
      audioManager.stopMusic('game6');
      audioManager.setPlaylist(['game1', 'game2', 'game3', 'game4', 'game5']);
    } else if (menuRoutes.includes(location.pathname)) {
      audioManager.stopMusic('game1');
      audioManager.stopMusic('game2');
      audioManager.stopMusic('game3');
      audioManager.stopMusic('game4');
      audioManager.stopMusic('game5');
      audioManager.stopMusic('game6');
      // audioManager.stopMusic('lesson1');
      audioManager.playMusic('menu');
    } else {
      audioManager.stopMusic('game1');
      audioManager.stopMusic('game2');
      audioManager.stopMusic('game3');
      audioManager.stopMusic('game4');
      audioManager.stopMusic('game5');
      audioManager.stopMusic('game6');
      audioManager.stopMusic('menu');
      // audioManager.stopMusic('lesson1');
    }
  }, [location.pathname]);

  return null;
};

export default ConditionalAudioPlayer;
