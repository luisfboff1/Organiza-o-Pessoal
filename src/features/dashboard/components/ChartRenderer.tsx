'use client';

import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';

interface ChartRendererProps {
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'donut';
  data: any[];
  dataSource: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function ChartRenderer({ chartType, data, dataSource }: ChartRendererProps) {
  const isDark = useIsDarkMode();
  const axisColor = isDark ? 'hsl(215 20.2% 65.1%)' : 'hsl(215.4 16.3% 46.9%)';
  const gridColor = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)';
  const textColor = isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)';

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" stroke={axisColor} style={{ fontSize: '12px', fill: textColor }} />
          <YAxis stroke={axisColor} style={{ fontSize: '12px', fill: textColor }} />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
              borderRadius: '6px',
              color: textColor
            }}
          />
          <Legend wrapperStyle={{ color: textColor }} />
          {dataSource === 'finance' && data[0]?.Receita !== undefined ? (
            <>
              <Bar dataKey="Receita" fill="#10b981" />
              <Bar dataKey="Despesa" fill="#ef4444" />
            </>
          ) : (
            <Bar dataKey="value" fill="#3b82f6" />
          )}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" stroke={axisColor} style={{ fontSize: '12px', fill: textColor }} />
          <YAxis stroke={axisColor} style={{ fontSize: '12px', fill: textColor }} />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
              borderRadius: '6px',
              color: textColor
            }}
          />
          <Legend wrapperStyle={{ color: textColor }} />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" stroke={axisColor} style={{ fontSize: '12px', fill: textColor }} />
          <YAxis stroke={axisColor} style={{ fontSize: '12px', fill: textColor }} />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
              borderRadius: '6px',
              color: textColor
            }}
          />
          <Legend wrapperStyle={{ color: textColor }} />
          <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'pie' || chartType === 'donut') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={chartType === 'donut' ? 100 : 120}
            innerRadius={chartType === 'donut' ? 60 : 0}
            fill="#8884d8"
            dataKey="value"
            style={{ fontSize: '12px', fill: textColor }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
              borderRadius: '6px',
              color: textColor
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
