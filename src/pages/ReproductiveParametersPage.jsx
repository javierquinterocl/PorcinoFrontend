import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { reproductiveDataService } from "@/services/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return num.toFixed(decimals);
};

const getStatusColor = (value, target, isLowerBetter = false) => {
  if (value === null || value === undefined || value === "") return "secondary";
  
  const diff = value - target;
  if (isLowerBetter) {
    return diff <= 0 ? "default" : "destructive";
  } else {
    return diff >= 0 ? "default" : "destructive";
  }
};

const getStatusIcon = (value, target, isLowerBetter = false) => {
  if (value === null || value === undefined || value === "") return null;
  
  const diff = value - target;
  if (isLowerBetter) {
    if (diff <= 0) return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <TrendingUp className="h-4 w-4 text-red-600" />;
  } else {
    if (diff >= 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  }
};

export default function ReproductiveParametersPage() {
  const { toast } = useToast();
  const [params, setParams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("individual");

  const loadParameters = async () => {
    try {
      setLoading(true);
      const data = await reproductiveDataService.getReproductiveParameters();
      setParams(data);
    } catch (error) {
      console.error("Error cargando parámetros:", error);
      toast({
        title: "Error",
        description: error?.message || "No fue posible cargar los parámetros reproductivos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParameters();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!params) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-gray-500">No hay datos disponibles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-[#6b7c45]" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parámetros Reproductivos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Visualiza indicadores clave de producción reproductiva calculados automáticamente.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-100">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "individual" ? "default" : "ghost"}
              onClick={() => setActiveTab("individual")}
              className={cn(
                activeTab === "individual" && "bg-[#6b7c45] text-white hover:bg-[#5a6b35]"
              )}
            >
              Parámetros Individuales
            </Button>
            <Button
              variant={activeTab === "farm" ? "default" : "ghost"}
              onClick={() => setActiveTab("farm")}
              className={cn(
                activeTab === "farm" && "bg-[#6b7c45] text-white hover:bg-[#5a6b35]"
              )}
            >
              Parámetros de Granja
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {activeTab === "individual" && (
            <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parámetros Reproductivos por Cerda</CardTitle>
              <CardDescription>
                Indicadores calculados automáticamente para cada cerda reproductora activa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {params.individual.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-gray-500">
                  No hay cerdas con registros reproductivos suficientes para calcular parámetros.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cerda</TableHead>
                        <TableHead>IEP (días)</TableHead>
                        <TableHead>Partos/año</TableHead>
                        <TableHead>NV promedio</TableHead>
                        <TableHead>Destetados promedio</TableHead>
                        <TableHead>Destetados/año</TableHead>
                        <TableHead>DNP</TableHead>
                        <TableHead>Mortalidad (%)</TableHead>
                        <TableHead>Peso destete (kg)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {params.individual.map((param) => (
                        <TableRow key={param.sowId}>
                          <TableCell className="font-medium">
                            {param.pigId} - {param.name}
                          </TableCell>
                          <TableCell>
                            {param.iep ? (
                              <Badge variant={getStatusColor(param.iep, 150, true)}>
                                {param.iep} días
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {param.birthsPerYear ? (
                              <div className="flex items-center gap-2">
                                {getStatusIcon(param.birthsPerYear, 2.4)}
                                <span>{formatNumber(param.birthsPerYear)}</span>
                                <span className="text-xs text-gray-500">(objetivo: 2.4-2.5)</span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {param.bornAliveAvg ? (
                              <div className="flex items-center gap-2">
                                {getStatusIcon(param.bornAliveAvg, 11)}
                                <span>{formatNumber(param.bornAliveAvg)}</span>
                                <span className="text-xs text-gray-500">(objetivo: 11-13)</span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {param.weanedAvg ? (
                              <div className="flex items-center gap-2">
                                {getStatusIcon(param.weanedAvg, 9)}
                                <span>{formatNumber(param.weanedAvg)}</span>
                                <span className="text-xs text-gray-500">(objetivo: 9-10)</span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {param.weanedPerYear ? (
                              <div className="flex items-center gap-2">
                                {getStatusIcon(param.weanedPerYear, 22)}
                                <span>{formatNumber(param.weanedPerYear)}</span>
                                <span className="text-xs text-gray-500">(objetivo: 20-25)</span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {param.dnp !== null ? (
                              <Badge variant={getStatusColor(param.dnp, 40, true)}>
                                {param.dnp} días (objetivo: ≤40)
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={param.mortalityRate > 15 ? "destructive" : "default"}>
                              {formatNumber(param.mortalityRate)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatNumber(param.avgWeaningWeight)} kg
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          )}

          {activeTab === "farm" && (
            <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tasa de Fertilidad</CardTitle>
                <CardDescription>Porcentaje de servicios que resultan en preñez</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(params.farm.fertilityRate, 87)}
                    <span className="text-3xl font-bold">{formatNumber(params.farm.fertilityRate)}%</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">Objetivo: 87-95%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tasa de Abortos</CardTitle>
                <CardDescription>Porcentaje de cerdas que abortan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(params.farm.abortionRate, 3, true)}
                    <span className="text-3xl font-bold">{formatNumber(params.farm.abortionRate)}%</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">Objetivo: &lt;2-4%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tasa de Repeticiones</CardTitle>
                <CardDescription>Porcentaje de servicios sin concepción</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(params.farm.repeatRate, 15, true)}
                    <span className="text-3xl font-bold">{formatNumber(params.farm.repeatRate)}%</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">Objetivo: &lt;15%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tasa de Anestros</CardTitle>
                <CardDescription>Porcentaje de cerdas sin celo post-destete</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(params.farm.anestrusRate, 7, true)}
                    <span className="text-3xl font-bold">{formatNumber(params.farm.anestrusRate)}%</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">Objetivo: &lt;7%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Índice de Partos</CardTitle>
                <CardDescription>Promedio de partos por cerda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">{formatNumber(params.farm.birthIndex)}</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">Total partos: {params.farm.totalFarrows}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen General</CardTitle>
                <CardDescription>Estadísticas generales de la granja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cerdas activas:</span>
                    <span className="font-medium">{params.farm.totalSows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Servicios totales:</span>
                    <span className="font-medium">{params.farm.totalServices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Partos registrados:</span>
                    <span className="font-medium">{params.farm.totalFarrows}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={loadParameters}
          className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Actualizar parámetros
        </button>
      </div>
    </div>
  );
}

