
let allPlugins = [];
let installedPlugins = [];
let updateResults = [];
let registeredMarketplaces = {};
let allSkillsReport = { skills: [], categories: { plugin: [], standalone: [], builtin: [] }, collisions: [] };
let allRules = [];
let allMcpServers = [];
let allAgents = [];
let activeFilter = 'all';
let activeAgySkillFilter = 'all';
let currentMarketDiscoveredItems = [];
let currentViewingSkillContent = '';

const pluginsGrid = document.getElementById('plugins-grid');
const installedContainer = document.getElementById('installed-container');
const updatesContainer = document.getElementById('updates-container');
const skillsCheckContainer = document.getElementById('skills-check-container');
const marketplacesContainer = document.getElementById('marketplaces-container');
const agySkillsGrid = document.getElementById('agy-skills-grid');
const rulesGrid = document.getElementById('rules-grid');
const agentsGrid = document.getElementById('agents-grid');
const mcpGrid = document.getElementById('mcp-grid');

const globalSearch = document.getElementById('global-search');
const countAvailable = document.getElementById('count-available');
const countInstalled = document.getElementById('count-installed');
const countUpdates = document.getElementById('count-updates');
const countSkills = document.getElementById('count-skills');
const countMarkets = document.getElementById('count-markets');
const countAgySkills = document.getElementById('count-agy-skills');
const countRules = document.getElementById('count-rules');
const countAgents = document.getElementById('count-agents');
const countMcp = document.getElementById('count-mcp');
const toastEl = document.getElementById('toast');

const btnRefresh = document.getElementById('btn-refresh');
const btnCheckUpdates = document.getElementById('btn-check-updates');
const btnCheckSkillsUpdates = document.getElementById('btn-check-skills-updates');
const btnUpdateAll = document.getElementById('btn-update-all');
const btnRunSkillsCheck = document.getElementById('btn-run-skills-check');
const btnRefreshRules = document.getElementById('btn-refresh-rules');
const btnRefreshAgents = document.getElementById('btn-refresh-agents');
const btnRefreshMcp = document.getElementById('btn-refresh-mcp');
const btnQuickNvidia = document.getElementById('btn-quick-nvidia');
const quickLinkNvidia = document.getElementById('quick-link-nvidia');
const quickLinkKarpathy = document.getElementById('quick-link-karpathy');

const inputCustomMarketUrl = document.getElementById('custom-market-url');
const btnDownloadMarket = document.getElementById('btn-download-market');
const marketSelectionPanel = document.getElementById('market-selection-panel');
const marketSelectionTitle = document.getElementById('market-selection-title');
const marketItemsList = document.getElementById('market-items-list');
const btnSelectAllMarket = document.getElementById('btn-select-all-market');
const btnInstallSelectedMarket = document.getElementById('btn-install-selected-market');

const btnMobileMenu = document.getElementById('btn-mobile-menu');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

const skillModal = document.getElementById('skill-modal');
const modalSkillTitle = document.getElementById('modal-skill-title');
const modalSkillPath = document.getElementById('modal-skill-path');
const modalSkillCode = document.getElementById('modal-skill-code');
const btnCloseSkillModal = document.getElementById('btn-close-skill-modal');
const btnCopySkillContent = document.getElementById('btn-copy-skill-content');

const createSkillModal = document.getElementById('create-skill-modal');
const btnOpenCreateSkill = document.getElementById('btn-open-create-skill');
const btnCloseCreateModal = document.getElementById('btn-close-create-modal');
const btnSaveNewSkill = document.getElementById('btn-save-new-skill');
const newSkillName = document.getElementById('new-skill-name');
const newSkillDesc = document.getElementById('new-skill-desc');
const newSkillInstructions = document.getElementById('new-skill-instructions');

const btnAbout = document.getElementById('btn-about');
const aboutModal = document.getElementById('about-modal');
const btnCloseAboutModal = document.getElementById('btn-close-about-modal');
const btnCloseAboutModalFoot = document.getElementById('btn-close-about-modal-foot');
const btnAppVersion = document.getElementById('btn-app-version');
const appVersionText = document.getElementById('app-version-text');
const btnResetCache = document.getElementById('btn-reset-cache');

let currentAppVersionData = null;

async function checkAppVersion(isManual = false) {
  if (!btnAppVersion || !appVersionText) return;
  try {
    const res = await fetch('/api/app-version');
    const data = await res.json();
    if (data.success) {
      currentAppVersionData = data;
      const label = data.displayLabel || (data.stage === 'beta' ? `v${data.version} (Beta)` : `v${data.version}`);
      appVersionText.textContent = label;
      const sideVer = document.getElementById('sidebar-version-label');
      if (sideVer) sideVer.textContent = `Claugravity ${label} • MIT License`;
      const modVer = document.getElementById('modal-version-val');
      if (modVer) modVer.textContent = `${data.version} (${data.stage === 'beta' ? 'Beta' : 'Stable'})`;

      if (data.hasUpdate) {
        btnAppVersion.classList.add('badge-update');
        btnAppVersion.style.background = 'rgba(245, 158, 11, 0.2)';
        btnAppVersion.style.color = '#fbbf24';
        btnAppVersion.style.borderColor = 'rgba(245, 158, 11, 0.5)';
        appVersionText.innerHTML = `⚡ Update: v${data.latestVersion} Available`;
        if (isManual) {
          if (confirm(`A new Claugravity update (v${data.latestVersion}) is available on GitHub!\n\nOpen ${data.blobUrl || data.repoUrl} to view?`)) {
            window.open(data.blobUrl || data.repoUrl, '_blank');
          }
        }
      } else {
        btnAppVersion.classList.remove('badge-update');
        btnAppVersion.style.background = '';
        btnAppVersion.style.color = '';
        btnAppVersion.style.borderColor = '';
        if (isManual) {
          showToast(`Claugravity ${label} is up to date (checked against GitHub)`, 'success');
        }
      }
    }
  } catch (err) {
    console.error('Failed to check app version:', err);
    if (isManual) showToast(`Version check error: ${err.message}`, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupMobileNav();
  setupNavigation();
  setupFilters();
  setupSearch();
  setupConvertForm();
  setupCustomMarketplace();
  setupModals();
  setupAgySkillFilters();
  loadAllData();
  checkAppVersion(false);

  if (btnRefresh) btnRefresh.addEventListener('click', loadAllData);
  if (btnAppVersion) btnAppVersion.addEventListener('click', () => checkAppVersion(true));
  if (btnCheckUpdates) {
    btnCheckUpdates.addEventListener('click', () => {
      switchTab('updates');
      loadUpdates();
    });
  }
  if (btnCheckSkillsUpdates) {
    btnCheckSkillsUpdates.addEventListener('click', async () => {
      showToast('Checking skills against upstream repositories...', 'info');
      switchTab('updates');
      await loadUpdates();
    });
  }
  if (btnRefreshRules) btnRefreshRules.addEventListener('click', loadRules);
  if (btnRefreshAgents) btnRefreshAgents.addEventListener('click', loadAgents);
  if (btnRefreshMcp) btnRefreshMcp.addEventListener('click', loadMcp);

  if (btnUpdateAll) btnUpdateAll.addEventListener('click', handleUpdateAll);
  if (btnResetCache) btnResetCache.addEventListener('click', handleResetCache);

  if (btnRunSkillsCheck) {
    btnRunSkillsCheck.addEventListener('click', loadSkillsCheck);
  }
  if (btnQuickNvidia) {
    btnQuickNvidia.addEventListener('click', () => {
      switchTab('marketplaces');
      inputCustomMarketUrl.value = 'https://github.com/NVIDIA/skills.git';
      btnDownloadMarket.click();
    });
  }
  if (quickLinkNvidia) {
    quickLinkNvidia.addEventListener('click', (e) => {
      e.preventDefault();
      inputCustomMarketUrl.value = 'https://github.com/NVIDIA/skills.git';
      btnDownloadMarket.click();
    });
  }
  if (quickLinkKarpathy) {
    quickLinkKarpathy.addEventListener('click', (e) => {
      e.preventDefault();
      inputCustomMarketUrl.value = 'https://github.com/forrestchang/andrej-karpathy-skills.git';
      btnDownloadMarket.click();
    });
  }
});

function setupMobileNav() {
  if (!btnMobileMenu || !sidebar || !sidebarOverlay) return;

  const toggleSidebar = () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
    btnMobileMenu.classList.toggle('active');
  };

  btnMobileMenu.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', toggleSidebar);
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.getAttribute('data-tab');
      switchTab(tab);
      if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        btnMobileMenu.classList.remove('active');
      }
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

  const navBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  const pane = document.getElementById(`tab-${tabId}`);

  if (navBtn) navBtn.classList.add('active');
  if (pane) pane.classList.add('active');

  if (tabId === 'antigravity-skills') renderAntigravitySkills();
  if (tabId === 'rules') loadRules();
  if (tabId === 'installed') loadInstalled();
  if (tabId === 'agents') loadAgents();
  if (tabId === 'mcp') loadMcp();
  if (tabId === 'updates') loadUpdates();
  if (tabId === 'skills-check') loadSkillsCheck();
}

