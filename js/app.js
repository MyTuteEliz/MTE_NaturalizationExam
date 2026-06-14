// ============================================================
// app.js — Main Application Logic
// US Citizenship Study App
// ============================================================
// Covers: Firebase init, Auth, Router, Student Hub,
//         Flashcard Engine (all 6 types), Matching Exercise,
//         Recording Exercise, Spaced Repetition
// ============================================================

// ════════════════════════════════════════════════════════════
// ██  FIREBASE CONFIGURATION
// ════════════════════════════════════════════════════════════
// TEACHER: Replace ALL values below with YOUR Firebase config.
// Find it at: console.firebase.google.com
//   → Your Project → Project Settings → Your Apps → SDK setup
// ════════════════════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyArIrXe22IuftquFHD8YCJIERP9HTnWTj4",
  authDomain:        "mte-naturalization-exam.firebaseapp.com",
  projectId:         "mte-naturalization-exam",
  storageBucket:     "mte-naturalization-exam.firebasestorage.app",
  messagingSenderId: "776665352502",
  appId:             "1:776665352502:web:9f7155a95ca6014716cb97"
};
// ════════════════════════════════════════════════════════════

// ── Firebase Init ────────────────────────────────────────────
firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db   = firebase.firestore();
const storage = firebase.storage();

// ── App State ────────────────────────────────────────────────
const State = {
  user:            null,   // { uid, email, role, displayName }
  sections:        [],
  currentSection:  null,
  currentLesson:   null,
  currentActivity: null,
  cardQueue:       [],
  cardIndex:       0,
  audioPlays:      0,
  recorder:        null,
  recordedBlob:    null,
  teacherAudioUrl: null,
};

// ════════════════════════════════════════════════════════════
// UTILITY HELPERS
// ════════════════════════════════════════════════════════════
function $(id)    { return document.getElementById(id); }
function qs(sel)  { return document.querySelector(sel); }
function qsa(sel) { return document.querySelectorAll(sel); }

function showLoading(msg = 'Loading…') {
  $('loading').classList.remove('hidden');
  $('loading-msg').textContent = msg;
}
function hideLoading() { $('loading').classList.add('hidden'); }

function showToast(msg, type = '', dur = 3000) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  setTimeout(() => { t.className = ''; }, dur);
}

function navigate(screenId) {
  qsa('.screen').forEach(s => s.classList.remove('active'));
  const s = $(screenId);
  if (s) { s.classList.add('active'); s.scrollTop = 0; }
}

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════
auth.onAuthStateChanged(async user => {
  if (user) {
    showLoading('Loading your profile…');
    try {
      const snap = await db.collection('users').doc(user.uid).get();
      if (!snap.exists) { await auth.signOut(); return; }
      State.user = { uid: user.uid, email: user.email, ...snap.data() };
      if (State.user.role === 'teacher') {
        await loadTeacherPanel();
        navigate('screen-teacher');
      } else {
        await loadStudentHub();
        navigate('screen-hub');
      }
    } catch(e) {
      console.error(e);
      showToast('Error loading profile. Please try again.', 'error');
    } finally {
      hideLoading();
    }
  } else {
    State.user = null;
    navigate('screen-login');
    hideLoading();
  }
});

// Login form submit
$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('login-email').value.trim();
  const pass  = $('login-password').value;
  $('login-error').textContent = '';
  showLoading('Signing in…');
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch(e) {
    hideLoading();
    $('login-error').textContent = friendlyAuthError(e.code);
  }
});

function friendlyAuthError(code) {
  const map = {
    'auth/user-not-found':   'No account found with that email.',
    'auth/wrong-password':   'Incorrect password. Please try again.',
    'auth/invalid-email':    'Please enter a valid email address.',
    'auth/too-many-requests':'Too many attempts. Please wait a moment.',
    'auth/network-request-failed': 'No internet connection.',
  };
  return map[code] || 'Login failed. Please check your details.';
}

// Logout
function logout() {
  auth.signOut();
}

