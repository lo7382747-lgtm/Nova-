import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Users,
  Lock,
  RotateCcw,
  Sliders,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Info,
  Radio,
} from 'lucide-react';
import {
  voiceBiometricsService,
} from '../services/voiceBiometricsService';
import {
  UserSettings,
  EnrolledVoiceProfile,
  TrustedVoicePermissions,
} from '../types';
import { VoiceEnrollmentModal } from './VoiceEnrollmentModal';

interface OwnerRecognitionCardProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onNavigateToVoiceEnrollment?: () => void;
}

export const OwnerRecognitionCard: React.FC<OwnerRecognitionCardProps> = ({
  settings,
  onUpdateSettings,
  onNavigateToVoiceEnrollment,
}) => {
  const [showEnrollmentModal, setShowEnrollmentModal] = useState<boolean>(false);
  const [enrollmentMode, setEnrollmentMode] = useState<'owner' | 'trusted'>('owner');
  const [trustedVoices, setTrustedVoices] = useState<EnrolledVoiceProfile[]>(
    voiceBiometricsService.getTrustedVoices()
  );
  const [ownerProfile, setOwnerProfile] = useState<EnrolledVoiceProfile>(
    voiceBiometricsService.getOwnerProfile()
  );
  const [activeSpeaker, setActiveSpeaker] = useState<'owner' | 'guest' | string>(
    voiceBiometricsService.getActiveSimulatedSpeaker()
  );
  const [threshold, setThreshold] = useState<number>(
    settings.voiceVerificationThreshold ?? voiceBiometricsService.getThreshold()
  );
  const [isAddingTrusted, setIsAddingTrusted] = useState<boolean>(false);
  const [newTrustedName, setNewTrustedName] = useState<string>('');

  useEffect(() => {
    const unsub = voiceBiometricsService.subscribe(() => {
      setOwnerProfile(voiceBiometricsService.getOwnerProfile());
      setTrustedVoices(voiceBiometricsService.getTrustedVoices());
      setActiveSpeaker(voiceBiometricsService.getActiveSimulatedSpeaker());
    });
    return unsub;
  }, []);

  const handleToggleRecognition = (enabled: boolean) => {
    onUpdateSettings({
      ...settings,
      ownerRecognitionEnabled: enabled,
    });
  };

  const handleThresholdChange = (val: number) => {
    setThreshold(val);
    voiceBiometricsService.setThreshold(val);
    onUpdateSettings({
      ...settings,
      voiceVerificationThreshold: val,
    });
  };

  const handleSpeakerChange = (speaker: 'owner' | 'guest' | string) => {
    setActiveSpeaker(speaker);
    voiceBiometricsService.setActiveSimulatedSpeaker(speaker);
    onUpdateSettings({
      ...settings,
      activeSpeakerSimulated: (speaker === 'owner' || speaker === 'guest' || speaker === 'trusted') ? (speaker as any) : 'trusted',
    });
  };

  const handleAddTrustedVoice = () => {
    if (!newTrustedName.trim()) return;
    const added = voiceBiometricsService.addTrustedVoice(newTrustedName.trim());
    setNewTrustedName('');
    setIsAddingTrusted(false);
    onUpdateSettings({
      ...settings,
      trustedVoices: voiceBiometricsService.getTrustedVoices(),
    });
  };

  const handleRemoveTrusted = (id: string) => {
    voiceBiometricsService.removeTrustedVoice(id);
    onUpdateSettings({
      ...settings,
      trustedVoices: voiceBiometricsService.getTrustedVoices(),
    });
  };

  const handleTogglePermission = (
    trustedId: string,
    key: keyof TrustedVoicePermissions,
    val: boolean
  ) => {
    const trusted = trustedVoices.find((t) => t.id === trustedId);
    if (!trusted || !trusted.allowedPermissions) return;
    const updated = {
      ...trusted.allowedPermissions,
      [key]: val,
    };
    voiceBiometricsService.updateTrustedPermissions(trustedId, updated);
    onUpdateSettings({
      ...settings,
      trustedVoices: voiceBiometricsService.getTrustedVoices(),
    });
  };

  const isEnabled = settings.ownerRecognitionEnabled ?? true;

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-400 flex items-center gap-1.5 px-1">
        <Fingerprint className="w-3.5 h-3.5" />
        Voice-Based Owner Recognition
      </div>

      <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 space-y-4">
        {/* Main Toggle (ON by default) */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Owner Voice Verification</span>
              {isEnabled && (
                <span className="text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/40 px-1.5 py-0.5 rounded font-mono">
                  Enforced
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-0.5 max-w-[250px]">
              Nova only executes sensitive commands from your verified voiceprint. Refuses stranger voices politely.
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="owner-recognition-toggle"
              checked={isEnabled}
              onChange={(e) => handleToggleRecognition(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-black/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
          </label>
        </div>

        <div className="h-[1px] bg-white/5" />

        {/* Owner Voiceprint Status & Re-Record Option */}
        <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{ownerProfile.name}</span>
                  <span className="text-[9px] bg-teal-950/60 text-teal-300 border border-teal-800/60 px-1.5 py-0.2 rounded">
                    Owner Profile
                  </span>
                </div>
                <div className="text-[10px] font-mono text-gray-400">
                  {ownerProfile.samplePhrasesCount} Phrases • 16-band MFCC Vector • On-Device
                </div>
              </div>
            </div>

            <button
              type="button"
              id="rerecord-voice-btn"
              onClick={() => {
                if (onNavigateToVoiceEnrollment) {
                  onNavigateToVoiceEnrollment();
                } else {
                  setEnrollmentMode('owner');
                  setShowEnrollmentModal(true);
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Voice Enrollment (3 Clips)</span>
            </button>
          </div>
        </div>

        {/* Live Speaker Simulation Switcher (For instant testing of Owner vs Stranger vs Trusted) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              Current Speaker (Test Switcher):
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              {activeSpeaker === 'owner'
                ? 'Owner Voice (Match ~94%)'
                : activeSpeaker === 'guest'
                ? 'Stranger Voice (Mismatch ~28%)'
                : 'Trusted Voice (Partial)'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/60 rounded-xl border border-white/10">
            <button
              type="button"
              id="speaker-sim-owner-btn"
              onClick={() => handleSpeakerChange('owner')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                activeSpeaker === 'owner'
                  ? 'bg-teal-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                Owner
              </span>
              <span className="text-[9px] opacity-80 font-mono">Authorized</span>
            </button>

            <button
              type="button"
              id="speaker-sim-guest-btn"
              onClick={() => handleSpeakerChange('guest')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                activeSpeaker === 'guest'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Stranger / Guest
              </span>
              <span className="text-[9px] opacity-80 font-mono">Refused 🛑</span>
            </button>

            {trustedVoices.length > 0 ? (
              <button
                type="button"
                id="speaker-sim-trusted-btn"
                onClick={() => handleSpeakerChange(trustedVoices[0].id)}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  activeSpeaker === trustedVoices[0].id
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Trusted Voice
                </span>
                <span className="text-[9px] opacity-80 font-mono">Custom Perms</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingTrusted(true)}
                className="py-2 px-2 rounded-lg text-[11px] font-medium text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Trusted</span>
              </button>
            )}
          </div>
        </div>

        {/* Verification Sensitivity Slider */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-medium flex items-center gap-1">
              <Sliders className="w-3 h-3 text-teal-400" />
              Biometric Match Threshold:
            </span>
            <span className="font-mono text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded text-[11px]">
              {Math.round(threshold * 100)}% ({threshold >= 0.8 ? 'Strict' : threshold >= 0.65 ? 'Balanced' : 'Permissive'})
            </span>
          </div>
          <input
            type="range"
            min="0.50"
            max="0.90"
            step="0.05"
            value={threshold}
            onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-teal-400"
          />
        </div>

        <div className="h-[1px] bg-white/5" />

        {/* Section: Trusted Voices (Family Members with Custom Access) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>Trusted Voices ({trustedVoices.length})</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Family members with limited permissions decided by owner
              </div>
            </div>

            <button
              type="button"
              id="add-trusted-voice-btn"
              onClick={() => setIsAddingTrusted(!isAddingTrusted)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-teal-300 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Add Trusted Voice Input Form */}
          {isAddingTrusted && (
            <div className="p-3 rounded-xl bg-black/60 border border-teal-500/30 space-y-2">
              <div className="text-xs font-bold text-teal-300">Add Trusted Voice Profile</div>
              <input
                type="text"
                placeholder="Name (e.g., Aryan - Brother)"
                value={newTrustedName}
                onChange={(e) => setNewTrustedName(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-400"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingTrusted(false)}
                  className="px-3 py-1 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddTrustedVoice}
                  className="px-3.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold uppercase tracking-wider"
                >
                  Save &amp; Enroll
                </button>
              </div>
            </div>
          )}

          {/* List of Trusted Voices */}
          <div className="space-y-2">
            {trustedVoices.map((tv) => (
              <div
                key={tv.id}
                className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold">
                      {tv.name[0]}
                    </div>
                    <span className="text-xs font-bold text-white">{tv.name}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveTrusted(tv.id)}
                    className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove trusted voice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Granular Permissions Checkbox Badges */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-semibold block">
                    Allowed Actions for {tv.name}:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {[
                      { key: 'messaging', label: 'Send Messages' },
                      { key: 'calls', label: 'Make Phone Calls' },
                      { key: 'phoneControl', label: 'Phone Control' },
                      { key: 'alarmsTimers', label: 'Alarms & Timers' },
                    ].map(({ key, label }) => {
                      const allowed = Boolean(tv.allowedPermissions?.[key as keyof TrustedVoicePermissions]);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            handleTogglePermission(
                              tv.id,
                              key as keyof TrustedVoicePermissions,
                              !allowed
                            )
                          }
                          className={`px-2 py-1 rounded-lg border text-[10px] font-semibold flex items-center justify-between transition-colors ${
                            allowed
                              ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <span>{label}</span>
                          <span>{allowed ? '✓' : '✗'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Policy Information Note */}
        <div className="p-3 rounded-xl bg-teal-950/20 border border-teal-900/30 text-[11px] text-gray-300 space-y-1 leading-relaxed">
          <div className="text-teal-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Protected Action Scope</span>
          </div>
          <p>
            <strong className="text-white">Sensitive Gated Actions:</strong> WhatsApp, SMS, Instagram, calls, phone settings toggles, touches, and automations.
          </p>
          <p>
            <strong className="text-white">Open Actions:</strong> General chat questions, weather reports, news, and battery status remain open to anyone.
          </p>
        </div>
      </div>

      {/* Voice Enrollment Wizard Modal */}
      <VoiceEnrollmentModal
        isOpen={showEnrollmentModal}
        onClose={() => setShowEnrollmentModal(false)}
        mode={enrollmentMode}
        onEnrollmentComplete={(profile) => {
          if (enrollmentMode === 'owner') {
            setOwnerProfile(profile);
            onUpdateSettings({
              ...settings,
              ownerVoiceprint: profile,
            });
          }
        }}
      />
    </div>
  );
};
