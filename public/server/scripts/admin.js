import { showLoader, hideLoader } from './common.js';

const sel      = document.getElementById('dataset');
const table    = document.getElementById('dataTable');
const pwGate   = document.getElementById('pwGate');
const editModal= document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const saveBtn  = document.getElementById('saveBtn');
const cancelBtn= document.getElementById('cancelBtn');

let currentRow   = null;          // row object being edited
let primaryKey   = null;          // column name of the id

/* ────────── auth gate ────────── */
document.getElementById('pwBtn').onclick = () => {
  const pw = document.getElementById('pwInput').value.trim();
  if (!pw) return;
  document.cookie = `auth=${pw}; SameSite=Lax; path=/`;
  pwGate.style.display = 'none';
  load();
};

/* ────────── UI events ────────── */
document.getElementById('refresh').onclick = load;
sel.onchange = load;
cancelBtn.onclick = () => editModal.style.display = 'none';

function cookie(name) {
  const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? m.pop() : '';
}

/* ────────── data loader ────────── */
async function load() {
  showLoader();
  const resp = await fetch('/admin/' + sel.value,
    { headers: { authentication: cookie('auth') } });
  if (resp.status === 401) {         // bad password
    alert('Falsches Passwort');
    pwGate.style.display = 'flex';
    hideLoader();
    return;
  }
  const rows = await resp.json();
  buildTable(rows);
  hideLoader();
}

/* ────────── table builder ────────── */
function buildTable(rows) {
  table.innerHTML = '';
  if (!rows.length) { table.textContent = 'no data'; return; }

  // header
  const thead = table.createTHead().insertRow();
  Object.keys(rows[0]).forEach(k => thead.insertCell().textContent = k);
  thead.insertCell().textContent = ' ';

  // rows
  rows.forEach(r => {
    const tr = table.insertRow();
    Object.values(r).forEach(v => tr.insertCell().textContent = v);
    const td = tr.insertCell();
    const btn = document.createElement('button');
    btn.textContent = '✎';
    btn.onclick = () => openEditor(r);
    td.appendChild(btn);
  });
}

/* ────────── editor modal ────────── */
function openEditor(row) {
  currentRow = { ...row };            // clone
  primaryKey = Object.keys(row)[0];   // first column = id

  editForm.innerHTML = '';
  Object.entries(row).forEach(([key, val]) => {
    // primary key is shown but read‑only
    const field = document.createElement('div');
    field.className = 'field';
    const label = document.createElement('label');
    label.textContent = key;
    const input = document.createElement('input');
    input.name  = key;
    input.value = val;
    if (key === primaryKey) input.readOnly = true;
    field.append(label, input);
    editForm.appendChild(field);
  });

  editModal.style.display = 'flex';
}

/* save handler */
saveBtn.onclick = async (e) => {
  e.preventDefault();
  const data = {};
  new FormData(editForm).forEach((v, k) => data[k] = v);

  await fetch(`/admin/${sel.value}/${data[primaryKey]}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      authentication: cookie('auth')
    },
    body: JSON.stringify(data)
  });
  editModal.style.display = 'none';
  load();
};

/* initial load (after password) */
