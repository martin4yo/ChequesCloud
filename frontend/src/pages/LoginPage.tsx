import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const loginSchema = z.object({
  email: z.string().email('Ingrese un email válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Ingrese un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const LoginPage: React.FC = () => {
  const { login, register: registerUser, isAuthenticated, isLoading } = useAuthStore();
  const { addNotification } = useUIStore();
  const [isRegister, setIsRegister] = useState(false);


  const {
    register: registerForm,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: any) => {
    try {
      if (isRegister) {
        console.log('📝 Frontend: Iniciando registro con:', data);
        await registerUser(data.username, data.email, data.password);
        addNotification({
          type: 'success',
          title: 'Registro exitoso',
          message: 'Tu cuenta ha sido creada correctamente',
        });
      } else {
        console.log('🔐 Frontend: Iniciando login con:', data);
        await login(data.email, data.password);
        addNotification({
          type: 'success',
          title: 'Bienvenido',
          message: 'Has iniciado sesión correctamente',
        });
      }
    } catch (error: any) {
      console.error('🚨 Frontend: Error en', isRegister ? 'registro' : 'login', ':', error);
      const errorMessage = error.message || (isRegister ? 'Error al crear la cuenta' : 'Credenciales inválidas');
      
      addNotification({
        type: 'error',
        title: isRegister ? 'Error de registro' : 'Error de autenticación',
        message: errorMessage,
        duration: 8000, // Show error for 8 seconds
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">ChequesCloud</h2>
          <p className="mt-2 text-gray-600">
            Gestión inteligente de cheques
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {isRegister && (
                <Input
                  label="Nombre de usuario"
                  type="text"
                  placeholder="Ingrese su nombre de usuario"
                  error={isRegister ? (errors as any).username?.message : undefined}
                  {...registerForm('username')}
                />
              )}
              
              <Input
                label="Email"
                type="email"
                placeholder="Ingrese su email"
                error={errors.email?.message}
                {...registerForm('email')}
              />

              <Input
                label="Contraseña"
                type="password"
                placeholder="Ingrese su contraseña"
                error={errors.password?.message}
                {...registerForm('password')}
              />

              {!isRegister && (
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  reset(); // Limpiar el formulario al cambiar de modo
                }}
                className="text-primary-600 hover:text-primary-500 text-sm"
              >
                {isRegister
                  ? '¿Ya tienes cuenta? Inicia sesión'
                  : '¿No tienes cuenta? Regístrate'
                }
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Sistema de gestión de cheques empresarial
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;