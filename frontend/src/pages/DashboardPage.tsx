import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, 
  CreditCard, 
  FileText, 
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { bancoService } from '../services/bancoService';
import { chequeraService } from '../services/chequeraService';
import { chequeService } from '../services/chequeService';
import { formatCurrency } from '../lib/utils';

const DashboardPage: React.FC = () => {
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
              <button className="w-full text-left p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-primary-600 mr-3" />
                  <div>
                    <p className="font-medium text-primary-900">Agregar Banco</p>
                    <p className="text-sm text-primary-600">Registrar un nuevo banco</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-900">Nueva Chequera</p>
                    <p className="text-sm text-green-600">Crear una nueva chequera</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-purple-900">Emitir Cheque</p>
                    <p className="text-sm text-purple-600">Crear un nuevo cheque</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
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