// Validation schemas and sanitizers for AI inputs and outputs

export const validateExtractionInput = (req, res, next) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid emergency description text.',
    });
  }
  if (text.length > 5000) {
    return res.status(400).json({
      success: false,
      message: 'Emergency text is too long (maximum 5000 characters).',
    });
  }
  next();
};

export const validateGuideInput = (req, res, next) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a message for the ResQGuide assistant.',
    });
  }
  if (history && !Array.isArray(history)) {
    return res.status(400).json({
      success: false,
      message: 'Conversation history must be an array.',
    });
  }
  next();
};

export const validateResourceMatchingInput = (req, res, next) => {
  const { incidentId, incident } = req.body;
  if (!incidentId && !incident) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an incidentId or incident object to match resources against.',
    });
  }
  next();
};

export const validateIncidentSummaryInput = (req, res, next) => {
  const { incidentId, incident } = req.body;
  if (!incidentId && !incident) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an incidentId or incident object to summarize.',
    });
  }
  next();
};

/**
 * Sanitizes AI-generated output to prevent hallucinated coordinates or corrupted schemas
 */
export const sanitizeAiDraft = (draft) => {
  if (!draft || typeof draft !== 'object') {
    return {
      incidentType: 'Other',
      description: '',
      location: { text: '', latitude: null, longitude: null },
      affectedPeople: 'Unknown',
      safetyStatus: 'Unknown',
      requiredResources: [],
      missingInformation: ['Corrupted draft'],
      confidenceNotes: [],
    };
  }

  // Ensure latitude & longitude are null unless strictly valid numbers
  const lat = typeof draft.location?.latitude === 'number' ? draft.location.latitude : null;
  const lng = typeof draft.location?.longitude === 'number' ? draft.location.longitude : null;

  return {
    incidentType: draft.incidentType || 'Other',
    description: draft.description || '',
    location: {
      text: draft.location?.text || draft.location?.address || '',
      latitude: lat,
      longitude: lng,
    },
    affectedPeople: draft.affectedPeople ?? 'Unknown',
    safetyStatus: draft.safetyStatus || 'Unknown',
    requiredResources: Array.isArray(draft.requiredResources) ? draft.requiredResources : [],
    missingInformation: Array.isArray(draft.missingInformation) ? draft.missingInformation : [],
    confidenceNotes: Array.isArray(draft.confidenceNotes) ? draft.confidenceNotes : [],
  };
};
