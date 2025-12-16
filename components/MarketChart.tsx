import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { DataPoint } from '../types';
import { TEXTS } from '../constants';

interface MarketChartProps {
  data: DataPoint[];
  symbol: string;
  support?: number;
  resistance?: number;
}

const CustomTooltip = React.memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const volLabel = TEXTS.volume ? TEXTS.volume.slice(0,3) : 'Vol';

    return (
      <div className="bg-bg-card border border-border p-2 rounded shadow-xl backdrop-blur-md bg-opacity-95 z-50">
        <p className="text-text-muted text-[10px] font-mono mb-0.5">{label}</p>
        <p className="text-white text-base font-bold font-mono">
          ${data.value.toFixed(2)}
        </p>
        <p className="text-primary text-[10px] font-mono">
          {volLabel}: {data.payload.volume}
        </p>
      </div>
    );
  }
  return null;
});

const MarketChart: React.FC<MarketChartProps> = ({ data, symbol, support, resistance }) => {
  
  const { minPrice, maxPrice } = React.useMemo(() => {
    if (data.length === 0) return { minPrice: 0, maxPrice: 100 };
    let min = data[0].price;
    let max = data[0].price;
    for (let i = 1; i < data.length; i++) {
      if (data[i].price < min) min = data[i].price;
      if (data[i].price > max) max = data[i].price;
    }
    return { minPrice: min, maxPrice: max };
  }, [data]);

  const domainPadding = (maxPrice - minPrice) * 0.2;

  return (
    // touch-action: none prevents scrolling the page when interacting with the chart on mobile
    <div className="w-full h-[260px] md:h-[400px] bg-bg-card rounded-lg border border-border p-1 md:p-4 relative overflow-hidden transform-gpu transition-all duration-300" style={{ touchAction: 'none' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} opacity={0.5} />
          <XAxis 
            dataKey="time" 
            stroke="#525252" 
            tick={{ fontSize: 9, fill: '#737373' }} 
            tickLine={false}
            axisLine={false}
            minTickGap={40} // Increased gap for mobile readability
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[minPrice - domainPadding, maxPrice + domainPadding]} 
            stroke="#525252" 
            tick={{ fontSize: 9, fill: '#737373', fontFamily: 'JetBrains Mono' }} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toFixed(2)}
            orientation="right"
            width={45}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: '#333', strokeWidth: 1, strokeDasharray: '4 4' }} 
            isAnimationActive={false} // Performance optimization
          />
          
          {support && (
             <ReferenceLine y={support} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'insideRight', value: 'S', fill: '#10b981', fontSize: 9, dy: -10 }} />
          )}
          {resistance && (
             <ReferenceLine y={resistance} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideRight', value: 'R', fill: '#ef4444', fontSize: 9, dy: 10 }} />
          )}

          <Area
            type="monotone"
            dataKey="price"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)"
            isAnimationActive={false} // Disable initial animation for smoother live updates
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(MarketChart);