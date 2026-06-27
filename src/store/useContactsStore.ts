import { create } from 'zustand';

interface Contact {
  name: string;
  phoneNumber: string;
}

interface ContactsStore {
  contacts: Contact[];
  addContact: (name: string, phoneNumber: string) => void;
  removeContact: (name: string) => void;
  findContact: (name: string) => Contact | undefined;
}

export const useContactsStore = create<ContactsStore>((set, get) => ({
  contacts: [
    { name: 'mom', phoneNumber: '' },
    { name: 'dad', phoneNumber: '' },
  ],
  addContact: (name, phoneNumber) =>
    set(state => ({
      contacts: [
        ...state.contacts.filter(c => c.name !== name.toLowerCase()),
        { name: name.toLowerCase(), phoneNumber },
      ],
    })),
  removeContact: (name) =>
    set(state => ({
      contacts: state.contacts.filter(c => c.name !== name.toLowerCase()),
    })),
  findContact: (name) => get().contacts.find(c => c.name === name.toLowerCase()),
}));
