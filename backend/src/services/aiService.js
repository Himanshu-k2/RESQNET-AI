// Modular AI Service for ResQNet AI
// Supports Google Gemini API with intelligent local NLP fallback

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Calls Gemini API with structured prompt
 */
const callGemini = async (prompt, systemInstruction = '') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_api_key_here')) {
    return null; // Signals fallback
  }

  const model = process.env.AI_MODEL || 'gemini-1.5-flash';
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Gemini API responded with status ${res.status}:`, errText);
      return null;
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText || null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Gemini API request failed or timed out:', err.message);
    return null;
  }
};

/**
 * 1. ResQGuide AI Conversational Assistant
 * Interactively asks calm questions, supports English, Hindi, and Hinglish,
 * accepts "I don't know", and drafts structured report JSON.
 */
export const chatResQGuide = async (userMessage, history = []) => {
  const systemPrompt = `You are ResQGuide, an emergency triage assistant for ResQNet AI.
You help distressed citizens report emergencies calmly.
RULES:
1. Keep questions short, calm, clear, and direct.
2. If the user writes in Hindi or Hinglish, respond in the same language. If English, respond in English.
3. Help identify:
   - What happened?
   - Are you safe right now?
   - How many people are affected?
   - Where did this happen?
   - What help is needed?
4. If the user says "I don't know" or seems uncertain, accept it immediately without pressure.
5. NEVER fabricate missing details, casualty numbers, or coordinates.
6. Provide your response as JSON in this exact structure:
{
  "reply": "Your brief, empathetic next question or confirmation",
  "isComplete": true/false (true if enough basic details gathered to draft),
  "draft": {
    "incidentType": "Flood" | "Fire" | "Building Collapse" | "Medical Emergency" | "Accident" | "Missing Person" | "Other" | "",
    "description": "Concise factual summary so far",
    "location": {
      "text": "Location if mentioned or empty",
      "latitude": null,
      "longitude": null
    },
    "affectedPeople": number or "Unknown",
    "safetyStatus": "Safe" | "In Immediate Danger" | "Trapped" | "Medical Attention Needed" | "Unknown",
    "requiredResources": ["Water", "Food", etc.],
    "missingInformation": ["List of what is still unconfirmed"],
    "confidenceNotes": []
  }
}`;

  const conversationContext = history
    .map((h) => `${h.role === 'user' ? 'User' : 'ResQGuide'}: ${h.text}`)
    .join('\n');

  const fullPrompt = `${conversationContext}\nUser: ${userMessage}\nResQGuide (Respond in JSON):`;

  const geminiResponse = await callGemini(fullPrompt, systemPrompt);

  if (geminiResponse) {
    try {
      const cleanJson = geminiResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const parsed = JSON.parse(cleanJson);
      return {
        ...parsed,
        isAiFallback: false,
        modelUsed: process.env.AI_MODEL || 'gemini-1.5-flash',
      };
    } catch (parseErr) {
      console.warn('Failed to parse Gemini response as JSON, using rule-based triage:', parseErr);
    }
  }

  // Safe Intelligent Fallback (Multilingual Rule-based)
  return fallbackResQGuideChat(userMessage, history);
};

/**
 * 2. Natural Language Report Extraction
 * Converts free-text emergency messages into structured JSON.
 */
export const extractEmergencyReport = async (rawText) => {
  const systemPrompt = `You are an emergency report extractor for ResQNet AI.
Extract structured incident data from natural language crisis messages.
RULES:
1. Output MUST be valid JSON only.
2. NEVER guess or fabricate latitude/longitude. Always leave latitude: null, longitude: null unless explicitly provided as numbers.
3. Identify missing information explicitly.
4. incidentType must be one of: "Flood", "Fire", "Building Collapse", "Medical Emergency", "Accident", "Missing Person", "Other".
5. safetyStatus must be one of: "Safe", "In Immediate Danger", "Trapped", "Medical Attention Needed", "Unknown".

