// ============================================================
// teacher.js — Teacher Panel Logic
// US Citizenship Study App
// ============================================================
// Covers: Teacher dashboard, manage sections/lessons/cards,
//         manage matching exercises, upload audio & images,
//         view student progress, seed database.
// ============================================================

// ════════════════════════════════════════════════════════════
// TEACHER PANEL — LOAD
// ════════════════════════════════════════════════════════════
async function loadTeacherPanel() {
  await seedDatabase(); // seeds only if not already done
  $('teacher-name').textContent = State.user.displayName || State.user.email;
  showTeacherPanel('panel-sections');
  await renderSectionsPanel();
}

function showTeacherPanel(panelId) {
  document.querySelectorAll('.teacher-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.teacher-nav-btn').forEach(b => b.classList.remove('active'));
  const panel = $(panelId);
  if (panel) panel.classList.add('active');
  const btn = document.querySelector(`[data-panel="${panelId}"]`);
  if (btn) btn.classList.add('active');
}

// Teacher nav buttons
document.querySelectorAll('.teacher-nav-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const panelId = btn.dataset.panel;
    showTeacherPanel(panelId);
    if (panelId === 'panel-sections')  await renderSectionsPanel();
    if (panelId === 'panel-lessons')   await renderLessonsPanel();
    if (panelId === 'panel-cards')     await renderCardsPanel();
    if (panelId === 'panel-matching')  await renderMatchingPanel();
    if (panelId === 'panel-students')  await renderStudentsPanel();
    if (panelId === 'panel-account')   renderAccountPanel();
  });
});

$('teacher-logout-btn').addEventListener('click', logout);

