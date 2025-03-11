
    let Cheques = [];
    let currentPage = 1;
    let totalRows = 0;
    const rowsPerPage = 10;

    //********************************************************************************
    // Cargar bancos 
    document.addEventListener("DOMContentLoaded", async () => {
        document.getElementById('navbarNav').classList.remove('hidden');
        const loadingOverlay = document.getElementById("loadingOverlay");
        await cargarBancos();
    });

    async function fetchCheques() {
        try {

            // Mostrar spinner
            loadingOverlay.classList.remove("d-none");
            loadingOverlay.style.display = "flex";

            const apiUrl = await obtenerConfig()
            const filtros = crearFiltro()
            
            const params = new URLSearchParams(filtros).toString();  
            const response = await fetch(`${apiUrl}/api/cheques?page=${currentPage}&pageSize=${rowsPerPage}&${params}`);

            if (!response.ok) throw new Error("Error al recuperar los datos.");
            const data = await response.json();

            Cheques = data.cheques;
            totalRows = data.totalRegistros;

            renderTable();

            // Ocultar spinner
            loadingOverlay.classList.add("d-none");
            loadingOverlay.style.display = "none";

        } catch (error) {
            document.getElementById("tablaCheques").innerHTML = `<tr><td colspan="2" class="text-danger">Error al cargar datos</td></tr>`;
            console.error("Error:", error);
            loadingOverlay.innerHTML = `<div class="alert alert-danger" role="alert">
                                            Error al cargar los datos
                                        </div>`;
        }
    }

    function renderTable() {

        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        const tabla = document.getElementById("tablaCheques");
        tabla.innerHTML = Cheques.map(Cheque => `
            <tr>
                <td class="align-middle">${Cheque.Banco.nombre}</td>
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
                            <button class="btn btn-success box-shd" data-bs-toggle="tooltip" data-bs-placement="top" title="Conciliado!" onclick="conciliarCheque(${Cheque.id})" ${Cheque.conciliado ? "disabled" : "enabled"}>
                                    <i class="fa-solid fa-check"></i>
                            </button>
                            <button class="btn btn-warning box-shd" data-bs-toggle="tooltip" data-bs-placement="top" title="Editar Cheque" onclick="editarCheque(${Cheque.id})">
                                    <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn btn-danger box-shd" data-bs-toggle="tooltip" data-bs-placement="top" title="Eliminar Cheque" onclick="deleteCheque(${Cheque.id}, ${Cheque.numero})">
                                    <i class="fa-solid fa-trash"></i>
                            </button>
                    </div>
                </td>
            </tr>
        `).join("");

        document.getElementById("currentPage").textContent = currentPage;
        document.getElementById("prevPage").parentElement.classList.toggle("disabled", currentPage === 1);
        document.getElementById("nextPage").parentElement.classList.toggle("disabled", end >= totalRows);
    }

    document.getElementById("prevPage").addEventListener("click", function(event) {
        event.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            fetchCheques();
        }
    });

    document.getElementById("conciliado").addEventListener("click", function(event) {
  
        if (this.checked){
            const hoy = new Date().toISOString().split("T")[0];
            document.getElementById("fechaconciliacion").value = hoy;
        }
        else {
            document.getElementById("fechaconciliacion").value = null;
        }

        if (currentPage > 1) {
            fetchCheques();
        }

    });

    document.getElementById("nextPage").addEventListener("click", function(event) {
        event.preventDefault();

        if (currentPage * rowsPerPage < totalRows) {
            currentPage++;
            fetchCheques();
        }
    });

    fetchCheques();

//* Crear Objeto Filtros

