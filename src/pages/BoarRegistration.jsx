import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { pigService } from "@/services/api";
import { ArrowLeft, PiggyBank, Upload, X, Image as ImageIcon } from "lucide-react";

export default function BoarRegistration() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  
  const isEditMode = !!id;
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [_imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Estado del formulario de verraco
  const [formData, setFormData] = useState({
    // Datos básicos obligatorios
    ear_tag: "",
    id_type: "arete",
    name: "",
    breed: "",
    genetic_line: "",
    generation: "",
    sire_ear_tag: "",
    dam_ear_tag: "",
    
    // Tipo de verraco
    boar_type: "fisico",
    
    // Para verracos físicos
    birth_date: "",
    entry_date: "",
    origin: "propio",
    status: "activo",
    location: "",
    farm_name: "",
    current_weight: "",
    
    // Para semen comprado
    supplier_name: "",
    supplier_code: "",
    
    // Datos adicionales
    total_services: "0",
    last_service_date: "",
    notes: "",
    photo_url: ""
  });

  const [errors, setErrors] = useState({});

  // Cargar datos del verraco si estamos en modo edición
  useEffect(() => {
    if (id) {
      loadBoarData(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadBoarData = async (boarId) => {
    try {
      setIsLoadingData(true);
      const boar = await pigService.getBoarById(boarId);
      
      // Verificar que no esté descartado
      if (boar.status === 'descartado') {
        toast({
          title: "No permitido",
          description: "No se puede editar un verraco descartado. El descarte es un estado final.",
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
        ear_tag: boar.ear_tag || "",
        id_type: boar.id_type || "arete",
        name: boar.name || "",
        breed: boar.breed || "",
        genetic_line: boar.genetic_line || "",
        generation: boar.generation?.toString() || "",
        sire_ear_tag: boar.sire_ear_tag || "",
        dam_ear_tag: boar.dam_ear_tag || "",
        birth_date: formatDateForInput(boar.birth_date),
        entry_date: formatDateForInput(boar.entry_date),
        origin: boar.origin || "propio",
        status: boar.status || "activo",
        location: boar.location || "",
        farm_name: boar.farm_name || "",
        current_weight: boar.current_weight?.toString() || "",
        boar_type: boar.boar_type || "fisico",
        supplier_name: boar.supplier_name || "",
        supplier_code: boar.supplier_code || "",
        notes: boar.notes || "",
        photo_url: boar.photo_url || "",
        total_services: boar.total_services?.toString() || "0",
        last_service_date: formatDateForInput(boar.last_service_date)
      });

      // Si hay imagen, cargarla como preview
      if (boar.photo_url) {
        setImagePreview(boar.photo_url);
      }
    } catch (error) {
      console.error("Error cargando datos del verraco:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del verraco",
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
    const maxSize = 5 * 1024 * 1024;
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
    
    // Guardar archivo y subir al servidor
    setImageFile(file);
    await uploadImageToServer(file);
  };

  // Subir imagen al servidor
  const uploadImageToServer = async (file) => {
    setIsUploadingImage(true);
    try {
      const photoUrl = await pigService.uploadPhoto(file);
      
      if (photoUrl) {
        handleInputChange("photo_url", photoUrl);
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
      
      setImagePreview(null);
      setImageFile(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remover imagen
  const handleRemoveImage = () => {
    setImageFile(null);
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
    
    // Campos obligatorios comunes
    if (!formData.ear_tag.trim()) newErrors.ear_tag = "El arete es obligatorio";
    if (!formData.breed.trim()) newErrors.breed = "La raza es obligatoria";
    if (!formData.boar_type) newErrors.boar_type = "El tipo de verraco es obligatorio";
    
    // Validaciones específicas por tipo
    if (formData.boar_type === 'fisico') {
      if (!formData.birth_date) newErrors.birth_date = "La fecha de nacimiento es obligatoria";
      if (!formData.entry_date) newErrors.entry_date = "La fecha de entrada es obligatoria";
      if (!formData.farm_name.trim()) newErrors.farm_name = "El nombre de la granja es obligatorio";
      
      // Validar fechas
      if (formData.birth_date && formData.entry_date) {
        const birthDate = new Date(formData.birth_date);
        const entryDate = new Date(formData.entry_date);
        
        if (entryDate < birthDate) {
          newErrors.entry_date = "La fecha de entrada no puede ser anterior a la fecha de nacimiento";
        }
      }
      
      // Validar peso si está presente
      if (formData.current_weight && parseFloat(formData.current_weight) <= 0) {
        newErrors.current_weight = "El peso debe ser mayor a 0";
      }
    } else if (formData.boar_type === 'semen comprado') {
      if (!formData.supplier_name.trim()) newErrors.supplier_name = "El nombre del proveedor es obligatorio";
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
      // Preparar datos según el tipo de verraco
      const dataToSend = {
        ear_tag: formData.ear_tag.trim(),
        id_type: formData.id_type,
        name: formData.name.trim() || null,
        breed: formData.breed,
        genetic_line: formData.genetic_line.trim() || null,
        generation: formData.generation || null,
        sire_ear_tag: formData.sire_ear_tag.trim() || null,
        dam_ear_tag: formData.dam_ear_tag.trim() || null,
        boar_type: formData.boar_type,
        notes: formData.notes.trim() || null,
        photo_url: formData.photo_url || null,
        total_services: parseInt(formData.total_services) || 0,
        last_service_date: formData.last_service_date || null
      };

      // Campos específicos para verracos físicos
      if (formData.boar_type === 'fisico') {
        dataToSend.birth_date = formData.birth_date;
        dataToSend.entry_date = formData.entry_date;
        dataToSend.origin = formData.origin;
        dataToSend.status = formData.status;
        dataToSend.location = formData.location.trim() || null;
        dataToSend.farm_name = formData.farm_name.trim();
        dataToSend.current_weight = formData.current_weight ? parseFloat(formData.current_weight) : null;
      }

      // Campos específicos para semen comprado
      if (formData.boar_type === 'semen comprado') {
        dataToSend.supplier_name = formData.supplier_name.trim();
        dataToSend.supplier_code = formData.supplier_code.trim() || null;
        // Limpiar campos que no aplican para semen comprado
        dataToSend.birth_date = null;
        dataToSend.entry_date = null;
        dataToSend.status = null;
        dataToSend.location = null;
        dataToSend.farm_name = null;
        dataToSend.current_weight = null;
      }
      
      if (isEditMode) {
        // Modo edición - actualizar verraco existente
        await pigService.updateBoar(id, dataToSend);
        
        toast({
          title: "¡Éxito!",
          description: "Verraco actualizado exitosamente",
          variant: "default"
        });
      } else {
        // Modo creación - crear nuevo verraco
        await pigService.createBoar(dataToSend);
        
        toast({
          title: "¡Éxito!",
          description: "Verraco registrado exitosamente",
          variant: "default"
        });
      }
      
      // Redirigir a la lista de reproductoras
      setTimeout(() => {
        navigate("/sows/list");
      }, 1500);
      
    } catch (error) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'registrar'} verraco:`, error);
      
      let errorMessage = `No se pudo ${isEditMode ? 'actualizar' : 'registrar'} el verraco`;
      
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

  // Renderizar formulario
  return (
    <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/sows/list")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la lista
        </Button>
        
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center space-x-3">
              <PiggyBank className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">
                  {isEditMode ? "Editar Verraco" : "Registro de Verraco"}
                </CardTitle>
                <CardDescription className="text-blue-100">
                  {isEditMode 
                    ? "Modifica los campos que deseas actualizar. El arete no se puede modificar." 
                    : "Completa todos los campos obligatorios (*) para registrar un nuevo verraco"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando datos del verraco...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
              {/* Sección 1: Tipo de Verraco */}
              <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-200">
                  Tipo de Verraco
                </h3>
                <div className="grid md:grid-cols-1 gap-6">
                  <div>
                    <Label htmlFor="boar_type" className="text-sm font-semibold">
                      Tipo de Verraco *
                    </Label>
                    <Select value={formData.boar_type} onValueChange={(value) => handleInputChange("boar_type", value)} disabled={isEditMode}>
                      <SelectTrigger className={`${errors.boar_type ? "border-red-500" : ""} ${isEditMode ? "bg-gray-100 cursor-not-allowed" : ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fisico">Verraco Físico</SelectItem>
                        <SelectItem value="semen comprado">Semen Comprado</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.boar_type && <p className="text-xs text-red-500 mt-1">{errors.boar_type}</p>}
                    {isEditMode && <p className="text-xs text-gray-500 mt-1">El tipo de verraco no se puede modificar</p>}
                    {!isEditMode && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.boar_type === 'fisico' 
                          ? "Verraco presente físicamente en la granja" 
                          : "Semen adquirido de un proveedor externo"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección 2: Identificación */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-200">
                  Datos de Identificación
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="ear_tag" className="text-sm font-semibold">
                      Arete / Tag * <span className="text-xs text-gray-500">(Ej: V001, TAG-123)</span>
                    </Label>
                    <Input
                      id="ear_tag"
                      value={formData.ear_tag}
                      onChange={(e) => handleInputChange("ear_tag", e.target.value.toUpperCase())}
                      placeholder="V001"
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
                        <SelectItem value="virtual">Virtual (solo para semen)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold">
                      Nombre <span className="text-xs text-gray-500">(Opcional)</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Nombre del verraco"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Genética */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-200">
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
                      Generación <span className="text-xs text-gray-500">(Opcional - Ej: 1, 2, 3)</span>
                    </Label>
                    <Input
                      id="generation"
                      type="number"
                      value={formData.generation}
                      onChange={(e) => handleInputChange("generation", e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sire_ear_tag" className="text-sm font-semibold">
                      Arete del Padre <span className="text-xs text-gray-500">(Opcional)</span>
                    </Label>
                    <Input
                      id="sire_ear_tag"
                      value={formData.sire_ear_tag}
                      onChange={(e) => handleInputChange("sire_ear_tag", e.target.value.toUpperCase())}
                      placeholder="P001"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dam_ear_tag" className="text-sm font-semibold">
                      Arete de la Madre <span className="text-xs text-gray-500">(Opcional)</span>
                    </Label>
                    <Input
                      id="dam_ear_tag"
                      value={formData.dam_ear_tag}
                      onChange={(e) => handleInputChange("dam_ear_tag", e.target.value.toUpperCase())}
                      placeholder="M001"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 4: Datos específicos de Verraco Físico */}
              {formData.boar_type === 'fisico' && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-200">
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
                            <SelectItem value="propio">Propio</SelectItem>
                            <SelectItem value="comprado">Comprado</SelectItem>
                            <SelectItem value="centro genetico">Centro Genético</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="farm_name" className="text-sm font-semibold">
                          Nombre de la Granja *
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
                          Ubicación/Corral <span className="text-xs text-gray-500">(Opcional)</span>
                        </Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => handleInputChange("location", e.target.value)}
                          placeholder="Corral 1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="status" className="text-sm font-semibold">
                          Estado *
                        </Label>
                        <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="descanso">En Descanso</SelectItem>
                            <SelectItem value="descartado">Descartado</SelectItem>
                            <SelectItem value="muerto">Muerto</SelectItem>
                            <SelectItem value="vendido">Vendido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-200">
                        Datos Físicos
                      </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="current_weight" className="text-sm font-semibold">
                          Peso Actual (kg) <span className="text-xs text-gray-500">(Opcional)</span>
                        </Label>
                        <Input
                          id="current_weight"
                          type="number"
                          step="0.1"
                          value={formData.current_weight}
                          onChange={(e) => handleInputChange("current_weight", e.target.value)}
                          placeholder="250.5"
                          className={errors.current_weight ? "border-red-500" : ""}
                        />
                        {errors.current_weight && <p className="text-xs text-red-500 mt-1">{errors.current_weight}</p>}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Sección 5: Datos de Semen Comprado */}
              {formData.boar_type === 'semen comprado' && (
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-200">
                    Datos del Proveedor
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="supplier_name" className="text-sm font-semibold">
                        Nombre del Proveedor *
                      </Label>
                      <Input
                        id="supplier_name"
                        value={formData.supplier_name}
                        onChange={(e) => handleInputChange("supplier_name", e.target.value)}
                        placeholder="Genética Porcina S.A."
                        className={errors.supplier_name ? "border-red-500" : ""}
                        required={formData.boar_type === 'semen comprado'}
                      />
                      {errors.supplier_name && <p className="text-xs text-red-500 mt-1">{errors.supplier_name}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="supplier_code" className="text-sm font-semibold">
                        Código del Proveedor <span className="text-xs text-gray-500">(Opcional)</span>
                      </Label>
                      <Input
                        id="supplier_code"
                        value={formData.supplier_code}
                        onChange={(e) => handleInputChange("supplier_code", e.target.value)}
                        placeholder="GP-001"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sección 6: Observaciones */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-yellow-200">
                  Observaciones
                </h3>
                <div>
                  <Label htmlFor="notes" className="text-sm font-semibold">
                    Notas y Observaciones <span className="text-xs text-gray-500">(Opcional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Información adicional sobre el verraco..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Sección 7: Foto */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-200">
                  Foto del Verraco
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-64 h-64 object-cover rounded-lg border-4 border-blue-200 shadow-lg"
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (isEditMode ? "Actualizando..." : "Registrando...") : (isEditMode ? "Actualizar Verraco" : "Registrar Verraco")}
                </Button>
              </div>
            </form>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
