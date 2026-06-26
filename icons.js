const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const crypto = require('crypto')
const sharp = require('sharp');
const sharpIco = require('sharp-ico');
const EleventyFetch = require('@11ty/eleventy-fetch');

async function toWebp64(buffer) {
  let image;
  try {
    image = sharp(buffer);
    await image.metadata();
  } catch {
    const images = sharpIco.sharpsFromIco(buffer);
    image = images[0];
    let bestWidth = 0;
    for (const candidate of images) {
      const { width } = await candidate.metadata();
      if (width > bestWidth) {
        bestWidth = width;
        image = candidate;
      }
    }
  }
  return image
    .resize(64, 64, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp()
    .toBuffer();
}

module.exports = async function (url) {
  await fs.mkdir(path.resolve("_site", "icons"), { recursive: true })
  var originDomain = new URL(url).hostname.split('.').slice(-2).join('.')


    try {
      const html = await EleventyFetch(url, {
        duration: "90d",
        type: "text",
      });
      const $ = cheerio.load(html);

      const iconHref =
        $('link[rel="icon"]').attr('href') ||
        $('link[rel="apple-touch-icon"]').attr('href') ||
        $('link[rel="mask-icon"]').attr('href') ||
        $('link[rel="shortcut icon"]').attr('href');
      if (iconHref) {
        const iconUrl = new URL(iconHref, url).href;
        const iconBuffer = await EleventyFetch(iconUrl, {
          duration: "90d",
          type: "buffer",
        });
        const webpBuffer = await toWebp64(iconBuffer);

        const iconsDir = path.join(__dirname, 'icons');
        await fs.mkdir(iconsDir, { recursive: true });
        const id = crypto.createHash('md5').update(url).digest("hex");
        const filePath = path.join(iconsDir, `${id}.webp`);
        const _filePath = path.resolve("_site", "icons", `${id}.webp`);
        await fs.writeFile(filePath, webpBuffer);
        await fs.writeFile(_filePath, webpBuffer);

        return `/icons/${id}.webp`;
      }
    } catch {
    }
    return `https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`
  

}
