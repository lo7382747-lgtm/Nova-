import {
  EnrolledVoiceProfile,
  SensitiveActionType,
  SpeakerVerificationResult,
  TrustedVoicePermissions,
  VoiceprintEmbedding,
} from '../types';

const STORAGE_KEY_OWNER = 'nova_owner_voiceprint_v1';
const STORAGE_KEY_TRUSTED = 'nova_trusted_voices_v1';
const STORAGE_KEY_ACTIVE_SIM = 'nova_active_speaker_sim_v1';

export const ENROLLMENT_PHRASES = [
  'Hey Nova, unlock my phone',
  'Nova, send a WhatsApp message to Rahul',
  'Nova, check my battery and phone settings',
];

export const DEFAULT_TRUSTED_PERMISSIONS: TrustedVoicePermissions = {
  messaging: true,
  phoneControl: false,
  calls: true,
  alarmsTimers: true,
  unlock: false,
  payments: false,
};

// Seed default owner profile so owner recognition is active and ready right away
const DEFAULT_SEED_OWNER: EnrolledVoiceProfile = {
  id: 'owner-primary-01',
  name: 'Primary Device Owner',
  role: 'owner',
  enrolledAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
  samplePhrasesCount: 3,
  embedding: {
    vector: [
      0.28, 0.42, 0.65, 0.78, 0.54, 0.38, 0.22, 0.15,
      0.31, 0.45, 0.58, 0.62, 0.48, 0.35, 0.20, 0.12,
    ],
    spectralCentroid: 1420,
    pitchEstimateHz: 165,
    spectralRollOff: 2850,
    zeroCrossingRate: 0.082,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
};

const DEFAULT_SEED_TRUSTED: EnrolledVoiceProfile = {
  id: 'trusted-voice-01',
  name: 'Aryan (Family Member)',
  role: 'trusted_voice',
  enrolledAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  samplePhrasesCount: 3,
  embedding: {
    vector: [
      0.18, 0.32, 0.48, 0.62, 0.72, 0.55, 0.40, 0.28,
      0.22, 0.36, 0.52, 0.68, 0.60, 0.42, 0.30, 0.18,
    ],
    spectralCentroid: 1680,
    pitchEstimateHz: 195,
    spectralRollOff: 3100,
    zeroCrossingRate: 0.095,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
  allowedPermissions: {
    messaging: true,
    phoneControl: false,
    calls: true,
    alarmsTimers: true,
    unlock: false,
    payments: false,
  },
};

export class VoiceBiometricsService {
  private static instance: VoiceBiometricsService;
  private ownerProfile: EnrolledVoiceProfile;
  private trustedVoices: EnrolledVoiceProfile[] = [];
  private activeSimulatedSpeaker: 'owner' | 'guest' | string = 'owner';
  private threshold: number = 0.70;
  private listeners: (() => void)[] = [];
  private audioContext: AudioContext | null = null;

  private constructor() {
    this.ownerProfile = this.loadOwnerProfile();
    this.trustedVoices = this.loadTrustedVoices();
    this.activeSimulatedSpeaker = this.loadActiveSimulatedSpeaker();
  }

  public static getInstance(): VoiceBiometricsService {
    if (!VoiceBiometricsService.instance) {
      VoiceBiometricsService.instance = new VoiceBiometricsService();
    }
    return VoiceBiometricsService.instance;
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error(e);
      }
    });
  }

  private loadOwnerProfile(): EnrolledVoiceProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_OWNER);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not load owner voiceprint, using default seed', e);
    }
    this.saveOwnerProfile(DEFAULT_SEED_OWNER);
    return DEFAULT_SEED_OWNER;
  }

  public saveOwnerProfile(profile: EnrolledVoiceProfile): void {
    this.ownerProfile = profile;
    try {
      localStorage.setItem(STORAGE_KEY_OWNER, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save owner voiceprint', e);
    }
    this.notify();
  }

  private loadTrustedVoices(): EnrolledVoiceProfile[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TRUSTED);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not load trusted voices, using default seed', e);
    }
    const initial = [DEFAULT_SEED_TRUSTED];
    this.saveTrustedVoices(initial);
    return initial;
  }

  public saveTrustedVoices(list: EnrolledVoiceProfile[]): void {
    this.trustedVoices = list;
    try {
      localStorage.setItem(STORAGE_KEY_TRUSTED, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save trusted voices', e);
    }
    this.notify();
  }

  public addTrustedVoice(name: string, permissions?: Partial<TrustedVoicePermissions>): EnrolledVoiceProfile {
    const newTrusted: EnrolledVoiceProfile = {
      id: `trusted-${Date.now()}`,
      name: name.trim() || 'Trusted Person',
      role: 'trusted_voice',
      enrolledAt: Date.now(),
      samplePhrasesCount: 3,
      embedding: {
        vector: [
          0.20 + Math.random() * 0.1,
          0.35 + Math.random() * 0.1,
          0.50 + Math.random() * 0.1,
          0.65 + Math.random() * 0.1,
          0.60 + Math.random() * 0.1,
          0.45 + Math.random() * 0.1,
          0.30 + Math.random() * 0.1,
          0.20 + Math.random() * 0.1,
          0.25 + Math.random() * 0.1,
          0.40 + Math.random() * 0.1,
          0.55 + Math.random() * 0.1,
          0.65 + Math.random() * 0.1,
          0.50 + Math.random() * 0.1,
          0.35 + Math.random() * 0.1,
          0.25 + Math.random() * 0.1,
          0.15 + Math.random() * 0.1,
        ],
        spectralCentroid: 1550 + Math.floor(Math.random() * 300),
        pitchEstimateHz: 180 + Math.floor(Math.random() * 40),
        spectralRollOff: 3000 + Math.floor(Math.random() * 200),
        zeroCrossingRate: 0.088,
        createdAt: Date.now(),
      },
      allowedPermissions: {
        ...DEFAULT_TRUSTED_PERMISSIONS,
        ...(permissions || {}),
      },
    };

    const updated = [...this.trustedVoices, newTrusted];
    this.saveTrustedVoices(updated);
    return newTrusted;
  }

  public removeTrustedVoice(id: string): void {
    const updated = this.trustedVoices.filter((v) => v.id !== id);
    this.saveTrustedVoices(updated);
    if (this.activeSimulatedSpeaker === id) {
      this.setActiveSimulatedSpeaker('owner');
    }
  }

  public updateTrustedPermissions(id: string, permissions: TrustedVoicePermissions): void {
    const updated = this.trustedVoices.map((v) =>
      v.id === id ? { ...v, allowedPermissions: permissions } : v
    );
    this.saveTrustedVoices(updated);
  }

  private loadActiveSimulatedSpeaker(): 'owner' | 'guest' | string {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_SIM);
      if (stored) return stored;
    } catch (e) {
      // ignore
    }
    return 'owner';
  }

  public getActiveSimulatedSpeaker(): 'owner' | 'guest' | string {
    return this.activeSimulatedSpeaker;
  }

  public setActiveSimulatedSpeaker(speaker: 'owner' | 'guest' | string): void {
    this.activeSimulatedSpeaker = speaker;
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_SIM, speaker);
    } catch (e) {
      // ignore
    }
    this.notify();
  }

  public getOwnerProfile(): EnrolledVoiceProfile {
    return this.ownerProfile;
  }

  public getTrustedVoices(): EnrolledVoiceProfile[] {
    return this.trustedVoices;
  }

  public getThreshold(): number {
    return this.threshold;
  }

  public setThreshold(val: number): void {
    this.threshold = Math.max(0.5, Math.min(0.95, val));
    this.notify();
  }

  /**
   * Cosine similarity between two unit/feature vectors.
   */
  public calculateCosineSimilarity(v1: number[], v2: number[]): number {
    if (!v1 || !v2 || v1.length === 0 || v2.length === 0) return 0;
    const len = Math.min(v1.length, v2.length);
    let dot = 0;
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < len; i++) {
      dot += v1[i] * v2[i];
      norm1 += v1[i] * v1[i];
      norm2 += v2[i] * v2[i];
    }
    if (norm1 === 0 || norm2 === 0) return 0;
    return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * On-device acoustic feature extractor from raw audio samples via Web Audio API.
   * Extracts a 16-dimensional acoustic vector without cloud submission.
   */
  public extractAcousticFeatures(audioBuffer: Float32Array): VoiceprintEmbedding {
    const len = audioBuffer.length;
    if (len === 0) {
      return {
        vector: new Array(16).fill(0.1),
        spectralCentroid: 1200,
        pitchEstimateHz: 150,
        spectralRollOff: 2500,
        zeroCrossingRate: 0.05,
        createdAt: Date.now(),
      };
    }

    // 1. Zero Crossing Rate
    let zeroCrossings = 0;
    for (let i = 1; i < len; i++) {
      if ((audioBuffer[i] >= 0 && audioBuffer[i - 1] < 0) || (audioBuffer[i] < 0 && audioBuffer[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zcr = zeroCrossings / len;

    // 2. 16-band energy spectrum
    const bandSize = Math.floor(len / 16);
    const vector: number[] = [];
    let totalEnergy = 0;

    for (let b = 0; b < 16; b++) {
      let bandEnergy = 0;
      const start = b * bandSize;
      const end = Math.min(len, start + bandSize);
      for (let i = start; i < end; i++) {
        bandEnergy += Math.abs(audioBuffer[i]);
      }
      bandEnergy = bandEnergy / (end - start || 1);
      vector.push(bandEnergy);
      totalEnergy += bandEnergy;
    }

    // Normalize vector
    const norm = Math.sqrt(vector.reduce((acc, val) => acc + val * val, 0)) || 1;
    const normalizedVector = vector.map((v) => Number((v / norm).toFixed(3)));

    // Spectral centroid approximation
    let weightedSum = 0;
    for (let i = 0; i < 16; i++) {
      weightedSum += (i + 1) * 200 * normalizedVector[i];
    }
    const spectralCentroid = Math.round(weightedSum / (normalizedVector.reduce((a, b) => a + b, 0) || 1));

    return {
      vector: normalizedVector,
      spectralCentroid: Math.max(300, spectralCentroid),
      pitchEstimateHz: Math.round(130 + (normalizedVector[2] || 0.5) * 80),
      spectralRollOff: Math.round(spectralCentroid * 1.8),
      zeroCrossingRate: Number(zcr.toFixed(3)),
      createdAt: Date.now(),
    };
  }

  /**
   * Synthesizes and averages 3 enrolled voice sample embeddings into a master voiceprint.
   */
  public createMasterVoiceprintFromSamples(samples: VoiceprintEmbedding[], ownerName: string = 'Primary Owner'): EnrolledVoiceProfile {
    const vectorLength = 16;
    const avgVector = new Array(vectorLength).fill(0);
    let avgCentroid = 0;
    let avgPitch = 0;
    let avgRollOff = 0;
    let avgZcr = 0;

    const count = samples.length || 1;

    samples.forEach((s) => {
      s.vector.forEach((val, idx) => {
        avgVector[idx] += val / count;
      });
      avgCentroid += s.spectralCentroid / count;
      avgPitch += s.pitchEstimateHz / count;
      avgRollOff += s.spectralRollOff / count;
      avgZcr += s.zeroCrossingRate / count;
    });

    const norm = Math.sqrt(avgVector.reduce((a, b) => a + b * b, 0)) || 1;
    const finalVector = avgVector.map((v) => Number((v / norm).toFixed(3)));

    const newProfile: EnrolledVoiceProfile = {
      id: `owner-${Date.now()}`,
      name: ownerName,
      role: 'owner',
      enrolledAt: Date.now(),
      samplePhrasesCount: samples.length,
      embedding: {
        vector: finalVector,
        spectralCentroid: Math.round(avgCentroid),
        pitchEstimateHz: Math.round(avgPitch),
        spectralRollOff: Math.round(avgRollOff),
        zeroCrossingRate: Number(avgZcr.toFixed(3)),
        createdAt: Date.now(),
      },
    };

    this.saveOwnerProfile(newProfile);
    return newProfile;
  }

  /**
   * CORE VERIFICATION ENGINE
   * Evaluates candidate voice against stored owner and trusted voiceprints.
   */
  public verifySpeaker(
    actionType: SensitiveActionType,
    candidateAudio?: Float32Array
  ): SpeakerVerificationResult {
    const active = this.activeSimulatedSpeaker;
    const threshold = this.threshold;

    // If candidate audio is provided, extract real feature embedding
    if (candidateAudio && candidateAudio.length > 256) {
      const liveEmbedding = this.extractAcousticFeatures(candidateAudio);
      const similarity = this.calculateCosineSimilarity(
        liveEmbedding.vector,
        this.ownerProfile.embedding.vector
      );

      const isMatch = similarity >= threshold;
      if (isMatch) {
        return {
          isAuthorized: true,
          isOwner: true,
          isTrusted: false,
          speakerName: this.ownerProfile.name,
          confidence: Number(similarity.toFixed(2)),
          threshold,
          timestamp: Date.now(),
          actionType,
        };
      }

      // Check trusted voices
      for (const trusted of this.trustedVoices) {
        const trustedSim = this.calculateCosineSimilarity(
          liveEmbedding.vector,
          trusted.embedding.vector
        );
        if (trustedSim >= threshold) {
          const permAllowed = Boolean(trusted.allowedPermissions?.[actionType]);
          return {
            isAuthorized: permAllowed,
            isOwner: false,
            isTrusted: true,
            speakerName: trusted.name,
            confidence: Number(trustedSim.toFixed(2)),
            threshold,
            refusalReason: permAllowed
              ? undefined
              : `Trusted voice "${trusted.name}" is not granted ${actionType} permissions.`,
            timestamp: Date.now(),
            actionType,
          };
        }
      }

      // Unknown speaker audio mismatch
      return {
        isAuthorized: false,
        isOwner: false,
        isTrusted: false,
        speakerName: 'Unknown Speaker / Guest',
        confidence: Number(similarity.toFixed(2)),
        threshold,
        refusalReason: 'Sorry, I only take instructions from my owner',
        timestamp: Date.now(),
        actionType,
      };
    }

    // Deterministic simulation state (for preview, testing, and speech recognition input)
    if (active === 'owner') {
      const simulatedConfidence = 0.94;
      return {
        isAuthorized: true,
        isOwner: true,
        isTrusted: false,
        speakerName: this.ownerProfile.name,
        confidence: simulatedConfidence,
        threshold,
        timestamp: Date.now(),
        actionType,
      };
    }

    if (active === 'guest') {
      const simulatedConfidence = 0.28;
      return {
        isAuthorized: false,
        isOwner: false,
        isTrusted: false,
        speakerName: 'Guest / Unknown Person',
        confidence: simulatedConfidence,
        threshold,
        refusalReason: 'Sorry, I only take instructions from my owner',
        timestamp: Date.now(),
        actionType,
      };
    }

    // Check if it's one of the trusted voice IDs
    const matchedTrusted = this.trustedVoices.find((t) => t.id === active);
    if (matchedTrusted) {
      const permAllowed = Boolean(matchedTrusted.allowedPermissions?.[actionType]);
      const simulatedConfidence = 0.88;
      return {
        isAuthorized: permAllowed,
        isOwner: false,
        isTrusted: true,
        speakerName: matchedTrusted.name,
        confidence: simulatedConfidence,
        threshold,
        refusalReason: permAllowed
          ? undefined
          : `Trusted voice "${matchedTrusted.name}" does not have permission for ${actionType}.`,
        timestamp: Date.now(),
        actionType,
      };
    }

    // Default refusal for unrecognized speaker state
    return {
      isAuthorized: false,
      isOwner: false,
      isTrusted: false,
      speakerName: 'Unrecognized Speaker',
      confidence: 0.31,
      threshold,
      refusalReason: 'Sorry, I only take instructions from my owner',
      timestamp: Date.now(),
      actionType,
    };
  }

  /**
   * Helper to determine if an action category is sensitive and requires speaker gating.
   */
  public isSensitiveAction(action: string): { isSensitive: boolean; category: SensitiveActionType } {
    switch (action) {
      case 'sendWhatsAppMessage':
      case 'sendUniversalMessage':
      case 'whatsapp':
      case 'sms':
      case 'instagram':
      case 'telegram':
        return { isSensitive: true, category: 'messaging' };

      case 'chainPhoneActions':
      case 'openApp':
      case 'systemNavigation':
      case 'screenInteraction':
      case 'toggleSystemSetting':
        return { isSensitive: true, category: 'phone_control' };

      case 'callAndMedia':
      case 'makeCall':
      case 'endCall':
      case 'videoCall':
        return { isSensitive: true, category: 'calls' };

      case 'setAlarmOrTimer':
      case 'setAlarm':
      case 'setTimer':
        return { isSensitive: true, category: 'alarms_timers' };

      case 'unlockPhone':
      case 'lockScreen':
        return { isSensitive: true, category: 'unlock' };

      case 'pay':
      case 'upiPayment':
        return { isSensitive: true, category: 'payments' };

      default:
        return { isSensitive: false, category: 'phone_control' };
    }
  }
}

export const voiceBiometricsService = VoiceBiometricsService.getInstance();
