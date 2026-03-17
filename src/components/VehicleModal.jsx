import React from 'react';
import { Clock, MapPin, CreditCard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VehicleModal = ({ vehicle, onClose }) => {
  return (
    <AnimatePresence>
      {vehicle && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-6 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            className="bg-white/10 p-10 rounded-[3rem] border border-white/20 w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-[-50%] w-[200%] h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white hover:rotate-90 transition-all bg-white/5 p-2 rounded-full border border-white/10 z-10"><X size={16}/></button>
            
            <h3 className="text-xl font-black text-white mb-8 uppercase text-center tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] italic">Live Status</h3>
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-4 group">
                <MapPin className="text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" size={20}/>
                <div className="flex-1 border-b border-white/10 pb-2 flex justify-between group-hover:border-white/30 transition-colors">
                  <span className="text-sm opacity-60 text-slate-300">Location</span>
                  <span className="font-bold font-mono text-white">Slot {vehicle.slot_number || 'N/A'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 group">
                <Clock className="text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" size={20}/>
                <div className="flex-1 border-b border-white/10 pb-2 flex justify-between group-hover:border-white/30 transition-colors">
                  <span className="text-sm opacity-60 text-slate-300">Entry Time</span>
                  <span className="font-bold text-white tracking-wide">{vehicle.entry_time ? new Date(vehicle.entry_time).toLocaleTimeString() : '---'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 group">
                <CreditCard className="text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" size={20}/>
                <div className="flex-1 border-b border-white/10 pb-2 flex justify-between group-hover:border-white/30 transition-colors">
                  <span className="text-sm opacity-60 text-slate-300">Accrued Fee</span>
                  <span className="font-black text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">₹{vehicle.fee || 0}</span>
                </div>
              </div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose} 
              className="w-full mt-10 bg-white/10 border border-white/20 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/20 hover:text-white text-slate-300 transition-colors shadow-inner"
            >
              Close Dashboard
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VehicleModal;