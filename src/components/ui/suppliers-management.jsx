import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowUpDown, Edit, FileDown, Plus, Search, Trash2, MapPin, Phone, Mail } from "lucide-react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Supplier } from "@/interfaces/supplier"
import { 
  getAllSuppliers, 
  deleteSupplier,
  createSupplier,
  updateSupplier,
  getAllCountries,
  getStatesByCountry,
  getCitiesByState
} from "@/services/api"
import { Country, State, City } from "@/interfaces/location"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SuppliersManagement() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState<{ key; direction: "ascending" | "descending" } | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    supplier_id: "",
    name: "",
    email: "",
    phone: "",
    nit: "",
    address: "",
    country_id: "",
    state_id: "",
    city_id: ""
  })
  
  // Estados para los selectores de ubicación
  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [isFormLoading, setIsFormLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<number | null>(null)

  // Obtener datos de proveedores
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const fetchSuppliers = async () => {
      if (!isMounted) return;
      
      try {
        setIsLoading(true)
        console.log("Iniciando carga de proveedores...");
        const data = await getAllSuppliers()
        console.log("Proveedores obtenidos:", data)
        if (isMounted) {
          setSuppliers(data)
        }
      } catch (error) {
        console.error("Error al cargar proveedores:", error)
        if (isMounted && retryCount < maxRetries) {
          retryCount++;
          console.log(`Reintentando carga (${retryCount}/${maxRetries})...`);
          setTimeout(fetchSuppliers, 1000 * retryCount);
        } else if (isMounted) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "No se pudieron cargar los proveedores",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchSuppliers()
    
    return () => {
      isMounted = false;
    }
  }, [])

  // Cargar países al iniciar
  useEffect(() => {
    loadCountries();
  }, []);

  // Función para refrescar la lista de proveedores después de crear o editar
  const refreshSuppliers = async () => {
    try {
      setIsLoading(true)
      console.log("Solicitando actualización de lista de proveedores...");
      const data = await getAllSuppliers()
      setSuppliers(data)
      console.log("Lista de proveedores actualizada:", data.length);
    } catch (error) {
      console.error("Error al recargar proveedores:", error)
      toast({
        title: "Error",
        description: "No se pudieron recargar los proveedores",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para ordenar
  const requestSort = (key: keyof Supplier) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Aplicar filtros y ordenamiento
  let filteredSuppliers = [...suppliers]

  // Aplicar filtros de búsqueda
  if (searchTerm) {
    filteredSuppliers = filteredSuppliers.filter(
      (supplier) =>
        supplier.supplier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.nit && supplier.nit.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  // Aplicar ordenamiento
  if (sortConfig !== null) {
    filteredSuppliers.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Supplier];
      const bValue = b[sortConfig.key as keyof Supplier];
      
      if (aValue && bValue) {
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
      }
      return 0;
    })
  }

  // Función para manejar la eliminación de un proveedor
  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return

    try {
      setIsDeleting(true)
      await deleteSupplier(supplierToDelete.id)
      
      // Actualizar lista de proveedores
      setSuppliers(suppliers.filter(supplier => supplier.id !== supplierToDelete.id))
      
      toast({
        title: "Proveedor eliminado",
        description: "El proveedor ha sido eliminado correctamente",
      })
      
      setDeleteConfirmOpen(false)
    } catch (error) {
      console.error("Error al eliminar proveedor:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el proveedor",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Función para cargar países
  const loadCountries = async () => {
    try {
      console.log('Iniciando carga de países...');
      // No configuramos isFormLoading aquí para no bloquear todo el formulario
      const countriesData = await getAllCountries();
      console.log('Países recibidos:', countriesData);
      
      if (Array.isArray(countriesData) && countriesData.length > 0) {
        setCountries(countriesData);
        console.log("Países cargados:", countriesData.length);
      } else {
        console.warn("La respuesta de países no es un array o está vacía:", countriesData);
        toast({
          title: "Advertencia",
          description: "No se encontraron países disponibles",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error al cargar países:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar los países. Intente nuevamente.",
        variant: "destructive",
      });
      // Establecer un array vacío para países en caso de error
      setCountries([]);
    }
  };

  // Función para cargar estados por país
  const loadStates = async (countryId) => {
    if (!countryId) {
      setStates([]);
      return;
    }
    
    try {
      console.log(`Iniciando carga de estados para el país ${countryId}...`);
      // No configuramos isFormLoading aquí para no bloquear todo el formulario
      const statesData = await getStatesByCountry(countryId);
      console.log(`Estados recibidos para país ${countryId}:`, statesData);
      
      if (Array.isArray(statesData) && statesData.length > 0) {
        setStates(statesData);
        console.log(`Estados cargados para país ${countryId}:`, statesData.length);
      } else {
        console.warn(`No se encontraron estados para el país ${countryId}`);
        toast({
          title: "Información",
          description: "No se encontraron departamentos/estados para el país seleccionado",
          variant: "default",
        });
        setStates([]);
      }
    } catch (error) {
      console.error("Error al cargar estados:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar los departamentos/estados. Intente nuevamente.",
        variant: "destructive",
      });
      setStates([]);
    }
  };

  // Función para cargar ciudades por estado
  const loadCities = async (stateId) => {
    if (!stateId) {
      setCities([]);
      return;
    }
    
    try {
      console.log(`Iniciando carga de ciudades para el estado ${stateId}...`);
      // No configuramos isFormLoading aquí para no bloquear todo el formulario
      const citiesData = await getCitiesByState(stateId);
      console.log(`Ciudades recibidas para estado ${stateId}:`, citiesData);
      
      if (Array.isArray(citiesData) && citiesData.length > 0) {
        setCities(citiesData);
        console.log(`Ciudades cargadas para estado ${stateId}:`, citiesData.length);
      } else {
        console.warn(`No se encontraron ciudades para el estado ${stateId}`);
        toast({
          title: "Información",
          description: "No se encontraron ciudades para el departamento/estado seleccionado",
          variant: "default",
        });
        setCities([]);
      }
    } catch (error) {
      console.error("Error al cargar ciudades:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar las ciudades. Intente nuevamente.",
        variant: "destructive",
      });
      setCities([]);
    }
  };

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Limpiar el error cuando el usuario comienza a escribir
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Cargar estados si cambia el país
    if (name === "country_id") {
      loadStates(value);
      setFormData(prev => ({
        ...prev,
        state_id: "",
        city_id: ""
      }));
      setCities([]);
    }
    
    // Cargar ciudades si cambia el estado
    if (name === "state_id") {
      loadCities(value);
      setFormData(prev => ({
        ...prev,
        city_id: ""
      }));
    }
  };

  // Resetear el formulario
  const resetForm = () => {
    setFormData({
      supplier_id: "",
      name: "",
      email: "",
      phone: "",
      nit: "",
      address: "",
      country_id: "",
      state_id: "",
      city_id: ""
    });
    setFormErrors({});
  };

  // Validar el formulario
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.supplier_id.trim()) {
      errors.supplier_id = "El ID del proveedor es obligatorio";
    }
    
    if (!formData.name.trim()) {
      errors.name = "El nombre es obligatorio";
    }
    
    if (!formData.email.trim()) {
      errors.email = "El correo electrónico es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Formato de correo electrónico inválido";
    }
    
    if (!formData.nit.trim()) {
      errors.nit = "El NIT es obligatorio";
    }
    
    if (!formData.country_id) {
      errors.country_id = "Seleccione un país";
    }
    
    if (!formData.state_id) {
      errors.state_id = "Seleccione un departamento/estado";
    }
    
    if (!formData.city_id) {
      errors.city_id = "Seleccione una ciudad";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejar el envío del formulario para crear proveedor
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsFormLoading(true);
    
    try {
      console.log("Enviando datos para crear proveedor:", formData);
      await createSupplier(formData);
      
      toast({
        title: "Proveedor creado",
        description: "El proveedor ha sido creado exitosamente",
      });
      
      resetForm();
      setCreateOpen(false);
      await refreshSuppliers();
    } catch (error) {
      console.error("Error al crear proveedor:", error);
      
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message || "No se pudo crear el proveedor",
          variant: "destructive",
        });
      }
    } finally {
      setIsFormLoading(false);
    }
  };

  // Cargar datos de proveedor para edición
  const loadSupplierForEdit = (supplier: Supplier) => {
    setFormData({
      supplier_id: supplier.supplier_id,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone || "",
      nit: supplier.nit,
      address: supplier.address || "",
      country_id: supplier.country_id,
      state_id: supplier.state_id,
      city_id: supplier.city_id
    });
    
    setEditingId(supplier.id);
    
    // Cargar los estados y ciudades correspondientes
    loadStates(supplier.country_id);
    loadCities(supplier.state_id);
  };

  // Manejar el envío del formulario para actualizar proveedor
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !editingId) {
      return;
    }
    
    setIsFormLoading(true);
    
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        country_id: formData.country_id,
        state_id: formData.state_id,
        city_id: formData.city_id
      };
      
      console.log(`Enviando datos para actualizar proveedor ID ${editingId}:`, updateData);
      await updateSupplier(editingId, updateData);
      
      toast({
        title: "Proveedor actualizado",
        description: "El proveedor ha sido actualizado exitosamente",
      });
      
      resetForm();
      setEditOpen(false);
      setEditingId(null);
      await refreshSuppliers();
    } catch (error) {
      console.error("Error al actualizar proveedor:", error);
      
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message || "No se pudo actualizar el proveedor",
          variant: "destructive",
        });
      }
    } finally {
      setIsFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Proveedores</h2>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Listado de Proveedores</CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por ID, nombre o NIT..."
                  className="pl-8 w-full sm:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button variant="outline" size="icon" onClick={refreshSuppliers}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                <span className="sr-only">Refrescar</span>
              </Button>

              <Button variant="outline" size="icon">
                <FileDown className="h-4 w-4" />
                <span className="sr-only">Exportar</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">
                      <div className="flex items-center space-x-1 cursor-pointer" onClick={() => requestSort("supplier_id")}>
                        <span>ID</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center space-x-1 cursor-pointer" onClick={() => requestSort("name")}>
                        <span>Nombre</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <div className="flex items-center space-x-1 cursor-pointer" onClick={() => requestSort("email")}>
                        <span>Email</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <div className="flex items-center space-x-1 cursor-pointer" onClick={() => requestSort("phone")}>
                        <span>Teléfono</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      <div className="flex items-center space-x-1 cursor-pointer" onClick={() => requestSort("nit")}>
                        <span>NIT</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        No se encontraron registros que coincidan con los criterios de búsqueda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.supplier_id}</TableCell>
                        <TableCell>{supplier.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{supplier.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{supplier.phone || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{supplier.nit}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSupplier(supplier)
                                setDetailsOpen(true)
                              }}
                            >
                              Detalles
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                loadSupplierForEdit(supplier);
                                setEditOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500"
                              onClick={() => {
                                setSupplierToDelete(supplier)
                                setDeleteConfirmOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredSuppliers.length} de {suppliers.length} registros
          </div>
        </CardFooter>
      </Card>

      {/* Diálogo de detalles */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles del Proveedor</DialogTitle>
            <DialogDescription>Información detallada del proveedor seleccionado.</DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">ID</h3>
                  <p>{selectedSupplier.supplier_id}</p>
                </div>
                <div>
                  <h3 className="font-medium">NIT</h3>
                  <p>{selectedSupplier.nit}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium">Nombre</h3>
                <p>{selectedSupplier.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </h3>
                  <p>{selectedSupplier.email}</p>
                </div>
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Teléfono
                  </h3>
                  <p>{selectedSupplier.phone || '-'}</p>
                </div>
              </div>
              {selectedSupplier.address && (
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Dirección
                  </h3>
                  <p>{selectedSupplier.address}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium">País</h3>
                  <p>{selectedSupplier.country?.name || selectedSupplier.country_id}</p>
                </div>
                <div>
                  <h3 className="font-medium">Departamento</h3>
                  <p>{selectedSupplier.state?.name || selectedSupplier.state_id}</p>
                </div>
                <div>
                  <h3 className="font-medium">Ciudad</h3>
                  <p>{selectedSupplier.city?.name || selectedSupplier.city_id}</p>
                </div>
              </div>
              {selectedSupplier.created_at && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Fecha de Creación</h3>
                    <p>{new Date(selectedSupplier.created_at).toLocaleDateString()}</p>
                  </div>
                  {selectedSupplier.updated_at && (
                    <div>
                      <h3 className="font-medium">Última Actualización</h3>
                      <p>{new Date(selectedSupplier.updated_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para crear nuevo proveedor */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (open) {
          console.log("Abriendo diálogo de creación de proveedor");
          resetForm();
          // Cargar países cuando se abre el diálogo
          loadCountries();
        }
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
            <DialogDescription>Complete el formulario para registrar un nuevo proveedor.</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_id">ID del Proveedor *</Label>
                <Input
                  id="supplier_id"
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleFormChange}
                  placeholder="Ej: PROV001"
                  className={formErrors.supplier_id ? "border-red-500" : ""}
                  disabled={isFormLoading}
                />
                {formErrors.supplier_id && (
                  <p className="text-sm text-red-500">{formErrors.supplier_id}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Nombre del proveedor"
                  className={formErrors.name ? "border-red-500" : ""}
                  disabled={isFormLoading}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="email@ejemplo.com"
                  className={formErrors.email ? "border-red-500" : ""}
                  disabled={isFormLoading}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="+57 300 123 4567"
                  disabled={isFormLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nit">NIT *</Label>
                <Input
                  id="nit"
                  name="nit"
                  value={formData.nit}
                  onChange={handleFormChange}
                  placeholder="NIT del proveedor"
                  className={formErrors.nit ? "border-red-500" : ""}
                  disabled={isFormLoading}
                />
                {formErrors.nit && (
                  <p className="text-sm text-red-500">{formErrors.nit}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="Dirección del proveedor"
                  disabled={isFormLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country_id">País *</Label>
                <Select
                  disabled={isFormLoading}
                  value={formData.country_id}
                  onValueChange={(value) => {
                    const event = {
                      target: { 
                        name: "country_id", 
                        value 
                      }
                    } as React.ChangeEvent<HTMLSelectElement>;
                    handleFormChange(event);
                  }}
                >
                  <SelectTrigger className={formErrors.country_id ? "border-red-500" : ""}>
                    <SelectValue placeholder="Seleccione un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.length === 0 ? (
                      <div className="py-2 px-1 text-center text-sm text-gray-500">
                        No hay países disponibles
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="ml-2" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            loadCountries();
                          }}
                        >
                          Reintentar
                        </Button>
                      </div>
                    ) : (
                      countries.map(country => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formErrors.country_id && (
                  <p className="text-sm text-red-500">{formErrors.country_id}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state_id">Departamento/Estado *</Label>
                <Select
                  disabled={isFormLoading || !formData.country_id}
                  value={formData.state_id}
                  onValueChange={(value) => {
                    const event = {
                      target: { 
                        name: "state_id", 
                        value 
                      }
                    } as React.ChangeEvent<HTMLSelectElement>;
                    handleFormChange(event);
                  }}
                >
                  <SelectTrigger className={formErrors.state_id ? "border-red-500" : ""}>
                    <SelectValue placeholder={formData.country_id ? "Seleccione un departamento" : "Primero seleccione un país"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!formData.country_id ? (
                      <div className="py-2 px-1 text-center text-sm text-gray-500">
                        Primero seleccione un país
                      </div>
                    ) : states.length === 0 ? (
                      <div className="py-2 px-1 text-center text-sm text-gray-500">
                        No hay departamentos disponibles
                        <Button 
                          variant="link" 
                          size="sm"
                          className="ml-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            loadStates(formData.country_id);
                          }}
                        >
                          Reintentar
                        </Button>
                      </div>
                    ) : (
                      states.map(state => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formErrors.state_id && (
                  <p className="text-sm text-red-500">{formErrors.state_id}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city_id">Ciudad *</Label>
                <Select
                  disabled={isFormLoading || !formData.state_id}
                  value={formData.city_id}
                  onValueChange={(value) => {
                    const event = {
                      target: { 
                        name: "city_id", 
                        value 
                      }
                    } as React.ChangeEvent<HTMLSelectElement>;
                    handleFormChange(event);
                  }}
                >
                  <SelectTrigger className={formErrors.city_id ? "border-red-500" : ""}>
                    <SelectValue placeholder={formData.state_id ? "Seleccione una ciudad" : "Primero seleccione un departamento"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!formData.state_id ? (
                      <div className="py-2 px-1 text-center text-sm text-gray-500">
                        Primero seleccione un departamento
                      </div>
                    ) : cities.length === 0 ? (
                      <div className="py-2 px-1 text-center text-sm text-gray-500">
                        No hay ciudades disponibles
                        <Button 
                          variant="link" 
                          size="sm"
                          className="ml-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            loadCities(formData.state_id);
                          }}
                        >
                          Reintentar
                        </Button>
                      </div>
                    ) : (
                      cities.map(city => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formErrors.city_id && (
                  <p className="text-sm text-red-500">{formErrors.city_id}</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCreateOpen(false)} 
                disabled={isFormLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isFormLoading}
              >
                {isFormLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Proveedor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar proveedor */}
      <Dialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open);
        if (open) {
          console.log("Abriendo diálogo de edición de proveedor");
          // Cargar países cuando se abre el diálogo
          loadCountries();
        }
        if (!open) {
          resetForm();
          setEditingId(null);
        }
      }}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
            <DialogDescription>Actualice la información del proveedor.</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_id_edit">ID del Proveedor</Label>
                <Input
                  id="supplier_id_edit"
                  name="supplier_id"
                  value={formData.supplier_id}
                  disabled={true} // No se puede editar el ID
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name_edit">Nombre *</Label>
                <Input
                  id="name_edit"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Nombre del proveedor"
                  className={formErrors.name ? "border-red-500" : ""}
                  disabled={isFormLoading}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email_edit">Correo Electrónico *</Label>
                <Input
                  id="email_edit"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="email@ejemplo.com"
                  className={formErrors.email ? "border-red-500" : ""}
                  disabled={isFormLoading}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone_edit">Teléfono</Label>
                <Input
                  id="phone_edit"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="+57 300 123 4567"
                  disabled={isFormLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nit_edit">NIT</Label>
                <Input
                  id="nit_edit"
                  name="nit"
                  value={formData.nit}
                  disabled={true} // No se puede editar el NIT
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address_edit">Dirección</Label>
                <Input
                  id="address_edit"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="Dirección del proveedor"
                  disabled={isFormLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country_id_edit">País *</Label>
                <Select
                  disabled={isFormLoading}
                  value={formData.country_id}
                  onValueChange={(value) => {
                    const event = {
                      target: { 
                        name: "country_id", 
                        value 
                      }
                    } as React.ChangeEvent<HTMLSelectElement>;
                    handleFormChange(event);
                  }}
                >
                  <SelectTrigger className={formErrors.country_id ? "border-red-500" : ""}>
                    <SelectValue placeholder="Seleccione un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.length === 0 ? (
                      <div className="py-2 px-1 text-center text-sm text-gray-500">
                        No hay países disponibles
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="ml-2" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            loadCountries();
                          }}
                        >
                          Reintentar
                        </Button>
                      </div>
                    ) : (
                      countries.map(country => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formErrors.country_id && (
                  <p className="text-sm text-red-500">{formErrors.country_id}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state_id_edit">Departamento/Estado *</Label>
                <Select
                  disabled={isFormLoading || !formData.country_id}
                  value={formData.state_id}
                  onValueChange={(value) => {
                    const event = {
                      target: { 
                        name: "state_id", 
                        value 
                      }
                    } as React.ChangeEvent<HTMLSelectElement>;
                    handleFormChange(event);
                  }}
                >
                  <SelectTrigger className={formErrors.state_id ? "border-red-500" : ""}>
                    <SelectValue placeholder={formData.country_id ? "Seleccione un departamento" : "Primero seleccione un país"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!formData.country_id ? (
                      <div className="py-2 px-1 text-center text-sm text-gray-500">
                        Primero seleccione un país
                      </div>
                    ) : states.length === 0 ? (
                      <div className="py-2 px-1 text-center text-sm text-gray-500">
                        No hay departamentos disponibles
                        <Button 
                          variant="link" 
                          size="sm"
                          className="ml-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            loadStates(formData.country_id);
                          }}
                        >
                          Reintentar
                        </Button>
                      </div>
                    ) : (
                      states.map(state => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formErrors.state_id && (
                  <p className="text-sm text-red-500">{formErrors.state_id}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city_id_edit">Ciudad *</Label>
                <Select
                  disabled={isFormLoading || !formData.state_id}
                  value={formData.city_id}
                  onValueChange={(value) => {
                    const event = {
                      target: { 
                        name: "city_id", 
                        value 
                      }
                    } as React.ChangeEvent<HTMLSelectElement>;
                    handleFormChange(event);
                  }}
                >
                  <SelectTrigger className={formErrors.city_id ? "border-red-500" : ""}>
                    <SelectValue placeholder={formData.state_id ? "Seleccione una ciudad" : "Primero seleccione un departamento"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!formData.state_id ? (
                      <div className="py-2 px-1 text-center text-sm text-gray-500">
                        Primero seleccione un departamento
                      </div>
                    ) : cities.length === 0 ? (
                      <div className="py-2 px-1 text-center text-sm text-gray-500">
                        No hay ciudades disponibles
                        <Button 
                          variant="link" 
                          size="sm"
                          className="ml-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            loadCities(formData.state_id);
                          }}
                        >
                          Reintentar
                        </Button>
                      </div>
                    ) : (
                      cities.map(city => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formErrors.city_id && (
                  <p className="text-sm text-red-500">{formErrors.city_id}</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditOpen(false)} 
                disabled={isFormLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isFormLoading}
              >
                {isFormLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar Proveedor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar este proveedor? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {supplierToDelete && (
            <div className="py-4">
              <p className="text-sm font-medium">Se eliminará el siguiente proveedor:</p>
              <p className="text-sm font-bold mt-2">{supplierToDelete.name} (ID: {supplierToDelete.supplier_id})</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteSupplier} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

