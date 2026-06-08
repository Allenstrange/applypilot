// ============== CV UPLOAD & PARSING ==============
function setupDropzone() {
  const dz = document.getElementById('dropzone');
  const input = document.getElementById('cv-upload');
  if (!dz || !input) return;
  dz.addEventListener('click', (e) => {
    if (e.target.closest('#parse-options') || e.target.closest('#upload-status')) return;
    input.click();
  });
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    dz.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleCVFile(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', (e) => {
    if (e.target.files.length) handleCVFile(e.target.files[0]);
    e.target.value = '';
  });
}

function setupParseButtons() {
  const btnOverwrite = document.getElementById('btn-apply-overwrite');
  const btnMerge = document.getElementById('btn-apply-merge');
  const btnCancel = document.getElementById('btn-cancel-parse');

  if (btnOverwrite) btnOverwrite.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); applyParsedData('overwrite'); });
  if (btnMerge) btnMerge.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); applyParsedData('merge'); });
  if (btnCancel) btnCancel.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); cancelParse(); });
}

async function handleCVFile(file) {
  const status = document.getElementById('upload-status');
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    status.innerHTML = '<span class="text-red-400">✕ File too large (max 10MB)</span>';
    return;
  }
  status.innerHTML = '<span class="text-indigo-400"><span class="spinner"></span>Reading ' + file.name + '...</span>';

  try {
    const ext = file.name.split('.').pop().toLowerCase();
    let text = '';
    let jsonData = null;

    if (ext === 'json') {
      text = await file.text();
      try { jsonData = JSON.parse(text); }
      catch (e) { throw new Error('Invalid JSON format: ' + e.message); }
    } else if (ext === 'txt') {
      text = await file.text();
    } else if (ext === 'docx') {
      text = await readDocxText(file);
    } else if (ext === 'pdf') {
      text = await readPdfText(file);
    } else {
      throw new Error('Unsupported file type: ' + ext);
    }

    let parsed;
    if (jsonData) {
      parsed = normaliseJsonProfile(jsonData);
    } else if (isAIConfigured()) {
      status.innerHTML = '<span class="text-indigo-400"><span class="spinner"></span>AI extracting profile data...</span>';
      try {
        parsed = await parseCVWithAI(text);
      } catch (err) {
        console.warn('AI parse failed:', err);
        toast('⚠ AI parse failed, using local parser');
        parsed = parseCVText(text);
      }
    } else {
      status.innerHTML = '<span class="text-indigo-400"><span class="spinner"></span>Parsing with local parser...</span>';
      parsed = parseCVText(text);
    }

    pendingParsedData = parsed;

    const stats = [];
    if (parsed.name) stats.push('name');
    if (parsed.email) stats.push('email');
    if (parsed.skills) stats.push('skills');
    if (parsed.experience && parsed.experience.length) stats.push(parsed.experience.length + ' roles');

    status.innerHTML = '<span class="text-green-400">✓ Parsed <strong>' + escapeHtml(file.name) + '</strong>. Found: ' + (stats.length ? stats.join(', ') : 'no recognised fields') + '</span>';

    const parseOpts = document.getElementById('parse-options');
    if (parseOpts) parseOpts.classList.remove('hidden');

  } catch (err) {
    console.error('handleCVFile', err);
    status.innerHTML = '<span class="text-red-400">✕ Error: ' + escapeHtml(err.message) + '</span>';
  }
}

async function readDocxText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
}

async function readPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items;
    let lastY = null;
    let pageText = '';
    items.forEach(item => {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 2) {
        pageText += '\n';
      } else if (lastY !== null) {
        pageText += ' ';
      }
      pageText += item.str;
      lastY = item.transform[5];
    });
    fullText += pageText + '\n\n';
  }
  return fullText;
}

async function parseCVWithAI(text) {
  const schema = {
    name: 'string',
    title: 'string',
    email: 'string',
    phone: 'string',
    location: 'string',
    linkedin: 'string',
    summary: 'string',
    skills: 'comma-separated string',
    certs: 'newline-separated string',
    experience: [{ company: 'string', role: 'string', start: 'string', end: 'string', bullets: 'string with one bullet per line', tools: 'comma-separated string' }],
    education: [{ institution: 'string', degree: 'string', year: 'string' }]
  };

  const prompt = `Extract structured data from this CV. Only output data EXPLICITLY present. Return JSON matching this schema: ${JSON.stringify(schema)}

CV TEXT:
"""
${text}
"""`;

  const result = await callAI(prompt);
  return normaliseJsonProfile(result);
}

// ============== LOCAL PARSER (simplified) ==============
function parseCVText(text) {
  return { name: '', title: '', email: '', phone: '', location: '', linkedin: '', summary: '', skills: '', certs: '', experience: [], education: [] };
}

function normaliseJsonProfile(data) {
  const d = data || {};
  const normaliseSkills = (s) => Array.isArray(s) ? s.join(', ') : (s || '');
  const normaliseCerts = (c) => Array.isArray(c) ? c.join('\n') : (c || '');
  const normaliseExp = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(e => ({
      company: e.company || '',
      role: e.role || '',
      start: e.start || '',
      end: e.end || '',
      bullets: Array.isArray(e.bullets) ? e.bullets.join('\n') : (e.bullets || ''),
      tools: Array.isArray(e.tools) ? e.tools.join(', ') : (e.tools || '')
    }));
  };
  const normaliseEdu = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(e => ({ institution: e.institution || '', degree: e.degree || '', year: e.year || '' }));
  };

  return {
    name: d.name || '',
    title: d.title || '',
    email: d.email || '',
    phone: d.phone || '',
    location: d.location || '',
    linkedin: d.linkedin || '',
    summary: d.summary || '',
    skills: normaliseSkills(d.skills),
    certs: normaliseCerts(d.certifications || d.certs),
    experience: normaliseExp(d.experience || []),
    education: normaliseEdu(d.education || [])
  };
}

function applyParsedData(mode) {
  if (!pendingParsedData) { toast('⚠ No parsed data available'); return; }
  const parsed = pendingParsedData;
  captureFormEdits();

  if (mode === 'overwrite') {
    state.profile = { ...parsed };
  } else {
    ['name','title','email','phone','location','linkedin','summary','skills','certs'].forEach(key => {
      if (!state.profile[key] && parsed[key]) state.profile[key] = parsed[key];
    });
    if (state.profile.experience.length === 0 && parsed.experience.length > 0) state.profile.experience = parsed.experience;
    if (state.profile.education.length === 0 && parsed.education.length > 0) state.profile.education = parsed.education;
  }

  saveState();
  populateProfileForm();
  document.getElementById('parse-options').classList.add('hidden');
  toast('✓ Profile ' + (mode === 'overwrite' ? 'replaced' : 'updated'));
  pendingParsedData = null;
}

function cancelParse() {
  pendingParsedData = null;
  document.getElementById('parse-options').classList.add('hidden');
  document.getElementById('upload-status').innerHTML = '';
}

function downloadProfileJSON() {
  captureFormEdits();
  const blob = new Blob([JSON.stringify(state.profile, null, 2)], { type: 'application/json' });
  saveAs(blob, 'master_profile.json');
  toast('✓ Profile exported as JSON');
}
