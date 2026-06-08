// ============== EDITING ROOM (STEP 2) ==============
function renderEditor() {
  const container = document.getElementById('editor-content');
  if (!container) return;

  if (!state.draftVersion || !state.currentAnalysis) {
    container.innerHTML = '<div class="p-12 text-center text-gray-500"><div class="text-4xl mb-2">✍</div><div>No job selected for editing.</div><button onclick="showPage(\'analysis\')" class="btn-primary text-white px-4 py-2 rounded-lg text-sm mt-4">Analyse a Job First</button></div>';
    return;
  }

  const activeTab = state.draftVersion.editorTab || 'cv';

  container.innerHTML = `
    <div class="flex h-screen">
      <!-- Left Pane: Editor -->
      <div class="w-1/2 border-r border-white/5 flex flex-col h-full bg-gray-900">

        <div class="p-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 class="text-lg font-bold text-white">Editing Room</h2>
            <p class="text-xs text-gray-500">${escapeHtml(state.currentAnalysis.title)} at ${escapeHtml(state.currentAnalysis.company)}</p>
          </div>
          <div class="flex bg-gray-800 rounded-lg p-1 border border-white/5">
            <button onclick="switchEditorTab('cv')" class="px-4 py-1.5 text-xs font-medium rounded-md ${activeTab === 'cv' ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:text-white'}">CV</button>
            <button onclick="switchEditorTab('coverletter')" class="px-4 py-1.5 text-xs font-medium rounded-md ${activeTab === 'coverletter' ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:text-white'}">Cover Letter</button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto scrollbar p-6 ${activeTab !== 'cv' ? 'hidden' : ''}">

        <div class="editor-section">
          <h3 class="text-sm font-semibold text-gray-300 mb-2">Professional Summary</h3>
          <textarea id="edit-summary" rows="4" onchange="updateDraft('summary', this.value)" class="w-full px-3 py-2 rounded-lg text-sm">${escapeHtml(state.draftVersion.summary)}</textarea>
        </div>

        <div class="editor-section">
          <h3 class="text-sm font-semibold text-gray-300 mb-2">Skills</h3>
          <textarea id="edit-skills" rows="2" onchange="updateDraft('skills', this.value)" class="w-full px-3 py-2 rounded-lg text-sm">${escapeHtml(state.draftVersion.skills)}</textarea>
        </div>

        <div class="editor-section">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-sm font-semibold text-gray-300">Work Experience</h3>
          </div>
          ${state.draftVersion.experience.map((exp, i) => `
            <div class="mb-4 p-3 rounded-lg bg-white/5">
              <div class="grid grid-cols-2 gap-2 mb-2">
                <input type="text" value="${escapeAttr(exp.role)}" onchange="updateExp(${i}, 'role', this.value)" placeholder="Role" class="px-2 py-1 rounded text-xs"/>
                <input type="text" value="${escapeAttr(exp.company)}" onchange="updateExp(${i}, 'company', this.value)" placeholder="Company" class="px-2 py-1 rounded text-xs"/>
                <input type="text" value="${escapeAttr(exp.start)}" onchange="updateExp(${i}, 'start', this.value)" placeholder="Start" class="px-2 py-1 rounded text-xs"/>
                <input type="text" value="${escapeAttr(exp.end)}" onchange="updateExp(${i}, 'end', this.value)" placeholder="End" class="px-2 py-1 rounded text-xs"/>
              </div>
              <div class="space-y-2">
                ${exp.bullets.split('\n').filter(b => b.trim()).map((bullet, j) => `
                  <div class="bullet-editor">
                    <textarea onchange="updateBullet(${i}, ${j}, this.value)">${escapeHtml(bullet)}</textarea>
                    <button class="ai-btn" onclick="showAIMenu(${i}, ${j})">✨ AI</button>
                    <div id="ai-menu-${i}-${j}" class="ai-menu hidden">
                      <button onclick="enhanceBullet(${i}, ${j}, 'star')">Rewrite in STAR format</button>
                      <button onclick="enhanceBullet(${i}, ${j}, 'professional')">Make more professional</button>
                      <button onclick="enhanceBullet(${i}, ${j}, 'metrics')">Add metric placeholders</button>
                    </div>
                  </div>
                `).join('')}
              </div>
              <button onclick="addBullet(${i})" class="mt-2 text-xs text-indigo-400 hover:text-indigo-300">+ Add bullet</button>
            </div>
          `).join('')}
        </div>

          <div class="flex gap-2 mt-6">
            <button onclick="downloadDraft('cv')" class="btn-primary text-white px-4 py-2 rounded-lg text-sm">⬇ Download CV</button>
            <button onclick="saveToTracker()" class="btn-ghost text-white px-4 py-2 rounded-lg text-sm">💾 Save to Tracker</button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto scrollbar p-6 ${activeTab !== 'coverletter' ? 'hidden' : ''}">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-sm font-semibold text-gray-300">Cover Letter Draft</h3>
            <button onclick="generateCoverLetter()" class="btn-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium">✨ Generate with AI</button>
          </div>
          <textarea id="edit-coverletter" rows="20" onchange="updateDraft('coverLetter', this.value)" class="w-full px-4 py-3 rounded-lg text-sm font-mono leading-relaxed" placeholder="Click 'Generate with AI' to draft a tailored cover letter, or paste one here...">${escapeHtml(state.draftVersion.coverLetter || '')}</textarea>

          <div class="flex gap-2 mt-4">
            <button onclick="downloadDraft('coverletter')" class="btn-primary text-white px-4 py-2 rounded-lg text-sm">⬇ Download Cover Letter</button>
          </div>
        </div>

      </div>

      <!-- Right Pane: Live Preview -->
      <div class="w-1/2 bg-gray-100 overflow-y-auto scrollbar p-6 relative">
        <div class="match-widget mb-4">
          <div class="text-xs text-gray-500 uppercase mb-2">Live Match Rate</div>
          <div class="flex items-center gap-3">
            <div class="text-2xl font-bold" id="live-match-score">0%</div>
            <div class="text-xs text-gray-600" id="live-match-detail">0 keywords matched</div>
          </div>
        </div>
        <div id="live-preview" class="doc-preview"></div>
      </div>
    </div>
  `;

  updateLivePreview();
}

