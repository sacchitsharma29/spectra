'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Plus, Eye, Printer, Trash2, Save, PlusCircle, MinusCircle, Sun, Zap, BatteryCharging } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCollection, addDocument, deleteDocument } from '@/hooks/useFirestore';
import { doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import { cropWhiteBorders } from '@/lib/image';
import { useCanWrite } from '@/lib/permissions';
import toast from 'react-hot-toast';

interface Quotation {
  id: string; quoteId: string; customerName: string; solarCapacity: string;
  systemType?: string; systemCapacity?: string; totalAmount: number; status: string; createdAt: any; version: number;
}

interface CompanySettings {
  name: string; email: string; phone: string; website: string;
  address: string; gst: string; pan: string; logoUrl: string; headerUrl: string;
  termsAndConditions?: string;
  paymentDetails?: string;
  paymentQrUrl?: string;
}

const DEFAULT_TERMS = [
  'This quotation is valid for 30 days from the date of issue.',
  'All prices are subject to applicable taxes (GST) as per government norms.',
  'Advance payment of 50% is required to confirm the order.',
  'Subsidy amount is subject to government scheme eligibility and approval; the final amount may vary.',
  'Equipment warranty is as per manufacturer terms; workmanship warranty as per company policy.',
  'Delivery and installation timelines will be communicated after order confirmation.',
  'In case of any dispute, the jurisdiction will be local courts only.',
];

const systemTypeLabel = (type?: string) => {
  if (type === 'Hybrid') return 'Hybrid System With Battery';
  if (type === 'On-Grid') return 'On-Grid System';
  if (type === 'Off-Grid') return 'Off-Grid System';
  return type || '';
};

const systemTitle = (capacity?: string, type?: string) => {
  const base = systemTypeLabel(type);
  if (!base) return capacity?.trim() || '';
  const cap = capacity?.trim();
  return cap ? `${cap} ${base}` : base;
};

interface QuoteItem {
  description: string;
  brand?: string;
  quantity?: number;
  amount?: number;
}

export default function QuotationsPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: quotations, loading } = useCollection<Quotation>('quotations', [orderBy('createdAt', 'desc')]);
  const canWrite = useCanWrite();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [pendingPrint, setPendingPrint] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    address: '',
    phone: '',
    date: new Date().toISOString().slice(0, 10),
    systemType: '',
    systemCapacity: '',
    applySubsidy: false,
    subsidy: '',
    totalAmount: '',
    items: [{ description: '', brand: '', quantity: '1' }] as { description: string; brand: string; quantity: string }[],
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

  useEffect(() => {
    if (pendingPrint && preview) {
      const t = setTimeout(() => {
        window.print();
        setPendingPrint(false);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [pendingPrint, preview]);

  const columns: Column<Quotation>[] = [
    { key: 'quoteId', header: 'Quote #', width: '110px' },
    { key: 'customerName', header: 'Customer' },
    {
      key: 'systemType', header: 'System', width: '110px',
      render: (q) => q.systemType ? (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
          q.systemType === 'Hybrid'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
            : q.systemType === 'Off-Grid'
            ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800'
            : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {systemTitle(q.systemCapacity, q.systemType)}
        </span>
      ) : <span className="text-gray-400">—</span>,
    },
    { key: 'totalAmount', header: 'Amount', render: (q) => <span className="font-semibold">{formatCurrency(q.totalAmount)}</span> },
    { key: 'status', header: 'Status', render: (q) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(q.status)}`}>{q.status}</span> },
    { key: 'createdAt', header: 'Date', render: (q) => <span className="text-gray-500">{formatDate(q.createdAt)}</span> },
    {
      key: 'actions', header: '',
      render: (q: any) => (
        <div className="flex gap-1">
          <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setPreview(q); }} title="View quotation"><Eye className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setPreview(q); setPendingPrint(true); }} title="Download PDF"><Printer className="w-4 h-4" /></button>          {canWrite && <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(q); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors" title="Delete quotation"><Trash2 className="w-4 h-4" /></button>}
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

  const totalAmount = Number(form.totalAmount) || 0;
  const subsidyAmount = form.applySubsidy ? (Number(form.subsidy) || 0) : 0;
  const netTotal = Math.max(0, totalAmount - subsidyAmount);

  const updateItem = (index: number, field: 'description' | 'brand' | 'quantity', value: string) => {
    const updated = [...form.items];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, items: updated });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', brand: '', quantity: '1' }] });
  const removeItem = (index: number) => {
    const updated = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: updated });
  };

  const handleGenerate = () => {
    if (!form.customerName) { toast.error('Customer name is required'); return; }
    if (!form.systemType) { toast.error('Select the system type (On-Grid / Hybrid)'); return; }
    const validItems = form.items.filter((i) => i.description.trim());
    if (validItems.length === 0) { toast.error('Add at least one item'); return; }
    if (totalAmount <= 0) { toast.error('Enter the total amount'); return; }
    const quote = {
      quoteId: `QT-${String(quotations.length + 1).padStart(3, '0')}`,
      customerName: form.customerName,
      address: form.address,
      phone: form.phone,
      date: form.date,
      systemType: form.systemType,
      systemCapacity: form.systemCapacity.trim(),
      items: validItems.map((i) => ({
        description: i.description.trim(),
        brand: i.brand.trim(),
        quantity: Number(i.quantity) > 0 ? Number(i.quantity) : 1,
      })),
      subtotal: totalAmount,
      subsidy: subsidyAmount,
      totalAmount: netTotal,
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
      setForm({ customerName: '', address: '', phone: '', date: new Date().toISOString().slice(0, 10), systemType: '', systemCapacity: '', applySubsidy: false, subsidy: '', totalAmount: '', items: [{ description: '', brand: '', quantity: '1' }] });
    } catch (err: any) { toast.error(err?.message || 'Failed to save'); }
    setSaving(false);
  };

  const QuotationDoc = ({ data }: { data: any }) => {
    const docRef = useRef<HTMLDivElement>(null);
    const [compact, setCompact] = useState(false);
    const [scale, setScale] = useState(1);
    const [revision, setRevision] = useState(0);
    const [headerUrl, setHeaderUrl] = useState<string | null>(null);

    useEffect(() => {
      let cancelled = false;
      if (company?.headerUrl) {
        cropWhiteBorders(company.headerUrl)
          .then((u) => { if (!cancelled) setHeaderUrl(u); })
          .catch(() => { if (!cancelled) setHeaderUrl(company.headerUrl); });
      } else {
        setHeaderUrl(null);
      }
      return () => { cancelled = true; };
    }, [company?.headerUrl]);

    const PAGE_HEIGHT = 1122.5; // 297mm in px (A4)
    const FIT_TARGET = 1080; // ~4% headroom for Windows font/scale differences

    const items: QuoteItem[] = data.items || [];
    const docSubtotal = data.subtotal !== undefined ? Number(data.subtotal) : items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const docSubsidy = Number(data.subsidy) || 0;
    const docTotal = data.totalAmount !== undefined ? Number(data.totalAmount) : Math.max(0, docSubtotal - docSubsidy);

    const terms = company?.termsAndConditions?.trim()
      ? company.termsAndConditions.split('\n').map((s) => s.trim()).filter(Boolean)
      : DEFAULT_TERMS;

    const paymentLines = company?.paymentDetails?.trim()
      ? company.paymentDetails.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

    const systemIcon =
      data.systemType === 'Hybrid'
        ? <BatteryCharging className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
        : data.systemType === 'Off-Grid'
        ? <Zap className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
        : <Sun className={compact ? 'w-4 h-4' : 'w-5 h-5'} />;

    useLayoutEffect(() => {
      const el = docRef.current;
      if (!el) return;
      const h = el.offsetHeight;
      if (h > PAGE_HEIGHT && !compact) {
        setCompact(true);
        return;
      }
      if (compact) {
        const fit = Math.min(1, Math.max(0.72, FIT_TARGET / h));
        if (fit < scale - 0.001) setScale(fit);
      }
    }, [data, compact, revision, scale, headerUrl]);

    useEffect(() => {
      const el = docRef.current;
      if (!el) return;
      const imgs = Array.from(el.querySelectorAll('img'));
      const onImg = () => setRevision((r) => r + 1);
      imgs.forEach((img) => {
        if (!img.complete) {
          img.addEventListener('load', onImg, { once: true });
          img.addEventListener('error', onImg, { once: true });
        }
      });
      const t = setTimeout(onImg, 700);
      return () => {
        clearTimeout(t);
        imgs.forEach((img) => {
          img.removeEventListener('load', onImg);
          img.removeEventListener('error', onImg);
        });
      };
    }, [data]);

    return (
      <div
        ref={docRef}
        style={{ '--doc-scale': scale } as React.CSSProperties}
        className={`print-area bg-white text-gray-900 overflow-hidden rounded-lg shadow-sm mx-auto w-full max-w-[210mm]${scale < 1 ? ' print-fit' : ''}`}>
        {company?.headerUrl && (
          <div className="w-full leading-[0] overflow-hidden">
            <img
              src={headerUrl || company.headerUrl}
              alt="Company header"
              className={
                headerUrl && headerUrl !== company.headerUrl
                  ? 'w-full max-w-none h-auto object-contain'
                  : 'w-[104%] max-w-none h-auto object-contain -ml-[2%]'
              }
            />
          </div>
        )}
        <div className={compact ? 'px-6 sm:px-8 pt-3 pb-6' : 'px-8 sm:px-12 pt-6 pb-8'}>
          {company && !company.headerUrl && (
            <div className={`flex items-start justify-between border-b-2 border-gray-900 pb-4 ${compact ? 'mb-3' : 'mb-5'}`}>
              <div>
                <p className={`font-bold ${compact ? 'text-lg' : 'text-xl'}`}>{company.name}</p>
                <p className="text-sm text-gray-600 mt-0.5">{company.address}</p>
                <p className="text-sm text-gray-600">Phone: {company.phone}</p>
                {company.email && <p className="text-sm text-gray-600">Email: {company.email}</p>}
              </div>
              {company.logoUrl && <img src={company.logoUrl} alt="Logo" className="h-14 w-auto object-contain" />}
            </div>
          )}
          <div className={`flex items-start justify-between ${compact ? 'mb-3' : 'mb-5'}`}>
            <div>
              <h2 className={`font-bold tracking-widest text-gray-900 ${compact ? 'text-lg' : 'text-2xl'}`}>QUOTATION</h2>
              <p className="text-xs text-gray-500 mt-1">Quote #: <span className="font-medium text-gray-700">{data.quoteId || 'New Quotation'}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600"><span className="text-gray-500">Date: </span><span className="font-semibold">{data.date ? formatDate(data.date) : formatDate(data.createdAt)}</span></p>
            </div>
          </div>
          {data.systemType && (
            <div
              className={`relative w-full overflow-hidden rounded-lg text-white print-break-avoid ${compact ? 'mb-3' : 'mb-5'}`}
              style={{ background: 'linear-gradient(90deg, #172554 0%, #1e40af 55%, #2563eb 100%)' }}
            >
              <span className={`absolute -right-1 -top-2 opacity-15 text-amber-300 ${compact ? 'w-14 h-14' : 'w-24 h-24'}`}>
                <Sun className="w-full h-full" />
              </span>
              <div className={`relative flex items-center ${compact ? 'gap-2.5 px-3 py-2' : 'gap-3.5 px-5 py-3'}`}>
                <span className={`flex items-center justify-center rounded-full bg-amber-400 text-[#172554] shrink-0 ${compact ? 'w-8 h-8' : 'w-11 h-11'}`}>
                  {systemIcon}
                </span>
                <div className="flex-1">
                  <p className={`font-semibold uppercase tracking-[0.22em] text-amber-300 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>System Type</p>
                  <p className={`font-extrabold uppercase tracking-wide leading-tight ${compact ? 'text-sm' : 'text-xl'}`}>
                    {systemTitle(data.systemCapacity, data.systemType)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className={compact ? 'mb-3' : 'mb-5'}>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Customer Details</p>
            <div className={`border border-gray-300 rounded-lg ${compact ? 'p-3' : 'p-4'}`}>
              <p className="text-base font-bold text-gray-900">{data.customerName}</p>
              {data.address && <p className="text-sm text-gray-700 mt-0.5">{data.address}</p>}
              {data.phone && <p className="text-sm text-gray-700 mt-0.5">Phone: {data.phone}</p>}
            </div>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className={`text-left font-medium ${compact ? 'px-2 py-1.5 text-[13px]' : 'px-3 py-2 text-sm'}`}>S.No</th>
                <th className={`text-left font-medium ${compact ? 'px-2 py-1.5 text-[13px]' : 'px-3 py-2 text-sm'}`}>Items</th>
                <th className={`text-left font-medium ${compact ? 'px-2 py-1.5 text-[13px]' : 'px-3 py-2 text-sm'}`}>Brand</th>
                <th className={`text-center font-medium ${compact ? 'px-2 py-1.5 text-[13px]' : 'px-3 py-2 text-sm'}`}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className={`text-gray-700 ${compact ? 'px-2 py-1 text-[13px]' : 'px-3 py-2 text-sm'}`}>{i + 1}</td>
                  <td className={`${compact ? 'px-2 py-1 text-[13px]' : 'px-3 py-2 text-sm'}`}>{item.description}</td>
                  <td className={`text-gray-700 ${compact ? 'px-2 py-1 text-[13px]' : 'px-3 py-2 text-sm'}`}>{item.brand || '—'}</td>
                  <td className={`text-center text-gray-700 ${compact ? 'px-2 py-1 text-[13px]' : 'px-3 py-2 text-sm'}`}>{item.quantity ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={`flex justify-end print-break-avoid ${compact ? 'mt-3' : 'mt-4'}`}>
            <div className={compact ? 'w-60 space-y-1' : 'w-64 space-y-1.5'}>
              {docSubsidy > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total</span>
                  <span className="text-gray-900">{formatCurrency(docSubtotal)}</span>
                </div>
              )}
              {docSubsidy > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Subsidy</span>
                  <span className="text-green-600">- {formatCurrency(docSubsidy)}</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-base font-bold text-gray-900">
                <span>{docSubsidy > 0 ? 'Net Amount' : 'Total Amount'}</span>
                <span>{formatCurrency(docTotal)}</span>
              </div>
            </div>
          </div>
          {paymentLines.length > 0 && (
            <div className={`border rounded-lg overflow-hidden print-break-avoid ${compact ? 'mt-4' : 'mt-6'}`}>
              <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-white">Payment Details</p>
                <p className="text-[10px] text-gray-300 font-medium">Pay securely via UPI / Bank Transfer</p>
              </div>
              <div className={`flex items-center gap-6 ${compact ? 'p-3' : 'p-4'}`}>
                <div className="flex-1 grid grid-cols-1 gap-1">
                  {paymentLines.map((line, i) => {
                    const idx = line.indexOf(':');
                    const label = idx > -1 ? line.slice(0, idx).trim() : '';
                    const value = idx > -1 ? line.slice(idx + 1).trim() : line;
                    return (
                      <div key={i} className="flex gap-2 text-[11px] leading-snug">
                        {label && <span className="font-bold text-gray-900 w-28 shrink-0">{label}:</span>}
                        <span className="text-gray-700">{value}</span>
                      </div>
                    );
                  })}
                </div>
                {company?.paymentQrUrl && (
                  <div className="shrink-0 flex flex-col items-center gap-1.5 border border-gray-300 rounded-lg p-2.5 bg-gray-50">
                    <img src={company.paymentQrUrl} alt="Payment QR code" className={`object-contain ${compact ? 'w-20 h-20' : 'w-28 h-28'}`} />
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Scan to Pay</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className={`border-t border-gray-200 pt-3 print-break-avoid ${compact ? 'mt-4' : 'mt-6'}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Terms & Conditions</p>
            <ol className={`leading-relaxed text-gray-600 list-decimal pl-4 space-y-0.5 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
              {terms.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          </div>
          <div className={`border-t border-gray-200 pt-2 flex flex-wrap gap-2 text-[11px] text-gray-500 ${compact ? 'mt-4' : 'mt-5'}`}>
            {company?.gst && <p>GST No: {company.gst}</p>}
            {company?.pan && <p>PAN: {company.pan}</p>}
          </div>
        </div>
      </div>
    );
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
          <div className="grid grid-cols-2 gap-4">
            <Input label="System Capacity (KW)" placeholder="e.g. 3KW" value={form.systemCapacity} onChange={(e) => setForm({ ...form, systemCapacity: e.target.value })} />
            <Select
              label="System Type *"
              placeholder="Select system type"
              value={form.systemType}
              onChange={(e) => setForm({ ...form, systemType: e.target.value })}
              options={[
                { value: 'On-Grid', label: 'On-Grid' },
                { value: 'Hybrid', label: 'Hybrid' },
              ]}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Items</p>
              <Button variant="outline" size="sm" onClick={addItem} icon={<PlusCircle className="w-4 h-4" />}>Add Item</Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Add the items, brand and quantities. Enter the final total amount at the bottom.</p>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input placeholder="Item" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                  <Input placeholder="Brand" value={item.brand} onChange={(e) => updateItem(i, 'brand', e.target.value)} className="w-40" />
                  <Input placeholder="Qty" type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} className="w-20" onWheel={(e) => e.currentTarget.blur()} />
                  <button onClick={() => removeItem(i)} className="p-2 text-gray-400 hover:text-red-500"><MinusCircle className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
          <Input label="Total Amount (₹) *" type="number" placeholder="0" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} onWheel={(e) => e.currentTarget.blur()} />
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Apply Subsidy</p>
              <p className="text-xs text-gray-500 mt-0.5">Deduct an amount from the total (e.g. government subsidy)</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.applySubsidy}
              onClick={() => setForm({ ...form, applySubsidy: !form.applySubsidy })}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${form.applySubsidy ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.applySubsidy ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {form.applySubsidy && (
            <Input label="Subsidy Amount (₹)" type="number" placeholder="0" value={form.subsidy} onChange={(e) => setForm({ ...form, subsidy: e.target.value })} onWheel={(e) => e.currentTarget.blur()} />
          )}
          <div className="flex justify-end gap-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            {form.applySubsidy && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(totalAmount)}</p>
              </div>
            )}
            {form.applySubsidy && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Subsidy</p>
                <p className="text-sm font-semibold text-green-600">- {formatCurrency(subsidyAmount)}</p>
              </div>
            )}
            <div className="text-right">
              <p className="text-xs text-gray-500">{form.applySubsidy ? 'Net Amount' : 'Total Amount'}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(netTotal)}</p>
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
          <QuotationDoc key={JSON.stringify(preview)} data={preview} />
          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button variant="secondary" onClick={() => window.print()} icon={<Printer className="w-4 h-4" />}>Print / PDF</Button>
            <Button onClick={handleSave} loading={saving} icon={<Save className="w-4 h-4" />}>Save Quotation</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
