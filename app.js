const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQS1P9jB5HnKtkHZCeWtqlrPGeMWtgwAWIT4G6jux79_PMSdLf7v5_i7ZFz38TBiqv7lcsCmK1Edxu0/pub?output=csv";
const MI_EMPRESA = "COMIDA RAPIDA ANDRES"; // Filtro de seguridad

const EMOJI = { salchipapa: '🍟', pizza: '🍕', hamburguesa: '🍔', 'perro caliente': '🌭', mazorcada: '🌽', patacon: '🫓', 'arepa rellena': '🫔', bebidas: '🥤', default: '🍽️' };
const emo = c => EMOJI[c.toLowerCase()] || EMOJI.default;

let phone = "";
let cart = {};
try { cart = JSON.parse(localStorage.getItem('menu_cart') || '{}') } catch (_) { }
let customerName = localStorage.getItem('menu_customer') || '';

function saveCart() { try { localStorage.setItem('menu_cart', JSON.stringify(cart)) } catch (_) { } }
function fmt(n) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n) }

let toastTid;
function toast(m) { const e = document.getElementById('toast'); e.textContent = m; e.classList.add('show'); clearTimeout(toastTid); toastTid = setTimeout(() => e.classList.remove('show'), 2000) }

function cartQty() { return Object.values(cart).reduce((s, i) => s + i.qty, 0) }
function cartTotal() { return Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0) }
function updateFab() { const q = cartQty(); document.getElementById('fab-count').textContent = q; document.getElementById('cart-fab').classList.toggle('hide', q === 0) }

function setQty(id, name, price, image, delta) {
    if (!cart[id]) cart[id] = { name, price, image, qty: 0 };
    cart[id].qty = Math.max(0, cart[id].qty + delta);
    if (cart[id].qty === 0) delete cart[id];
    saveCart();
    const qty = cart[id] ? cart[id].qty : 0;
    document.querySelectorAll('[data-item="' + id + '"]').forEach(w => {
        const ab = w.querySelector('.btn-add'), qc = w.querySelector('.qty-controls'), qn = w.querySelector('.qty-num'), qs = w.querySelector('.qty-subtotal');
        if (ab) ab.style.display = qty > 0 ? 'none' : '';
        if (qc) qc.style.display = qty > 0 ? 'flex' : 'none';
        if (qn) qn.textContent = qty;
        if (qs) qs.textContent = qty > 0 ? fmt(price * qty) : '';
    });
    updateFab();
    if (delta > 0) toast('✓ ' + name + ' agregado');
    if (document.getElementById('cart-drawer').classList.contains('open')) renderCart();
}

function openCart() { renderCart(); document.getElementById('cart-overlay').classList.add('open'); document.getElementById('cart-drawer').classList.add('open'); document.body.style.overflow = 'hidden' }
function closeCart() { document.getElementById('cart-overlay').classList.remove('open'); document.getElementById('cart-drawer').classList.remove('open'); document.body.style.overflow = '' }

