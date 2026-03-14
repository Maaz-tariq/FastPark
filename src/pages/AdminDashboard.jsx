import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, LogOut, LayoutDashboard, History, MessageSquare, Settings, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('monitor');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();
  
  // Manual Input State
  const [manualPlate, setManualPlate] = useState("");

  // States for dynamic data
  const [parkedCars, setParkedCars] = useState({});
  const [history, setHistory] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [config, setConfig] = useState({ slots: 15, baseFee: 50, hourly: 20 });
  const [linkedPlate, setLinkedPlate] = useState(null);
  const [activeSession, setActiveSession] = useState(null);

  const adminName = localStorage.getItem('adminName') || "Admin";
  const orgName = localStorage.getItem('orgName') || "FastPark Global";

  // --- DATABASE SYNC ---
  useEffect(() => {
    fetchLiveStatus();
    fetchHistory();
    fetchComplaints();

    // Real-time subscription so the dashboard updates when users act
    const channel = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_sessions' }, fetchLiveStatus)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_sessions' }, fetchHistory)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complaints' }, fetchComplaints)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchLiveStatus = async () => {
    const { data } = await supabase.from('parking_sessions').select('*').eq('status', 'active');
    const mapped = {};
    data?.forEach(session => { mapped[session.plate_number] = session; });
    setParkedCars(mapped);
  };

  const fetchHistory = async () => {
    const { data } = await supabase.from('parking_sessions').select('*').order('entry_time', { ascending: false });
    setHistory(data || []);
  };

  const fetchComplaints = async () => {
    const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    setComplaints(data || []);
  };

