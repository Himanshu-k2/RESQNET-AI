# RESQNET AI
### AI-Powered Emergency Coordination & Resource Network

> Connecting emergency distress needs with verified community support through multimodal AI triage, offline-first resilience, and human-in-the-loop coordinator authorization.
> **ResQNet AI. Emergency Coordination & Resource Network.**

---

## Tech Stack

- **Frontend:** React 18, Vite, React Router v6, Tailwind CSS, Axios, Leaflet, Lucide Icons, Browser IndexedDB API
- **Backend:** Node.js, Express.js (ESM), Mongoose, JWT, bcryptjs, CORS
- **Database:** Dual-mode MongoDB (Automatic in-memory `mongodb-memory-server` fallback for zero-friction local execution, plus external `MONGODB_URI` support)
- **AI Integration:** Google Gemini API with intelligent local NLP & rule-based heuristic fallback engine
- **Offline Storage:** Client-side IndexedDB database (`resqnet_offline`) with persistent queues and idempotency tracking
- **Ports:**
  - Frontend: `http://localhost:5174`
  - Backend API: `http://localhost:5001`

---

## Quick Start

### 1. Backend Setup
```bash
cd server
cp .env.example .env

# Optional: Add your Gemini API Key for live AI generation
# If left empty, ResQNet AI automatically engages its intelligent local NLP fallback engine!
# GEMINI_API_KEY=your_key_here

npm install
npm start
```
*The backend automatically starts an in-memory MongoDB instance and seeds realistic disaster simulation records if no external database is configured.*

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```
Open **[http://localhost:5174](http://localhost:5174)** in your browser.

---

## Phase 4: Offline-First Architecture & Resilient Storage

Disasters routinely sever power lines, cellular towers, and internet connectivity. ResQNet AI implements an offline-first architecture to guarantee zero data loss during connectivity blackouts.

### 1. IndexedDB Storage Architecture
Offline reports are preserved client-side in the browser's persistent IndexedDB (`resqnet_offline` database, `pendingReports` store).

**IndexedDB Record Schema:**
```javascript
{
  id: "e4a7a512-...",          // Primary key in IndexedDB
  clientId: "9f32b814-...",    // Unique UUID generated via crypto.randomUUID()
  reportData: {                // Complete incident payload
    incidentType: "Flood",
    description: "Water entered ground floor hostel...",
    location: { address: "Block B, North Campus" },
    affectedPeople: "15",
    safetyStatus: "Trapped",
    requiredResources: ["Drinking Water", "Evacuation Boats"],
    urgency: "High",
    clientId: "9f32b814-...",
    offlineCreatedAt: "2026-09-19T10:15:00.000Z"
  },
  syncStatus: "SAVED_OFFLINE", // 'SAVED_OFFLINE' | 'UPLOADING' | 'UPLOADED' | 'UPLOAD_FAILED'
  createdAt: "2026-09-19T10:15:00.000Z",
  retryCount: 0,
  lastSyncAttempt: null,
  lastError: null,
  offlineCreatedAt: "2026-09-19T10:15:00.000Z"
}
```

### 2. Synchronization & Idempotency Workflow
1. **Offline Capture:** When offline, emergency reports validate locally, generate a client UUID (`clientId`), and save directly to IndexedDB with status `SAVED_OFFLINE`.
2. **Reconnection Detection:** `useOnlineStatus` detects the browser's `online` event and verifies network reachability via periodic pings to `/api/health`.
3. **Queue Ingestion:** `syncService.js` fetches pending local records, sets status to `UPLOADING`, and submits them to `POST /api/incidents`.
4. **Duplicate Prevention (Deduplication):**
   - The backend checks `Incident.findOne({ clientId })`.
   - If an incident with the same `clientId` already exists (e.g. earlier retry succeeded or client disconnected before receiving response), the backend responds with `{ duplicate: true, incidentId, status: "PENDING_VERIFICATION" }` without creating a duplicate database document.
   - The client marks the local IndexedDB record as `UPLOADED` with `duplicate: true`.
5. **Upload Failures:** If upload fails due to network timeout or server disruption, the record is marked `UPLOAD_FAILED` with the error reason and retry count incremented. Records remain safely preserved for manual or automatic retry.

### 3. Report Status Meanings

| Status Badge | Location | Meaning |
|---|---|---|
| `SAVED_OFFLINE` | Client IndexedDB | Report saved locally on device. Awaiting internet connectivity. |
| `UPLOADING` | Client / Network | Report is actively being transmitted over HTTP to the server. |
| `UPLOADED` | Client / Server | Received by central server. Synchronized with database. |
| `UPLOAD_FAILED` | Client IndexedDB | Transmission encountered an error. Safe for retry. |
| `PENDING_VERIFICATION` | Central Server | Uploaded report awaiting validation by verified disaster coordinator. |
| `VERIFIED` | Central Server | Disaster coordinator has confirmed report authenticity. |
| `ASSIGNED` | Central Server | Supplies, volunteers, or emergency services matched and deployed. |

### 4. Important Offline Disclaimer
> **CRITICAL NOTICE:** Offline mode saves reports locally on your device to prevent data loss. **Offline storage does NOT guarantee immediate emergency dispatch or notification.** Coordinators will only receive and act on your report after your internet connection is restored. In immediate life-threatening situations, dial local emergency services (911 / 112).

---

## AI Capabilities & Fallback Behavior

### 1. AI Assistant & Extraction
- **ResQGuide Conversational AI Assistant:** `POST /api/ai/guide`
- **Natural-Language Distress Report Extraction:** `POST /api/ai/report-extraction`
- **Resource Matching Engine:** `POST /api/ai/resource-matching`
- **Executive Summary Briefing:** `POST /api/ai/incident-summary`
- **Coordinator Approval Action:** `POST /api/ai/approve-allocation`

### 2. Offline & Network AI Fallback
- When offline or when the AI endpoint is unreachable, the application **never** blocks distress reporting.
- User-entered text is preserved directly into the emergency description field.
- The interface informs the user that AI is offline and invites them to complete the manual emergency intake form.
- No repeated network retries spam the AI endpoint while disconnected.

---

## Testing Offline Mode

1. Open **ResQNet AI** at `http://localhost:5174`.
2. Open Chrome/Firefox DevTools (`F12`), switch to the **Network** tab, and toggle throttling to **Offline**.
3. Observe the top banner change to:
   `"You are offline. Reports will be saved locally and synced when connection is restored."`
