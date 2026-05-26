import { getExpiredDealIds, cleanupExpired } from '../database/models/deals.js';
import { deleteMessageMapsByDealIds, deleteOldWishlistAlerts } from '../database/models/messages.js';
import { cache } from '../utils/cache.js';
import logger from '../utils/logger.js';

export async function cleanupStaleData() {
  logger.cron('Cleanup started');

  try {
    const expiredIds = await getExpiredDealIds();

    if (expiredIds.length > 0) {
      await deleteMessageMapsByDealIds(expiredIds);
    }

    await cleanupExpired();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await deleteOldWishlistAlerts(thirtyDaysAgo);

    cache.cleanup();

    logger.cron('Cleanup complete');
  } catch (err) {
    logger.error('Cleanup cron failed', err);
  }
}
