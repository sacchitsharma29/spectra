'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useCollection, addDocument, deleteDocument } from '@/hooks/useFirestore';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Phone,
  HardHat,
  ClipboardCheck,
  CreditCard,
  Plus,
  Trash2,
} from 'lucide-react';
import { toDate } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const typeIcons: Record<string, any> = {
  followup: Phone,
  survey: ClipboardCheck,
  installation: HardHat,
  payment: CreditCard,
  service: Phone,
  other: CalendarIcon,
};

const typeColors: Record<string, string> = {
  followup: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  survey: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  installation: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  payment: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  service: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
};

export default function CalendarPage() {
  const { user } = useAuth();
  const canWrite = useCanWrite();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', date: '', time: '', type: 'followup' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().getDate();

  const days: (number | null)[] = Array.from({ length: firstDay }, () => null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const { data: followups } = useCollection<any>('followups');
  const { data: surveys } = useCollection<any>('surveys');
  const { data: calendarEvents } = useCollection<any>('calendarevents');

  const allEvents = useMemo(() => {
    const events: { id: string; title: string; type: string; time: string; date: Date; source: string }[] = [];

    followups.forEach((f: any) => {
      const d = toDate(f.date);
      if (d) {
        events.push({
          id: f.id,
          title: `${f.customerName || 'Follow-up'} - ${f.method || 'Call'}`,
          type: 'followup',
          time: f.time || '',
          date: d,
          source: 'followups',
        });
      }
    });

    surveys.forEach((s: any) => {
      const d = toDate(s.scheduledDate);
      if (d) {
        events.push({
          id: s.id,
          title: `${s.customerName || 'Survey'} - Site Survey`,
          type: 'survey',
          time: '',
          date: d,
          source: 'surveys',
        });
      }
    });

    calendarEvents.forEach((e: any) => {
      const d = toDate(e.date);
      if (d) {
        events.push({
          id: e.id,
          title: e.title || 'Event',
          type: e.type || 'other',
          time: e.time || '',
          date: d,
          source: 'calendarevents',
        });
      }
    });

    return events;
  }, [followups, surveys, calendarEvents]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, typeof allEvents> = {};
    allEvents.forEach((e) => {
      if (e.date.getMonth() === month && e.date.getFullYear() === year) {
        const day = e.date.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(e);
      }
    });
    return map;
  }, [allEvents, month, year]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return allEvents
      .filter((e) => e.date.getTime() >= todayStart.getTime())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 4);
  }, [allEvents]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument(deleteTarget.collection, deleteTarget.id);
      toast.success('Event deleted');
      setDeleteTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to delete'); }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dateStr = formData.date + (formData.time ? `T${formData.time}` : 'T00:00');
      await addDocument('calendarevents', {
        title: formData.title,
        date: Timestamp.fromDate(new Date(dateStr)),
        time: formData.time || '',
        type: formData.type,
        createdBy: user?.uid || null,
      });
      toast.success('Event added successfully');
      setShowAddModal(false);
      setFormData({ title: '', date: '', time: '', type: 'followup' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to add event');
    } finally {
      setSubmitting(false);
    }
  };

  const formatEventDate = (date: Date, time: string) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const eventStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (eventStart.getTime() === todayStart.getTime()) {
      return time ? `Today, ${time}` : 'Today';
    }
    if (eventStart.getTime() === tomorrowStart.getTime()) {
      return time ? `Tomorrow, ${time}` : 'Tomorrow';
    }

    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return time ? `${dateStr}, ${time}` : dateStr;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
        {canWrite && (
          <Button onClick={() => setShowAddModal(true)} icon={<Plus className="w-4 h-4" />}>
            Add Event
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {monthNames[month]} {year}
              </h2>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  Today
                </button>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              {weekDays.map((day) => (
                <div key={day} className="bg-gray-50 dark:bg-gray-800/50 p-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {day}
                </div>
              ))}
              {days.map((d, i) => (
                <div
                  key={i}
                  className={`bg-white dark:bg-gray-900 min-h-[80px] p-1.5 ${
                    d === today ? 'ring-2 ring-blue-500 ring-inset' : ''
                  }`}
                >
                  {d && (
                    <>
                      <p className={`text-xs font-medium mb-1 ${d === today ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                        {d}
                      </p>
                      <div className="space-y-0.5">
                        {(eventsByDay[d] || []).map((evt, j) => {
                          const Icon = typeIcons[evt.type] || CalendarIcon;
                          return (
                            <div key={`${evt.id}-${j}`} className={`text-[10px] px-1 py-0.5 rounded border ${typeColors[evt.type] || typeColors.other} truncate flex items-center gap-0.5`}>
                              <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate">{evt.title}</span>
                              {canWrite && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: evt.id, collection: (evt as any).source || 'calendarevents' }); }}
                                  className="ml-auto p-0.5 text-gray-400 hover:text-red-500 shrink-0"
                                  title="Delete event"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming Events</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No upcoming events</p>
              )}
              {upcomingEvents.map((evt) => {
                const Icon = typeIcons[evt.type] || CalendarIcon;
                const colorClass = typeColors[evt.type] || typeColors.other;
                return (
                  <div key={evt.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass.split(' ')[0]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{evt.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatEventDate(evt.date, evt.time)}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Event" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this event? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Event">
        <form onSubmit={handleAddEvent} className="space-y-4">
          <Input
            label="Title"
            placeholder="Enter event title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Input
            label="Time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          />
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: 'followup', label: 'Follow-up' },
              { value: 'survey', label: 'Survey' },
              { value: 'installation', label: 'Installation' },
              { value: 'payment', label: 'Payment' },
              { value: 'service', label: 'Service' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Add Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
