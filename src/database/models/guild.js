import mongoose from 'mongoose';
import { DEFAULT } from '../../config/constants.js';

const VALID_CHANNEL_TYPES = new Set(['free_games', 'deals', 'wishlist', 'logs']);

const guildSchema = new mongoose.Schema({
  _id:                String,
  free_games_channel: { type: String, default: null },
  deals_channel:      { type: String, default: null },
  wishlist_channel:   { type: String, default: null },
  logs_channel:       { type: String, default: null },
  deal_threshold:     { type: Number, default: DEFAULT.THRESHOLD },
  currency:           { type: String, enum: ['INR', 'USD'], default: DEFAULT.CURRENCY },
  enabled_stores: {
    type:    [String],
    default: ['steam', 'epic', 'gog', 'humble', 'fanatical', 'ubisoft', 'itch'],
  },
}, { timestamps: true });

const Guild = mongoose.model('Guild', guildSchema);

export async function getGuild(guildId) {
  return Guild.findById(guildId).lean();
}

export async function ensureGuild(guildId) {
  return Guild.findByIdAndUpdate(
    guildId,
    { $setOnInsert: { _id: guildId } },
    { upsert: true, new: true, lean: true }
  );
}

export async function setChannel(guildId, type, channelId) {
  if (!VALID_CHANNEL_TYPES.has(type)) throw new Error(`Invalid channel type: ${type}`);
  await ensureGuild(guildId);
  await Guild.findByIdAndUpdate(guildId, { [`${type}_channel`]: channelId });
}

export async function setThreshold(guildId, threshold) {
  await ensureGuild(guildId);
  await Guild.findByIdAndUpdate(guildId, { deal_threshold: threshold });
}

export async function setGuildCurrency(guildId, currency) {
  await ensureGuild(guildId);
  await Guild.findByIdAndUpdate(guildId, { currency });
}

export async function getAllGuilds() {
  return Guild.find().lean();
}

export async function getGuildThreshold(guildId) {
  const guild = await getGuild(guildId);
  return guild?.deal_threshold ?? DEFAULT.THRESHOLD;
}

export async function getGuildCurrency(guildId) {
  const guild = await getGuild(guildId);
  return guild?.currency ?? DEFAULT.CURRENCY;
}
