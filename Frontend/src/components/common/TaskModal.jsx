import React, { useState } from 'react';
import api from '../../services/api';
import { X, CheckCircle2, AlertCircle, Clock, CheckSquare } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, incidentId, onTaskCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('High');
  const [assignedToName, setAssignedToName] = useState('Cmdr. Sarah Jenkins');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task title');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.post('/tasks', {
        title: title.trim(),
        description: description.trim(),
        priority,
        incidentId,
        assignedToName,
      });

      if (res.data?.success) {
        if (onTaskCreated) onTaskCreated(res.data.task);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary-700" />
            <h3 className="text-base font-bold text-navy-900">Create Coordination Task</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-navy-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-navy-900 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dispatch boat crew to East Wing staircase"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Instructions / Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide tactical instructions, radio callsigns, or contact rendezvous..."
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy-900 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-navy-900 mb-1">Assignee</label>
              <select
                value={assignedToName}
                onChange={(e) => setAssignedToName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold"
              >
                <option value="Cmdr. Sarah Jenkins">Cmdr. Sarah Jenkins (Incident Commander)</option>
                <option value="Field Ops Unit 1">Field Ops Unit 1 (Rescue)</option>
                <option value="Logistics Depot B">Logistics Depot B (Supplies)</option>
                <option value="Medical Triage Team">Medical Triage Team (Emergency)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold transition shadow-xs"
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
