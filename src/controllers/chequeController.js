const ChequeManager = require("../managers/chequeManager");
const ExcelJS = require("exceljs");
const moment = require('moment');

async function crearCheque(req, res) {
  const { banco, numero, emision, vencimiento, importe, nombre, conciliado, fechaconciliacion } = req.body;
  const Cheque = await ChequeManager.crearCheque(banco, numero, emision, vencimiento, importe, nombre, conciliado, fechaconciliacion);
  res.json(Cheque);
}

async function modificarCheque(req, res) {
  const { id } = req.params;
  const datosCheque = JSON.parse(JSON.stringify(req.body));
  try {
    const result = await ChequeManager.modificarCheque(id, datosCheque)
    if (result.success){
      res.json(result).status(200);
    }
    else {
      res.json(result).status(400);
    }

  }
  catch (error) {
    res.json(error).status(400);
  }

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

async function conciliarCheque(req, res) {
  const { id } = req.params
  const result = await ChequeManager.conciliarCheque(id);
  if (result.sucess){
    res.status(200).json(result);
  }
  else {
    res.status(200).json(result);
  }
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

    const data = await ChequeManager.obtenerCheques(req.query, false)
    const cheques = data.cheques;

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Cheques");

    // Definir las columnas del Excel
    worksheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Banco", key: "banco", width: 40 },
        { header: "Numero", key: "numero", width: 40 },
        { header: "Nombre", key: "nombre", width: 60 },
        { header: "Fecha Emisión", key: "emision", width: 15 },
        { header: "Fecha Vencimiento", key: "vencimiento", width: 15 },
        { header: "Importe", key: "importe", width: 15 },
        { header: "Fecha Conciliacion", key: "fechaconciliacion", width: 15 },
    ];

    let currentVencimiento = null;
    let startRowVencimiento = 2;
    let rowNumber = 1;
    let dynamicData = [
      ['Banco', 'Vencimiento', 'Importe']
    ];

    // Agregar los datos
    cheques.forEach(cheque => {

        //Validar si es la primer fila
        if (currentVencimiento === null){
          currentVencimiento = moment(
                new Date(cheque.vencimiento)
                .toISOString()
                .split("T")[0]
                )
                .format("DD/MM/YYYY")
                .split("-")
                .reverse()
                .join("/")
        }

        rowNumber += 1;

        // Valido corte de control
        if (currentVencimiento !==  moment(
                                    new Date(cheque.vencimiento)
                                    .toISOString()
                                    .split("T")[0]
                                    )
                                    .format("DD/MM/YYYY")
                                    .split("-")
                                    .reverse()
                                    .join("/")){
                          const subtotalRow = worksheet.addRow({
                          vencimiento: `${currentVencimiento}`,
                          importe: { formula: `SUM(G${startRowVencimiento}:G${rowNumber - 1})` } // SUMA total de la categoría
                          });

                          // Estilo para diferenciar subtotales
                          subtotalRow.font = { bold: true };
                          subtotalRow.getCell(5).border = {
                          top: { style: 'thin' },
                          bottom: { style: 'double' }
                          };

                          currentVencimiento =  moment(
                                  new Date(cheque.vencimiento)
                                  .toISOString()
                                  .split("T")[0]
                                  )
                                  .format("DD/MM/YYYY")
                                  .split("-")
                                  .reverse()
                                  .join("/");

                          rowNumber += 1;
                          startRowVencimiento = rowNumber;

                          }

        worksheet.addRow({
            id: cheque.id,
            banco: cheque.Banco.nombre,
            numero: cheque.numero,
            nombre: cheque.nombre,
            emision: new Date(cheque.emision), // Formato YYYY-MM-DD
            vencimiento: new Date(cheque.vencimiento),
            importe: Number(cheque.importe.toFixed(2)), // Formatear importe con 2 decimales
            fechaconciliacion: cheque.conciliado === true ? new Date(cheque.fechaconciliacion) : ""
        });

        dynamicData.push(
          [cheque.Banco.nombre, moment(
                                new Date(cheque.vencimiento)
                                .toISOString()
                                .split("T")[0]
                                )
                                .format("DD/MM/YYYY")
                                .split("-")
                                .reverse()
                                .join("/")
                                , cheque.importe]
                        )
        //Crea datos para la tabla dinamica

    });

    // Configurar formato
    worksheet.getRow(1).font = { bold: true };

    // Obtener la última fila con datos
    const lastRow = worksheet.rowCount;

    // Insertar una fila con la suma en la columna "Edad" (columna D)
    worksheet.getCell(`G${lastRow + 1}`).value = { formula: `SUM(G2:G${lastRow})` };
    // Poner en negrita el total
    worksheet.getRow(lastRow + 1).font = { bold: true };
    // Agregar la palabra Total a la izquierda de la suma
    worksheet.getCell(`F${lastRow + 1}`).value = "Total : ";
    // Aplicar formato a la columna de importes
    worksheet.getColumn(7).numFmt = '#,##0.00';

    // Crear tabla para tabla dinamica de CashFlos *************************************
    const dynamicTable = workbook.addWorksheet('CashFlow');
    const cashFlow = await ChequeManager.obtenerCashFlow(req.query)
console.log(cashFlow);
    // Obtener dinámicamente las claves del primer objeto para usarlas como encabezados
     const headers = Object.keys(cashFlow[0]);

     // Definir las columnas usando las claves del JSON
     dynamicTable.columns = headers.map(header => ({
         header: header, // Nombre de la columna en el Excel
         key: header, // Clave para los datos
         width: 20 // Ancho de la columna
     }));
 
     // Agregar datos al archivo Excel
     cashFlow.forEach(row => {
      row.Vencimiento = moment.utc(row.Vencimiento).format("DD/MM/YYYY");
      dynamicTable.addRow(row);
     });

    // Estilizar el CashFlow 
    // Aplicar estilo de negrita a la primera fila (encabezados)
    dynamicTable.getRow(1).font = { bold: true };

    // Aplicar formato de moneda a las columnas desde la segunda en adelante
    dynamicTable.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Saltar la primera fila (encabezados)

        row.eachCell((cell, colNumber) => {
            if (colNumber > 1) { // Aplicar formato desde la segunda columna en adelante
                cell.numFmt = '[Black]#,##0.00;[Red]-#,##0.00;;';
            }
        });
    });

    // Definir el rango para los filtros: desde la celda A1 hasta la última columna de la cabecera
    const headerRange = `A1:${String.fromCharCode(65 + headers.length - 1)}1`;
    
    // Agregar filtro a las cabeceras
    dynamicTable.autoFilter = headerRange;
    
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
                    modificarCheque, exportarCheques, validarNumeroChequera, conciliarCheque};
