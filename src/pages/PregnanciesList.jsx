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
import { pregnancyService } from "@/services/api";
import { 
  Search, Eye, Edit2, Trash2, Plus, Heart, 
  Calendar, AlertCircle, CheckCircle2, Image as ImageIcon
} from "lucide-react";

export default function PregnanciesList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pregnancies, setPregnancies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterConfirmed, setFilterConfirmed] = useState("all");
  const [filterConfirmationMethod, setFilterConfirmationMethod] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Estados para modales
  const [viewDialog, setViewDialog] = useState({ open: false, pregnancy: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, pregnancy: null });
  const [statusDialog, setStatusDialog] = useState({ open: false, pregnancy: null, newStatus: "en curso", notes: "" });
  const [imageDialog, setImageDialog] = useState({ open: false, imageUrl: null });

  // Cargar datos
  useEffect(() => {
    loadPregnancies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPregnancies = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await pregnancyService.getAllPregnancies();
      setPregnancies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando gestaciones:", error);
      const errorMessage = error.response?.data?.message || error.message || "No se pudieron cargar las gestaciones";
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
  const filteredPregnancies = useMemo(() => {
    return pregnancies.filter(pregnancy => {
      const matchesSearch = 
        pregnancy.sow_ear_tag?.toLowerCase().includes(search.toLowerCase()) ||
        pregnancy.sow_alias?.toLowerCase().includes(search.toLowerCase()) ||
        pregnancy.farm_name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = !filterStatus || filterStatus === 'all' || pregnancy.status === filterStatus;
      const matchesConfirmed = !filterConfirmed || filterConfirmed === 'all' || 
        (filterConfirmed === 'confirmed' && pregnancy.confirmed) ||
        (filterConfirmed === 'unconfirmed' && !pregnancy.confirmed);
      const matchesMethod = !filterConfirmationMethod || filterConfirmationMethod === 'all' || 
        pregnancy.confirmation_method === filterConfirmationMethod;

      return matchesSearch && matchesStatus && matchesConfirmed && matchesMethod;
    });
  }, [pregnancies, search, filterStatus, filterConfirmed, filterConfirmationMethod]);

  const paginatedPregnancies = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPregnancies.slice(start, start + pageSize);
  }, [filteredPregnancies, page]);

  const totalPages = Math.ceil(filteredPregnancies.length / pageSize);

  // Funciones de acciones
  const handleView = (pregnancy) => {
    setViewDialog({ open: true, pregnancy });
  };

  const handleEdit = (pregnancy) => {
    // Solo permitir edición si no está finalizada
    if (pregnancy.status === 'finalizada parto' || pregnancy.status === 'finalizada aborto') {
      toast({
        title: "No permitido",
        description: `Las gestaciones con estado "${pregnancy.status}" no se pueden editar`,
        variant: "destructive"
      });
      return;
    }
    navigate(`/pregnancies/edit/${pregnancy.id}`);
  };

  const handleDelete = (pregnancy) => {
    if (pregnancy.status === 'finalizada parto' || pregnancy.status === 'finalizada aborto') {
      toast({
        title: "No permitido",
        description: `Las gestaciones con estado "${pregnancy.status}" no se pueden eliminar`,
        variant: "destructive"
      });
      return;
    }
    setDeleteDialog({ open: true, pregnancy });
  };

  const handleChangeStatus = (pregnancy) => {
    if (pregnancy.status === 'finalizada parto' || pregnancy.status === 'finalizada aborto') {
      toast({
        title: "No permitido",
        description: `El estado de una gestación "${pregnancy.status}" no se puede cambiar`,
        variant: "destructive"
      });
      return;
    }
    setStatusDialog({ open: true, pregnancy, newStatus: pregnancy.status || "en curso", notes: "" });
  };

  const handleViewImage = (imageUrl) => {
    setImageDialog({ open: true, imageUrl });
  };

  const confirmDelete = async () => {
    try {
      await pregnancyService.deletePregnancy(deleteDialog.pregnancy.id);
      toast({
        title: "Éxito",
        description: "Gestación eliminada correctamente",
        className: "bg-green-50 border-green-200"
      });
      setDeleteDialog({ open: false, pregnancy: null });
      loadPregnancies();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo eliminar la gestación",
        variant: "destructive"
      });
    }
  };

  const confirmStatusChange = async () => {
    try {
      await pregnancyService.updatePregnancyStatus(
        statusDialog.pregnancy.id,
        statusDialog.newStatus,
        statusDialog.notes || null
      );
      toast({
        title: "Éxito",
        description: "Estado actualizado correctamente",
        className: "bg-green-50 border-green-200"
      });
      setStatusDialog({ open: false, pregnancy: null, newStatus: "", notes: "" });
      loadPregnancies();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  // Utilidades
  const getStatusBadge = (status) => {
    // Si el status está vacío o es inválido, mostrar un badge de error
    if (!status || status.trim() === '') {
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-700">
          Sin estado
        </Badge>
      );
    }

    // Mapeo de estilos personalizados para cada estado
    const statusStyles = {
      'en curso': {
        variant: 'default',
        className: 'bg-blue-100 text-blue-800 border-blue-300'
      },
      'finalizada parto': {
        variant: 'secondary',
        className: 'bg-green-100 text-green-800 border-green-300'
      },
      'finalizada aborto': {
        variant: 'destructive',
        className: 'bg-red-100 text-red-800 border-red-300 font-medium'
      },
      'no confirmada': {
        variant: 'outline',
        className: 'bg-gray-100 text-gray-800 border-gray-300'
      }
    };
    
    const style = statusStyles[status] || { variant: 'default', className: '' };
    
    return (
      <Badge variant={style.variant} className={`whitespace-nowrap ${style.className}`}>
        {status}
      </Badge>
    );
  };

  const getConfirmedBadge = (confirmed) => {
    return confirmed ? (
      <Badge className="bg-green-100 text-green-800">Confirmada</Badge>
    ) : (
      <Badge variant="outline">Pendiente</Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const calculateDaysUntilFarrowing = (expectedDate) => {
    if (!expectedDate) return null;
    const today = new Date();
    const farrowing = new Date(expectedDate);
    const diffTime = farrowing - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysUntilBadge = (days) => {
    if (days === null) return null;
    if (days < 0) {
      return <Badge variant="destructive">Vencida ({Math.abs(days)}d)</Badge>;
    } else if (days <= 7) {
      return <Badge className="bg-orange-100 text-orange-800">Próxima ({days}d)</Badge>;
    } else {
      return <Badge variant="outline">{days} días</Badge>;
    }
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
                Es posible que la tabla 'pregnancies' no exista en la base de datos. Por favor, ejecute el script DDL para crear las tablas necesarias.
              </p>
              <Button 
                onClick={loadPregnancies}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-pink-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Gestaciones/Preñeces</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Gestión de gestaciones y seguimiento de preñez</p>
          </div>
        </div>
        <Button 
          onClick={() => navigate("/pregnancies/register")}
          className="bg-pink-600 hover:bg-pink-700 w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Registrar Gestación</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gestaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pregnancies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {pregnancies.filter(p => p.status === 'en curso').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {pregnancies.filter(p => p.confirmed).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Finalizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {pregnancies.filter(p => p.status === 'finalizada parto').length}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cerda o granja..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="en curso">En Curso</SelectItem>
                  <SelectItem value="finalizada parto">Finalizada Parto</SelectItem>
                  <SelectItem value="finalizada aborto">Finalizada Aborto</SelectItem>
                  <SelectItem value="no confirmada">No Confirmada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmación</label>
              <Select value={filterConfirmed} onValueChange={setFilterConfirmed}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="unconfirmed">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Método</label>
              <Select value={filterConfirmationMethod} onValueChange={setFilterConfirmationMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ultrasonido">Ultrasonido</SelectItem>
                  <SelectItem value="no repeticion celo">No Repetición Celo</SelectItem>
                  <SelectItem value="palpacion">Palpación</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
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
                  <TableHead>Concepción</TableHead>
                  <TableHead>Parto Esperado</TableHead>
                  <TableHead>Días</TableHead>
                  <TableHead>Confirmada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Lechones Est.</TableHead>
                  <TableHead>Ecografías</TableHead>
                  <TableHead>Granja</TableHead>
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
                ) : paginatedPregnancies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No se encontraron gestaciones
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPregnancies.map((pregnancy) => (
                    <TableRow key={pregnancy.id}>
                      <TableCell className="font-medium">#{pregnancy.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{pregnancy.sow_ear_tag}</div>
                          {pregnancy.sow_alias && (
                            <div className="text-sm text-muted-foreground">{pregnancy.sow_alias}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(pregnancy.conception_date)}</TableCell>
                      <TableCell>{formatDate(pregnancy.expected_farrowing_date)}</TableCell>
                      <TableCell>
                        {pregnancy.status === 'en curso' 
                          ? getDaysUntilBadge(calculateDaysUntilFarrowing(pregnancy.expected_farrowing_date))
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{getConfirmedBadge(pregnancy.confirmed)}</TableCell>
                      <TableCell>{getStatusBadge(pregnancy.status)}</TableCell>
                      <TableCell className="text-center">
                        {pregnancy.estimated_piglets || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span>{pregnancy.ultrasound_count || 0}</span>
                          {pregnancy.ultrasound_image_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleViewImage(pregnancy.ultrasound_image_url)}
                              title="Ver imagen"
                            >
                              <ImageIcon className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{pregnancy.farm_name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleView(pregnancy)}
                            title="Ver detalles"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {pregnancy.status !== 'finalizada parto' && pregnancy.status !== 'finalizada aborto' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEdit(pregnancy)}
                                title="Editar"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(pregnancy)}
                                title="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleChangeStatus(pregnancy)}
                                title="Cambiar estado"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
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
                Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, filteredPregnancies.length)} de {filteredPregnancies.length} resultados
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
      <Dialog open={viewDialog.open} onOpenChange={(open) => !open && setViewDialog({ open: false, pregnancy: null })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Gestación</DialogTitle>
            <DialogDescription>Información completa del evento</DialogDescription>
          </DialogHeader>
          {viewDialog.pregnancy && (
            <div className="space-y-6">
              {/* Información General */}
              <div>
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Información General</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Cerda</label>
                    <p className="font-medium">{viewDialog.pregnancy.sow_ear_tag}</p>
                    {viewDialog.pregnancy.sow_alias && (
                      <p className="text-sm text-muted-foreground">{viewDialog.pregnancy.sow_alias}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Estado</label>
                    <div className="mt-1">{getStatusBadge(viewDialog.pregnancy.status)}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Granja</label>
                    <p className="font-medium">{viewDialog.pregnancy.farm_name || 'No especificada'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">ID de Gestación</label>
                    <p className="font-medium">#{viewDialog.pregnancy.id}</p>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold mb-3 text-blue-900">Fechas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Fecha de Concepción</label>
                    <p className="font-medium">{formatDate(viewDialog.pregnancy.conception_date)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Parto Esperado</label>
                    <p className="font-medium">{formatDate(viewDialog.pregnancy.expected_farrowing_date)}</p>
                  </div>
                  {viewDialog.pregnancy.status === 'en curso' && (
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">Días hasta Parto</label>
                      <div className="mt-1">
                        {getDaysUntilBadge(calculateDaysUntilFarrowing(viewDialog.pregnancy.expected_farrowing_date))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirmación de Preñez */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold mb-3 text-purple-900">Confirmación de Preñez</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Estado de Confirmación</label>
                    <div className="mt-1">{getConfirmedBadge(viewDialog.pregnancy.confirmed)}</div>
                  </div>
                  {viewDialog.pregnancy.confirmed && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Fecha de Confirmación</label>
                        <p className="font-medium">{formatDate(viewDialog.pregnancy.confirmation_date)}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-muted-foreground">Método de Confirmación</label>
                        <p className="font-medium capitalize">{viewDialog.pregnancy.confirmation_method}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Seguimiento */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold mb-3 text-green-900">Seguimiento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Número de Ecografías</label>
                    <p className="font-medium">{viewDialog.pregnancy.ultrasound_count || 0}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Última Ecografía</label>
                    <p className="font-medium">{viewDialog.pregnancy.last_ultrasound_date ? formatDate(viewDialog.pregnancy.last_ultrasound_date) : 'No registrada'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Lechones Estimados</label>
                    <p className="font-medium">{viewDialog.pregnancy.estimated_piglets || 'No estimado'}</p>
                  </div>
                </div>
              </div>

              {/* Imagen de Ecografía */}
              {viewDialog.pregnancy.ultrasound_image_url && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-3">Imagen de Ecografía</h3>
                  <div className="border rounded-lg p-2 bg-white">
                    <img 
                      src={viewDialog.pregnancy.ultrasound_image_url} 
                      alt="Ecografía" 
                      className="w-full max-h-64 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleViewImage(viewDialog.pregnancy.ultrasound_image_url)}
                    />
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {viewDialog.pregnancy.notes && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="text-xs font-medium text-muted-foreground">Observaciones</label>
                  <p className="font-medium mt-2 whitespace-pre-wrap">{viewDialog.pregnancy.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDialog({ open: false, pregnancy: null })}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, pregnancy: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar esta gestación? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.pregnancy && (
            <div className="py-4">
              <p className="text-sm">
                <strong>Cerda:</strong> {deleteDialog.pregnancy.sow_ear_tag}<br />
                <strong>Concepción:</strong> {formatDate(deleteDialog.pregnancy.conception_date)}<br />
                <strong>Parto Esperado:</strong> {formatDate(deleteDialog.pregnancy.expected_farrowing_date)}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, pregnancy: null })}
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

      {/* Dialog Cambiar Estado */}
      <Dialog open={statusDialog.open} onOpenChange={(open) => !open && setStatusDialog({ open: false, pregnancy: null, newStatus: "en curso", notes: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Estado de la Gestación</DialogTitle>
            <DialogDescription>
              Actualice el estado según el progreso del evento
            </DialogDescription>
          </DialogHeader>
          {statusDialog.pregnancy && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nuevo Estado</label>
                <Select 
                  value={statusDialog.newStatus || "en curso"} 
                  onValueChange={(value) => setStatusDialog(prev => ({ ...prev, newStatus: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en curso">En Curso</SelectItem>
                    <SelectItem value="finalizada parto">Finalizada Parto</SelectItem>
                    <SelectItem value="finalizada aborto">Finalizada Aborto</SelectItem>
                    <SelectItem value="no confirmada">No Confirmada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Notas (opcional)</label>
                <Input
                  className="mt-1"
                  placeholder="Observaciones sobre el cambio de estado..."
                  value={statusDialog.notes}
                  onChange={(e) => setStatusDialog(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setStatusDialog({ open: false, pregnancy: null, newStatus: "en curso", notes: "" })}
            >
              Cancelar
            </Button>
            <Button onClick={confirmStatusChange}>
              Actualizar Estado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ver Imagen */}
      <Dialog open={imageDialog.open} onOpenChange={(open) => !open && setImageDialog({ open: false, imageUrl: null })}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Imagen de Ecografía</DialogTitle>
          </DialogHeader>
          {imageDialog.imageUrl && (
            <div className="flex justify-center">
              <img 
                src={imageDialog.imageUrl} 
                alt="Ecografía completa" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
