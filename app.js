const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQS1P9jB5HnKtkHZCeWtqlrPGeMWtgwAWIT4G6jux79_PMSdLf7v5_i7ZFz38TBiqv7lcsCmK1Edxu0/pub?output=csv";

// Nombre exacto de tu empresa en la columna IDEmpresa
const MI_EMPRESA = "COMIDA RAPIDA ANDRES";

async function initMenu() {
    try {
        const response = await fetch(url);
        const csv = await response.text();

        // Usamos PapaParse para procesar el CSV
        const parsed = Papa.parse(csv, {
            header: true,
            skipEmptyLines: true
        });

        const rows = parsed.data;
        const menuGroups = {};
        let empresaConfigurada = false;

        rows.forEach((row, index) => {
            // 1. Filtramos: Solo procesar si pertenece a tu empresa
            const idEmp = (row.IDEmpresa || "").trim().toUpperCase();
            if (idEmp !== MI_EMPRESA) return;

            // 2. Configurar datos de la empresa (Solo una vez, del primer registro)
            if (!empresaConfigurada) {
                document.getElementById("empresa").textContent = row.IDEmpresa;
                document.getElementById("lugar").textContent = "📍 " + (row.Lugar || "Ciénaga, Magdalena");
                
                const tel = (row.Telefono || "").replace(/\D/g, '');
                if (tel) {
                    document.getElementById("telefonoBtn").href = `https://wa.me/57${tel}`;
                }
                empresaConfigurada = true;
            }

            // 3. Validar si el producto está Activo
            const estado = (row.estado || "").toLowerCase();
            if (estado === "desactivado" || estado === "agotado") return;

            // 4. Agrupar por Categoría
            const cat = row.Categoria || "General";
            if (!menuGroups[cat]) {
                menuGroups[cat] = [];
            }

            menuGroups[cat].push({
                nom: row.Nombre || "Producto",
                pre: parseInt((row.precio || "0").replace(/\D/g, '')) || 0,
                dsc: row.Descripcion || ""
            });
        });

        if (Object.keys(menuGroups).length === 0) {
            document.getElementById("loading").innerHTML = "No hay productos disponibles.";
            return;
        }

        renderHtml(menuGroups);

    } catch (err) {
        console.error(err);
        document.getElementById("loading").innerHTML = "⚠️ Error conectando con el menú.";
    }
}

function renderHtml(groups) {
    const container = document.getElementById("menu-container");
    const tabs = document.getElementById("category-tabs");

    container.innerHTML = "";
    tabs.innerHTML = "";
    document.getElementById("loading").style.display = "none";

    // Formateador de moneda colombiana
    const formatter = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    });

    for (const catName in groups) {
        const sectionId = catName.toLowerCase().replace(/\s+/g, '-');

        // Crear pestaña de navegación
        const tab = document.createElement("a");
        tab.href = `#${sectionId}`;
        tab.className = "nav-link";
        tab.textContent = catName;
        tabs.appendChild(tab);

        // Crear sección de productos
        let sectionHtml = `
            <section id="${sectionId}">
                <h2 class="category-title">${catName}</h2>
                <div class="products-list">
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
