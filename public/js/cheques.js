// PAGINADO DE TABLA 

const apiUrl = "http://localhost:8080/api/cheques";

    let Cheques = [];
    let currentPage = 1;
    const rowsPerPage = 10;

    async function fetchCheques() {
        try {

            const filtros = crearFiltro()
        
            const params = new URLSearchParams(filtros).toString();  
            const response = await fetch(`${apiUrl}?${params}`);

            if (!response.ok) throw new Error("Error al recuperar los datos.");
            Cheques = await response.json();
            renderTable();
        } catch (error) {
            document.getElementById("tablaCheques").innerHTML = `<tr><td colspan="2" class="text-danger">Error al cargar datos</td></tr>`;
            console.error("Error:", error);
        }
    }

    function renderTable() {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const ChequesPaginados = Cheques.slice(start, end);

        const tabla = document.getElementById("tablaCheques");
        tabla.innerHTML = ChequesPaginados.map(Cheque => `
            <tr>
                <td class="align-middle">${Cheque.numero}</td>
                <td class="align-middle">${formatearFecha(Cheque.emision)}</td>
                <td class="align-middle">${formatearFecha(Cheque.vencimiento)}</td>
                <td class="align-middle">${formatearImporte(Cheque.importe)}</td>
                <td class="w-100 align-middle">${Cheque.nombre}</td>
                <td class="align-middle">
                    ${Cheque.conciliado ? formatearFecha(Cheque.fechaconciliacion) : ""}
                </td>
                <td>
                    <div class="td-container">
                            <button class="btn btn-warning" data-bs-toggle="tooltip" data-bs-placement="top" title="Editar Cheque" onclick="editarCheque(${Cheque.id})">
                                    <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn btn-danger" data-bs-toggle="tooltip" data-bs-placement="top" title="Eliminar Cheque" onclick="deleteCheque(${Cheque.id}, '${Cheque.numero}')">
                                    <i class="fa-solid fa-trash"></i>
                            </button>
                    </div>
                </td>
            </tr>
        `).join("");

        document.getElementById("currentPage").textContent = currentPage;
        document.getElementById("prevPage").parentElement.classList.toggle("disabled", currentPage === 1);
        document.getElementById("nextPage").parentElement.classList.toggle("disabled", end >= Cheques.length);
    }

