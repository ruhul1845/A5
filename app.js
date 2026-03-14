

// ===== STATE =====
const CREDENTIALS = { username: 'admin', password: 'admin123' };
const API_BASE = 'https://phi-lab-server.vercel.app/api/v1/lab/issues';
const API = 'https://phi-lab-server.vercel.app/api/v1/lab/issue';

let allIssues = [];
let currentTab = 'all';
let isSearchMode = false;

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  // Set all logo images


  // If already logged in
  if (sessionStorage.getItem('loggedIn') === 'true') {
    showDashboard();
  }
});

// ===== AUTH =====
function handleLogin() {
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();
  const errEl = document.getElementById('loginError');

  if (user === CREDENTIALS.username && pass === CREDENTIALS.password) {
    errEl.classList.add('hidden');
    sessionStorage.setItem('loggedIn', 'true');
    showDashboard();
  } else {
    errEl.classList.remove('hidden');
    document.getElementById('loginBtn').classList.add('shake');
    setTimeout(() => document.getElementById('loginBtn').classList.remove('shake'), 500);
  }
}

function fillDemo() {
  document.getElementById('username').value = 'admin';
  document.getElementById('password').value = 'admin123';
}

function logout() {
  sessionStorage.removeItem('loggedIn');
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
}

document.getElementById('password')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleLogin();
});

// ===== DASHBOARD =====
function showDashboard() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  loadIssues();
}

// ===== FETCH ISSUES =====
async function loadIssues() {
  showLoading(true);
  try {

    const res = await fetch(`${API_BASE}`);
    const data = await res.json();
    allIssues = data.data;

    renderIssues();
  } catch (err) {
    console.error(err);
    showNoResults(true);
  } finally {
    showLoading(false);
  }
}

// ===== TAB =====
function setTab(tab) {
  currentTab = tab;
  isSearchMode = false;
  document.getElementById('searchInput').value = '';
  ['all', 'open', 'closed'].forEach(t => {
    const btn = document.getElementById('tab-' + t);
    if (t === tab) {
      btn.classList.add('active-tab');
      btn.classList.remove('text-black', 'hover:text-black');
    } else {
      btn.classList.remove('active-tab');
      btn.classList.add('text-black', 'hover:text-black');
    }
  });
  console.log(tab);
  renderIssues();
}

// ===== RENDER =====
function renderIssues() {
  let filtered = allIssues;

  if (currentTab === 'open') filtered = allIssues.filter(i => i.status?.toLowerCase() === 'open');
  if (currentTab === 'closed') filtered = allIssues.filter(i => i.status?.toLowerCase() === 'closed');


  const grid = document.getElementById('issuesGrid');
  grid.innerHTML = '';
  showNoResults(false);

  if (!filtered.length) { showNoResults(true); return; }

  filtered.forEach(issue => {
    const card = createCard(issue);
    grid.appendChild(card);
    const number = Number(grid.childElementCount);
    const Issue = document.getElementById('count');
    Issue.innerText = number;

  });
}

