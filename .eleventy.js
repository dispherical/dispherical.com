const cheerio = require('cheerio');
const icons = require("./icons")
module.exports = async function (eleventyConfig) {
  const { RenderPlugin } = await import("@11ty/eleventy");
  eleventyConfig.addPlugin(RenderPlugin);

  eleventyConfig.addTransform("externalFavicon", async function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      const $ = cheerio.load(content);
      const anchors = $("a[href^='http']").toArray()
      await Promise.all(anchors.map(async (el) => {
        const $a = $(el);
        if ($a.find("img").length > 0) return;
        const href = $a.attr("href");
        if (href && !href.includes("https://unsplash.com") && !href.includes("https://cdn.dispherical.com") && !href.includes("https://blog.dispherical.com")) {
          const faviconUrl = await icons(href)
          $a.prepend(`<img src="${faviconUrl}" alt="favicon" style="width:1em;height:1em;vertical-align:middle;margin-right:0.25em;" class="${href.includes("github.com") ? "flipover" : ""}">`);

        }

      }))

      return $.html();
    }
    return content;
  });

  eleventyConfig.addPassthroughCopy("icons");

}
