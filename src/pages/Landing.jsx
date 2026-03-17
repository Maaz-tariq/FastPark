import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Zap, Wallet, LayoutDashboard, ArrowRight, ShieldCheck, Facebook, Twitter, Instagram, Sun, Moon } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* BACKGROUND GLOW EFFECTS */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-700 dark:bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* NAVBAR */}
      <nav className="relative z-10 flex justify-between items-center p-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-green-700 dark:bg-blue-600 p-2 rounded-xl">
            <Car size={24} className="text-white" />
          </div>
          <span className="text-2xl font-black italic tracking-tighter uppercase text-slate-800 dark:text-white">FastPark</span>
        </div>
        
        <button 
          onClick={() => navigate('/login')} 
          className="text-sm font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:text-white transition-colors"
        >
          Sign In
        </button>
      </nav>

      {/* HERO SECTION */}
      <main className="relative z-10 flex flex-col items-center text-center pt-24 pb-32 px-6 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 mb-8">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Live Hackathon Demo</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[1.1] mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Parking Reimagined.</span><br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Zero Friction.</span>
        </h1>
        
        <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
          No paper tickets. No cash. Just scan your plate and walk away. FastPark uses advanced OCR and automated smart wallets to make parking invisible.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button 
            onClick={() => navigate('/login')} 
            className="bg-green-700 dark:bg-blue-600 hover:bg-green-600 dark:hover:bg-blue-500 text-white dark:text-white px-8 py-4 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 active:scale-95 transition-all"
          >
            Register Vehicle <ArrowRight size={18} />
          </button>
          <button 
            onClick={() => navigate('/login')} 
            className="bg-slate-800 hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-700 px-8 py-4 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            Admin Access <LayoutDashboard size={18} />
          </button>
        </div>
      </main>

      {/* FEATURES GRID */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 hover:border-blue-500/50 transition-all group">
            <div className="bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-700 group-hover:border-blue-500">
              <Zap size={24} className="text-green-700 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3 uppercase italic">Lightning OCR</h3>
            <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Camera-based entry and exit. Our system reads plates instantly, opening the gates without you ever rolling down your window.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 hover:border-emerald-500/50 transition-all group">
            <div className="bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-700 group-hover:border-emerald-500">
              <Wallet size={24} className="text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3 uppercase italic">Smart Wallet</h3>
            <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Fees are calculated down to the minute and automatically deducted from your pre-paid profile balance upon exit.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 hover:border-purple-500/50 transition-all group">
            <div className="bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-700 group-hover:border-purple-500">
              <ShieldCheck size={24} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3 uppercase italic">Admin Control</h3>
            <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              A centralized dashboard for parking lot managers to view live slot occupancy, track revenue, and handle customer complaints.
            </p>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-300 dark:border-white/5 bg-white dark:bg-slate-950/50 dark:backdrop-blur-md relative z-10 pt-16 pb-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Column 1: Brand */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-green-700 dark:bg-blue-600 p-1.5 rounded-lg shadow-md dark:shadow-neon-blue">
                <Car size={20} className="text-white" />
              </div>
              <span className="text-xl font-black italic tracking-tighter uppercase text-slate-800 dark:text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">FastPark</span>
            </div>
            <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-light">
              Next-gen automated parking management for a smarter future.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-slate-800 dark:text-white font-bold uppercase tracking-widest text-xs mb-2">Quick Links</h4>
            {['Help & Support', 'Privacy Policy', 'Terms of Service', 'Contact Us'].map((link) => (
              <a href="#" key={link} className="text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-green-700 dark:text-blue-400 text-sm transition-colors w-fit">
                {link}
              </a>
            ))}
          </div>

          {/* Column 3: Social & Connect */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-slate-800 dark:text-white font-bold uppercase tracking-widest text-xs mb-2">Connect With Us</h4>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram].map((Icon, index) => (
                <button 
                  key={index} 
                  className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl hover:bg-white/10 text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-green-700 dark:text-blue-400 transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:-translate-y-1 group"
                >
                  <Icon size={18} className="group-hover:scale-110 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="border-t border-slate-300 dark:border-slate-800 pt-8 mt-8 flex justify-center items-center">
          <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500 tracking-wide">
            © 2026 FastPark. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;