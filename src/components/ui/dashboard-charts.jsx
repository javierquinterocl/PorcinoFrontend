import { memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Datos estáticos pre-cargados para evitar esperas innecesarias
const pigBreedData = [
  { name: "Alpina", value: 25 },
  { name: "Saanen", value: 18 },
  { name: "Nubia", value: 15 },
  { name: "Toggenburg", value: 12 },
  { name: "Boer", value: 8 },
]

const milkProductionData = [
  { month: "Ene", produccion: 120 },
  { month: "Feb", produccion: 132 },
  { month: "Mar", produccion: 145 },
  { month: "Abr", produccion: 150 },
  { month: "May", produccion: 148 },
  { month: "Jun", produccion: 138 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

// Componente de gráficos optimizado con memoización
function DashboardCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Distribución por Raza</CardTitle>
          <CardDescription>Distribución de porcinos por raza en la granja</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pigBreedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pigBreedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Producción de Leche</CardTitle>
          <CardDescription>Producción mensual de leche (litros)</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={milkProductionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="produccion" fill="#6b7c45" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// Usar memo para evitar re-renderizados innecesarios
export default memo(DashboardCharts) 