// Existing code for nav and scroll reveal
const navToggle = document.getElementById("nav-toggle");
const navMenu   = document.getElementById("nav-menu");
const navClose  = document.getElementById("nav-close");

if (navToggle) {
	navToggle.addEventListener("click", () => {
		navMenu.classList.add("show-menu");
	});
}
if (navClose) {
	navClose.addEventListener("click", () => {
		navMenu.classList.remove("show-menu");
	});
}
const navLink = document.querySelectorAll(".nav__link");
function linkAction() {
	const navMenu = document.getElementById("nav-menu");
	navMenu.classList.remove("show-menu");
}
for (const item of navLink) {
	item.addEventListener("click", linkAction);
}
const sr = ScrollReveal({
	distance: "90px",
	duration: 3000,
});
sr.reveal(".home__data", { origin: "top", delay: 400 });
sr.reveal(".home__img", { origin: "bottom", delay: 600 });
sr.reveal(".home__footer", { origin: "bottom", delay: 800 });

// --- Auth and API Integration ---
const API_BASE_URL = 'http://localhost:3000'; // Adjust if your backend runs elsewhere

// DOM Elements
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const authSection = document.getElementById('auth-section');
const profileSection = document.getElementById('profile-section');
const profileDataContainer = document.getElementById('profile-data');
const messageSection = document.getElementById('message-section');

// --- Utility Functions ---
function displayMessage(message, type = 'info') {
  messageSection.innerHTML = `<p class="message message--${type}">${message}</p>`;
  setTimeout(() => {
    messageSection.innerHTML = '';
  }, 5000); // Clear message after 5 seconds
}

function updateUIForAuthState() {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    authSection.style.display = 'none';
    profileSection.style.display = 'block';
    fetchUserProfile(); // Fetch profile when logged in
  } else {
    authSection.style.display = 'block';
    profileSection.style.display = 'none';
    profileDataContainer.innerHTML = ''; // Clear profile data
  }
}

// --- API Call Functions ---
async function apiRequest(endpoint, method = 'GET', body = null, requiresAuth = false) {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  const config = {
    method: method,
    headers: headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  if (requiresAuth) {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    } else {
      displayMessage('You are not authorized for this action. Please log in.', 'error');
      return null; // Or throw error
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const responseData = await response.json();

    if (!response.ok) {
      throw responseData; // Throw backend error message
    }
    return responseData;
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error);
    const errorMessage = error.message || 'An unexpected error occurred.';
    displayMessage(`Error: ${errorMessage}`, 'error');
    throw error; // Re-throw for specific handling if needed
  }
}

// --- Event Handlers ---
if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
      const data = await apiRequest('/users/register', 'POST', { email, password });
      displayMessage('Registration successful! You can now log in.', 'success');
      registerForm.reset();
    } catch (error) {
      // Error message is already displayed by apiRequest
    }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const data = await apiRequest('/auth/login', 'POST', { email, password });
      if (data && data.access_token) {
        localStorage.setItem('jwt_token', data.access_token);
        displayMessage('Login successful!', 'success');
        updateUIForAuthState();
        loginForm.reset();
      } else {
        displayMessage('Login failed: No access token received.', 'error');
      }
    } catch (error) {
       // Error message is already displayed by apiRequest
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    try {
      // Call the backend logout endpoint (optional, as JWT logout is client-side)
      await apiRequest('/auth/logout', 'POST', null, true); // Assuming it might need auth
      displayMessage('Logged out successfully.', 'success');
    } catch (error) {
      // Log or handle potential errors during backend logout call, but proceed with client-side logout
      console.warn('Error during backend logout call, proceeding with client-side logout:', error);
    } finally {
      localStorage.removeItem('jwt_token');
      updateUIForAuthState();
    }
  });
}

async function fetchUserProfile() {
  try {
    const userData = await apiRequest('/users/profile', 'GET', null, true);
    if (userData) {
      profileDataContainer.innerHTML = `
        <p><strong>ID:</strong> ${userData.userId || userData.id}</p>
        <p><strong>Email:</strong> ${userData.email}</p>
      `;
    }
  } catch (error) {
    // Error message is already displayed by apiRequest
    // If token expired or invalid, user might be logged out by updateUIForAuthState if token is cleared
  }
}

// Initial UI setup on page load
document.addEventListener('DOMContentLoaded', () => {
  updateUIForAuthState();
});
