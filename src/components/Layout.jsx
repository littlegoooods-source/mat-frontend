import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Boxes, 
  Factory, 
  ShoppingCart, 
  History,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Главная' },
  { path: '/materials', icon: Package, label: 'Материалы' },
  { path: '/receipts', icon: Truck, label: 'Поступления' },
  { path: '/products', icon: Boxes, label: 'Изделия' },
  { path: '/productions', icon: Factory, label: 'Производство' },
  { path: '/finished-products', icon: ShoppingCart, label: 'Готовая продукция' },
  { path: '/history', icon: History, label: 'История' },
];

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg glass"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 glass-darker
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-slate-700/50">
            <h1 className="text-2xl font-display font-bold gradient-text">
              Мастерская
            </h1>
            <p className="text-sm text-slate-400 mt-1">Система учёта</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-primary-600/20 to-primary-500/10 text-primary-400 border-l-2 border-primary-500' 
                    : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'}
                `}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="text-xs text-slate-500 text-center">
              Version 3.0
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto animate-fadeIn">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