// ════════════════════════════════════════════════════════════
// PANEL: SECTIONS
// ════════════════════════════════════════════════════════════
async function renderSectionsPanel() {
  const sections = await DB.getSections();
  const tbody    = $('sections-tbody');
  tbody.innerHTML = '';
  sections.forEach(sec => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sec.icon}</td>
      <td><strong>${sec.name}</strong></td>
      <td><span class="badge badge-muted">${sec.colorClass}</span></td>
      <td>${sec.order}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editSection('${sec.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" style="margin-left:8px" onclick="deleteSection('${sec.id}','${sec.name}')">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

$('add-section-btn').addEventListener('click', () => {
  openModal('Add New Section', buildSectionForm(null), async (data) => {
    await db.collection('sections').add({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('Section added!', 'success');
    await renderSectionsPanel();
  });
});

async function editSection(id) {
  const snap = await db.collection('sections').doc(id).get();
  const sec  = snap.data();
  openModal('Edit Section', buildSectionForm(sec), async (data) => {
    await db.collection('sections').doc(id).update(data);
    showToast('Section updated!', 'success');
    await renderSectionsPanel();
  });
}

async function deleteSection(id, name) {
  if (!confirm(`Delete section "${name}"? This cannot be undone.`)) return;
  await db.collection('sections').doc(id).delete();
  showToast('Section deleted.', '');
  await renderSectionsPanel();
}

function buildSectionForm(sec) {
  const colorOptions = [
    'sc-follow','sc-n400','sc-reading','sc-writing',
    'sc-vocread','sc-vocwrite','sc-vocn400','sc-history','sc-custom'
  ].map(c => `<option value="${c}" ${sec?.colorClass===c?'selected':''}>${c}</option>`).join('');

  return `
    <div class="teacher-form">
      <div class="form-group">
        <label>Section Name</label>
        <input id="sf-name" type="text" value="${sec?.name||''}" placeholder="e.g. English — Speaking" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Icon (emoji)</label>
          <input id="sf-icon" type="text" value="${sec?.icon||'📚'}" maxlength="4">
        </div>
        <div class="form-group">
          <label>Order (number)</label>
          <input id="sf-order" type="number" value="${sec?.order||9}" min="1">
        </div>
      </div>
      <div class="form-group">
        <label>Colour Theme</label>
        <select id="sf-color">${colorOptions}</select>
      </div>
      <div class="form-group">
        <label>Prerequisite Section ID (or leave blank)</label>
        <input id="sf-prereq" type="text" value="${sec?.prerequisite||''}" placeholder="e.g. sec-follow">
      </div>
    </div>`;
}

// ════════════════════════════════════════════════════════════
// PANEL: LESSONS
// ════════════════════════════════════════════════════════════
let selectedSectionForLessons = null;

async function renderLessonsPanel() {
  const sections = await DB.getSections();
  const sel      = $('lesson-section-select');
  sel.innerHTML  = '<option value="">— Choose a section —</option>';
  sections.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id; opt.textContent = s.name;
    sel.appendChild(opt);
  });
  $('lessons-tbody').innerHTML = '<tr><td colspan="4" class="text-muted">Select a section above.</td></tr>';
}

$('lesson-section-select').addEventListener('change', async function() {
  selectedSectionForLessons = this.value;
  if (!selectedSectionForLessons) return;
  await refreshLessonsTable();
});

async function refreshLessonsTable() {
  const lessons = await DB.getLessons(selectedSectionForLessons);
  const tbody   = $('lessons-tbody');
  tbody.innerHTML = '';
  if (lessons.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-muted">No lessons yet.</td></tr>';
    return;
  }
  lessons.forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${l.name}</strong></td>
      <td>${l.description || '—'}</td>
      <td>${l.order}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editLesson('${l.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" style="margin-left:8px" onclick="deleteLesson('${l.id}','${l.name}')">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

$('add-lesson-btn').addEventListener('click', () => {
  if (!selectedSectionForLessons) { showToast('Please select a section first.', 'error'); return; }
  openModal('Add New Lesson', buildLessonForm(null), async (data) => {
    await db.collection('lessons').add({
      ...data, sectionId: selectedSectionForLessons,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('Lesson added!', 'success');
    await refreshLessonsTable();
  });
});

async function editLesson(id) {
  const snap   = await db.collection('lessons').doc(id).get();
  const lesson = snap.data();
  openModal('Edit Lesson', buildLessonForm(lesson), async (data) => {
    await db.collection('lessons').doc(id).update(data);
    showToast('Lesson updated!', 'success');
    await refreshLessonsTable();
  });
}

async function deleteLesson(id, name) {
  if (!confirm(`Delete lesson "${name}"?`)) return;
  await db.collection('lessons').doc(id).delete();
  showToast('Lesson deleted.', '');
  await refreshLessonsTable();
}

function buildLessonForm(lesson) {
  return `
    <div class="teacher-form">
      <div class="form-group">
        <label>Lesson Name</label>
        <input id="lf-name" type="text" value="${lesson?.name||''}" placeholder="e.g. Common Commands" required>
      </div>
      <div class="form-group">
        <label>Description (optional)</label>
        <input id="lf-desc" type="text" value="${lesson?.description||''}" placeholder="Short description">
      </div>
      <div class="form-group">
        <label>Order (number)</label>
        <input id="lf-order" type="number" value="${lesson?.order||1}" min="1">
      </div>
    </div>`;
}

// ════════════════════════════════════════════════════════════
// PANEL: CARDS
// ════════════════════════════════════════════════════════════
let selectedSectionForCards = null;
let selectedLessonForCards  = null;
let selectedActivityForCards = null;

async function renderCardsPanel() {
  const sections = await DB.getSections();
  const secSel   = $('card-section-select');
  secSel.innerHTML = '<option value="">— Choose a section —</option>';
  sections.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id; opt.textContent = s.name;
    secSel.appendChild(opt);
  });
  $('card-lesson-select').innerHTML  = '<option value="">— Choose a lesson —</option>';
  $('card-activity-select').innerHTML = '<option value="">— Choose an activity —</option>';
  $('cards-tbody').innerHTML = '';
}

$('card-section-select').addEventListener('change', async function() {
  selectedSectionForCards = this.value;
  selectedLessonForCards  = null;
  selectedActivityForCards = null;
  const sel = $('card-lesson-select');
  sel.innerHTML = '<option value="">— Choose a lesson —</option>';
  if (!this.value) return;
  const lessons = await DB.getLessons(this.value);
  lessons.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.id; opt.textContent = l.name;
    sel.appendChild(opt);
  });
});

$('card-lesson-select').addEventListener('change', async function() {
  selectedLessonForCards   = this.value;
  selectedActivityForCards = null;
  const sel = $('card-activity-select');
  sel.innerHTML = '<option value="">— Choose an activity —</option>';
  if (!this.value) return;
  const acts = await DB.getActivities(this.value);
  acts.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id; opt.textContent = `${a.name} (${a.type})`;
    sel.appendChild(opt);
  });
});

