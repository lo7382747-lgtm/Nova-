import React, { useState } from 'react';
import { Sparkles, Zap, MessageSquare, Clock, Music, Smartphone, Cpu } from 'lucide-react';

interface SmartActionChipsProps {
  onSelectSuggestion: (text: string) => void;
}

type CategoryType = 'hindi' | 'automation' | 'controls' | 'whatsapp' | 'alarms' | 'media';

interface SuggestionItem {
  icon: string;
  label: string;
  prompt: string;
}

const CATEGORIES: { id: CategoryType; label: string; icon: any }[] = [
  { id: 'hindi', label: 'Hindi / Hinglish', icon: Sparkles },
  { id: 'automation', label: 'Automation', icon: Cpu },
  { id: 'controls', label: 'Controls', icon: Zap },
  { id: 'whatsapp', label: 'WhatsApp & Calls', icon: MessageSquare },
  { id: 'alarms', label: 'Alarms', icon: Clock },
  { id: 'media', label: 'Media & Apps', icon: Music },
];

const SUGGESTIONS: Record<CategoryType, SuggestionItem[]> = {
  hindi: [
    { icon: '🤖', label: 'Automation Hub kholo', prompt: 'Android automation dikhao' },
    { icon: '🔦', label: 'Flashlight on karo', prompt: 'Flashlight on karo' },
    { icon: '💬', label: 'Priya ko WhatsApp bhejo', prompt: 'Priya ko WhatsApp bhejo' },
    { icon: '📞', label: 'Rahul ko call lagao', prompt: 'Rahul ko call lagao' },
    { icon: '⏰', label: 'Subah 7 baje ka alarm', prompt: 'Subah 7 baje ka alarm lagao' },
    { icon: '🔋', label: 'Battery kitni hai', prompt: 'Battery kitni hai' },
  ],
  automation: [
    { icon: '🤖', label: 'Automation Hub', prompt: 'Android automation hub open karo' },
    { icon: '🌅', label: 'Morning Routine', prompt: 'Run morning routine' },
    { icon: '🌙', label: 'Bedtime Routine', prompt: 'Activate bedtime sleep mode' },
    { icon: '🔋', label: 'Extreme Battery Saver', prompt: 'Battery bachao routine chalu karo' },
    { icon: '❤️', label: 'Instagram Auto-Like', prompt: 'Instagram auto like macro chalao' },
  ],
  controls: [
    { icon: '🔦', label: 'Torch On', prompt: 'Turn on flashlight' },
    { icon: '📶', label: 'Wi-Fi On', prompt: 'Turn on Wi-Fi' },
    { icon: '🔊', label: 'Volume 90%', prompt: 'Volume badhao' },
    { icon: '🔇', label: 'Mute Phone', prompt: 'Mute karo' },
    { icon: '📷', label: 'Camera', prompt: 'Camera kholo' },
    { icon: '⚙️', label: 'Settings', prompt: 'Settings kholo' },
  ],
  whatsapp: [
    { icon: '💬', label: 'WhatsApp Priya', prompt: 'Priya ko WhatsApp par message bhejo' },
    { icon: '💬', label: 'WhatsApp Rahul', prompt: 'Send a WhatsApp message to Rahul asking about updates' },
    { icon: '📞', label: 'Call Rahul', prompt: 'Call Rahul Sharma' },
    { icon: '📞', label: 'Call Priya', prompt: 'Call Priya Patel' },
    { icon: '✉️', label: 'SMS Rahul', prompt: 'Send SMS to Rahul' },
  ],
  alarms: [
    { icon: '⏰', label: 'Alarm 7:00 AM', prompt: 'Set alarm for 7:00 AM' },
    { icon: '⏰', label: 'Alarm 6:00 AM', prompt: 'Set alarm for 6:00 AM' },
    { icon: '⏱️', label: '5 Min Timer', prompt: 'Timer lagao 5 minute ka' },
    { icon: '⏱️', label: '10 Min Timer', prompt: 'Set a 10 minute timer' },
  ],
  media: [
    { icon: '🎵', label: 'Play Spotify', prompt: 'Play music on Spotify' },
    { icon: '▶️', label: 'Open YouTube', prompt: 'YouTube kholo' },
    { icon: '📷', label: 'Take Selfie', prompt: 'Photo khicho' },
    { icon: '🌤️', label: 'Weather Report', prompt: 'Mausam kaisa hai' },
    { icon: '✨', label: 'Who are you?', prompt: 'Tum kaun ho' },
  ],
};

export const SmartActionChips: React.FC<SmartActionChipsProps> = ({ onSelectSuggestion }) => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('hindi');

  return (
    <div id="smart-action-chips-container" className="w-full max-w-sm flex flex-col items-center gap-2 pt-1">
      {/* Category Tabs */}
      <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/[0.04] border border-white/5 overflow-x-auto max-w-full scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-2.5 h-2.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Suggestion Pills for Active Category */}
      <div className="flex flex-wrap justify-center gap-1.5 max-w-xs">
        {SUGGESTIONS[activeCategory].map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSuggestion(item.prompt)}
            className="text-[10px] font-semibold px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-teal-500/10 border border-white/10 hover:border-teal-500/40 text-gray-300 hover:text-teal-200 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <span>{item.icon}</span>
            <span>"{item.label}"</span>
          </button>
        ))}
      </div>
    </div>
  );
};
