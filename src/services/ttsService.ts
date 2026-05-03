import Tts from 'react-native-tts';
import { VoiceLanguage } from '../types';

const LOOP_GAP_MS = 350;

class TtsService {
  private isInitialized = false;
  private isSpeaking = false;
  private loopTimeout: ReturnType<typeof setTimeout> | null = null;

  private removeFinishListener(): void {
    Tts.removeAllListeners('tts-finish');
  }

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
      this.removeFinishListener();
      Tts.addEventListener('tts-finish', () => {
        this.removeFinishListener();
        resolve();
      });
      Tts.speak(text);
    });
  }

  startLoop(text: string, language: VoiceLanguage): void {
    this.stopLoop();
    this.isSpeaking = true;

    const speakOnce = async () => {
      if (!this.isSpeaking) return;
      await this.initialize();
      await this.setLanguage(language);
      Tts.stop();
      Tts.speak(text);
    };

    // Speak immediately
    void speakOnce();

    // Set up listener to loop
    Tts.addEventListener('tts-finish', () => {
      if (this.isSpeaking) {
        this.loopTimeout = setTimeout(() => {
          if (this.isSpeaking) {
            void speakOnce();
          }
        }, LOOP_GAP_MS);
      }
    });
  }

  stopLoop(): void {
    this.isSpeaking = false;
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
    this.removeFinishListener();
    Tts.stop();
  }

  stop(): void {
    this.stopLoop();
  }
}

export const ttsService = new TtsService();