4. Navigate to **Report Emergency** (`/need-help`).
5. Fill out the emergency intake form and click **Review & Submit Report**.
6. On review, click **Confirm & Send Report**.
7. The report saves to **IndexedDB** with status `SAVED_OFFLINE` and provides a receipt with client UUID and direct link to the **Offline Queue** (`/offline-reports`).
8. In DevTools, toggle the Network back to **No Throttling** (Online).
9. Observe the top banner change to **Syncing...** and then **All offline reports uploaded successfully.**
10. Check `/offline-reports` to see the report marked as `UPLOADED & SYNCED`.

---

## Safety & Ethical Principles

1. **AI Assists, Humans Decide:** AI never independently verifies emergencies or dispatches teams.
2. **Pending Verification by Default:** All submitted reports and offers enter the system as `PENDING_VERIFICATION`.
3. **No Hallucinations:** The platform accepts *"I don't know"* and leaves coordinates `null` rather than fabricating locations.
4. **Offline Resilience:** Zero data loss during disaster blackouts using client-side IndexedDB.
5. **Emergency Disclaimer:** In life-threatening emergencies, citizens are always advised to contact official dispatch (911 / 112).

---


---

## Phase 5: Coordinator Command Center, Verification, Interactive Map & Resource Dispatch

Phase 5 transforms ResQNet AI into a fully authorized Command Center for disaster coordinators, municipal teams, and relief NGOs.

