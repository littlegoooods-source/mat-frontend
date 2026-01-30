import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Receipts from './pages/Receipts';
import Products from './pages/Products';
import Productions from './pages/Productions';
import FinishedProducts from './pages/FinishedProducts';
import History from './pages/History';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { Home } from 'lucide-react';
import { clearTokens, authApi } from './services/api';

// 404 Page
function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-display font-bold text-slate-600 mb-4">404</h1>
      <p className="text-xl text-slate-400 mb-8">Страница не найдена</p>
      <Link 
        to="/dashboard" 
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors"
      >
        <Home size={20} />
        На главную
      </Link>
    </div>
  );
}

// Protected Route component
function ProtectedRoute({ children, user }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    const storedOrganizations = localStorage.getItem('organizations');
    const token = localStorage.getItem('accessToken');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setOrganizations(storedOrganizations ? JSON.parse(storedOrganizations) : []);
        
        // Verify token is still valid
        authApi.me().then(response => {
          setUser(response.data);
        }).catch(() => {
          // Token is invalid, clear and redirect to login
          handleLogout();
        });
      } catch (e) {
        handleLogout();
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, orgsData) => {
    setUser(userData);
    setOrganizations(orgsData || []);
  };

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    setOrganizations([]);
  };

  const handleSwitchOrganization = async (organizationId) => {
    try {
      const response = await authApi.switchOrganization(organizationId);
      const { accessToken, refreshToken, user: userData, organizations: orgsData } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('organizations', JSON.stringify(orgsData));
      
      setUser(userData);
      setOrganizations(orgsData);
      
      // Reload page to refresh all data with new organization context
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  };

  const handleOrganizationsUpdate = (orgsData) => {
    setOrganizations(orgsData);
    localStorage.setItem('organizations', JSON.stringify(orgsData));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/register" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Register onLogin={handleLogin} />
          } 
        />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute user={user}>
              <Layout 
                user={user} 
                organizations={organizations} 
                onLogout={handleLogout}
                onSwitchOrganization={handleSwitchOrganization}
              />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="materials" element={<Materials />} />
          <Route path="receipts" element={<Receipts />} />
          <Route path="products" element={<Products />} />
          <Route path="productions" element={<Productions />} />
          <Route path="finished-products" element={<FinishedProducts />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={
            <Settings 
              user={user} 
              organizations={organizations}
              onOrganizationsUpdate={handleOrganizationsUpdate}
              onSwitchOrganization={handleSwitchOrganization}
            />
          } />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
