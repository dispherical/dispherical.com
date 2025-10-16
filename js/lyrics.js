window.validLyrics = "";
window.plainLyrics = "";

let currentTrackId = "";
const SONG_CHECK_INTERVAL = 5000;

const BASE_URL = "https://loc.david.hackclub.app"
function censorText(text) {
  const regex = /\b(4r5e|5h1t|5hit|a55|anal|anus|ar5e|arrse|arse|ass|ass-fucker|asses|assfucker|assfukka|asshole|assholes|asswhole|a_s_s|b!tch|b00bs|b17ch|b1tch|ballbag|balls|ballsack|bastard|beastial|beastiality|bellend|bestial|bestiality|bi\+ch|biatch|bitch|bitcher|bitchers|bitches|bitchin|bitching|bloody|blow job|blowjob|blowjobs|boiolas|bollock|bollok|boner|boob|boobs|booobs|boooobs|booooobs|booooooobs|breasts|buceta|bugger|bum|bunny fucker|butt|butthole|buttmuch|buttplug|c0ck|c0cksucker|carpet muncher|cawk|chink|cipa|cl1t|clit|clitoris|clits|cnut|cock|cock-sucker|cockface|cockhead|cockmunch|cockmuncher|cocks|cocksuck|cocksucked|cocksucker|cocksucking|cocksucks|cocksuka|cocksukka|cok|cokmuncher|coksucka|coon|cox|crap|cum|cummer|cumming|cums|cumshot|cunilingus|cunillingus|cunnilingus|cunt|cuntlick|cuntlicker|cuntlicking|cunts|cyalis|cyberfuc|cyberfuck|cyberfucked|cyberfucker|cyberfuckers|cyberfucking|d1ck|damn|dick|dickhead|dildo|dildos|dink|dinks|dirsa|dlck|dog-fucker|doggin|dogging|donkeyribber|doosh|duche|dyke|ejaculate|ejaculated|ejaculates|ejaculating|ejaculatings|ejaculation|ejakulate|f u c k|f u c k e r|f4nny|fag|fagging|faggitt|faggot|faggs|fagot|fagots|fags|fanny|fannyflaps|fannyfucker|fanyy|fatass|fcuk|fcuker|fcuking|feck|fecker|felching|fellate|fellatio|fingerfuck|fingerfucked|fingerfucker|fingerfuckers|fingerfucking|fingerfucks|fistfuck|fistfucked|fistfucker|fistfuckers|fistfucking|fistfuckings|fistfucks|flange|fook|fooker|fuck|fucka|fucked|fucker|fuckers|fuckhead|fuckheads|fuckin|fucking|fuckings|fuckingshitmotherfucker|fuckme|fucks|fuckwhit|fuckwit|fudge packer|fudgepacker|fuk|fuker|fukker|fukkin|fuks|fukwhit|fukwit|fux|fux0r|f_u_c_k|gangbang|gangbanged|gangbangs|gaylord|gaysex|goatse|God|god-dam|god-damned|goddamn|goddamned|hardcoresex|hell|heshe|hoar|hoare|hoer|homo|hore|horniest|horny|hotsex|jack-off|jackoff|jap|jerk-off|jism|jiz|jizm|jizz|kawk|knob|knobead|knobed|knobend|knobhead|knobjocky|knobjokey|kock|kondum|kondums|kum|kummer|kumming|kums|kunilingus|l3i\+ch|l3itch|labia|lust|lusting|m0f0|m0fo|m45terbate|ma5terb8|ma5terbate|masochist|master-bate|masterb8|masterbat*|masterbat3|masterbate|masterbation|masterbations|masturbate|mo-fo|mof0|mofo|mothafuck|mothafucka|mothafuckas|mothafuckaz|mothafucked|mothafucker|mothafuckers|mothafuckin|mothafucking|mothafuckings|mothafucks|mother fucker|motherfuck|motherfucked|motherfucker|motherfuckers|motherfuckin|motherfucking|motherfuckings|motherfuckka|motherfucks|muff|mutha|muthafecker|muthafuckker|muther|mutherfucker|n1gga|n1gger|nazi|nigg3r|nigg4h|nigga|niggah|niggas|niggaz|nigger|niggers|nob|nob jokey|nobhead|nobjocky|nobjokey|numbnuts|nutsack|orgasim|orgasims|orgasm|orgasms|p0rn|pawn|pecker|penis|penisfucker|phonesex|phuck|phuk|phuked|phuking|phukked|phukking|phuks|phuq|pigfucker|pimpis|piss|pissed|pisser|pissers|pisses|pissflaps|pissin|pissing|pissoff|poop|porn|porno|pornography|pornos|prick|pricks|pron|pube|pusse|pussi|pussies|pussy|pussys|rectum|retard|rimjaw|rimming|s hit|s.o.b.|sadist|schlong|screwing|scroat|scrote|scrotum|semen|sex|sh!\+|sh!t|sh1t|shag|shagger|shaggin|shagging|shemale|shi\+|shit|shitdick|shite|shited|shitey|shitfuck|shitfull|shithead|shiting|shitings|shits|shitted|shitter|shitters|shitting|shittings|shitty|skank|slut|sluts|smegma|smut|snatch|son-of-a-bitch|spac|spunk|s_h_i_t|t1tt1e5|t1tties|teets|teez|testical|testicle|tit|titfuck|tits|titt|tittie5|tittiefucker|titties|tittyfuck|tittywank|titwank|tosser|turd|tw4t|twat|twathead|twatty|twunt|twunter|v14gra|v1gra|vagina|viagra|vulva|w00se|wang|wank|wanker|wanky|whoar|whore|willies|willy|xrated|xxx)\b/gi;
  return text.replace(regex, (match) => "*".repeat(match.length));
}

