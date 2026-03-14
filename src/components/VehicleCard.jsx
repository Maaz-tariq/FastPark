import React from 'react';

const VehicleCard = ({ vehicle, onClick }) => {
  return (
    <div 
      onClick={() => onClick(vehicle)}
      className="cursor-pointer flex justify-between items-center bg-slate-900/50 p-5 rounded-2xl border border-slate-700 hover:border-blue-500 transition-all group active:scale-95"
    >
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Plate ID</span>
        <span className="font-mono font-bold text-lg group-hover:text-blue-400 transition-colors">
          {vehicle.plate_number}
        </span>
      </div>
      <span className={`text-[10px] px-3 py-1 rounded-lg border uppercase font-black tracking-tighter ${
        vehicle.status === 'active' 
        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
        : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
      }`}>
        {vehicle.status || 'Inactive'}
      </span>
    </div>
  );
};

export default VehicleCard;