const handleLogout = async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  toast.success("See you next time!");
  navigate('/');
};
 // --- REALTIME CURRENT SESSION CARD
 useEffect(() => {
  if (!linkedPlate) return;

  // Subscribe to real-time changes for this specific car
  const channel = supabase
    .channel('schema-db-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'parking_sessions', filter: `plate_number=eq.${linkedPlate}` },
      (payload) => {
        if (payload.new.status === 'active') {
          setActiveSession(payload.new);
        } else {
          setActiveSession(null); // Car exited
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [linkedPlate]);


const handleEntry = async () => {
  if (!manualPlate) return toast.error("Please enter a Plate ID");
  
  // Get the Admin's Area Name from localStorage
  const adminAreaName = localStorage.getItem('orgName') || "FastPark Area";

  const occupiedSlots = Object.values(parkedCars).map(c => c.slot_number);
  const availableSlot = Array.from({length: parseInt(config.slots)}, (_, i) => i + 1).find(s => !occupiedSlots.includes(s));

  if (!availableSlot) return toast.error("Parking Lot Full!");

  const { error } = await supabase.from('parking_sessions').insert([
    { 
      plate_number: manualPlate, 
      slot_number: availableSlot, 
      parking_lot_name: adminAreaName, // NEW: Adds the location name
      status: 'active'
    }
  ]);

  if (error) {
    toast.error("Database Error: " + error.message);
  } else {
    setManualPlate("");
    toast.success(`Vehicle ${manualPlate} entered ${adminAreaName}`, {
      duration: 4000,
      icon: '🚗',
      style: { borderRadius: '10px', background: '#1e293b', color: '#fff', border: '1px solid #334155' },
    });
  }
};

// Call this inside a useEffect when the component loads
const fetchUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('profiles')
    .select('plate_number, wallet_balance, full_name')
    .eq('id', user.id)
    .single();

  if (data) {
    setLinkedPlate(data.plate_number);
    setBalance(data.wallet_balance);
  }
};

// ... inside your JSX ...
{/* <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
  <h3 className="text-slate-400 text-xs font-bold uppercase mb-4">Your Vehicle</h3>
  {linkedPlate ? (
    <div className="flex items-center justify-between">
      <span className="text-2xl font-black text-white tracking-widest">{linkedPlate}</span>
      <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-3 py-1 rounded-full font-bold">LINKED</span>
    </div>
  ) : (
    <button onClick={handleLinkRFID} className="w-full py-3 bg-blue-600 rounded-xl font-bold text-white text-sm">
      Link Your RFID / Plate
    </button>
  )}
</div> */}

  const handleExit = async () => {
    if (!manualPlate || !parkedCars[manualPlate]) return alert("Vehicle not found in active parking.");
    
    const entryTime = new Date(parkedCars[manualPlate].entry_time);
    const exitTime = new Date();
    // Demo tip: Using minutes for the fee if stay is short
    const durationMs = exitTime - entryTime;
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60)); 
    const totalFee = durationHours <= 2 ? config.baseFee : config.baseFee + (durationHours - 2) * config.hourly;

    const { error } = await supabase
      .from('parking_sessions')
      .update({ 
        status: 'completed', 
        exit_time: exitTime.toISOString(),
        fee: totalFee 
      })
      .eq('plate_number', manualPlate)
      .eq('status', 'active');

    if (!error) {
      setManualPlate("");
      alert(`Exit Confirmed. Fee Collected: ₹${totalFee}`);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      document.getElementById('webcam').srcObject = stream;
      setIsCameraActive(true);
    } catch (err) { alert("Camera access denied."); }
  };

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 font-sans pb-10">
      {/* HEADER NAVBAR */}
      <nav className="bg-slate-800 border-b border-slate-700 p-4 px-8 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{orgName}</span>
          <h1 className="text-sm font-bold opacity-80 italic">Admin Console • {adminName}</h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"><Settings size={18}/></button>
          <button onClick={() => window.location.href='/'} className="flex items-center gap-2 text-rose-500 border border-rose-500 px-5 py-1.5 rounded-full text-xs font-bold hover:bg-rose-500 hover:text-white transition-all">
            <LogOut size={14}/> Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        {/* TAB NAVIGATION */}
        <div className="flex bg-slate-800 p-1 rounded-2xl mb-10 w-fit border border-slate-700 shadow-lg">
          <button onClick={() => setActiveTab('monitor')} className={`px-8 py-2 rounded-xl font-bold transition-all ${activeTab === 'monitor' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400'}`}>
            Monitor
          </button>
          <button onClick={() => setActiveTab('history')} className={`px-8 py-2 rounded-xl font-bold transition-all ${activeTab === 'history' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400'}`}>
            Records
          </button>
          <button onClick={() => setActiveTab('complaints')} className={`px-8 py-2 rounded-xl font-bold transition-all ${activeTab === 'complaints' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400'}`}>
            Inbox {complaints.length > 0 && <span className="ml-2 bg-rose-500 text-[10px] px-1.5 rounded-full">!</span>}
          </button>
        </div>

        {/* TAB 1: LIVE MONITOR */}
        {activeTab === 'monitor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* SCANNER CONTROLS */}
            <div className="lg:col-span-4 bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl h-fit">
              <div className="relative bg-black aspect-video rounded-3xl mb-6 overflow-hidden border-2 border-blue-500/20 shadow-inner">
                {!isCameraActive && (
                  <button onClick={startCamera} className="absolute inset-0 z-10 bg-slate-900/95 text-blue-400 flex flex-col items-center justify-center group">
                    <Camera size={40} className="mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Enable Scanner Feed</span>
                  </button>
                )}
                <video id="webcam" autoPlay playsInline className="w-full h-full object-cover"></video>
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-scan shadow-[0_0_15px_blue]"></div>
              </div>
              
              <div className="space-y-2 mb-6">
                <label className="text-[10px] text-slate-500 font-bold uppercase ml-2 tracking-widest">Plate / RFID ID</label>
                <input 
                   value={manualPlate}
                   onChange={(e) => setManualPlate(e.target.value.toUpperCase().replace(/\s/g, ''))}
                   placeholder="SCAN OR TYPE ID..." 
                   className="w-full p-5 bg-slate-900 border border-slate-700 rounded-2xl text-center text-2xl font-mono font-bold text-blue-400 uppercase outline-none focus:border-blue-500 transition-all shadow-inner" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={handleEntry} className="bg-emerald-600 py-4 rounded-2xl font-black text-xs uppercase hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">Entry</button>
                <button onClick={handleExit} className="bg-rose-600 py-4 rounded-2xl font-black text-xs uppercase hover:bg-rose-500 shadow-lg shadow-rose-900/20 active:scale-95 transition-all">Exit</button>
              </div>
            </div>

            {/* LIVE SLOTS GRID */}
            <div className="lg:col-span-8 bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-xl">
               <div className="flex justify-between items-center mb-8">
                 <h3 className="text-blue-400 font-bold uppercase text-[10px] tracking-widest">Live Parking Occupancy</h3>
                 <span className="text-[10px] text-slate-500">{Object.keys(parkedCars).length} / {config.slots} Occupied</span>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {[...Array(parseInt(config.slots))].map((_, i) => {
                  const carPlate = Object.keys(parkedCars).find(plate => parkedCars[plate].slot_number === i + 1);
                  return (
                    <div key={i} className={`h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${carPlate ? 'border-rose-500 bg-rose-500/10 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-dashed border-slate-700 opacity-20'}`}>
                      <span className="text-[10px] font-bold">SLOT {i+1}</span>
                      <span className="text-[10px] font-black uppercase mt-1 truncate w-full text-center px-1">{carPlate || 'OPEN'}</span>
                    </div>
                  );
                })}
               </div>
            </div>
          </div>
        )}

        {/* TAB 2: RECORDS HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-xl overflow-hidden">
            <h3 className="text-blue-500 font-black mb-6 uppercase text-xs tracking-widest italic">Master Transaction Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 uppercase text-[10px] border-b border-slate-700">
                  <tr>
                    <th className="p-4">Vehicle ID</th>
                    <th className="p-4">Entry Time</th>
                    <th className="p-4">Exit Time</th>
                    <th className="p-4 text-right">Fee Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {history.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-blue-400">{row.plate_number}</td>
                      <td className="p-4 opacity-60 text-xs">{new Date(row.entry_time).toLocaleString()}</td>
                      <td className="p-4 opacity-60 text-xs">{row.exit_time ? new Date(row.exit_time).toLocaleString() : <span className="text-emerald-500 font-bold uppercase text-[9px]">Inside Lot</span>}</td>
                      <td className="p-4 text-right font-black text-emerald-400">₹{row.fee || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: COMPLAINTS INBOX */}
        {activeTab === 'complaints' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complaints.length === 0 ? <p className="text-slate-500 italic px-4">Inbox is empty.</p> : 
              complaints.map((c, i) => (
                <div key={i} className="bg-slate-800 p-6 rounded-3xl border border-rose-500/20 shadow-lg relative">
                   <div className="flex justify-between items-center mb-4">
                      <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-rose-500/20">{c.type}</span>
                      <span className="text-[10px] opacity-40 font-mono">{new Date(c.created_at).toLocaleDateString()}</span>
                   </div>
                   <p className="text-sm italic opacity-80 mb-4 text-slate-200">"{c.message}"</p>
                   <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">- From: {c.userName}</p>
                </div>
              ))
            }
          </div>
        )}
      </main>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
           <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 w-full max-w-md shadow-2xl scale-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-blue-500 uppercase italic">System Configuration</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Max Parking Capacity</label>
                    <input type="number" value={config.slots} onChange={(e) => setConfig({...config, slots: e.target.value})} className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl mt-1 font-bold text-blue-400 shadow-inner" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Base Fee (₹)</label>
                        <input type="number" value={config.baseFee} onChange={(e) => setConfig({...config, baseFee: e.target.value})} className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl mt-1 font-bold shadow-inner" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Hourly Rate (₹)</label>
                        <input type="number" value={config.hourly} onChange={(e) => setConfig({...config, hourly: e.target.value})} className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl mt-1 font-bold shadow-inner" />
                    </div>
                 </div>
                 <button onClick={() => {setIsSettingsOpen(false); fetchLiveStatus();}} className="w-full bg-blue-600 py-4 rounded-xl font-black mt-4 shadow-lg shadow-blue-900/20 active:scale-95 transition-all">UPDATE SYSTEM</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;