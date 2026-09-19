import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to configured MongoDB URI...');
      await mongoose.connect(uri);
      console.log('Connected to MongoDB successfully.');
      return;
    } catch (err) {
      console.warn('Configured MongoDB connection failed. Falling back to in-memory database:', err.message);
    }
  }

  try {
    console.log('Starting In-Memory MongoDB instance for zero-friction development execution...');
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'resqnet_ai',
      },
    });
    const memoryUri = mongod.getUri();
    await mongoose.connect(memoryUri);
    console.log(`Connected to In-Memory MongoDB at ${memoryUri}`);
  } catch (error) {
    console.error('Failed to initialize MongoDB connection:', error);
    process.exit(1);
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};
