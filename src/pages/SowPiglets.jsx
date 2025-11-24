import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { pigService } from "@/services/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SEX_OPTIONS = [
  { value: "FEMALE", label: "Hembra" },
  { value: "MALE", label: "Macho" },
  { value: "DESCONOCIDO", label: "Desconocido" },
];

const PIGLET_STATUS = [
  { value: "VIVO", label: "Vivo" },
  { value: "MUERTO", label: "Muerto" },
  { value: "VENDIDO", label: "Vendido" },
  { value: "TRANSFERIDO", label: "Transferido" },
];

const formatDate = (value) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  } catch (error) {
    return value;
  }
};

const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return num.toFixed(decimals);
};

const getEmptyPigletForm = (defaultCycleId = "") => ({
  id: null,
  uniqueId: "",
  tagId: "",
  referenceCycleId: defaultCycleId,
  sex: (SEX_OPTIONS[0]?.value || "FEMALE"),
  birthWeight: "",
  weaningWeight: "",
  status: (PIGLET_STATUS[0]?.value || "VIVO"),
  statusDate: "",
  statusDetail: "",
  notes: "",
});

const mapPigletToForm = (piglet) => ({
  id: piglet.id ?? null,
  uniqueId: (piglet.uniqueId || piglet.tagId || ""),
  tagId: (piglet.tagId || piglet.uniqueId || ""),
  referenceCycleId: piglet.referenceCycleId ?? "",
  sex: (piglet.sex || SEX_OPTIONS[0]?.value || "FEMALE"),
  birthWeight: piglet.birthWeight ?? "",
  weaningWeight: piglet.weaningWeight ?? "",
  status: (piglet.status || PIGLET_STATUS[0]?.value || "VIVO"),
  statusDate: piglet.statusDate ?? "",
  statusDetail: piglet.statusDetail ?? "",
  notes: piglet.notes ?? "",
});

