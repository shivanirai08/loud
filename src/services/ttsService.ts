import Tts from 'react-native-tts';
import { VoiceLanguage } from '../types';

class TtsService {
  private isInitialized = false;
  private isSpeaking = false;
  private loopInterval: ReturnType<typeof setInterval> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Tts.getInitStatus();
      Tts.setDefaultRate(0.45);
      Tts.setDefaultPitch(1.0);
      this.isInitialized = true;
    } catch (error) {
      console.error('TTS initialization error:', error);
      // Try to install TTS engine
      try {
        await Tts.requestInstallEngine();
      } catch {
        console.error('Failed to request TTS engine install');
      }
    }
  }

  async setLanguage(language: VoiceLanguage): Promise<void> {
    try {
      await Tts.setDefaultLanguage(language);
    } catch (error) {
      console.error('Failed to set TTS language:', error);
      // Fallback to English
      await Tts.setDefaultLanguage('en-US');
    }
  }

  async speak(text: string, language: VoiceLanguage): Promise<void> {
    await this.initialize();
    await this.setLanguage(language);
    
    return new Promise((resolve) => {
      Tts.speak(text);
      Tts.addEventListener('tts-finish', () => {
        resolve();
      });
    });
  }

  startLoop(text: string, language: VoiceLanguage): void {
    this.stopLoop();
    this.isSpeaking = true;

    const speakOnce = async () => {
      if (!this.isSpeaking) return;
      await this.setLanguage(language);
      Tts.speak(text);
    };

    // Speak immediately
    speakOnce();

    // Set up listener to loop
    Tts.addEventListener('tts-finish', () => {
      if (this.isSpeaking) {
        // Wait 2 seconds then speak again
        this.loopInterval = setTimeout(() => {
          if (this.isSpeaking) {
            speakOnce();
          }
        }, 2000) as unknown as ReturnType<typeof setInterval>;
      }
    });
  }

  stopLoop(): void {
    this.isSpeaking = false;
    if (this.loopInterval) {
      clearTimeout(this.loopInterval);
      this.loopInterval = null;
    }
    Tts.stop();
    Tts.removeAllListeners('tts-finish');
  }

  stop(): void {
    this.stopLoop();
  }
}

export const ttsService = new TtsService();
