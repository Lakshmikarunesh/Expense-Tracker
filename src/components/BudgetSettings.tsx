import React, { useState, useEffect } from 'react';
import { Budget, EXPENSE_CATEGORIES } from '../types';
import { Button } from './UI/Button';
import { Input } from './UI/Input';
import { Select } from './UI/Select';
import { Modal } from './UI/Modal';
import { Save, Plus, Edit, Trash2, Download } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { exportService } from '../services/exportService';

interface BudgetSettingsProps {
  budgets: Budget[];
  onSaveBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
  expenses: any[];
}

export const BudgetSettings: React.FC<BudgetSettingsProps> = ({
  budgets,
  onSaveBudget,
  onDeleteBudget,
  expenses
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [updatedBudgets, setUpdatedBudgets] = useState<Budget[]>([]);
  const [formData, setFormData] = useState({
    category: EXPENSE_CATEGORIES[0],
    monthlyLimit: '',
    month: format(new Date(), 'yyyy-MM')
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Calculate spent amounts for each budget
    const budgetsWithUpdatedSpent = budgets.map(budget => {
      const spent = expenses
        .filter(expense => 
          expense.category === budget.category && 
          expense.date.startsWith(budget.month)
        )
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      return { ...budget, spent };
    });

    setUpdatedBudgets(budgetsWithUpdatedSpent);

    // Update budgets in database if spent amounts changed
    budgetsWithUpdatedSpent.forEach(budget => {
      const originalBudget = budgets.find(b => b.id === budget.id);
      if (originalBudget && originalBudget.spent !== budget.spent) {
        // Update the budget with new spent amount
        const updatedBudget = { ...budget, updatedAt: new Date().toISOString() };
        onSaveBudget(updatedBudget);
      }
    });
  }, [expenses, budgets, onSaveBudget]);

  const handleOpenModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        category: budget.category,
        monthlyLimit: budget.monthlyLimit.toString(),
        month: budget.month
      });
    } else {
      setEditingBudget(null);
      setFormData({
        category: EXPENSE_CATEGORIES[0],
        monthlyLimit: '',
        month: format(new Date(), 'yyyy-MM')
      });
    }
    setIsModalOpen(true);
    setErrors({});
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
    setFormData({
      category: EXPENSE_CATEGORIES[0],
      monthlyLimit: '',
      month: format(new Date(), 'yyyy-MM')
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.monthlyLimit || isNaN(Number(formData.monthlyLimit)) || Number(formData.monthlyLimit) <= 0) {
      newErrors.monthlyLimit = 'Please enter a valid monthly limit';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.month) {
      newErrors.month = 'Please select a month';
    }

    // Check for duplicate budget (same category and month)
    const existingBudget = budgets.find(budget => 
      budget.category === formData.category && 
      budget.month === formData.month &&
      budget.id !== editingBudget?.id
    );

    if (existingBudget) {
      newErrors.category = 'Budget already exists for this category and month';
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
      const spent = expenses
        .filter(expense => 
          expense.category === formData.category && 
          expense.date.startsWith(formData.month)
        )
        .reduce((sum, expense) => sum + expense.amount, 0);

      const budgetData: Budget = {
        id: editingBudget?.id || uuidv4(),
        category: formData.category,
        monthlyLimit: Number(formData.monthlyLimit),
        month: formData.month,
        spent,
        createdAt: editingBudget?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSaveBudget(budgetData);
      handleCloseModal();
    } catch (error) {
      console.error('Error saving budget:', error);
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

  const handleExportCSV = () => {
    exportService.exportBudgetsToCSV(budgets);
  };

  const handleExportJSON = () => {
    exportService.exportBudgetsToJSON(budgets);
  };

  const categoryOptions = EXPENSE_CATEGORIES.map(category => ({
    value: category,
    label: category
  }));

  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.monthlyLimit) * 100;
    if (percentage >= 100) return 'over';
    if (percentage >= 80) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      default: return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Budget Settings
            </h2>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                icon={Download}
                onClick={handleExportCSV}
              >
                Export CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={Download}
                onClick={handleExportJSON}
              >
                Export JSON
              </Button>
              <Button
                icon={Plus}
                onClick={() => handleOpenModal()}
              >
                Add Budget
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {updatedBudgets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No budgets set up yet. Create your first budget to start tracking your spending.
              </p>
              <Button
                icon={Plus}
                onClick={() => handleOpenModal()}
              >
                Create Budget
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {updatedBudgets.map((budget) => {
                const status = getBudgetStatus(budget);
                const percentage = (budget.spent / budget.monthlyLimit) * 100;

                return (
                  <div key={budget.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {budget.category}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(budget.month + '-01'), 'MMMM yyyy')}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit}
                          onClick={() => handleOpenModal(budget)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => onDeleteBudget(budget.id)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Spent</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${budget.spent.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Budget</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${budget.monthlyLimit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Remaining</span>
                        <span className={`font-medium ${status === 'over' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          ${(budget.monthlyLimit - budget.spent).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className={`font-medium ${getStatusColor(status)}`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            status === 'over' ? 'bg-red-500' : 
                            status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status === 'over' ? 'Over Budget' : 
                         status === 'warning' ? 'Near Limit' : 'On Track'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingBudget ? 'Edit Budget' : 'Add New Budget'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            options={categoryOptions}
            error={errors.category}
            fullWidth
          />

          <Input
            label="Monthly Limit"
            type="number"
            step="0.01"
            min="0"
            value={formData.monthlyLimit}
            onChange={(e) => handleChange('monthlyLimit', e.target.value)}
            error={errors.monthlyLimit}
            fullWidth
            placeholder="0.00"
          />

          <Input
            label="Month"
            type="month"
            value={formData.month}
            onChange={(e) => handleChange('month', e.target.value)}
            error={errors.month}
            fullWidth
          />

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseModal}
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
              {editingBudget ? 'Update' : 'Create'} Budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};