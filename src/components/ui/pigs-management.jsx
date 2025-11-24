import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Edit, Filter, Plus, Search, Trash2, ArrowDownUp } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Importar funciones de API
import { 
  getAllPigs, 
  createPig, 
  updatePig, 
  deletePig,
  getAllVaccines,
  createVaccine
} from "@/services/api"

// Importar interfaces
import { Pig, CreatePigData, UpdatePigData } from "@/interfaces/pig"
import { Vaccine, CreateVaccineData } from '@/interfaces/vaccine'

export function PigsManagement() {
  const { toast } = useToast()
  
  // Estados para datos
  const [pigs, setPigs] = useState<Pig[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados para UI
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key; direction: "ascending" | "descending" } | null>(null)
  const [activeFilters, setActiveFilters] = useState<{
    sex
    pig_
  }>({
    sex: [],
    pig_type: [],
    breed: []
  })

  // Estados para diálogos
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedPig, setSelectedPig] = useState<Pig | null>(null)
  const [pigToEdit, setPigToEdit] = useState<Pig | null>(null)

  // Estados para formularios
  const [formData, setFormData] = useState<CreatePigData>({
    pig_id: "",
    name: "",
    birthDate: "",
    gender: "female",
    breed: "",
    pig_type: "CRIA",
    weight: 0,
    milk_production: 0,
    food_consumption: 0,
    vaccinations_count: 0,
    heat_periods: 0,
    offspring_count: 0
  })

  // Estados para vacunas
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [loadingVaccines, setLoadingVaccines] = useState(true)
  const [vaccineForm, setVaccineForm] = useState<CreateVaccineData>({
    pig_id: 0,
    name: '',
    dose: 0,
    unit: 'lt',
    application_date: ''
  })
  const [vaccineDialogOpen, setVaccineDialogOpen] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
    loadVaccines()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const pigsData = await getAllPigs()
      
      // Validar y filtrar datos para asegurar que tengan IDs válidos
      const validPigs = (pigsData || []).filter(pig => 
        pig && pig.id && pig.pig_id && pig.name
      ).map(pig => ({
        ...pig,
        weight: typeof pig.weight === 'number' ? pig.weight : parseFloat(pig.weight || '0'),
        milk_production: typeof pig.milk_production === 'number' ? pig.milk_production : parseFloat(pig.milk_production || '0'),
        food_consumption: typeof pig.food_consumption === 'number' ? pig.food_consumption : parseFloat(pig.food_consumption || '0'),
        vaccinations_count: typeof pig.vaccinations_count === 'number' ? pig.vaccinations_count : parseInt(pig.vaccinations_count || '0'),
        heat_periods: typeof pig.heat_periods === 'number' ? pig.heat_periods : parseInt(pig.heat_periods || '0'),
        offspring_count: typeof pig.offspring_count === 'number' ? pig.offspring_count : parseInt(pig.offspring_count || '0')
      }))
      
      setPigs(validPigs)
      
      toast({
        title: "Datos cargados",
        description: `${validPigs.length} porcinos cargados correctamente.`,
      })
    } catch {
      toast({
        title: "Error",
        description: "Error al cargar los datos de porcinos. Verifica que el servidor esté funcionando.",
        variant: "destructive",
      })
      setPigs([])
    } finally {
      setLoading(false)
    }
  }

  const loadVaccines = async () => {
    try {
      setLoadingVaccines(true)
      const data = await getAllVaccines()
      setVaccines(data)
    } catch {
      toast({
        title: "Error",
        description: "Error al cargar vacunas",
        variant: "destructive",
      })
      setVaccines([])
    } finally {
      setLoadingVaccines(false)
    }
  }

  // Función para crear porcino
  const handleCreatePig = async () => {
    try {
      if (!formData.pig_id || !formData.name || !formData.birthDate || !formData.gender || !formData.breed || !formData.pig_type) {
        toast({
          title: "Error",
          description: "Por favor complete todos los campos obligatorios.",
          variant: "destructive",
        })
        return
      }

      const newPig = await createPig(formData)
      
      // Normalizar tipos de datos del nuevo porcino
      const normalizedPig = {
        ...newPig,
        weight: typeof newPig.weight === 'number' ? newPig.weight : parseFloat(newPig.weight || '0'),
        milk_production: typeof newPig.milk_production === 'number' ? newPig.milk_production : parseFloat(newPig.milk_production || '0'),
        food_consumption: typeof newPig.food_consumption === 'number' ? newPig.food_consumption : parseFloat(newPig.food_consumption || '0'),
        vaccinations_count: typeof newPig.vaccinations_count === 'number' ? newPig.vaccinations_count : parseInt(newPig.vaccinations_count || '0'),
        heat_periods: typeof newPig.heat_periods === 'number' ? newPig.heat_periods : parseInt(newPig.heat_periods || '0'),
        offspring_count: typeof newPig.offspring_count === 'number' ? newPig.offspring_count : parseInt(newPig.offspring_count || '0')
      }
      
      setPigs([normalizedPig, ...pigs])
      setCreateOpen(false)
      resetFormData()
      
      toast({
        title: "Porcino creado",
        description: `El porcino ${newPig.name} ha sido creado exitosamente.`,
      })
    } catch {
      toast({
        title: "Error",
        description: "Error al crear el porcino.",
        variant: "destructive",
      })
    }
  }

  // Función para actualizar porcino
  const handleUpdatePig = async () => {
    try {
      if (!pigToEdit) return

      const updateData: UpdatePigData = {
        name: formData.name,
        birthDate: formData.birthDate,
        gender: formData.gender,
        breed: formData.breed,
        pig_type: formData.pig_type,
        weight: formData.weight,
        milk_production: formData.milk_production,
        food_consumption: formData.food_consumption,
        vaccinations_count: formData.vaccinations_count,
        heat_periods: formData.heat_periods,
        offspring_count: formData.offspring_count,
        parent_id: formData.parent_id
      }

      const updatedPig = await updatePig(pigToEdit.id, updateData)
      
      // Normalizar tipos de datos del porcino actualizado
      const normalizedPig = {
        ...updatedPig,
        weight: typeof updatedPig.weight === 'number' ? updatedPig.weight : parseFloat(updatedPig.weight || '0'),
        milk_production: typeof updatedPig.milk_production === 'number' ? updatedPig.milk_production : parseFloat(updatedPig.milk_production || '0'),
        food_consumption: typeof updatedPig.food_consumption === 'number' ? updatedPig.food_consumption : parseFloat(updatedPig.food_consumption || '0'),
        vaccinations_count: typeof updatedPig.vaccinations_count === 'number' ? updatedPig.vaccinations_count : parseInt(updatedPig.vaccinations_count || '0'),
        heat_periods: typeof updatedPig.heat_periods === 'number' ? updatedPig.heat_periods : parseInt(updatedPig.heat_periods || '0'),
        offspring_count: typeof updatedPig.offspring_count === 'number' ? updatedPig.offspring_count : parseInt(updatedPig.offspring_count || '0')
      }
      
      setPigs(pigs.map(g => g.id === pigToEdit.id ? normalizedPig : g))
      setEditOpen(false)
      setPigToEdit(null)
      resetFormData()
      
      toast({
        title: "Porcino actualizado",
        description: `El porcino ${updatedPig.name} ha sido actualizado exitosamente.`,
      })
    } catch {
      toast({
        title: "Error",
        description: "Error al actualizar el porcino.",
        variant: "destructive",
      })
    }
  }

  // Función para eliminar porcino
  const handleDeletePig = async (pig: Pig) => {
    try {
      await deletePig(pig.id)
      setPigs(pigs.filter(g => g.id !== pig.id))
      
      toast({
        title: "Porcino eliminado",
        description: `El porcino ${pig.name} ha sido eliminado exitosamente.`,
      })
    } catch {
      toast({
        title: "Error",
        description: "Error al eliminar el porcino.",
        variant: "destructive",
      })
    }
  }

  const resetFormData = () => {
    setFormData({
      pig_id: "",
      name: "",
      birthDate: "",
      gender: "female",
      breed: "",
      pig_type: "CRIA",
      weight: 0,
      milk_production: 0,
      food_consumption: 0,
      vaccinations_count: 0,
      heat_periods: 0,
      offspring_count: 0
    })
  }

  const openEditDialog = (pig: Pig) => {
    setPigToEdit(pig)
    setFormData({
      pig_id: pig.pig_id,
      name: pig.name,
      birthDate: pig.birthDate,
      gender: pig.gender,
      breed: pig.breed,
      pig_type: pig.pig_type,
      weight: pig.weight,
      milk_production: pig.milk_production,
      food_consumption: pig.food_consumption,
      vaccinations_count: pig.vaccinations_count,
      heat_periods: pig.heat_periods,
      offspring_count: pig.offspring_count,
      parent_id: pig.parent_id
    })
    setEditOpen(true)
  }

  const openDetailsDialog = (pig: Pig) => {
    setSelectedPig(pig)
    setDetailsOpen(true)
  }

  const requestSort = (key) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Aplicar filtros y ordenamiento
  let filteredPigs = [...pigs]

  // Aplicar filtros de búsqueda
  if (searchTerm) {
    filteredPigs = filteredPigs.filter(
      (pig) =>
        pig.pig_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pig.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pig.breed.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Aplicar filtros de sexo, tipo y raza
  if (activeFilters.sex.length > 0) {
    filteredPigs = filteredPigs.filter(pig =>
      activeFilters.sex.includes(pig.gender)
    )
  }

  if (activeFilters.pig_type.length > 0) {
    filteredPigs = filteredPigs.filter(pig =>
      activeFilters.pig_type.includes(pig.pig_type)
    )
  }

  if (activeFilters.breed.length > 0) {
    filteredPigs = filteredPigs.filter(pig =>
      activeFilters.breed.includes(pig.breed)
    )
  }

  // Aplicar ordenamiento
  if (sortConfig !== null) {
    filteredPigs.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Pig]
      const bValue = b[sortConfig.key as keyof Pig]
      
      if (aValue && bValue) {
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
      }
      return 0
    })
  }

  const handleFilterChange = (type: "sex" | "pig_type" | "breed", value) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }))
  }

  const clearFilters = () => {
    setActiveFilters({
      sex: [],
      pig_type: [],
      breed: []
    })
  }

  const handleCreateVaccine = async () => {
    try {
      if (!vaccineForm.pig_id || !vaccineForm.name || !vaccineForm.dose || !vaccineForm.unit || !vaccineForm.application_date) {
        toast({ title: 'Error', description: 'Complete todos los campos de vacuna', variant: 'destructive' })
        return
      }
      await createVaccine(vaccineForm)
      setVaccineDialogOpen(false)
      setVaccineForm({ pig_id: 0, name: '', dose: 0, unit: 'lt', application_date: '' })
      loadVaccines()
      toast({ title: 'Vacuna registrada', description: 'Vacuna registrada correctamente.' })
    } catch {
      toast({ title: 'Error', description: 'Error al registrar vacuna', variant: 'destructive' })
    }
  }

  // Función para exportar vacunas a PDF
  function exportVaccinesToPDF(vaccines) {
    const doc = new jsPDF();
    // Encabezado con color verde claro
    doc.setFillColor(230, 240, 220);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(18);
    doc.setTextColor(60, 80, 40);
    doc.setFont('helvetica', 'bold');
    doc.text("Gestión de Porcinos - Registro de Vacunas", 14, 20);

    // Fecha de generación
    doc.setFontSize(10);
    doc.setTextColor(100);
    const fechaGen = new Date().toLocaleString();
    doc.text(`Generado: ${fechaGen}`, 150, 27);

    // Tabla de vacunas
    doc.setFontSize(12);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
      startY: 36,
      head: [["ID", "Porcino", "Nombre Vacuna", "Dosis", "Unidad", "Fecha Aplicación"]],
      body: vaccines.map(v => [
        v.id,
        v.pig?.name || v.pig_id,
        v.name,
        v.dose,
        v.unit,
        new Date(v.application_date).toLocaleDateString()
      ]),
      headStyles: {
        fillColor: [230, 240, 220],
        textColor: [60, 80, 40],
        fontStyle: 'bold',
        fontSize: 12
      },
      bodyStyles: {
        fontSize: 11,
        textColor: [33, 37, 41],
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 14, right: 14 }
    });

    // Pie de página
    doc.setFontSize(10);
    doc.setTextColor(180);
    doc.text("Software Porci - www.tusitio.com", 14, 285);

    doc.save(`vacunas_registro.pdf`);
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Porcinos</CardTitle>
          <CardDescription>
            Administra los porcinos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar porcinos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Sexo</DropdownMenuLabel>
                  {["male", "female"].map((sex) => (
                    <DropdownMenuCheckboxItem
                      key={sex}
                      checked={activeFilters.sex.includes(sex)}
                      onCheckedChange={() => handleFilterChange("sex", sex)}
                    >
                      {sex === "male" ? "Macho" : "Hembra"}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Tipo</DropdownMenuLabel>
                  {["REPRODUCTOR", "LECHERA", "CRIA"].map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={activeFilters.pig_type.includes(type)}
                      onCheckedChange={() => handleFilterChange("pig_type", type)}
                    >
                      {type}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Raza</DropdownMenuLabel>
                  {Array.from(new Set(pigs.map(g => g.breed))).map((breed) => (
                    <DropdownMenuCheckboxItem
                      key={breed}
                      checked={activeFilters.breed.includes(breed)}
                      onCheckedChange={() => handleFilterChange("breed", breed)}
                    >
                      {breed}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters}>
                    Limpiar filtros
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Porcino
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("pig_id")}
                      className="flex items-center"
                    >
                      ID
                      <ArrowDownUp className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("name")}
                      className="flex items-center"
                    >
                      Nombre
                      <ArrowDownUp className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("breed")}
                      className="flex items-center"
                    >
                      Raza
                      <ArrowDownUp className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("gender")}
                      className="flex items-center"
                    >
                      Sexo
                      <ArrowDownUp className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("pig_type")}
                      className="flex items-center"
                    >
                      Tipo
                      <ArrowDownUp className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("weight")}
                      className="flex items-center"
                    >
                      Peso (kg)
                      <ArrowDownUp className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Cargando porcinos...
                    </TableCell>
                  </TableRow>
                ) : filteredPigs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No se encontraron porcinos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPigs.map((pig) => (
                    <TableRow key={pig.id}>
                      <TableCell>{pig.pig_id}</TableCell>
                      <TableCell>{pig.name}</TableCell>
                      <TableCell>{pig.breed}</TableCell>
                      <TableCell>{pig.gender === "male" ? "Macho" : "Hembra"}</TableCell>
                      <TableCell>{pig.pig_type}</TableCell>
                      <TableCell>{pig.weight.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetailsDialog(pig)}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(pig)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePig(pig)}
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
        </CardContent>
      </Card>

      {/* Diálogo para crear porcino */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Porcino</DialogTitle>
            <DialogDescription>
              Complete los datos del nuevo porcino
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pig_id">ID del Porcino</Label>
                <Input
                  id="pig_id"
                  value={formData.pig_id}
                  onChange={(e) => setFormData({ ...formData, pig_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Sexo</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value as "male" | "female" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Macho</SelectItem>
                    <SelectItem value="female">Hembra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breed">Raza</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pig_type">Tipo</Label>
                <Select
                  value={formData.pig_type}
                  onValueChange={(value) => setFormData({ ...formData, pig_type: value as "REPRODUCTOR" | "LECHERA" | "CRIA" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REPRODUCTOR">Reproductor</SelectItem>
                    <SelectItem value="LECHERA">Lechera</SelectItem>
                    <SelectItem value="CRIA">Cría</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milk_production">Producción de Leche (L)</Label>
                <Input
                  id="milk_production"
                  type="number"
                  value={formData.milk_production}
                  onChange={(e) => setFormData({ ...formData, milk_production: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="food_consumption">Consumo de Alimento (kg)</Label>
                <Input
                  id="food_consumption"
                  type="number"
                  value={formData.food_consumption}
                  onChange={(e) => setFormData({ ...formData, food_consumption: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vaccinations_count">Número de Vacunas</Label>
                <Input
                  id="vaccinations_count"
                  type="number"
                  value={formData.vaccinations_count}
                  onChange={(e) => setFormData({ ...formData, vaccinations_count: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="heat_periods">Períodos de Celo</Label>
                <Input
                  id="heat_periods"
                  type="number"
                  value={formData.heat_periods}
                  onChange={(e) => setFormData({ ...formData, heat_periods: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offspring_count">Número de Hijos</Label>
                <Input
                  id="offspring_count"
                  type="number"
                  value={formData.offspring_count}
                  onChange={(e) => setFormData({ ...formData, offspring_count: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePig}>Crear Porcino</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar porcino */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Porcino</DialogTitle>
            <DialogDescription>
              Modifique los datos del porcino
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Nombre</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_birthDate">Fecha de Nacimiento</Label>
                <Input
                  id="edit_birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_gender">Sexo</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value as "male" | "female" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Macho</SelectItem>
                    <SelectItem value="female">Hembra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_breed">Raza</Label>
                <Input
                  id="edit_breed"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_pig_type">Tipo</Label>
                <Select
                  value={formData.pig_type}
                  onValueChange={(value) => setFormData({ ...formData, pig_type: value as "REPRODUCTOR" | "LECHERA" | "CRIA" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REPRODUCTOR">Reproductor</SelectItem>
                    <SelectItem value="LECHERA">Lechera</SelectItem>
                    <SelectItem value="CRIA">Cría</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_weight">Peso (kg)</Label>
                <Input
                  id="edit_weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_milk_production">Producción de Leche (L)</Label>
                <Input
                  id="edit_milk_production"
                  type="number"
                  value={formData.milk_production}
                  onChange={(e) => setFormData({ ...formData, milk_production: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_food_consumption">Consumo de Alimento (kg)</Label>
                <Input
                  id="edit_food_consumption"
                  type="number"
                  value={formData.food_consumption}
                  onChange={(e) => setFormData({ ...formData, food_consumption: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_vaccinations_count">Número de Vacunas</Label>
                <Input
                  id="edit_vaccinations_count"
                  type="number"
                  value={formData.vaccinations_count}
                  onChange={(e) => setFormData({ ...formData, vaccinations_count: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_heat_periods">Períodos de Celo</Label>
                <Input
                  id="edit_heat_periods"
                  type="number"
                  value={formData.heat_periods}
                  onChange={(e) => setFormData({ ...formData, heat_periods: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_offspring_count">Número de Hijos</Label>
              <Input
                id="edit_offspring_count"
                type="number"
                value={formData.offspring_count}
                onChange={(e) => setFormData({ ...formData, offspring_count: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePig}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para ver detalles del porcino */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Porcino</DialogTitle>
          </DialogHeader>
          {selectedPig && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID del Porcino</Label>
                  <p>{selectedPig.pig_id}</p>
                </div>
                <div>
                  <Label>Nombre</Label>
                  <p>{selectedPig.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de Nacimiento</Label>
                  <p>{new Date(selectedPig.birthDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Sexo</Label>
                  <p>{selectedPig.gender === "male" ? "Macho" : "Hembra"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Raza</Label>
                  <p>{selectedPig.breed}</p>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <p>{selectedPig.pig_type}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Peso</Label>
                  <p>{selectedPig.weight.toFixed(2)} kg</p>
                </div>
                <div>
                  <Label>Producción de Leche</Label>
                  <p>{selectedPig.milk_production.toFixed(2)} L</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Consumo de Alimento</Label>
                  <p>{selectedPig.food_consumption.toFixed(2)} kg</p>
                </div>
                <div>
                  <Label>Número de Vacunas</Label>
                  <p>{selectedPig.vaccinations_count}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Períodos de Celo</Label>
                  <p>{selectedPig.heat_periods}</p>
                </div>
                <div>
                  <Label>Número de Hijos</Label>
                  <p>{selectedPig.offspring_count}</p>
                </div>
              </div>
              {selectedPig.parent && (
                <div>
                  <Label>Padre/Madre</Label>
                  <p>{selectedPig.parent.name} ({selectedPig.parent.pig_id})</p>
                </div>
              )}
              {selectedPig.offspring && selectedPig.offspring.length > 0 && (
                <div>
                  <Label>Hijos</Label>
                  <ul>
                    {selectedPig.offspring.map((child) => (
                      <li key={child.id}>
                        {child.name} ({child.pig_id})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sección de Vacunas */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Vacunas</CardTitle>
          <CardDescription>Registro y listado de vacunas aplicadas a los porcinos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <Button onClick={() => setVaccineDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Registrar Vacuna
            </Button>
            <Button variant="outline" onClick={() => exportVaccinesToPDF(vaccines)}>
              <span className="mr-2">Exportar PDF</span>
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Porcino</TableHead>
                  <TableHead>Nombre Vacuna</TableHead>
                  <TableHead>Dosis</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Fecha Aplicación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingVaccines ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Cargando vacunas...</TableCell>
                  </TableRow>
                ) : vaccines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No hay vacunas registradas</TableCell>
                  </TableRow>
                ) : (
                  vaccines.map((vaccine) => (
                    <TableRow key={vaccine.id}>
                      <TableCell>{vaccine.id}</TableCell>
                      <TableCell>{vaccine.pig?.name || vaccine.pig_id}</TableCell>
                      <TableCell>{vaccine.name}</TableCell>
                      <TableCell>{vaccine.dose}</TableCell>
                      <TableCell>{vaccine.unit}</TableCell>
                      <TableCell>{new Date(vaccine.application_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo para registrar vacuna */}
      <Dialog open={vaccineDialogOpen} onOpenChange={setVaccineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Vacuna</DialogTitle>
            <DialogDescription>Complete los datos de la vacuna aplicada</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pig_id">Porcino</Label>
              <Select
                value={vaccineForm.pig_id ? String(vaccineForm.pig_id) : ''}
                onValueChange={val => setVaccineForm({ ...vaccineForm, pig_id: Number(val) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un porcino" />
                </SelectTrigger>
                <SelectContent>
                  {pigs.map(pig => (
                    <SelectItem key={pig.id} value={String(pig.id)}>{pig.name} ({pig.pig_id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Vacuna</Label>
              <Input id="name" value={vaccineForm.name} onChange={e => setVaccineForm({ ...vaccineForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dose">Dosis</Label>
              <Input id="dose" type="number" value={vaccineForm.dose} onChange={e => setVaccineForm({ ...vaccineForm, dose: parseFloat(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unidad de Medida</Label>
              <Input id="unit" value={vaccineForm.unit} onChange={e => setVaccineForm({ ...vaccineForm, unit: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="application_date">Fecha de Aplicación</Label>
              <Input id="application_date" type="date" value={vaccineForm.application_date} onChange={e => setVaccineForm({ ...vaccineForm, application_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVaccineDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateVaccine}>Registrar Vacuna</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 