import mongoose from 'mongoose';
import { LIMITS } from '../../config/constants.js';

const wishlistSchema = new mongoose.Schema({
  user_id:    { type: String, required: true, index: true },
  game_id:    { type: String, required: true, index: true },
  game_title: { type: String, required: true },
  store:      { type: String, default: null },
  store_url:  { type: String, default: null },
}, { timestamps: { createdAt: 'added_at', updatedAt: false } });

wishlistSchema.index({ user_id: 1, game_id: 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export async function addToWishlist(userId, gameId, gameTitle, store, storeUrl) {
  const count = await getWishlistCount(userId);
  if (count >= LIMITS.WISHLIST_MAX) {
    throw new Error(`Wishlist limit reached (${LIMITS.WISHLIST_MAX} games max).`);
  }
  await Wishlist.updateOne(
    { user_id: userId, game_id: gameId },
    { $setOnInsert: { user_id: userId, game_id: gameId, game_title: gameTitle, store: store || null, store_url: storeUrl || null } },
    { upsert: true }
  );
}

export async function removeFromWishlist(userId, gameId) {
  const result = await Wishlist.deleteOne({ user_id: userId, game_id: gameId });
  return result.deletedCount > 0;
}

export async function getUserWishlist(userId) {
  return Wishlist.find({ user_id: userId }).sort({ added_at: -1 }).lean();
}

export async function getWishlistCount(userId) {
  return Wishlist.countDocuments({ user_id: userId });
}

export async function isInWishlist(userId, gameId) {
  return !!(await Wishlist.exists({ user_id: userId, game_id: gameId }));
}

export async function getUsersByGameInWishlist(gameId) {
  const userIds = await Wishlist.distinct('user_id', { game_id: gameId });
  return userIds.map(user_id => ({ user_id }));
}
