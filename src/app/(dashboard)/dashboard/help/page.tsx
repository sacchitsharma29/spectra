'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { addDocument, useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime, toDate } from '@/lib/utils';
import { LifeBuoy, Send, ArrowRight } from 'lucide-react';
import { where } from 'firebase/firestore';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function HelpPage() {
  const { userData } = useAuth();
  const { data: myTickets, loading } = useCollection<any>('tickets', [where('createdBy', '==', userData?.uid || '')]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', priority: 'Medium' });

  const handleSubmit = async () => {
    if (!form.subject || !form.message) { toast.error('Please fill all fields'); return; }
    try {
      await addDocument('tickets', {
        subject: form.subject,
        description: form.message,
        priority: form.priority,
        type: 'internal',
        source: 'help',
        status: 'Open',
        createdBy: userData?.uid || '',
        createdByName: userData?.name || userData?.email || 'Unknown',
      });
      toast.success('Ticket raised! An admin will respond shortly.');
      setShowForm(false);
      setForm({ subject: '', message: '', priority: 'Medium' });
    } catch (err: any) { toast.error(err?.message || 'Failed to submit'); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Help & Support</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Raise a ticket and an admin will help you out</p>
        </div>
        <Link
          href="/dashboard/support"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View in Support <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <Card>
        <CardContent>
          {!showForm ? (
            <div className="text-center py-8">
              <LifeBuoy className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">Need help? Submit a ticket and our team will get back to you.</p>
              <Button onClick={() => setShowForm(true)} icon={<LifeBuoy className="w-4 h-4" />}>Raise a Ticket</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Raise a Ticket</h2>
              <Input label="Subject *" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief summary of your issue" />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                <textarea className="input-field min-h-[100px] resize-y" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe your issue in detail..." />
              </div>
              <Select
                label="Priority"
                options={[{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }, { value: 'Urgent', label: 'Urgent' }]}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSubmit} icon={<Send className="w-4 h-4" />}>Submit</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">My Tickets</h2>
          </div>
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
            </div>
          ) : myTickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 dark:text-gray-500 text-sm">You haven't raised any tickets yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {myTickets.map((t: any) => (
                <div key={t.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{t.subject}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.status === 'Open' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        t.status === 'Resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-gray-100 text-gray-800'
                      }`}>{t.status}</span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDateTime(toDate(t.createdAt))}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{t.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
