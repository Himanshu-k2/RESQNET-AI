import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartHandshake,
  Package,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldAlert,
  MapPin,
  Tag,
  ToggleLeft,
  ToggleRight,
  Info,
  Compass,
  Calendar,
  FileText,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const ProviderDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register New Resource Modal/Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newResource, setNewResource] = useState({
    resourceType: 'Shelter',
    title: '',
    description: '',
    quantity: '',
    unit: 'Units',
    address: '',
    landmark: '',
    availability: 'Available',
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    expiryDate: '',
    notes: '',
  });

  const RESOURCE_CATEGORIES = [
    'Shelter',
    'Food / Water',
    'Medical Supplies',
    'Rescue equipment',
    'Volunteers',
    'Ambulance / Transport',
    'Power / Generator',
    'Other',
  ];

  const UNITS_OF_MEASURE = [
    'Units',
    'Persons / Volunteers',
    'Beds / Cots',
    'Boxes / Cartons',
    'Kits / Packs',
    'Bottles / Cans',
    'Liters',
    'Kilograms / Quintals',
    'Vehicles',
  ];

  const fetchMyResources = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/resources/my');
      if (res.data?.success) {
        setResources(res.data.resources || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load your resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchMyResources();
  }, [isAuthenticated]);

  const handleToggleAvailability = async (resourceId, currentStatus) => {
    const nextStatus = currentStatus === 'Available' ? 'In Use' : 'Available';
    try {
      await api.patch(`/resources/${resourceId}`, { availability: nextStatus });
      setResources((prev) =>
        prev.map((r) => (r._id === resourceId ? { ...r, availability: nextStatus } : r))
      );
      setSuccessMsg(`Availability updated to "${nextStatus}".`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update availability');
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        resourceType: newResource.resourceType,
        title: newResource.title,
        description: newResource.description,
        quantity: newResource.quantity,
        unit: newResource.unit || 'Units',
        location: {
          address: newResource.address,
          landmark: newResource.landmark,
        },
        availability: newResource.availability,
        contact: {
          name: newResource.contactName || user?.name,
          phone: newResource.contactPhone || user?.phone,
          email: newResource.contactEmail || user?.email,
        },
        expiryDate: newResource.expiryDate || null,
        notes: newResource.notes ? [newResource.notes] : [],
      };

      const res = await api.post('/resources', payload);
      if (res.data?.success) {
        setSuccessMsg(
          'Resource submitted successfully! It has been recorded as PENDING_VERIFICATION and queued for coordinator review.'
        );
        setShowAddForm(false);
        setNewResource({
          resourceType: 'Shelter',
          title: '',
          description: '',
          quantity: '',
          unit: 'Units',
          address: '',
          landmark: '',
          availability: 'Available',
          contactName: user?.name || '',
          contactPhone: user?.phone || '',
          contactEmail: user?.email || '',
          expiryDate: '',
          notes: '',
        });
        fetchMyResources();
        setTimeout(() => setSuccessMsg(''), 6000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to register resource');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner & Provider Information Display */}
      <div className="bg-gradient-to-r from-teal-800 to-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs font-bold">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Provider Dashboard</span>
              </span>

              {/* Role Display */}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold border border-white/20">
                <UserCheck className="w-3 h-3 text-teal-300" />
                <span>Role: RESOURCE_PROVIDER</span>
              </span>

              {/* Account Status */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-[11px] font-bold border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Account Status: Active</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome, {user?.name || 'Help Provider'}
            </h1>

            {/* Clear Explanation of Verification Process */}
            <div className="p-3.5 rounded-2xl bg-teal-900/60 border border-teal-600/40 text-xs text-teal-100 max-w-2xl leading-relaxed">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold">Resource Verification Process: </strong>
                  Resources submitted by you will be reviewed before they become verified and available for coordination.
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            {/* View Critical Scenarios Button */}
            <Link
              to="/critical-scenarios"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-soft transition-all ring-1 ring-amber-400/50"
            >
              <Compass className="w-4 h-4" />
              <span>VIEW CRITICAL SCENARIOS</span>
            </Link>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-900 font-bold text-xs shadow-soft transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Close Form' : 'Register New Resource'}</span>
            </button>

            <button
              onClick={fetchMyResources}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Refresh My Resources"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add New Resource Modal / Section */}
      {showAddForm && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-navy-900">Register New Relief Resource</h2>
              <p className="text-xs text-slate-500">
                All submissions automatically enter the queue with status <strong className="text-amber-700 font-semibold">PENDING_VERIFICATION</strong>
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateResource} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Resource Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newResource.resourceType}
                  onChange={(e) => setNewResource({ ...newResource, resourceType: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {RESOURCE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Resource Title / Short Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 First Aid Trauma Response Kits"
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Detailed Description & Specifications <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Include specifications, condition, power/storage requirements, or instructions..."
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                className="w-full p-3.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50"
                  value={newResource.quantity}
                  onChange={(e) => setNewResource({ ...newResource, quantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Unit of Measurement
                </label>
                <select
                  value={newResource.unit}
                  onChange={(e) => setNewResource({ ...newResource, unit: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {UNITS_OF_MEASURE.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Availability Status
                </label>
                <select
                  value={newResource.availability}
                  onChange={(e) => setNewResource({ ...newResource, availability: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Available">Available</option>
                  <option value="Standby">Standby</option>
                  <option value="In Use">In Use</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pickup / Availability Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector 5 Community Hall Depot"
                  value={newResource.address}
                  onChange={(e) => setNewResource({ ...newResource, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Landmark / Neighborhood
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Metro Gate 3"
                  value={newResource.landmark}
                  onChange={(e) => setNewResource({ ...newResource, landmark: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  value={newResource.contactName}
                  onChange={(e) => setNewResource({ ...newResource, contactName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={newResource.contactPhone}
                  onChange={(e) => setNewResource({ ...newResource, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contact Email (Optional)
                </label>
                <input
                  type="email"
                  value={newResource.contactEmail}
                  onChange={(e) => setNewResource({ ...newResource, contactEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Expiry / Validity Date (Optional)
                </label>
                <input
                  type="date"
                  value={newResource.expiryDate}
                  onChange={(e) => setNewResource({ ...newResource, expiryDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notes for Coordinators (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Access gate requires security check code"
                  value={newResource.notes}
                  onChange={(e) => setNewResource({ ...newResource, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-soft transition-all"
              >
                {submitting ? 'Submitting for Review...' : 'Submit Resource'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Resources Listing */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-600" />
              <span>My Registered Resources ({resources.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Submitted resources are reviewed by coordinators before verification and field assignment
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading resources...</div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-navy-900">No resources registered yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Help your local community by offering emergency shelters, transport, medical supplies, or volunteer teams.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold"
            >
              Register Your First Resource
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {resources.map((item) => (
              <div key={item._id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                        {item.resourceType}
                      </span>
                      <h3 className="text-sm font-bold text-navy-900">{item.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  </div>

                  {/* Verification Pill Prominently Displayed */}
                  <div className="shrink-0 flex items-center gap-2">
                    {item.verificationStatus === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : item.verificationStatus === 'REJECTED' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> PENDING_VERIFICATION
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Quantity: <strong>{item.quantity} {item.unit ? `(${item.unit})` : ''}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{item.location?.address}</span>
                  </div>
                  <div className="flex items-center sm:justify-end gap-2">
                    <span className="font-semibold text-slate-700">Availability:</span>
                    <button
                      onClick={() => handleToggleAvailability(item._id, item.availability)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        item.availability === 'Available'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                      }`}
                      title="Click to toggle availability status"
                    >
                      {item.availability === 'Available' ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-700" />
                          <span>Available</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-slate-600" />
                          <span>{item.availability || 'In Use'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {item.expiryDate && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Valid until: <strong>{new Date(item.expiryDate).toLocaleDateString()}</strong></span>
                  </div>
                )}

                {item.rejectionReason && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                    <strong>Coordinator Review Note:</strong> {item.rejectionReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;
