import React, { useRef, useEffect } from 'react';
import { Expense } from '../../types';

interface PieChartProps {
  expenses: Expense[];
  className?: string;
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
];

export const PieChart: React.FC<PieChartProps> = ({ expenses, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate category totals
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const categories = Object.keys(categoryTotals);
    const total = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);

    if (total === 0) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Draw pie chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    let startAngle = 0;

    categories.forEach((category, index) => {
      const value = categoryTotals[category];
      const angle = (value / total) * 2 * Math.PI;
      const color = COLORS[index % COLORS.length];

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Draw label
      const labelAngle = startAngle + angle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(category, labelX, labelY);
      
      const percentage = ((value / total) * 100).toFixed(1);
      ctx.fillText(`${percentage}%`, labelX, labelY + 15);

      startAngle += angle;
    });

  }, [expenses]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="w-full h-full"
      />
    </div>
  );
};