async function loadAllData() {
  await Promise.all([
    loadMarketplacesAndPlugins(),
    loadInstalled(),
    loadUpdates(),
    loadSkillsCheck(),
    loadRules(),
    loadAgents(),
    loadMcp()
  ]);
}

async function loadMarketplacesAndPlugins() {
  try {
    const res = await fetch('/api/marketplaces');
    const data = await res.json();
    if (data.success) {
      allPlugins = data.plugins || [];
      countAvailable.textContent = allPlugins.length;
      registeredMarketplaces = data.marketplaces || {};
      countMarkets.textContent = Object.keys(registeredMarketplaces).length;
      renderMarketplaces(registeredMarketplaces);
      filterAndRenderPlugins();
    }
  } catch (err) {
    showToast('Failed to load marketplace plugins: ' + err.message, 'error');
  }
}

async function loadInstalled() {
  try {
    const res = await fetch('/api/installed');
    const data = await res.json();
    if (data.success) {
      installedPlugins = data.installed || [];
      countInstalled.textContent = installedPlugins.length;
      renderInstalled();
    }
  } catch (err) {
    console.error('Failed to load installed plugins:', err);
  }
}

async function loadUpdates() {
  updatesContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Checking GitHub and upstream repositories for updates...</p>
    </div>
  `;

  try {
    const [pluginsRes, skillsRes] = await Promise.all([
      fetch('/api/updates').then(r => r.json()).catch(() => ({ updates: [] })),
      fetch('/api/skills/updates').then(r => r.json()).catch(() => ({ updates: [] }))
    ]);

    const pluginUpdates = pluginsRes.updates || [];
    const skillUpdates = skillsRes.updates || [];

    updateResults = pluginUpdates;
    const pendingUpdates = updateResults.filter(u => u.hasUpdate);

    if (pendingUpdates.length > 0) {
      countUpdates.style.display = 'inline-block';
      countUpdates.textContent = pendingUpdates.length;
      btnUpdateAll.style.display = 'inline-flex';
    } else {
      countUpdates.style.display = 'none';
      btnUpdateAll.style.display = 'none';
    }

    renderUpdates(pluginUpdates, skillUpdates);
  } catch (err) {
    updatesContainer.innerHTML = `<p class="empty-state">Error checking updates: ${err.message}</p>`;
  }
}

async function loadSkillsCheck() {
  try {
    const res = await fetch('/api/skills/check');
    const data = await res.json();
    if (data.success) {
      allSkillsReport = data;
      countSkills.textContent = data.totalCount || 0;
      if (countAgySkills) countAgySkills.textContent = data.totalCount || 0;
      renderSkillsCheck(data);
      renderAntigravitySkills();
    }
  } catch (err) {
    skillsCheckContainer.innerHTML = `<p class="empty-state">Error evaluating skills: ${err.message}</p>`;
  }
}

function setupAgySkillFilters() {
  const chips = document.querySelectorAll('#agy-skills-filter-chips .chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeAgySkillFilter = chip.getAttribute('data-agy-filter');
      renderAntigravitySkills();
    });
  });
}

function renderAntigravitySkills() {
  const skills = allSkillsReport.skills || [];
  if (skills.length === 0) {
    agySkillsGrid.innerHTML = '<p class="empty-state">No Antigravity skills discovered in your environment (~/.gemini).</p>';
    return;
  }

  const cAll = document.getElementById('chip-count-all');
  const cBuiltin = document.getElementById('chip-count-builtin');
  const cStandalone = document.getElementById('chip-count-standalone');
  const cPlugin = document.getElementById('chip-count-plugin');

  if (cAll) cAll.textContent = skills.length;
  if (cBuiltin) cBuiltin.textContent = skills.filter(s => s.category === 'builtin').length;
  if (cStandalone) cStandalone.textContent = skills.filter(s => s.category === 'standalone').length;
  if (cPlugin) cPlugin.textContent = skills.filter(s => s.category === 'plugin').length;

  const query = (globalSearch.value || '').toLowerCase();

  const filtered = skills.filter(s => {
    let matchesCategory = true;
    if (activeAgySkillFilter === 'builtin') matchesCategory = s.category === 'builtin';
    else if (activeAgySkillFilter === 'standalone') matchesCategory = s.category === 'standalone';
    else if (activeAgySkillFilter === 'plugin') matchesCategory = s.category === 'plugin';

    const matchesSearch = !query ||
      s.name.toLowerCase().includes(query) ||
      (s.displayName && s.displayName.toLowerCase().includes(query)) ||
      (s.description && s.description.toLowerCase().includes(query)) ||
      (s.author && s.author.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    agySkillsGrid.innerHTML = '<p class="empty-state">No skills match the active filter or search query.</p>';
    return;
  }

  agySkillsGrid.innerHTML = filtered.map(s => {
    let originBadge = '';
    if (s.category === 'builtin') {
      originBadge = '<span class="card-tag" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">🏛️ Original Antigravity Core</span>';
    } else if (s.category === 'plugin') {
      originBadge = `<span class="card-tag" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3);">🔌 Plugin: ${escapeHtml(s.parentPlugin)}</span>`;
    } else {
      originBadge = '<span class="card-tag" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">🧩 Installed Standalone Skill</span>';
    }

    return `
    <div class="card" style="display: flex; flex-direction: column; border-left: 3px solid ${s.category === 'builtin' ? '#38bdf8' : (s.category === 'plugin' ? '#a855f7' : '#f59e0b')};">
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(s.displayName)}</div>
          <div class="card-meta" style="margin-top: 6px;">
            ${originBadge}
            <span>v${escapeHtml(s.version)}</span>
          </div>
        </div>
        ${s.isShadowed
          ? '<span class="card-badge badge-update">⚠️ Shadowed</span>'
          : '<span class="card-badge badge-installed">🟢 Active</span>'
        }
      </div>
      <div class="card-body">
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">${escapeHtml(s.description)}</p>
        <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-dim); display: flex; flex-direction: column; gap: 5px;">
          <div>Package: <span class="card-tag" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); font-size: 11px; padding: 2px 6px;">📦 ${escapeHtml(s.packageName || 'antigravity')}</span></div>
          <div>Author: <b>${s.authorUrl ? `<a href="${escapeHtml(s.authorUrl)}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: none;">${escapeHtml(formatAuthor(s.author))} ↗</a>` : escapeHtml(formatAuthor(s.author))}</b></div>
          ${s.repoUrl ? `<div>Repository: <a href="${escapeHtml(s.repoUrl.replace(/\.git$/, ''))}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: none; word-break: break-all;">${escapeHtml(s.repoUrl.replace(/\.git$/, ''))} ↗</a></div>` : ''}
          <div>Origin: <b>${s.category === 'builtin' ? 'Integrated Core (Google DeepMind)' : (s.category === 'plugin' ? `Plugin: ${escapeHtml(s.parentPlugin)}` : 'Standalone (~/.gemini/config/skills)')}</b></div>
          <div style="word-break: break-all;">Path: <code>${escapeHtml(s.filePath.split(/[/\\]/).slice(-3).join('/'))}</code></div>
        </div>
      </div>
      <div class="card-footer">
        <div style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%;">
          <button class="btn btn-secondary btn-copy-path" data-path="${escapeHtml(s.filePath)}" style="padding: 7px 11px; font-size: 12px;">
            📋 Copy
          </button>
          <button class="btn btn-secondary btn-view-skill" data-path="${escapeHtml(s.filePath)}" data-title="${escapeHtml(s.displayName)}" style="padding: 7px 11px; font-size: 12px;">
            📖 View
          </button>
          ${s.category !== 'builtin' ? `
            <button class="btn btn-primary btn-update-skill" data-name="${escapeHtml(s.name)}" style="padding: 7px 11px; font-size: 12px; margin-left: auto;">
              🔄 Update
            </button>
            <button class="btn btn-danger btn-delete-skill" data-path="${escapeHtml(s.filePath)}" data-name="${escapeHtml(s.displayName)}" style="padding: 7px 11px; font-size: 12px;">
              🗑️ Delete
            </button>
          ` : '<span style="font-size: 11px; color: #38bdf8; margin-left: auto; align-self: center; font-weight: 600;">Core Antigravity</span>'}
        </div>
      </div>
    </div>
  `;
  }).join('');

  agySkillsGrid.querySelectorAll('.btn-view-skill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = e.currentTarget.getAttribute('data-path');
      const t = e.currentTarget.getAttribute('data-title');
      openSkillViewer(p, t);
    });
  });

  agySkillsGrid.querySelectorAll('.btn-copy-path').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = e.currentTarget.getAttribute('data-path');
      navigator.clipboard.writeText(p);
      showToast('Path copied to clipboard!', 'success');
    });
  });

  agySkillsGrid.querySelectorAll('.btn-update-skill').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const name = e.currentTarget.getAttribute('data-name');
      const buttonEl = e.currentTarget;
      const originalText = buttonEl.innerHTML;
      buttonEl.disabled = true;
      buttonEl.innerHTML = '⏳ Updating...';

      try {
        const res = await fetch('/api/skills/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message, 'success');
          await loadSkillsCheck();
        } else {
          showToast(`Update error: ${data.error}`, 'error');
          buttonEl.disabled = false;
          buttonEl.innerHTML = originalText;
        }
      } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
        buttonEl.disabled = false;
        buttonEl.innerHTML = originalText;
      }
    });
  });

  agySkillsGrid.querySelectorAll('.btn-delete-skill').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const p = e.currentTarget.getAttribute('data-path');
      const name = e.currentTarget.getAttribute('data-name');
      if (!confirm(`Are you sure you want to delete the skill "${name}"?\n\nPath: ${p}`)) return;

      try {
        const res = await fetch('/api/skills/delete-path', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: p })
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Skill "${name}" was deleted successfully.`, 'success');
          await loadSkillsCheck();
        } else {
          showToast(`Delete error: ${data.error}`, 'error');
        }
      } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  });
}

async function loadRules() {
  if (!rulesGrid) return;
  rulesGrid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Scanning active directives and rule files...</p>
    </div>
  `;
  try {
    const res = await fetch('/api/rules');
    const data = await res.json();
    if (data.success) {
      allRules = data.rules || [];
      if (countRules) countRules.textContent = allRules.length;
      renderRules();
    }
  } catch (err) {
    rulesGrid.innerHTML = `<p class="empty-state">Error loading rules: ${err.message}</p>`;
  }
}