// ════════════════════════════════════════════════════════════
// DATABASE HELPERS
// ════════════════════════════════════════════════════════════
const DB = {
  async getSections() {
    const snap = await db.collection('sections').orderBy('order').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async getLessons(sectionId) {
    const snap = await db.collection('lessons')
      .where('sectionId', '==', sectionId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  async getActivities(lessonId) {
    const snap = await db.collection('activities')
      .where('lessonId', '==', lessonId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  async getCards(activityId) {
    const snap = await db.collection('cards')
      .where('activityId', '==', activityId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  async getMatchingItems(activityId) {
    const snap = await db.collection('matchingItems')
      .where('activityId', '==', activityId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async getProgress(studentId) {
    const snap = await db.collection('studentProgress').doc(studentId)
      .collection('cards').get();
    const map = {};
    snap.docs.forEach(d => { map[d.id] = d.data(); });
    return map;
  },
  async setCardProgress(studentId, cardId, difficulty) {
    await db.collection('studentProgress').doc(studentId)
      .collection('cards').doc(cardId).set({
        difficulty,
        reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
  },
  async setActivityComplete(studentId, activityId) {
    await db.collection('studentProgress').doc(studentId)
      .collection('activities').doc(activityId).set({
        completed: true,
        completedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
  },
  async getActivityProgress(studentId) {
    const snap = await db.collection('studentProgress').doc(studentId)
      .collection('activities').get();
    const map = {};
    snap.docs.forEach(d => { map[d.id] = d.data(); });
    return map;
  },
};

// ════════════════════════════════════════════════════════════
// STORAGE HELPER
// ════════════════════════════════════════════════════════════
async function uploadFile(file, path, onProgress) {
  const ref  = storage.ref(path);
  const task = ref.put(file);
  return new Promise((resolve, reject) => {
    task.on('state_changed',
      snap => onProgress && onProgress(snap.bytesTransferred / snap.totalBytes * 100),
      reject,
      async () => resolve(await ref.getDownloadURL())
    );
  });
}

// ════════════════════════════════════════════════════════════
// DATABASE SEEDING (runs once on first teacher login)
// ════════════════════════════════════════════════════════════
async function seedDatabase() {
  const seedDoc = await db.collection('_meta').doc('seeded').get();
  if (seedDoc.exists) return; // already seeded

  showLoading('Setting up your app for the first time…');
  const batch = db.batch();

  // Create default sections
  DEFAULT_SECTIONS.forEach(sec => {
    batch.set(db.collection('sections').doc(sec.id), {
      name: sec.name, icon: sec.icon,
      colorClass: sec.colorClass, order: sec.order,
      prerequisite: sec.prerequisite || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });

  // Create default lesson + activity for civics
  const civicsLessonId = 'lesson-civics-100';
  batch.set(db.collection('lessons').doc(civicsLessonId), {
    sectionId: 'sec-history', name: '100 Civics Questions',
    order: 1, description: 'All 100 official USCIS civics questions',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  const civicsActId = 'act-civics-matching';
  batch.set(db.collection('activities').doc(civicsActId), {
    lessonId: civicsLessonId, sectionId: 'sec-history',
    type: 'matching', name: 'Civics Question Matching',
    order: 1,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  CIVICS_QUESTIONS.forEach(cq => {
    batch.set(db.collection('matchingItems').doc('civics-' + cq.id), {
      activityId: civicsActId,
      standardQuestion: cq.q,
      standardAnswer: cq.a,
      category: cq.cat,
      audioUrl: '',
      variations: []
    });
  });

  // Create default lesson + activity for N-400
  const n400LessonId = 'lesson-n400-main';
  batch.set(db.collection('lessons').doc(n400LessonId), {
    sectionId: 'sec-n400', name: 'N-400 Interview Questions',
    order: 1, description: 'Standard N-400 naturalization interview questions',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  const n400ActId = 'act-n400-matching';
  batch.set(db.collection('activities').doc(n400ActId), {
    lessonId: n400LessonId, sectionId: 'sec-n400',
    type: 'matching', name: 'N-400 Question Matching',
    order: 1,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  N400_QUESTIONS.forEach(nq => {
    batch.set(db.collection('matchingItems').doc('n400-' + nq.id), {
      activityId: n400ActId,
      standardQuestion: nq.q,
      category: nq.cat,
      audioUrl: '',
      variations: []
    });
  });

  // Create Following Instructions lesson
  const fiLessonId = 'lesson-following-instructions';
  batch.set(db.collection('lessons').doc(fiLessonId), {
    sectionId: 'sec-follow', name: 'Oral Commands',
    order: 1, description: 'Instructions the interviewer may give',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  const fiActId = 'act-following-flashcards';
  batch.set(db.collection('activities').doc(fiActId), {
    lessonId: fiLessonId, sectionId: 'sec-follow',
    type: 'picture-audio', name: 'Instructions Flashcards',
    order: 1,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  FOLLOWING_INSTRUCTIONS.forEach((fi, i) => {
    batch.set(db.collection('cards').doc('fi-' + fi.id), {
      activityId: fiActId, lessonId: fiLessonId, sectionId: 'sec-follow',
      type: 'picture-audio', order: i + 1,
      english: fi.english, russian: fi.russian,
      imageUrl: fi.imageUrl, audioUrl: fi.audioUrl, maxPlays: 3,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });

  batch.set(db.collection('_meta').doc('seeded'), {
    seededAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  await batch.commit();
  hideLoading();
}

// ════════════════════════════════════════════════════════════
// STUDENT HUB
// ════════════════════════════════════════════════════════════
async function loadStudentHub() {
  const sections = await DB.getSections();
  State.sections  = sections;
  const progSnap  = await db.collection('studentProgress').doc(State.user.uid)
    .collection('activities').get();
  const actDone = {};
  progSnap.docs.forEach(d => { if (d.data().completed) actDone[d.id] = true; });

  // Compute section progress per section
  const sectionUnlocked = {};
  for (const sec of sections) {
    const prereq = sec.prerequisite;
    if (!prereq) { sectionUnlocked[sec.id] = true; continue; }
    // Section unlocked if ALL activities in prerequisite section are complete
    const lessons = await DB.getLessons(prereq);
    let allDone = lessons.length > 0;
    for (const l of lessons) {
      const acts = await DB.getActivities(l.id);
      if (acts.some(a => !actDone[a.id])) { allDone = false; break; }
    }
    sectionUnlocked[sec.id] = allDone;
  }

  // Render hub header
  $('hub-greeting').textContent = `Hello, ${State.user.displayName || 'Student'} 👋`;

  // Render section grid
  const grid = $('section-grid');
  grid.innerHTML = '';
  for (const sec of sections) {
    const locked = !sectionUnlocked[sec.id];
    // Calculate progress %
    const lessons = await DB.getLessons(sec.id);
    let totalActs = 0, doneActs = 0;
    for (const l of lessons) {
      const acts = await DB.getActivities(l.id);
      totalActs += acts.length;
      doneActs  += acts.filter(a => actDone[a.id]).length;
    }
    const pct = totalActs > 0 ? Math.round((doneActs / totalActs) * 100) : 0;

    const card = document.createElement('button');
    card.className = `section-card ${sec.colorClass} ${locked ? 'locked' : ''}`;
    card.innerHTML = `
      <span class="section-card-icon">${sec.icon}</span>
      <div>
        <div class="section-card-name">${sec.name}</div>
        <div class="section-card-sub">${doneActs}/${totalActs} activities</div>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${pct}%"></div>
      </div>`;
    if (!locked) {
      card.addEventListener('click', () => openSection(sec));
    }
    grid.appendChild(card);
  }
}

// ── Open Section ─────────────────────────────────────────────
async function openSection(sec) {
  State.currentSection = sec;
  $('section-band').style.background = sectionGradient(sec.colorClass);
  $('section-band-icon').textContent  = sec.icon;
  $('section-name-title').textContent = sec.name;

  showLoading();
  const lessons = await DB.getLessons(sec.id);
  const actDoneMap = await DB.getActivityProgress(State.user.uid);

  const list = $('lesson-list');
  list.innerHTML = '';
  if (lessons.length === 0) {
    list.innerHTML = '<p class="text-muted text-center mt-24">No lessons yet. Your teacher will add them soon!</p>';
  }
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const acts   = await DB.getActivities(lesson.id);
    const done   = acts.filter(a => actDoneMap[a.id]?.completed).length;
    const total  = acts.length;
    const completed = done === total && total > 0;
    // Lock if previous lesson not complete
    const locked = i > 0 && !isLessonComplete(lessons[i-1], actDoneMap);

    const item = document.createElement('div');
    item.className = `lesson-item ${locked ? 'locked' : ''} ${completed ? 'completed' : ''}`;
    item.innerHTML = `
      <div class="lesson-item-icon" style="background:${sectionColor(sec.colorClass)}20;color:${sectionColor(sec.colorClass)}">
        ${completed ? '✅' : locked ? '🔒' : sec.icon}
      </div>
      <div class="lesson-item-info">
        <div class="lesson-item-name">${lesson.name}</div>
        <div class="lesson-item-sub">${done}/${total} activities complete</div>
        <div class="progress-bar-wrap mt-8">
          <div class="progress-bar-fill" style="width:${total>0?Math.round(done/total*100):0}%"></div>
        </div>
      </div>
      <span class="lesson-item-arrow">${locked ? '' : '›'}</span>`;
    if (!locked) item.addEventListener('click', () => openLesson(lesson));
    list.appendChild(item);
  }
  hideLoading();
  navigate('screen-section');
}

function isLessonComplete(lesson, actDoneMap) {
  // Simplified: stored in progress
  return actDoneMap[lesson.id + '-lesson']?.completed || false;
}

// ── Open Lesson ──────────────────────────────────────────────
async function openLesson(lesson) {
  State.currentLesson = lesson;
  $('lesson-title').textContent = lesson.name;

  showLoading();
  const activities = await DB.getActivities(lesson.id);
  const actDoneMap = await DB.getActivityProgress(State.user.uid);

  const list = $('activity-list');
  list.innerHTML = '';
  if (activities.length === 0) {
    list.innerHTML = '<p class="text-muted text-center mt-24">No activities yet.</p>';
  }
  activities.forEach((act, i) => {
    const completed = actDoneMap[act.id]?.completed;
    const locked    = i > 0 && !actDoneMap[activities[i-1].id]?.completed;
    const icon      = actTypeIcon(act.type);

    const item = document.createElement('div');
    item.className = `activity-item ${locked ? 'locked' : ''} ${completed ? 'completed' : ''}`;
    item.innerHTML = `
      <div class="activity-type-icon">${locked ? '🔒' : completed ? '✅' : icon}</div>
      <div class="activity-info">
        <div class="activity-name">${act.name}</div>
        <div class="activity-desc">${actTypeLabel(act.type)}</div>
      </div>
      <span class="lesson-item-arrow">${locked ? '' : '›'}</span>`;
    if (!locked) item.addEventListener('click', () => startActivity(act));
    list.appendChild(item);
  });
  hideLoading();
  navigate('screen-lesson');
}

function actTypeIcon(type) {
  const map = {
    'picture-audio': '🖼️', 'audio-question': '🎧', 'dictation': '✏️',
    'reading': '📖', 'vocabulary': '🔤', 'matching': '🔗', 'recording': '🎙️'
  };
  return map[type] || '📚';
}
function actTypeLabel(type) {
  const map = {
    'picture-audio': 'Picture + Audio Flashcards',
    'audio-question': 'Listen & Flip Flashcards',
    'dictation': 'Dictation Flashcards',
    'reading': 'Reading Flashcards',
    'vocabulary': 'Vocabulary Flashcards',
    'matching': 'Matching Exercise',
    'recording': 'Speaking & Recording'
  };
  return map[type] || 'Activity';
}

// ════════════════════════════════════════════════════════════
// ACTIVITY ROUTER — start the right activity type
// ════════════════════════════════════════════════════════════
async function startActivity(activity) {
  State.currentActivity = activity;
  showLoading('Loading activity…');
  try {
    if (activity.type === 'matching') {
      await startMatchingExercise(activity);
    } else if (activity.type === 'recording') {
      await startRecordingExercise(activity);
    } else {
      await startFlashcards(activity);
    }
  } catch(e) {
    console.error(e);
    showToast('Error loading activity.', 'error');
  } finally {
    hideLoading();
  }
}

// ════════════════════════════════════════════════════════════
// SPACED REPETITION (SRS)
// ════════════════════════════════════════════════════════════
// Hard cards appear every 3 positions; easy cards every 8.
function buildCardQueue(cards, progressMap) {
  const hard = [], easy = [], unseen = [];
  cards.forEach(c => {
    const p = progressMap[c.id];
    if (!p)                      unseen.push(c);
    else if (p.difficulty === 'easy') easy.push(c);
    else                         hard.push(c);
  });
  // Interleave: unseen first, then hard repeated more often, then easy
  const queue = [];
  const allToShow = [...unseen, ...hard, ...easy];
  allToShow.forEach((c, i) => {
    queue.push(c);
    const prog = progressMap[c.id];
    // Re-insert hard cards at interval 3
    if (prog?.difficulty === 'hard' && i < allToShow.length - 1) {
      const reinsertAt = Math.min(i + 3, allToShow.length);
      queue.splice(reinsertAt, 0, { ...c, _reinserted: true });
    }
  });
  return queue;
}

// ════════════════════════════════════════════════════════════
// FLASHCARD ENGINE
// ════════════════════════════════════════════════════════════
async function startFlashcards(activity) {
  const cards       = await DB.getCards(activity.id);
  const progressMap = await DB.getProgress(State.user.uid);
  if (cards.length === 0) {
    showToast('No cards in this activity yet.', 'error'); return;
  }
  State.cardQueue = buildCardQueue(cards, progressMap);
  State.cardIndex = 0;
  renderCard();
  navigate('screen-activity');
}

function renderCard() {
  const card  = State.cardQueue[State.cardIndex];
  const total = State.cardQueue.filter(c => !c._reinserted).length;
  const pos   = Math.min(State.cardIndex + 1, total);

  // Reset state
  State.audioPlays = 0;
  const inner = $('flashcard-inner');
  inner.classList.remove('flipped');

  // Progress
  $('card-progress-text').textContent = `${pos} / ${total}`;
  $('card-progress-fill').style.width = `${(pos / total) * 100}%`;

  // Activity type title
  $('activity-type-label').textContent = actTypeLabel(State.currentActivity.type);

  // Show/hide sections based on card type
  const type = card.type || State.currentActivity.type;
  renderCardFace(card, type);
  renderCardBack(card, type);

  // Hide difficulty buttons until flipped
  $('difficulty-btns').classList.add('hidden');
  $('flip-btn').classList.remove('hidden');
}

function renderCardFace(card, type) {
  const face = $('card-front-content');
  face.innerHTML = '';

  if (type === 'picture-audio') {
    if (card.imageUrl) {
      const img = document.createElement('img');
      img.src = card.imageUrl;
      img.className = 'card-image';
      img.alt = card.english;
      face.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.style.cssText = 'font-size:80px;margin-bottom:12px;';
      ph.textContent = '🖼️';
      face.appendChild(ph);
    }
    face.appendChild(makeAudioBtn(card.audioUrl, 3));
    face.appendChild(makePlaysLeft(3));

  } else if (type === 'audio-question') {
    const label = document.createElement('p');
    label.style.cssText = 'font-size:18px;color:#7F8C8D;margin-bottom:16px;';
    label.textContent   = '🎧 Listen to the question:';
    face.appendChild(label);
    face.appendChild(makeAudioBtn(card.audioUrl, 99));

  } else if (type === 'dictation') {
    const label = document.createElement('p');
    label.style.cssText = 'font-size:18px;color:#7F8C8D;margin-bottom:16px;';
    label.textContent   = '🎧 Listen, then write what you hear:';
    face.appendChild(label);
    face.appendChild(makeAudioBtn(card.audioUrl, 3));
    face.appendChild(makePlaysLeft(3));
    const note = document.createElement('p');
    note.style.cssText  = 'font-size:15px;color:#95A5A6;margin-top:12px;';
    note.textContent    = 'Write the sentence on paper, then flip to check.';
    face.appendChild(note);

  } else if (type === 'reading') {
    const txt = document.createElement('p');
    txt.className = 'card-english';
    txt.textContent = card.frontText || card.english || '';
    face.appendChild(txt);
    const hint = document.createElement('p');
    hint.style.cssText = 'font-size:16px;color:#7F8C8D;margin-top:12px;';
    hint.textContent   = '📖 Read this sentence aloud, then flip to hear the audio.';
    face.appendChild(hint);

  } else if (type === 'vocabulary') {
    const txt = document.createElement('p');
    txt.className   = 'card-english';
    txt.textContent = card.frontText || card.english || '';
    face.appendChild(txt);

  } else {
    // fallback
    const txt = document.createElement('p');
    txt.className   = 'card-english';
    txt.textContent = card.frontText || card.english || '';
    face.appendChild(txt);
  }
}

function renderCardBack(card, type) {
  const back = $('card-back-content');
  back.innerHTML = '';

  if (type === 'picture-audio') {
    const eng = document.createElement('p');
    eng.className = 'card-english';
    eng.textContent = card.english || card.backText || '';
    back.appendChild(eng);
    if (card.russian) {
      const rus = document.createElement('p');
      rus.className = 'card-russian';
      rus.textContent = card.russian || '';
      back.appendChild(rus);
    }

  } else if (type === 'audio-question') {
    const q = document.createElement('p');
    q.className = 'card-english';
    q.textContent = card.frontText || card.english || '';
    back.appendChild(q);
    if (card.russian) {
      const rus = document.createElement('p');
      rus.className = 'card-russian';
      rus.textContent = card.russian || '';
      back.appendChild(rus);
    }

  } else if (type === 'dictation') {
    const label = document.createElement('p');
    label.style.cssText = 'font-size:16px;color:#7F8C8D;margin-bottom:12px;';
    label.textContent   = '✅ Check your answer:';
    back.appendChild(label);
    const txt = document.createElement('p');
    txt.className   = 'card-english';
    txt.textContent = card.backText || card.english || '';
    back.appendChild(txt);
    if (card.russian) {
      const rus = document.createElement('p');
      rus.className = 'card-russian';
      rus.textContent = card.russian || '';
      back.appendChild(rus);
    }

  } else if (type === 'reading') {
    const label = document.createElement('p');
    label.style.cssText = 'font-size:16px;color:#7F8C8D;margin-bottom:12px;';
    label.textContent   = '🎧 Now listen to the correct pronunciation:';
    back.appendChild(label);
    back.appendChild(makeAudioBtn(card.audioUrl, 99));
    if (card.russian) {
      const rus = document.createElement('p');
      rus.className   = 'card-russian';
      rus.style.marginTop = '16px';
      rus.textContent = card.russian || '';
      back.appendChild(rus);
    }

  } else if (type === 'vocabulary') {
    const eng = document.createElement('p');
    eng.className   = 'card-english';
    eng.textContent = card.backText || '';
    back.appendChild(eng);
    if (card.russian) {
      const rus = document.createElement('p');
      rus.className = 'card-russian';
      rus.textContent = card.russian || '';
      back.appendChild(rus);
    }
    if (card.sampleSentence) {
      const ss = document.createElement('p');
      ss.style.cssText = 'font-size:16px;color:#7F8C8D;margin-top:14px;font-style:italic;';
      ss.textContent = '"' + card.sampleSentence + '"';
      back.appendChild(ss);
    }

  } else {
    const txt = document.createElement('p');
    txt.className   = 'card-english';
    txt.textContent = card.backText || card.english || '';
    back.appendChild(txt);
    if (card.russian) {
      const rus = document.createElement('p');
      rus.className = 'card-russian';
      rus.textContent = card.russian || '';
      back.appendChild(rus);
    }
  }
}

function makeAudioBtn(url, maxPlays) {
  const btn = document.createElement('button');
  btn.className   = 'audio-btn';
  btn.id          = 'audio-play-btn-' + Date.now();
  btn.innerHTML   = '▶️ Play Audio';
  if (!url) {
    btn.disabled = true;
    btn.title    = 'No audio added yet';
    return btn;
  }
  let plays = 0;
  btn.addEventListener('click', () => {
    if (plays >= maxPlays) return;
    plays++;
    State.audioPlays = plays;
    if (plays >= maxPlays) btn.disabled = true;
    const playsEl = btn.parentElement.querySelector('.audio-plays-left');
    if (playsEl) playsEl.textContent = `${maxPlays - plays} plays left`;
    const aud = new Audio(url);
    btn.classList.add('playing');
    btn.innerHTML = '🔊 Playing…';
    aud.play();
    aud.onended = () => {
      btn.classList.remove('playing');
      btn.innerHTML = plays >= maxPlays ? '🔇 No plays left' : '▶️ Play Audio';
    };
  });
  return btn;
}

function makePlaysLeft(max) {
  const p = document.createElement('p');
  p.className   = 'audio-plays-left';
  p.textContent = `${max} plays left`;
  return p;
}

// Flip card
$('flip-btn').addEventListener('click', () => {
  $('flashcard-inner').classList.add('flipped');
  $('flip-btn').classList.add('hidden');
  $('difficulty-btns').classList.remove('hidden');
});

// Easy / Hard buttons
$('btn-easy').addEventListener('click', () => markCard('easy'));
$('btn-hard').addEventListener('click', () => markCard('hard'));

async function markCard(difficulty) {
  const card = State.cardQueue[State.cardIndex];
  if (!card._reinserted) {
    await DB.setCardProgress(State.user.uid, card.id, difficulty);
  }
  nextCard();
}

async function nextCard() {
  State.cardIndex++;
  if (State.cardIndex >= State.cardQueue.length) {
    await checkActivityCompletion();
  } else {
    renderCard();
  }
}

async function checkActivityCompletion() {
  const act   = State.currentActivity;
  const cards = await DB.getCards(act.id);
  const prog  = await DB.getProgress(State.user.uid);
  const allEasy = cards.every(c => prog[c.id]?.difficulty === 'easy');

  if (allEasy) {
    await DB.setActivityComplete(State.user.uid, act.id);
    showCompletionScreen();
  } else {
    // Not all easy yet — restart queue with hard cards prioritised
    State.cardQueue = buildCardQueue(cards, prog);
    State.cardIndex = 0;
    showToast('Keep going! Mark all cards Easy to complete this activity.', '', 4000);
    renderCard();
  }
}

function showCompletionScreen() {
  navigate('screen-completion');
}

// ════════════════════════════════════════════════════════════
// MATCHING EXERCISE
// ════════════════════════════════════════════════════════════
let matchItems   = [];
let matchIndex   = 0;
let matchTries   = 0;
const MAX_TRIES  = 3;

async function startMatchingExercise(activity) {
  const items = await DB.getMatchingItems(activity.id);
  // Only show items that have at least one variation with audio OR the standard question has audio
  const playable = items.filter(it => it.audioUrl || (it.variations && it.variations.some(v => v.audioUrl)));
  if (playable.length === 0) {
    showToast('No audio added to this matching exercise yet. Ask your teacher!', 'error');
    return;
  }
  matchItems  = shuffle([...playable]);
  matchIndex  = 0;
  renderMatchRound();
  navigate('screen-matching');
}

function renderMatchRound() {
  const item = matchItems[matchIndex];
  matchTries = 0;

  $('match-progress-text').textContent = `${matchIndex + 1} / ${matchItems.length}`;
  $('match-progress-fill').style.width = `${((matchIndex + 1) / matchItems.length) * 100}%`;
  $('match-tries').textContent         = '';
  $('match-activity-name').textContent = State.currentActivity.name;

  // Pick the audio to play — a random variation, or the standard question audio
  const variations = (item.variations || []).filter(v => v.audioUrl);
  const playItem   = variations.length > 0 ? variations[Math.floor(Math.random() * variations.length)] : item;
  const audioUrl   = playItem.audioUrl || item.audioUrl || '';

  // Listen button
  const listenBtn = $('match-listen-btn');
  listenBtn.onclick = () => {
    if (!audioUrl) { showToast('No audio yet — ask your teacher to add it.', 'error'); return; }
    listenBtn.classList.add('playing');
    listenBtn.textContent = '🔊 Playing…';
    const aud = new Audio(audioUrl);
    aud.play();
    aud.onended = () => {
      listenBtn.classList.remove('playing');
      listenBtn.textContent = '▶️ Play Question';
    };
  };

  // Build answer options — take up to 4 items including the correct one
  const distractors = matchItems.filter((_, i) => i !== matchIndex);
  const options = shuffle([item, ...distractors.slice(0, 3)]);

  const container = $('match-options');
  container.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className   = 'matching-option';
    btn.textContent = opt.standardQuestion;
    btn.dataset.id  = opt.id;
    btn.addEventListener('click', () => handleMatchAnswer(btn, item.id));
    container.appendChild(btn);
  });
}

function handleMatchAnswer(btn, correctId) {
  const isCorrect = btn.dataset.id === correctId;
  if (isCorrect) {
    btn.classList.add('correct');
    playFeedbackSound(true);
    setTimeout(() => advanceMatch(), 1200);
  } else {
    matchTries++;
    btn.classList.add('wrong');
    playFeedbackSound(false);
    setTimeout(() => btn.classList.remove('wrong'), 800);
    if (matchTries >= MAX_TRIES) {
      // Reveal correct answer
      $('match-tries').textContent = '✅ Correct answer shown below.';
      document.querySelectorAll('.matching-option').forEach(b => {
        if (b.dataset.id === correctId) b.classList.add('correct');
        b.style.pointerEvents = 'none';
      });
      setTimeout(() => advanceMatch(), 2000);
    } else {
      $('match-tries').textContent = `❌ Try again! ${MAX_TRIES - matchTries} attempt${MAX_TRIES - matchTries > 1 ? 's' : ''} left.`;
    }
  }
}

async function advanceMatch() {
  matchIndex++;
  if (matchIndex >= matchItems.length) {
    await DB.setActivityComplete(State.user.uid, State.currentActivity.id);
    showCompletionScreen();
  } else {
    renderMatchRound();
  }
}

// ════════════════════════════════════════════════════════════
// RECORDING EXERCISE
// ════════════════════════════════════════════════════════════
let recCards = [], recIndex = 0;

async function startRecordingExercise(activity) {
  const cards = await DB.getCards(activity.id);
  if (cards.length === 0) {
    showToast('No cards in this activity yet.', 'error'); return;
  }
  recCards  = cards;
  recIndex  = 0;
  renderRecordingCard();
  navigate('screen-recording');
}

function renderRecordingCard() {
  const card = recCards[recIndex];
  State.recordedBlob    = null;
  State.teacherAudioUrl = card.audioUrl || '';

  $('rec-progress-text').textContent = `${recIndex + 1} / ${recCards.length}`;
  $('rec-progress-fill').style.width = `${((recIndex + 1) / recCards.length) * 100}%`;
  $('rec-sentence').textContent       = card.frontText || card.english || '';
  $('rec-play-mine').disabled         = true;
  $('rec-play-teacher').disabled      = !card.audioUrl;
  $('rec-next').disabled              = recIndex >= recCards.length - 1;
  $('rec-label').textContent          = '⏺ Tap to Record';

  const recBtn = $('rec-btn');
  recBtn.classList.remove('recording');

  // Stop any existing recorder
  if (State.recorder && State.recorder.state !== 'inactive') {
    State.recorder.stop();
  }
  State.recorder = null;
}

// Record button
$('rec-btn').addEventListener('click', async () => {
  if (State.recorder && State.recorder.state === 'recording') {
    // Stop recording
    State.recorder.stop();
    $('rec-btn').classList.remove('recording');
    $('rec-label').textContent = '⏺ Tap to Record Again';
  } else {
    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      State.recorder = new MediaRecorder(stream);
      State.recorder.ondataavailable = e => chunks.push(e.data);
      State.recorder.onstop = () => {
        State.recordedBlob = new Blob(chunks, { type: 'audio/webm' });
        $('rec-play-mine').disabled = false;
        stream.getTracks().forEach(t => t.stop());
      };
      State.recorder.start();
      $('rec-btn').classList.add('recording');
      $('rec-label').textContent = '⏹ Tap to Stop';
    } catch(e) {
      showToast('Microphone access denied. Please allow microphone in Settings.', 'error');
    }
  }
});

// Play my recording
$('rec-play-mine').addEventListener('click', () => {
  if (!State.recordedBlob) return;
  const url = URL.createObjectURL(State.recordedBlob);
  new Audio(url).play();
});

// Play teacher's audio
$('rec-play-teacher').addEventListener('click', () => {
  if (!State.teacherAudioUrl) return;
  new Audio(State.teacherAudioUrl).play();
});

// Next card in recording exercise
$('rec-next').addEventListener('click', async () => {
  recIndex++;
  if (recIndex >= recCards.length) {
    await DB.setActivityComplete(State.user.uid, State.currentActivity.id);
    showCompletionScreen();
  } else {
    renderRecordingCard();
  }
});

// ════════════════════════════════════════════════════════════
// AUDIO FEEDBACK SOUNDS (generated via Web Audio API)
// ════════════════════════════════════════════════════════════
function playFeedbackSound(correct) {
  const ctx  = new (window.AudioContext || window.webkitAudioContext)();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  if (correct) {
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  } else {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(); osc.stop(ctx.currentTime + 0.35);
  }
}

// ════════════════════════════════════════════════════════════
// COMPLETION SCREEN
// ════════════════════════════════════════════════════════════
$('completion-continue').addEventListener('click', async () => {
  // Reload lesson screen with updated progress
  await openLesson(State.currentLesson);
});
$('completion-hub').addEventListener('click', async () => {
  showLoading();
  await loadStudentHub();
  navigate('screen-hub');
  hideLoading();
});

// ════════════════════════════════════════════════════════════
// BACK NAVIGATION
// ════════════════════════════════════════════════════════════
$('back-to-hub').addEventListener('click', async () => {
  showLoading(); await loadStudentHub(); navigate('screen-hub'); hideLoading();
});
$('back-to-section').addEventListener('click', () => openSection(State.currentSection));
$('back-to-lesson-from-activity').addEventListener('click', () => openLesson(State.currentLesson));
$('back-to-lesson-from-match').addEventListener('click', () => openLesson(State.currentLesson));
$('back-to-lesson-from-rec').addEventListener('click', () => openLesson(State.currentLesson));
$('hub-logout-btn').addEventListener('click', logout);

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sectionGradient(colorClass) {
  const map = {
    'sc-follow':  'linear-gradient(135deg,#4A90D9,#2471A3)',
    'sc-n400':    'linear-gradient(135deg,#9B59B6,#6C3483)',
    'sc-reading': 'linear-gradient(135deg,#2ECC71,#1A8A4A)',
    'sc-writing': 'linear-gradient(135deg,#E67E22,#A04000)',
    'sc-vocread': 'linear-gradient(135deg,#E74C3C,#922B21)',
    'sc-vocwrite':'linear-gradient(135deg,#F39C12,#9A6109)',
    'sc-vocn400': 'linear-gradient(135deg,#1ABC9C,#0E6655)',
    'sc-history': 'linear-gradient(135deg,#3498DB,#1A5276)',
  };
  return map[colorClass] || 'linear-gradient(135deg,#7F8C8D,#515A5A)';
}

function sectionColor(colorClass) {
  const map = {
    'sc-follow':'#4A90D9','sc-n400':'#9B59B6','sc-reading':'#27AE60',
    'sc-writing':'#E67E22','sc-vocread':'#E74C3C','sc-vocwrite':'#F39C12',
    'sc-vocn400':'#16A085','sc-history':'#3498DB',
  };
  return map[colorClass] || '#7F8C8D';
}

// ════════════════════════════════════════════════════════════
// SERVICE WORKER REGISTRATION
// ════════════════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(console.error);
}
