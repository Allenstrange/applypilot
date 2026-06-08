// ============== PROFILE FORM ==============
function populateProfileForm() {
  const p = state.profile || {};
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('p-name', p.name);
  set('p-title', p.title);
  set('p-email', p.email);
  set('p-phone', p.phone);
  set('p-location', p.location);
  set('p-linkedin', p.linkedin);
  set('p-summary', p.summary);
  set('p-skills', p.skills);
  set('p-certs', p.certs);
  renderExperienceList();
  renderEducationList();
}

function addExperience() {
  state.profile.experience.push({ company: '', role: '', start: '', end: '', bullets: '', tools: '' });
  renderExperienceList();
}

function removeExperience(i) {
  state.profile.experience.splice(i, 1);
  renderExperienceList();
}


function renderExperienceList() {
  const container = document.getElementById('experience-list');
  if (!container) return;
  if (state.profile.experience.length === 0) {
    container.innerHTML = '<div class="text-gray-500 text-sm text-center py-4">No experience added yet.</div>';
    return;
  }
  container.innerHTML = state.profile.experience.map((exp, i) => `
    <div class="p-4 rounded-lg bg-white/5 border border-white/5">
      <div class="flex justify-between items-start mb-3">
        <div class="text-xs text-gray-500">Role #${i+1}</div>
        <button type="button" onclick="removeExperience(${i})" class="text-red-400 text-xs hover:text-red-300">Remove</button>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <input type="text" onchange="state.profile.experience[${i}].company=this.value" value="${escapeAttr(exp.company)}" placeholder="Company" class="px-3 py-2 rounded-lg text-sm"/>
        <input type="text" onchange="state.profile.experience[${i}].role=this.value" value="${escapeAttr(exp.role)}" placeholder="Role title" class="px-3 py-2 rounded-lg text-sm"/>
        <input type="text" onchange="state.profile.experience[${i}].start=this.value" value="${escapeAttr(exp.start)}" placeholder="Start" class="px-3 py-2 rounded-lg text-sm"/>
        <input type="text" onchange="state.profile.experience[${i}].end=this.value" value="${escapeAttr(exp.end)}" placeholder="End" class="px-3 py-2 rounded-lg text-sm"/>
      </div>
      <textarea onchange="state.profile.experience[${i}].bullets=this.value" rows="3" placeholder="Key responsibilities (one per line)" class="w-full px-3 py-2 rounded-lg text-sm mb-2">${escapeHtml(exp.bullets)}</textarea>
      <input type="text" onchange="state.profile.experience[${i}].tools=this.value" value="${escapeAttr(exp.tools)}" placeholder="Tools used (comma separated)" class="w-full px-3 py-2 rounded-lg text-sm"/>
    </div>
  `).join('');
}

function addEducation() {
  state.profile.education.push({ institution: '', degree: '', year: '' });
  renderEducationList();
}

function removeEducation(i) {
  state.profile.education.splice(i, 1);
  renderEducationList();
}

function renderEducationList() {
  const container = document.getElementById('education-list');
  if (!container) return;
  if (state.profile.education.length === 0) {
    container.innerHTML = '<div class="text-gray-500 text-sm text-center py-4">No education added yet.</div>';
    return;
  }
  container.innerHTML = state.profile.education.map((ed, i) => `
    <div class="grid grid-cols-4 gap-3 items-center">
      <input type="text" onchange="state.profile.education[${i}].institution=this.value" value="${escapeAttr(ed.institution)}" placeholder="Institution" class="col-span-2 px-3 py-2 rounded-lg text-sm"/>
      <input type="text" onchange="state.profile.education[${i}].degree=this.value" value="${escapeAttr(ed.degree)}" placeholder="Degree" class="px-3 py-2 rounded-lg text-sm"/>
      <div class="flex gap-2">
        <input type="text" onchange="state.profile.education[${i}].year=this.value" value="${escapeAttr(ed.year)}" placeholder="Year" class="flex-1 px-3 py-2 rounded-lg text-sm"/>
        <button type="button" onclick="removeEducation(${i})" class="text-red-400 text-xs">✕</button>
      </div>
    </div>
  `).join('');
}

function saveProfile() {
  captureFormEdits();
  saveState();
  toast('✓ Profile saved');
}

function captureFormEdits() {
  const get = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
  state.profile.name = get('p-name');
  state.profile.title = get('p-title');
  state.profile.email = get('p-email');
  state.profile.phone = get('p-phone');
  state.profile.location = get('p-location');
  state.profile.linkedin = get('p-linkedin');
  state.profile.summary = get('p-summary');
  state.profile.skills = get('p-skills');
  state.profile.certs = get('p-certs');
}

function checkProfileStatus() {
  const p = state.profile;
  const el = document.getElementById('profile-status');
  if (!el) return;
  const complete = p.name && p.title && p.skills && p.experience.length > 0;
  if (complete) {
    el.innerHTML = '<span class="text-green-400">✓ Ready to analyse</span>';
  } else {
    el.innerHTML = '<span class="text-yellow-400">⚠ Profile incomplete</span>';
  }
}

function checkAIProviderStatus() {
  const el = document.getElementById('ai-provider-status');
  if (!el) return;
  if (isAIConfigured()) {
    const provider = providerSettings.activeProvider;
    const config = providerSettings[provider];
    el.innerHTML = `<span class="text-green-400">✓ ${AI_PROVIDERS[provider].name}</span><div class="text-xs text-gray-500 mt-1">Model: ${config.model}</div>`;
  } else {
    el.innerHTML = `<span class="text-yellow-400">⚠ Not configured</span>`;
  }
}
