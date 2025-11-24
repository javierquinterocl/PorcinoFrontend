
import { useState, useEffect } from "react"
import { useLocation, Link } from "react-router-dom"
import {
  BarChart3,
  Calendar,
  ClipboardList,
  Home,
  Package,
  ShoppingCart,
  Truck,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Users,
  PiggyBank,
  Activity,
  Thermometer,
  Heart,
  Baby,
  AlertCircle,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

function NavItem({ icon, label, href, isActive, collapsed, onNavigate }) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start text-white hover:bg-[#2a4a04] hover:text-white",
        isActive && "bg-[#2a4a04]",
        collapsed && "px-2",
      )}
      asChild
    >
      <Link to={href} onClick={onNavigate}>
        {icon}
        {!collapsed && <span className="ml-2">{label}</span>}
      </Link>
    </Button>
  )
}

function SidebarContent({ pathname, collapsed, openMenus, toggleMenu, handleNavigate }) {
  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 space-y-1">
      <NavItem
        icon={<Home className="h-5 w-5" />}
        label="Dashboard"
        href="/"
        isActive={pathname === "/"}
        collapsed={collapsed}
        onNavigate={handleNavigate}
      />

      <NavItem
        icon={<Users className="h-5 w-5" />}
        label="Usuarios"
        href="/users"
        isActive={pathname === "/users"}
        collapsed={collapsed}
        onNavigate={handleNavigate}
      />

      <NavItem
        icon={<Calendar className="h-5 w-5" />}
        label="Calendario"
        href="/calendar"
        isActive={pathname === "/calendar"}
        collapsed={collapsed}
        onNavigate={handleNavigate}
      />

      {collapsed ? (
        <NavItem
          icon={<ClipboardList className="h-5 w-5" />}
          label="Hoja de Vida"
          href="/sows"
          isActive={pathname?.includes("/sows")}
          collapsed={collapsed}
          onNavigate={handleNavigate}
        />
      ) : (
        <Collapsible open={openMenus.sows} onOpenChange={() => toggleMenu("sows")}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-white hover:bg-[#2a4a04] hover:text-white",
                openMenus.sows && "bg-[#2a4a04]",
              )}
            >
              <ClipboardList className="mr-2 h-5 w-5" />
              <span>Hoja de Vida</span>
              {openMenus.sows ? (
                <ChevronDown className="ml-auto h-5 w-5" />
              ) : (
                <ChevronRight className="ml-auto h-5 w-5" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 space-y-1">
            <NavItem
              icon={<PiggyBank className="h-5 w-5" />}
              label="Nueva Cerda"
              href="/sows/register"
              isActive={pathname === "/sows/register"}
              collapsed={collapsed}
              onNavigate={handleNavigate}
            />
            <NavItem
              icon={<ClipboardList className="h-5 w-5" />}
              label="Lista de Reproductoras"
              href="/sows/list"
              isActive={pathname === "/sows/list"}
              collapsed={collapsed}
              onNavigate={handleNavigate}
            />
           
            
          </CollapsibleContent>
        </Collapsible>
      )}

      {collapsed ? (
        <NavItem
          icon={<Activity className="h-5 w-5" />}
          label="Datos Reproductivos"
          href="/heats"
          isActive={pathname?.includes("/heats") || pathname?.includes("/services") || pathname?.includes("/pregnancies") || pathname?.includes("/births") || pathname?.includes("/abortions")}
          collapsed={collapsed}
          onNavigate={handleNavigate}
        />
      ) : (
        <Collapsible open={openMenus.reproductive} onOpenChange={() => toggleMenu("reproductive")}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-white hover:bg-[#2a4a04] hover:text-white",
                openMenus.reproductive && "bg-[#2a4a04]",
              )}
            >
              <Activity className="mr-2 h-5 w-5" />
              <span>Datos Reproductivos</span>
              {openMenus.reproductive ? (
                <ChevronDown className="ml-auto h-5 w-5" />
              ) : (
                <ChevronRight className="ml-auto h-5 w-5" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 space-y-1">
            <NavItem
              icon={<Thermometer className="h-5 w-5" />}
              label="Celos/Estros"
              href="/heats"
              isActive={pathname?.includes("/heats")}
              collapsed={collapsed}
              onNavigate={handleNavigate}
            />
            <NavItem
              icon={<Activity className="h-5 w-5" />}
              label="Servicios"
              href="/services"
              isActive={pathname?.includes("/services")}
              collapsed={collapsed}
              onNavigate={handleNavigate}
            />
            <NavItem
              icon={<Heart className="h-5 w-5" />}
              label="Gestaciones"
              href="/pregnancies"
              isActive={pathname?.includes("/pregnancies")}
              collapsed={collapsed}
              onNavigate={handleNavigate}
            />
            <NavItem
              icon={<Baby className="h-5 w-5" />}
              label="Partos"
              href="/births"
              isActive={pathname?.includes("/births")}
              collapsed={collapsed}
              onNavigate={handleNavigate}
            />
            <NavItem
              icon={<AlertCircle className="h-5 w-5" />}
              label="Abortos"
              href="/abortions"
              isActive={pathname?.includes("/abortions")}
              collapsed={collapsed}
              onNavigate={handleNavigate}
            />
          </CollapsibleContent>
        </Collapsible>
      )}

     

     
    

      <NavItem
        icon={<BarChart3 className="h-5 w-5" />}
        label="Reportes"
        href="/reportes"
        isActive={pathname === "/reportes"}
        collapsed={collapsed}
        onNavigate={handleNavigate}
      />
    </nav>
  )
}

export function Sidebar({ isOpen = false, onClose }) {
  const location = useLocation();
  const pathname = location.pathname;
  const [openMenus, setOpenMenus] = useState({
    inventory: false,
    sows: false,
    reproductive: false,
  });
  const [collapsed, setCollapsed] = useState(false)

  // Determinar qué menú debe estar abierto basado en la ruta actual
  useEffect(() => {
    if (pathname?.includes("/inventory")) {
      setOpenMenus((prev) => ({ ...prev, inventory: true }))
    }
    if (pathname?.includes("/sows")) {
      setOpenMenus((prev) => ({ ...prev, sows: true }))
    }
    if (pathname?.includes("/heats") || pathname?.includes("/services") || pathname?.includes("/pregnancies") || pathname?.includes("/births") || pathname?.includes("/abortions")) {
      setOpenMenus((prev) => ({ ...prev, reproductive: true }))
    }
  }, [pathname])

  // Cerrar sidebar en móvil cuando cambia la ruta
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [pathname]);

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }))
  }

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

  const handleNavigate = () => {
    if (onClose) {
      onClose();
    }
  }

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Desktop - Oculto en móvil */}
      <aside className={cn(
        "bg-[#1a2e02] text-white flex-shrink-0 hidden md:flex md:flex-col transition-all duration-300 overflow-hidden h-full",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between flex-shrink-0">
            {!collapsed && <h2 className="text-xl font-bold">Granme</h2>}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-[#2a4a04] hover:text-white"
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </div>

          <SidebarContent
            pathname={pathname}
            collapsed={collapsed}
            openMenus={openMenus}
            toggleMenu={toggleMenu}
            handleNavigate={handleNavigate}
          />

          <div className="p-4 border-t border-[#2a4a04] flex-shrink-0">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-[#2a4a04] hover:text-white"
              asChild
            >
              <Link to="/login" onClick={handleLogout}>
                <LogOut className={cn("h-5 w-5", collapsed ? "" : "mr-2")} />
                {!collapsed && <span>Cerrar Sesión</span>}
              </Link>
            </Button>
          </div>
        </div>
      </aside>

      {/* Sidebar Móvil - Pantalla completa como overlay */}
      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 z-50 w-full h-screen bg-[#1a2e02] text-white flex flex-col transition-transform duration-300 overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xl font-bold">Granme</h2>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-[#2a4a04] hover:text-white"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Cerrar menú</span>
              </Button>
            )}
          </div>

          <SidebarContent
            pathname={pathname}
            collapsed={false}
            openMenus={openMenus}
            toggleMenu={toggleMenu}
            handleNavigate={handleNavigate}
          />

          <div className="p-4 border-t border-[#2a4a04] flex-shrink-0">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-[#2a4a04] hover:text-white"
              asChild
            >
              <Link to="/login" onClick={handleNavigate}>
                <LogOut className="h-5 w-5 mr-2" />
                <span>Cerrar Sesión</span>
              </Link>
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
