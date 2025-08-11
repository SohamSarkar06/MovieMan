   const firebaseConfig = {
      apiKey: "AIzaSyCNOLMoSv6MaHW9gjY7jnQBQXdoSYeckZw",
      authDomain: "movieman-98c95.firebaseapp.com",
      projectId: "movieman-98c95",
      storageBucket: "movieman-98c95.firebasestorage.app",
      messagingSenderId: "686067682473",
      appId: "1:686067682473:web:b44e3141ac3525aa48edb8"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged(user => {
      if (!user || !user.emailVerified) {
        window.location.href = "index.html";
      }
    });

    document.getElementById("logoutBtn").onclick = () => {
      auth.signOut();
      window.location.href = "index.html";
    };
    document.getElementById("botBtn").onclick = () => {
      
      window.location.href = "search.html";
    };

    // Language data & mappings
    const languages = ["Hindi", "English", "Bengali", "Tamil", "Telugu", "Kannada", "Marathi", "Gujarati", "Punjabi", "Malayalam"];
    const maxSelection = 5;
    const selectedLanguages = new Set();

    const languageTabsContainer = document.getElementById("languageTabs");
    const showMoviesBtn = document.getElementById("showMoviesBtn");
    const moviesList = document.getElementById("moviesList");

    const languageCodes = {
      Hindi: "hi",
      English: "en",
      Bengali: "bn",
      Tamil: "ta",
      Telugu: "te",
      Kannada: "kn",
      Marathi: "mr",
      Gujarati: "gu",
      Punjabi: "pa",
      Malayalam: "ml"
    };

    function createLanguageTabs() {
      languageTabsContainer.innerHTML = "";
      languages.forEach(lang => {
        const tab = document.createElement("div");
        tab.className = "lang-tab";
        tab.textContent = lang;
        tab.setAttribute('role', 'button');
        tab.setAttribute('tabindex', '0');
        tab.setAttribute('aria-pressed', 'false');
        tab.onclick = () => toggleLanguageSelection(tab, lang);
        tab.onkeydown = (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleLanguageSelection(tab, lang);
          }
        };
        languageTabsContainer.appendChild(tab);
      });
    }

    function toggleLanguageSelection(tabElement, lang) {
      if (selectedLanguages.has(lang)) {
        selectedLanguages.delete(lang);
        tabElement.classList.remove("selected");
        tabElement.setAttribute('aria-pressed', 'false');
      } else {
        if (selectedLanguages.size >= maxSelection) {
          alert(`You can select up to ${maxSelection} languages.`);
          return;
        }
        selectedLanguages.add(lang);
        tabElement.classList.add("selected");
        tabElement.setAttribute('aria-pressed', 'true');
      }
      updateShowMoviesButton();
    }

    function updateShowMoviesButton() {
      if (selectedLanguages.size > 0) {
        showMoviesBtn.style.display = "inline-block";
      } else {
        showMoviesBtn.style.display = "none";
      }
      moviesList.innerHTML = "";
    }

    const TMDB_API_KEY = "4a0db7ffa359c68dc3b842ca74bbc589";
    const OMDB_API_KEY = "19de5e7e"; // Replace with your OMDb API key if needed

    async function fetchMovieDetails(movieId) {
      try {
        // Fetch credits (cast + crew)
        const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`);
        const creditsData = await creditsRes.json();

        const director = creditsData.crew.find(c => c.job === "Director")?.name || "N/A";
        const cast = creditsData.cast.slice(0, 5).map(c => c.name).join(", ") || "N/A";

        // Fetch IMDb rating using OMDb API if imdb_id exists
        const movieDetailsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`);
        const movieDetails = await movieDetailsRes.json();

        let imdbRating = "N/A";
        if (movieDetails.imdb_id) {
          try {
            const omdbRes = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${movieDetails.imdb_id}`);
            const omdbData = await omdbRes.json();
            imdbRating = omdbData.imdbRating || "N/A";
          } catch(e) {
            imdbRating = "N/A";
          }
        }

        return { director, cast, imdbRating, original_language: movieDetails.original_language || "N/A" };
      } catch (e) {
        console.error("Error fetching movie details", e);
        return { director: "N/A", cast: "N/A", imdbRating: "N/A", original_language: "N/A" };
      }
    }

    // Add movie to watchlist (updated to store title and watched flag)
    async function addToWatchlist(movieId, movieTitle) {
      if (!auth.currentUser) return alert("Please login first.");

      const userRef = db.collection("users").doc(auth.currentUser.uid);
      try {
        await userRef.set({
          watchlist: firebase.firestore.FieldValue.arrayUnion({
            id: movieId,
            title: movieTitle,
            watched: false
          })
        }, { merge: true });
        alert(`"${movieTitle}" added to your watchlist!`);
        renderWatchlist(); // refresh watchlist UI
      } catch (error) {
        console.error("Error adding to watchlist:", error);
        alert("Failed to add to watchlist.");
      }
    }

    // Toggle watched status in Firestore
    async function toggleWatched(movieId, watched) {
      const userRef = db.collection("users").doc(auth.currentUser.uid);
      try {
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          let watchlist = userDoc.data().watchlist || [];
          watchlist = watchlist.map(m =>
            m.id === movieId ? { ...m, watched: watched } : m
          );
          await userRef.update({ watchlist });
          renderWatchlist();
        }
      } catch (err) {
        console.error("Error updating watched status:", err);
      }
    }

    // Render the watchlist
    async function renderWatchlist() {
      const watchlistDiv = document.getElementById("watchlistDropdown");
      watchlistDiv.innerHTML = "Loading...";

      if (!auth.currentUser) {
        watchlistDiv.innerHTML = "Please login to see your watchlist.";
        return;
      }

      try {
        const userDoc = await db.collection("users").doc(auth.currentUser.uid).get();
        const watchlist = userDoc.data()?.watchlist || [];

        if (watchlist.length === 0) {
          watchlistDiv.innerHTML = "Your watchlist is empty.";
          return;
        }

        watchlistDiv.innerHTML = "";
        for (const movie of watchlist) {
          const movieItem = document.createElement("div");
          movieItem.style.display = "flex";
          movieItem.style.justifyContent = "space-between";
          movieItem.style.alignItems = "center";
          movieItem.style.padding = "6px 0";
          movieItem.style.borderBottom = "1px solid #333";

          const titleSpan = document.createElement("span");
          titleSpan.textContent = movie.title;
          titleSpan.style.cursor = "pointer";
          titleSpan.onclick = () => {
            // open movie detail page from watchlist too
            const url = `movie.html?movieId=${movie.id}&title=${encodeURIComponent(movie.title)}`;
            window.location.href = url;
          };

          const watchedCheckbox = document.createElement("input");
          watchedCheckbox.type = "checkbox";
          watchedCheckbox.checked = movie.watched || false;
          watchedCheckbox.onchange = () => toggleWatched(movie.id, watchedCheckbox.checked);

          movieItem.appendChild(titleSpan);
          movieItem.appendChild(watchedCheckbox);

          watchlistDiv.appendChild(movieItem);
        }
      } catch (error) {
        console.error("Error loading watchlist:", error);
        watchlistDiv.innerHTML = "Failed to load watchlist.";
      }
    }
const watchlistBtn = document.getElementById("watchlistBtn");
const watchlistDropdown = document.getElementById("watchlistDropdown");

watchlistBtn.addEventListener("click", () => {
  if (watchlistDropdown.style.display === "none" || watchlistDropdown.style.display === "") {
    watchlistDropdown.style.display = "block";
    renderWatchlist(); // Refresh the list each time dropdown opens
  } else {
    watchlistDropdown.style.display = "none";
  }
});

// Close dropdown if user clicks outside it
document.addEventListener("click", (event) => {
  if (!watchlistBtn.contains(event.target) && !watchlistDropdown.contains(event.target)) {
    watchlistDropdown.style.display = "none";
  }
});

    async function submitReview(movieId, reviewText, reviewTextarea) {
      if (!auth.currentUser) return alert("Please log in to submit a review.");
      if (!reviewText.trim()) return alert("Review cannot be empty.");

      const reviewData = {
        reviewText: reviewText.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };

      try {
        await db.collection("users")
          .doc(auth.currentUser.uid)
          .collection("reviews")
          .doc(movieId.toString())
          .set(reviewData);
        alert("Review submitted!");
        reviewTextarea.value = ""; // Clear textarea
      } catch (error) {
        console.error(error);
        alert("Failed to submit review.");
      }
    }

    // When clicking a movie card, open movie.html with id & title
    function openMoviePage(movieId, movieTitle) {
      const url = `movie.html?movieId=${movieId}&title=${encodeURIComponent(movieTitle)}`;
      window.location.href = url;
    }

async function showMovies() {
  moviesList.innerHTML = "";

  if (selectedLanguages.size === 0) return;

  moviesList.textContent = "Loading movies...";

  try {
    const filteredMoviesPromises = Array.from(selectedLanguages).map(async (lang) => {
      const langCode = languageCodes[lang];
      const today = new Date().toISOString().split("T")[0];
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=${langCode}&sort_by=popularity.desc&primary_release_date.lte=${today}&page=1`;
      const res = await fetch(url);
      const data = await res.json();
      return data.results || [];
    });

    const filteredMoviesResults = await Promise.all(filteredMoviesPromises);
    const allMovies = filteredMoviesResults.flat();

    if (allMovies.length === 0) {
      moviesList.textContent = "No hot movies found for selected languages today.";
      return;
    }

    moviesList.innerHTML = "";

    for (const movie of allMovies.slice(0, 20)) {
      const { director, cast, imdbRating, original_language } = await fetchMovieDetails(movie.id);

      const card = document.createElement("div");
      card.className = "movie-card clickable";

      // Make the card a flex container so image and info are side by side
      card.style.display = "flex";
      card.style.alignItems = "flex-start";
      card.style.gap = "12px";

      // clicking anywhere on the card opens detail page (except buttons)
      card.onclick = (e) => {
        // avoid triggering when Add to Watchlist or Submit Review buttons are clicked
        const ignoreTags = ["BUTTON", "TEXTAREA", "INPUT"];
        if (ignoreTags.includes(e.target.tagName)) return;
        openMoviePage(movie.id, movie.title || movie.name);
      };

      // Movie poster image on left side (if available)
      if (movie.poster_path) {
        const poster = document.createElement("img");
        poster.src = `https://image.tmdb.org/t/p/w92${movie.poster_path}`; // small poster
        poster.alt = movie.title || movie.name;
        poster.style.borderRadius = "6px";
        poster.style.flexShrink = "0"; // prevent shrinking
        card.appendChild(poster);
      }

      // Create a container div for all text info to keep layout neat
      const infoDiv = document.createElement("div");
      infoDiv.style.flexGrow = "1";

      const title = document.createElement("div");
      title.className = "movie-title";
      title.textContent = movie.title || movie.name;

      title.style.fontWeight = "700";
      title.style.fontSize = "1.1rem";
      title.style.color = "#ff3b3b";

      const lang = document.createElement("div");
      lang.className = "movie-lang";
      const langName = Object.keys(languageCodes).find(k => languageCodes[k] === (movie.original_language || original_language)) || (movie.original_language || original_language);
      lang.textContent = langName;
      lang.style.color = "#ddd";

      const rating = document.createElement("div");
      rating.className = "movie-detail";
      rating.textContent = `IMDb Rating: ${imdbRating}`;

      rating.style.fontSize = "0.9rem";
      rating.style.color = "#ffcc00";
      rating.style.marginTop = "4px";

      const directorDiv = document.createElement("div");
      directorDiv.className = "movie-detail";
      directorDiv.textContent = `Director: ${director}`;

      const castDiv = document.createElement("div");
      castDiv.className = "movie-detail";
      castDiv.textContent = `Cast: ${cast}`;

      const watchlistBtn = document.createElement("button");
      watchlistBtn.textContent = "+ Add to Watchlist";
      watchlistBtn.style.marginTop = "8px";

      watchlistBtn.style.background = "#28a745";
      watchlistBtn.style.border = "none";
      watchlistBtn.style.padding = "6px 10px";
      watchlistBtn.style.borderRadius = "6px";
      watchlistBtn.style.color = "white";
      watchlistBtn.style.fontWeight = "700";
      watchlistBtn.style.cursor = "pointer";
      watchlistBtn.onclick = (ev) => {
        ev.stopPropagation();
        addToWatchlist(movie.id, movie.title || movie.name);
      };

      infoDiv.appendChild(title);
      infoDiv.appendChild(lang);
      infoDiv.appendChild(rating);
      infoDiv.appendChild(directorDiv);
      infoDiv.appendChild(castDiv);
      infoDiv.appendChild(watchlistBtn);

      card.appendChild(infoDiv);

      moviesList.appendChild(card);
    }
  } catch (error) {
    moviesList.textContent = "Error loading movies. Please try again.";
    console.error(error);
  }
}

    // Ensure watchlist loads after login
    auth.onAuthStateChanged(user => {
      if (!user || !user.emailVerified) {
        window.location.href = "index.html";
      } else {
        renderWatchlist();
      }
    });
    async function fetchDirectorMovies(directorName, excludeMovieIds = new Set()) {
  try {
    // Search for the director's person id
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(directorName)}`);
    const searchData = await searchRes.json();
    if (!searchData.results || searchData.results.length === 0) return [];

    const director = searchData.results[0];
    const personId = director.id;

    // Fetch director's movie credits
    const creditsRes = await fetch(`https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${TMDB_API_KEY}`);
    const creditsData = await creditsRes.json();

    if (!creditsData.crew) return [];

    // Filter for directing jobs
    const directedMovies = creditsData.crew.filter(c => c.job === "Director");

    // Exclude movies already watched or in watchlist (by ID)
    const filtered = directedMovies.filter(m => !excludeMovieIds.has(m.id));

    // Sort by popularity desc, limit to 10
    filtered.sort((a, b) => b.popularity - a.popularity);

    return filtered.slice(0, 10);
  } catch (e) {
    console.error(`Error fetching movies by director ${directorName}`, e);
    return [];
  }
}

async function fetchSimilarAndRecommendedMovies(movieId, excludeMovieIds = new Set()) {
  try {
    // Fetch similar movies
    const similarRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${TMDB_API_KEY}&page=1`);
    const similarData = await similarRes.json();

    // Fetch recommended movies
    const recommendedRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&page=1`);
    const recommendedData = await recommendedRes.json();

    // Combine, exclude duplicates and watched
    const combined = [...(similarData.results || []), ...(recommendedData.results || [])];
    const filtered = combined.filter(m => !excludeMovieIds.has(m.id));

    // Sort by popularity desc and limit to 10
    filtered.sort((a, b) => b.popularity - a.popularity);

    // Deduplicate by id
    const uniqueMovies = [];
    const seenIds = new Set();
    for (const movie of filtered) {
      if (!seenIds.has(movie.id)) {
        uniqueMovies.push(movie);
        seenIds.add(movie.id);
      }
      if (uniqueMovies.length >= 10) break;
    }

    return uniqueMovies;
  } catch (e) {
    console.error(`Error fetching similar/recommended movies for movieId ${movieId}`, e);
    return [];
  }
}

async function fetchMovieDetailsForRecommendation(movieId) {
  try {
    // Fetch movie details
    const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`);
    const details = await detailsRes.json();

    // Fetch credits
    const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`);
    const credits = await creditsRes.json();

    // Directors
    const directors = credits.crew.filter(c => c.job === "Director").map(d => d.name);

    // Cast (top 5)
    const cast = credits.cast.slice(0, 5).map(c => c.name);

    // IMDb Rating via OMDb API
    let imdbRating = "N/A";
    if (details.imdb_id) {
      try {
        const omdbRes = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${details.imdb_id}`);
        const omdbData = await omdbRes.json();
        imdbRating = omdbData.imdbRating || "N/A";
      } catch {
        imdbRating = "N/A";
      }
    }

    return {
      id: details.id,
      title: details.title || details.name || "Untitled",
      release_date: details.release_date || "Unknown",
      directors,
      cast,
      imdbRating,
      popularity: details.popularity || 0,
      poster_path: details.poster_path || null,
      overview: details.overview || "",
    };
  } catch (e) {
    console.error(`Error fetching detailed info for movieId ${movieId}`, e);
    return {
      id: movieId,
      title: "Unknown",
      release_date: "Unknown",
      directors: [],
      cast: [],
      imdbRating: "N/A",
      popularity: 0,
      poster_path: null,
      overview: "",
    };
  }
}

