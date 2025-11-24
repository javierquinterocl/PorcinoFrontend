import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Colores profesionales para gráficos
export const CHART_COLORS = {
  primary: '#6b7c45',
  secondary: '#3b82f6',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  gray: '#6b7280',
};

export const MULTI_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.warning,
  CHART_COLORS.orange,
  CHART_COLORS.info,
];

/**
 * Componente de gráfico de barras personalizado
 */
export const CustomBarChart = ({ data, dataKey, xKey, title, color = CHART_COLORS.primary, height = 300 }) => {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-700">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey={xKey} 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Componente de gráfico de barras múltiples
 */
export const CustomMultiBarChart = ({ data, bars, xKey, title, height = 300 }) => {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-700">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey={xKey} 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          {bars.map((bar, index) => (
            <Bar 
              key={index}
              dataKey={bar.dataKey} 
              fill={bar.color || MULTI_COLORS[index % MULTI_COLORS.length]} 
              name={bar.name}
              radius={[8, 8, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Componente de gráfico de líneas personalizado
 */
export const CustomLineChart = ({ data, lines, xKey, title, height = 300 }) => {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-700">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey={xKey} 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          {lines.map((line, index) => (
            <Line 
              key={index}
              type="monotone" 
              dataKey={line.dataKey} 
              stroke={line.color || MULTI_COLORS[index % MULTI_COLORS.length]}
              name={line.name}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Componente de gráfico de pastel personalizado
 */
export const CustomPieChart = ({ data, dataKey, nameKey, title, height = 300, colors = MULTI_COLORS }) => {
  const RADIAN = Math.PI / 180;
  
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-700 text-center">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Componente de tarjeta de KPI
 */
export const KPICard = ({ title, value, target, unit = '', trend, met }) => {
  const metTarget = met !== undefined ? met : (
    trend === 'up' ? parseFloat(value) >= parseFloat(target) : parseFloat(value) <= parseFloat(target)
  );

  return (
    <div className={`p-6 rounded-lg border-2 transition-all ${
      metTarget 
        ? 'bg-green-50 border-green-500' 
        : 'bg-red-50 border-red-500'
    }`}>
      <h4 className="text-sm font-medium text-gray-600 mb-2">{title}</h4>
      <div className="flex items-end justify-between">
        <div>
          <p className={`text-3xl font-bold ${metTarget ? 'text-green-700' : 'text-red-700'}`}>
            {value}{unit}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Objetivo: {target}{unit}
          </p>
        </div>
        <div className="text-right">
          {metTarget ? (
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white">
              ✓
            </span>
          ) : (
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white">
              ✗
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Componente de tarjeta de estadística simple
 */
export const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    pink: 'from-pink-500 to-pink-600',
    gray: 'from-gray-500 to-gray-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className={`bg-gradient-to-r ${colorClasses[color]} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
          </div>
          {Icon && <Icon className="h-12 w-12 opacity-80" />}
        </div>
      </div>
    </div>
  );
};

/**
 * Componente de barra de progreso
 */
export const ProgressBar = ({ label, value, max, color = 'bg-blue-600', showPercentage = true }) => {
  const percentage = (value / Math.max(max, 1)) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">
          {value} {showPercentage && max > 0 && `(${percentage.toFixed(1)}%)`}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Componente de tabla comparativa simple
 */
export const ComparisonTable = ({ title, data, headers = ['Métrica', 'Valor Actual', 'Objetivo', 'Estado'] }) => {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-700">{title}</h3>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 text-sm text-gray-700">
                    {cellIndex === Object.values(row).length - 1 ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cell === 'SI' || cell === 'Cumple' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cell}
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
