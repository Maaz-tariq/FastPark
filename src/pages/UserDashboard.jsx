import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Wallet, Car, MessageSquare, LogOut, Clock, MapPin, Plus } from 'lucide-react';
import VehicleModal from '../components/VehicleModal';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [registeredPlates, setRegisteredPlates] = useState(
    JSON.parse(localStorage.getItem('myRegisteredPlates')) || []
  );
  const [newPlateInput, setNewPlateInput] = useState("");
  const [balance, setBalance] = useState(1250);
  const [complaintMsg, setComplaintMsg] = useState("");

  const userName = localStorage.getItem('userName') || "User";
  const userPhone = localStorage.getItem('userPhone') || "N/A";

  // --- DATABASE SYNC ---
  useEffect(() => {
    fetchActiveSessions();

    // REALTIME: Listen for any changes to parking_sessions
    const channel = supabase
      .channel('user-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'parking_sessions' }, 
        (payload) => {
          // Only refresh if the change involves one of THIS user's plates
          if (registeredPlates.includes(payload.new?.plate_number) || registeredPlates.includes(payload.old?.plate_number)) {
            fetchActiveSessions();
            
            // Show a toast if a car just entered
            if (payload.eventType === 'INSERT' && payload.new.status === 'active') {
              toast.success(`Your vehicle ${payload.new.plate_number} has just parked!`, { icon: '🅿️' });
            }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [registeredPlates]);

  const fetchActiveSessions = async () => {
    if (registeredPlates.length === 0) return;
    const { data, error } = await supabase
      .from('parking_sessions')
      .select('*')
      .in('plate_number', registeredPlates)
      .eq('status', 'active');
      
    if (!error) setActiveSessions(data || []);
  };

  // --- ACTIONS ---
  const linkNewVehicle = () => {
    if (!newPlateInput || newPlateInput.length < 4) return toast.error("Enter a valid Plate ID");
    
    const updated = [...new Set([...registeredPlates, newPlateInput.toUpperCase()])];
    setRegisteredPlates(updated);
    localStorage.setItem('myRegisteredPlates', JSON.stringify(updated));
    setNewPlateInput("");
    
    // REPLACED ALERT WITH TOAST
    toast.success(`Vehicle ${newPlateInput} successfully linked!`, {
      style: { background: '#1e293b', color: '#fff', borderRadius: '15px' }
    });
  };

  const submitComplaint = async () => {
    if (!complaintMsg) return toast.error("Please type your concern.");
    const { error } = await supabase.from('complaints').insert([{ 
        userName: userName, 
        message: complaintMsg, 
        type: 'General'
    }]);

    if (!error) {
      toast.success("Feedback sent to Admin");
      setComplaintMsg("");
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen text-white font-sans pb-12">
      <nav className="bg-slate-800 border-b border-slate-700 p-5 px-8 flex justify-between items-center shadow-xl sticky top-0 z-50">
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-blue-500 italic tracking-tighter">FASTPARK USER</h1>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{userName} | {userPhone}</span>
        </div>
        <button onClick={() => window.location.href='/'} className="flex items-center gap-2 text-rose-500 border border-rose-500/40 px-5 py-2 rounded-full text-xs font-bold hover:bg-rose-500 hover:text-white transition-all">
          <LogOut size={14}/> LOGOUT
        </button>
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:p-10 space-y-10">
        
        {/* WALLET SECTION */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-900 p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
          <div className="text-center md:text-left z-10">
            <p className="text-blue-100 text-xs font-bold uppercase opacity-60 tracking-[0.2em] mb-2">Available FASTag Credits</p>
            <h2 className="text-6xl font-black tracking-tighter">₹{balance}</h2>
          </div>
          <button className="bg-white text-blue-600 px-12 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all z-10 uppercase">
            Quick Recharge
          </button>
        </div>

        {/* MAP FEATURE BUTTON */}
        <button 
          onClick={() => window.open(`https://www.google.com/maps/search/parking+near+me`, '_blank')}
          className="w-full bg-slate-800 border border-slate-700 hover:bg-slate-750 text-white py-6 rounded-[2.5rem] font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl group"
        >
          <MapPin className="text-blue-500 group-hover:animate-bounce" /> 📍 FIND NEAREST PARKING AREA
        </button>

        {/* LINK VEHICLE */}
        <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-xl">
           <h3 className="text-blue-400 font-bold mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2">
             <Plus size={14}/> Link New Vehicle Tag / RFID
           </h3>
           <div className="flex gap-3">
              <input 
                value={newPlateInput}
                onChange={(e) => setNewPlateInput(e.target.value.toUpperCase())}
                placeholder="ENTER PLATE ID (e.g. MH12XY8889)" 
                className="flex-1 bg-slate-900 border border-slate-700 p-4 rounded-2xl font-mono text-sm outline-none focus:border-blue-500 transition-colors shadow-inner" 
              />
              <button onClick={linkNewVehicle} className="bg-blue-600 px-8 rounded-2xl font-black hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">
                LINK
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* ACTIVE SESSIONS LIST */}
          <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-xl">
             <h3 className="text-blue-400 font-bold mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
               <Car size={18}/> My Active Sessions
             </h3>
             <div className="space-y-4">
                {activeSessions.length === 0 ? (
                  <div className="py-10 text-center opacity-30">
                    <Car size={40} className="mx-auto mb-2" />
                    <p className="text-xs italic">No vehicles currently parked.</p>
                  </div>
                ) : (
                  activeSessions.map((v, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedVehicle(v)}
                      className="cursor-pointer bg-slate-900/50 p-6 rounded-2xl border border-blue-500/30 hover:border-blue-500 transition-all group active:scale-95"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-slate-500 text-[9px] font-bold uppercase">Location</p>
                          <h4 className="text-white font-bold">{v.parking_lot_name || "Smart Parking Area"}</h4>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-500 text-[8px] px-2 py-1 rounded font-black border border-emerald-500/20">LIVE</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-slate-500 text-[9px] font-bold uppercase">Plate</p>
                          <p className="font-mono text-lg font-black text-blue-400">{v.plate_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 text-[9px] font-bold uppercase">Slot</p>
                          <p className="text-white font-bold">#{v.slot_number}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          {/* COMPLAINT SYSTEM */}
          <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-xl">
             <h3 className="text-rose-500 font-bold mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
               <MessageSquare size={18}/> Report An Issue
             </h3>
             <textarea 
               value={complaintMsg}
               onChange={(e) => setComplaintMsg(e.target.value)}
               className="w-full p-5 bg-slate-900 border border-slate-700 rounded-3xl h-36 mb-5 outline-none resize-none text-sm focus:border-rose-500 transition-colors shadow-inner" 
               placeholder="Describe the issue at the parking lot..."
             ></textarea>
             <button onClick={submitComplaint} className="w-full bg-rose-600 py-4 rounded-2xl font-black text-sm shadow-lg shadow-rose-900/20 hover:bg-rose-500 transition-all">
               SUBMIT COMPLAINT
             </button>
          </div>
        </div>
      </main>

      <VehicleModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
    </div>
  );
};

export default UserDashboard;