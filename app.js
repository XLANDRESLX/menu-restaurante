const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQS1P9jB5HnKtkHZCeWtqlrPGeMWtgwAWIT4G6jux79_PMSdLf7v5_i7ZFz38TBiqv7lcsCmK1Edxu0/pub?gid=0&single=true&output=csv';

// Emojis por categoría para que se vea elegante
const CAT_EMOJI = {
  salchipapa: '🍟', pizza: '🍕', hamburguesa: '🍔',
  'perro caliente': '🌭', mazorcada: '🌽', patacon: '🍌',
  'arepa rellena': '🫓', bebidas: '🥤', postres: '🍰',
  combos: '🎁', entradas: '🥟', especial: '✨', default: '🍴'
};

let menuData = {};
let empresa = { nombre: 'COMIDA RAPIDA ANDRES', lugar: '', telefono: '' };
let cart = [];

async function loadMenu() {
  try {
    const res = await fetch(SHEET_URL);
    const raw = await res.text();
    parseCSV(raw);
  } catch(e) {
    document.getElementById('loading').innerHTML = '<p style="color:red">Error de conexión con el menú.</p>';
  }
}

function parseCSV(raw) {
  const lines = raw.trim().split('\n');
  // Detectar separador (punto y coma es común en Excel latino)
  let sep = ',';
  if (lines[0].includes(';')) sep = ';';
  if (lines[0].includes('\t')) sep = '\t';

  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());
  
  const get = (row, col) => {
    const i = headers.indexOf(col.toLowerCase());
    return i >= 0 ? (row[i] || '').trim().replace(/^"|"$/g, '') : '';
  };

  menuData = {};

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(sep);
    const idEmp = get(row, 'idempresa');

    // FILTRO: Solo procesar si es tu empresa
    if (idEmp.toUpperCase() === 'COMIDA RAPIDA ANDRES') {
      
      // Capturar datos de contacto solo del primer registro encontrado
      if (!empresa.lugar) {
        empresa.lugar = get(row, 'lugar');
        empresa.telefono = get(row, 'telefono');
      }

      const estado = get(row, 'estado').toLowerCase();
      if (estado === 'desactivado' || estado === 'agotado') continue;

      const cat = get(row, 'categoria') || 'Otros';
      const producto = {
        nombre: get(row, 'nombre'),
        precio: parseInt(get(row, 'precio').replace(/\D/g, '')) || 0,
        descripcion: get(row, 'descripcion'),
        imagen: get(row, 'imagen')
      };

      if (!menuData[cat]) menuData[cat] = [];
      menuData[cat].push(producto);
    }
  }

  renderInterfaz();
}

function renderInterfaz() {
  // Actualizar Portada
  document.getElementById('cover-nombre').textContent = empresa.nombre;
  document.getElementById('lugar-txt').textContent = empresa.lugar;
  if (empresa.telefono) {
    const num = empresa.telefono.replace(/\D/g,'');
    document.getElementById('wa-link').href = `https://wa.me/57${num}`;
  }

  // Renderizar Menú
  const menuHTML = document.getElementById('menu');
  menuHTML.innerHTML = '';
  
  Object.keys(menuData).forEach(cat => {
    const section = document.createElement('section');
    section.id = `cat-${cat.toLowerCase().replace(/\s+/g,'-')}`;
    section.innerHTML = `
      <h2 class="section-title">${CAT_EMOJI[cat.toLowerCase()] || CAT_EMOJI.default} ${cat}</h2>
      <div class="products-grid">
        ${menuData[cat].map(p => `
          <div class="product-card">
            <div class="product-body">
              <div class="product-name">${p.nombre}</div>
              <div class="product-desc">${p.descripcion || ''}</div>
              <div class="product-footer">
                <span class="product-price">$${p.precio.toLocaleString('es-CO')}</span>
                <button class="add-btn" onclick='addToCart(${JSON.stringify(p)})'>+ Agregar</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>`;
    menuHTML.appendChild(section);
  });

  document.getElementById('loading').style.display = 'none';
  document.getElementById('menu').style.display = 'block';
  renderNavbar();
}

// ... (Resto de funciones: renderNavbar, addToCart, sendOrder se mantienen igual)
