import React from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Send, CheckCheck } from 'lucide-react';

interface SimulatedMessagesProps {
  contactName?: string;
  phone?: string;
  draftMessage?: string;
  onSend?: () => void;
  onBack?: () => void;
}

export const SimulatedMessages: React.FC<SimulatedMessagesProps> = ({
  contactName = 'Rahul Sharma',
  phone = '+91 98765 43210',
  draftMessage = "I'm on my way",
  onSend,
  onBack,
}) => {
  return (
    <div id="simulated-messages-screen" className="flex-1 flex flex-col bg-[#141821] text-white select-none overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-[#1d2330] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-1 rounded-lg hover:bg-white/10 text-gray-300">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-sm text-white">
            {contactName.substring(0, 1)}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{contactName}</div>
            <div className="text-[10px] text-gray-400">{phone}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-300">
          <Phone className="w-4 h-4 hover:text-white cursor-pointer" />
          <Video className="w-4 h-4 hover:text-white cursor-pointer" />
          <MoreVertical className="w-4 h-4 hover:text-white cursor-pointer" />
        </div>
      </div>

      {/* Message Chat Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        <div className="text-center">
          <span className="text-[10px] bg-white/5 text-gray-400 px-2.5 py-1 rounded-full">
            Today • SMS
          </span>
        </div>

        {/* Incoming */}
        <div className="flex flex-col items-start max-w-[80%]">
          <div className="bg-[#242c3d] text-gray-100 text-xs px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow">
            Hey! Are you leaving soon? We're starting the meeting shortly.
          </div>
          <span className="text-[9px] text-gray-500 mt-1 ml-1">11:42 AM</span>
        </div>

        {/* Outgoing (Drafted / Sent) */}
        {draftMessage && (
          <div className="flex flex-col items-end self-end ml-auto max-w-[80%]">
            <div className="bg-blue-600 text-white text-xs px-3.5 py-2.5 rounded-2xl rounded-tr-sm shadow-md">
              {draftMessage}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-blue-300 mt-1 mr-1">
              <span>Delivered</span>
              <CheckCheck className="w-3 h-3" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom SMS Input Box */}
      <div className="p-3 bg-[#1d2330] border-t border-white/10 flex items-center gap-2 shrink-0">
        <div className="flex-1 bg-[#283244] rounded-full px-4 py-2 text-xs text-gray-200 border border-white/5 flex items-center justify-between">
          <input
            type="text"
            value={draftMessage || 'Text message (SMS)...'}
            readOnly
            className="bg-transparent text-xs text-gray-200 w-full focus:outline-none"
          />
          <span className="text-[9px] text-gray-400 font-mono shrink-0 ml-2">SMS</span>
        </div>
        <button
          onClick={onSend}
          className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white shadow-lg cursor-pointer transition-transform active:scale-95"
          title="Send SMS"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>
    </div>
  );
};
