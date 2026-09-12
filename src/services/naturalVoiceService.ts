/**
 * Nova Natural Voice Engine
 * Provides crystal-clear, natural, human-like voice synthesis with:
 * - Asynchronous voice preloading and neural/natural voice ranking
 * - Hindi, Hinglish & English bilingual accent matching
 * - Speech clarity filtering (removes markdown noise, expands abbreviations)
 * - Anti-cutoff sentence segmentation for seamless continuous playback
 * - Biquad EQ filter for studio-grade vocal clarity
 */

import { VoicePersona } from '../types';

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  isNeural: boolean;
  isNatural: boolean;
  qualityScore: number;
}

export interface NaturalSpeechOptions {
  persona?: VoicePersona;
  rate?: number;
  pitch?: number;
  clarityEnhancer?: boolean;
  language?: 'auto' | 'en' | 'hi';
  preferredVoiceName?: string;
  useCloudTts?: boolean;
}

class NaturalVoiceService {
  private static instance: NaturalVoiceService;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;
  private currentUtteranceList: SpeechSynthesisUtterance[] = [];
  private isSpeaking = false;
  private audioContext: AudioContext | null = null;
  private activeSourceNode: AudioBufferSourceNode | null = null;

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  public static getInstance(): NaturalVoiceService {
    if (!NaturalVoiceService.instance) {
      NaturalVoiceService.instance = new NaturalVoiceService();
    }
    return NaturalVoiceService.instance;
  }

