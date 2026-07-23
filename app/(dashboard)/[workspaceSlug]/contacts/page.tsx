"use client";

import { useState } from "react";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { ContactDetail } from "@/components/contacts/ContactDetail";
import { cn } from "@/lib/utils";
import type { Contact } from "@/types/contact";

export default function ContactsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const handleSearch = (s: string) => {
    setSearch(s);
    setPage(1);
  };

  const handleSelect = (contact: Contact) => {
    setSelectedContact((prev) =>
      prev?._id === contact._id ? null : contact
    );
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Table */}
      <div
        className={cn(
          "flex flex-col h-full overflow-hidden transition-all duration-200",
          selectedContact ? "flex-1" : "w-full"
        )}
      >
        <ContactsTable
          page={page}
          search={search}
          selectedId={selectedContact?._id ?? null}
          onPageChange={setPage}
          onSearchChange={handleSearch}
          onSelect={handleSelect}
        />
      </div>

      {/* Detail panel */}
      {selectedContact && (
        <div className="w-72 shrink-0 border-l h-full overflow-hidden flex flex-col bg-background">
          <ContactDetail
            contactId={selectedContact._id}
            onClose={() => setSelectedContact(null)}
            onDelete={() => setSelectedContact(null)}
          />
        </div>
      )}
    </div>
  );
}