async function loadAIRecommendations() {
  const recommendationsDiv = document.getElementById("aiRecommendations");
  recommendationsDiv.innerHTML = "Loading recommendations...";

  if (!auth.currentUser) {
    recommendationsDiv.textContent = "Please log in to see AI recommendations.";
    return;
  }

  try {
    const userDoc = await db.collection("users").doc(auth.currentUser.uid).get();
    const watchlist = userDoc.data()?.watchlist || [];

    // Find watched movies only
    const watchedMovies = watchlist.filter(m => m.watched);

    if (watchedMovies.length === 0) {
      recommendationsDiv.textContent = "Mark some movies as watched in your watchlist to get recommendations.";
      return;
    }

    const watchedMovieIds = new Set(watchedMovies.map(m => m.id));

    // --- 1. Collect directors from watched movies ---
    const directorSet = new Set();
    await Promise.all(watchedMovies.map(async movie => {
      try {
        const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`);
        const creditsData = await creditsRes.json();
        const directors = creditsData.crew.filter(c => c.job === "Director").map(d => d.name);
        directors.forEach(d => directorSet.add(d));
      } catch(e) {
        console.warn(`Failed to get director for movie id ${movie.id}`, e);
      }
    }));

    // --- 2. Get director-based recommendations ---
    const directorRecs = await Promise.all(Array.from(directorSet).map(directorName =>
      fetchDirectorMovies(directorName, watchedMovieIds)
    ));
    const flatDirectorRecs = directorRecs.flat();

    // --- 3. Get similar and recommended movies for watched movies ---
    const simRecLists = await Promise.all(watchedMovies.map(movie =>
      fetchSimilarAndRecommendedMovies(movie.id, watchedMovieIds)
    ));
    const flatSimRecs = simRecLists.flat();

    // --- 4. Combine all recommendations, deduplicate ---
    const allRecsMap = new Map();

    [...flatDirectorRecs, ...flatSimRecs].forEach(movie => {
      if (!allRecsMap.has(movie.id)) {
        allRecsMap.set(movie.id, movie);
      }
    });

    if (allRecsMap.size === 0) {
      recommendationsDiv.textContent = "No new recommendations found based on your watched movies.";
      return;
    }

    // --- 5. Fetch detailed info for all recommended movies ---
    const detailedInfos = await Promise.all(Array.from(allRecsMap.values()).slice(0, 15).map(m => fetchMovieDetailsForRecommendation(m.id)));

    // --- 6. Sort by combined score: popularity * IMDb rating (converted to number) ---
    detailedInfos.sort((a, b) => {
      const aRating = parseFloat(a.imdbRating) || 0;
      const bRating = parseFloat(b.imdbRating) || 0;
      const aScore = a.popularity * aRating;
      const bScore = b.popularity * bRating;
      return bScore - aScore;
    });

    // --- 7. Render ---
    recommendationsDiv.innerHTML = "";

    detailedInfos.forEach(movieDetails => {
      const card = document.createElement("div");
      card.style.background = "#222";
      card.style.marginBottom = "12px";
      card.style.padding = "12px";
      card.style.borderRadius = "6px";
      card.style.cursor = "pointer";
      card.style.color = "white";
      card.title = movieDetails.title;

      card.onclick = (e) => {
        if (e.target.tagName === "BUTTON") return;
        const url = `movie.html?movieId=${movieDetails.id}&title=${encodeURIComponent(movieDetails.title)}`;
        window.location.href = url;
      };

      // Poster (if available)
      if (movieDetails.poster_path) {
        const img = document.createElement("img");
        img.src = `https://image.tmdb.org/t/p/w185${movieDetails.poster_path}`;
        img.alt = movieDetails.title;
        img.style.width = "100px";
        img.style.float = "left";
        img.style.marginRight = "12px";
        img.style.borderRadius = "6px";
        card.appendChild(img);
      }

      const infoDiv = document.createElement("div");
      infoDiv.style.overflow = "hidden";

      const title = document.createElement("div");
      title.textContent = movieDetails.title;
      title.style.fontWeight = "700";
      title.style.fontSize = "1.1rem";
      title.style.color = "#ff3b3b";

      const release = document.createElement("div");
      release.textContent = movieDetails.release_date ? `Released: ${movieDetails.release_date}` : "Release date unknown";
      release.style.fontSize = "0.85rem";
      release.style.color = "#ccc";

      const imdbRating = document.createElement("div");
      imdbRating.textContent = `IMDb Rating: ${movieDetails.imdbRating}`;
      imdbRating.style.fontSize = "0.9rem";
      imdbRating.style.color = "#ffcc00";
      imdbRating.style.marginTop = "4px";

      const directorDiv = document.createElement("div");
      directorDiv.textContent = "Director(s): " + (movieDetails.directors.length ? movieDetails.directors.join(", ") : "N/A");
      directorDiv.style.fontSize = "0.9rem";
      directorDiv.style.marginTop = "6px";
      directorDiv.style.color = "#ddd";

      const castDiv = document.createElement("div");
      castDiv.textContent = "Cast: " + (movieDetails.cast.length ? movieDetails.cast.join(", ") : "N/A");
      castDiv.style.fontSize = "0.9rem";
      castDiv.style.marginTop = "4px";
      castDiv.style.color = "#bbb";

      const addButton = document.createElement("button");
      addButton.textContent = "+ Add to Watchlist";
      addButton.style.marginTop = "8px";
      addButton.style.background = "#28a745";
      addButton.style.border = "none";
      addButton.style.padding = "6px 10px";
      addButton.style.borderRadius = "6px";
      addButton.style.color = "white";
      addButton.style.fontWeight = "700";
      addButton.style.cursor = "pointer";

      addButton.onclick = async (e) => {
        e.stopPropagation();
        try {
          await addToWatchlist(movieDetails.id, movieDetails.title);
          alert(`"${movieDetails.title}" added to your watchlist!`);
          await renderWatchlist();
          await loadAIRecommendations();
        } catch (err) {
          alert("Failed to add movie to watchlist.");
          console.error(err);
        }
      };

      infoDiv.appendChild(title);
      infoDiv.appendChild(release);
      infoDiv.appendChild(imdbRating);
      infoDiv.appendChild(directorDiv);
      infoDiv.appendChild(castDiv);
      infoDiv.appendChild(addButton);

      card.appendChild(infoDiv);

      recommendationsDiv.appendChild(card);
    });
  } catch (e) {
    console.error("Error loading AI recommendations", e);
    recommendationsDiv.textContent = "Failed to load recommendations.";
  }
}

// Call this function after watchlist is rendered or updated
function refreshRecommendations() {
  loadAIRecommendations();
}

// Hook into watchlist rendering to update AI assistant recommendations
const originalRenderWatchlist = renderWatchlist;
renderWatchlist = async function() {
  await originalRenderWatchlist();
  refreshRecommendations();
};

    showMoviesBtn.onclick = showMovies;
    createLanguageTabs();
