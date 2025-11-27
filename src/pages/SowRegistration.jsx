import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { pigService } from "@/services/api";
import { ArrowLeft, PiggyBank, Upload, X, Image as ImageIcon } from "lucide-react";

export default function SowRegistration() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  
  const isEditMode = !!id;
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [animalType, setAnimalType] = useState(""); // "cerda" o "verraco"
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Estado del formulario de cerda
  const [formData, setFormData] = useState({
    // Datos básicos obligatorios
    ear_tag: "",
    id_type: "arete",
    alias: "",
    breed: "",
    genetic_line: "",
    generation: "",
    sire_tag: "",
    dam_tag: "",
    birth_date: "",
    entry_date: "",
    origin: "propia",
    status: "activa",
    location: "",
    farm_name: "",
    
    // Datos físicos obligatorios
    current_weight: "",
    min_service_weight: "120",
    body_condition: "",
    last_weight_date: "",
    
    // Datos reproductivos (opcionales)
    parity_count: "0",
    total_piglets_born: "0",
    total_piglets_alive: "0",
    total_piglets_dead: "0",
    total_abortions: "0",
    avg_piglets_alive: "",
    reproductive_status: "vacia",
    last_service_date: "",
    last_parturition_date: "",
    expected_farrowing_date: "",
    last_weaning_date: "",
    
    // Otros
    photo_url: ""
  });

  const [errors, setErrors] = useState({});

  // Cargar datos de la cerda si estamos en modo edición
  useEffect(() => {
    if (id) {
      // Validar que el ID sea un número antes de cargar
      if (isNaN(parseInt(id))) {
        console.error('ID inválido en SowRegistration:', id);
        toast({
          title: "Error",
          description: `ID inválido: "${id}". El ID debe ser un número.`,
          variant: "destructive"
        });
        navigate("/sows/list");
        return;
      }
      loadSowData(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadSowData = async (sowId) => {
    try {
      setIsLoadingData(true);
      const sow = await pigService.getSowById(sowId);
      
      // Verificar que no esté descartada
      if (sow.status === 'descartada') {
        toast({
          title: "No permitido",
          description: "No se puede editar una cerda descartada. El descarte es un estado final.",
          variant: "destructive"
        });
        navigate("/sows/list");
        return;
      }

      // Función para formatear fechas a YYYY-MM-DD para inputs
      const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        try {
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch {
          return "";
        }
      };

      // Cargar datos en el formulario
      setFormData({
        ear_tag: sow.ear_tag || "",
        id_type: sow.id_type || "arete",
        alias: sow.alias || "",
        breed: sow.breed || "",
        genetic_line: sow.genetic_line || "",
        generation: sow.generation || "",
        sire_tag: sow.sire_tag || "",
        dam_tag: sow.dam_tag || "",
        birth_date: formatDateForInput(sow.birth_date),
        entry_date: formatDateForInput(sow.entry_date),
        origin: sow.origin || "propia",
        status: sow.status || "activa",
        location: sow.location || "",
        farm_name: sow.farm_name || "",
        current_weight: sow.current_weight?.toString() || "",
        min_service_weight: sow.min_service_weight?.toString() || "120",
        body_condition: sow.body_condition?.toString() || "",
        last_weight_date: formatDateForInput(sow.last_weight_date),
        parity_count: sow.parity_count?.toString() || "0",
        total_piglets_born: sow.total_piglets_born?.toString() || "0",
        total_piglets_alive: sow.total_piglets_alive?.toString() || "0",
        total_piglets_dead: sow.total_piglets_dead?.toString() || "0",
        total_abortions: sow.total_abortions?.toString() || "0",
        avg_piglets_alive: sow.avg_piglets_alive?.toString() || "",
        reproductive_status: sow.reproductive_status || "vacia",
        last_service_date: formatDateForInput(sow.last_service_date),
        last_parturition_date: formatDateForInput(sow.last_parturition_date),
        expected_farrowing_date: formatDateForInput(sow.expected_farrowing_date),
        last_weaning_date: formatDateForInput(sow.last_weaning_date),
        photo_url: sow.photo_url || ""
      });

      // Si hay imagen, cargarla como preview
      if (sow.photo_url) {
        setImagePreview(sow.photo_url);
      }

      // Forzar selección de tipo "cerda" en modo edición
      setAnimalType("cerda");
    } catch (error) {
      console.error("Error cargando datos de la cerda:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la cerda",
        variant: "destructive"
      });
      navigate("/sows/list");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Manejar selección de imagen
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos JPEG, JPG o PNG",
        variant: "destructive"
      });
      return;
    }
    
    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: "La imagen no debe superar los 5MB",
        variant: "destructive"
      });
      return;
    }
    
    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Subir al servidor
    await uploadImageToServer(file);
  };

  // Subir imagen al servidor
  const uploadImageToServer = async (file) => {
    setIsUploadingImage(true);
    try {
      const photoUrl = await pigService.uploadPhoto(file);
      
      console.log('Photo URL recibida:', photoUrl ? 'IMAGE_DATA_RECEIVED' : 'NO_DATA');
      
      if (photoUrl) {
        // Guardar la URL base64 en el formulario
        handleInputChange("photo_url", photoUrl);
        
        console.log('Photo URL guardada en formData');
        
        toast({
          title: "Imagen cargada",
          description: "La imagen se cargó correctamente",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error al subir imagen:", error);
      toast({
        title: "Error al cargar imagen",
        description: error.response?.data?.message || "No se pudo cargar la imagen",
        variant: "destructive"
      });
      
      // Limpiar preview si falla
      setImagePreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remover imagen
  const handleRemoveImage = () => {
    setImagePreview(null);
    handleInputChange("photo_url", "");
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
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    // Campos obligatorios
    if (!formData.ear_tag.trim()) newErrors.ear_tag = "El arete es obligatorio";
    if (!formData.breed.trim()) newErrors.breed = "La raza es obligatoria";
    if (!formData.birth_date) newErrors.birth_date = "La fecha de nacimiento es obligatoria";
    if (!formData.entry_date) newErrors.entry_date = "La fecha de entrada es obligatoria";
    if (!formData.farm_name.trim()) newErrors.farm_name = "El nombre de la granja es obligatorio";
    if (!formData.current_weight) newErrors.current_weight = "El peso actual es obligatorio";
    if (!formData.body_condition) newErrors.body_condition = "La condición corporal es obligatoria";
    
    // Validar peso
    if (formData.current_weight && parseFloat(formData.current_weight) <= 0) {
      newErrors.current_weight = "El peso debe ser mayor a 0";
    }
    
    // Validar condición corporal (1-5)
    if (formData.body_condition && (parseFloat(formData.body_condition) < 1 || parseFloat(formData.body_condition) > 5)) {
      newErrors.body_condition = "La condición corporal debe estar entre 1 y 5";
    }
    
    // Validar fechas
    if (formData.birth_date && formData.entry_date) {
      const birthDate = new Date(formData.birth_date);
      const entryDate = new Date(formData.entry_date);
      
      if (entryDate < birthDate) {
        newErrors.entry_date = "La fecha de entrada no puede ser anterior a la fecha de nacimiento";
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
        title: "Error de validación",
        description: "Por favor completa todos los campos obligatorios correctamente",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Preparar datos - convertir strings vacíos a null para campos opcionales
      const dataToSend = {
        ...formData,
        alias: formData.alias.trim() || null,
        genetic_line: formData.genetic_line.trim() || null,
        generation: formData.generation.trim() || null,
        sire_tag: formData.sire_tag.trim() || null,
        dam_tag: formData.dam_tag.trim() || null,
        location: formData.location.trim() || null,
        last_weight_date: formData.last_weight_date || null,
        avg_piglets_alive: formData.avg_piglets_alive || null,
        last_service_date: formData.last_service_date || null,
        last_parturition_date: formData.last_parturition_date || null,
        expected_farrowing_date: formData.expected_farrowing_date || null,
        last_weaning_date: formData.last_weaning_date || null,
        photo_url: formData.photo_url || null,
        // Convertir números
        current_weight: parseFloat(formData.current_weight),
        min_service_weight: parseFloat(formData.min_service_weight),
        body_condition: parseFloat(formData.body_condition),
        parity_count: parseInt(formData.parity_count) || 0,
        total_piglets_born: parseInt(formData.total_piglets_born) || 0,
        total_piglets_alive: parseInt(formData.total_piglets_alive) || 0,
        total_piglets_dead: parseInt(formData.total_piglets_dead) || 0,
        total_abortions: parseInt(formData.total_abortions) || 0
      };

      console.log('Datos a enviar:', { ...dataToSend, photo_url: dataToSend.photo_url ? 'IMAGE_DATA' : 'null' });
      
      if (isEditMode) {
        // Modo edición - actualizar cerda existente
        await pigService.updateSow(id, dataToSend);
        
        toast({
          title: "¡Éxito!",
          description: "Cerda actualizada exitosamente",
          variant: "default"
        });
      } else {
        // Modo creación - crear nueva cerda
        await pigService.createSow(dataToSend);
        
        toast({
          title: "¡Éxito!",
          description: "Cerda registrada exitosamente",
          variant: "default"
        });
      }
      
      // Redirigir a la lista de reproductoras
      setTimeout(() => {
        navigate("/sows/list");
      }, 1500);
      
    } catch (error) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'registrar'} cerda:`, error);
      
      let errorMessage = `No se pudo ${isEditMode ? 'actualizar' : 'registrar'} la cerda`;
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: `Error al ${isEditMode ? 'actualizar' : 'registrar'}`,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar selector de tipo de animal (solo en modo creación)
  if (!animalType && !isEditMode) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/sows/list")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-gray-900">
                Registro de Animal
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Selecciona el tipo de animal que deseas registrar
              </CardDescription>
            </CardHeader>
            
            <CardContent className="grid md:grid-cols-2 gap-6 pb-8">
              {/* Opción Cerda */}
              <button
                onClick={() => setAnimalType("cerda")}
                className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-pink-500 hover:shadow-2xl"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="rounded-full bg-pink-100 p-6 transition-colors group-hover:bg-pink-500">
                    <PiggyBank className="h-16 w-16 text-pink-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Cerda</h3>
                  <p className="text-center text-gray-600">
                    Registrar una cerda reproductora con todos sus datos productivos
                  </p>
                </div>
              </button>
              
              {/* Opción Verraco */}
              <button
                onClick={() => navigate("/boars/register")}
                className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-blue-500 hover:shadow-2xl"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="rounded-full bg-blue-100 p-6 transition-colors group-hover:bg-blue-500">
                    <PiggyBank className="h-16 w-16 text-blue-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Verraco</h3>
                  <p className="text-center text-gray-600">
                    Registrar un verraco reproductor con todos sus datos
                  </p>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Formulario de registro de cerda
  return (
    <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => isEditMode ? navigate("/sows/list") : setAnimalType("")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isEditMode ? "Volver a la lista" : "Cambiar tipo de animal"}
        </Button>
        
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
            <div className="flex items-center space-x-3">
              <PiggyBank className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">
                  {isEditMode ? "Editar Cerda" : "Registro de Cerda"}
                </CardTitle>
                <CardDescription className="text-pink-100">
                  {isEditMode 
                    ? "Modifica los campos que deseas actualizar. El arete no se puede modificar." 
                    : "Completa todos los campos obligatorios (*) para registrar una nueva cerda"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando datos de la cerda...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
              {/* Sección 1: Identificación */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-pink-200">
                  Datos de Identificación
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="ear_tag" className="text-sm font-semibold">
                      Arete / Tag * <span className="text-xs text-gray-500">(Ej: A001, TAG-123)</span>
                    </Label>
                    <Input
                      id="ear_tag"
                      value={formData.ear_tag}
                      onChange={(e) => handleInputChange("ear_tag", e.target.value.toUpperCase())}
                      placeholder="A001"
                      className={`${errors.ear_tag ? "border-red-500" : ""} ${isEditMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      disabled={isEditMode}
                      required
                    />
                    {errors.ear_tag && <p className="text-xs text-red-500 mt-1">{errors.ear_tag}</p>}
                    {isEditMode && <p className="text-xs text-gray-500 mt-1">El arete no se puede modificar</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="id_type" className="text-sm font-semibold">
                      Tipo de Identificación *
                    </Label>
                    <Select value={formData.id_type} onValueChange={(value) => handleInputChange("id_type", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arete">Arete</SelectItem>
                        <SelectItem value="tatuaje">Tatuaje</SelectItem>
                        <SelectItem value="rfid">RFID</SelectItem>
                        <SelectItem value="crotal">Crotal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="alias" className="text-sm font-semibold">
                      Alias/Apodo <span className="text-xs text-gray-500">(Opcional - Ej: Princesa)</span>
                    </Label>
                    <Input
                      id="alias"
                      value={formData.alias}
                      onChange={(e) => handleInputChange("alias", e.target.value)}
                      placeholder="Princesa"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Genética */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-pink-200">
                  Información Genética
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="breed" className="text-sm font-semibold">
                      Raza *
                    </Label>
                    <Select value={formData.breed} onValueChange={(value) => handleInputChange("breed", value)}>
                      <SelectTrigger className={errors.breed ? "border-red-500" : ""}>
                        <SelectValue placeholder="Seleccionar raza" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Large White">Large White</SelectItem>
                        <SelectItem value="Landrace">Landrace</SelectItem>
                        <SelectItem value="Duroc">Duroc</SelectItem>
                        <SelectItem value="Pietrain">Pietrain</SelectItem>
                        <SelectItem value="Hampshire">Hampshire</SelectItem>
                        <SelectItem value="Yorkshire">Yorkshire</SelectItem>
                        <SelectItem value="F1">F1 (Híbrido)</SelectItem>
                        <SelectItem value="F2">F2 (Híbrido)</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.breed && <p className="text-xs text-red-500 mt-1">{errors.breed}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="genetic_line" className="text-sm font-semibold">
                      Línea Genética <span className="text-xs text-gray-500">(Opcional)</span>
                    </Label>
                    <Input
                      id="genetic_line"
                      value={formData.genetic_line}
                      onChange={(e) => handleInputChange("genetic_line", e.target.value)}
                      placeholder="L50"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="generation" className="text-sm font-semibold">
                      Generación <span className="text-xs text-gray-500">(Opcional - Ej: F1, F2)</span>
                    </Label>
                    <Input
                      id="generation"
                      value={formData.generation}
                      onChange={(e) => handleInputChange("generation", e.target.value)}
                      placeholder="F1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sire_tag" className="text-sm font-semibold">
                      Arete del Padre <span className="text-xs text-gray-500">(Opcional)</span>
                    </Label>
                    <Input
                      id="sire_tag"
                      value={formData.sire_tag}
                      onChange={(e) => handleInputChange("sire_tag", e.target.value.toUpperCase())}
                      placeholder="P001"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dam_tag" className="text-sm font-semibold">
                      Arete de la Madre <span className="text-xs text-gray-500">(Opcional)</span>
                    </Label>
                    <Input
                      id="dam_tag"
                      value={formData.dam_tag}
                      onChange={(e) => handleInputChange("dam_tag", e.target.value.toUpperCase())}
                      placeholder="M001"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Fechas y Ubicación */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-pink-200">
                  Fechas y Ubicación
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="birth_date" className="text-sm font-semibold">
                      Fecha de Nacimiento *
                    </Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => handleInputChange("birth_date", e.target.value)}
                      className={errors.birth_date ? "border-red-500" : ""}
                      required
                    />
                    {errors.birth_date && <p className="text-xs text-red-500 mt-1">{errors.birth_date}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="entry_date" className="text-sm font-semibold">
                      Fecha de Entrada a la Granja *
                    </Label>
                    <Input
                      id="entry_date"
                      type="date"
                      value={formData.entry_date}
                      onChange={(e) => handleInputChange("entry_date", e.target.value)}
                      className={errors.entry_date ? "border-red-500" : ""}
                      required
                    />
                    {errors.entry_date && <p className="text-xs text-red-500 mt-1">{errors.entry_date}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="origin" className="text-sm font-semibold">
                      Origen *
                    </Label>
                    <Select value={formData.origin} onValueChange={(value) => handleInputChange("origin", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="propia">Propia</SelectItem>
                        <SelectItem value="comprada">Comprada</SelectItem>
                        <SelectItem value="intercambio genetico">Intercambio Genético</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="farm_name" className="text-sm font-semibold">
                      Nombre de la Granja * <span className="text-xs text-gray-500">(Ej: Granja San José)</span>
                    </Label>
                    <Input
                      id="farm_name"
                      value={formData.farm_name}
                      onChange={(e) => handleInputChange("farm_name", e.target.value)}
                      placeholder="Granja San José"
                      className={errors.farm_name ? "border-red-500" : ""}
                      required
                    />
                    {errors.farm_name && <p className="text-xs text-red-500 mt-1">{errors.farm_name}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="location" className="text-sm font-semibold">
                      Ubicación/Corral <span className="text-xs text-gray-500">(Opcional - Ej: Corral 3)</span>
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="Corral 3"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="status" className="text-sm font-semibold">
                      Estado General *
                    </Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activa">Activa</SelectItem>
                        <SelectItem value="descartada">Descartada</SelectItem>
                        <SelectItem value="muerta">Muerta</SelectItem>
                        <SelectItem value="vendida">Vendida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Sección 4: Datos Físicos */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-pink-200">
                  Datos Físicos
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <Label htmlFor="current_weight" className="text-sm font-semibold">
                      Peso Actual (kg) * <span className="text-xs text-gray-500">(Ej: 150.5)</span>
                    </Label>
                    <Input
                      id="current_weight"
                      type="number"
                      step="0.1"
                      value={formData.current_weight}
                      onChange={(e) => handleInputChange("current_weight", e.target.value)}
                      placeholder="150.5"
                      className={errors.current_weight ? "border-red-500" : ""}
                      required
                    />
                    {errors.current_weight && <p className="text-xs text-red-500 mt-1">{errors.current_weight}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="min_service_weight" className="text-sm font-semibold">
                      Peso Mínimo de Servicio (kg) <span className="text-xs text-gray-500">(Default: 120)</span>
                    </Label>
                    <Input
                      id="min_service_weight"
                      type="number"
                      step="0.1"
                      value={formData.min_service_weight}
                      onChange={(e) => handleInputChange("min_service_weight", e.target.value)}
                      placeholder="120"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="body_condition" className="text-sm font-semibold">
                      Condición Corporal (1-5) * <span className="text-xs text-gray-500">(Ej: 3.5)</span>
                    </Label>
                    <Input
                      id="body_condition"
                      type="number"
                      step="0.5"
                      min="1"
                      max="5"
                      value={formData.body_condition}
                      onChange={(e) => handleInputChange("body_condition", e.target.value)}
                      placeholder="3.5"
                      className={errors.body_condition ? "border-red-500" : ""}
                      required
                    />
                    {errors.body_condition && <p className="text-xs text-red-500 mt-1">{errors.body_condition}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="last_weight_date" className="text-sm font-semibold">
                      Fecha del Último Pesaje <span className="text-xs text-gray-500">(Opcional)</span>
                    </Label>
                    <Input
                      id="last_weight_date"
                      type="date"
                      value={formData.last_weight_date}
                      onChange={(e) => handleInputChange("last_weight_date", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Sección 5: Datos Reproductivos */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-pink-200">
                  Datos Reproductivos <span className="text-sm text-gray-500 font-normal">(Todos opcionales)</span>
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <Label htmlFor="reproductive_status" className="text-sm font-semibold">
                      Estado Reproductivo
                    </Label>
                    <Select value={formData.reproductive_status} onValueChange={(value) => handleInputChange("reproductive_status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vacia">Vacía</SelectItem>
                        <SelectItem value="gestante">Gestante</SelectItem>
                        <SelectItem value="en celo">En Celo</SelectItem>
                        <SelectItem value="lactante">Lactante</SelectItem>
                        <SelectItem value="en servicio">En Servicio</SelectItem>
                        <SelectItem value="abortada">Abortada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="parity_count" className="text-sm font-semibold">
                      Número de Partos <span className="text-xs text-gray-500">(Default: 0)</span>
                    </Label>
                    <Input
                      id="parity_count"
                      type="number"
                      min="0"
                      value={formData.parity_count}
                      onChange={(e) => handleInputChange("parity_count", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="total_piglets_born" className="text-sm font-semibold">
                      Total Lechones Nacidos
                    </Label>
                    <Input
                      id="total_piglets_born"
                      type="number"
                      min="0"
                      value={formData.total_piglets_born}
                      onChange={(e) => handleInputChange("total_piglets_born", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="total_piglets_alive" className="text-sm font-semibold">
                      Total Lechones Vivos
                    </Label>
                    <Input
                      id="total_piglets_alive"
                      type="number"
                      min="0"
                      value={formData.total_piglets_alive}
                      onChange={(e) => handleInputChange("total_piglets_alive", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="total_piglets_dead" className="text-sm font-semibold">
                      Total Lechones Muertos
                    </Label>
                    <Input
                      id="total_piglets_dead"
                      type="number"
                      min="0"
                      value={formData.total_piglets_dead}
                      onChange={(e) => handleInputChange("total_piglets_dead", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="total_abortions" className="text-sm font-semibold">
                      Total Abortos
                    </Label>
                    <Input
                      id="total_abortions"
                      type="number"
                      min="0"
                      value={formData.total_abortions}
                      onChange={(e) => handleInputChange("total_abortions", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="avg_piglets_alive" className="text-sm font-semibold">
                      Promedio Lechones Vivos <span className="text-xs text-gray-500">(Ej: 10.5)</span>
                    </Label>
                    <Input
                      id="avg_piglets_alive"
                      type="number"
                      step="0.1"
                      value={formData.avg_piglets_alive}
                      onChange={(e) => handleInputChange("avg_piglets_alive", e.target.value)}
                      placeholder="10.5"
                    />
                  </div>
                </div>
                
                {/* Fechas reproductivas */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                  <div>
                    <Label htmlFor="last_service_date" className="text-sm font-semibold">
                      Fecha Último Servicio
                    </Label>
                    <Input
                      id="last_service_date"
                      type="date"
                      value={formData.last_service_date}
                      onChange={(e) => handleInputChange("last_service_date", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="last_parturition_date" className="text-sm font-semibold">
                      Fecha Último Parto
                    </Label>
                    <Input
                      id="last_parturition_date"
                      type="date"
                      value={formData.last_parturition_date}
                      onChange={(e) => handleInputChange("last_parturition_date", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="expected_farrowing_date" className="text-sm font-semibold">
                      Fecha Probable de Parto
                    </Label>
                    <Input
                      id="expected_farrowing_date"
                      type="date"
                      value={formData.expected_farrowing_date}
                      onChange={(e) => handleInputChange("expected_farrowing_date", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="last_weaning_date" className="text-sm font-semibold">
                      Fecha Último Destete
                    </Label>
                    <Input
                      id="last_weaning_date"
                      type="date"
                      value={formData.last_weaning_date}
                      onChange={(e) => handleInputChange("last_weaning_date", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Sección 6: Foto */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-pink-200">
                  Foto de la Cerda
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    {/* Preview de la imagen */}
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-64 h-64 object-cover rounded-lg border-4 border-pink-200 shadow-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-64 h-64 border-4 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                        <ImageIcon className="h-16 w-16 text-gray-400 mb-4" />
                        <p className="text-sm text-gray-500 text-center px-4">
                          No se ha seleccionado ninguna imagen
                        </p>
                      </div>
                    )}
                    
                    {/* Botón para seleccionar imagen */}
                    <div className="mt-6">
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Label htmlFor="photo-upload">
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer"
                          disabled={isUploadingImage}
                          asChild
                        >
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploadingImage ? "Subiendo..." : "Seleccionar Imagen"}
                          </span>
                        </Button>
                      </Label>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Formatos permitidos: JPEG, JPG, PNG (Máx. 5MB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/sows/list")}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-pink-600 hover:bg-pink-700 text-gray-50"
                >
                  {isLoading ? (isEditMode ? "Actualizando..." : "Registrando...") : (isEditMode ? "Actualizar Cerda" : "Registrar Cerda")}
                </Button>
              </div>
            </form>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
