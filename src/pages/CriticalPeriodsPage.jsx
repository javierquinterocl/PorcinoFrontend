import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { pigService, reproductiveDataService } from "@/services/api";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Plus,
  RefreshCw,
  Trash2,
  Thermometer,
  Droplet,
  Baby,
} from "lucide-react";
import { cn } from "@/lib/utils";

const HEAT_INTENSITY = [
  { value: "DEBIL", label: "Débil" },
  { value: "MEDIO", label: "Medio" },
  { value: "FUERTE", label: "Fuerte" },
];

const DETECTION_METHODS = [
  { value: "MACHO_DETECTOR", label: "Macho detector" },
  { value: "PRUEBA_INMOVILIDAD", label: "Prueba de inmovilidad" },
  { value: "OTRO", label: "Otro" },
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

export default function CriticalPeriodsPage() {
  const { toast } = useToast();
  const [sows, setSows] = useState([]);
  const [selectedSowId, setSelectedSowId] = useState("");
  const [selectedSow, setSelectedSow] = useState(null);
  const [loadingSows, setLoadingSows] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("heat");

  // Heat Detection
  const [isHeatDialogOpen, setIsHeatDialogOpen] = useState(false);
  const [heatForm, setHeatForm] = useState({
    date: "",
    durationHours: "",
    intensity: "MEDIO",
    detectionMethod: "MACHO_DETECTOR",
    observations: "",
  });

  // Gestation Monitoring
  const [isGestationDialogOpen, setIsGestationDialogOpen] = useState(false);
  const [gestationForm, setGestationForm] = useState({
    date: "",
    bodyCondition: "",
    observations: "",
    vaccines: "",
    treatments: "",
  });

  // Farrowing Details
  const [isFarrowingDialogOpen, setIsFarrowingDialogOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [farrowingForm, setFarrowingForm] = useState({
    startTime: "",
    endTime: "",
    birthIntervalMinutes: "",
    assistanceRequired: false,
    assistanceType: "",
    postPartumTemperature: "",
    medications: "",
  });


  const loadSows = useCallback(async () => {
    try {
      setLoadingSows(true);
      const response = await pigService.getAllPigs();
      const reproductoras = response.filter(
        (pig) => pig.gender === "FEMALE" && pig.pigType === "REPRODUCTORA"
      );
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

  const handleHeatSubmit = async () => {
    if (!selectedSow || !heatForm.date) {
      toast({
        title: "Campos obligatorios",
        description: "La fecha es obligatoria.",
        variant: "destructive",
      });
      return;
    }

    try {
      await reproductiveDataService.addHeatDetection(selectedSow.id, heatForm);
      toast({
        title: "Registro guardado",
        description: "Detección de celo registrada correctamente.",
      });
      setIsHeatDialogOpen(false);
      setHeatForm({
        date: "",
        durationHours: "",
        intensity: "MEDIO",
        detectionMethod: "MACHO_DETECTOR",
        observations: "",
      });
      await refreshSow(selectedSow.id);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.message || "No fue posible guardar el registro.",
        variant: "destructive",
      });
    }
  };

  const handleGestationSubmit = async () => {
    if (!selectedSow || !gestationForm.date) {
      toast({
        title: "Campos obligatorios",
        description: "La fecha es obligatoria.",
        variant: "destructive",
      });
      return;
    }

    try {
      await reproductiveDataService.addGestationMonitoring(selectedSow.id, gestationForm);
      toast({
        title: "Registro guardado",
        description: "Monitoreo de gestación registrado correctamente.",
      });
      setIsGestationDialogOpen(false);
      setGestationForm({
        date: "",
        bodyCondition: "",
        observations: "",
        vaccines: "",
        treatments: "",
      });
      await refreshSow(selectedSow.id);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.message || "No fue posible guardar el registro.",
        variant: "destructive",
      });
    }
  };

  const handleFarrowingSubmit = async () => {
    if (!selectedSow || !selectedRecordId) {
      toast({
        title: "Error",
        description: "Selecciona un ciclo reproductivo primero.",
        variant: "destructive",
      });
      return;
    }

    try {
      await reproductiveDataService.addFarrowingDetails(selectedSow.id, selectedRecordId, farrowingForm);
      toast({
        title: "Registro guardado",
        description: "Detalles del parto registrados correctamente.",
      });
      setIsFarrowingDialogOpen(false);
      setFarrowingForm({
        startTime: "",
        endTime: "",
        birthIntervalMinutes: "",
        assistanceRequired: false,
        assistanceType: "",
        postPartumTemperature: "",
        medications: "",
      });
      setSelectedRecordId(null);
      await refreshSow(selectedSow.id);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.message || "No fue posible guardar el registro.",
        variant: "destructive",
      });
    }
  };


  const orderedSows = [...sows].sort((a, b) => a.pigId.localeCompare(b.pigId, "es"));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-8 w-8 text-[#6b7c45]" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Períodos Críticos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Registra detección de celo, monitoreo de gestación y detalles del parto.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-100">
          <CardTitle>Seleccionar cerda</CardTitle>
          <CardDescription>
            Elige una cerda reproductora para gestionar sus períodos críticos.
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
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Registro de Períodos Críticos</CardTitle>
                <CardDescription>
                  Registra detección de celo, monitoreo de gestación y detalles del parto.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshSow(selectedSow.id)}
                disabled={loadingDetails}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", loadingDetails && "animate-spin")} />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-2 border-b border-gray-200 pb-2">
                <Button
                  variant={activeTab === "heat" ? "default" : "ghost"}
                  onClick={() => setActiveTab("heat")}
                  size="sm"
                  className={cn(
                    activeTab === "heat" && "bg-[#6b7c45] text-white hover:bg-[#5a6b35]"
                  )}
                >
                  <Droplet className="h-4 w-4 mr-2" />
                  Detección Celo
                </Button>
                <Button
                  variant={activeTab === "gestation" ? "default" : "ghost"}
                  onClick={() => setActiveTab("gestation")}
                  size="sm"
                  className={cn(
                    activeTab === "gestation" && "bg-[#6b7c45] text-white hover:bg-[#5a6b35]"
                  )}
                >
                  <Baby className="h-4 w-4 mr-2" />
                  Gestación
                </Button>
                <Button
                  variant={activeTab === "farrowing" ? "default" : "ghost"}
                  onClick={() => setActiveTab("farrowing")}
                  size="sm"
                  className={cn(
                    activeTab === "farrowing" && "bg-[#6b7c45] text-white hover:bg-[#5a6b35]"
                  )}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Parto
                </Button>
              </div>

              {activeTab === "heat" && (
                <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setIsHeatDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Registrar detección de celo
                  </Button>
                </div>
                {selectedSow.criticalPeriods?.heatDetections?.length ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Duración (horas)</TableHead>
                          <TableHead>Intensidad</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Observaciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSow.criticalPeriods.heatDetections.map((detection) => (
                          <TableRow key={detection.id}>
                            <TableCell>{formatDate(detection.date)}</TableCell>
                            <TableCell>{detection.durationHours || "-"}</TableCell>
                            <TableCell>{HEAT_INTENSITY.find(h => h.value === detection.intensity)?.label || detection.intensity}</TableCell>
                            <TableCell>{DETECTION_METHODS.find(m => m.value === detection.detectionMethod)?.label || detection.detectionMethod}</TableCell>
                            <TableCell>{detection.observations || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
                    <Calendar className="mb-3 h-6 w-6" />
                    No hay registros de detección de celo.
                  </div>
                )}
                </div>
              )}

              {activeTab === "gestation" && (
                <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setIsGestationDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Registrar monitoreo
                  </Button>
                </div>
                {selectedSow.criticalPeriods?.gestationMonitoring?.length ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Condición corporal</TableHead>
                          <TableHead>Vacunas</TableHead>
                          <TableHead>Tratamientos</TableHead>
                          <TableHead>Observaciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSow.criticalPeriods.gestationMonitoring.map((monitoring) => (
                          <TableRow key={monitoring.id}>
                            <TableCell>{formatDate(monitoring.date)}</TableCell>
                            <TableCell>{monitoring.bodyCondition || "-"}</TableCell>
                            <TableCell>{monitoring.vaccines || "-"}</TableCell>
                            <TableCell>{monitoring.treatments || "-"}</TableCell>
                            <TableCell>{monitoring.observations || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
                    <Calendar className="mb-3 h-6 w-6" />
                    No hay registros de monitoreo de gestación.
                  </div>
                )}
                </div>
              )}

              {activeTab === "farrowing" && (
                <div className="space-y-4">
                <div className="flex justify-end">
                  <Select
                    value={selectedRecordId || "none"}
                    onValueChange={(value) => {
                      if (value !== "none") {
                        setSelectedRecordId(value);
                        setIsFarrowingDialogOpen(true);
                      }
                    }}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Selecciona un ciclo para agregar detalles del parto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecciona un ciclo...</SelectItem>
                      {selectedSow.reproductiveRecords?.filter(r => r.farrowing?.date).map((record) => (
                        <SelectItem key={record.id} value={record.id}>
                          Ciclo {record.cycleNumber} - {formatDate(record.farrowing.date)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedSow.reproductiveRecords?.filter(r => r.farrowing?.date && r.farrowing.startTime).length ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ciclo</TableHead>
                          <TableHead>Hora inicio</TableHead>
                          <TableHead>Hora fin</TableHead>
                          <TableHead>Intervalo (min)</TableHead>
                          <TableHead>Asistencia</TableHead>
                          <TableHead>Temperatura (°C)</TableHead>
                          <TableHead>Medicamentos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSow.reproductiveRecords
                          .filter(r => r.farrowing?.date && r.farrowing.startTime)
                          .map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>{record.cycleNumber}</TableCell>
                              <TableCell>{record.farrowing.startTime || "-"}</TableCell>
                              <TableCell>{record.farrowing.endTime || "-"}</TableCell>
                              <TableCell>{record.farrowing.birthIntervalMinutes || "-"}</TableCell>
                              <TableCell>
                                {record.farrowing.assistanceRequired
                                  ? record.farrowing.assistanceType || "Sí"
                                  : "No"}
                              </TableCell>
                              <TableCell>
                                {record.farrowing.postPartumTemperature
                                  ? `${record.farrowing.postPartumTemperature}°C`
                                  : "-"}
                              </TableCell>
                              <TableCell>{record.farrowing.medications || "-"}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
                    <Calendar className="mb-3 h-6 w-6" />
                    No hay detalles de parto registrados.                     Selecciona un ciclo arriba para agregar detalles.
                  </div>
                )}
                </div>
              )}

            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <Dialog open={isHeatDialogOpen} onOpenChange={setIsHeatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar detección de celo</DialogTitle>
            <DialogDescription>Registra información sobre el celo detectado.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="heat-date">Fecha *</Label>
              <Input
                id="heat-date"
                type="date"
                value={heatForm.date}
                onChange={(e) => setHeatForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="heat-duration">Duración (horas)</Label>
              <Input
                id="heat-duration"
                type="number"
                value={heatForm.durationHours}
                onChange={(e) => setHeatForm((prev) => ({ ...prev, durationHours: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="heat-intensity">Intensidad</Label>
              <Select
                value={heatForm.intensity}
                onValueChange={(value) => setHeatForm((prev) => ({ ...prev, intensity: value }))}
              >
                <SelectTrigger id="heat-intensity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEAT_INTENSITY.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="heat-method">Método de detección</Label>
              <Select
                value={heatForm.detectionMethod}
                onValueChange={(value) => setHeatForm((prev) => ({ ...prev, detectionMethod: value }))}
              >
                <SelectTrigger id="heat-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DETECTION_METHODS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="heat-observations">Observaciones</Label>
              <textarea
                id="heat-observations"
                value={heatForm.observations}
                onChange={(e) => setHeatForm((prev) => ({ ...prev, observations: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b7c45]"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHeatDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleHeatSubmit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isGestationDialogOpen} onOpenChange={setIsGestationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar monitoreo de gestación</DialogTitle>
            <DialogDescription>Seguimiento semanal/quincenal de la gestación.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="gest-date">Fecha *</Label>
              <Input
                id="gest-date"
                type="date"
                value={gestationForm.date}
                onChange={(e) => setGestationForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gest-condition">Condición corporal</Label>
              <Input
                id="gest-condition"
                value={gestationForm.bodyCondition}
                onChange={(e) => setGestationForm((prev) => ({ ...prev, bodyCondition: e.target.value }))}
                placeholder="Ej: 3.0, 3.5"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gest-vaccines">Vacunas aplicadas</Label>
              <Input
                id="gest-vaccines"
                value={gestationForm.vaccines}
                onChange={(e) => setGestationForm((prev) => ({ ...prev, vaccines: e.target.value }))}
                placeholder="Tipo y fecha de vacunas"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gest-treatments">Tratamientos</Label>
              <Input
                id="gest-treatments"
                value={gestationForm.treatments}
                onChange={(e) => setGestationForm((prev) => ({ ...prev, treatments: e.target.value }))}
                placeholder="Medicamentos o tratamientos aplicados"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gest-observations">Observaciones</Label>
              <textarea
                id="gest-observations"
                value={gestationForm.observations}
                onChange={(e) => setGestationForm((prev) => ({ ...prev, observations: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b7c45]"
                rows={3}
                placeholder="Estado general, comportamiento, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGestationDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGestationSubmit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFarrowingDialogOpen} onOpenChange={setIsFarrowingDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles del parto</DialogTitle>
            <DialogDescription>Registra información detallada del parto.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="farrow-start">Hora de inicio</Label>
                <Input
                  id="farrow-start"
                  type="time"
                  value={farrowingForm.startTime}
                  onChange={(e) => setFarrowingForm((prev) => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="farrow-end">Hora de finalización</Label>
                <Input
                  id="farrow-end"
                  type="time"
                  value={farrowingForm.endTime}
                  onChange={(e) => setFarrowingForm((prev) => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="farrow-interval">Intervalo entre nacimientos (minutos)</Label>
              <Input
                id="farrow-interval"
                type="number"
                value={farrowingForm.birthIntervalMinutes}
                onChange={(e) => setFarrowingForm((prev) => ({ ...prev, birthIntervalMinutes: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="farrow-assistance">¿Se requirió asistencia?</Label>
              <Select
                value={farrowingForm.assistanceRequired ? "true" : "false"}
                onValueChange={(value) => setFarrowingForm((prev) => ({ ...prev, assistanceRequired: value === "true" }))}
              >
                <SelectTrigger id="farrow-assistance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Sí</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {farrowingForm.assistanceRequired && (
              <div className="grid gap-2">
                <Label htmlFor="farrow-assistance-type">Tipo de asistencia</Label>
                <Input
                  id="farrow-assistance-type"
                  value={farrowingForm.assistanceType}
                  onChange={(e) => setFarrowingForm((prev) => ({ ...prev, assistanceType: e.target.value }))}
                  placeholder="Ej: Extracción manual, cesárea"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="farrow-temp">Temperatura post-parto (°C)</Label>
              <Input
                id="farrow-temp"
                type="number"
                step="0.1"
                value={farrowingForm.postPartumTemperature}
                onChange={(e) => setFarrowingForm((prev) => ({ ...prev, postPartumTemperature: e.target.value }))}
                placeholder="Ej: 39.5"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="farrow-medications">Medicamentos aplicados</Label>
              <Input
                id="farrow-medications"
                value={farrowingForm.medications}
                onChange={(e) => setFarrowingForm((prev) => ({ ...prev, medications: e.target.value }))}
                placeholder="Ej: Oxitocina 10 UI"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFarrowingDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFarrowingSubmit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