function renderRules() {
  if (!rulesGrid) return;
  if (allRules.length === 0) {
    rulesGrid.innerHTML = '<p class="empty-state">No active rule files found.</p>';
    return;
  }

  rulesGrid.innerHTML = allRules.map(r => `
    <div class="card" style="display: flex; flex-direction: column; border-left: 3px solid #10b981;">
      <div class="card-header">
        <div>
          <div class="card-title">📜 ${escapeHtml(r.name)}</div>
          <div class="card-meta" style="margin-top: 6px;">
            <span class="card-tag" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">${escapeHtml(r.scope)}</span>
            <span>${r.linesCount} lines • ${(r.size / 1024).toFixed(1)} KB</span>
          </div>
        </div>
        <span class="card-badge badge-installed">🟢 Active Directive</span>
      </div>
      <div class="card-body">
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">${escapeHtml(r.description)}</p>
        <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-dim); display: flex; flex-direction: column; gap: 4px;">
          <div>Target: <b>${escapeHtml(r.target)}</b></div>
          <div style="word-break: break-all;">Path: <code>${escapeHtml(r.path)}</code></div>
        </div>
      </div>
      <div class="card-footer">
        <div style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%;">
          <button class="btn btn-secondary btn-copy-path" data-path="${escapeHtml(r.path)}" style="padding: 7px 11px; font-size: 12px;">
            📋 Copy Path
          </button>
          <button class="btn btn-primary btn-view-rule" data-path="${escapeHtml(r.path)}" data-title="${escapeHtml(r.name)}" style="padding: 7px 11px; font-size: 12px; margin-left: auto;">
            📖 View Directives
          </button>
        </div>
      </div>
    </div>
  `).join('');

  rulesGrid.querySelectorAll('.btn-copy-path').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = e.currentTarget.getAttribute('data-path');
      navigator.clipboard.writeText(p);
      showToast('Path copied to clipboard!', 'success');
    });
  });

  rulesGrid.querySelectorAll('.btn-view-rule').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const p = e.currentTarget.getAttribute('data-path');
      const t = e.currentTarget.getAttribute('data-title');
      try {
        const res = await fetch(`/api/rules/content?path=${encodeURIComponent(p)}`);
        const data = await res.json();
        if (data.success) {
          modalSkillTitle.textContent = t;
          modalSkillPath.textContent = p;
          modalSkillCode.textContent = data.content;
          currentViewingSkillContent = data.content;
          skillModal.style.display = 'flex';
        } else {
          showToast(`Error: ${data.error}`, 'error');
        }
      } catch (err) {
        showToast(`Failed: ${err.message}`, 'error');
      }
    });
  });
}

async function loadAgents() {
  if (!agentsGrid) return;
  agentsGrid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Discovering registered and available agents...</p>
    </div>
  `;
  try {
    const res = await fetch('/api/agents');
    const data = await res.json();
    if (data.success) {
      allAgents = data.agents || [];
      if (countAgents) countAgents.textContent = allAgents.length;
      renderAgents();
    }
  } catch (err) {
    agentsGrid.innerHTML = `<p class="empty-state">Error loading agents: ${err.message}</p>`;
  }
}

function renderAgents() {
  if (!agentsGrid) return;
  if (allAgents.length === 0) {
    agentsGrid.innerHTML = '<p class="empty-state">No agents or subagents discovered.</p>';
    return;
  }

  agentsGrid.innerHTML = allAgents.map(a => {
    let typeBadge = '';
    let borderColor = '#ec4899';
    if (a.type === 'builtin') {
      typeBadge = '<span class="card-tag" style="background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3);">🏛️ Antigravity Core Subagent</span>';
      borderColor = '#ec4899';
    } else if (a.type === 'plugin') {
      typeBadge = `<span class="card-tag" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3);">${escapeHtml(a.origin)}</span>`;
      borderColor = '#a855f7';
    } else {
      typeBadge = `<span class="card-tag" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">${escapeHtml(a.origin)}</span>`;
      borderColor = '#f59e0b';
    }

    return `
      <div class="card" style="display: flex; flex-direction: column; border-left: 3px solid ${borderColor};">
        <div class="card-header">
          <div>
            <div class="card-title">🤖 ${escapeHtml(a.name)}</div>
            <div class="card-meta" style="margin-top: 6px;">
              ${typeBadge}
              <span>${escapeHtml(a.role || 'Agent')}</span>
            </div>
          </div>
          <span class="card-badge badge-installed">🟢 Active</span>
        </div>
        <div class="card-body">
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">${escapeHtml(a.description)}</p>
          <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-dim); display: flex; flex-direction: column; gap: 4px;">
            ${a.model ? `<div>Model Policy: <b>${escapeHtml(a.model)}</b></div>` : ''}
            <div>Equipped Tools: <code>${escapeHtml((a.tools || []).join(', '))}</code></div>
            ${a.filePath ? `<div style="word-break: break-all;">Config: <code>${escapeHtml(a.filePath.split(/[/\\]/).slice(-3).join('/'))}</code></div>` : ''}
          </div>
        </div>
        <div class="card-footer">
          <div style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%;">
            ${a.filePath ? `
              <button class="btn btn-secondary btn-copy-path" data-path="${escapeHtml(a.filePath)}" style="padding: 7px 11px; font-size: 12px;">
                📋 Copy Config Path
              </button>
            ` : '<span style="font-size: 12px; color: #f472b6; font-weight: 600;">Invoke via <code>invoke_subagent</code></span>'}
          </div>
        </div>
      </div>
    `;
  }).join('');

  agentsGrid.querySelectorAll('.btn-copy-path').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = e.currentTarget.getAttribute('data-path');
      navigator.clipboard.writeText(p);
      showToast('Path copied to clipboard!', 'success');
    });
  });
}

