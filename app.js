const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQS1P9jB5HnKtkHZCeWtqlrPGeMWtgwAWIT4G6jux79_PMSdLf7v5_i7ZFz38TBiqv7lcsCmK1Edxu0/pub?gid=0&single=true&output=csv';

let menuData = {};
let empresa = { nombre: 'COMIDA RAPIDA ANDRES', lugar: '', telefono: '' };

async function loadMenu() {
  // Usamos PapaParse para descargar y procesar en un solo paso
  Papa.parse(SHEET_URL, {
    download: true,
    header: true, // Usa la primera fila como nombres de columnas
    skipEmptyLines: true,
    complete: function(results) {
      processData(results.data);
    },
    error: function(err) {
      console.error("Error al leer la hoja:", err);
      document.getElementById('loading').innerHTML = '<p>Error cargando datos.</p>';
    }
  });
}

function processData(rows) {
  menuData = {};

  rows.forEach(row => {
    // 1. Filtrar solo tu empresa (Ignora mayúsculas/minúsculas)
    const idEmp = (row.IDEmpresa || '').trim().toUpperCase();
    
    if (idEmp === 'COMIDA RAPIDA ANDRES') {
      
      // 2. Capturar datos de empresa (Solo la primera vez que aparezcan)
      if (!empresa.lugar && row.Lugar) {
        empresa.lugar = row.Lugar;
        empresa.telefono = row.Telefono;
      }

      // 3. Validar estado (Si es 'Activo' o está vacío se muestra)
      const estado = (row.estado || '').toLowerCase();
      if (estado === 'desactivado' || estado === 'agotado') return;

      // 4. Organizar por categorías
      const cat = row.Categoria || 'Otros';
      const producto = {
        nombre: row.Nombre,
        precio: parseInt((row.precio || '0').toString().replace(/\D/g, '')) || 0,
        descripcion: row.Descripcion,
        imagen: row.Imagen
      };

      if (!menuData[cat]) menuData[cat] = [];
      menuData[cat].push(producto);
    }
  });

  // Dibujar la interfaz (Estas funciones ya las tienes en tu código)
  renderInterfaz();
}

function renderInterfaz() {
  // ... (Aquí van tus funciones de renderizado que ya funcionan)
  console.log("Datos procesados con PapaParse:", menuData);
  // Llamar a renderPortada(), renderMenu(), etc.
}

// Iniciar carga
loadMenu();
