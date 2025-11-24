import { useState, useEffect, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"

// Importar los gráficos de forma dinámica para evitar problemas de hidratación y mejorar el rendimiento
const Charts = dynamic(() => import("./dashboard-charts"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-md"></div>
})

// Componente optimizado con memoización para las tarjetas
const StatCard = memo(({ title, value, change }: { title, value, change }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{change}</p>
    </CardContent>
  </Card>
))

// Evita re-renderizados innecesarios
StatCard.displayName = "StatCard"

function DashboardContentOptimized() {
  const [user, setUser] = useState<{ name } | null>(null)
  
  // Obtener los datos del usuario una sola vez al montar el componente
  useEffect(() => {
    // Usamos una función para evitar repetir el código de try/catch
    const getUserFromStorage = () => {
      try {
        const userData = localStorage.getItem("user")
        return userData ? JSON.parse(userData) 
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error)
        return null
      }
    }
    
    setUser(getUserFromStorage())
  }, [])

  // Preparar el nombre de usuario para el saludo
  const firstName = user?.name ? user.name.split(' ')[0] 

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">
          {firstName ? `Bienvenido, ${firstName}` : 'Dashboard'}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Porcinos" 
          value="78" 
          change="+5 desde el mes pasado" 
        />
        <StatCard 
          title="Producción de Leche" 
          value="148 L" 
          change="-2 L desde el mes pasado" 
        />
        <StatCard 
          title="Nuevas Crías" 
          value="12" 
          change="+3 desde el mes pasado" 
        />
        <StatCard 
          title="Alimento en Stock" 
          value="850 kg" 
          change="Suficiente para 28 días" 
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Charts />
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Detallado</CardTitle>
              <CardDescription>Análisis detallado de la producción y crecimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Contenido de análisis detallado se mostrará aquí.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reportes Disponibles</CardTitle>
              <CardDescription>Reportes generados para la granja</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Lista de reportes disponibles para descargar en PDF.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Exportación por defecto para compatibilidad con lazy loading
export default DashboardContentOptimized 