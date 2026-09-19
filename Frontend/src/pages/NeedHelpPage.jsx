import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Flame,
  Waves,
  Building,
  HeartPulse,
  Car,
  UserX,
  HelpCircle,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Clock,
  Phone,
  Send,
  RefreshCw,
  Info,
  ShieldAlert,
  AlertCircle,
  Bot,
  Sparkles,
  Zap
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { ResQGuideModal } from '../components/ai/ResQGuideModal';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { saveReport } from '../services/offlineStorage';
import SyncStatus from '../components/SyncStatus';
import { CloudOff, Database } from 'lucide-react';

const INCIDENT_TYPES = [
  { id: 'Flood', label: 'Flood / Waterlogging', icon: Waves, color: 'text-sky-600 bg-sky-50' },
  { id: 'Fire', label: 'Fire / Explosion', icon: Flame, color: 'text-rose-600 bg-rose-50' },
  { id: 'Building Collapse', label: 'Building Collapse / Debris', icon: Building, color: 'text-amber-600 bg-amber-50' },
  { id: 'Medical Emergency', label: 'Medical Emergency', icon: HeartPulse, color: 'text-red-600 bg-red-50' },
  { id: 'Accident', label: 'Road / Transit Accident', icon: Car, color: 'text-orange-600 bg-orange-50' },
  { id: 'Missing Person', label: 'Missing Person(s)', icon: UserX, color: 'text-purple-600 bg-purple-50' },
  { id: 'Other', label: 'Other Crisis Event', icon: HelpCircle, color: 'text-slate-600 bg-slate-50' },
];

const RESOURCE_OPTIONS = [
  'Drinking Water',
  'Food Rations',
  'First Aid / Medical',
  'Ambulance Support',
  'Shelter / Tents',
  'Evacuation Boats',
  'Evacuation Transport',
  'Rescue Equipment',
  'Relief Volunteers',
  'Warm Blankets / Clothing',
];

