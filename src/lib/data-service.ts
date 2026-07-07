import {
  collection, query, where, orderBy, limit, getDocs,
  addDoc, updateDoc, deleteDoc, doc, getDoc, serverTimestamp,
  QueryConstraint, DocumentData, Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { generateId } from './utils';

const COLLECTIONS = {
  leads: 'leads',
  customers: 'customers',
  followups: 'followups',
  surveys: 'surveys',
  quotations: 'quotations',
  projects: 'projects',
  payments: 'payments',
  invoices: 'invoices',
  tickets: 'tickets',
  tasks: 'tasks',
  documents: 'documents',
  notifications: 'notifications',
  activityLogs: 'activityLogs',
  users: 'users',
  settings: 'settings',
} as const;

type TimestampValue = Timestamp | Date | null | undefined;

function parseDate(val: TimestampValue): Date | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return null;
}

export async function listDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<(T & { id: string })[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T & { id: string }));
}

export async function getDocument<T>(collectionName: string, docId: string): Promise<(T & { id: string }) | null> {
  const d = await getDoc(doc(db, collectionName, docId));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() } as T & { id: string };
}

export async function createDocument(collectionName: string, data: DocumentData) {
  const id = generateId(collectionName.slice(0, -1).toUpperCase());
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    [collectionName === 'leads' ? 'leadId' : collectionName === 'customers' ? 'customerId' :
     collectionName === 'quotations' ? 'quoteId' : collectionName === 'projects' ? 'projectId' :
     collectionName === 'payments' ? 'paymentId' : collectionName === 'invoices' ? 'invoiceId' :
     collectionName === 'tickets' ? 'ticketId' : 'id']: id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDocument(collectionName: string, docId: string, data: DocumentData) {
  await updateDoc(doc(db, collectionName, docId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteDocument(collectionName: string, docId: string) {
  await deleteDoc(doc(db, collectionName, docId));
}

export async function uploadFile(path: string, file: File) {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function searchCollection<T>(
  collectionName: string,
  field: string,
  searchTerm: string,
  limitCount = 20
): Promise<(T & { id: string })[]> {
  const q = query(
    collection(db, collectionName),
    where(field, '>=', searchTerm),
    where(field, '<=', searchTerm + '\uf8ff'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T & { id: string }));
}

export function getDefaultQueryConstraints() {
  return [orderBy('createdAt', 'desc'), limit(100)];
}

export { COLLECTIONS, parseDate };
