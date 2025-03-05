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

async function validarNumeroChequera(req, res) {
  const { banco, numero } = req.query
  const result = await ChequeManager.validarNumeroChequera(banco, numero);

  if (result.sucess){
    res.status(200).json(result);
  }
  else {
    res.status(200).json(result);
  }

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
        { header: "Banco", key: "banco", width: 40 },
        { header: "Nombre", key: "nombre", width: 60 },
        { header: "Fecha Emisión", key: "emision", width: 15 },
        { header: "Fecha Vencimiento", key: "vencimiento", width: 15 },
        { header: "Importe", key: "importe", width: 15 },
        { header: "Fecha Conciliacion", key: "fechaconciliacion", width: 15 },
    ];

    // Agregar los datos
    cheques.forEach(cheque => {
        worksheet.addRow({
            id: cheque.id,
            banco: cheque.Banco.nombre,
            nombre: cheque.nombre,
            emision: new Date(cheque.emision), // Formato YYYY-MM-DD
            vencimiento: new Date(cheque.vencimiento),
            importe: Number(cheque.importe.toFixed(2)), // Formatear importe con 2 decimales
            fechaconciliacion: cheque.conciliado === true ? new Date(cheque.fechaconciliacion) : ""
        });
    });

    // Configurar formato
    worksheet.getRow(1).font = { bold: true };

    // Obtener la última fila con datos
    const lastRow = worksheet.rowCount;

    // Insertar una fila con la suma en la columna "Edad" (columna D)
    worksheet.getCell(`F${lastRow + 1}`).value = { formula: `SUM(F2:F${lastRow})` };
    // Poner en negrita el total
    worksheet.getRow(lastRow + 1).font = { bold: true };
    // Agregar la palabra Total a la izquierda de la suma
    worksheet.getCell(`E${lastRow + 1}`).value = "Total : ";
    // Aplicar formato a la columna de importes
    worksheet.getColumn(6).numFmt = '"$"#,##0.00';
   
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

module.exports = {  crearCheque, obtenerCheques, obtenerChequePorId, eliminarChequePorId, 
                    modificarCheque, exportarCheques, validarNumeroChequera};