Response schema:
{
  "incidentType": "",
  "description": "",
  "location": {
    "text": "",
    "latitude": null,
    "longitude": null
  },
  "affectedPeople": number or "Unknown",
  "safetyStatus": "",
  "requiredResources": [],
  "missingInformation": [],
  "confidenceNotes": []
}`;

  const prompt = `Extract this emergency report:\n"${rawText}"\nRespond in JSON only:`;

  const geminiResponse = await callGemini(prompt, systemPrompt);

  if (geminiResponse) {
    try {
      const cleanJson = geminiResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const parsed = JSON.parse(cleanJson);
      return {
        ...parsed,
        isAiFallback: false,
        modelUsed: process.env.AI_MODEL || 'gemini-1.5-flash',
      };
    } catch (parseErr) {
      console.warn('Failed to parse Gemini extraction JSON, using rule-based extraction:', parseErr);
    }
  }

  // Safe Rule-based Fallback
  return fallbackExtractReport(rawText);
};

/**
 * 3. AI Resource Matching
 * Recommends available supplies from the database for an incident.
 */
export const matchResourcesAI = async (incident, availableResources) => {
  const resourcesPayload = availableResources.map((r) => ({
    id: r._id,
    type: r.resourceType,
    title: r.title,
    quantity: r.quantity,
    location: r.location?.address,
    availability: r.availability,
    verified: r.verificationStatus === 'VERIFIED',
  }));

  const systemPrompt = `You are an AI Resource Coordinator for ResQNet AI.
Recommend relevant resources from the provided list for an emergency incident.
RULES:
1. ONLY recommend resources from the provided list. Do NOT invent items.
2. Explain clearly why each resource was recommended.
3. Highlight any limitations or warnings (e.g. quantity gap, unverified provider).
4. Output JSON strictly adhering to:
{
  "matches": [
    {
      "resourceId": "string id from input",
      "reason": "Clear explanation of why this resource matches the incident demand",
      "resourceType": "Resource category",
      "availability": "Available/Allocated",
      "limitations": ["Any limitation like partial quantity or transit distance"]
    }
  ],
  "missingInformation": ["Information needed like precise delivery point"],
  "warnings": ["Coordinator caution notes"]
}`;

  const prompt = `Incident Details:
Type: ${incident.incidentType}
Description: ${incident.description}
Location: ${incident.location?.address || 'Unspecified'}
People Affected: ${incident.affectedPeople}
Required Resources: ${incident.requiredResources?.join(', ') || 'Unspecified'}
Urgency: ${incident.urgency || 'High'}

Available Community Resources:
${JSON.stringify(resourcesPayload, null, 2)}

Provide recommendations in JSON:`;

  const geminiResponse = await callGemini(prompt, systemPrompt);

  if (geminiResponse) {
    try {
      const cleanJson = geminiResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const parsed = JSON.parse(cleanJson);
      return {
        ...parsed,
        isAiFallback: false,
      };
    } catch (err) {
      console.warn('Gemini resource match parse failed, using heuristic match:', err);
    }
  }

  // Heuristic Matcher Fallback
  return fallbackMatchResources(incident, availableResources);
};

/**
 * 4. AI Incident Summary
 * Generates an executive coordinator briefing.
 */
export const generateIncidentSummaryAI = async (incident) => {
  const systemPrompt = `You are an AI briefing assistant for emergency coordinators.
Generate a concise, objective summary for an incident report.
RULES:
1. Never invent facts. Clearly state unknown details.
2. Highlight: What happened, affected count, location available, resources requested, safety status, missing information.
3. Prepend "AI-generated summary:".
4. Max 4-5 sentences.`;

  const prompt = `Incident:
