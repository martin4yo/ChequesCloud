import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { chequeraService } from '../services/chequeraService';
import { bancoService } from '../services/bancoService';
import { useUIStore } from '../store/uiStore';
import type { Chequera, ChequeraInput } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';

// Form type that matches the input fields
interface ChequeraFormData {
  numero: string;
  bancoId: string;
  saldoInicial: string;
  activa: string;
  chequeDesde: string;
  chequeHasta: string;
}

// Simple validation schema without complex transformations
const chequeraSchema = z.object({
  numero: z.string().min(1, 'El número es requerido'),
  bancoId: z.string().min(1, 'Debe seleccionar un banco'),
  saldoInicial: z.string().min(1, 'El saldo inicial es requerido').refine(val => {
    const num = Number(val);
    return !isNaN(num) && num >= 0;
  }, 'El saldo debe ser un número mayor o igual a 0'),
  activa: z.string().min(1, 'Debe seleccionar un estado'),
  chequeDesde: z.string().min(1, 'El número inicial es requerido').refine(val => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, 'El número inicial debe ser mayor a 0'),
  chequeHasta: z.string().min(1, 'El número final es requerido').refine(val => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, 'El número final debe ser mayor a 0'),
}).refine((data) => {
  const desde = Number(data.chequeDesde);
  const hasta = Number(data.chequeHasta);
  return hasta > desde;
}, {
  message: "El número final debe ser mayor al número inicial",
  path: ["chequeHasta"],
});

const ChequerasPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChequera, setEditingChequera] = useState<Chequera | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page] = useState(1);
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
  } = useForm<ChequeraFormData>({
    resolver: zodResolver(chequeraSchema),
    defaultValues: {
      numero: '',
      bancoId: '',
      activa: 'true',
      saldoInicial: '0',
      chequeDesde: '1',
      chequeHasta: '100',
    },
  });

  // Fetch chequeras
  const { data, isLoading } = useQuery({
    queryKey: ['chequeras', { page, search: searchTerm }],
    queryFn: () => chequeraService.getChequeras({ page, limit: 10, search: searchTerm }),
  });

  // Fetch bancos for select
  const { data: bancosData } = useQuery({
    queryKey: ['bancos-habilitados'],
    queryFn: () => bancoService.getBancosHabilitados(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: chequeraService.createChequera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chequeras'] });
      queryClient.invalidateQueries({ queryKey: ['chequeras-activas'] }); // Also invalidate activas for ChequesPage
      setIsModalOpen(false);
      reset();
      addNotification({
        type: 'success',
        title: 'Chequera creada',
        message: 'La chequera ha sido creada exitosamente',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al crear chequera',
        message: error.error || error.message || 'No se pudo crear la chequera',
        duration: 8000,
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChequeraInput }) =>
      chequeraService.updateChequera(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chequeras'] });
      queryClient.invalidateQueries({ queryKey: ['chequeras-activas'] }); // Also invalidate activas for ChequesPage
      setIsModalOpen(false);
      setEditingChequera(null);
      reset();
      addNotification({
        type: 'success',
        title: 'Chequera actualizada',
        message: 'La chequera ha sido actualizada exitosamente',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al actualizar chequera',
        message: error.error || error.message || 'No se pudo actualizar la chequera',
        duration: 8000,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: chequeraService.deleteChequera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chequeras'] });
      queryClient.invalidateQueries({ queryKey: ['chequeras-activas'] }); // Also invalidate activas for ChequesPage
      addNotification({
        type: 'success',
        title: 'Chequera eliminada',
        message: 'La chequera ha sido eliminada exitosamente',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al eliminar chequera',
        message: error.error || error.message || 'No se pudo eliminar la chequera',
        duration: 8000,
      });
    },
  });

  const handleCreate = () => {
    setEditingChequera(null);
    reset({ 
      numero: '',
      bancoId: '',
      activa: 'true', 
      saldoInicial: '0', 
      chequeDesde: '1', 
      chequeHasta: '100' 
    });
    setIsModalOpen(true);
  };

  const handleEdit = (chequera: Chequera) => {
    setEditingChequera(chequera);
    setValue('numero', chequera.numero);
    setValue('bancoId', chequera.bancoId.toString());
    setValue('saldoInicial', chequera.saldoInicial.toString());
    setValue('chequeDesde', chequera.chequeDesde.toString());
    setValue('chequeHasta', chequera.chequeHasta.toString());
    setValue('activa', chequera.activa.toString());
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Chequera',
      message: '¿Está seguro de que desea eliminar esta chequera? Se eliminarán todos los cheques asociados. Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: () => {
        deleteMutation.mutate(id);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const onSubmit = async (data: ChequeraFormData) => {
    // Transform form data to API format
    const transformedData: ChequeraInput = {
      numero: data.numero,
      bancoId: Number(data.bancoId),
      saldoInicial: Number(data.saldoInicial),
      activa: data.activa === 'true',
      chequeDesde: Number(data.chequeDesde),
      chequeHasta: Number(data.chequeHasta),
    };

    if (editingChequera) {
      updateMutation.mutate({ id: editingChequera.id, data: transformedData });
    } else {
      createMutation.mutate(transformedData);
    }
  };

  const columns = [
    {
      key: 'numero',
      header: 'Número',
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      ),
    },
    {
      key: 'banco',
      header: 'Banco',
      render: (_: any, row: Chequera) => (
        <div>
          <p className="font-medium">{row.banco?.nombre}</p>
          <p className="text-sm text-gray-500">{row.banco?.codigo}</p>
        </div>
      ),
    },
    {
      key: 'saldoActual',
      header: 'Saldo Actual',
      render: (value: number) => (
        <span className={`font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'activa',
      header: 'Estado',
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_: any, row: Chequera) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id)}>
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
          <CreditCard className="h-8 w-8 mr-3" />
          Chequeras
        </h1>
        <p className="text-gray-600">Gestión de chequeras bancarias</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Lista de Chequeras</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Chequera
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar chequeras..."
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
            emptyMessage="No se encontraron chequeras"
          />
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingChequera(null);
          reset();
        }}
        title={editingChequera ? 'Editar Chequera' : 'Nueva Chequera'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Número"
            placeholder="Ej: 12345678"
            error={errors.numero?.message}
            {...register('numero')}
          />
          
          <Select
            label="Banco"
            placeholder="Seleccionar banco"
            options={bancosData?.map(banco => ({
              value: banco.id,
              label: `${banco.nombre} (${banco.codigo})`
            })) || []}
            error={errors.bancoId?.message}
            {...register('bancoId')}
          />
          
          <Input
            label="Saldo Inicial"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.saldoInicial?.message}
            {...register('saldoInicial')}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cheque Desde"
              type="number"
              placeholder="Ej: 1"
              error={errors.chequeDesde?.message}
              {...register('chequeDesde')}
            />
            
            <Input
              label="Cheque Hasta"
              type="number"
              placeholder="Ej: 100"
              error={errors.chequeHasta?.message}
              {...register('chequeHasta')}
            />
          </div>
          
          <Select
            label="Estado"
            options={[
              { value: 'true', label: 'Activa' },
              { value: 'false', label: 'Inactiva' },
            ]}
            error={errors.activa?.message}
            {...register('activa')}
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingChequera ? 'Actualizar' : 'Crear'}
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

export default ChequerasPage;