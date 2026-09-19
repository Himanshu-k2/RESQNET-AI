import { Incident } from '../models/Incident.js';
import { ResourceOffer } from '../models/ResourceOffer.js';
import { User } from '../models/User.js';

export const seedInitialData = async () => {
  try {
    const incidentCount = await Incident.countDocuments();
    if (incidentCount === 0) {
      console.log('Seeding initial realistic emergency incidents (Simulation Data)...');
      await Incident.insertMany([
        {
          incidentType: 'Flood',
          description: 'Hostel Block B basement level submerged in 4ft runoff water. Ground floor students trapped near east staircase without drinking water.',
          location: {
            address: 'Campus Hostel Block B, East Wing',
            landmark: 'Near Central Library Lawn',
            coordinates: { lat: 28.545, lng: 77.192 },
          },
          affectedPeople: '15-20',
          safetyStatus: 'Trapped',
          requiredResources: ['Drinking Water', 'Evacuation Boats', 'Food Rations'],
          contact: {
            name: 'Rohan Sharma (Hostel Warden)',
            phone: '+91 98765 43210',
            email: 'warden.b@campus.edu',
          },
          urgency: 'Critical',
          status: 'PENDING_VERIFICATION',
          verificationStatus: 'PENDING_VERIFICATION',
          timeline: [
            { eventType: 'REPORT_CREATED', description: 'Emergency report logged via citizen intake portal', timestamp: new Date(Date.now() - 3600000), performedBy: 'Citizen Dispatch', performedByRole: 'citizen' },
            { eventType: 'UNDER_REVIEW', description: 'Report queued for disaster coordinator assessment', timestamp: new Date(Date.now() - 3000000), performedBy: 'System', performedByRole: 'system' }
          ],
          isSimulation: true,
          notes: ['Initial distress message parsed from hostel group chat.'],
        },
        {
          incidentType: 'Fire',
          description: 'Transformer spark fire along boundary wall spreading to dry storage shed. Heavy smoke entering nearby dormitory building.',
          location: {
            address: 'Substation Sector 4, Northern Perimeter',
            landmark: 'Behind Science Complex',
            coordinates: { lat: 28.548, lng: 77.195 },
          },
          affectedPeople: '50+',
          safetyStatus: 'In Immediate Danger',
          requiredResources: ['Fire Extinguishers', 'Evacuation Transport', 'First Aid / Medical'],
          contact: {
            name: 'Campus Security Control',
            phone: '+91 98111 22334',
            email: 'security@campus.edu',
          },
          urgency: 'Critical',
          status: 'VERIFIED',
          verificationStatus: 'VERIFIED',
          verifiedByName: 'Cmdr. Sarah Jenkins',
          verifiedAt: new Date(Date.now() - 1800000),
          timeline: [
            { eventType: 'REPORT_CREATED', description: 'Emergency report logged', timestamp: new Date(Date.now() - 5400000), performedBy: 'Security Dispatch', performedByRole: 'citizen' },
            { eventType: 'INCIDENT_VERIFIED', description: 'Verified on-ground by Cmdr. Sarah Jenkins', timestamp: new Date(Date.now() - 1800000), performedBy: 'Cmdr. Sarah Jenkins', performedByRole: 'coordinator' }
          ],
          isSimulation: true,
          notes: ['Verified by Campus Security patrol at 14:15.'],
        },
        {
          incidentType: 'Medical Emergency',
          description: 'Two elderly staff members experiencing acute asthma attacks due to generator smoke. Inhalers and portable oxygen supply urgently needed.',
          location: {
            address: 'Staff Quarters Quonset 12',
            landmark: 'Near Health Center Annex',
            coordinates: { lat: 28.542, lng: 77.189 },
          },
          affectedPeople: '2',
          safetyStatus: 'Medical Attention Needed',
          requiredResources: ['First Aid / Medical', 'Ambulance Support'],
          contact: {
            name: 'Dr. Anita Roy',
            phone: '+91 98222 33445',
            email: 'anita.roy@hospital.org',
          },
          urgency: 'High',
          status: 'VERIFIED',
          verificationStatus: 'VERIFIED',
          verifiedByName: 'Cmdr. Sarah Jenkins',
          verifiedAt: new Date(Date.now() - 1800000),
          timeline: [
            { eventType: 'REPORT_CREATED', description: 'Emergency report logged', timestamp: new Date(Date.now() - 5400000), performedBy: 'Security Dispatch', performedByRole: 'citizen' },
            { eventType: 'INCIDENT_VERIFIED', description: 'Verified on-ground by Cmdr. Sarah Jenkins', timestamp: new Date(Date.now() - 1800000), performedBy: 'Cmdr. Sarah Jenkins', performedByRole: 'coordinator' }
          ],
          isSimulation: true,
          notes: ['Local dispensary flooded; dispatching mobile paramedic.'],
        },
        {
          incidentType: 'Building Collapse',
          description: 'Old cycle shed structure partially collapsed under tree fall. No known casualties but blocking emergency ambulance exit gate.',
          location: {
            address: 'Gate No. 3 Emergency Exit Road',
            landmark: 'Opposite Sports Pavilion',
            coordinates: { lat: 28.541, lng: 77.198 },
          },
          affectedPeople: '0 (Path Blocked)',
          safetyStatus: 'Safe',
          requiredResources: ['Rescue Equipment', 'Volunteers'],
          contact: {
            name: 'Gate Security Guard',
            phone: '+91 98444 55667',
            email: 'gate3@campus.edu',
          },
          urgency: 'Medium',
          status: 'PENDING_VERIFICATION',
          verificationStatus: 'PENDING_VERIFICATION',
          timeline: [
            { eventType: 'REPORT_CREATED', description: 'Emergency report logged via citizen intake portal', timestamp: new Date(Date.now() - 3600000), performedBy: 'Citizen Dispatch', performedByRole: 'citizen' },
            { eventType: 'UNDER_REVIEW', description: 'Report queued for disaster coordinator assessment', timestamp: new Date(Date.now() - 3000000), performedBy: 'System', performedByRole: 'system' }
          ],
          isSimulation: true,
          notes: ['Awaiting municipal tree clearance crew.'],
        },
      ]);
    }

    const resourceCount = await ResourceOffer.countDocuments();
    if (resourceCount === 0) {
      console.log('Seeding initial community resource offers (Simulation Data)...');
      await ResourceOffer.insertMany([
        {
          resourceType: 'Water',
          title: '150 Clean Drinking Water Cans (20L each)',
          description: 'Sealed RO drinking water containers stored on elevated platform, ready for distribution with transport truck.',
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
          isSimulation: true,
        },
        {
          resourceType: 'Food',
          title: '300 Fresh Vegetarian Meal Packets',
          description: 'Hygienically prepared khichdi & dry rations packed in foil boxes with energy bars and biscuits.',
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
          isSimulation: true,
        },
        {
          resourceType: 'Rescue equipment',
          title: '2 Inflatable Rafts & 25 Life Vests',
          description: 'Commercial grade rescue zodiacs with paddles and adult/child buoyancy vests for shallow flood navigation.',
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
          isSimulation: true,
        },
        {
          resourceType: 'Shelter',
          title: 'Dry Gymnasium Floor with 60 Cots & Generator',
          description: 'Indoor sports hall with 4 clean restrooms, backup generator power for mobile charging, and drinking water taps.',
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
          isSimulation: true,
        },
        {
          resourceType: 'Volunteers',
          title: '12 Trained Disaster Relief Volunteers',
          description: 'Civil defence trained volunteers equipped with gumboots, torches, ropes, and basic first-aid certifications.',
          quantity: '12 Volunteers',
          location: {
            address: 'Youth Volunteer Base Camp',
            landmark: 'Rotary Club Hall',
            coordinates: { lat: 28.544, lng: 77.191 },
          },
          availability: 'Available',
          verificationStatus: 'PENDING_VERIFICATION',
          contact: {
            name: 'Aman Patel',
            phone: '+91 98999 00112',
            email: 'aman@youthrelief.org',
          },
          isSimulation: true,
        },
      ]);
    }

    // Auto-bootstrap Admin account from environment variables if defined
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    if (adminEmail && adminPassword) {
      const normalizedEmail = adminEmail.trim().toLowerCase();
      const existingAdmin = await User.findOne({ email: normalizedEmail });
      if (!existingAdmin) {
        await User.create({
          name: adminName.trim(),
          email: normalizedEmail,
          password: adminPassword,
          role: 'ADMIN',
          organization: 'ResQNet Central Command',
          badgeVerified: true,
          isActive: true,
        });
        console.log(`🛡️ Bootstrapped ADMIN account (${normalizedEmail}) from environment credentials.`);
      }
    }
  } catch (err) {
    console.error('Error seeding initial data:', err.message);
  }
};
