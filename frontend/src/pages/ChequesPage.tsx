import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, FileText, Download, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { chequeService } from '../services/chequeService';
import { chequeraService } from '../services/chequeraService';
import { bancoService } from '../services/bancoService';
import { useUIStore } from '../store/uiStore';
import type { Cheque, ChequeInput } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { formatCurrency, formatUTCDate, formatDateTimePlusOneDay, downloadBlob, dateToUTC, utcToLocalDate } from '../lib/utils';

const chequeSchema = z.object({
  numero: z.string().min(1, 'El número es requerido'),
  chequeraId: z.number().min(1, 'Debe seleccionar una chequera'),
  fechaEmision: z.string().min(1, 'La fecha de emisión es requerida'),
  fechaVencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  beneficiario: z.string().min(2, 'El beneficiario debe tener al menos 2 caracteres'),
  concepto: z.string().min(2, 'El concepto debe tener al menos 2 caracteres'),
  monto: z.number().positive('El monto debe ser positivo'),
  estado: z.enum(['PENDIENTE', 'COBRADO', 'ANULADO']),
}).refine((data) => new Date(data.fechaVencimiento) > new Date(data.fechaEmision), {
  message: "La fecha de vencimiento debe ser posterior a la fecha de emisión",
  path: ["fechaVencimiento"],
});

type ChequeFormData = z.infer<typeof chequeSchema>;

const ChequesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCheque, setEditingCheque] = useState<Cheque | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [bancoFilter, setBancoFilter] = useState(searchParams.get('bancoId') || '');
  const [fechaDesde, setFechaDesde] = useState(searchParams.get('fechaDesde') || '');
  const [fechaHasta, setFechaHasta] = useState(searchParams.get('fechaHasta') || '');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const { addNotification } = useUIStore();
  const queryClient = useQueryClient();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [estadoFilter, bancoFilter, fechaDesde, fechaHasta]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ChequeFormData>({
    resolver: zodResolver(chequeSchema),
    defaultValues: {
      estado: 'PENDIENTE',
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaVencimiento: new Date().toISOString().split('T')[0],
    },
  });

  // Fetch cheques
  const { data, isLoading } = useQuery({
    queryKey: ['cheques', { page, search: debouncedSearchTerm, estado: estadoFilter, banco: bancoFilter, fechaDesde, fechaHasta }],
    queryFn: () => {
      // Debug: Ver qué fechas se están enviando al backend
      console.log('🔍 FRONTEND DEBUG - Enviando al backend:');
      console.log('📅 fechaDesde (frontend state):', fechaDesde);
      console.log('📅 fechaHasta (frontend state):', fechaHasta);

      return chequeService.getCheques({
        page,
        limit: 10,
        search: debouncedSearchTerm,
        estado: estadoFilter || undefined,
        bancoId: bancoFilter || undefined,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined
      });
    },
  });

  // Fetch chequeras for select
  const { data: chequerasData } = useQuery({
    queryKey: ['chequeras-activas'],
    queryFn: () => chequeraService.getChequerasActivas(),
  });

  // Fetch bancos for filter
  const { data: bancosData } = useQuery({
    queryKey: ['bancos'],
    queryFn: () => bancoService.getBancos(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: chequeService.createCheque,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] });
      queryClient.invalidateQueries({ queryKey: ['chequeras'] });
      setIsModalOpen(false);
      reset();
      addNotification({
        type: 'success',
        title: 'Cheque creado',
        message: 'El cheque ha sido creado exitosamente',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al crear cheque',
        message: error.error || error.message || 'No se pudo crear el cheque',
        duration: 8000,
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChequeInput }) =>
      chequeService.updateCheque(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] });
      queryClient.invalidateQueries({ queryKey: ['chequeras'] });
      setIsModalOpen(false);
      setEditingCheque(null);
      reset();
      addNotification({
        type: 'success',
        title: 'Cheque actualizado',
        message: 'El cheque ha sido actualizado exitosamente',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al actualizar cheque',
        message: error.error || error.message || 'No se pudo actualizar el cheque',
        duration: 8000,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: chequeService.deleteCheque,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] });
      queryClient.invalidateQueries({ queryKey: ['chequeras'] });
      addNotification({
        type: 'success',
        title: 'Cheque eliminado',
        message: 'El cheque ha sido eliminado exitosamente',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al eliminar cheque',
        message: error.error || error.message || 'No se pudo eliminar el cheque',
        duration: 8000,
      });
    },
  });

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: chequeService.marcarComoCobrado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] });
      queryClient.invalidateQueries({ queryKey: ['chequeras'] });
      addNotification({
        type: 'success',
        title: 'Cheque cobrado',
        message: 'El cheque ha sido marcado como cobrado',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error al cobrar cheque',
        message: error.error || error.message || 'No se pudo marcar el cheque como cobrado',
        duration: 8000,
      });
    },
  });

  const handleCreate = () => {
    setEditingCheque(null);
    reset({ 
      estado: 'PENDIENTE',
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaVencimiento: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (cheque: Cheque) => {
    setEditingCheque(cheque);
    setValue('numero', cheque.numero);
    setValue('chequeraId', cheque.chequeraId);
    setValue('fechaEmision', utcToLocalDate(cheque.fechaEmision));
    setValue('fechaVencimiento', utcToLocalDate(cheque.fechaVencimiento));
    setValue('beneficiario', cheque.beneficiario);
    setValue('concepto', cheque.concepto);
    setValue('monto', cheque.monto);
    setValue('estado', cheque.estado);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Cheque',
      message: '¿Está seguro de que desea eliminar este cheque? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: () => {
        deleteMutation.mutate(id);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleMarkAsPaid = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Marcar como Cobrado',
      message: '¿Está seguro de que desea marcar este cheque como cobrado? Esta acción actualizará el saldo de la chequera.',
      type: 'info',
      onConfirm: () => {
        markAsPaidMutation.mutate(id);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await chequeService.exportToExcel({
        estado: estadoFilter || undefined,
        bancoId: bancoFilter || undefined,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        search: debouncedSearchTerm || undefined
      });
      downloadBlob(blob, `cheques_${new Date().toISOString().split('T')[0]}.xlsx`);
      addNotification({
        type: 'success',
        title: 'Exportación exitosa',
        message: 'Los datos han sido exportados a Excel',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error en exportación',
        message: 'No se pudo exportar los datos',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to check if a cheque can be marked as paid
  const canMarkAsPaid = (cheque: Cheque): boolean => {
    if (cheque.estado !== 'PENDIENTE') return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Convert UTC date from backend to local date for comparison
    const fechaVencimiento = new Date(cheque.fechaVencimiento);

    // Debug logs
    console.log('🔍 Validando cobro para cheque:', cheque.numero);
    console.log('📅 Fecha UTC backend:', cheque.fechaVencimiento);
    console.log('📅 Fecha local mostrada:', fechaVencimiento.toLocaleDateString());
    console.log('📅 Hoy:', today.toLocaleDateString());
    console.log('✅ Puede cobrarse?:', fechaVencimiento < today);

    // Only allow if vencimiento is BEFORE today
    return fechaVencimiento < today;
  };

  const onSubmit = async (data: ChequeFormData) => {
    // No need for date adjustments with UTC - send dates as-is
    if (editingCheque) {
      updateMutation.mutate({ id: editingCheque.id, data });
    } else {
      createMutation.mutate(data);
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
      key: 'chequera',
      header: 'Chequera/Banco',
      render: (_: any, row: Cheque) => (
        <div>
          <p className="font-medium">{row.chequera?.numero}</p>
          <p className="text-sm text-gray-500">{row.chequera?.banco?.nombre}</p>
        </div>
      ),
    },
    {
      key: 'beneficiario',
      header: 'Beneficiario',
      render: (value: string) => (
        <div className="max-w-40 truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      key: 'concepto',
      header: 'Concepto',
      render: (value: string) => (
        <div className="max-w-48 truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      key: 'monto',
      header: 'Monto',
      render: (value: number) => (
        <span className="font-medium text-green-600">
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'fechaEmision',
      header: 'F. Emisión',
      render: (value: string) => formatUTCDate(value),
    },
    {
      key: 'fechaVencimiento',
      header: 'F. Vencimiento',
      render: (value: string) => formatUTCDate(value),
    },
    {
      key: 'fechaCobro',
      header: 'F. Cobro',
      render: (value: string) => formatDateTimePlusOneDay(value),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'PENDIENTE' 
            ? 'bg-yellow-100 text-yellow-800'
            : value === 'COBRADO'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_: any, row: Cheque) => (
        <div className="flex space-x-2">
          {canMarkAsPaid(row) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleMarkAsPaid(row.id)}
              title="Marcar como cobrado"
            >
              <DollarSign className="h-4 w-4" />
            </Button>
          )}
          {row.estado === 'PENDIENTE' && !canMarkAsPaid(row) && (
            <Button
              size="sm"
              variant="ghost"
              disabled
              title="No se puede cobrar: fecha de vencimiento futura"
              className="opacity-50 cursor-not-allowed"
            >
              <DollarSign className="h-4 w-4" />
            </Button>
          )}
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
          <FileText className="h-8 w-8 mr-3" />
          Cheques
        </h1>
        <p className="text-gray-600">Gestión de cheques emitidos</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Lista de Cheques</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExport} isLoading={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar Excel'}
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cheque
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* Fila 1: Búsqueda y Estado */}
            <div className="flex items-center space-x-4">
              
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por número, beneficiario o concepto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && searchTerm !== debouncedSearchTerm && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                  </div>
                )}
    
              <Select
                placeholder="Filtrar por estado"
                options={[
                  { value: '', label: 'Todos los estados' },
                  { value: 'PENDIENTE', label: 'Pendiente' },
                  { value: 'COBRADO', label: 'Cobrado' },
                  { value: 'ANULADO', label: 'Anulado' },
                ]}
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
              />

              <Select
                placeholder="Filtrar por banco"
                options={[
                  { value: '', label: 'Todos los bancos' },
                  ...(bancosData?.data || []).map((banco: any) => ({
                    value: banco.id.toString(),
                    label: banco.nombre,
                  })),
                ]}
                value={bancoFilter}
                onChange={(e) => setBancoFilter(e.target.value)}
              />
            </div>
            
            {/* Fila 2: Filtros de fecha de vencimiento y Total */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Vence desde:</label>
                  <Input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => {
                      setFechaDesde(e.target.value);
                    }}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Vence hasta:</label>
                  <Input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => {
                      setFechaHasta(e.target.value);
                    }}
                    className="w-40"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFechaDesde('');
                    setFechaHasta('');
                  }}
                  className="whitespace-nowrap"
                >
                  Limpiar fechas
                </Button>
              </div>

              {/* Indicadores de totales */}
              {data && (
                <div className="flex space-x-3">
                  {/* Si tenemos totales del backend, usarlos; sino calcular de la página actual */}
                  {data.totales ? (
                    <>
                      {/* Total General */}
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
                        <div className="text-center">
                          <div className="text-xs font-medium opacity-90">Total ({data.total} cheques)</div>
                          <div className="text-lg font-bold">{formatCurrency(data.totales.total)}</div>
                        </div>
                      </div>

                      {/* Pendientes */}
                      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg">
                        <div className="text-center">
                          <div className="text-xs font-medium opacity-90">Pendiente</div>
                          <div className="text-lg font-bold">{formatCurrency(data.totales.pendiente)}</div>
                        </div>
                      </div>

                      {/* Cobrados */}
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
                        <div className="text-center">
                          <div className="text-xs font-medium opacity-90">Cobrado</div>
                          <div className="text-lg font-bold">{formatCurrency(data.totales.cobrado)}</div>
                        </div>
                      </div>

                      {/* Anulados (solo si hay) */}
                      {data.totales.anulado > 0 && (
                        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
                          <div className="text-center">
                            <div className="text-xs font-medium opacity-90">Anulado</div>
                            <div className="text-lg font-bold">{formatCurrency(data.totales.anulado)}</div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Fallback: calcular de la página actual */}
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
                        <div className="text-center">
                          <div className="text-xs font-medium opacity-90">Total ({data.total} cheques)</div>
                          <div className="text-lg font-bold">
                            {formatCurrency(data.data.reduce((sum: number, cheque: Cheque) => sum + Number(cheque.monto), 0))}
                          </div>
                          <div className="text-xs opacity-75">*Solo página actual</div>
                        </div>
                      </div>

                      {/* Pendientes de la página */}
                      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg">
                        <div className="text-center">
                          <div className="text-xs font-medium opacity-90">Pendiente</div>
                          <div className="text-lg font-bold">
                            {formatCurrency(data.data.filter(c => c.estado === 'PENDIENTE').reduce((sum: number, cheque: Cheque) => sum + Number(cheque.monto), 0))}
                          </div>
                          <div className="text-xs opacity-75">*Solo página actual</div>
                        </div>
                      </div>

                      {/* Cobrados de la página */}
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
                        <div className="text-center">
                          <div className="text-xs font-medium opacity-90">Cobrado</div>
                          <div className="text-lg font-bold">
                            {formatCurrency(data.data.filter(c => c.estado === 'COBRADO').reduce((sum: number, cheque: Cheque) => sum + Number(cheque.monto), 0))}
                          </div>
                          <div className="text-xs opacity-75">*Solo página actual</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table
            data={data?.data || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No se encontraron cheques"
          />
          
          {/* Paginación */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Mostrando {((page - 1) * 10) + 1} - {Math.min(page * 10, data.total)} de {data.total} cheques
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
                <span className="flex items-center px-3 py-1 text-sm">
                  Página {page} de {data.totalPages}
                </span>
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
          setEditingCheque(null);
          reset();
        }}
        title={editingCheque ? 'Editar Cheque' : 'Nuevo Cheque'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Número"
              placeholder="Ej: 12345678"
              error={errors.numero?.message}
              {...register('numero')}
            />
            
            <Select
              label="Chequera"
              placeholder="Seleccionar chequera"
              options={chequerasData?.map(chequera => ({
                value: chequera.id,
                label: `${chequera.numero} - ${chequera.banco?.nombre}`
              })) || []}
              error={errors.chequeraId?.message}
              {...register('chequeraId', { valueAsNumber: true })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha Emisión"
              type="date"
              error={errors.fechaEmision?.message}
              {...register('fechaEmision')}
            />
            
            <Input
              label="Fecha Vencimiento"
              type="date"
              error={errors.fechaVencimiento?.message}
              {...register('fechaVencimiento')}
            />
          </div>
          
          <Input
            label="Monto"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.monto?.message}
            {...register('monto', { valueAsNumber: true })}
          />
          
          <Input
            label="Beneficiario"
            placeholder="Nombre del beneficiario"
            error={errors.beneficiario?.message}
            {...register('beneficiario')}
          />
          
          <Input
            label="Concepto"
            placeholder="Concepto del pago"
            error={errors.concepto?.message}
            {...register('concepto')}
          />
          
          <Select
            label="Estado"
            options={[
              { value: 'PENDIENTE', label: 'Pendiente' },
              { value: 'COBRADO', label: 'Cobrado' },
              { value: 'ANULADO', label: 'Anulado' },
            ]}
            error={errors.estado?.message}
            {...register('estado')}
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingCheque ? 'Actualizar' : 'Crear'}
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
        isLoading={deleteMutation.isPending || markAsPaidMutation.isPending}
      />
    </div>
  );
};

export default ChequesPage;