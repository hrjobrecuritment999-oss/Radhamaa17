
// contact info
document.getElementById('c-email').textContent = document.getElementById('f-email').textContent = C.EMAIL;
document.getElementById('c-in').textContent = document.getElementById('f-in').textContent = C.PHONE_IN;
document.getElementById('c-mu').textContent = document.getElementById('f-mu').textContent = C.PHONE_MU;
document.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => {
  const v = {email:C.EMAIL, in:C.PHONE_IN, mu:C.PHONE_MU}[b.dataset.copy];
  navigator.clipboard.writeText(v); b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy', 1500);
});

function pickProduct(catName, itemName) {
  const sel = document.getElementById('productSelect');
  sel.value = catName;
  if (itemName) document.querySelector('[name=details]').value = 'Item: ' + itemName;
  document.getElementById('contact').scrollIntoView({behavior:'smooth'});
}

async function loadCatalogue() {
  const box = document.getElementById('catalogue');
  const [{data: cats, error: e1}, {data: prods, error: e2}] = await Promise.all([
    sb.from('categories').select('*').order('sort_order'),
    sb.from('products').select('*').order('sort_order')
  ]);
  if (e1 || e2) { box.innerHTML = '<p class="sub">Catalogue could not be loaded. Please contact us directly.</p>'; return; }
  if (!cats.length) { box.innerHTML = '<p class="sub">Catalogue coming soon.</p>'; return; }

  box.innerHTML = cats.map(c => {
    const items = prods.filter(p => p.category_id === c.id);
    return `<div class="cat">
      <div class="catbanner" ${c.image_url ? `style="background-image:linear-gradient(rgba(11,26,68,.55),rgba(11,26,68,.85)),url('${esc(c.image_url)}')"` : ''}>
        <h3>${esc(c.name)}</h3><div class="mono">${esc(c.hs_code)}<br>20FT · 40FT</div></div>
      <div class="mono" style="color:var(--muted)">${esc(c.hs_code)}</div>
      <h3 class="name">${esc(c.name)}</h3>
      <p class="desc">${esc(c.description)}</p>
      <div class="items">${items.map(p => `
        <div class="item"><div class="l">${p.image_url ? `<img src="${esc(p.image_url)}" alt="">` : ''}
          <div>${esc(p.name)}${p.description ? `<small>${esc(p.description)}</small>` : ''}</div></div>
          <button class="btn sm" data-cat="${esc(c.name)}" data-item="${esc(p.name)}">Get quote</button></div>`).join('')}</div>
      <p class="pack">Packing: ${esc(c.packing)}</p>
      <button class="btn blue" data-cat="${esc(c.name)}">Request a quote for ${esc(c.name)}</button>
    </div>`;
  }).join('');
  box.querySelectorAll('button[data-cat]').forEach(b => b.onclick = () => pickProduct(b.dataset.cat, b.dataset.item));

  document.getElementById('productSelect').innerHTML = cats.map(c => `<option>${esc(c.name)}</option>`).join('') + '<option>Mixed order</option>';
  document.getElementById('footCats').innerHTML = cats.map(c => `<a href="#products">${esc(c.name)}</a>`).join('');
  document.getElementById('footLine').textContent = cats.map(c => c.name).join(' · ');
}

document.getElementById('inqForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, data = Object.fromEntries(new FormData(f));
  const {error} = await sb.from('inquiries').insert(data);
  document.getElementById('ok').style.display = error ? 'none' : 'block';
  document.getElementById('err').style.display = error ? 'block' : 'none';
  if (!error) f.reset();
});

loadCatalogue();
