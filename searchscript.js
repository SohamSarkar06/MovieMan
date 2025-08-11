const tmdbGenres = {
  "action": 28,
  "adventure": 12,
  "animation": 16,
  "comedy": 35,
  "crime": 80,
  "documentary": 99,
  "drama": 18,
  "family": 10751,
  "fantasy": 14,
  "history": 36,
  "horror": 27,
  "music": 10402,
  "mystery": 9648,
  "romance": 10749,
  "science fiction": 878,
  "scifi": 878,
  "tv movie": 10770,
  "thriller": 53,
  "war": 10752,
  "western": 37
};

const TMDB_API_KEY = "4a0db7ffa359c68dc3b842ca74bbc589";
const OMDB_API_KEY = "19de5e7e";

const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const mentalHealthKeywords = [
  "sad", "depressed", "anxious", "stress", "lonely", "upset", "overwhelmed",
  "tired", "unhappy", "help", "feeling low", "i need", "i am", "hopeless",
  "suicide", "kill myself", "end it all", "worthless", "can’t go on", "broken", "I want to die", "i am", "i want to"
];

const seriousDistressKeywords = [
  "suicide", "kill myself", "end it all", "hopeless", "worthless", "can’t go on", "broken"
];

const calmingGenres = ["drama", "documentary", "family", "romance"];

const helplineInfo = `
**If you or someone you know is struggling, please reach out for help:**

- National Suicide Prevention Lifeline (US): 988
- Crisis Text Line: Text HOME to 741741
- International Helplines: https://www.befrienders.org/

*You are not alone. Support is available.*
`;

// Jokes in global scope
const jokes = [
  "Why don't scientists trust atoms? Because they make up everything! 😄",
  "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾",
  "Why don't programmers like nature? It has too many bugs. 🐛",
  "What do you call fake spaghetti? An impasta! 🍝",
  "Why did the math book look sad? Because it had too many problems. 📚"
  // ... you can keep the rest of your jokes list
];

// Append message to chat
function appendMessage(text, fromUser = false) {
  const msgDiv = document.createElement("div");
  msgDiv.className = "message " + (fromUser ? "user-msg" : "bot-msg");
  msgDiv.textContent = text;
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}


function getRandomJoke() {
  return jokes[Math.floor(Math.random() * jokes.length)];
}

