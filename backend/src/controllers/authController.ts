import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse, LoginInput, UserInput } from '../types';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../middleware/auth';
import { sendPasswordResetEmail } from '../config/email';
import crypto from 'crypto';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password }: UserInput = req.body;

  console.log('📝 Intento de registro:', { username, email, passwordLength: password?.length });

  // Check if user already exists
  const existingUser = await prisma.usuario.findUnique({
    where: { email }
  });

  console.log('🔍 Usuario existente encontrado:', existingUser ? 'Sí' : 'No');

  if (existingUser) {
    console.log('❌ Usuario ya existe con email:', email);
    throw new AppError('El usuario ya existe', 409);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);
  console.log('🔐 Contraseña hasheada:', hashedPassword ? 'Sí' : 'No');

  // Create user
  console.log('💾 Creando usuario en base de datos...');
  const user = await prisma.usuario.create({
    data: {
      username,
      email,
      password: hashedPassword
    }
  });

  console.log('✅ Usuario creado exitosamente:', {
    id: user.id,
    username: user.username,
    email: user.email
  });

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email
  });

  console.log('🎫 Token generado para registro:', token ? 'Sí' : 'No');

  const response: ApiResponse = {
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    },
    message: 'Usuario registrado exitosamente'
  };

  console.log('📤 Enviando respuesta de registro exitoso');
  res.status(201).json(response);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: LoginInput = req.body;

  console.log('🔐 Intento de login:', { email, passwordLength: password?.length });

  // Find user
  const user = await prisma.usuario.findUnique({
    where: { email }
  });

  console.log('👤 Usuario encontrado:', user ? 'Sí' : 'No');

  if (!user) {
    console.log('❌ Usuario no encontrado para email:', email);
    throw new AppError('Credenciales inválidas', 401);
  }

  // Check password
  const isPasswordValid = await comparePassword(password, user.password);
  console.log('🔑 Contraseña válida:', isPasswordValid);

  if (!isPasswordValid) {
    console.log('❌ Contraseña incorrecta para usuario:', email);
    throw new AppError('Credenciales inválidas', 401);
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email
  });

  console.log('🎫 Token generado:', token ? 'Sí' : 'No');

  const response: ApiResponse = {
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    },
    message: 'Login exitoso'
  };

  console.log('✅ Login exitoso para usuario:', email);
  res.json(response);
});

export const getProfile = asyncHandler(async (req: any, res: Response) => {
  const user = await prisma.usuario.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: user
  };

  res.json(response);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  console.log('🔑 Solicitud de recuperación de contraseña para:', email);

  // Find user
  const user = await prisma.usuario.findUnique({
    where: { email }
  });

  if (!user) {
    // Por seguridad, no revelamos si el usuario existe o no
    console.log('⚠️ Usuario no encontrado para recuperación:', email);
    const response: ApiResponse = {
      success: true,
      message: 'Si el correo existe, recibirás un enlace de recuperación'
    };
    return res.json(response);
  }

  // Invalidar tokens anteriores
  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      used: false,
      expiresAt: {
        gt: new Date()
      }
    },
    data: {
      used: true
    }
  });

  // Generate reset token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Token válido por 1 hora

  // Save token to database
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
      used: false
    }
  });

  // Send email
  try {
    await sendPasswordResetEmail(email, token);
    console.log('✅ Email de recuperación enviado a:', email);
  } catch (error) {
    console.error('❌ Error enviando email de recuperación:', error);
    throw new AppError('Error enviando el correo de recuperación', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Si el correo existe, recibirás un enlace de recuperación'
  };

  res.json(response);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  console.log('🔐 Intento de reset de contraseña con token');

  // Find valid token
  const passwordResetToken = await prisma.passwordResetToken.findFirst({
    where: {
      token,
      used: false,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      usuario: true
    }
  });

  if (!passwordResetToken) {
    console.log('❌ Token inválido o expirado');
    throw new AppError('Token inválido o expirado', 400);
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update user password and mark token as used
  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: passwordResetToken.userId },
      data: { password: hashedPassword }
    }),
    prisma.passwordResetToken.update({
      where: { id: passwordResetToken.id },
      data: { used: true }
    })
  ]);

  console.log('✅ Contraseña actualizada para usuario:', passwordResetToken.usuario.email);

  const response: ApiResponse = {
    success: true,
    message: 'Contraseña actualizada exitosamente'
  };

  res.json(response);
});

export const validateResetToken = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  const passwordResetToken = await prisma.passwordResetToken.findFirst({
    where: {
      token,
      used: false,
      expiresAt: {
        gt: new Date()
      }
    }
  });

  const response: ApiResponse = {
    success: true,
    data: {
      valid: !!passwordResetToken
    }
  };

  res.json(response);
});