    // Firebase config
    const firebaseConfig = {
      apiKey: "AIzaSyCNOLMoSv6MaHW9gjY7jnQBQXdoSYeckZw",
      authDomain: "movieman-98c95.firebaseapp.com",
      projectId: "movieman-98c95",
      storageBucket: "movieman-98c95.appspot.com",
      messagingSenderId: "686067682473",
      appId: "1:686067682473:web:b44e3141ac3525aa48edb8"
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    const TMDB_API_KEY = "4a0db7ffa359c68dc3b842ca74bbc589";

    // Get query params from URL
    function getQueryParams() {
      const params = {};
      new URLSearchParams(window.location.search).forEach((v,k) => params[k]=v);
      return params;
    }

    const params = getQueryParams();
    const movieId = params.movieId;
    const movieTitleFromURL = params.title ? decodeURIComponent(params.title) : "";

    if (!movieId) {
      document.getElementById('movieTitle').textContent = "No movie selected.";
      document.getElementById('movieOverview').textContent = "";
      document.getElementById('videoWrapper').textContent = "";
    } else {
      initPage();
    }

    async function initPage() {
      // Show movie title from URL if present
      if (movieTitleFromURL) document.getElementById('movieTitle').textContent = movieTitleFromURL;

      // Fetch movie details
      try {
        const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`);
        const details = await detailsRes.json();

        if (!movieTitleFromURL) document.getElementById('movieTitle').textContent = details.title || details.name || "Movie";
        document.getElementById('movieOverview').textContent = details.overview || "";

      } catch (e) {
        console.error("Error fetching movie details:", e);
      }

      // Fetch credits to get cast and directors
      try {
        const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`);
        const credits = await creditsRes.json();

        // Directors
        const directors = credits.crew.filter(member => member.job === "Director");
        const directorsList = document.getElementById('directorsList');
        directorsList.innerHTML = directors.length
          ? directors.map(d => `<li>${d.name}</li>`).join("")
          : "<li>No director info available.</li>";

        // Cast (top 8)
        const castList = document.getElementById('castList');
        const topCast = credits.cast.slice(0, 8);
        castList.innerHTML = topCast.length
          ? topCast.map(c => `<li>${c.name} as ${c.character}</li>`).join("")
          : "<li>No cast info available.</li>";

      } catch (e) {
        console.error("Error fetching credits:", e);
        document.getElementById('directorsList').innerHTML = "<li>Error loading directors.</li>";
        document.getElementById('castList').innerHTML = "<li>Error loading cast.</li>";
      }

      // Fetch YouTube trailer
      try {
        const videosRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`);
        const videosData = await videosRes.json();
        const videos = videosData.results || [];

        // Find trailer or teaser on YouTube
        const ytTrailer = videos.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")) || videos.find(v => v.site === "YouTube");
        const videoWrapper = document.getElementById('videoWrapper');

        if (ytTrailer && ytTrailer.key) {
          videoWrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytTrailer.key}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
        } else {
          videoWrapper.textContent = "No trailer available.";
        }
      } catch (e) {
        console.error("Error fetching trailer:", e);
        document.getElementById('videoWrapper').textContent = "Error loading trailer.";
      }

      // Listen for reviews in "reviews" collection where movieId matches
      
      // Submit review button
      document.getElementById('submitReviewBtn').onclick = async () => {
        const text = document.getElementById('myReview').value.trim();
        const ratingVal = parseInt(document.getElementById('myRating').value, 10);

        if (!ratingVal || ratingVal < 1 || ratingVal > 5) {
          alert("Please select a rating between 1 and 5.");
          return;
        }
        if (!auth.currentUser) {
          alert("Please log in to submit a review.");
          return;
        }

        try {
          const userEmail = auth.currentUser.email || "Unknown User";
          await db.collection("reviews").add({
            movieId: movieId.toString(),
            reviewText: text,
            rating: ratingVal,
            reviewerEmail: userEmail,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });

          // Clear input fields after submit
          document.getElementById('myReview').value = "";
          document.getElementById('myRating').value = "";
          alert("Review submitted successfully!");
        } catch (err) {
          console.error("Review submit error:", err);
          alert("Failed to submit review. Please try again.");
        }
      };
    }
    db.collection("reviews")
  .where("movieId", "==", movieId.toString())
  .orderBy("timestamp", "desc")

        .onSnapshot(snapshot => {
          const reviewsList = document.getElementById('reviewsList');
          const avgRatingEl = document.getElementById('avgRating');

          if (snapshot.empty) {
            reviewsList.innerHTML = "<p>No reviews yet. Be the first!</p>";
            avgRatingEl.textContent = "No ratings yet.";
            return;
          }

          let totalRating = 0;
          let ratingCount = 0;
          reviewsList.innerHTML = "";

          snapshot.forEach(doc => {
            const data = doc.data();
            if (typeof data.rating === "number" && data.rating >= 1 && data.rating <= 5) {
              totalRating += data.rating;
              ratingCount++;
            }

            const reviewDiv = document.createElement('div');
            reviewDiv.className = 'review';

            const metaDiv = document.createElement('div');
            metaDiv.className = 'meta';
            let metaText = data.reviewerEmail || "Anonymous";
            if (data.timestamp) {
              metaText += ` • ${data.timestamp.toDate().toLocaleString()}`;
            }
            if (data.rating) metaText += ` • ⭐ ${data.rating}/5`;
            metaDiv.textContent = metaText;

            const bodyDiv = document.createElement('div');
            bodyDiv.textContent = data.reviewText || "";
            bodyDiv.style.marginTop = "6px";

            reviewDiv.appendChild(metaDiv);
            reviewDiv.appendChild(bodyDiv);

            reviewsList.appendChild(reviewDiv);
          });

          if (ratingCount > 0) {
            avgRatingEl.textContent = `Average Rating: ${(totalRating / ratingCount).toFixed(1)} / 5 (${ratingCount} rating${ratingCount > 1 ? 's' : ''})`;
          } else {
            avgRatingEl.textContent = "No ratings yet.";
          }
        }, error => {
          console.error("Firestore reviews listener error:", error);
          document.getElementById('reviewsList').textContent = "Failed to load reviews.";
          document.getElementById('avgRating').textContent = "";
        });
