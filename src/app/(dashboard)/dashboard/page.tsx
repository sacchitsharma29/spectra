'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users, UserPlus, FileText, HardHat, CheckCircle2,
  ArrowUpRight, Calendar,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { CardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import { formatDate, toDate } from '@/lib/utils';
import { Lead, Customer } from '@/types';

export default function DashboardPage() {
  const { userData, firestoreReady } = useAuth();
  const { data: leads, loading: leadsLoading } = useCollection<Lead>('leads');
  const { data: customers, loading: customersLoading } = useCollection<Customer>('customers');

  const totalLeads = leads.length;
  const totalCustomers = customers.length;
  const newToday = leads.filter((l) => {
    const d = toDate(l.createdAt);
    return d && d.toDateString() === new Date().toDateString();
  }).length;
  const quotationsSent = leads.filter((l) => l.status === 'Quotation Sent').length;
  const projectsInProgress = leads.filter((l) => l.status === 'Site Survey' || l.status === 'Negotiation').length;
  const completedProjects = leads.filter((l) => l.status === 'Installed').length;

  const stats = [
    { title: 'Total Leads', value: totalLeads, icon: <UserPlus className="w-6 h-6" />, color: 'blue' as const },
    { title: 'Total Customers', value: totalCustomers, icon: <Users className="w-6 h-6" />, color: 'green' as const },
    { title: 'New Today', value: newToday, icon: <Calendar className="w-6 h-6" />, color: 'blue' as const },
    { title: 'Quotations Sent', value: quotationsSent, icon: <FileText className="w-6 h-6" />, color: 'teal' as const },
    { title: 'In Progress', value: projectsInProgress, icon: <HardHat className="w-6 h-6" />, color: 'orange' as const },
    { title: 'Completed', value: completedProjects, icon: <CheckCircle2 className="w-6 h-6" />, color: 'green' as const },
  ];

  const recentLeads = [...leads].slice(0, 5);

  const quickActions = [
    { label: 'New Lead', icon: UserPlus, href: '/dashboard/leads/new', color: 'bg-blue-500' },
    { label: 'New Follow-up', icon: Calendar, href: '/dashboard/followups', color: 'bg-purple-500' },
    { label: 'Create Quotation', icon: FileText, href: '/dashboard/quotations', color: 'bg-teal-500' },
    { label: 'New Project', icon: HardHat, href: '/dashboard/projects', color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {!firestoreReady && (
        <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-yellow-600 dark:text-yellow-400 font-bold">!</span>
            </div>
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-300">Firestore database not detected</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                Go to <a href="https://console.firebase.google.com/project/spectra-solar-a8adc/firestore" target="_blank" className="underline font-medium">Firebase Console</a>, create a Firestore database in test mode. Then add users and data to get started.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, {userData?.name || 'User'}!
          </p>
        </div>
      </div>

      {leadsLoading || customersLoading ? (
        <CardSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Leads</h2>
          </CardHeader>
          <CardContent className="p-0">
            {leadsLoading ? (
              <div className="p-6"><TableSkeleton rows={4} cols={5} /></div>
            ) : recentLeads.length === 0 ? (
              <EmptyState
                icon={<UserPlus className="w-8 h-8 text-gray-400" />}
                title="No leads yet"
                description="Add your first lead to get started"
                action={{ label: 'Add Lead', onClick: () => window.location.href = '/dashboard/leads/new' }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Source</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {recentLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{lead.customerName}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.status === 'New' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            lead.status === 'Follow-up' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            lead.status === 'Quotation Sent' ? 'bg-teal-100 text-teal-800' :
                            lead.status === 'Interested' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{lead.source}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(lead.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, i) => (
                <Link key={i} href={action.href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                    {action.label}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
