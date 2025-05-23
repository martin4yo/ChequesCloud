const { Cheque, Banco, Chequera } = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require('../../config');
const moment = require("moment-timezone");

class ChequeManager {
  async crearCheque(banco, numero, emision, vencimiento, importe, nombre, conciliado, fechaconciliacion) {

    // emision = moment(emision).tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD");
    // vencimiento = moment(vencimiento).tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD");
    // if (conciliado){
    //      fechaconciliacion = moment(fechaconciliacion).tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD");
    //   }
    
     console.log("emision", emision)
     return await Cheque.create({ banco, numero, emision, vencimiento, importe, nombre, conciliado, fechaconciliacion });
  }

  async modificarCheque(id, data) {
    try {
 
        //Verificar si el cheque existe
        const filtros =  {  banco: data.banco, 
                            numero: data.numero, 
                            id : { [Op.ne]: id } 
                          }

        const cheque = await Cheque.findOne({
                                          where: filtros
                                          });        
        if (cheque){
          return {success:false, message: "Ese numero de cheque fue registrado"}
        }

        const [filasActualizadas] = await Cheque.update(data, {
            where: { id: id }
        });

        if (filasActualizadas === 0) {
            console.log("No se encontró el cheque.");
            return {success:false, message: "No se encontró el cheque."}
        }

        console.log("Cheque actualizado correctamente.");
        return {success:true, message: "Cheque modificado correctamente"}
    } catch (error) {
        console.error("Error al actualizar el cheque:", error);
        return {success:false, message: "Error al actualizar el cheque"}
    }
  }

  async conciliarCheque(id) {
    try {
 
        //Verificar si el cheque existe
        const filtros =  {  id : id  }

        const data = {
          fechaconciliacion : new Date(),
          conciliado : true
        }

        const [filasActualizadas] = await Cheque.update(data, {
            where: { id: id }
        });

        if (filasActualizadas === 0) {
            console.log("No se encontró el cheque.");
            return {success:false, message: "No se encontró el cheque."}
        }

        console.log("Cheque actualizado correctamente.");
        return {success:true, message: "Cheque conciliado correctamente"}
    } catch (error) {
        console.error("Error al actualizar el cheque:", error);
        return {success:false, message: "Error al conciliar el cheque"}
    }
  }

  async obtenerCheques(query, paged = true) {

    const filtros = {};

    const { page, pageSize, banco, habilitado, fechaEmisionDesde, fechaEmisionHasta, fechaVencimientoDesde, 
            fechaVencimientoHasta, conciliado, nombre, 
            importeDesde, importeHasta } = query;

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

    // Paginacion

    const offset = (parseInt(page) - 1) * parseInt(pageSize); // Calcula cuántos registros saltar

    // Habilitacion de bancos
    let filtroHabilitado 

    if (habilitado === "true"){
      filtroHabilitado = { habilitado: true }
    }
    
    const { count, rows } = await Cheque.findAndCountAll({
        where: filtros,
        include: [{ model: Banco, attributes: ["nombre", "habilitado"], where: filtroHabilitado }],
        limit: paged ? parseInt(pageSize) : 999999999 || 10,  // Límite de registros por página
        offset: offset ?? 0,   // Desde dónde comenzar
        order: [
          ['vencimiento', 'DESC'],  // Primero ordena por banco en orden ascendente
          ['importe', 'DESC'],  // Primero ordena por banco en orden ascendente
        ]
    });

    const resultado = { totalRegistros: count,
                          totalPaginas: Math.ceil(count / parseInt(pageSize) || 10),
                          paginaActual: parseInt(page) || 1,
                          cheques: rows,
                      }

    return resultado;
    
    //cheques;

  }

  async obtenerCashFlow(query) {

      const { fechaVencimientoDesde, fechaVencimientoHasta } = query;
      const fdesde = fechaVencimientoDesde;
      const fhasta = fechaVencimientoHasta;

      const resultado = await sequelize.query("EXEC CashFlow :fdesde, :fhasta", {
          replacements: { fdesde, fhasta }, // Pasar parámetros
          type: sequelize.QueryTypes.SELECT // Si el SP devuelve datos
      });

      return resultado;

  }

  async obtenerChequePorId(id) {

    const data = await Cheque.findByPk(id);
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
  return fechaLocal.toISOString().slice(0, 10); 
}

module.exports = new ChequeManager();
