import Joi from 'joi';

export const chequeSchema = Joi.object({
  numero: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'El número de cheque debe tener al menos 1 caracter',
      'string.max': 'El número de cheque no puede tener más de 50 caracteres',
      'any.required': 'El número de cheque es requerido'
    }),
  chequeraId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID de la chequera debe ser un número',
      'number.integer': 'El ID de la chequera debe ser un número entero',
      'number.positive': 'El ID de la chequera debe ser positivo',
      'any.required': 'El ID de la chequera es requerido'
    }),
  fechaEmision: Joi.date()
    .min('now')
    .required()
    .messages({
      'date.base': 'La fecha de emisión debe ser una fecha válida',
      'date.min': 'La fecha de emisión debe ser a partir de mañana',
      'any.required': 'La fecha de emisión es requerida'
    }),
  fechaVencimiento: Joi.date()
    .min(Joi.ref('fechaEmision'))
    .required()
    .messages({
      'date.base': 'La fecha de vencimiento debe ser una fecha válida',
      'date.min': 'La fecha de vencimiento debe ser posterior a la fecha de emisión',
      'any.required': 'La fecha de vencimiento es requerida'
    }),
  beneficiario: Joi.string()
    .min(2)
    .max(250)
    .required()
    .messages({
      'string.min': 'El beneficiario debe tener al menos 2 caracteres',
      'string.max': 'El beneficiario no puede tener más de 250 caracteres',
      'any.required': 'El beneficiario es requerido'
    }),
  concepto: Joi.string()
    .min(2)
    .max(500)
    .required()
    .messages({
      'string.min': 'El concepto debe tener al menos 2 caracteres',
      'string.max': 'El concepto no puede tener más de 500 caracteres',
      'any.required': 'El concepto es requerido'
    }),
  monto: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'El monto debe ser un número',
      'number.positive': 'El monto debe ser positivo',
      'any.required': 'El monto es requerido'
    }),
  estado: Joi.string()
    .valid('PENDIENTE', 'COBRADO', 'ANULADO')
    .default('PENDIENTE')
    .messages({
      'any.only': 'El estado debe ser PENDIENTE, COBRADO o ANULADO'
    })
});

export const updateChequeSchema = chequeSchema;