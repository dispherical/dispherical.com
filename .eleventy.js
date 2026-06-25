const cheerio = require('cheerio');
const icons = require("./icons")
const esbuild = require("esbuild");
const crypto = require("crypto");

function encryptEmail(email, difficultyPrefix = "0000") {
  const challenge = crypto.randomBytes(8).toString("hex");
  let nonce = 0;
  let hash;

  while (true) {
    const candidate = challenge + nonce;
    hash = crypto.createHash("sha256").update(candidate).digest("hex");
    if (hash.startsWith(difficultyPrefix)) break;
    nonce++;
  }

  const key = crypto.createHash("sha256").update(challenge + nonce).digest().slice(0, 32); // AES-256

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(email, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: Buffer.concat([encrypted, tag]).toString("base64"),
    iv: iv.toString("base64"),
    challenge,
    difficulty: difficultyPrefix
  };
}

module.exports = async function (eleventyConfig) {
  const { RenderPlugin } = await import("@11ty/eleventy");
  eleventyConfig.addPlugin(RenderPlugin);
  eleventyConfig.addWatchTarget("./css");
      eleventyConfig.addGlobalData("email", encryptEmail(atob("d2Vic2l0ZUBkaXNwaGVyaWNhbC5jb20=")));

  eleventyConfig.on("eleventy.before", async () => {
    await esbuild.build({
      entryPoints: ["node_modules/@ffmpeg/ffmpeg/dist/esm/worker.js"],
      bundle: true,
      format: "esm",
      outfile: "_site/js/ffmpeg-worker.js",
    });

    await esbuild.build({
      entryPoints: ["node_modules/@imagemagick/magick-wasm/dist/index.js"],
      bundle: true,
      format: "esm",
      outfile: "_site/js/magick-wasm.js",
    });
    const fs = require("fs");
    fs.copyFileSync(
      "node_modules/@imagemagick/magick-wasm/dist/magick.wasm",
      "_site/js/magick.wasm"
    );
  });

  eleventyConfig.addPassthroughCopy("js");

  eleventyConfig.addTransform("externalFavicon", async function (content, outputPath) {
    if (process.env.NODE_ENV != "production") return content;
    if (outputPath && outputPath.endsWith(".html")) {
      const $ = cheerio.load(content);
      const anchors = $("a[href^='http']").toArray();

      const fp = anchors.map(async (el) => {
        const $a = $(el);
        const style = $a.attr("style") || "";
        if ($a.hasClass("badge") || $a.hasClass("nofavicon") || style.includes("display: none")) return;

        if ($a.find("img").length > 0) return;

        const href = $a.attr("href");
        if (href && !href.includes("https://unsplash.com") && !href.includes("https://cdn.dispherical.com") && !href.includes("https://blog.dispherical.com")) {
          return { $a, href };
        }
      });


      const results = await Promise.all(fp);

      const ffp = results
        .filter(Boolean)
        .map(async ({ $a, href }) => {
          const faviconUrl = await icons(href);
          //const faviconUrl = `https://faviconservice.dispherical.com/favicon?url=${encodeURIComponent(href)}`
          $a.prepend(`<img src="${faviconUrl}" alt="favicon" style="width:1em;height:1em;vertical-align:middle;margin-right:0.25em;" class="${href.includes("github.com") ? "flipover" : ""}">`);
        });

      await Promise.all(ffp);

      return $.html();
    }
    return content;
  });

  eleventyConfig.addPassthroughCopy("icons");
  eleventyConfig.addPassthroughCopy("favicon.ico");
}
