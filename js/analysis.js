// ============== JOB ANALYSIS (STEP 1) ==============
async function analyseJDSemantically(jd, profile) {
  const schema = {
    requiredCompetencies: [{ concept: "string", importance: "must-have | nice-to-have", evidence: "short verbatim quote from JD" }],
    matched: [{ concept: "string", profileEvidence: "string — verbatim from profile that supports this match" }],
    gaps: [{ concept: "string", importance: "must-have | nice-to-have", suggestion: "one-sentence actionable suggestion for the candidate" }],
    senioritySignal: "entry | mid | senior | lead",
    domainTags: ["string"],
    overallFit: 0 // integer 0..100
  };

  const prompt = `You are an expert technical recruiter analyzing a job description against a candidate's profile.
Your task is to extract the concepts and required competencies from the JD, then semantically match them to the candidate's profile — recognising synonyms, paraphrases, and implicit matches.

Follow these strict instructions:
"You may only identify matches and gaps that are EVIDENT in the candidate's actual profile text. Do not infer skills the candidate did not write down."
"Return verbatim quotes from the JD (≤ 15 words) as evidence for each required competency."
"For profileEvidence, quote the candidate's actual text verbatim (≤ 15 words). Do not paraphrase."
"Respond with valid JSON only. No prose, no markdown."

Target JSON schema:
${JSON.stringify(schema, null, 2)}

Job Description:
"""
${jd}
"""

Candidate Profile:
"""
${JSON.stringify(profile, null, 2)}
"""`;

  const result = await callAI(prompt);
  if (typeof result === 'string') {
    return JSON.parse(result);
  }
  return result;
}

async function analyseJob() {
  const company = document.getElementById('j-company').value.trim();
  const title = document.getElementById('j-title').value.trim();
  const location = document.getElementById('j-location').value.trim();
  const url = document.getElementById('j-url').value.trim();
  const jd = document.getElementById('j-jd').value.trim();

  if (!company || !title || !jd) { toast('⚠ Please fill in company, title and JD'); return; }
  if (!state.profile.name || !state.profile.skills) {
    toast('⚠ Please complete your master profile first');
    showPage('profile');
    return;
  }

  let jdKeywords = [];
  let matched = [];
  let missing = [];
  let gaps = [];
  let senioritySignal = "";
  let domainTags = [];
  let overallFit = 0;

  if (isAIConfigured()) {
    try {
      toast('⏳ Semantically analysing JD...');
      const semanticResult = await analyseJDSemantically(jd, state.profile);

      overallFit = semanticResult.overallFit || 0;
      senioritySignal = semanticResult.senioritySignal || "";
      domainTags = semanticResult.domainTags || [];

      matched = semanticResult.matched || [];
      gaps = semanticResult.gaps || [];

      // Flatten matched concepts for the highlight widget
      jdKeywords = matched.map(m => m.concept);

      toast('✓ Analysis complete');
    } catch (err) {
      console.error(err);
      toast('⚠ Semantic analysis unavailable — falling back to keyword match. Configure an AI provider in Settings for better results.');
      // Fallback
      jdKeywords = extractKeywords(jd);
      const profileKeywords = extractKeywords(state.profile.skills + ' ' + state.profile.experience.map(e => e.tools + ' ' + e.bullets).join(' '));
      matched = jdKeywords.filter(k => profileKeywords.includes(k));
      missing = jdKeywords.filter(k => !profileKeywords.includes(k));
    }
  } else {
    toast('⚠ Semantic analysis unavailable — falling back to keyword match. Configure an AI provider in Settings for better results.');
    jdKeywords = extractKeywords(jd);
    const profileKeywords = extractKeywords(state.profile.skills + ' ' + state.profile.experience.map(e => e.tools + ' ' + e.bullets).join(' '));
    matched = jdKeywords.filter(k => profileKeywords.includes(k));
    missing = jdKeywords.filter(k => !profileKeywords.includes(k));
  }

  // ATS Safety Scan
  const atsWarnings = performATSScan(state.profile);

  state.currentAnalysis = {
    company, title, location, url, jd, jdKeywords, matched, missing, gaps,
    overallFit, senioritySignal, domainTags, atsWarnings
  };

  // Create draft version (copy of master profile)
  state.draftVersion = JSON.parse(JSON.stringify(state.profile));

  saveState();
  renderAnalysisResults();
}

function extractKeywords(text) {
  const IT_KEYWORDS = [
    'active directory','azure ad','azure','office 365','o365','microsoft 365','m365',
    'sccm','intune','endpoint','windows 10','windows 11','windows server',
    'servicenow','jira','zendesk','powershell','bash','scripting','automation',
    'tcp/ip','dhcp','dns','vpn','lan','wan','wi-fi','wifi','network','firewall',
    'exchange','outlook','teams','sharepoint','onedrive','vmware','hyper-v',
    'itil','gdpr','compliance','security','troubleshooting','diagnostics','incident',
    '1st line','2nd line','3rd line','customer service','stakeholder','communication',
    'ticketing','escalation','comptia','md-102','az-900','az-104','itil foundation',
    'sql','python','api','cloud','aws','gcp','agile','scrum'
  ];
  const lower = text.toLowerCase();
  const found = [];
  IT_KEYWORDS.forEach(kw => {
    const regex = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    if (regex.test(lower)) found.push(kw);
  });
  const acronyms = text.match(/\b[A-Z]{2,6}\b/g) || [];
  return [...new Set([...found, ...acronyms.map(a => a.toLowerCase())])];
}

