// PAGINADO DE TABLA 

const apiUrl = "http://localhost:8080/api/bancos";
    let bancos = [];
    let currentPage = 1;
    const rowsPerPage = 10;

    async function fetchBancos() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("Error al recuperar los datos.");
            bancos = await response.json();
            renderTable();
        } catch (error) {
            document.getElementById("tablaBancos").innerHTML = `<tr><td colspan="2" class="text-danger">Error al cargar datos</td></tr>`;
            console.error("Error:", error);
        }
    }

    function renderTable() {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const bancosPaginados = bancos.slice(start, end);

        const tabla = document.getElementById("tablaBancos");
        tabla.innerHTML = bancosPaginados.map(banco => `
            <tr>
                <td>${banco.codigo}</td>
                <td class="w-100">${banco.nombre}</td>
                <td>
                    <div class="d-flex gap-2">
                            <button class="btn btn-warning" data-bs-toggle="tooltip" data-bs-placement="top" title="Editar Banco" onclick="editarBanco(${banco.id})">
                                    <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn btn-danger" data-bs-toggle="tooltip" data-bs-placement="top" title="Eliminar Banco" onclick="deleteBanco(${banco.id}, '${banco.nombre}')">
                                    <i class="fa-solid fa-trash"></i>
                            </button>
                    </div>
                </td>
            </tr>
        `).join("");

        document.getElementById("currentPage").textContent = currentPage;
        document.getElementById("prevPage").parentElement.classList.toggle("disabled", currentPage === 1);
        document.getElementById("nextPage").parentElement.classList.toggle("disabled", end >= bancos.length);
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
        if (currentPage * rowsPerPage < bancos.length) {
            currentPage++;
            renderTable();
        }
    });

    fetchBancos();

//********************************************************************************

// document.getElementById("bancoForm").addEventListener("submit", function(event) {
//     event.preventDefault();
//     alert("Banco guardado correctamente");
// });

document.getElementById("btnNuevo").addEventListener("click", function() {
    document.getElementById("codigoBanco").value = "";
    document.getElementById("nombreBanco").value = "";
    document.getElementById("codigoBanco").focus();
});

function editarBanco(id) {
    fetch(`${apiUrl}/${id}`)
        .then(response => response.json())
        .then(banco => {
            document.getElementById("idBanco").value = banco.id;
            document.getElementById("codigoBanco").value = banco.codigo;
            document.getElementById("nombreBanco").value = banco.nombre;
            document.getElementById("codigoBanco").focus();
        })
        .catch(error => console.error("Error al obtener banco:", error));
}

// Confirmacion de Delete de BOOTSTRAP 

let itemIdToDelete = null;
let pTitleToDelete = null;

function deleteBanco(itemId, pTitle) {
    itemIdToDelete = itemId;
    pTitleToDelete = document.getElementById('pTitleToDelete');
    pTitleToDelete.innerHTML = `Elimina ${pTitle}?` 
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    deleteModal.show();
}

document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
    if (itemIdToDelete !== null) {
          fetch(`http://localhost:8080/api/bancos/${itemIdToDelete}/`, {  //Llamo a la API con el metodo para eliminar
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            if (!response.ok) {         //Verifico si la respuesta no fue satisfactoria
                throw new Error("Error al eliminar el producto");
            }
            return response.json(); 
        })
        .then(data => {
            // El producto pudo ser eliminado
            mostrarAlerta("Banco eliminado correctamente", "success"); 
        })
        .catch(error => {
            // Hubo algun error en el proceso
            console.error("Error:", error);
            mostrarAlerta("Se produjo un error al eliminar el banco", "danger"); 
        });
    }
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    deleteModal.hide();
    fetchBancos();
});

//Enviar los datos para el ALTA del banco **************

document.getElementById("bancoForm").addEventListener("submit", function(event) {
  event.preventDefault(); 

  // Recupero los datos del formulario para enviar a la API con el POST
  const idBanco = document.getElementById("idBanco").value;
  const bancoData = {
      codigo: document.getElementById("codigoBanco").value,
      nombre: document.getElementById("nombreBanco").value
  };

  // URL de la API
  const apiUrl = "http://localhost:8080/api/bancos"; 

  // Configuración del POST
  if (idBanco) {
        // Editar banco existente
        fetch(`${apiUrl}/${idBanco}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bancoData)
        })
        .then((data) => {
            document.getElementById("bancoForm").reset();
            document.getElementById("idBanco").value = "";
            fetchBancos();
            mostrarAlerta("Banco modificado correctamente", "success"); 
        })
        .catch(error => console.error("Error al actualizar banco:", error));
    } else {
    fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(bancoData) 
    })
    .then(response => {
        if (!response.ok) {  // Si la respuesta no fue satisfactoria
            throw new Error("Error al agregar el banco");
        }
        return response.json();
    })
    .then(data => {
        // Si el producto pudo ser agregado
        mostrarAlerta("Banco agregado correctamente", "success"); 
        fetchBancos();
        document.getElementById("bancoForm").reset(); 
    })
    .catch(error => {
        // Si el producto no pudo ser agregado
        mostrarAlerta("Error al agregar el banco", "danger"); 
    });
    }

});

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