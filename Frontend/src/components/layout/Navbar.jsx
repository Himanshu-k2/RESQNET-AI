import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Activity, User, LogOut, Menu, X, HeartHandshake, AlertTriangle, Radio, Sparkles, ShieldCheck, CloudOff, Compass, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SimulationHub from '../simulation/SimulationHub';

export const Navbar = () => {
  const { user, isAuthenticated, isCoordinator, logout, demoLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [simulationHubOpen, setSimulationHubOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleQuickDemo = async (role) => {
    try {
      setDemoLoading(true);
      await demoLogin(role);
      setMobileMenuOpen(false);
      if (role === 'coordinator') {
        navigate('/coordinator');
      } else {
        navigate('/need-help');
      }
    } catch (err) {
      console.error('Quick demo switch error:', err);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          
          {/* 1. Left Brand & Subtitle (Clean shield/pulse icon, Navy text, Teal AI, no cropping) */}
          <Link to="/" className="flex items-center space-x-3 shrink-0 group focus:outline-none">
            {/* Shield with medical pulse icon */}
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-primary-700 via-primary-800 to-navy-900 flex items-center justify-center text-white shadow-soft shrink-0 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-teal-200" />
              <Activity className="w-3.5 h-3.5 text-teal-400 absolute center" />
            </div>
            
            {/* Brand and Subtitle Container */}
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-navy-900 leading-tight">
                  ResQNet
                </span>
                <span className="text-xl sm:text-2xl font-black text-primary-600 tracking-tight leading-tight">
                  AI
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-wider uppercase mt-0.5 whitespace-nowrap">
                EMERGENCY COORDINATION NETWORK
              </span>
            </div>
          </Link>

          {/* 2. Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1 ml-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive('/') 
                  ? 'text-primary-800 bg-primary-50 border border-primary-200/60' 
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
              }`}
            >
              Home
            </Link>

            <Link
              to="/groups"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                location.pathname.startsWith('/groups')
                  ? 'text-primary-800 bg-primary-50 border border-primary-200/60' 
                  : 'text-slate-600 hover:text-primary-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 text-primary-600" />
              <span>Community Groups</span>
            </Link>

            <Link
              to="/need-help"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive('/need-help') 
                  ? 'text-emergency-700 bg-emergency-50 border border-emergency-200/60' 
                  : 'text-slate-600 hover:text-emergency-600 hover:bg-emergency-50/40'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-emergency-500" />
              <span>Report Emergency</span>
            </Link>

            <Link
              to="/track"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive('/track') 
                  ? 'text-teal-800 bg-teal-50 border border-teal-200/60' 
                  : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Track Request</span>
            </Link>

            {/* Provider link: if logged in as provider, point to dashboard, else provide-help */}
            <Link
              to={isAuthenticated && ((user?.role || '').toUpperCase() === 'RESOURCE_PROVIDER' || user?.role === 'citizen') ? "/provider/dashboard" : "/provide-help"}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive('/provide-help') || isActive('/provider/dashboard')
                  ? 'text-provider-700 bg-provider-50 border border-provider-200/60' 
                  : 'text-slate-600 hover:text-provider-600 hover:bg-provider-50/40'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-provider-500" />
              <span>{isAuthenticated && ((user?.role || '').toUpperCase() === 'RESOURCE_PROVIDER' || user?.role === 'citizen') ? "Provider Hub" : "Provide Resources"}</span>
            </Link>

            <Link
              to="/coordinator"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive('/coordinator') 
                  ? 'text-primary-800 bg-primary-50 border border-primary-200/60' 
                  : 'text-slate-600 hover:text-primary-700 hover:bg-slate-100'
              }`}
            >
              <Radio className="w-4 h-4 text-primary-600" />
              <span>Command Center</span>
            </Link>

            {/* Admin Console link (visible to Admin) */}
            {((user?.role || '').toUpperCase() === 'ADMIN' || user?.role === 'admin') && (
              <Link
                to="/admin/dashboard"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive('/admin/dashboard') 
                    ? 'text-purple-800 bg-purple-50 border border-purple-200/60' 
                    : 'text-slate-600 hover:text-purple-700 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Admin Console</span>
              </Link>
            )}

            <Link
              to="/offline-reports"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive('/offline-reports') 
                  ? 'text-teal-800 bg-teal-50 border border-teal-200/60' 
                  : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
              }`}
              title="View reports saved locally in IndexedDB"
            >
              <CloudOff className="w-4 h-4 text-teal-600" />
              <span>Offline Queue</span>
            </Link>
          </nav>

          {/* 3. Right Demo Actions & Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-3 shrink-0">
            {/* ONE PROMINENT BUTTON: VIEW CRITICAL SCENARIOS (Visible after login to Admin, Resource Provider, Coordinator) */}
            {isAuthenticated && (
              <Link
                to="/critical-scenarios"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs transition-all ring-1 ring-amber-400/50"
                title="AI-Assisted Emergency Preparedness Hub"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>VIEW CRITICAL SCENARIOS</span>
              </Link>
            )}

            {/* Demo Persona Switcher */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 px-2 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary-600" />
                Demo:
              </span>
              <button
                onClick={() => handleQuickDemo('coordinator')}
                disabled={demoLoading}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  user?.role === 'coordinator'
                    ? 'bg-primary-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-primary-800'
                }`}
                title="Switch to Emergency Coordinator Persona"
              >
                Coordinator
              </button>
              <button
                onClick={() => handleQuickDemo('citizen')}
                disabled={demoLoading}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  user?.role === 'citizen'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900'
                }`}
                title="Switch to Citizen / Community Persona"
              >
                Citizen
              </button>
            </div>

            {/* User Profile or Sign In / Register */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xs border border-primary-200">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-navy-900 leading-tight flex items-center gap-1">
                      {user?.name}
                      {user?.badgeVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-primary-600" title="Verified Coordinator" />
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize font-medium">{user?.role}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emergency-600 hover:bg-emergency-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
                <Link
                  to="/auth"
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?tab=register"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-primary-700 text-white hover:bg-primary-800 transition-all shadow-soft"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-navy-900 hover:bg-slate-100 border border-slate-200"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile / Tablet Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold ${
                isActive('/') ? 'text-primary-800 bg-primary-50' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Home
            </Link>
            <Link
              to="/groups"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                location.pathname.startsWith('/groups') ? 'text-primary-800 bg-primary-50' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 text-primary-600" />
              <span>Community Groups</span>
            </Link>
            <Link
              to="/need-help"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                isActive('/need-help') ? 'text-emergency-700 bg-emergency-50' : 'text-slate-700 hover:bg-emergency-50/50'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-emergency-500" />
              <span>Report Emergency</span>
            </Link>
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                isActive('/track') ? 'text-teal-800 bg-teal-50' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Track Request</span>
            </Link>
            <Link
              to={isAuthenticated && ((user?.role || '').toUpperCase() === 'RESOURCE_PROVIDER' || user?.role === 'citizen') ? "/provider/dashboard" : "/provide-help"}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                isActive('/provide-help') || isActive('/provider/dashboard') ? 'text-provider-700 bg-provider-50' : 'text-slate-700 hover:bg-provider-50/50'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-provider-500" />
              <span>{isAuthenticated && ((user?.role || '').toUpperCase() === 'RESOURCE_PROVIDER' || user?.role === 'citizen') ? "Provider Hub" : "Provide Resources"}</span>
            </Link>
            <Link
              to="/coordinator"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                isActive('/coordinator') ? 'text-primary-800 bg-primary-50' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Radio className="w-4 h-4 text-primary-600" />
              <span>Command Center</span>
            </Link>
            {((user?.role || '').toUpperCase() === 'ADMIN' || user?.role === 'admin') && (
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive('/admin/dashboard') ? 'text-purple-800 bg-purple-50' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Admin Console</span>
              </Link>
            )}

            <Link
              to="/offline-reports"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                isActive('/offline-reports') ? 'text-teal-800 bg-teal-50' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <CloudOff className="w-4 h-4 text-teal-600" />
              <span>Offline Queue</span>
            </Link>
          </div>

          {/* Quick Demo Section for Mobile */}
          <div className="pt-3 border-t border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary-600" />
              <span>Quick Demo Switcher</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => handleQuickDemo('coordinator')}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-primary-50 text-primary-800 border border-primary-200 text-center"
              >
                Coordinator Persona
              </button>
              <button
                onClick={() => handleQuickDemo('citizen')}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 text-center"
              >
                Citizen Persona
              </button>
            </div>
            {isAuthenticated && (
              <Link
                to="/critical-scenarios"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span>VIEW CRITICAL SCENARIOS</span>
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="pt-3 border-t border-slate-200">
            {isAuthenticated ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div>
                  <p className="text-xs font-bold text-navy-900">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emergency-600 bg-emergency-50 hover:bg-emergency-100"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-slate-700 bg-slate-100"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?tab=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-white bg-primary-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase 6 Simulation & Demo Hub Modal */}
      <SimulationHub
        isOpen={simulationHubOpen}
        onClose={() => setSimulationHubOpen(false)}
      />
    </header>
  );
};
