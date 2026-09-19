import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  AlertTriangle,
  MapPin,
  HeartHandshake,
  Shield,
  Radio,
  CloudOff,
  Activity,
  Bell,
  Settings,
  LogOut,
  X,
  Package,
  FileText,
  ShieldCheck,
  Compass,
  UserCheck,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ mobileOpen, setMobileOpen, unreadCount = 0 }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const userRole = (user?.role || '').toUpperCase();

  const handleLogout = () => {
    logout();
    if (setMobileOpen) setMobileOpen(false);
    navigate('/auth');
  };

  const handleLinkClick = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group ${
      isActive
        ? 'bg-primary-50 text-primary-900 border border-primary-200/80 shadow-xs'
        : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/80'
    }`;

  const iconClass = (isActive) =>
    `w-4 h-4 transition-transform group-hover:scale-110 ${
      isActive ? 'text-primary-700' : 'text-slate-400 group-hover:text-primary-600'
    }`;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 shadow-soft lg:shadow-none flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Logo & Network Title */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <Link
            to="/"
            onClick={handleLinkClick}
            className="flex items-center space-x-3 group focus:outline-none"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-700 via-primary-800 to-navy-900 flex items-center justify-center text-white shadow-soft shrink-0 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-teal-200" />
              <Activity className="w-3 h-3 text-teal-400 absolute center" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-1">
                <span className="text-lg font-black tracking-tight text-navy-900 leading-tight">
                  ResQNet
                </span>
                <span className="text-lg font-black text-primary-600 tracking-tight leading-tight">
                  AI
                </span>
              </div>
              <span className="text-[8.5px] font-bold text-slate-500 tracking-wider uppercase mt-0.5 whitespace-nowrap">
                EMERGENCY COORDINATION NETWORK
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Middle: Role-based Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* 1. Common / Home Link */}
          <NavLink to="/" end onClick={handleLinkClick} className={navItemClass}>
            {({ isActive }) => (
              <div className="flex items-center space-x-2.5">
                <Home className={iconClass(isActive)} />
                <span>Home</span>
              </div>
            )}
          </NavLink>

          {/* 2. Community Groups (Public / Community Mesh) */}
          <NavLink to="/groups" onClick={handleLinkClick} className={navItemClass}>
            {({ isActive }) => (
              <div className="flex items-center space-x-2.5">
                <Users className={iconClass(isActive)} />
                <span>Community Groups</span>
              </div>
            )}
          </NavLink>

          {/* 3. Emergency Reporting (Always Accessible) */}
          <NavLink to="/need-help" onClick={handleLinkClick} className={navItemClass}>
            {({ isActive }) => (
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className={`w-4 h-4 ${isActive ? 'text-rose-600' : 'text-rose-500'}`} />
                <span className={isActive ? 'text-rose-900' : 'text-slate-700'}>Report Emergency</span>
              </div>
            )}
          </NavLink>

          {/* 4. Request Tracking */}
          <NavLink to="/track" onClick={handleLinkClick} className={navItemClass}>
            {({ isActive }) => (
              <div className="flex items-center space-x-2.5">
                <MapPin className={iconClass(isActive)} />
                <span>Track Request</span>
              </div>
            )}
          </NavLink>

          {/* ROLE SPECIFIC NAVIGATION: ANONYMOUS */}
          {!isAuthenticated && (
            <div className="pt-4 mt-3 border-t border-slate-100 space-y-1">
              <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Account Access
              </div>
              <NavLink to="/auth" end onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <div className="flex items-center space-x-2.5">
                    <LogIn className={iconClass(isActive)} />
                    <span>Sign In</span>
                  </div>
                )}
              </NavLink>
              <NavLink to="/auth?tab=register" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <div className="flex items-center space-x-2.5">
                    <UserPlus className={iconClass(isActive)} />
                    <span>Register as Provider</span>
                  </div>
                )}
              </NavLink>
            </div>
          )}

          {/* ROLE SPECIFIC NAVIGATION: RESOURCE PROVIDER */}
          {isAuthenticated && (userRole === 'RESOURCE_PROVIDER' || userRole === 'CITIZEN') && (
            <div className="pt-3 mt-2 border-t border-slate-100 space-y-1">
              <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-teal-700">
                Provider Hub
              </div>
              <NavLink to="/provider/dashboard" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <div className="flex items-center space-x-2.5">
                    <HeartHandshake className={iconClass(isActive)} />
                    <span>Provide Resources</span>
                  </div>
                )}
              </NavLink>
              <NavLink to="/critical-scenarios" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <div className="flex items-center space-x-2.5">
                    <Activity className={iconClass(isActive)} />
                    <span>Critical Scenarios</span>
                  </div>
                )}
              </NavLink>
              <NavLink to="/notifications" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-2.5">
                      <Bell className={iconClass(isActive)} />
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          )}

          {/* ROLE SPECIFIC NAVIGATION: ADMIN */}
          {isAuthenticated && userRole === 'ADMIN' && (
            <div className="pt-3 mt-2 border-t border-slate-100 space-y-1">
              <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-700">
                Administration
              </div>
              <NavLink to="/admin/dashboard" end onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <div className="flex items-center space-x-2.5">
                    <Shield className={iconClass(isActive)} />
                    <span>Command Center</span>
                  </div>
                )}
              </NavLink>
              <NavLink to="/admin/requests" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <div className="flex items-center space-x-2.5">
                    <FileText className={iconClass(isActive)} />
                    <span>Emergency Requests</span>
                  </div>
                )}
              </NavLink>
              <NavLink to="/critical-scenarios" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <div className="flex items-center space-x-2.5">
                    <Activity className={iconClass(isActive)} />
                    <span>Critical Scenarios</span>
                  </div>
                )}
              </NavLink>
              <NavLink to="/notifications" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-2.5">
                      <Bell className={iconClass(isActive)} />
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          )}

          {/* ROLE SPECIFIC NAVIGATION: COORDINATOR */}
          {isAuthenticated && userRole === 'COORDINATOR' && (
            <div className="pt-3 mt-2 border-t border-slate-100 space-y-1">
              <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-primary-700">
                Coordination Desk
              </div>
              <NavLink to="/coordinator" end onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <div className="flex items-center space-x-2.5">
                    <Radio className={iconClass(isActive)} />
                    <span>Command Center</span>
                  </div>
                )}
              </NavLink>
              <NavLink to="/admin/requests" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <div className="flex items-center space-x-2.5">
                    <FileText className={iconClass(isActive)} />
                    <span>Emergency Requests</span>
                  </div>
                )}
              </NavLink>
              <NavLink to="/critical-scenarios" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <div className="flex items-center space-x-2.5">
                    <Activity className={iconClass(isActive)} />
                    <span>Critical Scenarios</span>
                  </div>
                )}
              </NavLink>
              <NavLink to="/offline-reports" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <div className="flex items-center space-x-2.5">
                    <CloudOff className={iconClass(isActive)} />
                    <span>Offline Queue</span>
                  </div>
                )}
              </NavLink>
              <NavLink to="/notifications" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-2.5">
                      <Bell className={iconClass(isActive)} />
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          )}

          {/* Offline Queue is also helpful for everyone */}
          <NavLink to="/offline-reports" onClick={handleLinkClick} className={navItemClass}>
            {({ isActive }) => (
              <div className="flex items-center space-x-2.5">
                <CloudOff className={iconClass(isActive)} />
                <span>Offline Queue</span>
              </div>
            )}
          </NavLink>
        </nav>

        {/* Bottom User Section */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/70">
          {isAuthenticated ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xs border border-primary-200 shrink-0">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-navy-900 truncate leading-tight">
                    {user?.name || 'Authorized User'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium capitalize truncate">
                    {user?.role || 'Responder'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emergency-600 hover:bg-emergency-50 transition-colors shrink-0"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              onClick={handleLinkClick}
              className="flex items-center justify-center space-x-2 w-full py-2.5 px-3 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold shadow-soft transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
