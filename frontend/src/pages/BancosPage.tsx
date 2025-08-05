import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bancoService } from '../services/bancoService';
import { useUIStore } from '../store/uiStore';
import type { Banco, BancoInput } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

// Form type that matches the input fields
interface BancoFormData {
  nombre: string;
  codigo: string;
  habilitado: string;
}

const bancoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  codigo: z.string().min(2, 'El código debe tener al menos 2 caracteres'),
  habilitado: z.string().min(1, 'Debe seleccionar un estado'),
});

const BancosPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanco, setEditingBanco] = useState<Banco | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
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
    formState: { errors },
  } = useForm<BancoFormData>({
    resolver: zodResolver(bancoSchema),
    defaultValues: {
      nombre: '',
      codigo: '',
      habilitado: 'true',
    },
  });

  // Fetch bancos
  const { data, isLoading } = useQuery({
    queryKey: ['bancos', { page, search: searchTerm }],
    queryFn: () => bancoService.getBancos({ page, limit: 10, search: searchTerm }),
  });

  // Create banco mutation
  const createMutation = useMutation({
    mutationFn: bancoService.createBanco,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] });
      queryClient.invalidateQueries({ queryKey: ['bancos-habilitados'] }); // Also invalidate habilitados for ChequerasPage
      setIsModalOpen(false);
      reset();
      addNotification({
        type: 'success',
        title: 'Banco creado',
        message: 'El banco ha sido creado exitosamente',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al crear banco',
        message: error.error || error.message || 'Ocurrió un error inesperado',
        duration: 8000,
      });
    },
  });

  // Update banco mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BancoInput }) =>
      bancoService.updateBanco(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] });
      queryClient.invalidateQueries({ queryKey: ['bancos-habilitados'] }); // Also invalidate habilitados for ChequerasPage
      setIsModalOpen(false);
      setEditingBanco(null);
      reset();
      addNotification({
        type: 'success',
        title: 'Banco actualizado',
        message: 'El banco ha sido actualizado exitosamente',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al actualizar banco',
        message: error.error || error.message || 'Ocurrió un error inesperado',
        duration: 8000,
      });
    },
  });

  // Delete banco mutation
  const deleteMutation = useMutation({
    mutationFn: bancoService.deleteBanco,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] });
      queryClient.invalidateQueries({ queryKey: ['bancos-habilitados'] }); // Also invalidate habilitados for ChequerasPage
      addNotification({
        type: 'success',
        title: 'Banco eliminado',
        message: 'El banco ha sido eliminado exitosamente',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al eliminar banco',
        message: error.error || error.message || 'Ocurrió un error inesperado',
        duration: 8000,
      });
    },
  });

  const handleCreate = () => {
    setEditingBanco(null);
    reset({ nombre: '', codigo: '', habilitado: 'true' });
    setIsModalOpen(true);
  };

  const handleEdit = (banco: Banco) => {
    setEditingBanco(banco);
    setValue('nombre', banco.nombre);
    setValue('codigo', banco.codigo);
    setValue('habilitado', banco.habilitado.toString());
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Banco',
      message: '¿Está seguro de que desea eliminar este banco? Se eliminarán todas las chequeras y cheques asociados. Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: () => {
        deleteMutation.mutate(id);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const onSubmit = async (data: BancoFormData) => {
    // Transform form data to API format
    const transformedData: BancoInput = {
      nombre: data.nombre,
      codigo: data.codigo,
      habilitado: data.habilitado === 'true',
    };

    if (editingBanco) {
      updateMutation.mutate({ id: editingBanco.id, data: transformedData });
    } else {
      createMutation.mutate(transformedData);
    }
  };

  const columns = [
    {
      key: 'codigo',
      header: 'Código',
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      ),
    },
    {
      key: 'nombre',
      header: 'Nombre',
    },
    {
      key: 'habilitado',
      header: 'Estado',
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Habilitado' : 'Deshabilitado'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_: any, row: Banco) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Building2 className="h-8 w-8 mr-3" />
          Bancos
        </h1>
        <p className="text-gray-600">Gestión de entidades bancarias</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Lista de Bancos</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Banco
        </Button>
      </div>

      <Card>
        <CardHeader>
          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar bancos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table
            data={data?.data || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No se encontraron bancos"
          />
          
          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-600">
                Mostrando {((page - 1) * 10) + 1} - {Math.min(page * 10, data.total)} de {data.total} bancos
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBanco(null);
          reset();
        }}
        title={editingBanco ? 'Editar Banco' : 'Nuevo Banco'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Código"
            placeholder="Ej: 001"
            error={errors.codigo?.message}
            {...register('codigo')}
          />
          
          <Input
            label="Nombre"
            placeholder="Ej: Banco de la Nación Argentina"
            error={errors.nombre?.message}
            {...register('nombre')}
          />
          
          <Select
            label="Estado"
            options={[
              { value: 'true', label: 'Habilitado' },
              { value: 'false', label: 'Deshabilitado' },
            ]}
            error={errors.habilitado?.message}
            {...register('habilitado')}
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingBanco ? 'Actualizar' : 'Crear'}
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
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default BancosPage;