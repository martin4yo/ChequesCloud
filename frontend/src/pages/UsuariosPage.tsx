import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usuarioService } from '../services/usuarioService';
import type { Usuario, UsuarioInput } from '../services/usuarioService';
import { useUIStore } from '../store/uiStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

// Form type that matches the input fields
interface UsuarioFormData {
  username: string;
  email: string;
  password: string;
  activo: string;
}

const usuarioSchema = z.object({
  username: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Debe ser un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  activo: z.string().min(1, 'Debe seleccionar un estado'),
});

const updateUsuarioSchema = z.object({
  username: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Debe ser un email válido'),
  password: z.string().optional(),
  activo: z.string().min(1, 'Debe seleccionar un estado'),
});

const UsuariosPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const { addNotification } = useUIStore();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(editingUsuario ? updateUsuarioSchema : usuarioSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      activo: 'true',
    },
  });

  const watchPassword = watch('password');

  // Fetch usuarios
  const { data, isLoading } = useQuery({
    queryKey: ['usuarios', { page, search: searchTerm }],
    queryFn: () => usuarioService.getUsuarios({ page, limit: 10, search: searchTerm }),
  });

  // Create usuario mutation
  const createMutation = useMutation({
    mutationFn: usuarioService.createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setIsModalOpen(false);
      reset();
      addNotification({
        type: 'success',
        title: 'Usuario creado',
        message: 'El usuario ha sido creado exitosamente',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al crear usuario',
        message: error.message || 'Ocurrió un error inesperado',
        duration: 8000,
      });
    },
  });

  // Update usuario mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UsuarioInput }) =>
      usuarioService.updateUsuario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setIsModalOpen(false);
      setEditingUsuario(null);
      reset();
      addNotification({
        type: 'success',
        title: 'Usuario actualizado',
        message: 'El usuario ha sido actualizado exitosamente',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al actualizar usuario',
        message: error.message || 'Ocurrió un error inesperado',
        duration: 8000,
      });
    },
  });

  // Toggle activo mutation
  const toggleActivoMutation = useMutation({
    mutationFn: usuarioService.toggleUsuarioActivo,
    onSuccess: (updatedUsuario) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      const action = updatedUsuario.activo ? 'activado' : 'desactivado';
      addNotification({
        type: 'success',
        title: 'Estado actualizado',
        message: `Usuario ${action} exitosamente`,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al cambiar estado',
        message: error.message || 'Ocurrió un error inesperado',
        duration: 8000,
      });
    },
  });

  // Reenviar email mutation
  const reenviarEmailMutation = useMutation({
    mutationFn: usuarioService.reenviarEmailCambioPassword,
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Email enviado',
        message: 'Email de cambio de contraseña enviado exitosamente',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al enviar email',
        message: error.message || 'Ocurrió un error inesperado',
        duration: 8000,
      });
    },
  });

  // Delete usuario mutation
  const deleteMutation = useMutation({
    mutationFn: usuarioService.deleteUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      addNotification({
        type: 'success',
        title: 'Usuario eliminado',
        message: 'El usuario ha sido eliminado exitosamente',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al eliminar usuario',
        message: error.message || 'Ocurrió un error inesperado',
        duration: 8000,
      });
    },
  });

  const handleSubmitForm = (data: UsuarioFormData) => {
    const usuarioData: UsuarioInput = {
      username: data.username,
      email: data.email,
      activo: data.activo === 'true',
    };

    // Solo incluir password si tiene valor
    if (data.password && data.password.trim() !== '') {
      usuarioData.password = data.password;
    }

    if (editingUsuario) {
      updateMutation.mutate({ id: editingUsuario.id, data: usuarioData });
    } else {
      if (!usuarioData.password) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'La contraseña es requerida para crear un usuario',
        });
        return;
      }
      createMutation.mutate(usuarioData);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setValue('username', usuario.username);
    setValue('email', usuario.email);
    setValue('password', '');
    setValue('activo', usuario.activo.toString());
    setIsModalOpen(true);
  };

  const handleToggleActivo = (usuario: Usuario) => {
    const action = usuario.activo ? 'desactivar' : 'activar';
    setConfirmDialog({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Usuario`,
      message: `¿Estás seguro de que quieres ${action} el usuario "${usuario.username}"?`,
      type: 'warning',
      onConfirm: () => {
        toggleActivoMutation.mutate(usuario.id);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleReenviarEmail = (usuario: Usuario) => {
    if (!usuario.activo) {
      addNotification({
        type: 'warning',
        title: 'Usuario inactivo',
        message: 'No se puede enviar email a un usuario inactivo',
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Reenviar Email',
      message: `¿Enviar email de cambio de contraseña a "${usuario.email}"?`,
      type: 'info',
      onConfirm: () => {
        reenviarEmailMutation.mutate(usuario.id);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleDelete = (usuario: Usuario) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de que quieres eliminar el usuario "${usuario.username}"? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: () => {
        deleteMutation.mutate(usuario.id);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleNewUsuario = () => {
    setEditingUsuario(null);
    reset();
    setIsModalOpen(true);
  };

  const columns = [
    {
      key: 'username',
      header: 'Usuario',
      render: (value: any, usuario: Usuario) => {
        if (!usuario) return null;
        return <div className="font-medium text-gray-900">{usuario.username}</div>;
      },
    },
    {
      key: 'email',
      header: 'Email',
      render: (value: any, usuario: Usuario) => {
        if (!usuario) return null;
        return <div className="text-gray-600">{usuario.email}</div>;
      },
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (value: any, usuario: Usuario) => {
        if (!usuario) return null;

        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              usuario.activo
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {usuario.activo ? 'Activo' : 'Inactivo'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Fecha Creación',
      render: (value: any, usuario: Usuario) => {
        if (!usuario) return null;

        return (
          <div className="text-gray-600">
            {new Date(usuario.createdAt).toLocaleDateString()}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (value: any, usuario: Usuario) => {
        if (!usuario) return null;

        return (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(usuario)}
              title="Editar usuario"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleActivo(usuario)}
              title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
            >
              {usuario.activo ? (
                <UserX className="h-4 w-4 text-red-600" />
              ) : (
                <UserCheck className="h-4 w-4 text-green-600" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReenviarEmail(usuario)}
              title="Reenviar email de cambio de contraseña"
              disabled={!usuario.activo}
            >
              <Mail className={`h-4 w-4 ${usuario.activo ? 'text-blue-600' : 'text-gray-400'}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(usuario)}
              title="Eliminar usuario"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="mr-3 h-8 w-8 text-blue-600" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-1">
            Administra los usuarios del sistema
          </p>
        </div>
        <Button onClick={handleNewUsuario} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Usuarios</h2>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table
            data={data?.data || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No se encontraron usuarios"
          />

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-600">
                Mostrando página {data.page} de {data.totalPages} ({data.total} usuarios total)
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  size="sm"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.totalPages}
                  size="sm"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal ABM */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUsuario(null);
          reset();
        }}
        title={editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
          <Input
            label="Nombre de Usuario"
            placeholder="Ingrese el nombre de usuario"
            error={errors.username?.message}
            {...register('username')}
          />

          <Input
            label="Email"
            type="email"
            placeholder="Ingrese el email"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="relative">
            <Input
              label={editingUsuario ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
              type={showPassword ? 'text' : 'password'}
              placeholder={editingUsuario ? 'Dejar vacío para mantener actual' : 'Ingrese la contraseña'}
              error={errors.password?.message}
              {...register('password')}
            />
            {watchPassword && (
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>

          <Select
            label="Estado"
            options={[
              { value: 'true', label: 'Activo' },
              { value: 'false', label: 'Inactivo' },
            ]}
            error={errors.activo?.message}
            {...register('activo')}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingUsuario(null);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingUsuario ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default UsuariosPage;