import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, ChevronLeft, ChevronRight, Plus, Download, Upload, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { pregnancyService, heatService, calendarEventService, serviceService, sowService } from "@/services/api";

export default function CalendarPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterType, setFilterType] = useState("todos");
  const [editingEvent, setEditingEvent] = useState(null);
  const [customEvents, setCustomEvents] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, eventId: null });
  const [sows, setSows] = useState([]);
  const [eventForm, setEventForm] = useState({
    title: "",
    event_date: "",
    event_time: "",
    event_type: "custom",
    description: "",
    notes: "",
    status: "pending",
    reminder_days: 0,
    sow_id: null
  });
  
  // Cargar eventos desde el backend
  useEffect(() => {
    loadEvents();
  }, [selectedMonth, selectedYear]);

  const loadEvents = async () => {
    try {
      // Cargar eventos personalizados de la base de datos
      const customEventsData = await calendarEventService.getEventsByMonth(selectedYear, selectedMonth + 1);
      setCustomEvents(customEventsData);
      
      // Cargar gestaciones activas para calcular fechas de parto esperadas
      const pregnancies = await pregnancyService.getAllPregnancies({ status: 'en curso' });
      
      const calculatedEvents = [];
      
      // Agregar eventos personalizados
      customEventsData.forEach(event => {
        const eventDate = new Date(event.event_date);
        let displayTitle = event.title;
        
        // Si tiene hora, agregarla al título
        if (event.event_date && event.event_date.includes('T')) {
          const timeStr = eventDate.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          });
          displayTitle = `${timeStr} - ${event.title}`;
        }
        
        // Agregar información de la cerda si está asociada
        if (event.sow_ear_tag) {
          displayTitle += ` (${event.sow_ear_tag})`;
        }
        
        calculatedEvents.push({
          id: `custom-${event.id}`,
          title: displayTitle,
          date: eventDate,
          type: 'custom',
          color: 'text-blue-600',
          data: event,
          isCustom: true
        });
      });
      
      // Agregar eventos de partos esperados
      pregnancies.forEach(pregnancy => {
        if (pregnancy.expected_farrowing_date) {
          const farrowingDate = new Date(pregnancy.expected_farrowing_date);
          calculatedEvents.push({
            id: `pregnancy-${pregnancy.id}`,
            title: `Parto Esperado - ${pregnancy.sow_ear_tag || 'Cerda ' + pregnancy.sow_id}`,
            date: farrowingDate,
            type: 'farrowing',
            color: 'text-red-600',
            data: pregnancy
          });
          
          // Agregar recordatorio 7 días antes
          const reminderDate = new Date(farrowingDate);
          reminderDate.setDate(reminderDate.getDate() - 7);
          calculatedEvents.push({
            id: `reminder-${pregnancy.id}`,
            title: `Recordatorio: Preparar parto (${pregnancy.sow_ear_tag || 'Cerda ' + pregnancy.sow_id})`,
            date: reminderDate,
            type: 'reminder',
            color: 'text-orange-600',
            data: pregnancy
          });
        }
      });
      
      // Cargar celos
      const heats = await heatService.getAllHeats();
      
      heats.forEach(heat => {
        // Agregar el celo registrado
        const heatDate = new Date(heat.heat_date);
        calculatedEvents.push({
          id: `heat-registered-${heat.id}`,
          title: `Celo Registrado - ${heat.sow_ear_tag || heat.sow_alias || 'Cerda ' + heat.sow_id}`,
          date: heatDate,
          type: 'heat',
          color: 'text-pink-600',
          data: heat
        });
        
        // Calcular próximo celo esperado (ciclo de 21 días aproximadamente)
        if (heat.status === 'finalizado' && !heat.service_performed) {
          const nextHeatDate = new Date(heatDate);
          nextHeatDate.setDate(nextHeatDate.getDate() + 21);
          
          // Solo agregar si es futuro
          if (nextHeatDate > new Date()) {
            calculatedEvents.push({
              id: `heat-expected-${heat.id}`,
              title: `Próximo Celo Esperado - ${heat.sow_ear_tag || heat.sow_alias || 'Cerda ' + heat.sow_id}`,
              date: nextHeatDate,
              type: 'heat',
              color: 'text-pink-600',
              data: heat
            });
          }
        }
      });

      // Cargar servicios/montas
      try {
        const services = await serviceService.getAllServices();
        services.forEach(service => {
          const serviceDate = new Date(service.service_date);
          calculatedEvents.push({
            id: `service-${service.id}`,
            title: `Servicio/Monta - ${service.sow_ear_tag || service.sow_alias || 'Cerda ' + service.sow_id}`,
            date: serviceDate,
            type: 'custom',
            color: 'text-blue-600',
            data: service
          });
        });
      } catch (error) {
        console.log("No se pudieron cargar los servicios:", error);
      }
      
      setEvents(calculatedEvents);
    } catch (error) {
      console.error("Error cargando eventos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos del calendario",
        variant: "destructive"
      });
    }
  };

  // Obtener días del mes
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Obtener el primer día del mes (0 = domingo)
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  // Cambiar mes
  const changeMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    setCurrentDate(new Date(newYear, newMonth, 1));
  };

  // Obtener eventos de un día específico
  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === selectedMonth &&
        eventDate.getFullYear() === selectedYear &&
        (filterType === 'todos' || event.type === filterType)
      );
    });
  };

  // Renderizar el calendario
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];
    const today = new Date();
    const isCurrentMonth = today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;
    
    // Días vacíos antes del primer día del mes
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[100px] p-2 border border-gray-100"></div>);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = isCurrentMonth && today.getDate() === day;
      
      // Determinar el color de fondo del día según los eventos
      let dayBgColor = "";
      let dayBorderColor = "border-gray-200";
      
      if (dayEvents.length > 0) {
        // Priorizar eventos por importancia
        const hasFarrowing = dayEvents.some(e => e.type === 'farrowing');
        const hasHeat = dayEvents.some(e => e.type === 'heat');
        const hasReminder = dayEvents.some(e => e.type === 'reminder');
        const hasCustom = dayEvents.some(e => e.type === 'custom');
        
        if (hasFarrowing) {
          dayBgColor = "bg-red-50";
          dayBorderColor = "border-red-300";
        } else if (hasHeat) {
          dayBgColor = "bg-pink-50";
          dayBorderColor = "border-pink-300";
        } else if (hasReminder) {
          dayBgColor = "bg-orange-50";
          dayBorderColor = "border-orange-300";
        } else if (hasCustom) {
          dayBgColor = "bg-blue-50";
          dayBorderColor = "border-blue-300";
        }
      }
      
      // Si es hoy, mantener el estilo de hoy pero con un borde más prominente
      if (isToday) {
        dayBgColor = dayBgColor || "bg-red-50";
        dayBorderColor = "border-red-500 border-2";
      }
      
      days.push(
        <div
          key={day}
          className={cn(
            "min-h-[100px] p-2 border cursor-pointer relative transition-colors",
            dayBgColor,
            dayBorderColor,
            !dayBgColor && "hover:bg-gray-50"
          )}
          onClick={() => handleDayClick(day)}
        >
          <div className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded-full mb-1 font-semibold",
            isToday && "bg-red-500 text-white",
            !isToday && dayEvents.length > 0 && "font-bold"
          )}>
            {day}
          </div>
          
          <div className="space-y-1">
            {dayEvents.map((event, idx) => (
              <div
                key={event.id}
                className={cn(
                  "text-xs px-2 py-1 rounded truncate flex items-center justify-between group",
                  event.type === 'farrowing' && "bg-red-100 text-red-800 border border-red-200",
                  event.type === 'heat' && "bg-pink-100 text-pink-800 border border-pink-200",
                  event.type === 'reminder' && "bg-orange-100 text-orange-800 border border-orange-200",
                  event.type === 'custom' && "bg-blue-100 text-blue-800 border border-blue-200",
                  "cursor-pointer hover:opacity-80"
                )}
                title={event.title}
                onClick={(e) => {
                  e.stopPropagation();
                  if (event.isCustom) {
                    handleEditEvent(event);
                  }
                }}
              >
                <span className="truncate flex-1">{event.title}</span>
                {event.isCustom && (
                  <button
                    className="opacity-0 group-hover:opacity-100 ml-1 text-red-600 hover:text-red-800 font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      const eventId = event.id.replace('custom-', '');
                      handleDeleteEvent(eventId);
                    }}
                    title="Eliminar evento"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const handleDayClick = (day) => {
    setSelectedDate(new Date(selectedYear, selectedMonth, day));
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length > 0) {
      // Construir descripción detallada de eventos
      const eventDetails = dayEvents.map(e => {
        let details = e.title;
        if (e.data?.created_by_name) {
          details += ` (Creado por: ${e.data.created_by_name})`;
        }
        return details;
      }).join('\n');
      
      toast({
        title: `Eventos del ${day}/${selectedMonth + 1}/${selectedYear}`,
        description: eventDetails,
      });
    }
  };

  const handleCreateEvent = async () => {
    setEditingEvent(null);
    setEventForm({
      title: "",
      event_date: "",
      event_time: "",
      event_type: "custom",
      description: "",
      notes: "",
      status: "pending",
      reminder_days: 0,
      sow_id: null
    });
    // Cargar lista de cerdas
    await loadSows();
    setIsEventDialogOpen(true);
  };

  const loadSows = async () => {
    try {
      const sowsData = await sowService.getSowsSimplified();
      setSows(sowsData);
    } catch (error) {
      console.error("Error cargando cerdas:", error);
    }
  };

  const handleEditEvent = async (event) => {
    setEditingEvent(event.data);
    // Extraer la hora si existe en event_date (formato ISO)
    let eventTime = "";
    if (event.data.event_date && event.data.event_date.includes('T')) {
      const dateObj = new Date(event.data.event_date);
      eventTime = dateObj.toTimeString().slice(0, 5); // Formato HH:MM
    }
    
    setEventForm({
      title: event.data.title,
      event_date: event.data.event_date?.split('T')[0] || "",
      event_time: eventTime || "",
      event_type: event.data.event_type || "custom",
      description: event.data.description || "",
      notes: event.data.notes || "",
      status: event.data.status || "pending",
      reminder_days: event.data.reminder_days || 0,
      sow_id: event.data.sow_id || null
    });
    // Cargar lista de cerdas
    await loadSows();
    setIsEventDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    try {
      if (!eventForm.title || !eventForm.event_date) {
        toast({
          title: "Error",
          description: "El título y la fecha son obligatorios",
          variant: "destructive"
        });
        return;
      }

      // Combinar fecha y hora si se proporcionó hora
      let eventDateTime = eventForm.event_date;
      if (eventForm.event_time) {
        eventDateTime = `${eventForm.event_date}T${eventForm.event_time}:00`;
      }

      const eventData = {
        ...eventForm,
        event_date: eventDateTime
      };

      if (editingEvent) {
        // Actualizar evento existente
        await calendarEventService.updateEvent(editingEvent.id, eventData);
        toast({
          title: "¡Éxito!",
          description: "Evento actualizado correctamente",
          className: "bg-green-50 border-green-200"
        });
      } else {
        // Crear nuevo evento
        await calendarEventService.createEvent(eventData);
        toast({
          title: "¡Éxito!",
          description: "Evento creado correctamente",
          className: "bg-green-50 border-green-200"
        });
      }

      setIsEventDialogOpen(false);
      loadEvents();
    } catch (error) {
      console.error("Error al guardar evento:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo guardar el evento",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEvent = (eventId) => {
    setDeleteDialog({ open: true, eventId });
  };

  const confirmDeleteEvent = async () => {
    try {
      await calendarEventService.deleteEvent(deleteDialog.eventId);
      toast({
        title: "¡Éxito!",
        description: "Evento eliminado correctamente",
        className: "bg-green-50 border-green-200"
      });
      setDeleteDialog({ open: false, eventId: null });
      loadEvents();
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo eliminar el evento",
        variant: "destructive"
      });
    }
  };

  const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-[#6b7c45]" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calendario de Eventos</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Gestiona fechas importantes y recordatorios
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleCreateEvent}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nuevo evento</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Navegación de meses */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeMonth(-1)}
                  className="flex-shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">octubre</span>
                </Button>
                
                <div className="text-center flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-red-600">
                    {monthNames[selectedMonth]} {selectedYear}
                  </h2>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeMonth(1)}
                  className="flex-shrink-0"
                >
                  <span className="hidden sm:inline">diciembre</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Filtros */}
              <div className="flex items-center justify-center">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <SelectValue placeholder="Filtrar eventos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los eventos</SelectItem>
                    <SelectItem value="custom">Eventos personalizados</SelectItem>
                    <SelectItem value="farrowing">Partos esperados</SelectItem>
                    <SelectItem value="heat">Celos esperados</SelectItem>
                    <SelectItem value="reminder">Recordatorios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Leyenda de colores */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                  <span className="text-xs text-gray-600">Parto Esperado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-pink-100 border-2 border-pink-300 rounded"></div>
                  <span className="text-xs text-gray-600">Celo Esperado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded"></div>
                  <span className="text-xs text-gray-600">Recordatorio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
                  <span className="text-xs text-gray-600">Evento Personal</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-6">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-0 mb-2">
              {weekDays.map(day => (
                <div
                  key={day}
                  className="text-center font-semibold text-gray-700 py-2 text-sm"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">
              {renderCalendar()}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={loadEvents}
            className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-2 mx-auto"
          >
            <Download className="h-4 w-4" />
            Actualizar eventos del sistema
          </button>
        </div>

        {/* Legend */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Leyenda de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border-2 border-blue-600 rounded"></div>
                <span className="text-sm">Eventos personalizados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border-2 border-red-600 rounded"></div>
                <span className="text-sm">Partos esperados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-100 border-2 border-orange-600 rounded"></div>
                <span className="text-sm">Recordatorios</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-100 border-2 border-pink-600 rounded"></div>
                <span className="text-sm">Celos esperados</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, eventId: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Calendar className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, eventId: null })}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteEvent}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, eliminar evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for new event */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Editar Evento" : "Agregar Evento Personalizado"}</DialogTitle>
            <DialogDescription>
              {editingEvent 
                ? "Modifica los detalles del evento personalizado" 
                : "Los eventos del sistema se generan automáticamente. Aquí puedes agregar eventos personalizados."}
            </DialogDescription>
            {editingEvent && editingEvent.created_by_name && (
              <div className="flex items-center gap-2 mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  <strong>Creado por:</strong> {editingEvent.created_by_name}
                  {editingEvent.created_by_email && ` (${editingEvent.created_by_email})`}
                </span>
              </div>
            )}
            {editingEvent && editingEvent.sow_ear_tag && (
              <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 rounded-md border border-green-200">
                <span className="text-2xl">🐷</span>
                <div className="text-sm text-green-800">
                  <strong>Cerda:</strong> {editingEvent.sow_ear_tag}
                  {editingEvent.sow_alias && ` - ${editingEvent.sow_alias}`}
                  {editingEvent.sow_breed && ` (${editingEvent.sow_breed})`}
                </div>
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Título del Evento *</Label>
              <Input 
                id="event-title" 
                placeholder="Ej: Vacunación general" 
                value={eventForm.title}
                onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date">Fecha *</Label>
                <Input 
                  id="event-date" 
                  type="date" 
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm({...eventForm, event_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-time">Hora</Label>
                <Input 
                  id="event-time" 
                  type="time" 
                  value={eventForm.event_time}
                  onChange={(e) => setEventForm({...eventForm, event_time: e.target.value})}
                  placeholder="HH:MM"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-type">Tipo de Evento</Label>
              <Select 
                value={eventForm.event_type} 
                onValueChange={(value) => setEventForm({...eventForm, event_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Personalizado</SelectItem>
                  <SelectItem value="vaccination">Vacunación</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="inspection">Inspección</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description">Descripción</Label>
              <Input 
                id="event-description" 
                placeholder="Descripción breve..." 
                value={eventForm.description}
                onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-notes">Notas</Label>
              <Textarea 
                id="event-notes" 
                placeholder="Detalles adicionales..." 
                rows={3} 
                value={eventForm.notes}
                onChange={(e) => setEventForm({...eventForm, notes: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-sow">Cerda Asociada (Opcional)</Label>
              <Select 
                value={eventForm.sow_id?.toString() || ""} 
                onValueChange={(value) => setEventForm({...eventForm, sow_id: value ? parseInt(value) : null})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cerda..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin cerda asociada</SelectItem>
                  {sows.map(sow => (
                    <SelectItem key={sow.id} value={sow.id.toString()}>
                      {sow.ear_tag} - {sow.alias || 'Sin alias'} ({sow.breed})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {eventForm.sow_id && (
                <p className="text-xs text-gray-500 mt-1">
                  El evento estará asociado a esta cerda
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleSaveEvent}>
              {editingEvent ? "Actualizar Evento" : "Guardar Evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

