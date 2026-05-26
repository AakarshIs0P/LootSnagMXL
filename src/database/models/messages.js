import mongoose from 'mongoose';

const messageMapSchema = new mongoose.Schema({
  deal_id:    { type: String, required: true, index: true },
  guild_id:   { type: String, required: true },
  channel_id: String,
  message_id: String,
  deal_type:  { type: String, enum: ['free', 'deal'] },
  created_at: { type: Date, default: Date.now },
});

messageMapSchema.index({ deal_id: 1, guild_id: 1 }, { unique: true });

const MessageMap = mongoose.model('MessageMap', messageMapSchema);

const wishlistAlertSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  game_id: String,
  deal_id: { type: String, required: true },
  sent_at: { type: Date, default: Date.now },
});

wishlistAlertSchema.index({ user_id: 1, deal_id: 1 }, { unique: true });

const WishlistAlert = mongoose.model('WishlistAlert', wishlistAlertSchema);

export async function saveMessageMap(dealId, guildId, channelId, messageId, type) {
  await MessageMap.findOneAndUpdate(
    { deal_id: dealId, guild_id: guildId },
    { channel_id: channelId, message_id: messageId, deal_type: type },
    { upsert: true }
  );
}

export async function getMessageMap(dealId, guildId) {
  return MessageMap.findOne({ deal_id: dealId, guild_id: guildId }).lean();
}

export async function getMessagesByDeal(dealId) {
  return MessageMap.find({ deal_id: dealId }).lean();
}

export async function deleteMessageMap(dealId, guildId) {
  await MessageMap.deleteOne({ deal_id: dealId, guild_id: guildId });
}

export async function deleteMessageMapsByDealIds(dealIds) {
  if (!dealIds.length) return;
  await MessageMap.deleteMany({ deal_id: { $in: dealIds } });
}

export async function wasWishlistAlertSent(userId, dealId) {
  return !!(await WishlistAlert.exists({ user_id: userId, deal_id: dealId }));
}

export async function recordWishlistAlert(userId, gameId, dealId) {
  await WishlistAlert.updateOne(
    { user_id: userId, deal_id: dealId },
    { $setOnInsert: { user_id: userId, game_id: gameId, deal_id: dealId } },
    { upsert: true }
  );
}

export async function deleteOldWishlistAlerts(olderThan) {
  await WishlistAlert.deleteMany({ sent_at: { $lt: olderThan } });
}
