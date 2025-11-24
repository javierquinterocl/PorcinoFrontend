import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
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
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Datos de ejemplo para alimentación
const feedUsageData = [
  { month: "Ene", concentrado: 120, heno: 200, forraje: 150 },
  { month: "Feb", concentrado: 130, heno: 210, forraje: 160 },
  { month: "Mar", concentrado: 140, heno: 220, forraje: 170 },
  { month: "Abr", concentrado: 150, heno: 230, forraje: 180 },
  { month: "May", concentrado: 160, heno: 240, forraje: 190 },
  { month: "Jun", concentrado: 170, heno: 250, forraje: 200 },
]

// Datos de ejemplo para ganancia de peso
const weightGainData = [
  { month: "Ene", adultos: 45, jovenes: 25 },
  { month: "Feb", adultos: 46, jovenes: 27 },
  { month: "Mar", adultos: 47, jovenes: 29 },
  { month: "Abr", adultos: 48, jovenes: 31 },
  { month: "May", adultos: 49, jovenes: 33 },
  { month: "Jun", adultos: 50, jovenes: 35 },
]

// Datos de ejemplo para nacimientos
const birthsData = [
  { month: "Ene", nacimientos: 5, supervivencia: 5 },
  { month: "Feb", nacimientos: 3, supervivencia: 3 },
  { month: "Mar", nacimientos: 7, supervivencia: 6 },
  { month: "Abr", nacimientos: 4, supervivencia: 4 },
  { month: "May", nacimientos: 6, supervivencia: 5 },
  { month: "Jun", nacimientos: 8, supervivencia: 7 },
]

// Datos de ejemplo para vacunaciones
const vaccinationData = [
  { name: "Clostridial", value: 45 },
  { name: "Brucelosis", value: 30 },
  { name: "Rabia", value: 15 },
  { name: "Ectima", value: 25 },
  { name: "Otras", value: 10 },
]

// Datos de ejemplo para ciclos de estro
const estrusData = [
  { month: "Ene", ciclos: 12, fertilidad: 8 },
  { month: "Feb", ciclos: 10, fertilidad: 7 },
  { month: "Mar", ciclos: 15, fertilidad: 10 },
  { month: "Abr", ciclos: 14, fertilidad: 9 },
  { month: "May", ciclos: 16, fertilidad: 11 },
  { month: "Jun", ciclos: 13, fertilidad: 9 },
]

// Datos de ejemplo para producción de leche
const milkProductionData = [
  { month: "Ene", produccion: 120 },
  { month: "Feb", produccion: 132 },
  { month: "Mar", produccion: 145 },
  { month: "Abr", produccion: 150 },
  { month: "May", produccion: 148 },
  { month: "Jun", produccion: 138 },
]

// Datos de ejemplo para tabla de alimentación
const feedingTableData = [
  {
    id: 1,
    date: "2023-06-01",
    type: "Concentrado",
    quantity: 25,
    unit: "kg",
    porcinos: "Todos",
    notes: "Alimentación matutina",
  },
  {
    id: 2,
    date: "2023-06-01",
    type: "Heno",
    quantity: 40,
    unit: "kg",
    porcinos: "Todos",
    notes: "Alimentación vespertina",
  },
  {
    id: 3,
    date: "2023-06-02",
    type: "Concentrado",
    quantity: 25,
    unit: "kg",
    porcinos: "Todos",
    notes: "Alimentación matutina",
  },
  {
    id: 4,
    date: "2023-06-02",
    type: "Forraje",
    quantity: 35,
    unit: "kg",
    porcinos: "Adultos",
    notes: "Alimentación especial",
  },
  {
    id: 5,
    date: "2023-06-03",
    type: "Concentrado",
    quantity: 25,
    unit: "kg",
    porcinos: "Todos",
    notes: "Alimentación matutina",
  },
  {
    id: 6,
    date: "2023-06-03",
    type: "Heno",
    quantity: 40,
    unit: "kg",
    porcinos: "Todos",
    notes: "Alimentación vespertina",
  },
]

