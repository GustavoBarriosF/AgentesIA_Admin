"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUpdateContactFields } from "@/lib/hooks/useContacts";
import { useNotificationsStore } from "@/lib/stores/notifications.store";
import { cn } from "@/lib/utils";

interface CustomFieldsEditorProps {
  contactId: string;
  fields: Record<string, unknown>;
}

interface FieldRow {
  key: string;
  value: string;
  editing: boolean;
}

export function CustomFieldsEditor({ contactId, fields }: CustomFieldsEditorProps) {
  const updateFields = useUpdateContactFields();
  const { addToast } = useNotificationsStore();

  const [rows, setRows] = useState<FieldRow[]>(() =>
    Object.entries(fields).map(([key, value]) => ({
      key,
      value: String(value ?? ""),
      editing: false,
    }))
  );
  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const buildPayload = (updatedRows: FieldRow[]) =>
    Object.fromEntries(updatedRows.map((r) => [r.key, r.value]));

  const save = async (updatedRows: FieldRow[]) => {
    try {
      await updateFields.mutateAsync({
        contactId,
        fields: buildPayload(updatedRows),
      });
      addToast({ type: "success", message: "Campo guardado" });
    } catch {
      addToast({ type: "error", message: "No se pudo guardar" });
    }
  };

  const startEdit = (key: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, editing: true } : r)));
  };

  const cancelEdit = (key: string) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, editing: false } : r)));
  };

  const confirmEdit = async (key: string) => {
    const updated = rows.map((r) =>
      r.key === key ? { ...r, value: editValues[key] ?? r.value, editing: false } : r
    );
    setRows(updated);
    await save(updated);
  };

  const deleteField = async (key: string) => {
    const updated = rows.filter((r) => r.key !== key);
    setRows(updated);
    await save(updated);
  };

  const addField = async () => {
    const trimKey = newKey.trim();
    const trimVal = newValue.trim();
    if (!trimKey) return;
    const updated = [...rows, { key: trimKey, value: trimVal, editing: false }];
    setRows(updated);
    setNewKey("");
    setNewValue("");
    setAdding(false);
    await save(updated);
  };

  return (
    <div className="space-y-2">
      {rows.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground py-1">Sin campos personalizados</p>
      )}

      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-28 shrink-0 truncate" title={row.key}>
            {row.key}
          </span>

          {row.editing ? (
            <>
              <Input
                value={editValues[row.key] ?? row.value}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [row.key]: e.target.value }))
                }
                className="h-6 text-xs flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmEdit(row.key);
                  if (e.key === "Escape") cancelEdit(row.key);
                }}
              />
              <button
                onClick={() => confirmEdit(row.key)}
                disabled={updateFields.isPending}
                className="text-green-600 hover:text-green-700 disabled:opacity-50"
              >
                {updateFields.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => cancelEdit(row.key)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <span
                className="text-xs flex-1 truncate"
                title={row.value}
              >
                {row.value || <span className="text-muted-foreground italic">vacío</span>}
              </span>
              <button
                onClick={() => startEdit(row.key, row.value)}
                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={() => deleteField(row.key)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      ))}

      {/* Add new field */}
      {adding ? (
        <div className="flex items-center gap-2 pt-1">
          <Input
            placeholder="campo"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="h-6 text-xs w-28 shrink-0"
            autoFocus
          />
          <Input
            placeholder="valor"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="h-6 text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") addField();
              if (e.key === "Escape") { setAdding(false); setNewKey(""); setNewValue(""); }
            }}
          />
          <button
            onClick={addField}
            disabled={!newKey.trim() || updateFields.isPending}
            className="text-green-600 hover:text-green-700 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { setAdding(false); setNewKey(""); setNewValue(""); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
        >
          <Plus className="h-3 w-3" />
          Agregar campo
        </button>
      )}
    </div>
  );
}
