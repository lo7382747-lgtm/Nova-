import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Home,
  Search,
  PlusSquare,
  Film,
  User,
  Sparkles,
} from 'lucide-react';

interface SimulatedInstagramProps {
  isLiked?: boolean;
  onToggleLike?: () => void;
  scrollOffset?: number;
}

export const SimulatedInstagram: React.FC<SimulatedInstagramProps> = ({
  isLiked = false,
  onToggleLike,
  scrollOffset = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: scrollOffset,
        behavior: 'smooth',
      });
    }
  }, [scrollOffset]);

  return (
    <div
      id="simulated-instagram-screen"
      className="flex-1 flex flex-col bg-black text-white select-none overflow-hidden"
    >
      {/* Instagram Header */}
      <div className="px-4 py-2.5 bg-black border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="font-serif italic font-bold text-xl tracking-tight bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 bg-clip-text text-transparent">
          Instagram
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleLike}
            className="relative cursor-pointer transition-transform active:scale-90"
            title="Like notification"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
            {isLiked && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>
          <button className="cursor-pointer">
            <Send className="w-5 h-5 text-white -rotate-12" />
          </button>
        </div>
      </div>

      {/* Stories Tray */}
      <div className="py-2.5 px-3 border-b border-white/10 flex items-center gap-3 overflow-x-hidden shrink-0 bg-neutral-950">
        {[
          { name: 'Your story', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', isYou: true },
          { name: 'sarah.k', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },
          { name: 'alex_99', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop' },
          { name: 'wander_ad', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
        ].map((story, i) => (
          <div key={i} className="flex flex-col items-center gap-1 shrink-0">
            <div className={`p-0.5 rounded-full ${story.isYou ? 'border border-dashed border-gray-500' : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'}`}>
              <img
                src={story.img}
                alt={story.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-black"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[10px] text-gray-300 truncate w-14 text-center">{story.name}</span>
          </div>
        ))}
      </div>

      {/* Feed Scrollable Stream */}
      <div ref={containerRef} className="flex-1 overflow-y-auto divide-y divide-white/10">
        {/* Post 1 */}
        <div className="pb-4">
          {/* Post Header */}
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop"
                alt="nature_explorer"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>nature_explorer</span>
                  <span className="text-blue-400 text-[10px]">●</span>
                </div>
                <div className="text-[10px] text-gray-400">Banff National Park, Alberta</div>
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </div>

          {/* Post Media */}
          <div className="relative aspect-square w-full bg-neutral-900 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&fit=crop"
              alt="Banff Mountain Lake"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Heart Pop Animation when Liked */}
            <AnimatePresence>
              {isLiked && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0] }}
                  transition={{ duration: 0.9, times: [0, 0.4, 1] }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Post Action Buttons */}
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={onToggleLike}
                  className="cursor-pointer transition-transform active:scale-125"
                  title="Like post"
                >
                  <Heart
                    className={`w-6 h-6 transition-colors ${
                      isLiked ? 'text-rose-500 fill-rose-500 animate-bounce' : 'text-white hover:text-rose-400'
                    }`}
                  />
                </button>
                <button className="cursor-pointer">
                  <MessageCircle className="w-6 h-6 text-white hover:text-gray-300" />
                </button>
                <button className="cursor-pointer">
                  <Send className="w-6 h-6 text-white -rotate-12 hover:text-gray-300" />
                </button>
              </div>
              <Bookmark className="w-6 h-6 text-white hover:text-gray-300" />
            </div>

            {/* Like Counter */}
            <div className="text-xs font-bold text-white">
              {isLiked ? '1,429 likes' : '1,428 likes'}
            </div>

            {/* Caption */}
            <div className="text-xs text-gray-200">
              <span className="font-bold text-white mr-1.5">nature_explorer</span>
              Golden sunset reflecting over emerald alpine waters. Pure tranquility 🏔️✨
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">
              View all 84 comments • 3 hours ago
            </div>
          </div>
        </div>

        {/* Post 2 (Visible when scrolled) */}
        <div className="pb-4">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop"
                alt="sarah_designs"
                className="w-8 h-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="text-xs font-bold text-white">sarah_designs</div>
                <div className="text-[10px] text-gray-400">Tokyo, Japan</div>
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </div>
          <div className="aspect-square w-full bg-neutral-900">
            <img
              src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&fit=crop"
              alt="Tokyo City Lights"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="p-3 bg-black border-t border-white/10 flex items-center justify-around shrink-0">
        <Home className="w-5 h-5 text-white" />
        <Search className="w-5 h-5 text-gray-400" />
        <PlusSquare className="w-5 h-5 text-gray-400" />
        <Film className="w-5 h-5 text-gray-400" />
        <User className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
};
