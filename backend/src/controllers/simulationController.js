import { Incident } from '../models/Incident.js';
import { ResourceOffer } from '../models/ResourceOffer.js';
import { CoordinatorTask } from '../models/CoordinatorTask.js';
import { AuditLog } from '../models/AuditLog.js';
import { seedInitialData } from '../config/seedData.js';

// Predefined Disaster Simulation Scenarios
export const SIMULATION_SCENARIOS = {
  FLOOD: {
    id: 'FLOOD',
    name: 'Campus Flash Flood Emergency',
    category: 'Flood',
    urgency: 'Critical',
    description: 'Hostel Block B basement submerged in 4ft runoff water. 18 students trapped near east staircase without drinking water or power.',
    address: 'Campus Hostel Block B, East Wing',
    landmark: 'Near Central Library Lawn',
    coordinates: { lat: 28.545, lng: 77.192 },
    affectedPeople: '18 students',
    safetyStatus: 'Trapped',
    requiredResources: ['Drinking Water', 'Evacuation Boats', 'Food Rations', 'Volunteers'],
    resources: [
      {
        resourceType: 'Water',
        title: '150 Clean Drinking Water Cans (20L each)',
        description: 'Certified sealed drinking water cans on elevated pallet ready for immediate truck transport.',
        quantity: '150 Cans (3000 Liters)',
        location: {
          address: 'Community Center Warehouse, Main Gate',
          landmark: 'Inside Seva Bhavan',
          coordinates: { lat: 28.551, lng: 77.199 },
        },
        availability: 'Available',
        verificationStatus: 'VERIFIED',
        contact: {
          name: 'Priya Verma (Seva Foundation)',
          phone: '+91 98555 66778',
          email: 'contact@sevafoundation.org',
        },
      },
      {
        resourceType: 'Rescue equipment',
        title: '2 Inflatable Rafts & 25 Life Vests',
        description: 'Heavy duty zodiac rafts with oars and buoyancy jackets suitable for campus flood water navigation.',
        quantity: '2 Rafts + 25 Vests',
        location: {
          address: 'Aquatics Club Boat Depot',
          landmark: 'Near Riverfront Pier',
          coordinates: { lat: 28.553, lng: 77.203 },
        },
        availability: 'Available',
        verificationStatus: 'VERIFIED',
        contact: {
          name: 'Capt. Vikram Mehra',
          phone: '+91 98777 88990',
          email: 'boats@adventureclub.in',
        },
      },
      {
        resourceType: 'Food',
        title: '300 Fresh Vegetarian Meal Packets',
        description: 'Hygienically packaged khichdi and dry ration boxes with energy bars and biscuits.',
        quantity: '300 Packets',
        location: {
          address: 'Gurdwara Langar Kitchen, Ring Road',
          landmark: 'Opposite Metro Pillar 42',
          coordinates: { lat: 28.539, lng: 77.185 },
        },
        availability: 'Available',
        verificationStatus: 'VERIFIED',
        contact: {
          name: 'Harpreet Singh',
          phone: '+91 98666 77889',
          email: 'langar@seva.org',
        },
      },
      {
        resourceType: 'Volunteers',
        title: '12 Trained Disaster Relief Volunteers',
        description: 'Civil defence trained student volunteers equipped with gumboots, ropes, and flood safety gear.',
        quantity: '12 Volunteers',
        location: {
          address: 'Youth Volunteer Base Camp',
          landmark: 'Rotary Club Hall',
          coordinates: { lat: 28.544, lng: 77.191 },
        },
        availability: 'Available',
        verificationStatus: 'VERIFIED',
        contact: {
          name: 'Aman Patel',
          phone: '+91 98999 00112',
          email: 'aman@youthrelief.org',
        },
      },
    ],
  },
  FIRE: {
    id: 'FIRE',
    name: 'Industrial / Perimeter Substation Blaze',
    category: 'Fire',
    urgency: 'Critical',
    description: 'Transformer spark fire along boundary wall spreading to dry storage shed. Heavy noxious smoke entering nearby dormitory building.',
    address: 'Substation Sector 4, Northern Perimeter',
    landmark: 'Behind Science Complex',
    coordinates: { lat: 28.548, lng: 77.195 },
    affectedPeople: '50+ staff & students',
    safetyStatus: 'In Immediate Danger',
    requiredResources: ['Fire Extinguishers', 'Evacuation Transport', 'First Aid / Medical', 'Shelter'],
    resources: [
      {
        resourceType: 'Rescue equipment',
        title: '20 Commercial CO2 & Foam Fire Extinguishers',
        description: 'Heavy duty ABC dry powder and CO2 cylinders inspected and certified for electrical/chemical fire control.',
        quantity: '20 Cylinders',
        location: {
          address: 'Central Facilities Depot, Gate 2',
          landmark: 'Opposite Maintenance Office',
          coordinates: { lat: 28.549, lng: 77.194 },
        },
        availability: 'Available',
        verificationStatus: 'VERIFIED',
        contact: {
          name: 'Chief Engineer R. K. Saxena',
          phone: '+91 98111 22334',
          email: 'facilities@campus.edu',
        },
      },
      {
        resourceType: 'Shelter',
        title: 'Dry Gymnasium Floor with 60 Cots & Generator',
        description: 'Indoor sports hall with 4 clean restrooms, backup generator power, and high ventilation.',
        quantity: 'Capacity for 60 Persons',
        location: {
          address: 'Community School Gymnasium Hall',
          landmark: 'Sector 5 Main Road',
          coordinates: { lat: 28.535, lng: 77.193 },
        },
        availability: 'Available',
        verificationStatus: 'VERIFIED',
        contact: {
          name: 'Principal R.K. Nair',
          phone: '+91 98888 99001',
          email: 'admin@schooltrust.edu',
        },
      },
      {
        resourceType: 'Medical',
        title: '15 Emergency Burn Care & Inhalation Trauma Kits',
        description: 'Sterile burn dressings, saline irrigation packs, and oxygen inhalation masks with portable canisters.',
        quantity: '15 Kits',
        location: {
          address: 'Red Cross Emergency Reserve',
          landmark: 'Medical Wing Room 102',
          coordinates: { lat: 28.542, lng: 77.189 },
        },
        availability: 'Available',
        verificationStatus: 'VERIFIED',
        contact: {
          name: 'Sister Mary Joseph',
          phone: '+91 98222 33445',
          email: 'medical@redcross.org',
        },
      },
    ],
  },
  MEDICAL: {
    id: 'MEDICAL',
    name: 'Staff Quarters Respiratory Crisis',
    category: 'Medical Emergency',
    urgency: 'Critical',
    description: 'Elderly staff members experiencing acute asthma attacks due to generator smoke. Inhalers and portable oxygen supply urgently needed.',
    address: 'Staff Quarters Quonset 12',
    landmark: 'Near Health Center Annex',
    coordinates: { lat: 28.542, lng: 77.189 },
    affectedPeople: '4 elderly residents',
    safetyStatus: 'Medical Attention Needed',
    requiredResources: ['First Aid / Medical', 'Ambulance Support', 'Volunteers'],
    resources: [
      {
        resourceType: 'Medical',
        title: 'Portable Oxygen Concentrators & Inhalers (6 Units)',
        description: 'Battery powered 5L/min oxygen concentrators with pediatric/adult masks and bronchodilator inhalers.',
        quantity: '6 Units + 20 Inhalers',
        location: {
          address: 'Campus Health Clinic Depot',
          landmark: 'Building 4 Ground Floor',
          coordinates: { lat: 28.543, lng: 77.190 },
        },
        availability: 'Available',
        verificationStatus: 'VERIFIED',
        contact: {
          name: 'Dr. Anita Roy',
          phone: '+91 98222 33445',
          email: 'anita.roy@hospital.org',
        },
      },
      {
        resourceType: 'Rescue equipment',
        title: 'Patient Transport Emergency Van with Stretcher',
        description: 'Dedicated air-conditioned patient transport vehicle with oxygen rack and folding stretcher.',
        quantity: '1 Ambulance Van',
        location: {
          address: 'Campus Transport Yard',
          landmark: 'Gate 1 Ambulance Bay',
          coordinates: { lat: 28.546, lng: 77.188 },
        },
        availability: 'Available',
        verificationStatus: 'VERIFIED',
        contact: {
          name: 'Transport Officer Dev Singh',
          phone: '+91 98333 44556',
          email: 'transport@campus.edu',
        },
      },
    ],
  },
  FOOD_WATER: {
    id: 'FOOD_WATER',
    name: 'Displaced Relief Camp Resource Shortage',
    category: 'Flood',
    urgency: 'High',
    description: 'Relief camp shelter facing acute drinking water and ration shortage for 85 relocated evacuees following infrastructure disruption.',
    address: 'Community Center Annex Shelter',
    landmark: 'Near Football Grounds',
    coordinates: { lat: 28.535, lng: 77.193 },
    affectedPeople: '85 evacuees',
    safetyStatus: 'Safe',
    requiredResources: ['Drinking Water', 'Food Rations', 'Volunteers'],
    resources: [
      {
        resourceType: 'Water',
        title: '200 Sealed Water Cans (20L) & Water Purification Tablets',
        description: 'RO mineral water cans and 1000 chlorine effervescent purification tablets for safe water drinking.',
        quantity: '200 Cans (4000 Liters)',
        location: {
          address: 'Seva Bhavan Warehouse',
          landmark: 'Sector 3 Main Market',
          coordinates: { lat: 28.551, lng: 77.199 },
        },
        availability: 'Available',
        verificationStatus: 'VERIFIED',
        contact: {
          name: 'Harish Chandra',
          phone: '+91 98555 66778',
          email: 'water@sevafoundation.org',
        },
      },
      {
        resourceType: 'Food',
        title: '500 Cooked Meal Packets & High-Protein Ration Kits',
        description: 'Hot meal boxes (lentils, rice, vegetables) prepared daily plus biscuit boxes and milk powder.',
        quantity: '500 Meals',
        location: {
          address: 'Community Langar Hall',
          landmark: 'Ring Road Chowk',
          coordinates: { lat: 28.539, lng: 77.185 },
        },
        availability: 'Available',
        verificationStatus: 'VERIFIED',
        contact: {
          name: 'Harpreet Singh',
          phone: '+91 98666 77889',
          email: 'langar@seva.org',
        },
      },
    ],
  },
  EARTHQUAKE: {
    id: 'EARTHQUAKE',
    name: 'Seismic Structural Collapse & Debris Trauma',
    category: 'Earthquake',
    urgency: 'Critical',
    description: 'Moderate tremors causing partial masonry collapse in older residential block. Occupants trapped with debris blockage.',
    address: 'Old Town Heritage Block C',
    landmark: 'Behind Clock Tower',
    coordinates: { lat: 28.538, lng: 77.198 },
    affectedPeople: '30 trapped residents',
    safetyStatus: 'Trapped',
    requiredResources: ['Shelter', 'Rescue equipment', 'Drinking Water', 'Medical supplies'],
    resources: [
      {
        resourceType: 'Shelter',
        title: 'High-Capacity Disaster Tents & 40 Field Cots',
        description: 'All-weather waterproof canvas emergency tents with steel frame supports and 40 foldable camping cots.',
        quantity: '10 Tents (40 Cots)',
        location: {
          address: 'District Scout Grounds',
          landmark: 'Opposite Railway Bridge',
          coordinates: { lat: 28.536, lng: 77.201 },
        },
        availability: 'Available',
        verificationStatus: 'VERIFIED',
        contact: {
          name: 'Col. Sanjeev Bakshi',
          phone: '+91 98111 55667',
          email: 'disaster.camps@redcross.org',
        },
      },
      {
        resourceType: 'Rescue equipment',
        title: 'Hydraulic Cutters & Heavy Debris Rescue Gear',
        description: 'Pneumatic shoring jacks, hydraulic spreaders, and heavy-duty concrete cutting equipment.',
        quantity: '4 Gear Sets',
        location: {
          address: 'Municipal Fire Equipment Yard',
          landmark: 'Sector 2 Fire Station',
          coordinates: { lat: 28.541, lng: 77.195 },
        },
        availability: 'Available',
        verificationStatus: 'VERIFIED',
        contact: {
          name: 'Station Officer M. K. Pandey',
          phone: '+91 98444 33221',
          email: 'firedept@municipal.gov',
        },
      },
    ],
  },
  EXTREME_WEATHER: {
    id: 'EXTREME_WEATHER',
    name: 'Severe Heatwave & Grid Blackout Response',
    category: 'Extreme Weather',
    urgency: 'High',
    description: 'Prolonged 45°C heatwave coupled with transformer tripping. Vulnerable elderly and infants experiencing heat exhaustion.',
    address: 'Sector 8 Transit Housing Colony',
    landmark: 'Adjacent to Water Reservoir',
    coordinates: { lat: 28.549, lng: 77.182 },
    affectedPeople: '120 vulnerable residents',
    safetyStatus: 'Medical Attention Needed',
    requiredResources: ['Shelter', 'Drinking Water', 'Medical supplies', 'Volunteers'],
    resources: [
      {
        resourceType: 'Shelter',
        title: 'Air-Cooled Community Cooling Station with Backup Generator',
        description: 'Large community pavilion with 3 high-capacity misting fans, water dispensers, and 50kVA standby diesel generator.',
        quantity: 'Cooling Hub (100 Capacity)',
        location: {
          address: 'Sector 8 Community Center',
          landmark: 'Near Colony Gate 1',
          coordinates: { lat: 28.550, lng: 77.184 },
        },
        availability: 'Available',
        verificationStatus: 'VERIFIED',
        contact: {
          name: 'Anita Sharma (Colony Welfare Assn)',
          phone: '+91 98777 11223',
          email: 'cwa.sector8@welfare.org',
        },
      },
    ],
  },
};

