import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { pregnancyService, pigService, serviceService } from "@/services/api";
import { ArrowLeft, Heart, CheckCircle2, Upload, X, Image as ImageIcon } from "lucide-react";

export default function PregnancyRegistration() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const isEditMode = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [sows, setSows] = useState([]);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedSow, setSelectedSow] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    // Datos obligatorios
    sow_id: "",
    service_id: "",
    conception_date: "",
    
    // Fecha esperada de parto
    expected_farrowing_date: "",
    
    // Confirmación de preñez
    confirmed: false,
    confirmation_date: "",
    confirmation_method: "",
    
    // Estado
    status: "en curso",
    
    // Seguimiento
    ultrasound_count: 0,
    last_ultrasound_date: "",
    estimated_piglets: "",
    ultrasound_image_url: "",
    
    // Observaciones
    notes: ""
  });

  const [errors, setErrors] = useState({});

  // Cargar cerdas y servicios al montar el componente
  useEffect(() => {
    loadData();
    if (id) {
      loadPregnancyData(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      console.log('🔍 Cargando cerdas y servicios...');
      const [sowsData, servicesData] = await Promise.all([
        pigService.getAllSows(),
        serviceService.getAllServices()
      ]);
      console.log('📊 Datos cargados:', { 
        totalSows: sowsData.length, 
        totalServices: servicesData.length
      });
      
      const activeSows = sowsData.filter(s => s.status === 'activa');
      
      console.log('✅ Filtrados:', { 
        activeSows: activeSows.length
      });
      
      setSows(activeSows);
      setServices(servicesData);
    } catch (error) {
      console.error("❌ Error cargando datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos necesarios",
        variant: "destructive"
      });
    }
  };

  const loadPregnancyData = async (pregnancyId) => {
    try {
      setIsLoadingData(true);
      const pregnancy = await pregnancyService.getPregnancyById(pregnancyId);
      
      // Verificar que no esté finalizada
      if (pregnancy.status === 'finalizada parto' || pregnancy.status === 'finalizada aborto') {
        toast({
          title: "No permitido",
          description: `Las gestaciones con estado "${pregnancy.status}" no se pueden editar`,
          variant: "destructive"
        });
        navigate("/pregnancies");
        return;
      }

      // Cargar datos en el formulario
      setFormData({
        sow_id: pregnancy.sow_id?.toString() || "",
        service_id: pregnancy.service_id?.toString() || "",
        conception_date: pregnancy.conception_date?.split('T')[0] || "",
        expected_farrowing_date: pregnancy.expected_farrowing_date?.split('T')[0] || "",
        confirmed: pregnancy.confirmed || false,
        confirmation_date: pregnancy.confirmation_date?.split('T')[0] || "",
        confirmation_method: pregnancy.confirmation_method || "",
        status: pregnancy.status || "en curso",
        ultrasound_count: pregnancy.ultrasound_count || 0,
        last_ultrasound_date: pregnancy.last_ultrasound_date?.split('T')[0] || "",
        estimated_piglets: pregnancy.estimated_piglets?.toString() || "",
        ultrasound_image_url: pregnancy.ultrasound_image_url || "",
        notes: pregnancy.notes || ""
      });

      // Cargar información del servicio primero
      if (pregnancy.service_id) {
        try {
          const service = await serviceService.getServiceById(pregnancy.service_id);
          setSelectedService(service);
        } catch (serviceErr) {
          console.error('Error loading service:', serviceErr);
        }
      }

      // Cargar información de la cerda
      if (pregnancy.sow_id) {
        const sow = await pigService.getSowById(pregnancy.sow_id);
        setSelectedSow(sow);
        
        // Filtrar servicios de esta cerda e incluir el servicio actual
        const sowServices = services.filter(s => s.sow_id === pregnancy.sow_id);
        
        // Si el servicio actual no está en la lista, agregarlo
        if (pregnancy.service_id && !sowServices.some(s => s.id === pregnancy.service_id)) {
          if (selectedService) {
            sowServices.push(selectedService);
          }
        }
        
        setFilteredServices(sowServices);
      }

      // Si hay imagen, cargarla como preview
      if (pregnancy.ultrasound_image_url) {
        setImagePreview(pregnancy.ultrasound_image_url);
      }
    } catch (error) {
      console.error("Error cargando datos de la gestación:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la gestación",
        variant: "destructive"
      });
      navigate("/pregnancies");
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

    // Si se selecciona una cerda, filtrar servicios de esa cerda
    if (field === 'sow_id' && value) {
      const sow = sows.find(s => s.id === parseInt(value));
      setSelectedSow(sow);
      
      // Filtrar servicios de esta cerda que no tengan gestación confirmada
      const sowServices = services.filter(s => 
        s.sow_id === parseInt(value) && 
        !s.has_confirmed_pregnancy
      );
      setFilteredServices(sowServices);
      
      // Limpiar servicio seleccionado
      setFormData(prev => ({
        ...prev,
        service_id: "",
        conception_date: ""
      }));
      setSelectedService(null);
    }

    // Si se selecciona un servicio, prellenar fecha de concepción
    if (field === 'service_id' && value) {
      const service = services.find(s => s.id === parseInt(value));
      setSelectedService(service);
      
      if (service) {
        // La fecha de concepción es la fecha del servicio
        setFormData(prev => ({
          ...prev,
          conception_date: service.service_date?.split('T')[0] || "",
          // Calcular fecha esperada de parto (114 días después)
          expected_farrowing_date: calculateExpectedFarrowing(service.service_date)
        }));
      }
    }

    // Si se cambia la fecha de concepción, recalcular fecha de parto
    if (field === 'conception_date' && value) {
      setFormData(prev => ({
        ...prev,
        expected_farrowing_date: calculateExpectedFarrowing(value)
      }));
    }

    // Si se marca como confirmada, asegurar que tenga método y fecha
    if (field === 'confirmed' && value === true) {
      if (!formData.confirmation_method) {
        setFormData(prev => ({
          ...prev,
          confirmation_method: "ultrasonido"
        }));
      }
      if (!formData.confirmation_date) {
        setFormData(prev => ({
          ...prev,
          confirmation_date: new Date().toISOString().split('T')[0]
        }));
      }
    }

    // Si se cambia el método a ultrasonido, incrementar contador
    if (field === 'confirmation_method' && value === 'ultrasonido' && formData.confirmed) {
      setFormData(prev => ({
        ...prev,
        ultrasound_count: Math.max(1, prev.ultrasound_count),
        last_ultrasound_date: formData.confirmation_date || new Date().toISOString().split('T')[0]
      }));
    }
  };

  // Calcular fecha esperada de parto (114 días después de concepción)
  const calculateExpectedFarrowing = (conceptionDate) => {
    if (!conceptionDate) return "";
    
    const conception = new Date(conceptionDate);
    conception.setDate(conception.getDate() + 114);
    
    const year = conception.getFullYear();
    const month = String(conception.getMonth() + 1).padStart(2, '0');
    const day = String(conception.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Manejar cambio de checkbox
  const handleCheckboxChange = (field) => {
    const newValue = !formData[field];
    setFormData(prev => ({
      ...prev,
      [field]: newValue
    }));

    // Si se marca como confirmada, asegurar que tenga método y fecha
    if (field === 'confirmed' && newValue === true) {
      if (!formData.confirmation_method) {
        setFormData(prev => ({
          ...prev,
          confirmation_method: "ultrasonido"
        }));
      }
      if (!formData.confirmation_date) {
        setFormData(prev => ({
          ...prev,
          confirmation_date: new Date().toISOString().split('T')[0]
        }));
      }
    }
  };

  // Manejar carga de imagen
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive"
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe superar los 5MB",
        variant: "destructive"
      });
      return;
    }

    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setImagePreview(base64String);
      setFormData(prev => ({
        ...prev,
        ultrasound_image_url: base64String
      }));
      
      toast({
        title: "Imagen cargada",
        description: "La imagen se ha cargado correctamente",
        className: "bg-green-50 border-green-200"
      });
    };
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "No se pudo leer la imagen",
        variant: "destructive"
      });
    };
    reader.readAsDataURL(file);
  };

  // Eliminar imagen
  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      ultrasound_image_url: ""
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    // Campos obligatorios
    if (!formData.sow_id) newErrors.sow_id = "Seleccione una cerda";
    if (!formData.service_id) newErrors.service_id = "Seleccione un servicio";
    if (!formData.conception_date) newErrors.conception_date = "La fecha de concepción es obligatoria";
    
    // Validar que la fecha de concepción no sea futura
    if (formData.conception_date && new Date(formData.conception_date) > new Date()) {
      newErrors.conception_date = "La fecha de concepción no puede ser futura";
    }

    // Si está confirmada, validar campos requeridos
    if (formData.confirmed) {
      if (!formData.confirmation_method) {
        newErrors.confirmation_method = "El método de confirmación es obligatorio";
      }
      if (!formData.confirmation_date) {
        newErrors.confirmation_date = "La fecha de confirmación es obligatoria";
      }
    }

    // Validar fecha de confirmación
    if (formData.confirmation_date && formData.conception_date) {
      if (new Date(formData.confirmation_date) < new Date(formData.conception_date)) {
        newErrors.confirmation_date = "La fecha de confirmación no puede ser anterior a la concepción";
      }
    }

    // Validar lechones estimados
    if (formData.estimated_piglets && parseInt(formData.estimated_piglets) <= 0) {
      newErrors.estimated_piglets = "El número de lechones debe ser mayor a 0";
    }

    // Validar contador de ecografías
    if (formData.ultrasound_count && parseInt(formData.ultrasound_count) < 0) {
      newErrors.ultrasound_count = "El número de ecografías no puede ser negativo";
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
        service_id: parseInt(formData.service_id),
        ultrasound_count: parseInt(formData.ultrasound_count) || 0,
        estimated_piglets: formData.estimated_piglets ? parseInt(formData.estimated_piglets) : null,
        confirmed: Boolean(formData.confirmed)
      };

      let response;
      if (isEditMode) {
        response = await pregnancyService.updatePregnancy(id, dataToSend);
        toast({
          title: "¡Éxito!",
          description: "Gestación actualizada correctamente",
          className: "bg-green-50 border-green-200"
        });
      } else {
        response = await pregnancyService.createPregnancy(dataToSend);
        
        // Mostrar advertencias si existen
        if (response.warnings && response.warnings.length > 0) {
          toast({
            title: "⚠️ Gestación registrada con advertencias",
            description: response.warnings.join(". "),
            className: "bg-yellow-50 border-yellow-200",
            duration: 6000
          });
        } else {
          toast({
            title: "¡Éxito!",
            description: "Gestación registrada correctamente",
            className: "bg-green-50 border-green-200"
          });
        }
      }

      // Navegar a la lista de gestaciones
      navigate("/pregnancies");
    } catch (error) {
      console.error("Error al registrar gestación:", error);
      
      // Manejar errores de validación reproductiva
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorList = error.response.data.errors.join("\n• ");
        toast({
          title: "❌ No se puede registrar la gestación",
          description: "• " + errorList,
          variant: "destructive",
          duration: 8000
        });
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || "No se pudo registrar la gestación",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoadingData ? (
        <div className="flex justify-center items-center h-96">
          <p className="text-lg">Cargando datos...</p>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/pregnancies")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la lista
            </Button>
            
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-pink-600" />
              <div>
                <h1 className="text-3xl font-bold">
                  {isEditMode ? "Editar Gestación" : "Registrar Gestación"}
                </h1>
                <p className="text-muted-foreground">
                  {isEditMode ? "Modifique los datos de la gestación" : "Complete los datos de la nueva gestación"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Sección 1: Identificación y Datos Básicos */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Identificación de la Gestación</CardTitle>
                <CardDescription>Información básica del evento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Cerda */}
                  <div className="space-y-2">
                    <Label htmlFor="sow_id">
                      Cerda <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.sow_id ? formData.sow_id.toString() : ""}
                      onValueChange={(value) => handleInputChange("sow_id", value)}
                      disabled={sows.length === 0 || isEditMode}
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
                        Raza: {selectedSow.breed} | Partos: {selectedSow.parity_count}
                      </p>
                    )}
                  </div>

                  {/* Servicio */}
                  <div className="space-y-2">
                    <Label htmlFor="service_id">
                      Servicio <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.service_id ? formData.service_id.toString() : ""}
                      onValueChange={(value) => handleInputChange("service_id", value)}
                      disabled={!formData.sow_id || filteredServices.length === 0 || isEditMode}
                    >
                      <SelectTrigger className={errors.service_id ? "border-red-500" : ""}>
                        <SelectValue placeholder={
                          !formData.sow_id 
                            ? "Primero seleccione cerda" 
                            : filteredServices.length === 0 
                              ? "No hay servicios disponibles" 
                              : "Seleccione un servicio"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredServices.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No hay servicios disponibles para esta cerda
                          </div>
                        ) : (
                          filteredServices.map(service => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {new Date(service.service_date).toLocaleDateString('es-ES')} - {service.service_type}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.service_id && <p className="text-sm text-red-500">{errors.service_id}</p>}
                    {isEditMode && (
                      <p className="text-xs text-gray-500">
                        El servicio no se puede cambiar en modo edición
                      </p>
                    )}
                    {selectedService && (
                      <p className="text-sm text-muted-foreground">
                        Tipo: {selectedService.service_type} | Verraco: {selectedService.boar_ear_tag || selectedService.boar_code || 'N/A'}
                      </p>
                    )}
                  </div>

                  {/* Fecha de concepción */}
                  <div className="space-y-2">
                    <Label htmlFor="conception_date">
                      Fecha de Concepción <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="conception_date"
                      type="date"
                      value={formData.conception_date}
                      onChange={(e) => handleInputChange("conception_date", e.target.value)}
                      className={errors.conception_date ? "border-red-500" : ""}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.conception_date && <p className="text-sm text-red-500">{errors.conception_date}</p>}
                  </div>

                  {/* Fecha esperada de parto */}
                  <div className="space-y-2">
                    <Label htmlFor="expected_farrowing_date">
                      Parto Esperado (114d)
                    </Label>
                    <Input
                      id="expected_farrowing_date"
                      type="date"
                      value={formData.expected_farrowing_date}
                      onChange={(e) => handleInputChange("expected_farrowing_date", e.target.value)}
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Se calcula automáticamente (114 días)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 2: Confirmación de Preñez */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Confirmación de Preñez</CardTitle>
                <CardDescription>Método y fecha de confirmación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Checkbox confirmada */}
                  <div className="space-y-2 flex items-center">
                    <input
                      type="checkbox"
                      id="confirmed"
                      checked={formData.confirmed}
                      onChange={() => handleCheckboxChange("confirmed")}
                      className="h-4 w-4 rounded border-gray-300 mr-2"
                    />
                    <Label htmlFor="confirmed" className="cursor-pointer">
                      Gestación Confirmada
                    </Label>
                  </div>

                  {/* Método de confirmación */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmation_method">
                      Método {formData.confirmed && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={formData.confirmation_method}
                      onValueChange={(value) => handleInputChange("confirmation_method", value)}
                      disabled={!formData.confirmed}
                    >
                      <SelectTrigger className={errors.confirmation_method ? "border-red-500" : ""}>
                        <SelectValue placeholder="Seleccione método" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ultrasonido">Ultrasonido</SelectItem>
                        <SelectItem value="no repeticion celo">No Repetición Celo</SelectItem>
                        <SelectItem value="palpacion">Palpación</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.confirmation_method && <p className="text-sm text-red-500">{errors.confirmation_method}</p>}
                  </div>

                  {/* Fecha de confirmación */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmation_date">
                      Fecha Confirmación {formData.confirmed && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="confirmation_date"
                      type="date"
                      value={formData.confirmation_date}
                      onChange={(e) => handleInputChange("confirmation_date", e.target.value)}
                      className={errors.confirmation_date ? "border-red-500" : ""}
                      disabled={!formData.confirmed}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.confirmation_date && <p className="text-sm text-red-500">{errors.confirmation_date}</p>}
                  </div>

                  {/* Lechones estimados */}
                  <div className="space-y-2">
                    <Label htmlFor="estimated_piglets">
                      Lechones Estimados
                    </Label>
                    <Input
                      id="estimated_piglets"
                      type="number"
                      min="0"
                      placeholder="Ej: 12"
                      value={formData.estimated_piglets}
                      onChange={(e) => handleInputChange("estimated_piglets", e.target.value)}
                      className={errors.estimated_piglets ? "border-red-500" : ""}
                    />
                    {errors.estimated_piglets && <p className="text-sm text-red-500">{errors.estimated_piglets}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 3: Seguimiento y Ecografías */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Seguimiento Ecográfico</CardTitle>
                <CardDescription>Registro de ecografías y observaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Número de ecografías */}
                  <div className="space-y-2">
                    <Label htmlFor="ultrasound_count">
                      Número de Ecografías
                    </Label>
                    <Input
                      id="ultrasound_count"
                      type="number"
                      min="0"
                      value={formData.ultrasound_count}
                      onChange={(e) => handleInputChange("ultrasound_count", e.target.value)}
                      className={errors.ultrasound_count ? "border-red-500" : ""}
                    />
                    {errors.ultrasound_count && <p className="text-sm text-red-500">{errors.ultrasound_count}</p>}
                  </div>

                  {/* Última ecografía */}
                  <div className="space-y-2">
                    <Label htmlFor="last_ultrasound_date">
                      Última Ecografía
                    </Label>
                    <Input
                      id="last_ultrasound_date"
                      type="date"
                      value={formData.last_ultrasound_date}
                      onChange={(e) => handleInputChange("last_ultrasound_date", e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Estado */}
                  <div className="space-y-2">
                    <Label htmlFor="status">
                      Estado
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en curso">En Curso</SelectItem>
                        <SelectItem value="finalizada parto">Finalizada Parto</SelectItem>
                        <SelectItem value="finalizada aborto">Finalizada Aborto</SelectItem>
                        <SelectItem value="no confirmada">No Confirmada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Imagen de ecografía */}
                <div className="space-y-4">
                  <Label>Imagen de Ecografía (opcional)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6">
                    {!imagePreview ? (
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <div className="flex justify-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Cargar Imagen
                          </Button>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          PNG, JPG o GIF (máx. 5MB)
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Ecografía" 
                            className="w-full max-h-96 object-contain rounded-lg bg-gray-50"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={handleRemoveImage}
                            title="Eliminar imagen"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Cambiar Imagen
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 4: Observaciones */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Observaciones Adicionales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Observaciones adicionales sobre la gestación..."
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
                onClick={() => navigate("/pregnancies")}
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
                    {isEditMode ? "Actualizar Gestación" : "Registrar Gestación"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
