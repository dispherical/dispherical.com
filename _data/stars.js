const EleventyFetch = require("@11ty/eleventy-fetch");

module.exports = async function() {
  const url = `https://api.github.com/users/dispherical/repos?per_page=100`;

  try {
    let repos = await EleventyFetch(url, {
      duration: "1d", 
      type: "json",
      fetchOptions: {
        headers: {
          "User-Agent": "dispherical.com"
        }
      }
    });

    const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);

    return totalStars;

  } catch (error) {
    console.error("Error fetching GitHub stars:", error);
    return "Unavailable";
  }
};
