import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { abortionService, pregnancyService, pigService } from "@/services/api";
import { ArrowLeft, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

const FETUS_STATES = [
  { value: "fresco", label: "Fresco" },
  { value: "autolisis", label: "Autolisis" },
  { value: "momificado", label: "Momificado" },
  { value: "mixto", label: "Mixto" },
];

const ABORTION_CAUSES_DB = [
  { value: "infecciosa", label: "Infecciosa" },
  { value: "nutricional", label: "Nutricional" },
  { value: "toxica", label: "Tóxica" },
  { value: "traumatica", label: "Traumática" },
  { value: "termica", label: "Térmica" },
  { value: "genetica", label: "Genética" },
  { value: "hormonal", label: "Hormonal" },
  { value: "desconocida", label: "Desconocida" },
];

const RECOVERY_STATUS = [
  { value: "completa", label: "Completa" },
  { value: "parcial", label: "Parcial" },
  { value: "descarte recomendado", label: "Descarte recomendado" },
];

export default function AbortionRegistration() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  
  const isEditMode = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [pregnancies, setPregnancies] = useState([]);
  const [selectedPregnancy, setSelectedPregnancy] = useState(null);
  const [selectedSow, setSelectedSow] = useState(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    pregnancy_id: "",
    abortion_date: "",
    gestation_days: "",
    fetuses_expelled: "",
    fetus_condition: "",
    symptoms: "",
    fever: false,
    vaginal_discharge: false,
    anorexia: false,
    probable_cause: "desconocida",
    specific_cause: "",
    laboratory_test: false,
    test_results: "",
    treatment_applied: "",
    isolation_required: false,
    return_to_service_date: "",
    recovery_status: "",
    notes: ""
  });

  const [errors, setErrors] = useState({});

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
    if (id) {
      loadAbortionData(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoadingData(true);
      const pregnanciesData = await pregnancyService.getAllPregnancies({ status: 'en curso' });
      const activePregnancies = Array.isArray(pregnanciesData) ? pregnanciesData : [];
      setPregnancies(activePregnancies);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos necesarios",
        variant: "destructive"
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadAbortionData = async (abortionId) => {
    try {
      setIsLoadingData(true);
      const abortion = await abortionService.getAbortionById(abortionId);
      
      // Cargar datos en el formulario
      setFormData({
        pregnancy_id: abortion.pregnancy_id?.toString() || "",
        abortion_date: abortion.abortion_date?.split('T')[0] || "",
        gestation_days: abortion.gestation_days?.toString() || "",
        fetuses_expelled: abortion.fetuses_expelled?.toString() || "",
        fetus_condition: abortion.fetus_condition || "",
        symptoms: abortion.symptoms || "",
        fever: abortion.fever || false,
        vaginal_discharge: abortion.vaginal_discharge || false,
        anorexia: abortion.anorexia || false,
        probable_cause: abortion.probable_cause || "desconocida",
        specific_cause: abortion.specific_cause || "",
        laboratory_test: abortion.laboratory_test || false,
        test_results: abortion.test_results || "",
        treatment_applied: abortion.treatment_applied || "",
        isolation_required: abortion.isolation_required || false,
        return_to_service_date: abortion.return_to_service_date?.split('T')[0] || "",
        recovery_status: abortion.recovery_status || "",
        notes: abortion.notes || ""
      });

      // Cargar información de la gestación
      if (abortion.pregnancy_id) {
        const pregnancy = await pregnancyService.getPregnancyById(abortion.pregnancy_id);
        setSelectedPregnancy(pregnancy);
        
        // Cargar información de la cerda
        if (pregnancy.sow_id) {
          const sow = await pigService.getSowById(pregnancy.sow_id);
          setSelectedSow(sow);
        }
      }
    } catch (error) {
      console.error("Error cargando datos del aborto:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del aborto",
        variant: "destructive"
      });
      navigate("/abortions");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Manejar cambios en los inputs
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }

    // Si se selecciona una gestación, cargar datos relacionados
    if (field === 'pregnancy_id' && value) {
      const pregnancy = pregnancies.find(p => p.id === parseInt(value));
      if (pregnancy) {
        setSelectedPregnancy(pregnancy);
        
        // Cargar información de la cerda
        if (pregnancy.sow_id) {
          pigService.getSowById(pregnancy.sow_id)
            .then(sow => setSelectedSow(sow))
            .catch(err => console.error("Error cargando cerda:", err));
        }
        
        // Calcular días de gestación si ya hay fecha de aborto
        if (formData.abortion_date) {
          const conceptionDate = new Date(pregnancy.conception_date);
          const abortionDate = new Date(formData.abortion_date);
          const daysDiff = Math.floor((abortionDate - conceptionDate) / (1000 * 60 * 60 * 24));
          if (daysDiff > 0 && daysDiff < 114) {
            setFormData(prev => ({
              ...prev,
              gestation_days: daysDiff.toString()
            }));
          }
        }
      }
    }

    // Calcular días de gestación si cambia la fecha de aborto
    if (field === 'abortion_date' && selectedPregnancy?.conception_date) {
      const abortionDate = new Date(value);
      const conceptionDate = new Date(selectedPregnancy.conception_date);
      const daysDiff = Math.floor((abortionDate - conceptionDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 0 && daysDiff < 114) {
        setFormData(prev => ({
          ...prev,
          gestation_days: daysDiff.toString()
        }));
      }
    }
  };

  // Manejar cambios en checkboxes
  const handleCheckboxChange = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    // Campos obligatorios
    if (!formData.pregnancy_id) newErrors.pregnancy_id = "Seleccione una gestación";
    if (!formData.abortion_date) newErrors.abortion_date = "La fecha del aborto es obligatoria";
    if (!formData.gestation_days) newErrors.gestation_days = "Los días de gestación son obligatorios";

    // Validar días de gestación (1-113)
    const gestationDays = parseInt(formData.gestation_days);
    if (gestationDays && (gestationDays <= 0 || gestationDays >= 114)) {
      newErrors.gestation_days = "Los días de gestación deben estar entre 1 y 113";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Errores en el formulario",
        description: "Por favor corrija los errores antes de continuar",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Obtener sow_id de la gestación seleccionada
      const pregnancy = pregnancies.find(p => p.id === parseInt(formData.pregnancy_id));
      if (!pregnancy) {
        toast({
          title: "Error",
          description: "No se encontró la gestación seleccionada",
          variant: "destructive"
        });
        return;
      }
      
      // Preparar datos para enviar
      const dataToSend = {
        sow_id: pregnancy.sow_id,
        pregnancy_id: parseInt(formData.pregnancy_id),
        abortion_date: formData.abortion_date,
        gestation_days: parseInt(formData.gestation_days),
        fetuses_expelled: formData.fetuses_expelled ? parseInt(formData.fetuses_expelled) : 0,
        fetus_condition: formData.fetus_condition || null,
        symptoms: formData.symptoms || null,
        fever: formData.fever || false,
        vaginal_discharge: formData.vaginal_discharge || false,
        anorexia: formData.anorexia || false,
        probable_cause: formData.probable_cause || "desconocida",
        specific_cause: formData.specific_cause || null,
        laboratory_test: formData.laboratory_test || false,
        test_results: formData.test_results || null,
        treatment_applied: formData.treatment_applied || null,
        isolation_required: formData.isolation_required || false,
        return_to_service_date: formData.return_to_service_date || null,
        recovery_status: formData.recovery_status || null,
        notes: formData.notes || null
      };

      // Limpiar campos vacíos
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === "" || dataToSend[key] === undefined) {
          dataToSend[key] = null;
        }
      });

      if (isEditMode) {
        await abortionService.updateAbortion(id, dataToSend);
        toast({
          title: "¡Éxito!",
          description: "Aborto actualizado correctamente",
          className: "bg-green-50 border-green-200"
        });
      } else {
        await abortionService.createAbortion(dataToSend);
        toast({
          title: "¡Éxito!",
          description: "Aborto registrado correctamente",
          className: "bg-green-50 border-green-200"
        });
      }

      // Navegar a la lista de abortos
      navigate("/abortions");
    } catch (error) {
      console.error("Error al registrar aborto:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo registrar el aborto",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      {isLoadingData ? (
        <div className="flex justify-center items-center h-96">
          <p className="text-lg">Cargando datos...</p>
        </div>
      ) : (
        <div className="pb-6">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/abortions")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la lista
            </Button>
            
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-3xl font-bold">
                  {isEditMode ? "Editar Aborto" : "Registrar Aborto"}
                </h1>
                <p className="text-muted-foreground">
                  {isEditMode ? "Modifique los datos del aborto" : "Complete los datos del evento de aborto"}
                </p>
              </div>
            </div>
          </div>

          {/* Alerta informativa sobre el flujo del módulo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Flujo del módulo de abortos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Seleccione una <strong>gestación activa</strong> (automáticamente cargará la cerda)</li>
                  <li>Los <strong>días de gestación</strong> se calculan automáticamente según la fecha de concepción</li>
                  <li>Registre los <strong>síntomas previos</strong> observados en la cerda</li>
                  <li>Especifique la <strong>causa probable</strong> y <strong>causa específica</strong> si es conocida</li>
                  <li>Documente las <strong>acciones correctivas</strong> y el <strong>seguimiento posterior</strong></li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Sección 1: Identificación */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Identificación del Aborto</CardTitle>
                <CardDescription>Gestación y cerda asociados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gestación */}
                  <div className="space-y-2">
                    <Label htmlFor="pregnancy_id">
                      Gestación <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.pregnancy_id}
                      onValueChange={(value) => handleInputChange("pregnancy_id", value)}
                      disabled={pregnancies.length === 0 || isEditMode}
                    >
                      <SelectTrigger className={errors.pregnancy_id ? "border-red-500" : ""}>
                        <SelectValue placeholder={pregnancies.length === 0 ? "No hay gestaciones activas" : "Seleccione una gestación"} />
                      </SelectTrigger>
                      <SelectContent>
                        {pregnancies.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No hay gestaciones activas disponibles
                          </div>
                        ) : (
                          pregnancies.map(preg => (
                            <SelectItem key={preg.id} value={preg.id.toString()}>
                              Cerda: {preg.sow_ear_tag || preg.sow_id} - Concepción: {new Date(preg.conception_date).toLocaleDateString()}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.pregnancy_id && <p className="text-sm text-red-500">{errors.pregnancy_id}</p>}
                    {selectedPregnancy && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Concepción: {new Date(selectedPregnancy.conception_date).toLocaleDateString()}</p>
                        <p>Parto esperado: {new Date(selectedPregnancy.expected_farrowing_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedSow && (
                      <p className="text-sm text-muted-foreground">
                        Cerda: {selectedSow.ear_tag || selectedSow.pigId} {selectedSow.alias ? `- ${selectedSow.alias}` : ''}
                      </p>
                    )}
                  </div>

                  {/* Fecha del aborto */}
                  <div className="space-y-2">
                    <Label htmlFor="abortion_date">
                      Fecha del Aborto <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="abortion_date"
                      type="date"
                      value={formData.abortion_date}
                      onChange={(e) => handleInputChange("abortion_date", e.target.value)}
                      className={errors.abortion_date ? "border-red-500" : ""}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.abortion_date && <p className="text-sm text-red-500">{errors.abortion_date}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 2: Datos del Aborto */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Datos del Aborto</CardTitle>
                <CardDescription>Información sobre el aborto y los fetos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Días de gestación (calculado) */}
                  <div className="space-y-2">
                    <Label htmlFor="gestation_days">
                      Días de Gestación <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="gestation_days"
                      type="number"
                      min="1"
                      max="113"
                      value={formData.gestation_days}
                      onChange={(e) => handleInputChange("gestation_days", e.target.value)}
                      className={errors.gestation_days ? "border-red-500" : ""}
                      placeholder="1-113"
                    />
                    {errors.gestation_days && <p className="text-sm text-red-500">{errors.gestation_days}</p>}
                    {!errors.gestation_days && selectedPregnancy && (
                      <p className="text-sm text-muted-foreground">
                        Se calcula automáticamente desde la fecha de concepción
                      </p>
                    )}
                  </div>

                  {/* Número de fetos expulsados */}
                  <div className="space-y-2">
                    <Label htmlFor="fetuses_expelled">Número de Fetos Expulsados</Label>
                    <Input
                      id="fetuses_expelled"
                      type="number"
                      min="0"
                      value={formData.fetuses_expelled}
                      onChange={(e) => handleInputChange("fetuses_expelled", e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  {/* Estado de los fetos */}
                  <div className="space-y-2">
                    <Label htmlFor="fetus_condition">Estado de los Fetos</Label>
                    <Select
                      value={formData.fetus_condition}
                      onValueChange={(value) => handleInputChange("fetus_condition", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FETUS_STATES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 3: Síntomas Previos */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Síntomas Previos de la Cerda</CardTitle>
                <CardDescription>Síntomas observados antes del aborto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="symptoms">Síntomas Observados</Label>
                    <Textarea
                      id="symptoms"
                      value={formData.symptoms}
                      onChange={(e) => handleInputChange("symptoms", e.target.value)}
                      placeholder="Describe los síntomas observados antes del aborto (comportamiento, apetito, temperatura, etc.)"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="fever"
                        checked={formData.fever}
                        onChange={() => handleCheckboxChange("fever")}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="fever" className="cursor-pointer">
                        Fiebre
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="vaginal_discharge"
                        checked={formData.vaginal_discharge}
                        onChange={() => handleCheckboxChange("vaginal_discharge")}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="vaginal_discharge" className="cursor-pointer">
                        Descarga Vaginal
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="anorexia"
                        checked={formData.anorexia}
                        onChange={() => handleCheckboxChange("anorexia")}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="anorexia" className="cursor-pointer">
                        Anorexia
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 4: Causa Probable */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Causa Probable del Aborto</CardTitle>
                <CardDescription>Diagnóstico y causa identificada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="probable_cause">Causa Probable</Label>
                      <Select
                        value={formData.probable_cause}
                        onValueChange={(value) => handleInputChange("probable_cause", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione la causa probable..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ABORTION_CAUSES_DB.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specific_cause">Causa Específica</Label>
                      <Input
                        id="specific_cause"
                        value={formData.specific_cause}
                        onChange={(e) => handleInputChange("specific_cause", e.target.value)}
                        placeholder="Ej: PRRS, Parvovirus, Leptospira, micotoxinas, etc."
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="laboratory_test"
                      checked={formData.laboratory_test}
                      onChange={() => handleCheckboxChange("laboratory_test")}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="laboratory_test" className="cursor-pointer">
                      Se realizó prueba de laboratorio
                    </Label>
                  </div>
                  
                  {formData.laboratory_test && (
                    <div className="space-y-2">
                      <Label htmlFor="test_results">Resultados de Laboratorio</Label>
                      <Textarea
                        id="test_results"
                        value={formData.test_results}
                        onChange={(e) => handleInputChange("test_results", e.target.value)}
                        placeholder="Describe los resultados de las pruebas de laboratorio realizadas"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sección 5: Acciones Correctivas */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Acciones Correctivas Tomadas</CardTitle>
                <CardDescription>Tratamientos y medidas aplicadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="treatment_applied">Acciones Correctivas</Label>
                    <Textarea
                      id="treatment_applied"
                      value={formData.treatment_applied}
                      onChange={(e) => handleInputChange("treatment_applied", e.target.value)}
                      placeholder="Tratamientos aplicados, vacunas, cambios en manejo, medidas preventivas, etc."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isolation_required"
                      checked={formData.isolation_required}
                      onChange={() => handleCheckboxChange("isolation_required")}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isolation_required" className="cursor-pointer">
                      Se requiere aislamiento
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 6: Seguimiento Posterior */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Seguimiento Posterior de la Cerda</CardTitle>
                <CardDescription>Estado de recuperación y retorno a servicio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="return_to_service_date">Fecha de Retorno a Servicio</Label>
                    <Input
                      id="return_to_service_date"
                      type="date"
                      value={formData.return_to_service_date}
                      onChange={(e) => handleInputChange("return_to_service_date", e.target.value)}
                      min={formData.abortion_date || undefined}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recovery_status">Estado de Recuperación</Label>
                    <Select
                      value={formData.recovery_status}
                      onValueChange={(value) => handleInputChange("recovery_status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el estado..." />
                      </SelectTrigger>
                      <SelectContent>
                        {RECOVERY_STATUS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 7: Observaciones */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Observaciones Adicionales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">Seguimiento Posterior</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Observaciones sobre el estado posterior de la cerda, próximos pasos, recomendaciones, etc."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/abortions")}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  isEditMode ? "Actualizando..." : "Registrando..."
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {isEditMode ? "Actualizar Aborto" : "Registrar Aborto"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

