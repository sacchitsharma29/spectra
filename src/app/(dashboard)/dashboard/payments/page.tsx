'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCollection, addDocument, deleteDocument } from '@/hooks/useFirestore';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Payment {
  id: string; paymentId: string; customerName: string; amount: number;
  paymentDate: any; paymentMethod: string; type: string; transactionId: string;
}

export default function PaymentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { data: payments, loading } = useCollection<Payment>('payments');
  const canWrite = useCanWrite();
  const [form, setForm] = useState({ customerName: '', amount: '', paymentDate: '', paymentMethod: 'UPI', type: 'Advance', transactionId: '' });

  const columns: Column<Payment>[] = [
    { key: 'paymentId', header: 'Payment #', width: '110px' },
    { key: 'customerName', header: 'Customer' },
    { key: 'amount', header: 'Amount', render: (p) => <span className="font-semibold">{formatCurrency(p.amount)}</span> },
    { key: 'paymentDate', header: 'Date', render: (p) => <span className="text-gray-500">{formatDate(p.paymentDate)}</span> },
    { key: 'paymentMethod', header: 'Method' },
    { key: 'type', header: 'Type', render: (p) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.type === 'Advance' ? 'bg-blue-100 text-blue-800' : p.type === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{p.type}</span> },
    { key: 'transactionId', header: 'Transaction ID' },
    ...(canWrite ? [{
      key: 'actions' as const, header: '', width: '50px' as const,
      render: (p: any) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          title="Delete payment"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    }] : []),
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('payments', deleteTarget.id);
      toast.success('Payment deleted');
      setDeleteTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to delete'); }
  };

  const handleCreate = async () => {
    if (!form.customerName || !form.amount) { toast.error('Fill required fields'); return; }
    try {
      await addDocument('payments', { ...form, amount: Number(form.amount), paymentDate: new Date(form.paymentDate) });
      toast.success('Payment recorded!'); setShowModal(false);
    } catch (err: any) { toast.error(err?.message); }
  };

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Payments</h1><p className="text-gray-500 mt-1">Track all payments</p></div>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Record Payment</Button>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Collected</p><p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-red-600">{formatCurrency(0)}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">This Month</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(totalCollected)}</p></Card>
      </div>
      <Card><CardContent>
        {!loading && payments.length === 0 ? <EmptyState title="No payments recorded" description="Record your first payment" action={canWrite ? { label: 'Record', onClick: () => setShowModal(true) } : undefined} />
        : <DataTable columns={columns} data={payments} loading={loading} searchable exportable />}
      </CardContent></Card>
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Payment" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this payment? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Payment">
        <div className="space-y-4">
          <Input label="Customer *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <Input label="Amount (₹) *" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Input label="Date *" type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
          <Select label="Method" options={[{ value: 'Cash', label: 'Cash' }, { value: 'UPI', label: 'UPI' }, { value: 'Bank Transfer', label: 'Bank Transfer' }, { value: 'Cheque', label: 'Cheque' }]} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
          <Select label="Type" options={[{ value: 'Advance', label: 'Advance' }, { value: 'Partial', label: 'Partial' }, { value: 'Final', label: 'Final' }]} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Input label="Transaction ID" value={form.transactionId} onChange={(e) => setForm({ ...form, transactionId: e.target.value })} />
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleCreate}>Record</Button></div>
        </div>
      </Modal>
    </div>
  );
}
