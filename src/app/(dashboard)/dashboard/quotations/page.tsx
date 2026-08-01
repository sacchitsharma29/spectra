'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Eye, Printer, Trash2, Save, PlusCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCollection, addDocument, deleteDocument } from '@/hooks/useFirestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import toast from 'react-hot-toast';

interface Quotation {
  id: string; quoteId: string; customerName: string; solarCapacity: string;
  totalAmount: number; status: string; createdAt: any; version: number;
}

interface CompanySettings {
  name: string; email: string; phone: string; website: string;
  address: string; gst: string; pan: string; logoUrl: string; headerUrl: string;
}

interface QuoteItem {
  description: string;
  amount: number;
}

export default function QuotationsPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: quotations, loading } = useCollection<Quotation>('quotations');
  const canWrite = useCanWrite();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    address: '',
    phone: '',
    date: new Date().toISOString().slice(0, 10),
    items: [{ description: '', amount: '' }] as { description: string; amount: string }[],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'company'));
        if (snap.exists()) setCompany(snap.data() as CompanySettings);
      } catch { /* ignore */ }
    };
    load();
  }, []);

  const columns: Column<Quotation>[] = [
    { key: 'quoteId', header: 'Quote #', width: '110px' },
    { key: 'customerName', header: 'Customer' },
    { key: 'solarCapacity', header: 'Capacity' },
    { key: 'totalAmount', header: 'Amount', render: (q) => <span className="font-semibold">{formatCurrency(q.totalAmount)}</span> },
    { key: 'status', header: 'Status', render: (q) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(q.status)}`}>{q.status}</span> },
    { key: 'version', header: 'Ver' },
    { key: 'createdAt', header: 'Date', render: (q) => <span className="text-gray-500">{formatDate(q.createdAt)}</span> },
    {
      key: 'actions', header: '',
      render: (q: any) => (
        <div className="flex gap-1">
          <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setPreview(q); }} title="View quotation"><Eye className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setPreview(q); setTimeout(() => window.print(), 100); }} title="Download PDF"><Printer className="w-4 h-4" /></button>
          {canWrite && <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(q); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors" title="Delete quotation"><Trash2 className="w-4 h-4" /></button>}
        </div>
      ),
    },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('quotations', deleteTarget.id);
      toast.success('Quotation deleted');
      setDeleteTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to delete'); }
  };

  const totalAmount = form.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const updateItem = (index: number, field: 'description' | 'amount', value: string) => {
    const updated = [...form.items];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, items: updated });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', amount: '' }] });
  const removeItem = (index: number) => {
    const updated = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: updated });
  };

  const handleGenerate = () => {
    if (!form.customerName) { toast.error('Customer name is required'); return; }
    const validItems = form.items.filter((i) => i.description.trim() || Number(i.amount) > 0);
    if (validItems.length === 0) { toast.error('Add at least one item'); return; }
    const quote = {
      customerName: form.customerName,
      address: form.address,
      phone: form.phone,
      date: form.date,
      items: validItems.map((i) => ({ description: i.description.trim(), amount: Number(i.amount) || 0 })),
      totalAmount,
    };
    setPreview(quote);
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      await addDocument('quotations', {
        ...preview,
        solarCapacity: '',
        panelDetails: '',
        status: 'Draft',
        version: 1,
      });
      toast.success('Quotation saved');
      setPreview(null);
      setShowModal(false);
      setForm({ customerName: '', address: '', phone: '', date: new Date().toISOString().slice(0, 10), items: [{ description: '', amount: '' }] });
    } catch (err: any) { toast.error(err?.message || 'Failed to save'); }
    setSaving(false);
  };

  const QuotationDoc = ({ data }: { data: any }) => (
    <div className="print-area bg-white text-gray-900">
      {company?.headerUrl && (
        <div className="w-full mb-6 border-b border-gray-300 pb-4">
          <img src={company.headerUrl} alt="Company header" className="w-full object-contain max-h-32" />
        </div>
      )}
      {company && !company.headerUrl && (
        <div className="flex items-center justify-between mb-6 border-b border-gray-300 pb-4">
          <div>
            <p className="text-xl font-bold">{company.name}</p>
            <p className="text-sm text-gray-600">{company.address}</p>
            <p className="text-sm text-gray-600">Phone: {company.phone} | Email: {company.email}</p>
          </div>
          {company.logoUrl && <img src={company.logoUrl} alt="Logo" className="h-14 object-contain" />}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-wide">QUOTATION</h2>
          <p className="text-sm text-gray-500 mt-1">{data.quoteId || 'New Quotation'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm"><span className="text-gray-500">Date:</span> <span className="font-medium">{data.date ? formatDate(data.date) : formatDate(data.createdAt)}</span></p>
        </div>
      </div>
      <div className="mb-6 p-4 rounded-lg bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Customer Details</p>
        <p className="text-base font-semibold">{data.customerName}</p>
        {data.address && <p className="text-sm text-gray-700 mt-0.5">{data.address}</p>}
        {data.phone && <p className="text-sm text-gray-700 mt-0.5">Phone: {data.phone}</p>}
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-900 text-white">
            <th className="text-left px-3 py-2">#</th>
            <th className="text-left px-3 py-2">Description</th>
            <th className="text-right px-3 py-2">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {(data.items || []).map((item: QuoteItem, i: number) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="px-3 py-2">{i + 1}</td>
              <td className="px-3 py-2">{item.description}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="px-3 py-2" colSpan={2}></td>
            <td className="px-3 py-2 text-right">
              <span className="text-sm text-gray-500">Total: </span>
              <span className="text-lg font-bold">{formatCurrency(data.totalAmount)}</span>
            </td>
          </tr>
        </tfoot>
      </table>
      {company?.gst && <p className="text-xs text-gray-500 mt-4">GST No: {company.gst}</p>}
    </div>
  );

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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Quotation" size="xl">
        <div className="space-y-4">
          {!company?.headerUrl && (
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-xs text-yellow-700 dark:text-yellow-300">
              No quotation header uploaded yet. Go to Settings → Company to upload one.
            </div>
          )}
          <Input label="Customer Name *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Items</p>
              <Button variant="outline" size="sm" onClick={addItem} icon={<PlusCircle className="w-4 h-4" />}>Add Item</Button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                  <Input placeholder="Amount (₹)" type="number" value={item.amount} onChange={(e) => updateItem(i, 'amount', e.target.value)} className="w-40" />
                  <button onClick={() => removeItem(i)} className="p-2 text-gray-400 hover:text-red-500"><MinusCircle className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3">
              <p className="text-sm text-gray-500">Total: <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalAmount)}</span></p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleGenerate}>Generate Preview</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!preview} onClose={() => setPreview(null)} title="Quotation Preview" size="xl">
        <div className="space-y-4">
          <QuotationDoc data={preview} />
          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button variant="secondary" onClick={() => window.print()} icon={<Printer className="w-4 h-4" />}>Print / PDF</Button>
            <Button onClick={handleSave} loading={saving} icon={<Save className="w-4 h-4" />}>Save Quotation</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
