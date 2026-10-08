import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// PASTE YOUR FIREBASE CONFIG KEYS HERE (Same as script.js)
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

async function loadApprovedGallery() {
  const container = document.getElementById("galleryGrid");

  try {
    // Get documents from Wiki-Cycle-Images where status == "approved"
    const q = query(
      collection(db, "Wiki-Cycle-Images"),
      where("status", "==", "approved")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = "<p>No approved images in the gallery yet.</p>";
      return;
    }

    container.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      const figure = document.createElement("figure");

      const link = document.createElement("a");
      link.href = data.articleUrl;
      link.target = "_blank";
      link.rel = "noopener";

      const img = document.createElement("img");
      img.src = data.imageUrl;

      const figcaption = document.createElement("figcaption");
      figcaption.textContent = data.caption;

      link.appendChild(img);
      figure.appendChild(link);
      figure.appendChild(figcaption);

      container.appendChild(figure);
    });
  } catch (err) {
    console.error("Error fetching gallery:", err);
    container.innerHTML = "<p>Could not load gallery images right now.</p>";
  }
}

loadApprovedGallery();