$('card-activity-select').addEventListener('change', async function() {
  selectedActivityForCards = this.value;
  if (!this.value) return;
  await refreshCardsTable();
});

async function refreshCardsTable() {
  const cards = await DB.getCards(selectedActivityForCards);
  const tbody  = $('cards-tbody');
  tbody.innerHTML = '';
  if (cards.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-muted">No cards yet. Click Add Card below.</td></tr>';
    return;
  }
  cards.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.order}</td>
      <td>${(c.frontText || c.english || '').substring(0,60)}…</td>
      <td><span class="badge badge-muted">${c.type}</span></td>
      <td>${c.audioUrl ? '✅ Audio' : '—'}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editCard('${c.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" style="margin-left:8px" onclick="deleteCard('${c.id}')">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

$('add-card-btn').addEventListener('click', async () => {
  if (!selectedActivityForCards) { showToast('Please select an activity first.', 'error'); return; }
  // Get activity type
  const actSnap = await db.collection('activities').doc(selectedActivityForCards).get();
  const actType = actSnap.data().type;
  openModal('Add New Card', await buildCardForm(null, actType), async (data) => {
    const cardData = {
      ...data,
      activityId: selectedActivityForCards,
      lessonId:   selectedLessonForCards,
      sectionId:  selectedSectionForCards,
      createdAt:  firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('cards').add(cardData);
    showToast('Card added!', 'success');
    await refreshCardsTable();
  }, { hasFileUploads: true, actType });
});

async function editCard(id) {
  const snap = await db.collection('cards').doc(id).get();
  const card = { id, ...snap.data() };
  openModal('Edit Card', await buildCardForm(card, card.type), async (data) => {
    await db.collection('cards').doc(id).update(data);
    showToast('Card updated!', 'success');
    await refreshCardsTable();
  }, { hasFileUploads: true, actType: card.type });
}

async function deleteCard(id) {
  if (!confirm('Delete this card?')) return;
  await db.collection('cards').doc(id).delete();
  showToast('Card deleted.', '');
  await refreshCardsTable();
}

async function buildCardForm(card, type) {
  const typeLabel = actTypeLabel(type);
  let fields = `
    <div class="teacher-form">
      <p style="margin-bottom:16px;color:#7F8C8D;font-size:15px;">Card type: <strong>${typeLabel}</strong></p>
      <div class="form-group">
        <label>Order (number)</label>
        <input id="cf-order" type="number" value="${card?.order||1}" min="1">
      </div>`;

  if (type === 'picture-audio') {
    fields += `
      <div class="form-group">
        <label>English Sentence (shown on back)</label>
        <input id="cf-english" type="text" value="${card?.english||''}" placeholder="Raise your right hand.">
      </div>
      <div class="form-group">
        <label>Russian Translation (shown on back)</label>
        <input id="cf-russian" type="text" value="${card?.russian||''}" placeholder="Поднимите правую руку.">
      </div>
      <div class="form-group">
        <label>Picture (shown on front)</label>
        ${buildFileUpload('cf-image', 'image', card?.imageUrl, 'Upload Image')}
      </div>
      <div class="form-group">
        <label>Audio (max 3 plays on front)</label>
        ${buildFileUpload('cf-audio', 'audio', card?.audioUrl, 'Upload Audio')}
      </div>`;

  } else if (type === 'audio-question') {
    fields += `
      <div class="form-group">
        <label>Standard Question Text (shown on back)</label>
        <input id="cf-english" type="text" value="${card?.english||card?.frontText||''}" placeholder="What is your full legal name?">
      </div>
      <div class="form-group">
        <label>Russian Translation (shown on back)</label>
        <input id="cf-russian" type="text" value="${card?.russian||''}" placeholder="Как ваше полное юридическое имя?">
      </div>
      <div class="form-group">
        <label>Audio (the question, played on front)</label>
        ${buildFileUpload('cf-audio', 'audio', card?.audioUrl, 'Upload Audio')}
      </div>`;

  } else if (type === 'dictation') {
    fields += `
      <div class="form-group">
        <label>Sentence to Dictate (shown on back)</label>
        <input id="cf-backtext" type="text" value="${card?.backText||card?.english||''}" placeholder="The President lives in the White House.">
      </div>
      <div class="form-group">
        <label>Russian Translation (optional)</label>
        <input id="cf-russian" type="text" value="${card?.russian||''}" placeholder="Президент живёт в Белом доме.">
      </div>
      <div class="form-group">
        <label>Audio (played on front, max 3 times)</label>
        ${buildFileUpload('cf-audio', 'audio', card?.audioUrl, 'Upload Audio')}
      </div>`;

  } else if (type === 'reading') {
    fields += `
      <div class="form-group">
        <label>Sentence to Read (shown on front)</label>
        <input id="cf-fronttext" type="text" value="${card?.frontText||card?.english||''}" placeholder="The flag has fifty stars.">
      </div>
      <div class="form-group">
        <label>Russian Translation (shown on back)</label>
        <input id="cf-russian" type="text" value="${card?.russian||''}" placeholder="На флаге пятьдесят звёзд.">
      </div>
      <div class="form-group">
        <label>Audio (correct pronunciation, played on back)</label>
        ${buildFileUpload('cf-audio', 'audio', card?.audioUrl, 'Upload Audio')}
      </div>`;

  } else if (type === 'recording') {
    fields += `
      <div class="form-group">
        <label>Sentence (shown to student)</label>
        <input id="cf-fronttext" type="text" value="${card?.frontText||card?.english||''}" placeholder="The United States has fifty states.">
      </div>
      <div class="form-group">
        <label>Teacher's Reference Audio</label>
        ${buildFileUpload('cf-audio', 'audio', card?.audioUrl, 'Upload Audio')}
      </div>`;

  } else {
    // vocabulary
    fields += `
      <div class="form-group">
        <label>Word / Phrase (shown on front)</label>
        <input id="cf-fronttext" type="text" value="${card?.frontText||card?.english||''}" placeholder="amendment">
      </div>
      <div class="form-group">
        <label>Definition / English back</label>
        <input id="cf-backtext" type="text" value="${card?.backText||''}" placeholder="a change or addition to the Constitution">
      </div>
      <div class="form-group">
        <label>Russian Translation</label>
        <input id="cf-russian" type="text" value="${card?.russian||''}" placeholder="поправка">
      </div>
      <div class="form-group">
        <label>Sample Sentence (optional)</label>
        <input id="cf-sample" type="text" value="${card?.sampleSentence||''}" placeholder="The Bill of Rights is an amendment.">
      </div>`;
  }

  fields += '</div>';
  return fields;
}

function buildFileUpload(inputId, fileType, existingUrl, label) {
  const accept = fileType === 'audio' ? 'audio/*' : 'image/*';
  const icon   = fileType === 'audio' ? '🎵' : '🖼️';
  const existingNote = existingUrl ? `<p class="file-name">Current file: <a href="${existingUrl}" target="_blank">View</a></p>` : '';
  return `
    <div class="file-upload-area" onclick="document.getElementById('${inputId}').click()">
      <input type="file" id="${inputId}" accept="${accept}">
      <div class="upload-icon">${icon}</div>
      <p>Click to ${existingUrl ? 'replace' : 'upload'} ${label}</p>
      ${existingNote}
      <div class="upload-progress"><div class="upload-progress-fill" id="${inputId}-progress"></div></div>
    </div>`;
}

// ════════════════════════════════════════════════════════════
// PANEL: MATCHING EXERCISES
// ════════════════════════════════════════════════════════════
let selectedActivityForMatching = null;

async function renderMatchingPanel() {
  const sections = await DB.getSections();
  const secSel   = $('match-section-select');
  secSel.innerHTML = '<option value="">— Choose a section —</option>';
  sections.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id; opt.textContent = s.name;
    secSel.appendChild(opt);
  });
  $('match-activity-select').innerHTML = '<option value="">— Choose an activity —</option>';
  $('matching-items-tbody').innerHTML  = '';
}