export default function SowPigletsPage() {
  const { toast } = useToast();
  const [sows, setSows] = useState([]);
  const [selectedSowId, setSelectedSowId] = useState("");
  const [selectedSow, setSelectedSow] = useState(null);
  const [loadingSows, setLoadingSows] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [isPigletDialogOpen, setIsPigletDialogOpen] = useState(false);
  const [pigletForm, setPigletForm] = useState(getEmptyPigletForm());
  const [editingPigletId, setEditingPigletId] = useState(null);
  const [savingPiglet, setSavingPiglet] = useState(false);

  const loadSows = useCallback(async () => {
    try {
      setLoadingSows(true);
      const response = await pigService.getAllPigs();
      const reproductoras = response.filter((pig) => pig.gender === "FEMALE" && pig.pigType === "REPRODUCTORA");
      setSows(reproductoras);

      if (!reproductoras.length) {
        setSelectedSow(null);
        setSelectedSowId("");
        return;
      }

      const exists = reproductoras.some((sow) => String(sow.id) === String(selectedSowId));
      if (!exists && reproductoras.length > 0) {
        setSelectedSowId(String(reproductoras[0].id));
      }
    } catch (error) {
      console.error("Error cargando cerdas:", error);
      toast({
        title: "Error",
        description: error?.message || "No fue posible cargar las cerdas.",
        variant: "destructive",
      });
      setSows([]);
    } finally {
      setLoadingSows(false);
    }
  }, [selectedSowId, toast]);

  const refreshSow = useCallback(
    async (id) => {
      if (!id) return;
      try {
        setLoadingDetails(true);
        const sow = await pigService.getPigById(id);
        setSelectedSow(sow);
        setSows((prev) => prev.map((item) => (String(item.id) === String(id) ? sow : item)));
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: error?.message || "No fue posible obtener la información de la cerda.",
          variant: "destructive",
        });
      } finally {
        setLoadingDetails(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadSows();
  }, [loadSows]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedSowId) {
        setSelectedSow(null);
        return;
      }
      await refreshSow(selectedSowId);
    };

    fetchDetails();
  }, [selectedSowId, refreshSow]);

  const orderedSows = [...sows].sort((a, b) => a.pigId.localeCompare(b.pigId, "es"));

  const cycleOptions = useMemo(() => {
    if (!selectedSow?.reproductiveRecords?.length) return [];
    return selectedSow.reproductiveRecords.map((record) => ({
      value: String(record.id),
      label: `Ciclo ${record.cycleNumber || "-"} • ${formatDate(record.service?.date)}`,
    }));
  }, [selectedSow]);

  const openCreatePigletDialog = () => {
    if (!selectedSow) {
      toast({
        title: "Selecciona una cerda",
        description: "Primero debes seleccionar una cerda para registrar crías.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Abriendo diálogo de cría, cerda seleccionada:", selectedSow.pigId);
    const defaultCycle = selectedSow?.reproductiveRecords?.[0]?.id ?? "";
    const newForm = getEmptyPigletForm(String(defaultCycle));
    console.log("Formulario inicial:", newForm);
    setPigletForm(newForm);
    setEditingPigletId(null);
    setIsPigletDialogOpen(true);
    console.log("Estado del diálogo debe ser true");
  };

  const openEditPigletDialog = (piglet) => {
    setPigletForm(mapPigletToForm(piglet));
    setEditingPigletId(piglet.id);
    setIsPigletDialogOpen(true);
  };

  const handleSavePiglet = async () => {
    if (!selectedSow) return;

    const payload = {
      ...pigletForm,
      referenceCycleId: (pigletForm.referenceCycleId && pigletForm.referenceCycleId !== "none") ? pigletForm.referenceCycleId : null,
      birthWeight: pigletForm.birthWeight !== "" ? Number(pigletForm.birthWeight) : null,
      weaningWeight: pigletForm.weaningWeight !== "" ? Number(pigletForm.weaningWeight) : null,
    };

    try {
      setSavingPiglet(true);
      if (editingPigletId) {
        await pigService.updatePiglet(selectedSow.id, editingPigletId, payload);
        toast({
          title: "Cría actualizada",
          description: "La información de la cría fue actualizada.",
        });
      } else {
        await pigService.addPiglet(selectedSow.id, payload);
        toast({
          title: "Cría registrada",
          description: "La cría fue añadida a la camada.",
        });
      }

      setIsPigletDialogOpen(false);
      setEditingPigletId(null);
      setPigletForm(getEmptyPigletForm());
      await refreshSow(selectedSow.id);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.message || "No fue posible guardar la información de la cría.",
        variant: "destructive",
      });
    } finally {
      setSavingPiglet(false);
    }
  };

  const handleDeletePiglet = async (pigletId) => {
    if (!selectedSow) return;
    try {
      await pigService.deletePiglet(selectedSow.id, pigletId);
      toast({
        title: "Cría eliminada",
        description: "La cría fue eliminada del registro.",
      });
      await refreshSow(selectedSow.id);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.message || "No fue posible eliminar la cría.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-[#6b7c45]" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crías y Descendencia</h1>
          <p className="text-sm text-gray-600 mt-1">
            Administra el registro individual de cada lechón nacido con su identificación, pesos, estado y observaciones especiales.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshSow(selectedSowId)}
          disabled={!selectedSowId || loadingDetails}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", loadingDetails && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-100">
          <CardTitle>Seleccionar cerda</CardTitle>
          <CardDescription>
            Elige una cerda reproductora para gestionar sus crías.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingSows ? (
            <p className="text-sm text-gray-500">Cargando cerdas registradas...</p>
          ) : orderedSows.length === 0 ? (
            <p className="text-sm text-gray-500">
              No hay cerdas registradas. Ve al módulo 1.1 para registrar una nueva cerda.
            </p>
          ) : (
            <div>
              <Label htmlFor="sow-selector">Cerda</Label>
              <Select
                value={selectedSowId ? String(selectedSowId) : ""}
                onValueChange={setSelectedSowId}
              >
                <SelectTrigger id="sow-selector">
                  <SelectValue placeholder="Selecciona una cerda" />
                </SelectTrigger>
                <SelectContent>
                  {orderedSows.map((sow) => (
                    <SelectItem key={sow.id} value={String(sow.id)}>
                      {sow.pigId} - {sow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedSow ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-4 h-12 w-12 text-gray-400" />
            <p className="text-lg font-medium text-gray-700">
              Selecciona una cerda primero
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Elige una cerda reproductora del selector de arriba para ver y gestionar sus crías.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col gap-2 border-b border-gray-100 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Crías y descendencia</CardTitle>
              <CardDescription>
                Registro individual de cada lechón nacido, su evolución y estado actual.
              </CardDescription>
            </div>
            <Button onClick={openCreatePigletDialog}>
              <Plus className="mr-2 h-4 w-4" /> Registrar cría
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {selectedSow.piglets?.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID único del lechón</TableHead>
                      <TableHead>Identificación física</TableHead>
                      <TableHead>Ciclo asociado</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead>Peso nacimiento (kg)</TableHead>
                      <TableHead>Peso destete (kg)</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSow.piglets.map((piglet) => {
                      const cycle = selectedSow.reproductiveRecords?.find(
                        (record) => String(record.id) === String(piglet.referenceCycleId)
                      );
                      const isLowWeight = piglet.birthWeight && Number(piglet.birthWeight) < 0.7;

                      return (
                        <TableRow key={piglet.id}>
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              <span className="font-medium text-gray-800">
                                {piglet.uniqueId || "-"}
                              </span>
                              {piglet.pigletNumber && (
                                <span className="text-xs text-gray-500">
                                  Lechón #{piglet.pigletNumber}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-700">
                              {piglet.tagId || "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {cycle ? (
                              <div className="flex flex-col text-sm">
                                <span>Ciclo {cycle.cycleNumber ?? "-"}</span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(cycle.service?.date)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Sin asignar</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{piglet.sex || "-"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{formatNumber(piglet.birthWeight)}</span>
                              {isLowWeight && (
                                <Badge variant="destructive" className="text-xs">
                                  Bajo
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatNumber(piglet.weaningWeight)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                piglet.status === "VIVO"
                                  ? "default"
                                  : piglet.status === "MUERTO"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {piglet.status || ""}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(piglet.statusDate)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditPigletDialog(piglet)}
                              >
                                <ClipboardList className="mr-2 h-4 w-4" /> Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => handleDeletePiglet(piglet.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
                No se han registrado crías para esta cerda.
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {console.log("Estado isPigletDialogOpen:", isPigletDialogOpen)}

      <Dialog 
        open={isPigletDialogOpen} 
        onOpenChange={(open) => {
          console.log("Dialog onOpenChange:", open);
          setIsPigletDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPigletId ? "Actualizar cría" : "Registrar cría"}</DialogTitle>
            <DialogDescription>
              Define la información individual de la cría asociada a la cerda.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pigletUnique">ID único del lechón</Label>
              <Input
                id="pigletUnique"
                value={pigletForm.uniqueId}
                onChange={(e) => setPigletForm((prev) => ({ ...prev, uniqueId: e.target.value }))}
                placeholder="Ej: LT-001-A, CER-001-L01"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pigletTag">Identificación física (muesca, tatuaje, arete)</Label>
              <Input
                id="pigletTag"
                value={pigletForm.tagId}
                onChange={(e) => setPigletForm((prev) => ({ ...prev, tagId: e.target.value }))}
                placeholder="Sistema de identificación física"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pigletCycle">Asociar a ciclo reproductivo</Label>
              <Select
                value={pigletForm.referenceCycleId ?? ""}
                onValueChange={(value) =>
                  setPigletForm((prev) => ({ ...prev, referenceCycleId: value }))
                }
              >
                <SelectTrigger id="pigletCycle">
                  <SelectValue placeholder="Selecciona el ciclo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {cycleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pigletSex">Sexo</Label>
                <Select
                  value={pigletForm.sex}
                  onValueChange={(value) => setPigletForm((prev) => ({ ...prev, sex: value }))}
                >
                  <SelectTrigger id="pigletSex">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEX_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pigletStatus">Estado</Label>
                <Select
                  value={pigletForm.status}
                  onValueChange={(value) => setPigletForm((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="pigletStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIGLET_STATUS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pigletBirthWeight">Peso nacimiento (kg)</Label>
                <Input
                  id="pigletBirthWeight"
                  type="number"
                  step="0.01"
                  value={pigletForm.birthWeight}
                  onChange={(e) =>
                    setPigletForm((prev) => ({ ...prev, birthWeight: e.target.value }))
                  }
                  placeholder="Bajo peso: <0.7 kg"
                />
              </div>
              <div>
                <Label htmlFor="pigletWeaningWeight">Peso destete (kg)</Label>
                <Input
                  id="pigletWeaningWeight"
                  type="number"
                  step="0.01"
                  value={pigletForm.weaningWeight}
                  onChange={(e) =>
                    setPigletForm((prev) => ({ ...prev, weaningWeight: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pigletStatusDate">Fecha del estado</Label>
              <Input
                id="pigletStatusDate"
                type="date"
                value={pigletForm.statusDate}
                onChange={(e) => setPigletForm((prev) => ({ ...prev, statusDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pigletStatusDetail">Detalle del estado</Label>
              <Input
                id="pigletStatusDetail"
                value={pigletForm.statusDetail}
                onChange={(e) =>
                  setPigletForm((prev) => ({ ...prev, statusDetail: e.target.value }))
                }
                placeholder="Ej: Venta a granja vecina, fecha y causa de muerte"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pigletNotes">Observaciones especiales</Label>
              <textarea
                id="pigletNotes"
                value={pigletForm.notes}
                onChange={(e) => setPigletForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b7c45]"
                rows={3}
                placeholder="Necesidad de atención especial, suplementación, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPigletDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePiglet} disabled={savingPiglet}>
              {savingPiglet ? "Guardando..." : editingPigletId ? "Actualizar" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

