import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface BellNote {
  /** Tần số cơ bản (Hz) */
  freq: number;
  /** Thời điểm bắt đầu, tính từ lúc gọi playChime (giây) */
  at: number;
  /** Thời lượng tắt dần (giây) */
  decay: number;
  gain: number;
}

/** Phát tiếng chuông "ding" tổng hợp bằng Web Audio API — không cần file âm thanh, hoạt động offline. */
@Injectable({ providedIn: 'root' })
export class SoundService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private ctx: AudioContext | null = null;

  /** Trình duyệt chặn audio tự phát: gọi trong thao tác chạm đầu tiên của bé. */
  unlock(): void {
    if (!this.isBrowser) return;
    const ctx = this.ensureContext();
    if (ctx?.state === 'suspended') ctx.resume();
  }

  /** Chuông vui, 2 nốt đi lên — phát khi bé bấm đúng. */
  playCorrect(): void {
    this.playBell([
      { freq: 987.77, at: 0, decay: 0.35, gain: 0.22 }, // B5
      { freq: 1318.51, at: 0.09, decay: 0.55, gain: 0.24 }, // E6
    ]);
  }

  /** Chuông nhẹ, trầm hơn, 1 nốt — phát khi bé bấm nhầm (không phải âm báo lỗi gay gắt). */
  playWrong(): void {
    this.playBell([{ freq: 493.88, at: 0, decay: 0.4, gain: 0.16 }]); // B4
  }

  private playBell(notes: BellNote[]): void {
    if (!this.isBrowser) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    for (const note of notes) {
      const startAt = ctx.currentTime + note.at;
      // Vài bồi âm lệch hài để nghe giống tiếng chuông thật hơn 1 sóng sin thuần.
      const partials: Array<[ratio: number, amp: number]> = [
        [1, 1],
        [2.01, 0.5],
        [2.76, 0.28],
      ];

      for (const [ratio, amp] of partials) {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq * ratio, startAt);

        const peak = note.gain * amp;
        gainNode.gain.setValueAtTime(0, startAt);
        gainNode.gain.linearRampToValueAtTime(peak, startAt + 0.008);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + note.decay);

        osc.connect(gainNode).connect(ctx.destination);
        osc.start(startAt);
        osc.stop(startAt + note.decay + 0.05);
      }
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.isBrowser) return null;
    const AudioContextCtor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!this.ctx) this.ctx = new AudioContextCtor();
    return this.ctx;
  }
}