async function loadMcp() {
  if (!mcpGrid) return;
  mcpGrid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Discovering MCP servers and active tools...</p>
    </div>
  `;
  try {
    const res = await fetch('/api/mcp');
    const data = await res.json();
    if (data.success) {
      allMcpServers = data.servers || [];
      if (countMcp) countMcp.textContent = allMcpServers.length;
      renderMcp();
    }
  } catch (err) {
    mcpGrid.innerHTML = `<p class="empty-state">Error loading MCP servers: ${err.message}</p>`;
  }
}

function renderMcp() {
  if (!mcpGrid) return;
  if (allMcpServers.length === 0) {
    mcpGrid.innerHTML = '<p class="empty-state">No MCP servers currently configured in Antigravity (~/.gemini/antigravity/mcp_config.json).</p>';
    return;
  }

  mcpGrid.innerHTML = allMcpServers.map(s => {
    const toolsList = (s.tools || []).slice(0, 10).map(t => `
      <span class="card-tag" style="background: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); font-size: 10px; margin: 2px;" title="${escapeHtml(t.description)}">
        🔧 ${escapeHtml(t.name)}
      </span>
    `).join('');

    const moreTools = (s.tools || []).length > 10 ? `<span style="font-size: 11px; color: var(--text-dim); align-self: center;">+${s.tools.length - 10} more</span>` : '';

    return `
      <div class="card" style="display: flex; flex-direction: column; border-left: 3px solid #f59e0b;">
        <div class="card-header">
          <div>
            <div class="card-title">⚡ ${escapeHtml(s.name)}</div>
            <div class="card-meta" style="margin-top: 6px;">
              <span class="card-tag" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">MCP Server</span>
              <span>${s.toolsCount} registered tools</span>
            </div>
          </div>
          <span class="card-badge badge-installed">🟢 ${escapeHtml(s.status)}</span>
        </div>
        <div class="card-body">
          <div style="font-size: 12px; font-family: var(--font-mono); color: var(--text-muted); margin-bottom: 10px;">
            Command: <code>${escapeHtml(s.command)} ${(s.args || []).map(a => escapeHtml(a.split(/[/\\]/).pop())).join(' ')}</code>
          </div>
          <div style="margin-bottom: 8px;">
            <div style="font-size: 11px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; margin-bottom: 6px;">Discovered Tools (${s.toolsCount})</div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${toolsList || '<span style="font-size: 12px; color: var(--text-dim);">No individual JSON schemas found</span>'}
              ${moreTools}
            </div>
          </div>
          <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-dim); margin-top: 8px; word-break: break-all;">
            Config: <code>${escapeHtml(s.configPath)}</code>
          </div>
        </div>
        <div class="card-footer">
          <div style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%;">
            <button class="btn btn-secondary btn-copy-path" data-path="${escapeHtml(s.configPath)}" style="padding: 7px 11px; font-size: 12px;">
              📋 Copy Config Path
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  mcpGrid.querySelectorAll('.btn-copy-path').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = e.currentTarget.getAttribute('data-path');
      navigator.clipboard.writeText(p);
      showToast('Path copied to clipboard!', 'success');
    });
  });
}

