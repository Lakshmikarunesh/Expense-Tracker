import React, { useState, useEffect } from 'react';
import { Expense, Budget, EXPENSE_CATEGORIES } from '../types';
import { PieChart } from './Charts/PieChart';
import { BarChart } from './Charts/BarChart';
import { ProgressRing } from './Charts/ProgressRing';
import { NetworkDetection } from '../utils/networkDetection';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  expenses: Expense[];
  budgets: Budget[];
}

export const Dashboard: React.FC<DashboardProps> = ({ expenses, budgets }) => {
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState<Expense[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [budgetAlerts, setBudgetAlerts] = useState<Budget[]>([]);
  const [updatedBudgets, setUpdatedBudgets] = useState<Budget[]>([]);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  useEffect(() => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const currentExpenses = expenses.filter(expense => 
      expense.date.startsWith(currentMonth)
    );
    setCurrentMonthExpenses(currentExpenses);
    
    const total = currentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    setMonthlyTotal(total);

    // Calculate updated budget spent amounts
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

    // Calculate budget alerts
    const alerts = budgetsWithUpdatedSpent.filter(budget => {
      const percentage = (budget.spent / budget.monthlyLimit) * 100;
      return percentage >= 80;
    });
    setBudgetAlerts(alerts);

    // Get network information
    const networkDetection = NetworkDetection.getInstance();
    const connectionInfo = networkDetection.getConnectionInfo();
    setNetworkInfo(connectionInfo);
  }, [expenses, budgets]);

  const getCategorySpending = (category: string) => {
    return currentMonthExpenses
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getBudgetForCategory = (category: string) => {
    return updatedBudgets.find(budget => 
      budget.category === category && 
      budget.month === format(new Date(), 'yyyy-MM')
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                This Month
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ${monthlyTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Expenses
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {expenses.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Budget Alerts
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {budgetAlerts.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                Budget Alerts
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {budgetAlerts.map(budget => {
                  const percentage = (budget.spent / budget.monthlyLimit) * 100;
                  return (
                    <p key={budget.id}>
                      {budget.category}: {percentage.toFixed(0)}% of budget used
                      {percentage >= 100 && ` (over by $${(budget.spent - budget.monthlyLimit).toFixed(2)})`}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Network Information (for demo) */}
      {networkInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">
            Network Information API
          </h3>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p>Connection Type: {networkInfo.effectiveType || 'Unknown'}</p>
            <p>Downlink: {networkInfo.downlink ? `${networkInfo.downlink} Mbps` : 'Unknown'}</p>
            <p>RTT: {networkInfo.rtt ? `${networkInfo.rtt}ms` : 'Unknown'}</p>
            <p>Save Data: {networkInfo.saveData ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Spending by Category
          </h3>
          <PieChart expenses={currentMonthExpenses} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Weekly Spending
          </h3>
          <BarChart expenses={expenses} />
        </div>
      </div>

      {/* Budget Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Budget Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXPENSE_CATEGORIES.map(category => {
            const spent = getCategorySpending(category);
            const budget = getBudgetForCategory(category);
            const percentage = budget ? (spent / budget.monthlyLimit) * 100 : 0;

            return (
              <div key={category} className="flex items-center space-x-4">
                <ProgressRing 
                  percentage={percentage} 
                  size={80} 
                  strokeWidth={6}
                  useCanvas={true}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                </ProgressRing>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{category}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ${spent.toFixed(2)} / ${budget ? budget.monthlyLimit.toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};