export const NeedHelpPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const linkedGroupId = searchParams.get('groupId');

  const isOnline = useOnlineStatus();

  // Workflow states: 'form' | 'review' | 'success'
  const [step, setStep] = useState('form');
  const [offlineRecord, setOfflineRecord] = useState(null);
  const [aiErrorMsg, setAiErrorMsg] = useState('');

  // AI Extraction State
  const [rawAiText, setRawAiText] = useState('');
  const [extractingAi, setExtractingAi] = useState(false);
  const [aiExtractedBanner, setAiExtractedBanner] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    incidentType: '',
    description: '',
    address: '',
    landmark: '',
    affectedPeople: 'Unknown',
    safetyStatus: 'Unknown',
    requiredResources: [],
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    urgency: 'High',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // Live community incidents feed
  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoadingIncidents(true);
      const res = await api.get('/incidents?limit=10');
      if (res.data?.incidents) {
        setIncidents(res.data.incidents);
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err.message);
    } finally {
      setLoadingIncidents(false);
    }
  };

  // Toggle resource checkbox
  const toggleResource = (res) => {
    setFormData((prev) => {
      const exists = prev.requiredResources.includes(res);
      return {
        ...prev,
        requiredResources: exists
          ? prev.requiredResources.filter((r) => r !== res)
          : [...prev.requiredResources, res],
      };
    });
  };

  // Geolocation helper
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({
          ...prev,
          address: prev.address || `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          landmark: prev.landmark || 'GPS Location Detected',
        }));
        setGeoLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        setGeoLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // AI Quick Extraction Handler (with offline detection and fallback)
  const handleExtractWithAi = async () => {
    if (!rawAiText.trim()) return;
    setAiErrorMsg('');

    if (!isOnline) {
      setAiErrorMsg('You are offline. AI extraction is unavailable, but your text was preserved. Please fill the fields manually below.');
      setFormData((prev) => ({
        ...prev,
        description: prev.description ? `${prev.description} | ${rawAiText}` : rawAiText,
      }));
      return;
    }

    setExtractingAi(true);
    try {
      const res = await api.post('/ai/report-extraction', { text: rawAiText });
      if (res.data?.success && res.data?.extracted) {
        const ext = res.data.extracted;
        setFormData((prev) => ({
          ...prev,
          incidentType: ext.incidentType || prev.incidentType || 'Other',
          description: ext.description || prev.description,
          address: ext.location?.text || prev.address,
          affectedPeople: ext.affectedPeople ? String(ext.affectedPeople) : prev.affectedPeople,
          safetyStatus: ext.safetyStatus && ext.safetyStatus !== 'Unknown' ? ext.safetyStatus : prev.safetyStatus,
          requiredResources: Array.isArray(ext.requiredResources) && ext.requiredResources.length > 0 ? ext.requiredResources : prev.requiredResources,
        }));
        setAiExtractedBanner(true);
      }
    } catch (err) {
      setAiErrorMsg('AI service unavailable. Your text has been preserved into the description field for manual reporting.');
      setFormData((prev) => ({
        ...prev,
        description: prev.description ? `${prev.description} | ${rawAiText}` : rawAiText,
      }));
    } finally {
      setExtractingAi(false);
    }
  };

  // Callback from ResQGuide Modal
  const handleApplyGuideDraft = (draft) => {
    setFormData((prev) => ({
      ...prev,
      incidentType: draft.incidentType || prev.incidentType || 'Other',
      description: draft.description || prev.description,
      address: draft.location?.text || prev.address,
      affectedPeople: draft.affectedPeople ? String(draft.affectedPeople) : prev.affectedPeople,
      safetyStatus: draft.safetyStatus || prev.safetyStatus,
      requiredResources: draft.requiredResources || prev.requiredResources,
    }));
    setAiExtractedBanner(true);
  };

  // Validate form before review
  const validateForm = () => {
    const errors = {};
    if (!formData.incidentType) {
      errors.incidentType = 'Please select the type of emergency.';
    }
    if (!formData.description.trim()) {
      errors.description = 'Please describe the emergency situation.';
    }
    if (!formData.address.trim()) {
      errors.address = 'Please specify an approximate location or address.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToReview = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');

    const payload = {
      incidentType: formData.incidentType,
      description: formData.description,
      location: {
        address: formData.address,
        landmark: formData.landmark,
      },
      affectedPeople: formData.affectedPeople,
      safetyStatus: formData.safetyStatus,
      requiredResources: formData.requiredResources,
      contact: {
        name: formData.contactName || 'Anonymous Citizen',
        phone: formData.contactPhone || '',
        email: formData.contactEmail || '',
      },
      urgency: formData.urgency,
      ...(linkedGroupId ? { group: linkedGroupId, groupId: linkedGroupId } : {}),
    };

    // If offline or network call fails, save to IndexedDB
    if (!isOnline) {
      try {
        const record = await saveReport(payload);
        setOfflineRecord(record);
        setSubmittedIncident({
          _id: `offline-${record.clientId.slice(0, 8)}`,
          incidentType: payload.incidentType,
          status: 'SAVED_OFFLINE',
          location: payload.location,
          isOfflineSaved: true,
          clientId: record.clientId,
        });
        setStep('success');
      } catch (err) {
        setSubmitError('Failed to save report to local storage: ' + err.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      const res = await api.post('/incidents', payload);
      setSubmittedIncident({
        ...res.data.incident,
        requestId: res.data.requestId || res.data.incident?.requestId,
        trackingPin: res.data.trackingPin || res.data.incident?.trackingPin,
      });
      setOfflineRecord(null);
      setStep('success');
      fetchIncidents();
    } catch (err) {
      // If network failure during online attempt, fallback gracefully to offline save
      console.warn('Network upload failed, falling back to local storage:', err);
      try {
        const record = await saveReport(payload);
        setOfflineRecord(record);
        setSubmittedIncident({
          _id: `offline-${record.clientId.slice(0, 8)}`,
          incidentType: payload.incidentType,
          status: 'SAVED_OFFLINE',
          location: payload.location,
          isOfflineSaved: true,
          clientId: record.clientId,
        });
        setStep('success');
      } catch (saveErr) {
        setSubmitError('Failed to transmit or save locally: ' + (err.message || 'Network Error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      incidentType: '',
      description: '',
      address: '',
      landmark: '',
      affectedPeople: 'Unknown',
      safetyStatus: 'Unknown',
      requiredResources: [],
      contactName: user?.name || '',
      contactPhone: user?.phone || '',
      contactEmail: user?.email || '',
      urgency: 'High',
    });
    setSubmittedIncident(null);
    setOfflineRecord(null);
    setAiExtractedBanner(false);
    setRawAiText('');
    setAiErrorMsg('');
    setStep('form');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* ResQGuide Modal Component */}
      <ResQGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onApplyDraft={handleApplyGuideDraft}
      />

      {/* Top Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-3">
          <Link to="/" className="hover:text-navy-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <span>/</span>
          <span className="text-emergency-700 font-bold">Report Emergency</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-emergency-50 text-emergency-600 flex items-center justify-center border border-emergency-100">
                <AlertTriangle className="w-5 h-5" />
              </span>
              Emergency Intake & Distress Reporting
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
              Submit your urgent request with AI triage assistance. All reports are verified by authorized coordinators before resource dispatch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Launch ResQGuide Button */}
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-all shadow-xs"
            >
              <Bot className="w-4 h-4 text-teal-600" />
              <span>ResQGuide AI Chat</span>
            </button>

            <div className="bg-emergency-50 border border-emergency-200/80 rounded-xl px-3.5 py-2 text-right">
              <div className="text-[10px] font-bold text-emergency-800 flex items-center justify-end gap-1">
                <Phone className="w-3 h-3" /> Life Peril?
              </div>
              <div className="text-xs text-emergency-900 font-bold">
                Call: 911 / 112
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Linked to Community Group Alert */}
      {linkedGroupId && (
        <div className="p-4 rounded-2xl bg-primary-50 border border-primary-200/80 text-primary-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-700 shrink-0" />
            <span>
              <strong>Group-Linked Report:</strong> This incident will be associated with your community group so members and coordinators are alerted.
            </span>
          </div>
          <Link
            to={`/groups/${linkedGroupId}`}
            className="text-[11px] font-bold text-primary-700 underline shrink-0 hover:text-primary-800"
          >
            View Group
          </Link>
        </div>
      )}

      {/* AI NATURAL LANGUAGE EXTRACTION BOX */}
      {step === 'form' && (
        <div className="bg-gradient-to-r from-teal-50 via-sky-50 to-primary-50/50 rounded-2xl border border-teal-200/80 p-4 sm:p-6 shadow-soft space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-700" />
              <h3 className="text-xs sm:text-sm font-bold text-navy-900">
                Quick Natural-Language Report Extraction (Gemini AI Powered)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded-full border border-teal-200">
              Paste WhatsApp / SMS / Distress Notes
            </span>
          </div>

          <p className="text-xs text-slate-600">
            In a hurry? Paste any free-text crisis message below. ResQNet AI will parse the incident category, headcount, needed supplies, and missing details into the form.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={rawAiText}
              onChange={(e) => setRawAiText(e.target.value)}
              placeholder="e.g. Flood water entered our hostel Block B. 20 students need drinking water and dry blankets."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-teal-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={handleExtractWithAi}
              disabled={extractingAi || !rawAiText.trim()}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 shrink-0"
            >
              <Zap className={`w-3.5 h-3.5 ${extractingAi ? 'animate-spin' : ''}`} />
              <span>{extractingAi ? 'Extracting...' : 'Extract with AI'}</span>
            </button>
          </div>

          {aiErrorMsg && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-center justify-between gap-2 shadow-xs">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{aiErrorMsg}</span>
              </span>
              <button
                onClick={() => setAiErrorMsg('')}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
          )}

          {aiExtractedBanner && (
            <div className="p-3 rounded-xl bg-white border border-teal-300 text-xs text-teal-900 flex items-center justify-between gap-2 shadow-xs">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>AI extracted details populated below. <strong>Please review and edit all fields before submitting.</strong></span>
              </span>
              <button
                onClick={() => setAiExtractedBanner(false)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Reporting Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">

        {/* STEP 1: FORM */}
        {step === 'form' && (
          <form onSubmit={handleProceedToReview} className="p-6 sm:p-10 space-y-8">
            
            {/* 1. Incident Type */}
            <div>
              <label className="block text-sm font-bold text-navy-900 mb-2">
                1. What type of emergency is happening? <span className="text-emergency-600">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {INCIDENT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.incidentType === type.id;
                  return (
                    <button
                      type="button"
                      key={type.id}
                      onClick={() => {
                        setFormData({ ...formData, incidentType: type.id });
                        if (formErrors.incidentType) {
                          setFormErrors({ ...formErrors, incidentType: '' });
                        }
                      }}
                      className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/30 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${type.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-navy-900 leading-tight">
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {formErrors.incidentType && (
                <p className="text-xs text-emergency-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {formErrors.incidentType}
                </p>
              )}
            </div>

            {/* 2. Free-text Description */}
            <div>
              <label className="block text-sm font-bold text-navy-900 mb-1">
                2. Describe what is happening <span className="text-emergency-600">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Provide as many specific details as you can (e.g. water height, smoke color, blocked doors, injured individuals).
              </p>
              <textarea
                rows={4}
                required
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (formErrors.description) setFormErrors({ ...formErrors, description: '' });
                }}
                placeholder="Example: Water entered our hostel building on ground floor. East staircase is flooded and 15 people cannot get out. We need drinking water and a rescue boat."
                className="w-full p-3.5 text-sm rounded-2xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {formErrors.description && (
                <p className="text-xs text-emergency-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {formErrors.description}
                </p>
              )}
            </div>

            {/* 3. Location & Landmark */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-bold text-navy-900">
                  3. Approximate Location & Landmark <span className="text-emergency-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={geoLocating}
                  className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{geoLocating ? 'Detecting GPS...' : 'Use My GPS Location'}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (formErrors.address) setFormErrors({ ...formErrors, address: '' });
                    }}
                    placeholder="Building name, Street, Campus Block (e.g. Hostel Block B)"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {formErrors.address && (
                    <p className="text-xs text-emergency-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {formErrors.address}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="Nearby landmark (e.g. Near Central Library / East Gate)"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. Affected People & Safety Status ("I Don't Know" Allowed) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* People count */}
              <div>
                <label className="block text-sm font-bold text-navy-900 mb-2">
                  4. Number of Affected People
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['1 - 4', '5 - 20', '20+', 'Unknown'].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setFormData({ ...formData, affectedPeople: val })}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        formData.affectedPeople === val
                          ? 'bg-navy-900 text-white border-navy-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val === 'Unknown' ? "Don't Know" : val}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.affectedPeople}
                  onChange={(e) => setFormData({ ...formData, affectedPeople: e.target.value })}
                  placeholder="Or enter custom count (e.g. 15 students)"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Safety Status */}
              <div>
                <label className="block text-sm font-bold text-navy-900 mb-2">
                  5. Current Safety Condition
                </label>
                <select
                  value={formData.safetyStatus}
                  onChange={(e) => setFormData({ ...formData, safetyStatus: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Safe">Safe for now (Sheltered / Stable)</option>
                  <option value="In Immediate Danger">In Immediate Danger (Fire, Rising Water)</option>
                  <option value="Trapped">Trapped / Cannot Evacuate</option>
                  <option value="Medical Attention Needed">Medical Attention Needed / Injured</option>
                  <option value="Unknown">I Don't Know / Unclear</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Helps coordinators prioritize life-safety rescues.
                </p>
              </div>

            </div>

            {/* 6. Required Resources Multi-select */}
            <div>
              <label className="block text-sm font-bold text-navy-900 mb-2">
                6. What resources or aid are needed most?
              </label>
              <div className="flex flex-wrap gap-2">
                {RESOURCE_OPTIONS.map((res) => {
                  const isChecked = formData.requiredResources.includes(res);
                  return (
                    <button
                      type="button"
                      key={res}
                      onClick={() => toggleResource(res)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isChecked
                          ? 'bg-primary-700 text-white border-primary-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {res}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. Optional Contact Info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                Contact Information (Optional - Anonymous reporting allowed)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="Your Name (or leave blank)"
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="Callback Phone Number"
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="Email Address"
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Form Submit Trigger (Review step) */}
            <div className="pt-2 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Reports will be tagged as <span className="font-semibold text-amber-800">PENDING_VERIFICATION</span>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emergency-600 hover:bg-emergency-700 text-white font-bold text-sm shadow-soft hover:shadow-soft-md transition-all"
              >
                <span>Review & Submit Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        )}

        {/* STEP 2: REVIEW BEFORE SUBMISSION */}
        {step === 'review' && (
          <div className="p-6 sm:p-10 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-navy-900">
                  Review Emergency Report
                </h2>
                <p className="text-xs text-slate-500">
                  Please confirm all details are accurate before broadcasting to emergency coordinators.
                </p>
              </div>
              <StatusBadge status="PENDING_VERIFICATION" />
            </div>

            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Emergency Category</span>
                  <p className="text-sm font-bold text-navy-900">{formData.incidentType}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Location & Landmark</span>
                  <p className="text-sm font-semibold text-navy-900">{formData.address}</p>
                  {formData.landmark && <p className="text-xs text-slate-500">Landmark: {formData.landmark}</p>}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60 mt-1">
                    {formData.description}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Safety Condition</span>
                  <p className="text-sm font-bold text-emergency-700">{formData.safetyStatus}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Affected People</span>
                  <p className="text-sm font-semibold text-navy-900">{formData.affectedPeople}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Requested Resources</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {formData.requiredResources.length > 0 ? (
                      formData.requiredResources.map((r) => (
                        <span key={r} className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                          {r}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">None specified</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Reported By</span>
                  <p className="text-xs text-slate-700">
                    {formData.contactName || 'Anonymous'} {formData.contactPhone ? `(${formData.contactPhone})` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Reassurance Disclaimer */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Coordination Notice:</strong> Upon submitting, this incident will be placed in the coordinator queue with status <span className="font-bold underline">PENDING_VERIFICATION</span>. Coordinators will validate details before dispatching emergency teams.
              </div>
            </div>

            {/* Review Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('form')}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Edit Details
              </button>

              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emergency-600 hover:bg-emergency-700 text-white text-sm font-bold shadow-soft hover:shadow-soft-md transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Transmitting Report...' : 'Confirm & Send Report'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS / OFFLINE SAVED CONFIRMATION */}
        {step === 'success' && submittedIncident && (
          <div className="p-8 sm:p-12 text-center space-y-6">
            {submittedIncident.isOfflineSaved ? (
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-soft">
                <CloudOff className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-soft">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            )}

            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-black text-navy-900 tracking-tight">
                {submittedIncident.isOfflineSaved ? 'Report Saved Locally on This Device' : 'Emergency Report Transmitted'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {submittedIncident.isOfflineSaved
                  ? 'Your report is safely stored in browser IndexedDB. It will be uploaded automatically when an internet connection returns.'
                  : 'Your report has been successfully stored in the central coordination database.'}
              </p>
            </div>

            {submittedIncident.isOfflineSaved && (
              <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Important Network Notice:</strong> Offline mode does not guarantee emergency delivery. Coordinators will receive your report only once your network connection is restored.
                </div>
              </div>
            )}

            {/* Report Receipt Card */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 text-xs shadow-soft">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="font-bold text-slate-500">Emergency Request ID</span>
                <span className="font-mono font-black text-sm text-primary-800 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200">
                  {submittedIncident.requestId || submittedIncident._id}
                </span>
              </div>

              {submittedIncident.trackingPin && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 bg-teal-50/50 p-2 rounded-xl">
                  <div>
                    <span className="font-bold text-teal-900 block">Confidential Tracking PIN</span>
                    <span className="text-[10px] text-slate-500">Keep this safe to track your request status</span>
                  </div>
                  <span className="font-mono font-black text-sm text-teal-800 bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-xs">
                    {submittedIncident.trackingPin}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Storage & Sync Status</span>
                {submittedIncident.isOfflineSaved ? (
                  <SyncStatus status="SAVED_OFFLINE" />
                ) : (
                  <StatusBadge status={submittedIncident.status} />
                )}
              </div>
              {submittedIncident.clientId && (
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Client UUID</span>
                  <span className="font-mono text-[10px] text-slate-600">{submittedIncident.clientId.slice(0, 18)}...</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Incident Category</span>
                <span className="font-semibold text-navy-900">{submittedIncident.incidentType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Location</span>
                <span className="font-semibold text-navy-900">{submittedIncident.location?.address}</span>
              </div>
            </div>

            {/* Reassurance Call Notice */}
            <div className="max-w-md mx-auto p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 text-left">
              <Phone className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Immediate Threat to Life?</strong> If conditions are deteriorating rapidly, do not wait for online status updates—immediately dial emergency services: <strong>112 / 911</strong>.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {submittedIncident.requestId && (
                <Link
                  to={`/track?requestId=${encodeURIComponent(submittedIncident.requestId)}&pin=${encodeURIComponent(submittedIncident.trackingPin || '')}`}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-soft flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Track Request Status
                </Link>
              )}
              {submittedIncident.isOfflineSaved && (
                <Link
                  to="/offline-reports"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-soft flex items-center justify-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" /> View Offline Queue
                </Link>
              )}
              <button
                onClick={handleResetForm}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-soft"
              >
                Submit Another Report
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* Community Incident Feed (Transparency & Status Monitoring) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-navy-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-700" />
              Recent Community Emergency Reports
            </h3>
            <p className="text-xs text-slate-500">
              Live transparency stream of emergency reports in the area and their verification status
            </p>
          </div>
          <button
            onClick={fetchIncidents}
            disabled={loadingIncidents}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-navy-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingIncidents ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </div>

        {loadingIncidents ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            Loading community incident reports...
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
            No incident reports registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents.map((item) => (
              <div
                key={item._id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-soft hover:shadow-soft-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-navy-900">
                        {item.incidentType}
                      </span>
                      {item.isSimulation && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          SIMULATION
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {item.location?.address}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    People: <strong className="text-navy-900">{item.affectedPeople}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
