import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Filter, Download, Eye, Edit2, ArrowUpDown } from "lucide-react"
import { userService } from "@/services/api"
import { useToast } from "@/components/ui/use-toast"

export default function UsersListPage() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" })
  const [page, setPage] = useState(1)
  const pageSize = 8
  const { getAllUsers } = useAuth()
  const { toast } = useToast()

  // Estados para modales
  const [viewDialog, setViewDialog] = useState({ open: false, user: null })
  const [editDialog, setEditDialog] = useState({ open: false, user: null })

  // Estados para formularios
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: ""
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizeUser = (raw) => {

    const first = raw.first_name || raw.fisrtName || raw.firstName || raw.nombre || raw.nombres || raw.name || ''
    const last = raw.last_name || raw.lastName || raw.apellido || raw.apellidos || raw.surname || ''

    // Construir nombre completo
    const fullName = [first, last].filter(Boolean).join(' ').trim() ||
      raw.fullName || raw.full_name || raw.username || 'Sin nombre'

    return {
      ...raw,
      firstName: first,
      lastName: last,
      fullName,
      email: raw.email || raw.correo || '',
      phone: raw.phone || raw.telefono || raw.celular || ''
    }
  }

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const usersData = await getAllUsers()
      setUsers(Array.isArray(usersData) ? usersData.map(normalizeUser) : [])
    } catch (error) {
      console.error("Error cargando usuarios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [getAllUsers, toast])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Funciones para abrir modales
  const handleView = (user) => {
    setViewDialog({ open: true, user })
  }

  const handleEdit = (user) => {
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      password: ""
    })
    setFormErrors({})
    setEditDialog({ open: true, user })
  }

  // Funcion para validar formulario
  const validateForm = () => {
    const errors = {}

    if (!formData.firstName.trim()) errors.firstName = "El nombre es requerido"
    if (!formData.lastName.trim()) errors.lastName = "El apellido es requerido"
    if (!formData.email.trim()) errors.email = "El email es requerido"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email inválido"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Funcion para actualizar usuario
  const handleEditSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await userService.updateUser(editDialog.user.id, formData)
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente",
        variant: "default"
      })
      setEditDialog({ open: false, user: null })
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Funcion para manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim()
    let data = [...users]

    if (term) {
      const isNumeric = /^\d+$/.test(term)

      if (isNumeric) {
        const searchId = parseInt(term, 10)
        data = data.filter(u => u.id === searchId)
      } else {
        const termLower = term.toLowerCase()
        data = data.filter(u => {
          return [u.fullName, u.firstName, u.lastName, u.email]
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
  }, [users, search, sortConfig])

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
      {/* Header con titulo */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
      </div>

      {/* Card principal con tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        { }
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Listado de Usuarios</h2>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID, nombre o email..."
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
                  <SortButton colKey="fullName">Nombre</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">
                  <SortButton colKey="email">Email</SortButton>
                </TableHead>
                <TableHead className="font-medium text-gray-600">Teléfono</TableHead>
                <TableHead className="font-medium text-gray-600 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-900">{user.id}</TableCell>
                  <TableCell className="text-gray-700">{user.fullName}</TableCell>
                  <TableCell className="text-gray-600">{user.email || '-'}</TableCell>
                  <TableCell className="text-gray-600">{user.phone || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleView(user)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-blue-600"
                        title="Detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-green-600"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer con paginacion */}
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
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, user: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription>
              Información completa del usuario seleccionado
            </DialogDescription>
          </DialogHeader>
          {viewDialog.user && (
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">ID</Label>
                <p className="text-sm mt-1">{viewDialog.user.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nombre</Label>
                  <p className="text-sm mt-1">{viewDialog.user.firstName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Apellido</Label>
                  <p className="text-sm mt-1">{viewDialog.user.lastName}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="text-sm mt-1">{viewDialog.user.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Teléfono</Label>
                <p className="text-sm mt-1">{viewDialog.user.phone || 'N/A'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog({ open: false, user: null })}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Usuario */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, user: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifique los datos del usuario
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">Nombre *</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => handleFormChange('firstName', e.target.value)}
                  className={formErrors.firstName ? 'border-red-500' : ''}
                />
                {formErrors.firstName && <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>}
              </div>
              <div>
                <Label htmlFor="edit-lastName">Apellido *</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => handleFormChange('lastName', e.target.value)}
                  className={formErrors.lastName ? 'border-red-500' : ''}
                />
                {formErrors.lastName && <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                className={formErrors.email ? 'border-red-500' : ''}
              />
              {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, user: null })} disabled={isSubmitting}>
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
    </div>
  )
}
