import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { birthService } from "@/services/api";
import { 
  Search, Eye, Edit2, Trash2, Plus, Baby, 
  AlertCircle, TrendingUp, Activity, Heart
} from "lucide-react";

export default function BirthsList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [births, setBirths] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterBirthType, setFilterBirthType] = useState("all");
  const [filterSowCondition, setFilterSowCondition] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Estados para modales
  const [viewDialog, setViewDialog] = useState({ open: false, birth: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, birth: null });

  // Cargar datos
  useEffect(() => {
    loadBirths();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBirths = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await birthService.getAllBirths();
      setBirths(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando partos:", error);
      const errorMessage = error.response?.data?.message || error.message || "No se pudieron cargar los partos";
      setLoadError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar y paginar
  const filteredBirths = useMemo(() => {
    return births.filter(birth => {
      const matchesSearch = 
        birth.sow_ear_tag?.toLowerCase().includes(search.toLowerCase()) ||
        birth.sow_alias?.toLowerCase().includes(search.toLowerCase()) ||
        birth.boar_ear_tag?.toLowerCase().includes(search.toLowerCase()) ||
        birth.farm_name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesBirthType = !filterBirthType || filterBirthType === 'all' || birth.birth_type === filterBirthType;
      const matchesSowCondition = !filterSowCondition || filterSowCondition === 'all' || birth.sow_condition === filterSowCondition;

      return matchesSearch && matchesBirthType && matchesSowCondition;
    });
  }, [births, search, filterBirthType, filterSowCondition]);

  const paginatedBirths = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBirths.slice(start, start + pageSize);
  }, [filteredBirths, page]);

  const totalPages = Math.ceil(filteredBirths.length / pageSize);

  // Funciones de acciones
  const handleView = (birth) => {
    setViewDialog({ open: true, birth });
  };

  const handleEdit = (birth) => {
    navigate(`/births/edit/${birth.id}`);
  };

  const handleDelete = (birth) => {
    setDeleteDialog({ open: true, birth });
  };

  const confirmDelete = async () => {
    try {
      await birthService.deleteBirth(deleteDialog.birth.id);
      toast({
        title: "Éxito",
        description: "Parto eliminado correctamente",
        className: "bg-green-50 border-green-200"
      });
      setDeleteDialog({ open: false, birth: null });
      loadBirths();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo eliminar el parto",
        variant: "destructive"
      });
    }
  };

  // Utilidades
  const getBirthTypeBadge = (birthType) => {
    const variants = {
      'normal': 'default',
      'asistido': 'secondary',
      'distocico': 'destructive',
      'cesarea': 'outline'
    };
    const colors = {
      'normal': 'bg-green-100 text-green-800',
      'asistido': 'bg-blue-100 text-blue-800',
      'distocico': 'bg-orange-100 text-orange-800',
      'cesarea': 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[birthType] || ''}>
        {birthType}
      </Badge>
    );
  };

  const getSowConditionBadge = (condition) => {
    const colors = {
      'excelente': 'bg-green-100 text-green-800',
      'buena': 'bg-blue-100 text-blue-800',
      'regular': 'bg-yellow-100 text-yellow-800',
      'mala': 'bg-orange-100 text-orange-800',
      'critica': 'bg-red-100 text-red-800'
    };
    return condition ? (
      <Badge className={colors[condition] || ''}>
        {condition}
      </Badge>
    ) : '-';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  };

  const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined) return '-';
    return Number(num).toFixed(decimals);
  };

  return (
    <div>
      {/* Mensaje de error si no se puede cargar */}
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error al cargar datos</h3>
              <p className="text-red-700 mb-3">{loadError}</p>
              <p className="text-sm text-red-600 mb-4">
                Es posible que la tabla 'births' no exista en la base de datos. Por favor, ejecute el script DDL para crear las tablas necesarias.
              </p>
              <Button 
                onClick={loadBirths}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <Baby className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold">Partos</h1>
            <p className="text-muted-foreground">Gestión y registro de eventos de parto</p>
          </div>
        </div>
        <Button 
          onClick={() => navigate("/births/register")}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Registrar Parto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Partos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{births.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lechones Nacidos Vivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {births.reduce((sum, b) => sum + (b.born_alive || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promedio Nacidos Vivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {births.length > 0 
                ? (births.reduce((sum, b) => sum + (b.born_alive || 0), 0) / births.length).toFixed(1)
                : '0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Partos Problemáticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {births.filter(b => b.birth_type === 'distocico' || b.birth_type === 'cesarea' || b.assistance_required).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cerda, verraco o granja..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Parto</label>
              <Select value={filterBirthType} onValueChange={setFilterBirthType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="asistido">Asistido</SelectItem>
                  <SelectItem value="distocico">Distócico</SelectItem>
                  <SelectItem value="cesarea">Cesárea</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Condición de la Cerda</label>
              <Select value={filterSowCondition} onValueChange={setFilterSowCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="excelente">Excelente</SelectItem>
                  <SelectItem value="buena">Buena</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="mala">Mala</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cerda</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Días Gest.</TableHead>
                  <TableHead>Tipo Parto</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Vivos</TableHead>
                  <TableHead>Muertos</TableHead>
                  <TableHead>Momif.</TableHead>
                  <TableHead>Condición</TableHead>
                  <TableHead>Granja</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : paginatedBirths.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      No se encontraron partos
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBirths.map((birth) => (
                    <TableRow key={birth.id}>
                      <TableCell className="font-medium">#{birth.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{birth.sow_ear_tag}</div>
                          {birth.sow_alias && (
                            <div className="text-sm text-muted-foreground">{birth.sow_alias}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(birth.birth_date)}</TableCell>
                      <TableCell className="text-center">{birth.gestation_days}</TableCell>
                      <TableCell>{getBirthTypeBadge(birth.birth_type)}</TableCell>
                      <TableCell className="text-center font-semibold">{birth.total_born}</TableCell>
                      <TableCell className="text-center text-green-600 font-semibold">{birth.born_alive}</TableCell>
                      <TableCell className="text-center text-red-600">{birth.born_dead}</TableCell>
                      <TableCell className="text-center text-gray-600">{birth.mummified || 0}</TableCell>
                      <TableCell>{getSowConditionBadge(birth.sow_condition)}</TableCell>
                      <TableCell className="text-sm">{birth.farm_name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(birth)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(birth)}
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(birth)}
                            title="Eliminar"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, filteredBirths.length)} de {filteredBirths.length} resultados
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Ver Detalles */}
      <Dialog open={viewDialog.open} onOpenChange={(open) => !open && setViewDialog({ open: false, birth: null })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Parto</DialogTitle>
            <DialogDescription>Información completa del evento de parto</DialogDescription>
          </DialogHeader>
          {viewDialog.birth && (
            <div className="space-y-6">
              {/* Información General */}
              <div>
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">
                  Información General
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Cerda</label>
                    <p className="font-medium">{viewDialog.birth.sow_ear_tag}</p>
                    {viewDialog.birth.sow_alias && (
                      <p className="text-sm text-muted-foreground">{viewDialog.birth.sow_alias}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Verraco (Padre)</label>
                    <p className="font-medium">{viewDialog.birth.boar_ear_tag}</p>
                    {viewDialog.birth.boar_name && (
                      <p className="text-sm text-muted-foreground">{viewDialog.birth.boar_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Granja</label>
                    <p className="font-medium">{viewDialog.birth.farm_name || 'No especificada'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">ID del Parto</label>
                    <p className="font-medium">#{viewDialog.birth.id}</p>
                  </div>
                </div>
              </div>

              {/* Fechas y Tiempos */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold mb-3 text-blue-900">
                  Fechas y Tiempos del Parto
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Fecha del Parto</label>
                    <p className="font-medium">{formatDate(viewDialog.birth.birth_date)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Días de Gestación</label>
                    <p className="font-medium">{viewDialog.birth.gestation_days} días</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Hora de Inicio</label>
                    <p className="font-medium">{formatTime(viewDialog.birth.birth_start_time)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Hora de Fin</label>
                    <p className="font-medium">{formatTime(viewDialog.birth.birth_end_time)}</p>
                  </div>
                </div>
              </div>

              {/* Tipo de Parto y Asistencia */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold mb-3 text-purple-900">
                  Tipo de Parto y Asistencia
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Tipo de Parto</label>
                    <div className="mt-1">{getBirthTypeBadge(viewDialog.birth.birth_type)}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Asistencia Requerida</label>
                    <p className="font-medium">{viewDialog.birth.assistance_required ? 'Sí' : 'No'}</p>
                  </div>
                  {viewDialog.birth.veterinarian_name && (
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">Veterinario</label>
                      <p className="font-medium">{viewDialog.birth.veterinarian_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Estadísticas de la Camada */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold mb-3 text-green-900">
                  Estadísticas de la Camada
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Total Nacidos</label>
                    <p className="text-2xl font-bold">{viewDialog.birth.total_born}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Nacidos Vivos</label>
                    <p className="text-2xl font-bold text-green-600">{viewDialog.birth.born_alive}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Nacidos Muertos</label>
                    <p className="text-2xl font-bold text-red-600">{viewDialog.birth.born_dead}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Momificados</label>
                    <p className="text-2xl font-bold text-gray-600">{viewDialog.birth.mummified || 0}</p>
                  </div>
                  {viewDialog.birth.malformed > 0 && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Malformados</label>
                      <p className="text-2xl font-bold text-orange-600">{viewDialog.birth.malformed}</p>
                    </div>
                  )}
                  {viewDialog.birth.total_litter_weight && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Peso Total Camada</label>
                      <p className="font-medium">{formatNumber(viewDialog.birth.total_litter_weight, 2)} kg</p>
                    </div>
                  )}
                  {viewDialog.birth.avg_piglet_weight && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Peso Promedio Lechón</label>
                      <p className="font-medium">{formatNumber(viewDialog.birth.avg_piglet_weight, 2)} kg</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado de la Cerda Post-Parto */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold mb-3 text-yellow-900">
                  Estado de la Cerda Post-Parto
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Condición</label>
                    <div className="mt-1">{getSowConditionBadge(viewDialog.birth.sow_condition)}</div>
                  </div>
                  {viewDialog.birth.sow_temperature && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Temperatura</label>
                      <p className="font-medium">{formatNumber(viewDialog.birth.sow_temperature, 1)} °C</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tratamientos Aplicados */}
              {(viewDialog.birth.oxytocin_applied || viewDialog.birth.antibiotics_applied || viewDialog.birth.treatment_notes) && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="text-lg font-semibold mb-3 text-orange-900">
                    Tratamientos Aplicados
                  </h3>
                  <div className="space-y-2">
                    {viewDialog.birth.oxytocin_applied && (
                      <Badge variant="outline" className="mr-2">Oxitocina Aplicada</Badge>
                    )}
                    {viewDialog.birth.antibiotics_applied && (
                      <Badge variant="outline">Antibióticos Aplicados</Badge>
                    )}
                    {viewDialog.birth.treatment_notes && (
                      <div className="mt-3">
                        <label className="text-xs font-medium text-muted-foreground">Notas de Tratamiento</label>
                        <p className="font-medium mt-1 whitespace-pre-wrap">{viewDialog.birth.treatment_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lactancia */}
              {(viewDialog.birth.lactation_start_date || viewDialog.birth.expected_weaning_date) && (
                <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                  <h3 className="text-lg font-semibold mb-3 text-pink-900">
                    Información de Lactancia
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {viewDialog.birth.lactation_start_date && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Inicio de Lactancia</label>
                        <p className="font-medium">{formatDate(viewDialog.birth.lactation_start_date)}</p>
                      </div>
                    )}
                    {viewDialog.birth.expected_weaning_date && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Destete Esperado</label>
                        <p className="font-medium">{formatDate(viewDialog.birth.expected_weaning_date)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {viewDialog.birth.notes && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="text-xs font-medium text-muted-foreground">Observaciones</label>
                  <p className="font-medium mt-2 whitespace-pre-wrap">{viewDialog.birth.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDialog({ open: false, birth: null })}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, birth: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar este registro de parto? Esta acción no se puede deshacer.
              <br /><br />
              <strong>Nota:</strong> Los partos son registros históricos importantes. Considere si realmente necesita eliminarlo.
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.birth && (
            <div className="py-4">
              <p className="text-sm">
                <strong>Cerda:</strong> {deleteDialog.birth.sow_ear_tag}<br />
                <strong>Fecha:</strong> {formatDate(deleteDialog.birth.birth_date)}<br />
                <strong>Nacidos vivos:</strong> {deleteDialog.birth.born_alive}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, birth: null })}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
