import mongoose from 'mongoose';
import { DEFAULT } from '../../config/constants.js';

const userSchema = new mongoose.Schema({
  _id:             String,
  currency:        { type: String, enum: ['INR', 'USD'], default: DEFAULT.CURRENCY },
  alert_method:    { type: String, enum: ['dm', 'channel', 'both'], default: 'channel' },
  preferred_stores: {
    type:    [String],
    default: ['steam', 'epic', 'gog', 'humble', 'fanatical'],
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export async function getUser(userId) {
  return User.findById(userId).lean();
}

export async function ensureUser(userId) {
  return User.findByIdAndUpdate(
    userId,
    { $setOnInsert: { _id: userId } },
    { upsert: true, new: true, lean: true }
  );
}

export async function setUserCurrency(userId, currency) {
  await ensureUser(userId);
  await User.findByIdAndUpdate(userId, { currency });
}

export async function setAlertMethod(userId, method) {
  await ensureUser(userId);
  await User.findByIdAndUpdate(userId, { alert_method: method });
}

export async function getUserCurrency(userId) {
  const user = await getUser(userId);
  return user?.currency ?? DEFAULT.CURRENCY;
}

export async function getUserAlertMethod(userId) {
  const user = await getUser(userId);
  return user?.alert_method ?? 'channel';
}