function performATSScan(profile) {
  const warnings = [];

  // Check for missing sections
  if (!profile.summary) warnings.push({ type: 'error', msg: 'Missing Professional Summary section' });
  if (!profile.skills) warnings.push({ type: 'error', msg: 'Missing Skills section' });
  if (profile.experience.length === 0) warnings.push({ type: 'error', msg: 'Missing Work Experience section' });

  // Check bullet length
  profile.experience.forEach((exp, i) => {
    const bullets = exp.bullets.split('\n').filter(b => b.trim());
    bullets.forEach(bullet => {
      if (bullet.length > 200) {
        warnings.push({ type: 'warning', msg: `Role #${i+1}: Bullet point is too long (${bullet.length} chars). Keep under 200.` });
      }
    });
  });

  // Check for metrics
  const allBullets = profile.experience.flatMap(e => e.bullets.split('\n')).join(' ');
  const hasMetrics = /\d+%|\d+\s*(users|tickets|systems|devices|projects)/i.test(allBullets);
  if (!hasMetrics) {
    warnings.push({ type: 'warning', msg: 'No quantifiable metrics found. Add numbers like "reduced tickets by 20%" or "supported 150 users".' });
  }

  if (warnings.length === 0) {
    warnings.push({ type: 'success', msg: '✓ No major ATS issues detected. Your profile looks good!' });
  }

  return warnings;
}

function renderAnalysisResults() {
  const container = document.getElementById('analysis-results');
  if (!container || !state.currentAnalysis) return;

  const a = state.currentAnalysis;
  const isSemantic = a.overallFit !== undefined && a.overallFit >= 0;

  const matchScore = isSemantic ? a.overallFit : (a.jdKeywords.length ? Math.round((a.matched.length / a.jdKeywords.length) * 100) : 0);
  const matchLabel = isSemantic ? 'Semantic Fit' : 'Match Rate';
  const matchDetail = isSemantic ? 'Semantic fit: %' : `${a.matched.length} of ${a.jdKeywords.length} keywords matched`;

  let headerBadges = '';
  if (isSemantic) {
    if (a.senioritySignal) {
      headerBadges += `<span class="status-pill bg-purple-500/20 text-purple-300 ml-3">${escapeHtml(a.senioritySignal)}</span>`;
    }
    if (a.domainTags && a.domainTags.length) {
      headerBadges += a.domainTags.map(t => `<span class="status-pill bg-indigo-500/20 text-indigo-300 ml-1">${escapeHtml(t)}</span>`).join('');
    }
  }

  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white flex items-center">Analysis Complete ${headerBadges}</h2>
        <button onclick="showPage('editor')" class="btn-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium">✍ Enter Editing Room →</button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Match Score -->
        <div class="card rounded-xl p-5">
          <div class="text-xs text-gray-500 uppercase mb-3">${matchLabel}</div>
          <div class="flex items-center gap-4">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
              <circle cx="40" cy="40" r="32" fill="none" stroke="${matchScore > 70 ? '#4ade80' : matchScore > 40 ? '#fbbf24' : '#f87171'}" stroke-width="8"
                stroke-dasharray="${2*Math.PI*32}"
                stroke-dashoffset="${2*Math.PI*32 * (1 - matchScore/100)}"
                transform="rotate(-90 40 40)" class="progress-ring" stroke-linecap="round"/>
            </svg>
            <div>
              <div class="text-3xl font-bold text-white">${matchScore}%</div>
              <div class="text-xs text-gray-500">${matchDetail.replace('%', matchScore + '%')}</div>
            </div>
          </div>
        </div>

        <!-- ATS Safety -->
        <div class="card rounded-xl p-5">
          <div class="text-xs text-gray-500 uppercase mb-3">ATS Safety Scan</div>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            ${a.atsWarnings.map(w => `
              <div class="ats-${w.type} rounded-lg p-3">
                <div class="text-xs font-semibold">${w.type === 'error' ? '🚨' : w.type === 'warning' ? '⚠️' : '✓'} ${escapeHtml(w.msg)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Keywords / Gaps -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card rounded-xl p-5">
          <h3 class="font-semibold text-white mb-3">✓ Matched Concepts (${a.matched.length})</h3>
          <div class="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
            ${a.matched.length ? a.matched.map(m => {
              const conceptName = typeof m === 'string' ? m : m.concept;
              const evidence = typeof m === 'string' ? '' : ` title="Evidence: ${escapeAttr(m.profileEvidence)}"`;
              return `<span class="chip chip-match" ${evidence}>${escapeHtml(conceptName)}</span>`;
            }).join('') : '<span class="text-gray-500 text-sm">None matched</span>'}
          </div>
        </div>
        <div class="card rounded-xl p-5">
          <h3 class="font-semibold text-white mb-3">⚠ Areas to Strengthen</h3>
          <div class="flex flex-col gap-2 max-h-48 overflow-y-auto">
            ${isSemantic && a.gaps && a.gaps.length ? a.gaps.map(g => `
              <div class="p-2 rounded bg-red-500/10 border border-red-500/20 text-sm">
                <div class="font-semibold text-red-400">${escapeHtml(g.concept)} <span class="text-xs text-gray-500 ml-1">(${escapeHtml(g.importance)})</span></div>
                <div class="text-xs text-gray-400 mt-1">${escapeHtml(g.suggestion)}</div>
              </div>
            `).join('') :
            (!isSemantic && a.missing.length ? a.missing.map(k => `<span class="chip chip-gap inline-block w-max">${escapeHtml(k)}</span>`).join('') : '<span class="text-gray-500 text-sm">Great, no gaps found</span>')}
          </div>
        </div>
      </div>
    </div>
  `;
}
