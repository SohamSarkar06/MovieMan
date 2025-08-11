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

// Keywords for mental health and distress detection
const mentalHealthKeywords = [
  "sad", "depressed", "anxious", "stress", "lonely", "upset", "overwhelmed",
  "tired", "unhappy", "help", "feeling low", "i need", "i am", "hopeless",
  "suicide", "kill myself", "end it all", "worthless", "can’t go on", "broken"
];

const seriousDistressKeywords = [
  "suicide", "kill myself", "end it all", "hopeless", "worthless", "can’t go on", "broken"
];

// Calming movie genres for suggestions
const calmingGenres = ["drama", "documentary", "family", "romance"];

const helplineInfo = `---
**If you or someone you know is struggling, please reach out for help:**

- National Suicide Prevention Lifeline (US): 988
- Crisis Text Line: Text HOME to 741741
- International Helplines: https://www.befrienders.org/

*You are not alone. Support is available.*  
---`;

// Append a chat message to container
function appendMessage(text, fromUser = false) {
  const msgDiv = document.createElement("div");
  msgDiv.className = "message " + (fromUser ? "user-msg" : "bot-msg");
  msgDiv.textContent = text;
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Append movie cards with details to chat container
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

// Fetch detailed movie info including IMDb rating
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
      try {
        const omdbRes = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${details.imdb_id}`);
        const omdbData = await omdbRes.json();
        imdbRating = omdbData.imdbRating || "N/A";
      } catch {}
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

// Dummy watchlist add function
async function addToWatchlist(movieId, movieTitle) {
  alert(`Added "${movieTitle}" to your watchlist!`);
}

// Check if text contains any keyword from list
function containsKeyword(text, keywords) {
  text = text.toLowerCase();
  return keywords.some(keyword => text.includes(keyword));
}

// Check if user query is related to time/date
function containsTimeQuery(text) {
  const timeKeywords = ["time", "date", "day", "month", "year", "clock"];
  return containsKeyword(text, timeKeywords);
}

// Generate casual chatbot replies for certain patterns
function generateChatResponse(userText) {
  const text = userText.toLowerCase();
  const jokes = [
  "Why don't scientists trust atoms? Because they make up everything! 😄",
  "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾",
  "Why don't programmers like nature? It has too many bugs. 🐛",
  "What do you call fake spaghetti? An impasta! 🍝",
  "Why did the math book look sad? Because it had too many problems. 📚",
  "Why did the bicycle fall over? Because it was two-tired! 🚲",
  "What do you call cheese that isn't yours? Nacho cheese! 🧀",
  "Why did the coffee file a police report? It got mugged! ☕️",
  "I'm reading a book on anti-gravity. It's impossible to put down! 🚀",
  "Why did the chicken join a band? Because it had the drumsticks! 🥁",
  "How does a penguin build its house? Igloos it together! 🐧",
  "Why don’t skeletons fight each other? They don’t have the guts. 💀",
  "Why don’t some couples go to the gym? Because some relationships don’t work out! ❤️🏋️‍♂️",
  "I told my computer I needed a break, and it said 'No problem — I’ll go to sleep.' 💻😴",
  "Why was the math lecture so long? The professor kept going off on a tangent. 📐",
  "Why did the tomato turn red? Because it saw the salad dressing! 🍅",
  "I would tell you a construction joke, but I'm still working on it. 🚧",
  "Why did the cookie go to the hospital? Because he felt crummy. 🍪",
  "Parallel lines have so much in common. It’s a shame they’ll never meet. ➖➖",
  "What do you call an alligator in a vest? An investigator! 🐊",
  "I told a joke about a roof once — it went over everyone’s head. 🏠",
  "Why do bees have sticky hair? Because they use a honeycomb! 🍯",
  "How do you organize a space party? You planet. 🌌",
  "Why did the golfer bring two pairs of pants? In case he got a hole in one! ⛳",
  "Why don’t scientists trust atoms? Because they make up everything! 🧪",
  "What do you call a pile of cats? A meow-tain! 🐱",
  "What’s orange and sounds like a parrot? A carrot! 🥕",
  "Why was the broom late? It over swept! 🧹",
  "How do you make holy water? You boil the hell out of it. 💧",
  "What do you call fake noodles? An impasta! 🍝",
  "Why did the coffee file a police report? It got mugged! ☕",
  "What’s brown and sticky? A stick. 🌳",
  "Why don’t programmers like nature? Too many bugs! 🐞",
  "Why was the computer cold? It forgot to close Windows. 🖥️",
  "How do you catch a squirrel? Climb a tree and act like a nut! 🌰",
  "Why did the scarecrow win an award? He was outstanding in his field. 🌾",
  "Why don’t oysters share their pearls? Because they’re shellfish. 🦪",
  "How does a train eat? It goes chew chew. 🚂",
  "Why can’t your nose be 12 inches long? Because then it would be a foot! 👃",
  "What did one wall say to the other? I’ll meet you at the corner. 🧱",
  "Why did the skeleton go to the party alone? He had no body to go with. 💀",
  "What do you call a snowman with a six-pack? An abdominal snowman. ⛄️",
  "Why was the math book sad? Because it had too many problems. 📖",
  "Why don’t some couples go to the gym? Because some relationships don’t work out! 💪",
  "Why did the bicycle fall over? Because it was two-tired! 🚲",
  "What do you call cheese that isn’t yours? Nacho cheese! 🧀",
  "Why did the coffee file a police report? It got mugged! ☕️",
  "What do you call a fish wearing a bowtie? Sofishticated. 🐟",
  "Why did the cookie cry? Because his mom was a wafer too long. 🍪",
  "What did the janitor say when he jumped out of the closet? Supplies! 🧹",
  "What do you get when you cross a snowman and a vampire? Frostbite. 🧛‍♂️",
  "Why did the chicken cross the playground? To get to the other slide. 🐔",
  "Why don’t elephants use computers? Because they’re afraid of the mouse. 🐘🖱️",
  "Why was the math lecture so long? The professor kept going off on a tangent. 🧮",
  "Why was the belt arrested? For holding up pants! 👖",
  "What do you call a dinosaur with an extensive vocabulary? A thesaurus. 🦖",
  "Why did the tomato turn red? Because it saw the salad dressing! 🍅",
  "How do you organize a space party? You planet. 🪐",
  "Why did the mushroom go to the party? Because he was a fungi! 🍄",
  "What did the big flower say to the little flower? Hi, bud! 🌼",
  "What do you call a fake noodle? An impasta. 🍝",
  "Why did the physics teacher break up with the biology teacher? There was no chemistry. ⚛️❤️",
  "Why do cows have hooves instead of feet? Because they lactose. 🐄",
  "How do you make a tissue dance? You put a little boogie in it! 🤧",
  "Why don’t scientists trust atoms? Because they make up everything! 🧬",
  "Why did the computer go to therapy? It had too many bytes of emotional baggage. 💻",
  "Why was the cell phone wearing glasses? Because it lost its contacts. 📱",
  "What do you get when you cross a dog and a calculator? A friend you can count on! 🐶➕",
  "Why did the picture go to jail? Because it was framed! 🖼️",
  "Why did the banana go to the doctor? Because it wasn’t peeling well. 🍌",
  "Why did the cookie go to the doctor? Because it felt crummy. 🍪",
  "What did the grape do when it got stepped on? Nothing but let out a little wine. 🍇🍷",
  "Why did the frog take the bus to work today? His car got toad. 🐸",
  "Why don’t you ever see elephants hiding in trees? Because they’re so good at it! 🐘🌳",
  "What’s orange and sounds like a parrot? A carrot! 🥕",
  "Why did the math book look so sad? Because it had too many problems. 📘",
  "Why did the music teacher need a ladder? To reach the high notes. 🎵",
  "Why did the computer show up at work late? It had a hard drive. 🖥️",
  "What do you call a bear with no teeth? A gummy bear. 🐻",
  "Why did the skeleton not go to the party? Because he had no body to dance with. 💀",
  "Why do seagulls fly over the ocean? Because if they flew over the bay, they’d be bagels. 🥯",
  "Why was the broom late? It overswept. 🧹",
  "Why was the calendar popular? It had a lot of dates. 📅",
  "What do you call an elephant that doesn’t matter? An irrelephant. 🐘",
  "Why did the computer go to the doctor? Because it caught a virus. 🦠",
  "Why can’t your nose be 12 inches long? Because then it would be a foot. 👃",
  "Why don’t some couples go to the gym? Because some relationships don’t work out. 👫🏋️‍♀️",
  "Why did the chicken join a band? Because it had the drumsticks. 🐔🥁",
  "Why do fish live in salt water? Because pepper makes them sneeze! 🐠",
  "What did one ocean say to the other ocean? Nothing, they just waved. 🌊",
  "Why did the man run around his bed? Because he was trying to catch up on sleep. 🛏️",
  "Why was the math book sad? It had too many problems. 📖",
  "Why did the scarecrow get promoted? Because he was outstanding in his field. 🌾"
];


  if (text.includes("how are you") || text.includes("how's it going")) {
    return "I'm doing well, thanks for asking! How are you feeling today?";
  }
  if (text.includes("thank you") || text.includes("thanks")) {
    return "You're very welcome! I'm here to help anytime.";
  }
  if (text.includes("what can you do") || text.includes("help")) {
    return "I can recommend movies, chat with you, or support you if you feel down. Just ask!";
  }
  if (text.includes("tell me a joke")) {
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    return joke;
  }
  if (text.includes("who made you") || text.includes("your creator")) {
    return "I was created to be your friendly movie assistant and emotional support buddy.";
  }
  if (text.includes("i'm feeling") || text.includes("i feel")) {
    return "Thank you for sharing your feelings. Remember, it’s okay to feel this way sometimes. If you want, I can suggest some comforting movies or share some helpline numbers.";
  }
  if (text.includes("i'm sad") || text.includes("i feel sad")) {
    return "I'm sorry you're feeling sad. Sometimes watching a good movie or talking to someone can help. Would you like some movie suggestions or helpline info?";
  }
  // Generic fallback
  return "That's interesting! Tell me more or ask for a movie recommendation.";
}

// Call OpenAI GPT API for AI chat responses
async function generateChatResponseAI(userText) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',  // or 'gpt-3.5-turbo'
        messages: [
          { role: 'system', content: 'You are a friendly movie recommendation assistant that helps users find movies and supports mental wellness.' },
          { role: 'user', content: userText }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    } else {
      return "Sorry, I couldn't generate a response at this time.";
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return "Sorry, something went wrong with my AI engine.";
  }
}

// Main user input processor
async function processUserInput(text) {
  appendMessage(text, true);

  // Check for serious distress keywords first
  if (containsKeyword(text, seriousDistressKeywords)) {
    appendMessage(
      "I'm really sorry to hear that you're feeling this way. " +
      helplineInfo +
      "\nPlease consider reaching out to someone you trust or a professional. I'm here to help however I can."
    );
    return;
  }

  // General mental health keywords with movie suggestions
  if (containsKeyword(text, mentalHealthKeywords)) {
    appendMessage(
      "Thank you for sharing how you're feeling. Taking care of your mental health is very important. " +
      "Here are some helpline numbers in case you need to talk:\n" + helplineInfo
    );
    appendMessage("Let me suggest some calming and uplifting movies that might help you feel better.");

    const genreIds = calmingGenres.map(g => tmdbGenres[g]).filter(Boolean);
    const genreParam = genreIds.join(",");

    try {
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreParam}&sort_by=popularity.desc&page=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        appendMessage("Sorry, I couldn't find calming movies right now.");
        return;
      }
      await appendMovieCards(data.results.slice(0, 5));
    } catch {
      appendMessage("Oops! Something went wrong while fetching calming movies.");
    }
    return;
  }

  // Respond to time/date queries
  if (containsTimeQuery(text)) {
    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    appendMessage(`Today is ${dateStr} and the current time is ${timeStr}.`);
    return;
  }

  // Respond to movie genre requests
  const foundGenres = Object.keys(tmdbGenres).filter(genre => text.toLowerCase().includes(genre));
  if (foundGenres.length > 0) {
    appendMessage(`Great! Let me find popular movies in genres: ${foundGenres.join(", ")}.`);
    const genreIds = foundGenres.map(g => tmdbGenres[g]).filter(Boolean);
    const genreParam = genreIds.join(",");
    try {
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreParam}&sort_by=popularity.desc&page=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        appendMessage("Sorry, I couldn't find movies for those genres.");
        return;
      }
      await appendMovieCards(data.results.slice(0, 7));
    } catch {
      appendMessage("Oops! Something went wrong while fetching movies.");
    }
    return;
  }

  // Fallback to AI chat response
  const aiReply = await generateChatResponseAI(text);
  appendMessage(aiReply);
}

// Event listeners for sending messages
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
