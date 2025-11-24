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
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  ClipboardList,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICE_TYPES = [
  { value: "MONTA_NATURAL", label: "Monta natural" },
  { value: "IAC", label: "Inseminación artificial convencional" },
  { value: "IAPC", label: "Inseminación artificial post-cervical" },
];

const DELIVERY_TYPES = [
  { value: "NORMAL", label: "Parto normal" },
  { value: "ASISTIDO", label: "Parto asistido" },
  { value: "DISTOCICO", label: "Parto distócico" },
];

const PRODUCTIVITY_RESULTS = [
  { value: "POSITIVO", label: "Positivo" },
  { value: "NEGATIVO", label: "Negativo" },
  { value: "PENDIENTE", label: "Pendiente" },
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

const getEmptyRecordForm = (nextCycle = 1) => ({
  cycleNumber: nextCycle,
  serviceDate: "",
  serviceType: (SERVICE_TYPES[1]?.value || "IAC"),
  boarId: "",
  semenDose: "",
  inseminator: "",
  servicesCount: 1,
  pregnancyCheckDate: "",
  pregnancyCheckMethod: "",
  pregnancyResult: (PRODUCTIVITY_RESULTS[2]?.value || "PENDIENTE"),
  farrowingDate: "",
  deliveryType: (DELIVERY_TYPES[0]?.value || "NORMAL"),
  labourDurationHours: "",
  totalBorn: "",
  bornAlive: "",
  stillborn: "",
  mummies: "",
  malformations: "",
  maleCount: "",
  femaleCount: "",
  birthWeightTotal: "",
  lactationWeaningDate: "",
  pigletsWeaned: "",
  weaningWeightPerPiglet: "",
  totalWeaningWeight: "",
  lactationDurationDays: "",
  lactationMortality: "",
  adoptionsNotes: "",
  sowBodyCondition: "",
  postWeaningEstrusDate: "",
  idcDays: "",
  abortions: "",
  repeats: "",
  anestrus: "",
  notes: "",
});

const mapRecordToForm = (record) => ({
  cycleNumber: record.cycleNumber ?? "",
  serviceDate: record.service?.date ?? "",
  serviceType: (record.service?.type || SERVICE_TYPES[1]?.value || "IAC"),
  boarId: record.service?.boarId ?? "",
  semenDose: record.service?.semenDose ?? "",
  inseminator: record.service?.inseminator ?? "",
  servicesCount: record.service?.servicesCount ?? 1,
  pregnancyCheckDate: record.pregnancyCheck?.date ?? "",
  pregnancyCheckMethod: record.pregnancyCheck?.method ?? "",
  pregnancyResult: (record.pregnancyCheck?.result || PRODUCTIVITY_RESULTS[2]?.value || "PENDIENTE"),
  farrowingDate: record.farrowing?.date ?? "",
  deliveryType: (record.farrowing?.type || DELIVERY_TYPES[0]?.value || "NORMAL"),
  labourDurationHours: record.farrowing?.labourDurationHours ?? "",
  totalBorn: record.litter?.totalBorn ?? "",
  bornAlive: record.litter?.bornAlive ?? "",
  stillborn: record.litter?.stillborn ?? "",
  mummies: record.litter?.mummies ?? "",
  malformations: record.litter?.malformations ?? "",
  maleCount: record.litter?.maleCount ?? "",
  femaleCount: record.litter?.femaleCount ?? "",
  birthWeightTotal: record.litter?.birthWeightTotal ?? "",
  lactationWeaningDate: record.lactation?.weaningDate ?? "",
  pigletsWeaned: record.lactation?.pigletsWeaned ?? "",
  weaningWeightPerPiglet: record.lactation?.weaningWeightPerPiglet ?? "",
  totalWeaningWeight: record.lactation?.totalWeaningWeight ?? "",
  lactationDurationDays: record.lactation?.durationDays ?? "",
  lactationMortality: record.lactation?.mortalityNotes ?? "",
  adoptionsNotes: record.lactation?.adoptionsNotes ?? "",
  sowBodyCondition: record.lactation?.sowBodyCondition ?? "",
  postWeaningEstrusDate: record.lactation?.postWeaningEstrusDate ?? "",
  idcDays: record.lactation?.idcDays ?? "",
  abortions: record.productivityIssues?.abortions ?? "",
  repeats: record.productivityIssues?.repeats ?? "",
  anestrus: record.productivityIssues?.anestrus ?? "",
  notes: record.notes ?? "",
});

const buildRecordPayload = (form) => ({
  cycleNumber: form.cycleNumber ? Number(form.cycleNumber) : null,
  service: {
    date: form.serviceDate,
    type: form.serviceType,
    boarId: form.boarId,
    semenDose: form.semenDose,
    inseminator: form.inseminator,
    servicesCount: Number(form.servicesCount) || 1,
  },
  pregnancyCheck: {
    date: form.pregnancyCheckDate,
    method: form.pregnancyCheckMethod,
    result: form.pregnancyResult,
  },
  farrowing: {
    date: form.farrowingDate,
    type: form.deliveryType,
    labourDurationHours: form.labourDurationHours !== "" ? Number(form.labourDurationHours) : null,
    observations: form.notes,
  },
  litter: {
    totalBorn: form.totalBorn !== "" ? Number(form.totalBorn) : null,
    bornAlive: form.bornAlive !== "" ? Number(form.bornAlive) : null,
    stillborn: form.stillborn !== "" ? Number(form.stillborn) : null,
    mummies: form.mummies !== "" ? Number(form.mummies) : null,
    malformations: form.malformations,
    maleCount: form.maleCount !== "" ? Number(form.maleCount) : null,
    femaleCount: form.femaleCount !== "" ? Number(form.femaleCount) : null,
    birthWeightTotal: form.birthWeightTotal !== "" ? Number(form.birthWeightTotal) : null,
  },
  lactation: {
    weaningDate: form.lactationWeaningDate,
    pigletsWeaned: form.pigletsWeaned !== "" ? Number(form.pigletsWeaned) : null,
    weaningWeightPerPiglet: form.weaningWeightPerPiglet !== "" ? Number(form.weaningWeightPerPiglet) : null,
    totalWeaningWeight: form.totalWeaningWeight !== "" ? Number(form.totalWeaningWeight) : null,
    durationDays: form.lactationDurationDays !== "" ? Number(form.lactationDurationDays) : null,
    mortalityNotes: form.lactationMortality,
    adoptionsNotes: form.adoptionsNotes,
    sowBodyCondition: form.sowBodyCondition,
    postWeaningEstrusDate: form.postWeaningEstrusDate,
    idcDays: form.idcDays !== "" ? Number(form.idcDays) : null,
  },
  productivityIssues: {
    abortions: form.abortions,
    repeats: form.repeats,
    anestrus: form.anestrus,
  },
  notes: form.notes,
});

export default function SowReproductiveHistoryPage() {
  const { toast } = useToast();
  const [sows, setSows] = useState([]);
  const [selectedSowId, setSelectedSowId] = useState("");
  const [selectedSow, setSelectedSow] = useState(null);
  const [loadingSows, setLoadingSows] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [recordForm, setRecordForm] = useState(getEmptyRecordForm());
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [savingRecord, setSavingRecord] = useState(false);

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

  const expectedFarrowDate = useMemo(() => {
    if (!recordForm.serviceDate) return "";
    const date = new Date(recordForm.serviceDate);
    if (Number.isNaN(date.getTime())) return "";
    date.setDate(date.getDate() + 114);
    return date.toISOString().slice(0, 10);
  }, [recordForm.serviceDate]);

  const openCreateRecordDialog = () => {
    if (!selectedSow) return;
    const nextCycle = (selectedSow.reproductiveRecords?.[0]?.cycleNumber ?? 0) + 1;
    setRecordForm(getEmptyRecordForm(nextCycle));
    setEditingRecordId(null);
    setIsRecordDialogOpen(true);
  };

  const openEditRecordDialog = (record) => {
    setRecordForm(mapRecordToForm(record));
    setEditingRecordId(record.id);
    setIsRecordDialogOpen(true);
  };

  const handleSaveRecord = async () => {
    if (!selectedSow) return;
    const payload = buildRecordPayload(recordForm);

    try {
      setSavingRecord(true);
      if (editingRecordId) {
        await pigService.updateReproductiveRecord(selectedSow.id, editingRecordId, payload);
        toast({
          title: "Registro actualizado",
          description: "El historial reproductivo fue actualizado.",
        });
      } else {
        await pigService.addReproductiveRecord(selectedSow.id, payload);
        toast({
          title: "Registro agregado",
          description: "Se añadió un nuevo ciclo reproductivo.",
        });
      }

      setIsRecordDialogOpen(false);
      setEditingRecordId(null);
      setRecordForm(getEmptyRecordForm());
      await refreshSow(selectedSow.id);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.message || "No fue posible guardar el registro reproductivo.",
        variant: "destructive",
      });
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!selectedSow) return;
    try {
      await pigService.deleteReproductiveRecord(selectedSow.id, recordId);
      toast({
        title: "Registro eliminado",
        description: "El ciclo reproductivo fue eliminado del historial.",
      });
      await refreshSow(selectedSow.id);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.message || "No fue posible eliminar el registro.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-8 w-8 text-[#6b7c45]" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial Reproductivo</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona cada ciclo reproductivo con información cronológica del servicio, gestación, parto, lactancia y métricas productivas.
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
            Elige una cerda reproductora para gestionar su historial.
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

      {selectedSow && (
        <Card>
          <CardHeader className="flex flex-col gap-2 border-b border-gray-100 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Historial reproductivo</CardTitle>
              <CardDescription>
                Registra y consulta cada ciclo reproductivo con todos sus eventos asociados.
              </CardDescription>
            </div>
            <Button onClick={openCreateRecordDialog}>
              <Plus className="mr-2 h-4 w-4" /> Registrar ciclo
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {selectedSow.reproductiveRecords?.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead># Parto</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Tipo servicio</TableHead>
                      <TableHead>Verraco/dosis</TableHead>
                      <TableHead>F. parto probable</TableHead>
                      <TableHead>F. parto real</TableHead>
                      <TableHead>Nacidos (NV / NT)</TableHead>
                      <TableHead>Destetados</TableHead>
                      <TableHead>IDC</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSow.reproductiveRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.cycleNumber ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="font-medium text-gray-800">
                              {formatDate(record.service?.date)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {record.service?.inseminator ?? ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{record.service?.type || "-"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>{record.service?.boarId || "-"}</span>
                            <span className="text-xs text-gray-500">
                              {record.service?.semenDose || ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(record.expectedFarrowDate)}</TableCell>
                        <TableCell>{formatDate(record.farrowing?.date)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-medium text-gray-800">
                              {record.litter?.bornAlive ?? 0}
                            </span>{" "}
                            <span className="text-xs text-gray-500">
                              / {record.litter?.totalBorn ?? 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{record.lactation?.pigletsWeaned ?? 0}</TableCell>
                        <TableCell>{record.lactation?.idcDays ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditRecordDialog(record)}
                            >
                              <ClipboardList className="mr-2 h-4 w-4" /> Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteRecord(record.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
                <Calendar className="mb-3 h-6 w-6" />
                No hay ciclos registrados todavía.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingRecordId ? "Actualizar ciclo reproductivo" : "Registrar ciclo reproductivo"}
            </DialogTitle>
            <DialogDescription>
              Captura la información completa del servicio, parto, lactancia y métricas productivas.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              <strong>Servicio / Cubrición</strong>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="cycleNumber">Número de parto</Label>
                <Input
                  id="cycleNumber"
                  type="number"
                  value={recordForm.cycleNumber ?? ""}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, cycleNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="serviceDate">Fecha de servicio *</Label>
                <Input
                  id="serviceDate"
                  type="date"
                  value={recordForm.serviceDate}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, serviceDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="serviceType">Tipo de servicio</Label>
                <Select
                  value={recordForm.serviceType}
                  onValueChange={(value) => setRecordForm((prev) => ({ ...prev, serviceType: value }))}
                >
                  <SelectTrigger id="serviceType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="boarId">ID del verraco</Label>
                <Input
                  id="boarId"
                  value={recordForm.boarId}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, boarId: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="semenDose">Dosis de semen utilizada</Label>
                <Input
                  id="semenDose"
                  value={recordForm.semenDose}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, semenDose: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="inseminator">Inseminador (persona)</Label>
                <Input
                  id="inseminator"
                  value={recordForm.inseminator}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, inseminator: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="servicesCount">N° servicios en ese celo</Label>
                <Input
                  id="servicesCount"
                  type="number"
                  min={1}
                  max={3}
                  value={recordForm.servicesCount}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, servicesCount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="pregnancyCheckDate">Confirmación de preñez (fecha)</Label>
                <Input
                  id="pregnancyCheckDate"
                  type="date"
                  value={recordForm.pregnancyCheckDate}
                  onChange={(e) =>
                    setRecordForm((prev) => ({ ...prev, pregnancyCheckDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="pregnancyCheckMethod">Método (ultrasonido, etc.)</Label>
                <Input
                  id="pregnancyCheckMethod"
                  value={recordForm.pregnancyCheckMethod}
                  onChange={(e) =>
                    setRecordForm((prev) => ({ ...prev, pregnancyCheckMethod: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="pregnancyResult">Resultado</Label>
                <Select
                  value={recordForm.pregnancyResult}
                  onValueChange={(value) =>
                    setRecordForm((prev) => ({ ...prev, pregnancyResult: value }))
                  }
                >
                  <SelectTrigger id="pregnancyResult">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTIVITY_RESULTS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
              <strong>Datos del parto</strong>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Fecha probable de parto (114 días)</Label>
                <Input value={expectedFarrowDate} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label htmlFor="farrowingDate">Fecha real de parto</Label>
                <Input
                  id="farrowingDate"
                  type="date"
                  value={recordForm.farrowingDate}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, farrowingDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="deliveryType">Tipo de parto</Label>
                <Select
                  value={recordForm.deliveryType}
                  onValueChange={(value) => setRecordForm((prev) => ({ ...prev, deliveryType: value }))}
                >
                  <SelectTrigger id="deliveryType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="labourDurationHours">Duración del parto (horas)</Label>
                <Input
                  id="labourDurationHours"
                  type="number"
                  step="0.1"
                  value={recordForm.labourDurationHours}
                  onChange={(e) =>
                    setRecordForm((prev) => ({ ...prev, labourDurationHours: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="totalBorn">Lechones nacidos totales (NT)</Label>
                <Input
                  id="totalBorn"
                  type="number"
                  value={recordForm.totalBorn}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, totalBorn: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="bornAlive">Lechones nacidos vivos (NV)</Label>
                <Input
                  id="bornAlive"
                  type="number"
                  value={recordForm.bornAlive}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, bornAlive: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="stillborn">Nacidos muertos (NM)</Label>
                <Input
                  id="stillborn"
                  type="number"
                  value={recordForm.stillborn}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, stillborn: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="mummies">Momias (MO)</Label>
                <Input
                  id="mummies"
                  type="number"
                  value={recordForm.mummies}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, mummies: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="malformations">Malformaciones</Label>
                <Input
                  id="malformations"
                  value={recordForm.malformations}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, malformations: e.target.value }))}
                  placeholder="Especificar tipo"
                />
              </div>
              <div>
                <Label htmlFor="birthWeightTotal">Peso total al nacimiento (kg)</Label>
                <Input
                  id="birthWeightTotal"
                  type="number"
                  step="0.01"
                  value={recordForm.birthWeightTotal}
                  onChange={(e) =>
                    setRecordForm((prev) => ({ ...prev, birthWeightTotal: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="maleCount">Machos</Label>
                <Input
                  id="maleCount"
                  type="number"
                  value={recordForm.maleCount}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, maleCount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="femaleCount">Hembras</Label>
                <Input
                  id="femaleCount"
                  type="number"
                  value={recordForm.femaleCount}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, femaleCount: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            <div className="rounded-lg bg-purple-50 p-3 text-sm text-purple-900">
              <strong>Datos de lactancia</strong>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="lactationWeaningDate">Fecha de destete</Label>
                <Input
                  id="lactationWeaningDate"
                  type="date"
                  value={recordForm.lactationWeaningDate}
                  onChange={(e) =>
                    setRecordForm((prev) => ({ ...prev, lactationWeaningDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="pigletsWeaned">Lechones destetados</Label>
                <Input
                  id="pigletsWeaned"
                  type="number"
                  value={recordForm.pigletsWeaned}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, pigletsWeaned: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="weaningWeightPerPiglet">Peso destete por lechón (kg)</Label>
                <Input
                  id="weaningWeightPerPiglet"
                  type="number"
                  step="0.01"
                  value={recordForm.weaningWeightPerPiglet}
                  onChange={(e) =>
                    setRecordForm((prev) => ({ ...prev, weaningWeightPerPiglet: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="totalWeaningWeight">Peso destete total (kg)</Label>
                <Input
                  id="totalWeaningWeight"
                  type="number"
                  step="0.01"
                  value={recordForm.totalWeaningWeight}
                  onChange={(e) =>
                    setRecordForm((prev) => ({ ...prev, totalWeaningWeight: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="lactationDurationDays">Duración lactancia (días)</Label>
                <Input
                  id="lactationDurationDays"
                  type="number"
                  value={recordForm.lactationDurationDays}
                  onChange={(e) =>
                    setRecordForm((prev) => ({ ...prev, lactationDurationDays: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="lactationMortality">Mortalidad en lactancia</Label>
                <Input
                  id="lactationMortality"
                  value={recordForm.lactationMortality}
                  onChange={(e) =>
                    setRecordForm((prev) => ({ ...prev, lactationMortality: e.target.value }))
                  }
                  placeholder="N°, causas, fechas"
                />
              </div>
              <div>
                <Label htmlFor="adoptionsNotes">Adopciones / transferencias</Label>
                <Input
                  id="adoptionsNotes"
                  value={recordForm.adoptionsNotes}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, adoptionsNotes: e.target.value }))}
                  placeholder="Recibidos/cedidos"
                />
              </div>
              <div>
                <Label htmlFor="sowBodyCondition">Condición corporal al destete</Label>
                <Input
                  id="sowBodyCondition"
                  value={recordForm.sowBodyCondition}
                  onChange={(e) =>
                    setRecordForm((prev) => ({ ...prev, sowBodyCondition: e.target.value }))
                  }
                  placeholder="1-5"
                />
              </div>
              <div>
                <Label htmlFor="postWeaningEstrusDate">Fecha celo post-destete</Label>
                <Input
                  id="postWeaningEstrusDate"
                  type="date"
                  value={recordForm.postWeaningEstrusDate}
                  onChange={(e) =>
                    setRecordForm((prev) => ({ ...prev, postWeaningEstrusDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="idcDays">Intervalo destete-celo (IDC, días)</Label>
                <Input
                  id="idcDays"
                  type="number"
                  value={recordForm.idcDays}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, idcDays: e.target.value }))}
                  placeholder="Óptimo: 5-7 días"
                />
              </div>
            </div>

            <Separator />

            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-900">
              <strong>Causas de no productividad</strong>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="abortions">Abortos</Label>
                <Input
                  id="abortions"
                  value={recordForm.abortions}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, abortions: e.target.value }))}
                  placeholder="Fecha, etapa, causas"
                />
              </div>
              <div>
                <Label htmlFor="repeats">Repeticiones</Label>
                <Input
                  id="repeats"
                  value={recordForm.repeats}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, repeats: e.target.value }))}
                  placeholder="Celo sin concepción"
                />
              </div>
              <div>
                <Label htmlFor="anestrus">Anestros</Label>
                <Input
                  id="anestrus"
                  value={recordForm.anestrus}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, anestrus: e.target.value }))}
                  placeholder="Ausencia de celo >10 días"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="recordNotes">Observaciones generales del ciclo</Label>
              <textarea
                id="recordNotes"
                value={recordForm.notes}
                onChange={(e) => setRecordForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b7c45]"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRecord} disabled={savingRecord}>
              {savingRecord ? "Guardando..." : editingRecordId ? "Actualizar" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

