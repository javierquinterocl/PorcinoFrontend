import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Search, Eye, Edit2, Trash2, Plus, PiggyBank, Baby, Upload, X, Image as ImageIcon, FileText, FileSpreadsheet, Download, MoreVertical, RefreshCw } from "lucide-react";
import { pigService, pigletService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { 
  exportSowToPDF, 
  exportAllSowsToPDF, 
  exportSowToExcel, 
  exportAllSowsToExcel,
  exportBoarToPDF,
  exportAllBoarsToPDF,
  exportBoarToExcel,
  exportAllBoarsToExcel,
  exportPigletToPDF,
  exportAllPigletsToPDF,
  exportPigletToExcel,
  exportAllPigletsToExcel
} from "@/utils/exportUtils";

export default function ReproductiveList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("cerdas");
  const [sows, setSows] = useState([]);
  const [boars, setBoars] = useState([]);
  const [piglets, setPiglets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // Estados para modales
  const [viewDialog, setViewDialog] = useState({ open: false, sow: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, sow: null });
  
  // Estados para modales de lechones
  const [pigletDetailDialog, setPigletDetailDialog] = useState({ open: false, piglet: null });
  const [pigletStatusDialog, setPigletStatusDialog] = useState({ open: false, piglet: null });
  const [statusFormData, setStatusFormData] = useState({
    current_status: "",
    weaning_date: "",
    weaning_weight: "",
    weaning_age_days: "",
    death_date: "",
    death_age_days: "",
    death_cause: "",
    adoptive_sow_id: "",
    adoption_date: "",
    adoption_reason: "",
    notes: ""
  });

  // Cargar cerdas
  const loadSows = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await pigService.getAllSows();
      setSows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando cerdas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las cerdas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Cargar verracos
  const loadBoars = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await pigService.getAllBoars();
      setBoars(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando verracos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los verracos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Cargar lechones
  const loadPiglets = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await pigletService.getAllPiglets();
      setPiglets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando lechones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los lechones",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === "cerdas") {
      loadSows();
    } else if (activeTab === "verracos") {
      loadBoars();
    } else if (activeTab === "lechones") {
      loadPiglets();
    }
  }, [activeTab, loadSows, loadBoars, loadPiglets]);

  // Filtrar cerdas por búsqueda
  const filteredSows = sows.filter(sow => {
    const searchLower = search.toLowerCase();
    return (
      sow.ear_tag?.toLowerCase().includes(searchLower) ||
      sow.alias?.toLowerCase().includes(searchLower) ||
      sow.breed?.toLowerCase().includes(searchLower) ||
      sow.farm_name?.toLowerCase().includes(searchLower)
    );
  });

  // Filtrar verracos por búsqueda
  const filteredBoars = boars.filter(boar => {
    const searchLower = search.toLowerCase();
    return (
      boar.ear_tag?.toLowerCase().includes(searchLower) ||
      boar.name?.toLowerCase().includes(searchLower) ||
      boar.breed?.toLowerCase().includes(searchLower) ||
      boar.farm_name?.toLowerCase().includes(searchLower) ||
      boar.supplier_name?.toLowerCase().includes(searchLower)
    );
  });

  // Filtrar lechones por búsqueda
  const filteredPiglets = piglets.filter(piglet => {
    const searchLower = search.toLowerCase();
    return (
      piglet.ear_tag?.toLowerCase().includes(searchLower) ||
      piglet.temporary_id?.toLowerCase().includes(searchLower) ||
      piglet.sow_ear_tag?.toLowerCase().includes(searchLower) ||
      piglet.sow_alias?.toLowerCase().includes(searchLower) ||
      piglet.sire_ear_tag?.toLowerCase().includes(searchLower) ||
      piglet.sire_name?.toLowerCase().includes(searchLower)
    );
  });

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return "No registrado";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return "Fecha inválida";
    }
  };

  // Funciones para abrir modales
  const handleViewSow = (sow) => {
    setViewDialog({ open: true, sow: sow, type: 'cerda' });
  };

  const handleViewBoar = (boar) => {
    setViewDialog({ open: true, sow: boar, type: 'verraco' });
  };

   const handleEditSow = (sow) => {
    // Validar que el ID sea válido
    if (!sow || !sow.id || isNaN(parseInt(sow.id))) {
      console.error('❌ ID inválido en handleEditSow:', sow?.id);
      toast({
        title: "Error",
        description: `ID de cerda inválido: "${sow?.id}". No se puede editar.`,
        variant: "destructive"
      });
      return;
    }

    // Navegar a la página de edición
    navigate(`/sows/edit/${sow.id}`);
  };

  const handleEditBoar = (boar) => {
    // Validar que el verraco no esté descartado
    if (boar.status === 'descartado') {
      toast({
        title: "Operación no permitida",
        description: "No se puede editar un verraco descartado. El descarte es un estado final.",
        variant: "destructive"
      });
      return;
    }

    // Navegar a la página de edición
    navigate(`/boars/edit/${boar.id}`);
  };

  const handleDeleteSow = (sow) => {
    // Validar que la cerda no esté descartada
    if (sow.status === 'descartada') {
      toast({
        title: "Operación no permitida",
        description: "Esta cerda ya está descartada. No se puede volver a descartar.",
        variant: "destructive"
      });
      return;
    }
    setDeleteDialog({ open: true, sow: sow, type: 'cerda' });
  };

  const handleDeleteBoar = (boar) => {
    // Validar que el verraco no esté descartado
    if (boar.status === 'descartado') {
      toast({
        title: "Operación no permitida",
        description: "Este verraco ya está descartado. No se puede volver a descartar.",
        variant: "destructive"
      });
      return;
    }
    setDeleteDialog({ open: true, sow: boar, type: 'verraco' });
  };

  // Confirmar eliminación
  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.type === 'cerda') {
        await pigService.deleteSow(deleteDialog.sow.id);
      } else {
        await pigService.deleteBoar(deleteDialog.sow.id);
      }
      
      toast({
        title: `${deleteDialog.type === 'cerda' ? 'Cerda' : 'Verraco'} eliminado`,
        description: `${deleteDialog.type === 'cerda' ? 'La cerda ha sido marcada como descartada' : 'El verraco ha sido marcado como descartado'}`
      });
      
      setDeleteDialog({ open: false, sow: null, type: null });
      
      // Recargar la lista correspondiente
      if (deleteDialog.type === 'cerda') {
        loadSows();
      } else {
        loadBoars();
      }
    } catch (error) {
      console.error(`Error eliminando ${deleteDialog.type === 'cerda' ? 'cerda' : 'verraco'}:`, error);
      toast({
        title: "Error",
        description: error.response?.data?.message || `No se pudo eliminar ${deleteDialog.type === 'cerda' ? 'la cerda' : 'el verraco'}`,
        variant: "destructive"
      });
    }
  };

  // Funciones para manejar lechones
  const handleViewPigletDetails = (piglet) => {
    setPigletDetailDialog({ open: true, piglet });
  };

  const handleChangeStatus = (piglet) => {
    // Si el lechón ya está en un estado final, solo mostrar detalles
    if (['muerto', 'vendido', 'transferido', 'destetado'].includes(piglet.current_status)) {
      setPigletDetailDialog({ open: true, piglet });
      return;
    }

    // Abrir modal de cambio de estado
    setStatusFormData({
      current_status: piglet.current_status || "lactante",
      weaning_date: piglet.weaning_date?.split('T')[0] || "",
      weaning_weight: piglet.weaning_weight || "",
      weaning_age_days: piglet.weaning_age_days || "",
      death_date: piglet.death_date?.split('T')[0] || "",
      death_age_days: piglet.death_age_days || "",
      death_cause: piglet.death_cause || "",
      adoptive_sow_id: piglet.adoptive_sow_id || "",
      adoption_date: piglet.adoption_date?.split('T')[0] || "",
      adoption_reason: piglet.adoption_reason || "",
      notes: piglet.notes || ""
    });
    setPigletStatusDialog({ open: true, piglet });
  };

  const handleStatusFormChange = (field, value) => {
    setStatusFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStatusSubmit = async () => {
    try {
      const currentPiglet = pigletStatusDialog.piglet;
      
      // Incluir todos los campos obligatorios del lechón actual
      const updateData = {
        // Campos obligatorios que deben mantenerse
        sex: currentPiglet.sex,
        ear_tag: currentPiglet.ear_tag,
        temporary_id: currentPiglet.temporary_id,
        birth_order: currentPiglet.birth_order,
        birth_weight: currentPiglet.birth_weight,
        current_weight: currentPiglet.current_weight,
        birth_status: currentPiglet.birth_status,
        special_care: currentPiglet.special_care,
        
        // Campos que se están actualizando
        current_status: statusFormData.current_status,
        notes: statusFormData.notes,
        
        // Mantener campos de adopción existentes si no se están cambiando
        adoptive_sow_id: currentPiglet.adoptive_sow_id,
        adoption_date: currentPiglet.adoption_date,
        adoption_reason: currentPiglet.adoption_reason,
        
        // Mantener campos de destete existentes si no se están cambiando
        weaning_date: currentPiglet.weaning_date,
        weaning_weight: currentPiglet.weaning_weight,
        weaning_age_days: currentPiglet.weaning_age_days,
        
        // Mantener campos de muerte existentes si no se están cambiando
        death_date: currentPiglet.death_date,
        death_age_days: currentPiglet.death_age_days,
        death_cause: currentPiglet.death_cause
      };

      // Sobrescribir campos según el nuevo estado
      if (statusFormData.current_status === 'destetado') {
        updateData.weaning_date = statusFormData.weaning_date || null;
        updateData.weaning_weight = statusFormData.weaning_weight ? parseFloat(statusFormData.weaning_weight) : null;
        updateData.weaning_age_days = statusFormData.weaning_age_days ? parseInt(statusFormData.weaning_age_days) : null;
      } else if (statusFormData.current_status === 'muerto') {
        updateData.death_date = statusFormData.death_date || null;
        updateData.death_age_days = statusFormData.death_age_days ? parseInt(statusFormData.death_age_days) : null;
        updateData.death_cause = statusFormData.death_cause || null;
      } else if (statusFormData.current_status === 'transferido') {
        updateData.adoptive_sow_id = statusFormData.adoptive_sow_id ? parseInt(statusFormData.adoptive_sow_id) : null;
        updateData.adoption_date = statusFormData.adoption_date || null;
        updateData.adoption_reason = statusFormData.adoption_reason || null;
      }

      await pigletService.updatePiglet(pigletStatusDialog.piglet.id, updateData);

      toast({
        title: "Estado actualizado",
        description: "El estado del lechón se ha actualizado correctamente",
        className: "bg-green-50 border-green-200"
      });

      setPigletStatusDialog({ open: false, piglet: null });
      loadPiglets();
    } catch (error) {
      console.error("Error actualizando estado:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo actualizar el estado del lechón",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Lista de Reproductoras
          </h1>
          <p className="text-gray-600">
            Gestiona y consulta la información de cerdas, verracos y lechones
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="cerdas" className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              Cerdas
            </TabsTrigger>
            <TabsTrigger value="verracos" className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              Verracos
            </TabsTrigger>
            <TabsTrigger value="lechones" className="flex items-center gap-2">
              <Baby className="h-4 w-4" />
              Lechones
            </TabsTrigger>
          </TabsList>

          {/* Tab de Cerdas */}
          <TabsContent value="cerdas">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Listado de Cerdas</CardTitle>
                    <CardDescription>
                      {filteredSows.length} cerdas registradas
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {/* Botones de exportación */}
                    {filteredSows.length > 0 && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => exportAllSowsToPDF(filteredSows)} 
                          variant="outline"
                          className="border-green-600 text-green-600 hover:bg-green-50 flex-1 sm:flex-none"
                        >
                          <FileText className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Exportar PDF</span>
                        </Button>
                        <Button 
                          onClick={() => exportAllSowsToExcel(filteredSows)} 
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none"
                        >
                          <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Exportar Excel</span>
                        </Button>
                      </div>
                    )}
                    <Button onClick={() => navigate("/sows/register")} className="bg-pink-600 hover:bg-pink-700 w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Nueva Cerda</span>
                      <span className="sm:hidden">Nueva</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Buscador */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por arete, alias, raza o granja..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Tabla */}
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Cargando...</p>
                  </div>
                ) : filteredSows.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No se encontraron cerdas</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Arete</TableHead>
                          <TableHead>Alias</TableHead>
                          <TableHead>Raza</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Estado Reproductivo</TableHead>
                          <TableHead>Peso (kg)</TableHead>
                          <TableHead>Partos</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSows.map((sow) => (
                          <TableRow key={sow.id}>
                            <TableCell className="font-semibold">{sow.ear_tag}</TableCell>
                            <TableCell>{sow.alias || "-"}</TableCell>
                            <TableCell>{sow.breed}</TableCell>
                            <TableCell>
                              <Badge variant={sow.status === 'activa' ? 'default' : 'secondary'}>
                                {sow.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{sow.reproductive_status || "vacia"}</Badge>
                            </TableCell>
                            <TableCell>{sow.current_weight || "-"}</TableCell>
                            <TableCell>{sow.parity_count || 0}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1 flex-wrap">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleViewSow(sow)}
                                  title="Ver detalles"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-8 w-8 ${sow.status === 'descartada' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  onClick={() => handleEditSow(sow)}
                                  title={sow.status === 'descartada' ? 'No se puede editar una cerda descartada' : 'Editar'}
                                  disabled={sow.status === 'descartada'}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-8 w-8 ${sow.status === 'descartada' ? 'opacity-50 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`}
                                  onClick={() => handleDeleteSow(sow)}
                                  title={sow.status === 'descartada' ? 'Esta cerda ya está descartada' : 'Descartar'}
                                  disabled={sow.status === 'descartada'}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                
                                {/* Menú de exportación */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      title="Exportar"
                                    >
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => exportSowToPDF(sow)}>
                                      <FileText className="h-4 w-4 mr-2" />
                                      Exportar a PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => exportSowToExcel(sow)}>
                                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                                      Exportar a Excel
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
          </TabsContent>

          {/* Tab de Verracos */}
          <TabsContent value="verracos">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Listado de Verracos</CardTitle>
                    <CardDescription>
                      {filteredBoars.length} verracos registrados
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {/* Botones de exportación */}
                    {filteredBoars.length > 0 && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => exportAllBoarsToPDF(filteredBoars)} 
                          variant="outline"
                          className="border-green-600 text-green-600 hover:bg-green-50 flex-1 sm:flex-none"
                        >
                          <FileText className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Exportar PDF</span>
                        </Button>
                        <Button 
                          onClick={() => exportAllBoarsToExcel(filteredBoars)} 
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none"
                        >
                          <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Exportar Excel</span>
                        </Button>
                      </div>
                    )}
                    <Button onClick={() => navigate("/boars/register")} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Nuevo Verraco</span>
                      <span className="sm:hidden">Nuevo</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Buscador */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por arete, nombre, raza, granja o proveedor..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Tabla */}
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Cargando...</p>
                  </div>
                ) : filteredBoars.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No se encontraron verracos</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Arete</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Raza</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Peso (kg)</TableHead>
                          <TableHead>Servicios</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBoars.map((boar) => (
                          <TableRow key={boar.id}>
                            <TableCell className="font-semibold">{boar.ear_tag}</TableCell>
                            <TableCell>{boar.name || "-"}</TableCell>
                            <TableCell>{boar.breed}</TableCell>
                            <TableCell>
                              <Badge variant={boar.boar_type === 'fisico' ? 'default' : 'outline'}>
                                {boar.boar_type === 'fisico' ? 'Físico' : 'Semen'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={boar.status === 'activo' ? 'default' : 'secondary'}>
                                {boar.status || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>{boar.current_weight || "-"}</TableCell>
                            <TableCell>{boar.total_services || 0}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1 flex-wrap">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleViewBoar(boar)}
                                  title="Ver detalles"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-8 w-8 ${boar.status === 'descartado' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  onClick={() => handleEditBoar(boar)}
                                  title={boar.status === 'descartado' ? 'No se puede editar un verraco descartado' : 'Editar'}
                                  disabled={boar.status === 'descartado'}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-8 w-8 ${boar.status === 'descartado' ? 'opacity-50 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`}
                                  onClick={() => handleDeleteBoar(boar)}
                                  title={boar.status === 'descartado' ? 'Este verraco ya está descartado' : 'Descartar'}
                                  disabled={boar.status === 'descartado'}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                
                                {/* Menú de exportación */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      title="Exportar"
                                    >
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => exportBoarToPDF(boar)}>
                                      <FileText className="h-4 w-4 mr-2" />
                                      Exportar a PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => exportBoarToExcel(boar)}>
                                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                                      Exportar a Excel
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
          </TabsContent>

          {/* Tab de Lechones (deshabilitado) */}
          <TabsContent value="lechones">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Listado de Lechones</CardTitle>
                    <CardDescription>
                      {filteredPiglets.length} lechones registrados
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {/* Botones de exportación */}
                    {filteredPiglets.length > 0 && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => exportAllPigletsToPDF(filteredPiglets)} 
                          variant="outline"
                          className="border-green-600 text-green-600 hover:bg-green-50 flex-1 sm:flex-none"
                        >
                          <FileText className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Exportar PDF</span>
                        </Button>
                        <Button 
                          onClick={() => exportAllPigletsToExcel(filteredPiglets)} 
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none"
                        >
                          <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Exportar Excel</span>
                        </Button>
                      </div>
                    )}
                    <Button onClick={() => navigate("/piglets/register")} className="bg-pink-600 hover:bg-pink-700 w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Nuevo Lechón</span>
                      <span className="sm:hidden">Nuevo</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Buscador */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por arete, ID temporal, madre, padre..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Tabla */}
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Cargando...</p>
                  </div>
                ) : filteredPiglets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No se encontraron lechones</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Arete / ID Temporal</TableHead>
                          <TableHead>Sexo</TableHead>
                          <TableHead>Madre</TableHead>
                          <TableHead>Padre</TableHead>
                          <TableHead>Fecha Nacimiento</TableHead>
                          <TableHead>Peso Nac. (kg)</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Estado Actual</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPiglets.map((piglet) => {
                          const isInFinalStatus = ['muerto', 'vendido', 'transferido', 'destetado'].includes(piglet.current_status);
                          
                          return (
                            <TableRow key={piglet.id}>
                              <TableCell className="font-semibold">
                                {piglet.ear_tag || (
                                  <span className="text-gray-500 italic">
                                    {piglet.temporary_id || `ID: ${piglet.id}`}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {piglet.sex === 'macho' ? '♂ Macho' : piglet.sex === 'hembra' ? '♀ Hembra' : 'Indefinido'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {piglet.sow_ear_tag || "-"}
                                {piglet.sow_alias && (
                                  <span className="text-gray-500 text-sm ml-1">
                                    ({piglet.sow_alias})
                                  </span>
                                )}
                                {piglet.adoptive_sow_ear_tag && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    Adoptado por: {piglet.adoptive_sow_ear_tag}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {piglet.sire_ear_tag || "-"}
                                {piglet.sire_name && (
                                  <span className="text-gray-500 text-sm ml-1">
                                    ({piglet.sire_name})
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{formatDate(piglet.birth_date)}</TableCell>
                              <TableCell>{piglet.birth_weight ? `${piglet.birth_weight} kg` : "-"}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    piglet.birth_status === 'vivo' ? 'default' : 
                                    piglet.birth_status === 'muerto' ? 'destructive' : 
                                    'secondary'
                                  }
                                >
                                  {piglet.birth_status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    piglet.current_status === 'lactante' ? 'default' :
                                    piglet.current_status === 'destetado' ? 'secondary' :
                                    piglet.current_status === 'vendido' ? 'outline' :
                                    piglet.current_status === 'muerto' ? 'destructive' :
                                    'secondary'
                                  }
                                >
                                  {piglet.current_status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1 flex-wrap">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleViewPigletDetails(piglet)}
                                    title="Ver detalles"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  {!isInFinalStatus && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                      onClick={() => handleChangeStatus(piglet)}
                                      title="Cambiar estado"
                                    >
                                      <RefreshCw className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Ver Detalles */}
        <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, sow: null, type: null })}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {viewDialog.type === 'verraco' ? 'Detalles del Verraco' : 'Detalles de la Cerda'}
              </DialogTitle>
              <DialogDescription>
                Información completa de {viewDialog.sow?.ear_tag}
              </DialogDescription>
            </DialogHeader>
            
            {viewDialog.sow && (
              <div className="space-y-6">
                {/* Imagen de la cerda */}
                <div className="flex justify-center">
                  {viewDialog.sow.photo_url ? (
                    <img 
                      src={viewDialog.sow.photo_url} 
                      alt={viewDialog.sow.ear_tag}
                      className="w-64 h-64 object-cover rounded-lg border-4 border-pink-200 shadow-lg"
                    />
                  ) : (
                    <div className="w-64 h-64 border-4 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50">
                      <ImageIcon className="h-16 w-16 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Sin imagen</p>
                    </div>
                  )}
                </div>

                {/* Sección 1: Identificación */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Identificación</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Arete</Label>
                      <p className="font-semibold">{viewDialog.sow.ear_tag}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Tipo de ID</Label>
                      <p className="font-semibold capitalize">{viewDialog.sow.id_type}</p>
                    </div>
                    {viewDialog.type === 'cerda' ? (
                      <div>
                        <Label className="text-gray-600">Alias</Label>
                        <p className="font-semibold">{viewDialog.sow.alias || "Sin alias"}</p>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-gray-600">Nombre</Label>
                        <p className="font-semibold">{viewDialog.sow.name || "Sin nombre"}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección 2: Genética */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Genética</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Raza</Label>
                      <p className="font-semibold">{viewDialog.sow.breed}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Línea Genética</Label>
                      <p className="font-semibold">{viewDialog.sow.genetic_line || "No especificada"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Generación</Label>
                      <p className="font-semibold">{viewDialog.sow.generation || "No especificada"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Arete del Padre</Label>
                      <p className="font-semibold">{viewDialog.sow.sire_tag || viewDialog.sow.sire_ear_tag || "No registrado"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Arete de la Madre</Label>
                      <p className="font-semibold">{viewDialog.sow.dam_tag || viewDialog.sow.dam_ear_tag || "No registrado"}</p>
                    </div>
                  </div>
                </div>

                {/* Sección 3: Tipo de Verraco (solo para verracos) */}
                {viewDialog.type === 'verraco' && viewDialog.sow.boar_type && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Tipo de Verraco</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Tipo</Label>
                        <Badge variant="outline" className="capitalize">
                          {viewDialog.sow.boar_type}
                        </Badge>
                      </div>
                      {viewDialog.sow.boar_type === 'semen comprado' && (
                        <>
                          <div>
                            <Label className="text-gray-600">Proveedor</Label>
                            <p className="font-semibold">{viewDialog.sow.supplier_name || "No especificado"}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Código Proveedor</Label>
                            <p className="font-semibold">{viewDialog.sow.supplier_code || "No especificado"}</p>
                          </div>
                        </>
                      )}
                      {viewDialog.sow.boar_type === 'fisico' && (
                        <div>
                          <Label className="text-gray-600">Total Servicios</Label>
                          <p className="font-semibold">{viewDialog.sow.total_services || 0}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sección 4: Fechas */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Fechas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Fecha de Nacimiento</Label>
                      <p className="font-semibold">{formatDate(viewDialog.sow.birth_date)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Fecha de Entrada</Label>
                      <p className="font-semibold">{formatDate(viewDialog.sow.entry_date)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Origen</Label>
                      <p className="font-semibold capitalize">{viewDialog.sow.origin}</p>
                    </div>
                    {viewDialog.type === 'verraco' && viewDialog.sow.last_service_date && (
                      <div>
                        <Label className="text-gray-600">Último Servicio</Label>
                        <p className="font-semibold">{formatDate(viewDialog.sow.last_service_date)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección 5: Ubicación (solo para físicos) */}
                {(!viewDialog.sow.boar_type || viewDialog.sow.boar_type === 'fisico' || viewDialog.type === 'cerda') && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Ubicación</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Granja</Label>
                        <p className="font-semibold">{viewDialog.sow.farm_name || "No especificada"}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Ubicación/Galpón</Label>
                        <p className="font-semibold">{viewDialog.sow.location || "No especificada"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sección 6: Estado */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Estado</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Estado General</Label>
                      <Badge variant={viewDialog.sow.status === 'activa' || viewDialog.sow.status === 'activo' ? 'default' : 'secondary'}>
                        {viewDialog.sow.status}
                      </Badge>
                    </div>
                    {viewDialog.type === 'cerda' && (
                      <div>
                        <Label className="text-gray-600">Estado Reproductivo</Label>
                        <Badge variant="outline">{viewDialog.sow.reproductive_status || "vacia"}</Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección 7: Datos Físicos */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Datos Físicos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Peso Actual</Label>
                      <p className="font-semibold">{viewDialog.sow.current_weight ? `${viewDialog.sow.current_weight} kg` : "No registrado"}</p>
                    </div>
                    {viewDialog.type === 'cerda' && (
                      <>
                        <div>
                          <Label className="text-gray-600">Peso Mínimo Servicio</Label>
                          <p className="font-semibold">{viewDialog.sow.min_service_weight || "No especificado"} kg</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Condición Corporal</Label>
                          <p className="font-semibold">{viewDialog.sow.body_condition}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Fecha Último Pesaje</Label>
                          <p className="font-semibold">{formatDate(viewDialog.sow.last_weight_date)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Sección 8: Notas (solo para verracos) */}
                {viewDialog.type === 'verraco' && viewDialog.sow.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Notas</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{viewDialog.sow.notes}</p>
                  </div>
                )}

                {/* Sección 9: Registro */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Registro</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Fecha de Creación</Label>
                      <p className="font-semibold">{formatDate(viewDialog.sow.created_at)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Última Actualización</Label>
                      <p className="font-semibold">{formatDate(viewDialog.sow.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <div className="flex justify-between w-full">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => viewDialog.type === 'verraco' ? exportBoarToPDF(viewDialog.sow) : exportSowToPDF(viewDialog.sow)}
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => viewDialog.type === 'verraco' ? exportBoarToExcel(viewDialog.sow) : exportSowToExcel(viewDialog.sow)}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar Excel
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setViewDialog({ open: false, sow: null, type: null })}>
                  Cerrar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Eliminar */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, sow: null, type: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar {deleteDialog.type === 'cerda' ? 'la cerda' : 'el verraco'} <strong>{deleteDialog.sow?.ear_tag}</strong>?
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Esta acción marcará {deleteDialog.type === 'cerda' ? 'la cerda' : 'el verraco'} como "descartado". 
                {deleteDialog.type === 'cerda' 
                  ? 'Si la cerda tiene datos reproductivos asociados, no podrá ser eliminada permanentemente.' 
                  : 'Si el verraco tiene servicios asociados, no podrá ser eliminado permanentemente.'}
              </p>
            </div>
            
            <DialogFooter className="flex flex-row justify-end gap-3 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setDeleteDialog({ open: false, sow: null, type: null })}
                className="min-w-[100px]"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleDeleteConfirm}
                className="min-w-[100px] bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Detalles del Lechón */}
        <Dialog open={pigletDetailDialog.open} onOpenChange={(open) => setPigletDetailDialog({ open, piglet: null })}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Detalles del Lechón</DialogTitle>
              <DialogDescription>
                Información completa de {pigletDetailDialog.piglet?.ear_tag || pigletDetailDialog.piglet?.temporary_id || `ID: ${pigletDetailDialog.piglet?.id}`}
              </DialogDescription>
            </DialogHeader>
            
            {pigletDetailDialog.piglet && (
              <div className="space-y-6">
                {/* Imagen del lechón */}
                <div className="flex justify-center">
                  {pigletDetailDialog.piglet.photo_url ? (
                    <img 
                      src={pigletDetailDialog.piglet.photo_url} 
                      alt={pigletDetailDialog.piglet.ear_tag || 'Lechón'}
                      className="w-48 h-48 object-cover rounded-lg border-4 border-pink-200 shadow-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 border-4 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50">
                      <Baby className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Sin imagen</p>
                    </div>
                  )}
                </div>

                {/* Sección de Identificación */}
                <div className="space-y-3 border-l-4 border-pink-400 pl-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2 text-pink-600">
                    <Baby className="h-5 w-5" />
                    Identificación
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-gray-500 text-xs">Arete</Label>
                      <p className="font-medium">{pigletDetailDialog.piglet.ear_tag || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">ID Temporal</Label>
                      <p className="font-medium">{pigletDetailDialog.piglet.temporary_id || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">Sexo</Label>
                      <Badge variant="outline">
                        {pigletDetailDialog.piglet.sex === 'macho' ? '♂ Macho' : 
                         pigletDetailDialog.piglet.sex === 'hembra' ? '♀ Hembra' : 'Indefinido'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">Estado al Nacer</Label>
                      <Badge variant={pigletDetailDialog.piglet.birth_status === 'vivo' ? 'default' : 'destructive'}>
                        {pigletDetailDialog.piglet.birth_status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Sección de Nacimiento */}
                <div className="space-y-3 border-l-4 border-blue-400 pl-4">
                  <h3 className="font-semibold text-lg text-blue-600">Nacimiento</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-gray-500 text-xs">Fecha de Nacimiento</Label>
                      <p className="font-medium">{formatDate(pigletDetailDialog.piglet.birth_date)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">Número de Parto</Label>
                      <p className="font-medium">{pigletDetailDialog.piglet.birth_number || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">Madre</Label>
                      <p className="font-medium">
                        {pigletDetailDialog.piglet.sow_ear_tag}
                        {pigletDetailDialog.piglet.sow_alias && (
                          <span className="text-gray-500 text-sm ml-1">
                            ({pigletDetailDialog.piglet.sow_alias})
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">Padre</Label>
                      <p className="font-medium">
                        {pigletDetailDialog.piglet.sire_ear_tag || "-"}
                        {pigletDetailDialog.piglet.sire_name && (
                          <span className="text-gray-500 text-sm ml-1">
                            ({pigletDetailDialog.piglet.sire_name})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sección de Pesos */}
                <div className="space-y-3 border-l-4 border-green-400 pl-4">
                  <h3 className="font-semibold text-lg text-green-600">Pesos</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-gray-500 text-xs">Peso al Nacer</Label>
                      <p className="font-medium">{pigletDetailDialog.piglet.birth_weight ? `${pigletDetailDialog.piglet.birth_weight} kg` : "-"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">Peso Actual</Label>
                      <p className="font-medium">{pigletDetailDialog.piglet.current_weight ? `${pigletDetailDialog.piglet.current_weight} kg` : "-"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">Peso al Destete</Label>
                      <p className="font-medium">{pigletDetailDialog.piglet.weaning_weight ? `${pigletDetailDialog.piglet.weaning_weight} kg` : "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Sección de Adopción (si aplica) */}
                {pigletDetailDialog.piglet.adoptive_sow_id && (
                  <div className="space-y-3 border-l-4 border-yellow-400 pl-4">
                    <h3 className="font-semibold text-lg text-yellow-600">Adopción</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-500 text-xs">Madre Adoptiva</Label>
                        <p className="font-medium">{pigletDetailDialog.piglet.adoptive_sow_ear_tag || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-xs">Fecha de Adopción</Label>
                        <p className="font-medium">{formatDate(pigletDetailDialog.piglet.adoption_date)}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-gray-500 text-xs">Razón de Adopción</Label>
                        <p className="font-medium">{pigletDetailDialog.piglet.adoption_reason || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sección de Destete (si aplica) */}
                {pigletDetailDialog.piglet.weaning_date && (
                  <div className="space-y-3 border-l-4 border-purple-400 pl-4">
                    <h3 className="font-semibold text-lg text-purple-600">Destete</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-gray-500 text-xs">Fecha de Destete</Label>
                        <p className="font-medium">{formatDate(pigletDetailDialog.piglet.weaning_date)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-xs">Peso al Destete</Label>
                        <p className="font-medium">{pigletDetailDialog.piglet.weaning_weight ? `${pigletDetailDialog.piglet.weaning_weight} kg` : "-"}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-xs">Edad al Destete</Label>
                        <p className="font-medium">{pigletDetailDialog.piglet.weaning_age_days ? `${pigletDetailDialog.piglet.weaning_age_days} días` : "-"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sección de Muerte (si aplica) */}
                {pigletDetailDialog.piglet.death_date && (
                  <div className="space-y-3 border-l-4 border-red-400 pl-4">
                    <h3 className="font-semibold text-lg text-red-600">Muerte</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-500 text-xs">Fecha de Muerte</Label>
                        <p className="font-medium">{formatDate(pigletDetailDialog.piglet.death_date)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-xs">Edad al Morir</Label>
                        <p className="font-medium">{pigletDetailDialog.piglet.death_age_days ? `${pigletDetailDialog.piglet.death_age_days} días` : "-"}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-gray-500 text-xs">Causa de Muerte</Label>
                        <p className="font-medium">{pigletDetailDialog.piglet.death_cause || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Estado Actual */}
                <div className="space-y-3 border-l-4 border-indigo-400 pl-4">
                  <h3 className="font-semibold text-lg text-indigo-600">Estado Actual</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-gray-500 text-xs">Estado</Label>
                      <Badge 
                        variant={
                          pigletDetailDialog.piglet.current_status === 'lactante' ? 'default' :
                          pigletDetailDialog.piglet.current_status === 'destetado' ? 'secondary' :
                          pigletDetailDialog.piglet.current_status === 'vendido' ? 'outline' :
                          pigletDetailDialog.piglet.current_status === 'muerto' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {pigletDetailDialog.piglet.current_status}
                      </Badge>
                    </div>
                  </div>
                  {pigletDetailDialog.piglet.notes && (
                    <div>
                      <Label className="text-gray-500 text-xs">Notas</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{pigletDetailDialog.piglet.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setPigletDetailDialog({ open: false, piglet: null })}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Cambio de Estado */}
        <Dialog open={pigletStatusDialog.open} onOpenChange={(open) => setPigletStatusDialog({ open, piglet: null })}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cambiar Estado del Lechón</DialogTitle>
              <DialogDescription>
                Actualiza el estado de {pigletStatusDialog.piglet?.ear_tag || pigletStatusDialog.piglet?.temporary_id || `ID: ${pigletStatusDialog.piglet?.id}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Selector de Estado */}
              <div className="space-y-2">
                <Label>Estado Actual *</Label>
                <Select 
                  value={statusFormData.current_status} 
                  onValueChange={(value) => handleStatusFormChange('current_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lactante">Lactante</SelectItem>
                    <SelectItem value="destetado">Destetado</SelectItem>
                    <SelectItem value="transferido">Transferido (Adopción)</SelectItem>
                    <SelectItem value="vendido">Vendido</SelectItem>
                    <SelectItem value="muerto">Muerto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos de Destete */}
              {statusFormData.current_status === 'destetado' && (
                <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-700">Información de Destete</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Fecha de Destete</Label>
                      <Input 
                        type="date"
                        value={statusFormData.weaning_date}
                        onChange={(e) => handleStatusFormChange('weaning_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Peso al Destete (kg)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={statusFormData.weaning_weight}
                        onChange={(e) => handleStatusFormChange('weaning_weight', e.target.value)}
                        placeholder="Ej: 7.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Edad al Destete (días)</Label>
                      <Input 
                        type="number"
                        value={statusFormData.weaning_age_days}
                        onChange={(e) => handleStatusFormChange('weaning_age_days', e.target.value)}
                        placeholder="Ej: 21"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Campos de Adopción/Transferencia */}
              {statusFormData.current_status === 'transferido' && (
                <div className="space-y-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-700">Información de Adopción</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Madre Adoptiva (ID)</Label>
                      <Input 
                        type="number"
                        value={statusFormData.adoptive_sow_id}
                        onChange={(e) => handleStatusFormChange('adoptive_sow_id', e.target.value)}
                        placeholder="ID de la cerda adoptiva"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Adopción</Label>
                      <Input 
                        type="date"
                        value={statusFormData.adoption_date}
                        onChange={(e) => handleStatusFormChange('adoption_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Razón de Adopción</Label>
                      <Input 
                        value={statusFormData.adoption_reason}
                        onChange={(e) => handleStatusFormChange('adoption_reason', e.target.value)}
                        placeholder="Ej: Madre sin suficiente leche"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Campos de Muerte */}
              {statusFormData.current_status === 'muerto' && (
                <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-700">Información de Muerte</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Fecha de Muerte</Label>
                      <Input 
                        type="date"
                        value={statusFormData.death_date}
                        onChange={(e) => handleStatusFormChange('death_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Edad al Morir (días)</Label>
                      <Input 
                        type="number"
                        value={statusFormData.death_age_days}
                        onChange={(e) => handleStatusFormChange('death_age_days', e.target.value)}
                        placeholder="Ej: 5"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Causa de Muerte</Label>
                      <Input 
                        value={statusFormData.death_cause}
                        onChange={(e) => handleStatusFormChange('death_cause', e.target.value)}
                        placeholder="Ej: Aplastamiento, enfermedad, etc."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              <div className="space-y-2">
                <Label>Notas Adicionales</Label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  value={statusFormData.notes}
                  onChange={(e) => handleStatusFormChange('notes', e.target.value)}
                  placeholder="Información adicional sobre el cambio de estado..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setPigletStatusDialog({ open: false, piglet: null })}
              >
                Cancelar
              </Button>
              <Button onClick={handleStatusSubmit} className="bg-pink-600 hover:bg-pink-700">
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
