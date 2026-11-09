let idEnEdicion = null;

/* ============================
   API
   ============================ */

async function cargarProductos() {
    try {
        const resultado = await fetch("http://localhost:3000/productos");
        if (!resultado.ok) throw new Error("No hay respuesta de productos");
        return await resultado.json();
    } catch (error) {
        console.error("Error al cargar los productos:", error);
        return [];
    }
}

/* ============================
   Pintar listado
   ============================ */

async function pintarProductos() {
    const productos = await cargarProductos();
    const divProductos = document.getElementById("productos");
    if (!divProductos) return;

    divProductos.innerHTML = "";

    if (productos.length === 0) {
        divProductos.innerHTML = "<p style='text-align:center; grid-column: 1/-1;'>No hay productos disponibles.</p>";
        return;
    }

    productos.forEach(producto => {
        // Validamos que el producto tenga todas las propiedades
        const idStr = String(producto.id);
        const nombreStr = String(producto.nombre || "Sin nombre");
        
        divProductos.innerHTML += `
            <div class="product-card">
                <div>
                    <h3>${nombreStr}</h3>
                    <p><strong>ID:</strong> ${idStr}</p>
                    <p><strong>Precio:</strong> $${producto.precio}</p>
                    <p><strong>Stock:</strong> ${producto.stock}</p>
                </div>
                <div class="card-buttons">
                    <a href="detalle.html?id=${encodeURIComponent(idStr)}" class="btn-detalle btn-link">Detalle</a>
                    
                    <!-- Pasamos el ID de forma segura -->
                    <button class="btn-editar"
                        data-id="${idStr}"
                        data-nombre="${nombreStr.replace(/"/g, '&quot;')}"
                        data-stock="${producto.stock}"
                        data-precio="${producto.precio}">Actualizar</button>
                    
                    <button class="btn-eliminar" data-id="${idStr}">Eliminar</button>
                </div>
            </div>
        `;
    });

    // Listener para el botón "Actualizar"
    divProductos.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            // Obtenemos los datos directamente del botón que se clickeó
            const id = e.currentTarget.getAttribute("data-id");
            const nombre = e.currentTarget.getAttribute("data-nombre");
            const stock = e.currentTarget.getAttribute("data-stock");
            const precio = e.currentTarget.getAttribute("data-precio");

            prepararEdicion(id, nombre, stock, precio);
        });
    });

    // Listener para el botón "Eliminar"
    divProductos.querySelectorAll(".btn-eliminar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            eliminarProducto(id);
        });
    });
}

/* ============================
   Preparar Edición
   ============================ */

function prepararEdicion(id, nombre, stock, precio) {
    // Llenamos los inputs
    document.getElementById("nombre").value = nombre;
    document.getElementById("stock").value = stock;
    document.getElementById("precio").value = precio;

    // GUARDAMOS EL ID TAL CUAL VIENE (SIN CONVERSIONES)
    idEnEdicion = id; 
    console.log("Editando producto con ID:", idEnEdicion);

    const btnActualizar = document.getElementById("btnActualizar");
    btnActualizar.style.display = "block";
    
    // Ocultamos el botón de crear para no confundir
    document.getElementById("btnCrear").style.display = "none"; 

    document.getElementById("formularioProducto").scrollIntoView({ behavior: "smooth" });
}

function resetearFormulario() {
    document.getElementById("nombre").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("precio").value = "";

    idEnEdicion = null;

    document.getElementById("btnActualizar").style.display = "none";
    document.getElementById("btnCrear").style.display = "block"; // Volvemos a mostrar crear
}

/* ============================
   Eliminar
   ============================ */

async function eliminarProducto(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;

    try {
        const respuesta = await fetch(`http://localhost:3000/productos/${id}`, {
            method: "DELETE"
        });
        if (!respuesta.ok) throw new Error("No se pudo eliminar el producto");
        await pintarProductos();
    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Ocurrió un error al eliminar el producto.");
    }
}

/* ============================
   Crear y Actualizar
   ============================ */

function inicializarFormulario() {
    const btnCrear = document.getElementById("btnCrear");
    const btnActualizar = document.getElementById("btnActualizar");
    
    if (!btnCrear || !btnActualizar) return;

    function obtenerDatosFormulario() {
        const nombre = document.getElementById("nombre").value.trim();
        const stock = document.getElementById("stock").value;
        const precio = document.getElementById("precio").value;

        if (!nombre || stock === "" || precio === "") {
            alert("Por favor completa todos los campos.");
            return null;
        }

        return { 
            nombre: nombre, 
            stock: Number(stock), 
            precio: Number(precio) 
        };
    }

    // Evento para el botón Crear (POST)
    btnCrear.addEventListener("click", async function () {
        const data = obtenerDatosFormulario();
        if (!data) return;

        try {
            const respuesta = await fetch("http://localhost:3000/productos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!respuesta.ok) throw new Error("No se pudo crear el producto");

            await pintarProductos();
            resetearFormulario();
        } catch (error) {
            console.error("Error:", error);
            alert("Ocurrió un error al intentar crear el producto.");
        }
    });

    // Evento para el botón Actualizar (PUT)
    btnActualizar.addEventListener("click", async function () {
        if (!idEnEdicion) {
            alert("Error: No hay un producto seleccionado para actualizar.");
            return;
        }

        const data = obtenerDatosFormulario();
        if (!data) return;

        // AQUÍ ESTÁ EL TRUCO FINAL:
        // Forzamos que el ID vaya en el body como un String puro,
        // y usamos PUT, que requiere que el objeto esté completo.
        data.id = String(idEnEdicion);

        console.log("Enviando PUT a:", `http://localhost:3000/productos/${idEnEdicion}`);
        console.log("Datos enviados:", data);

        try {
            const respuesta = await fetch(`http://localhost:3000/productos/${idEnEdicion}`, {
                method: "PUT", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data) 
            });

            if (!respuesta.ok) {
                const errorText = await respuesta.text();
                throw new Error(`Error del servidor: ${errorText}`);
            }

            await pintarProductos();
            resetearFormulario();
            alert("¡Producto actualizado con éxito!");
        } catch (error) {
            console.error("Error al actualizar:", error);
            alert("Ocurrió un error al intentar actualizar el producto. Revisa la consola.");
        }
    });
}

/* ============================
   Arranque
   ============================ */

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("productos")) {
        pintarProductos();
    }
    inicializarFormulario();
});