import React, { useState, useEffect } from 'react';
import { Expense, EXPENSE_CATEGORIES } from '../types';
import { Button } from './UI/Button';
import { Input } from './UI/Input';
import { Select } from './UI/Select';
import { Modal } from './UI/Modal';
import { Edit, Trash2, Download, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { exportService } from '../services/exportService';

interface ExpenseHistoryProps {
  expenses: Expense[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpenseHistory: React.FC<ExpenseHistoryProps> = ({
  expenses,
  onEditExpense,
  onDeleteExpense
}) => {
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    let filtered = expenses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(expense => expense.date >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter(expense => expense.date <= dateRange.end);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredExpenses(filtered);
    setCurrentPage(1);
  }, [expenses, searchTerm, selectedCategory, dateRange]);

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (expenseToDelete) {
      onDeleteExpense(expenseToDelete.id);
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
    }
  };

  const handleExportCSV = () => {
    exportService.exportExpensesToCSV(filteredExpenses);
  };

  const handleExportJSON = () => {
    exportService.exportExpensesToJSON(filteredExpenses);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setDateRange({ start: '', end: '' });
  };

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...EXPENSE_CATEGORIES.map(category => ({
      value: category,
      label: category
    }))
  ];

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Expense History
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
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                fullWidth
              />
            </div>

            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={categoryOptions}
              fullWidth
            />

            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              fullWidth
            />

            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              fullWidth
            />
          </div>

          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredExpenses.length} expenses • Total: ${totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Expense List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {format(new Date(expense.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    ${expense.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {expense.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit}
                      onClick={() => onEditExpense(expense)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDeleteClick(expense)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredExpenses.length)} of {filteredExpenses.length} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Expense"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this expense? This action cannot be undone.
          </p>
          {expenseToDelete && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm">
                <strong>Amount:</strong> ${expenseToDelete.amount.toFixed(2)}
              </p>
              <p className="text-sm">
                <strong>Category:</strong> {expenseToDelete.category}
              </p>
              <p className="text-sm">
                <strong>Date:</strong> {format(new Date(expenseToDelete.date), 'MMM dd, yyyy')}
              </p>
              {expenseToDelete.notes && (
                <p className="text-sm">
                  <strong>Notes:</strong> {expenseToDelete.notes}
                </p>
              )}
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};