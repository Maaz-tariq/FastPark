import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* 1. Public Landing Page - The new "Face" of your app */}
        <Route path="/" element={<Landing />} />

        {/* 2. Authentication Page - Moved from "/" to "/auth" or "/login" */}
        <Route path="/login" element={<Login />} />

        {/* 3. Protected Admin Route */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* 4. Protected User Route */}
        <Route 
          path="/user" 
          element={
            <ProtectedRoute requiredRole="user">
              <UserDashboard />
            </ProtectedRoute>
          } 
        />

        {/* 5. Catch-all: Redirect unknown routes to Landing */}
        <Route path="*" element={<Landing />} />
      </Routes>
    </Router>
  );
}

export default App;