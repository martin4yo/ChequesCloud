import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import type { ApiResponse, PaginationQuery } from '../types';
import { hashPassword } from '../utils/password';
import { sendPasswordResetEmail } from '../config/email';
import crypto from 'crypto';

export interface UsuarioInput {
  username: string;
  email: string;
  password?: string;
  activo?: boolean;
}

export const getUsuarios = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'username', sortOrder = 'asc' } = req.query as PaginationQuery;

    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder === 'desc' ? 'desc' : 'asc';

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where: whereClause,
        orderBy,
        skip: offset,
        take: Number(limit),
        select: {
          id: true,
          username: true,
          email: true,
          activo: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.usuario.count({ where: whereClause })
    ]);

    const response: ApiResponse = {
      success: true,
      data: usuarios,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const getUsuarioById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        username: true,
        email: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!usuario) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: usuario
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const createUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, activo = true }: UsuarioInput = req.body;

    if (!password) {
      res.status(400).json({
        success: false,
        error: 'La contraseña es requerida'
      });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const usuario = await prisma.usuario.create({
      data: {
        username,
        email,
        password: hashedPassword,
        activo
      },
      select: {
        id: true,
        username: true,
        email: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`✅ PRISMA - Usuario creado exitosamente: ${usuario.id}`);

    res.status(201).json({
      success: true,
      data: usuario,
      message: 'Usuario creado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error creando usuario:', error);

    if (error.code === 'P2002') {
      const field = error.meta?.target?.includes('email') ? 'email' : 'nombre de usuario';
      res.status(409).json({
        success: false,
        error: `Ya existe un usuario con este ${field}`
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const updateUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, email, password, activo }: UsuarioInput = req.body;

    const updateData: any = {
      username,
      email,
      activo
    };

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`✅ PRISMA - Usuario actualizado exitosamente: ${id}`);

    res.json({
      success: true,
      data: usuario,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error actualizando usuario:', error);

    if (error.code === 'P2002') {
      const field = error.meta?.target?.includes('email') ? 'email' : 'nombre de usuario';
      res.status(409).json({
        success: false,
        error: `Ya existe un usuario con este ${field}`
      });
      return;
    }

    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const toggleUsuarioActivo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const usuarioActual = await prisma.usuario.findUnique({
      where: { id: Number(id) },
      select: { activo: true }
    });

    if (!usuarioActual) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
      return;
    }

    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: { activo: !usuarioActual.activo },
      select: {
        id: true,
        username: true,
        email: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const action = usuario.activo ? 'activado' : 'desactivado';
    console.log(`✅ PRISMA - Usuario ${action} exitosamente: ${id}`);

    res.json({
      success: true,
      data: usuario,
      message: `Usuario ${action} exitosamente`
    });
  } catch (error: any) {
    console.error('❌ Error cambiando estado del usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const reenviarEmailCambioPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
      select: { email: true, activo: true }
    });

    if (!usuario) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
      return;
    }

    if (!usuario.activo) {
      res.status(400).json({
        success: false,
        error: 'No se puede enviar email a un usuario inactivo'
      });
      return;
    }

    // Invalidar tokens anteriores
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: Number(id),
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
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        userId: Number(id),
        token,
        expiresAt,
        used: false
      }
    });

    // Send email
    await sendPasswordResetEmail(usuario.email, token);

    console.log(`✅ Email de cambio de contraseña enviado a: ${usuario.email}`);

    res.json({
      success: true,
      message: 'Email de cambio de contraseña enviado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error enviando email de cambio de contraseña:', error);
    res.status(500).json({
      success: false,
      error: 'Error enviando el correo de cambio de contraseña'
    });
  }
};

export const deleteUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) }
    });

    if (!usuario) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
      return;
    }

    // Eliminar tokens de reset relacionados primero
    await prisma.passwordResetToken.deleteMany({
      where: { userId: Number(id) }
    });

    // Eliminar usuario
    await prisma.usuario.delete({
      where: { id: Number(id) }
    });

    console.log(`✅ PRISMA - Usuario eliminado exitosamente: ${id}`);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};