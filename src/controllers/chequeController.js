const ChequeManager = require("../managers/chequeManager");
const ExcelJS = require("exceljs");

async function crearCheque(req, res) {
  const { banco, numero, emision, vencimiento, importe, nombre, conciliado, fechaconciliacion } = req.body;
  const Cheque = await ChequeManager.crearCheque(banco, numero, emision, vencimiento, importe, nombre, conciliado, fechaconciliacion);
  res.json(Cheque);
}

async function modificarCheque(req, res) {
  const { id } = req.params;
  const datosCheque = JSON.parse(JSON.stringify(req.body));
  const Cheque = await ChequeManager.modificarCheque(id, datosCheque)
  res.json(datosCheque);
}

async function obtenerCheques(req, res) {
  const Cheques = await ChequeManager.obtenerCheques(req.query);
  res.json(Cheques);
}

async function obtenerChequePorId(req, res) {
  const { id } = req.params
  const Cheques = await ChequeManager.obtenerChequePorId(id);
  res.json(Cheques);
}

async function eliminarChequePorId(req, res) {
  const { id } = req.params
  const Cheques = await ChequeManager.eliminarChequePorId(id);
  res.json({success:true, message : "Cheque eliminado correctamente"});
}

async function exportarCheques(req, res) {
  try {
    // Recuperar los datos desde Sequelize

    const cheques = await ChequeManager.obtenerCheques(req.query)

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Cheques");

    // Definir las columnas del Excel
    worksheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Banco", key: "banco", width: 20 },
        { header: "Nombre", key: "nombre", width: 20 },
        { header: "Fecha Emisión", key: "emision", width: 15 },
        { header: "Fecha Vencimiento", key: "vencimiento", width: 15 },
        { header: "Importe", key: "importe", width: 15 }
    ];

    // Agregar los datos
    cheques.forEach(cheque => {
        worksheet.addRow({
            id: cheque.id,
            banco: cheque.Banco.nombre,
            nombre: cheque.nombre,
            emision: cheque.emision, // Formato YYYY-MM-DD
            vencimiento: cheque.vencimiento,
            importe: cheque.importe.toFixed(2) // Formatear importe con 2 decimales
        });
    });

    // Configurar el tipo de respuesta
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
        "Content-Disposition",
        "attachment; filename=cheques.xlsx"
    );

    // Enviar el archivo Excel al cliente
    await workbook.xlsx.write(res);
    res.end();
} catch (error) {
    console.error("Error al exportar:", error);
    res.status(500).send("Error al generar el archivo Excel.");
}
};

module.exports = { crearCheque, obtenerCheques, obtenerChequePorId, eliminarChequePorId, modificarCheque, exportarCheques};
