// From https://github.com/simple-icons/simple-icons/blob/develop/sdk.mjs
const TITLE_TO_SLUG_REPLACEMENTS = {
  '+': 'plus',
  '.': 'dot',
  '&': 'and',
  đ: 'd',
  ħ: 'h',
  ı: 'i',
  ĸ: 'k',
  ŀ: 'l',
  ł: 'l',
  ß: 'ss',
  ŧ: 't',
  ø: 'o',
};

const TITLE_TO_SLUG_CHARS_REGEX = new RegExp(
  `[${Object.keys(TITLE_TO_SLUG_REPLACEMENTS).join('')}]`,
  'g',
);

const TITLE_TO_SLUG_RANGE_REGEX = /[^a-z\d]/g;

const titleToSlug = (title) =>
  title
    ?.toLowerCase()
    ?.replaceAll(
      TITLE_TO_SLUG_CHARS_REGEX,
      (char) => TITLE_TO_SLUG_REPLACEMENTS[char],
    )
    ?.normalize('NFD')
    ?.replaceAll(TITLE_TO_SLUG_RANGE_REGEX, '');

const fs = require('fs').promises;
const path = require('path');
module.exports = async function (url) {
  await fs.mkdir(path.resolve("_site", "icons"), { recursive: true })
  var originDomain = new URL(url).hostname.split('.').slice(-2).join('.')
  const icons = await (await fetch("https://rawcdn.githack.com/simple-icons/simple-icons/refs/heads/develop/data/simple-icons.json")).json()
  var foundIcon = icons.find(icon => {
    return new URL(icon.source).hostname.split('.').slice(-2).join('.') == originDomain
  })
  if (originDomain == "github.com") foundIcon = icons.find(icon => icon.title == "GitHub")
  if (originDomain == "bsky.app") foundIcon = icons.find(icon => icon.title == "Bluesky")
  if (originDomain == "dino.icu") foundIcon = icons.find(icon => icon.title == "Mastodon")
  if (originDomain == "wikipedia.org") foundIcon = icons.find(icon => icon.title == "Wikipedia")

  if (originDomain == "keyoxide.org") return "https://design.keyoxide.org/keyoxide/logos/keyoxide.rounded.2x.png"
  if (foundIcon) {
    const slug = titleToSlug(foundIcon?.title || "");
    const svgUrl = `https://cdn.jsdelivr.net/npm/simple-icons@v15/icons/${slug}.svg`;
    const res = await fetch(svgUrl);
    let svg = await res.text();
    svg = svg.replace(
      /<svg([^>]+)>/,
      `<svg$1 fill="#${foundIcon.hex}">`
    );

    const iconsDir = path.join(__dirname, 'icons');
    await fs.mkdir(iconsDir, { recursive: true });
    const filePath = path.join(iconsDir, `${slug}.svg`);
    const _filePath = path.resolve("_site", "icons", `${slug}.svg`);
    await fs.writeFile(filePath, svg, 'utf8');

    await fs.writeFile(_filePath, svg, 'utf8');
    return `/icons/${slug}.svg`

  }
  else return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`
}
