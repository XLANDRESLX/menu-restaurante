// ── CONFIGURACIÓN ──
// Esta es la URL de tu Google Sheet en formato CSV
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQS1P9jB5HnKtkHZCeWtqlrPGeMWtgwAWIT4G6jux79_PMSdLf7v5_i7ZFz38TBiqv7lcsCmK1Edxu0/pub?gid=0&single=true&output=csv';

const CAT_EMOJI = {
  salchipapa: '🍟', pizza: '🍕', hamburguesa: '🍔',
  'perro caliente': '🌭', bebida: '🥤', bebidas: '🥤',
  postre: '🍰', postres: '🍰', default: '🍽️'
};

let menuData = {};
let empresa = {};
let cart = [];
let activeSection = null;

// ── FETCH CSV (Conectado a la hoja de cálculo) ──
async function loadMenu() {
  try {
    // Aquí hace la petición real a tu Google Sheet
    const res = await fetch(SHEET_URL);
    const raw = await res.text();
    
    // Procesa el texto CSV
    parseCSV(raw);
  } catch(e) {
    document.getElementById('loading').innerHTML =
      '<p style="color:#e8441a">Error cargando el menú. Verifica tu conexión a internet o la URL del CSV.</p>';
  }
}

function parseCSV(raw) {
  const lines = raw.trim().split('\n');
  const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());

  // Función para obtener datos usando comas o tabulaciones dependiendo del formato de descarga de Google
  // Como Google public en CSV suele separar por comas, ajustamos el split aquí:
  // Nota: Si configuraste Google Sheets para exportar TSV (tabulaciones), deja '\t'. Si es CSV estándar, usa ','.
  // Vamos a usar una expresión regular básica para manejar CSV estándar separando por comas respetando comillas
  
  const separator = raw.includes('\t') ? '\t' : ','; 
  const parsedHeaders = lines[0].split(separator).map(h => h.trim().toLowerCase());

  const get = (row, col) => {
    const i = parsedHeaders.indexOf(col);
    return i >= 0 ? (row[i] || '').trim().replace(/^"|"$/g, '') : ''; // Limpia comillas si las hay
  };

  menuData = {};

  for (let i = 1; i < lines.length; i++) {
    // Ignoramos líneas vacías
    if (!lines[i].trim()) continue;

    // Dividimos por el separador detectado
    const row = lines[i].split(separator);
    if (!row[0]) continue;

    const emp   = get(row, 'empresa');
    const cat   = get(row, 'categoria');
    const nom   = get(row, 'nombre');
    const prec  = parseInt(get(row, 'precio')) || 0;
    const desc  = get(row, 'descripcion');
    const img   = get(row, 'imagen');
    const lugar = get(row, 'lugar');
    const tel   = get(row, 'telefono');

    if (!empresa.nombre && emp) {
      empresa = { nombre: emp, lugar, telefono: tel };
    }

    if (!menuData[cat]) menuData[cat] = [];
    menuData[cat].push({ nombre: nom, precio: prec, descripcion: desc, imagen: img });
  }

  renderPortada();
  renderMenu();
  renderNavbar();
  document.getElementById('loading').style.display = 'none';
  document.getElementById('menu').style.display = 'block';
  document.getElementById('navbar').style.display = 'flex';
}

// ── PORTADA ──
function renderPortada() {
  document.getElementById('cover-nombre').textContent = empresa.nombre || 'Comida Rápida Andrés';
  document.getElementById('lugar-txt').textContent = empresa.lugar || '';
  const tel = empresa.telefono;
  if (tel) {
    const num = tel.replace(/\D/g,'');
    document.getElementById('wa-link').href = `https://wa.me/57${num}`;
  }
  document.title = empresa.nombre || 'Carta Digital';
}

// ── MENÚ ──
function renderMenu() {
  const menu = document.getElementById('menu');
  menu.innerHTML = '';
  const cats = Object.keys(menuData);
  
  if (cats.length === 0) {
     menu.innerHTML = '<p style="text-align:center; color:var(--muted)">No hay productos disponibles en este momento.</p>';
     return;
  }
  
  activeSection = cats[0];

  cats.forEach(cat => {
    if (!cat || cat === 'undefined') return; // Filtra categorías vacías
    const section = document.createElement('section');
    section.id = 'cat-' + sanitize(cat);
    section.innerHTML = `<h2 class="section-title">${cap(cat)}</h2>
      <div class="products-grid">${menuData[cat].map(p => productCard(p, cat)).join('')}</div>`;
    menu.appendChild(section);
  });
}

function productCard(p, cat) {
  const emoji = CAT_EMOJI[cat.toLowerCase()] || CAT_EMOJI.default;
  const imgHtml = p.imagen
    ? `<div class="product-img"><img src="${p.imagen}" alt="${p.nombre}" loading="lazy" onerror="this.parentElement.innerHTML='${emoji}'"/></div>`
    : `<div class="product-img">${emoji}</div>`;

  return `<div class="product-card">
    ${imgHtml}
    <div class="product-body">
      <div class="product-name">${p.nombre}</div>
      <div class="product-desc">${p.descripcion || 'Sin descripción'}</div>
      <div class="product-footer">
        <span class="product-price">$${p.precio.toLocaleString('es-CO')}</span>
        <button class="add-btn" onclick='addToCart(${JSON.stringify(p)})'>+ Agregar</button>
      </div>
    </div>
  </div>`;
}