// ===== CARD =====
function createCard(issue) {
  const isOpen = issue.status?.toLowerCase() === 'open';
  const statusClass = isOpen ? 'open-card' : 'closed-card';
  const badgeClass = isOpen ? 'badge-open' : 'badge-closed';
  const statusText = isOpen ? 'Open' : 'Closed';






  const labelHTML = issue.label ? `<span class="label-badge truncate max-w-[120px]" title="${issue.label}">${issue.label}</span>` : '';

  const div = document.createElement('div');
  div.className = `issue-card ${statusClass} p-4`;
  div.onclick = () => openModal(issue.id);


  const prioClass = issue.priority === 'high' ? 'bg-red-100 text-red-700'
    : issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-700'
      : issue.priority === 'low' ? 'bg-gray-100 text-gray-700'
        : 'bg-gray-100 text-gray-500'; // default (none/unknown)
  let statusImg;

  if (issue.status?.toLowerCase() === 'open') {
    statusImg = './assets/Open-Status.png';
  } else {
    statusImg = './assets/close.png';
  }
  const shortDesc = issue.description?.length > 60
    ? issue.description.substring(0, 60) + '...'
    : issue.description;

  const labelsHTML = issue.labels?.map(label => {
    const labelClass = label.toLowerCase() === 'bug' ? 'bg-red-100 text-red-700'
      : label.toLowerCase() === 'enhancement' ? 'bg-green-100 text-green-700'
        : label.toLowerCase() === 'help wanted' ? 'bg-yellow-100 text-yellow-700'
          : 'bg-gray-100 text-gray-700';

    const labelImg = label.toLowerCase() === 'bug' ? './assets/Bug.png'
      : label.toLowerCase() === 'enhancement' ? './assets/Sparkle.png'
        : label.toLowerCase() === 'help wanted' ? './assets/Lifebuoy.png'
          : '';

    return `<span class="${labelClass} text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
    ${labelImg ? `<img src="${labelImg}" class="h-3 w-3" />` : ''}
    ${label.toUpperCase()}
  </span>`;
  }).join('') || '';

  const createdDate = issue.createdAt
    ? new Date(issue.createdAt).toLocaleDateString('en-US')
    : 'N/A';

  div.innerHTML = `
  
    
    <!-- Top: status icon + priority -->
    <div class="flex justify-between items-center mb-3">
      <img src="${statusImg}" class="h-6 w-6" />
      <span class="${prioClass} text-xs font-bold px-3 py-1 rounded-full">
        ${issue.priority?.toUpperCase()}
      </span>
    </div>

    <!-- Title -->
    <h3 class="font-bold text-black text-sm leading-snug line-clamp-2 mt-6">
      ${issue.title}
    </h3>

    <!-- Description -->
    <p class="mt-6 text-xs text-gray-500 line-clamp-2">
      ${shortDesc}
    </p>

    <!-- Labels -->
    <div class="flex gap-2 flex-wrap mt-3">
      ${labelsHTML}
    </div>

    <!-- Footer: id, author, date -->
    <div class="mt-3 pt-2 border-t border-gray-300 text-[10px] text-gray-400">
      <span>#${issue.id} &nbsp; by ${issue.author}</span>
      <p>${createdDate}</p>
    </div>

 
`;
  return div;
}


// ── Modal ─────────────────────────────────────────────────────────────────────

// ── Constants (set these to your actual values) ──────────────────────────────


// ── Helpers ──────────────────────────────────────────────────────────────────

/** FIX 1: Always sanitize user/API content before injecting into innerHTML */


// ── Modal ─────────────────────────────────────────────────────────────────────

async function openModal(id) {
  // console.log("hello" + id);
  if (!id) return;

  const modal = document.getElementById('issueModal');
  const body = document.getElementById('modalBody');

  modal.classList.remove('hidden');


  document.body.style.overflow = 'hidden';
  body.innerHTML = `
    <div class="flex justify-center items-center py-16">
      <div class="spinner"></div>
    </div>`;

  // try {
  const res = await fetch(`${API}/${id}`);

  const data = await res.json();
  const issue = data.data;
  console.log(issue);
  renderModal(issue);
  // } catch {
  //   body.innerHTML = `
  //     <div class="p-8 text-center text-[#8b949e]">
  //       <i class="fa fa-triangle-exclamation text-3xl text-red-400 block mb-2"></i>
  //       Failed to load issue details.
  //     </div>`;
  // }
}

