// ./pages/SuppliersListPage.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, Download, Eye, Edit2, Trash2, ArrowUpDown } from "lucide-react";
import { supplierService } from "@/services/api"
import { useToast } from "@/components/ui/use-toast";

export default function SuppliersListPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const { toast } = useToast();

  // Modales
  const [viewDialog, setViewDialog] = useState({ open: false, supplier: null });
  const [editDialog, setEditDialog] = useState({ open: false, supplier: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, supplier: null });
  const [createDialog, setCreateDialog] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    supplierId: "",
    name: "",
    phone: "",
    email: "",
    cityId: "",
    stateId: "",
    countryId: "",
    nit: "",
    address: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalize = (raw) => ({
    ...raw,
    supplierId: raw.supplierId || raw.supplier_id || "",
    name: raw.name || raw.nombre || "",
    phone: raw.phone || raw.telefono || "",
    email: raw.email || "",
    cityId: raw.cityId || raw.city_id || "",
    stateId: raw.stateId || raw.state_id || "",
    countryId: raw.countryId || raw.country_id || "",
    nit: raw.nit || raw.document || "",
    address: raw.address || raw.direccion || ""
  });

  const loadSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await supplierService.getAllSuppliers();
      setSuppliers(Array.isArray(data) ? data.map(normalize) : []);
    } catch (err) {
      console.error("Error cargando proveedores:", err);
      toast({ title: "Error", description: "No se pudieron cargar los proveedores", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  const handleView = (supplier) => setViewDialog({ open: true, supplier });
  const handleDelete = (supplier) => setDeleteDialog({ open: true, supplier });

  const handleEditOpen = (supplier) => {
    setFormData({
      supplierId: supplier.supplierId || "",
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      cityId: supplier.cityId || "",
      stateId: supplier.stateId || "",
      countryId: supplier.countryId || "",
      nit: supplier.nit || "",
      address: supplier.address || ""
    });
    setFormErrors({});
    setEditDialog({ open: true, supplier });
  };

  const handleCreateOpen = () => {
    setFormData({
      supplierId: "",
      name: "",
      phone: "",
      email: "",
      cityId: "",
      stateId: "",
      countryId: "",
      nit: "",
      address: ""
    });
    setFormErrors({});
    setCreateDialog(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.supplierId.trim()) errors.supplierId = "El ID del proveedor es requerido";
    if (!formData.name.trim()) errors.name = "El nombre es requerido";
    if (!formData.phone.trim()) errors.phone = "El teléfono es requerido";
    if (!formData.email.trim()) errors.email = "El correo es requerido";
    else {
      // simple email check
      const re = /\S+@\S+\.\S+/;
      if (!re.test(formData.email)) errors.email = "Formato de correo inválido";
    }
    if (!formData.cityId.trim()) errors.cityId = "CityId es requerido";
    if (!formData.stateId.trim()) errors.stateId = "StateId es requerido";
    if (!formData.countryId.trim()) errors.countryId = "CountryId es requerido";
    if (!formData.nit.trim()) errors.nit = "El NIT es requerido";
    // address opcional

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await supplierService.createSupplier(formData);
      toast({ title: "Proveedor creado", description: "Proveedor creado correctamente" });
      setCreateDialog(false);
      loadSuppliers();
    } catch (err) {
      toast({ title: "Error", description: err.message || "No se pudo crear el proveedor", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleEditSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await supplierService.updateSupplier(editDialog.supplier.id, formData);
      toast({ title: "Proveedor actualizado", description: "Proveedor actualizado correctamente" });
      setEditDialog({ open: false, supplier: null });
      loadSuppliers();
    } catch (err) {
      toast({ title: "Error", description: err.message || "No se pudo actualizar el proveedor", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await supplierService.deleteSupplier(deleteDialog.supplier.id);
      toast({ title: "Proveedor eliminado", description: "Proveedor eliminado correctamente" });
      setDeleteDialog({ open: false, supplier: null });
      loadSuppliers();
    } catch (err) {
      toast({ title: "Error", description: err.message || "No se pudo eliminar el proveedor", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: "" }));
  };

  // Filtrado: buscar por name, email, nit (y por id numérico)
  const filtered = useMemo(() => {
    const term = search.trim();
    let data = [...suppliers];
    if (term) {
      const isNumeric = /^\d+$/.test(term);
      if (isNumeric) {
        const searchId = parseInt(term, 10);
        data = data.filter(s => s.id === searchId);
      } else {
        const t = term.toLowerCase();
        data = data.filter(s => {
          return [s.name, s.email, s.nit, s.supplierId]
            .filter(Boolean)
            .some(v => v.toLowerCase().includes(t));
        });
      }
    }

    data.sort((a, b) => {
      const { key, direction } = sortConfig;
      const av = (a[key] ?? "").toString().toLowerCase();
      const bv = (b[key] ?? "").toString().toLowerCase();
      if (av < bv) return direction === "asc" ? -1 : 1;
      if (av > bv) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [suppliers, search, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key) => {
    setSortConfig(prev => (prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }));
  };

  const SortButton = ({ colKey, children }) => (
    <button type="button" onClick={() => toggleSort(colKey)} className="inline-flex items-center gap-1 group">
      {children}
      <ArrowUpDown className={`h-3.5 w-3.5 opacity-50 group-hover:opacity-80 ${sortConfig.key === colKey ? 'text-primary opacity-100' : ''}`} />
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Proveedores</h1>
        <Button onClick={handleCreateOpen} className="bg-[#6b7c45] hover:bg-[#5a6b35] text-white">+ Nuevo Proveedor</Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Listado de Proveedores</h2>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar por nombre, email o NIT..." className="pl-9 bg-white border-gray-300" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Button variant="outline" className="gap-2 border-gray-300"><Filter className="h-4 w-4" />Filtros</Button>
            <Button variant="outline" className="gap-2 border-gray-300"><Download className="h-4 w-4" />Exportar</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="font-medium text-gray-600"><SortButton colKey="id">ID</SortButton></TableHead>
                <TableHead className="font-medium text-gray-600"><SortButton colKey="supplierId">ID Proveedor</SortButton></TableHead>
                <TableHead className="font-medium text-gray-600"><SortButton colKey="name">Nombre</SortButton></TableHead>
                <TableHead className="font-medium text-gray-600"><SortButton colKey="phone">Teléfono</SortButton></TableHead>
                <TableHead className="font-medium text-gray-600"><SortButton colKey="email">Email</SortButton></TableHead>
                <TableHead className="font-medium text-gray-600 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && suppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-gray-500">Cargando proveedores...</TableCell>
                </TableRow>
              )}
              {!isLoading && pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-gray-500">No se encontraron proveedores</TableCell>
                </TableRow>
              )}
              {pageData.map(s => (
                <TableRow key={s.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-900">{s.id}</TableCell>
                  <TableCell className="text-gray-700">{s.supplierId || '-'}</TableCell>
                  <TableCell className="text-gray-700">{s.name || '-'}</TableCell>
                  <TableCell className="text-gray-600">{s.phone || '-'}</TableCell>
                  <TableCell className="text-gray-600">{s.email || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleView(s)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-blue-600" title="Detalles"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => handleEditOpen(s)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-green-600" title="Editar"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(s)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-red-600" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">Mostrando {pageData.length} de {filtered.length} registros</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="border-gray-300">Anterior</Button>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="border-gray-300">Siguiente</Button>
          </div>
        </div>
      </div>

      {/* Modal Ver */}
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, supplier: null })}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles del Proveedor</DialogTitle>
            <DialogDescription>Información completa del proveedor seleccionado</DialogDescription>
          </DialogHeader>
          {viewDialog.supplier && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-sm font-medium text-gray-500">ID</Label><p className="text-sm mt-1">{viewDialog.supplier.id}</p></div>
                <div><Label className="text-sm font-medium text-gray-500">ID Proveedor</Label><p className="text-sm mt-1">{viewDialog.supplier.supplierId}</p></div>
              </div>
              <div><Label className="text-sm font-medium text-gray-500">Nombre</Label><p className="text-sm mt-1">{viewDialog.supplier.name}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-sm font-medium text-gray-500">Teléfono</Label><p className="text-sm mt-1">{viewDialog.supplier.phone}</p></div>
                <div><Label className="text-sm font-medium text-gray-500">Email</Label><p className="text-sm mt-1">{viewDialog.supplier.email}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="text-sm font-medium text-gray-500">Ciudad (ID)</Label><p className="text-sm mt-1">{viewDialog.supplier.cityId}</p></div>
                <div><Label className="text-sm font-medium text-gray-500">Departamento (ID)</Label><p className="text-sm mt-1">{viewDialog.supplier.stateId}</p></div>
                <div><Label className="text-sm font-medium text-gray-500">País (ID)</Label><p className="text-sm mt-1">{viewDialog.supplier.countryId}</p></div>
              </div>
              <div><Label className="text-sm font-medium text-gray-500">NIT</Label><p className="text-sm mt-1">{viewDialog.supplier.nit}</p></div>
              <div><Label className="text-sm font-medium text-gray-500">Dirección</Label><p className="text-sm mt-1">{viewDialog.supplier.address || 'Sin dirección'}</p></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewDialog({ open: false, supplier: null })}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Crear */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Proveedor</DialogTitle>
            <DialogDescription>Complete los campos para registrar un nuevo proveedor</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-supplierId">ID Proveedor *</Label>
                <Input id="create-supplierId" value={formData.supplierId} onChange={(e) => handleFormChange('supplierId', e.target.value)} className={formErrors.supplierId ? 'border-red-500' : ''} />
                {formErrors.supplierId && <p className="text-xs text-red-500 mt-1">{formErrors.supplierId}</p>}
              </div>
              <div>
                <Label htmlFor="create-name">Nombre *</Label>
                <Input id="create-name" value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)} className={formErrors.name ? 'border-red-500' : ''} />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="create-phone">Teléfono *</Label>
                <Input id="create-phone" value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} className={formErrors.phone ? 'border-red-500' : ''} />
                {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="create-email">Email *</Label>
                <Input id="create-email" value={formData.email} onChange={(e) => handleFormChange('email', e.target.value)} className={formErrors.email ? 'border-red-500' : ''} />
                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <Label htmlFor="create-nit">NIT *</Label>
                <Input id="create-nit" value={formData.nit} onChange={(e) => handleFormChange('nit', e.target.value)} className={formErrors.nit ? 'border-red-500' : ''} />
                {formErrors.nit && <p className="text-xs text-red-500 mt-1">{formErrors.nit}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="create-cityId">CityId *</Label>
                <Input id="create-cityId" value={formData.cityId} onChange={(e) => handleFormChange('cityId', e.target.value)} className={formErrors.cityId ? 'border-red-500' : ''} />
                {formErrors.cityId && <p className="text-xs text-red-500 mt-1">{formErrors.cityId}</p>}
              </div>
              <div>
                <Label htmlFor="create-stateId">StateId *</Label>
                <Input id="create-stateId" value={formData.stateId} onChange={(e) => handleFormChange('stateId', e.target.value)} className={formErrors.stateId ? 'border-red-500' : ''} />
                {formErrors.stateId && <p className="text-xs text-red-500 mt-1">{formErrors.stateId}</p>}
              </div>
              <div>
                <Label htmlFor="create-countryId">CountryId *</Label>
                <Input id="create-countryId" value={formData.countryId} onChange={(e) => handleFormChange('countryId', e.target.value)} className={formErrors.countryId ? 'border-red-500' : ''} />
                {formErrors.countryId && <p className="text-xs text-red-500 mt-1">{formErrors.countryId}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="create-address">Dirección</Label>
              <Input id="create-address" value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleCreateSubmit} disabled={isSubmitting} className="bg-[#6b7c45] hover:bg-[#5a6b35]">{isSubmitting ? 'Creando...' : 'Crear Proveedor'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, supplier: null })}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
            <DialogDescription>Modifica los datos del proveedor</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-supplierId">ID Proveedor *</Label>
                {/* Editable según tu elección */}
                <Input id="edit-supplierId" value={formData.supplierId} onChange={(e) => handleFormChange('supplierId', e.target.value)} className={formErrors.supplierId ? 'border-red-500' : ''} />
                {formErrors.supplierId && <p className="text-xs text-red-500 mt-1">{formErrors.supplierId}</p>}
              </div>
              <div>
                <Label htmlFor="edit-name">Nombre *</Label>
                <Input id="edit-name" value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)} className={formErrors.name ? 'border-red-500' : ''} />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-phone">Teléfono *</Label>
                <Input id="edit-phone" value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} className={formErrors.phone ? 'border-red-500' : ''} />
                {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input id="edit-email" value={formData.email} onChange={(e) => handleFormChange('email', e.target.value)} className={formErrors.email ? 'border-red-500' : ''} />
                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <Label htmlFor="edit-nit">NIT *</Label>
                <Input id="edit-nit" value={formData.nit} onChange={(e) => handleFormChange('nit', e.target.value)} className={formErrors.nit ? 'border-red-500' : ''} />
                {formErrors.nit && <p className="text-xs text-red-500 mt-1">{formErrors.nit}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-cityId">CityId *</Label>
                <Input id="edit-cityId" value={formData.cityId} onChange={(e) => handleFormChange('cityId', e.target.value)} className={formErrors.cityId ? 'border-red-500' : ''} />
                {formErrors.cityId && <p className="text-xs text-red-500 mt-1">{formErrors.cityId}</p>}
              </div>
              <div>
                <Label htmlFor="edit-stateId">StateId *</Label>
                <Input id="edit-stateId" value={formData.stateId} onChange={(e) => handleFormChange('stateId', e.target.value)} className={formErrors.stateId ? 'border-red-500' : ''} />
                {formErrors.stateId && <p className="text-xs text-red-500 mt-1">{formErrors.stateId}</p>}
              </div>
              <div>
                <Label htmlFor="edit-countryId">CountryId *</Label>
                <Input id="edit-countryId" value={formData.countryId} onChange={(e) => handleFormChange('countryId', e.target.value)} className={formErrors.countryId ? 'border-red-500' : ''} />
                {formErrors.countryId && <p className="text-xs text-red-500 mt-1">{formErrors.countryId}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-address">Dirección</Label>
              <Input id="edit-address" value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, supplier: null })} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting} className="bg-[#6b7c45] hover:bg-[#5a6b35]">{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, supplier: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>Esta acción no se puede deshacer</DialogDescription></DialogHeader>
          {deleteDialog.supplier && (
            <div className="py-4">
              <p className="text-sm text-gray-700">¿Está seguro que desea eliminar al proveedor <span className="font-semibold">{deleteDialog.supplier.name}</span>?</p>
              <p className="text-sm text-gray-500 mt-2">ID: {deleteDialog.supplier.id} | SupplierId: {deleteDialog.supplier.supplierId}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, supplier: null })} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleDeleteConfirm} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">{isSubmitting ? 'Eliminando...' : 'Eliminar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
