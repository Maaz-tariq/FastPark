import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Building2, Key, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('user'); 
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    adminKey: '',
    orgName: ''
  });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // --- REGISTRATION ---
        if (!formData.email.toLowerCase().endsWith('@gmail.com')) {
          throw new Error("Only @gmail.com addresses are allowed.");
        }

        if (role === 'admin') {
          if (formData.password.length > 8) {
            throw new Error("Admin passwords must be up to 8 characters only.");
          }
          if (formData.adminKey !== 'ADMIN123') {
            throw new Error("Invalid Admin Secret Key!");
          }
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              role: role,
              org_name: role === 'admin' ? formData.orgName : null
            }
          }
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            throw new Error("User already exists. Please sign in instead.");
          }
          throw error;
        }
        toast.success("Account created! Welcome to FastPark.");
        // The SQL Trigger creates the profile row automatically
        if (data.user) navigate(role === 'admin' ? '/admin' : '/user');

      } else {
        // --- LOGIN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        // Fetch profile using maybeSingle() to prevent the "coerce" error
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
          toast.error("Profile not found. Please contact support.");
          return;
        }

        localStorage.setItem('userName', profile.full_name);
        localStorage.setItem('userRole', profile.role);
        if (profile.role === 'admin') localStorage.setItem('orgName', profile.place_name);
        
        toast.success(`Welcome back, ${profile.full_name}!`);
        navigate(profile.role === 'admin' ? '/admin' : '/user');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans relative overflow-hidden selection:bg-blue-500/30">
      
      {/* BACKGROUND GLOW EFFECTS */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md perspective-1000"
      >
        <motion.div 
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-10 relative overflow-hidden"
        >
          {/* Subtle top highlight */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          
          <header className="text-center mb-10">
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">FASTPARK</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </p>
          </header>

          {/* Role Switcher */}
          <div className="flex bg-black/20 p-1.5 rounded-2xl mb-8 border border-white/5 backdrop-blur-md relative z-10">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setRole('user')} 
              className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all relative ${role === 'user' ? 'text-white shadow-neon-blue' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {role === 'user' && (
                <motion.div layoutId="activeRole" className="absolute inset-0 bg-blue-600 rounded-xl -z-10" transition={{ type: "spring", stiffness: 300, damping: 20 }} />
              )}
              User
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setRole('admin')} 
              className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all relative ${role === 'admin' ? 'text-white shadow-neon-blue' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {role === 'admin' && (
                <motion.div layoutId="activeRole" className="absolute inset-0 bg-blue-600 rounded-xl -z-10" transition={{ type: "spring", stiffness: 300, damping: 20 }} />
              )}
              Admin
            </motion.button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 relative z-10">
            <AnimatePresence mode="popLayout">
              {isSignUp && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.9 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="relative origin-top"
                >
                  <User className="absolute left-4 top-4 text-slate-400" size={18}/>
                  <input required placeholder="Full Name" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full bg-black/20 border border-white/10 p-4 pl-12 rounded-2xl text-sm outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all text-white placeholder:text-slate-600 shadow-inner" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-4 text-slate-400" size={18}/>
              <input type="email" required placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-black/20 border border-white/10 p-4 pl-12 rounded-2xl text-sm outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all text-white placeholder:text-slate-600 shadow-inner" />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-400" size={18}/>
              <input type={showPassword ? "text" : "password"} required placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-black/20 border border-white/10 p-4 pl-12 pr-12 rounded-2xl text-sm outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all text-white placeholder:text-slate-600 shadow-inner" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-blue-400 transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <AnimatePresence mode="popLayout">
              {role === 'admin' && isSignUp && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.9 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 origin-top"
                >
                  <div className="relative">
                    <Building2 className="absolute left-4 top-4 text-purple-400" size={18}/>
                    <input required placeholder="Organization Name (e.g. Area X)" value={formData.orgName} onChange={(e) => setFormData({...formData, orgName: e.target.value})} className="w-full bg-black/20 border border-purple-500/30 p-4 pl-12 rounded-2xl text-sm outline-none focus:border-purple-500/80 focus:bg-white/5 transition-all text-white placeholder:text-slate-600 shadow-inner" />
                  </div>
                  <div className="relative">
                    <Key className="absolute left-4 top-4 text-purple-400" size={18}/>
                    <input type={showAdminKey ? "text" : "password"} required placeholder="Admin Secret Key" value={formData.adminKey} onChange={(e) => setFormData({...formData, adminKey: e.target.value})} className="w-full bg-black/20 border border-purple-500/30 p-4 pl-12 pr-12 rounded-2xl text-sm outline-none focus:border-purple-500/80 focus:bg-white/5 transition-all text-white placeholder:text-slate-600 shadow-inner" />
                    <button type="button" onClick={() => setShowAdminKey(!showAdminKey)} className="absolute right-4 top-4 text-purple-400 hover:text-purple-300 transition-colors">
                      {showAdminKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading} 
              className="w-full border border-blue-500/50 bg-blue-600/90 py-4 rounded-2xl font-black text-white shadow-neon-blue flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors mt-6 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? 'Processing...' : isSignUp ? 'REGISTER' : 'SIGN IN'} 
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>}
              </span>
              {/* Shine effect */}
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:left-[200%] transition-all duration-1000 ease-out"></div>
            </motion.button>
          </form>

          <p className="text-center mt-8 text-xs text-slate-500 font-bold relative z-10">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => setIsSignUp(!isSignUp)} className="ml-2 text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;