import axios from 'axios';
import { cache } from '../utils/cache.js';
import { steamLimiter, withRetry } from '../utils/rateLimiter.js';
import { LIMITS, CACHE_TTL } from '../config/constants.js';
import logger from '../utils/logger.js';

const STEAM_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

export async function getSteamAppDetails(appId) {
  try {
    const data = await steamLimiter.add(() =>
      withRetry(async () => {
        const res = await axios.get('https://store.steampowered.com/api/appdetails', {
          params:  { appids: appId, filters: 'price_overview,basic' },
          headers: STEAM_HEADERS,
          timeout: LIMITS.REQUEST_TIMEOUT,
        });
        return res.data[appId]?.data || null;
      })
    );
    return data;
  } catch (err) {
    logger.api(`Steam app details failed for ${appId}`, err.message);
    return null;
  }
}

export async function isFreeWeekend(appId) {
  const data = await getSteamAppDetails(appId);
  if (!data) return false;
  const price = data.price_overview;
  return price?.discount_percent === 100 && price?.final === 0;
}

export async function getSteamFreePromos() {
  const cacheKey = 'steam_free_promos';
  const cached   = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await steamLimiter.add(() =>
      withRetry(async () =>
        axios.get('https://store.steampowered.com/search/results/', {
          params:  { maxprice: 'free', specials: 1, json: 1, count: 50 },
          headers: STEAM_HEADERS,
          timeout: LIMITS.REQUEST_TIMEOUT,
        })
      )
    );

    const items = res.data?.items || [];

    const promos = items
      .map(item => ({
        name:  item.name?.trim() || null,
        appId: item.logo?.match(/apps\/(\d+)\//)?.[1] || null,
      }))
      .filter(x => x.appId && x.name)
      .map(({ name, appId }) => ({
        dealId:      `steam_promo_${appId}`,
        gameId:      `steam_promo_${appId}`,
        title:       name,
        store:       'Steam',
        storeId:     '1',
        steamAppId:  appId,
        salePrice:   0,
        normalPrice: 0,
        savings:     100,
        url:         `https://store.steampowered.com/app/${appId}`,
        imageUrl:    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
        endDate:     null,
        type:        'free',
      }));

    cache.set(cacheKey, promos, CACHE_TTL.FREE_GAMES);
    logger.api(`Steam: fetched ${promos.length} free promos`);
    return promos;
  } catch (err) {
    logger.error('Steam free promos fetch failed', err.message);
    return [];
  }
}
