/* ============================================================
   CAB DRIVER PROFILE - Firebase Reviews System
   Real-time updates, live rating calculation
   ============================================================ */

let selectedRating = 5;
let selectedPlatform = 'Uber';
let allReviews = [];
const DRIVER_ID = 'indradev-kolkata'; // Editable: Change for other drivers

/* ---------- INITIALIZATION ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initializeReviewSystem();
  setupStarPicker();
  setupCharCounter();
  setupFormSubmit();
  setupModalClose();
});

/* ---------- MODAL MANAGEMENT ---------- */
function openReviewModal() {
  const modal = document.getElementById('reviewModal');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  resetReviewForm();
}

function closeReviewModal() {
  const modal = document.getElementById('reviewModal');
  modal.classList.remove('show');
  document.body.style.overflow = 'auto';
}

function setupModalClose() {
  const overlay = document.getElementById('reviewModal');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeReviewModal();
  });
}

/* ---------- STAR PICKER ---------- */
function setupStarPicker() {
  const starBtns = document.querySelectorAll('.star-btn');
  const ratingInput = document.getElementById('selectedRating');
  const ratingLabel = document.getElementById('ratingLabel');
  const labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];

  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.rating, 10);
      ratingInput.value = selectedRating;

      starBtns.forEach((b, i) => {
        b.classList.toggle('active', i < selectedRating);
      });

      ratingLabel.textContent = labels[selectedRating - 1];
    });
  });

  // Set default to 5 stars
  starBtns[4].click();
}

/* ---------- CHAR COUNTER ---------- */
function setupCharCounter() {
  const textarea = document.getElementById('reviewMessage');
  const counter = document.getElementById('charCount');

  textarea.addEventListener('input', () => {
    counter.textContent = textarea.value.length;
  });
}

/* ---------- FORM SUBMISSION ---------- */
function setupFormSubmit() {
  const form = document.getElementById('reviewForm');
  form.addEventListener('submit', submitReview);
}

async function submitReview(e) {
  e.preventDefault();

  const nameInput = document.getElementById('reviewName');
  const platformInput = document.getElementById('reviewPlatform');
  const messageInput = document.getElementById('reviewMessage');
  const submitBtn = document.getElementById('submitBtn');
  const form = document.getElementById('reviewForm');
  const loadingState = document.getElementById('loadingState');
  const successState = document.getElementById('successState');

  const name = nameInput.value.trim();
  const platform = platformInput.value;
  const message = messageInput.value.trim();

  if (!name || !platform) {
    alert('Please fill in all required fields');
    return;
  }

  // Show loading state
  submitBtn.disabled = true;
  form.style.display = 'none';
  loadingState.style.display = 'grid';

  try {
    // Submit to Firebase
    await window.db.collection('reviews').add({
      driverId: DRIVER_ID,
      name: name,
      platform: platform,
      stars: selectedRating,
      message: message,
      timestamp: new Date()
    });

    // Success state
    loadingState.style.display = 'none';
    successState.style.display = 'grid';

    // Auto-close after 2 seconds
    setTimeout(() => {
      closeReviewModal();
    }, 2000);
  } catch (error) {
    console.error('Error submitting review:', error);
    alert('Error submitting review: ' + error.message);
    
    // Reset form
    loadingState.style.display = 'none';
    form.style.display = 'grid';
    submitBtn.disabled = false;
  }
}

function resetReviewForm() {
  document.getElementById('reviewForm').style.display = 'grid';
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('successState').style.display = 'none';

  document.getElementById('reviewName').value = '';
  document.getElementById('reviewMessage').value = '';
  document.getElementById('reviewPlatform').value = 'Uber';
  document.getElementById('charCount').textContent = '0';
  selectedRating = 5;
  selectedPlatform = 'Uber';

  // Reset stars
  document.querySelectorAll('.star-btn')[4].click();
}

/* ============================================================
   FIREBASE REAL-TIME REVIEWS
   ============================================================ */

function initializeReviewSystem() {
  if (!window.db) {
    console.error('Firebase not initialized');
    return;
  }

  const reviewsLoading = document.getElementById('reviewsLoading');
  const reviewGrid = document.getElementById('reviewGrid');
  const reviewsEmpty = document.getElementById('reviewsEmpty');
  const ratingBanner = document.getElementById('ratingBanner');

  // Show loading
  reviewsLoading.style.display = 'grid';

  // Real-time listener
  window.db
    .collection('reviews')
    .where('driverId', '==', DRIVER_ID)
    .orderBy('timestamp', 'desc')
    .onSnapshot(
      (snapshot) => {
        allReviews = [];
        
        snapshot.forEach((doc) => {
          allReviews.push({
            id: doc.id,
            ...doc.data()
          });
        });

        reviewsLoading.style.display = 'none';

        if (allReviews.length === 0) {
          reviewsEmpty.style.display = 'grid';
          reviewGrid.style.display = 'none';
          ratingBanner.style.display = 'none';
        } else {
          reviewsEmpty.style.display = 'none';
          reviewGrid.style.display = 'grid';
          ratingBanner.style.display = 'grid';
          
          renderReviews();
          updateRatingBanner();
        }
      },
      (error) => {
        console.error('Error loading reviews:', error);
        reviewsLoading.innerHTML = '<p style="color:var(--muted)">Error loading reviews. Check console.</p>';
      }
    );
}

/* ---------- RENDER REVIEWS ---------- */
function renderReviews() {
  const reviewGrid = document.getElementById('reviewGrid');

  reviewGrid.innerHTML = allReviews.map((review) => {
    const timestamp = review.timestamp?.toDate 
      ? review.timestamp.toDate() 
      : new Date(review.timestamp);
    
    const timeAgo = getTimeAgo(timestamp);
    const starsHtml = renderStars(review.stars);
    const platformIcon = getPlatformIcon(review.platform);

    return `
      <article class="glass-card review-card">
        <div class="stars">${starsHtml}</div>
        <div style="display: flex; gap: 8px; align-items: center; justify-content: space-between;">
          <h3>${escapeHtml(review.name)}</h3>
          <span class="platform-tag">${platformIcon} ${review.platform}</span>
        </div>
        ${review.message ? `<p>"${escapeHtml(review.message)}"</p>` : ''}
        <div class="time-ago">${timeAgo}</div>
      </article>
    `;
  }).join('');
}

function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= rating 
      ? '<i class="fa-solid fa-star"></i>' 
      : '<i class="fa-regular fa-star"></i>';
  }
  return html;
}

function getPlatformIcon(platform) {
  const icons = {
    'Uber': '<i class="fa-brands fa-uber"></i>',
    'Rapido': '<i class="fa-solid fa-bolt"></i>',
    'Ola': '<i class="fa-solid fa-taxi"></i>'
  };
  return icons[platform] || '🚗';
}

function getTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} min ago`;
  return 'just now';
}

/* ---------- UPDATE RATING BANNER ---------- */
function updateRatingBanner() {
  if (allReviews.length === 0) return;

  // Calculate average
  const avgRating = allReviews.reduce((sum, r) => sum + r.stars, 0) / allReviews.length;

  // Update big number
  document.getElementById('ratingBig').textContent = avgRating.toFixed(2);

  // Update stars
  const starsHtml = renderStars(Math.round(avgRating));
  document.getElementById('ratingStars').innerHTML = starsHtml;

  // Update count
  document.getElementById('ratingCount').textContent = 
    `${allReviews.length} review${allReviews.length !== 1 ? 's' : ''}`;
}

/* ---------- UTILITY FUNCTIONS ---------- */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* Export functions for onclick handlers */
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;