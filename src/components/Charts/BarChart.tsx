import React, { useRef, useEffect } from 'react';
import { Expense } from '../../types';
import { format, startOfWeek, addDays } from 'date-fns';

interface BarChartProps {
  expenses: Expense[];
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ expenses, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get current week data
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayExpenses = expenses.filter(expense => 
        expense.date.startsWith(dateStr)
      );
      const total = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      return {
        day: format(date, 'EEE'),
        date: dateStr,
        total
      };
    });

    const maxValue = Math.max(...weekData.map(d => d.total), 100);
    const barWidth = (canvas.width - 80) / 7;
    const chartHeight = canvas.height - 80;

    // Draw bars
    weekData.forEach((data, index) => {
      const barHeight = (data.total / maxValue) * chartHeight;
      const x = 40 + index * barWidth;
      const y = canvas.height - 40 - barHeight;

      // Draw bar
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(x + 5, y, barWidth - 10, barHeight);

      // Draw day label
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data.day, x + barWidth / 2, canvas.height - 20);

      // Draw value
      if (data.total > 0) {
        ctx.fillStyle = '#1F2937';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(`$${data.total.toFixed(0)}`, x + barWidth / 2, y - 5);
      }
    });

    // Draw Y-axis labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const value = (maxValue / 5) * i;
      const y = canvas.height - 40 - (chartHeight / 5) * i;
      ctx.fillText(`$${value.toFixed(0)}`, 35, y + 3);
    }

  }, [expenses]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={250}
        className="w-full h-full"
      />
    </div>
  );
};