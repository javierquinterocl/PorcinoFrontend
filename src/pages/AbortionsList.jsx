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
import { abortionService } from "@/services/api";
import { 
  Search, Eye, Edit2, Trash2, Plus, AlertCircle
} from "lucide-react";

const FETUS_STATES = [
  { value: "fresco", label: "Fresco" },
  { value: "autolisis", label: "Autolisis" },
  { value: "momificado", label: "Momificado" },
  { value: "mixto", label: "Mixto" },
];

const ABORTION_CAUSES_DB = [
  { value: "infecciosa", label: "Infecciosa" },
  { value: "nutricional", label: "Nutricional" },
  { value: "toxica", label: "Tóxica" },
  { value: "traumatica", label: "Traumática" },
  { value: "termica", label: "Térmica" },
  { value: "genetica", label: "Genética" },
  { value: "hormonal", label: "Hormonal" },
  { value: "desconocida", label: "Desconocida" },
];

const RECOVERY_STATUS = [
  { value: "completa", label: "Completa" },
  { value: "parcial", label: "Parcial" },
  { value: "descarte recomendado", label: "Descarte recomendado" },
];

export default function AbortionsList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [abortions, setAbortions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCause, setFilterCause] = useState("all");
  const [filterRecovery, setFilterRecovery] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Estados para modales
  const [viewDialog, setViewDialog] = useState({ open: false, abortion: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, abortion: null });

  // Cargar datos
  useEffect(() => {
    loadAbortions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAbortions = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await abortionService.getAllAbortions();
      setAbortions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando abortos:", error);
      const errorMessage = error.response?.data?.message || error.message || "No se pudieron cargar los abortos";
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
  const filteredAbortions = useMemo(() => {
    return abortions.filter(abortion => {
      const matchesSearch = 
        abortion.sow_ear_tag?.toLowerCase().includes(search.toLowerCase()) ||
        abortion.sow_alias?.toLowerCase().includes(search.toLowerCase()) ||
        abortion.specific_cause?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCause = !filterCause || filterCause === 'all' || abortion.probable_cause === filterCause;
      const matchesRecovery = !filterRecovery || filterRecovery === 'all' || abortion.recovery_status === filterRecovery;

      return matchesSearch && matchesCause && matchesRecovery;
    });
  }, [abortions, search, filterCause, filterRecovery]);

  const paginatedAbortions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAbortions.slice(start, start + pageSize);
  }, [filteredAbortions, page]);

  const totalPages = Math.ceil(filteredAbortions.length / pageSize);

  // Funciones de acciones
  const handleView = (abortion) => {
    setViewDialog({ open: true, abortion });
  };

  const handleEdit = (abortion) => {
    navigate(`/abortions/edit/${abortion.id}`);
  };

  const handleDelete = (abortion) => {
    setDeleteDialog({ open: true, abortion });
  };

  const confirmDelete = async () => {
    try {
      await abortionService.deleteAbortion(deleteDialog.abortion.id);
      toast({
        title: "Éxito",
        description: "Aborto eliminado correctamente",
        className: "bg-green-50 border-green-200"
      });
      setDeleteDialog({ open: false, abortion: null });
      loadAbortions();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo eliminar el aborto",
        variant: "destructive"
      });
    }
  };

  // Utilidades
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getCauseBadge = (cause) => {
    const colors = {
      'infecciosa': 'bg-red-100 text-red-800',
      'nutricional': 'bg-yellow-100 text-yellow-800',
      'toxica': 'bg-orange-100 text-orange-800',
      'traumatica': 'bg-purple-100 text-purple-800',
      'termica': 'bg-blue-100 text-blue-800',
      'genetica': 'bg-pink-100 text-pink-800',
      'hormonal': 'bg-indigo-100 text-indigo-800',
      'desconocida': 'bg-gray-100 text-gray-800'
    };
    const label = ABORTION_CAUSES_DB.find(c => c.value === cause)?.label || cause;
    return (
      <Badge className={colors[cause] || ''}>
        {label}
      </Badge>
    );
  };

  const getRecoveryBadge = (status) => {
    const colors = {
      'completa': 'bg-green-100 text-green-800',
      'parcial': 'bg-yellow-100 text-yellow-800',
      'descarte recomendado': 'bg-red-100 text-red-800'
    };
    const label = RECOVERY_STATUS.find(r => r.value === status)?.label || status;
    return status ? (
      <Badge className={colors[status] || ''}>
        {label}
      </Badge>
    ) : '-';
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
                Es posible que la tabla 'abortions' no exista en la base de datos. Por favor, ejecute el script DDL para crear las tablas necesarias.
              </p>
              <Button 
                onClick={loadAbortions}
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
          <AlertCircle className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold">Abortos</h1>
            <p className="text-muted-foreground">Gestión y registro de eventos de aborto</p>
          </div>
        </div>
        <Button 
          onClick={() => navigate("/abortions/register")}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Registrar Aborto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Abortos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{abortions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fetos Expulsados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {abortions.reduce((sum, a) => sum + (a.fetuses_expelled || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promedio Días Gestación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {abortions.length > 0 
                ? (abortions.reduce((sum, a) => sum + (a.gestation_days || 0), 0) / abortions.length).toFixed(1)
                : '0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Con Aislamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {abortions.filter(a => a.isolation_required).length}
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
                  placeholder="Buscar por cerda o causa específica..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Causa Probable</label>
              <Select value={filterCause} onValueChange={setFilterCause}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {ABORTION_CAUSES_DB.map(cause => (
                    <SelectItem key={cause.value} value={cause.value}>
                      {cause.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado de Recuperación</label>
              <Select value={filterRecovery} onValueChange={setFilterRecovery}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {RECOVERY_STATUS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
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
                  <TableHead>Fetos Expulsados</TableHead>
                  <TableHead>Estado Fetos</TableHead>
                  <TableHead>Causa Probable</TableHead>
                  <TableHead>Causa Específica</TableHead>
                  <TableHead>Estado Recuperación</TableHead>
                  <TableHead>Aislamiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : paginatedAbortions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No se encontraron abortos
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAbortions.map((abortion) => (
                    <TableRow key={abortion.id}>
                      <TableCell className="font-medium">#{abortion.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{abortion.sow_ear_tag || abortion.sow_id}</div>
                          {abortion.sow_alias && (
                            <div className="text-sm text-muted-foreground">{abortion.sow_alias}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(abortion.abortion_date)}</TableCell>
                      <TableCell className="text-center">{abortion.gestation_days || "-"}</TableCell>
                      <TableCell className="text-center">{abortion.fetuses_expelled || 0}</TableCell>
                      <TableCell>
                        {FETUS_STATES.find(f => f.value === abortion.fetus_condition)?.label || "-"}
                      </TableCell>
                      <TableCell>{getCauseBadge(abortion.probable_cause)}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">{abortion.specific_cause || "-"}</TableCell>
                      <TableCell>{getRecoveryBadge(abortion.recovery_status)}</TableCell>
                      <TableCell className="text-center">
                        {abortion.isolation_required ? (
                          <span className="text-yellow-600 font-semibold">Sí</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(abortion)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(abortion)}
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(abortion)}
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
                Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, filteredAbortions.length)} de {filteredAbortions.length} resultados
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
      <Dialog open={viewDialog.open} onOpenChange={(open) => !open && setViewDialog({ open: false, abortion: null })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Aborto</DialogTitle>
            <DialogDescription>Información completa del evento de aborto</DialogDescription>
          </DialogHeader>
          {viewDialog.abortion && (
            <div className="space-y-6">
              {/* Información General */}
              <div>
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">
                  Información General
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Cerda</label>
                    <p className="font-medium">{viewDialog.abortion.sow_ear_tag || viewDialog.abortion.sow_id}</p>
                    {viewDialog.abortion.sow_alias && (
                      <p className="text-sm text-muted-foreground">{viewDialog.abortion.sow_alias}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">ID del Aborto</label>
                    <p className="font-medium">#{viewDialog.abortion.id}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Fecha del Aborto</label>
                    <p className="font-medium">{formatDate(viewDialog.abortion.abortion_date)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Días de Gestación</label>
                    <p className="font-medium">{viewDialog.abortion.gestation_days} días</p>
                  </div>
                </div>
              </div>

              {/* Datos del Aborto */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="text-lg font-semibold mb-3 text-red-900">
                  Datos del Aborto
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Fetos Expulsados</label>
                    <p className="font-medium">{viewDialog.abortion.fetuses_expelled || 0}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Estado de los Fetos</label>
                    <p className="font-medium">
                      {FETUS_STATES.find(f => f.value === viewDialog.abortion.fetus_condition)?.label || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Causa del Aborto */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="text-lg font-semibold mb-3 text-orange-900">
                  Causa del Aborto
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Causa Probable</label>
                    <div className="mt-1">{getCauseBadge(viewDialog.abortion.probable_cause)}</div>
                  </div>
                  {viewDialog.abortion.specific_cause && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Causa Específica</label>
                      <p className="font-medium">{viewDialog.abortion.specific_cause}</p>
                    </div>
                  )}
                  {viewDialog.abortion.laboratory_test && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Prueba de Laboratorio</label>
                      <p className="font-medium">Sí</p>
                      {viewDialog.abortion.test_results && (
                        <p className="text-sm mt-1">{viewDialog.abortion.test_results}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Síntomas y Tratamiento */}
              {(viewDialog.abortion.symptoms || viewDialog.abortion.fever || viewDialog.abortion.vaginal_discharge || viewDialog.abortion.anorexia || viewDialog.abortion.treatment_applied) && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-900">
                    Síntomas y Tratamiento
                  </h3>
                  <div className="space-y-2">
                    {viewDialog.abortion.symptoms && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Síntomas</label>
                        <p className="font-medium whitespace-pre-wrap">{viewDialog.abortion.symptoms}</p>
                      </div>
                    )}
                    <div className="flex gap-4">
                      {viewDialog.abortion.fever && <Badge variant="outline">Fiebre</Badge>}
                      {viewDialog.abortion.vaginal_discharge && <Badge variant="outline">Descarga Vaginal</Badge>}
                      {viewDialog.abortion.anorexia && <Badge variant="outline">Anorexia</Badge>}
                    </div>
                    {viewDialog.abortion.treatment_applied && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Tratamiento Aplicado</label>
                        <p className="font-medium whitespace-pre-wrap">{viewDialog.abortion.treatment_applied}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Seguimiento */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold mb-3 text-green-900">
                  Seguimiento
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Estado de Recuperación</label>
                    <div className="mt-1">{getRecoveryBadge(viewDialog.abortion.recovery_status)}</div>
                  </div>
                  {viewDialog.abortion.return_to_service_date && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Fecha de Retorno a Servicio</label>
                      <p className="font-medium">{formatDate(viewDialog.abortion.return_to_service_date)}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Aislamiento Requerido</label>
                    <p className="font-medium">{viewDialog.abortion.isolation_required ? "Sí" : "No"}</p>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {viewDialog.abortion.notes && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="text-xs font-medium text-muted-foreground">Observaciones</label>
                  <p className="font-medium mt-2 whitespace-pre-wrap">{viewDialog.abortion.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDialog({ open: false, abortion: null })}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, abortion: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar este registro de aborto? Esta acción no se puede deshacer.
              <br /><br />
              <strong>Nota:</strong> Los abortos son registros históricos importantes. Considere si realmente necesita eliminarlo.
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.abortion && (
            <div className="py-4">
              <p className="text-sm">
                <strong>Cerda:</strong> {deleteDialog.abortion.sow_ear_tag || deleteDialog.abortion.sow_id}<br />
                <strong>Fecha:</strong> {formatDate(deleteDialog.abortion.abortion_date)}<br />
                <strong>Días de gestación:</strong> {deleteDialog.abortion.gestation_days}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, abortion: null })}
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