// Fetch movie details
async function fetchMovieDetails(movieId) {
  try {
    const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`);
    const details = await detailsRes.json();

    const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`);
    const credits = await creditsRes.json();

    const directors = credits.crew.filter(c => c.job === "Director").map(d => d.name);
    const cast = credits.cast.slice(0, 5).map(c => c.name);

    let imdbRating = "N/A";
    if (details.imdb_id) {
      const omdbRes = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${details.imdb_id}`);
      const omdbData = await omdbRes.json();
      imdbRating = omdbData.imdbRating || "N/A";
    }

    return {
      title: details.title || details.name || "Untitled",
      poster_path: details.poster_path,
      release_date: details.release_date || "Unknown",
      directors,
      cast,
      imdbRating
    };
  } catch (e) {
    console.error("Error fetching movie details", e);
    return null;
  }
}

// Append movie cards
async function appendMovieCards(movies) {
  for (const movie of movies) {
    const details = await fetchMovieDetails(movie.id);
    if (!details) continue;

    const card = document.createElement("div");
    card.className = "movie-card";
    card.onclick = () => {
      window.open(`https://www.themoviedb.org/movie/${movie.id}`, "_blank");
    };

    if (details.poster_path) {
      const img = document.createElement("img");
      img.src = `https://image.tmdb.org/t/p/w92${details.poster_path}`;
      img.alt = details.title;
      card.appendChild(img);
    }

    const infoDiv = document.createElement("div");
    infoDiv.className = "movie-info";

    const title = document.createElement("div");
    title.className = "movie-title";
    title.textContent = details.title;
    infoDiv.appendChild(title);

    const rating = document.createElement("div");
    rating.className = "movie-detail imdb-rating";
    rating.textContent = `IMDb Rating: ${details.imdbRating}`;
    infoDiv.appendChild(rating);

    const director = document.createElement("div");
    director.className = "movie-detail";
    director.textContent = `Director(s): ${details.directors.length ? details.directors.join(", ") : "N/A"}`;
    infoDiv.appendChild(director);

    const cast = document.createElement("div");
    cast.className = "movie-detail";
    cast.textContent = `Cast: ${details.cast.length ? details.cast.join(", ") : "N/A"}`;
    infoDiv.appendChild(cast);

    const watchlistBtn = document.createElement("button");
    watchlistBtn.className = "watchlist-btn";
    watchlistBtn.textContent = "+ Add to Watchlist";
    watchlistBtn.onclick = (e) => {
      e.stopPropagation();
      addToWatchlist(movie.id, details.title);
    };
    infoDiv.appendChild(watchlistBtn);

    card.appendChild(infoDiv);
    chatContainer.appendChild(card);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

function addToWatchlist(movieId, movieTitle) {
  alert(`Added "${movieTitle}" to your watchlist!`);
}

function containsKeyword(text, keywords) {
  text = text.toLowerCase();
  return keywords.some(keyword => text.includes(keyword));
}

function containsTimeQuery(text) {
  const timeKeywords = ["time", "date", "day", "month", "year", "clock"];
  return containsKeyword(text, timeKeywords);
}

// Simple math solver
function trySolveMath(text) {
  try {
    if (/[\d\+\-\*\/\(\)\.\s]+/.test(text) && /[\+\-\*\/]/.test(text)) {
      const result = Function(`"use strict"; return (${text});`)();
      if (!isNaN(result)) return `The answer is ${result}.`;
    }
  } catch {}
  return null;
}

// Main input processing

async function processUserInput(text) {
  appendMessage(text, true);
  const lowerText = text.toLowerCase();

  if (/^(hi|hello|hey)\b/.test(lowerText)) {
    appendMessage("Hello! I'm your MovieMate 🎬 — I can recommend movies, cheer you up, solve simple math, and even find films by your favourite director, actor, or by movie name. What would you like today?");
    return;
  }

  const mathResult = trySolveMath(lowerText);
  if (mathResult) {
    appendMessage(mathResult);
    return;
  }

  if (containsKeyword(lowerText, seriousDistressKeywords)) {
    appendMessage("I'm really sorry to hear that you're feeling this way. " + helplineInfo);
    return;
  }

  if (containsKeyword(lowerText, mentalHealthKeywords)) {
    appendMessage("Thank you for sharing how you're feeling. Taking care of your mental health is important. Here are some helpline numbers:\n" + helplineInfo);
    appendMessage("Let me suggest some calming and uplifting movies.");
    const genreIds = calmingGenres.map(g => tmdbGenres[g]).filter(Boolean);
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreIds.join(",")}&sort_by=popularity.desc&page=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results?.length) await appendMovieCards(data.results.slice(0, 5));
    return;
  }

  if (containsTimeQuery(lowerText)) {
    const now = new Date();
    appendMessage(`Today is ${now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} and the current time is ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.`);
    return;
  }

  const foundGenres = Object.keys(tmdbGenres).filter(genre => lowerText.includes(genre));
  if (foundGenres.length) {
    appendMessage(`Finding popular movies in genres: ${foundGenres.join(", ")}.`);
    const genreIds = foundGenres.map(g => tmdbGenres[g]);
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreIds.join(",")}&sort_by=popularity.desc&page=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results?.length) await appendMovieCards(data.results.slice(0, 7));
    return;
  }

  // Director or actor search
  // Try explicit person search keywords first
let personMatch = lowerText.match(/(?:director|actor|starring|movies by|films by)\s+(.+)/i);

if (!personMatch && !foundGenres.length) {
  // If no keyword but likely a person's name (2+ words, no numbers)
  if (/^[a-z\s]+$/.test(lowerText.trim()) && lowerText.trim().split(/\s+/).length >= 2) {
    personMatch = [, lowerText.trim()]; // Force treat as name
  }
}

if (personMatch) {
  const personName = personMatch[1].trim();
  appendMessage(`Searching for movies by ${personName}...`);
  const searchRes = await fetch(`https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(personName)}`);
  const searchData = await searchRes.json();
  if (searchData.results?.length) {
    const personId = searchData.results[0].id;
    const creditsRes = await fetch(`https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${TMDB_API_KEY}`);
    const creditsData = await creditsRes.json();
    const movies = [
      ...(creditsData.cast || []),
      ...(creditsData.crew?.filter(c => c.job === "Director") || [])
    ];
    if (movies.length) {
      await appendMovieCards(movies.slice(0, 5));
    } else {
      appendMessage(`Couldn't find any movies for ${personName}.`);
    }
  } else {
    appendMessage(`I couldn't find anyone named ${personName} in my database.`);
  }
  return;
}

  

  // Direct movie search by title
  appendMessage(`Searching for movie titled "${text}"...`);
  const movieRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(text)}`);
  const movieData = await movieRes.json();
  if (movieData.results?.length) {
    await appendMovieCards(movieData.results.slice(0, 5));
    return;
  }

  if (lowerText.includes("joke")) {
    appendMessage(getRandomJoke());
    return;
  }

  appendMessage("That's interesting! Tell me more or ask for a movie recommendation.");
}

sendBtn.addEventListener("click", () => {
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = "";
  processUserInput(text);
});

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendBtn.click();
  }
});
