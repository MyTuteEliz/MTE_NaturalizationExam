/*
====================================================
FILE: app.js

PURPOSE:
Main app logic (DO NOT EDIT unless necessary)

CONTAINS:
- login system
- module system
- flashcards
- dictation
- progress tracking
====================================================
*/

import { AUTH } from "./auth.js";
import { modules } from "./data/modules.js";

let unlocked = localStorage.getItem("unlocked") === "true";
let currentModule = 0;
let currentLesson = 0;
let currentItem = 0;

// ---------------- LOGIN ----------------

window.login = function () {
  const input = document.getElementById("passwordInput").value;

  if (input === AUTH.accessCode) {
    localStorage.setItem("unlocked", "true");
    localStorage.setItem("appVersion", AUTH.appVersion);
    unlocked = true;
    startApp();
  } else {
    alert("Incorrect code");
  }
};

// ---------------- START ----------------

function startApp() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  render();
}

// ---------------- RENDER ----------------

function render() {
  const module = modules[currentModule];
  const lesson = module.lessons[currentLesson];
  const item = lesson.items[currentItem];

  document.getElementById("moduleTitle").innerText =
    module.title + " → " + lesson.title;

  const content = document.getElementById("content");

  if (item.type === "flashcard") {
    content.innerHTML = `
      <div class="card" onclick="reveal(this)">
        ${item.english}
        <div class="russian hidden">${item.russian}</div>
      </div>
      <button onclick="playAudio('${item.audio}')">Play Audio</button>
    `;
  }
}

// ---------------- FLASHCARD REVEAL ----------------

window.reveal = function (el) {
  const ru = el.querySelector(".russian");
  ru.classList.toggle("hidden");
};

// ---------------- AUDIO ----------------

window.playAudio = function (file) {
  if (!file) return;
  const audio = new Audio(file);
  audio.play();
};

// ---------------- NAVIGATION ----------------

window.nextItem = function () {
  const lesson = modules[currentModule].lessons[currentLesson];

  if (currentItem < lesson.items.length - 1) {
    currentItem++;
  }

  render();
};

window.prevItem = function () {
  if (currentItem > 0) {
    currentItem--;
  }

  render();
};

// ---------------- INIT ----------------

if (unlocked) startApp();
