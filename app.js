// ── CONFIGURACIÓN ──
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQS1P9jB5HnKtkHZCeWtqlrPGeMWtgwAWIT4G6jux79_PMSdLf7v5_i7ZFz38TBiqv7lcsCmK1Edxu0/pub?gid=0&single=true&output=csv';

// ▼▼ CÁMBIALO AQUÍ PARA MOSTRAR OTRA EMPRESA ▼▼
const NOMBRE_EMPRESA = 'COMIDA RAPIDA ANDRES';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

const CAT_EMOJI = {
  salchipapa: '🍟', pizza: '🍕', hamburguesa: '🍔',
  'perro caliente': '🌭', bebida: '🥤', bebidas: '🥤',
  postre: '🍰', postres: '🍰', default: '🍽️'
};

let menuData = {};
let empresa = {};
let cart = [];
let activeSection = null;

// ── FETCH CSV REAL DESDE GOOGLE SHEETS ──
async function loadMenu() {
  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error('Network error');
    
    // Almacenamos el contenido real del CSV
    const raw = await res.text(); 
    
    // Analizamos y separamos la información
    parseCSV(raw);
  } catch(e) {
    document.getElementById('loading').innerHTML =
      '<p style="color:#e8441a">Error cargando el menú. Verifica tu conexión o la URL pública.</p>';
  }
}

// ── SEPARADOR SEGURO PARA CSV ──
// Esta función previene que si una descripción tiene una coma (ej: "jamón, queso, huevo")
// no te parta la celda a la mitad. Google Sheets guarda las celdas con coma dentro de comillas ("").
function splitCSV(str) {
  const result = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && str[i+1] === '"') {
      cell += '"'; // Comilla escapada
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }
  result.push(cell);
  return result;
}

// ── PROCESAR INFORMACIÓN ──
function parseCSV(raw) {
  // Limpiamos saltos de línea y separamos filas
  const lines = raw.replace(/\r/g, '').trim().split('\n');
  
  // Extraemos y normalizamos encabezados
  const headers = splitCSV(lines[0]).map(h => h.trim().toLowerCase());

  const get = (row, col) => {
    const i = headers.indexOf(col.toLowerCase());
    return i >= 0 ? (row[i] || '').trim() : '';
  };

  menuData = {};
  empresa = {};

  // Empezamos desde i=1 para saltarnos los encabezados (ID, Empresa, etc)
  for (let i = 1; i < lines.length; i++) {
    const row = splitCSV(lines[i]);
    if (!row[0]) continue; // saltar líneas vacías

    const empName = get(row, 'Empresa');
    const status = get(row, 'estado');

    // ▼ ESTE ES EL FILTRO: Solo pasará si el nombre de la empresa coincide y no está inactivo
    if (empName.toLowerCase() !== NOMBRE_EMPRESA.toLowerCase()) continue;
    if (status.toLowerCase() === 'inactivo') continue; 
    // ▲ (Opcional, pero te permite apagar productos desde la hoja poniendo "inactivo" en estado)

    const cat   = get(row, 'Categoria');
    const nom   = get(row, 'Nombre');
    const prec  = parseInt(get(row, 'precio')) || 0;
    const desc  = get(row, 'Descripcion');
    const img   = get(row, 'Imagen');
    const lugar = get(row, 'Lugar');
    const tel   = get(row, 'Telefono');

    // El primer producto de esa empresa que encuentre dictará los datos de portada
    if (!empresa.nombre) {
      empresa = { nombre: empName, lugar: lugar, telefono: tel };
    }

    // Clasifica por categoría
    if (!menuData[cat]) menuData[cat] = [];
    menuData[cat].push({ nombre: nom, precio: prec, descripcion: desc, imagen: img });
  }

  // Si no encontró ningún producto o si la empresa está mal escrita en el código
  if (Object.keys(menuData).length === 0) {
    document.getElementById('loading').innerHTML =
      `<p style="color:#e8441a">No se encontraron productos para: <b>${NOMBRE_EMPRESA}</b>. Verifica el nombre exacto.</p>`;
    return;
  }

  // Renderiza en pantalla todo si todo salió bien
  renderPortada();
  renderMenu();
  renderNavbar();
  document.getElementById('loading').style.display = 'none';
  document.getElementById('menu').style.display = 'block';
  document.getElementById('navbar').style.display = 'flex';
}

// ── PORTADA ──
function renderPortada() {
  document.getElementById('cover-nombre').textContent = empresa.nombre || 'Restaurante';
  document.getElementById('lugar-txt').textContent = empresa.lugar || '';
  const tel = empresa.telefono;
  if (tel) {
    const num = tel.replace(/\D/g,'');
    document.getElementById('wa-link').href = `https://wa.me/57${num}`; // "57" por Colombia, cámbialo si es otro país
  }
  document.title = empresa.nombre || 'Carta Digital';
}

// ── MENÚ ──
function renderMenu() {
  const menu = document.getElementById('menu');
  menu.innerHTML = '';
  const cats = Object.keys(menuData);
  activeSection = cats[0];

  cats.forEach(cat => {
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
  const cats = Object.keys(menuData);
  const items = cats.map(cat => `
    <button class="nav-item ${cat === activeSection ? 'active' : ''}"
      onclick="scrollToCat('${sanitize(cat)}', this)">${cap(cat)}</button>`).join('');
  nav.innerHTML = items + `
    <button class="nav-cart-btn" onclick="openCart()">
      🛒 Pedido
      <span class="cart-badge" id="cart-badge">0</span>
    </button>`;
}

function scrollToCat(id, btn) {
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
    cont.
