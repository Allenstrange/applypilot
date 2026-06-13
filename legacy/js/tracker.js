// ============== TRACKER ==============
function renderTracker() {
  const container = document.getElementById('tracker-table');
  if (!container) return;
  if (state.applications.length === 0) {
    container.innerHTML = '<div class="p-12 text-center text-gray-500">No applications tracked yet.</div>';
    return;
  }
  container.innerHTML = `
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-white/5 text-left text-xs uppercase text-gray-500">
          <th class="p-4">Company</th><th class="p-4">Role</th><th class="p-4">Location</th>
          <th class="p-4">Status</th><th class="p-4">Date</th><th class="p-4">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${state.applications.map(app => `
          <tr class="border-b border-white/5 hover:bg-white/5">
            <td class="p-4 font-medium text-white">${escapeHtml(app.company)}</td>
            <td class="p-4">${escapeHtml(app.title)}</td>
            <td class="p-4 text-gray-400">${escapeHtml(app.location || '-')}</td>
            <td class="p-4">
              <select onchange="changeStatus(${app.id}, this.value)" class="text-xs px-2 py-1 rounded status-pill status-${app.status}">
                <option value="planned" ${app.status==='planned'?'selected':''}>Planned</option>
                <option value="applied" ${app.status==='applied'?'selected':''}>Applied</option>
                <option value="interview" ${app.status==='interview'?'selected':''}>Interview</option>
                <option value="offer" ${app.status==='offer'?'selected':''}>Offer</option>
                <option value="rejected" ${app.status==='rejected'?'selected':''}>Rejected</option>
              </select>
            </td>
            <td class="p-4 text-gray-500 text-xs">${new Date(app.createdAt).toLocaleDateString('en-GB')}</td>
            <td class="p-4">
              <button type="button" onclick="deleteApp(${app.id})" class="text-red-400 text-xs hover:text-red-300">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function changeStatus(id, status) {
  const app = state.applications.find(a => a.id === id);
  if (app) { app.status = status; saveState(); toast(`✓ Updated`); }
}

function deleteApp(id) {
  if (!confirm('Delete this application?')) return;
  state.applications = state.applications.filter(a => a.id !== id);
  saveState();
  renderTracker();
  toast('✓ Deleted');
}

function exportTrackerCSV() {
  if (state.applications.length === 0) { toast('⚠ No applications to export'); return; }
  const rows = [['Company','Role','Location','Status','Date']];
  state.applications.forEach(a => {
    rows.push([a.company, a.title, a.location || '', a.status, new Date(a.createdAt).toLocaleDateString('en-GB')]);
  });
  const csv = rows.map(r => r.map(c => `"${(c+'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  saveAs(blob, 'applications.csv');
  toast('✓ CSV exported');
}

function updateDashboard() {
  const apps = state.applications || [];
  document.getElementById('stat-apps').textContent = apps.length;
  document.getElementById('stat-interviews').textContent = apps.filter(a => a.status === 'interview').length;
  document.getElementById('stat-offers').textContent = apps.filter(a => a.status === 'offer').length;
  const weekAgo = Date.now() - 7*24*60*60*1000;
  document.getElementById('stat-week').textContent = apps.filter(a => new Date(a.createdAt).getTime() > weekAgo).length;

  const recent = document.getElementById('recent-activity');
  if (apps.length === 0) {
    recent.innerHTML = '<div class="text-gray-500 text-center py-4">No recent activity.</div>';
  } else {
    recent.innerHTML = apps.slice(0, 5).map(a => `
      <div class="flex items-center justify-between p-3 rounded-lg bg-white/5">
        <div>
          <div class="font-medium text-white text-sm">${escapeHtml(a.title)}</div>
          <div class="text-xs text-gray-500">${escapeHtml(a.company)} • ${new Date(a.createdAt).toLocaleDateString('en-GB')}</div>
        </div>
        <span class="status-pill status-${a.status}">${a.status}</span>
      </div>
    `).join('');
  }
}

function loadSampleJD() {
  document.getElementById('j-company').value = 'Tetra Tech';
  document.getElementById('j-title').value = '1st/2nd Line Support Analyst';
  document.getElementById('j-location').value = 'Birmingham, UK';
  document.getElementById('j-url').value = 'https://careers.tetratech.com/jobs/12345';
  document.getElementById('j-jd').value = `About the role:
We are looking for a 1st/2nd Line Support Analyst to join our IT services team in Birmingham. You will provide technical support to internal users across multiple offices, handling incidents, service requests, and problems in line with SLA targets.

Key responsibilities:
- Provide 1st and 2nd line support via ServiceNow ticketing
- Troubleshoot Windows 10/11, Office 365, Active Directory and Azure AD
- Manage user onboarding and offboarding (provisioning accounts, laptops, mobile devices)
- Support endpoint management via Intune and SCCM
- Assist with network issues (TCP/IP, DNS, DHCP, VPN)
- Maintain accurate documentation and knowledge base articles
- Escalate complex issues to 3rd line with clear diagnostics
- Participate in ITIL-aligned change and problem management

Requirements:
- 2+ years in IT support or service desk role
- Strong experience with Active Directory, Office 365, Azure AD
- Confident with ServiceNow or similar ITSM tool
- Good knowledge of Windows 10/11 and common business applications
- Understanding of networking fundamentals (TCP/IP, DNS, DHCP)
- Excellent customer service and communication skills
- ITIL Foundation desirable
- PowerShell scripting experience desirable
- Experience with Intune, SCCM, or similar endpoint tools

Desirable:
- CompTIA A+ or Microsoft MD-102
- Experience with VMware or Hyper-V
- Exposure to cloud services (Azure, AWS)`;
  toast('✓ Sample JD loaded');
}

function clearJobForm() {
  ['j-company','j-title','j-location','j-url','j-jd'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const r = document.getElementById('analysis-results');
  if (r) r.classList.add('hidden');
}
