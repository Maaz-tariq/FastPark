import React, { useState, useEffect, useRef } from "react";
import Tesseract from "tesseract.js";
import { supabase } from "../supabaseClient";
import {
  Camera,
  CameraOff,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  Settings,
  X,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Car
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, Tooltip, ResponsiveContainer } from "recharts";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("monitor");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const navigate = useNavigate();

  const [manualPlate, setManualPlate] = useState("");
  const [balance, setBalance] = useState(0);

  const [parkedCars, setParkedCars] = useState({});
  const [history, setHistory] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [config, setConfig] = useState({ slots: 15, baseFee: 50, hourly: 20 });

  const videoRef = useRef(null);
  const isOcrPausedRef = useRef(false);

  const [adminName, setAdminName] = useState("Loading...");
  const [orgName, setOrgName] = useState("Loading...");

  useEffect(() => {
    const fetchAdminProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, place_name")
          .eq("id", user.id)
          .single();

        if (data) {
          setAdminName(data.full_name || "Admin");
          setOrgName(data.place_name || "FastPark Global");

          localStorage.setItem("adminName", data.full_name || "Admin");
          localStorage.setItem("orgName", data.place_name || "FastPark Global");
        }
      }
    };

    fetchAdminProfile();
    fetchLiveStatus();
    fetchHistory();
    fetchComplaints();
    fetchReservations();

    const plateChannel = supabase
      .channel("public:parking_sessions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parking_sessions" },
        (payload) => {
          fetchLiveStatus();
          fetchHistory();
        }
      )
      .subscribe();

    const complaintChannel = supabase
      .channel("public:complaints")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "complaints" },
        (payload) => {
          fetchComplaints();
        }
      )
      .subscribe();

    const bookingChannel = supabase
      .channel("public:bookings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        (payload) => {
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(plateChannel);
      supabase.removeChannel(complaintChannel);
      supabase.removeChannel(bookingChannel);
    };
  }, []);

  const fetchReservations = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "reserved")
      .order("scheduled_time", { ascending: true });
    if (data) setReservations(data);
  };

  useEffect(() => {
    let stream = null;

    const enableStream = async () => {
      if (isCameraActive) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        } catch (err) {
          toast.error("Camera access denied.");
          setIsCameraActive(false);
        }
      } else {
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      }
    };

    enableStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive]);

  const fetchLiveStatus = async () => {
    const { data, error } = await supabase
      .from("parking_sessions")
      .select("*")
      .eq("status", "active");

    if (data) {
      const activeLookup = {};
      data.forEach((session) => {
        activeLookup[session.plate_number] = session;
      });
      setParkedCars(activeLookup);
    }
  };

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("parking_sessions")
      .select("*")
      .order("entry_time", { ascending: false })
      .limit(100);
    if (data) setHistory(data);
  };

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq('status', 'Pending')
      .order("created_at", { ascending: false });

    if (data) {
      const formatted = data.map((c) => ({
        id: c.id,
        type: c.type,
        message: c.message,
        created_at: c.created_at,
        userName: c.userName || "Unknown User",
      }));
      setComplaints(formatted);
    }
  };

  const toggleCamera = () => {
    setIsCameraActive(prev => !prev);
  };

  useEffect(() => {
    if (!isCameraActive) return;

    const scanPlate = async () => {
      if (isOcrPausedRef.current) return;

      const video = videoRef.current;
      if (!video || video.readyState !== 4) return;

      setIsScanning(true);

      try {
        const canvas = document.createElement("canvas");
        const cropHeight = video.videoHeight / 3;
        canvas.width = video.videoWidth;
        canvas.height = cropHeight;

        const ctx = canvas.getContext("2d");

        ctx.filter = "grayscale(1) contrast(2) brightness(1.5)";

        const sy = video.videoHeight / 3;
        ctx.drawImage(video, 0, Math.floor(sy), video.videoWidth, Math.floor(cropHeight), 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg");

        const { data: { text } } = await Tesseract.recognize(dataUrl, "eng", {
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
          tessedit_pageseg_mode: '11',
        });

        const cleanText = text.replace(/[^A-Z0-9]/g, "");
        const platePattern = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;

        if (platePattern.test(cleanText)) {
          console.log("AUTOMATIC VALID PLATE DETECTED:", cleanText);
          toast.success("Plate Auto-Scanned. Please verify and submit.", { style: { background: "#0f172a", color: "#38bdf8", border: "1px solid #0369a1" }, icon: "🤖" });
          setManualPlate(cleanText);

          isOcrPausedRef.current = true;
          setTimeout(() => {
            isOcrPausedRef.current = false;
          }, 5000);
        }
      } catch (err) {
        console.error("Background OCR Error:", err);
      } finally {
        setIsScanning(false);
      }
    };

    const intervalId = setInterval(scanPlate, 1500);

    return () => clearInterval(intervalId);
  }, [isCameraActive]);

  // ==========================================
  // FIX #1 & #2: MUSICAL CHAIRS & LOCATION NAME
  // ==========================================
  const handleAutoEntry = async (plate, currentParked) => {
    if (Object.keys(currentParked).length >= config.slots) {
      toast.error("Parking Lot Full!");
      return;
    }

    // Mathematically find the lowest available slot number
    const assignedSlots = Object.values(currentParked)
      .map(session => session.slot_number)
      .filter(Boolean);

    let availableSlot = null;
    for (let i = 1; i <= config.slots; i++) {
      if (!assignedSlots.includes(i)) {
        availableSlot = i;
        break;
      }
    }

    if (!availableSlot) {
      toast.error("No valid slots available!");
      return;
    }

    const { error } = await supabase.from("parking_sessions").insert([{
      plate_number: plate,
      entry_time: new Date().toISOString(),
      status: "active",
      parking_lot_name: orgName, // Saves "khana khazana" to DB!
      slot_number: availableSlot // Locks the car into the exact slot
    }]);

    if (!error) {
      setManualPlate("");
      toast.success(`Entry Granted: ${plate} assigned to Slot ${availableSlot}`, {
        style: { background: "#022c22", color: "#34d399", border: "1px solid #059669" },
        icon: "🚀"
      });
    } else {
      toast.error("Error saving to database.");
    }
  };

  // ==========================================
  // FIX #3: FOOLPROOF WALLET DEDUCTION
  // ==========================================
  const handleAutoExit = async (plate, currentParked) => {
    const session = currentParked[plate];
    if (!session) return;

    const entryTime = new Date(session.entry_time);
    const exitTime = new Date();
    const durationMs = exitTime - entryTime;
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    const totalFee = durationHours <= 2 ? config.baseFee : config.baseFee + (durationHours - 2) * config.hourly;

    const { error } = await supabase
      .from("parking_sessions")
      .update({
        status: "completed",
        exit_time: exitTime.toISOString(),
        fee: totalFee,
      })
      .eq("plate_number", plate)
      .eq("status", "active");

    if (!error) {
      setManualPlate("");

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, wallet_balance, full_name, plate_number")
        .ilike("plate_number", `%${plate}%`);

      if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        const newBalance = profile.wallet_balance - totalFee;

        await supabase
          .from("profiles")
          .update({ wallet_balance: newBalance })
          .eq("id", profile.id);

        toast.success(`₹${totalFee} auto-deducted from ${profile.full_name || "User"}'s wallet!`, {
          style: { background: "#022c22", color: "#34d399", border: "1px solid #059669" },
          icon: "💸"
        });
      } else {
        toast.success(`Exit Confirmed! ₹${totalFee} due. No wallet found (Cash collection)`, {
          style: { background: "#4c0519", color: "#fb7185", border: "1px solid #e11d48" },
          icon: "🏁"
        });
      }
    }
  };

  const handleEntry = () => handleAutoEntry(manualPlate, parkedCars);
  const handleExit = () => handleAutoExit(manualPlate, parkedCars);

  const deleteSession = async (id) => {
    const { error } = await supabase.from("parking_sessions").update({ status: 'archived' }).eq("id", id);
    if (!error) {
      toast.success("Record deleted");
      fetchHistory();
    }
  };

  const clearAllHistory = async () => {
    const { error } = await supabase.from("parking_sessions").update({ status: 'archived' }).eq('status', 'completed');
    if (!error) {
      toast.success("All History Cleared");
      fetchHistory();
    } else {
      toast.error("Error clearing history.");
    }
  };

  const deleteComplaint = async (id) => {
    if (!id) return toast.error("Error: Complaint ID missing!");
    setComplaints(prev => prev.filter(c => c.id !== id));
    toast.success("Complaint dismissed!");
    const { error } = await supabase.from("complaints").delete().eq("id", id);
    if (error) {
      toast.error("Sync Error: " + error.message);
      fetchComplaints();
    }
  };

  const resolveComplaint = async (id) => {
    if (!id) return toast.error("Error: Complaint ID missing!");
    setComplaints(prev => prev.filter(c => c.id !== id));
    toast.success("Ticket marked as Resolved!", {
      style: { background: '#022c22', color: '#34d399', border: '1px solid #059669' },
      icon: '✅'
    });
    const { error } = await supabase.from("complaints").update({ status: 'Resolved' }).eq("id", id);
    if (error) {
      toast.error("Sync Error: " + error.message);
      fetchComplaints();
    }
  };

  const cancelBooking = async (id) => {
    if (!id) return;
    setReservations(prev => prev.filter(r => r.id !== id));
    toast.success("Reservation cancelled!");
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) fetchReservations();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("adminName");
    localStorage.removeItem("orgName");
    navigate("/");
  };

  // --- REVENUE CALCULATIONS ---
  const completedSessions = history.filter(s => (s.status === "completed" || s.status === "archived") && s.fee);
  const totalRevenue = completedSessions.reduce((sum, s) => sum + s.fee, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisWeek = new Date();
  thisWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  thisWeek.setHours(0, 0, 0, 0);

  const dayRevenue = completedSessions
    .filter(s => new Date(s.exit_time) >= today)
    .reduce((sum, s) => sum + s.fee, 0);

  const weekRevenue = completedSessions
    .filter(s => new Date(s.exit_time) >= thisWeek)
    .reduce((sum, s) => sum + s.fee, 0);

  const getWeeklyChartData = () => {
    const targetWeekStart = new Date(thisWeek);
    targetWeekStart.setDate(targetWeekStart.getDate() - (weekOffset * 7));

    const targetWeekEnd = new Date(targetWeekStart);
    targetWeekEnd.setDate(targetWeekStart.getDate() + 7);

    const weekSessions = completedSessions.filter(s => {
      const d = new Date(s.exit_time);
      return d >= targetWeekStart && d < targetWeekEnd;
    });

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(day => ({ name: day, revenue: 0 }));

    weekSessions.forEach(s => {
      const date = new Date(s.exit_time);
      const dayIndex = date.getDay();
      const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      data[mappedIndex].revenue += s.fee;
    });
    return data;
  };
  const weeklyChartData = getWeeklyChartData();

  const calculatePeakTimes = () => {
    const counts = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    let total = 0;
    history.forEach(s => {
      if (s.status !== 'completed' && s.status !== 'archived') return;
      if (!s.entry_time) return;
      const hour = new Date(s.entry_time).getHours();
      if (hour >= 6 && hour < 12) counts.Morning++;
      else if (hour >= 12 && hour < 17) counts.Afternoon++;
      else if (hour >= 17 && hour < 21) counts.Evening++;
      else counts.Night++;
      total++;
    });

    if (total === 0) return [
      { label: 'Morning (6AM-12PM)', percentage: 0, color: 'bg-emerald-500' },
      { label: 'Afternoon (12PM-5PM)', percentage: 0, color: 'bg-blue-500' },
      { label: 'Evening (5PM-9PM)', percentage: 0, color: 'bg-purple-500' },
      { label: 'Night (9PM-6AM)', percentage: 0, color: 'bg-rose-500' },
    ];

    return [
      { label: 'Morning (6AM-12PM)', percentage: Math.round((counts.Morning / total) * 100), color: 'bg-emerald-500' },
      { label: 'Afternoon (12PM-5PM)', percentage: Math.round((counts.Afternoon / total) * 100), color: 'bg-blue-500' },
      { label: 'Evening (5PM-9PM)', percentage: Math.round((counts.Evening / total) * 100), color: 'bg-purple-500' },
      { label: 'Night (9PM-6AM)', percentage: Math.round((counts.Night / total) * 100), color: 'bg-rose-500' },
    ];
  };
  const peakTimesData = calculatePeakTimes();

  const tabVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 30, staggerChildren: 0.1 } },
    exit: { opacity: 0, x: -50, transition: { type: "spring", stiffness: 300, damping: 30 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans pb-10 relative overflow-hidden selection:bg-blue-500/30">

      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>

      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/5 backdrop-blur-md border-b border-white/10 p-4 px-8 flex justify-between items-center sticky top-0 z-50 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(96,165,250,0.8)] flex items-center gap-2">
            <Car size={14} /> {orgName}
          </span>
          <h1 className="text-sm font-bold opacity-80 italic text-slate-200">
            Admin Console • {adminName}
          </h1>
        </div>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors shadow-inner text-white"
          >
            <Settings size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 bg-rose-600/20 text-rose-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-rose-600 border border-rose-500/30 hover:text-white transition-all shadow-inner"
          >
            <LogOut size={16} /> Logout
          </motion.button>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto mt-10 px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex flex-col items-center justify-center shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-shadow">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Live Slots</h3>
            <span className="text-4xl font-black text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
              {config.slots - Object.keys(parkedCars).length}
            </span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex flex-col items-center justify-center shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-shadow">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Occupied</h3>
            <span className="text-4xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
              {Object.keys(parkedCars).length}
            </span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex flex-col items-center justify-center shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-shadow">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Daily Revenue</h3>
            <span className="text-4xl font-black text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
              ₹{dayRevenue}
            </span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex flex-col items-center justify-center shadow-lg hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] transition-shadow relative overflow-hidden">
            {complaints.length > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/20 blur-xl rounded-full animate-pulse"></div>}
            <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Complaints</h3>
            <span className={`text-4xl font-black ${complaints.length > 0 ? "text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" : "text-slate-500"}`}>
              {complaints.length}
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap bg-black/20 p-1.5 rounded-2xl mb-10 w-fit border border-white/5 backdrop-blur-md shadow-lg"
        >
          {["monitor", "bookings", "history", "revenue", "complaints"].map((tab) => (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab)}
              className={`relative px-8 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-widest ${activeTab === tab ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              {activeTab === tab && (
                <motion.div layoutId="activeTab" className="absolute inset-0 bg-blue-600/80 border border-blue-500/50 rounded-xl shadow-neon-blue -z-10" />
              )}
              {tab === "history" ? "Records" : tab === "revenue" ? "Revenue" : tab === "complaints" ? "Inbox" : tab === "bookings" ? "Bookings" : "Monitor"}

              {tab === "complaints" && complaints.length > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse"></span>
              )}
              {tab === "bookings" && reservations.length > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse"></span>
              )}
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">

          {activeTab === "monitor" && (
            <motion.div key="monitor" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 lg:grid-cols-12 gap-10 perspective-1000">
              <motion.div variants={itemVariants} className="lg:col-span-4 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] h-fit flex flex-col items-center">

                <div className="relative bg-black w-full aspect-video rounded-3xl mb-6 overflow-hidden border-2 border-slate-700 shadow-inner group/camera">
                  <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/camera:opacity-100 transition-opacity">
                    <button onClick={toggleCamera} className="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all shadow-lg">
                      {isCameraActive ? <CameraOff size={18} /> : <Camera size={18} />}
                    </button>
                  </div>

                  {!isCameraActive ? (
                    <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center">
                      <CameraOff size={48} className="text-slate-700 mb-4 opacity-50" />
                      <span className="text-slate-500 font-black uppercase text-xs tracking-[0.3em]">CAMERA OFFLINE</span>
                      <button onClick={toggleCamera} className="mt-6 bg-blue-500/10 text-blue-400 border border-blue-500/30 px-6 py-2 rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        Turn On Scanner
                      </button>
                    </div>
                  ) : (
                    <>
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_20px_blue] z-20"></div>
                      <div className="absolute top-4 left-4 z-20 pointer-events-none">
                        <span className="bg-black/60 backdrop-blur-md text-emerald-400 font-bold uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-full border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)] flex items-center gap-2">
                          <span className={isScanning ? "w-1.5 h-1.5 rounded-full bg-blue-400 animate-spin" : "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"}></span>
                          {isScanning ? "SCANNING LENS..." : "CAMERA ACTIVE"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="w-full space-y-2 mb-8">
                  <label className="text-[10px] text-slate-400 font-bold uppercase ml-2 tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
                    Manual Entry Console
                  </label>
                  <input type="text" value={manualPlate} onChange={(e) => setManualPlate(e.target.value.toUpperCase().replace(/\s/g, ""))} placeholder="ENTER VEHICLE PLATE..." className="w-full p-6 bg-black/40 border border-blue-500/20 rounded-2xl text-center text-3xl font-mono font-black text-blue-300 uppercase outline-none focus:border-blue-500/60 focus:bg-black/60 transition-all shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] focus:shadow-[inset_0_0_30px_rgba(59,130,246,0.2),0_0_15px_rgba(59,130,246,0.3)] placeholder:text-slate-700 tracking-widest" />
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <motion.button onClick={handleEntry} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="col-span-1 bg-emerald-600/80 border border-emerald-500/50 py-5 rounded-2xl font-black text-xs uppercase shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:bg-emerald-500 transition-all text-white tracking-widest text-center">🟢 ENTRY</motion.button>
                  <motion.button onClick={handleExit} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="col-span-1 bg-rose-600/80 border border-rose-500/50 py-5 rounded-2xl font-black text-xs uppercase shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] hover:bg-rose-500 transition-all text-white tracking-widest text-center">🔴 EXIT</motion.button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="lg:col-span-8 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] h-[700px] overflow-hidden flex flex-col relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <h2 className="text-xl font-black italic tracking-wide mb-6 uppercase drop-shadow-md flex justify-between items-center relative z-10 text-white">
                  <span>Live Occupancy</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/30 not-italic uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    {Object.keys(parkedCars).length} / {config.slots} Used
                  </span>
                </h2>

                <div className="overflow-y-auto pr-2 custom-scrollbar relative z-10 flex-grow grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 auto-rows-max">
                  <AnimatePresence>
                    {Array.from({ length: parseInt(config.slots) }).map((_, i) => {
                      // Check for specifically assigned slot
                      let carPlate = Object.keys(parkedCars).find(plate => parkedCars[plate].slot_number === i + 1);
                      const car = carPlate ? parkedCars[carPlate] : null;

                      return car ? (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8, filter: "blur(5px)" }}
                          key={car.id || carPlate}
                          className="bg-blue-500/10 p-5 border border-blue-500 rounded-[1.5rem] flex flex-col justify-between shadow-[0_0_15px_rgba(59,130,246,0.2)] relative overflow-hidden group hover:border-blue-400 transition-colors"
                        >
                          <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors pointer-events-none"></div>
                          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 relative z-10 flex items-center justify-between">
                            Lot
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_currentColor]"></span>
                          </span>
                          <span className="text-xl font-mono font-black text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] relative z-10">
                            {carPlate}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-3 font-mono relative z-10">
                            {new Date(car.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div
                          layout
                          key={`empty-${i}`}
                          className="bg-black/40 p-5 border border-dashed border-slate-700 opacity-50 rounded-[1.5rem] flex flex-col justify-center items-center relative overflow-hidden transition-colors h-full min-h-[120px]"
                        >
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                            SLOT {i + 1}
                          </span>
                          <span className="text-sm font-black text-slate-600 uppercase">OPEN</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "bookings" && (
            <motion.div key="bookings" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col h-[700px] relative">
              <div className="p-8 border-b border-white/10 flex justify-between items-center bg-black/20">
                <h2 className="text-xl font-black italic tracking-wide uppercase text-white flex items-center gap-2">
                  <Calendar size={24} className="text-blue-400" /> Upcoming Reservations
                </h2>
                <span className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border border-blue-500/30">
                  {reservations.length} Expected
                </span>
              </div>

              <div className="overflow-y-auto flex-grow custom-scrollbar p-6 space-y-4">
                <AnimatePresence>
                  {reservations.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                      <Calendar size={48} className="mb-4 text-blue-500/40" />
                      <p className="italic font-light tracking-wide">No upcoming reservations.</p>
                    </motion.div>
                  ) : (
                    reservations.map((res) => (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} key={res.id} className="bg-black/30 p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:border-blue-500/30 transition-colors group">
                        <div className="flex gap-6 items-center">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Expected Vehicle</p>
                            <h4 className="text-2xl font-mono font-black text-blue-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">{res.plate_number}</h4>
                          </div>
                          <div className="hidden md:block h-10 w-px bg-white/10"></div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Scheduled Arrival</p>
                            <h4 className="text-lg font-bold text-white">{new Date(res.scheduled_time).toLocaleString()}</h4>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-2 md:mt-0 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => cancelBooking(res.id)}
                            className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2"
                          >
                            <Trash2 size={12} /> Cancel
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div key="history" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col h-[700px] relative">
              <div className="p-8 border-b border-white/10 flex justify-between items-center bg-black/20">
                <h2 className="text-xl font-black italic tracking-wide uppercase text-white">Record Log</h2>
                <div className="flex gap-4 items-center">
                  <button onClick={clearAllHistory} className="bg-rose-600/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-inner flex items-center gap-2">
                    <Trash2 size={14} /> Clear All History
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto overflow-y-auto flex-grow custom-scrollbar p-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Plate Number</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Entry Time</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Exit Time</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Fee (₹)</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.filter(row => row.status !== 'archived').map((row) => (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td className="p-4 font-mono font-bold text-blue-300">{row.plate_number}</td>
                        <td className="p-4 text-slate-400 text-xs text-mono">{new Date(row.entry_time).toLocaleString()}</td>
                        <td className="p-4 text-slate-400 text-xs text-mono">
                          {row.exit_time ? (
                            new Date(row.exit_time).toLocaleString()
                          ) : (
                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold uppercase text-[9px] border border-emerald-500/30 flex items-center gap-1 w-fit">Inside</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-black text-emerald-300">₹{row.fee || 0}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => deleteSession(row.id)} className="text-slate-500 hover:text-rose-400 p-1"><Trash2 size={16} /></button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "revenue" && (
            <motion.div key="revenue" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "Today's Earnings", value: dayRevenue, icon: Calendar, borderColor: "border-emerald-500/20", glowColor: "bg-emerald-500/10", iconColor: "text-emerald-400" },
                  { title: "This Week", value: weekRevenue, icon: TrendingUp, borderColor: "border-blue-500/20", glowColor: "bg-blue-500/10", iconColor: "text-blue-400" },
                  { title: "All-Time Revenue", value: totalRevenue, icon: DollarSign, borderColor: "border-purple-500/20", glowColor: "bg-purple-500/10", iconColor: "text-purple-400" }
                ].map((stat, i) => (
                  <motion.div variants={itemVariants} key={i} className={`bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border ${stat.borderColor} shadow-[0_0_30px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
                    <div className={`absolute -top-10 -right-10 w-40 h-40 ${stat.glowColor} blur-3xl rounded-full`}></div>
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                      <stat.icon className={`${stat.iconColor} drop-shadow-[0_0_8px_currentColor]`} size={24} />
                    </div>
                    <h3 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                      <span className={`${stat.iconColor} mr-1`}>₹</span>{stat.value}
                    </h3>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)] relative">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-blue-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                      <TrendingUp size={16} /> Weekly Revenue Trend
                    </h3>
                    <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5 shadow-inner">
                      <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><ChevronLeft size={16} /></button>
                      <span className="text-[10px] font-bold text-slate-300 w-20 text-center tracking-widest">{weekOffset === 0 ? "THIS WEEK" : `${weekOffset}W AGO`}</span>
                      <button onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))} disabled={weekOffset === 0} className={`p-1.5 rounded-lg ${weekOffset === 0 ? "opacity-30" : "hover:bg-white/10 text-slate-400 hover:text-white"}`}><ChevronRight size={16} /></button>
                    </div>
                  </div>
                  <div className="h-64 min-h-[256px] w-full min-w-[300px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                      <BarChart data={weeklyChartData}>
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', color: '#fff' }} itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }} formatter={(value) => [`₹${value}`, 'Revenue']} />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                  <h3 className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest mb-8 flex items-center gap-2">
                    <LayoutDashboard size={16} /> Peak Entry Times
                  </h3>
                  <div className="space-y-6">
                    {peakTimesData.map((area, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-white text-xs font-bold">{area.label}</span>
                          <span className="text-slate-400 text-[10px] font-black">{area.percentage}%</span>
                        </div>
                        <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5 shadow-inner">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${area.percentage}%` }} transition={{ duration: 1.5, delay: i * 0.2, type: "spring" }} className={`h-full ${area.color} shadow-[0_0_10px_currentColor]`}></motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === "complaints" && (
            <motion.div key="complaints" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {complaints.length === 0 ? (
                <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-500 opacity-60">
                  <CheckCircle size={48} className="mb-4 text-emerald-500/40" />
                  <p className="italic font-light tracking-wide">Inbox is empty. All clear!</p>
                </div>
              ) : (
                complaints.map((c, i) => (
                  <motion.div variants={itemVariants} whileHover={{ y: -5 }} key={i} className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-rose-500/20 hover:border-rose-500/50 shadow-lg relative transition-all group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 pointer-events-none"></div>
                    <div className="flex justify-between items-center mb-4 relative z-10">
                      <span className="bg-rose-900/30 text-rose-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                        {c.type || c.subject || c.category || "General"}
                      </span>
                      <div className="flex items-center gap-3 relative z-20">
                        <span className="text-[10px] text-slate-500 font-mono font-bold">{new Date(c.created_at).toLocaleDateString()}</span>
                        <button onClick={() => resolveComplaint(c.id)} className="text-slate-500 hover:text-emerald-400 p-1.5 rounded-md hover:bg-emerald-500/10 transition-colors" title="Mark as Resolved">
                          <CheckCircle size={14} />
                        </button>
                        <button onClick={() => deleteComplaint(c.id)} className="text-slate-500 hover:text-rose-400 p-1.5 rounded-md hover:bg-rose-500/10"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <p className="text-sm italic font-light mb-6 text-slate-300 relative z-10">"{c.message || c.description || c.content || c.complaint_text || "No description provided."}"</p>
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest flex items-center gap-2"><MessageSquare size={12} /> From: <span className="text-white">{c.userName || c.user_name || c.name || "User"}</span></p>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative">
              <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 p-2 rounded-full hover:bg-white/10"><X size={16} /></button>
              <h2 className="text-xl font-black italic tracking-wide mb-6 uppercase flex items-center gap-2 text-white"><Settings size={20} className="text-blue-400" /> Config</h2>
              <div className="space-y-6">
                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Total Capacity</label><input type="number" value={config.slots} onChange={(e) => setConfig({ ...config, slots: Number(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Base Fee (₹)</label><input type="number" value={config.baseFee} onChange={(e) => setConfig({ ...config, baseFee: Number(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-emerald-400 font-mono font-bold outline-none" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Hourly (₹)</label><input type="number" value={config.hourly} onChange={(e) => setConfig({ ...config, hourly: Number(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-emerald-400 font-mono font-bold outline-none" /></div>
                </div>
                <button onClick={() => { toast.success("Settings saved."); setIsSettingsOpen(false); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase py-4 rounded-xl shadow-neon-blue mt-4">Apply</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default AdminDashboard;