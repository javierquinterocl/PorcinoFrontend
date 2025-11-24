import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Filter, Download, Eye, Edit2, Trash2, ArrowUpDown, X } from "lucide-react"
import { productService, supplierService } from "@/services/api"
import { useToast } from "@/components/ui/use-toast"

export default function ProductsListPage() {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" })
  const [page, setPage] = useState(1)
  const pageSize = 8
  const { toast } = useToast()

  // Estados para modales
  const [viewDialog, setViewDialog] = useState({ open: false, product: null })
  const [editDialog, setEditDialog] = useState({ open: false, product: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null })
  const [createDialog, setCreateDialog] = useState(false)
  
  // Estados para formularios
  const [formData, setFormData] = useState({
    productId: "",
    name: "",
    description: "",
    unitPrice: "",
    stock: "",
    productType: "",
    supplierId: ""
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Tipos de productos disponibles (solo para referencia)
  const productTypes = [
    'ALIMENTO', 'MEDICO', 'MANTENIMIENTO', 'AGROINSUMO'
  ]

  const normalizeProduct = (raw) => {
    return {
      ...raw,
      productId: raw.productId || raw.product_id || '',
      name: raw.name || raw.nombre || '',
      description: raw.description || raw.descripcion || '',
      unitPrice: raw.unitPrice || raw.unit_price || raw.precio || 0,
      stock: raw.stock || raw.cantidad || raw.inventario || 0,
      productType: raw.productType || raw.product_type || raw.tipo || '',
      supplierId: raw.supplierId || raw.supplier_id || '',
      supplierName: raw.supplierName || raw.supplier_name || ''
    }
  }

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      const productsData = await productService.getAllProducts()
      
      // Enriquecer productos con nombre del proveedor
      const enrichedProducts = productsData.map(product => {
        const supplier = suppliers.find(s => s.id === product.supplierId)
        return {
          ...normalizeProduct(product),
          supplierName: supplier ? supplier.name : 'Sin proveedor'
        }
      })
      
      setProducts(Array.isArray(enrichedProducts) ? enrichedProducts : [])
    } catch (error) {
      console.error("Error cargando productos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, suppliers])

  const loadSuppliers = useCallback(async () => {
    try {
      const suppliersData = await supplierService.getAllSuppliers()
      setSuppliers(suppliersData)
    } catch (error) {
      console.error("Error cargando proveedores:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los proveedores",
        variant: "destructive"
      })
    }
  }, [toast])

  useEffect(() => {
    // Cargar proveedores primero
    const initializeData = async () => {
      await loadSuppliers()
      await loadProducts()
    }
    initializeData()
  }, []) // Solo ejecutar una vez al montar
  
  // Recargar productos cuando los proveedores cambien
  useEffect(() => {
    if (suppliers.length > 0) {
      loadProducts()
    }
  }, [suppliers])

  // Funciones para abrir modales
  const handleView = (product) => {
    setViewDialog({ open: true, product })
  }

  const handleEdit = (product) => {
    setFormData({
      productId: product.productId || "",
      name: product.name || "",
      description: product.description || "",
      unitPrice: product.unitPrice?.toString() || "",
      stock: product.stock?.toString() || "",
      productType: product.productType || "",
      supplierId: product.supplierId || ""
    })
    setFormErrors({})
    setEditDialog({ open: true, product })
  }

  const handleDelete = (product) => {
    setDeleteDialog({ open: true, product })
  }

  const handleCreate = () => {
    setFormData({
      productId: "",
      name: "",
      description: "",
      unitPrice: "",
      stock: "",
      productType: "",
      supplierId: ""
    })
    setFormErrors({})
    setCreateDialog(true)
  }

  // Función para validar formulario
  const validateForm = (isCreate = false) => {
    const errors = {}
    
    if (!formData.productId.trim()) errors.productId = "El ID del producto es requerido"
    if (!formData.name.trim()) errors.name = "El nombre es requerido"
    if (!formData.unitPrice.trim()) errors.unitPrice = "El precio unitario es requerido"
    else if (isNaN(parseFloat(formData.unitPrice)) || parseFloat(formData.unitPrice) <= 0) {
      errors.unitPrice = "El precio debe ser un número mayor a 0"
    }
    if (!formData.stock.trim()) errors.stock = "El stock es requerido"
    else if (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      errors.stock = "El stock debe ser un número mayor o igual a 0"
    }
    if (!formData.productType.trim()) errors.productType = "El tipo de producto es requerido"
    if (!formData.supplierId || !formData.supplierId.trim()) errors.supplierId = "El proveedor es requerido"
    
    setFormErrors(errors)
    const formIsValid = Object.keys(errors).length === 0;
    console.log("validateForm: Current formData.supplierId:", formData.supplierId, "Errors:", errors, "Form is valid:", formIsValid);
    return formIsValid;
  }

  // Función para crear producto
  const handleCreateSubmit = async () => {
    console.log("handleCreateSubmit: formData.supplierId antes de validar:", formData.supplierId);
    const isValid = validateForm(true);
    console.log("handleCreateSubmit: validateForm returned:", isValid);

    if (!isValid) {
      console.log("handleCreateSubmit: Frontend validation failed, preventing submission.");
      return;
    }
    
    setIsSubmitting(true)
    try {
      console.log("DEBUG: formData completo:", formData);
      console.log("DEBUG: formData.supplierId tipo:", typeof formData.supplierId);
      console.log("DEBUG: formData.supplierId valor:", formData.supplierId);
      
      const productData = {
        productId: formData.productId,
        name: formData.name,
        description: formData.description,
        unitPrice: parseFloat(formData.unitPrice),
        stock: parseInt(formData.stock),
        productType: formData.productType,
        supplierId: parseInt(formData.supplierId)
      }
      
      console.log("DEBUG: productData.supplierId final:", productData.supplierId);
      console.log("handleCreateSubmit: Submitting productData:", productData);
      await productService.createProduct(productData)
      toast({
        title: "Producto creado",
        description: "El producto ha sido creado exitosamente",
        variant: "default"
      })
      setCreateDialog(false)
      loadProducts()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el producto",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para actualizar producto
  const handleEditSubmit = async () => {
    console.log("handleEditSubmit: formData.supplierId antes de validar:", formData.supplierId);
    const isValid = validateForm(false);
    console.log("handleEditSubmit: validateForm returned:", isValid);

    if (!isValid) {
      console.log("handleEditSubmit: Frontend validation failed, preventing submission.");
      return;
    }
    
    setIsSubmitting(true)
    try {
      const productData = {
        productId: formData.productId,
        name: formData.name,
        description: formData.description,
        unitPrice: parseFloat(formData.unitPrice),
        stock: parseInt(formData.stock),
        productType: formData.productType,
        supplierId: formData.supplierId ? parseInt(formData.supplierId) : null
      }
      console.log("handleEditSubmit: Submitting productData:", productData);
      await productService.updateProduct(editDialog.product.id, productData)
      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado exitosamente",
        variant: "default"
      })
      setEditDialog({ open: false, product: null })
      loadProducts()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el producto",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para eliminar producto
  const handleDeleteConfirm = async () => {
    setIsSubmitting(true)
    try {
      await productService.deleteProduct(deleteDialog.product.id)
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente",
        variant: "default"
      })
      setDeleteDialog({ open: false, product: null })
      loadProducts()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el producto",
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
    let data = [...products]
    
    if (term) {
      const isNumeric = /^\d+$/.test(term)
      
      if (isNumeric) {
        const searchId = parseInt(term, 10)
        data = data.filter(p => p.id === searchId)
      } else {
        const termLower = term.toLowerCase()
        data = data.filter(p => {
          return [p.name, p.productId, p.productType, p.description, p.supplierName]
            .filter(Boolean)
            .some(v => v.toLowerCase().includes(termLower))
        })
      }
    }
    
    data.sort((a,b) => {
      const { key, direction } = sortConfig
      const av = (a[key] ?? "").toString().toLowerCase()
      const bv = (b[key] ?? "").toString().toLowerCase()
      if (av < bv) return direction === "asc" ? -1 : 1
      if (av > bv) return direction === "asc" ? 1 : -1
      return 0
    })
    return data
  }, [products, search, sortConfig])

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price || 0)
  }

  return (
    <div className="space-y-6">
      {/* Header con título y botón */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
        <Button 
          onClick={handleCreate}
          className="bg-[#6b7c45] hover:bg-[#5a6b35] text-white"
        >
          + Nuevo Producto
        </Button>
      </div>

      {/* Card principal con tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Listado de Productos</h2>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID, nombre o tipo..."
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
                  <SortButton colKey="productId">ID Producto</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="name">Nombre</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="productType">Tipo</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="supplierName">Proveedor</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="unitPrice">Precio</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="stock">Stock</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                    Cargando productos...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((product) => (
                <TableRow key={product.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-900">{product.id}</TableCell>
                  <TableCell className="text-gray-700">{product.productId || '-'}</TableCell>
                  <TableCell className="text-gray-700">{product.name || '-'}</TableCell>
                  <TableCell className="text-gray-600">{product.productType || '-'}</TableCell>
                  <TableCell className="text-gray-600">{product.supplierName || '-'}</TableCell>
                  <TableCell className="text-gray-600">{formatPrice(product.unitPrice)}</TableCell>
                  <TableCell className="text-gray-600">{product.stock || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleView(product)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-blue-600"
                        title="Detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-green-600"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
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
              disabled={currentPage === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="border-gray-300"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="border-gray-300"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      {/* Modal para Ver Detalles */}
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, product: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalles del Producto</DialogTitle>
            <DialogDescription>
              Información completa del producto seleccionado
            </DialogDescription>
          </DialogHeader>
          {viewDialog.product && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">ID</Label>
                  <p className="text-sm mt-1">{viewDialog.product.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">ID Producto</Label>
                  <p className="text-sm mt-1">{viewDialog.product.productId}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Nombre</Label>
                <p className="text-sm mt-1">{viewDialog.product.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Descripción</Label>
                <p className="text-sm mt-1">{viewDialog.product.description || 'Sin descripción'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                  <p className="text-sm mt-1">{viewDialog.product.productType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Proveedor</Label>
                  <p className="text-sm mt-1">{viewDialog.product.supplierName || 'Sin proveedor'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Precio Unitario</Label>
                  <p className="text-sm mt-1">{formatPrice(viewDialog.product.unitPrice)}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Stock Disponible</Label>
                <p className="text-sm mt-1">{viewDialog.product.stock} unidades</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog({ open: false, product: null })}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Crear Producto */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
            <DialogDescription>
              Complete los campos para registrar un nuevo producto
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-productId">ID Producto *</Label>
                <Input
                  id="create-productId"
                  value={formData.productId}
                  onChange={(e) => handleFormChange('productId', e.target.value)}
                  className={formErrors.productId ? 'border-red-500' : ''}
                />
                {formErrors.productId && <p className="text-xs text-red-500 mt-1">{formErrors.productId}</p>}
              </div>
              <div>
                <Label htmlFor="create-productType">Tipo de Producto *</Label>
                <Input
                  id="create-productType"
                  value={formData.productType}
                  onChange={(e) => handleFormChange('productType', e.target.value.toUpperCase())}
                  placeholder=""
                  className={formErrors.productType ? 'border-red-500' : ''}
                />
                {formErrors.productType && <p className="text-xs text-red-500 mt-1">{formErrors.productType}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Tipos disponibles: {productTypes.join(', ')}
                </p>
              </div>
              <div>
                <Label htmlFor="create-supplierId">Proveedor *</Label>
                <select
                  id="create-supplierId"
                  value={formData.supplierId}
                  onChange={(e) => handleFormChange('supplierId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6b7c45] focus:border-transparent ${formErrors.supplierId ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {formErrors.supplierId && <p className="text-xs text-red-500 mt-1">{formErrors.supplierId}</p>}
              </div>
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
            <div>
              <Label htmlFor="create-description">Descripción</Label>
              <Input
                id="create-description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-unitPrice">Precio Unitario *</Label>
                <Input
                  id="create-unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => handleFormChange('unitPrice', e.target.value)}
                  className={formErrors.unitPrice ? 'border-red-500' : ''}
                />
                {formErrors.unitPrice && <p className="text-xs text-red-500 mt-1">{formErrors.unitPrice}</p>}
              </div>
              <div>
                <Label htmlFor="create-stock">Stock Inicial *</Label>
                <Input
                  id="create-stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleFormChange('stock', e.target.value)}
                  className={formErrors.stock ? 'border-red-500' : ''}
                />
                {formErrors.stock && <p className="text-xs text-red-500 mt-1">{formErrors.stock}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateSubmit} 
              disabled={isSubmitting}
              className="bg-[#6b7c45] hover:bg-[#5a6b35]"
            >
              {isSubmitting ? 'Creando...' : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Producto */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, product: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifique los datos del producto
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-productId">ID Producto *</Label>
                <Input
                  id="edit-productId"
                  value={formData.productId}
                  onChange={(e) => handleFormChange('productId', e.target.value)}
                  className={formErrors.productId ? 'border-red-500' : ''}
                />
                {formErrors.productId && <p className="text-xs text-red-500 mt-1">{formErrors.productId}</p>}
              </div>
              <div>
                <Label htmlFor="edit-productType">Tipo de Producto *</Label>
                <Input
                  id="edit-productType"
                  value={formData.productType}
                  onChange={(e) => handleFormChange('productType', e.target.value.toUpperCase())}
                  placeholder=""
                  className={formErrors.productType ? 'border-red-500' : ''}
                />
                {formErrors.productType && <p className="text-xs text-red-500 mt-1">{formErrors.productType}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Tipos disponibles: {productTypes.join(', ')}
                </p>
              </div>
              <div>
                <Label htmlFor="edit-supplierId">Proveedor *</Label>
                <select
                  id="edit-supplierId"
                  value={formData.supplierId}
                  onChange={(e) => handleFormChange('supplierId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6b7c45] focus:border-transparent ${formErrors.supplierId ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {formErrors.supplierId && <p className="text-xs text-red-500 mt-1">{formErrors.supplierId}</p>}
              </div>
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
            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-unitPrice">Precio Unitario *</Label>
                <Input
                  id="edit-unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => handleFormChange('unitPrice', e.target.value)}
                  className={formErrors.unitPrice ? 'border-red-500' : ''}
                />
                {formErrors.unitPrice && <p className="text-xs text-red-500 mt-1">{formErrors.unitPrice}</p>}
              </div>
              <div>
                <Label htmlFor="edit-stock">Stock *</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleFormChange('stock', e.target.value)}
                  className={formErrors.stock ? 'border-red-500' : ''}
                />
                {formErrors.stock && <p className="text-xs text-red-500 mt-1">{formErrors.stock}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, product: null })} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEditSubmit} 
              disabled={isSubmitting}
              className="bg-[#6b7c45] hover:bg-[#5a6b35]"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Eliminar Producto */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, product: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.product && (
            <div className="py-4">
              <p className="text-sm text-gray-700">
                ¿Está seguro que desea eliminar el producto{' '}
                <span className="font-semibold">{deleteDialog.product.name}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ID: {deleteDialog.product.id} | Tipo: {deleteDialog.product.productType}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, product: null })} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
