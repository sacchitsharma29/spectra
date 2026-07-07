'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCollection, addDocument, updateDocument, deleteDocument } from '@/hooks/useFirestore';
import { formatDate, formatDateTime, toDate, getStatusColor, getPriorityColor } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, MessageSquare, LifeBuoy, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Ticket {
  id: string; ticketId?: string; customerName?: string; subject: string;
  status: string; priority: string; assignedTo?: string; createdAt: any;
  type?: string; createdByName?: string; description?: string;
  response?: string; respondedBy?: string; respondedAt?: any;
}

export default function SupportPage() {
  const { userData } = useAuth();
  const isAdmin = (userData?.role as string) === 'admin' || userData?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState<'customer' | 'internal'>('customer');
  const [showModal, setShowModal] = useState(false);
  const { data: allTickets, loading } = useCollection<Ticket>('tickets');
  const canWrite = useCanWrite();
  const [form, setForm] = useState({ customerName: '', subject: '', description: '', priority: 'Medium' });
  const [respondTo, setRespondTo] = useState<Ticket | null>(null);
  const [response, setResponse] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const customerTickets = useMemo(() =>
    allTickets.filter((t) => !t.type || t.type === 'customer'), [allTickets]);
  const internalTickets = useMemo(() =>
    allTickets.filter((t) => t.type === 'internal'), [allTickets]);

  const customerColumns: Column<Ticket>[] = [
    { key: 'ticketId', header: 'Ticket #', width: '100px' },
    { key: 'customerName', header: 'Customer' },
    { key: 'subject', header: 'Subject' },
    { key: 'status', header: 'Status', render: (t) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}>{t.status}</span> },
    { key: 'priority', header: 'Priority', render: (t) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(t.priority)}`}>{t.priority}</span> },
    { key: 'assignedTo', header: 'Assigned' },
    { key: 'createdAt', header: 'Created', render: (t) => <span className="text-gray-500">{formatDate(t.createdAt)}</span> },
    ...(canWrite ? [{
      key: 'actions' as const, header: '', width: '50px' as const,
      render: (t: Ticket) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteTarget(t); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          title="Delete ticket"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    }] : []),
  ];

  const internalColumns: Column<Ticket>[] = [
    { key: 'createdByName', header: 'From', width: '140px' },
    { key: 'subject', header: 'Subject' },
    { key: 'status', header: 'Status', render: (t) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}>{t.status}</span> },
    { key: 'priority', header: 'Priority', render: (t) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(t.priority)}`}>{t.priority}</span> },
    { key: 'createdAt', header: 'Created', render: (t) => <span className="text-gray-500">{formatDate(t.createdAt)}</span> },
    {
      key: 'actions', header: '', width: '100px',
      render: (t) => isAdmin && t.status === 'Open' ? (
        <Button size="sm" variant="outline" onClick={() => setRespondTo(respondTo?.id === t.id ? null : t)} icon={<MessageSquare className="w-3 h-3" />}>
          {respondTo?.id === t.id ? 'Close' : 'Respond'}
        </Button>
      ) : null,
    },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('tickets', deleteTarget.id);
      toast.success('Ticket deleted');
      setDeleteTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to delete'); }
  };

  const handleCreate = async () => {
    if (!form.customerName || !form.subject) { toast.error('Fill required fields'); return; }
    try {
      await addDocument('tickets', { ...form, status: 'Open', type: 'customer' });
      toast.success('Ticket created!'); setShowModal(false);
    } catch (err: any) { toast.error(err?.message); }
  };

  const handleRespond = async (ticket: Ticket) => {
    if (!response) { toast.error('Please write a response'); return; }
    try {
      await updateDocument('tickets', ticket.id, {
        status: 'Resolved',
        response,
        respondedBy: userData?.name || userData?.email || 'Admin',
        respondedAt: new Date(),
      });
      toast.success('Response sent');
      setRespondTo(null);
      setResponse('');
    } catch (err: any) { toast.error(err?.message); }
  };

  const tabs = [
    { key: 'customer' as const, label: 'Customer Tickets', count: customerTickets.length },
    { key: 'internal' as const, label: 'Internal Help', count: internalTickets.length, icon: LifeBuoy },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Service & Support</h1><p className="text-gray-500 dark:text-gray-400 mt-1">Manage support tickets</p></div>
        {canWrite && activeTab === 'customer' && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Ticket</Button>}
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {activeTab === 'customer' && (
            !loading && customerTickets.length === 0
              ? <div className="p-6"><EmptyState title="No customer tickets" description="Create your first support ticket" action={canWrite ? { label: 'Create', onClick: () => setShowModal(true) } : undefined} /></div>
              : <DataTable columns={customerColumns} data={customerTickets} loading={loading} searchable exportable />
          )}
          {activeTab === 'internal' && (
            <>
              {loading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
                </div>
              ) : internalTickets.length === 0 ? (
                <div className="p-6"><EmptyState title="No internal tickets" description="Team members haven't raised any help requests" /></div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {internalTickets.map((t) => (
                    <div key={t.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{t.createdByName}</span>
                          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">{t.subject}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}>{t.status}</span>
                        </div>
                        <span className="text-xs text-gray-400">{formatDateTime(toDate(t.createdAt))}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-1">{t.description}</p>

                      {t.response && (
                        <div className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Response by {t.respondedBy}:</p>
                          <p className="text-sm text-blue-800 dark:text-blue-200">{t.response}</p>
                        </div>
                      )}

                      {isAdmin && t.status === 'Open' && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          {respondTo?.id === t.id ? (
                            <div className="space-y-2">
                              <textarea
                                className="input-field min-h-[60px] resize-y text-sm"
                                placeholder="Type your response..."
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleRespond(t)} icon={<Send className="w-3 h-3" />}>Send</Button>
                                <Button variant="secondary" size="sm" onClick={() => { setRespondTo(null); setResponse(''); }}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => setRespondTo(t)} icon={<MessageSquare className="w-3 h-3" />}>Respond</Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Ticket" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this ticket? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Ticket">
        <div className="space-y-4">
          <Input label="Customer *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <Input label="Subject *" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label><textarea className="input-field min-h-[100px] resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <Select label="Priority" options={[{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }, { value: 'Urgent', label: 'Urgent' }]} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleCreate}>Create</Button></div>
        </div>
      </Modal>
    </div>
  );
}
