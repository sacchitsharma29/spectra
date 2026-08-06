'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCollection, addDocument, deleteDocument } from '@/hooks/useFirestore';
import { doc, setDoc, collection, query, getDocs, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDate, toDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCanWrite } from '@/lib/permissions';
import { compressImageToDataUrl } from '@/lib/image';
import { Plus, Upload, FileText, Image as ImageIcon, File, Eye, Download, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface DocFile {
  id: string; name: string; category: string; mime: string;
  size: number; chunkCount: number; uploadedBy: string; createdAt: any;
}

const categories = ['Business', 'Licenses', 'Agreements', 'Certificates', 'Invoices', 'Tax', 'Other'];

const CHUNK_SIZE = 600000;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const formatBytes = (bytes: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const dataUrlToBlob = (dataUrl: string) => {
  const parts = dataUrl.split(',');
  const meta = parts[0].match(/:(.*?);/);
  const mime = meta ? meta[1] : 'application/octet-stream';
  const bin = atob(parts[1]);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

export default function DocumentsPage() {
  const { data: documents, loading } = useCollection<DocFile>('documents', [orderBy('createdAt', 'desc')]);
  const { userData } = useAuth();
  const canWrite = useCanWrite();
  const [activeCategory, setActiveCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocFile | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Business');
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const filtered = activeCategory === 'All' ? documents : documents.filter((d) => d.category === activeCategory);

  const resetModal = () => {
    setShowModal(false);
    setFile(null);
    setName('');
    setCategory('Business');
  };

  const handleFileSelected = (selected: File | null) => {
    if (!selected) return;
    if (selected.size > MAX_FILE_BYTES) {
      toast.error('File is too large (max 15 MB)');
      return;
    }
    setFile(selected);
    const base = selected.name.replace(/\.[^.]+$/, '');
    setName(base || selected.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelected(e.dataTransfer.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Choose a file first'); return; }
    setUploading(true);
    try {
      const dataUrl = file.type.startsWith('image/')
        ? await compressImageToDataUrl(file, 1600, 900000)
        : await readFileAsDataUrl(file);

      const docId = await addDocument('documents', {
        name: name.trim() || file.name,
        category,
        mime: file.type,
        size: file.size,
        chunkCount: Math.ceil(dataUrl.length / CHUNK_SIZE),
        uploadedBy: userData?.name || 'Admin',
      });

      for (let i = 0; i < dataUrl.length; i += CHUNK_SIZE) {
        await setDoc(doc(db, 'documents', docId, 'chunks', String(i / CHUNK_SIZE)), {
          index: i / CHUNK_SIZE,
          data: dataUrl.slice(i, i + CHUNK_SIZE),
        });
      }

      toast.success('Document uploaded');
      resetModal();
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    }
    setUploading(false);
  };

  const getFullDataUrl = async (d: DocFile) => {
    const q = query(collection(db, 'documents', d.id, 'chunks'), orderBy('index'));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('File data not found');
    return snap.docs.map((s) => s.data().data).join('');
  };

  const handleView = async (d: DocFile) => {
    setBusyId(d.id);
    try {
      const dataUrl = await getFullDataUrl(d);
      const url = URL.createObjectURL(dataUrlToBlob(dataUrl));
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to open document');
    }
    setBusyId(null);
  };

  const handleDownload = async (d: DocFile) => {
    setBusyId(d.id);
    try {
      const dataUrl = await getFullDataUrl(d);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = d.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Downloading...');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to download');
    }
    setBusyId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const q = query(collection(db, 'documents', deleteTarget.id, 'chunks'));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map((s) => deleteDoc(s.ref)));
      await deleteDocument('documents', deleteTarget.id);
      toast.success('Document deleted');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    }
  };

  const fileIcon = (d: DocFile) => {
    if (d.mime.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-blue-500" />;
    if (d.mime === 'application/pdf') return <FileText className="w-6 h-6 text-red-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Documents</h1><p className="text-gray-500 mt-1">All your business documents in one place</p></div>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Upload Document</Button>}
      </div>

      <div className="flex flex-wrap gap-2">
        {['All', ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === c
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <Card><CardContent>
        {!loading && filtered.length === 0 ? (
          <EmptyState
            title={activeCategory === 'All' ? 'No documents yet' : `No ${activeCategory} documents`}
            description="Upload your business documents here for easy access"
            action={canWrite ? { label: 'Upload Document', onClick: () => setShowModal(true) } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((d) => (
              <div key={d.id} className="group border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    {fileIcon(d)}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {d.category}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-3 truncate" title={d.name}>{d.name}</p>
                <p className="text-xs text-gray-500 mt-1">{formatBytes(d.size)} · {formatDate(toDate(d.createdAt))}</p>
                <p className="text-xs text-gray-400 mt-0.5">Uploaded by {d.uploadedBy || 'Admin'}</p>
                <div className="flex items-center gap-1 mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                  <button onClick={() => handleView(d)} disabled={busyId === d.id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => handleDownload(d)} disabled={busyId === d.id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  {canWrite && (
                    <button onClick={() => setDeleteTarget(d)} className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={resetModal} title="Upload Document">
        <div className="space-y-4">
          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileSelected(e.target.files?.[0] || null)} />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }`}
          >
            <Upload className="w-8 h-8 text-gray-400" />
            {file ? (
              <>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-500">{formatBytes(file.size)} · click to change</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to choose a file or drag & drop</p>
                <p className="text-xs text-gray-500">PDF, images, Word, Excel — up to 15 MB</p>
              </>
            )}
          </div>
          {file && (
            <button onClick={() => setFile(null)} className="flex items-center gap-1 text-xs text-red-500 hover:underline">
              <X className="w-3.5 h-3.5" /> Remove file
            </button>
          )}
          <Input label="Document Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name" />
          <Select
            label="Category"
            options={categories.map((c) => ({ value: c, label: c }))}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={resetModal}>Cancel</Button>
            <Button onClick={handleUpload} loading={uploading} icon={<Upload className="w-4 h-4" />} disabled={!file}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Document" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
