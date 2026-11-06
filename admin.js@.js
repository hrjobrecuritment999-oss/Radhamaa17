const $ = s => document.querySelector(s);
let cats = [], prods = [];

function toast(msg, bad) {
  const t = $('#toast'); t.textContent = msg; t.style.display = 'block';
  t.style.background = bad ? '#fde8e8' : '#e6f7ec'; t.style.color = bad ? '#9b1c1c' : '#14683a';
  setTimeout(() => t.style.display = 'none', 2500);
}

// ---------- auth ----------
async function checkSession() {
  const {data:{session}} = await sb.auth.getSession();
  $('#loginView').style.display = session ? 'none' : 'block';
  $('#appView').style.display = session ? 'block' : 'none';
  $('#logoutBtn').style.display = session ? 'inline-block' : 'none';
  if (session) refreshAll();
}
$('#loginForm').onsubmit = async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  const {error} = await sb.auth.signInWithPassword(f);
  if (error) { $('#loginErr').textContent = error.message; $('#loginErr').style.display = 'block'; }
  else checkSession();
};
$('#logoutBtn').onclick = async () => { await sb.auth.signOut(); checkSession(); };

// ---------- tabs ----------
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  ['categories','products','inquiries'].forEach(t => $('#tab-' + t).style.display = t === b.dataset.tab ? 'block' : 'none');
});

// ---------- image upload ----------
async function upload(file) {
  const path = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const {error} = await sb.storage.from('product-images').upload(path, file);
  if (error) throw error;
  return sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

// ---------- load ----------
async function refreshAll() {
  [{data: cats}, {data: prods}] = await Promise.all([
    sb.from('categories').select('*').order('sort_order'),
    sb.from('products').select('*').order('sort_order')
  ]);
  cats = cats || []; prods = prods || [];
  renderCats(); renderProds(); loadInquiries();
  $('#prodCat').innerHTML = cats.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
}

// ---------- categories ----------
function renderCats() {
  $('#catList').innerHTML = cats.map(c => `<div class="row">
    ${c.image_url ? `<img src="${esc(c.image_url)}">` : ''}
    <div class="grow"><b>${esc(c.name)}</b><br><small>${esc(c.hs_code)} · ${prods.filter(p => p.category_id === c.id).length} products</small></div>
    <button class="mini" onclick="editCat('${c.id}')">Edit</button>
    <button class="mini del" onclick="delCat('${c.id}')">Delete</button></div>`).join('');
}
window.editCat = id => {
  const c = cats.find(x => x.id === id), f = $('#catForm');
  for (const k of ['id','name','hs_code','description','packing','sort_order']) f[k].value = c[k] ?? '';
  f.dataset.img = c.image_url || '';
  $('#catFormTitle').textContent = 'Edit category'; scrollTo({top:0, behavior:'smooth'});
};
window.delCat = async id => {
  if (!confirm('Delete this category AND all its products?')) return;
  const {error} = await sb.from('categories').delete().eq('id', id);
  error ? toast(error.message, 1) : (toast('Deleted'), refreshAll());
};
$('#catCancel').onclick = () => { $('#catForm').reset(); $('#catForm').id.value = ''; $('#catForm').dataset.img = ''; $('#catFormTitle').textContent = 'Add category'; };
$('#catForm').onsubmit = async e => {
  e.preventDefault();
  const f = e.target;
  try {
    const row = {name: f.name.value, hs_code: f.hs_code.value, description: f.description.value,
      packing: f.packing.value, sort_order: +f.sort_order.value || 0};
    if (f.image.files[0]) row.image_url = await upload(f.image.files[0]);
    const q = f.id.value ? sb.from('categories').update(row).eq('id', f.id.value) : sb.from('categories').insert(row);
    const {error} = await q; if (error) throw error;
    toast('Saved'); $('#catCancel').click(); refreshAll();
  } catch (err) { toast(err.message, 1); }
};

// ---------- products ----------
function renderProds() {
  $('#prodList').innerHTML = prods.map(p => {
    const c = cats.find(x => x.id === p.category_id);
    return `<div class="row">
      ${p.image_url ? `<img src="${esc(p.image_url)}">` : ''}
      <div class="grow"><b>${esc(p.name)}</b> ${p.active ? '' : '<small>(hidden)</small>'}<br><small>${esc(c?.name)}</small></div>
      <button class="mini" onclick="editProd('${p.id}')">Edit</button>
      <button class="mini del" onclick="delProd('${p.id}')">Delete</button></div>`;
  }).join('');
}
window.editProd = id => {
  const p = prods.find(x => x.id === id), f = $('#prodForm');
  f.id.value = p.id; f.category_id.value = p.category_id; f.name.value = p.name;
  f.description.value = p.description || ''; f.sort_order.value = p.sort_order || 0;
  f.active.checked = p.active; f.image_url.value = p.image_url || '';
  $('#prodFormTitle').textContent = 'Edit product';
  document.querySelector('[data-tab=products]').click(); scrollTo({top:0, behavior:'smooth'});
};
window.delProd = async id => {
  if (!confirm('Delete this product?')) return;
  const {error} = await sb.from('products').delete().eq('id', id);
  error ? toast(error.message, 1) : (toast('Deleted'), refreshAll());
};
$('#prodCancel').onclick = () => { const f = $('#prodForm'); f.reset(); f.id.value = ''; f.image_url.value = ''; $('#prodFormTitle').textContent = 'Add product'; };
$('#prodForm').onsubmit = async e => {
  e.preventDefault();
  const f = e.target;
  try {
    const row = {category_id: f.category_id.value, name: f.name.value, description: f.description.value,
      sort_order: +f.sort_order.value || 0, active: f.active.checked, image_url: f.image_url.value || null};
    if (f.image.files[0]) row.image_url = await upload(f.image.files[0]);
    const q = f.id.value ? sb.from('products').update(row).eq('id', f.id.value) : sb.from('products').insert(row);
    const {error} = await q; if (error) throw error;
    toast('Saved'); $('#prodCancel').click(); refreshAll();
  } catch (err) { toast(err.message, 1); }
};

// ---------- inquiries ----------
async function loadInquiries() {
  const {data} = await sb.from('inquiries').select('*').order('created_at', {ascending: false});
  $('#inqList').innerHTML = (data || []).map(i => `<div class="inq">
    <b>${esc(i.name)}</b> ${i.company ? '· ' + esc(i.company) : ''}
    <br><small>${new Date(i.created_at).toLocaleString()}</small>
    <p>📞 ${esc(i.contact)} &nbsp; 🌍 ${esc(i.country)}</p>
    <p><b>${esc(i.product)}</b> — ${esc(i.quantity)}</p>
    <p>${esc(i.details)}</p>
    <button class="mini del" onclick="delInq('${i.id}')">Delete</button></div>`).join('') || '<p class="sub">No inquiries yet.</p>';
}
window.delInq = async id => {
  if (!confirm('Delete this inquiry?')) return;
  await sb.from('inquiries').delete().eq('id', id); loadInquiries();
};

checkSession();