function renderCart() {
    const el = document.getElementById('cart-content');
    const items = Object.entries(cart);
    if (!items.length) {
        el.innerHTML = '<div class="cart-empty"><div class="icon">🛒</div><p>Tu pedido está vacío.<br>Agrega algo del menú.</p></div>';
        return;
    }
    const savedNotes = document.getElementById('notes-ta') ? document.getElementById('notes-ta').value : (localStorage.getItem('menu_notes') || '');
    let h = `<div class="customer-field">
    <label class="field-label">¿Cuál es tu nombre?</label>
    <input class="field-input" type="text" id="customer-in" placeholder="Ej: Juan García" value="${eh(customerName)}" oninput="customerName=this.value;localStorage.setItem('menu_customer',this.value)">
  </div>
  <div class="cart-items-wrap">`;
    items.forEach(([id, item]) => {
        const img = item.image ? `<img class="cart-thumb" src="${eh(item.image)}" alt="${eh(item.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : '';
        const ph = `<div class="cart-thumb-ph" ${item.image ? 'style="display:none"' : ''}>${emo(item.name)}</div>`;
        h += `<div class="cart-row">${img}${ph}
      <div class="cart-row-info"><strong>${eh(item.name)}</strong><span>${fmt(item.price)} c/u</span></div>
      <div class="cart-row-controls">
        <button class="mini-btn del" onclick="setQty('${id}','${ej(item.name)}',${item.price},'${ej(item.image || '')}', -1)">−</button>
        <span class="mini-num">${item.qty}</span>
        <button class="mini-btn" onclick="setQty('${id}','${ej(item.name)}',${item.price},'${ej(item.image || '')}', +1)">+</button>
      </div>
      <div class="cart-row-price">${fmt(item.price * item.qty)}</div>
    </div>`;
    });
    h += `</div>
  <div class="notes-field">
    <label class="field-label">Notas del pedido (opcional)</label>
    <textarea class="notes-ta" id="notes-ta" placeholder="Ej: sin cebolla, para llevar..." oninput="localStorage.setItem('menu_notes',this.value)">${eh(savedNotes)}</textarea>
  </div>
  <div class="cart-summary">
    <div class="total-row"><span class="total-label">Total del pedido</span><span class="total-val">${fmt(cartTotal())}</span></div>
    <button class="btn-send-wa" onclick="sendWA()">
      <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      Enviar pedido por WhatsApp
    </button>
    <button class="btn-clear" onclick="clearCart()">🗑 Vaciar pedido</button>
  </div>`;
    el.innerHTML = h;
}

function clearCart() {
    cart = {}; saveCart(); localStorage.removeItem('menu_notes'); updateFab();
    document.querySelectorAll('[data-item]').forEach(w => {
        const ab = w.querySelector('.btn-add'), qc = w.querySelector('.qty-controls');
        if (ab) ab.style.display = ''; if (qc) qc.style.display = 'none';
    });
    closeCart(); toast('Pedido vaciado');
}

function sendWA() {
    const items = Object.values(cart);
    if (!items.length) return;
    const name = (document.getElementById('customer-in')?.value || customerName || '').trim();
    const notes = (document.getElementById('notes-ta')?.value || '').trim();
    let msg = name ? `👤 *Pedido de ${name}*\n` : `🛒 *Nuevo Pedido*\n`;
    msg += '─────────────────\n';
    items.forEach(i => msg += `• ${i.qty}x ${i.name.charAt(0).toUpperCase() + i.name.slice(1)} — ${fmt(i.price * i.qty)}\n`);
    msg += '─────────────────\n';
    msg += `💰 *Total: ${fmt(cartTotal())}*`;
    if (notes) msg += `\n\n📝 *Notas:* ${notes}`;
    window.open(phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function onSearch(v) {
    const q = v.trim().toLowerCase();
    document.getElementById('search-clear').style.display = q ? 'block' : 'none';
    let total = 0;
    document.querySelectorAll('.menu-card').forEach(c => {
        const match = !q || (c.dataset.name || '').includes(q) || (c.dataset.desc || '').includes(q) || (c.dataset.cat || '').includes(q);
        c.classList.toggle('hidden', !match);
        if (match) total++;
    });
    document.querySelectorAll('.cat-section').forEach(s => {
        s.style.display = s.querySelectorAll('.menu-card:not(.hidden)').length ? '' : 'none';
    });
    document.getElementById('no-results').style.display = total === 0 ? 'block' : 'none';
}
function clearSearch() { document.getElementById('search-input').value = ''; document.getElementById('search-clear').style.display = 'none'; onSearch('') }

function eh(s) { return String(s || "").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function ej(s) { return String(s || "").replace(/\\/g, '\\\\').replace(/'/g, "\\'") }

async function init() {
    try {
        const res = await fetch(SHEET_URL);
        const csv = await res.text();
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
        const rows = parsed.data;

        if (!rows.length) return;

        const groups = {};
        let empresaConfigurada = false;

        rows.forEach((row, idx) => {
            // 1. Filtrar por Empresa
            const nombreEmp = (row.Empresa || "").trim().toUpperCase();
            if (nombreEmp !== MI_EMPRESA) return;

            // 2. Capturar datos de contacto solo de la primera fila válida
            if (!empresaConfigurada) {
                document.getElementById('empresa').textContent = row.Empresa || MI_EMPRESA;
                document.getElementById('lugar').textContent = '📍 ' + (row.Lugar || 'Ciénaga');
                document.title = row.Empresa || 'Menú Digital';
                
                phone = (row.Telefono || "").toString().replace(/\D/g, '');
                if (phone) {
                    const fullPhone = phone.startsWith('57') ? phone : '57' + phone;
                    document.getElementById('telefonoBtn').href = 'https://wa.me/' + fullPhone;
                }
                empresaConfigurada = true;
            }

            // 3. Organizar productos por categoría
            const cat = (row.Categoria || 'General').trim();
            if (!groups[cat]) groups[cat] = [];

            // 4. Validar disponibilidad (Columna 'estado')
            const estado = (row.estado || "").toLowerCase();
            const isAvailable = (estado !== 'desactivado' && estado !== 'agotado');

            groups[cat].push({
                id: String(row.ID || idx),
                name: (row.Nombre || 'Producto').trim(),
                price: parseInt((row.precio || "0").toString().replace(/\D/g, '')) || 0,
                desc: (row.Descripcion || '').trim(),
                image: (row.Imagen || '').trim(),
                available: isAvailable
            });
        });

        renderMenu(groups);
        updateFab();
    } catch (e) {
        console.error(e);
        document.getElementById('loading').innerHTML = '⚠️ Error al cargar el menú. Recarga la página.';
    }
}

function renderMenu(groups) {
    const container = document.getElementById('menu-container');
    const tabsScroll = document.getElementById('tabs-scroll');
    document.getElementById('loading').style.display = 'none';
    container.innerHTML = ''; tabsScroll.innerHTML = '';
    
    const cats = Object.keys(groups);
    if (cats.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px">No hay productos disponibles para esta empresa.</div>';
        return;
    }

    cats.forEach((cat, ci) => {
        // Render TABS
        const tab = document.createElement('button');
        tab.className = 'tab-btn' + (ci === 0 ? ' active' : '');
        tab.innerHTML = emo(cat) + ' ' + cat;
        tab.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('sec-' + ci)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        tabsScroll.appendChild(tab);

        // Render SECTION
        const sec = document.createElement('section');
        sec.className = 'cat-section'; sec.id = 'sec-' + ci;
        sec.innerHTML = `<h2 class="cat-title">${emo(cat)} ${cat} <span class="cat-count">${groups[cat].length}</span></h2>`;
        
        const grid = document.createElement('div');
        grid.className = 'menu-grid';
        
        groups[cat].forEach((p, pi) => {
            const qty = cart[p.id] ? cart[p.id].qty : 0;
            const card = document.createElement('div');
            card.className = 'menu-card' + (p.available ? '' : ' agotado');
            card.style.animationDelay = Math.min(pi * .06, .5) + 's';
            card.dataset.item = p.id; card.dataset.name = p.name.toLowerCase();
            card.dataset.desc = p.desc.toLowerCase(); card.dataset.cat = cat.toLowerCase();

            const imgHtml = p.image
                ? `<div class="card-img-wrap">${!p.available ? '<span class="badge-agotado">Agotado</span>' : ''}<img src="${eh(p.image)}" alt="${eh(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="card-img-ph card-img-placeholder" style="display:none">${emo(cat)}</div></div>`
                : `<div class="card-img-wrap">${!p.available ? '<span class="badge-agotado">Agotado</span>' : ''}<div class="card-img-placeholder">${emo(cat)}</div></div>`;
            
            const actHtml = p.available
                ? `<div class="card-actions" data-item="${eh(p.id)}">
            <button class="btn-add" style="${qty > 0 ? 'display:none' : ''}" onclick="setQty('${ej(p.id)}','${ej(p.name)}',${p.price},'${ej(p.image)}',1)">+ Agregar</button>
            <div class="qty-controls" style="${qty > 0 ? 'display:flex' : 'display:none'};align-items:center;gap:8px;width:100%">
              <button class="qty-btn minus" onclick="setQty('${ej(p.id)}','${ej(p.name)}',${p.price},'${ej(p.image)}',-1)">−</button>
              <span class="qty-num">${qty}</span>
              <span class="qty-subtotal">${qty > 0 ? fmt(p.price * qty) : ''}</span>
              <button class="qty-btn plus" onclick="setQty('${ej(p.id)}','${ej(p.name)}',${p.price},'${ej(p.image)}',1)">+</button>
            </div>
          </div>`
                : `<div style="text-align:center;font-size:.8rem;color:var(--danger);font-weight:600;padding:8px 0">No disponible</div>`;

            card.innerHTML = `${imgHtml}
        <div class="card-body">
          <div class="card-top">
            <div><h3 class="card-name">${eh(p.name)}</h3>${p.desc ? `<p class="card-desc">${eh(p.desc)}</p>` : ''}</div>
            <div class="card-price">${fmt(p.price)}</div>
          </div>
          ${actHtml}
        </div>`;
            grid.appendChild(card);
        });
        sec.appendChild(grid);
        container.appendChild(sec);
    });

    // Observer para scroll de TABS
    const sections = container.querySelectorAll('.cat-section');
    const tabs = tabsScroll.querySelectorAll('.tab-btn');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const idx = e.target.id.replace('sec-', '');
                tabs.forEach((t, i) => {
                    t.classList.toggle('active', String(i) === idx);
                    if (String(i) === idx) t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
                });
            }
        });
    }, { threshold: .35 });
    sections.forEach(s => obs.observe(s));
}

window.onload = init;