Type: ${incident.incidentType}
Description: ${incident.description}
Location: ${incident.location?.address || 'Unknown'} (Landmark: ${incident.location?.landmark || 'None'})
Affected People: ${incident.affectedPeople || 'Unknown'}
Safety Status: ${incident.safetyStatus || 'Unknown'}
Required Resources: ${incident.requiredResources?.join(', ') || 'None specified'}
Verification: ${incident.status}`;

  const geminiResponse = await callGemini(prompt, systemPrompt);

  if (geminiResponse) {
    return {
      summary: geminiResponse.trim(),
      isAiFallback: false,
      timestamp: new Date().toISOString(),
    };
  }

  // Fallback Summary
  return fallbackIncidentSummary(incident);
};

// ==========================================
// SAFE INTELLIGENT NLP FALLBACK IMPLEMENTATIONS
// ==========================================

const fallbackResQGuideChat = (userMessage, history) => {
  const lower = userMessage.toLowerCase();
  const stepCount = history.filter((h) => h.role === 'user').length;

  let reply = '';
  let incidentType = 'Other';
  let safetyStatus = 'Unknown';
  let affectedPeople = 'Unknown';
  const requiredResources = [];
  const missingInformation = [];

  // Multilingual keyword detection (English, Hindi, Hinglish)
  if (lower.includes('flood') || lower.includes('pani') || lower.includes('water') || lower.includes('dubo') || lower.includes('baadh')) {
    incidentType = 'Flood';
    requiredResources.push('Drinking Water', 'Evacuation Boats');
  } else if (lower.includes('fire') || lower.includes('aag') || lower.includes('smoke') || lower.includes('dhuaan')) {
    incidentType = 'Fire';
    requiredResources.push('Evacuation Transport', 'First Aid / Medical');
  } else if (lower.includes('collapse') || lower.includes('gir gaya') || lower.includes('debris') || lower.includes('malba') || lower.includes('building')) {
    incidentType = 'Building Collapse';
    requiredResources.push('Rescue Equipment', 'Volunteers');
  } else if (lower.includes('medical') || lower.includes('heart') || lower.includes('injury') || lower.includes('chot') || lower.includes('blood') || lower.includes('asthma')) {
    incidentType = 'Medical Emergency';
    requiredResources.push('First Aid / Medical', 'Ambulance Support');
  }

  if (lower.includes('trapped') || lower.includes('fase') || lower.includes('phasa')) {
    safetyStatus = 'Trapped';
  } else if (lower.includes('safe') || lower.includes('surakshit')) {
    safetyStatus = 'Safe';
  } else if (lower.includes('danger') || lower.includes('khatra')) {
    safetyStatus = 'In Immediate Danger';
  }

  // Extract count if mentioned
  const numberMatch = userMessage.match(/\b(\d+)\b/);
  if (numberMatch) {
    affectedPeople = parseInt(numberMatch[1], 10);
  }

  // Conversation progression logic
  const isHindi = lower.includes('hai') || lower.includes('kya') || lower.includes('log') || lower.includes('aur') || lower.includes('gaya');

  if (stepCount === 0) {
    reply = isHindi
      ? 'Aap aur aas paas ke log abhi surakshit hain ya kisi turant khatre me hain? Kripya batayein.'
      : 'Understood. Are you and the people around you currently safe, or in immediate danger?';
  } else if (stepCount === 1) {
    reply = isHindi
      ? 'Kripya batayein kitne log prabhavit hain aur lagbhag kis jagah (location) par yeh hua hai?'
      : 'Approximately how many people are affected, and what is your approximate location or building?';
  } else {
    reply = isHindi
      ? 'Maine aapki report ka draft taiyar kar liya hai. Aap ise neeche review aur submit kar sakte hain.'
      : 'I have prepared a draft of your emergency report based on our conversation. You can review and submit it below.';
  }

  if (safetyStatus === 'Unknown') missingInformation.push('Current safety status');
  if (affectedPeople === 'Unknown') missingInformation.push('Number of affected individuals');
  missingInformation.push('Exact GPS coordinates (pending verification)');

  return {
    reply,
    isComplete: stepCount >= 2,
    draft: {
      incidentType,
      description: userMessage,
      location: {
        text: '',
        latitude: null,
        longitude: null,
      },
      affectedPeople,
      safetyStatus,
      requiredResources,
      missingInformation,
      confidenceNotes: ['Processed via ResQNet Emergency NLP Fallback (Rule-Based)'],
    },
    isAiFallback: true,
  };
};

const fallbackExtractReport = (rawText) => {
  const lower = rawText.toLowerCase();

  let incidentType = 'Other';
  let safetyStatus = 'Unknown';
  let affectedPeople = 'Unknown';
  const requiredResources = [];
  const missingInformation = [];

  // Incident Type heuristics
  if (/flood|water|submerged|overflow|drowning|baadh|pani/.test(lower)) {
    incidentType = 'Flood';
  } else if (/fire|burn|flame|smoke|explosion|aag|dhuaan/.test(lower)) {
    incidentType = 'Fire';
  } else if (/collapse|rubble|crushed|debris|building|malba|gir gaya/.test(lower)) {
    incidentType = 'Building Collapse';
  } else if (/medical|injured|ambulance|stroke|unconscious|oxygen|doctor|asthma|chot/.test(lower)) {
    incidentType = 'Medical Emergency';
  } else if (/accident|crash|collision|overturned/.test(lower)) {
    incidentType = 'Accident';
  } else if (/missing|lost|unreachable|kidnapped/.test(lower)) {
    incidentType = 'Missing Person';
  }

  // People Count extraction
  const numMatch = rawText.match(/(\d+)\s*(people|students|persons|victims|log|members)?/i);
  if (numMatch && numMatch[1]) {
    affectedPeople = parseInt(numMatch[1], 10);
  }

  // Safety Status heuristics
  if (/trapped|stuck|cannot get out|fase|phasa/.test(lower)) {
    safetyStatus = 'Trapped';
  } else if (/immediate danger|rising water|flames|smoke entering|khatra/.test(lower)) {
    safetyStatus = 'In Immediate Danger';
  } else if (/safe|stable|sheltered|surakshit/.test(lower)) {
    safetyStatus = 'Safe';
  } else if (/injured|bleeding|breath|oxygen/.test(lower)) {
    safetyStatus = 'Medical Attention Needed';
  }

  // Required Resources heuristics
  if (/water|drinking|thirst|pani/.test(lower)) requiredResources.push('Drinking Water');
  if (/food|ration|meals|hunger|khana/.test(lower)) requiredResources.push('Food Rations');
  if (/medical|doctor|medicine|first aid|inhaler|oxygen/.test(lower)) requiredResources.push('First Aid / Medical');
  if (/boat|raft|zodiac/.test(lower)) requiredResources.push('Evacuation Boats');
  if (/ambulance|stretcher|transit/.test(lower)) requiredResources.push('Ambulance Support');
  if (/shelter|tents|dry place|roof/.test(lower)) requiredResources.push('Shelter / Tents');
  if (/volunteer|hands|help/.test(lower)) requiredResources.push('Relief Volunteers');

  if (requiredResources.length === 0) {
    if (incidentType === 'Flood') requiredResources.push('Drinking Water', 'Evacuation Boats');
    else if (incidentType === 'Fire') requiredResources.push('Evacuation Transport', 'First Aid / Medical');
    else requiredResources.push('Relief Volunteers');
  }

  // Location heuristics (look for "near", "at", "in", "block", "hostel")
  let locationText = '';
  const locMatch = rawText.match(/(?:near|at|in|block|sector|hostel)\s+([A-Za-z0-9\s,\-]+?)(?:\.|$|,|\b\d+\s+people\b)/i);
  if (locMatch && locMatch[0]) {
    locationText = locMatch[0].trim();
  } else {
    missingInformation.push('Exact landmark or street location');
  }

  if (affectedPeople === 'Unknown') missingInformation.push('Number of people affected');

  return {
    incidentType,
    description: rawText.trim(),
    location: {
      text: locationText,
      latitude: null,
      longitude: null,
    },
    affectedPeople,
    safetyStatus,
    requiredResources,
    missingInformation,
    confidenceNotes: ['Extracted via ResQNet Emergency NLP Fallback'],
    isAiFallback: true,
  };
};

const fallbackMatchResources = (incident, availableResources) => {
  const matches = [];
  const reqLower = (incident.requiredResources || []).map((r) => r.toLowerCase());
  const typeLower = (incident.incidentType || '').toLowerCase();

  for (const res of availableResources) {
    if (res.availability !== 'Available') continue;

    const resTypeLower = (res.resourceType || '').toLowerCase();
    const resTitleLower = (res.title || '').toLowerCase();

    let matched = false;
    let reason = '';

    // Direct match
    if (reqLower.some((r) => r.includes(resTypeLower) || resTypeLower.includes(r))) {
      matched = true;
      reason = `Direct match for requested category "${res.resourceType}". Ready with quantity ${res.quantity}.`;
    } else if (typeLower === 'flood' && (resTypeLower.includes('water') || resTypeLower.includes('rescue') || resTitleLower.includes('raft') || resTitleLower.includes('boat'))) {
      matched = true;
      reason = `Critical flood response resource (${res.title}) matches aquatic rescue and hydration needs.`;
    } else if (typeLower === 'fire' && (resTypeLower.includes('medical') || resTypeLower.includes('shelter') || resTypeLower.includes('ambulance'))) {
      matched = true;
      reason = `Fire emergency support: Provides essential medical aid or temporary refuge.`;
    } else if (reqLower.some((r) => resTitleLower.includes(r.toLowerCase()))) {
      matched = true;
      reason = `Resource title "${res.title}" closely matches specified requirement.`;
    }

    if (matched) {
      matches.push({
        resourceId: res._id,
        reason,
        resourceType: res.resourceType,
        availability: res.availability,
        limitations: [
          `Pickup location: ${res.location?.address || 'Contact provider directly'}`,
          res.verificationStatus === 'VERIFIED' ? 'Provider is verified' : 'Provider pending verification',
        ],
      });
    }
  }

  return {
    matches,
    missingInformation: matches.length === 0 ? ['No matching supplies registered nearby. Additional volunteers required.'] : [],
    warnings: [
      'AI recommendation only. Coordinator authorization required before dispatching.',
      'Check provider phone before authorizing transport.',
    ],
    isAiFallback: true,
  };
};

const fallbackIncidentSummary = (incident) => {
  const type = incident.incidentType || 'Emergency';
  const loc = incident.location?.address ? `at ${incident.location.address}` : 'at an unspecified location';
  const people = incident.affectedPeople && incident.affectedPeople !== 'Unknown' ? `affecting approximately ${incident.affectedPeople} individuals` : 'with casualty numbers yet unconfirmed';
  const safety = incident.safetyStatus && incident.safetyStatus !== 'Unknown' ? `Current safety status is "${incident.safetyStatus}".` : 'Safety condition remains unknown.';
  const resources = incident.requiredResources?.length > 0 ? `Requested supplies: ${incident.requiredResources.join(', ')}.` : 'No specific resources listed.';

  const summary = `AI-generated summary: A ${type} incident has been reported ${loc}, ${people}. ${safety} ${resources} Incident status is ${incident.status}. Exact coordinates and field validation require coordinator review.`;

  return {
    summary,
    isAiFallback: true,
    timestamp: new Date().toISOString(),
  };
};

/**
 * 5. Analyze Preparedness Scenario with AI
 * Generates an operational readiness checklist, simulated gap identification, and matching logic.
 */
export const analyzeScenarioAI = async (scenario) => {
  const prompt = `
