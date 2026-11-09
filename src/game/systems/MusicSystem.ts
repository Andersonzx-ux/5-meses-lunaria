import Phaser from 'phaser';
import trackUrl from '../../assets/audio/trilha_8bit.mp3';

const SETTINGS_KEY = 'lunaria:settings';
const VOLUME = 0.45;

export const MUSIC_CHANGED = 'change';

/** Eventos que contam como "gesto do usuário" para os navegadores liberarem o som. */
const GESTURES = ['pointerup', 'touchend', 'click', 'keydown'] as const;

function loadMuted(): boolean {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return false;
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null && 'muted' in parsed && parsed.muted === true;
  } catch {
    return false;
  }
}

function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ muted }));
  } catch {
    // Sem armazenamento: a preferência vale só nesta sessão.
  }
}

/**
 * Trilha sonora em loop. Usa um elemento `<audio>` (toca enquanto baixa e
 * gasta pouca memória, ao contrário de decodificar o MP3 inteiro). Os
 * navegadores só permitem tocar som depois de um gesto, então a música começa
 * no primeiro toque, clique ou tecla. Pausa quando a página fica oculta.
 */
class MusicState extends Phaser.Events.EventEmitter {
  private audio?: HTMLAudioElement;
  private muted = loadMuted();
  private playing = false;
  private initialized = false;

  /** Registra os gatilhos de início e de pausa. Chamado uma vez, ao abrir o jogo. */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    for (const type of GESTURES) window.addEventListener(type, this.onGesture, true);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Liga/desliga o som (a preferência fica salva). */
  toggle(): void {
    this.muted = !this.muted;
    saveMuted(this.muted);
    if (this.audio) this.audio.muted = this.muted;
    // Se ainda não tinha começado (ex.: estava mudo desde o início), começa agora.
    if (!this.muted && !this.playing) this.tryPlay();
    this.emit(MUSIC_CHANGED, this.muted);
  }

  private readonly onGesture = (): void => {
    this.tryPlay();
  };

  private readonly onVisibility = (): void => {
    if (!this.audio) return;
    if (document.visibilityState === 'hidden') this.audio.pause();
    else if (this.playing) void this.audio.play().catch(() => undefined);
  };

  private tryPlay(): void {
    if (this.playing) return;
    if (!this.audio) {
      const audio = new Audio(trackUrl);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = VOLUME;
      this.audio = audio;
    }
    this.audio.muted = this.muted;
    // play() precisa ser chamado dentro do gesto; se o navegador recusar, tenta no próximo.
    this.playing = true;
    this.audio.play().then(
      () => {
        for (const type of GESTURES) window.removeEventListener(type, this.onGesture, true);
      },
      () => {
        this.playing = false;
      },
    );
  }
}

export const MusicSystem = new MusicState();