// ── NAVBAR ──
function renderNavbar() {
  const nav = document.getElementById('navbar');
  const cats = Object.keys(menuData).filter(c => c && c !== 'undefined');
  const items = cats.map(cat => `
    <button class="nav-item ${cat === activeSection ? 'active' : ''}"
      onclick="scrollTo('${sanitize(cat)}', this)">${cap(cat)}</button>`).join('');
  nav.innerHTML = items + `
    <button class="nav-cart-btn" onclick="openCart()">
      🛒 Pedido
      <span class="cart-badge" id="cart-badge">0</span>
    </button>`;
}

function scrollTo(id, btn) {
  document.getElementById('cat-' + id)?.scrollIntoView({behavior:'smooth', block:'start'});
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');
}

// ── CARRITO ──
function addToCart(product) {
  const existing = cart.find(i => i.nombre === product.nombre);
  if (existing) { existing.qty++; }
  else { cart.push({...product, qty: 1, nota: ''}); }
  updateBadge();
  showToast(`✓ ${cap(product.nombre)} agregado`);
}

function updateBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cart-badge');
  if (badge) { badge.textContent = total; badge.style.display = total > 0 ? 'flex' : 'none'; }
}

function openCart() {
  document.getElementById('cart-overlay').classList.add('open');
  renderCart();
}
function closeCart() {
  document.getElementById('cart-overlay').classList.remove('open');
}
document.getElementById('cart-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('cart-overlay')) closeCart();
});

function renderCart() {
  const cont = document.getElementById('cart-content');
  if (cart.length === 0) {
    cont.innerHTML = `<div class="empty-cart"><span class="emoji">🛒</span>Tu carrito está vacío.<br>¡Agrega algo rico!</div>`;
    return;
  }

  const total = cart.reduce((s, i) => s + i.precio * i.qty, 0);

  cont.innerHTML = `
    <div class="cart-items" id="cart-items-list">${cart.map((item, idx) => cartItem(item, idx)).join('')}</div>
    <div class="form-section">
      <div>
        <label class="form-label">👤 Nombre del cliente</label>
        <input class="form-input" id="cliente-nombre" placeholder="Tu nombre completo" />
      </div>
      <div>
        <label class="form-label">💳 Método de pago</label>
        <select class="form-select" id="metodo-pago">
          <option value="">Selecciona método</option>
          <option>Efectivo</option>
          <option>Transferencia</option>
          <option>Nequi</option>
          <option>Daviplata</option>
          <option>Tarjeta</option>
        </select>
      </div>
    </div>
    <div class="cart-total">
      <span class="total-label">Total</span>
      <span class="total-val">$${total.toLocaleString('es-CO')}</span>
    </div>
    <button class="send-btn" onclick="sendOrder()">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.526 5.845L.057 23.619a.75.75 0 00.908.928l5.938-1.553A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.73 9.73 0 01-4.953-1.352l-.355-.21-3.676.961.981-3.584-.231-.369A9.722 9.722 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
      Enviar Pedido
    </button>`;
}

function cartItem(item, idx) {
  return `<div class="cart-item">
    <div class="cart-item-info">
      <div class="cart-item-name">${cap(item.nombre)}</div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeQty(${idx}, -1)">−</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
        <span class="cart-item-price">$${(item.precio * item.qty).toLocaleString('es-CO')}</span>
      </div>
      <input class="cart-item-note-input" placeholder="Algo especial? ej: sin cebolla, sencilla sin verdura..."
        value="${item.nota}" oninput="cart[${idx}].nota=this.value" />
    </div>
    <button class="remove-btn" onclick="removeItem(${idx})">🗑</button>
  </div>`;
}

function changeQty(idx, delta) {
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  updateBadge();
  renderCart();
}
function removeItem(idx) {
  cart.splice(idx, 1);
  updateBadge();
  renderCart();
}

function sendOrder() {
  const nombre = document.getElementById('cliente-nombre')?.value.trim();
  const pago   = document.getElementById('metodo-pago')?.value;

  if (!nombre) { showToast('⚠️ Escribe tu nombre'); return; }
  if (!pago)   { showToast('⚠️ Elige método de pago'); return; }
  if (cart.length === 0) { showToast('⚠️ El carrito está vacío'); return; }

  const total = cart.reduce((s, i) => s + i.precio * i.qty, 0);

  let msg = `🍽️ *PEDIDO - ${empresa.nombre}*\n`;
  msg += `👤 *Cliente:* ${nombre}\n`;
  msg += `💳 *Pago:* ${pago}\n\n`;
  msg += `*Productos:*\n`;
  cart.forEach(item => {
    msg += `• ${item.qty}x ${cap(item.nombre)} - $${(item.precio * item.qty).toLocaleString('es-CO')}`;
    if (item.nota) msg += `\n  📝 _${item.nota}_`;
    msg += '\n';
  });
  msg += `\n💰 *Total: $${total.toLocaleString('es-CO')}*`;

  const tel = empresa.telefono?.replace(/\D/g,'');
  const url = `https://wa.me/57${tel}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ── UTILS ──
function cap(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }
function sanitize(str) { return str.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''); }

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// Intersection Observer para activar nav
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id.replace('cat-','');
      document.querySelectorAll('.nav-item').forEach(b => {
        b.classList.toggle('active', sanitize(b.textContent) === id);
      });
    }
  });
}, { threshold: 0.3 });

// ── INICIO ──
loadMenu().then(() => {
  document.querySelectorAll('[id^="cat-"]').forEach(s => observer.observe(s));
});
