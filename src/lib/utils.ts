import { type ClassValue, clsx } from 'clsx';
import { Timestamp } from 'firebase/firestore';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function toDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string') return new Date(val);
  if (typeof val === 'number') return new Date(val);
  if (val?.toDate) return val.toDate();
  return null;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: any): string {
  const d = toDate(date);
  if (!d) return '-';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: any): string {
  const d = toDate(date);
  if (!d) return '-';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

export function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'New': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Contacted': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    'Follow-up': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Interested': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'Site Survey': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    'Quotation Sent': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    'Negotiation': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'Confirmed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Lost': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Installed': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Draft': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    'Sent': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Accepted': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Paid': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Overdue': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Open': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Assigned': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'InProgress': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    'Resolved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Closed': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'In Progress': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    'Delayed': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Scheduled': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Missed': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    'Low': 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
    'Medium': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    'High': 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    'Urgent': 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[priority] || 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
}

export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    'super_admin': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'sales_manager': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'sales_executive': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'survey_engineer': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'installation_team': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'accounts_staff': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  };
  return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
}

export function formatRoleName(role: string): string {
  const names: Record<string, string> = {
    super_admin: 'Super Admin',
    sales_manager: 'Sales Manager',
    sales_executive: 'Sales Executive',
    survey_engineer: 'Survey Engineer',
    installation_team: 'Installation Team',
    accounts_staff: 'Accounts Staff',
  };
  return names[role] || role;
}

export function getDaysRemaining(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
