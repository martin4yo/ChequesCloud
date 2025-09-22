import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse, LoginInput, UserInput } from '../types';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../middleware/auth';

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