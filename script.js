/* ============================================================
   NASA Space Explorer — script.js
   - Fetches 9 consecutive days of APOD data from the selected date
   - Builds gallery items dynamically (image/video, title, date)
   - Modal shows full-size media, title, date, and explanation
   - Shows/hides a loading message around the fetch
   - Displays a random "Did You Know?" fact on page load
   ============================================================ */

// ---- 1. API key -------------------------------------------------
// Get your own free key at https://api.nasa.gov (takes ~1 minute).
// DEMO_KEY works for testing but has low rate limits (~30 req/hr).
const API_KEY = "JYjPa5vBBGFV4zjeGLhSPXKRrMswYFo8yas3hAvw"; // <-- replace with your key

const APOD_URL = "https://api.nasa.gov/planetary/apod";
const DAYS_TO_SHOW = 9;

// ---- 2. "Did You Know?" facts -----------------------------------
const spaceFacts = [
  "One day on Venus is longer than one year on Venus — it rotates slower than it orbits the Sun.",
  "The footprints left by Apollo astronauts on the Moon could last for millions of years — there's no wind to erase them.",
  "Neutron stars are so dense that a single teaspoon of one would weigh about 6 billion tons.",
  "The Sun makes up 99.86% of all the mass in our solar system.",
  "There are more stars in the universe than grains of sand on all of Earth's beaches.",
  "Jupiter's Great Red Spot is a storm that has been raging for at least 350 years.",
  "Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.",
  "Saturn is so light (low density) that it would float in a bathtub big enough to hold it.",
  "The International Space Station orbits Earth about every 90 minutes — astronauts see 16 sunrises a day.",
  "A year on Mercury is just 88 Earth days long.",
  "The Milky Way and the Andromeda galaxy are on a collision course — set to merge in about 4.5 billion years.",
  "Space is completely silent: there's no air for sound waves to travel through.",
];

// ---- 3. DOM references ------------------------------------------
const startDateInput = document.getElementById("startDate");
const fetchBtn = document.getElementById("fetchBtn");
const gallery = document.getElementById("gallery");
const loading = document.getElementById("loading");
const factText = document.getElementById("factText");

const modal = document.getElementById("modal");
const modalClose = document.getElementById("modalClose");
const modalMedia = document.getElementById("modalMedia");
const modalTitle = document.getElementById("modalTitle");
const modalDate = document.getElementById("modalDate");
const modalExplanation = document.getElementById("modalExplanation");

// ---- 4. Page setup ----------------------------------------------
// Show a random fact on load.
factText.textContent =
  spaceFacts[Math.floor(Math.random() * spaceFacts.length)];

// Default the date picker to 9 days ago (so the range ends today),
// and prevent picking a future start date.
const today = new Date();
const defaultStart = new Date(today);
defaultStart.setDate(today.getDate() - (DAYS_TO_SHOW - 1));
startDateInput.value = toISODate(defaultStart);
startDateInput.max = toISODate(today);
startDateInput.min = "1995-06-16"; // first-ever APOD

fetchBtn.addEventListener("click", loadGallery);

