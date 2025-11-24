import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { birthService, pregnancyService, pigService } from "@/services/api";
import { ArrowLeft, Baby, CheckCircle2, AlertTriangle } from "lucide-react";

export default function BirthRegistration() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  
  const isEditMode = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [pregnancies, setPregnancies] = useState([]);
  const [sows, setSows] = useState([]);
  const [boars, setBoars] = useState([]);
  const [selectedPregnancy, setSelectedPregnancy] = useState(null);
  const [selectedSow, setSelectedSow] = useState(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    // IDs y referencias obligatorias
    sow_id: "",
    pregnancy_id: "",
    boar_id: "",
    
    // Datos del parto (obligatorios)
    birth_date: "",
    gestation_days: "",
    total_born: "",
    born_alive: "",
    born_dead: "",
    
    // Datos del parto (opcionales)
    birth_start_time: "",
    birth_end_time: "",
    birth_type: "normal",
    assistance_required: false,
    veterinarian_name: "",
    
    // Estadísticas de la camada (opcionales)
    mummified: 0,
    malformed: 0,
    total_litter_weight: "",
    avg_piglet_weight: "",
    
    // Estado de la cerda post-parto
    sow_condition: "",
    sow_temperature: "",
    
    // Tratamientos
    oxytocin_applied: false,
    antibiotics_applied: false,
    treatment_notes: "",
    
    // Lactancia
    lactation_start_date: "",
    expected_weaning_date: "",
    
    // Observaciones
    notes: ""
  });

  const [errors, setErrors] = useState({});

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
    if (id) {
      loadBirthData(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      const [pregnanciesData, sowsData, boarsData] = await Promise.all([
        pregnancyService.getAllPregnancies({ status: 'en curso' }),
        pigService.getAllSows(),
        pigService.getAllBoars()
      ]);
      
      const activePregnancies = Array.isArray(pregnanciesData) ? pregnanciesData : [];
      const activeSows = sowsData.filter(s => s.status === 'activa');
      const activeBoars = boarsData.filter(b => b.status === 'activo');
      
      setPregnancies(activePregnancies);
      setSows(activeSows);
      setBoars(activeBoars);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos necesarios",
        variant: "destructive"
      });
    }
  };

  const loadBirthData = async (birthId) => {
    try {
      setIsLoadingData(true);
      const birth = await birthService.getBirthById(birthId);
      
      // Cargar datos en el formulario
      setFormData({
        sow_id: birth.sow_id?.toString() || "",
        pregnancy_id: birth.pregnancy_id?.toString() || "",
        boar_id: birth.boar_id?.toString() || "",
        birth_date: birth.birth_date?.split('T')[0] || "",
        birth_start_time: birth.birth_start_time?.substring(0, 5) || "",
        birth_end_time: birth.birth_end_time?.substring(0, 5) || "",
        gestation_days: birth.gestation_days?.toString() || "",
        birth_type: birth.birth_type || "normal",
        assistance_required: birth.assistance_required || false,
        veterinarian_name: birth.veterinarian_name || "",
        total_born: birth.total_born?.toString() || "",
        born_alive: birth.born_alive?.toString() || "",
        born_dead: birth.born_dead?.toString() || "",
        mummified: birth.mummified || 0,
        malformed: birth.malformed || 0,
        total_litter_weight: birth.total_litter_weight?.toString() || "",
        avg_piglet_weight: birth.avg_piglet_weight?.toString() || "",
        sow_condition: birth.sow_condition || "",
        sow_temperature: birth.sow_temperature?.toString() || "",
        oxytocin_applied: birth.oxytocin_applied || false,
        antibiotics_applied: birth.antibiotics_applied || false,
        treatment_notes: birth.treatment_notes || "",
        lactation_start_date: birth.lactation_start_date?.split('T')[0] || "",
        expected_weaning_date: birth.expected_weaning_date?.split('T')[0] || "",
        notes: birth.notes || ""
      });

      // Cargar información de la gestación
      if (birth.pregnancy_id) {
        const pregnancy = await pregnancyService.getPregnancyById(birth.pregnancy_id);
        setSelectedPregnancy(pregnancy);
      }

      // Cargar información de la cerda
      if (birth.sow_id) {
        const sow = await pigService.getSowById(birth.sow_id);
        setSelectedSow(sow);
      }
    } catch (error) {
      console.error("Error cargando datos del parto:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del parto",
        variant: "destructive"
      });
      navigate("/births");
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

    // Si se selecciona una gestación, autocompletar datos relacionados
    if (field === 'pregnancy_id' && value) {
      const pregnancy = pregnancies.find(p => p.id === parseInt(value));
      if (pregnancy) {
        setSelectedPregnancy(pregnancy);
        
        // Autocompletar cerda, verraco y días de gestación de la gestación
        // El boar_id viene de la gestación a través del servicio
        setFormData(prev => {
          const newSowId = pregnancy.sow_id?.toString() || prev.sow_id;
          const newBoarId = pregnancy.boar_id?.toString() || prev.boar_id;
          
          // Calcular días de gestación si ya hay fecha de parto
          let gestationDays = prev.gestation_days;
          let birthDate = prev.birth_date;
          let lactationStartDate = prev.lactation_start_date;
          let expectedWeaningDate = prev.expected_weaning_date;
          
          // Autocompletar con la fecha esperada de parto si no hay fecha
          if (!birthDate && pregnancy.expected_farrowing_date) {
            birthDate = pregnancy.expected_farrowing_date.split('T')[0];
            
            // Calcular fecha de inicio de lactancia (mismo día del parto)
            lactationStartDate = birthDate;
            
            // Calcular fecha esperada de destete (21 días después)
            const birthDateObj = new Date(birthDate);
            birthDateObj.setDate(birthDateObj.getDate() + 21);
            expectedWeaningDate = birthDateObj.toISOString().split('T')[0];
          }
          
          // Calcular días de gestación
          if (birthDate && pregnancy.conception_date) {
            const birthDateParts = birthDate.split('-');
            const conceptionDateParts = pregnancy.conception_date.split('T')[0].split('-');
            
            const birthDateObj = new Date(parseInt(birthDateParts[0]), parseInt(birthDateParts[1]) - 1, parseInt(birthDateParts[2]));
            const conceptionDateObj = new Date(parseInt(conceptionDateParts[0]), parseInt(conceptionDateParts[1]) - 1, parseInt(conceptionDateParts[2]));
            
            const diffTime = birthDateObj.getTime() - conceptionDateObj.getTime();
            gestationDays = Math.round(diffTime / (1000 * 60 * 60 * 24)).toString();
          }
          
          return {
            ...prev,
            sow_id: newSowId,
            boar_id: newBoarId,
            birth_date: birthDate,
            gestation_days: gestationDays,
            lactation_start_date: lactationStartDate,
            expected_weaning_date: expectedWeaningDate
          };
        });

        // Cargar información de la cerda
        if (pregnancy.sow_id) {
          pigService.getSowById(pregnancy.sow_id)
            .then(sow => setSelectedSow(sow))
            .catch(err => console.error("Error cargando cerda:", err));
        }
      }
    }

    // Calcular días de gestación si cambia la fecha de parto
    if (field === 'birth_date' && selectedPregnancy?.conception_date) {
      // Usar solo las fechas sin horas para evitar problemas de zona horaria
      const birthDateParts = value.split('-');
      const conceptionDateParts = selectedPregnancy.conception_date.split('T')[0].split('-');
      
      const birthDate = new Date(parseInt(birthDateParts[0]), parseInt(birthDateParts[1]) - 1, parseInt(birthDateParts[2]));
      const conceptionDate = new Date(parseInt(conceptionDateParts[0]), parseInt(conceptionDateParts[1]) - 1, parseInt(conceptionDateParts[2]));
      
      const diffTime = birthDate.getTime() - conceptionDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      setFormData(prev => ({
        ...prev,
        gestation_days: diffDays.toString()
      }));

      // Calcular fecha de inicio de lactancia (mismo día del parto por defecto)
      setFormData(prev => ({
        ...prev,
        lactation_start_date: value
      }));

      // Calcular fecha esperada de destete (21 días después del parto)
      const weaningDate = new Date(birthDate);
      weaningDate.setDate(weaningDate.getDate() + 21);
      const weaningDateStr = weaningDate.toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        expected_weaning_date: weaningDateStr
      }));
    }

    // Calcular peso promedio de lechón automáticamente
    if ((field === 'total_litter_weight' || field === 'born_alive') && formData.total_litter_weight && formData.born_alive) {
      const totalWeight = field === 'total_litter_weight' ? parseFloat(value) : parseFloat(formData.total_litter_weight);
      const bornAlive = field === 'born_alive' ? parseInt(value) : parseInt(formData.born_alive);
      
      if (totalWeight > 0 && bornAlive > 0) {
        const avgWeight = (totalWeight / bornAlive).toFixed(2);
        setFormData(prev => ({
          ...prev,
          avg_piglet_weight: avgWeight
        }));
      }
    }

    // Validar que total_born = born_alive + born_dead + mummified
    if (['total_born', 'born_alive', 'born_dead', 'mummified'].includes(field)) {
      const total = field === 'total_born' ? parseInt(value) || 0 : parseInt(formData.total_born) || 0;
      const alive = field === 'born_alive' ? parseInt(value) || 0 : parseInt(formData.born_alive) || 0;
      const dead = field === 'born_dead' ? parseInt(value) || 0 : parseInt(formData.born_dead) || 0;
      const mummified = field === 'mummified' ? parseInt(value) || 0 : parseInt(formData.mummified) || 0;
      
      const calculatedTotal = alive + dead + mummified;
      
      if (field !== 'total_born' && calculatedTotal !== total) {
        // Auto-ajustar total_born si se modifican los otros campos
        setFormData(prev => ({
          ...prev,
          total_born: calculatedTotal.toString()
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
    if (!formData.sow_id) newErrors.sow_id = "Seleccione una cerda";
    if (!formData.pregnancy_id) newErrors.pregnancy_id = "Seleccione una gestación";
    if (!formData.birth_date) newErrors.birth_date = "La fecha del parto es obligatoria";
    if (!formData.gestation_days) newErrors.gestation_days = "Los días de gestación son obligatorios";
    if (formData.total_born === "") newErrors.total_born = "El total de nacidos es obligatorio";
    if (formData.born_alive === "") newErrors.born_alive = "Los nacidos vivos son obligatorios";
    if (formData.born_dead === "") newErrors.born_dead = "Los nacidos muertos son obligatorios";

    // Validar días de gestación (110-120)
    const gestationDays = parseInt(formData.gestation_days);
    if (gestationDays && (gestationDays < 110 || gestationDays > 120)) {
      newErrors.gestation_days = "Los días de gestación deben estar entre 110 y 120";
    }

    // Validar que total_born = born_alive + born_dead + mummified
    const total = parseInt(formData.total_born) || 0;
    const alive = parseInt(formData.born_alive) || 0;
    const dead = parseInt(formData.born_dead) || 0;
    const mummified = parseInt(formData.mummified) || 0;
    
    if (total !== (alive + dead + mummified)) {
      newErrors.total_born = `Total (${total}) debe ser igual a vivos (${alive}) + muertos (${dead}) + momificados (${mummified})`;
    }

    // Validar que born_alive, born_dead sean >= 0
    if (alive < 0) newErrors.born_alive = "No puede ser negativo";
    if (dead < 0) newErrors.born_dead = "No puede ser negativo";

    // Validar tiempos
    if (formData.birth_start_time && formData.birth_end_time) {
      if (formData.birth_end_time < formData.birth_start_time) {
        newErrors.birth_end_time = "La hora de fin no puede ser anterior a la hora de inicio";
      }
    }

    // Validar temperaturas (35-42°C)
    if (formData.sow_temperature) {
      const temp = parseFloat(formData.sow_temperature);
      if (temp < 35 || temp > 42) {
        newErrors.sow_temperature = "La temperatura debe estar entre 35 y 42 °C";
      }
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
      
      // Preparar datos para enviar
      const dataToSend = {
        ...formData,
        sow_id: parseInt(formData.sow_id),
        pregnancy_id: parseInt(formData.pregnancy_id),
        boar_id: formData.boar_id ? parseInt(formData.boar_id) : null,
        gestation_days: parseInt(formData.gestation_days),
        total_born: parseInt(formData.total_born),
        born_alive: parseInt(formData.born_alive),
        born_dead: parseInt(formData.born_dead),
        mummified: parseInt(formData.mummified) || 0,
        malformed: parseInt(formData.malformed) || 0,
        total_litter_weight: formData.total_litter_weight ? parseFloat(formData.total_litter_weight) : null,
        avg_piglet_weight: formData.avg_piglet_weight ? parseFloat(formData.avg_piglet_weight) : null,
        sow_temperature: formData.sow_temperature ? parseFloat(formData.sow_temperature) : null
      };

      // Limpiar campos vacíos
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === "" || dataToSend[key] === undefined) {
          dataToSend[key] = null;
        }
      });

      if (isEditMode) {
        await birthService.updateBirth(id, dataToSend);
        toast({
          title: "¡Éxito!",
          description: "Parto actualizado correctamente",
          className: "bg-green-50 border-green-200"
        });
      } else {
        await birthService.createBirth(dataToSend);
        toast({
          title: "¡Éxito!",
          description: "Parto registrado correctamente",
          className: "bg-green-50 border-green-200"
        });
      }

      // Navegar a la lista de partos
      navigate("/births");
    } catch (error) {
      console.error("Error al registrar parto:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo registrar el parto",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isLoadingData ? (
        <div className="flex justify-center items-center h-96">
          <p className="text-lg">Cargando datos...</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/births")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la lista
            </Button>
            
            <div className="flex items-center gap-3">
              <Baby className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold">
                  {isEditMode ? "Editar Parto" : "Registrar Parto"}
                </h1>
                <p className="text-muted-foreground">
                  {isEditMode ? "Modifique los datos del parto" : "Complete los datos del evento de parto"}
                </p>
              </div>
            </div>
          </div>

          {/* Alerta informativa sobre el flujo del módulo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Flujo del módulo de partos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Seleccione una <strong>gestación activa</strong> (automáticamente cargará la cerda y verraco)</li>
                  <li>Los <strong>días de gestación</strong> se calculan automáticamente según la fecha de concepción</li>
                  <li>El <strong>total de nacidos</strong> debe ser igual a vivos + muertos + momificados</li>
                  <li>El <strong>peso promedio</strong> se calcula automáticamente si ingresa peso total de camada</li>
                  <li>Las <strong>fechas de lactancia y destete</strong> se sugieren automáticamente</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Sección 1: Identificación (Horizontal) */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Identificación del Parto</CardTitle>
                <CardDescription>Gestación, cerda y verraco asociados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Gestación */}
                  <div className="space-y-2">
                    <Label htmlFor="pregnancy_id">
                      Gestación <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.pregnancy_id ? formData.pregnancy_id.toString() : ""}
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
                              Cerda: {preg.sow_ear_tag} - Concepción: {new Date(preg.conception_date).toLocaleDateString()}
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
                  </div>

                  {/* Cerda (autocompletado) */}
                  <div className="space-y-2">
                    <Label htmlFor="sow_id">
                      Cerda <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.sow_id ? formData.sow_id.toString() : ""}
                      onValueChange={(value) => handleInputChange("sow_id", value)}
                      disabled={true}
                    >
                      <SelectTrigger className={errors.sow_id ? "border-red-500" : ""}>
                        <SelectValue placeholder="Se carga con la gestación" />
                      </SelectTrigger>
                      <SelectContent>
                        {sows.map(sow => (
                          <SelectItem key={sow.id} value={sow.id.toString()}>
                            {sow.ear_tag} {sow.alias ? `- ${sow.alias}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.sow_id && <p className="text-sm text-red-500">{errors.sow_id}</p>}
                    {selectedSow && (
                      <p className="text-sm text-muted-foreground">
                        Partos previos: {selectedSow.parity_count}
                      </p>
                    )}
                  </div>

                  {/* Verraco (autocompletado, opcional) */}
                  <div className="space-y-2">
                    <Label htmlFor="boar_id">
                      Verraco (Padre) <span className="text-xs text-gray-500">(Opcional)</span>
                    </Label>
                    <Select
                      value={formData.boar_id ? formData.boar_id.toString() : ""}
                      onValueChange={(value) => handleInputChange("boar_id", value)}
                      disabled={true}
                    >
                      <SelectTrigger className={errors.boar_id ? "border-red-500" : ""}>
                        <SelectValue placeholder="Se carga con la gestación" />
                      </SelectTrigger>
                      <SelectContent>
                        {boars.map(boar => (
                          <SelectItem key={boar.id} value={boar.id.toString()}>
                            {boar.ear_tag} {boar.name ? `- ${boar.name}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.boar_id && <p className="text-sm text-red-500">{errors.boar_id}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 2: Datos del Parto (Horizontal) */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Datos del Parto</CardTitle>
                <CardDescription>Fecha, hora y tipo de parto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Fecha del parto */}
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">
                      Fecha del Parto <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => handleInputChange("birth_date", e.target.value)}
                      className={errors.birth_date ? "border-red-500" : ""}
                    />
                    {errors.birth_date && <p className="text-sm text-red-500">{errors.birth_date}</p>}
                    {!errors.birth_date && selectedPregnancy && (
                      <p className="text-sm text-muted-foreground">
                        {formData.birth_date 
                          ? "Fecha autocargada. Puedes modificarla según la fecha real"
                          : "Ingresa la fecha del parto (esperada o real)"}
                      </p>
                    )}
                  </div>

                  {/* Hora de inicio */}
                  <div className="space-y-2">
                    <Label htmlFor="birth_start_time">Hora de Inicio</Label>
                    <Input
                      id="birth_start_time"
                      type="time"
                      value={formData.birth_start_time}
                      onChange={(e) => handleInputChange("birth_start_time", e.target.value)}
                    />
                  </div>

                  {/* Hora de fin */}
                  <div className="space-y-2">
                    <Label htmlFor="birth_end_time">Hora de Fin</Label>
                    <Input
                      id="birth_end_time"
                      type="time"
                      value={formData.birth_end_time}
                      onChange={(e) => handleInputChange("birth_end_time", e.target.value)}
                      className={errors.birth_end_time ? "border-red-500" : ""}
                    />
                    {errors.birth_end_time && <p className="text-sm text-red-500">{errors.birth_end_time}</p>}
                  </div>

                  {/* Días de gestación (calculado) */}
                  <div className="space-y-2">
                    <Label htmlFor="gestation_days">
                      Días de Gestación <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="gestation_days"
                      type="number"
                      min="110"
                      max="120"
                      value={formData.gestation_days}
                      onChange={(e) => handleInputChange("gestation_days", e.target.value)}
                      className={errors.gestation_days ? "border-red-500" : ""}
                      placeholder="110-120"
                      disabled={true}
                    />
                    {errors.gestation_days && <p className="text-sm text-red-500">{errors.gestation_days}</p>}
                    {!errors.gestation_days && selectedPregnancy && (
                      <p className="text-sm text-muted-foreground">
                        Se calcula automáticamente desde la fecha de concepción
                      </p>
                    )}
                  </div>

                  {/* Tipo de parto */}
                  <div className="space-y-2">
                    <Label htmlFor="birth_type">Tipo de Parto</Label>
                    <Select
                      value={formData.birth_type}
                      onValueChange={(value) => handleInputChange("birth_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="asistido">Asistido</SelectItem>
                        <SelectItem value="distocico">Distócico</SelectItem>
                        <SelectItem value="cesarea">Cesárea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Asistencia requerida */}
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <div className="flex items-center space-x-2 h-10">
                      <input
                        type="checkbox"
                        id="assistance_required"
                        checked={formData.assistance_required}
                        onChange={() => handleCheckboxChange("assistance_required")}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="assistance_required" className="cursor-pointer">
                        Asistencia Requerida
                      </Label>
                    </div>
                  </div>

                  {/* Veterinario */}
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="veterinarian_name">Nombre del Veterinario</Label>
                    <Input
                      id="veterinarian_name"
                      placeholder="Ej: Dr. Juan Pérez"
                      value={formData.veterinarian_name}
                      onChange={(e) => handleInputChange("veterinarian_name", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 3: Estadísticas de la Camada (Horizontal) */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Estadísticas de la Camada</CardTitle>
                <CardDescription>Lechones nacidos y pesos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total nacidos */}
                  <div className="space-y-2">
                    <Label htmlFor="total_born">
                      Total Nacidos <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="total_born"
                      type="number"
                      min="0"
                      value={formData.total_born}
                      onChange={(e) => handleInputChange("total_born", e.target.value)}
                      className={errors.total_born ? "border-red-500" : ""}
                      placeholder="0"
                    />
                    {errors.total_born && <p className="text-sm text-red-500">{errors.total_born}</p>}
                  </div>

                  {/* Nacidos vivos */}
                  <div className="space-y-2">
                    <Label htmlFor="born_alive">
                      Nacidos Vivos <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="born_alive"
                      type="number"
                      min="0"
                      value={formData.born_alive}
                      onChange={(e) => handleInputChange("born_alive", e.target.value)}
                      className={errors.born_alive ? "border-red-500" : ""}
                      placeholder="0"
                    />
                    {errors.born_alive && <p className="text-sm text-red-500">{errors.born_alive}</p>}
                  </div>

                  {/* Nacidos muertos */}
                  <div className="space-y-2">
                    <Label htmlFor="born_dead">
                      Nacidos Muertos <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="born_dead"
                      type="number"
                      min="0"
                      value={formData.born_dead}
                      onChange={(e) => handleInputChange("born_dead", e.target.value)}
                      className={errors.born_dead ? "border-red-500" : ""}
                      placeholder="0"
                    />
                    {errors.born_dead && <p className="text-sm text-red-500">{errors.born_dead}</p>}
                  </div>

                  {/* Momificados */}
                  <div className="space-y-2">
                    <Label htmlFor="mummified">Momificados</Label>
                    <Input
                      id="mummified"
                      type="number"
                      min="0"
                      value={formData.mummified}
                      onChange={(e) => handleInputChange("mummified", e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  {/* Malformados */}
                  <div className="space-y-2">
                    <Label htmlFor="malformed">Malformados</Label>
                    <Input
                      id="malformed"
                      type="number"
                      min="0"
                      value={formData.malformed}
                      onChange={(e) => handleInputChange("malformed", e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  {/* Peso total camada */}
                  <div className="space-y-2">
                    <Label htmlFor="total_litter_weight">Peso Total Camada (kg)</Label>
                    <Input
                      id="total_litter_weight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.total_litter_weight}
                      onChange={(e) => handleInputChange("total_litter_weight", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Peso promedio lechón (calculado) */}
                  <div className="space-y-2">
                    <Label htmlFor="avg_piglet_weight">Peso Prom. Lechón (kg)</Label>
                    <Input
                      id="avg_piglet_weight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.avg_piglet_weight}
                      onChange={(e) => handleInputChange("avg_piglet_weight", e.target.value)}
                      placeholder="Calculado automáticamente"
                      disabled={formData.total_litter_weight && formData.born_alive}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 4: Estado de la Cerda (Horizontal) */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Estado de la Cerda Post-Parto</CardTitle>
                <CardDescription>Condición y temperatura</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Condición de la cerda */}
                  <div className="space-y-2">
                    <Label htmlFor="sow_condition">Condición de la Cerda</Label>
                    <Select
                      value={formData.sow_condition}
                      onValueChange={(value) => handleInputChange("sow_condition", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una condición" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excelente">Excelente</SelectItem>
                        <SelectItem value="buena">Buena</SelectItem>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="mala">Mala</SelectItem>
                        <SelectItem value="critica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Temperatura */}
                  <div className="space-y-2">
                    <Label htmlFor="sow_temperature">Temperatura (°C)</Label>
                    <Input
                      id="sow_temperature"
                      type="number"
                      step="0.1"
                      min="35"
                      max="42"
                      value={formData.sow_temperature}
                      onChange={(e) => handleInputChange("sow_temperature", e.target.value)}
                      className={errors.sow_temperature ? "border-red-500" : ""}
                      placeholder="38.5"
                    />
                    {errors.sow_temperature && <p className="text-sm text-red-500">{errors.sow_temperature}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 5: Tratamientos (Horizontal) */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Tratamientos Aplicados</CardTitle>
                <CardDescription>Medicamentos y procedimientos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Oxitocina */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="oxytocin_applied"
                        checked={formData.oxytocin_applied}
                        onChange={() => handleCheckboxChange("oxytocin_applied")}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="oxytocin_applied" className="cursor-pointer">
                        Oxitocina Aplicada
                      </Label>
                    </div>

                    {/* Antibióticos */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="antibiotics_applied"
                        checked={formData.antibiotics_applied}
                        onChange={() => handleCheckboxChange("antibiotics_applied")}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="antibiotics_applied" className="cursor-pointer">
                        Antibióticos Aplicados
                      </Label>
                    </div>
                  </div>

                  {/* Notas de tratamiento */}
                  <div className="space-y-2">
                    <Label htmlFor="treatment_notes">Notas de Tratamiento</Label>
                    <Textarea
                      id="treatment_notes"
                      placeholder="Detalles sobre los tratamientos aplicados..."
                      value={formData.treatment_notes}
                      onChange={(e) => handleInputChange("treatment_notes", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 6: Lactancia (Horizontal) */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Información de Lactancia</CardTitle>
                <CardDescription>Fechas de inicio de lactancia y destete esperado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Inicio de lactancia */}
                  <div className="space-y-2">
                    <Label htmlFor="lactation_start_date">Fecha de Inicio de Lactancia</Label>
                    <Input
                      id="lactation_start_date"
                      type="date"
                      value={formData.lactation_start_date}
                      onChange={(e) => handleInputChange("lactation_start_date", e.target.value)}
                    />
                    {formData.lactation_start_date && (
                      <p className="text-sm text-muted-foreground">
                        Se autocompleta con la fecha del parto, pero puedes modificarla
                      </p>
                    )}
                  </div>

                  {/* Destete esperado */}
                  <div className="space-y-2">
                    <Label htmlFor="expected_weaning_date">Fecha de Destete Esperado</Label>
                    <Input
                      id="expected_weaning_date"
                      type="date"
                      value={formData.expected_weaning_date}
                      onChange={(e) => handleInputChange("expected_weaning_date", e.target.value)}
                    />
                    {formData.expected_weaning_date && (
                      <p className="text-sm text-muted-foreground">
                        Se calcula automáticamente (21 días después del parto)
                      </p>
                    )}
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
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Observaciones adicionales sobre el parto..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
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
                onClick={() => navigate("/births")}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  isEditMode ? "Actualizando..." : "Registrando..."
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {isEditMode ? "Actualizar Parto" : "Registrar Parto"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
