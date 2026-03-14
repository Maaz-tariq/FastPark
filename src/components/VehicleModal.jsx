import React from 'react';
import { Clock, MapPin, CreditCard, X } from 'lucide-react';

const VehicleModal = ({ vehicle, onClose }) => {
  if (!vehicle) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
      <div className="bg-slate-800 p-10 rounded-[3rem] border border-slate-700 w-full max-w-sm shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500"><X size={20}/></button>
        
        <h3 className="text-xl font-black text-blue-500 mb-8 uppercase text-center tracking-widest">Live Status</h3>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <MapPin className="text-slate-500" size={20}/>
            <div className="flex-1 border-b border-slate-700 pb-2 flex justify-between">
              <span className="text-sm opacity-60">Location</span>
              <span className="font-bold font-mono">Slot {vehicle.slot_number || 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Clock className="text-slate-500" size={20}/>
            <div className="flex-1 border-b border-slate-700 pb-2 flex justify-between">
              <span className="text-sm opacity-60">Entry Time</span>
              <span className="font-bold">{vehicle.entry_time ? new Date(vehicle.entry_time).toLocaleTimeString() : '---'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <CreditCard className="text-slate-500" size={20}/>
            <div className="flex-1 border-b border-slate-700 pb-2 flex justify-between">
              <span className="text-sm opacity-60">Accrued Fee</span>
              <span className="font-bold text-emerald-400">₹{vehicle.fee || 0}</span>
            </div>
          </div>
        </div>
        
        <button onClick={onClose} className="w-full mt-10 bg-slate-700 py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:bg-slate-600 transition-colors">
          Close Dashboard
        </button>
      </div>
    </div>
  );
};

export default VehicleModal;