// ---- 5. Helpers --------------------------------------------------
function toISODate(date) {
  // Format a Date object as YYYY-MM-DD (what the APOD API expects)
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatPrettyDate(isoString) {
  // "2026-07-11" -> "July 11, 2026"
  const [y, m, d] = isoString.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDateRange(startISO) {
  // Returns { start, end } covering 9 consecutive days,
  // clamped so the range never goes past today.
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + (DAYS_TO_SHOW - 1));

  const now = new Date();
  if (end > now) {
    // Slide the whole window back so we still get 9 days.
    end.setTime(now.getTime());
    start.setTime(now.getTime());
    start.setDate(end.getDate() - (DAYS_TO_SHOW - 1));
  }
  return { start: toISODate(start), end: toISODate(end) };
}

// ---- 6. Fetch + render -------------------------------------------
async function loadGallery() {
  const { start, end } = getDateRange(startDateInput.value);

  // Show loading message, clear old gallery, disable button
  loading.hidden = false;
  gallery.innerHTML = "";
  fetchBtn.disabled = true;

  try {
    // thumbs=true asks the API to include thumbnail_url for videos
    const url = `${APOD_URL}?api_key=${API_KEY}&start_date=${start}&end_date=${end}&thumbs=true`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Newest first looks nicer; remove .reverse() for oldest-first.
    data.reverse().forEach((entry) => {
      gallery.appendChild(createGalleryItem(entry));
    });
  } catch (err) {
    gallery.innerHTML = `
      <div class="placeholder">
        <p>⚠️ Couldn't load images (${err.message}).<br>
        Check your API key or try again in a minute — DEMO_KEY has a low rate limit.</p>
      </div>`;
  } finally {
    // Remove loading message whether it worked or failed
    loading.hidden = true;
    fetchBtn.disabled = false;
  }
}

// ---- 7. Build one gallery card -----------------------------------
function createGalleryItem(entry) {
  const item = document.createElement("div");
  item.className = "gallery-item";

  const media = document.createElement("div");
  media.className = "gallery-media";

  if (entry.media_type === "video") {
    // Videos: use the API-provided thumbnail if available,
    // otherwise a simple fallback tile. A badge marks it as video.
    if (entry.thumbnail_url) {
      const img = document.createElement("img");
      img.src = entry.thumbnail_url;
      img.alt = entry.title;
      media.appendChild(img);
    } else {
      const fallback = document.createElement("div");
      fallback.className = "video-fallback";
      fallback.textContent = "🎬";
      media.appendChild(fallback);
    }
    const badge = document.createElement("span");
    badge.className = "video-badge";
    badge.textContent = "▶ Video";
    media.appendChild(badge);
  } else {
    const img = document.createElement("img");
    img.src = entry.url;
    img.alt = entry.title;
    img.loading = "lazy";
    media.appendChild(img);
  }

  const caption = document.createElement("div");
  caption.className = "gallery-caption";

  const title = document.createElement("h3");
  title.textContent = entry.title;

  const date = document.createElement("p");
  date.className = "item-date";
  date.textContent = formatPrettyDate(entry.date);

  caption.appendChild(title);
  caption.appendChild(date);
  item.appendChild(media);
  item.appendChild(caption);

  // Clicking anywhere on the card opens the modal
  item.addEventListener("click", () => openModal(entry));

  return item;
}

// ---- 8. Modal -----------------------------------------------------
function openModal(entry) {
  modalMedia.innerHTML = "";

  if (entry.media_type === "video") {
    // YouTube/Vimeo links embed cleanly in an iframe.
    // Anything else gets a working "Watch video" link instead.
    const isEmbeddable =
      entry.url.includes("youtube.com") ||
      entry.url.includes("youtu.be") ||
      entry.url.includes("vimeo.com");

    if (isEmbeddable) {
      const iframe = document.createElement("iframe");
      iframe.src = entry.url;
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      modalMedia.appendChild(iframe);
    } else {
      if (entry.thumbnail_url) {
        const img = document.createElement("img");
        img.src = entry.thumbnail_url;
        img.alt = entry.title;
        modalMedia.appendChild(img);
      }
      const wrap = document.createElement("div");
      wrap.style.padding = "16px 24px 0";
      const link = document.createElement("a");
      link.className = "video-link";
      link.href = entry.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "▶ Watch video";
      wrap.appendChild(link);
      modalMedia.appendChild(wrap);
    }
  } else {
    // hdurl is the full-size image; fall back to url if missing
    const img = document.createElement("img");
    img.src = entry.hdurl || entry.url;
    img.alt = entry.title;
    modalMedia.appendChild(img);
  }

  modalTitle.textContent = entry.title;
  modalDate.textContent = formatPrettyDate(entry.date);
  modalExplanation.textContent = entry.explanation;

  modal.hidden = false;
  document.body.style.overflow = "hidden"; // stop background scroll
}

function closeModal() {
  modal.hidden = true;
  modalMedia.innerHTML = ""; // stops any playing video
  document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeModal);

// Click on the dark overlay (but not the box itself) closes the modal
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

// Escape key closes the modal too
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) closeModal();
});
