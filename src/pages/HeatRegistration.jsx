import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { heatService, pigService } from "@/services/api";
import { ArrowLeft, Thermometer, CheckCircle2, Calendar } from "lucide-react";

export default function HeatRegistration() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  
  const isEditMode = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [sows, setSows] = useState([]);
  const [boars, setBoars] = useState([]);
  const [selectedSow, setSelectedSow] = useState(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    // Datos obligatorios
    sow_id: "",
    heat_date: "",
    
    // Datos básicos del celo
    heat_end_date: "",
    detection_time: "",
    intensity: "medio",
    duration_hours: "",
    
    // Tipo de celo
    heat_type: "natural",
    induction_protocol: "",
    induction_date: "",
    
    // Celo franco
    peak_estrus_date: "",
    peak_estrus_time: "",
    
    // Método de detección
    detection_method: "verraco detector",
    boar_detector_id: "",
    
    // Signos clínicos (booleanos)
    standing_reflex: false,
    vulva_swelling: false,
    vulva_discharge: false,
    mounting_behavior: false,
    restlessness: false,
    loss_of_appetite: false,
    vocalization: false,
    ear_erection: false,
    tail_deviation: false,
    frequent_urination: false,
    sniffing_genital: false,
    back_arching: false,
    
    // Estado y notas
    status: "detectado",
    notes: ""
  });

  const [errors, setErrors] = useState({});

  // Cargar cerdas y verracos al montar el componente
  useEffect(() => {
    loadData();
    if (id) {
      loadHeatData(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      console.log('🔍 Cargando cerdas y verracos...');
      const [sowsData, boarsData] = await Promise.all([
        pigService.getAllSows(),
        pigService.getAllBoars()
      ]);
      console.log('📊 Datos cargados:', { 
        totalSows: sowsData.length, 
        totalBoars: boarsData.length,
        sowsData: sowsData.slice(0, 2),
        boarsData: boarsData.slice(0, 2)
      });
      
      const activeSows = sowsData.filter(s => s.status === 'activa');
      const activeBoars = boarsData.filter(b => b.status === 'activo' && b.boar_type === 'fisico');
      
      console.log('✅ Filtrados:', { 
        activeSows: activeSows.length, 
        activeBoars: activeBoars.length 
      });
      
      setSows(activeSows);
      setBoars(activeBoars);
    } catch (error) {
      console.error("❌ Error cargando datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos necesarios",
        variant: "destructive"
      });
    }
  };

  const loadHeatData = async (heatId) => {
    try {
      setIsLoadingData(true);
      const heat = await heatService.getHeatById(heatId);
      
      // Verificar que no esté servido o cancelado
      if (heat.status === 'servido' || heat.status === 'cancelado') {
        toast({
          title: "No permitido",
          description: `Los celos con estado "${heat.status}" no se pueden editar`,
          variant: "destructive"
        });
        navigate("/heats");
        return;
      }

      // Cargar datos en el formulario
      setFormData({
        sow_id: heat.sow_id?.toString() || "",
        heat_date: heat.heat_date?.split('T')[0] || "",
        heat_end_date: heat.heat_end_date?.split('T')[0] || "",
        detection_time: heat.detection_time?.substring(0, 5) || "",
        intensity: heat.intensity || "medio",
        duration_hours: heat.duration_hours?.toString() || "",
        heat_type: heat.heat_type || "natural",
        induction_protocol: heat.induction_protocol || "",
        induction_date: heat.induction_date?.split('T')[0] || "",
        peak_estrus_date: heat.peak_estrus_date?.split('T')[0] || "",
        peak_estrus_time: heat.peak_estrus_time?.substring(0, 5) || "",
        detection_method: heat.detection_method || "verraco detector",
        boar_detector_id: heat.boar_detector_id?.toString() || "",
        standing_reflex: heat.standing_reflex || false,
        vulva_swelling: heat.vulva_swelling || false,
        vulva_discharge: heat.vulva_discharge || false,
        mounting_behavior: heat.mounting_behavior || false,
        restlessness: heat.restlessness || false,
        loss_of_appetite: heat.loss_of_appetite || false,
        vocalization: heat.vocalization || false,
        ear_erection: heat.ear_erection || false,
        tail_deviation: heat.tail_deviation || false,
        frequent_urination: heat.frequent_urination || false,
        sniffing_genital: heat.sniffing_genital || false,
        back_arching: heat.back_arching || false,
        status: heat.status || "detectado",
        notes: heat.notes || ""
      });

      // Cargar información de la cerda
      if (heat.sow_id) {
        const sow = await pigService.getSowById(heat.sow_id);
        setSelectedSow(sow);
      }
    } catch (error) {
      console.error("Error cargando datos del celo:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del celo",
        variant: "destructive"
      });
      navigate("/heats");
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

    // Si se selecciona una cerda, cargar sus datos
    if (field === 'sow_id' && value) {
      const sow = sows.find(s => s.id === parseInt(value));
      setSelectedSow(sow);
    }

    // Si el tipo de celo cambia a natural, limpiar campos de inducción
    if (field === 'heat_type' && value === 'natural') {
      setFormData(prev => ({
        ...prev,
        induction_protocol: "",
        induction_date: ""
      }));
    }

    // CÁLCULO AUTOMÁTICO DE FECHAS BASADO EN REGLAS DEL MUNDO PORCINO
    if (field === 'heat_date' || field === 'detection_time' || field === 'intensity') {
      const currentFormData = { ...formData, [field]: value };
      
      // Solo calcular si tenemos fecha de detección
      if (currentFormData.heat_date) {
        // Crear fecha con hora de detección (usando formato local para evitar problemas de zona horaria)
        const [year, month, day] = currentFormData.heat_date.split('-').map(Number);
        const detectionTime = currentFormData.detection_time || '08:00';
        const [hours, minutes] = detectionTime.split(':').map(Number);
        
        // Crear fecha local con la hora de detección
        const heatDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
        
        // Duración del celo según intensidad (en horas)
        const durationByIntensity = {
          'debil': 48,    // 2 días
          'medio': 60,    // 2.5 días
          'fuerte': 72    // 3 días
        };
        
        const duration = durationByIntensity[currentFormData.intensity] || 60;
        
        // CALCULAR FECHA Y HORA DE CELO FRANCO
        // Celo franco ocurre 24-36 horas después del inicio (usamos 30h como promedio)
        const peakEstrusDate = new Date(heatDate.getTime());
        peakEstrusDate.setHours(peakEstrusDate.getHours() + 30);
        
        // CALCULAR FECHA DE FIN DEL CELO
        const heatEndDate = new Date(heatDate.getTime());
        heatEndDate.setHours(heatEndDate.getHours() + duration);
        
        // Formatear fechas para el formulario (YYYY-MM-DD)
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        const formatTime = (date) => {
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${hours}:${minutes}`;
        };
        
        setFormData(prev => ({
          ...prev,
          [field]: value,
          // Solo establecer si el usuario no los ha modificado manualmente
          duration_hours: prev.duration_hours || duration.toString(),
          peak_estrus_date: prev.peak_estrus_date || formatDate(peakEstrusDate),
          peak_estrus_time: prev.peak_estrus_time || formatTime(peakEstrusDate),
          heat_end_date: prev.heat_end_date || formatDate(heatEndDate)
        }));
        
        // Mostrar notificación informativa
        if ((field === 'heat_date' || field === 'detection_time') && !formData.peak_estrus_date) {
          toast({
            title: "Fechas calculadas automáticamente",
            description: `Celo franco: ${formatDate(peakEstrusDate)} a las ${formatTime(peakEstrusDate)}. Fin del celo: ${formatDate(heatEndDate)}. Duración: ${duration}h`,
            className: "bg-blue-50 border-blue-200"
          });
        }
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

  // Función para recalcular fechas automáticamente
  const recalculateDates = () => {
    if (!formData.heat_date) {
      toast({
        title: "Fecha requerida",
        description: "Primero debe ingresar la fecha de detección del celo",
        variant: "destructive"
      });
      return;
    }

    // Crear fecha con hora de detección (usando formato local)
    const [year, month, day] = formData.heat_date.split('-').map(Number);
    const detectionTime = formData.detection_time || '08:00';
    const [hours, minutes] = detectionTime.split(':').map(Number);
    
    // Crear fecha local con la hora de detección
    const heatDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    // Duración del celo según intensidad (en horas)
    const durationByIntensity = {
      'debil': 48,    // 2 días
      'medio': 60,    // 2.5 días
      'fuerte': 72    // 3 días
    };
    
    const duration = durationByIntensity[formData.intensity] || 60;
    
    // CALCULAR FECHA Y HORA DE CELO FRANCO
    // Celo franco ocurre 24-36 horas después del inicio (usamos 30h como promedio)
    const peakEstrusDate = new Date(heatDate.getTime());
    peakEstrusDate.setHours(peakEstrusDate.getHours() + 30);
    
    // CALCULAR FECHA DE FIN DEL CELO
    const heatEndDate = new Date(heatDate.getTime());
    heatEndDate.setHours(heatEndDate.getHours() + duration);
    
    // Formatear fechas para el formulario (YYYY-MM-DD)
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const formatTime = (date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    
    setFormData(prev => ({
      ...prev,
      duration_hours: duration.toString(),
      peak_estrus_date: formatDate(peakEstrusDate),
      peak_estrus_time: formatTime(peakEstrusDate),
      heat_end_date: formatDate(heatEndDate)
    }));
    
    toast({
      title: "Fechas recalculadas",
      description: `Intensidad ${formData.intensity}: Duración ${duration}h. Celo franco: ${formatDate(peakEstrusDate)} ${formatTime(peakEstrusDate)}. Fin: ${formatDate(heatEndDate)}`,
      className: "bg-green-50 border-green-200"
    });
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    // Campos obligatorios
    if (!formData.sow_id) newErrors.sow_id = "Seleccione una cerda";
    if (!formData.heat_date) newErrors.heat_date = "La fecha del celo es obligatoria";
    
    // Validar que la fecha no sea futura
    if (formData.heat_date && new Date(formData.heat_date) > new Date()) {
      newErrors.heat_date = "La fecha no puede ser futura";
    }

    // Si es inducido, validar campos requeridos
    if (formData.heat_type === 'inducido') {
      if (!formData.induction_protocol) {
        newErrors.induction_protocol = "El protocolo de inducción es obligatorio";
      }
      if (!formData.induction_date) {
        newErrors.induction_date = "La fecha de inducción es obligatoria";
      }
    }

    // Validar duración si se proporciona
    if (formData.duration_hours && parseFloat(formData.duration_hours) <= 0) {
      newErrors.duration_hours = "La duración debe ser mayor a 0";
    }

    // Validar fechas lógicas
    if (formData.heat_end_date && formData.heat_date) {
      if (new Date(formData.heat_end_date) < new Date(formData.heat_date)) {
        newErrors.heat_end_date = "La fecha de fin no puede ser anterior a la fecha de inicio";
      }
    }

    if (formData.induction_date && formData.heat_date) {
      if (new Date(formData.induction_date) > new Date(formData.heat_date)) {
        newErrors.induction_date = "La fecha de inducción no puede ser posterior a la fecha del celo";
      }
    }

    if (formData.peak_estrus_date && formData.heat_date) {
      if (new Date(formData.peak_estrus_date) < new Date(formData.heat_date)) {
        newErrors.peak_estrus_date = "La fecha de celo franco no puede ser anterior a la fecha de inicio";
      }
      if (formData.heat_end_date && new Date(formData.peak_estrus_date) > new Date(formData.heat_end_date)) {
        newErrors.peak_estrus_date = "La fecha de celo franco no puede ser posterior a la fecha de fin";
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
        boar_detector_id: formData.boar_detector_id ? parseInt(formData.boar_detector_id) : null,
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null
      };

      let response;
      if (isEditMode) {
        response = await heatService.updateHeat(id, dataToSend);
        toast({
          title: "¡Éxito!",
          description: "Celo actualizado correctamente",
          className: "bg-green-50 border-green-200"
        });
      } else {
        response = await heatService.createHeat(dataToSend);
        
        // Mostrar advertencias si existen
        if (response.warnings && response.warnings.length > 0) {
          toast({
            title: "⚠️ Celo registrado con advertencias",
            description: response.warnings.join(". "),
            className: "bg-yellow-50 border-yellow-200",
            duration: 6000
          });
        } else {
          toast({
            title: "¡Éxito!",
            description: "Celo registrado correctamente",
            className: "bg-green-50 border-green-200"
          });
        }
      }

      // Navegar a la lista de celos
      navigate("/heats");
    } catch (error) {
      console.error("Error al registrar celo:", error);
      
      // Manejar errores de validación reproductiva
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorList = error.response.data.errors.join("\n• ");
        toast({
          title: "❌ No se puede registrar el celo",
          description: "• " + errorList,
          variant: "destructive",
          duration: 8000
        });
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || "No se pudo registrar el celo",
          variant: "destructive"
        });
      }
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
              onClick={() => navigate("/heats")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la lista
            </Button>
            
            <div className="flex items-center gap-3">
              <Thermometer className="h-8 w-8 text-pink-600" />
              <div>
                <h1 className="text-3xl font-bold">
                  {isEditMode ? "Editar Celo/Estro" : "Registrar Celo/Estro"}
                </h1>
                <p className="text-muted-foreground">
                  {isEditMode ? "Modifique los datos del evento de celo" : "Complete los datos del evento de celo detectado"}
                </p>
              </div>
            </div>
          </div>

      <form onSubmit={handleSubmit}>
        {/* Sección 1: Identificación y Datos Básicos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Identificación del Celo</CardTitle>
            <CardDescription>Información básica del evento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cerda */}
              <div className="space-y-2">
                <Label htmlFor="sow_id">
                  Cerda <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.sow_id ? formData.sow_id.toString() : ""}
                  onValueChange={(value) => handleInputChange("sow_id", value)}
                  disabled={sows.length === 0}
                >
                  <SelectTrigger className={errors.sow_id ? "border-red-500" : ""}>
                    <SelectValue placeholder={sows.length === 0 ? "No hay cerdas activas" : "Seleccione una cerda"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sows.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No hay cerdas activas disponibles
                      </div>
                    ) : (
                      sows.map(sow => (
                        <SelectItem key={sow.id} value={sow.id.toString()}>
                          {sow.ear_tag} {sow.alias ? `- ${sow.alias}` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.sow_id && <p className="text-sm text-red-500">{errors.sow_id}</p>}
                {selectedSow && (
                  <p className="text-sm text-muted-foreground">
                    Raza: {selectedSow.breed} | Partos: {selectedSow.parity_count} | Estado: {selectedSow.reproductive_status}
                  </p>
                )}
              </div>

              {/* Fecha del celo */}
              <div className="space-y-2">
                <Label htmlFor="heat_date">
                  Fecha de Detección <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="heat_date"
                  type="date"
                  value={formData.heat_date}
                  onChange={(e) => handleInputChange("heat_date", e.target.value)}
                  className={errors.heat_date ? "border-red-500" : ""}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.heat_date && <p className="text-sm text-red-500">{errors.heat_date}</p>}
              </div>

              {/* Hora de detección */}
              <div className="space-y-2">
                <Label htmlFor="detection_time">Hora de Detección</Label>
                <Input
                  id="detection_time"
                  type="time"
                  value={formData.detection_time}
                  onChange={(e) => handleInputChange("detection_time", e.target.value)}
                />
              </div>

              {/* Intensidad */}
              <div className="space-y-2">
                <Label htmlFor="intensity">Intensidad del Celo</Label>
                <Select
                  value={formData.intensity}
                  onValueChange={(value) => handleInputChange("intensity", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debil">Débil</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="fuerte">Fuerte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duración */}
              <div className="space-y-2">
                <Label htmlFor="duration_hours">Duración (horas)</Label>
                <Input
                  id="duration_hours"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ej: 48"
                  value={formData.duration_hours}
                  onChange={(e) => handleInputChange("duration_hours", e.target.value)}
                  className={errors.duration_hours ? "border-red-500" : ""}
                />
                {errors.duration_hours && <p className="text-sm text-red-500">{errors.duration_hours}</p>}
              </div>

              {/* Fecha de fin */}
              <div className="space-y-2">
                <Label htmlFor="heat_end_date">Fecha de Fin del Celo</Label>
                <Input
                  id="heat_end_date"
                  type="date"
                  value={formData.heat_end_date}
                  onChange={(e) => handleInputChange("heat_end_date", e.target.value)}
                  className={errors.heat_end_date ? "border-red-500" : ""}
                />
                {errors.heat_end_date && <p className="text-sm text-red-500">{errors.heat_end_date}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección 2: Tipo de Celo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tipo de Celo</CardTitle>
            <CardDescription>Celo natural o inducido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Tipo */}
              <div className="space-y-2">
                <Label htmlFor="heat_type">Tipo de Celo</Label>
                <Select
                  value={formData.heat_type}
                  onValueChange={(value) => handleInputChange("heat_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="inducido">Inducido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Protocolo de inducción */}
              {formData.heat_type === 'inducido' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="induction_protocol">
                      Protocolo de Inducción <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="induction_protocol"
                      placeholder="Ej: PG600, Altrenogest"
                      value={formData.induction_protocol}
                      onChange={(e) => handleInputChange("induction_protocol", e.target.value)}
                      className={errors.induction_protocol ? "border-red-500" : ""}
                    />
                    {errors.induction_protocol && <p className="text-sm text-red-500">{errors.induction_protocol}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="induction_date">
                      Fecha de Inducción <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="induction_date"
                      type="date"
                      value={formData.induction_date}
                      onChange={(e) => handleInputChange("induction_date", e.target.value)}
                      className={errors.induction_date ? "border-red-500" : ""}
                    />
                    {errors.induction_date && <p className="text-sm text-red-500">{errors.induction_date}</p>}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sección 3: Método de Detección */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Método de Detección y Celo Franco</CardTitle>
                <CardDescription>Cómo se detectó el celo y momento óptimo</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={recalculateDates}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Recalcular fechas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Cálculo automático:</strong> Las fechas de celo franco y fin del celo se calculan automáticamente según la intensidad:
                <br />• Débil: 48h duración, celo franco a las 30h
                <br />• Medio: 60h duración, celo franco a las 30h
                <br />• Fuerte: 72h duración, celo franco a las 30h
                <br />Puede ajustar manualmente estos valores si es necesario.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Método */}
              <div className="space-y-2">
                <Label htmlFor="detection_method">Método de Detección</Label>
                <Select
                  value={formData.detection_method}
                  onValueChange={(value) => handleInputChange("detection_method", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verraco detector">Verraco Detector</SelectItem>
                    <SelectItem value="prueba inmovilidad">Prueba de Inmovilidad</SelectItem>
                    <SelectItem value="visual">Visual</SelectItem>
                    <SelectItem value="marcador">Marcador</SelectItem>
                    <SelectItem value="detector electronico">Detector Electrónico</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Verraco detector */}
              {formData.detection_method === 'verraco detector' && (
                <div className="space-y-2">
                  <Label htmlFor="boar_detector_id">Verraco Detector</Label>
                  <Select
                    value={formData.boar_detector_id ? formData.boar_detector_id.toString() : ""}
                    onValueChange={(value) => handleInputChange("boar_detector_id", value)}
                    disabled={boars.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={boars.length === 0 ? "No hay verracos activos" : "Seleccione un verraco (opcional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {boars.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No hay verracos activos disponibles
                        </div>
                      ) : (
                        boars.map(boar => (
                          <SelectItem key={boar.id} value={boar.id.toString()}>
                            {boar.ear_tag} {boar.name ? `- ${boar.name}` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Fecha celo franco */}
              <div className="space-y-2">
                <Label htmlFor="peak_estrus_date">Fecha Celo Franco</Label>
                <Input
                  id="peak_estrus_date"
                  type="date"
                  value={formData.peak_estrus_date}
                  onChange={(e) => handleInputChange("peak_estrus_date", e.target.value)}
                  className={errors.peak_estrus_date ? "border-red-500" : ""}
                />
                {errors.peak_estrus_date && <p className="text-sm text-red-500">{errors.peak_estrus_date}</p>}
              </div>

              {/* Hora celo franco */}
              <div className="space-y-2">
                <Label htmlFor="peak_estrus_time">Hora Celo Franco</Label>
                <Input
                  id="peak_estrus_time"
                  type="time"
                  value={formData.peak_estrus_time}
                  onChange={(e) => handleInputChange("peak_estrus_time", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección 4: Signos Clínicos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Signos Clínicos del Celo</CardTitle>
            <CardDescription>Marque los signos observados durante la detección</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { key: 'standing_reflex', label: 'Reflejo de Inmovilidad' },
                { key: 'vulva_swelling', label: 'Hinchazón Vulvar' },
                { key: 'vulva_discharge', label: 'Descarga Vaginal' },
                { key: 'mounting_behavior', label: 'Monta a Otras' },
                { key: 'restlessness', label: 'Inquietud' },
                { key: 'loss_of_appetite', label: 'Pérdida de Apetito' },
                { key: 'vocalization', label: 'Vocalización' },
                { key: 'ear_erection', label: 'Orejas Erectas' },
                { key: 'tail_deviation', label: 'Cola Desviada' },
                { key: 'frequent_urination', label: 'Micción Frecuente' },
                { key: 'sniffing_genital', label: 'Olfateo Genital' },
                { key: 'back_arching', label: 'Arqueamiento Lomo' }
              ].map(sign => (
                <div key={sign.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={sign.key}
                    checked={formData[sign.key]}
                    onChange={() => handleCheckboxChange(sign.key)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor={sign.key} className="text-sm cursor-pointer">
                    {sign.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sección 5: Observaciones */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Observaciones Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Observaciones adicionales sobre el celo..."
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
            onClick={() => navigate("/heats")}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-pink-600 hover:bg-pink-700"
          >
            {isLoading ? (
              isEditMode ? "Actualizando..." : "Registrando..."
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isEditMode ? "Actualizar Celo" : "Registrar Celo"}
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
