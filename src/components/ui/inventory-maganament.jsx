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
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Importar funciones de API
import { 
  getAllProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getAllSuppliers,
  getAllOutputs,
  createOutput,
  getAllStaff
} from "@/services/api"

// Importar interfaces
import { Product, CreateProductData, UpdateProductData } from "@/interfaces/product"
import { Supplier } from "@/interfaces/supplier"
import { Output, CreateOutputData } from '@/interfaces/output'
import { Staff } from '@/interfaces/staff'

export function InventoryManagement() {
  const { toast } = useToast()
  
  // Estados para datos
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados para UI
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key; direction: "ascending" | "descending" } | null>(null)
  const [activeFilters, setActiveFilters] = useState<{
    category
    supplier
  }>({
    category: [],
    supplier: [],
  })

  // Estados para diálogos
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)

  // Estados para formularios
  const [formData, setFormData] = useState<CreateProductData>({
    product_id: "",
    name: "",
    category: "Alimento",
    unit: "kg",
    quantity: 0,
    min_stock: 0,
    price: 0,
    location: "",
    expiry_date: "",
    supplier_id,
    description: ""
  })

  // Estados para salidas
  const [outputs, setOutputs] = useState<Output[]>([])
  const [loadingOutputs, setLoadingOutputs] = useState(true)
  const [outputForm, setOutputForm] = useState<CreateOutputData>({
    product_id: '',
    employee_id: '',
    quantity: 0,
    output_date: ''
  })
  const [outputDialogOpen, setOutputDialogOpen] = useState(false)
  const [staffList, setStaffList] = useState<Staff[]>([])

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
    loadOutputs()
    loadStaff()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [productsData, suppliersData] = await Promise.all([
        getAllProducts(),
        getAllSuppliers()
      ])
      
      // Validar y filtrar datos para asegurar que tengan IDs válidos
      const validProducts = (productsData || []).filter(product => 
        product && product.id && product.product_id && product.name
      ).map(product => ({
        ...product,
        price: typeof product.price === 'number' ? product.price : parseFloat(product.price || '0'),
        quantity: typeof product.quantity === 'number' ? product.quantity : parseFloat(product.quantity || '0'),
        min_stock: typeof product.min_stock === 'number' ? product.min_stock : parseFloat(product.min_stock || '0')
      }))
      
      const validSuppliers = (suppliersData || []).filter(supplier => 
        supplier && supplier.id && supplier.name
      )
      
      setProducts(validProducts)
      setSuppliers(validSuppliers)
      
      toast({
        title: "Datos cargados",
        description: `${validProducts.length} productos y ${validSuppliers.length} proveedores cargados correctamente.`,
      })
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast({
        title: "Error",
        description: "Error al cargar los datos del inventario. Verifica que el servidor esté funcionando.",
        variant: "destructive",
      })
      
      // Establecer arrays vacíos en caso de error para evitar crashes
      setProducts([])
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  const loadOutputs = async () => {
    try {
      setLoadingOutputs(true)
      const data = await getAllOutputs()
      setOutputs(data)
    } catch {
      toast({ title: 'Error', description: 'Error al cargar salidas', variant: 'destructive' })
      setOutputs([])
    } finally {
      setLoadingOutputs(false)
    }
  }

  const loadStaff = async () => {
    try {
      const data = await getAllStaff()
      setStaffList(data)
    } catch {
      setStaffList([])
    }
  }

  // Función para crear producto
  const handleCreateProduct = async () => {
    try {
      if (!formData.product_id || !formData.name || !formData.category || !formData.unit || formData.price === undefined) {
        toast({
          title: "Error",
          description: "Por favor complete todos los campos obligatorios.",
          variant: "destructive",
        })
        return
      }
      // Forzar tipos correctos
      const newProduct = await createProduct({
        ...formData,
        category: formData.category as Product["category"],
        unit: formData.unit as Product["unit"],
      })
      
      // Normalizar tipos de datos del nuevo producto
      const normalizedProduct = {
        ...newProduct,
        price: typeof newProduct.price === 'number' ? newProduct.price : parseFloat(newProduct.price || '0'),
        quantity: typeof newProduct.quantity === 'number' ? newProduct.quantity : parseFloat(newProduct.quantity || '0'),
        min_stock: typeof newProduct.min_stock === 'number' ? newProduct.min_stock : parseFloat(newProduct.min_stock || '0')
      }
      
      setProducts([normalizedProduct, ...products])
      setCreateOpen(false)
      resetFormData()
      
      toast({
        title: "Producto creado",
        description: `El producto ${newProduct.name} ha sido creado exitosamente.`,
      })
    } catch (error: unknown) {
      console.error('Error al crear producto:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el producto.",
        variant: "destructive",
      })
    }
  }

  // Función para actualizar producto
  const handleUpdateProduct = async () => {
    try {
      if (!productToEdit) return
      const updateData: UpdateProductData = {
        name: formData.name,
        category: formData.category as Product["category"],
        unit: formData.unit as Product["unit"],
        quantity: formData.quantity,
        min_stock: formData.min_stock,
        price: formData.price,
        location: formData.location,
        expiry_date: formData.expiry_date || undefined,
        supplier_id: formData.supplier_id,
        description: formData.description
      }

      const updatedProduct = await updateProduct(productToEdit.id, updateData)
      
      // Normalizar tipos de datos del producto actualizado
      const normalizedProduct = {
        ...updatedProduct,
        price: typeof updatedProduct.price === 'number' ? updatedProduct.price : parseFloat(updatedProduct.price || '0'),
        quantity: typeof updatedProduct.quantity === 'number' ? updatedProduct.quantity : parseFloat(updatedProduct.quantity || '0'),
        min_stock: typeof updatedProduct.min_stock === 'number' ? updatedProduct.min_stock : parseFloat(updatedProduct.min_stock || '0')
      }
      
      setProducts(products.map(p => p.id === productToEdit.id ? normalizedProduct : p))
      setEditOpen(false)
      setProductToEdit(null)
      resetFormData()
      
      toast({
        title: "Producto actualizado",
        description: `El producto ${updatedProduct.name} ha sido actualizado exitosamente.`,
      })
    } catch (error: unknown) {
      console.error('Error al actualizar producto:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el producto.",
        variant: "destructive",
      })
    }
  }

  // Función para eliminar producto
  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteProduct(product.id)
      setProducts(products.filter(p => p.id !== product.id))
      
      toast({
        title: "Producto eliminado",
        description: `El producto ${product.name} ha sido eliminado exitosamente.`,
      })
    } catch (error: unknown) {
      console.error('Error al eliminar producto:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el producto.",
        variant: "destructive",
      })
    }
  }

  const resetFormData = () => {
    setFormData({
      product_id: "",
      name: "",
      category: "Alimento",
      unit: "kg",
      quantity: 0,
      min_stock: 0,
      price: 0,
      location: "",
      expiry_date: "",
      supplier_id,
      description: ""
    })
  }

  const openEditDialog = (product: Product) => {
    setProductToEdit(product)
    setFormData({
      product_id: product.product_id,
      name: product.name,
      category: product.category,
      unit: product.unit,
      quantity: product.quantity,
      min_stock: product.min_stock,
      price: product.price,
      location: product.location || "",
      expiry_date: product.expiry_date || "",
      supplier_id: product.supplier_id,
      description: product.description || ""
    })
    setEditOpen(true)
  }

  const openDetailsDialog = (product: Product) => {
    setSelectedProduct(product)
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
  let filteredProducts = [...products]

  // Aplicar filtros de búsqueda
  if (searchTerm) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Aplicar filtros de categoría y proveedor
  if (activeFilters.category.length > 0) {
    filteredProducts = filteredProducts.filter(product =>
      activeFilters.category.includes(product.category)
    )
  }

  if (activeFilters.supplier.length > 0) {
    filteredProducts = filteredProducts.filter(product =>
      product.supplier_id && activeFilters.supplier.includes(product.supplier_id.toString())
    )
  }

  // Aplicar ordenamiento
  if (sortConfig !== null) {
    filteredProducts.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Product]
      const bValue = b[sortConfig.key as keyof Product]
      
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

  const handleFilterChange = (type: "category" | "supplier", value) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }))
  }

  const clearFilters = () => {
    setActiveFilters({
      category: [],
      supplier: []
    })
  }

  const getStockStatus = (product: Product) => {
    if (product.quantity <= 0) return "out-of-stock"
    if (product.quantity <= product.min_stock) return "low-stock"
    return "in-stock"
  }

  const handleCreateOutput = async () => {
    try {
      if (!outputForm.product_id || !outputForm.employee_id || !outputForm.quantity || !outputForm.output_date) {
        toast({ title: 'Error', description: 'Complete todos los campos de salida', variant: 'destructive' })
        return
      }
      await createOutput(outputForm)
      setOutputDialogOpen(false)
      setOutputForm({ product_id: '', employee_id: '', quantity: 0, output_date: '' })
      loadOutputs()
      toast({ title: 'Salida registrada', description: 'Salida registrada correctamente.' })
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Error al registrar salida', variant: 'destructive' })
    }
  }

  // Función para exportar salidas a PDF
  function exportOutputsToPDF(outputs) {
    const doc = new jsPDF();
    // Encabezado con color verde claro
    doc.setFillColor(230, 240, 220);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(18);
    doc.setTextColor(60, 80, 40);
    doc.setFont('helvetica', 'bold');
    doc.text("Gestión de Inventario - Registro de Salidas", 14, 20);

    // Fecha de generación
    doc.setFontSize(10);
    doc.setTextColor(100);
    const fechaGen = new Date().toLocaleString();
    doc.text(`Generado: ${fechaGen}`, 150, 27);

    // Tabla de salidas
    doc.setFontSize(12);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
      startY: 36,
      head: [["ID", "Producto", "Cantidad", "Unidad", "Empleado", "Fecha de Salida"]],
      body: outputs.map(o => [
        o.id,
        o.product?.name || o.product_id,
        o.quantity,
        o.product?.unit || '',
        o.employee ? `${o.employee.first_name} ${o.employee.last_name}` : o.employee_id,
        new Date(o.output_date).toLocaleDateString()
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

    doc.save(`salidas_registro.pdf`);
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Inventario</CardTitle>
          <CardDescription>
            Administra los productos del inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar productos..."
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
                  <DropdownMenuLabel>Categoría</DropdownMenuLabel>
                  {["Alimento", "Medicamento", "Suplemento", "Insumo", "Equipo", "Otro"].map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={activeFilters.category.includes(category)}
                      onCheckedChange={() => handleFilterChange("category", category)}
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Proveedor</DropdownMenuLabel>
                  {suppliers.map((supplier) => (
                    <DropdownMenuCheckboxItem
                      key={supplier.id}
                      checked={activeFilters.supplier.includes(supplier.id.toString())}
                      onCheckedChange={() => handleFilterChange("supplier", supplier.id.toString())}
                    >
                      {supplier.name}
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
              Nuevo Producto
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("product_id")}
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
                      onClick={() => requestSort("category")}
                      className="flex items-center"
                    >
                      Categoría
                      <ArrowDownUp className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("quantity")}
                      className="flex items-center"
                    >
                      Cantidad
                      <ArrowDownUp className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("price")}
                      className="flex items-center"
                    >
                      Precio
                      <ArrowDownUp className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Cargando productos...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.product_id}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        {product.quantity} {product.unit}
                      </TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            getStockStatus(product) === "out-of-stock"
                              ? "destructive"
                              : getStockStatus(product) === "low-stock"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {getStockStatus(product) === "out-of-stock"
                            ? "Sin stock"
                            : getStockStatus(product) === "low-stock"
                            ? "Stock bajo"
                            : "En stock"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetailsDialog(product)}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(product)}
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

      {/* Diálogo para crear producto */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
            <DialogDescription>
              Complete los datos del nuevo producto
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_id">ID del Producto</Label>
                <Input
                  id="product_id"
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
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
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={val => setFormData({ ...formData, category: val as Product["category"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alimento">Alimento</SelectItem>
                    <SelectItem value="Medicamento">Medicamento</SelectItem>
                    <SelectItem value="Suplemento">Suplemento</SelectItem>
                    <SelectItem value="Insumo">Insumo</SelectItem>
                    <SelectItem value="Equipo">Equipo</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidad</Label>
                <Select
                  value={formData.unit}
                  onValueChange={val => setFormData({ ...formData, unit: val as Product["unit"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="unidad">unidad</SelectItem>
                    <SelectItem value="dosis">dosis</SelectItem>
                    <SelectItem value="frasco">frasco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock">Stock Mínimo</Label>
                <Input
                  id="min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Proveedor</Label>
                <Select
                  value={formData.supplier_id?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProduct}>Crear Producto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar producto */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifique los datos del producto
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
                <Label htmlFor="edit_category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={val => setFormData({ ...formData, category: val as Product["category"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alimento">Alimento</SelectItem>
                    <SelectItem value="Medicamento">Medicamento</SelectItem>
                    <SelectItem value="Suplemento">Suplemento</SelectItem>
                    <SelectItem value="Insumo">Insumo</SelectItem>
                    <SelectItem value="Equipo">Equipo</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_unit">Unidad</Label>
                <Select
                  value={formData.unit}
                  onValueChange={val => setFormData({ ...formData, unit: val as Product["unit"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="unidad">unidad</SelectItem>
                    <SelectItem value="dosis">dosis</SelectItem>
                    <SelectItem value="frasco">frasco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_supplier">Proveedor</Label>
                <Select
                  value={formData.supplier_id?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_quantity">Cantidad</Label>
                <Input
                  id="edit_quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_min_stock">Stock Mínimo</Label>
                <Input
                  id="edit_min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_price">Precio</Label>
                <Input
                  id="edit_price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_location">Ubicación</Label>
                <Input
                  id="edit_location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">Descripción</Label>
              <Input
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateProduct}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para ver detalles del producto */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Producto</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID del Producto</Label>
                  <p>{selectedProduct.product_id}</p>
                </div>
                <div>
                  <Label>Nombre</Label>
                  <p>{selectedProduct.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoría</Label>
                  <p>{selectedProduct.category}</p>
                </div>
                <div>
                  <Label>Unidad</Label>
                  <p>{selectedProduct.unit}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cantidad</Label>
                  <p>{selectedProduct.quantity} {selectedProduct.unit}</p>
                </div>
                <div>
                  <Label>Stock Mínimo</Label>
                  <p>{selectedProduct.min_stock} {selectedProduct.unit}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Precio</Label>
                  <p>${selectedProduct.price.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Estado</Label>
                  <Badge
                    variant={
                      getStockStatus(selectedProduct) === "out-of-stock"
                        ? "destructive"
                        : getStockStatus(selectedProduct) === "low-stock"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {getStockStatus(selectedProduct) === "out-of-stock"
                      ? "Sin stock"
                      : getStockStatus(selectedProduct) === "low-stock"
                      ? "Stock bajo"
                      : "En stock"}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Proveedor</Label>
                <p>
                  {suppliers.find(s => s.id === selectedProduct.supplier_id)?.name || "No asignado"}
                </p>
              </div>
              <div>
                <Label>Ubicación</Label>
                <p>{selectedProduct.location || "No especificada"}</p>
              </div>
              <div>
                <Label>Descripción</Label>
                <p>{selectedProduct.description || "No especificada"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sección de Salidas */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Salidas</CardTitle>
          <CardDescription>Registro y listado de salidas de productos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <Button onClick={() => setOutputDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Registrar Salida
            </Button>
            <Button variant="outline" onClick={() => exportOutputsToPDF(outputs)}>
              <span className="mr-2">Exportar PDF</span>
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Fecha de Salida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOutputs ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Cargando salidas...</TableCell>
                  </TableRow>
                ) : outputs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No hay salidas registradas</TableCell>
                  </TableRow>
                ) : (
                  outputs.map((output) => (
                    <TableRow key={output.id}>
                      <TableCell>{output.id}</TableCell>
                      <TableCell>{output.product?.name || output.product_id}</TableCell>
                      <TableCell>{output.quantity}</TableCell>
                      <TableCell>{output.product?.unit || ''}</TableCell>
                      <TableCell>{output.employee ? `${output.employee.first_name} ${output.employee.last_name}` : output.employee_id}</TableCell>
                      <TableCell>{new Date(output.output_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo para registrar salida */}
      <Dialog open={outputDialogOpen} onOpenChange={setOutputDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Salida</DialogTitle>
            <DialogDescription>Complete los datos de la salida de producto</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product_id">Producto</Label>
              <Select
                value={outputForm.product_id}
                onValueChange={val => setOutputForm({ ...outputForm, product_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.product_id} value={String(product.product_id)}>{product.name} ({product.product_id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input id="quantity" type="number" value={outputForm.quantity} onChange={e => setOutputForm({ ...outputForm, quantity: parseFloat(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="output_date">Fecha de Salida</Label>
              <Input id="output_date" type="date" value={outputForm.output_date} onChange={e => setOutputForm({ ...outputForm, output_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee_id">Empleado</Label>
              <Select
                value={outputForm.employee_id}
                onValueChange={val => setOutputForm({ ...outputForm, employee_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map(staff => (
                    <SelectItem key={staff.staff_id} value={String(staff.staff_id)}>{staff.first_name} {staff.last_name} ({staff.staff_id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOutputDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateOutput}>Registrar Salida</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

