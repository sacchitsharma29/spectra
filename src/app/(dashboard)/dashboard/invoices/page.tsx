'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCollection, addDocument, deleteDocument } from '@/hooks/useFirestore';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import { Plus, Eye, Download, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Invoice {
  id: string; invoiceId: string; customerName: string; total: number;
  status: string; dueDate: any; createdAt: any;
}

export default function InvoicesPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: invoices, loading } = useCollection<Invoice>('invoices');
  const canWrite = useCanWrite();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ customerName: '', invoiceDate: '', dueDate: '', description: '', amount: '' });

  const columns: Column<Invoice>[] = [
    { key: 'invoiceId', header: 'Invoice #', width: '110px' },
    { key: 'customerName', header: 'Customer' },
    { key: 'total', header: 'Amount', render: (i) => <span className="font-semibold">{formatCurrency(i.total)}</span> },
    { key: 'status', header: 'Status', render: (i) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(i.status)}`}>{i.status}</span> },
    { key: 'dueDate', header: 'Due', render: (i) => <span className="text-gray-500">{formatDate(i.dueDate)}</span> },
    { key: 'actions', header: '', render: (i: any) => <div className="flex gap-1"><button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); toast('View invoice coming soon'); }}><Eye className="w-4 h-4" /></button><button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); toast('Download coming soon'); }}><Download className="w-4 h-4" /></button><button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); toast('Send invoice coming soon'); }}><Send className="w-4 h-4" /></button>{canWrite && <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(i); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors" title="Delete invoice"><Trash2 className="w-4 h-4" /></button>}</div> },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('invoices', deleteTarget.id);
      toast.success('Invoice deleted');
      setDeleteTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to delete'); }
  };

  const handleCreate = async () => {
    if (!form.customerName || !form.amount) { toast.error('Fill required fields'); return; }
    try {
      await addDocument('invoices', {
        customerName: form.customerName,
        items: [{ description: form.description, amount: Number(form.amount) }],
        subtotal: Number(form.amount),
        gst: Number(form.amount) * 0.18,
        total: Number(form.amount) * 1.18,
        status: 'Draft',
        dueDate: form.dueDate ? new Date(form.dueDate) : new Date(),
      });
      toast.success('Invoice created!'); setShowModal(false);
    } catch (err: any) { toast.error(err?.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Invoices</h1><p className="text-gray-500 mt-1">Manage invoices</p></div>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Invoice</Button>}
      </div>
      <Card><CardContent>
        {!loading && invoices.length === 0 ? <EmptyState title="No invoices yet" description="Create your first invoice" action={canWrite ? { label: 'Create', onClick: () => setShowModal(true) } : undefined} />
        : <DataTable columns={columns} data={invoices} loading={loading} searchable exportable />}
      </CardContent></Card>
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Invoice" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this invoice? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Invoice" size="lg">
        <div className="space-y-4">
          <Input label="Customer *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <Input label="Invoice Date *" type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
          <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Amount (₹) *" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleCreate}>Create</Button></div>
        </div>
      </Modal>
    </div>
  );
}