function getLyricAtTime(lyrics, currentTimeMs) {
  const lines = lyrics.split("\n").filter((line) => line.trim() !== "");
  const parsedLines = [];

  for (const line of lines) {
    const match = line.match(/\[(\d+):(\d+\.\d+)]\s*(.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const timestampMs = (minutes * 60 + seconds) * 1000;
      parsedLines.push({
        time: timestampMs,
        text: censorText(match[3]) || "...",
        originalText: censorText(match[3]) || "..."
      });
    }
  }

  parsedLines.sort((a, b) => a.time - b.time);

  let currentText = null;
  let repetitionCount = 1;

  for (let i = 0; i < parsedLines.length; i++) {
    if (i > 0 && parsedLines[i].originalText === parsedLines[i - 1].originalText) {
      repetitionCount++;
      parsedLines[i].text = `${parsedLines[i].originalText} (x${repetitionCount})`;
    } else {
      currentText = parsedLines[i].originalText;
      repetitionCount = 1;
    }
  }

  let currentLyric = "";
  for (let i = 0; i < parsedLines.length; i++) {
    const thisLine = parsedLines[i];
    const nextLine = parsedLines[i + 1];
    if (
      currentTimeMs >= thisLine.time &&
      (!nextLine || currentTimeMs < nextLine.time)
    ) {
      currentLyric = thisLine.text;
      break;
    }
  }

  return currentLyric;
}


async function loadLyrics(artist, track) {
  const lyricsResponse = await fetch(
    `https://lrclib.net/api/search?artist_name=${encodeURIComponent(
      artist
    )}&track_name=${encodeURIComponent(track)}`
  );
  const lyrics = await lyricsResponse.json();

  const isValidLyrics = (syncedLyrics) => {
    const lines = syncedLyrics
      .split("\n")
      .filter((line) => line.trim() !== "");
    return lines.every((line) => /^\[\d+:\d+\.\d+\]/.test(line.trim()));
  };

  window.validLyrics = "";
  window.plainLyrics = "";

  for (const result of lyrics) {
    if (result.syncedLyrics && isValidLyrics(result.syncedLyrics)) {
      window.validLyrics = result.syncedLyrics;
      break;
    }
    if (!window.plainLyrics && result.plainLyrics) {
      window.plainLyrics = result.plainLyrics;
    }
  }

  updateExpandButton();
}

let localTimeMs = 0;
let lastSyncTime = 0;
const SYNC_INTERVAL = 10000;

async function syncWithServer() {
  if (location.pathname !== "/") return;
  try {
    const response = await fetch(BASE_URL + "/getduration?cache=" + Math.random());
    const data = await response.json();
    localTimeMs = data.elapsed;
    lastSyncTime = performance.now();
  } catch (error) {
    console.error("Error syncing with server:", error);
  }
}

function getCurrentTime() {
  if (location.pathname !== "/") return;
  if (lastSyncTime === 0) {
    return null;
  }
  const elapsedSinceSync = performance.now() - lastSyncTime;
  return (localTimeMs + elapsedSinceSync) + 2000;
}

async function showCurrentLyric() {
  if (location.pathname !== "/") return;
  const now = performance.now();
  if (lastSyncTime === 0 || now - lastSyncTime > SYNC_INTERVAL) {
    await syncWithServer();
  }

  const currentMs = getCurrentTime();
  document.querySelector("#currentLyric").innerText =
    currentMs ? getLyricAtTime(window.validLyrics, currentMs) : "Syncing...";
}

async function fetchSongInfo() {
  if (location.pathname !== "/") return;
  try {
    const response = await fetch(BASE_URL + "/song");
    const data = await response.json();

    const trackId = `${data.artist}-${data.track}-${data.album}`;

    if (trackId !== currentTrackId) {
      currentTrackId = trackId;

      const trackNameElement = document.querySelector(".track-name");
      const artistNameElement = document.querySelector(".artist-name");
      const albumNameElement = document.querySelector(".album-name");
      const albumArtElement = document.querySelector(".album-art img");
      const nowPlayingElement = document.querySelector(".now-playing-content");
      const nothingPlayingElement = document.querySelector(".now-playing p");

      if (data.track) {
        if (trackNameElement) trackNameElement.innerText = data.track;
        if (artistNameElement) artistNameElement.innerText = data.artist;
        if (albumNameElement) albumNameElement.innerText = data.album;

        if (albumArtElement && data.image) {
          albumArtElement.src = data.image;
          albumArtElement.alt = `Album art for ${data.album}`;
        }

        if (nowPlayingElement) nowPlayingElement.style.display = "flex";
        if (nothingPlayingElement) nothingPlayingElement.style.display = "none";

        lastSyncTime = 0;
        document.querySelector("#currentLyric").innerText = "Loading lyrics...";
        await loadLyrics(data.artist, data.track);
        await syncWithServer();
      } else {
        if (nowPlayingElement) nowPlayingElement.style.display = "none";
        if (nothingPlayingElement) nothingPlayingElement.style.display = "block";
        document.querySelector("#currentLyric").innerText = "No track playing";
      }
    }
  } catch (error) {
    console.error("Error fetching song info:", error);
  }
}
function updateExpandButton() {
  const expandBtn = document.getElementById("expandLyricsBtn");
  const lyricsBox = document.getElementById("expandLyricsBox");
  if (!expandBtn || !lyricsBox) return;

  if (window.validLyrics) {
    expandBtn.style.display = "inline-block";
    expandBtn.innerText = "Expand synced lyrics";
  } else if (window.plainLyrics) {
    expandBtn.style.display = "inline-block";
    expandBtn.innerText = "Show lyrics";
  } else {
    expandBtn.style.display = "none";
    lyricsBox.style.display = "none";
  }
}

window.toggleLyricsExpanded = function () {
  const lyricsBox = document.getElementById("expandLyricsBox");
  const expandBtn = document.getElementById("expandLyricsBtn");
  if (!lyricsBox) return;
  if (lyricsBox.style.display === "block") {
    lyricsBox.style.display = "none";
    expandBtn.innerText = window.validLyrics ? "Expand synced lyrics" : "Show lyrics";
    if (window.validLyrics) stopSyncedLyricsAnimation();
  } else {
    lyricsBox.style.display = "block";
    expandBtn.innerText = "Collapse";
    if (window.validLyrics) showSyncedLyricsAnimated();
    else showPlainLyrics();
  }
};

function showPlainLyrics() {
  const lyricsBox = document.getElementById("expandLyricsBox");
  lyricsBox.innerHTML = `<pre style="white-space:pre-wrap;">${censorText(window.plainLyrics)}</pre>`;
}

let gsapInterval = null;
let syncedLines = [];
let syncedTimes = [];

function showSyncedLyricsAnimated() {
  const lyricsBox = document.getElementById("expandLyricsBox");
  const lines = window.validLyrics.split("\n").filter(l => l.trim());
  syncedLines = lines.map(l => censorText(l.replace(/\[\d+:\d+\.\d+\]/, "").trim()));
  syncedTimes = lines.map(l => {
    const m = l.match(/\[(\d+):(\d+\.\d+)]/);
    if (!m) return 0;
    return (parseInt(m[1], 10) * 60 + parseFloat(m[2])) * 1000;
  });

  lyricsBox.innerHTML = syncedLines.map((line, i) =>
    `<div id="lyricline${i}">${censorText(line)}</div>`
  ).join("");

  if (gsapInterval) clearInterval(gsapInterval);

  let lastIdx = -1;
  function updateBoldedLine() {
    const currentMs = getCurrentTime();
    let idx = 0;
    for (let i = 0; i < syncedTimes.length; i++) {
      if (currentMs >= syncedTimes[i]) idx = i;
      else break;
    }
    if (idx !== lastIdx) {
      syncedLines.forEach((_, j) => {
        const el = document.getElementById(`lyricline${j}`);
        if (el) el.style.fontWeight = j === idx ? "bold" : "normal";
      });
      if (window.gsap) window.gsap.fromTo(`#lyricline${idx}`, { opacity: 0.5 }, { opacity: 1, duration: 0.4 });
      lastIdx = idx;
    }
  }

  updateBoldedLine();
  gsapInterval = setInterval(updateBoldedLine, 250);
}
function stopSyncedLyricsAnimation() {
  if (gsapInterval) clearInterval(gsapInterval);
  gsapInterval = null;
}
async function init() {
  await fetchSongInfo();

  setInterval(showCurrentLyric, 250);
  setInterval(fetchSongInfo, SONG_CHECK_INTERVAL);
}

init();
updateExpandButton();
