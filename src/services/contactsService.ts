import { Contact } from '../types';

const STORAGE_KEY_CONTACTS = 'nova_phone_contacts_v1';

const DEFAULT_CONTACTS: Contact[] = [
  {
    id: 'c-1',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    initials: 'RS',
    avatarColor: 'from-blue-500 to-indigo-600',
    label: 'Mobile',
  },
  {
    id: 'c-2',
    name: 'Rahul Verma',
    phone: '+91 91234 56789',
    initials: 'RV',
    avatarColor: 'from-cyan-500 to-blue-600',
    label: 'Work',
  },
  {
    id: 'c-3',
    name: 'Priya Patel',
    phone: '+91 98220 12345',
    initials: 'PP',
    avatarColor: 'from-rose-500 to-pink-600',
    label: 'Mobile',
  },
  {
    id: 'c-4',
    name: 'Amit Verma',
    phone: '+91 98450 67890',
    initials: 'AV',
    avatarColor: 'from-amber-500 to-orange-600',
    label: 'Work',
  },
  {
    id: 'c-5',
    name: 'Neha Singh',
    phone: '+91 99887 76655',
    initials: 'NS',
    avatarColor: 'from-emerald-500 to-teal-600',
    label: 'Mobile',
  },
  {
    id: 'c-6',
    name: 'Mom',
    phone: '+91 98111 22233',
    initials: 'M',
    avatarColor: 'from-fuchsia-500 to-purple-600',
    label: 'Family',
  },
  {
    id: 'c-7',
    name: 'Vikram (Lead)',
    phone: '+91 98700 11223',
    initials: 'VL',
    avatarColor: 'from-violet-500 to-indigo-600',
    label: 'Work',
  },
];

export class ContactsService {
  private static instance: ContactsService;

  public static getInstance(): ContactsService {
    if (!ContactsService.instance) {
      ContactsService.instance = new ContactsService();
    }
    return ContactsService.instance;
  }

  public getContacts(): Contact[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONTACTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load contacts', e);
    }
    return DEFAULT_CONTACTS;
  }

  public getAllContacts(): Contact[] {
    return this.getContacts();
  }

  public saveContacts(contacts: Contact[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
    } catch (e) {
      console.error('Failed to save contacts', e);
    }
  }

  public resetContacts(): Contact[] {
    localStorage.removeItem(STORAGE_KEY_CONTACTS);
    return DEFAULT_CONTACTS;
  }

  public resetToDefaults(): Contact[] {
    return this.resetContacts();
  }

  /**
   * Search contacts with fuzzy and substring matching.
   * e.g. "Rahul" matches "Rahul Sharma" and "Rahul Verma"
   */
  public searchContacts(query: string): Contact[] {
    const contacts = this.getContacts();
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    // Exact name matches first
    const exact = contacts.filter(
      (c) => c.name.toLowerCase() === cleanQuery
    );
    if (exact.length > 0) return exact;

    // Substring / first-word / last-word match
    const matches = contacts.filter((c) => {
      const lowerName = c.name.toLowerCase();
      const parts = lowerName.split(/\s+/);
      return (
        lowerName.includes(cleanQuery) ||
        parts.some((p) => p.startsWith(cleanQuery) || cleanQuery.startsWith(p))
      );
    });

    return matches;
  }
}
