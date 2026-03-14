import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

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

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

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