function setupModals() {
  btnCloseSkillModal.addEventListener('click', () => {
    skillModal.style.display = 'none';
  });
  skillModal.addEventListener('click', (e) => {
    if (e.target === skillModal) skillModal.style.display = 'none';
  });

  btnCopySkillContent.addEventListener('click', () => {
    navigator.clipboard.writeText(currentViewingSkillContent);
    showToast('Skill instructions copied to clipboard!', 'success');
  });

  btnOpenCreateSkill.addEventListener('click', () => {
    createSkillModal.style.display = 'flex';
  });
  btnCloseCreateModal.addEventListener('click', () => {
    createSkillModal.style.display = 'none';
  });
  createSkillModal.addEventListener('click', (e) => {
    if (e.target === createSkillModal) createSkillModal.style.display = 'none';
  });

  if (btnAbout && aboutModal) {
    btnAbout.addEventListener('click', () => {
      aboutModal.style.display = 'flex';
    });
  }
  if (btnCloseAboutModal && aboutModal) {
    btnCloseAboutModal.addEventListener('click', () => {
      aboutModal.style.display = 'none';
    });
  }
  if (btnCloseAboutModalFoot && aboutModal) {
    btnCloseAboutModalFoot.addEventListener('click', () => {
      aboutModal.style.display = 'none';
    });
  }
  if (aboutModal) {
    aboutModal.addEventListener('click', (e) => {
      if (e.target === aboutModal) aboutModal.style.display = 'none';
    });
  }

  btnSaveNewSkill.addEventListener('click', async () => {
    const name = newSkillName.value.trim();
    const desc = newSkillDesc.value.trim();
    const inst = newSkillInstructions.value.trim();

    if (!name) {
      showToast('Please provide a skill name.', 'error');
      return;
    }

    btnSaveNewSkill.disabled = true;
    btnSaveNewSkill.innerHTML = '⏳ Saving skill...';

    try {
      const res = await fetch('/api/skills/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc, instructions: inst })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Skill "${data.name}" created and active in Antigravity!`, 'success');
        createSkillModal.style.display = 'none';
        newSkillName.value = '';
        newSkillDesc.value = '';
        newSkillInstructions.value = '';
        await loadSkillsCheck();
        switchTab('antigravity-skills');
      } else {
        showToast('Error: ' + data.error, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnSaveNewSkill.disabled = false;
      btnSaveNewSkill.innerHTML = '💾 Save & Activate in Antigravity';
    }
  });
}

async function openSkillViewer(filePath, title) {
  modalSkillTitle.textContent = title || 'Skill Details';
  modalSkillPath.textContent = filePath || '';
  modalSkillCode.textContent = 'Loading instructions...';
  skillModal.style.display = 'flex';

  try {
    const res = await fetch(`/api/skills/content?path=${encodeURIComponent(filePath)}`);
    const data = await res.json();
    if (data.success) {
      currentViewingSkillContent = data.content;
      modalSkillCode.textContent = data.content;
    } else {
      modalSkillCode.textContent = 'Error: ' + (data.error || 'Failed to load SKILL.md');
    }
  } catch (err) {
    modalSkillCode.textContent = 'Error: ' + err.message;
  }
}

function renderSkillsCheck(report) {
  const skills = report.skills || [];
  if (skills.length === 0) {
    skillsCheckContainer.innerHTML = '<p class="empty-state">No installed skills to inspect.</p>';
    return;
  }

  const healthyCount = skills.filter(s => s.isHealthy && s.checks.securitySafe).length;
  const categories = report.categories || { plugin: [], standalone: [], builtin: [] };
  const collisions = report.collisions || [];

  let html = `
    <!-- Top Stats -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; margin-bottom: 24px;">
      <div class="card" style="text-align: center; padding: 14px;">
        <div style="font-size: 24px; font-weight: 700; color: var(--success);">${healthyCount}/${skills.length}</div>
        <div style="font-size: 12px; color: var(--text-muted);">Skills Healthy & Safe</div>
      </div>
      <div class="card" style="text-align: center; padding: 14px;">
        <div style="font-size: 24px; font-weight: 700; color: var(--accent);">${categories.plugin.length}</div>
        <div style="font-size: 12px; color: var(--text-muted);">From Plugins</div>
      </div>
      <div class="card" style="text-align: center; padding: 14px;">
        <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${categories.standalone.length}</div>
        <div style="font-size: 12px; color: var(--text-muted);">Standalone (~/.gemini)</div>
      </div>
      <div class="card" style="text-align: center; padding: 14px;">
        <div style="font-size: 24px; font-weight: 700; color: #38bdf8;">${categories.builtin.length}</div>
        <div style="font-size: 12px; color: var(--text-muted);">Antigravity Built-in</div>
      </div>
    </div>
  `;

  if (collisions.length > 0) {
    html += `
      <div class="collision-banner">
        <h3 style="color: var(--warning); font-size: 16px; margin-bottom: 6px;">⚠️ Skill Name Collisions Detected (${collisions.length})</h3>
        <p style="font-size: 13px; color: var(--text-main); margin-bottom: 14px; line-height: 1.4;">
          These skills exist in both standalone format and inside an installed plugin. In Antigravity, standalone skills take precedence and shadow plugin versions. You can choose which version to keep:
        </p>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${collisions.map(c => {
            const standaloneSkill = c.activeSkill.category === 'standalone' ? c.activeSkill : c.duplicates.find(d => d.category === 'standalone');
            const pluginSkill = c.activeSkill.category === 'plugin' ? c.activeSkill : c.duplicates.find(d => d.category === 'plugin');

            const standalonePath = standaloneSkill ? standaloneSkill.filePath.replace(/\\/g, '/') : '';
            const pluginPath = pluginSkill ? pluginSkill.filePath.replace(/\\/g, '/') : '';

            return `
              <div class="collision-item">
                <div>
                  <div style="font-weight: 700; font-size: 14px; color: white;">${escapeHtml(c.skillName)}</div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                    Active: <b style="color: #6ee7b7;">${escapeHtml(c.activeSkill.origin)}</b> • Shadowed: <b style="color: #fde68a;">${c.duplicates.map(d => escapeHtml(d.origin)).join(', ')}</b>
                  </div>
                </div>
                <div class="collision-actions">
                  ${standaloneSkill ? `
                    <button class="btn btn-warning btn-remove-skill-path" data-path="${escapeHtml(standalonePath)}" data-label="standalone Antigravity skill">
                      🗑️ Delete Standalone (Keep Plugin)
                    </button>
                  ` : ''}
                  ${pluginSkill ? `
                    <button class="btn btn-danger btn-remove-skill-path" data-path="${escapeHtml(pluginPath)}" data-label="plugin skill">
                      🗑️ Delete Plugin (Keep Standalone)
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  if (categories.standalone.length > 0) {
    html += `
      <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div>
          <h4 style="font-size: 15px; margin-bottom: 4px; color: #93c5fd;">📦 Organize Loose Skills into a Plugin</h4>
          <p style="font-size: 13px; color: var(--text-muted);">
            You have <b>${categories.standalone.length}</b> loose standalone skills in <code>~/.gemini/config/skills</code>. You can group them into a single clean Antigravity plugin.
          </p>
        </div>
        <button class="btn btn-primary" id="btn-consolidate-now">
          📦 Package into 'superpowers'
        </button>
      </div>
    `;
  }

  html += `
    <div class="filter-chips-row" id="skill-cat-chips">
      <button class="chip active" data-cat="all">All Skills (${skills.length})</button>
      <button class="chip" data-cat="plugin">📦 From Marketplace (${categories.plugin.length})</button>
      <button class="chip" data-cat="standalone">🧩 Standalone (${categories.standalone.length})</button>
      <button class="chip" data-cat="builtin">⚙️ Antigravity Core (${categories.builtin.length})</button>
    </div>

    <div class="cards-grid" id="skills-cards-list">
      ${renderSkillCards(skills)}
    </div>
  `;

  skillsCheckContainer.innerHTML = html;

  skillsCheckContainer.querySelectorAll('.btn-remove-skill-path').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const targetPath = e.currentTarget.getAttribute('data-path');
      const label = e.currentTarget.getAttribute('data-label');
      if (!confirm(`Are you sure you want to delete this ${label}?\n\nPath: ${targetPath}`)) return;

      try {
        const res = await fetch('/api/skills/delete-path', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: targetPath })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message, 'success');
          loadSkillsCheck();
        } else {
          showToast(`Error: ${data.error}`, 'error');
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  const btnConsolidate = skillsCheckContainer.querySelector('#btn-consolidate-now');
  if (btnConsolidate) {
    btnConsolidate.addEventListener('click', async () => {
      if (!confirm('Package all standalone skills into an Antigravity plugin named "superpowers"?')) return;
      btnConsolidate.disabled = true;
      btnConsolidate.innerHTML = '⏳ Packaging skills...';
      try {
        const standaloneNames = categories.standalone.map(s => s.name);
        const res = await fetch('/api/skills/consolidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillNames: standaloneNames, pluginName: 'superpowers' })
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Successfully packaged ${data.movedCount} skills into "superpowers"!`, 'success');
          loadAllData();
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  const catChips = skillsCheckContainer.querySelectorAll('#skill-cat-chips .chip');
  catChips.forEach(chip => {
    chip.addEventListener('click', () => {
      catChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const cat = chip.getAttribute('data-cat');
      const filtered = cat === 'all' ? skills : skills.filter(s => s.category === cat);
      const listContainer = skillsCheckContainer.querySelector('#skills-cards-list');
      if (listContainer) listContainer.innerHTML = renderSkillCards(filtered);
    });
  });
}

function renderSkillCards(skills) {
  return skills.map(s => `
    <div class="card" style="${s.isShadowed ? 'opacity: 0.7; border-color: rgba(245, 158, 11, 0.4);' : ''}">
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(s.displayName)}</div>
          <div class="card-meta">
            <span class="card-tag">${escapeHtml(s.origin)}</span>
            <span>v${escapeHtml(s.version)}</span>
          </div>
        </div>
        ${s.isShadowed
          ? '<span class="card-badge badge-update">⚠️ Shadowed</span>'
          : (s.isHealthy && s.checks.securitySafe
            ? '<span class="card-badge badge-installed">✓ Active</span>'
            : '<span class="card-badge badge-update">⚠️ Issue</span>'
          )
        }
      </div>
      <div class="card-body">
        <p style="font-size: 12px; margin-bottom: 10px; color: var(--text-muted);">${escapeHtml(s.description)}</p>
        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-family: var(--font-mono); color: var(--text-dim);">
          <div>Author: <b>${escapeHtml(s.author)}</b></div>
          <div>Status: ${s.isActive ? '🟢 Active in Antigravity' : `🟠 Shadowed (${s.shadowedBy || 'another skill'})`}</div>
          <div>Security: ${s.checks.securitySafe ? '✅ Safe (SkillSpector)' : '⚠️ Warning'}</div>
        </div>
        ${s.issues && s.issues.length > 0 ? `
          <div style="margin-top: 10px; padding: 8px; background: rgba(239,68,68,0.1); border-radius: 6px; font-size: 11px; color: #fca5a5;">
            ${s.issues.map(i => `<div>• ${escapeHtml(i.message)}</div>`).join('')}
          </div>
        ` : ''}
      </div>
      <div class="card-footer" style="gap: 8px;">
        <span style="font-size: 11px; color: var(--text-dim); word-break: break-all;">${escapeHtml(s.filePath.split(/[/\\]/).slice(-3).join('/'))}</span>
        <button class="btn btn-secondary btn-inspect-modal-skill" data-path="${escapeHtml(s.filePath)}" data-title="${escapeHtml(s.displayName)}" style="padding: 5px 10px; font-size: 11px;">
          📖 Open
        </button>
      </div>
    </div>
  `).join('');
}

function setupCustomMarketplace() {
  btnDownloadMarket.addEventListener('click', async () => {
    const url = inputCustomMarketUrl.value.trim();
    if (!url) {
      showToast('Please enter a valid Git repository URL.', 'error');
      return;
    }

    btnDownloadMarket.disabled = true;
    btnDownloadMarket.innerHTML = '⏳ Downloading & analyzing market...';

    try {
      const res = await fetch('/api/marketplaces/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitUrl: url })
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Market "${data.marketplaceName}" cloned successfully!`, 'success');
        currentMarketDiscoveredItems = data.items || [];
        renderDiscoveredMarketItems(data.marketplaceName, currentMarketDiscoveredItems);
        await loadMarketplacesAndPlugins();
      } else {
        showToast(`Error: ${data.error || 'Failed to download market'}`, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      btnDownloadMarket.disabled = false;
      btnDownloadMarket.innerHTML = '⬇️ Download & Browse Items';
    }
  });

  function updateInstallSelectedBtn() {
    const checkedCount = marketItemsList.querySelectorAll('input[type="checkbox"]:checked').length;
    btnInstallSelectedMarket.textContent = `⚡ Install Selected (${checkedCount})`;
  }

  btnSelectAllMarket.addEventListener('click', () => {
    const checkboxes = marketItemsList.querySelectorAll('input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).length > 0 && Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    btnSelectAllMarket.textContent = allChecked ? 'Select All' : 'Deselect All';
    updateInstallSelectedBtn();
  });

  btnInstallSelectedMarket.addEventListener('click', async () => {
    const checkedBoxes = marketItemsList.querySelectorAll('input[type="checkbox"]:checked');
    if (checkedBoxes.length === 0) {
      showToast('Please check the items you want to install, or click "Install Item" directly on any card.', 'warning');
      return;
    }

    const selectedIds = new Set(Array.from(checkedBoxes).map(cb => cb.value));
    const itemsToInstall = currentMarketDiscoveredItems.filter(item => selectedIds.has(item.id));

    btnInstallSelectedMarket.disabled = true;
    btnInstallSelectedMarket.innerHTML = `⏳ Installing (${itemsToInstall.length})...`;

    try {
      const res = await fetch('/api/install-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToInstall, scope: 'global' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Successfully installed ${data.results.filter(r => r.success).length} selected items into Antigravity!`, 'success');
        marketSelectionPanel.style.display = 'none';
        await loadInstalled();
        await loadMarketplacesAndPlugins();
        await loadSkillsCheck();
      } else {
        showToast('Installation error: ' + data.error, 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      btnInstallSelectedMarket.disabled = false;
      updateInstallSelectedBtn();
    }
  });
}

function renderDiscoveredMarketItems(marketName, items) {
  if (items.length === 0) {
    marketSelectionPanel.style.display = 'block';
    marketSelectionTitle.textContent = `📦 Market "${marketName}" has no direct items.`;
    marketItemsList.innerHTML = '<p class="empty-state">No SKILL.md or plugin manifests found in repository.</p>';
    return;
  }

  marketSelectionPanel.style.display = 'block';
  marketSelectionTitle.textContent = `📦 Items in "${marketName}" (${items.length} available) — Select what you want to install:`;

  marketItemsList.innerHTML = items.map((item, index) => `
    <div class="card" style="background: var(--bg-primary); padding: 14px; display: flex; flex-direction: column; justify-content: space-between;">
      <div style="display: flex; align-items: flex-start; gap: 10px;">
        <input type="checkbox" id="item-${index}" value="${escapeHtml(item.id)}" style="margin-top: 4px; transform: scale(1.2); cursor: pointer;">
        <label for="item-${index}" style="cursor: pointer; flex: 1;">
          <div style="font-weight: 700; font-size: 14px; color: var(--text-main);">${escapeHtml(item.name)}</div>
          <div style="font-size: 11px; color: var(--accent); margin-bottom: 4px;">Type: ${escapeHtml(item.category || 'skill')}</div>
          <div style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">${escapeHtml(item.description || 'No description')}</div>
        </label>
      </div>
      <div style="display: flex; justify-content: flex-end; margin-top: 10px; border-top: 1px solid var(--border); padding-top: 8px;">
        <button class="btn btn-secondary btn-install-single-market-item" data-id="${escapeHtml(item.id)}" style="padding: 4px 10px; font-size: 11px;">
          ⚡ Install Item
        </button>
      </div>
    </div>
  `).join('');

  const checkboxes = marketItemsList.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const checkedCount = marketItemsList.querySelectorAll('input[type="checkbox"]:checked').length;
      btnInstallSelectedMarket.textContent = `⚡ Install Selected (${checkedCount})`;
    });
  });

  marketItemsList.querySelectorAll('.btn-install-single-market-item').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const itemId = e.currentTarget.getAttribute('data-id');
      const targetItem = currentMarketDiscoveredItems.find(i => i.id === itemId);
      if (!targetItem) return;

      const buttonEl = e.currentTarget;
      const originalText = buttonEl.innerHTML;
      buttonEl.disabled = true;
      buttonEl.innerHTML = '⏳ Installing...';

      try {
        const res = await fetch('/api/install-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [targetItem], scope: 'global' })
        });
        const data = await res.json();
        if (data.success && data.results?.[0]?.success) {
          showToast(`Item "${targetItem.name}" installed into Antigravity!`, 'success');
          buttonEl.innerHTML = '✓ Installed';
          buttonEl.classList.remove('btn-secondary');
          buttonEl.classList.add('btn-primary');
          await loadInstalled();
          await loadSkillsCheck();
        } else {
          showToast(`Failed to install item: ${data.error || 'Unknown error'}`, 'error');
          buttonEl.disabled = false;
          buttonEl.innerHTML = originalText;
        }
      } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
        buttonEl.disabled = false;
        buttonEl.innerHTML = originalText;
      }
    });
  });

  btnInstallSelectedMarket.textContent = '⚡ Install Selected (0)';
  btnSelectAllMarket.textContent = 'Select All';
}

