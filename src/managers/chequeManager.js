const { Cheque, Banco, Chequera } = require("../models");
const { Op } = require("sequelize");
const moment = require("moment-timezone");

class ChequeManager {
  async crearCheque(banco, numero, emision, vencimiento, importe, nombre, conciliado, fechaconciliacion) {

    //  emision = ajusteFecha(emision);
    //  vencimiento = ajusteFecha(vencimiento);
    //  if (conciliado){
    //     fechaconciliacion = ajusteFecha(fechaconciliacion);
    //  }
    
     console.log("emision", emision)
     return await Cheque.create({ banco, numero, emision, vencimiento, importe, nombre, conciliado, fechaconciliacion });
  }

  async modificarCheque(id, data) {
    try {
 
      // data.emision = ajusteFecha(data.emision);
      // data.vencimiento = ajusteFecha(data.vencimiento);
      // if (data.conciliado){
      //    data.fechaconciliacion = ajusteFecha(data.fechaconciliacion);
      // }

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

    const filtros = {};

    const { banco, fechaEmisionDesde, fechaEmisionHasta, fechaVencimientoDesde, fechaVencimientoHasta, conciliado, nombre, importeDesde, importeHasta } = query;

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

    // Ajustar la fecha al huso horario deseado
    return cheques.map(cheque => ({
        ...cheque.toJSON(),
        emision: moment(cheque.emision).tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD"),
        vencimiento: moment(cheque.vencimiento).tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD"),
    }));

  }

  async obtenerChequePorId(id) {

    const data = await Cheque.findByPk(id);

    data.dataValues.emision = ajusteFecha(data.dataValues.emision);
    data.dataValues.vencimiento = ajusteFecha(data.dataValues.vencimiento);
    if (data.dataValues.conciliado){
       data.dataValues.fechaconciliacion = ajusteFecha(data.dataValues.fechaconciliacion);
    }

    return data
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

async validarNumeroChequera(banco, numero) {

    let result = {}

    try {
      
      // Buscar el numero por si esta repetido
      const cheque = await Cheque.findOne({
        where: {
          banco : banco,
          numero: numero,                            
        },
      });

console.log("Cheque", cheque) 
      
      if (cheque) {
        console.log("El número ya se encuentra registrado en ese banco.");
        result = {success : false, message : "El número ya se encuentra registrado en ese banco."} ; // El número pertenece a una chequera válida
      } else {
        console.log("El número no esta registrado.");
        result =  {success : true, message : "El numero no esta registrado"}; // El número no pertenece a ninguna chequera válida
      }

     // Buscar una chequera que tenga el número dentro del rango y habilitada sea true
     const chequera = await Chequera.findOne({
      where: {
        banco : banco,
        numdesde: { [Op.lte]: numero }, // numerodesde <= numero
        numhasta: { [Op.gte]: numero },  // numerohasta >= numero
        habilitada: true,                             // habilitada debe ser true
      },
    });

    if (chequera) {
      console.log("El número pertenece a una chequera habilitada.");
      result = {success : true, message : "El numero corresponde a una chequera habilitada"} ; // El número pertenece a una chequera válida
    } else {
      console.log("El número no pertenece a ninguna chequera habilitada.");
      result =  {success : false, message : "El numero NO corresponde a una chequera habilitada"}; // El número no pertenece a ninguna chequera válida
    }
  } catch (error) {
    console.error("Error al validar el número de chequera:", error);
    throw error;
  }
  
  return result;

}

}

// Función para formatear fecha a dd/MM/yyyy
function ajusteFecha(fecha) {
  //fecha.setDate(fecha.getDate() + 1); // Suma un día
  let fechaLocal = new Date(fecha);
  fechaLocal.setDate(fechaLocal.getDate() + 1);
  return fechaLocal.toISOString().slice(0, 10); // Suma un día;
}

module.exports = new ChequeManager();