$('match-section-select').addEventListener('change', async function() {
  $('match-activity-select').innerHTML = '<option value="">— Choose an activity —</option>';
  if (!this.value) return;
  const lessons = await DB.getLessons(this.value);
  const allActs = [];
  for (const l of lessons) {
    const acts = await DB.getActivities(l.id);
    acts.filter(a => a.type === 'matching').forEach(a => allActs.push({ ...a, lessonName: l.name }));
  }
  allActs.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id; opt.textContent = `${a.lessonName} › ${a.name}`;
    $('match-activity-select').appendChild(opt);
  });
});

$('match-activity-select').addEventListener('change', async function() {
  selectedActivityForMatching = this.value;
  if (!this.value) return;
  await refreshMatchingTable();
});

async function refreshMatchingTable() {
  const items = await DB.getMatchingItems(selectedActivityForMatching);
  const tbody  = $('matching-items-tbody');
  tbody.innerHTML = '';
  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-muted">No items yet.</td></tr>';
    return;
  }
  items.forEach(item => {
    const varCount = (item.variations || []).length;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="max-width:280px;word-break:break-word;">${item.standardQuestion}</td>
      <td>${item.audioUrl ? '✅' : '—'}</td>
      <td>${varCount} variation${varCount !== 1 ? 's' : ''}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editMatchItem('${item.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" style="margin-left:8px" onclick="deleteMatchItem('${item.id}')">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

$('add-match-item-btn').addEventListener('click', () => {
  if (!selectedActivityForMatching) { showToast('Select an activity first.', 'error'); return; }
  openModal('Add Matching Item', buildMatchItemForm(null), async (data) => {
    await db.collection('matchingItems').add({
      ...data, activityId: selectedActivityForMatching,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('Item added!', 'success');
    await refreshMatchingTable();
  }, { isMatchItem: true });
});

async function editMatchItem(id) {
  const snap = await db.collection('matchingItems').doc(id).get();
  const item = { id, ...snap.data() };
  openModal('Edit Matching Item', buildMatchItemForm(item), async (data) => {
    await db.collection('matchingItems').doc(id).update(data);
    showToast('Item updated!', 'success');
    await refreshMatchingTable();
  }, { isMatchItem: true });
}

async function deleteMatchItem(id) {
  if (!confirm('Delete this matching item?')) return;
  await db.collection('matchingItems').doc(id).delete();
  showToast('Item deleted.', '');
  await refreshMatchingTable();
}

function buildMatchItemForm(item) {
  const variations = item?.variations || [];
  const varRows = variations.map((v, i) => buildVariationRow(v.text, v.audioUrl, i)).join('');
  return `
    <div class="teacher-form">
      <div class="form-group">
        <label>Standard Question (the "correct" form)</label>
        <input id="mf-question" type="text" value="${item?.standardQuestion||''}" placeholder="What is your full legal name?">
      </div>
      <div class="form-group">
        <label>Standard Answer (for civics questions)</label>
        <input id="mf-answer" type="text" value="${item?.standardAnswer||''}" placeholder="The Constitution">
      </div>
      <div class="form-group">
        <label>Standard Question Audio</label>
        ${buildFileUpload('mf-audio', 'audio', item?.audioUrl, 'Upload Audio')}
      </div>
      <hr class="divider">
      <div class="form-group">
        <label>Question Variations <small style="color:#7F8C8D">(students hear these and must match to the standard form)</small></label>
        <div class="variation-list" id="variation-list">${varRows}</div>
        <button type="button" class="btn btn-sm btn-outline mt-16" onclick="addVariationRow()">+ Add Variation</button>
      </div>
    </div>`;
}

function buildVariationRow(text, audioUrl, index) {
  return `
    <div class="variation-item" id="var-row-${index}">
      <input type="text" value="${text||''}" placeholder="Variation text..." class="var-text" style="border:1px solid #D5DBE3;border-radius:8px;padding:10px;">
      <button type="button" class="del-btn" onclick="removeVariationRow(${index})">✕</button>
    </div>`;
}

let varRowCount = 0;
function addVariationRow() {
  varRowCount++;
  const list = $('variation-list');
  const div  = document.createElement('div');
  div.innerHTML = buildVariationRow('', '', varRowCount);
  list.appendChild(div.firstElementChild);
}

function removeVariationRow(index) {
  const row = $('var-row-' + index);
  if (row) row.remove();
}

// ════════════════════════════════════════════════════════════
// PANEL: STUDENT PROGRESS
// ════════════════════════════════════════════════════════════
async function renderStudentsPanel() {
  showLoading('Loading student progress…');
  try {
    const usersSnap = await db.collection('users').where('role', '==', 'student').get();
    const students  = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const container = $('students-container');
    container.innerHTML = '';

    if (students.length === 0) {
      container.innerHTML = '<p class="text-muted text-center mt-24">No student accounts yet.</p>';
      return;
    }

    const sections = await DB.getSections();

    for (const student of students) {
      const actProg = await db.collection('studentProgress').doc(student.id)
        .collection('activities').get();
      const doneCount = actProg.docs.filter(d => d.data().completed).length;

      const card = document.createElement('div');
      card.className = 'progress-student-card';
      let sectionRows = '';
      for (const sec of sections) {
        const lessons = await DB.getLessons(sec.id);
        let total = 0, done = 0;
        for (const l of lessons) {
          const acts = await DB.getActivities(l.id);
          total += acts.length;
          acts.forEach(a => { if (actProg.docs.find(d => d.id === a.id && d.data().completed)) done++; });
        }
        sectionRows += `
          <div class="progress-section-row">
            <span>${sec.icon} ${sec.name}</span>
            <span>${done}/${total} done ${done===total&&total>0?'✅':''}</span>
          </div>`;
      }
      card.innerHTML = `
        <div class="progress-student-name">${student.displayName || student.email}</div>
        <p style="font-size:14px;color:#7F8C8D;margin-bottom:12px;">${student.email} · ${doneCount} activities completed</p>
        ${sectionRows}`;
      container.appendChild(card);
    }
  } finally {
    hideLoading();
  }
}

// ════════════════════════════════════════════════════════════
// PANEL: ACCOUNT SETTINGS
// ════════════════════════════════════════════════════════════
function renderAccountPanel() {
  $('account-email').textContent = State.user.email;
}

$('change-password-btn').addEventListener('click', async () => {
  const newPass = $('new-password').value;
  if (newPass.length < 6) { showToast('Password must be at least 6 characters.', 'error'); return; }
  try {
    await auth.currentUser.updatePassword(newPass);
    showToast('Password updated successfully!', 'success');
    $('new-password').value = '';
  } catch(e) {
    if (e.code === 'auth/requires-recent-login') {
      showToast('Please log out and log back in, then change your password.', 'error');
    } else {
      showToast('Error: ' + e.message, 'error');
    }
  }
});

// Add Activity button (inside cards panel)
$('add-activity-btn').addEventListener('click', () => {
  if (!selectedLessonForCards) { showToast('Please select a lesson first.', 'error'); return; }
  const typeOptions = [
    ['picture-audio','🖼️ Picture + Audio'],['audio-question','🎧 Audio Question'],
    ['dictation','✏️ Dictation'],['reading','📖 Reading'],
    ['vocabulary','🔤 Vocabulary'],['matching','🔗 Matching'],['recording','🎙️ Recording']
  ].map(([v,l]) => `<option value="${v}">${l}</option>`).join('');

  openModal('Add New Activity', `
    <div class="teacher-form">
      <div class="form-group"><label>Activity Name</label>
        <input id="af-name" type="text" placeholder="e.g. Unit 1 Dictation"></div>
      <div class="form-group"><label>Type</label>
        <select id="af-type">${typeOptions}</select></div>
      <div class="form-group"><label>Order</label>
        <input id="af-order" type="number" value="1" min="1"></div>
    </div>`, async () => {
    await db.collection('activities').add({
      name:     $('af-name').value,
      type:     $('af-type').value,
      order:    parseInt($('af-order').value),
      lessonId: selectedLessonForCards,
      sectionId: selectedSectionForCards,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('Activity added!', 'success');
    // Refresh activity select
    const actSel = $('card-activity-select');
    actSel.innerHTML = '<option value="">— Choose an activity —</option>';
    const acts = await DB.getActivities(selectedLessonForCards);
    acts.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id; opt.textContent = `${a.name} (${a.type})`;
      actSel.appendChild(opt);
    });
  });
});

// ════════════════════════════════════════════════════════════
// MODAL SYSTEM
// ════════════════════════════════════════════════════════════
let modalSaveCallback = null;
let modalOptions      = {};

function openModal(title, bodyHTML, onSave, options = {}) {
  modalSaveCallback = onSave;
  modalOptions      = options;
  varRowCount       = 0;

  $('modal-title').textContent = title;
  $('modal-body').innerHTML    = bodyHTML;
  $('modal-overlay').classList.remove('hidden');

  // Wire up file inputs
  setTimeout(() => {
    ['cf-image','cf-audio','mf-audio'].forEach(id => {
      const inp = $(id);
      if (!inp) return;
      inp.parentElement.querySelector('p').addEventListener('click', () => inp.click());
      inp.addEventListener('change', function() {
        const fn = this.files[0]?.name || '';
        const area = this.closest('.file-upload-area');
        let fnEl = area.querySelector('.file-name');
        if (!fnEl) { fnEl = document.createElement('p'); fnEl.className = 'file-name'; area.appendChild(fnEl); }
        fnEl.textContent = fn;
      });
    });
  }, 100);
}

$('modal-cancel').addEventListener('click', () => {
  $('modal-overlay').classList.add('hidden');
});

$('modal-save').addEventListener('click', async () => {
  if (!modalSaveCallback) return;
  showLoading('Saving…');
  try {
    const data = await collectModalData();
    await modalSaveCallback(data);
    $('modal-overlay').classList.add('hidden');
  } catch(e) {
    console.error(e);
    showToast('Error saving: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
});

async function collectModalData() {
  const data = {};

  // Generic text inputs — collect by ID prefix
  const fieldMap = {
    'sf-name':'name','sf-icon':'icon','sf-order':'order','sf-color':'colorClass','sf-prereq':'prerequisite',
    'lf-name':'name','lf-desc':'description','lf-order':'order',
    'cf-order':'order','cf-english':'english','cf-russian':'russian',
    'cf-fronttext':'frontText','cf-backtext':'backText','cf-sample':'sampleSentence',
    'mf-question':'standardQuestion','mf-answer':'standardAnswer',
  };
  Object.entries(fieldMap).forEach(([id, key]) => {
    const el = $(id);
    if (!el) return;
    data[key] = el.tagName === 'SELECT' ? el.value : (el.type === 'number' ? parseInt(el.value) || 0 : el.value.trim());
  });

  // Handle file uploads
  data.audioUrl = await handleFileUpload('cf-audio', `audio/${Date.now()}_audio`) ||
                  await handleFileUpload('mf-audio', `audio/${Date.now()}_maudio`) || undefined;
  data.imageUrl = await handleFileUpload('cf-image', `images/${Date.now()}_image`) || undefined;

  // Collect variations for matching items
  if (modalOptions.isMatchItem) {
    const varRows = document.querySelectorAll('#variation-list .variation-item');
    const variations = [];
    varRows.forEach(row => {
      const text = row.querySelector('.var-text')?.value.trim();
      if (text) variations.push({ text, audioUrl: '' });
    });
    data.variations = variations;
  }

  // Remove undefined keys
  Object.keys(data).forEach(k => { if (data[k] === undefined) delete data[k]; });
  return data;
}

async function handleFileUpload(inputId, path) {
  const inp = $(inputId);
  if (!inp || !inp.files[0]) return null;
  const file    = inp.files[0];
  const progEl  = $(inputId + '-progress');
  if (progEl) { progEl.parentElement.style.display = 'block'; }
  try {
    const url = await uploadFile(file, path, pct => {
      if (progEl) progEl.style.width = pct + '%';
    });
    return url;
  } catch(e) {
    showToast('Upload failed: ' + e.message, 'error');
    return null;
  }
}
