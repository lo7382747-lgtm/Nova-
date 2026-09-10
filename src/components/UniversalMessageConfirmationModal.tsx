import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  X,
  Edit3,
  MessageCircle,
  MessageSquare,
  Instagram,
  SendHorizontal,
  AlertCircle,
  User,
  Phone,
  Check,
} from 'lucide-react';
import { Contact, UniversalMessageConfirmationState, MessagingApp } from '../types';

interface UniversalMessageConfirmationModalProps {
  state: UniversalMessageConfirmationState;
  onConfirm: (finalMessage: string, selectedContact?: Contact) => void;
  onCancel: () => void;
  onSelectContact: (contact: Contact) => void;
  isWhatsAppInstalled?: boolean;
}

export const UniversalMessageConfirmationModal: React.FC<UniversalMessageConfirmationModalProps> = ({
  state,
  onConfirm,
  onCancel,
  onSelectContact,
  isWhatsAppInstalled = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(state.message);

  if (!state.isOpen) return null;

  const activeContact = state.resolvedContact;
  const isPickerMode = state.mode === 'pick_contact' && (state.candidateMatches?.length || 0) > 1;

  const handleSend = () => {
    onConfirm(editedMessage.trim() || state.message, activeContact);
  };

  const getAppMeta = (app: MessagingApp) => {
    switch (app) {
      case 'whatsapp':
        return {
          title: 'WhatsApp Message',
          packageName: 'com.whatsapp',
          icon: MessageCircle,
          color: 'from-emerald-600 to-teal-500',
          badgeBg: 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300',
          btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-black',
        };
      case 'sms':
        return {
          title: 'SMS Text Message',
          packageName: 'com.google.android.apps.messaging',
          icon: MessageSquare,
          color: 'from-blue-600 to-cyan-500',
          badgeBg: 'bg-blue-950/60 border-blue-800/60 text-blue-300',
          btnBg: 'bg-blue-600 hover:bg-blue-500 text-white',
        };
      case 'instagram':
        return {
          title: 'Instagram Direct Message',
          packageName: 'com.instagram.android',
          icon: Instagram,
          color: 'from-amber-500 via-rose-500 to-purple-600',
          badgeBg: 'bg-rose-950/60 border-rose-800/60 text-rose-300',
          btnBg: 'bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-90 text-white',
        };
      case 'telegram':
        return {
          title: 'Telegram Message',
          packageName: 'org.telegram.messenger',
          icon: SendHorizontal,
          color: 'from-sky-500 to-blue-600',
          badgeBg: 'bg-sky-950/60 border-sky-800/60 text-sky-300',
          btnBg: 'bg-sky-500 hover:bg-sky-400 text-white',
        };
    }
  };

  const appMeta = getAppMeta(state.app || 'whatsapp');
  const AppIcon = appMeta.icon;

  return (
    <AnimatePresence>
      <div
        id="universal-message-confirmation-backdrop"
        className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn select-none"
      >
        <motion.div
          id="universal-message-confirmation-dialog"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-sm bg-[#0F0F0F] border border-teal-900/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header Banner */}
          <div className="bg-[#161616] border-b border-teal-900/30 px-5 py-3.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${appMeta.color} text-white font-bold flex items-center justify-center shadow-md`}>
                <AppIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em]">
                  {isPickerMode ? `Select Contact (${appMeta.title})` : `Confirm ${appMeta.title}`}
                </h3>
                <p className="text-[10px] font-mono text-teal-400 uppercase tracking-widest mt-0.5">
                  Safety Guardrail • Mandatory Approval
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-gray-400 hover:text-white cursor-pointer"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {/* Multiple contact matches mode */}
            {isPickerMode ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-300">
                  Multiple contacts matched <span className="font-bold text-teal-300">"{state.contactName}"</span>. Select one to proceed:
                </p>
                <div className="space-y-2">
                  {state.candidateMatches?.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => onSelectContact(contact)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#161616] hover:bg-black/60 border border-white/5 hover:border-teal-900/40 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white"
                          style={{ backgroundColor: contact.avatarColor }}
                        >
                          {contact.initials}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white group-hover:text-teal-300">
                            {contact.name}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-teal-500" />
                            {contact.phone}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-teal-400 group-hover:translate-x-1 transition-transform">
                        Select →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Single / Resolved Contact Mode */
              <>
                {/* Contact Card Preview */}
                <div className="p-3.5 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-inner"
                      style={{
                        backgroundColor: activeContact?.avatarColor || '#14b8a6',
                      }}
                    >
                      {activeContact?.initials || state.contactName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{activeContact?.name || state.contactName}</span>
                        {activeContact && (
                          <span className="text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.5 rounded-md font-mono">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-teal-500" />
                        {activeContact?.phone || state.phone || 'Phone number not linked'}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded-lg border ${appMeta.badgeBg}`}>
                    {state.app.toUpperCase()}
                  </span>
                </div>

                {/* Message Content Bubble */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="uppercase tracking-widest text-[10px] font-bold text-teal-400">Message Content</span>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-1 text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditing ? 'Done Editing' : 'Edit Text'}</span>
                    </button>
                  </div>

                  {isEditing ? (
                    <textarea
                      value={editedMessage}
                      onChange={(e) => setEditedMessage(e.target.value)}
                      rows={3}
                      className="w-full bg-[#161616] border border-teal-500/50 rounded-2xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                      placeholder="Type your message here..."
                      autoFocus
                    />
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-teal-950/20 border border-teal-900/40 text-xs text-gray-100 italic leading-relaxed">
                      "{editedMessage || state.message}"
                    </div>
                  )}
                </div>

                {/* Intent Details Footer */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px] text-gray-400 font-mono space-y-0.5">
                  <div className="text-gray-300 font-medium">Intent Target:</div>
                  <div className="truncate text-teal-400">Package: {appMeta.packageName}</div>
                  <div className="truncate text-gray-500">Zero accidental send guarantee</div>
                </div>
              </>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="p-4 bg-[#161616] border-t border-teal-900/30 flex items-center gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            {!isPickerMode && (
              <button
                onClick={handleSend}
                className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${appMeta.btnBg}`}
              >
                <span>Send Now</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
