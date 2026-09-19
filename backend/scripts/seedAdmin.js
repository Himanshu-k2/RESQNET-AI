import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB, closeDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
  try {
    const adminName = process.env.ADMIN_NAME || 'Super Administrator';
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env before running seed:admin.');
      console.log('Example .env entry:');
      console.log('ADMIN_NAME="Super Administrator"');
      console.log('ADMIN_EMAIL="admin@resqnet.org"');
      console.log('ADMIN_PASSWORD="superAdminPassword123"');
      process.exit(1);
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(adminEmail.trim())) {
      console.error('❌ Error: ADMIN_EMAIL is not a valid email address.');
      process.exit(1);
    }

    if (adminPassword.length < 6) {
      console.error('❌ Error: ADMIN_PASSWORD must be at least 6 characters long.');
      process.exit(1);
    }

    await connectDB();

    const normalizedEmail = adminEmail.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      existing.role = 'ADMIN';
      existing.isActive = true;
      existing.badgeVerified = true;
      existing.name = adminName.trim();
      existing.password = adminPassword; // Triggers pre-save hash hook
      await existing.save();
      console.log(`✅ Existing account (${normalizedEmail}) upgraded and confirmed as ADMIN.`);
    } else {
      const admin = await User.create({
        name: adminName.trim(),
        email: normalizedEmail,
        password: adminPassword,
        role: 'ADMIN',
        organization: 'ResQNet Central Command',
        badgeVerified: true,
        isActive: true,
      });
      console.log(`✅ New ADMIN account created successfully for ${admin.email} (ID: ${admin._id}).`);
    }

    await closeDB();
    console.log('🎉 Admin seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
    process.exit(1);
  }
};

seedAdmin();
