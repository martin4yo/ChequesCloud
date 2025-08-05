import Joi from 'joi';

export const bancoSchema = Joi.object({
  nombre: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'El nombre del banco debe tener al menos 2 caracteres',
      'string.max': 'El nombre del banco no puede tener más de 100 caracteres',
      'any.required': 'El nombre del banco es requerido'
    }),
  codigo: Joi.string()
    .min(2)
    .max(10)
    .required()
    .messages({
      'string.min': 'El código del banco debe tener al menos 2 caracteres',
      'string.max': 'El código del banco no puede tener más de 10 caracteres',
      'any.required': 'El código del banco es requerido'
    }),
  habilitado: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'El campo habilitado debe ser verdadero o falso'
    })
});

export const updateBancoSchema = bancoSchema;