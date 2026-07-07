'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { BarChart3, PieChart, TrendingUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCollection } from '@/hooks/useFirestore';
import { Lead, Payment, Project } from '@/types';
import { formatCurrency, toDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { data: leads, loading: leadsLoading } = useCollection<Lead>('leads');
  const { data: payments } = useCollection<Payment>('payments');
  const { data: projects } = useCollection<Project>('projects');

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const totalCustomers = new Set(leads.filter((l) => l.status === 'Confirmed' || l.status === 'Installed').map((l) => l.customerName || l.id)).size;
    const conversionRate = totalLeads > 0 ? Math.round((totalCustomers / totalLeads) * 100) : 0;
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const avgDealSize = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    return { totalLeads, totalCustomers, conversionRate, avgDealSize, totalRevenue };
  }, [leads, payments]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { leads: number; conversions: number; revenue: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (const l of leads) {
      const d = toDate(l.createdAt);
      if (!d) continue;
      const key = monthNames[d.getMonth()] + d.getFullYear();
      if (!months[key]) months[key] = { leads: 0, conversions: 0, revenue: 0 };
      months[key].leads++;
      if (l.status === 'Confirmed' || l.status === 'Installed') months[key].conversions++;
    }

    for (const p of payments) {
      const d = toDate(p.paymentDate || p.createdAt);
      if (!d) continue;
      const key = monthNames[d.getMonth()] + d.getFullYear();
      if (!months[key]) months[key] = { leads: 0, conversions: 0, revenue: 0 };
      months[key].revenue += p.amount || 0;
    }

    return Object.entries(months).slice(-6).map(([month, data]) => ({
      month: month.slice(0, 3),
      leads: data.leads,
      conversions: data.conversions,
      revenue: Math.round(data.revenue / 100000),
    }));
  }, [leads, payments]);

  const statCards = [
    { label: 'Total Leads', value: String(stats.totalLeads), change: '', chart: '📈' },
    { label: 'Conversion Rate', value: `${stats.conversionRate}%`, change: '', chart: '📊' },
    { label: 'Avg. Deal Size', value: formatCurrency(Math.round(stats.avgDealSize)), change: '', chart: '📈' },
    { label: 'Total Customers', value: String(stats.totalCustomers), change: '', chart: '📉' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports & Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track your business performance</p>
        </div>
        <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={() => toast('Export feature coming soon')}>Export</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <span className="text-lg">{stat.chart}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{leadsLoading ? '-' : stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Monthly Performance</h2>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pb-1 border-b border-gray-200 dark:border-gray-700">
                  <span className="w-10">Month</span>
                  <span className="w-16 text-center">Leads</span>
                  <span className="w-20 text-center">Conversions</span>
                  <span className="w-24 text-right">Revenue (₹L)</span>
                </div>
                {monthlyData.map((m) => (
                  <div key={m.month} className="flex items-center justify-between text-sm">
                    <span className="w-10 font-medium text-gray-700 dark:text-gray-300">{m.month}</span>
                    <span className="w-16 text-center text-gray-600 dark:text-gray-400">{m.leads}</span>
                    <span className="w-20 text-center">
                      <span className="inline-flex items-center gap-1">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${m.leads > 0 ? (m.conversions / m.leads) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{m.conversions}</span>
                      </span>
                    </span>
                    <span className="w-24 text-right font-medium text-gray-900 dark:text-gray-100">{m.revenue}L</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Reports</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Lead Conversion Report', icon: PieChart, color: 'text-blue-600', desc: 'Conversion rates by source and stage' },
              { name: 'Sales Performance', icon: TrendingUp, color: 'text-green-600', desc: 'Individual and team sales metrics' },
              { name: 'Revenue Report', icon: BarChart3, color: 'text-purple-600', desc: 'Monthly and quarterly revenue breakdown' },
              { name: 'Installation Report', icon: BarChart3, color: 'text-orange-600', desc: 'Installation completion metrics' },
              { name: 'Employee Performance', icon: TrendingUp, color: 'text-teal-600', desc: 'Team member productivity analysis' },
              { name: 'Customer Acquisition', icon: PieChart, color: 'text-indigo-600', desc: 'Lead source effectiveness analysis' },
            ].map((report, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                <report.icon className={`w-5 h-5 ${report.color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{report.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{report.desc}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toast('Report view coming soon')}>View</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