// Datos de ejemplo para tabla de nacimientos
const birthsTableData = [
  {
    id: 1,
    date: "2023-06-02",
    mother: "CAP001",
    kids: 2,
    maleKids: 1,
    femaleKids: 1,
    status: "Saludable",
    notes: "Parto normal",
  },
  {
    id: 2,
    date: "2023-06-05",
    mother: "CAP003",
    kids: 3,
    maleKids: 2,
    femaleKids: 1,
    status: "Saludable",
    notes: "Parto asistido",
  },
  {
    id: 3,
    date: "2023-06-10",
    mother: "CAP007",
    kids: 1,
    maleKids: 0,
    femaleKids: 1,
    status: "Saludable",
    notes: "Parto normal",
  },
  {
    id: 4,
    date: "2023-06-15",
    mother: "CAP012",
    kids: 2,
    maleKids: 1,
    femaleKids: 1,
    status: "Complicaciones",
    notes: "Requirió atención veterinaria",
  },
  {
    id: 5,
    date: "2023-06-20",
    mother: "CAP005",
    kids: 2,
    maleKids: 2,
    femaleKids: 0,
    status: "Saludable",
    notes: "Parto normal",
  },
]

// Datos de ejemplo para tabla de vacunaciones
const vaccinationTableData = [
  {
    id: 1,
    date: "2023-06-01",
    vaccine: "Clostridial",
    porcinos: "Todos",
    quantity: 45,
    appliedBy: "Dr. Martínez",
    notes: "Vacunación anual",
  },
  {
    id: 2,
    date: "2023-06-05",
    vaccine: "Brucelosis",
    porcinos: "Hembras adultas",
    quantity: 30,
    appliedBy: "Dr. Martínez",
    notes: "Vacunación preventiva",
  },
  {
    id: 3,
    date: "2023-06-10",
    vaccine: "Rabia",
    porcinos: "Todos",
    quantity: 45,
    appliedBy: "Dr. Martínez",
    notes: "Vacunación anual",
  },
  {
    id: 4,
    date: "2023-06-15",
    vaccine: "Ectima",
    porcinos: "Jóvenes",
    quantity: 15,
    appliedBy: "Dr. Martínez",
    notes: "Primera dosis",
  },
  {
    id: 5,
    date: "2023-06-20",
    vaccine: "Otras",
    porcinos: "Seleccionados",
    quantity: 10,
    appliedBy: "Dr. Martínez",
    notes: "Tratamiento específico",
  },
]

