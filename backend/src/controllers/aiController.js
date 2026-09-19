import { AuditLog } from '../models/AuditLog.js';
import {
  chatResQGuide,
  extractEmergencyReport,
  matchResourcesAI,
  generateIncidentSummaryAI,
  analyzeScenarioAI,
} from '../services/aiService.js';
import { sanitizeAiDraft } from '../validators/aiValidators.js';
import { Incident } from '../models/Incident.js';
import { ResourceOffer } from '../models/ResourceOffer.js';
import { SIMULATION_SCENARIOS } from './simulationController.js';

// @desc    ResQGuide Conversational Assistant Turn
// @route   POST /api/ai/guide
// @access  Public
export const guideChat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    const result = await chatResQGuide(message, history || []);

    const sanitizedDraft = sanitizeAiDraft(result.draft);

    res.status(200).json({
      success: true,
      reply: result.reply,
      isComplete: Boolean(result.isComplete),
      draft: sanitizedDraft,
      isAiFallback: Boolean(result.isAiFallback),
      modelUsed: result.modelUsed || 'Heuristic Fallback Engine',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Convert natural language distress description into structured JSON
// @route   POST /api/ai/report-extraction
// @access  Public
export const reportExtraction = async (req, res, next) => {
  try {
    const { text } = req.body;
    const result = await extractEmergencyReport(text);

    const sanitized = sanitizeAiDraft(result);

    res.status(200).json({
      success: true,
      extracted: sanitized,
      isAiFallback: Boolean(result.isAiFallback),
      modelUsed: result.modelUsed || 'Heuristic Fallback Engine',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Resource Matching for an incident
// @route   POST /api/ai/resource-matching
// @access  Public / Coordinator
export const resourceMatching = async (req, res, next) => {
  try {
    const { incidentId, incident: incidentData } = req.body;

    let targetIncident = incidentData;
    if (incidentId) {
      targetIncident = await Incident.findById(incidentId);
      if (!targetIncident) {
        return res.status(404).json({
          success: false,
          message: 'Incident report not found for resource matching.',
        });
      }
    }

    // Retrieve active available resources from database
    const availableResources = await ResourceOffer.find({
      availability: 'Available',
    }).limit(30);

    const matchResult = await matchResourcesAI(targetIncident, availableResources);

    res.status(200).json({
      success: true,
      incidentId: targetIncident._id || null,
      matches: matchResult.matches || [],
      missingInformation: matchResult.missingInformation || [],
      warnings: matchResult.warnings || [],
      isAiFallback: Boolean(matchResult.isAiFallback),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate concise AI Incident Summary for coordinators
// @route   POST /api/ai/incident-summary
// @access  Public / Coordinator
export const incidentSummary = async (req, res, next) => {
  try {
    const { incidentId, incident: incidentData } = req.body;

    let targetIncident = incidentData;
    if (incidentId) {
      targetIncident = await Incident.findById(incidentId);
      if (!targetIncident) {
        return res.status(404).json({
          success: false,
          message: 'Incident report not found for summary generation.',
        });
      }
    }

    const summaryResult = await generateIncidentSummaryAI(targetIncident);

    res.status(200).json({
      success: true,
      incidentId: targetIncident._id || null,
      summary: summaryResult.summary,
      isAiFallback: Boolean(summaryResult.isAiFallback),
      timestamp: summaryResult.timestamp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve resource match allocation (Coordinator action)
// @route   POST /api/ai/approve-allocation
// @access  Protected (Coordinator only or Public for offline/development convenience)
export const approveAllocation = async (req, res, next) => {
  try {
    const { incidentId, resourceId, notes } = req.body;

    if (!incidentId || !resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both incidentId and resourceId for allocation approval.',
      });
    }

    const [incident, resource] = await Promise.all([
      Incident.findById(incidentId),
      ResourceOffer.findById(resourceId),
    ]);

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Check resource availability
    if (resource.availability !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Resource is currently '${resource.availability}' and cannot be allocated.`,
      });
    }

    // Update resource to Allocated
    resource.availability = 'Allocated';
    await resource.save();

    // Update incident status to ASSIGNED and add coordinator audit note
    incident.status = 'ASSIGNED';
    const coordinatorName = req.user?.name || 'Authorized Coordinator';
    const auditNote = `[ALLOCATION APPROVED ${new Date().toLocaleTimeString()} by ${coordinatorName}]: Assigned ${resource.quantity} of "${resource.title}". ${notes || ''}`;
    incident.notes.push(auditNote);

    // Add event to incident timeline
    incident.timeline.push({
      eventType: 'RESOURCE_ALLOCATED',
      description: `Coordinator ${coordinatorName} approved allocation of ${resource.quantity} of "${resource.title}"`,
      timestamp: new Date(),
      performedBy: coordinatorName,
      performedByRole: req.user?.role || 'coordinator',
    });
    await incident.save();

    // Create Audit Log record
    if (req.user) {
      await AuditLog.create({
        action: 'RESOURCE_ALLOCATED',
        user: req.user._id,
        userName: coordinatorName,
        userRole: req.user.role,
        targetType: 'Incident',
        targetId: incident._id,
        details: {
          resourceId: resource._id,
          resourceTitle: resource.title,
          quantity: resource.quantity,
          notes: notes || '',
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Resource "${resource.title}" officially allocated to incident.`,
      incident,
      resource,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run AI Scenario Analysis (Preparedness checklist & gap insights)
// @route   POST /api/ai/scenario-analysis
// @access  Protected (Admin, Resource Provider, Coordinator)
export const scenarioAnalysis = async (req, res, next) => {
  try {
    const { scenarioId, scenarioData } = req.body;
    let targetScenario = scenarioData;

    if (!targetScenario && scenarioId) {
      targetScenario = SIMULATION_SCENARIOS[scenarioId.toUpperCase()];
    }

    if (!targetScenario) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either scenarioId or scenarioData to analyze.',
      });
    }

    const analysis = await analyzeScenarioAI(targetScenario);

    res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    next(error);
  }
};