// @desc    Start a predefined disaster simulation scenario
// @route   POST /api/simulation/start
// @access  Protected (Coordinator/Admin)
export const startScenario = async (req, res, next) => {
  try {
    const { scenario: scenarioKey = 'FLOOD' } = req.body;
    const scenario = SIMULATION_SCENARIOS[scenarioKey.toUpperCase()] || SIMULATION_SCENARIOS.FLOOD;

    // Remove any previous instances of this specific scenario to remain idempotent
    await Incident.deleteMany({ isSimulation: true, simulationScenario: scenario.id });
    await ResourceOffer.deleteMany({ isSimulation: true, simulationScenario: scenario.id });

    // Create the primary simulated incident
    const simulatedIncident = await Incident.create({
      incidentType: scenario.category,
      description: `[SIMULATED SCENARIO: ${scenario.name}] ${scenario.description}`,
      location: {
        address: scenario.address,
        landmark: scenario.landmark,
        coordinates: scenario.coordinates,
      },
      affectedPeople: scenario.affectedPeople,
      safetyStatus: scenario.safetyStatus,
      requiredResources: scenario.requiredResources,
      urgency: scenario.urgency,
      status: 'PENDING_VERIFICATION',
      verificationStatus: 'PENDING_VERIFICATION',
      isSimulation: true,
      simulationScenario: scenario.id,
      contact: {
        name: 'Demo Reporter (Simulation Mode)',
        phone: '+91 99999 00000',
        email: 'simulation@resqnet.local',
      },
      notes: [
        `Scenario launched by ${req.user?.name || 'Coordinator'} at ${new Date().toLocaleTimeString()}`,
        'DATA INTEGRITY: This incident is marked with isSimulation: true for safe demonstration testing.',
      ],
      timeline: [
        {
          eventType: 'REPORT_CREATED',
          description: `Simulated crisis scenario initiated: ${scenario.name}`,
          timestamp: new Date(),
          performedBy: req.user?.name || 'Demo Controller',
          performedByRole: 'simulation',
        },
        {
          eventType: 'UNDER_REVIEW',
          description: 'Simulated report queued for coordinator assessment',
          timestamp: new Date(),
          performedBy: 'Simulation Engine',
          performedByRole: 'system',
        },
      ],
    });

    // Create complementary simulated resources
    const createdResources = [];
    for (const resDef of scenario.resources) {
      const resDoc = await ResourceOffer.create({
        ...resDef,
        description: `[SIMULATED RESOURCE] ${resDef.description}`,
        isSimulation: true,
        simulationScenario: scenario.id,
        providedBy: req.user?._id || null,
        notes: ['Synthetic demonstration supply inventory. Non-dispatchable in real world.'],
      });
      createdResources.push(resDoc);
    }

    // Record audit log
    if (req.user?._id) {
      await AuditLog.create({
        action: 'SIMULATION_SCENARIO_STARTED',
        user: req.user._id,
        userName: req.user.name || 'Authorized Coordinator',
        userRole: req.user.role || 'coordinator',
        targetType: 'Simulation',
        targetId: simulatedIncident._id,
        isSimulation: true,
        details: {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          incidentId: simulatedIncident._id,
          resourceCount: createdResources.length,
        },
        reason: `Presenter launched ${scenario.name} demonstration scenario`,
      });
    }

    res.status(201).json({
      success: true,
      message: `Simulation scenario "${scenario.name}" started successfully.`,
      scenario: {
        id: scenario.id,
        name: scenario.name,
        category: scenario.category,
      },
      incident: simulatedIncident,
      resources: createdResources,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Safely reset/purge simulation data and restore demo baseline
// @route   POST /api/simulation/reset
// @access  Protected (Coordinator/Admin)
export const resetSimulation = async (req, res, next) => {
  try {
    // CRITICAL SAFETY CHECK: Strictly delete documents where isSimulation === true
    const [deletedIncidents, deletedResources, deletedTasks] = await Promise.all([
      Incident.deleteMany({ isSimulation: true }),
      ResourceOffer.deleteMany({ isSimulation: true }),
      CoordinatorTask.deleteMany({ isSimulation: true }),
    ]);

    // Re-seed baseline demo data so the dashboard is immediately ready for viewing
    await seedInitialData();

    // Log the reset action
    if (req.user?._id) {
      await AuditLog.create({
        action: 'SIMULATION_RESET',
        user: req.user._id,
        userName: req.user.name || 'Authorized Coordinator',
        userRole: req.user.role || 'coordinator',
        targetType: 'Simulation',
        targetId: req.user._id,
        isSimulation: true,
        details: {
          deletedIncidents: deletedIncidents.deletedCount,
          deletedResources: deletedResources.deletedCount,
          deletedTasks: deletedTasks.deletedCount,
        },
        reason: 'Coordinator triggered simulation data purge and demo baseline reset',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Simulation data cleared safely. Real emergency records were untouched. Baseline demo records re-seeded.',
      cleared: {
        incidents: deletedIncidents.deletedCount,
        resources: deletedResources.deletedCount,
        tasks: deletedTasks.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get simulation telemetry and active scenarios
// @route   GET /api/simulation/status
// @access  Public / Optional Auth
export const getSimulationStatus = async (req, res, next) => {
  try {
    const [
      simulatedIncidentsCount,
      realIncidentsCount,
      simulatedResourcesCount,
      realResourcesCount,
      activeScenarios,
    ] = await Promise.all([
      Incident.countDocuments({ isSimulation: true }),
      Incident.countDocuments({ isSimulation: { $ne: true } }),
      ResourceOffer.countDocuments({ isSimulation: true }),
      ResourceOffer.countDocuments({ isSimulation: { $ne: true } }),
      Incident.distinct('simulationScenario', { isSimulation: true, simulationScenario: { $ne: null } }),
    ]);

    res.status(200).json({
      success: true,
      simulationMode: simulatedIncidentsCount > 0,
      activeScenarios,
      availableScenarios: Object.values(SIMULATION_SCENARIOS).map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        urgency: s.urgency,
        description: s.description,
        address: s.address,
        affectedPeople: s.affectedPeople,
        safetyStatus: s.safetyStatus,
        requiredResources: s.requiredResources,
        resourceCount: s.resources.length,
      })),
      counts: {
        simulatedIncidents: simulatedIncidentsCount,
        realIncidents: realIncidentsCount,
        simulatedResources: simulatedResourcesCount,
        realResources: realResourcesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Advance a simulated incident along the demo coordination pipeline
// @route   POST /api/simulation/advance-step
// @access  Protected (Coordinator/Admin)
export const advanceDemoStep = async (req, res, next) => {
  try {
    const { incidentId, step } = req.body;

    if (!incidentId) {
      return res.status(400).json({ success: false, message: 'Please provide incidentId' });
    }

    const incident = await Incident.findById(incidentId);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    if (!incident.isSimulation) {
      return res.status(400).json({
        success: false,
        message: 'Safety rule: advanceDemoStep can only be used on simulated incidents (isSimulation: true).',
      });
    }

    let updatedEvent = null;

    switch (step) {
      case 'VERIFY':
        incident.verificationStatus = 'VERIFIED';
        incident.status = 'VERIFIED';
        incident.verifiedBy = req.user?._id || null;
        incident.verifiedByName = req.user?.name || 'Cmdr. Sarah Jenkins';
        incident.verifiedAt = new Date();
        updatedEvent = {
          eventType: 'INCIDENT_VERIFIED',
          description: 'Simulated incident verified by coordinator during walkthrough',
          timestamp: new Date(),
          performedBy: req.user?.name || 'Cmdr. Sarah Jenkins',
          performedByRole: 'coordinator',
        };
        incident.timeline.push(updatedEvent);
        break;

      case 'ASSIGN_LEAD':
        incident.assignedCoordinator = req.user?._id || null;
        incident.status = 'ASSIGNED';
        updatedEvent = {
          eventType: 'COORDINATOR_ASSIGNED',
          description: `Simulated case assigned to ${req.user?.name || 'Lead Coordinator'}`,
          timestamp: new Date(),
          performedBy: req.user?.name || 'Coordinator',
          performedByRole: 'coordinator',
        };
        incident.timeline.push(updatedEvent);
        break;

      case 'RESOLVE':
        incident.status = 'RESOLVED';
        updatedEvent = {
          eventType: 'STATUS_UPDATED',
          description: 'Simulated exercise concluded and marked resolved',
          timestamp: new Date(),
          performedBy: req.user?.name || 'Coordinator',
          performedByRole: 'coordinator',
        };
        incident.timeline.push(updatedEvent);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Unknown step: "${step}". Valid steps are VERIFY, ASSIGN_LEAD, RESOLVE.`,
        });
    }

    await incident.save();

    if (req.user?._id) {
      await AuditLog.create({
        action: 'SIMULATION_STEP_ADVANCED',
        user: req.user._id,
        userName: req.user.name || 'Coordinator',
        userRole: req.user.role || 'coordinator',
        targetType: 'Incident',
        targetId: incident._id,
        isSimulation: true,
        details: { step, newStatus: incident.status },
        reason: `Automated demo advancement step: ${step}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Simulated incident advanced: ${step}`,
      incident,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed specifications for a single critical scenario (Required vs Available vs Gaps)
// @route   GET /api/simulation/scenarios/:id
// @access  Protected (Admin, Resource Provider, Coordinator)
export const getScenarioDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scenario = SIMULATION_SCENARIOS[id?.toUpperCase()];

    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: `Scenario '${id}' not found in preparedness catalog.`,
      });
    }

    // Retrieve active simulated resources for this scenario if started
    const activeResources = await ResourceOffer.find({
      isSimulation: true,
      simulationScenario: scenario.id,
    });

    // Compute simulated availability breakdown & gap analysis
    const resourceAnalysis = scenario.requiredResources.map((reqRes) => {
      const matchingRes = activeResources.filter(
        (r) => r.resourceType.toLowerCase().includes(reqRes.toLowerCase()) ||
               r.title.toLowerCase().includes(reqRes.toLowerCase()) ||
               reqRes.toLowerCase().includes(r.resourceType.toLowerCase())
      );

      return {
        resourceType: reqRes,
        status: matchingRes.length > 0 ? 'PARTIALLY_STAGED' : 'CRITICAL_SHORTAGE',
        availableOffers: matchingRes.map((m) => ({
          id: m._id,
          title: m.title,
          quantity: m.quantity,
          location: m.location?.address,
          availability: m.availability,
        })),
      };
    });

    res.status(200).json({
      success: true,
      scenario: {
        ...scenario,
        resourceAnalysis,
        activeResourcesCount: activeResources.length,
        disclaimer: 'SIMULATION DATA ONLY: These scenarios and values are synthetic and do not reflect real-world emergencies or live dispatch operations.',
      },
    });
  } catch (error) {
    next(error);
  }
};
