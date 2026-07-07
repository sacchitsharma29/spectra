'use client';

import React, { useState } from 'react';
import { Plus, Eye, Download, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCollection, addDocument, deleteDocument } from '@/hooks/useFirestore';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import toast from 'react-hot-toast';

interface Quotation {
  id: string; quoteId: string; customerName: string; solarCapacity: string;
  totalAmount: number; status: string; createdAt: any; version: number;
}

export default function QuotationsPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: quotations, loading } = useCollection<Quotation>('quotations');
  const canWrite = useCanWrite();
  const [form, setForm] = useState<any>({ customerName: '', solarCapacity: '', panelDetails: '', inverterDetails: '', batteryDetails: '', installationCharges: '', governmentSubsidy: '', gst: '18', warrantyInfo: '', termsConditions: '' });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const columns: Column<Quotation>[] = [
    { key: 'quoteId', header: 'Quote #', width: '110px' },
    { key: 'customerName', header: 'Customer' },
    { key: 'solarCapacity', header: 'Capacity' },
    { key: 'totalAmount', header: 'Amount', render: (q) => <span className="font-semibold">{formatCurrency(q.totalAmount)}</span> },
    { key: 'status', header: 'Status', render: (q) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(q.status)}`}>{q.status}</span> },
    { key: 'version', header: 'Ver' },
    { key: 'createdAt', header: 'Date', render: (q) => <span className="text-gray-500">{formatDate(q.createdAt)}</span> },
    { key: 'actions', header: '', render: (q: any) => <div className="flex gap-1"><button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); toast('View quotation coming soon'); }}><Eye className="w-4 h-4" /></button><button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); toast('Download coming soon'); }}><Download className="w-4 h-4" /></button><button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); toast('Send quotation coming soon'); }}><Send className="w-4 h-4" /></button>{canWrite && <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(q); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors" title="Delete quotation"><Trash2 className="w-4 h-4" /></button>}</div> },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('quotations', deleteTarget.id);
      toast.success('Quotation deleted');
      setDeleteTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to delete'); }
  };

  const handleCreate = async () => {
    if (!form.customerName || !form.solarCapacity) { toast.error('Fill required fields'); return; }
    try {
      await addDocument('quotations', {
        ...form,
        installationCharges: Number(form.installationCharges) || 0,
        governmentSubsidy: Number(form.governmentSubsidy) || 0,
        gst: Number(form.gst) || 18,
        totalAmount: (Number(form.installationCharges) || 0) * (1 + (Number(form.gst) || 18) / 100) - (Number(form.governmentSubsidy) || 0),
        status: 'Draft', version: 1,
      });
      toast.success('Quotation created!'); setShowModal(false);
    } catch (err: any) { toast.error(err?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Quotations</h1><p className="text-gray-500 mt-1">Create and manage quotations</p></div>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Quotation</Button>}
      </div>
      <Card><CardContent>
        {!loading && quotations.length === 0 ? <EmptyState title="No quotations yet" description="Create your first quotation" action={canWrite ? { label: 'Create', onClick: () => setShowModal(true) } : undefined} />
        : <DataTable columns={columns} data={quotations} loading={loading} searchable exportable />}
      </CardContent></Card>
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Quotation" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this quotation? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Quotation" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Customer *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            <Input label="Solar Capacity *" placeholder="5kW" value={form.solarCapacity} onChange={(e) => setForm({ ...form, solarCapacity: e.target.value })} />
            <Input label="Panel Details" value={form.panelDetails} onChange={(e) => setForm({ ...form, panelDetails: e.target.value })} />
            <Input label="Inverter Details" value={form.inverterDetails} onChange={(e) => setForm({ ...form, inverterDetails: e.target.value })} />
            <Input label="Installation Charges (₹)" type="number" value={form.installationCharges} onChange={(e) => setForm({ ...form, installationCharges: e.target.value })} />
            <Input label="Subsidy (₹)" type="number" value={form.governmentSubsidy} onChange={(e) => setForm({ ...form, governmentSubsidy: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleCreate}>Generate</Button></div>
        </div>
      </Modal>
    </div>
  );
}
