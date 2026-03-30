async function init() {
  try {
    const res = await fetch(SHEET_URL);
    const csv = await res.text();
    
    // Usamos PapaParse con transformación de cabeceras a minúsculas y sin espacios
    const parsed = Papa.parse(csv, { 
      header: true, 
      skipEmptyLines: true,
      transformHeader: h => h.trim().toLowerCase() 
    });
    
    const rows = parsed.data;
    if (!rows.length) return;

    const groups = {};
    let empresaConfigurada = false;

    rows.forEach((row, idx) => {
      // 1. Filtro por nombre de empresa (Normalizado a MAYÚSCULAS para comparar)
      const nombreEnFila = (row.empresa || "").trim().toUpperCase();
      if (nombreEnFila !== MI_EMPRESA) return;

      // 2. Datos de Cabecera: Se extraen solo una vez de la primera fila que coincida
      if (!empresaConfigurada) {
        document.getElementById('empresa').textContent = row.empresa;
        document.getElementById('lugar').textContent = '📍 ' + (row.lugar || 'Ciénaga, Magdalena');
        document.title = row.empresa;
        
        // Limpiar y formatear teléfono para WhatsApp
        phone = (row.telefono || "").toString().replace(/\D/g, '');
        if (phone) {
          const fullPhone = phone.startsWith('57') ? phone : '57' + phone;
          document.getElementById('telefonoBtn').href = 'https://wa.me/' + fullPhone;
        }
        empresaConfigurada = true;
      }

      // 3. Procesar Categoría
      const cat = (row.categoria || 'General').trim();
      if (!groups[cat]) groups[cat] = [];

      // 4. Lógica de Disponibilidad (basada en tu columna 'estado')
      const est = (row.estado || "").toLowerCase().trim();
      const isAvailable = (est !== 'desactivado' && est !== 'agotado');

      // 5. Construir objeto de producto
      groups[cat].push({
        id: String(row.id || idx),
        name: (row.nombre || 'Producto').trim(),
        // Limpiamos el precio por si tiene puntos o símbolos
        price: parseInt((row.precio || "0").toString().replace(/\D/g, '')) || 0,
        desc: (row.descripcion || '').trim(),
        image: (row.imagen || '').trim(),
        available: isAvailable
      });
    });

    // Validar si encontramos productos para mostrar
    if (Object.keys(groups).length === 0) {
      document.getElementById('loading').innerHTML = `
        <div style="text-align:center; padding:40px;">
          <p>No se encontraron productos para <b>${MI_EMPRESA}</b></p>
          <p style="font-size:0.8rem; color:gray;">Verifica que el nombre en la columna 'Empresa' coincida exactamente.</p>
        </div>`;
      return;
    }

    renderMenu(groups);
    updateFab();

  } catch (e) {
    console.error("Error cargando la hoja 'menu':", e);
    document.getElementById('loading').innerHTML = '⚠️ Error al conectar con la base de datos.';
  }
}
