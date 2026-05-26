import { getEpicFreeGames } from '../services/epic.js';
import { getFreeDeals } from '../services/cheapshark.js';
import { getSteamFreePromos } from '../services/steam.js';
import { resolveGameImage } from '../services/imageService.js';
import { getUSDtoINR } from '../services/exchangeRate.js';
import { buildFreeGameMessage } from '../embeds/freeGameEmbed.js';
import { sendCV2, editCV2 } from '../utils/cv2.js';
import { cache } from '../utils/cache.js';
import { getAllGuilds } from '../database/models/guild.js';
import { wasDealSent, recordDeal, incrementStat } from '../database/models/deals.js';
import { saveMessageMap, getMessageMap } from '../database/models/messages.js';
import { STORE_SLUG_BY_NAME } from '../config/constants.js';
import logger from '../utils/logger.js';

async function getGuilds() {
  const cached = cache.get('all_guilds');
  if (cached) return cached;
  const guilds = await getAllGuilds();
  cache.set('all_guilds', guilds, 5 * 60 * 1000);
  return guilds;
}

export async function checkFreeGames(client) {
  logger.cron('Free games check started');

  try {
    const [epicData, csDeals, steamPromos, exchangeRate] = await Promise.all([
      getEpicFreeGames(),
      getFreeDeals(),
      getSteamFreePromos(),
      getUSDtoINR(),
    ]);

    const freeGames = [...epicData.current, ...csDeals, ...steamPromos];
    const guilds    = await getGuilds();

    for (const game of freeGames) {
      const alreadySent = await wasDealSent(game.dealId);

      if (!alreadySent) {
        game.imageUrl = game.imageUrl || await resolveGameImage(game.steamAppId, null, game.title);

        await recordDeal(
          game.dealId, game.title, game.store,
          0, game.normalPrice || 0, 100, 'free', game.endDate || null
        );
      }

      const storeSlug = STORE_SLUG_BY_NAME[game.store];

      for (const guild of guilds) {
        if (!guild.free_games_channel) continue;

        if (storeSlug && guild.enabled_stores?.length > 0 && !guild.enabled_stores.includes(storeSlug)) {
          continue;
        }

        const currency = guild.currency || 'INR';
        const payload  = buildFreeGameMessage(game, currency, exchangeRate);
        const existing = await getMessageMap(game.dealId, guild._id);

        try {
          if (existing) {
            await editCV2(client, existing.channel_id, existing.message_id, payload);
          } else if (!alreadySent) {
            const sent = await sendCV2(client, guild.free_games_channel, payload);
            await saveMessageMap(game.dealId, guild._id, guild.free_games_channel, sent.id, 'free');
            await incrementStat('free_games_sent');
          }
        } catch (err) {
          logger.error(`Failed to post free game "${game.title}" to guild ${guild._id}`, err.message);
        }
      }
    }

    logger.cron(`Free games check complete — ${freeGames.length} games processed`);
  } catch (err) {
    logger.error('Free games cron failed', err);
  }
}