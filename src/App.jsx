import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Receipts from './pages/Receipts';
import Products from './pages/Products';
import Productions from './pages/Productions';
import FinishedProducts from './pages/FinishedProducts';
import History from './pages/History';
import { Home } from 'lucide-react';

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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="materials" element={<Materials />} />
          <Route path="receipts" element={<Receipts />} />
          <Route path="products" element={<Products />} />
          <Route path="productions" element={<Productions />} />
          <Route path="finished-products" element={<FinishedProducts />} />
          <Route path="history" element={<History />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
