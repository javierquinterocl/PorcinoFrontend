import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Filter, Download, Eye, Edit2, Trash2, ArrowUpDown } from "lucide-react"
import { productOutputService, productService, userService } from "@/services/api"
import { useToast } from "@/components/ui/use-toast"

export default function ProductOutputsListPage() {
  const [outputs, setOutputs] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" })
  const [page, setPage] = useState(1)
  const pageSize = 8
  const { toast } = useToast()

  // Estados para modales
  const [viewDialog, setViewDialog] = useState({ open: false, output: null })
  const [editDialog, setEditDialog] = useState({ open: false, output: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, output: null })
  const [createDialog, setCreateDialog] = useState(false)
  
  // Estados para formularios
  const [formData, setFormData] = useState({
    userId: "",
    productId: "",
    quantity: "",
    notes: ""
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizeOutput = (raw) => {
    return {
      ...raw,
      userId: raw.userId || raw.user_id || raw.user?.id || '',
      productId: raw.productId || raw.product_id || raw.product?.id || '',
      quantity: raw.quantity || 0,
      notes: raw.notes || '',
      createdAt: raw.createdAt || raw.created_at || '',
      userName: raw.userName || raw.user_name || raw.user?.firstName + ' ' + raw.user?.lastName || '',
      productName: raw.productName || raw.product_name || raw.product?.name || ''
    }
  }

  const loadOutputs = useCallback(async () => {
    try {
      setIsLoading(true)
      const outputsData = await productOutputService.getAllProductOutputs()
      
      // Enriquecer salidas con nombres de usuario y producto
      const enrichedOutputs = outputsData.map(output => {
        const user = users.find(u => u.id === output.userId)
        const product = products.find(p => p.id === output.productId)
        return {
          ...normalizeOutput(output),
          userName: user ? `${user.firstName} ${user.lastName}` : 'Usuario desconocido',
          productName: product ? product.name : 'Producto desconocido'
        }
      })
      
      setOutputs(Array.isArray(enrichedOutputs) ? enrichedOutputs : [])
    } catch (error) {
      console.error("Error cargando salidas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las salidas de productos",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, users, products])

  const loadProducts = useCallback(async () => {
    try {
      const productsData = await productService.getAllProducts()
      setProducts(productsData)
    } catch (error) {
      console.error("Error cargando productos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      })
    }
  }, [toast])

  const loadUsers = useCallback(async () => {
    try {
      const usersData = await userService.getAllUsers()
      setUsers(usersData)
    } catch (error) {
      console.error("Error cargando usuarios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      })
    }
  }, [toast])

  useEffect(() => {
    // Cargar productos y usuarios primero
    const initializeData = async () => {
      await loadProducts()
      await loadUsers()
    }
    initializeData()
  }, []) // Solo ejecutar una vez al montar
  
  // Recargar salidas cuando los productos o usuarios cambien
  useEffect(() => {
    if (products.length > 0 && users.length > 0) {
      loadOutputs()
    }
  }, [products, users])

  // Funciones para abrir modales
  const handleView = (output) => {
    setViewDialog({ open: true, output })
  }

  const handleEdit = (output) => {
    setFormData({
      userId: output.userId || "",
      productId: output.productId || "",
      quantity: output.quantity?.toString() || "",
      notes: output.notes || ""
    })
    setFormErrors({})
    setEditDialog({ open: true, output })
  }

  const handleDelete = (output) => {
    setDeleteDialog({ open: true, output })
  }

  const handleCreate = () => {
    setFormData({
      userId: "",
      productId: "",
      quantity: "",
      notes: ""
    })
    setFormErrors({})
    setCreateDialog(true)
  }

  // Función para validar formulario
  const validateForm = () => {
    const errors = {}
    
    if (!formData.userId || !formData.userId.trim()) errors.userId = "El usuario es requerido"
    if (!formData.productId || !formData.productId.trim()) errors.productId = "El producto es requerido"
    if (!formData.quantity.trim()) errors.quantity = "La cantidad es requerida"
    else if (isNaN(parseInt(formData.quantity)) || parseInt(formData.quantity) <= 0) {
      errors.quantity = "La cantidad debe ser un número mayor a 0"
    }
    
    setFormErrors(errors)
    const formIsValid = Object.keys(errors).length === 0
    console.log("validateForm: Errors:", errors, "Form is valid:", formIsValid)
    return formIsValid
  }

  // Función para crear salida de producto
  const handleCreateSubmit = async () => {
    const isValid = validateForm()

    if (!isValid) {
      console.log("handleCreateSubmit: Frontend validation failed, preventing submission.")
      return
    }
    
    setIsSubmitting(true)
    try {
      const outputData = {
        userId: parseInt(formData.userId),
        productId: parseInt(formData.productId),
        quantity: parseInt(formData.quantity),
        notes: formData.notes
      }
      
      console.log("handleCreateSubmit: Submitting outputData:", outputData)
      await productOutputService.createProductOutput(outputData)
      toast({
        title: "Salida registrada",
        description: "La salida de producto ha sido registrada exitosamente",
        variant: "default"
      })
      setCreateDialog(false)
      loadOutputs()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar la salida de producto",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para actualizar salida de producto
  const handleEditSubmit = async () => {
    const isValid = validateForm()

    if (!isValid) {
      console.log("handleEditSubmit: Frontend validation failed, preventing submission.")
      return
    }
    
    setIsSubmitting(true)
    try {
      const outputData = {
        userId: parseInt(formData.userId),
        productId: parseInt(formData.productId),
        quantity: parseInt(formData.quantity),
        notes: formData.notes
      }
      console.log("handleEditSubmit: Submitting outputData:", outputData)
      await productOutputService.updateProductOutput(editDialog.output.id, outputData)
      toast({
        title: "Salida actualizada",
        description: "La salida de producto ha sido actualizada exitosamente",
        variant: "default"
      })
      setEditDialog({ open: false, output: null })
      loadOutputs()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la salida de producto",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para eliminar salida de producto
  const handleDeleteConfirm = async () => {
    setIsSubmitting(true)
    try {
      await productOutputService.deleteProductOutput(deleteDialog.output.id)
      toast({
        title: "Salida eliminada",
        description: "La salida de producto ha sido eliminada exitosamente",
        variant: "default"
      })
      setDeleteDialog({ open: false, output: null })
      loadOutputs()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la salida de producto",
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
    let data = [...outputs]
    
    if (term) {
      const isNumeric = /^\d+$/.test(term)
      
      if (isNumeric) {
        const searchId = parseInt(term, 10)
        data = data.filter(o => o.id === searchId)
      } else {
        const termLower = term.toLowerCase()
        data = data.filter(o => {
          return [o.productName, o.userName, o.notes]
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
  }, [outputs, search, sortConfig])

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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } catch (error) {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con título y botón */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Salida de Productos</h1>
        <Button 
          onClick={handleCreate}
          className="bg-[#6b7c45] hover:bg-[#5a6b35] text-white"
        >
          + Nueva Salida
        </Button>
      </div>

      {/* Card principal con tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Listado de Salidas</h2>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por producto, usuario o notas..."
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
                  <SortButton colKey="productName">Producto</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="quantity">Cantidad</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="userName">Usuario</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="createdAt">Fecha</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">Notas</TableHead>
                <TableHead className="font-medium text-gray-600 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && outputs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                    Cargando salidas...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                    No se encontraron salidas
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((output) => (
                <TableRow key={output.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-900">{output.id}</TableCell>
                  <TableCell className="text-gray-700">{output.productName || '-'}</TableCell>
                  <TableCell className="text-gray-700">{output.quantity || 0}</TableCell>
                  <TableCell className="text-gray-600">{output.userName || '-'}</TableCell>
                  <TableCell className="text-gray-600">{formatDate(output.createdAt)}</TableCell>
                  <TableCell className="text-gray-600 max-w-xs truncate">{output.notes || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleView(output)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-blue-600"
                        title="Detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(output)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-green-600"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(output)}
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
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, output: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalles de la Salida</DialogTitle>
            <DialogDescription>
              Información completa de la salida de producto seleccionada
            </DialogDescription>
          </DialogHeader>
          {viewDialog.output && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">ID</Label>
                  <p className="text-sm mt-1">{viewDialog.output.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Fecha</Label>
                  <p className="text-sm mt-1">{formatDate(viewDialog.output.createdAt)}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Producto</Label>
                <p className="text-sm mt-1">{viewDialog.output.productName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Cantidad</Label>
                <p className="text-sm mt-1">{viewDialog.output.quantity} unidades</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Usuario</Label>
                <p className="text-sm mt-1">{viewDialog.output.userName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Notas</Label>
                <p className="text-sm mt-1">{viewDialog.output.notes || 'Sin notas'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog({ open: false, output: null })}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Crear Salida */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Salida</DialogTitle>
            <DialogDescription>
              Complete los campos para registrar una salida de producto
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="create-userId">Usuario *</Label>
              <select
                id="create-userId"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6b7c45] focus:border-transparent ${formErrors.userId ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Seleccionar usuario</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
              {formErrors.userId && <p className="text-xs text-red-500 mt-1">{formErrors.userId}</p>}
            </div>
            <div>
              <Label htmlFor="create-productId">Producto *</Label>
              <select
                id="create-productId"
                value={formData.productId}
                onChange={(e) => handleFormChange('productId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6b7c45] focus:border-transparent ${formErrors.productId ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Seleccionar producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stock: {product.stock})
                  </option>
                ))}
              </select>
              {formErrors.productId && <p className="text-xs text-red-500 mt-1">{formErrors.productId}</p>}
            </div>
            <div>
              <Label htmlFor="create-quantity">Cantidad *</Label>
              <Input
                id="create-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleFormChange('quantity', e.target.value)}
                className={formErrors.quantity ? 'border-red-500' : ''}
              />
              {formErrors.quantity && <p className="text-xs text-red-500 mt-1">{formErrors.quantity}</p>}
            </div>
            <div>
              <Label htmlFor="create-notes">Notas</Label>
              <Input
                id="create-notes"
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Observaciones adicionales..."
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
              className="bg-[#6b7c45] hover:bg-[#5a6b35]"
            >
              {isSubmitting ? 'Registrando...' : 'Registrar Salida'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Salida */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, output: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Salida</DialogTitle>
            <DialogDescription>
              Modifique los datos de la salida de producto
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-userId">Usuario *</Label>
              <select
                id="edit-userId"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6b7c45] focus:border-transparent ${formErrors.userId ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Seleccionar usuario</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
              {formErrors.userId && <p className="text-xs text-red-500 mt-1">{formErrors.userId}</p>}
            </div>
            <div>
              <Label htmlFor="edit-productId">Producto *</Label>
              <select
                id="edit-productId"
                value={formData.productId}
                onChange={(e) => handleFormChange('productId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6b7c45] focus:border-transparent ${formErrors.productId ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Seleccionar producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stock: {product.stock})
                  </option>
                ))}
              </select>
              {formErrors.productId && <p className="text-xs text-red-500 mt-1">{formErrors.productId}</p>}
            </div>
            <div>
              <Label htmlFor="edit-quantity">Cantidad *</Label>
              <Input
                id="edit-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleFormChange('quantity', e.target.value)}
                className={formErrors.quantity ? 'border-red-500' : ''}
              />
              {formErrors.quantity && <p className="text-xs text-red-500 mt-1">{formErrors.quantity}</p>}
            </div>
            <div>
              <Label htmlFor="edit-notes">Notas</Label>
              <Input
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, output: null })} disabled={isSubmitting}>
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

      {/* Modal para Eliminar Salida */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, output: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.output && (
            <div className="py-4">
              <p className="text-sm text-gray-700">
                ¿Está seguro que desea eliminar esta salida de{' '}
                <span className="font-semibold">{deleteDialog.output.productName}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ID: {deleteDialog.output.id} | Cantidad: {deleteDialog.output.quantity}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, output: null })} disabled={isSubmitting}>
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

