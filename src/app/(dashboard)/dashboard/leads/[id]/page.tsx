'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDocument, updateDocument, deleteDocument } from '@/hooks/useFirestore';
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/utils';
import { Lead } from '@/types';
import toast from 'react-hot-toast';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const { data: lead, loading } = useDocument<Lead>('leads', leadId);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="max-w-5xl mx-auto">
        <EmptyState title="Lead not found" description="This lead may have been deleted" action={{ label: 'Back to Leads', onClick: () => router.push('/dashboard/leads') }} />
      </div>
    );
  }

  if (!newStatus && lead.status) setNewStatus(lead.status);

  const handleStatusUpdate = async () => {
    try {
      await updateDocument('leads', leadId, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      setShowStatusModal(false);
    } catch (err: any) { toast.error(err?.message || 'Update failed'); }
  };

  const handleDelete = async () => {
    try {
      await deleteDocument('leads', leadId);
      toast.success('Lead deleted');
      router.push('/dashboard/leads');
    } catch (err: any) { toast.error(err?.message || 'Delete failed'); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/leads"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{lead.customerName}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>{lead.status}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(lead.priority)}`}>{lead.priority}</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{lead.leadId || lead.id} &middot; Added {formatDate(lead.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setNewStatus(lead.status); setShowStatusModal(true); }}>Update Status</Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Contact Information</h2></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div><p className="text-xs text-gray-500">Phone</p><p className="text-sm font-medium">{lead.mobile}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div><p className="text-xs text-gray-500">WhatsApp</p><p className="text-sm font-medium">{lead.whatsapp || '-'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div><p className="text-xs text-gray-500">Email</p><p className="text-sm font-medium">{lead.email || '-'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div><p className="text-xs text-gray-500">Location</p><p className="text-sm font-medium">{lead.city || '-'}, {lead.state || ''}</p></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Lead Details</h2></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Source', value: lead.source },
                  { label: 'Priority', value: lead.priority },
                  { label: 'Customer Type', value: lead.customerType || '-' },
                  { label: 'Roof Type', value: lead.roofType || '-' },
                  { label: 'Monthly Bill', value: lead.monthlyElectricityBill ? `₹${lead.monthlyElectricityBill}` : '-' },
                  { label: 'System Size', value: lead.estimatedSystemSize ? `${lead.estimatedSystemSize}kW` : '-' },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-medium mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {lead.notes && (
            <Card>
              <CardHeader><h2 className="text-lg font-semibold">Notes</h2></CardHeader>
              <CardContent><p className="text-gray-700 dark:text-gray-300">{lead.notes}</p></CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Quick Actions</h2></CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/followups"><Button variant="outline" className="w-full justify-start" icon={<CalendarIcon />}>Schedule Follow-up</Button></Link>
              <Link href="/dashboard/surveys"><Button variant="outline" className="w-full justify-start" icon={<MapPin className="w-4 h-4" />}>Schedule Survey</Button></Link>
              <Link href="/dashboard/quotations"><Button variant="outline" className="w-full justify-start" icon={<Mail className="w-4 h-4" />}>Create Quotation</Button></Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Status">
        <div className="space-y-4">
          <Select
            label="New Status"
            options={[
              { value: 'New', label: 'New' }, { value: 'Contacted', label: 'Contacted' },
              { value: 'Follow-up', label: 'Follow-up' }, { value: 'Interested', label: 'Interested' },
              { value: 'Site Survey', label: 'Site Survey' }, { value: 'Quotation Sent', label: 'Quotation Sent' },
              { value: 'Negotiation', label: 'Negotiation' }, { value: 'Confirmed', label: 'Confirmed' },
              { value: 'Lost', label: 'Lost' }, { value: 'Installed', label: 'Installed' },
            ]}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          />
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button><Button onClick={handleStatusUpdate}>Update</Button></div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Lead" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">Are you sure? This cannot be undone.</p>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button><Button variant="danger" onClick={handleDelete}>Delete</Button></div>
        </div>
      </Modal>
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
