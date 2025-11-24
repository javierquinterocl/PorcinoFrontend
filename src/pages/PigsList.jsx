import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Filter, Download, Eye, Edit2, Trash2, ArrowUpDown, X } from "lucide-react"
import { pigService } from "@/services/api"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PigsListPage() {
  const [pigs, setPigs] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" })
  const [page, setPage] = useState(1)
  const pageSize = 8
  const { toast } = useToast()

  // Estados para modales
  const [viewDialog, setViewDialog] = useState({ open: false, pig: null })
  const [editDialog, setEditDialog] = useState({ open: false, pig: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, pig: null })
  const [createDialog, setCreateDialog] = useState(false)
  
  // Estados para formularios
  const [formData, setFormData] = useState({
    pigId: "",
    name: "",
    breed: "",
    birthDate: "",
    gender: "",
    pigType: "ENGORDE",
    weight: 0,
    averageDailyGain: 0,
    feedConsumption: 0,
    vaccinationsCount: 0,
    heatCycles: 0,
    litterCount: 0,
    parentId: "",
    status: "ACTIVE",
    notes: ""
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadPigs = useCallback(async () => {
    try {
      setIsLoading(true)
      const pigsData = await pigService.getAllPigs()
      setPigs(Array.isArray(pigsData) ? pigsData : [])
    } catch (error) {
      console.error("Error cargando cerdos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los cerdos",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadPigs()
  }, [loadPigs])

  // Funciones para abrir modales
  const handleView = (pig) => {
    setViewDialog({ open: true, pig })
  }

  const handleEdit = (pig) => {
    setFormData({
      pigId: pig.pigId || "",
      name: pig.name || "",
      breed: pig.breed || "",
      birthDate: pig.birthDate || "",
      gender: pig.gender || "",
      pigType: pig.pigType || "ENGORDE",
      weight: pig.weight || 0,
      averageDailyGain: pig.averageDailyGain || 0,
      feedConsumption: pig.feedConsumption || 0,
      vaccinationsCount: pig.vaccinationsCount || 0,
      heatCycles: pig.heatCycles || 0,
      litterCount: pig.litterCount || 0,
      parentId: pig.parentId || "",
      status: pig.status || "ACTIVE",
      notes: pig.notes || ""
    })
    setFormErrors({})
    setEditDialog({ open: true, pig })
  }

  const handleDelete = (pig) => {
    setDeleteDialog({ open: true, pig })
  }

  const handleCreate = () => {
    setFormData({
      pigId: "",
      name: "",
      breed: "",
      birthDate: "",
      gender: "",
      pigType: "ENGORDE",
      weight: 0,
      averageDailyGain: 0,
      feedConsumption: 0,
      vaccinationsCount: 0,
      heatCycles: 0,
      litterCount: 0,
      parentId: "",
      status: "ACTIVE",
      notes: ""
    })
    setFormErrors({})
    setCreateDialog(true)
  }

  // Validación de formulario
  const validateForm = () => {
    const errors = {}
    
    if (!formData.pigId?.trim()) errors.pigId = "El ID de cerdo es requerido"
    if (!formData.name?.trim()) errors.name = "El nombre es requerido"
    if (!formData.breed?.trim()) errors.breed = "La raza es requerida"
    if (!formData.birthDate?.trim()) errors.birthDate = "La fecha de nacimiento es requerida"
    if (!formData.gender?.trim()) errors.gender = "El género es requerido"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Manejar creación
  const handleCreateSubmit = async () => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      await pigService.createPig(formData)
      toast({
        title: "Éxito",
        description: "Cerdo creado correctamente",
        className: "bg-green-50 border-green-200"
      })
      setCreateDialog(false)
      loadPigs()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el cerdo",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar edición
  const handleEditSubmit = async () => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      await pigService.updatePig(editDialog.pig.id, formData)
      toast({
        title: "Éxito",
        description: "Cerdo actualizado correctamente",
        className: "bg-green-50 border-green-200"
      })
      setEditDialog({ open: false, pig: null })
      loadPigs()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el cerdo",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar eliminación
  const handleDeleteConfirm = async () => {
    try {
      setIsSubmitting(true)
      await pigService.deletePig(deleteDialog.pig.id)
      toast({
        title: "Éxito",
        description: "Cerdo eliminado correctamente",
        className: "bg-green-50 border-green-200"
      })
      setDeleteDialog({ open: false, pig: null })
      loadPigs()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el cerdo",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim()
    let data = [...pigs]
    
    if (term) {
      const isNumeric = /^\d+$/.test(term)
      
      if (isNumeric) {
        const searchId = parseInt(term, 10)
        data = data.filter(g => g.id === searchId)
      } else {
        const termLower = term.toLowerCase()
        data = data.filter(g => {
          return [g.pigId, g.name, g.breed, g.gender, g.pigType, g.status]
            .filter(Boolean)
            .some(v => v.toLowerCase().includes(termLower))
        })
      }
    }
    
    data.sort((a, b) => {
      const { key, direction } = sortConfig
      const av = (a[key] ?? "").toString().toLowerCase()
      const bv = (b[key] ?? "").toString().toLowerCase()
      if (av < bv) return direction === "asc" ? -1 : 1
      if (av > bv) return direction === "asc" ? 1 : -1
      return 0
    })
    return data
  }, [pigs, search, sortConfig])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const toggleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" }
      }
      return { key, direction: "asc" }
    })
  }

  const SortButton = ({ colKey, children }) => (
    <button
      type="button"
      onClick={() => toggleSort(colKey)}
      className="inline-flex items-center gap-1 group"
    >
      {children}
      <ArrowUpDown className={`h-3.5 w-3.5 opacity-50 group-hover:opacity-80 ${sortConfig.key === colKey ? 'text-primary opacity-100' : ''}`} />
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Header con título y botón */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Cerdos</h1>
        <Button 
          onClick={handleCreate}
          className="bg-[#6b7c45] hover:bg-[#5a6b35] text-white"
        >
          + Nuevo Cerdo
        </Button>
      </div>

      {/* Card principal con tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Barra de búsqueda */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Listado de Cerdos</h2>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID, nombre, raza..."
                className="pl-9 bg-white border-gray-300"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Button variant="outline" className="gap-2 border-gray-300">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <Button variant="outline" className="gap-2 border-gray-300">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="id">ID</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="pigId">ID Cerdo</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="name">Nombre</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="breed">Raza</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="gender">Género</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="pigType">Categoría</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="status">Estado</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && pigs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-gray-500">
                    Cargando cerdos...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-gray-500">
                    No se encontraron cerdos
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((pig) => (
                <TableRow key={pig.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-900">{pig.id}</TableCell>
                  <TableCell className="text-gray-700">{pig.pigId}</TableCell>
                  <TableCell className="text-gray-700">{pig.name}</TableCell>
                  <TableCell className="text-gray-600">{pig.breed}</TableCell>
                  <TableCell className="text-gray-600">
                    {pig.gender === 'MALE' ? 'Macho' : pig.gender === 'FEMALE' ? 'Hembra' : pig.gender}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {pig.pigType === 'ENGORDE' ? 'Engorde' : 
                       pig.pigType === 'REPRODUCTORA' ? 'Reproductora' :
                       pig.pigType === 'PADRILLO' ? 'Padrillo' :
                       pig.pigType === 'LECHON' ? 'Lechón' : pig.pigType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      pig.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                      pig.status === 'SOLD' ? 'bg-yellow-100 text-yellow-800' :
                      pig.status === 'DECEASED' ? 'bg-red-100 text-red-800' :
                      pig.status === 'SACRIFICED' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pig.status === 'ACTIVE' ? 'Activo' :
                       pig.status === 'SOLD' ? 'Vendido' :
                       pig.status === 'DECEASED' ? 'Fallecido' :
                       pig.status === 'SACRIFICED' ? 'Sacrificado' : pig.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleView(pig)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-blue-600"
                        title="Detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(pig)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-green-600"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pig)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer con paginación */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {pageData.length} de {filtered.length} registros
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-gray-300"
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-gray-300"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      {/* Modal para Ver Detalles */}
      <Dialog open={viewDialog.open} onOpenChange={(open) => !open && setViewDialog({ open: false, pig: null })}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles del Cerdo</DialogTitle>
            <DialogDescription>
              Información completa del cerdo seleccionado
            </DialogDescription>
          </DialogHeader>
          {viewDialog.pig && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">ID</Label>
                  <p className="text-sm mt-1">{viewDialog.pig.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">ID Cerdo</Label>
                  <p className="text-sm mt-1">{viewDialog.pig.pigId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Estado</Label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      viewDialog.pig.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                      viewDialog.pig.status === 'SOLD' ? 'bg-yellow-100 text-yellow-800' :
                      viewDialog.pig.status === 'DECEASED' ? 'bg-red-100 text-red-800' :
                      viewDialog.pig.status === 'SACRIFICED' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {viewDialog.pig.status === 'ACTIVE' ? 'Activo' :
                       viewDialog.pig.status === 'SOLD' ? 'Vendido' :
                       viewDialog.pig.status === 'DECEASED' ? 'Fallecido' :
                       viewDialog.pig.status === 'SACRIFICED' ? 'Sacrificado' : viewDialog.pig.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nombre</Label>
                  <p className="text-sm mt-1">{viewDialog.pig.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Raza</Label>
                  <p className="text-sm mt-1">{viewDialog.pig.breed}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Fecha Nacimiento</Label>
                  <p className="text-sm mt-1">{viewDialog.pig.birthDate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Género</Label>
                  <p className="text-sm mt-1">
                    {viewDialog.pig.gender === 'MALE' ? 'Macho' : 
                     viewDialog.pig.gender === 'FEMALE' ? 'Hembra' : viewDialog.pig.gender}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Categoría</Label>
                  <p className="text-sm mt-1">
                    {viewDialog.pig.pigType === 'ENGORDE' ? 'Engorde' :
                     viewDialog.pig.pigType === 'REPRODUCTORA' ? 'Reproductora' :
                     viewDialog.pig.pigType === 'PADRILLO' ? 'Padrillo' :
                     viewDialog.pig.pigType === 'LECHON' ? 'Lechón' : viewDialog.pig.pigType}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Peso (kg)</Label>
                  <p className="text-sm mt-1">{viewDialog.pig.weight}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Ganancia diaria (kg/día)</Label>
                  <p className="text-sm mt-1">{viewDialog.pig.averageDailyGain}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Consumo Alimento (kg)</Label>
                  <p className="text-sm mt-1">{viewDialog.pig.feedConsumption}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Vacunaciones</Label>
                  <p className="text-sm mt-1">{viewDialog.pig.vaccinationsCount}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Ciclos de celo</Label>
                  <p className="text-sm mt-1">{viewDialog.pig.heatCycles}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Camadas</Label>
                  <p className="text-sm mt-1">{viewDialog.pig.litterCount}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">ID Padre/Madre</Label>
                <p className="text-sm mt-1">{viewDialog.pig.parentId || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Notas</Label>
                <p className="text-sm mt-1">{viewDialog.pig.notes || 'Sin notas'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog({ open: false, pig: null })}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Crear Cerdo */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Cerdo</DialogTitle>
            <DialogDescription>
              Complete los campos para registrar un nuevo cerdo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-pigId">ID Cerdo *</Label>
                <Input
                  id="create-pigId"
                  value={formData.pigId}
                  onChange={(e) => handleFormChange('pigId', e.target.value)}
                  className={formErrors.pigId ? 'border-red-500' : ''}
                />
                {formErrors.pigId && <p className="text-xs text-red-500 mt-1">{formErrors.pigId}</p>}
              </div>
              <div>
                <Label htmlFor="create-name">Nombre *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-breed">Raza *</Label>
                <Select value={formData.breed} onValueChange={(value) => handleFormChange('breed', value)}>
                  <SelectTrigger className={`bg-white ${formErrors.breed ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Seleccione raza" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Large White">Large White</SelectItem>
                    <SelectItem value="Duroc">Duroc</SelectItem>
                    <SelectItem value="Landrace">Landrace</SelectItem>
                    <SelectItem value="Pietrain">Pietrain</SelectItem>
                    <SelectItem value="Hampshire">Hampshire</SelectItem>
                    <SelectItem value="Yorkshire">Yorkshire</SelectItem>
                    <SelectItem value="Berkshire">Berkshire</SelectItem>
                    <SelectItem value="Tamworth">Tamworth</SelectItem>
                    <SelectItem value="Criollo">Criollo</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.breed && <p className="text-xs text-red-500 mt-1">{formErrors.breed}</p>}
              </div>
              <div>
                <Label htmlFor="create-birthDate">Fecha Nacimiento *</Label>
                <Input
                  id="create-birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleFormChange('birthDate', e.target.value)}
                  className={formErrors.birthDate ? 'border-red-500' : ''}
                />
                {formErrors.birthDate && <p className="text-xs text-red-500 mt-1">{formErrors.birthDate}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-gender">Género *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleFormChange('gender', value)}>
                  <SelectTrigger className={`bg-white ${formErrors.gender ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Seleccione género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Macho</SelectItem>
                    <SelectItem value="FEMALE">Hembra</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.gender && <p className="text-xs text-red-500 mt-1">{formErrors.gender}</p>}
              </div>
              <div>
                <Label htmlFor="create-pigType">Categoría</Label>
                <Select value={formData.pigType} onValueChange={(value) => handleFormChange('pigType', value)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENGORDE">Engorde</SelectItem>
                    <SelectItem value="REPRODUCTORA">Reproductora</SelectItem>
                    <SelectItem value="PADRILLO">Padrillo</SelectItem>
                    <SelectItem value="LECHON">Lechón</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="create-weight">Peso (kg)</Label>
                <Input
                  id="create-weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleFormChange('weight', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="create-averageDailyGain">Ganancia diaria (kg/día)</Label>
                <Input
                  id="create-averageDailyGain"
                  type="number"
                  step="0.01"
                  value={formData.averageDailyGain}
                  onChange={(e) => handleFormChange('averageDailyGain', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="create-feedConsumption">Consumo alimento (kg)</Label>
                <Input
                  id="create-feedConsumption"
                  type="number"
                  step="0.1"
                  value={formData.feedConsumption}
                  onChange={(e) => handleFormChange('feedConsumption', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="create-vaccinationsCount">Vacunaciones</Label>
                <Input
                  id="create-vaccinationsCount"
                  type="number"
                  value={formData.vaccinationsCount}
                  onChange={(e) => handleFormChange('vaccinationsCount', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="create-heatCycles">Ciclos de celo</Label>
                <Input
                  id="create-heatCycles"
                  type="number"
                  value={formData.heatCycles}
                  onChange={(e) => handleFormChange('heatCycles', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="create-litterCount">Camadas</Label>
                <Input
                  id="create-litterCount"
                  type="number"
                  value={formData.litterCount}
                  onChange={(e) => handleFormChange('litterCount', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-parentId">ID Padre/Madre</Label>
                <Input
                  id="create-parentId"
                  value={formData.parentId}
                  onChange={(e) => handleFormChange('parentId', e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label htmlFor="create-status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => handleFormChange('status', value)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="SOLD">Vendido</SelectItem>
                    <SelectItem value="DECEASED">Fallecido</SelectItem>
                    <SelectItem value="SACRIFICED">Sacrificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="create-notes">Notas</Label>
              <Input
                id="create-notes"
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Notas adicionales"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateSubmit} 
              disabled={isSubmitting}
              className="bg-[#6b7c45] hover:bg-[#5a6b35] text-white"
            >
              {isSubmitting ? "Creando..." : "Crear Cerdo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Cerdo */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, pig: null })}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cerdo</DialogTitle>
            <DialogDescription>
              Modifique los campos que desea actualizar
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-pigId">ID Cerdo *</Label>
                <Input
                  id="edit-pigId"
                  value={formData.pigId}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">El ID de cerdo no se puede modificar</p>
              </div>
              <div>
                <Label htmlFor="edit-name">Nombre *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-breed">Raza *</Label>
                <Select value={formData.breed} onValueChange={(value) => handleFormChange('breed', value)}>
                  <SelectTrigger className={`bg-white ${formErrors.breed ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Seleccione raza" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Saanen">Saanen</SelectItem>
                    <SelectItem value="Alpina">Alpina</SelectItem>
                    <SelectItem value="Toggenburg">Toggenburg</SelectItem>
                    <SelectItem value="Nubian">Nubian</SelectItem>
                    <SelectItem value="LaMancha">LaMancha</SelectItem>
                    <SelectItem value="Boer">Boer</SelectItem>
                    <SelectItem value="Oberhasli">Oberhasli</SelectItem>
                    <SelectItem value="Anglo-Nubian">Anglo-Nubian</SelectItem>
                    <SelectItem value="Criolla">Criolla</SelectItem>
                    <SelectItem value="Murciano-Granadina">Murciano-Granadina</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.breed && <p className="text-xs text-red-500 mt-1">{formErrors.breed}</p>}
              </div>
              <div>
                <Label htmlFor="edit-birthDate">Fecha Nacimiento *</Label>
                <Input
                  id="edit-birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleFormChange('birthDate', e.target.value)}
                  className={formErrors.birthDate ? 'border-red-500' : ''}
                />
                {formErrors.birthDate && <p className="text-xs text-red-500 mt-1">{formErrors.birthDate}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-gender">Género *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleFormChange('gender', value)}>
                  <SelectTrigger className={`bg-white ${formErrors.gender ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Seleccione género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Macho</SelectItem>
                    <SelectItem value="FEMALE">Hembra</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.gender && <p className="text-xs text-red-500 mt-1">{formErrors.gender}</p>}
              </div>
              <div>
                <Label htmlFor="edit-pigType">Categoría</Label>
                <Select value={formData.pigType} onValueChange={(value) => handleFormChange('pigType', value)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENGORDE">Engorde</SelectItem>
                    <SelectItem value="REPRODUCTORA">Reproductora</SelectItem>
                    <SelectItem value="PADRILLO">Padrillo</SelectItem>
                    <SelectItem value="LECHON">Lechón</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-weight">Peso (kg)</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleFormChange('weight', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="edit-averageDailyGain">Ganancia diaria (kg/día)</Label>
                <Input
                  id="edit-averageDailyGain"
                  type="number"
                  step="0.01"
                  value={formData.averageDailyGain}
                  onChange={(e) => handleFormChange('averageDailyGain', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="edit-feedConsumption">Consumo alimento (kg)</Label>
                <Input
                  id="edit-feedConsumption"
                  type="number"
                  step="0.1"
                  value={formData.feedConsumption}
                  onChange={(e) => handleFormChange('feedConsumption', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-vaccinationsCount">Vacunaciones</Label>
                <Input
                  id="edit-vaccinationsCount"
                  type="number"
                  value={formData.vaccinationsCount}
                  onChange={(e) => handleFormChange('vaccinationsCount', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="edit-heatCycles">Ciclos de celo</Label>
                <Input
                  id="edit-heatCycles"
                  type="number"
                  value={formData.heatCycles}
                  onChange={(e) => handleFormChange('heatCycles', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="edit-litterCount">Camadas</Label>
                <Input
                  id="edit-litterCount"
                  type="number"
                  value={formData.litterCount}
                  onChange={(e) => handleFormChange('litterCount', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-parentId">ID Padre/Madre</Label>
                <Input
                  id="edit-parentId"
                  value={formData.parentId}
                  onChange={(e) => handleFormChange('parentId', e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => handleFormChange('status', value)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="SOLD">Vendido</SelectItem>
                    <SelectItem value="DECEASED">Fallecido</SelectItem>
                    <SelectItem value="SACRIFICED">Sacrificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notas</Label>
              <Input
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Notas adicionales"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, pig: null })} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEditSubmit} 
              disabled={isSubmitting}
              className="bg-[#6b7c45] hover:bg-[#5a6b35] text-white"
            >
              {isSubmitting ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Confirmar Eliminación */}
      {/* Modal de Eliminación */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, pig: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar este cerdo? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.pig && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Cerdo:</span> {deleteDialog.pig.name} ({deleteDialog.pig.pigId})
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Raza:</span> {deleteDialog.pig.breed}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, pig: null })} 
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              disabled={isSubmitting}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
