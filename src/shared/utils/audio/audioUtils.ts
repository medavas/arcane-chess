export class AudioPlayer {
  private audio: HTMLAudioElement;

  constructor(src: string, volume: number, loop: boolean = false) {
    this.audio = new Audio(src);
    this.audio.volume = volume;
    this.audio.loop = loop;
  }

  load() {
    this.audio.load();
  }

  play() {
    this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  setVolume(volume: number) {
    this.audio.volume = volume;
  }

  isPlaying(): boolean {
    return !this.audio.paused;
  }

  on(event: string, callback: () => void) {
    this.audio.addEventListener(event, callback);
  }

  off(event: string, callback: () => void) {
    this.audio.removeEventListener(event, callback);
  }
}
