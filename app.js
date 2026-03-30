async function parseCSV(raw) {
  // Detectar si el separador es coma o tabulación (Google Sheets varía según la región)
  const separator = raw.includes('\t') ? '\t' : ',';
  const lines = raw.trim().split('\n');
  
  // Limpiamos los encabezados (quitamos espacios y pasamos a minúsculas)
  const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());

  // Función auxiliar para extraer datos por nombre de columna
  const get = (row, colName) => {
    const idx = headers.indexOf(colName.toLowerCase());
    return idx > -1 ? (row[idx] || '').trim().replace(/^"|"$/g, '') : '';
  };

  menuData = {};

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(separator);
    if (row.length < 2) continue;

    // 1. CAPTURAR INFO DE EMPRESA (Solo si no la hemos guardado ya)
    // Esto cumple con tu regla: "solo están en la primera línea"
    if (!empresa.nombre) {
      const empNom = get(row, 'empresa');
      if (empNom) {
        empresa = {
          nombre: empNom,
          lugar: get(row, 'lugar'),
          telefono: get(row, 'telefono')
        };
      }
    }

    // 2. PROCESAR PRODUCTO
    const cat = get(row, 'categoria').toLowerCase();
    const producto = {
      nombre: get(row, 'nombre'),
      precio: parseInt(get(row, 'precio').replace(/\D/g, '')) || 0,
      descripcion: get(row, 'descripcion'),
      imagen: get(row, 'imagen'),
      estado: get(row, 'estado').toLowerCase()
    };

    // Solo agregar si el producto está activo (puedes usar la columna 'estado')
    if (producto.nombre && producto.estado !== 'agotado') {
      if (!menuData[cat]) menuData[cat] = [];
      menuData[cat].push(producto);
    }
  }

  // Una vez procesado todo, dibujamos la interfaz
  renderPortada();
  renderMenu();
  renderNavbar();
  
  document.getElementById('loading').style.display = 'none';
  document.getElementById('menu').style.display = 'block';
  document.getElementById('navbar').style.display = 'flex';
}
