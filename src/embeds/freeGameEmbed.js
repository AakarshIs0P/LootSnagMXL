import Colors from '../config/colors.js';
import E from '../config/emojis.js';
import {
  container, textDisplay, separator, mediaGallery,
  actionRow, linkButton, secondaryButton, dangerButton,
} from '../utils/cv2.js';
import { formatStrikePrice, formatEndsIn, buildWishlistId } from '../utils/formatter.js';

export function buildFreeGameMessage(game, currency = 'INR', exchangeRate = 84) {
  const origFormatted = game.normalPrice > 0
    ? formatStrikePrice(game.normalPrice, currency, exchangeRate)
    : null;

  const freePrice  = currency === 'INR' ? '₹0' : '$0.00';
  const priceBlock = origFormatted ? `${freePrice}  ${origFormatted}` : freePrice;
  const endsIn     = formatEndsIn(game.endDate);

  const addId = buildWishlistId('wl_add', game.gameId, game.title);
  const rmId  = buildWishlistId('wl_rm',  game.gameId, game.title);

  return {
    components: [
      container(
        Colors.free,
        textDisplay(`# ${E.free} FREE GAME ALERT`),
        separator(true, 1),
        textDisplay(
          [
            `### ${game.title}`,
            `**Platform:** ${game.store}`,
            `**Ends in:** ${endsIn}`,
            `**Price:** ${priceBlock}`,
            `**Discount:** 100% OFF`,
          ].join('\n')
        ),
        separator(false, 1),
        actionRow(
          linkButton(`Go to ${game.store}`, game.url, 'store'),
          secondaryButton('Add Wishlist', addId, 'wishlist'),
          dangerButton('Remove Wishlist', rmId, 'cross')
        ),
        separator(true, 1),
        mediaGallery(game.imageUrl, game.title)
      ),
    ],
  };
}

export function buildUpcomingFreeGameMessage(game, currency = 'INR', exchangeRate = 84) {
  const startDate     = game.startDate ? formatEndsIn(game.startDate) : 'Soon';
  const origFormatted = game.normalPrice > 0
    ? formatStrikePrice(game.normalPrice, currency, exchangeRate)
    : null;

  return {
    components: [
      container(
        0x7f8c8d,
        textDisplay(`# ${E.timer} UPCOMING FREE GAME`),
        separator(true, 1),
        textDisplay(
          [
            `### ${game.title}`,
            `**Platform:** ${game.store}`,
            `**Available in:** ${startDate}`,
            origFormatted ? `**Original Price:** ${origFormatted}` : '',
          ].filter(Boolean).join('\n')
        ),
        separator(true, 1),
        mediaGallery(game.imageUrl, game.title)
      ),
    ],
  };
}