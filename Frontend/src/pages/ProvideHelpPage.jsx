import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartHandshake,
  Droplet,
  Utensils,
  BriefcaseMedical,
  Truck,
  Home,
  LifeBuoy,
  Users,
  Package,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Calendar
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';

const RESOURCE_TYPES = [
  { id: 'Water', label: 'Drinking Water / Clean Cans', icon: Droplet, color: 'text-sky-600 bg-sky-50' },
  { id: 'Food', label: 'Food Rations / Hot Meals', icon: Utensils, color: 'text-amber-600 bg-amber-50' },
  { id: 'Medical kits', label: 'Medical Supplies / First Aid', icon: BriefcaseMedical, color: 'text-rose-600 bg-rose-50' },
  { id: 'Ambulance support', label: 'Ambulance / Patient Transit', icon: Truck, color: 'text-red-600 bg-red-50' },
  { id: 'Shelter', label: 'Dry Shelter / Hall / Cots', icon: Home, color: 'text-indigo-600 bg-indigo-50' },
  { id: 'Transport', label: 'Evacuation Vehicles / Trucks', icon: Truck, color: 'text-purple-600 bg-purple-50' },
  { id: 'Rescue equipment', label: 'Boats / Ropes / Gear', icon: LifeBuoy, color: 'text-teal-600 bg-teal-50' },
  { id: 'Volunteers', label: 'Relief Team / Volunteers', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
  { id: 'Other', label: 'Other Support / Equipment', icon: Package, color: 'text-slate-600 bg-slate-50' },
];

export const ProvideHelpPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
      return;
    }
    const role = (user?.role || '').toUpperCase();
    if (role === 'RESOURCE_PROVIDER' || role === 'CITIZEN') {
      navigate('/provider/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Form State
  const [formData, setFormData] = useState({
    resourceType: 'Water',
    title: '',
    description: '',
    quantity: '',
    address: '',
    landmark: '',
    availability: 'Available',
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    expiryDate: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Resources Directory State
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoadingResources(true);
      const res = await api.get('/resources?limit=20');
      if (res.data?.resources) {
        setResources(res.data.resources);
      }
    } catch (err) {
      console.error('Failed to load resources:', err.message);
    } finally {
      setLoadingResources(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Please provide a title for the resource.';
    if (!formData.description.trim()) errors.description = 'Please describe the resource offer.';
    if (!formData.quantity.trim()) errors.quantity = 'Please specify the quantity or capacity.';
    if (!formData.address.trim()) errors.address = 'Please specify where the resource is located.';
    if (!formData.contactName.trim()) errors.contactName = 'Please enter a contact name.';
    if (!formData.contactPhone.trim()) errors.contactPhone = 'Please enter a contact phone number.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        resourceType: formData.resourceType,
        title: formData.title,
        description: formData.description,
        quantity: formData.quantity,
        location: {
          address: formData.address,
          landmark: formData.landmark,
        },
        availability: formData.availability,
        contact: {
          name: formData.contactName,
          phone: formData.contactPhone,
          email: formData.contactEmail,
        },
        expiryDate: formData.expiryDate || null,
      };

      await api.post('/resources', payload);
      setSubmitSuccess(true);
      fetchResources();

      // Reset form fields
      setFormData({
        resourceType: 'Water',
        title: '',
        description: '',
        quantity: '',
        address: '',
        landmark: '',
        availability: 'Available',
        contactName: user?.name || '',
        contactPhone: user?.phone || '',
        contactEmail: user?.email || '',
        expiryDate: '',
      });
    } catch (err) {
      setSubmitError(err.message || 'Failed to register resource.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick availability status toggle (Available -> Allocated -> Unavailable)
  const handleToggleAvailability = async (resourceId, currentStatus) => {
    try {
      setUpdatingId(resourceId);
      const nextStatus =
        currentStatus === 'Available'
          ? 'Allocated'
          : currentStatus === 'Allocated'
          ? 'Unavailable'
          : 'Available';

      await api.patch(`/resources/${resourceId}`, { availability: nextStatus });

      setResources((prev) =>
        prev.map((item) =>
          item._id === resourceId ? { ...item, availability: nextStatus } : item
        )
      );
    } catch (err) {
      alert('Failed to update availability: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredResources =
    filterType === 'ALL'
      ? resources
      : resources.filter((r) => r.resourceType === filterType);

  if (isAuthenticated && !['RESOURCE_PROVIDER', 'CITIZEN'].includes((user?.role || '').toUpperCase())) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-navy-900">Access Restricted</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your active account role is "{user?.role}". This area is reserved for registered Resource Providers. Only verified Resource Providers can stage relief resources.
        </p>
        <div className="pt-3 flex justify-center gap-3">
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Return Home
          </Link>
          <Link
            to="/auth?tab=register"
            className="px-4 py-2 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs transition-colors shadow-soft"
          >
            Register as Provider
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Header & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-3">
          <Link to="/" className="hover:text-navy-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <span>/</span>
          <span className="text-provider-700 font-bold">Provide Resources</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-provider-50 text-provider-600 flex items-center justify-center border border-provider-100">
                <HeartHandshake className="w-5 h-5" />
              </span>
              Community Resource Registration
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
              Register clean water, food rations, shelters, transport, or volunteers to empower coordinator relief operations.
            </p>
          </div>

          <div className="bg-provider-50 border border-provider-200/80 rounded-xl px-3.5 py-2 text-left sm:text-right shrink-0">
            <div className="text-[11px] font-bold text-provider-800">
              Verified Relief Network
            </div>
            <div className="text-xs text-provider-900 font-semibold mt-0.5">
              Humanitarian Response Support
            </div>
          </div>
        </div>

        {/* Dedicated Provider Account Promotion */}
        <div className="mt-4 p-4 rounded-2xl bg-teal-50 border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <HeartHandshake className="w-5 h-5 text-teal-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-navy-900">Are you a regular resource provider or relief NGO?</p>
              <p className="text-[11px] text-slate-600">Register a dedicated Help Provider account to track, edit, and toggle availability for all your offers in real time.</p>
            </div>
          </div>
          <Link
            to="/register/provider"
            className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors shrink-0 text-center"
          >
            Register as Provider
          </Link>
        </div>
      </div>

      {/* Registration Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-10 space-y-8">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-navy-900">
            Register Resource Offer
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All registered items are initially listed with <span className="font-semibold text-amber-800">PENDING_VERIFICATION</span> to ensure high quality and prevent duplicate offers.
          </p>
        </div>

        {submitSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold text-sm">Resource Offer Registered Successfully!</strong>
              <p className="mt-0.5">
                Your contribution has been logged in the community relief catalog and is ready for coordinator matching.
              </p>
            </div>
            <button
              onClick={() => setSubmitSuccess(false)}
              className="text-emerald-700 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {submitError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Resource Category Selection */}
          <div>
            <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">
              Resource Category <span className="text-emergency-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {RESOURCE_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.resourceType === type.id;
                return (
                  <button
                    type="button"
                    key={type.id}
                    onClick={() => setFormData({ ...formData, resourceType: type.id })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-provider-600 bg-provider-50/60 ring-2 ring-provider-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${type.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-navy-900 leading-tight">
                      {type.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Resource Title / Item Summary <span className="text-emergency-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                }}
                placeholder="e.g. 100 Packets Dry Ration / 2 Inflatable Rafts / 50 Blankets"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {formErrors.title && (
                <p className="text-xs text-emergency-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {formErrors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantity / Unit <span className="text-emergency-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.quantity}
                onChange={(e) => {
                  setFormData({ ...formData, quantity: e.target.value });
                  if (formErrors.quantity) setFormErrors({ ...formErrors, quantity: '' });
                }}
                placeholder="e.g. 150 Cans (3000L)"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {formErrors.quantity && (
                <p className="text-xs text-emergency-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {formErrors.quantity}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description & Specifications <span className="text-emergency-600">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (formErrors.description) setFormErrors({ ...formErrors, description: '' });
              }}
              placeholder="Describe condition, distribution readiness, storage, and how recipients can utilize this resource."
              className="w-full p-3.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {formErrors.description && (
              <p className="text-xs text-emergency-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {formErrors.description}
              </p>
            )}
          </div>

          {/* Location & Landmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pickup / Storage Address <span className="text-emergency-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  if (formErrors.address) setFormErrors({ ...formErrors, address: '' });
                }}
                placeholder="e.g. Community Center Warehouse, Main Gate"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {formErrors.address && (
                <p className="text-xs text-emergency-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {formErrors.address}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Landmark / Access Instructions
              </label>
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                placeholder="e.g. Opp. Metro Pillar 42, elevated dry platform"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Contact Details & Expiry */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
              Provider Contact & Expiry Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Provider Name <span className="text-emergency-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="Organization or Individual"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Phone Number <span className="text-emergency-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="Direct phone for dispatch"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Expiry Date (If Perishable)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500">
              Verified coordinators can match this inventory with urgent distress requests.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-provider-600 hover:bg-provider-700 text-white font-bold text-sm shadow-soft hover:shadow-soft-md transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{submitting ? 'Registering Offer...' : 'Register Resource Offer'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Community Resource Inventory & Interactive Availability Manager */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-navy-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-700" />
              Active Relief Resource Directory
            </h3>
            <p className="text-xs text-slate-500">
              Community supplies ready for crisis allocation. Click "Update Status" to cycle availability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-xs focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {RESOURCE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id}
                </option>
              ))}
            </select>

            <button
              onClick={fetchResources}
              disabled={loadingResources}
              className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-navy-900 shadow-xs"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${loadingResources ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loadingResources ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            Loading community resources...
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
            No resources found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((item) => (
              <div
                key={item._id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-soft hover:shadow-soft-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.resourceType}
                    </span>
                    <StatusBadge status={item.availability} />
                  </div>

                  <h4 className="font-bold text-sm text-navy-900 leading-tight">
                    {item.title}
                  </h4>
                  <div className="text-xs font-bold text-primary-700 mt-1">
                    Quantity: {item.quantity}
                  </div>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{item.location?.address}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-500">
                      Provider: <strong className="text-navy-900">{item.contact?.name}</strong>
                    </div>

                    {/* Interactive Status Update Button */}
                    <button
                      onClick={() => handleToggleAvailability(item._id, item.availability)}
                      disabled={updatingId === item._id}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 transition-all shadow-xs"
                      title="Toggle between Available, Allocated, and Unavailable"
                    >
                      {updatingId === item._id ? 'Updating...' : `Set ${item.availability === 'Available' ? 'Allocated' : item.availability === 'Allocated' ? 'Unavailable' : 'Available'}`}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
