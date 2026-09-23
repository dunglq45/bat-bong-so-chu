import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Đọc to nội dung bằng Web Speech API (vi-VN), có fallback im lặng khi SSR / trình duyệt không hỗ trợ. */
@Injectable({ providedIn: 'root' })
export class SpeechService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private voice: SpeechSynthesisVoice | null = null;
  private unlocked = false;

  constructor() {
    if (!this.isBrowser || !('speechSynthesis' in window)) return;
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      this.voice = voices.find((v) => v.lang?.toLowerCase().startsWith('vi')) ?? null;
    };
    pickVoice();
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
  }

  /** Trình duyệt chặn autoplay âm thanh: gọi hàm này trong thao tác chạm đầu tiên của bé. */
  unlock(): void {
    if (!this.isBrowser || !('speechSynthesis' in window) || this.unlocked) return;
    this.unlocked = true;
    const warmup = new SpeechSynthesisUtterance('');
    warmup.volume = 0;
    window.speechSynthesis.speak(warmup);
  }

  speak(text: string): void {
    if (!this.isBrowser || !('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'vi-VN';
    utter.rate = 0.95;
    utter.pitch = 1.1;
    if (this.voice) utter.voice = this.voice;
    window.speechSynthesis.speak(utter);
  }

  cancel(): void {
    if (!this.isBrowser || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
  }
}