// Colores para gráficas
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export function DetailedReports() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Reportes y Estadísticas</h2>
      </div>

      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="feed">Alimentación</TabsTrigger>
          <TabsTrigger value="weight">Peso</TabsTrigger>
          <TabsTrigger value="births">Nacimientos</TabsTrigger>
          <TabsTrigger value="vaccinations">Vacunaciones</TabsTrigger>
          <TabsTrigger value="estrus">Ciclos de Estro</TabsTrigger>
          <TabsTrigger value="milk">Producción de Leche</TabsTrigger>
        </TabsList>

        {/* Pestaña de Alimentación */}
        <TabsContent value="feed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Consumo de Alimento</CardTitle>
                <CardDescription>Consumo mensual por tipo de alimento (kg)</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={feedUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="concentrado" fill="#6b7c45" name="Concentrado" />
                    <Bar dataKey="heno" fill="#8884d8" name="Heno" />
                    <Bar dataKey="forraje" fill="#82ca9d" name="Forraje" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Alimentación</CardTitle>
                <CardDescription>Porcentaje por tipo de alimento</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Concentrado", value: 840 },
                        { name: "Heno", value: 1350 },
                        { name: "Forraje", value: 1050 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {feedUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registro de Alimentación</CardTitle>
              <CardDescription>Detalle de alimentación diaria</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Porcinos</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedingTableData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{row.unit}</TableCell>
                      <TableCell>{row.porcinos}</TableCell>
                      <TableCell>{row.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Alimentación</CardTitle>
              <CardDescription>Resumen de consumo de alimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Consumo Total</h3>
                  <div className="text-3xl font-bold">3,240 kg</div>
                  <p className="text-sm text-muted-foreground">En los últimos 6 meses</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Promedio Diario</h3>
                  <div className="text-3xl font-bold">18 kg</div>
                  <p className="text-sm text-muted-foreground">Por día</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Costo Total</h3>
                  <div className="text-3xl font-bold">$9,720</div>
                  <p className="text-sm text-muted-foreground">En los últimos 6 meses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Peso */}
        <TabsContent value="weight" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Ganancia de Peso</CardTitle>
                <CardDescription>Promedio mensual por grupo (kg)</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightGainData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="adultos" stroke="#6b7c45" name="Adultos" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="jovenes" stroke="#8884d8" name="Jóvenes" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Crecimiento</CardTitle>
                <CardDescription>Tasa de crecimiento mensual (%)</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { month: "Ene", adultos: 2.2, jovenes: 8.0 },
                      { month: "Feb", adultos: 2.1, jovenes: 8.2 },
                      { month: "Mar", adultos: 2.3, jovenes: 7.8 },
                      { month: "Abr", adultos: 2.0, jovenes: 7.5 },
                      { month: "May", adultos: 2.1, jovenes: 6.9 },
                      { month: "Jun", adultos: 2.2, jovenes: 6.5 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="adultos" stroke="#6b7c45" fill="#6b7c45" name="Adultos" />
                    <Area type="monotone" dataKey="jovenes" stroke="#8884d8" fill="#8884d8" name="Jóvenes" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Peso</CardTitle>
              <CardDescription>Resumen de ganancia de peso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Peso Promedio Adultos</h3>
                  <div className="text-3xl font-bold">47.5 kg</div>
                  <p className="text-sm text-muted-foreground">+5 kg desde inicio de año</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Peso Promedio Jóvenes</h3>
                  <div className="text-3xl font-bold">30 kg</div>
                  <p className="text-sm text-muted-foreground">+10 kg desde inicio de año</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Ganancia Mensual Adultos</h3>
                  <div className="text-3xl font-bold">1 kg</div>
                  <p className="text-sm text-muted-foreground">Promedio mensual</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Ganancia Mensual Jóvenes</h3>
                  <div className="text-3xl font-bold">2 kg</div>
                  <p className="text-sm text-muted-foreground">Promedio mensual</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Nacimientos */}
        <TabsContent value="births" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Nacimientos Mensuales</CardTitle>
                <CardDescription>Número de nacimientos y supervivencia</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={birthsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="nacimientos" fill="#6b7c45" name="Nacimientos" />
                    <Bar dataKey="supervivencia" fill="#82ca9d" name="Supervivencia" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Género</CardTitle>
                <CardDescription>Proporción de machos y hembras nacidos</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Machos", value: 18 },
                        { name: "Hembras", value: 15 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#6b7c45" />
                      <Cell fill="#8884d8" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registro de Nacimientos</CardTitle>
              <CardDescription>Detalle de nacimientos recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Madre</TableHead>
                    <TableHead>Crías</TableHead>
                    <TableHead>Machos</TableHead>
                    <TableHead>Hembras</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {birthsTableData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.mother}</TableCell>
                      <TableCell>{row.kids}</TableCell>
                      <TableCell>{row.maleKids}</TableCell>
                      <TableCell>{row.femaleKids}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{row.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Nacimientos</CardTitle>
              <CardDescription>Resumen de nacimientos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Total Nacimientos</h3>
                  <div className="text-3xl font-bold">33</div>
                  <p className="text-sm text-muted-foreground">En los últimos 6 meses</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Tasa de Supervivencia</h3>
                  <div className="text-3xl font-bold">91%</div>
                  <p className="text-sm text-muted-foreground">30 crías sobrevivientes</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Promedio de Crías</h3>
                  <div className="text-3xl font-bold">1.8</div>
                  <p className="text-sm text-muted-foreground">Por parto</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Partos Asistidos</h3>
                  <div className="text-3xl font-bold">15%</div>
                  <p className="text-sm text-muted-foreground">5 de 33 partos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Vacunaciones */}
        <TabsContent value="vaccinations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Vacunas Aplicadas</CardTitle>
                <CardDescription>Distribución por tipo de vacuna</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vaccinationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {vaccinationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Calendario de Vacunación</CardTitle>
                <CardDescription>Vacunaciones programadas y realizadas</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { month: "Ene", programadas: 45, realizadas: 45 },
                      { month: "Feb", programadas: 0, realizadas: 0 },
                      { month: "Mar", programadas: 0, realizadas: 0 },
                      { month: "Abr", programadas: 30, realizadas: 30 },
                      { month: "May", programadas: 15, realizadas: 15 },
                      { month: "Jun", programadas: 45, realizadas: 45 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="programadas" fill="#8884d8" name="Programadas" />
                    <Bar dataKey="realizadas" fill="#6b7c45" name="Realizadas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registro de Vacunaciones</CardTitle>
              <CardDescription>Detalle de vacunaciones recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Vacuna</TableHead>
                    <TableHead>Porcinos</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Aplicado por</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaccinationTableData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.vaccine}</TableCell>
                      <TableCell>{row.porcinos}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{row.appliedBy}</TableCell>
                      <TableCell>{row.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximas Vacunaciones</CardTitle>
              <CardDescription>Calendario de vacunaciones programadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-muted rounded-lg">
                  <Calendar className="h-10 w-10 text-[#6b7c45] mr-4" />
                  <div className="flex-1">
                    <h3 className="font-medium">Vacunación Clostridial</h3>
                    <p className="text-sm text-muted-foreground">Programada para el 15 de julio, 2023</p>
                  </div>
                  <Badge>Próxima</Badge>
                </div>
                <div className="flex items-center p-3 bg-muted rounded-lg">
                  <Calendar className="h-10 w-10 text-[#6b7c45] mr-4" />
                  <div className="flex-1">
                    <h3 className="font-medium">Vacunación Brucelosis</h3>
                    <p className="text-sm text-muted-foreground">Programada para el 1 de agosto, 2023</p>
                  </div>
                  <Badge variant="outline">Pendiente</Badge>
                </div>
                <div className="flex items-center p-3 bg-muted rounded-lg">
                  <Calendar className="h-10 w-10 text-[#6b7c45] mr-4" />
                  <div className="flex-1">
                    <h3 className="font-medium">Refuerzo Ectima</h3>
                    <p className="text-sm text-muted-foreground">Programada para el 15 de agosto, 2023</p>
                  </div>
                  <Badge variant="outline">Pendiente</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Ciclos de Estro */}
        <TabsContent value="estrus" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Ciclos de Estro</CardTitle>
                <CardDescription>Ciclos detectados y fertilidad</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={estrusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ciclos"
                      stroke="#6b7c45"
                      name="Ciclos Detectados"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="fertilidad"
                      stroke="#8884d8"
                      name="Fertilidad"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasa de Fertilidad</CardTitle>
                <CardDescription>Porcentaje de fertilidad por mes</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { month: "Ene", tasa: 66.7 },
                      { month: "Feb", tasa: 70.0 },
                      { month: "Mar", tasa: 66.7 },
                      { month: "Abr", tasa: 64.3 },
                      { month: "May", tasa: 68.8 },
                      { month: "Jun", tasa: 69.2 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="tasa"
                      stroke="#6b7c45"
                      fill="#6b7c45"
                      name="Tasa de Fertilidad (%)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Reproducción</CardTitle>
              <CardDescription>Resumen de ciclos de estro y fertilidad</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Total Ciclos Detectados</h3>
                  <div className="text-3xl font-bold">80</div>
                  <p className="text-sm text-muted-foreground">En los últimos 6 meses</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Fertilidad Promedio</h3>
                  <div className="text-3xl font-bold">67.5%</div>
                  <p className="text-sm text-muted-foreground">54 gestaciones confirmadas</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Duración Promedio</h3>
                  <div className="text-3xl font-bold">36 h</div>
                  <p className="text-sm text-muted-foreground">Duración del estro</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Intervalo Entre Ciclos</h3>
                  <div className="text-3xl font-bold">21 días</div>
                  <p className="text-sm text-muted-foreground">Promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registro de Montas</CardTitle>
              <CardDescription>Detalle de montas y resultados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hembra</TableHead>
                    <TableHead>Macho</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>2023-06-05</TableCell>
                    <TableCell>CAP001</TableCell>
                    <TableCell>CAP003</TableCell>
                    <TableCell>Natural</TableCell>
                    <TableCell>Pendiente</TableCell>
                    <TableCell>Primer servicio</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2023-06-02</TableCell>
                    <TableCell>CAP007</TableCell>
                    <TableCell>CAP003</TableCell>
                    <TableCell>Natural</TableCell>
                    <TableCell>Pendiente</TableCell>
                    <TableCell>Segundo servicio</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2023-05-28</TableCell>
                    <TableCell>CAP012</TableCell>
                    <TableCell>CAP005</TableCell>
                    <TableCell>Natural</TableCell>
                    <TableCell>Exitoso</TableCell>
                    <TableCell>Confirmado por ecografía</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2023-05-25</TableCell>
                    <TableCell>CAP009</TableCell>
                    <TableCell>CAP003</TableCell>
                    <TableCell>Natural</TableCell>
                    <TableCell>Exitoso</TableCell>
                    <TableCell>Confirmado por ecografía</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2023-05-20</TableCell>
                    <TableCell>CAP015</TableCell>
                    <TableCell>CAP005</TableCell>
                    <TableCell>Natural</TableCell>
                    <TableCell>Fallido</TableCell>
                    <TableCell>Se repetirá en próximo ciclo</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Producción de Leche */}
        <TabsContent value="milk" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Producción de Leche</CardTitle>
                <CardDescription>Producción mensual en litros</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={milkProductionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="produccion" fill="#6b7c45" name="Producción (L)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Producción</CardTitle>
                <CardDescription>Evolución de la producción de leche</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={milkProductionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="produccion"
                      stroke="#6b7c45"
                      name="Producción (L)"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Producción</CardTitle>
              <CardDescription>Resumen de producción de leche</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Producción Total</h3>
                  <div className="text-3xl font-bold">833 L</div>
                  <p className="text-sm text-muted-foreground">En los últimos 6 meses</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Promedio Mensual</h3>
                  <div className="text-3xl font-bold">138.8 L</div>
                  <p className="text-sm text-muted-foreground">Por mes</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Promedio por Cerdo</h3>
                  <div className="text-3xl font-bold">2.5 L</div>
                  <p className="text-sm text-muted-foreground">Diario</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Ingresos Generados</h3>
                  <div className="text-3xl font-bold">$4,165</div>
                  <p className="text-sm text-muted-foreground">En los últimos 6 meses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Producción por Cerdo</CardTitle>
              <CardDescription>Rendimiento individual de las cabras lecheras</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Raza</TableHead>
                    <TableHead>Edad</TableHead>
                    <TableHead>Producción Diaria</TableHead>
                    <TableHead>Producción Mensual</TableHead>
                    <TableHead>Calidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>CAP001</TableCell>
                    <TableCell>Luna</TableCell>
                    <TableCell>Alpina</TableCell>
                    <TableCell>3 años</TableCell>
                    <TableCell>3.2 L</TableCell>
                    <TableCell>96 L</TableCell>
                    <TableCell>Alta</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CAP002</TableCell>
                    <TableCell>Sol</TableCell>
                    <TableCell>Saanen</TableCell>
                    <TableCell>4 años</TableCell>
                    <TableCell>3.5 L</TableCell>
                    <TableCell>105 L</TableCell>
                    <TableCell>Alta</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CAP004</TableCell>
                    <TableCell>Nube</TableCell>
                    <TableCell>Alpina</TableCell>
                    <TableCell>2 años</TableCell>
                    <TableCell>2.8 L</TableCell>
                    <TableCell>84 L</TableCell>
                    <TableCell>Media</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CAP006</TableCell>
                    <TableCell>Estrella</TableCell>
                    <TableCell>Saanen</TableCell>
                    <TableCell>3 años</TableCell>
                    <TableCell>3.0 L</TableCell>
                    <TableCell>90 L</TableCell>
                    <TableCell>Alta</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CAP007</TableCell>
                    <TableCell>Tormenta</TableCell>
                    <TableCell>Toggenburg</TableCell>
                    <TableCell>3 años</TableCell>
                    <TableCell>2.5 L</TableCell>
                    <TableCell>75 L</TableCell>
                    <TableCell>Media</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

