import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Boxes, 
  Factory, 
  ShoppingCart, 
  History,
  Menu,
  X,
  LogOut,
  Building2,
  ChevronDown,
  User,
  Settings
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Главная' },
  { path: '/materials', icon: Package, label: 'Материалы' },
  { path: '/receipts', icon: Truck, label: 'Поступления' },
  { path: '/products', icon: Boxes, label: 'Изделия' },
  { path: '/productions', icon: Factory, label: 'Производство' },
  { path: '/finished-products', icon: ShoppingCart, label: 'Готовая продукция' },
  { path: '/history', icon: History, label: 'История' },
  { path: '/settings', icon: Settings, label: 'Настройки' },
];

function Layout({ user, organizations, onLogout, onSwitchOrganization }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const orgDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target)) {
        setOrgDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  const currentOrg = organizations?.find(o => o.organizationId === user?.currentOrganizationId);

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
          <div className="p-6 pl-14 lg:pl-6 border-b border-slate-700/50">
            <h1 className="text-2xl font-display font-bold gradient-text">
              Мастерская
            </h1>
            <p className="text-sm text-slate-400 mt-1">Система учёта</p>
          </div>

          {/* Organization Switcher */}
          {organizations && organizations.length > 0 && (
            <div className="p-4 border-b border-slate-700/50" ref={orgDropdownRef}>
              <button
                onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 size={18} className="text-primary-400 flex-shrink-0" />
                  <span className="truncate text-sm font-medium text-slate-200">
                    {currentOrg?.organizationName || 'Выберите организацию'}
                  </span>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`text-slate-400 flex-shrink-0 transition-transform ${orgDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {orgDropdownOpen && (
                <div className="absolute left-4 right-4 mt-2 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50 max-h-64 overflow-auto">
                  {organizations.map((org) => (
                    <button
                      key={org.organizationId}
                      onClick={() => {
                        if (org.organizationId !== user?.currentOrganizationId) {
                          onSwitchOrganization(org.organizationId);
                        }
                        setOrgDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors flex items-center gap-2 ${
                        org.organizationId === user?.currentOrganizationId 
                          ? 'bg-primary-600/20 text-primary-400' 
                          : 'text-slate-300'
                      }`}
                    >
                      <Building2 size={16} />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{org.organizationName}</div>
                        <div className="text-xs text-slate-500">
                          {org.isPersonal ? 'Личное' : org.role}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-auto">
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

          {/* User menu */}
          <div className="p-4 border-t border-slate-700/50" ref={userDropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center">
                <User size={16} className="text-primary-400" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-slate-200 truncate">
                  {user?.fullName || user?.username || 'Пользователь'}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {user?.email}
                </div>
              </div>
              <ChevronDown 
                size={16} 
                className={`text-slate-400 flex-shrink-0 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {userDropdownOpen && (
              <div className="absolute left-4 right-4 bottom-20 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50">
                <div className="p-3 border-b border-slate-700">
                  <div className="text-sm font-medium text-slate-200">{user?.fullName || user?.username}</div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                  {currentOrg && (
                    <div className="text-xs text-primary-400 mt-1">
                      {currentOrg.role === 'Owner' ? 'Владелец' : 'Участник'} · {currentOrg.organizationName}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors flex items-center gap-2 text-red-400"
                >
                  <LogOut size={16} />
                  <span>Выйти</span>
                </button>
              </div>
            )}
          </div>

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
      <main className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto animate-fadeIn">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
