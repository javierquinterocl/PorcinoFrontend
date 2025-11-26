import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../components/ui/use-toast';
import { ArrowLeft, Save, Heart, Syringe } from 'lucide-react';
import { serviceService, sowService, boarService, heatService } from '../services/api';

const ServiceRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const [sows, setSows] = useState([]);
  const [boars, setBoars] = useState([]);
  const [heats, setHeats] = useState([]);
  const [currentHeat, setCurrentHeat] = useState(null); // Celo actual en modo edición
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    sow_id: '',
    boar_id: '',
    heat_id: '',
    service_date: '',
    service_time: '',
    service_type: 'monta natural',
    service_number: 1,
    technician_name: '',
    mating_duration_minutes: '',
    mating_quality: '',
    ia_type: '',
    ia_dose_code: '',
    ia_volume_ml: '',
    ia_concentration: '',
    success: true,
    notes: ''
  });

  useEffect(() => {
    loadData();
    if (isEdit) {
      loadService();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      const [sowsData, boarsData, heatsData] = await Promise.all([
        sowService.getAllSows({ status: 'activa' }),
        boarService.getAllBoars({ status: 'activo' }),
        heatService.getAllHeats({ status: 'detectado' })
      ]);
      setSows(sowsData);
      setBoars(boarsData);
      setHeats(heatsData);
    } catch (err) {
      console.error('Error loading data:', err);
      toast({
        title: "Error al cargar datos",
        description: "No se pudieron cargar las cerdas, verracos o celos disponibles",
        variant: "destructive"
      });
    }
  };

  const loadService = async () => {
    try {
      setLoading(true);
      const service = await serviceService.getServiceById(id);
      
      // Cargar el celo actual (aunque esté en estado "servido")
      if (service.heat_id) {
        try {
          const heat = await heatService.getHeatById(service.heat_id);
          setCurrentHeat(heat);
          
          // Agregar el celo actual a la lista si no está ya
          setHeats(prevHeats => {
            const heatExists = prevHeats.some(h => h.id === heat.id);
            if (!heatExists) {
              return [...prevHeats, heat];
            }
            return prevHeats;
          });
        } catch (heatErr) {
          console.error('Error loading heat:', heatErr);
        }
      }
      
      setFormData({
        sow_id: service.sow_id?.toString() || '',
        boar_id: service.boar_id?.toString() || '',
        heat_id: service.heat_id?.toString() || '',
        service_date: service.service_date ? service.service_date.split('T')[0] : '',
        service_time: service.service_time?.substring(0, 5) || '',
        service_type: service.service_type || 'monta natural',
        service_number: service.service_number || 1,
        technician_name: service.technician_name || '',
        mating_duration_minutes: service.mating_duration_minutes?.toString() || '',
        mating_quality: service.mating_quality || '',
        ia_type: service.ia_type || '',
        ia_dose_code: service.semen_dose_code || '',
        ia_volume_ml: service.semen_volume_ml?.toString() || '',
        ia_concentration: service.semen_concentration?.toString() || '',
        success: service.success !== false,
        notes: service.notes || ''
      });
    } catch (err) {
      console.error('Error loading service:', err);
      toast({
        title: "Error al cargar servicio",
        description: err.response?.data?.error || "No se pudo cargar la información del servicio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar datos según tipo de servicio
      const serviceData = {
        sow_id: parseInt(formData.sow_id),
        heat_id: parseInt(formData.heat_id),
        service_date: formData.service_date,
        service_time: formData.service_time,
        service_type: formData.service_type,
        service_number: parseInt(formData.service_number) || 1,
        boar_id: parseInt(formData.boar_id), // Verraco siempre obligatorio
        technician_name: formData.technician_name || null,
        success: formData.success,
        notes: formData.notes || null
      };

      if (formData.service_type === 'monta natural') {
        serviceData.mating_duration_minutes = formData.mating_duration_minutes ? parseInt(formData.mating_duration_minutes) : null;
        serviceData.mating_quality = (formData.mating_quality && formData.mating_quality !== 'none') ? formData.mating_quality : null;
      } else {
        serviceData.ia_type = (formData.ia_type && formData.ia_type !== 'none') ? formData.ia_type : null;
        serviceData.semen_dose_code = formData.ia_dose_code || null;
        serviceData.semen_volume_ml = formData.ia_volume_ml ? parseFloat(formData.ia_volume_ml) : null;
        serviceData.semen_concentration = formData.ia_concentration ? parseFloat(formData.ia_concentration) : null;
      }

      let response;
      if (isEdit) {
        response = await serviceService.updateService(id, serviceData);
        toast({
          title: "¡Éxito!",
          description: "Servicio actualizado correctamente",
          variant: "default"
        });
      } else {
        response = await serviceService.createService(serviceData);
        
        // Mostrar advertencias si existen
        if (response.warnings && response.warnings.length > 0) {
          toast({
            title: "⚠️ Servicio registrado con advertencias",
            description: response.warnings.join(". "),
            className: "bg-yellow-50 border-yellow-200",
            duration: 6000
          });
        } else {
          toast({
            title: "¡Éxito!",
            description: "Servicio registrado correctamente",
            variant: "default"
          });
        }
      }

      setTimeout(() => {
        navigate('/services');
      }, 1500);
    } catch (err) {
      console.error('Error saving service:', err);
      
      // Manejar errores de validación reproductiva
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorList = err.response.data.errors.join("\n• ");
        toast({
          title: "❌ No se puede registrar el servicio",
          description: "• " + errorList,
          variant: "destructive",
          duration: 8000
        });
      } else {
        toast({
          title: "Error al guardar",
          description: err.response?.data?.error || "No se pudo guardar el servicio",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/services')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la lista
        </Button>

        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <div className="flex items-center space-x-3">
              {formData.service_type === 'monta natural' ? (
                <Heart className="h-8 w-8" />
              ) : (
                <Syringe className="h-8 w-8" />
              )}
              <div>
                <CardTitle className="text-2xl">
                  {isEdit ? 'Editar Servicio' : 'Registro de Servicio Reproductivo'}
                </CardTitle>
                <CardDescription className="text-green-100">
                  {isEdit ? 'Modifica los datos del servicio' : 'Completa todos los campos obligatorios (*) para registrar un nuevo servicio'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Sección 1: Información General */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-200">
                  Información General del Servicio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sow_id" className="text-sm font-semibold">Cerda *</Label>
                    <Select
                      value={formData.sow_id}
                      onValueChange={(value) => handleChange('sow_id', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cerda" />
                      </SelectTrigger>
                      <SelectContent>
                        {sows.length === 0 && (
                          <SelectItem value="empty" disabled>No hay cerdas disponibles</SelectItem>
                        )}
                        {sows.map((sow) => (
                          <SelectItem key={sow.id} value={sow.id.toString()}>
                            {sow.ear_tag} - {sow.alias || 'Sin nombre'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heat_id" className="text-sm font-semibold">Celo Asociado *</Label>
                    <Select
                      value={formData.heat_id}
                      onValueChange={(value) => handleChange('heat_id', value)}
                      required
                      disabled={isEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar celo" />
                      </SelectTrigger>
                      <SelectContent>
                        {heats.length === 0 && (
                          <SelectItem value="empty" disabled>No hay celos disponibles</SelectItem>
                        )}
                        {heats.map((heat) => {
                          // Format date to readable format: "DD/MM/YYYY HH:MM"
                          const sowCode = heat.sow_ear_tag || heat.sow_code || 'Sin cerda';
                          const date = new Date(heat.heat_date);
                          const formattedDate = date.toLocaleDateString('es-ES');
                          const formattedTime = heat.detection_time ? heat.detection_time.substring(0, 5) : '';
                          const statusBadge = heat.status === 'servido' ? ' [SERVIDO]' : '';
                          const displayText = `${sowCode} - ${formattedDate}${formattedTime ? ' ' + formattedTime : ''}${statusBadge}`;
                          
                          return (
                            <SelectItem key={heat.id} value={heat.id.toString()}>
                              {displayText}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {isEdit && currentHeat && (
                      <p className="text-xs text-gray-500">
                        El celo no se puede cambiar en modo edición
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_type" className="text-sm font-semibold">Tipo de Servicio *</Label>
                    <Select
                      value={formData.service_type}
                      onValueChange={(value) => handleChange('service_type', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monta natural">Monta Natural</SelectItem>
                        <SelectItem value="inseminacion artificial">Inseminación Artificial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_date" className="text-sm font-semibold">Fecha del Servicio *</Label>
                    <Input
                      id="service_date"
                      type="date"
                      value={formData.service_date}
                      onChange={(e) => handleChange('service_date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_time" className="text-sm font-semibold">Hora del Servicio *</Label>
                    <Input
                      id="service_time"
                      type="time"
                      value={formData.service_time}
                      onChange={(e) => handleChange('service_time', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_number" className="text-sm font-semibold">Número de Servicio *</Label>
                    <Input
                      id="service_number"
                      type="number"
                      min="1"
                      value={formData.service_number}
                      onChange={(e) => handleChange('service_number', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="technician_name" className="text-sm font-semibold">
                      Técnico Responsable <span className="text-xs text-gray-500">(Opcional)</span>
                    </Label>
                    <Input
                      id="technician_name"
                      type="text"
                      value={formData.technician_name}
                      onChange={(e) => handleChange('technician_name', e.target.value)}
                      placeholder="Nombre del técnico"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="success" className="text-sm font-semibold">Estado del Servicio</Label>
                    <Select
                      value={formData.success ? 'true' : 'false'}
                      onValueChange={(value) => handleChange('success', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Exitoso</SelectItem>
                        <SelectItem value="false">No Exitoso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Sección 2: Selección de Verraco (para todos los tipos de servicio) */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-200">
                  Verraco
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="boar_id" className="text-sm font-semibold">Verraco *</Label>
                    <Select
                      value={formData.boar_id}
                      onValueChange={(value) => handleChange('boar_id', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar verraco" />
                      </SelectTrigger>
                      <SelectContent>
                        {boars.length === 0 && (
                          <SelectItem value="empty" disabled>No hay verracos disponibles</SelectItem>
                        )}
                        {boars.map((boar) => (
                          <SelectItem key={boar.id} value={boar.id.toString()}>
                            {boar.ear_tag} - {boar.name || 'Sin nombre'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {formData.service_type === 'monta natural' 
                        ? 'Verraco que realizará la monta' 
                        : 'Verraco del cual se obtuvo el semen'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sección 3: Datos de Monta Natural (solo si es monta natural) */}
              {formData.service_type === 'monta natural' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-pink-200">
                    Datos de Monta Natural
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="mating_duration_minutes" className="text-sm font-semibold">
                        Duración (minutos) <span className="text-xs text-gray-500">(Opcional)</span>
                      </Label>
                      <Input
                        id="mating_duration_minutes"
                        type="number"
                        min="0"
                        value={formData.mating_duration_minutes}
                        onChange={(e) => handleChange('mating_duration_minutes', e.target.value)}
                        placeholder="Duración en minutos"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mating_quality" className="text-sm font-semibold">
                        Calidad de la Monta <span className="text-xs text-gray-500">(Opcional)</span>
                      </Label>
                      <Select
                        value={formData.mating_quality}
                        onValueChange={(value) => handleChange('mating_quality', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar calidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin especificar</SelectItem>
                          <SelectItem value="excelente">Excelente</SelectItem>
                          <SelectItem value="buena">Buena</SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="mala">Mala</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Sección 4: Datos de Inseminación Artificial (solo si es IA) */}
              {formData.service_type === 'inseminacion artificial' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-200">
                    Datos de Inseminación Artificial
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="ia_type" className="text-sm font-semibold">
                        Tipo de IA <span className="text-xs text-gray-500">(Opcional)</span>
                      </Label>
                      <Select
                        value={formData.ia_type}
                        onValueChange={(value) => handleChange('ia_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin especificar</SelectItem>
                          <SelectItem value="cervical">Cervical</SelectItem>
                          <SelectItem value="post-cervical">Post-Cervical</SelectItem>
                          <SelectItem value="intrauterina">Intrauterina</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ia_dose_code" className="text-sm font-semibold">
                        Código de Dosis <span className="text-xs text-gray-500">(Opcional)</span>
                      </Label>
                      <Input
                        id="ia_dose_code"
                        type="text"
                        value={formData.ia_dose_code}
                        onChange={(e) => handleChange('ia_dose_code', e.target.value)}
                        placeholder="Código de dosis"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ia_volume_ml" className="text-sm font-semibold">
                        Volumen (ml) <span className="text-xs text-gray-500">(Opcional)</span>
                      </Label>
                      <Input
                        id="ia_volume_ml"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.ia_volume_ml}
                        onChange={(e) => handleChange('ia_volume_ml', e.target.value)}
                        placeholder="Volumen en ml"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ia_concentration" className="text-sm font-semibold">
                        Concentración (millones/ml) <span className="text-xs text-gray-500">(Opcional)</span>
                      </Label>
                      <Input
                        id="ia_concentration"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.ia_concentration}
                        onChange={(e) => handleChange('ia_concentration', e.target.value)}
                        placeholder="Concentración"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sección 5: Observaciones */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-yellow-200">
                  Observaciones
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-semibold">
                    Notas <span className="text-xs text-gray-500">(Opcional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Observaciones sobre el servicio..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/services')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Guardando...' : isEdit ? 'Actualizar Servicio' : 'Registrar Servicio'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  );
};

export default ServiceRegistration;
