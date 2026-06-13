// ============== AI PROVIDER SETTINGS ==============
function selectProvider(provider) {
  providerSettings.activeProvider = provider;
  document.querySelectorAll('.provider-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`[data-provider="${provider}"]`).classList.add('selected');
  renderProviderConfig(provider);
}

function renderProviderConfig(provider) {
  const configDiv = document.getElementById('provider-config');
  const titleDiv = document.getElementById('config-title');
  const fieldsDiv = document.getElementById('config-fields');
  configDiv.classList.remove('hidden');

  const config = providerSettings[provider];
  const providerInfo = AI_PROVIDERS[provider];

  titleDiv.textContent = `Configure ${providerInfo.name}`;

  let html = '';

  if (provider === 'custom') {
    html = `
      <div class="space-y-3">
        <div>
          <label class="block text-xs text-gray-400 mb-1">API Endpoint URL</label>
          <input id="cfg-endpoint" type="text" value="${escapeAttr(config.endpoint)}" placeholder="http://localhost:11434/v1/chat/completions" class="w-full px-3 py-2 rounded-lg text-sm"/>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">API Key (optional)</label>
          <input id="cfg-apiKey" type="password" value="${escapeAttr(config.apiKey)}" placeholder="Leave blank if not required" class="w-full px-3 py-2 rounded-lg text-sm"/>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Model Name</label>
          <input id="cfg-model" type="text" value="${escapeAttr(config.model)}" placeholder="llama3.1, mistral, etc." class="w-full px-3 py-2 rounded-lg text-sm"/>
        </div>
      </div>
    `;
  } else {
    let optionsHtml = '';
    providerInfo.modelGroups.forEach(group => {
      optionsHtml += `<optgroup label="${group.label}">`;
      group.models.forEach(m => {
        const selected = config.model === m.value ? 'selected' : '';
        optionsHtml += `<option value="${m.value}" ${selected}>${m.label}</option>`;
      });
      optionsHtml += `</optgroup>`;
    });

    html = `
      <div class="space-y-3">
        <div>
          <label class="block text-xs text-gray-400 mb-1">API Key</label>
          <input id="cfg-apiKey" type="password" value="${escapeAttr(config.apiKey)}" placeholder="sk-..." class="w-full px-3 py-2 rounded-lg text-sm"/>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Model</label>
          <select id="cfg-model" class="w-full px-3 py-2 rounded-lg text-sm">
            ${optionsHtml}
          </select>
        </div>
      </div>
    `;
  }

  fieldsDiv.innerHTML = html;
}

function loadProviderSettingsUI() {
  document.querySelectorAll('.provider-card').forEach(c => c.classList.remove('selected'));
  const active = document.querySelector(`[data-provider="${providerSettings.activeProvider}"]`);
  if (active) active.classList.add('selected');
  renderProviderConfig(providerSettings.activeProvider);
}

function saveProviderConfig() {
  const provider = providerSettings.activeProvider;
  const config = providerSettings[provider];

  if (provider === 'custom') {
    config.endpoint = document.getElementById('cfg-endpoint').value.trim();
    config.apiKey = document.getElementById('cfg-apiKey').value.trim();
    config.model = document.getElementById('cfg-model').value.trim();
  } else {
    config.apiKey = document.getElementById('cfg-apiKey').value.trim();
    config.model = document.getElementById('cfg-model').value;
  }

  saveProviderSettings();
  toast('✓ Configuration saved');
}

async function testProviderConnection() {
  toast('⏳ Testing connection...');
  try {
    await callAI('Reply with {"status": "ok"}');
    toast('✓ Connection successful');
  } catch (err) {
    toast('✕ Connection failed: ' + err.message);
  }
}
