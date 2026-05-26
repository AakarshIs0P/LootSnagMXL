import { SlashCommandBuilder } from 'discord.js';
import { getEpicFreeGames } from '../services/epic.js';
import { getFreeDeals } from '../services/cheapshark.js';
import { getSteamFreePromos } from '../services/steam.js';
import { getUSDtoINR } from '../services/exchangeRate.js';
import { buildFreeGameMessage, buildUpcomingFreeGameMessage } from '../embeds/freeGameEmbed.js';
import { getUserCurrency } from '../database/models/user.js';
import { followUpCV2 } from '../utils/cv2.js';
import Colors from '../config/colors.js';
import E from '../config/emojis.js';
import { container, textDisplay, separator } from '../utils/cv2.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('freegames')
  .setDescription('Show all currently free games across stores');

export async function execute(interaction) {
  await interaction.deferReply();

  const currency     = await getUserCurrency(interaction.user.id);
  const exchangeRate = await getUSDtoINR();

  try {
    const [epicData, csDeals, steamPromos] = await Promise.all([
      getEpicFreeGames(),
      getFreeDeals(),
      getSteamFreePromos(),
    ]);

    const seen    = new Set();
    const allFree = [...steamPromos, ...epicData.current, ...csDeals].filter(game => {
      const key = game.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (allFree.length === 0 && epicData.upcoming.length === 0) {
      return followUpCV2(interaction, {
        components: [
          container(
            Colors.info,
            textDisplay(`# ${E.free} FREE GAMES`),
            separator(true, 1),
            textDisplay('No free games found right now.\nCheck back soon or set up auto-alerts with `/channels`.')
          ),
        ],
      });
    }

    const first      = allFree[0] || epicData.upcoming[0];
    const isUpcoming = !allFree.length;
    const payload    = isUpcoming
      ? buildUpcomingFreeGameMessage(first, currency, exchangeRate)
      : buildFreeGameMessage(first, currency, exchangeRate);

    await followUpCV2(interaction, payload);

    for (const game of allFree.slice(1, 8)) {
      const p = buildFreeGameMessage(game, currency, exchangeRate);
      await interaction.followUp({ ...p, flags: 1 << 15 }).catch(() => {});
    }

  } catch (err) {
    logger.error('freegames command failed', err);
    await interaction.editReply({ content: 'Failed to fetch free games. Try again.' });
  }
}