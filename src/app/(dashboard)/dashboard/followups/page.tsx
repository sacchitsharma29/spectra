'use client';

import React, { useState } from 'react';
import { Plus, Phone, MessageSquare, Mail, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCollection, addDocument, deleteDocument } from '@/hooks/useFirestore';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface FollowUp {
  id: string;
  customerName: string;
  date: any;
  time: string;
  method: string;
  notes: string;
  status: string;
  assignedTo: string;
}

export default function FollowupsPage() {
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FollowUp | null>(null);
  const { userData } = useAuth();
  const canWrite = useCanWrite();
  const { data: followups, loading } = useCollection<FollowUp>('followups');
  const [newFollowup, setNewFollowup] = useState({ customerName: '', date: '', time: '', method: 'Call', notes: '' });

  const columns: Column<FollowUp>[] = [
    { key: 'customerName', header: 'Customer' },
    {
      key: 'date', header: 'Date & Time',
      render: (f) => (
        <div>
          <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(f.date)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{f.time}</p>
        </div>
      ),
    },
    {
      key: 'method', header: 'Method',
      render: (f) => {
        const icons: Record<string, any> = { Call: Phone, WhatsApp: MessageSquare, Email: Mail, Meeting: Users, 'Site Visit': MapPinIcon };
        const Icon = icons[f.method] || Phone;
        return <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-600">{f.method}</span></div>;
      },
    },
    { key: 'status', header: 'Status', render: (f) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(f.status)}`}>{f.status}</span> },
    { key: 'assignedTo', header: 'Assigned To' },
    ...(canWrite ? [{
      key: 'actions' as const, header: '', width: '50px' as const,
      render: (f: FollowUp) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteTarget(f); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          title="Delete follow-up"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    }] : []),
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('followups', deleteTarget.id);
      toast.success('Follow-up deleted');
      setDeleteTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to delete'); }
  };

  const handleCreate = async () => {
    if (!newFollowup.customerName || !newFollowup.date) { toast.error('Please fill in required fields'); return; }
    try {
      await addDocument('followups', {
        customerName: newFollowup.customerName,
        date: new Date(newFollowup.date),
        time: newFollowup.time,
        method: newFollowup.method,
        notes: newFollowup.notes,
        status: 'Scheduled',
        assignedTo: userData?.name || '',
        assignedToId: userData?.uid || '',
      });
      toast.success('Follow-up created!');
      setShowModal(false);
      setNewFollowup({ customerName: '', date: '', time: '', method: 'Call', notes: '' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create follow-up');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Follow-ups</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track all follow-ups</p>
        </div>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Schedule Follow-up</Button>}
      </div>
      <Card>
        <CardContent>
          {!loading && followups.length === 0 ? (
            <EmptyState title="No follow-ups scheduled" description="Schedule your first follow-up" action={canWrite ? { label: 'Schedule', onClick: () => setShowModal(true) } : undefined} />
          ) : (
            <DataTable columns={columns} data={followups} loading={loading} searchable exportable />
          )}
        </CardContent>
      </Card>
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Follow-up" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this follow-up? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Schedule Follow-up">
        <div className="space-y-4">
          <Input label="Customer Name *" value={newFollowup.customerName} onChange={(e) => setNewFollowup({ ...newFollowup, customerName: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date *" type="date" value={newFollowup.date} onChange={(e) => setNewFollowup({ ...newFollowup, date: e.target.value })} />
            <Input label="Time" type="time" value={newFollowup.time} onChange={(e) => setNewFollowup({ ...newFollowup, time: e.target.value })} />
          </div>
          <Select label="Method" options={[{ value: 'Call', label: 'Call' }, { value: 'WhatsApp', label: 'WhatsApp' }, { value: 'Email', label: 'Email' }, { value: 'Meeting', label: 'Meeting' }, { value: 'Site Visit', label: 'Site Visit' }]} value={newFollowup.method} onChange={(e) => setNewFollowup({ ...newFollowup, method: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="input-field min-h-[80px] resize-y" value={newFollowup.notes} onChange={(e) => setNewFollowup({ ...newFollowup, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Follow-up</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
}
