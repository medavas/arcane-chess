import { AudioPlayer } from './audioUtils';

class AudioManager {
  private sounds: { [key: string]: AudioPlayer } = {}; // SFX
  private music: { [key: string]: AudioPlayer } = {}; // Background Music
  private playlist: string[] = [];
  private currentSongIndex: number = 0;
  private globalSFXVolume: number;
  private globalMusicVolume: number;

  constructor() {
    this.globalSFXVolume = parseFloat(
      localStorage.getItem('globalSFXVolume') ?? '0.5'
    );
    this.globalMusicVolume = parseFloat(
      localStorage.getItem('globalMusicVolume') ?? '0.25'
    );
  }

  /** Register Sound Effects */
  registerSFX(key: string, src: string): void {
    const sound = new AudioPlayer(src, this.globalSFXVolume, false);
    sound.load();
    this.sounds[key] = sound;
  }

  /** Register Background Music */
  registerMusic(key: string, src: string, loop: boolean = true): void {
    const music = new AudioPlayer(src, this.globalMusicVolume, loop);
    music.load();
    this.music[key] = music;
  }

  /** Play SFX */
  playSFX(key: string): void {
    this.sounds[key]?.play();
  }

  /** Play Background Music */
  playMusic(key: string): void {
    const music = this.music[key];
    if (music) {
      music.play();
    }
  }

  /** Stop a specific music track */
  stopMusic(key: string): void {
    this.music[key]?.stop();
  }

  /** Stop a specific SFX */
  stopSFX(key: string): void {
    this.sounds[key]?.stop();
  }

  /** Check if sound is registered */
  isSoundRegistered(key: string): boolean {
    return !!(this.sounds[key] || this.music[key]);
  }

  /** Set Music Playlist */
  setPlaylist(songs: string[]): void {
    this.playlist = songs;
    this.currentSongIndex = Math.floor(Math.random() * this.playlist.length);
    if (this.playlist.length > 0) this.playCurrentSong();
  }

  /** Play the current song in the playlist */
  private playCurrentSong(): void {
    const currentSongKey = this.playlist[this.currentSongIndex];
    const song = this.music[currentSongKey];
    if (song) {
      song.play();
      song.on('ended', this.handleSongEnd);
    }
  }

  /** Handle song end and play next */
  private handleSongEnd = (): void => {
    const currentSongKey = this.playlist[this.currentSongIndex];
    const song = this.music[currentSongKey];
    if (song) song.off('ended', this.handleSongEnd);

    this.currentSongIndex = (this.currentSongIndex + 1) % this.playlist.length;
    this.playCurrentSong();
  };

  /** Set Volume Separately for Music & SFX */
  setSFXVolume(volume: number): void {
    this.globalSFXVolume = volume;
    localStorage.setItem('globalSFXVolume', volume.toString());
    Object.values(this.sounds).forEach((s) => s.setVolume(volume));
  }

  setMusicVolume(volume: number): void {
    this.globalMusicVolume = volume;
    localStorage.setItem('globalMusicVolume', volume.toString());
    Object.values(this.music).forEach((m) => m.setVolume(volume));
  }

  /** Get Stored Volume */
  getSFXVolume(): number {
    return parseFloat(localStorage.getItem('globalSFXVolume') ?? '0.5');
  }

  getMusicVolume(): number {
    return parseFloat(localStorage.getItem('globalMusicVolume') ?? '0.25');
  }
}

export const audioManager = new AudioManager();
