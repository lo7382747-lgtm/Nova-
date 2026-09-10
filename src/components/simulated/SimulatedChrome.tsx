import React from 'react';
import {
  Search,
  RotateCw,
  MoreVertical,
  Lock,
  Sun,
  CloudSun,
  Wind,
  Droplets,
  ExternalLink,
} from 'lucide-react';

interface SimulatedChromeProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  isScrolled?: boolean;
}

export const SimulatedChrome: React.FC<SimulatedChromeProps> = ({
  searchQuery = 'weather',
  onSearchChange,
  isScrolled = false,
}) => {
  return (
    <div id="simulated-chrome-screen" className="flex-1 flex flex-col bg-[#121212] text-white select-none overflow-hidden">
      {/* Top Chrome Address Bar */}
      <div className="bg-[#1e1e1e] p-2.5 border-b border-white/10 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-[#2a2a2a] px-3 py-1.5 rounded-full border border-white/5">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={searchQuery ? `google.com/search?q=${encodeURIComponent(searchQuery)}` : 'google.com'}
            readOnly
            className="bg-transparent text-xs text-gray-200 w-full focus:outline-none truncate font-mono"
          />
        </div>
        <button className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-white rounded-lg hover:bg-white/5">
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <div className="w-6 h-6 rounded-md border border-gray-400 text-[10px] font-bold flex items-center justify-center text-gray-300">
          3
        </div>
        <button className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-white rounded-lg hover:bg-white/5">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Google Search Result Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Google Header Logo and Search Box */}
        <div className="flex items-center gap-2 py-1">
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-red-400 to-amber-400 bg-clip-text text-transparent">
            Google
          </span>
          <div className="flex-1 bg-[#252525] border border-white/10 rounded-full px-3 py-1 text-xs text-gray-300 flex items-center justify-between">
            <span className="font-medium text-white">{searchQuery || 'weather today'}</span>
            <Search className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>

        {/* Weather Knowledge Card (Google Weather UI) */}
        <div className="bg-gradient-to-br from-blue-900/60 via-slate-900 to-indigo-950/70 border border-blue-500/20 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider">San Francisco, CA</div>
              <div className="text-xs text-gray-400">Weather Forecast • Live</div>
            </div>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
              Updated just now
            </span>
          </div>

          {/* Big Temp and Condition */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <Sun className="w-12 h-12 text-amber-400 animate-spin-slow" />
              <div>
                <div className="text-4xl font-light text-white">72°<span className="text-xl text-gray-400">F</span></div>
                <div className="text-xs font-medium text-amber-300">Sunny & Clear</div>
              </div>
            </div>

            <div className="space-y-1 text-right text-[11px] text-gray-300">
              <div className="flex items-center justify-end gap-1">
                <Droplets className="w-3 h-3 text-cyan-400" />
                <span>Humidity: 48%</span>
              </div>
              <div className="flex items-center justify-end gap-1">
                <Wind className="w-3 h-3 text-teal-400" />
                <span>Wind: 9 mph NW</span>
              </div>
            </div>
          </div>

          {/* Hourly Forecast Pill Strip */}
          <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-white/10">
            {[
              { time: 'Now', temp: '72°', icon: Sun },
              { time: '12 PM', temp: '75°', icon: Sun },
              { time: '3 PM', temp: '74°', icon: CloudSun },
              { time: '6 PM', temp: '69°', icon: Sun },
              { time: '9 PM', temp: '62°', icon: CloudSun },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-black/30 rounded-xl p-1.5 text-center flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400">{item.time}</span>
                  <Icon className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-xs font-bold text-white">{item.temp}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search Result Links */}
        <div className="space-y-3 pt-1">
          <div className="bg-[#1a1a1a] p-3 rounded-xl border border-white/5 space-y-1">
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <span>weather.com</span>
              <span>› san-francisco</span>
            </div>
            <div className="text-xs font-bold text-blue-400 hover:underline">
              San Francisco, CA 10-Day Weather Forecast — The Weather Channel
            </div>
            <p className="text-[11px] text-gray-400 line-clamp-2">
              Be prepared with the most accurate 10-day forecast for San Francisco, CA with highs, lows, and chance of precipitation.
            </p>
          </div>

          <div className="bg-[#1a1a1a] p-3 rounded-xl border border-white/5 space-y-1">
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <span>accuweather.com</span>
              <span>› daily-forecast</span>
            </div>
            <div className="text-xs font-bold text-blue-400 hover:underline">
              San Francisco, CA Daily Weather | AccuWeather
            </div>
            <p className="text-[11px] text-gray-400 line-clamp-2">
              Know what's coming with AccuWeather's extended daily forecasts for San Francisco, CA. Up to 90 days of daily highs, lows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