function crearFiltro(){
    return {
        banco: document.getElementById("bancoFiltro").value,
        habilitado: document.getElementById("bancoHabilitado").checked,
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


// Función para cargar la lista de bancos desde la API
async function cargarBancos() {
    try {

        const apiUrl = await obtenerConfig()

        const response = await fetch(`${apiUrl}/api/bancos`);
        const bancos = await response.json();
        
        const bancoFiltro = document.getElementById("bancoFiltro");
        bancoFiltro.innerHTML = "";

        const bancoHabilitado = document.getElementById("bancoHabilitado").checked;

        //Primer registro 
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Seleccione un banco";
        bancoFiltro.appendChild(option);

        bancos.forEach(banco => {
            if (banco.habilitado || !bancoHabilitado){
                const option = document.createElement("option");
                option.value = banco.id;
                option.textContent = banco.nombre;
                bancoFiltro.appendChild(option);
            }
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
    currentPage = 1;
    fetchCheques();
});

//** Aplicacion del Filtro */
document.getElementById("bancoHabilitado").addEventListener("click", async function(event) {
    await cargarBancos();
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
document.getElementById("btnExportar").addEventListener("click", async function(event) {
    event.preventDefault();

    // Mostrar spinner
    loadingOverlay.classList.remove("d-none");
    loadingOverlay.style.display = "flex";
     
    try {

        //** Pasar pasametros */
        const filtros = crearFiltro();    
        const params = new URLSearchParams(filtros).toString();  

        const response = await fetch(`/exportar?${params}`);
        if (!response.ok) throw new Error("Error al generar el archivo");

        const blob = await response.blob(); // Convertir la respuesta a un Blob
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Cheques.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        
        // Ocultar spinner
        loadingOverlay.classList.add("d-none");
        loadingOverlay.style.display = "none";

    }
    
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

// Confirmacion de Delete de BOOTSTRAP 

let itemIdToDelete = null;
let pTitleToDelete = null;

async function editarCheque(id) {

    const apiUrl = await obtenerConfig()

    fetch(`${apiUrl}/api/cheques/${id}`)
        .then(response => response.json())
        .then(Cheque => {

            document.getElementById("idCheque").value = Cheque.id;
            document.getElementById("bancoFiltro").value = Cheque.banco;
            document.getElementById("numero").value = Cheque.numero;
            document.getElementById("emision").value = new Date(Cheque.emision).toISOString().split("T")[0];
            document.getElementById("vencimiento").value = new Date(Cheque.vencimiento).toISOString().split("T")[0];
            document.getElementById("nombre").value = Cheque.nombre;
            document.getElementById("importe").value = Cheque.importe;
            document.getElementById("conciliado").checked = Cheque.conciliado;
            document.getElementById("fechaconciliacion").value = Cheque.conciliado ? new Date(Cheque.fechaconciliacion).toISOString().split("T")[0] : null;
            document.getElementById("numero").focus();
        })
        .catch(error => console.error("Error al obtener Cheque:", error));
}

async function conciliarCheque(id) {

    const apiUrl = await obtenerConfig()

    fetch(`${apiUrl}/api/cheques/conciliar/${id}` , {  //Llamo a la API con el metodo para actaulizar
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }
        )  
        .then(response => {
            if (!response.ok) {  // Si la respuesta no fue satisfactoria
                throw new Error("Error al conciliar el Cheque");
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                fetchCheques();
            }
        })
        .catch(error => console.error("Error al obtener Cheque:", error));

}

function deleteCheque(itemId, pTitle) {
    itemIdToDelete = itemId;
    pTitleToDelete = document.getElementById('pTitleToDelete');
    pTitleToDelete.innerHTML = `Elimina cheque numero ${pTitle}?` 
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    deleteModal.show();
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async function () {

    const apiUrl = await obtenerConfig()
    
    if (itemIdToDelete !== null) {
          fetch(`${apiUrl}/api/cheques/${itemIdToDelete}/`, {  //Llamo a la API con el metodo para eliminar
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


//Agrega evento de input para limpiar los errores posibles de las fechas
document.getElementById("emision").addEventListener('input', function() {
    document.getElementById("vencimiento").setCustomValidity('');  // Limpiar el error si el usuario corrige el dato
  });

//Agrega evento de input para limpiar los errores posibles de las fechas
document.getElementById("vencimiento").addEventListener('input', function() {
    document.getElementById("vencimiento").setCustomValidity('');  // Limpiar el error si el usuario corrige el dato
    document.getElementById("fechaconciliacion").setCustomValidity('');  // Limpiar el error si el usuario corrige el dato
  });

document.getElementById("fechaconciliacion").addEventListener('input', function() {
    document.getElementById("fechaconciliacion").setCustomValidity('');  // Limpiar el error si el usuario corrige el dato
    document.getElementById("vencimiento").setCustomValidity('');  // Limpiar el error si el usuario corrige el dato
  });
  
//Enviar los datos para el ALTA del Cheque **************
document.getElementById("chequeForm").addEventListener("submit", async function(event) {
    event.preventDefault(); 
    event.stopPropagation();

    let form = event.target;
  
    // Validación de banco
    if (document.getElementById("bancoFiltro").value === ""){
        mostrarAlerta("Debe seleccionar un banco en los filtros", "danger");
        return null;
    }

    // Validacion del numero de cheque
    const result = await validarNumero()

    if (!result.success) {
        mostrarAlerta(result.message, "danger"); 
        return result;
    }

    // Validacion de FECHAS 
    let emision = document.getElementById("emision");
    let vencimiento = document.getElementById("vencimiento");
    let fechaconciliacion = document.getElementById("fechaconciliacion");

    let fechaE = moment.utc(emision.value);
    let fechaV = moment.utc(vencimiento.value);
    let fechaC = moment.utc(fechaconciliacion.value);

    // Validar si "Fecha Hasta" es menor que "Fecha Desde"
    vencimiento.setCustomValidity(''); // Borra el mensaje de error si es válido
    if (fechaV < fechaE) {
        vencimiento.setCustomValidity("La fecha de Vencimiento debe ser mayor a la de Emision.");
    } 

    // Validar si "Fecha Conciliacion" es menor que "Vencimiento"
    fechaconciliacion.setCustomValidity(''); // Borra el mensaje de error si es válido
    if (fechaC > fechaV) {
        fechaconciliacion.setCustomValidity("La fecha de Conciliacion debe ser mayor a la de vencimiento.");
    } 

    if (!this.checkValidity()){
        vencimiento.reportValidity();
        if (document.getElementById("conciliado").checked){
            fechaconciliacion.reportValidity();
        }
    }

    // if (!this.checkValidity()) {
    //     this.classList.add("was-validated"); // Acti
    // }

    // Obtiene la URL de la API 
    const apiUrl = await obtenerConfig()

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
            fechaconciliacion: document.getElementById("conciliado").checked ? document.getElementById("fechaconciliacion").value : null 
        };
        

        // Configuración del POST
        if (idCheque) {
                // Editar Cheque existente
                
                fetch(`${apiUrl}/api/cheques/${idCheque}`, {
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
                .then(data => {
                    mostrarAlerta(data.message, data.success ? "success" : "danger"); 
                    if (data.success) {
                        resetForm();
                        fetchCheques();
                    }
                })
                .catch(error => console.log("Error al actualizar Cheque:", error));
            } else {
            fetch(`${apiUrl}/api/cheques`, {
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

    const apiUrl = await obtenerConfig()

    // Validacion de Numero de Cheque
    let chequeBanco = document.getElementById("bancoFiltro").value
    let chequeNumero = document.getElementById("numero").value

    const response = await fetch(`${apiUrl}/api/cheques/validarnumero?banco=${chequeBanco}&numero=${chequeNumero}`)
    return response.json()

}



 