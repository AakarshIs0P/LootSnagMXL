import mongoose from 'mongoose';

const sentDealSchema = new mongoose.Schema({
  deal_id:      { type: String, required: true, unique: true, index: true },
  game_title:   String,
  store:        String,
  sale_price:   { type: Number, default: 0 },
  normal_price: { type: Number, default: 0 },
  discount:     { type: Number, default: 0 },
  deal_type:    { type: String, enum: ['free', 'deal'] },
  expires_at:   { type: Date, default: null },
  sent_at:      { type: Date, default: Date.now },
});

sentDealSchema.index({ sent_at: 1 });
sentDealSchema.index({ deal_type: 1 });
sentDealSchema.index({ expires_at: 1 });

const SentDeal = mongoose.model('SentDeal', sentDealSchema);

const botStatSchema = new mongoose.Schema({
  _id:        String,
  stat_value: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now },
});

const BotStat = mongoose.model('BotStat', botStatSchema);

const exchangeRateSchema = new mongoose.Schema({
  base_currency:   { type: String, required: true },
  target_currency: { type: String, required: true },
  rate:            { type: Number, required: true },
  updated_at:      { type: Date, default: Date.now },
});

exchangeRateSchema.index({ base_currency: 1, target_currency: 1 }, { unique: true });

const ExchangeRate = mongoose.model('ExchangeRate', exchangeRateSchema);

export async function wasDealSent(dealId) {
  return !!(await SentDeal.exists({ deal_id: dealId }));
}

export async function recordDeal(dealId, title, store, salePrice, normalPrice, discount, type, expiresAt) {
  await SentDeal.updateOne(
    { deal_id: dealId },
    {
      $setOnInsert: {
        deal_id:      dealId,
        game_title:   title,
        store,
        sale_price:   salePrice,
        normal_price: normalPrice,
        discount,
        deal_type:    type,
        expires_at:   expiresAt || null,
      },
    },
    { upsert: true }
  );
}

export async function getExpiredDealIds() {
  return SentDeal.distinct('deal_id', {
    expires_at: { $ne: null, $lt: new Date() },
  });
}

export async function cleanupExpired() {
  await SentDeal.deleteMany({ expires_at: { $ne: null, $lt: new Date() } });
}

export async function incrementStat(key) {
  await BotStat.findByIdAndUpdate(
    key,
    { $inc: { stat_value: 1 }, $set: { updated_at: new Date() } },
    { upsert: true }
  );
}

export async function getStats() {
  const stats = await BotStat.find().lean();
  return stats.map(s => ({ stat_key: s._id, stat_value: s.stat_value }));
}

export async function initStats() {
  const keys = [
    'free_games_sent',
    'deals_sent',
    'wishlist_alerts_sent',
    'searches_performed',
    'commands_used',
  ];
  for (const key of keys) {
    await BotStat.updateOne(
      { _id: key },
      { $setOnInsert: { _id: key, stat_value: 0 } },
      { upsert: true }
    );
  }
}

export async function getStoredExchangeRate(base, target) {
  const row = await ExchangeRate.findOne({ base_currency: base, target_currency: target }).lean();
  return row ? row.rate : null;
}

export async function saveExchangeRate(base, target, rate) {
  await ExchangeRate.findOneAndUpdate(
    { base_currency: base, target_currency: target },
    { rate, updated_at: new Date() },
    { upsert: true }
  );
}
