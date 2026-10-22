class Sound {
  constructor() {
    this.music = null;
    this.track = null;
    this.unlocked = false;
    this.settings = { music: 0.3, sfx: 0.6, mute: false };
    this.active = new Set();
  }
  unlock() {
    this.unlocked = true;
    this.sync();
  }
  configure(s) {
    this.settings = s;
    this.sync();
    for (const a of this.active) a.volume = s.mute ? 0 : Math.min(0.7, s.sfx);
  }
  setScene(scene, ending) {
    const track = scene?.startsWith("finale_")
      ? "awakening_loop"
      : scene === "ending"
        ? ending && ["abandoned", "overrun", "fractured"].includes(ending)
          ? "ending_cold_loop"
          : "ending_loop"
        : "shrine_loop";
    if (this.track !== track) {
      this.music?.pause();
      this.music = null;
      this.track = track;
    }
    this.sync();
  }
  sync() {
    if (!this.unlocked) return;
    if (!this.track) this.track = "shrine_loop";
    if (!this.music) {
      this.music = new Audio(`/assets/audio/${this.track}.ogg`);
      this.music.loop = true;
    }
    this.music.volume = this.settings.mute
      ? 0
      : Math.min(0.5, this.settings.music);
    if (document.hidden || this.settings.mute || !this.settings.music)
      this.music.pause();
    else this.music.play().catch(() => {});
  }
  play(id) {
    if (!this.unlocked || this.settings.mute || !this.settings.sfx) return;
    const a = new Audio(`/assets/audio/${id}.ogg`);
    a.volume = Math.min(0.7, this.settings.sfx);
    this.active.add(a);
    a.onended = () => this.active.delete(a);
    a.play().catch(() => this.active.delete(a));
  }
}
export const sound = new Sound();
document.addEventListener("visibilitychange", () => sound.sync());
