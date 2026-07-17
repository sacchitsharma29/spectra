'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { orderBy } from 'firebase/firestore';
import { useCollection } from '@/hooks/useFirestore';
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import { Lead, LeadStatus, LeadSource } from '@/types';

const leadStatuses: LeadStatus[] = ['New', 'Contacted', 'Follow-up', 'Interested', 'Site Survey', 'Quotation Sent', 'Negotiation', 'Confirmed', 'Lost', 'Installed'];
const leadSources: LeadSource[] = ['Website', 'WhatsApp', 'Facebook', 'Instagram', 'Google Ads', 'Referral', 'Direct Walk-in', 'Phone Inquiry'];

export default function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const { data: leads, loading } = useCollection<Lead>('leads', [orderBy('createdAt', 'desc')]);
  const canWrite = useCanWrite();

  const columns: Column<Lead>[] = [
    { key: 'leadId', header: 'Lead ID', width: '100px' },
    {
      key: 'customerName',
      header: 'Customer',
      render: (lead) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{lead.customerName}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <Phone className="w-3 h-3" />
            {lead.mobile}
          </div>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (lead) => <span className="text-gray-600 dark:text-gray-400">{lead.source}</span>,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (lead) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(lead.priority)}`}>
          {lead.priority}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (lead) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
          {lead.status}
        </span>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (lead) => <span className="text-gray-500 dark:text-gray-400 truncate max-w-[200px] block">{lead.address || '-'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (lead) => <span className="text-gray-500 dark:text-gray-400">{formatDate(lead.createdAt)}</span>,
    },
  ];

  const filteredLeads = leads.filter((lead) => {
    if (statusFilter && lead.status !== statusFilter) return false;
    if (sourceFilter && lead.source !== sourceFilter) return false;
    if (priorityFilter && lead.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track all your sales leads</p>
        </div>
        {canWrite && (
          <Link href="/dashboard/leads/new">
            <Button icon={<Plus className="w-4 h-4" />}>Add New Lead</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-48">
              <Select placeholder="All Statuses" options={leadStatuses.map((s) => ({ value: s, label: s }))} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
            </div>
            <div className="w-full sm:w-48">
              <Select placeholder="All Sources" options={leadSources.map((s) => ({ value: s, label: s }))} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} />
            </div>
            <div className="w-full sm:w-48">
              <Select placeholder="All Priorities" options={[{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }, { value: 'Urgent', label: 'Urgent' }]} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!loading && filteredLeads.length === 0 ? (
            <EmptyState
              icon={<Plus className="w-8 h-8 text-gray-400" />}
              title="No leads found"
              description={leads.length === 0 ? 'Add your first lead to get started' : 'Try adjusting your filters'}
              action={leads.length === 0 && canWrite ? { label: 'Add Lead', onClick: () => window.location.href = '/dashboard/leads/new' } : undefined}
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredLeads}
              loading={loading}
              searchable
              exportable
              onRowClick={(lead) => window.location.href = `/dashboard/leads/${lead.id}`}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