document.getElementById("prevPage").addEventListener("click", function(event) {
        event.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    document.getElementById("nextPage").addEventListener("click", function(event) {
        event.preventDefault();
        if (currentPage * rowsPerPage < Cheques.length) {
            currentPage++;
            renderTable();
        }
    });

    fetchCheques();

//* Crear Objeto Filtros

function crearFiltro(){
    return {
        banco: document.getElementById("bancoFiltro").value,
        fechaEmisionDesde: document.getElementById("emisiondesde").value || "1900-01-01",
        fechaEmisionHasta: document.getElementById("emisionhasta").value || "2050-12-31",
        fechaVencimientoDesde: document.getElementById("vencimientodesde").value || "1900-01-01",
        fechaVencimientoHasta: document.getElementById("vencimientohasta").value || "2050-12-31",
        conciliado: document.getElementById("conciliadoFiltro").value,
        nombre : document.getElementById("nombreFiltro").value,
        importeDesde: document.getElementById("importedesde").value || 0,
        importeHasta: document.getElementById("importehasta").value || 999999999
    };
}

//********************************************************************************
// Cargar bancos 
document.addEventListener("DOMContentLoaded", async () => {
    await cargarBancos();
});

// Función para cargar la lista de bancos desde la API
async function cargarBancos() {
    try {
        const response = await fetch("http://localhost:8080/api/bancos");
        const bancos = await response.json();
        
        const bancoFiltro = document.getElementById("bancoFiltro");

        bancos.forEach(banco => {
            const option = document.createElement("option");
            option.value = banco.id;
            option.textContent = banco.nombre;
            bancoFiltro.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar los bancos:", error);
    }
}

//** Aplicacion del Filtro */
document.getElementById("aplicafiltro").addEventListener("click", function(event) {
    event.preventDefault();
    if (document.getElementById("bancoFiltro").value !== ""){
        const select = document.getElementById("bancoFiltro");
        const selectedText = select.selectedOptions[0].text;
        document.getElementById("tituloCheques").innerHTML = `Cheques de ${selectedText}`;
    }
    else {
        document.getElementById("tituloCheques").innerHTML = "Cheques";
    }
    fetchCheques();
});

//** Limpia el Filtro */
document.getElementById("limpiafiltro").addEventListener("click", function(event) {
    event.preventDefault();
    document.getElementById("tituloCheques").innerHTML = "Cheques";
    document.getElementById("bancoFiltro").value = "";
    document.getElementById("emisiondesde").value = null;
    document.getElementById("emisionhasta").value = null;
    document.getElementById("vencimientodesde").value = null;
    document.getElementById("vencimientohasta").value = null;
    document.getElementById("conciliadoFiltro").value = null;
    document.getElementById("nombreFiltro").value = null;
    document.getElementById("importedesde").value = null;
    document.getElementById("importehasta").value = null;
    fetchCheques();
});

//** Exporta a Excel */
document.getElementById("btnExportar").addEventListener("click", function(event) {
    event.preventDefault();
    //** Pasar pasametros */
    const filtros = crearFiltro();    
    const params = new URLSearchParams(filtros).toString();  
    window.location.href = `/exportar?${params}`; // Redirige para descargar el archivo
});


//** Manejo de Formularios */

function resetForm(){
    document.getElementById("idCheque").value = "";
    document.getElementById("numero").value = "";
    document.getElementById("emision").value = "";
    document.getElementById("vencimiento").value = "";
    document.getElementById("nombre").value = "";
    document.getElementById("importe").value = "";
    document.getElementById("conciliado").checked = false;
    document.getElementById("fechaconciliacion").value = "";
}

document.getElementById("btnNuevo").addEventListener("click", function() {
    resetForm();
    document.getElementById("numero").focus();
});

function editarCheque(id) {
    fetch(`${apiUrl}/${id}`)
        .then(response => response.json())
        .then(Cheque => {
            document.getElementById("idCheque").value = Cheque.id;
            document.getElementById("bancoFiltro").value = Cheque.banco;
            document.getElementById("numero").value = Cheque.numero;
            document.getElementById("emision").value = Cheque.emision;
            document.getElementById("vencimiento").value = Cheque.vencimiento;
            document.getElementById("nombre").value = Cheque.nombre;
            document.getElementById("importe").value = Cheque.importe;
            document.getElementById("conciliado").checked = Cheque.conciliado;
            document.getElementById("fechaconciliacion").value = Cheque.fechaconciliacion;
            document.getElementById("numero").focus();
        })
        .catch(error => console.error("Error al obtener Cheque:", error));
}

// Confirmacion de Delete de BOOTSTRAP 

let itemIdToDelete = null;
let pTitleToDelete = null;

function deleteCheque(itemId, pTitle) {
    itemIdToDelete = itemId;
    pTitleToDelete = document.getElementById('pTitleToDelete');
    pTitleToDelete.innerHTML = `Elimina cheque numero ${pTitle}?` 
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    deleteModal.show();
}

document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
    if (itemIdToDelete !== null) {
          fetch(`${apiUrl}/${itemIdToDelete}/`, {  //Llamo a la API con el metodo para eliminar
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            if (!response.ok) {         //Verifico si la respuesta no fue satisfactoria
                throw new Error("Error al eliminar el cheque");
            }
            return response.json(); 
        })
        .then(data => {
            // El producto pudo ser eliminado
            mostrarAlerta("Cheque eliminado correctamente", "success"); 
        })
        .catch(error => {
            // Hubo algun error en el proceso
            console.error("Error:", error);
            mostrarAlerta("Se produjo un error al eliminar el Cheque", "danger"); 
        });
    }
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    deleteModal.hide();
    fetchCheques();
});

//Enviar los datos para el ALTA del Cheque **************

document.getElementById("chequeForm").addEventListener("submit", async function(event) {
    event.preventDefault(); 
    event.stopPropagation();

    let form = event.target;
    // let numDesde = document.getElementById("numdesde");
    // let numHasta = document.getElementById("numhasta");

    // // Validación personalizada: numdesde < numhasta
    // if (parseInt(numDesde.value) >= parseInt(numHasta.value)) {
    //     numHasta.classList.add("is-invalid");
    //     numHasta.nextElementSibling.textContent = "Debe ser mayor que 'Número Desde'.";
    // } else {
    //     numHasta.classList.remove("is-invalid");
    // }

    // Validación de banco
    if (document.getElementById("bancoFiltro").value === ""){
        mostrarAlerta("Debe seleccionar un banco en los filtros", "danger");
        return response.json();
    }

    const result = await validarNumero()
  
    if (!result.success) {
        mostrarAlerta(result.message, "danger"); 
        return result;
    }

    // Intento guardar el cheque 
    if (form.checkValidity()) {
        // Recupero los datos del formulario para enviar a la API con el POST
        const idCheque = document.getElementById("idCheque").value;

        const ChequeData = {
            banco: document.getElementById("bancoFiltro").value,
            numero: document.getElementById("numero").value,
            emision: document.getElementById("emision").value,
            vencimiento: document.getElementById("vencimiento").value,
            importe: document.getElementById("importe").value,
            nombre: document.getElementById("nombre").value,
            conciliado: document.getElementById("conciliado").checked,
            fechaconciliacion: document.getElementById("fechaconciliacion").value === "" ? "1900-01-01" : document.getElementById("fechaconciliacion").value
        };

        // Configuración del POST
        if (idCheque) {
                // Editar Cheque existente
                fetch(`${apiUrl}/${idCheque}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(ChequeData)
                })
                .then(response => {
                    if (!response.ok) {  // Si la respuesta no fue satisfactoria
                        throw new Error("Error al modificar el Cheque");
                    }
                    return response.json();
                })
                .then(() => {
                    resetForm();
                    fetchCheques();
                    mostrarAlerta("Cheque modificado correctamente", "success"); 
                })
                .catch(error => console.log("Error al actualizar Cheque:", error));
            } else {
            fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(ChequeData) 
            })
            .then(response => {
                if (!response.ok) {  // Si la respuesta no fue satisfactoria
                    throw new Error("Error al agregar el Cheque");
                }
                return response.json();
            })
            .then(data => {
                // Si el producto pudo ser agregado
                resetForm();
                fetchCheques();
                mostrarAlerta("Cheque agregado correctamente", "success"); 
            })
            .catch(error => {
                // Si el producto no pudo ser agregado
                mostrarAlerta("Error al agregar el Cheque", "danger"); 
            });
            }

    }

});

async function validarNumero(){
    
    // Validacion de Numero de Cheque
    let chequeBanco = document.getElementById("bancoFiltro").value
    let chequeNumero = document.getElementById("numero").value

    const response = await fetch(`${apiUrl}/validarnumero?banco=${chequeBanco}&numero=${chequeNumero}`)
    return response.json()

}

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
    toast.style.width = "550px"; // Aumenta el ancho

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