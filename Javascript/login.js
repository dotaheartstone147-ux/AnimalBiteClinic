import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyDW85ZEb-dQ-0XpTQ3OVWsna9tG6C5PZYU",
    authDomain: "animalbiteclinic-84ca7.firebaseapp.com",
    databaseURL: "https://animalbiteclinic-84ca7-default-rtdb.firebaseio.com",
    projectId: "animalbiteclinic-84ca7",
    storageBucket: "animalbiteclinic-84ca7.firebasestorage.app",
    messagingSenderId: "69405337111",
    appId: "1:69405337111:web:8323902876ede3bbc61e52"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const form = document.querySelector('form');
const submitBtn = document.getElementById('submitbutton');
const rememberMeCheckbox = document.getElementById('rememberMe');
const usernameInput = document.getElementById('username');

// Load saved email on page load
window.addEventListener('DOMContentLoaded', function() {
  const savedEmail = localStorage.getItem('rememberedEmail');
  if (savedEmail) {
    usernameInput.value = savedEmail;
    rememberMeCheckbox.checked = true;
  }
});

if (form && submitBtn) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = usernameInput.value.trim();
    const password = (document.getElementById('password')).value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Save email if "Remember me" is checked
        if (rememberMeCheckbox.checked) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          // Remove saved email if checkbox is unchecked
          localStorage.removeItem('rememberedEmail');
        }
        window.location.href = "./index.html";
      })
      .catch((error) => {
        alert(error.message || 'Login failed');
        console.error('Auth error:', error);
      });
  });
}