You are ResQNet AI, an emergency response simulation intelligence engine.
Analyze the following SIMULATED emergency scenario:
Scenario Title: ${scenario.name}
Category: ${scenario.category}
Priority: ${scenario.urgency}
Simulated Location: ${scenario.address}
Affected Count: ${scenario.affectedPeople}
Situation: ${scenario.description}
Required Resources: ${(scenario.requiredResources || []).join(', ')}

Provide a strict JSON response analyzing this scenario for coordinator preparedness.
Do NOT claim this is a real emergency. Use label "AI-GENERATED DEMONSTRATION".
Output format:
{
  "summary": "Concise overview of the operational challenge (2-3 sentences)",
  "simulatedGaps": ["Gap 1", "Gap 2"],
  "coordinationChecklist": ["Action 1", "Action 2", "Action 3"],
  "assumptions": ["Assumption 1", "Assumption 2"],
  "disclaimer": "AI-GENERATED DEMONSTRATION: Synthetic preparedness simulation. Does not reflect live dispatch or actual emergency services deployment."
}
Only output valid JSON. No markdown ticks.`;

  const geminiText = await callGemini(prompt);
  if (geminiText) {
    try {
      const clean = geminiText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      return {
        ...parsed,
        isAiFallback: false,
        modelUsed: process.env.AI_MODEL || 'gemini-1.5-flash',
      };
    } catch (e) {
      console.warn('Failed to parse Gemini scenario analysis, using fallback:', e.message);
    }
  }

  return fallbackScenarioAnalysis(scenario);
};

const fallbackScenarioAnalysis = (scenario) => {
  return {
    summary: `AI-GENERATED DEMONSTRATION: Simulated ${scenario.category} scenario in ${scenario.address} involving ${scenario.affectedPeople}. Coordination priority is evaluated as ${scenario.urgency}.`,
    simulatedGaps: [
      `Potential shortfall in immediate ${scenario.requiredResources?.[0] || 'potable water'} availability within 2-hour window.`,
      `Secondary logistics challenge: Rapid staging of ${scenario.requiredResources?.[1] || 'medical kits'} through congested perimeter routes.`,
    ],
    coordinationChecklist: [
      `1. Establish local staging depot at or near ${scenario.landmark || scenario.address}.`,
      `2. Contact registered community providers for ${scenario.requiredResources?.slice(0, 2).join(' & ') || 'relief supplies'}.`,
      `3. Verify on-ground volunteer headcount and dispatch safety instructions.`,
      `4. Maintain hourly status roll-call with regional disaster coordinators.`,
    ],
    assumptions: [
      'Simulated supply levels assume standard urban road access without secondary structural collapse.',
      'Telecommunications expected to operate under battery backup protocols.',
    ],
    disclaimer: 'AI-GENERATED DEMONSTRATION: Synthetic preparedness simulation. Does not reflect live dispatch or actual emergency services deployment.',
    isAiFallback: true,
    modelUsed: 'Heuristic Simulation Fallback Engine',
  };
};

