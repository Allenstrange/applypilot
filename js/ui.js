// ============== NAVIGATION ==============
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.remove('hidden');
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`[data-page="${page}"]`);
  if (btn) btn.classList.add('active');
  if (page === 'dashboard') updateDashboard();
  if (page === 'profile') populateProfileForm();
  if (page === 'tracker') renderTracker();
  if (page === 'analysis') { checkProfileStatus(); checkAIProviderStatus(); }
  if (page === 'editor') renderEditor();
  if (page === 'settings') loadProviderSettingsUI();
  window.scrollTo(0, 0);
}
