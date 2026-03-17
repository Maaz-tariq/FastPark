import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Wallet, Car, MessageSquare, LogOut, Clock, MapPin, Plus, CalendarPlus, X } from 'lucide-react';
import VehicleModal from '../components/VehicleModal';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const UserDashboard = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [registeredPlates, setRegisteredPlates] = useState(
    JSON.parse(localStorage.getItem('myRegisteredPlates')) || []
  );
  const [newPlateInput, setNewPlateInput] = useState("");
  const [balance, setBalance] = useState(1250);
  const [complaintMsg, setComplaintMsg] = useState("");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState({ plate_number: '', scheduled_time: '' });

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
  const handleBooking = async () => {
    if (!bookingData.plate_number) return toast.error("Please select a vehicle.");
    if (!bookingData.scheduled_time) return toast.error("Please select a time.");

    const { data: { user } } = await supabase.auth.getUser();

    // Scheduled time must be in future
    if (new Date(bookingData.scheduled_time) <= new Date()) {
      return toast.error("Please select a future time.");
    }

    const { error } = await supabase.from('bookings').insert([{
      user_id: user.id,
      plate_number: bookingData.plate_number,
      scheduled_time: new Date(bookingData.scheduled_time).toISOString(),
      status: 'reserved'
    }]);

    if (error) {
      toast.error("Failed to reserve slot. " + error.message);
    } else {
      toast.success(`Slot reserved for ${bookingData.plate_number}!`, { icon: '📅' });
      setIsBookingModalOpen(false);
      setBookingData({ plate_number: '', scheduled_time: '' });
    }
  };

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
    // 1. Grab the currently logged-in user securely from Supabase
    const { data: { user } } = await supabase.auth.getUser();

    // Safety check just in case
    if (!user) {
      console.error("No user found!");
      return;
    }

    // 2. Now we can safely use their data!
    const { data, error } = await supabase
      .from('complaints')
      .insert([{
        userName: user.user_metadata.full_name,
        message: complaintMsg,
        type: 'General'
      }]);

    if (error) {
      console.error("Error submitting:", error);
    } else {
      console.log("Complaint submitted successfully!");
      toast.success("Feedback sent to Admin");
      setComplaintMsg("");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans pb-12 relative overflow-hidden selection:bg-blue-500/30">

      {/* BACKGROUND AMBIENCE */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>

      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/5 backdrop-blur-md border-b border-white/10 p-5 px-8 flex justify-between items-center shadow-[0_0_30px_rgba(0,0,0,0.5)] sticky top-0 z-50"
      >
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-white italic tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">FASTPARK USER</h1>
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{userName} | {userPhone}</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 text-rose-400 border border-rose-500/40 px-5 py-2 rounded-full text-xs font-bold hover:bg-rose-500 hover:text-white transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)] hover:shadow-[0_0_20px_rgba(244,63,94,0.5)]"
        >
          <LogOut size={14} /> LOGOUT
        </motion.button>
      </motion.nav>

      <main className="max-w-4xl mx-auto p-6 md:p-10 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-10 perspective-1000"
        >
          {/* WALLET SECTION */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01, rotateX: 2 }}
            className="bg-gradient-to-br from-blue-600/90 to-indigo-900/90 backdrop-blur-xl p-10 rounded-[3rem] shadow-[0_0_40px_rgba(59,130,246,0.3)] border border-blue-400/30 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full group-hover:bg-white/20 transition-colors"></div>
            <div className="text-center md:text-left z-10">
              <p className="text-blue-100 text-xs font-bold uppercase opacity-80 tracking-[0.2em] mb-2 drop-shadow-md">Available FASTag Credits</p>
              <h2 className="text-6xl font-black tracking-tighter drop-shadow-lg">₹{balance}</h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-600 px-12 py-4 rounded-2xl font-black text-sm shadow-[0_10px_20px_rgba(0,0,0,0.2)] transition-all z-10 uppercase hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)]"
            >
              Quick Recharge
            </motion.button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MAP FEATURE BUTTON */}
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open(`https://www.google.com/maps/search/parking+near+me`, '_blank')}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-blue-500/50 hover:bg-white/10 text-white py-6 rounded-[2.5rem] font-black text-sm flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] group"
            >
              <MapPin className="text-blue-400 group-hover:animate-bounce drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" /> 📍 NEAREST PARKING
            </motion.button>

            {/* RESERVE SLOT BUTTON */}
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsBookingModalOpen(true)}
              className="w-full bg-blue-600/10 backdrop-blur-xl border border-blue-500/30 hover:border-blue-500/80 hover:bg-blue-600/20 text-white py-6 rounded-[2.5rem] font-black text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] group"
            >
              <CalendarPlus className="text-blue-400 group-hover:scale-110 transition-transform drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" /> 📅 RESERVE A SLOT
            </motion.button>
          </div>

          {/* LINK VEHICLE */}
          <motion.div
            variants={itemVariants}
            className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)]"
          >
            <h3 className="text-blue-400 font-bold mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">
              <Plus size={14} /> Link New Vehicle Tag / RFID
            </h3>
            <div className="flex gap-3">
              <input
                value={newPlateInput}
                onChange={(e) => setNewPlateInput(e.target.value.toUpperCase())}
                placeholder="ENTER PLATE ID (e.g. MH12XY8889)"
                className="flex-1 bg-black/40 border border-white/10 p-4 rounded-2xl font-mono text-sm outline-none focus:border-blue-500/50 focus:bg-white/5 transition-colors shadow-inner text-white placeholder:text-slate-600"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={linkNewVehicle}
                className="bg-blue-600/90 border border-blue-500/50 px-8 rounded-2xl font-black hover:bg-blue-500 transition-all shadow-neon-blue"
              >
                LINK
              </motion.button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* ACTIVE SESSIONS LIST */}
            <motion.div
              variants={itemVariants}
              className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)]"
            >
              <h3 className="text-blue-400 font-bold mb-6 uppercase text-xs tracking-widest flex items-center gap-2 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">
                <Car size={18} /> My Active Sessions
              </h3>
              <div className="space-y-4">
                <AnimatePresence>
                  {activeSessions.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-10 text-center opacity-40 text-slate-400"
                    >
                      <Car size={40} className="mx-auto mb-2 drop-shadow-md" />
                      <p className="text-xs italic tracking-wide">No vehicles currently parked.</p>
                    </motion.div>
                  ) : (
                    activeSessions.map((v, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={i}
                        onClick={() => setSelectedVehicle(v)}
                        className="cursor-pointer bg-black/30 backdrop-blur-md p-6 rounded-2xl border border-blue-500/30 hover:border-blue-400 transition-all group active:scale-95 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Location</p>
                            <h4 className="text-white font-bold group-hover:text-blue-100 transition-colors">{v.parking_lot_name || "Smart Parking Area"}</h4>
                          </div>
                          <span className="bg-emerald-500/20 text-emerald-400 text-[8px] px-2 py-1 rounded font-black border border-emerald-500/30 tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>LIVE
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Plate</p>
                            <p className="font-mono text-lg font-black text-blue-300 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">{v.plate_number}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Slot</p>
                            <p className="text-white font-bold tracking-widest">#{v.slot_number}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* COMPLAINT SYSTEM */}
            <motion.div
              variants={itemVariants}
              className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)]"
            >
              <h3 className="text-rose-400 font-bold mb-6 uppercase text-xs tracking-widest flex items-center gap-2 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">
                <MessageSquare size={18} /> Report An Issue
              </h3>
              <textarea
                value={complaintMsg}
                onChange={(e) => setComplaintMsg(e.target.value)}
                className="w-full p-5 bg-black/40 border border-white/10 rounded-3xl h-36 mb-5 outline-none resize-none text-sm focus:border-rose-500/50 focus:bg-white/5 transition-colors shadow-inner text-white placeholder:text-slate-600"
                placeholder="Describe the issue at the parking lot..."
              ></textarea>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={submitComplaint}
                className="w-full bg-rose-600/90 border border-rose-500/50 py-4 rounded-2xl font-black text-sm shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.5)] hover:bg-rose-500 transition-colors uppercase tracking-widest"
              >
                SUBMIT COMPLAINT
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <VehicleModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />

      {/* BOOKING MODAL */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-6 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-[-50%] w-[200%] h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-xl font-black text-white uppercase italic drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] flex items-center gap-2">
                  <CalendarPlus size={24} className="text-blue-400" /> Book a Slot
                </h3>
                <button
                  onClick={() => setIsBookingModalOpen(false)}
                  className="text-slate-400 hover:text-white hover:rotate-90 transition-all bg-white/5 p-2 rounded-full border border-white/10"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-6 relative z-10">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-2 block">
                    Select Vehicle
                  </label>
                  <select
                    value={bookingData.plate_number}
                    onChange={(e) => setBookingData({ ...bookingData, plate_number: e.target.value })}
                    className="w-full p-4 bg-black/40 border border-white/10 focus:border-blue-500/50 focus:bg-white/5 rounded-2xl font-bold text-white shadow-inner outline-none transition-all appearance-none"
                  >
                    <option value="" disabled>Choose a registered plate</option>
                    {registeredPlates.map(plate => (
                      <option key={plate} value={plate}>{plate}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-2 block">
                    Select Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={bookingData.scheduled_time}
                    onChange={(e) => setBookingData({ ...bookingData, scheduled_time: e.target.value })}
                    className="w-full p-4 bg-black/40 border border-white/10 focus:border-blue-500/50 focus:bg-white/5 rounded-2xl font-bold text-white shadow-inner outline-none transition-all [color-scheme:dark]"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBooking}
                  className="w-full bg-blue-600/90 border border-blue-500/50 py-4 rounded-2xl font-black mt-4 shadow-neon-blue transition-colors hover:bg-blue-500 text-white tracking-widest flex items-center justify-center gap-2 group uppercase"
                >
                  <CalendarPlus size={18} className="group-hover:scale-110 transition-transform" /> Confirm Booking
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDashboard;