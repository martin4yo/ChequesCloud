import Joi from 'joi';

export const usuarioSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
      'string.max': 'El nombre de usuario no puede tener más de 50 caracteres',
      'any.required': 'El nombre de usuario es requerido'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    }),
  activo: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'El estado debe ser verdadero o falso'
    })
});

export const updateUsuarioSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
      'string.max': 'El nombre de usuario no puede tener más de 50 caracteres',
      'any.required': 'El nombre de usuario es requerido'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),
  password: Joi.string()
    .min(6)
    .optional()
    .allow('')
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres'
    }),
  activo: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'El estado debe ser verdadero o falso'
    })
});