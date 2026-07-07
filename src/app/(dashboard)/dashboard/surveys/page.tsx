'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
import toast from 'react-hot-toast';

interface Survey {
  id: string; customerName: string; assignedTo: string; scheduledDate: any;
  status: string; roofType: string; systemSize: string;
}

export default function SurveysPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: surveys, loading } = useCollection<Survey>('surveys');
  const canWrite = useCanWrite();
  const [form, setForm] = useState({ customerName: '', assignedTo: '', scheduledDate: '', roofType: 'Flat', remarks: '' });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const columns: Column<Survey>[] = [
    { key: 'customerName', header: 'Customer' },
    { key: 'assignedTo', header: 'Engineer' },
    { key: 'scheduledDate', header: 'Date', render: (s) => <span className="text-gray-600">{formatDate(s.scheduledDate)}</span> },
    { key: 'roofType', header: 'Roof Type' },
    { key: 'systemSize', header: 'System' },
    { key: 'status', header: 'Status', render: (s) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>{s.status}</span> },
    ...(canWrite ? [{
      key: 'actions' as const, header: '', width: '50px' as const,
      render: (s: any) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          title="Delete survey"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    }] : []),
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('surveys', deleteTarget.id);
      toast.success('Survey deleted');
      setDeleteTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to delete'); }
  };

  const handleCreate = async () => {
    if (!form.customerName || !form.assignedTo || !form.scheduledDate) { toast.error('Fill required fields'); return; }
    try {
      await addDocument('surveys', { ...form, scheduledDate: new Date(form.scheduledDate), status: 'Pending' });
      toast.success('Survey scheduled!'); setShowModal(false);
      setForm({ customerName: '', assignedTo: '', scheduledDate: '', roofType: 'Flat', remarks: '' });
    } catch (err: any) { toast.error(err?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Site Surveys</h1><p className="text-gray-500 dark:text-gray-400 mt-1">Manage site surveys</p></div>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Survey</Button>}
      </div>
      <Card><CardContent>
        {!loading && surveys.length === 0 ? <EmptyState title="No surveys scheduled" description="Schedule your first survey" action={canWrite ? { label: 'Schedule', onClick: () => setShowModal(true) } : undefined} />
        : <DataTable columns={columns} data={surveys} loading={loading} searchable exportable />}
      </CardContent></Card>
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Survey" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this survey? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Schedule Survey">
        <div className="space-y-4">
          <Input label="Customer Name *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <Input label="Survey Engineer *" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
          <Input label="Date *" type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
          <Select label="Roof Type" options={[{ value: 'Flat', label: 'Flat' }, { value: 'Slanted', label: 'Slanted' }, { value: 'Metal', label: 'Metal' }, { value: 'Tile', label: 'Tile' }, { value: 'Other', label: 'Other' }]} value={form.roofType} onChange={(e) => setForm({ ...form, roofType: e.target.value })} />
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label><textarea className="input-field min-h-[80px] resize-y" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleCreate}>Schedule</Button></div>
        </div>
      </Modal>
    </div>
  );
}