function setupFilters() {
  const chips = document.querySelectorAll('#filter-chips-container .chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      filterAndRenderPlugins();
    });
  });
}

function setupSearch() {
  globalSearch.addEventListener('input', () => {
    filterAndRenderPlugins();
    renderAntigravitySkills();
  });
}

function filterAndRenderPlugins() {
  const query = (globalSearch.value || '').toLowerCase();

  const filtered = allPlugins.filter(p => {
    const matchesFilter =
      activeFilter === 'all' ||
      (p.marketplace && p.marketplace.toLowerCase().includes(activeFilter)) ||
      (p.category && p.category.toLowerCase().includes(activeFilter));

    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.marketplace && p.marketplace.toLowerCase().includes(query)) ||
      (p.keywords && p.keywords.some(k => k.toLowerCase().includes(query)));

    return matchesFilter && matchesSearch;
  });

  renderPluginsGrid(filtered);
}

function renderPluginsGrid(plugins) {
  if (plugins.length === 0) {
    pluginsGrid.innerHTML = `
      <div class="loading-state">
        <p>No plugins match current filter criteria.</p>
      </div>
    `;
    return;
  }

  const installedNames = new Set(installedPlugins.map(i => i.name));

  pluginsGrid.innerHTML = plugins.slice(0, 80).map(p => {
    const isInstalled = installedNames.has(p.name);
    const authorStr = formatAuthor(p.author);
    const repo = p.repository || p.gitUrl || null;
    const cleanRepo = repo ? String(repo).replace(/^git\+/, '').replace(/\.git$/, '') : null;

    return `
      <div class="card" data-id="${p.id}" style="display: flex; flex-direction: column; justify-content: space-between; border-left: 3px solid ${isInstalled ? '#10b981' : '#6366f1'};">
        <div class="card-header">
          <div>
            <div class="card-title">${escapeHtml(p.displayName || p.name)}</div>
            <div class="card-meta" style="margin-top: 6px;">
              <span class="card-tag" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);">🏪 Shop: ${escapeHtml(p.marketplace || 'community')}</span>
              <span>v${escapeHtml(p.version || '1.0.0')}</span>
            </div>
          </div>
          ${isInstalled ? '<span class="card-badge badge-installed">✓ In Antigravity</span>' : ''}
        </div>
        <div class="card-body">
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">${escapeHtml(p.description || 'No description.')}</p>
          <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-dim); display: flex; flex-direction: column; gap: 5px;">
            <div>Author: <b>${p.authorUrl ? `<a href="${escapeHtml(p.authorUrl)}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: none;">${escapeHtml(authorStr)} ↗</a>` : escapeHtml(authorStr)}</b></div>
            ${cleanRepo ? `<div>Repository: <a href="${escapeHtml(cleanRepo)}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: none; word-break: break-all;">${escapeHtml(cleanRepo)} ↗</a></div>` : ''}
            <div>Marketplace: <span class="card-tag" style="font-size: 10px; padding: 1px 5px;">${escapeHtml(p.marketplace || 'community')}</span></div>
          </div>
        </div>
        <div class="card-footer" style="margin-top: 10px;">
          <span style="font-size: 11px; color: var(--text-dim);">${escapeHtml(authorStr)}</span>
          ${isInstalled
            ? `<button class="btn btn-secondary btn-uninstall" data-id="${escapeHtml(p.name)}">Uninstall</button>`
            : `<button class="btn btn-primary btn-install" data-id="${escapeHtml(p.id)}">⚡ Install</button>`
          }
        </div>
      </div>
    `;
  }).join('');

  pluginsGrid.querySelectorAll('.btn-install').forEach(btn => {
    btn.addEventListener('click', (e) => handleInstall(e.target.getAttribute('data-id'), e.target));
  });

  pluginsGrid.querySelectorAll('.btn-uninstall').forEach(btn => {
    btn.addEventListener('click', (e) => handleUninstall(e.target.getAttribute('data-id'), e.target));
  });
}