  private loadVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const available = window.speechSynthesis.getVoices();
    if (available && available.length > 0) {
      this.voices = available;
      this.voicesLoaded = true;
    }
  }

  public async getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
    if (this.voicesLoaded && this.voices.length > 0) {
      return this.voices;
    }
    this.loadVoices();
    if (this.voices.length > 0) {
      return this.voices;
    }

    // Wait for voiceschanged event if not ready yet
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve([]);
        return;
      }
      const timeout = setTimeout(() => {
        this.loadVoices();
        resolve(this.voices);
      }, 500);

      const handler = () => {
        clearTimeout(timeout);
        this.loadVoices();
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(this.voices);
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler);
    });
  }

  /**
   * Sanitizes text for natural, crystal-clear spoken audio:
   * - Eliminates markdown symbols (bold, italic, headers, bullet markers)
   * - Expands abbreviations into natural words
   * - Strips raw URLs and technical punctuation
   * - Removes emojis that cause synthetic stutter
   */
  public sanitizeForSpeech(text: string, clarityEnhancer = true): string {
    if (!text) return '';

    let clean = text;

    if (clarityEnhancer) {
      // Remove code blocks and inline code
      clean = clean.replace(/```[\s\S]*?```/g, 'Code block omitted.');
      clean = clean.replace(/`([^`]+)`/g, '$1');

      // Remove markdown links but keep text
      clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      // Remove raw URLs
      clean = clean.replace(/https?:\/\/[^\s]+/g, 'link');

      // Remove markdown decorators: bold, italics, strikethrough, headers
      clean = clean.replace(/[*#_~>]/g, '');

      // Clean list bullets at line starts
      clean = clean.replace(/^[\s]*[-•*]\s+/gm, '');
      clean = clean.replace(/^[\s]*\d+\.\s+/gm, '');

      // Expand common abbreviations for fluent, human cadence
      const expansions: [RegExp, string][] = [
        [/\bvs\.?\b/gi, 'versus'],
        [/\be\.g\.?,?\b/gi, 'for example'],
        [/\bi\.e\.?,?\b/gi, 'that is'],
        [/\bapprox\.?\b/gi, 'approximately'],
        [/\betc\.?\b/gi, 'and so on'],
        [/\bmin\.?\b/gi, 'minutes'],
        [/\bsec\.?\b/gi, 'seconds'],
        [/\bhrs?\.?\b/gi, 'hours'],
        [/\bapt\.?\b/gi, 'apartment'],
        [/\bdr\.?\b/gi, 'Doctor'],
        [/\bw\/\b/gi, 'with'],
        [/\bw\/o\b/gi, 'without'],
        [/\bWhatsApp\b/g, 'WhatsApp'],
      ];

      for (const [pattern, replacement] of expansions) {
        clean = clean.replace(pattern, replacement);
      }

      // Remove emojis to avoid robotic descriptions
      clean = clean.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

      // Normalize repetitive punctuation (e.g., "!!!" -> "!", "..." -> ". ")
      clean = clean.replace(/[!]{2,}/g, '!');
      clean = clean.replace(/[?]{2,}/g, '?');
      clean = clean.replace(/\.{2,}/g, '.');
      clean = clean.replace(/\s*([,;:.!?])\s*/g, '$1 ');
      clean = clean.replace(/\s+/g, ' ').trim();
    } else {
      clean = clean.replace(/[*#`_~]/g, '').trim();
    }

    return clean;
  }

  /**
   * Detects if the utterance contains Hindi / Hinglish phrases or Indian names
   */
  public detectLanguage(text: string): 'hi' | 'en' {
    const hindiHinglishKeywords = [
      /\b(hai|hain|karo|karein|kya|bhejo|bhej|bhejna|kaise|mera|meri|mere|aap|aapki|aapka|mujhe|hum|namaste|dhanyawad|shukriya|thik|theek|accha|achha|haan|nahi|nahin|sun|suno|kaho|bol|bolo|kaam|samay|waqt|madad|kripya)\b/i,
      /[\u0900-\u097F]/, // Devanagari Unicode range
    ];

    for (const kw of hindiHinglishKeywords) {
      if (kw.test(text)) {
        return 'hi';
      }
    }
    return 'en';
  }

  /**
   * Finds the highest-quality natural neural voice in the browser
   */
  public selectBestVoice(
    persona: VoicePersona = 'natural_warm',
    langPreference: 'auto' | 'en' | 'hi' = 'auto',
    sampleText = '',
    preferredVoiceName?: string
  ): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    if (this.voices.length === 0) {
      return null;
    }

    // 1. If explicit voice name matches
    if (preferredVoiceName) {
      const explicit = this.voices.find(
        (v) => v.name.toLowerCase() === preferredVoiceName.toLowerCase()
      );
      if (explicit) return explicit;
    }

    const detected = langPreference === 'auto' ? this.detectLanguage(sampleText) : langPreference;

    // Score all available voices
    const scored = this.voices.map((v) => {
      let score = 0;
      const lowerName = v.name.toLowerCase();
      const lowerLang = v.lang.toLowerCase();

      // Neural and Natural voices get top bonus
      if (lowerName.includes('natural')) score += 50;
      if (lowerName.includes('online')) score += 40;
      if (lowerName.includes('neural')) score += 40;
      if (lowerName.includes('enhanced') || lowerName.includes('premium')) score += 35;
      if (lowerName.includes('google')) score += 30;

      // Penalize known robotic, mechanical voices
      if (lowerName.includes('espeak') || lowerName.includes('desktop') || lowerName.includes('david')) {
        score -= 50;
      }

      // Persona & Language Alignment
      if (detected === 'hi' || persona === 'indian_bilingual') {
        if (lowerLang.startsWith('hi') || lowerName.includes('hindi') || lowerName.includes('हिन्दी')) {
          score += 80;
        } else if (lowerLang.includes('en-in') || lowerName.includes('india') || lowerName.includes('neerja')) {
          score += 70;
        }
      } else {
        // English Natural
        if (lowerLang.startsWith('en')) score += 20;
        if (lowerLang.includes('en-gb') || lowerLang.includes('en-us')) score += 15;

        if (persona === 'natural_warm') {
          // Warm British/US female voices (e.g. Google UK English Female, Jenny, Samantha)
          if (lowerName.includes('jenny')) score += 40;
          if (lowerName.includes('uk english female')) score += 45;
          if (lowerName.includes('samantha')) score += 35;
          if (lowerName.includes('serena') || lowerName.includes('victoria')) score += 30;
        } else if (persona === 'crystal_clear') {
          // Studio articulate voices (e.g. Aria, Google US English, Ava)
          if (lowerName.includes('aria')) score += 45;
          if (lowerName.includes('us english')) score += 35;
          if (lowerName.includes('ava')) score += 35;
        } else if (persona === 'calm_relaxed') {
          // Calm, slower cadence
          if (lowerName.includes('sonia') || lowerName.includes('kore')) score += 40;
        }
      }

      return { voice: v, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.voice || this.voices[0] || null;
  }

  /**
   * Splits long text into natural sentence fragments to prevent Chrome's 15s TTS cutoff bug
   */
  private splitIntoSentences(text: string): string[] {
    // Match sentence terminators with lookbehind
    const rawSegments = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
    const cleanSegments: string[] = [];

    for (const seg of rawSegments) {
      const trimmed = seg.trim();
      if (!trimmed) continue;
      // If segment is still extremely long (>200 chars), split by comma or semicolon
      if (trimmed.length > 200) {
        const subParts = trimmed.split(/([,;]\s+)/);
        let acc = '';
        for (const p of subParts) {
          if ((acc + p).length < 200) {
            acc += p;
          } else {
            if (acc.trim()) cleanSegments.push(acc.trim());
            acc = p;
          }
        }
        if (acc.trim()) cleanSegments.push(acc.trim());
      } else {
        cleanSegments.push(trimmed);
      }
    }

    return cleanSegments.length > 0 ? cleanSegments : [text];
  }

  /**
   * Speaks the text with crystal-clear human cadence
   */
  public async speak(
    rawText: string,
    options: NaturalSpeechOptions = {},
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    this.stop();

    const clarityEnhancer = options.clarityEnhancer !== false;
    const cleanText = this.sanitizeForSpeech(rawText, clarityEnhancer);

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) setTimeout(onEnd, 1000);
      return;
    }

    await this.getVoicesAsync();

    const persona = options.persona || 'natural_warm';
    const lang = options.language || 'auto';
    const voice = this.selectBestVoice(persona, lang, cleanText, options.preferredVoiceName);

    // Natural human cadence rates:
    // Rate 0.98 is the sweet spot: crystal clear articulation, neither rushed nor sluggish
    const rate = Math.max(0.8, Math.min(1.25, options.rate ?? 0.98));
    // Pitch 1.0 preserves natural vocal formant frequencies
    const pitch = Math.max(0.9, Math.min(1.1, options.pitch ?? 1.0));

    const sentences = this.splitIntoSentences(cleanText);
    this.currentUtteranceList = [];
    this.isSpeaking = true;

    if (onStart) onStart();

    let currentIndex = 0;

    const playNext = () => {
      if (!this.isSpeaking || currentIndex >= sentences.length) {
        this.isSpeaking = false;
        this.currentUtteranceList = [];
        if (onEnd) onEnd();
        return;
      }

      const segment = sentences[currentIndex];
      currentIndex++;

      const utterance = new SpeechSynthesisUtterance(segment);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1.0;

      utterance.onend = () => {
        // Micro-pause between sentences (40ms) mimics natural breathing
        setTimeout(playNext, 40);
      };

      utterance.onerror = (e) => {
        // Ignore cancelled errors from intentional stops
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          playNext();
        } else {
          this.isSpeaking = false;
          if (onEnd) onEnd();
        }
      };

      this.currentUtteranceList.push(utterance);
      window.speechSynthesis.speak(utterance);
    };

    playNext();
  }

  /**
   * Stop any current speech
   */
  public stop(): void {
    this.isSpeaking = false;
    this.currentUtteranceList = [];
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.activeSourceNode) {
      try {
        this.activeSourceNode.stop();
      } catch {}
      this.activeSourceNode = null;
    }
  }

  /**
   * Plays 24kHz PCM audio (from Gemini TTS) with a clarity equalizer
   */
  public async playPcmWithClarityEq(base64Audio: string, onEnd?: () => void): Promise<void> {
    this.stop();
    try {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx({ sampleRate: 24000 });
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const binaryString = atob(base64Audio);
      // Byte alignment safety check
      const len = binaryString.length - (binaryString.length % 2);
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer, 0, len / 2);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Studio Clarity Audio Filter:
      // High-pass filter at 90Hz to remove sub-bass muddiness/hum
      const highPass = this.audioContext.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 90;

      // Presence boost at 3200Hz for speech intelligibility & vocal clarity
      const presenceEq = this.audioContext.createBiquadFilter();
      presenceEq.type = 'peaking';
      presenceEq.frequency.value = 3200;
      presenceEq.Q.value = 1.2;
      presenceEq.gain.value = 2.5; // +2.5dB subtle crystal clarity boost

      // Connect pipeline: source -> highpass -> presenceEq -> destination
      source.connect(highPass);
      highPass.connect(presenceEq);
      presenceEq.connect(this.audioContext.destination);

      source.onended = () => {
        this.activeSourceNode = null;
        if (onEnd) onEnd();
      };

      this.activeSourceNode = source;
      source.start(0);
    } catch {
      if (onEnd) onEnd();
    }
  }

  /**
   * Test speech demonstration
   */
  public async testVoiceSample(
    persona: VoicePersona = 'calm_relaxed',
    rate = 0.92,
    pitch = 1.0,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    const sample =
      persona === 'indian_bilingual'
        ? 'Namaste Sir. Nova online aur aapki sewa mein taiyar hai. Batayein, main aapki kya madad kar sakta hoon?'
        : 'Good day, Sir. Nova online and fully operational. All systems are functioning within optimal parameters. How may I assist you today?';

    await this.speak(
      sample,
      {
        persona,
        rate,
        pitch,
        clarityEnhancer: true,
      },
      onStart,
      onEnd
    );
  }
}

export const naturalVoiceService = NaturalVoiceService.getInstance();
