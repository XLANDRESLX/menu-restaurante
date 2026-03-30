const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQS1P9jB5HnKtkHZCeWtqlrPGeMWtgwAWIT4G6jux79_PMSdLf7v5_i7ZFz38TBiqv7lcsCmK1Edxu0/pub?output=csv";
const MI_EMPRESA = "COMIDA RAPIDA ANDRES";

async function initMenu() {
    try {
        const response = await fetch(url);
        const csv = await response.text();

        const parsed = Papa.parse(csv, {
            header: true,
            skipEmptyLines: true
        });

        const rows = parsed.data;
        const menuGroups = {};
        
        // Objeto para guardar los datos de contacto una sola vez
        let datosEmpresa = {
            nombre: MI_EMPRESA,
            lugar: "",
            telefono: ""
        };
        let contactoCapturado = false;

        rows.forEach((row) => {
            // Filtro principal por nombre de empresa
            const nombreEnFila = (row.Empresa || "").trim().toUpperCase();
            if (nombreEnFila !== MI_EMPRESA) return;

            // LÓGICA DE CAPTURA ÚNICA: Solo si es la primera vez que encontramos datos de contacto
            if (!contactoCapturado && row.Lugar && row.Telefono) {
                datosEmpresa.lugar = row.Lugar;
                datosEmpresa.telefono = row.Telefono.toString().replace(/\D/g, '');
                
                // Actualizamos la interfaz de inmediato con estos datos únicos
                document.getElementById("empresa").textContent = datosEmpresa.nombre;
                document.getElementById("lugar").textContent = "📍 " + datosEmpresa.lugar;
                
                const fullTel = datosEmpresa.telefono.startsWith('57') ? datosEmpresa.telefono : '57' + datosEmpresa.telefono;
                document.getElementById("telefonoBtn").href = `https://wa.me/${fullTel}`;
                
                contactoCapturado = true; // Bloqueamos para que no busque más estos datos
            }

            // LÓGICA DE PRODUCTOS: Se ejecuta para todas las filas de tu empresa
            const estadoActual = (row.estado || "").toLowerCase();
            if (estadoActual === "desactivado" || estadoActual === "agotado") return;

            const cat = row.Categoria || "General";
            if (!menuGroups[cat]) menuGroups[cat] = [];

            menuGroups[cat].push({
                nom: row.Nombre || "Producto",
                pre: parseInt((row.precio || "0").toString().replace(/\D/g, '')) || 0,
                dsc: row.Descripcion || ""
            });
        });

        if (Object.keys(menuGroups).length === 0) {
            document.getElementById("loading").innerHTML = "No se encontraron productos activos.";
            return;
        }

        renderHtml(menuGroups);

    } catch (err) {
        console.error("Error en la carga:", err);
        document.getElementById("loading").innerHTML = "⚠️ Error al conectar con la base de datos.";
    }
}

function renderHtml(groups) {
    const container = document.getElementById("menu-container");
    const tabs = document.getElementById("category-tabs");

    container.innerHTML = "";
    tabs.innerHTML = "";
    document.getElementById("loading").style.display = "none";

    const formatter = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    });

    // Generar el HTML por categorías
    for (const catName in groups) {
        const sectionId = catName.toLowerCase().replace(/\s+/g, '-');

        // Nav Tab
        const tab = document.createElement("a");
        tab.href = `#${sectionId}`;
        tab.className = "nav-link";
        tab.textContent = catName;
        tabs.appendChild(tab);

        // Section
        let sectionHtml = `
            <section id="${sectionId}">
                <h2 class="category-title">${catName}</h2>
                <div class="list-wrapper">
        `;

        groups[catName].forEach(p => {
            sectionHtml += `
                <div class="menu-item">
                    <div class="item-info">
                        <h3>${p.nom}</h3>
                        <p>${p.dsc}</p>
                    </div>
                    <div class="item-price">${formatter.format(p.pre)}</div>
                </div>
            `;
        });

        sectionHtml += `</div></section>`;
        container.innerHTML += sectionHtml;
    }
}

window.onload = initMenu;