function renderInstalled() {
  if (installedPlugins.length === 0) {
    installedContainer.innerHTML = '<p class="empty-state">No packages installed through the marketplace yet.</p>';
    return;
  }

  installedContainer.innerHTML = `
    <div class="cards-grid">
      ${installedPlugins.map(p => `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">${escapeHtml(p.displayName || p.name)}</div>
              <div class="card-meta">
                <span class="card-tag">${escapeHtml(p.marketplace || 'custom')}</span>
                <span>v${escapeHtml(p.version || '1.0.0')}</span>
                ${p.commitSha ? `<span style="font-family: var(--font-mono); font-size: 10px; color: var(--text-dim);">#${p.commitSha.slice(0, 7)}</span>` : ''}
              </div>
            </div>
            <span class="card-badge badge-installed">Active</span>
          </div>
          <div class="card-body">
            <div style="font-family: var(--font-mono); font-size: 11px; margin-bottom: 8px; color: var(--text-dim); word-break: break-all;">
              📂 ${escapeHtml(p.installPath)}
            </div>
            ${p.gitUrl ? `<div style="font-size: 11px; color: var(--accent); margin-bottom: 6px; word-break: break-all;">🔗 ${escapeHtml(p.gitUrl)}</div>` : ''}
            ${p.stats ? `
              <div style="font-size: 12px; color: var(--text-muted);">
                ✨ Skills: <b>${p.stats.skillsCount || 0}</b> • Rules: <b>${p.stats.hasRules ? 'Yes' : 'No'}</b> • MCP: <b>${p.stats.hasMcp ? 'Yes' : 'No'}</b>
              </div>
            ` : ''}
          </div>
          <div class="card-footer">
            <span style="font-size: 11px; color: var(--text-dim);">Installed: ${new Date(p.installedAt).toLocaleDateString()}</span>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-secondary btn-update-single" data-id="${escapeHtml(p.id)}">Update</button>
              <button class="btn btn-danger btn-uninstall-installed" data-id="${escapeHtml(p.id)}">Delete</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  installedContainer.querySelectorAll('.btn-update-single').forEach(btn => {
    btn.addEventListener('click', (e) => handleUpdateSingle(e.target.getAttribute('data-id'), e.target));
  });

  installedContainer.querySelectorAll('.btn-uninstall-installed').forEach(btn => {
    btn.addEventListener('click', (e) => handleUninstall(e.target.getAttribute('data-id'), e.target));
  });
}

