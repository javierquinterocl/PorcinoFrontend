import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { userService, pigService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { TrendingUp, TrendingDown, PiggyBank, Activity, Heart, AlertCircle, Baby } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSows: 0,
    activeSows: 0,
    pregnantSows: 0
  });
  const [sowStats, setSowStats] = useState({
    byBreed: {},
    byStatus: {},
    byReproductiveStatus: {},
    averageWeight: 0,
    totalParturitions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        // Cargar usuarios y cerdas
        const [users, sows] = await Promise.all([
          userService.getAllUsers().catch((err) => {
            console.log('Error loading users:', err);
            return [];
          }),
          pigService.getAllSows().catch((err) => {
            console.log('Error loading sows:', err);
            return [];
          })
        ]);

        // Calcular estadísticas de cerdas
        const activeSows = sows.filter(s => s.status === 'activa').length;
        const pregnantSows = sows.filter(s => s.reproductive_status === 'gestante').length;
        
        // Estadísticas por raza
        const breedCounts = {};
        sows.forEach(sow => {
          const breed = sow.breed || 'Sin especificar';
          breedCounts[breed] = (breedCounts[breed] || 0) + 1;
        });

        // Estadísticas por estado
        const statusCounts = {};
        sows.forEach(sow => {
          const status = sow.status || 'Sin especificar';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        // Estadísticas por estado reproductivo
        const reproductiveStatusCounts = {};
        sows.forEach(sow => {
          const repStatus = sow.reproductive_status || 'Sin especificar';
          reproductiveStatusCounts[repStatus] = (reproductiveStatusCounts[repStatus] || 0) + 1;
        });

        // Peso promedio (excluyendo nulos) - usar current_weight
        const sowsWithWeight = sows.filter(s => s.current_weight && s.current_weight > 0);
        const averageWeight = sowsWithWeight.length > 0 
          ? sowsWithWeight.reduce((sum, s) => sum + Number(s.current_weight), 0) / sowsWithWeight.length 
          : 0;

        // Total de partos - usar parity_count
        const totalParturitions = sows.reduce((sum, s) => sum + (Number(s.parity_count) || 0), 0);

        setStats({
          totalUsers: users?.length || 0,
          totalSows: sows?.length || 0,
          activeSows,
          pregnantSows
        });

        setSowStats({
          byBreed: breedCounts,
          byStatus: statusCounts,
          byReproductiveStatus: reproductiveStatusCounts,
          averageWeight: averageWeight,
          totalParturitions
        });

      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las estadísticas del dashboard"
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1a2e02] mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Bienvenido al sistema de gestión Granme, {user?.firstName || 'Usuario'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              Total Cerdas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600">
              {loading ? '...' : stats.totalSows}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Cerdas registradas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Cerdas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {loading ? '...' : stats.activeSows}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Estado activo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Cerdas Gestantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {loading ? '...' : stats.pregnantSows}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              En gestación
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {loading ? '...' : stats.totalUsers}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total registrados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Resumen de Estados</CardTitle>
            <CardDescription>Vista rápida del lote reproductor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-pink-600" />
                    Total de Cerdas
                  </p>
                  <p className="text-sm text-gray-500">Registradas en el sistema</p>
                </div>
                <span className="text-2xl font-bold text-pink-600">
                  {loading ? '...' : stats.totalSows}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    Cerdas Activas
                  </p>
                  <p className="text-sm text-gray-500">En producción</p>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {loading ? '...' : stats.activeSows}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4 text-purple-600" />
                    Cerdas Gestantes
                  </p>
                  <p className="text-sm text-gray-500">En período de gestación</p>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {loading ? '...' : stats.pregnantSows}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Indicadores Clave</CardTitle>
            <CardDescription>Métricas importantes del lote</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">Peso Promedio</p>
                  <p className="text-sm text-gray-500">De todas las cerdas</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : sowStats.averageWeight > 0 ? `${sowStats.averageWeight.toFixed(1)} kg` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">Total Partos</p>
                  <p className="text-sm text-gray-500">Partos registrados</p>
                </div>
                <span className="text-2xl font-bold text-orange-600">
                  {loading ? '...' : sowStats.totalParturitions}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">Promedio Partos/Cerda</p>
                  <p className="text-sm text-gray-500">Productividad reproductiva</p>
                </div>
                <span className="text-2xl font-bold text-teal-600">
                  {loading ? '...' : stats.totalSows > 0 ? (sowStats.totalParturitions / stats.totalSows).toFixed(2) : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas de ejemplo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Estadísticas por Estado Reproductivo</CardTitle>
            <CardDescription>Distribución de cerdas según su estado reproductivo</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-gray-500">Cargando estadísticas...</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(sowStats.byReproductiveStatus).length > 0 ? (
                  Object.entries(sowStats.byReproductiveStatus).map(([status, count]) => {
                    const percentage = stats.totalSows > 0 ? ((count / stats.totalSows) * 100).toFixed(1) : 0;
                    const statusColors = {
                      'Vacía': 'bg-gray-400',
                      'Gestante': 'bg-purple-500',
                      'Lactante': 'bg-blue-500',
                      'Destetada': 'bg-green-500',
                      'Pre-cubrición': 'bg-yellow-500'
                    };
                    const color = statusColors[status] || 'bg-gray-400';
                    
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{status}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{count} cerdas</span>
                            <span className="font-bold">{percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`${color} h-2.5 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">No hay datos disponibles</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Estadísticas por Estado General</CardTitle>
            <CardDescription>Distribución de cerdas según su estado general</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-gray-500">Cargando estadísticas...</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(sowStats.byStatus).length > 0 ? (
                  Object.entries(sowStats.byStatus).map(([status, count]) => {
                    const percentage = stats.totalSows > 0 ? ((count / stats.totalSows) * 100).toFixed(1) : 0;
                    const statusColors = {
                      'Activa': 'bg-green-500',
                      'Inactiva': 'bg-red-500',
                      'Descarte': 'bg-orange-500',
                      'Vendida': 'bg-blue-500'
                    };
                    const color = statusColors[status] || 'bg-gray-400';
                    
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{status}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{count} cerdas</span>
                            <span className="font-bold">{percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`${color} h-2.5 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">No hay datos disponibles</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Métricas de Producción</CardTitle>
            <CardDescription>Indicadores clave del lote reproductor</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-gray-500">Cargando métricas...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-pink-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Peso Promedio</p>
                    <p className="text-2xl font-bold text-pink-600">
                      {sowStats.averageWeight > 0 ? sowStats.averageWeight.toFixed(1) : '0'} kg
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-pink-600" />
                </div>
                
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total de Partos Registrados</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {sowStats.totalParturitions}
                    </p>
                  </div>
                  <Baby className="h-8 w-8 text-purple-600" />
                </div>

                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Promedio Partos/Cerda</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.totalSows > 0 ? (sowStats.totalParturitions / stats.totalSows).toFixed(2) : '0'}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Distribución de Cerdas por Raza</CardTitle>
            <CardDescription>Composición genética del lote reproductor</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-gray-500">Cargando distribución...</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(sowStats.byBreed).length > 0 ? (
                  Object.entries(sowStats.byBreed).map(([breed, count], index) => {
                    const percentage = stats.totalSows > 0 ? ((count / stats.totalSows) * 100).toFixed(1) : 0;
                    const colors = [
                      'bg-blue-500',
                      'bg-green-500',
                      'bg-yellow-500',
                      'bg-purple-500',
                      'bg-red-500',
                      'bg-indigo-500',
                      'bg-orange-500',
                      'bg-teal-500'
                    ];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={breed} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{breed}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{count} cerdas</span>
                            <span className="font-bold">{percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`${color} h-3 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">No hay datos disponibles</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}