function renderModal(issue) {
  console.log("iam here");

  const createdDate = issue.updatedAt
    ? new Date(issue.updatedAt).toLocaleDateString('en-US')
    : 'N/A';

  const colourStatus = issue.status === 'open' ? 'bg-green-500' : 'bg-red-500 ';
  const prioClass = issue.priority === 'high' ? 'bg-red-200 text-red-700'
    : issue.priority === 'medium' ? 'bg-yellow-200 text-yellow-700'
      : issue.priority === 'low' ? 'bg-gray-200 text-gray-700'
        : 'bg-gray-200 text-gray-500';

  const labelsHTML = issue.labels?.map(label => {
    const labelClass = label.toLowerCase() === 'bug' ? 'bg-red-200 text-red-700'
      : label.toLowerCase() === 'enhancement' ? 'bg-green-200 text-green-700'
        : label.toLowerCase() === 'help wanted' ? 'bg-yellow-200 text-yellow-700'
          : 'bg-gray-200 text-gray-700';

    const labelImg = label.toLowerCase() === 'bug' ? './assets/Bug.png'
      : label.toLowerCase() === 'enhancement' ? './assets/Sparkle.png'
        : label.toLowerCase() === 'help wanted' ? './assets/Lifebuoy.png'
          : '';

    return `<span class="${labelClass} text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
    ${labelImg ? `<img src="${labelImg}" class="h-3 w-3" />` : ''}
    ${label.toUpperCase()}
  </span>`;
  }).join('') || '';


  document.getElementById('modalBody').innerHTML = `
  <div class="w-[700px] h-[500px]">
    <div class=" p-16 relative">
      <h2 class="font-bold text-xl text-black mb-3">${issue.title}</h2>
      <div class=" flex gap-4" >
        
         <div class="rounded-xl bg-green-500 ${colourStatus}border text-white w-[90px] h-[30px] flex items-center justify-center">
         <h3 >${issue.status}</h3>
         </div>
         <h3 class="text-slate-500 capitalize"> ${issue.status}  by ${issue.assignee}</h3>
         <h3 class="text-slate-500">${createdDate}</h3>
      </div>

     <!-- Labels -->
      <div class="flex gap-2 flex-wrap mt-3 mt-8 mb-6">
      ${labelsHTML}
      </div>
      <h3 class="text-xl mt-4 text-slate-500">${issue.description}</h3>
      <div class="flex gap-[200px] w-11/12 h-[100px] bg-gray-100 mt-4">
      <div class="p-5">
      <h2 class="text-gray-600 font-bold mb-3">Assignee:</h2>
      <h2 class="text-black font-bold">${issue.assignee}</h2>
      </div>
      <div class="p-5">
      <h2 class="text-gray-600 font-bold mb-3">Priority:</h2>
        <span class="${prioClass} text-xs font-bold px-3 py-1 rounded-full">
        ${issue.priority?.toUpperCase()}
         </span>
      </div>

      
    </div>
      <div style="display:flex;justify-content:flex-end;padding:20px 28px 24px;">
         <button onclick="closeModal()"
             style="background:#7c3aed;color:#fff;border:none;border-radius:10px;
               padding:10px 28px;font-size:15px;font-weight:600;cursor:pointer;">
             Close
         </button>
      </div>
    </div>
  </div>

  `;

}

// ── Close ─────────────────────────────────────────────────────────────────────

function closeModal() {
  document.getElementById('issueModal').classList.add('hidden');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
// ===== SEARCH =====
function handleSearchKey(e) {
  if (e.key === 'Enter') doSearch();
}

async function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) { isSearchMode = false; renderIssues(); return; }

  isSearchMode = true;
  showLoading(true);
  showNoResults(false);
  document.getElementById('issuesGrid').innerHTML = '';

  try {

    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    const results = data.data;

    // reset tab styling
    ['all', 'open', 'closed'].forEach(t => {
      const btn = document.getElementById('tab-' + t);
      btn.classList.remove('active-tab');
      btn.classList.add('text-[#8b949e]', 'hover:text-white');
    });
    document.getElementById('tab-all').classList.add('active-tab');

    const grid = document.getElementById('issuesGrid');
    grid.innerHTML = '';
    if (!results.length) { showNoResults(true); return; }
    results.forEach(issue => grid.appendChild(createCard(issue)));
    const number = Number(grid.childElementCount);
    const Issue = document.getElementById('count');
    Issue.innerText = number;
  } catch (err) {
    showNoResults(true);
  } finally {
    showLoading(false);
  }
}

// ===== HELPERS =====
function showLoading(show) {
  document.getElementById('loadingSpinner').classList.toggle('hidden', !show);
  document.getElementById('issuesGrid').classList.toggle('hidden', show);
}
function showNoResults(show) {
  document.getElementById('noResults').classList.toggle('hidden', !show);
  if (show) document.getElementById('issuesGrid').innerHTML = '';
}
