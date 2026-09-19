import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, LogIn, AlertCircle, HeartHandshake, AlertTriangle, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleRedirect = (role) => {
    const roleUpper = (role || '').toUpperCase();
    if (roleUpper === 'ADMIN' || role === 'admin') {
      navigate('/admin/dashboard');
    } else if (roleUpper === 'COORDINATOR' || role === 'coordinator') {
      navigate('/coordinator');
    } else {
      // RESOURCE_PROVIDER or citizen
      navigate('/provider/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      handleRoleRedirect(res.user?.role);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center mx-auto mb-3 border border-primary-200 shadow-soft">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Sign In to ResQNet AI
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Common authentication gateway for Providers, Coordinators, and Administrators
          </p>
        </div>

        {/* Standard Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-soft">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold shadow-soft hover:shadow-soft-md transition-all mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Quick Helper Links */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
            <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-xs text-slate-700 font-medium">Want to offer resources?</span>
              </div>
              <Link
                to="/register/provider"
                className="text-xs font-bold text-teal-800 hover:text-teal-900 underline"
              >
                Register as Provider
              </Link>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-xs text-slate-700 font-medium">Need urgent help?</span>
              </div>
              <Link
                to="/need-help"
                className="text-xs font-bold text-rose-800 hover:text-rose-900 underline"
              >
                Report Emergency Directly
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          ResQNet AI Enterprise Role-Based Access Control Active
        </div>
      </div>
    </div>
  );
};
