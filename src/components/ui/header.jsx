import { Bell, Menu, User, LogOut, Check, Trash2, Calendar, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useNotifications } from "@/context/NotificationContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Link, useNavigate } from "react-router-dom"

export function Header({ toggleSidebar }) {
  const { logout, user } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, refresh, isLoading, lastUpdate } = useNotifications()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const navigate = useNavigate()

  // Función para calcular tiempo transcurrido
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Hace un momento';
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    }
    const days = Math.floor(seconds / 86400);
    if (days === 1) return 'Hace 1 día';
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
    }
    const months = Math.floor(days / 30);
    return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
  }

  // Función para refrescar notificaciones manualmente
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      // Pequeño delay para mostrar la animación
      setTimeout(() => setIsRefreshing(false), 500);
    } catch (error) {
      console.error('Error refrescando notificaciones:', error);
      setIsRefreshing(false);
    }
  }

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await logout() // Usar la función logout del AuthContext
      navigate("/login", { replace: true })
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      // Forzar limpieza y redirección aunque haya error
      localStorage.removeItem("user")
      localStorage.removeItem("authToken")
      navigate("/login", { replace: true })
    }
  }

  // Obtener iniciales para el avatar
  const getInitials = () => {
    if (!user) return "U"
    
    // Intentar con first_name y last_name (formato del backend)
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    
    // Intentar con firstName y lastName
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    
    // Intentar con fisrtName (typo del backend)
    if (user.fisrtName && user.lastName) {
      return `${user.fisrtName[0]}${user.lastName[0]}`.toUpperCase()
    }
    
    // Intentar con name
    if (user.name) {
      const nameParts = user.name.split(" ")
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      }
      return user.name.substring(0, 2).toUpperCase()
    }
    
    // Usar email como fallback
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    
    return "U"
  }

  // Obtener nombre completo del usuario
  const getFullName = () => {
    if (!user) return "Usuario"
    
    // Intentar con first_name y last_name (formato del backend)
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    
    // Intentar con firstName y lastName (formato alternativo)
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    
    // Intentar con fisrtName (typo del backend)
    if (user.fisrtName && user.lastName) {
      return `${user.fisrtName} ${user.lastName}`
    }
    
    // Intentar con name
    if (user.name) {
      return user.name
    }
    
    // Usar email como fallback
    if (user.email) {
      return user.email.split('@')[0]
    }
    
    return "Usuario"
  }

  return (
    <header className="bg-[#2a4a04] text-white px-4 py-3 sticky top-0 z-50 shadow-md">
      <div className="w-full max-w-[1400px] mx-auto flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-[#5a6a3a] hover:text-white"
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Menú</span>
          </Button>
          <div className="md:hidden">
            <h1 className="text-xl font-bold">Granme</h1>
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold">Sistema de Gestión Granme</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#5a6a3a] hover:text-white">
                <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 animate-in fade-in zoom-in duration-300">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
                <span className="sr-only">Notificaciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[320px] md:w-[380px] bg-white max-h-[500px] overflow-y-auto">
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <DropdownMenuLabel className="text-gray-900 p-0">
                    Notificaciones {unreadCount > 0 && `(${unreadCount})`}
                  </DropdownMenuLabel>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefresh();
                      }}
                      disabled={isRefreshing}
                      title="Refrescar notificaciones"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAllAsRead();
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Marcar todas
                      </Button>
                    )}
                  </div>
                </div>
                {lastUpdate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Última actualización: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <DropdownMenuSeparator />
              
              {isLoading && notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-30 animate-spin" />
                  <p className="text-sm">Cargando notificaciones...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No tienes notificaciones</p>
                </div>
              ) : (
                <>
                  {notifications.slice(0, 10).map((notification) => {
                    const Icon = notification.type === 'calendar' ? Calendar : AlertCircle;
                    const timeAgo = getTimeAgo(notification.created_at);
                    
                    return (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex flex-col items-start p-3 cursor-pointer focus:bg-gray-100 ${
                          !notification.is_read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(notification.id);
                          }
                          if (notification.action_url) {
                            navigate(notification.action_url);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between w-full gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                              notification.priority === 'urgent' ? 'text-red-500' :
                              notification.priority === 'high' ? 'text-orange-500' :
                              'text-blue-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm">
                                {notification.title}
                              </div>
                              <div className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                                {notification.message}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {timeAgo}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-gray-500" />
                          </Button>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                  {notifications.length > 10 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-center cursor-pointer text-gray-900 justify-center focus:bg-gray-100">
                        Ver todas las notificaciones ({notifications.length})
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative flex items-center gap-2 text-white hover:bg-[#5a6a3a] hover:text-white"
              >
                <Avatar className="h-8 w-8">
                  {user?.profile_image || user?.profileImage ? (
                    <AvatarImage src={user.profile_image || user.profileImage} alt={getFullName()} />
                  ) : (
                    <AvatarFallback className="bg-[#5a6a3a] text-white">{getInitials()}</AvatarFallback>
                  )}
                </Avatar>
                <span className="hidden md:inline">{getFullName()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuLabel className="text-gray-900">Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="focus:bg-gray-100">
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Mi Cuenta</span>
                </Link>
              </DropdownMenuItem>
             
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="focus:bg-gray-100 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

