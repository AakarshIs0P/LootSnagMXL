const E = {
  free:      '<:game:1508457973012500560>',
  deal:      '<:deal:1508457968050634752>',
  search:    '<:search:1508457993245560995>',
  wishlist:  '<:wishlist:1508458000006905986>',
  price:     '<:price:1508457990511005818>',
  discount:  '<:discount:1508577382842236948>',
  platform:  '<:platform:1508457987474460804>',
  timer:     '<:timer:1508458008126951434>',
  check:     '<:Check:1508457956058857603>',
  cross:     '<:cross:1508457962455433368>',
  warning:   '<:warn:1508458011625132203>',
  stats:     '<:sts:1508458005488996433>',
  settings:  '<:settings:1508457997083349042>',
  log:       '<:log:1508457976241848380>',
  ping:      '<:ping:1508457981828665428>',
  store:     '<:store:1508458002804510730>',
  currency:  '<:ex:1508457970558697633>',
  channel:   '<:ann:1508457949696364614>',
  owner:     '<:crown:1508457965441515530>',
  cache:     '<:cache:1508457952997146644>',
  cron:      '<:corn:1508457959657570385>',
  up:        '<:GREEN:1508211082961883287>',
  down:      '<:RED:1508211113706393650>',
};

function parseEmoji(str) {
  const match = str.match(/^<a?:(\w+):(\d+)>$/);
  if (!match) return null;
  return { name: match[1], id: match[2] };
}

export const EmojiObj = Object.fromEntries(
  Object.entries(E).map(([k, v]) => [k, parseEmoji(v)])
);

export default E;