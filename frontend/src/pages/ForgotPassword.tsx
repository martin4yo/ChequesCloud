import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader } from 'lucide-react';
import { z } from 'zod';
import { authService } from '../services/authService';
import { useUIStore } from '../store/uiStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const forgotPasswordSchema = z.object({
  email: z.string().email('Debe ser un email válido')
});

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const { addNotification } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      forgotPasswordSchema.parse({ email });

      setIsLoading(true);
      const response = await authService.forgotPassword(email);

      if (response.success) {
        setIsSuccess(true);
        addNotification({
          type: 'success',
          title: 'Correo enviado',
          message: 'Si el correo existe, recibirás un enlace de recuperación'
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string } = {};
        error.errors.forEach(err => {
          if (err.path[0] === 'email') {
            fieldErrors.email = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Error al enviar el correo de recuperación'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Correo Enviado!
            </h2>
            <p className="text-gray-600 mb-6">
              Si el correo {email} está registrado en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
              Por favor, revisa tu bandeja de entrada y la carpeta de spam.
            </p>
            <div className="space-y-3">
              <Link to="/login" className="block">
                <Button className="w-full">
                  Volver al Login
                </Button>
              </Link>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                ¿No recibiste el correo? Intenta nuevamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="mb-8">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al login
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="text-gray-600 text-sm">
            No te preocupes, te enviaremos instrucciones para restablecerla.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              error={errors.email}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Enviando...
              </>
            ) : (
              'Enviar Instrucciones'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}