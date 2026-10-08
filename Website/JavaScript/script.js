import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// PASTE YOUR FIREBASE CONFIG KEYS HERE (from Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyAAtX9OoG4nM91_fhaHU5aB6mHaj8TXdbM",
    authDomain: "roseragora-ll.firebaseapp.com",
    projectId: "roseragora-ll",
    storageBucket: "roseragora-ll.firebasestorage.app",
    messagingSenderId: "551151667641",
    appId: "1:551151667641:web:f3897034b5bb6523d90e68",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// How long each image stays on screen (milliseconds)
const SHOW_TIME = 7500;

// How many finished images to keep waiting in the queue
const QUEUE_SIZE = 4;

// How many images to prepare at the same time
const WORKERS = 2;

// Words that make us skip an article
const BLOCKED_WORDS = [
  "disease", "cancer", "tumor", "virus", "covid", "vaccine", "surgery", "medical",
  "medicine", "hospital", "patient", "symptom", "syndrome", "disorder", "therapy",
  "drug", "drugs", "overdose", "suicide", "depression", "anxiety", "autism",
  "health", "illness", "injury", "abortion", "pregnancy", "anatomy",
  "politics", "political", "politician", "election", "elections", "senator",
  "congress", "parliament", "president", "minister", "government", "party",
  "democrat", "republican", "conservative", "liberal", "socialist", "communist",
  "fascist", "nazi", "campaign", "candidate", "protest", "coup", "terrorism",
  "war", "battle", "massacre", "genocide", "holocaust", "murder", "shooting",
  "execution", "death", "died", "killed", "victim", "torture", "slavery", "bomb",
  "weapon", "corpse",
  "sex", "sexual", "porn", "erotic", "nude", "nudity", "naked", "topless",
  "fetish", "lingerie", "genitals", "breast", "prostitute", "explicit"
];

const card = document.getElementById("card");
const photo = document.getElementById("photo");
const caption = document.getElementById("caption");
const photoLink = document.getElementById("photoLink");
const saveBtn = document.getElementById("saveBtn");

// Track current active slide
let currentSlide = null;

function isBlocked(text) {
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  return words.some(word => BLOCKED_WORDS.includes(word));
}

async function getRandomArticle() {
  const response = await fetch("https://en.wikipedia.org/api/rest_v1/page/random/summary");
  return response.json();
}

async function getCaptionedImage(article) {
  const response = await fetch(
    "https://en.wikipedia.org/api/rest_v1/page/media-list/" + encodeURIComponent(article.title)
  );
  const data = await response.json();

  const good = data.items.filter(item =>
    item.type === "image" &&
    item.caption &&
    item.srcset &&
    !item.title.endsWith(".svg") &&
    !isBlocked(item.caption.text)
  );

  if (good.length === 0) return null;

  const pick = good[Math.floor(Math.random() * good.length)];
  const url = "https:" + pick.srcset[pick.srcset.length - 1].src;
  return { url: url, text: pick.caption.text };
}

async function findNext() {
  while (true) {
    const article = await getRandomArticle();
    const articleText = article.title + " " + (article.description || "") + " " + article.extract;
    if (isBlocked(articleText)) continue;

    const image = await getCaptionedImage(article);
    if (image) return { article: article, image: image };
  }
}

function preloadImage(url) {
  return new Promise(resolve => {
    const hidden = new Image();
    hidden.onload = () => resolve(true);
    hidden.onerror = () => resolve(false);
    hidden.src = url;
  });
}

async function prepareNext() {
  while (true) {
    const result = await findNext();
    const loaded = await preloadImage(result.image.url);
    if (loaded) return result;
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const readyQueue = [];
let preparing = 0;

async function keepQueueFull() {
  while (true) {
    if (readyQueue.length + preparing >= QUEUE_SIZE) {
      await wait(200);
      continue;
    }

    preparing++;
    try {
      readyQueue.push(await prepareNext());
    } catch (error) {
      await wait(1000);
    }
    preparing--;
  }
}

for (let i = 0; i < WORKERS; i++) {
  keepQueueFull();
}

async function showNext() {
  card.classList.add("hidden");
  await wait(400);

  while (readyQueue.length === 0) {
    await wait(100);
  }

  const result = readyQueue.shift();
  currentSlide = result; // Keep reference to displayed slide

  photo.src = result.image.url;
  caption.textContent = result.image.text;
  photoLink.href = result.article.content_urls.desktop.page;

  card.classList.remove("hidden");
  setTimeout(showNext, SHOW_TIME);
}

// "Save to Gallery" Click Event
saveBtn.addEventListener("click", async () => {
  if (!currentSlide) return;

  const sure = window.confirm("Are you sure you want to submit this image and caption to the public gallery?");
  if (!sure) return;

  try {
    await addDoc(collection(db, "Wiki-Cycle-Images"), {
      imageUrl: currentSlide.image.url,
      caption: currentSlide.image.text,
      articleUrl: currentSlide.article.content_urls.desktop.page,
      status: "pending",
      submittedAt: serverTimestamp()
    });

    alert("Submitted! It will appear in the gallery after review.");
  } catch (err) {
    console.error("Error saving submission:", err);
    alert("Something went wrong saving the image.");
  }
});

showNext();