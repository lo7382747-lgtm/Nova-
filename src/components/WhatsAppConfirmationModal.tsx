import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Edit3, MessageCircle, AlertCircle, CheckCircle2, User, Phone, Check } from 'lucide-react';
import { Contact, WhatsAppConfirmationState } from '../types';

interface WhatsAppConfirmationModalProps {
  state: WhatsAppConfirmationState;
  onConfirm: (finalMessage: string, selectedContact?: Contact) => void;
  onCancel: () => void;
  onSelectContact: (contact: Contact) => void;
  isWhatsAppInstalled?: boolean;
}

export const WhatsAppConfirmationModal: React.FC<WhatsAppConfirmationModalProps> = ({
  state,
  onConfirm,
  onCancel,
  onSelectContact,
  isWhatsAppInstalled = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(state.message);
  const [installAlert, setInstallAlert] = useState(!isWhatsAppInstalled);

  if (!state.isOpen) return null;

  const activeContact = state.resolvedContact;
  const isPickerMode = state.mode === 'pick_contact' && (state.candidateMatches?.length || 0) > 1;

  const handleSend = () => {
    if (!isWhatsAppInstalled) {
      setInstallAlert(true);
      return;
    }
    onConfirm(editedMessage.trim() || state.message, activeContact);
  };

  return (
    <AnimatePresence>
      <div
        id="whatsapp-confirmation-backdrop"
        className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn"
      >
        <motion.div
          id="whatsapp-confirmation-dialog"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-sm bg-[#0F0F0F] border border-teal-900/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header Banner */}
          <div className="bg-[#161616] border-b border-teal-900/30 px-5 py-3.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500 text-black font-bold flex items-center justify-center shadow-inner">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em]">
                  {isPickerMode ? 'Choose WhatsApp Contact' : 'Confirm WhatsApp Message'}
                </h3>
                <p className="text-[10px] font-mono text-teal-500 uppercase tracking-widest mt-0.5">Safety Guardrail • Android Intent</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-gray-400 hover:text-white"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {/* WhatsApp not installed warning if simulated */}
            {installAlert && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold uppercase tracking-wider text-amber-300 text-[11px]">WhatsApp not detected</div>
                  <div className="text-[11px] text-amber-200/90 mt-0.5">
                    WhatsApp is required to launch `com.whatsapp`. You can still test web dispatch or copy the intent text.
                  </div>
                </div>
              </div>
            )}

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
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#161616] hover:bg-black/60 border border-white/5 hover:border-teal-900/40 text-left transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${contact.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow`}
                        >
                          {contact.initials}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                            {contact.name}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span className="font-mono text-[11px] text-gray-300">{contact.phone}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/10">
                              {contact.label || 'Mobile'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-400 group-hover:translate-x-0.5 transition-transform">
                        Select →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Single contact confirmation card */
              <div className="space-y-4">
                {/* Contact Card */}
                <div className="p-3.5 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${
                        activeContact?.avatarColor || 'from-teal-500 to-teal-700'
                      } flex items-center justify-center text-white text-sm font-bold shadow-md`}
                    >
                      {activeContact?.initials || state.contactName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-teal-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Recipient</span>
                      </div>
                      <div className="text-sm font-bold text-white">{activeContact?.name || state.contactName}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-teal-400" />
                        <span className="font-mono text-teal-300 text-xs">
                          {activeContact?.phone || state.phone || 'Phone number verified'}
                        </span>
                        {activeContact?.label && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/10">
                            {activeContact.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded-lg">
                      <Check className="w-2.5 h-2.5" />
                      Ready
                    </span>
                  </div>
                </div>

                {/* Message Content Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Drafted Message</span>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-teal-400 hover:text-teal-300 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditing ? 'Done' : 'Edit message'}</span>
                    </button>
                  </div>

                  {isEditing ? (
                    <textarea
                      value={editedMessage}
                      onChange={(e) => setEditedMessage(e.target.value)}
                      rows={3}
                      className="w-full bg-black/60 border border-teal-500 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono"
                      placeholder="Type your WhatsApp message..."
                    />
                  ) : (
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-gray-200 leading-relaxed font-mono relative group">
                      <div className="whitespace-pre-wrap">{editedMessage}</div>
                      <div className="mt-2 text-[10px] font-mono text-teal-500/80 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400" />
                        <span>com.whatsapp • Intent.ACTION_SEND</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Voice instruction prompt reminder */}
                <div className="text-center px-2">
                  <p className="text-[11px] text-gray-400">
                    Voice control: Say <span className="text-teal-300 font-bold">"Send"</span> or tap below. Say{' '}
                    <span className="text-rose-400 font-bold">"Cancel"</span> to dismiss.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer Buttons */}
          <div className="p-4 bg-[#161616] border-t border-teal-900/30 flex items-center gap-2.5">
            <button
              id="whatsapp-cancel-btn"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4 text-gray-400" />
              <span>Cancel</span>
            </button>

            {!isPickerMode && (
              <button
                id="whatsapp-send-btn"
                onClick={handleSend}
                className="flex-[1.6] py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Confirm & Send</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
