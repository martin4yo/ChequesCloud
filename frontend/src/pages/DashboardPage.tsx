import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CreditCard,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { bancoService } from '../services/bancoService';
import { chequeraService } from '../services/chequeraService';
import { chequeService } from '../services/chequeService';
import { formatCurrency } from '../lib/utils';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [dayOffset, setDayOffset] = React.useState(0);

  // Fetch dashboard data
  const { data: bancosData } = useQuery({
    queryKey: ['bancos', { limit: 1 }],
    queryFn: () => bancoService.getBancos({ limit: 1 }),
  });

  const { data: chequerasData } = useQuery({
    queryKey: ['chequeras', { limit: 1 }],
    queryFn: () => chequeraService.getChequeras({ limit: 1 }),
  });

  const { data: chequesData } = useQuery({
    queryKey: ['cheques', { limit: 1 }],
    queryFn: () => chequeService.getCheques({ limit: 1 }),
  });

  const { data: chequesPendientes } = useQuery({
    queryKey: ['cheques', { estado: 'PENDIENTE', limit: 1 }],
    queryFn: () => chequeService.getCheques({ estado: 'PENDIENTE', limit: 1 }),
  });

  // Get date range for 7 days based on offset
  const baseDate = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
  const today = baseDate.toISOString().split('T')[0];
  const sevenDaysFromBase = new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Generate array of 7 days from base date
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
    const actualToday = new Date();
    const isActualToday = date.toDateString() === actualToday.toDateString();
    const isActualTomorrow = date.toDateString() === new Date(actualToday.getTime() + 24 * 60 * 60 * 1000).toDateString();

    return {
      dateString: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      isToday: isActualToday,
      isTomorrow: isActualTomorrow
    };
  });

  // Fetch expirations for the 7-day range
  const { data: expirationsNext7Days } = useQuery({
    queryKey: ['cheques', { fechaDesde: today, fechaHasta: sevenDaysFromBase, estado: 'PENDIENTE', dayOffset }],
    queryFn: () => chequeService.getCheques({
      fechaDesde: today,
      fechaHasta: sevenDaysFromBase,
      estado: 'PENDIENTE',
      limit: 500
    }),
  });

  // Type for grouped expirations by bank and date
  interface ExpirationsByBankAndDate {
    [bankName: string]: {
      [dateString: string]: {
        count: number;
        total: number;
      }
    }
  }

  // Navigate to cheques with date filter
  const handleNavigateToDate = (date: string) => {
    // With Prisma, no need for date adjustments
    navigate(`/cheques?fechaDesde=${date}&fechaHasta=${date}`);
  };

  // Navigate to cheques with date and bank filter
  const handleNavigateToBankAndDate = (date: string, bancoId?: string) => {
    const params = new URLSearchParams({
      fechaDesde: date,
      fechaHasta: date
    });

    if (bancoId) {
      params.append('bancoId', bancoId);
    }

    navigate(`/cheques?${params.toString()}`);
  };

  // Create a mapping of bank names to bank IDs
  const createBankNameToIdMap = (cheques: any[]) => {
    if (!cheques) return {};

    const bankMap: { [bankName: string]: string } = {};
    cheques.forEach((cheque: any) => {
      const bankName = cheque.chequera?.banco?.nombre || 'Sin banco';
      const bankId = cheque.chequera?.banco?.id;
      if (bankId && !bankMap[bankName]) {
        bankMap[bankName] = bankId.toString();
      }
    });
    return bankMap;
  };

  // Group expirations by bank and date
  const groupExpirationsByBankAndDate = (cheques: any[]): ExpirationsByBankAndDate => {
    if (!cheques) return {};

    return cheques.reduce((acc: ExpirationsByBankAndDate, cheque: any) => {
      const bankName = cheque.chequera?.banco?.nombre || 'Sin banco';
      // Normalize date format - with Prisma, no timezone compensation needed
      let dateString = cheque.fechaVencimiento;
      if (dateString && dateString.includes('T')) {
        dateString = dateString.split('T')[0]; // Remove time part if present
      }

      if (!acc[bankName]) {
        acc[bankName] = {};
      }

      if (!acc[bankName][dateString]) {
        acc[bankName][dateString] = {
          count: 0,
          total: 0
        };
      }

      acc[bankName][dateString].count += 1;
      acc[bankName][dateString].total += Number(cheque.monto);

      return acc;
    }, {});
  };

  const expirationsGrouped = groupExpirationsByBankAndDate(expirationsNext7Days?.data || []);
  const bankNameToIdMap = createBankNameToIdMap(expirationsNext7Days?.data || []);
  const allBanks = Object.keys(expirationsGrouped);

  // Calculate daily totals across all banks
  const calculateDailyTotals = () => {
    const dailyTotals: { [date: string]: { count: number; total: number } } = {};

    Object.values(expirationsGrouped).forEach((bankData: any) => {
      Object.entries(bankData).forEach(([date, dayData]: [string, any]) => {
        if (!dailyTotals[date]) {
          dailyTotals[date] = { count: 0, total: 0 };
        }
        dailyTotals[date].count += dayData.count;
        dailyTotals[date].total += dayData.total;
      });
    });

    return dailyTotals;
  };

  const dailyTotals = calculateDailyTotals();

  const stats = [
    {
      title: 'Total Bancos',
      value: bancosData?.total || 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Chequeras',
      value: chequerasData?.total || 0,
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Cheques',
      value: chequesData?.total || 0,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Cheques Pendientes',
      value: chequesPendientes?.total || 0,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen general del sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expirations by Bank */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Vencimientos por Banco - Próximos 7 Días
                {dayOffset !== 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({dayOffset > 0 ? `+${dayOffset}` : dayOffset} día{Math.abs(dayOffset) !== 1 ? 's' : ''})
                  </span>
                )}
              </CardTitle>

              {/* Navigation Controls */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDayOffset(prev => prev - 1)}
                  title="Ver días anteriores"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDayOffset(0)}
                  disabled={dayOffset === 0}
                  title="Volver a hoy"
                  className="px-3"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDayOffset(prev => prev + 1)}
                  title="Ver días siguientes"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-medium text-gray-900 min-w-[120px]">Banco</th>
                    {next7Days.map((day) => (
                      <th key={day.dateString} className="text-center py-3 px-3 font-medium text-gray-900 min-w-[110px]">
                        <div className="flex flex-col">
                          <span className={`text-xs ${day.isToday ? 'text-blue-600 font-bold' : day.isTomorrow ? 'text-green-600 font-semibold' : 'text-gray-600'}`}>
                            {day.dayName}
                          </span>
                          <span className={`text-sm ${day.isToday ? 'text-blue-600 font-bold' : day.isTomorrow ? 'text-green-600 font-semibold' : 'text-gray-900'}`}>
                            {day.displayDate}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allBanks.length > 0 ? allBanks.map((banco: string) => (
                    <tr key={banco} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium text-gray-900">{banco}</td>
                      {next7Days.map((day) => {
                        const dayData = expirationsGrouped[banco]?.[day.dateString];
                        return (
                          <td key={day.dateString} className="py-3 px-3 text-center">
                            {dayData ? (
                              <button
                                onClick={() => handleNavigateToBankAndDate(day.dateString, bankNameToIdMap[banco])}
                                className={`w-full transition-all duration-200 hover:scale-105 ${day.isToday ? 'bg-blue-50 border border-blue-200 rounded-lg p-1 hover:bg-blue-100' : day.isTomorrow ? 'bg-green-50 border border-green-200 rounded-lg p-1 hover:bg-green-100' : 'p-1 hover:bg-gray-100 rounded-lg'}`}
                                title={`Click para ver cheques de ${banco} que vencen el ${day.displayDate}`}
                              >
                                <div className={`text-sm font-medium ${day.isToday ? 'text-blue-900' : day.isTomorrow ? 'text-green-900' : 'text-gray-900'}`}>
                                  {dayData.count} cheque{dayData.count !== 1 ? 's' : ''}
                                </div>
                                <div className={`text-xs ${day.isToday ? 'text-blue-700' : day.isTomorrow ? 'text-green-700' : 'text-gray-600'}`}>
                                  {formatCurrency(dayData.total)}
                                </div>
                              </button>
                            ) : (
                              <span className="text-gray-300 text-sm">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )) : null}

                  {/* Fila de totales por día */}
                  {allBanks.length > 0 && (
                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                      <td className="py-3 px-3 font-bold text-gray-900">TOTAL</td>
                      {next7Days.map((day) => {
                        const dayData = dailyTotals[day.dateString];
                        return (
                          <td key={day.dateString} className="py-3 px-3 text-center">
                            {dayData ? (
                              <button
                                onClick={() => handleNavigateToDate(day.dateString)}
                                className={`w-full transition-all duration-200 hover:scale-105 ${day.isToday ? 'bg-blue-100 border border-blue-300 rounded-lg p-1 hover:bg-blue-200' : day.isTomorrow ? 'bg-green-100 border border-green-300 rounded-lg p-1 hover:bg-green-200' : 'p-1 hover:bg-gray-200 rounded-lg'}`}
                                title={`Click para ver todos los cheques que vencen el ${day.displayDate}`}
                              >
                                <div className={`text-sm font-bold ${day.isToday ? 'text-blue-900' : day.isTomorrow ? 'text-green-900' : 'text-gray-900'}`}>
                                  {dayData.count} cheque{dayData.count !== 1 ? 's' : ''}
                                </div>
                                <div className={`text-xs font-semibold ${day.isToday ? 'text-blue-800' : day.isTomorrow ? 'text-green-800' : 'text-gray-700'}`}>
                                  {formatCurrency(dayData.total)}
                                </div>
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm font-bold">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )}

                  {allBanks.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">
                        No hay cheques pendientes que venzan en los próximos 7 días
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cheques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Cheques Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chequesData?.data.length ? (
              <div className="space-y-4">
                {chequesData.data.slice(0, 5).map((cheque) => (
                  <div key={cheque.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">#{cheque.numero}</p>
                      <p className="text-sm text-gray-600">{cheque.beneficiario}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(cheque.monto)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        cheque.estado === 'PENDIENTE' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : cheque.estado === 'COBRADO'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cheque.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay cheques registrados</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/bancos')}
                className="w-full text-left p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-primary-600 mr-3" />
                  <div>
                    <p className="font-medium text-primary-900">Agregar Banco</p>
                    <p className="text-sm text-primary-600">Registrar un nuevo banco</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/chequeras')}
                className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-900">Nueva Chequera</p>
                    <p className="text-sm text-green-600">Crear una nueva chequera</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/cheques')}
                className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-purple-900">Emitir Cheque</p>
                    <p className="text-sm text-purple-600">Crear un nuevo cheque</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/cheques')}
                className="w-full text-left p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-orange-600 mr-3" />
                  <div>
                    <p className="font-medium text-orange-900">Exportar Datos</p>
                    <p className="text-sm text-orange-600">Descargar reporte en Excel</p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;