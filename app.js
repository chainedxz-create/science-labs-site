

/* ---------- CONFIG: EDIT THESE ---------- */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBRbkj2Wc_ml9l4iPHadoMvIa6pdRJyO4Q",
  authDomain: "science-labs-e6b1e.firebaseapp.com",
  projectId: "science-labs-e6b1e",
  storageBucket: "science-labs-e6b1e.firebasestorage.app",
  messagingSenderId: "27316410227",
  appId: "1:27316410227:web:f09d0af7f1f0fc66019706",
  measurementId: "G-RJ5JKTDBX2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
  // rest of the config as provided by Firebase
};
const NASA_API_KEY = "DEMO_KEY"; // Replace with your NASA API key for higher quota
/* ----------------------------------------- */

(function () {
  // Basic sanity checks
  if (!firebase || !firebase.auth) {
    console.error("Firebase not loaded. Make sure Firebase scripts are included.");
  }

  // Initialize Firebase
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (e) {
    // firebase.initializeApp throws if config is empty - we'll proceed but show warning
    console.warn("Firebase init failed. Replace firebaseConfig in app.js with your config.");
  }

  // DOM shortcuts
  const $ = (sel) => document.querySelector(sel);
  const $all = (sel) => Array.from(document.querySelectorAll(sel));

  // UI elements
  const landing = $("#landing");
  const portal = $("#portal");
  const btnGoogle = $("#btn-google");
  const btnSignOut = $("#btn-signout");
  const btnTheme = $("#btn-theme");
  const emailForm = $("#email-signin");
  const emailInput = $("#email");
  const passInput = $("#password");
  const authErrors = $("#auth-errors");
  const userEmailEl = $("#user-email");
  const apodEl = $("#apod");
  const highlightsEl = $("#highlights");
  const gameInput = $("#game-input");
  const btnAddGame = $("#btn-add-game");
  const gameListEl = $("#game-list");
  const playerFrame = $("#game-frame");
  const playerPlaceholder = $("#player-placeholder");
  const btnClearGames = $("#btn-clear-games");
  const btnExport = $("#btn-export");
  const btnImport = $("#btn-import");
  const importJson = $("#import-json");

  // Simple client-side storage for game list
  const STORAGE_KEY = "sciencelabs_game_list_v1";

  function saveGameList(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Failed to save game list", e);
    }
  }
  function loadGameList() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to load game list", e);
      return [];
    }
  }

  // Parse input: accepts loadfunction('URL') or URL or iframe snippet
  function parseGameInput(text) {
    text = (text || "").trim();
    if (!text) return null;

    // match loadfunction('URL') or loadfunction("URL")
    let m = text.match(/loadfunction\(['"](.+?)['"]\)/i);
    if (m) return normalizeUrl(m[1]);

    // if it's an iframe tag, extract src
    m = text.match(/<iframe[^>]+src=['"]([^'"]+)['"]/i);
    if (m) return normalizeUrl(m[1]);

    // if bare URL
    m = text.match(/https?:\/\/\S+/i);
    if (m) return normalizeUrl(m[0]);

    return null;
  }

  // Basic normalization + allow relative paths (for local testing)
  function normalizeUrl(u) {
    try {
      const url = new URL(u, location.href);
      return url.href;
    } catch (e) {
      return u; // fallback
    }
  }

  // Render game list UI
  function renderGameList() {
    const list = loadGameList();
    gameListEl.innerHTML = "";
    if (!list.length) {
      gameListEl.innerHTML = `<li class="muted">No games added yet. Paste a link and click Add.</li>`;
      return;
    }
    list.forEach((g, idx) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#";
      a.textContent = g.title || g.url;
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        loadGameToPlayer(g.url);
      });

      const meta = document.createElement("div");
      meta.className = "muted small";
      meta.textContent = `${g.url}`;

      const remove = document.createElement("button");
      remove.textContent = "Remove";
      remove.className = "btn link";
      remove.style.marginLeft = "8px";
      remove.addEventListener("click", () => {
        const arr = loadGameList();
        arr.splice(idx, 1);
        saveGameList(arr);
        renderGameList();
      });

      li.appendChild(a);
      li.appendChild(remove);
      li.appendChild(meta);
      gameListEl.appendChild(li);
    });
  }

  // Load into iframe safely
  function loadGameToPlayer(url) {
    playerPlaceholder.classList.add("hidden");
    playerFrame.classList.remove("hidden");
    playerFrame.src = url;
    // Basic CSP / sandboxing: we already set iframe sandbox attributes in HTML.
  }

  // Add game from input
  btnAddGame.addEventListener("click", () => {
    authErrors.textContent = "";
    const raw = gameInput.value.trim();
    const parsed = parseGameInput(raw);
    if (!parsed) {
      authErrors.textContent = "Could not parse that input. Use loadfunction('URL') or paste a direct URL.";
      return;
    }
    const list = loadGameList();
    list.push({ url: parsed, title: parsed });
    saveGameList(list);
    gameInput.value = "";
    renderGameList();
  });

  btnClearGames.addEventListener("click", () => {
    if (!confirm("Clear saved game list?")) return;
    saveGameList([]);
    renderGameList();
  });

  btnExport.addEventListener("click", () => {
    const list = loadGameList();
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "games.json"; a.click();
    URL.revokeObjectURL(url);
  });

  btnImport.addEventListener("click", () => {
    if (importJson.classList.contains("hidden")) {
      importJson.classList.remove("hidden");
      importJson.value = "";
      return;
    }
    try {
      const parsed = JSON.parse(importJson.value);
      if (!Array.isArray(parsed)) throw new Error("Expected an array");
      saveGameList(parsed.map(item => ({ url: item.url || item })));
      renderGameList();
      importJson.classList.add("hidden");
    } catch (e) {
      alert("Import failed: " + e.message);
    }
  });

  // Email sign-in / register
  emailForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authErrors.textContent = "";
    const email = emailInput.value.trim();
    const pass = passInput.value;
    if (!email || pass.length < 6) {
      authErrors.textContent = "Please provide a valid email and password (min 6 chars).";
      return;
    }
    try {
      // Try sign in first
      await firebase.auth().signInWithEmailAndPassword(email, pass);
    } catch (err) {
      // If failed, try create account
      if (err.code && err.code.includes("user-not-found")) {
        try {
          await firebase.auth().createUserWithEmailAndPassword(email, pass);
        } catch (err2) {
          authErrors.textContent = "Registration failed: " + (err2.message || err2);
        }
      } else {
        authErrors.textContent = err.message || err;
      }
    }
  });

  // Password reset
  $("#btn-reset").addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) return alert("Type your email in the email field first.");
    try {
      await firebase.auth().sendPasswordResetEmail(email);
      alert("Password reset sent (check your inbox).");
    } catch (e) {
      alert("Failed: " + (e.message || e));
    }
  });

  // Google sign-in
  btnGoogle.addEventListener("click", async () => {
    authErrors.textContent = "";
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await firebase.auth().signInWithPopup(provider);
    } catch (e) {
      authErrors.textContent = e.message || e;
    }
  });

  // Sign out
  btnSignOut.addEventListener("click", () => {
    firebase.auth().signOut();
  });

  // Theme toggle (basic)
  let dark = true;
  btnTheme.addEventListener("click", () => {
    dark = !dark;
    if (!dark) {
      document.body.style.background = "#fafafa";
      document.body.style.color = "#111";
    } else {
      document.body.style.background = "";
      document.body.style.color = "";
    }
  });

  // Auth state observer
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      // show portal
      landing.classList.add("hidden");
      portal.classList.remove("hidden");
      btnSignOut.classList.remove("hidden");
      userEmailEl.textContent = user.email || user.displayName || "Authenticated";
      renderGameList();
    } else {
      landing.classList.remove("hidden");
      portal.classList.add("hidden");
      btnSignOut.classList.add("hidden");
      userEmailEl.textContent = "";
    }
  });

  // Fetch NASA APOD for some real content
  async function fetchAPOD() {
    try {
      const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
      if (!res.ok) throw new Error("NASA API error");
      const data = await res.json();
      apodEl.innerHTML = `
        <div class="apod-title"><strong>${data.title}</strong> <span class="muted small">— ${data.date}</span></div>
        ${data.media_type === "image" ? `<img src="${data.url}" alt="${data.title}">` : `<div class="muted small">APOD media not an image: ${data.media_type}</div>`}
        <div class="muted small">${data.explanation ? data.explanation.slice(0, 260) + (data.explanation.length>260 ? "…" : "") : ""}</div>
      `;
    } catch (e) {
      apodEl.innerHTML = `<div class="muted">APOD not available (${e.message}).</div>`;
      console.warn("APOD fetch failed", e);
    }
  }

  // Curated highlights (static + dynamic blend)
  function populateHighlights() {
    const staticHighlights = [
      { title: "Open Data: NASA APIs", url: "https://api.nasa.gov" },
      { title: "arXiv: preprints in physics & cs", url: "https://arxiv.org" },
      { title: "DOAJ: open access journals", url: "https://doaj.org" }
    ];
    highlightsEl.innerHTML = "";
    staticHighlights.forEach(h => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${h.url}" target="_blank" rel="noopener noreferrer">${h.title}</a>`;
      highlightsEl.appendChild(li);
    });
  }

  // Boot
  (function boot() {
    fetchAPOD();
    populateHighlights();
    renderGameList();
  })();

  // Security note displayed in console
  console.info("Science Labs template loaded. Replace firebaseConfig and NASA_API_KEY in app.js. When you switch to Cloudflare Access, you can disable client auth if desired.");

})();

