import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  BarChart3, 
  Download,
  FileText,
  Calendar,
  Activity,
  Baby,
  Heart,
  Users,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import { 
  sowService, 
  boarService,
  pigletService,
  reportService
} from "@/services/api";
import {
  CustomBarChart,
  CustomMultiBarChart,
  CustomPieChart,
  CustomLineChart,
  KPICard,
  StatCard,
  ProgressBar,
  CHART_COLORS
} from "@/components/charts/ChartComponents";
import {
  exportReproductorsToPDF,
  exportReproductorsToExcel,
  exportReproductiveDataToPDF,
  exportReproductiveDataToExcel,
  exportKPIsToPDF,
  exportKPIsToExcel
} from "@/utils/reportExportUtils";


export default function ReportsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reproductors");
  const [dateRange, setDateRange] = useState("all"); // Cambiado a "all" por defecto
  const [selectedSow, setSelectedSow] = useState(null);
  const [sows, setSows] = useState([]);

  // Estados para datos de reportes
  const [reproductorsData, setReproductorsData] = useState(null);
  const [reproductiveData, setReproductiveData] = useState(null);
  const [kpisData, setKpisData] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === "reproductors") {
      loadReproductorsData();
    } else if (activeTab === "reproductive") {
      loadReproductiveData();
    } else if (activeTab === "kpis") {
      loadKPIsData();
    }
  }, [activeTab, dateRange, selectedSow]);

  const loadInitialData = async () => {
    try {
      const sowsList = await sowService.getAllSows();
      setSows(sowsList.filter(s => s.status === 'activa'));
    } catch (error) {
      console.error("Error cargando datos iniciales:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos iniciales",
        variant: "destructive"
      });
    }
  };

  const getDateRangeParams = () => {
    // Si dateRange es 'all', no devolver parámetros de fecha (mostrar todos los registros)
    if (dateRange === 'all') {
      return {};
    }
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const loadReproductorsData = async () => {
    try {
      setLoading(true);
      const params = getDateRangeParams();
      const data = await reportService.getReproductorsStats(params);
      setReproductorsData(data);
    } catch (error) {
      console.error("Error cargando datos de reproductores:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas de reproductores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReproductiveData = async () => {
    try {
      setLoading(true);
      const params = {
        // Si hay cerda seleccionada, no aplicar filtro de fechas para ver todo su historial
        // Si no hay cerda, aplicar filtro de fechas según el selector (incluyendo "all" que no envía fechas)
        ...(selectedSow ? {} : getDateRangeParams()),
        ...(selectedSow ? { sowId: selectedSow } : {})
      };
      const data = await reportService.getReproductiveStats(params);
      setReproductiveData(data);
    } catch (error) {
      console.error("Error cargando datos reproductivos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas reproductivas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadKPIsData = async () => {
    try {
      setLoading(true);
      const params = {
        // Si hay cerda seleccionada, no aplicar filtro de fechas para ver todo su historial
        // Si no hay cerda, aplicar filtro de fechas según el selector (incluyendo "all" que no envía fechas)
        ...(selectedSow ? {} : getDateRangeParams()),
        ...(selectedSow ? { sowId: selectedSow } : {})
      };
      const data = await reportService.getProductivityKPIs(params);
      setKpisData(data);
    } catch (error) {
      console.error("Error cargando KPIs:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los KPIs productivos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    try {
      if (activeTab === "reproductors" && reproductorsData) {
        exportReproductorsToPDF(reproductorsData);
      } else if (activeTab === "reproductive" && reproductiveData) {
        const sowFilter = selectedSow ? sows.find(s => s.id === parseInt(selectedSow)) : null;
        exportReproductiveDataToPDF(reproductiveData, sowFilter);
      } else if (activeTab === "kpis" && kpisData) {
        const sowFilter = selectedSow ? sows.find(s => s.id === parseInt(selectedSow)) : null;
        exportKPIsToPDF(kpisData, sowFilter);
      }
      toast({
        title: "Exportación exitosa",
        description: "El reporte PDF se ha descargado correctamente"
      });
    } catch (error) {
      console.error("Error exportando PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte a PDF",
        variant: "destructive"
      });
    }
  };

  const handleExportExcel = () => {
    try {
      if (activeTab === "reproductors" && reproductorsData) {
        exportReproductorsToExcel(reproductorsData);
      } else if (activeTab === "reproductive" && reproductiveData) {
        const sowFilter = selectedSow ? sows.find(s => s.id === parseInt(selectedSow)) : null;
        exportReproductiveDataToExcel(reproductiveData, sowFilter);
      } else if (activeTab === "kpis" && kpisData) {
        const sowFilter = selectedSow ? sows.find(s => s.id === parseInt(selectedSow)) : null;
        exportKPIsToExcel(kpisData, sowFilter);
      }
      toast({
        title: "Exportación exitosa",
        description: "El reporte Excel se ha descargado correctamente"
      });
    } catch (error) {
      console.error("Error exportando Excel:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte a Excel",
        variant: "destructive"
      });
    }
  };

  if (loading && !reproductorsData && !reproductiveData && !kpisData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-[#6b7c45]" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reportes y Estadísticas</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Análisis completo de la producción y rendimiento de la granja
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <Select 
              value={dateRange} 
              onValueChange={setDateRange}
              disabled={selectedSow !== null && activeTab !== "reproductors"}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los registros</SelectItem>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
                <SelectItem value="180">Últimos 6 meses</SelectItem>
                <SelectItem value="365">Último año</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button variant="outline" className="gap-1 sm:gap-2 flex-1 sm:flex-none" onClick={handleExportPDF}>
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>

              <Button variant="outline" className="gap-1 sm:gap-2 flex-1 sm:flex-none" onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 h-auto">
            <TabsTrigger value="reproductors" className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Reproductores</span>
              <span className="sm:hidden">Reprod.</span>
            </TabsTrigger>
            <TabsTrigger value="reproductive" className="flex items-center justify-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Datos Reproductivos</span>
              <span className="sm:hidden">Datos</span>
            </TabsTrigger>
            <TabsTrigger value="kpis" className="flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">KPIs Productivos</span>
              <span className="sm:hidden">KPIs</span>
            </TabsTrigger>
          </TabsList>

          {/* PESTAÑA 1: REPRODUCTORES */}
          <TabsContent value="reproductors" className="space-y-6">
            {reproductorsData && (
              <ReproductorsTab data={reproductorsData} loading={loading} />
            )}
          </TabsContent>

          {/* PESTAÑA 2: DATOS REPRODUCTIVOS */}
          <TabsContent value="reproductive" className="space-y-6">
            {/* Filtro por cerda */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Seleccionar Cerda:</label>
                  <Select value={selectedSow || "all"} onValueChange={(value) => setSelectedSow(value === "all" ? null : value)}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Todas las cerdas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las cerdas</SelectItem>
                      {sows.map(sow => (
                        <SelectItem key={sow.id} value={sow.id.toString()}>
                          {sow.ear_tag} {sow.alias ? `- ${sow.alias}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {reproductiveData && (
              <ReproductiveTab data={reproductiveData} loading={loading} selectedSow={selectedSow} dateRange={dateRange} />
            )}
          </TabsContent>

          {/* PESTAÑA 3: KPIs PRODUCTIVOS */}
          <TabsContent value="kpis" className="space-y-6">
            {/* Filtro por cerda */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Seleccionar Cerda:</label>
                  <Select value={selectedSow || "all"} onValueChange={(value) => setSelectedSow(value === "all" ? null : value)}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Todas las cerdas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las cerdas</SelectItem>
                      {sows.map(sow => (
                        <SelectItem key={sow.id} value={sow.id.toString()}>
                          {sow.ear_tag} {sow.alias ? `- ${sow.alias}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {kpisData && (
              <KPIsTab data={kpisData} loading={loading} selectedSow={selectedSow} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: PESTAÑA DE REPRODUCTORES
// ============================================================================

function ReproductorsTab({ data, loading }) {
  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  const { sows, boars, piglets } = data;

  // Datos para gráficos de cerdas
  const sowsStatusData = [
    { name: 'Gestantes', value: sows.pregnant, color: CHART_COLORS.purple },
    { name: 'Lactantes', value: sows.lactating, color: CHART_COLORS.secondary },
    { name: 'En Celo', value: sows.inHeat || 0, color: CHART_COLORS.pink },
    { name: 'Vacías', value: sows.empty, color: CHART_COLORS.warning },
  ];

  const sowsGeneralData = [
    { name: 'Activas', value: sows.active, color: CHART_COLORS.success },
    { name: 'Descartadas', value: sows.discarded, color: CHART_COLORS.gray },
  ];

  const sowsDistributionData = [
    { category: 'Activas', cantidad: sows.active },
    { category: 'Gestantes', cantidad: sows.pregnant },
    { category: 'Lactantes', cantidad: sows.lactating },
    { category: 'Vacías', cantidad: sows.empty },
    { category: 'Descartadas', cantidad: sows.discarded },
  ];

  // Datos para gráficos de lechones
  const pigletsData = [
    { name: 'Machos', value: piglets.males || 0, color: CHART_COLORS.secondary },
    { name: 'Hembras', value: piglets.females || 0, color: CHART_COLORS.pink },
  ];

  return (
    <>
      {/* SECCIÓN: CERDAS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Activity className="h-6 w-6 text-pink-600" />
            Estadísticas de Cerdas
          </CardTitle>
          <CardDescription>
            Análisis completo del inventario y estado reproductivo de las cerdas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total de Cerdas"
              value={sows.total}
              icon={Activity}
              color="pink"
            />
            <StatCard
              title="Cerdas Activas"
              value={sows.active}
              icon={Activity}
              color="green"
              subtitle={`${((sows.active / Math.max(sows.total, 1)) * 100).toFixed(1)}% del total`}
            />
            <StatCard
              title="En Gestación"
              value={sows.pregnant}
              icon={Heart}
              color="purple"
              subtitle={`${((sows.pregnant / Math.max(sows.total, 1)) * 100).toFixed(1)}% del total`}
            />
            <StatCard
              title="Lactantes"
              value={sows.lactating}
              icon={Baby}
              color="blue"
              subtitle={`${((sows.lactating / Math.max(sows.total, 1)) * 100).toFixed(1)}% del total`}
            />
          </div>

          {/* Gráficos de cerdas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado Reproductivo</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomPieChart
                  data={sowsStatusData}
                  dataKey="value"
                  nameKey="name"
                  height={250}
                  colors={sowsStatusData.map(d => d.color)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado General</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomPieChart
                  data={sowsGeneralData}
                  dataKey="value"
                  nameKey="name"
                  height={250}
                  colors={sowsGeneralData.map(d => d.color)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de barras de distribución */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribución de Cerdas por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomBarChart
                data={sowsDistributionData}
                dataKey="cantidad"
                xKey="category"
                color={CHART_COLORS.primary}
                height={300}
              />
            </CardContent>
          </Card>

          {/* Detalles adicionales */}
          {sows.avgAge && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Indicadores Adicionales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{sows.avgAge.toFixed(1)}</p>
                    <p className="text-sm text-gray-600 mt-1">Edad Promedio (meses)</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">{sows.avgParities?.toFixed(1) || '0.0'}</p>
                    <p className="text-sm text-gray-600 mt-1">Número de Parto Promedio</p>
                  </div>
                  <div className="text-center p-4 bg-pink-50 rounded-lg">
                    <p className="text-3xl font-bold text-pink-600">{sows.avgBirthsPerSow?.toFixed(2) || '0.00'}</p>
                    <p className="text-sm text-gray-600 mt-1">Partos Reales por Cerda</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{sows.avgPigletsPerSow?.toFixed(1) || '0.0'}</p>
                    <p className="text-sm text-gray-600 mt-1">Lechones por Cerda</p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <p className="text-3xl font-bold text-indigo-600">{sows.firstParity || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Cerdas Primerizas</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-3xl font-bold text-orange-600">{sows.multiparous || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Cerdas Multíparas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN: VERRACOS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Estadísticas de Verracos
          </CardTitle>
          <CardDescription>
            Análisis del inventario y desempeño de verracos reproductores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{boars.total}</p>
              <p className="text-sm text-gray-600 mt-1">Total de Verracos</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{boars.active}</p>
              <p className="text-sm text-gray-600 mt-1">Verracos Activos</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{boars.totalServices || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Servicios Realizados</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">
                {boars.avgServicesPerBoar?.toFixed(1) || '0.0'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Servicios/Verraco</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN: LECHONES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Baby className="h-6 w-6 text-green-600" />
            Estadísticas de Lechones
          </CardTitle>
          <CardDescription>
            Análisis del inventario y desarrollo de lechones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total de Lechones"
              value={piglets.total || 0}
              icon={Baby}
              color="green"
            />
            <StatCard
              title="Lechones Machos"
              value={piglets.males || 0}
              icon={Baby}
              color="blue"
            />
            <StatCard
              title="Lechones Hembras"
              value={piglets.females || 0}
              icon={Baby}
              color="pink"
            />
            <StatCard
              title="Destetados"
              value={piglets.weaned || 0}
              icon={Baby}
              color="purple"
            />
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribución por Sexo</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomPieChart
                  data={pigletsData}
                  dataKey="value"
                  nameKey="name"
                  height={250}
                  colors={pigletsData.map(d => d.color)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Indicadores de Peso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">
                      {piglets.avgBirthWeight ? `${piglets.avgBirthWeight.toFixed(2)} kg` : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Peso Promedio al Nacer</p>
                    <p className="text-xs text-gray-500 mt-1">(Calculado desde partos)</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">
                      {piglets.avgCurrentWeight ? `${piglets.avgCurrentWeight.toFixed(2)} kg` : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Peso Promedio Actual</p>
                    <p className="text-xs text-gray-500 mt-1">(Lechones vivos)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estados adicionales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estados y Mortalidad de Lechones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{piglets.lactating || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Lactantes</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{piglets.weaned || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Destetados</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-3xl font-bold text-orange-600">{piglets.sold || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Vendidos</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{piglets.dead || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Muertos</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-600">{piglets.mummified || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Momificados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </>
  );
}

// ============================================================================
// COMPONENTE: PESTAÑA DE DATOS REPRODUCTIVOS
// ============================================================================

function ReproductiveTab({ data, loading, selectedSow, dateRange }) {
  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  const { heats, services, pregnancies, births, abortions } = data;

  // Datos para gráfico de flujo reproductivo
  const reproductiveFlowData = [
    { etapa: 'Celos', cantidad: heats.total || 0 },
    { etapa: 'Servicios', cantidad: services.total || 0 },
    { etapa: 'Gestaciones', cantidad: pregnancies.total || 0 },
    { etapa: 'Partos', cantidad: births.total || 0 },
    { etapa: 'Abortos', cantidad: abortions.total || 0 },
  ];

  // Datos para gráfico de servicios
  const servicesTypeData = [
    { name: 'Naturales', value: services.natural || 0, color: CHART_COLORS.success },
    { name: 'Artificiales', value: services.artificial || 0, color: CHART_COLORS.secondary },
  ];

  // Datos para gráfico de partos
  const birthsTypeData = [
    { name: 'Naturales', value: births.natural || 0, color: CHART_COLORS.success },
    { name: 'Asistidos', value: births.assisted || 0, color: CHART_COLORS.warning },
    { name: 'Complicados', value: births.complicated || 0, color: CHART_COLORS.danger },
  ];

  return (
    <>
      {/* Mensajes informativos sobre el filtrado */}
      {selectedSow ? (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <p className="text-sm text-blue-700">
              <strong>Mostrando historial completo</strong> de la cerda seleccionada (sin filtro de fechas)
            </p>
          </CardContent>
        </Card>
      ) : dateRange === 'all' ? (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-4">
            <p className="text-sm text-green-700">
              <strong>Mostrando todos los registros históricos</strong> sin filtro de fechas
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* SECCIÓN: CELOS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-600" />
            Detección de Celos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <p className="text-3xl font-bold text-pink-600">{heats.total || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Total Detectados</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{heats.pending || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Pendientes</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{heats.serviced || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Servidos</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">
                {heats.serviceRate?.toFixed(1) || '0.0'}%
              </p>
              <p className="text-sm text-gray-600 mt-1">Tasa de Servicio</p>
            </div>
          </div>

          {heats.avgInterval && (
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">
                {heats.avgInterval.toFixed(1)} días
              </p>
              <p className="text-sm text-gray-600 mt-1">Intervalo Promedio entre Celos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN: SERVICIOS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Activity className="h-6 w-6 text-purple-600" />
            Servicios de Monta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{services.total || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Total de Servicios</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{services.natural || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Naturales</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{services.artificial || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Inseminación Artificial</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">
                {services.successRate?.toFixed(1) || '0.0'}%
              </p>
              <p className="text-sm text-gray-600 mt-1">Tasa de Éxito</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tipo de Servicios</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomPieChart
                  data={servicesTypeData}
                  dataKey="value"
                  nameKey="name"
                  height={250}
                  colors={servicesTypeData.map(d => d.color)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Efectividad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ProgressBar
                    label="Servicios Exitosos"
                    value={services.successful || 0}
                    max={services.total || 1}
                    color="bg-green-600"
                  />
                  <div className="text-center p-4 bg-green-50 rounded-lg mt-4">
                    <p className="text-3xl font-bold text-green-600">
                      {services.successful || 0}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Servicios que resultaron en gestación</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN: GESTACIONES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Heart className="h-6 w-6 text-blue-600" />
            Gestaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{pregnancies.total || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Total</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{pregnancies.confirmed || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Confirmadas</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{pregnancies.active || 0}</p>
              <p className="text-sm text-gray-600 mt-1">En Curso</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-600">{pregnancies.completed || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Finalizadas</p>
            </div>
          </div>

          {pregnancies.avgDuration && (
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">
                {pregnancies.avgDuration.toFixed(1)} días
              </p>
              <p className="text-sm text-gray-600 mt-1">Duración Promedio</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN: PARTOS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Baby className="h-6 w-6 text-green-600" />
            Partos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{births.total || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Total de Partos</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{births.totalBornAlive || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Total Lechones Nacidos Vivos</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">
                {births.avgBornAlive?.toFixed(1) || '0.0'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Promedio Nacidos Vivos</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">
                {births.avgBornDead?.toFixed(1) || '0.0'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Promedio Nacidos Muertos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tipo de Partos</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomPieChart
                  data={birthsTypeData}
                  dataKey="value"
                  nameKey="name"
                  height={250}
                  colors={birthsTypeData.map(d => d.color)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mortalidad al Nacer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6">
                  <p className="text-5xl font-bold text-red-600">
                    {births.mortalityRate?.toFixed(1) || '0.0'}%
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Tasa de Mortalidad</p>
                  <p className="text-xs text-gray-500 mt-4">
                    Objetivo: Menos del 8%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flujo reproductivo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flujo del Proceso Reproductivo</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomBarChart
                data={reproductiveFlowData}
                dataKey="cantidad"
                xKey="etapa"
                color={CHART_COLORS.primary}
                height={300}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* SECCIÓN: ABORTOS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            Abortos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{abortions.total || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Total de Abortos</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{abortions.early || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Tempranos (&lt;60 días)</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{abortions.late || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Tardíos (&gt;60 días)</p>
            </div>
          </div>

          <div className="text-center p-6 bg-red-50 rounded-lg">
            <p className="text-5xl font-bold text-red-600">
              {abortions.rate?.toFixed(1) || '0.0'}%
            </p>
            <p className="text-sm text-gray-600 mt-2">Tasa de Abortos</p>
            <p className="text-xs text-gray-500 mt-4">
              Objetivo: Menos del 3%
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// ============================================================================
// COMPONENTE: PESTAÑA DE KPIs PRODUCTIVOS
// ============================================================================

function KPIsTab({ data, loading, selectedSow }) {
  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  // Calcular cumplimiento de objetivos
  const kpisMet = [
    data.fertilityRate >= 85,
    data.conceptionRate >= 90,
    data.farrowingRate >= 82,
    data.avgBornAlive >= 11,
    data.avgTotalBorn >= 12,
    data.avgWeaned >= 10,
    data.preWeaningMortality <= 12,
    data.birthMortality <= 8,
    data.abortionRate <= 3,
  ].filter(Boolean).length;

  const totalKPIs = 9;
  const complianceRate = (kpisMet / totalKPIs) * 100;

  return (
    <>
      {/* Mensaje si es filtrado */}
      {selectedSow && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <p className="text-sm text-blue-700">
              <strong>Mostrando historial completo</strong> de la cerda seleccionada (sin filtro de fechas)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resumen de Cumplimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Resumen de Cumplimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{totalKPIs}</p>
              <p className="text-sm text-gray-600 mt-1">KPIs Evaluados</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{kpisMet}</p>
              <p className="text-sm text-gray-600 mt-1">KPIs Cumplidos</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{totalKPIs - kpisMet}</p>
              <p className="text-sm text-gray-600 mt-1">KPIs Pendientes</p>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              complianceRate >= 80 ? 'bg-green-50' : complianceRate >= 60 ? 'bg-orange-50' : 'bg-red-50'
            }`}>
              <p className={`text-3xl font-bold ${
                complianceRate >= 80 ? 'text-green-600' : complianceRate >= 60 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {complianceRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">Tasa de Cumplimiento</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className={`text-2xl font-bold ${
              complianceRate >= 80 ? 'text-green-600' : complianceRate >= 60 ? 'text-orange-600' : 'text-red-600'
            }`}>
              {complianceRate >= 80 ? 'EXCELENTE' : complianceRate >= 60 ? 'BUENO' : 'REQUIERE MEJORA'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Indicadores Clave de Rendimiento</CardTitle>
          <CardDescription>Comparación con objetivos establecidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard
              title="Tasa de Fertilidad"
              value={data.fertilityRate?.toFixed(1) || '0.0'}
              target="85"
              unit="%"
              trend="up"
              met={data.fertilityRate >= 85}
            />
            <KPICard
              title="Tasa de Concepción"
              value={data.conceptionRate?.toFixed(1) || '0.0'}
              target="90"
              unit="%"
              trend="up"
              met={data.conceptionRate >= 90}
            />
            <KPICard
              title="Tasa de Partos"
              value={data.farrowingRate?.toFixed(1) || '0.0'}
              target="82"
              unit="%"
              trend="up"
              met={data.farrowingRate >= 82}
            />
            <KPICard
              title="Nacidos Vivos/Parto"
              value={data.avgBornAlive?.toFixed(2) || '0.00'}
              target="11"
              unit=""
              trend="up"
              met={data.avgBornAlive >= 11}
            />
            <KPICard
              title="Nacidos Totales/Parto"
              value={data.avgTotalBorn?.toFixed(2) || '0.00'}
              target="12"
              unit=""
              trend="up"
              met={data.avgTotalBorn >= 12}
            />
            <KPICard
              title="Destetados/Parto"
              value={data.avgWeaned?.toFixed(2) || '0.00'}
              target="10"
              unit=""
              trend="up"
              met={data.avgWeaned >= 10}
            />
            <KPICard
              title="Mortalidad Pre-Destete"
              value={data.preWeaningMortality?.toFixed(1) || '0.0'}
              target="12"
              unit="%"
              trend="down"
              met={data.preWeaningMortality <= 12}
            />
            <KPICard
              title="Mortalidad al Nacer"
              value={data.birthMortality?.toFixed(1) || '0.0'}
              target="8"
              unit="%"
              trend="down"
              met={data.birthMortality <= 8}
            />
            <KPICard
              title="Tasa de Abortos"
              value={data.abortionRate?.toFixed(1) || '0.0'}
              target="3"
              unit="%"
              trend="down"
              met={data.abortionRate <= 3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Indicadores Temporales */}
      {(data.weanToHeatInterval || data.farrowingInterval) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Indicadores Temporales</CardTitle>
            <CardDescription>Intervalos clave en el proceso productivo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.weanToHeatInterval && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">
                    {data.weanToHeatInterval.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Días Destete-Celo</p>
                  <p className="text-xs text-gray-500 mt-2">Objetivo: &le;7 días</p>
                </div>
              )}
              {data.weanToServiceInterval && (
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">
                    {data.weanToServiceInterval.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Días Destete-Servicio</p>
                  <p className="text-xs text-gray-500 mt-2">Objetivo: &le;10 días</p>
                </div>
              )}
              {data.farrowingInterval && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">
                    {data.farrowingInterval.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Días entre Partos</p>
                  <p className="text-xs text-gray-500 mt-2">Objetivo: &le;150 días</p>
                </div>
              )}
              {data.nonProductiveDays && (
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-3xl font-bold text-orange-600">
                    {data.nonProductiveDays.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Días No Productivos</p>
                  <p className="text-xs text-gray-500 mt-2">Objetivo: &le;30 días</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Productividad Anual */}
      {(data.farrowingsPerSowPerYear || data.pigletsPerSowPerYear || data.weanedPerSowPerYear) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Productividad Anual</CardTitle>
            <CardDescription>Indicadores de rendimiento proyectado a un año</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.farrowingsPerSowPerYear && (
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <p className="text-4xl font-bold text-blue-600">
                    {data.farrowingsPerSowPerYear.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Partos/Cerda/Año</p>
                  <p className="text-xs text-gray-500 mt-2">Objetivo: &ge;2.3</p>
                  {data.farrowingsPerSowPerYear >= 2.3 && (
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Objetivo Cumplido
                    </span>
                  )}
                </div>
              )}
              {data.pigletsPerSowPerYear && (
                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <p className="text-4xl font-bold text-purple-600">
                    {data.pigletsPerSowPerYear.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Lechones Nacidos Vivos/Cerda/Año</p>
                  <p className="text-xs text-gray-500 mt-2">Objetivo: &ge;25</p>
                  {data.pigletsPerSowPerYear >= 25 && (
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Objetivo Cumplido
                    </span>
                  )}
                </div>
              )}
              {data.weanedPerSowPerYear && (
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <p className="text-4xl font-bold text-green-600">
                    {data.weanedPerSowPerYear.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Lechones Destetados/Cerda/Año</p>
                  <p className="text-xs text-gray-500 mt-2">Objetivo: &ge;23</p>
                  {data.weanedPerSowPerYear >= 23 && (
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Objetivo Cumplido
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
