import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          // If no profile exists, default to 'user' or handle error
          setRole(profile?.role || 'user'); 
        }
      } catch (err) {
        console.error("Auth Error:", err);
      } finally {
        setLoading(false);
      }
    };
    getSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full"></div>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-12 h-12 border-4 border-slate-800 border-t-blue-500 rounded-full mb-4 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        />
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-blue-400 font-bold tracking-widest uppercase text-xs drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]"
        >
          Authenticating...
        </motion.p>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  // If role isn't loaded yet, stay on loading or go to login
  if (!role) return <Navigate to="/" replace />;

  if (requiredRole && role !== requiredRole) {
    const target = role === 'admin' ? '/admin' : '/user';
    return <Navigate to={target} replace />;
  }

  return children;
};

export default ProtectedRoute;