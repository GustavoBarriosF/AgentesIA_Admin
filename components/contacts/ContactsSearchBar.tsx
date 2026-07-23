"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ContactsSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function ContactsSearchBar({ value, onChange }: ContactsSearchBarProps) {
  const [local, setLocal] = useState(value);

  // Debounce: fire onChange 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 400);
    return () => clearTimeout(timer);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync if parent resets
  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div className="relative w-64">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        placeholder="Buscar por nombre, email o teléfono..."
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="pl-8 pr-8 h-8 text-sm"
      />
      {local && (
        <button
          onClick={() => { setLocal(""); onChange(""); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