function renderUpdates(pluginUpdates = [], skillUpdates = []) {
  let html = '';

  html += `<h3 style="font-size: 16px; margin-bottom: 12px; color: #93c5fd;">📦 Installed Marketplace Plugins (${pluginUpdates.length})</h3>`;
  if (pluginUpdates.length === 0) {
    html += '<p class="empty-state" style="padding: 24px;">No plugins installed for update check.</p>';
  } else {
    html += `
      <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 32px;">
        ${pluginUpdates.map(u => `
          <div class="card" style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="font-weight: 700; font-size: 15px;">${escapeHtml(u.displayName)}</div>
              <div style="font-size: 12px; color: var(--text-muted);">
                Installed version: <code>${escapeHtml(u.currentVersion)}</code>
                ${u.hasUpdate ? ` ➔ Latest: <b style="color: var(--warning);">${escapeHtml(u.latestVersion)}</b>` : ' • Up to date'}
              </div>
              ${u.gitUrl ? `<div style="font-size: 11px; color: var(--accent); word-break: break-all;">🔗 ${escapeHtml(u.gitUrl)}</div>` : ''}
              ${u.reason ? `<div style="font-size: 12px; color: var(--warning); font-weight: 500;">⚡ ${escapeHtml(u.reason)}</div>` : ''}
            </div>
            <div>
              ${u.hasUpdate
                ? `<button class="btn btn-primary btn-update-single" data-id="${escapeHtml(u.id)}">⚡ Update</button>`
                : '<span class="card-badge badge-installed">Up to date</span>'
              }
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  html += `<h3 style="font-size: 16px; margin-bottom: 12px; color: #6ee7b7;">🧠 Antigravity Skills & Upstream Sync (${skillUpdates.length})</h3>`;
  if (skillUpdates.length === 0) {
    html += '<p class="empty-state" style="padding: 24px;">No skills registered.</p>';
  } else {
    html += `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px;">
        ${skillUpdates.map(s => `
          <div class="card" style="padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <div style="font-weight: 700; font-size: 14px;">${escapeHtml(s.displayName)}</div>
              <span class="card-tag">${escapeHtml(s.category)}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">
              Source: <b>${escapeHtml(s.upstream)}</b>
            </div>
            <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-dim); margin-bottom: 10px;">
              Status: ${s.category === 'builtin' ? 'Managed by Antigravity' : 'Sync ready via Git'}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 8px;">
              ${s.category !== 'builtin' ? `
                <button class="btn btn-secondary btn-update-skill" data-name="${escapeHtml(s.name)}" style="font-size: 11px; padding: 4px 10px;">
                  🔄 Sync / Update
                </button>
              ` : '<span class="card-badge badge-installed" style="font-size: 11px;">✓ Up to date</span>'}
              ${s.repoUrl ? `<a href="${escapeHtml(s.repoUrl)}" target="_blank" style="font-size: 11px; color: var(--accent); text-decoration: none;">GitHub ↗</a>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  updatesContainer.innerHTML = html;

  updatesContainer.querySelectorAll('.btn-update-single').forEach(btn => {
    btn.addEventListener('click', (e) => handleUpdateSingle(e.target.getAttribute('data-id'), e.target));
  });

  updatesContainer.querySelectorAll('.btn-update-skill').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const name = e.currentTarget.getAttribute('data-name');
      const buttonEl = e.currentTarget;
      const originalText = buttonEl.innerHTML;
      buttonEl.disabled = true;
      buttonEl.innerHTML = '⏳ Syncing...';

      try {
        const res = await fetch('/api/skills/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message, 'success');
          await loadUpdates();
          await loadSkillsCheck();
        } else {
          showToast(`Error: ${data.error}`, 'error');
          buttonEl.disabled = false;
          buttonEl.innerHTML = originalText;
        }
      } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
        buttonEl.disabled = false;
        buttonEl.innerHTML = originalText;
      }
    });
  });
}

function renderMarketplaces(marketplaces) {
  const entries = Object.entries(marketplaces);
  if (entries.length === 0) {
    marketplacesContainer.innerHTML = '<p class="empty-state">No marketplaces registered yet.</p>';
    return;
  }

  marketplacesContainer.innerHTML = entries.map(([name, info]) => `
    <div class="card">
      <div class="card-header">
        <div class="card-title">${escapeHtml(name)}</div>
        <span class="card-tag">${info.type === 'custom-marketplace' ? 'Custom GitHub' : 'Claude Market'}</span>
      </div>
      <div class="card-body">
        <p style="font-size: 12px; color: var(--text-muted); word-break: break-all; margin-bottom: 8px;">
          🔗 ${escapeHtml(info.source?.url || 'Local checkout')}
        </p>
        <p style="font-size: 11px; color: var(--text-dim); font-family: var(--font-mono);">
          📁 ${escapeHtml(info.installLocation || '')}
        </p>
        ${info.itemCount ? `<div style="margin-top: 6px; font-size: 12px; color: var(--accent);">Items available: <b>${info.itemCount}</b></div>` : ''}
      </div>
      <div class="card-footer" style="gap: 8px; flex-wrap: wrap;">
        <span style="font-size: 11px; color: var(--text-dim);">Updated: ${info.lastUpdated ? new Date(info.lastUpdated).toLocaleDateString() : 'N/A'}</span>
        <div style="display: flex; gap: 6px; margin-left: auto;">
          <button class="btn btn-secondary btn-inspect-market" data-url="${escapeHtml(info.source?.url || '')}" data-name="${escapeHtml(name)}" style="padding: 6px 10px; font-size: 12px;">Browse</button>
          <button class="btn btn-secondary btn-update-market" data-name="${escapeHtml(name)}" style="padding: 6px 10px; font-size: 12px;">🔄 Sync</button>
          ${info.type === 'custom-marketplace' ? `
            <button class="btn btn-danger btn-remove-market" data-name="${escapeHtml(name)}" style="padding: 6px 10px; font-size: 12px;">🗑️</button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');

  marketplacesContainer.querySelectorAll('.btn-inspect-market').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const url = e.target.getAttribute('data-url');
      if (url) {
        inputCustomMarketUrl.value = url;
        btnDownloadMarket.click();
      }
    });
  });

  marketplacesContainer.querySelectorAll('.btn-update-market').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const name = e.target.getAttribute('data-name');
      const buttonEl = e.target;
      const originalText = buttonEl.innerHTML;
      buttonEl.disabled = true;
      buttonEl.innerHTML = '⏳';

      try {
        const res = await fetch('/api/marketplaces/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message, 'success');
          await loadMarketplacesAndPlugins();
        } else {
          showToast(`Update error: ${data.error}`, 'error');
          buttonEl.disabled = false;
          buttonEl.innerHTML = originalText;
        }
      } catch (err) {
        showToast(err.message, 'error');
        buttonEl.disabled = false;
        buttonEl.innerHTML = originalText;
      }
    });
  });

  marketplacesContainer.querySelectorAll('.btn-remove-market').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const name = e.target.getAttribute('data-name');
      if (!confirm(`Are you sure you want to remove marketplace "${name}"?`)) return;

      try {
        const res = await fetch('/api/marketplaces/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message, 'success');
          await loadMarketplacesAndPlugins();
        } else {
          showToast(`Error: ${data.error}`, 'error');
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

function setupConvertForm() {
  const btnRun = document.getElementById('btn-run-convert');
  const inputUrl = document.getElementById('import-url');
  const inputName = document.getElementById('import-name');
  const selectScope = document.getElementById('import-scope');
  const resultBox = document.getElementById('import-result');

  btnRun.addEventListener('click', async () => {
    const url = inputUrl.value.trim();
    const name = inputName.value.trim();
    const scope = selectScope.value;

    if (!url) {
      showToast('Please enter a Git URL or local folder path.', 'error');
      return;
    }

    btnRun.disabled = true;
    btnRun.innerHTML = '⏳ Converting & adapting...';
    resultBox.style.display = 'none';

    try {
      const res = await fetch('/api/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plugin: {
            name: name || undefined,
            source: url.startsWith('http') ? { type: 'git', url } : { type: 'local', path: url }
          },
          scope
        })
      });
      const data = await res.json();

      if (data.success) {
        resultBox.style.display = 'block';
        resultBox.style.borderColor = 'var(--success)';
        resultBox.innerHTML = `
✅ Successfully converted and registered!
Name: ${data.plugin.name}
Path: ${data.plugin.installPath}
Skills: ${data.plugin.stats?.skillsCount || 0}
Rules: ${data.plugin.stats?.hasRules ? 'Yes' : 'No'}
MCP Config: ${data.plugin.stats?.hasMcp ? 'Yes' : 'No'}
        `;
        showToast('Package ready in Antigravity!', 'success');
        inputUrl.value = '';
        inputName.value = '';
        await loadInstalled();
        await loadSkillsCheck();
      } else {
        resultBox.style.display = 'block';
        resultBox.style.borderColor = 'var(--danger)';
        resultBox.textContent = `Error: ${data.error || 'Unknown error'}`;
        showToast('Conversion failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnRun.disabled = false;
      btnRun.innerHTML = '⚡ Convert & Install into Antigravity';
    }
  });
}

async function handleInstall(id, buttonEl) {
  const originalText = buttonEl.innerHTML;
  buttonEl.disabled = true;
  buttonEl.innerHTML = '⏳ Installing...';

  try {
    const res = await fetch('/api/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, scope: 'global' })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Plugin "${data.plugin.name}" installed into Antigravity!`, 'success');
      await loadInstalled();
      await loadMarketplacesAndPlugins();
      await loadSkillsCheck();
    } else {
      showToast(`Installation error: ${data.error || 'Unknown error'}`, 'error');
      buttonEl.disabled = false;
      buttonEl.innerHTML = originalText;
    }
  } catch (err) {
    showToast(`Connection error: ${err.message}`, 'error');
    buttonEl.disabled = false;
    buttonEl.innerHTML = originalText;
  }
}

async function handleUninstall(id, buttonEl) {
  if (!confirm(`Are you sure you want to remove package "${id}"?`)) return;

  try {
    const res = await fetch('/api/uninstall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      await loadInstalled();
      await loadMarketplacesAndPlugins();
      await loadSkillsCheck();
    } else {
      showToast(`Error: ${data.error}`, 'error');
    }
  } catch (err) {
    showToast(`Connection error: ${err.message}`, 'error');
  }
}

async function handleUpdateSingle(id, buttonEl) {
  const originalText = buttonEl.innerHTML;
  buttonEl.disabled = true;
  buttonEl.innerHTML = '⏳ Updating...';

  try {
    const res = await fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Updated to version ${data.plugin.version}!`, 'success');
      await loadInstalled();
      await loadUpdates();
      await loadSkillsCheck();
    } else {
      showToast(`Update error: ${data.error}`, 'error');
      buttonEl.disabled = false;
      buttonEl.innerHTML = originalText;
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
    buttonEl.disabled = false;
    buttonEl.innerHTML = originalText;
  }
}

async function handleUpdateAll() {
  const pending = updateResults.filter(u => u.hasUpdate);
  if (pending.length === 0) return;

  btnUpdateAll.disabled = true;
  btnUpdateAll.innerHTML = '⏳ Updating...';

  for (const item of pending) {
    try {
      await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id })
      });
    } catch (e) {
      console.error(e);
    }
  }

  showToast('All packages have been updated!', 'success');
  btnUpdateAll.disabled = false;
  btnUpdateAll.innerHTML = 'Update All';
  await loadInstalled();
  await loadUpdates();
  await loadSkillsCheck();
}

async function handleResetCache() {
  if (!confirm('This will wipe all cached marketplace indexes, clear browser cache & storage, and reload the application. Continue?')) {
    return;
  }

  const btn = document.getElementById('btn-reset-cache');
  let originalHtml = '';
  if (btn) {
    originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Resetting cache...';
  }

  try {
    await fetch('/api/cache/reset', { method: 'POST' }).catch(() => {});

    if ('caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map(k => window.caches.delete(k)));
    }

    localStorage.clear();
    sessionStorage.clear();

    showToast('Cache reset successfully! Hard-reloading page...', 'success');

    setTimeout(() => {
      window.location.href = window.location.pathname + '?_t=' + Date.now();
    }, 700);
  } catch (err) {
    showToast('Cache reset error: ' + err.message, 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

function showToast(message, type = 'info') {
  toastEl.textContent = message;
  toastEl.className = `toast ${type} show`;
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 4000);
}

function formatAuthor(author) {
  if (!author) return 'Community';
  if (typeof author === 'string') return author.trim();
  if (typeof author === 'object') {
    return author.name || author.username || author.owner || 'Community';
  }
  return String(author);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
