const { Cheque, Banco } = require("../models");
const { Op } = require("sequelize");
const moment = require("moment-timezone");

class ChequeManager {
  async crearCheque(banco, numero, emision, vencimiento, importe, nombre, conciliado, fechaconciliacion) {

     return await Cheque.create({ banco, numero, emision, vencimiento, importe, nombre, conciliado, fechaconciliacion });
  }

  async modificarCheque(id, data) {
    try {
          
        const [filasActualizadas] = await Cheque.update(data, {
            where: { id: id }
        });

        if (filasActualizadas === 0) {
            console.log("No se encontró el cheque.");
            return null;
        }

        console.log("Cheque actualizado correctamente.");
        return true;
    } catch (error) {
        console.error("Error al actualizar el cheque:", error);
        return false;
    }
  }

  async obtenerCheques(query) {

    const { banco, fechaEmisionDesde, fechaEmisionHasta, fechaVencimientoDesde, fechaVencimientoHasta, conciliado, nombre, importeDesde, importeHasta } = query;

    const filtros = {};
  
    if (banco) filtros.banco = banco;
    if (nombre) {
        filtros.nombre = { [Op.like]: `%${nombre}%` };
    }
    
    if (conciliado && conciliado !== "1") {
        filtros.conciliado = conciliado === "2";  // "2" → true, "3" → false
    }

    if (fechaEmisionDesde || fechaEmisionHasta) {
        filtros.emision = {
            [Op.between]: [fechaEmisionDesde, fechaEmisionHasta]
        };
    }
    if (fechaVencimientoDesde || fechaVencimientoHasta) {
      filtros.vencimiento = {
          [Op.between]: [fechaVencimientoDesde, fechaVencimientoHasta]
      };
  }
    if (importeDesde || importeHasta) {
        filtros.importe = {
            [Op.between]: [importeDesde, importeHasta]
        };
    }
  
    const cheques = await Cheque.findAll({
        where: filtros,
        include: [{ model: Banco, attributes: ["nombre"] }]
    });


    // const cheque = await Cheque.findOne();
    // console.log("Fecha cruda de Sequelize:", cheque.emision);
    // console.log("Fecha con JSON:", cheque.toJSON().emision);
    // console.log("Fecha convertida a string:", cheque.emision.toString());
    // console.log("Fecha con toISOString:", cheque.emision.toISOString());

    // Ajustar la fecha al huso horario deseado
    return cheques.map(cheque => ({
        ...cheque.toJSON(),
        emision: moment(cheque.emision).tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD"),
        vencimiento: moment(cheque.vencimiento).tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD"),
    }));

  }

  async obtenerChequePorId(id) {
    return await Cheque.findByPk(id);
  }

  async eliminarChequePorId(id) {
    try {
        const resultado = await Cheque.destroy({
            where: { id: id }
        });

        if (resultado === 0) {
            console.log("No se encontró el cheque con ID:", id);
        } else {
            console.log("Cheque eliminado con éxito.");
        }
    } catch (error) {
        console.error("Error al eliminar el cheque:", error);
    }
}

}

module.exports = new ChequeManager();
