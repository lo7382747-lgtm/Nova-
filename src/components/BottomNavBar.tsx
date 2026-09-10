import React from 'react';
import { Home, MessageSquare, Activity, Settings, Cpu } from 'lucide-react';
import { ScreenType } from '../types';

interface BottomNavBarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  activityCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentScreen,
  onNavigate,
  activityCount = 0,
}) => {
  const tabs: { key: ScreenType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'chat', label: 'Chat', icon: MessageSquare },
    { key: 'automation', label: 'Automation', icon: Cpu },
    { key: 'activity', label: 'Activity', icon: Activity },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      id="android-bottom-nav"
      aria-label="Bottom Navigation"
      className="h-14 bg-[#0F0F0F] border-t border-teal-900/30 flex items-center justify-around px-2 shrink-0 z-40 select-none"
    >
      {tabs.map((tab) => {
        const isActive = currentScreen === tab.key || (tab.key === 'settings' && currentScreen === 'voice_enrollment');
        const IconComponent = tab.icon;

        return (
          <button
            key={tab.key}
            id={`nav-tab-${tab.key}`}
            onClick={() => onNavigate(tab.key)}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
              isActive ? 'text-teal-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {isActive && (
              <span className="absolute -top-1 w-8 h-0.5 bg-teal-400 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
            )}
            <div className="relative">
              <IconComponent className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
              {tab.key === 'activity' && activityCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] bg-teal-500 text-black font-bold text-[9px] rounded-full flex items-center justify-center px-0.5 shadow-sm">
                  {activityCount > 9 ? '9+' : activityCount}
                </span>
              )}
            </div>
            <span className={`text-[9px] mt-1 uppercase tracking-wider font-bold ${isActive ? 'text-teal-400' : 'text-gray-500'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