### 1. Key Functionality
- **Live Command Telemetry:** Real-time counters for Total Reports, Pending Verification, Verified Cases, Active Response, Available Supplies, and Tactical Task Orders.
- **Human-in-the-Loop Incident Verification:**
  - Strict separation between `verificationStatus` (`PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`, `NEEDS_MORE_INFORMATION`) and operational incident `status` (`NEW`, `REPORTED`, `UNDER_REVIEW`, `VERIFIED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).
  - Strict backend authorization (`authorize('coordinator', 'admin')`). Normal citizens receive HTTP 403 Forbidden.
  - Rejection strictly requires a non-empty, audited rationale.
- **Interactive Crisis Map (Leaflet + OpenStreetMap):**
  - Live GPS markers for emergency incidents (categorized by type: Flood, Fire, Building Collapse, Medical) and registered resource offers.
  - Verification boundary styling: Solid green border for `VERIFIED` cases; dashed amber border for `PENDING_VERIFICATION`.
  - Filter modes: All Markers, Incidents Only, Resources Only, Verified Only, Pending Only.
  - Never fabricates coordinates; records lacking GPS telemetry remain searchable via text.
- **Incident Detail Page (`/incidents/:id`):**
  - Complete field breakdown, requested supplies, and coordinator quick actions.
  - **Incident Event Timeline:** Chronological audit trail showing `REPORT_CREATED`, `REPORT_SUBMITTED`, `INCIDENT_VERIFIED`, `RESOURCE_ALLOCATED`, `COORDINATOR_ASSIGNED`, and `STATUS_UPDATED`.
  - Privacy protections: Direct reporter phone and email are protected and visible only to authorized coordinators.
- **AI Resource Matching & Human Allocation Approval:**
  - AI provides matching recommendations comparing requested needs with registered depot supplies.
  - Coordinators must explicitly authorize and confirm allocation (`POST /api/ai/approve-allocation`), which transitions the incident to `ASSIGNED`, marks the resource as `Allocated`, and records an audit log.
- **Coordinator Task Management:**
  - Tactical orders linked to specific incident cases (`POST /api/tasks`, `GET /api/tasks`, `PATCH /api/tasks/:id`).
  - Prioritized by severity (`Critical`, `High`, `Medium`, `Low`) with assignees.
- **Audit Logging & Compliance:**
  - Centralized audit trail (`AuditLog` collection) tracking every verification, rejection, allocation, status update, note, and task creation with coordinator identity, timestamp, and explanation.

### 2. API Endpoints Reference

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/analytics/overview` | Public | Live telemetry stats & recent items |
| `GET` | `/api/incidents` | Public | List & search incidents with filters & pagination |
| `GET` | `/api/incidents/:id` | Public/Protected | Detailed case view (sanitizes contact info for citizens) |
| `PATCH` | `/api/incidents/:id` | Protected | Update operational status or details |
| `POST` | `/api/incidents/:id/verify` | Coordinator/Admin | Human verification, rejection, or info request |
| `POST` | `/api/incidents/:id/assign` | Coordinator/Admin | Assign incident lead coordinator |
| `POST` | `/api/incidents/:id/notes` | Coordinator/Admin | Append tactical coordination note |
| `GET` | `/api/incidents/:id/timeline` | Public | Fetch chronological event history |
| `GET` | `/api/resources` | Public | List resource offers with type & availability filters |
| `PATCH` | `/api/resources/:id` | Protected | Update resource status or quantity |
| `POST` | `/api/resources/:id/verify` | Coordinator/Admin | Verify or reject resource offer |
| `POST` | `/api/ai/approve-allocation` | Coordinator/Admin | Authorize resource assignment to incident |
| `GET` | `/api/tasks` | Coordinator/Admin | List tactical tasks |
| `POST` | `/api/tasks` | Coordinator/Admin | Create incident task order |
| `PATCH` | `/api/tasks/:id` | Coordinator/Admin | Update task status or assignee |
| `GET` | `/api/audit` | Coordinator/Admin | Inspect compliance audit log trail |
| `POST` | `/api/simulation/start` | Coordinator/Admin | Launch disaster crisis scenario (`FLOOD`, `FIRE`, `MEDICAL`, `FOOD_WATER`) |
| `POST` | `/api/simulation/reset` | Coordinator/Admin | Safely purge synthetic data and reseed baseline demo state |
| `GET` | `/api/simulation/status` | Public | Inspect active simulation status, scenario catalog, and record counts |
| `POST` | `/api/simulation/advance-step` | Coordinator/Admin | Advance demo coordination pipeline (`VERIFY`, `ASSIGN_LEAD`, `RESOLVE`) |

---

## Phase 6: Emergency Simulation Mode, Demo Data Management & Presentation Polish

Phase 6 hardens ResQNet AI into a bulletproof presentation and demonstration platform with end-to-end disaster scenario automation, strict database isolation, and guaranteed non-destructive reset protocols.

### 1. Predefined Crisis Scenarios

| Scenario Key | Name | Urgency | Description | Synthetic Resources Ingested |
|---|---|---|---|---|
| `FLOOD` | Campus Flash Flood Emergency | Critical | 18 students stranded in Hostel Block B ground floor dorms under 4ft water. | 150 Water Cans (20L), 2 Inflatable Rafts & 25 Life Vests, 300 Meal Packets, 12 Trained Relief Volunteers |
| `FIRE` | Substation Electrical Blaze | Critical | Transformer spark fire spreading along boundary wall towards dormitory. | 20 Commercial CO2 Fire Extinguishers, Gymnasium Shelter (60 cots), 15 Emergency Burn Care Kits |
| `MEDICAL` | Staff Colony Respiratory Crisis | Critical | Elderly residents experiencing acute asthma attacks from generator backdraft. | 6 Oxygen Concentrators & Inhalers, 1 Mobile Ambulance Patient Van |
| `FOOD_WATER` | Displaced Relief Camp Shortage | High | 85 evacuees in temporary gymnasium shelter facing acute drinking water shortage. | 200 Sealed Water Cans (4000L), 500 Hot Cooked Meal Packets |

### 2. Data Safety & Non-Dispatch Guarantees

1. **Strict Partitioning (`isSimulation: true`):** All records created through the simulation engine carry explicit `isSimulation: true` flags in MongoDB and IndexedDB.
2. **Guaranteed Real-World Record Preservation:** Reset operations strictly execute `Incident.deleteMany({ isSimulation: true })`. Real citizen distress submissions (`isSimulation: false`) are never touched or modified.
3. **Transparent Watermarking:** Every simulated incident, supply depot, and map pin clearly displays glowing `SIMULATION MODE` and `SIMULATION DATA` badges across all feeds, maps, and detail views.
4. **No Phantom Dispatch:** Simulation mode actions are isolated for visual and procedural evaluation and will never trigger external municipal dispatches or fabricate rescue completions.

### 3. Step-by-Step Demo Walkthrough

1. Open **ResQNet AI** at `http://localhost:5174`.
2. Click **Simulation Hub** in the navigation bar or Command Center.
3. Switch to the **Crisis Scenarios** tab and click **Launch This Scenario** on **Campus Flash Flood Emergency**.
4. Observe the yellow/amber **SIMULATION MODE ACTIVE** banner appear across the top of the entire interface.
5. In **Command Center** (`/coordinator`), observe the simulated incident appear under **Pending Verification** with a prominent `SIMULATION` badge.
6. Click **Verify / Reject Case** to approve the simulated incident (status transitions to `VERIFIED`).
7. Open **AI Resource Matching** to view matching recommendations for Clean Drinking Water and Inflatable Rafts.
8. Click **Authorize Allocation** to link the supplies to the incident (status transitions to `ASSIGNED`).
9. Inspect the **Incident Timeline** and **Audit Log** to observe complete chronological accountability.
10. Click **Reset Simulation Data** in the banner or hub to safely restore the clean demonstration baseline.

---

## Roadmap Milestones

- [x] **Phase 1:** Project Setup, Node.js + Express backend, dual-mode MongoDB, JWT auth, soothing Tailwind UI system.
- [x] **Phase 2:** Core Workflows: Need Help form with review step, Provide Help resource registration & status toggling, and live telemetry dashboard.
- [x] **Phase 3:** AI Integration: Gemini API modular service, ResQGuide conversational assistant, report extraction, AI resource matching, coordinator approval workflow.
- [x] **Phase 4:** Offline-First IndexedDB Local Storage, Idempotent Synchronization & Branding Cleanup.
- [x] **Phase 5:** Coordinator Command Center, Interactive Crisis Map, Human-in-the-Loop Verification, Resource Dispatch, Task Management & Audit Logging.
- [x] **Phase 6:** Emergency Simulation Mode, Demo Data Management, Guided Walkthrough, Accessibility & UX Polish. (100% Complete)
- [x] **Community Groups & Homepage Redesign:** Professional Community Safety Overview & Recent Activity Feed, Community Groups Module, Invite Codes, Voluntary Safety Roll-Calls, Priority Announcements, and Group-Linked Incidents.
- [x] **Enterprise Secure Authentication & Role-Based Access Control (RBAC):** Dedicated Help Provider registration, common multi-role login gateway, anonymous intake & confidential PIN tracking, Admin Console with user appointment/deactivation, and immutable security audit logging.

---

## Secure Authentication & Role-Based Access Control (RBAC)

ResQNet AI implements enterprise-grade Role-Based Access Control (RBAC) designed for humanitarian disaster response:

### 1. Core Account Structure & Privileges

| Persona | Role Key | Registration & Auth | Permissions & Capabilities |
|---|---|---|---|
| **Person Needing Help** | *Anonymous* | No account or login required | • Can submit urgent reports with AI-assisted intake<br>• Receives unique `requestId` and confidential 6-digit `trackingPin`<br>• Real-time sanitized milestone tracking via `/track`<br>• Strictly blocked from internal coordination dashboards |
| **Help Provider** | `RESOURCE_PROVIDER` | Public registration at `/register/provider`<br>*(Role selection blocked on client; backend enforced)* | • Exclusive dashboard at `/provider/dashboard`<br>• Register shelters, food, water, medical supplies, equipment, and volunteer teams<br>• Toggle item availability (`Available`, `In Use`, `Standby`)<br>• View own resources and verification feedback<br>• **Restricted:** Cannot verify resources/requests, assign responders, or promote users |
| **Disaster Coordinator** | `COORDINATOR` | Assigned **only** by an Administrator | • Access to Command Center at `/coordinator` and Crisis Map<br>• Human-in-the-loop verification/rejection of emergency incidents<br>• Human-in-the-loop verification/rejection of community resources<br>• AI-assisted matching and resource allocation<br>• Coordinator task management and operational notes |
| **System Administrator** | `ADMIN` | Privately bootstrapped via `.env` credentials and `npm run seed:admin` | • Full administrative console at `/admin/dashboard`<br>• Comprehensive emergency request and resource oversight<br>• Appoint and manage user roles (promote users to `COORDINATOR`)<br>• Activate or deactivate user accounts (deactivated accounts are blocked with 403 Forbidden)<br>• Self-demotion and self-deactivation protection<br>• Inspection of immutable security and triage audit logs |

### 2. Admin Bootstrapping

The initial Super Administrator account is never registered publicly. It is securely configured in `server/.env`:
```env
ADMIN_NAME="System Administrator"
ADMIN_EMAIL="admin@resqnet.org"
ADMIN_PASSWORD="AdminSecurePassword2026!"
```
To seed or re-synchronize the admin account:
```bash
cd server
npm run seed:admin
```
*(On server startup, if `ADMIN_EMAIL` is configured and not present in the database, the server automatically bootstraps the administrator account with full security verification).*

### 3. Automated Verification & Test Suite

ResQNet AI includes an automated 30-scenario test suite covering all authentication workflows, role boundaries, security barriers, and privilege escalation prevention:
```bash
cd server
node scripts/testAuthAndRBAC.js
```
**Test Coverage Summary:**
- **Category A (Anonymous Intake & PIN Tracking):** Tests 1–7
- **Category B (Provider Public Registration & Tamper Resistance):** Tests 8–11
- **Category C (Common Login Gateway & Credential Validation):** Tests 12–14
- **Category D (Resource Provider Boundaries & 403 Enforcements):** Tests 15–21
- **Category E (Coordinator Persona & Human-in-the-Loop RBAC):** Tests 22–25
- **Category F (Admin Privileges, Role Promotion & Deactivation):** Tests 26–30
- **Overall Result:** **30 / 30 PASSED (100%)**

---

## Community Groups & Community Safety Overview

ResQNet AI includes a dedicated **Community Groups** module designed for hyper-local resilience circles—such as apartment towers, housing societies, neighborhoods, university campuses, workplaces, and mutual aid groups.

### 1. Architectural Principles & Safety Guarantees

1. **Voluntary & Private:** Community safety check-ins are strictly voluntary and visible only to verified members of the private group.
2. **Non-Dispatch Guarantee:** Check-ins do not trigger governmental 911/112 emergency dispatchers. Clear disclaimers guide users in life-threatening danger to contact official authorities directly.
3. **Neutral Status Display:** Members who have not checked in are labeled neutrally as `Not Checked In`. They are never labeled as "Missing", "In Danger", or presumed casualties.
4. **Approximate Location Safeguards:** Approximate location is optional (e.g., "Block B, 3rd Floor") and only displayed to group members when `locationShared: true` is explicitly granted.

### 2. Group Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/groups` | Protected | Create new community group (creator becomes Admin) |
| `GET` | `/api/groups/my` | Protected | List user's joined community groups with roles & stats |
| `POST` | `/api/groups/join` | Protected | Join a group using a 6-character uppercase Invite Code |
| `GET` | `/api/groups/:groupId` | Protected | Fetch group details, membership role, and stats |
| `PATCH` | `/api/groups/:groupId` | Admin | Update group settings |
| `GET` | `/api/groups/:groupId/members` | Protected | Fetch group roster with voluntary check-in roll-call |
| `POST` | `/api/groups/:groupId/check-ins` | Protected | Submit or update voluntary safety check-in |
| `GET` | `/api/groups/:groupId/check-ins` | Protected | List all safety check-ins for the group |
| `GET` | `/api/groups/:groupId/announcements` | Protected | List priority group announcements |
| `POST` | `/api/groups/:groupId/announcements` | Admin/Mod | Post priority notice (`NORMAL`, `IMPORTANT`, `SAFETY_NOTICE`) |
| `DELETE` | `/api/groups/:groupId/announcements/:id` | Admin | Delete an announcement |
| `GET` | `/api/groups/:groupId/incidents` | Protected | Retrieve emergency incidents linked to this group |
| `GET` | `/api/groups/activity` | Optional Auth | Retrieve recent community activity feed for homepage |

### 3. Step-by-Step Community Groups Walkthrough

1. Open **[http://localhost:5174](http://localhost:5174)** and notice the **Community Safety Overview** and **Recent Community Activity** feed on the homepage.
2. Click **Community Groups** in the top navigation or click **My Groups**.
3. Click **Create Group** (`/groups/create`) and fill in:
   - Name: `Greenwood Heights - Tower B`
   - Category: `Apartment / Housing Complex`
   - Area: `Sector 62, Tower B & C`
4. Copy the auto-generated 6-character Invite Code (e.g. `GRE-A9B2`).
5. Use the **Demo Persona Switcher** in the navbar to switch to **Citizen (Alex Rivera)**.
6. Click **Join with Code** (`/groups/join`), paste the Invite Code, and join the group in one click!
7. Switch to the **Voluntary Safety Check-In** tab:
   - Select **I Am Safe** (or **I Need Assistance**)
   - Enter an optional note: *"Safe at home on 3rd floor. We have potable water."*
   - Enter approximate location and toggle "Share with members".
   - Submit check-in.
8. Switch to the **Members & Roll-Call** tab to observe the roll-call breakdown (Safe vs Needs Aid vs Emergency vs Not Checked In).
9. Post a **Safety Notice Announcement** as Admin or click **Report Incident for Group** to submit a group-linked emergency request.