function updateDraft(field, value) {
  state.draftVersion[field] = value;
  saveState();
  updateLivePreview();
}

function updateExp(index, field, value) {
  state.draftVersion.experience[index][field] = value;
  saveState();
  updateLivePreview();
}

function updateBullet(expIndex, bulletIndex, value) {
  const bullets = state.draftVersion.experience[expIndex].bullets.split('\n');
  bullets[bulletIndex] = value;
  state.draftVersion.experience[expIndex].bullets = bullets.join('\n');
  saveState();
  updateLivePreview();
}

function addBullet(expIndex) {
  const current = state.draftVersion.experience[expIndex].bullets;
  state.draftVersion.experience[expIndex].bullets = current + '\nNew bullet point here';
  saveState();
  renderEditor();
}

function switchEditorTab(tabName) {
  state.draftVersion.editorTab = tabName;
  saveState();
  renderEditor();
}

async function generateCoverLetter() {
  if (!isAIConfigured()) {
    toast('⚠ AI provider not configured. Please set one up in Settings.');
    return;
  }

  const btn = document.querySelector('button[onclick="generateCoverLetter()"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Generating...';
  btn.disabled = true;

  try {
    const a = state.currentAnalysis;
    const p = state.draftVersion;

    const matchedConcepts = a.matched.map(m => m.concept || m).join(', ');
    const gaps = a.gaps ? a.gaps.map(g => g.concept).join(', ') : '';

    const prompt = `You are an expert career coach writing a highly tailored cover letter.
Write a professional, persuasive cover letter for ${p.name} applying for the ${a.title} position at ${a.company}.

Here is the job description:
"""
${a.jd}
"""

Here is the candidate's profile:
"""
${JSON.stringify(p, null, 2)}
"""

Instructions:
1. Highlight these exact matching skills seamlessly in the text: ${matchedConcepts}.
2. If there are gaps (${gaps}), frame the candidate's existing experience positively to compensate. Do not explicitly state they lack the skill.
3. Use a confident, professional tone. Keep it to 3-4 paragraphs.
4. Output valid JSON only, using this schema: { "coverLetter": "The full text of the cover letter with line breaks." }`;

    const result = await callAI(prompt);

    let generatedText = '';
    if (typeof result === 'string') {
      generatedText = JSON.parse(result).coverLetter;
    } else {
      generatedText = result.coverLetter;
    }

    if (generatedText) {
      state.draftVersion.coverLetter = generatedText;
      saveState();
      renderEditor();
      toast('✓ Cover letter generated');
    } else {
      throw new Error("No coverLetter field returned");
    }

  } catch (err) {
    console.error(err);
    toast('✕ Generation failed: ' + err.message);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

function showAIMenu(expIndex, bulletIndex) {
  const menu = document.getElementById(`ai-menu-${expIndex}-${bulletIndex}`);
  menu.classList.toggle('hidden');
}

async function enhanceBullet(expIndex, bulletIndex, mode) {
  const menu = document.getElementById(`ai-menu-${expIndex}-${bulletIndex}`);
  menu.classList.add('hidden');

  const bullets = state.draftVersion.experience[expIndex].bullets.split('\n');
  const originalBullet = bullets[bulletIndex];

  if (!isAIConfigured()) {
    toast('⚠ AI provider not configured');
    return;
  }

  toast('⏳ Enhancing bullet...');

  let prompt = '';
  if (mode === 'star') {
    prompt = `Rewrite this CV bullet point in STAR format (Situation, Task, Action, Result). Keep it truthful and concise. Return JSON: {"enhanced": "rewritten bullet"}

Original: "${originalBullet}"`;
  } else if (mode === 'professional') {
    prompt = `Make this CV bullet point more professional and impactful. Use strong action verbs. Return JSON: {"enhanced": "rewritten bullet"}

Original: "${originalBullet}"`;
  } else if (mode === 'metrics') {
    prompt = `Add realistic metric placeholders to this CV bullet point (e.g., [X%], [Y users]). Return JSON: {"enhanced": "rewritten bullet"}

Original: "${originalBullet}"`;
  }

  try {
    const result = await callAI(prompt);
    bullets[bulletIndex] = result.enhanced;
    state.draftVersion.experience[expIndex].bullets = bullets.join('\n');
    saveState();
    renderEditor();
    toast('✓ Bullet enhanced');
  } catch (err) {
    toast('✕ Enhancement failed: ' + err.message);
  }
}

function updateLivePreview() {
  if (!state.draftVersion || !state.currentAnalysis) return;

  const preview = document.getElementById('live-preview');
  const scoreEl = document.getElementById('live-match-score');
  const detailEl = document.getElementById('live-match-detail');

  // Recalculate matches
  const draftKeywords = extractKeywords(state.draftVersion.skills + ' ' + state.draftVersion.experience.map(e => e.tools + ' ' + e.bullets).join(' '));
  const matched = state.currentAnalysis.jdKeywords.filter(k => draftKeywords.includes(k));
  const matchScore = state.currentAnalysis.jdKeywords.length ? Math.round((matched.length / state.currentAnalysis.jdKeywords.length) * 100) : 0;

  scoreEl.textContent = matchScore + '%';
  scoreEl.style.color = matchScore > 70 ? '#4ade80' : matchScore > 40 ? '#fbbf24' : '#f87171';
  detailEl.textContent = matched.length + ' of ' + state.currentAnalysis.jdKeywords.length + ' keywords matched';

  // Build preview HTML with highlighting
  let html = buildCVHTML(state.draftVersion, matched);
  preview.innerHTML = html;
}

function buildCVHTML(profile, matchedKeywords) {
  const skillsList = (profile.skills || '').split(',').map(s => s.trim()).filter(Boolean);

  let html = `<h1>${escapeHtml(profile.name || 'Your Name')}</h1>`;
  html += `<div>${escapeHtml(profile.title || '')} | ${escapeHtml(profile.location || '')}</div>`;
  html += `<div>${escapeHtml(profile.email || '')} | ${escapeHtml(profile.phone || '')}${profile.linkedin ? ' | ' + escapeHtml(profile.linkedin) : ''}</div>`;

  if (profile.summary) {
    html += `<h2>Professional Summary</h2><p>${highlightKeywords(profile.summary, matchedKeywords)}</p>`;
  }

  html += `<h2>Core Skills</h2><p>${skillsList.map(s => highlightKeywords(s, matchedKeywords)).join(' • ')}</p>`;

  html += `<h2>Professional Experience</h2>`;
  profile.experience.forEach(exp => {
    html += `<h3>${escapeHtml(exp.role)} - ${escapeHtml(exp.company)}</h3>`;
    html += `<div><em>${escapeHtml(exp.start)}${exp.end ? ' - ' + escapeHtml(exp.end) : ''}</em></div>`;
    if (exp.bullets) {
      html += `<ul>`;
      exp.bullets.split('\n').filter(b => b.trim()).forEach(b => {
        const clean = b.replace(/^[-•]\s*/, '');
        html += `<li>${highlightKeywords(clean, matchedKeywords)}</li>`;
      });
      html += `</ul>`;
    }
    if (exp.tools) {
      html += `<div><strong>Tools:</strong> ${highlightKeywords(exp.tools, matchedKeywords)}</div>`;
    }
  });

  if (profile.education && profile.education.length) {
    html += `<h2>Education</h2>`;
    profile.education.forEach(ed => {
      html += `<h3>${escapeHtml(ed.degree)}</h3>`;
      html += `<div>${escapeHtml(ed.institution)}${ed.year ? ', ' + escapeHtml(ed.year) : ''}</div>`;
    });
  }

  if (profile.certs) {
    html += `<h2>Certifications</h2><ul>`;
    profile.certs.split('\n').filter(Boolean).forEach(c => {
      html += `<li>${escapeHtml(c.trim())}</li>`;
    });
    html += `</ul>`;
  }

  return html;
}

function highlightKeywords(text, keywords) {
  if (!text || !keywords.length) return escapeHtml(text);
  let result = escapeHtml(text);
  keywords.forEach(kw => {
    const regex = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
    result = result.replace(regex, match => `<mark>${match}</mark>`);
  });
  return result;
}

function downloadDraft(type) {
  if (!state.draftVersion) return;

  if (type === 'coverletter') {
    if (!state.draftVersion.coverLetter) {
      toast('⚠ Generate or write a cover letter first');
      return;
    }
    const text = state.draftVersion.coverLetter;
    const filename = `${state.currentAnalysis.company.replace(/\s+/g,'_')}_Cover_Letter.txt`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, filename);
    toast(`✓ Cover Letter downloaded`);
    return;
  }

  const html = buildCVHTML(state.draftVersion, []);
  const filename = `${state.currentAnalysis.company.replace(/\s+/g,'_')}_CV.doc`;
  const fullHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>CV</title>
<style>
body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #111; }
h1 { font-size: 18pt; font-weight: bold; margin: 0 0 4pt 0; }
h2 { font-size: 11pt; font-weight: bold; text-transform: uppercase; border-bottom: 1pt solid #333; padding-bottom: 2pt; margin-top: 14pt; margin-bottom: 6pt; }
h3 { font-size: 11pt; font-weight: bold; margin: 8pt 0 2pt 0; }
ul { margin: 4pt 0; padding-left: 20pt; }
li { margin-bottom: 3pt; }
p { margin: 4pt 0; }
</style></head><body>${html}</body></html>`;
  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
  saveAs(blob, filename);
  toast(`✓ CV downloaded`);
}

function saveToTracker() {
  if (!state.currentAnalysis || !state.draftVersion) return;

  const app = {
    id: Date.now(),
    company: state.currentAnalysis.company,
    title: state.currentAnalysis.title,
    location: state.currentAnalysis.location,
    url: state.currentAnalysis.url,
    status: 'planned',
    createdAt: new Date().toISOString(),
    notes: ''
  };

  if (!state.applications.find(a => a.company === app.company && a.title === app.title)) {
    state.applications.unshift(app);
    saveState();
    toast('✓ Saved to tracker');
  } else {
    toast('ℹ Already in tracker');
  }
}
