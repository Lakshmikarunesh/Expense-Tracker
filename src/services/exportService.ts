import { Expense, Budget } from '../types';
import { format } from 'date-fns';

class ExportService {
  exportExpensesToCSV(expenses: Expense[]): void {
    const headers = ['Date', 'Category', 'Amount', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...expenses.map(expense => [
        format(new Date(expense.date), 'yyyy-MM-dd'),
        expense.category,
        expense.amount.toString(),
        `"${expense.notes.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    this.downloadFile(csvContent, 'expenses.csv', 'text/csv');
  }

  exportExpensesToJSON(expenses: Expense[]): void {
    const jsonContent = JSON.stringify(expenses, null, 2);
    this.downloadFile(jsonContent, 'expenses.json', 'application/json');
  }

  exportBudgetsToCSV(budgets: Budget[]): void {
    const headers = ['Category', 'Month', 'Monthly Limit', 'Spent', 'Remaining'];
    const csvContent = [
      headers.join(','),
      ...budgets.map(budget => [
        budget.category,
        budget.month,
        budget.monthlyLimit.toString(),
        budget.spent.toString(),
        (budget.monthlyLimit - budget.spent).toString()
      ].join(','))
    ].join('\n');

    this.downloadFile(csvContent, 'budgets.csv', 'text/csv');
  }

  exportBudgetsToJSON(budgets: Budget[]): void {
    const jsonContent = JSON.stringify(budgets, null, 2);
    this.downloadFile(jsonContent, 'budgets.json', 'application/json');
  }

  private downloadFile(content: string, filename: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const exportService = new ExportService();