import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Receipts from './pages/Receipts';
import Products from './pages/Products';
import Productions from './pages/Productions';
import FinishedProducts from './pages/FinishedProducts';
import History from './pages/History';

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
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
