const cheerio = require('cheerio');
const icons = require("./icons")
const esbuild = require("esbuild");
module.exports = async function (eleventyConfig) {
  const { RenderPlugin } = await import("@11ty/eleventy");
  eleventyConfig.addPlugin(RenderPlugin);

  eleventyConfig.on("eleventy.before", async () => {
    await esbuild.build({
      entryPoints: ["node_modules/@ffmpeg/ffmpeg/dist/esm/worker.js"],
      bundle: true,
      format: "esm",
      outfile: "_site/js/ffmpeg-worker.js",
    });
  });

  eleventyConfig.addPassthroughCopy("js");

  eleventyConfig.addTransform("externalFavicon", async function (content, outputPath) {
    return content;
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
