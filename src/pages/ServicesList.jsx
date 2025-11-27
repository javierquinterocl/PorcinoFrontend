import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useToast } from '../components/ui/use-toast';
import { Plus, Search, Eye, Pencil, Trash2, Filter, AlertTriangle, X, CheckCircle } from 'lucide-react';
import { serviceService } from '../services/api';

const ServicesList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados de filtros
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterSuccess, setFilterSuccess] = useState('all');

  useEffect(() => {
    loadServices();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await serviceService.getAllServices();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: "Error al cargar servicios",
        description: "No se pudieron cargar los servicios reproductivos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await serviceService.getServiceStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Filtrar servicios localmente
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = 
        service.sow_code?.toLowerCase().includes(search.toLowerCase()) ||
        service.boar_code?.toLowerCase().includes(search.toLowerCase());
      
      const matchesType = filterType === 'all' || service.service_type === filterType;
      
      const matchesSuccess = filterSuccess === 'all' || 
        (filterSuccess === 'true' && service.success === true) ||
        (filterSuccess === 'false' && service.success === false);
      
      const matchesStartDate = !filterStartDate || service.service_date >= filterStartDate;
      const matchesEndDate = !filterEndDate || service.service_date <= filterEndDate;

      return matchesSearch && matchesType && matchesSuccess && matchesStartDate && matchesEndDate;
    });
  }, [services, search, filterType, filterSuccess, filterStartDate, filterEndDate]);

  // Limpiar filtros
  const clearFilters = () => {
    setSearch('');
    setFilterType('all');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterSuccess('all');
  };

  const handleView = (service) => {
    setSelectedService(service);
    setShowDetails(true);
  };

  const handleEdit = (serviceId) => {
    navigate(`/services/edit/${serviceId}`);
  };

  const handleDeleteClick = (service) => {
    setServiceToDelete(service);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;

    setIsDeleting(true);
    try {
      await serviceService.deleteService(serviceToDelete.id);
      
      toast({
        title: "¡Éxito!",
        description: "Servicio eliminado correctamente",
        variant: "default"
      });
      
      setShowDeleteDialog(false);
      setServiceToDelete(null);
      loadServices();
      loadStats();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error al eliminar",
        description: error.response?.data?.message || "No se pudo eliminar el servicio",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getServiceTypeLabel = (type) => {
    return type === 'monta natural' ? 'Monta Natural' : 'Inseminación Artificial';
  };

  const getSuccessLabel = (success) => {
    return success ? 'Exitoso' : 'No Exitoso';
  };

  const getSuccessBadge = (success) => {
    return success
      ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
      : 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Servicios Reproductivos</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Gestión de montas naturales e inseminaciones artificiales</p>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/services/register')}
          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Registrar Servicio</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Servicios</CardDescription>
              <CardTitle className="text-3xl">{stats.total_services || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Montas Naturales</CardDescription>
              <CardTitle className="text-3xl">{stats.natural_matings || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Inseminaciones Artificiales</CardDescription>
              <CardTitle className="text-3xl">{stats.artificial_inseminations || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tasa de Éxito</CardDescription>
              <CardTitle className="text-3xl">{stats.success_rate || 0}%</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Buscador y Filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar por código de cerda o verraco..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearch('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="service_type">Tipo de Servicio</Label>
                <Select
                  value={filterType}
                  onValueChange={(value) => setFilterType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="monta natural">Monta Natural</SelectItem>
                    <SelectItem value="inseminacion artificial">Inseminación Artificial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha Desde</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Fecha Hasta</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="success">Estado</Label>
                <Select
                  value={filterSuccess}
                  onValueChange={(value) => setFilterSuccess(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Exitosos</SelectItem>
                    <SelectItem value="false">No Exitosos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Servicios</CardTitle>
          <CardDescription>
            {filteredServices.length} servicio(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando servicios...</div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron servicios
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cerda</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Celo</TableHead>
                    <TableHead>Verraco</TableHead>
                    <TableHead>Fecha Servicio</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.sow_code}</TableCell>
                      <TableCell>{getServiceTypeLabel(service.service_type)}</TableCell>
                      <TableCell>{service.heat_id ? `Celo #${service.heat_id}` : 'N/A'}</TableCell>
                      <TableCell>{service.boar_code || 'N/A'}</TableCell>
                      <TableCell>{service.service_date}</TableCell>
                      <TableCell>{service.service_time?.substring(0, 5)}</TableCell>
                      <TableCell>{service.service_number}</TableCell>
                      <TableCell>
                        <span className={getSuccessBadge(service.success)}>
                          {getSuccessLabel(service.success)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(service)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!service.has_confirmed_pregnancy && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(service.id)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(service)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Servicio</DialogTitle>
            <DialogDescription>
              Información completa del servicio reproductivo
            </DialogDescription>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-6">
              {/* Información General */}
              <div>
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Información General</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Cerda</Label>
                    <p className="font-medium">{selectedService.sow_code}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Tipo de Servicio</Label>
                    <p className="font-medium">{getServiceTypeLabel(selectedService.service_type)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Celo Asociado</Label>
                    <p className="font-medium">{selectedService.heat_id ? `Celo #${selectedService.heat_id}` : 'No especificado'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Fecha del Servicio</Label>
                    <p className="font-medium">{selectedService.service_date}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Hora del Servicio</Label>
                    <p className="font-medium">{selectedService.service_time?.substring(0, 5) || 'No especificada'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Número de Servicio</Label>
                    <p className="font-medium">{selectedService.service_number}° servicio</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Técnico</Label>
                    <p className="font-medium">{selectedService.technician_name || 'No especificado'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Estado del Servicio</Label>
                    <p className={`font-medium ${selectedService.success === true ? 'text-green-600' : selectedService.success === false ? 'text-red-600' : 'text-gray-600'}`}>
                      {getSuccessLabel(selectedService.success)}
                    </p>
                  </div>
                  {selectedService.has_confirmed_pregnancy && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Estado de Preñez</Label>
                      <p className="font-medium text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Preñez Confirmada
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Datos específicos de Monta Natural */}
              {selectedService.service_type === 'monta natural' && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold mb-3 text-blue-900">Datos de Monta Natural</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Verraco Utilizado</Label>
                      <p className="font-medium">{selectedService.boar_code || 'No especificado'}</p>
                      {selectedService.boar_id && (
                        <p className="text-sm text-muted-foreground">ID: #{selectedService.boar_id}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Duración de la Monta</Label>
                      <p className="font-medium">{selectedService.mating_duration_minutes ? `${selectedService.mating_duration_minutes} minutos` : 'No registrada'}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground text-xs">Calidad de la Monta</Label>
                      <p className="font-medium capitalize">{selectedService.mating_quality || 'No especificada'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Datos específicos de Inseminación Artificial */}
              {selectedService.service_type === 'inseminacion artificial' && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold mb-3 text-purple-900">Datos de Inseminación Artificial</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Tipo de IA</Label>
                      <p className="font-medium capitalize">{selectedService.ia_type || 'No especificado'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Código de Dosis</Label>
                      <p className="font-medium">{selectedService.semen_dose_code || 'No especificado'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Volumen de Semen</Label>
                      <p className="font-medium">{selectedService.semen_volume_ml ? `${selectedService.semen_volume_ml} ml` : 'No registrado'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Concentración Espermática</Label>
                      <p className="font-medium">{selectedService.semen_concentration ? `${selectedService.semen_concentration} millones/ml` : 'No registrada'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {selectedService.notes && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <Label className="text-muted-foreground text-xs">Observaciones</Label>
                  <p className="font-medium mt-2 whitespace-pre-wrap">{selectedService.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setShowDetails(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          {serviceToDelete && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                <strong>Cerda:</strong> {serviceToDelete.sow_code}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Tipo:</strong> {getServiceTypeLabel(serviceToDelete.service_type)}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Fecha:</strong> {serviceToDelete.service_date}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setServiceToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
            >
              {isDeleting ? "Eliminando..." : "Eliminar Servicio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesList;
