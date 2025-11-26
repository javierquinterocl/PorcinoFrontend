import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { pigletService, birthService, pigService } from "@/services/api";
import { ArrowLeft, Baby, CheckCircle2, AlertCircle } from "lucide-react";

export default function PigletRegistration() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  
  const isEditMode = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [births, setBirths] = useState([]);
  const [sows, setSows] = useState([]);
  const [selectedBirth, setSelectedBirth] = useState(null);
  const [pigletsCount, setPigletsCount] = useState(0);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    // IDs obligatorios
    birth_id: "",
    sow_id: "",
    sire_id: "",
    
    // Identificación
    ear_tag: "",
    temporary_id: "",
    
    // Datos al nacimiento (obligatorios)
    birth_order: "",
    sex: "",
    birth_weight: "",
    birth_status: "vivo",
    current_status: "lactante",
    
    // Peso actual
    current_weight: "",
    
    // Adopción/transferencia
    adoptive_sow_id: "",
    adoption_date: "",
    adoption_reason: "",
    
    // Destete
    weaning_date: "",
    weaning_weight: "",
    weaning_age_days: "",
    
    // Muerte (si aplica)
    death_date: "",
    death_age_days: "",
    death_cause: "",
    
    // Otros
    special_care: false,
    notes: ""
  });

  const [errors, setErrors] = useState({});

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
    if (id) {
      loadPigletData(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      const [birthsData, sowsData] = await Promise.all([
        birthService.getAllBirths(),
        pigService.getAllSows()
      ]);
      
      // Ordenar partos por fecha más reciente
      const sortedBirths = Array.isArray(birthsData) 
        ? birthsData.sort((a, b) => new Date(b.birth_date) - new Date(a.birth_date))
        : [];
      
      const activeSows = sowsData.filter(s => s.status === 'activa');
      
      setBirths(sortedBirths);
      setSows(activeSows);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos necesarios",
        variant: "destructive"
      });
    }
  };

  const loadPigletData = async (pigletId) => {
    try {
      setIsLoadingData(true);
      const piglet = await pigletService.getPigletById(pigletId);
      
      // Cargar datos en el formulario
      setFormData({
        birth_id: piglet.birth_id?.toString() || "",
        sow_id: piglet.sow_id?.toString() || "",
        sire_id: piglet.sire_id?.toString() || "",
        ear_tag: piglet.ear_tag || "",
        temporary_id: piglet.temporary_id || "",
        birth_order: piglet.birth_order?.toString() || "",
        sex: piglet.sex || "",
        birth_weight: piglet.birth_weight?.toString() || "",
        birth_status: piglet.birth_status || "vivo",
        current_status: piglet.current_status || "lactante",
        current_weight: piglet.current_weight?.toString() || "",
        adoptive_sow_id: piglet.adoptive_sow_id?.toString() || "",
        adoption_date: piglet.adoption_date?.split('T')[0] || "",
        adoption_reason: piglet.adoption_reason || "",
        weaning_date: piglet.weaning_date?.split('T')[0] || "",
        weaning_weight: piglet.weaning_weight?.toString() || "",
        weaning_age_days: piglet.weaning_age_days?.toString() || "",
        death_date: piglet.death_date?.split('T')[0] || "",
        death_age_days: piglet.death_age_days?.toString() || "",
        death_cause: piglet.death_cause || "",
        special_care: piglet.special_care || false,
        notes: piglet.notes || ""
      });

      // Cargar información del parto
      if (piglet.birth_id) {
        const birth = await birthService.getBirthById(piglet.birth_id);
        setSelectedBirth(birth);
      }
    } catch (error) {
      console.error("Error cargando datos del lechón:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del lechón",
        variant: "destructive"
      });
      navigate("/sows/list");
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

    // Si se selecciona un parto, autocompletar datos relacionados
    if (field === 'birth_id' && value) {
      const birth = births.find(b => b.id === parseInt(value));
      if (birth) {
        setSelectedBirth(birth);
        
        // Autocompletar cerda y verraco del parto
        setFormData(prev => ({
          ...prev,
          sow_id: birth.sow_id?.toString() || "",
          sire_id: birth.boar_id?.toString() || ""
        }));
        
        // Obtener cantidad de lechones ya registrados para este parto
        pigletService.getByBirthId(parseInt(value))
          .then(piglets => {
            setPigletsCount(piglets.length || 0);
          })
          .catch(err => {
            console.error("Error obteniendo lechones del parto:", err);
            setPigletsCount(0);
          });
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
    if (!formData.birth_id) newErrors.birth_id = "Seleccione un parto";
    if (!formData.sex) newErrors.sex = "El sexo es obligatorio";
    
    // Validar que no se exceda el número de lechones del parto (solo en modo creación)
    if (!isEditMode && selectedBirth && pigletsCount >= selectedBirth.total_born) {
      newErrors.birth_id = `No se pueden registrar más lechones. Este parto tiene ${selectedBirth.total_born} lechones y ya hay ${pigletsCount} registrados.`;
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
        birth_id: parseInt(formData.birth_id),
        sow_id: parseInt(formData.sow_id),
        sire_id: parseInt(formData.sire_id),
        ear_tag: formData.ear_tag || null,
        temporary_id: formData.temporary_id || null,
        birth_order: formData.birth_order ? parseInt(formData.birth_order) : null,
        sex: formData.sex,
        birth_weight: formData.birth_weight ? parseFloat(formData.birth_weight) : null,
        birth_status: formData.birth_status || "vivo",
        current_status: formData.current_status || "lactante",
        current_weight: formData.current_weight ? parseFloat(formData.current_weight) : null,
        adoptive_sow_id: formData.adoptive_sow_id ? parseInt(formData.adoptive_sow_id) : null,
        adoption_date: formData.adoption_date || null,
        adoption_reason: formData.adoption_reason || null,
        weaning_date: formData.weaning_date || null,
        weaning_weight: formData.weaning_weight ? parseFloat(formData.weaning_weight) : null,
        weaning_age_days: formData.weaning_age_days ? parseInt(formData.weaning_age_days) : null,
        death_date: formData.death_date || null,
        death_age_days: formData.death_age_days ? parseInt(formData.death_age_days) : null,
        death_cause: formData.death_cause || null,
        special_care: formData.special_care || false,
        notes: formData.notes || null
      };

      // Limpiar campos vacíos
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === "" || dataToSend[key] === undefined) {
          dataToSend[key] = null;
        }
      });

      if (isEditMode) {
        await pigletService.updatePiglet(id, dataToSend);
        toast({
          title: "¡Éxito!",
          description: "Lechón actualizado correctamente",
          className: "bg-green-50 border-green-200"
        });
      } else {
        await pigletService.createPiglet(dataToSend);
        toast({
          title: "¡Éxito!",
          description: "Lechón registrado correctamente",
          className: "bg-green-50 border-green-200"
        });
      }
      
      navigate("/sows/list");
    } catch (error) {
      console.error("Error al guardar lechón:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo guardar el lechón",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Cargando datos del lechón...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/sows/list")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-blue-500 flex items-center justify-center">
              <Baby className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditMode ? "Editar Lechón" : "Registrar Nuevo Lechón"}
              </h1>
              <p className="text-sm text-gray-600">
                Complete los datos del lechón
              </p>
            </div>
          </div>
        </div>

        {/* Alerta informativa */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="flex items-start gap-3 pt-4">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <strong>Flujo del módulo:</strong> Seleccione el parto al que pertenece el lechón. 
              Los datos de la madre y padre se autocompletarán desde el parto seleccionado.
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección 1: Identificación del Parto */}
          <Card>
            <CardHeader>
              <CardTitle>Identificación del Parto</CardTitle>
              <CardDescription>Seleccione el parto al que pertenece el lechón</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Parto */}
                <div className="space-y-2">
                  <Label htmlFor="birth_id">
                    Parto <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.birth_id}
                    onValueChange={(value) => handleInputChange("birth_id", value)}
                    disabled={isEditMode}
                  >
                    <SelectTrigger className={errors.birth_id ? "border-red-500" : ""}>
                      <SelectValue placeholder={births.length === 0 ? "No hay partos registrados" : "Seleccione un parto"} />
                    </SelectTrigger>
                    <SelectContent>
                      {births.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No hay partos disponibles
                        </div>
                      ) : (
                        births.map(birth => (
                          <SelectItem key={birth.id} value={birth.id.toString()}>
                            Parto #{birth.id} - Cerda: {birth.sow_ear_tag} - Fecha: {new Date(birth.birth_date).toLocaleDateString()}
                            {birth.total_born && ` - ${birth.total_born} lechones`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.birth_id && <p className="text-sm text-red-500">{errors.birth_id}</p>}
                  
                  {/* Indicador de lechones registrados */}
                  {selectedBirth && !isEditMode && (
                    <div className={`mt-2 p-3 rounded-lg border ${
                      pigletsCount >= selectedBirth.total_born 
                        ? 'bg-red-50 border-red-200' 
                        : pigletsCount >= selectedBirth.total_born * 0.8 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        pigletsCount >= selectedBirth.total_born 
                          ? 'text-red-700' 
                          : pigletsCount >= selectedBirth.total_born * 0.8 
                          ? 'text-yellow-700' 
                          : 'text-green-700'
                      }`}>
                        Lechones registrados: {pigletsCount} de {selectedBirth.total_born}
                      </p>
                      {pigletsCount < selectedBirth.total_born ? (
                        <p className="text-xs text-gray-600 mt-1">
                          Puede registrar {selectedBirth.total_born - pigletsCount} lechón(es) más
                        </p>
                      ) : (
                        <p className="text-xs text-red-600 mt-1">
                          ⚠️ Ya se registraron todos los lechones de este parto
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Información del parto seleccionado */}
                {selectedBirth && (
                  <div className="space-y-2">
                    <Label>Información del Parto</Label>
                    <div className="p-3 bg-gray-50 rounded-md text-sm space-y-1">
                      <p><strong>Madre:</strong> {selectedBirth.sow_ear_tag}</p>
                      <p><strong>Padre:</strong> {selectedBirth.boar_ear_tag}</p>
                      <p><strong>Fecha:</strong> {new Date(selectedBirth.birth_date).toLocaleDateString()}</p>
                      <p><strong>Nacidos:</strong> {selectedBirth.total_born} ({selectedBirth.born_alive} vivos)</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sección 2: Identificación del Lechón */}
          <Card>
            <CardHeader>
              <CardTitle>Identificación del Lechón</CardTitle>
              <CardDescription>Arete o identificación temporal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ear_tag">Arete</Label>
                  <Input
                    id="ear_tag"
                    value={formData.ear_tag}
                    onChange={(e) => handleInputChange("ear_tag", e.target.value)}
                    placeholder="Ej: L001"
                  />
                  <p className="text-xs text-gray-500">Opcional si aún no tiene arete</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temporary_id">ID Temporal</Label>
                  <Input
                    id="temporary_id"
                    value={formData.temporary_id}
                    onChange={(e) => handleInputChange("temporary_id", e.target.value)}
                    placeholder="Ej: C1-1 (Camada 1, Lechón 1)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_order">Orden de Nacimiento</Label>
                  <Input
                    id="birth_order"
                    type="number"
                    min="1"
                    value={formData.birth_order}
                    onChange={(e) => handleInputChange("birth_order", e.target.value)}
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección 3: Datos al Nacimiento y Peso Actual */}
          <Card>
            <CardHeader>
              <CardTitle>Datos al Nacimiento y Peso Actual</CardTitle>
              <CardDescription>Información del lechón al momento de nacer y peso actual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="sex">
                    Sexo <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.sex}
                    onValueChange={(value) => handleInputChange("sex", value)}
                  >
                    <SelectTrigger className={errors.sex ? "border-red-500" : ""}>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="macho">♂ Macho</SelectItem>
                      <SelectItem value="hembra">♀ Hembra</SelectItem>
                      <SelectItem value="indefinido">Indefinido</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.sex && <p className="text-sm text-red-500">{errors.sex}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_status">Estado al Nacer</Label>
                  <Select
                    value={formData.birth_status}
                    onValueChange={(value) => handleInputChange("birth_status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vivo">Vivo</SelectItem>
                      <SelectItem value="muerto">Muerto</SelectItem>
                      <SelectItem value="momificado">Momificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birth_weight">Peso al Nacer (kg)</Label>
                  <Input
                    id="birth_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.birth_weight}
                    onChange={(e) => handleInputChange("birth_weight", e.target.value)}
                    placeholder="1.5"
                  />
                  <p className="text-xs text-gray-500">Peso al momento del nacimiento</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_weight">Peso Actual (kg)</Label>
                  <Input
                    id="current_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.current_weight}
                    onChange={(e) => handleInputChange("current_weight", e.target.value)}
                    placeholder="3.5"
                  />
                  <p className="text-xs text-gray-500">Peso actual del lechón</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_status">Estado Actual</Label>
                  <Select
                    value={formData.current_status}
                    onValueChange={(value) => handleInputChange("current_status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lactante">Lactante</SelectItem>
                      <SelectItem value="destetado">Destetado</SelectItem>
                      <SelectItem value="vendido">Vendido</SelectItem>
                      <SelectItem value="muerto">Muerto</SelectItem>
                      <SelectItem value="transferido">Transferido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección 4: Adopción/Transferencia (Opcional) */}
          <Card>
            <CardHeader>
              <CardTitle>Adopción/Transferencia (Opcional)</CardTitle>
              <CardDescription>Completar solo si el lechón fue adoptado por otra cerda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adoptive_sow_id">Cerda Adoptiva</Label>
                  <Select
                    value={formData.adoptive_sow_id || "none"}
                    onValueChange={(value) => handleInputChange("adoptive_sow_id", value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin adopción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin adopción</SelectItem>
                      {sows.map(sow => (
                        <SelectItem key={sow.id} value={sow.id.toString()}>
                          {sow.ear_tag} {sow.alias && `- ${sow.alias}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adoption_date">Fecha de Adopción</Label>
                  <Input
                    id="adoption_date"
                    type="date"
                    value={formData.adoption_date}
                    onChange={(e) => handleInputChange("adoption_date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adoption_reason">Motivo de Adopción</Label>
                  <Select
                    value={formData.adoption_reason || "none"}
                    onValueChange={(value) => handleInputChange("adoption_reason", value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin motivo</SelectItem>
                      <SelectItem value="exceso camada">Exceso de camada</SelectItem>
                      <SelectItem value="baja produccion leche">Baja producción de leche</SelectItem>
                      <SelectItem value="muerte madre">Muerte de la madre</SelectItem>
                      <SelectItem value="bajo peso">Bajo peso</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección 5: Destete (Opcional) */}
          <Card>
            <CardHeader>
              <CardTitle>Destete (Opcional)</CardTitle>
              <CardDescription>Completar cuando el lechón sea destetado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weaning_date">Fecha de Destete</Label>
                  <Input
                    id="weaning_date"
                    type="date"
                    value={formData.weaning_date}
                    onChange={(e) => handleInputChange("weaning_date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weaning_weight">Peso al Destete (kg)</Label>
                  <Input
                    id="weaning_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weaning_weight}
                    onChange={(e) => handleInputChange("weaning_weight", e.target.value)}
                    placeholder="5.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weaning_age_days">Edad al Destete (días)</Label>
                  <Input
                    id="weaning_age_days"
                    type="number"
                    min="0"
                    value={formData.weaning_age_days}
                    onChange={(e) => handleInputChange("weaning_age_days", e.target.value)}
                    placeholder="21"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección 6: Muerte (Opcional, solo si aplica) */}
          {formData.current_status === 'muerto' && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">Registro de Muerte</CardTitle>
                <CardDescription>Información sobre la muerte del lechón</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="death_date">Fecha de Muerte</Label>
                    <Input
                      id="death_date"
                      type="date"
                      value={formData.death_date}
                      onChange={(e) => handleInputChange("death_date", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="death_age_days">Edad al Morir (días)</Label>
                    <Input
                      id="death_age_days"
                      type="number"
                      min="0"
                      value={formData.death_age_days}
                      onChange={(e) => handleInputChange("death_age_days", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="death_cause">Causa de Muerte</Label>
                    <Input
                      id="death_cause"
                      value={formData.death_cause}
                      onChange={(e) => handleInputChange("death_cause", e.target.value)}
                      placeholder="Descripción de la causa"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sección 7: Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Observaciones Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="special_care"
                    checked={formData.special_care}
                    onChange={() => handleCheckboxChange("special_care")}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="special_care" className="cursor-pointer">
                    Requiere cuidados especiales
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Observaciones sobre el lechón, condiciones especiales, tratamientos, etc."
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex gap-4 justify-end">
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
              disabled={isLoading || births.length === 0}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {isLoading ? (
                "Guardando..."
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isEditMode ? "Actualizar Lechón" : "Registrar Lechón"}
                </>
              )}
            </Button>
          </div>
        </form>
    </div>
  );
}

