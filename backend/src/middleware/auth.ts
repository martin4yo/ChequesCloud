import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload, AuthRequest } from '../types';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Token de acceso requerido'
    });
    return;
  }

  jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (err) {
      res.status(403).json({
        success: false,
        error: 'Token inválido'
      });
      return;
    }

    req.user = decoded as JwtPayload;
    next();
  });
};

export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload as object, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  } as SignOptions);
};