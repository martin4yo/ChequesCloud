import { obtenerConfig, formatearFecha, formatearImporte, mostrarAlerta } from "./utils.js";

    const apiUrl = await obtenerConfig()

    let Chequeras = [];
    let currentPage = 1;
    const rowsPerPage = 10;

    //********************************************************************************
    // Cargar bancos 
    document.addEventListener("DOMContentLoaded", async () => {
        await cargarBancos();
    });

    async function fetchChequeras() {
        try {

            await cargarBancos();

            const response = await fetch(`${apiUrl}/api/chequeras`);
            if (!response.ok) throw new Error("Error al recuperar los datos.");
            Chequeras = await response.json();
            renderTable();
        } catch (error) {
            document.getElementById("tablaChequeras").innerHTML = `<tr><td colspan="2" class="text-danger">Error al cargar datos</td></tr>`;
            console.error("Error:", error);
        }
    }

    function renderTable() {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const ChequerasPaginados = Chequeras.slice(start, end);

        const tabla = document.getElementById("tablaChequeras");
        tabla.innerHTML = ChequerasPaginados.map(Chequera => `
            <tr>
                <td class="w-100 align-middle">${Chequera.Banco.nombre}</td>
                <td class="align-middle">${Chequera.codigo}</td>
                <td class="w-100 align-middle">${Chequera.numdesde}</td>
                <td class="w-100 align-middle">${Chequera.numhasta}</td>
                <td class="toggle-switch align-middle">
                        <input type="checkbox" class="form-check-input" disabled 
                            ${Chequera.habilitada ? "checked" : ""}>
                </td>
                <td>
                    <div class="d-flex gap-2">
                            <button class="btn btn-warning box-shd" data-bs-toggle="tooltip" data-bs-placement="top" title="Editar Chequera" data-id="${Chequera.id}">
                                    <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn btn-danger box-shd" data-bs-toggle="tooltip" data-bs-placement="top" title="Eliminar Chequera" data-id="${Chequera.id}" data-nombre="'${Chequera.Banco.nombre}'">
                                    <i class="fa-solid fa-trash"></i>
                            </button>
                    </div>
                </td>
            </tr>
        `).join("");

         // Agregar eventos después de insertar el HTML
         document.querySelectorAll(".btn-warning").forEach((boton) => {
            boton.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                const id = this.getAttribute("data-id");
                editarChequera(id);
            });
        });

        document.querySelectorAll(".btn-danger").forEach((boton) => {
            boton.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                const id = this.getAttribute("data-id");
                const nombre = this.getAttribute("data-nombre");
                deleteChequera(id, nombre);
            });
        });

        document.getElementById("currentPage").textContent = currentPage;
        document.getElementById("prevPage").parentElement.classList.toggle("disabled", currentPage === 1);
        document.getElementById("nextPage").parentElement.classList.toggle("disabled", end >= Chequeras.length);
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
        if (currentPage * rowsPerPage < Chequeras.length) {
            currentPage++;
            renderTable();
        }
    });

    fetchChequeras();


// Función para cargar la lista de bancos desde la API
async function cargarBancos() {
    try {
        const response = await fetch(`${apiUrl}/api/bancos`);
        const bancos = await response.json();
        const bancoSelect = document.getElementById("banco");

        bancos.forEach(banco => {
            const option = document.createElement("option");
            option.value = banco.id;
            option.textContent = banco.nombre;
            bancoSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar los bancos:", error);
    }
}


function resetForm(){
    document.getElementById("idChequera").value = "";
    document.getElementById("banco").value = "";
    document.getElementById("codigo").value = "";
    document.getElementById("numdesde").value = "";
    document.getElementById("numhasta").value = "";
    document.getElementById("habilitada").checked = false;
}

document.getElementById("btnNuevo").addEventListener("click", function() {
    resetForm();
    document.getElementById("banco").focus();
});

function editarChequera(id) {
    fetch(`${apiUrl}/api/chequeras/${id}`)
        .then(response => response.json())
        .then(Chequera => {
            document.getElementById("idChequera").value = Chequera.id;
            document.getElementById("banco").value = Chequera.banco;
            document.getElementById("codigo").value = Chequera.codigo;
            document.getElementById("numdesde").value = Chequera.numdesde;
            document.getElementById("numhasta").value = Chequera.numhasta;
            document.getElementById("habilitada").checked = Chequera.habilitada;
            document.getElementById("banco").focus();
        })
        .catch(error => console.error("Error al obtener Chequera:", error));
}

// Confirmacion de Delete de BOOTSTRAP 

let itemIdToDelete = null;
let pTitleToDelete = null;

function deleteChequera(itemId, pTitle) {
    itemIdToDelete = itemId;
    pTitleToDelete = document.getElementById('pTitleToDelete');
    pTitleToDelete.innerHTML = `Elimina chequera del banco ${pTitle}?` 
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    deleteModal.show();
}

document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
    if (itemIdToDelete !== null) {
          fetch(`${apiUrl}/api/chequeras/${itemIdToDelete}/`, {  //Llamo a la API con el metodo para eliminar
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            if (!response.ok) {         //Verifico si la respuesta no fue satisfactoria
                throw new Error("Error al eliminar la chequera");
            }
            return response.json(); 
        })
        .then(data => {
            // El producto pudo ser eliminado
            mostrarAlerta("Chequera eliminada correctamente", "success"); 
        })
        .catch(error => {
            // Hubo algun error en el proceso
            console.error("Error:", error);
            mostrarAlerta("Se produjo un error al eliminar la Chequera", "danger"); 
        });
    }
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    deleteModal.hide();
    fetchChequeras();
});

//Enviar los datos para el ALTA del Chequera **************

document.getElementById("chequeraForm").addEventListener("submit", function(event) {
    event.preventDefault(); 
    event.stopPropagation();

    let form = event.target;
    
    // Validación general de Bootstrap
    if (form.checkValidity()) {
        // Recupero los datos del formulario para enviar a la API con el POST
        const idChequera = document.getElementById("idChequera").value;

        const ChequeraData = {
            banco: document.getElementById("banco").value,
            codigo: document.getElementById("codigo").value,
            numdesde: document.getElementById("numdesde").value,
            numhasta: document.getElementById("numhasta").value,
            habilitada: document.getElementById("habilitada").checked
        };
        // URL de la API

        // Configuración del POST
        if (idChequera) {
                // Editar Chequera existente
                fetch(`${apiUrl}/api/chequeras/${idChequera}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(ChequeraData)
                })
                .then(response => {
                    if (!response.ok) {  // Si la respuesta no fue satisfactoria
                        throw new Error("Error al modificar la Chequera");
                    }
                    return response.json();
                })
                .then(() => {
                    resetForm();
                    fetchChequeras();
                    mostrarAlerta("Chequera modificada correctamente", "success"); 
                })
                .catch(error => console.log("Error al actualizar Chequera:", error));
            } else {
            fetch(`${apiUrl}/api/chequeras`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(ChequeraData) 
            })
            .then(response => {
                if (!response.ok) {  // Si la respuesta no fue satisfactoria
                    throw new Error("Error al agregar la Chequera");
                }
                return response.json();
            })
            .then(data => {
                // Si el producto pudo ser agregado
                resetForm();
                fetchChequeras();
                mostrarAlerta("Chequera agregada correctamente", "success"); 
            })
            .catch(error => {
                // Si el producto no pudo ser agregado
                mostrarAlerta("Error al agregar la Chequera", "danger"); 
            });
            }

    }

});


