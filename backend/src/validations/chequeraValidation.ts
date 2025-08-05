import Joi from 'joi';

export const chequeraSchema = Joi.object({
  numero: Joi.string()
    .min(1)
    .max(20)
    .required()
    .messages({
      'string.min': 'El número de chequera debe tener al menos 1 caracter',
      'string.max': 'El número de chequera no puede tener más de 20 caracteres',
      'any.required': 'El número de chequera es requerido'
    }),
  bancoId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID del banco debe ser un número',
      'number.integer': 'El ID del banco debe ser un número entero',
      'number.positive': 'El ID del banco debe ser positivo',
      'any.required': 'El ID del banco es requerido'
    }),
  saldoInicial: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'El saldo inicial debe ser un número',
      'number.min': 'El saldo inicial no puede ser negativo'
    }),
  activa: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'El campo activa debe ser verdadero o falso'
    }),
  chequeDesde: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El número inicial del cheque debe ser un número',
      'number.integer': 'El número inicial del cheque debe ser un número entero',
      'number.positive': 'El número inicial del cheque debe ser positivo',
      'any.required': 'El número inicial del cheque es requerido'
    }),
  chequeHasta: Joi.number()
    .integer()
    .positive()
    .greater(Joi.ref('chequeDesde'))
    .required()
    .messages({
      'number.base': 'El número final del cheque debe ser un número',
      'number.integer': 'El número final del cheque debe ser un número entero',
      'number.positive': 'El número final del cheque debe ser positivo',
      'number.greater': 'El número final debe ser mayor al número inicial',
      'any.required': 'El número final del cheque es requerido'
    })
});

export const updateChequeraSchema = chequeraSchema;