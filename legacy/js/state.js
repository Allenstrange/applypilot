// ============== STATE ==============
let state = {
  profile: { name: '', title: '', email: '', phone: '', location: '', linkedin: '', summary: '', skills: '', certs: '', experience: [], education: [] },
  applications: [],
  currentAnalysis: null, // { company, title, location, url, jd, jdKeywords, matched, missing, atsWarnings }
  draftVersion: null // The working copy being edited
};

let providerSettings = {
  activeProvider: 'openai',
  openai: { apiKey: '', model: 'gpt-4o-mini' },
  anthropic: { apiKey: '', model: 'claude-3-5-sonnet-20241022' },
  gemini: { apiKey: '', model: 'gemini-1.5-flash' },
  custom: { endpoint: '', apiKey: '', model: '' }
};

let pendingParsedData = null;

// ============== PERSISTENCE ==============
function loadState() {
  try {
    const saved = localStorage.getItem('applypilot_state_v3');
    if (saved) {
      const loaded = JSON.parse(saved);
      state.profile = { ...state.profile, ...(loaded.profile || {}) };
      state.applications = loaded.applications || [];
      state.currentAnalysis = loaded.currentAnalysis || null;
      state.draftVersion = loaded.draftVersion || null;
    }
  } catch(e) { console.error('loadState', e); }
  try {
    const ps = localStorage.getItem('applypilot_providers_v3');
    if (ps) {
      const loaded = JSON.parse(ps);
      providerSettings.activeProvider = loaded.activeProvider || providerSettings.activeProvider;
      ['openai', 'anthropic', 'gemini', 'custom'].forEach(p => {
        if (loaded[p]) providerSettings[p] = { ...providerSettings[p], ...loaded[p] };
      });
    }
  } catch(e) {}
}
function saveState() {
  try { localStorage.setItem('applypilot_state_v3', JSON.stringify(state)); } catch(e) { console.error('saveState', e); }
}
function saveProviderSettings() {
  localStorage.setItem('applypilot_providers_v3', JSON.stringify(providerSettings));
}
