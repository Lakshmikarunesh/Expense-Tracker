import React, { useState } from 'react';
import { Expense, EXPENSE_CATEGORIES } from '../types';
import { Button } from './UI/Button';
import { Input } from './UI/Input';
import { Select } from './UI/Select';
import { Save, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ExpenseFormProps {
  expense?: Expense;
  onSave: (expense: Expense) => void;
  onCancel: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  expense,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    amount: expense?.amount?.toString() || '',
    category: expense?.category || EXPENSE_CATEGORIES[0],
    date: expense?.date?.split('T')[0] || new Date().toISOString().split('T')[0],
    notes: expense?.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const expenseData: Expense = {
        id: expense?.id || uuidv4(),
        amount: Number(formData.amount),
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        notes: formData.notes,
        synced: false,
        createdAt: expense?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSave(expenseData);
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const categoryOptions = EXPENSE_CATEGORIES.map(category => ({
    value: category,
    label: category
  }));

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={onCancel}
          >
            Back
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              error={errors.amount}
              fullWidth
              placeholder="0.00"
            />

            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              options={categoryOptions}
              error={errors.category}
              fullWidth
            />
          </div>

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            error={errors.date}
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              icon={Save}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {expense ? 'Update' : 'Save'} Expense
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};