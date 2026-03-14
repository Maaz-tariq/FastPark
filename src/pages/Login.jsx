import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Building2, Key, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('user'); 
  const [loading, setLoading] = useState(false);

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
        if (role === 'admin' && formData.adminKey !== 'ADMIN123') {
          throw new Error("Invalid Admin Secret Key!");
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

        if (error) throw error;
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-slate-800 rounded-[3rem] border border-slate-700 shadow-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
        
        <header className="text-center mb-10">
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">FASTPARK</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </p>
        </header>

        {/* Role Switcher */}
        <div className="flex bg-slate-900 p-1 rounded-2xl mb-8 border border-slate-700">
          <button onClick={() => setRole('user')} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all ${role === 'user' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>User</button>
          <button onClick={() => setRole('admin')} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all ${role === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Admin</button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-500" size={18}/>
              <input required placeholder="Full Name" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-4 pl-12 rounded-2xl text-sm outline-none focus:border-blue-500 text-white" />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-4 text-slate-500" size={18}/>
            <input type="email" required placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-4 pl-12 rounded-2xl text-sm outline-none focus:border-blue-500 text-white" />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-slate-500" size={18}/>
            <input type="password" required placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-4 pl-12 rounded-2xl text-sm outline-none focus:border-blue-500 text-white" />
          </div>

          {role === 'admin' && isSignUp && (
            <>
              <div className="relative">
                <Building2 className="absolute left-4 top-4 text-slate-500" size={18}/>
                <input required placeholder="Organization Name (e.g. Area X)" value={formData.orgName} onChange={(e) => setFormData({...formData, orgName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-4 pl-12 rounded-2xl text-sm outline-none focus:border-blue-500 text-white" />
              </div>
              <div className="relative">
                <Key className="absolute left-4 top-4 text-slate-500" size={18}/>
                <input type="password" required placeholder="Admin Secret Key" value={formData.adminKey} onChange={(e) => setFormData({...formData, adminKey: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-4 pl-12 rounded-2xl text-sm outline-none focus:border-blue-500 text-white" />
              </div>
            </>
          )}

          <button disabled={loading} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-white shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 hover:bg-blue-500 active:scale-95 transition-all mt-4">
            {loading ? 'Processing...' : isSignUp ? 'REGISTER' : 'SIGN IN'} <ArrowRight size={18}/>
          </button>
        </form>

        <p className="text-center mt-8 text-xs text-slate-500 font-bold">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => setIsSignUp(!isSignUp)} className="ml-2 text-blue-500 uppercase tracking-widest">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;