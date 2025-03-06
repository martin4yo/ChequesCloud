  // Función para mostrar las alertas con bootstrap
function mostrarAlerta(mensaje, tipo) {
    const toastContainer = document.getElementById("toastContainer");

    // Crear el toast
    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-bg-${tipo} border-0 show p-4`; 
    toast.role = "alert";
    toast.ariaLive = "assertive";
    toast.ariaAtomic = "true";
    toast.style.fontSize = "1.5rem"; // Aumenta el tamaño de la fuente
    toast.style.width = "500px"; // Aumenta el ancho

    // Contenido del toast
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body text-center">${mensaje}</div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    // Agregar al contenedor
    toastContainer.appendChild(toast);

    // Eliminar después de 3 segundos
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Función para formatear fecha a dd/MM/yyyy
function formatearFecha(fecha) {
    //fecha.setDate(fecha.getDate() + 1); // Suma un día
    let fechaLocal = new Date(fecha);
    fechaLocal.setDate(fechaLocal.getDate() + 1); // Suma un día
    fechaLocal.setMinutes(fechaLocal.getMinutes() + fechaLocal.getTimezoneOffset()); // Ajustar UTC a local
    return fechaLocal.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

// Función para formatear importe con separadores de miles y 2 decimales
function formatearImporte(importe) {
    return new Intl.NumberFormat("es-ES", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(importe);
}

//** Conseguir la url de la API */
async function obtenerConfig() {
    try {
      const respuesta = await fetch("/api/config"); // Llamada al servidor
      const data = await respuesta.json();
      return data.apiUrl;
    } catch (error) {
      console.error("Error obteniendo configuración:", error);
    }
  }


window.formatearFecha = formatearFecha;
window.formatearImporte = formatearImporte;
window.mostrarAlerta = mostrarAlerta;
window.obtenerConfig = obtenerConfig;