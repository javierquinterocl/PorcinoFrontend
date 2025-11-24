import { useState, useEffect, useRef, useCallback, useMemo } from "react"
// Removed tabs import to avoid @radix-ui dependency
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Phone, MapPin, Calendar, FileText, BarChart, Bell, Loader2 } from "lucide-react"
// Removed Switch import to avoid @radix-ui dependency
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/AuthContext"

// Interface extendida para el estado userInfo

// NOTA: Los datos del usuario se obtienen del AuthContext
// Los datos de ejemplo se eliminaron para usar solo datos reales

// Información del sistema
const systemInfo = [
  { 
    icon: FileText, 
    title: "Gestión de Cerdas", 
    description: "Registro y seguimiento completo del ciclo reproductivo" 
  },
  { 
    icon: Calendar, 
    title: "Calendario Integrado", 
    description: "Planifica y visualiza eventos importantes de la granja" 
  },
  { 
    icon: BarChart, 
    title: "Reportes Detallados", 
    description: "Analiza métricas y genera reportes personalizados" 
  },
  { 
    icon: Bell, 
    title: "Notificaciones", 
    description: "Recibe alertas sobre eventos críticos y recordatorios" 
  },
]

export function UserProfile() {
  const { user, updateProfile, updateProfileImage, deleteProfileImage } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  })
  
  // Estados para gestionar la imagen de perfil
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const fileInputRef = useRef(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    system: true,
    weekly: false
  })
  const [userInfo, setUserInfo] = useState({
    firstName: user?.firstName || user?.first_name || "",
    lastName: user?.lastName || user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
    createdAt: user?.createdAt || user?.created_at || new Date().toISOString(),
    code: user?.code || user?.id || ""
  })

  const { toast } = useToast()

  // Memoizar los datos de usuario para evitar renderizados innecesarios
  const userDisplayData = useMemo(() => {
    return {
      name: `${userInfo.firstName} ${userInfo.lastName}`,
      email: userInfo.email,
      phone: userInfo.phone || "No especificado",
      code: userInfo.code,
      avatar: userInfo.avatar,
      joinDate: userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : "No disponible"
    };
  }, [userInfo.firstName, userInfo.lastName, userInfo.email, userInfo.phone, userInfo.code, userInfo.avatar, userInfo.createdAt]);
  
  // Crear manejadores de eventos memorizados para evitar recreaciones en cada renderizado
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);


  const handleAvatarClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Actualizar datos cuando el usuario cambie
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || user.first_name || "",
        lastName: user.lastName || user.last_name || "",
        phone: user.phone || "",
      });
      
      setUserInfo({
        firstName: user.firstName || user.first_name || "",
        lastName: user.lastName || user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        avatar: user.profile_image || user.profileImage || user.avatar || "",
        createdAt: user.createdAt || user.created_at || new Date().toISOString(),
        code: user.code || user.id || ""
      });
    }
  }, [user]);

  const handleFileChange = useCallback(async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validar que es una imagen
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "La imagen es demasiado grande. El tamaño máximo es 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploadingImage(true);

    try {
      // Convertir a base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64Image = event.target.result;
          
          // Mostrar vista previa
          setPreviewImage(base64Image);
          
          try {
            // Subir la imagen al servidor
            await updateProfileImage(base64Image);
            
            toast({
              title: "Éxito",
              description: "Imagen de perfil actualizada correctamente",
              className: "bg-green-50 border-green-200"
            });
            
            // Limpiar la vista previa después de subir
            setPreviewImage(null);
          } catch (error) {
            console.error('Error al subir imagen:', error);
            toast({
              title: "Error",
              description: error.message || "No se pudo actualizar la imagen de perfil",
              variant: "destructive",
            });
            setPreviewImage(null);
          }
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Error al leer el archivo de imagen",
          variant: "destructive",
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error procesando imagen:', error);
      toast({
        title: "Error",
        description: "Error al procesar la imagen",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  }, [toast, updateProfileImage]);

  // Función para guardar perfil
  const handleSaveProfile = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Validar datos
      if (!formData.firstName || !formData.lastName) {
        toast({
          title: "Error",
          description: "El nombre y apellido son obligatorios",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Llamar a la API para actualizar el perfil
      const updatedData = await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      });
      
      // Actualizar estado local
      setUserInfo(prev => ({
        ...prev,
        firstName: updatedData.first_name || formData.firstName,
        lastName: updatedData.last_name || formData.lastName,
        phone: updatedData.phone || formData.phone
      }));
      
      setIsEditing(false);
      
      toast({
        title: "Perfil actualizado",
        description: "Tu información personal ha sido actualizada correctamente.",
      });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar perfil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData.firstName, formData.lastName, formData.phone, toast, updateProfile]);


  // Función para eliminar foto de perfil
  const handleRemoveAvatar = useCallback(async () => {
    try {
      setIsUploadingImage(true);
      
      await deleteProfileImage();
      
      // Limpiar la vista previa
      setPreviewImage(null);
      
      toast({
        title: "Éxito",
        description: "Imagen de perfil eliminada correctamente",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la imagen de perfil",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  }, [toast, deleteProfileImage]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Mi Cuenta</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel lateral con información básica */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="h-40 w-40 border-2 border-secondary shadow-md">
                    {previewImage ? (
                      <AvatarImage src={previewImage} alt={userDisplayData.name} />
                    ) : userDisplayData.avatar ? (
                      <AvatarImage src={userDisplayData.avatar} alt={userDisplayData.name} />
                    ) : (
                      <AvatarFallback className="text-4xl bg-gradient-to-r from-green-100 to-green-200 text-green-800">
                        {userInfo.firstName?.[0]}
                        {userInfo.lastName?.[0]}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  {/* Overlay de carga */}
                  {isUploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                      <Loader2 className="h-10 w-10 animate-spin text-white" />
                    </div>
                  )}
                  
                  {/* Input oculto para la selección de archivos */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                </div>
                <CardTitle className="text-xl">
                  {userDisplayData.name}
                </CardTitle>
                <CardDescription>{userDisplayData.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
               
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{userDisplayData.phone}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Dirección no especificada</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Miembro desde: {userDisplayData.joinDate}</span>
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>ID: {user?.id || "N/A"}</span>
                </div>
              </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button 
                  variant="default" 
                  className="w-full bg-[#6b7c45] hover:bg-[#5a6a3a]"
                  onClick={handleAvatarClick}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Cambiar Foto de Perfil"
                  )}
                </Button>
                
                {(userDisplayData.avatar || previewImage) && (
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingImage}
                >
                  Eliminar Foto
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades del Sistema</CardTitle>
              <CardDescription>Sistema de Gestión Porcina Granme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                    <div className="p-2 rounded-lg bg-[#6b7c45]/10">
                      <info.icon className="h-5 w-5 text-[#6b7c45]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{info.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {info.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <div className="md:col-span-2">
          <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>Actualiza tu información personal</CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="firstName">Nombre</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="lastName">Apellido</Label>
                          <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Nombre</Label>
                          <p>{userInfo.firstName}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Apellido</Label>
                          <p>{userInfo.lastName}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Correo Electrónico</Label>
                        <p>{userDisplayData.email}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Teléfono</Label>
                        <p>{userInfo.phone || "No especificado"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">ID de Usuario</Label>
                        <p>{user?.id || "N/A"}</p>
                        <p className="text-xs text-muted-foreground mt-1">Este ID no se puede modificar</p>
                      </div>
                     
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setFormData({
                            firstName: userInfo.firstName,
                            lastName: userInfo.lastName,
                            phone: userInfo.phone || "",
                          })
                        }}
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={isLoading} className="bg-[#6b7c45] hover:bg-[#5a6a3a]">
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            Guardando...
                          </>
                        ) : (
                          "Guardar Cambios"
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => setIsEditing(true)} 
                      className="ml-auto bg-[#6b7c45] hover:bg-[#5a6a3a]"
                    >
                      Editar Perfil
                    </Button>
                  )}
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preferencias de Notificaciones</CardTitle>
                  <CardDescription>Configura cómo quieres recibir notificaciones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Notificaciones por correo</p>
                        <p className="text-sm text-muted-foreground">Recibe notificaciones por correo electrónico</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifications.email}
                      onChange={(e) => {
                        setNotifications(prev => ({ ...prev, email: e.target.checked }))
                        toast({
                          title: "Preferencia actualizada",
                          description: `Notificaciones por correo ${e.target.checked ? 'activadas' : 'desactivadas'}`,
                        })
                      }}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Alertas del sistema</p>
                        <p className="text-sm text-muted-foreground">Recibe alertas importantes del sistema</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifications.system}
                      onChange={(e) => {
                        setNotifications(prev => ({ ...prev, system: e.target.checked }))
                        toast({
                          title: "Preferencia actualizada",
                          description: `Alertas del sistema ${e.target.checked ? 'activadas' : 'desactivadas'}`,
                        })
                      }}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Reportes semanales</p>
                        <p className="text-sm text-muted-foreground">Recibe resúmenes semanales de actividad</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifications.weekly}
                      onChange={(e) => {
                        setNotifications(prev => ({ ...prev, weekly: e.target.checked }))
                        toast({
                          title: "Preferencia actualizada",
                          description: `Reportes semanales ${e.target.checked ? 'activados' : 'desactivados'}`,
                        })
                      }}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                </CardContent>
              </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

