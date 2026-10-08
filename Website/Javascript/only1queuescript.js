// How long each image stays on screen (milliseconds)
const SHOW_TIME = 7500;

// Words that make us skip an article (health, politics, war/death, NSFW).
// Add or remove words here to change the filter.
const BLOCKED_WORDS = [
  // health
  "disease", "cancer", "tumor", "virus", "covid", "vaccine", "surgery", "medical",
  "medicine", "hospital", "patient", "symptom", "syndrome", "disorder", "therapy",
  "drug", "drugs", "overdose", "suicide", "depression", "anxiety", "autism",
  "health", "illness", "injury", "abortion", "pregnancy", "anatomy",
  // politics
  "politics", "political", "politician", "election", "elections", "senator",
  "congress", "parliament", "president", "minister", "government", "party",
  "democrat", "republican", "conservative", "liberal", "socialist", "communist",
  "fascist", "nazi", "campaign", "candidate", "protest", "coup", "terrorism",
  // war and death
  "war", "battle", "massacre", "genocide", "holocaust", "murder", "shooting",
  "execution", "death", "died", "killed", "victim", "torture", "slavery", "bomb",
  "weapon", "corpse",
  // nsfw
  "sex", "sexual", "porn", "erotic", "nude", "nudity", "naked", "topless",
  "fetish", "lingerie", "genitals", "breast", "prostitute", "explicit"
];

// Grab the page elements we need to update
const card = document.getElementById("card");
const photo = document.getElementById("photo");
const caption = document.getElementById("caption");
const photoLink = document.getElementById("photoLink");

// Returns true if the text contains any blocked word
function isBlocked(text) {
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  return words.some(word => BLOCKED_WORDS.includes(word));
}

// Step 1: ask Wikipedia for a random article
async function getRandomArticle() {
  const response = await fetch("https://en.wikipedia.org/api/rest_v1/page/random/summary");
  return response.json();
}

// Step 2: ask Wikipedia for that article's images, keep ones that have a caption,
// and pick one at random. Returns null if there isn't a good one.
async function getCaptionedImage(article) {
  const response = await fetch(
    "https://en.wikipedia.org/api/rest_v1/page/media-list/" + encodeURIComponent(article.title)
  );
  const data = await response.json();

  const good = data.items.filter(item =>
    item.type === "image" &&
    item.caption &&
    item.srcset &&
    !item.title.endsWith(".svg") &&   // skip icons and logos
    !isBlocked(item.caption.text)     // skip blocked topics in the caption
  );

  if (good.length === 0) return null;

  const pick = good[Math.floor(Math.random() * good.length)];
  const url = "https:" + pick.srcset[pick.srcset.length - 1].src;
  return { url: url, text: pick.caption.text };
}

// Keep trying random articles until one passes the filter and has a captioned image
async function findNext() {
  while (true) {
    const article = await getRandomArticle();

    // Check the title, short description and summary for blocked words
    const articleText = article.title + " " + (article.description || "") + " " + article.extract;
    if (isBlocked(articleText)) continue;

    const image = await getCaptionedImage(article);
    if (image) return { article: article, image: image };
  }
}

// Download an image in the background so it is already cached when we show it.
// Resolves to true if it loaded, false if it failed.
function preloadImage(url) {
  return new Promise(resolve => {
    const hidden = new Image();
    hidden.onload = () => resolve(true);
    hidden.onerror = () => resolve(false);
    hidden.src = url;
  });
}

// Find an article AND finish downloading its image, so it's ready to display
async function prepareNext() {
  while (true) {
    const result = await findNext();
    const loaded = await preloadImage(result.image.url);
    if (loaded) return result;
  }
}

// Small helper: wait a number of milliseconds
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// This holds the next image while the current one is on screen
let upcoming = prepareNext();

// Show the ready image, immediately start preparing the one after it, then repeat
async function showNext() {
  card.classList.add("hidden");               // fade out the old one

  // Wait for the fade-out to finish AND for the next image to be ready
  const [result] = await Promise.all([upcoming, wait(400)]);

  upcoming = prepareNext();                   // start loading the following image now

  photo.src = result.image.url;               // already downloaded, so this is instant
  caption.textContent = result.image.text;
  photoLink.href = result.article.content_urls.desktop.page;

  card.classList.remove("hidden");            // fade in
  setTimeout(showNext, SHOW_TIME);            // auto-advance
}

showNext();
