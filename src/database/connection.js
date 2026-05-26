import mongoose from 'mongoose';
import 'dotenv/config';

export async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
}

export async function testConnection() {
  await connectDB();
}

export default mongoose;
