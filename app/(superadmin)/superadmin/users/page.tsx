"use client";

import { useState } from "react";
import {
  Plus, Loader2, AlertTriangle, Shield, UserCheck,
  ToggleLeft, ToggleRight, Trash2, Edit2, X, Check,
} from "lucide-react";
import {
  useSuperAdminUsers,
  useCreateSuperAdminUser,
  useUpdateSuperAdminUser,
  useDeleteSuperAdminUser,
} from "@/lib/hooks/superadmin/useSuperAdminUsers";
import { useSuperAdminStore } from "@/lib/stores/superadmin.store";
import type { SuperAdminUserFull } from "@/lib/hooks/superadmin/useSuperAdminUsers";

const ROLE_BADGE: Record<string, string> = {
  superadmin: "bg-indigo-500/20 text-indigo-400",
  support:    "bg-zinc-700 text-zinc-300",
};

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Super Admin",
  support:    "Soporte",
};

const EMPTY_FORM: { email: string; password: string; name: string; role: "superadmin" | "support" } = { email: "", password: "", name: "", role: "support" };

export default function UsersPage() {
  const currentAdmin = useSuperAdminStore((s) => s.admin);
  const { data: users, isLoading, error } = useSuperAdminUsers();
  const createUser  = useCreateSuperAdminUser();
  const updateUser  = useUpdateSuperAdminUser();
  const deleteUser  = useDeleteSuperAdminUser();

  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editName, setEditName]       = useState("");
  const [editRole, setEditRole]       = useState<"superadmin" | "support">("support");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const isSuperAdmin = currentAdmin?.role === "superadmin";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser.mutateAsync(form);
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const startEdit = (user: SuperAdminUserFull) => {
    setEditingId(user._id);
    setEditName(user.name);
    setEditRole(user.role);
  };

  const saveEdit = async (userId: string) => {
    await updateUser.mutateAsync({ userId, name: editName, role: editRole });
    setEditingId(null);
  };

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">
            Usuarios administradores
          </h1>
          <p className="text-sm text-zinc-500">
            Gestiona quién tiene acceso al panel de administración.{" "}
            <span className="text-zinc-600">
              Las variables de entorno solo crean el primer usuario (bootstrap).
            </span>
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </button>
        )}
      </div>

      {/* Roles explanation */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-indigo-400" />
            <p className="text-sm font-medium text-indigo-400">Super Admin</p>
          </div>
          <p className="text-xs text-zinc-500">
            Acceso completo: gestionar workspaces, planes, cupones, facturación y otros usuarios admin.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="h-4 w-4 text-zinc-400" />
            <p className="text-sm font-medium text-zinc-300">Soporte</p>
          </div>
          <p className="text-xs text-zinc-500">
            Solo lectura: puede ver workspaces y métricas, pero no puede modificar planes ni crear usuarios.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-16 text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Error al cargar usuarios</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="px-4 py-3 text-left font-medium">Usuario</th>
                <th className="px-4 py-3 text-left font-medium">Rol</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-left font-medium">Último login</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => {
                const isMe = user._id === currentAdmin?._id;
                const isEditing = editingId === user._id;

                return (
                  <tr
                    key={user._id}
                    className="border-b border-zinc-800/50 last:border-0"
                  >
                    {/* Name + email */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                          autoFocus
                        />
                      ) : (
                        <>
                          <p className="font-medium text-zinc-200">
                            {user.name}
                            {isMe && (
                              <span className="ml-2 text-xs text-zinc-500">(tú)</span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500">{user.email}</p>
                        </>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      {isEditing && !isMe ? (
                        <select
                          value={editRole}
                          onChange={(e) =>
                            setEditRole(e.target.value as "superadmin" | "support")
                          }
                          className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-zinc-300 outline-none focus:border-indigo-500"
                        >
                          <option value="superadmin">Super Admin</option>
                          <option value="support">Soporte</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[user.role]}`}
                        >
                          {ROLE_LABEL[user.role]}
                        </span>
                      )}
                    </td>

                    {/* Active toggle */}
                    <td className="px-4 py-3">
                      {isSuperAdmin && !isMe ? (
                        <button
                          onClick={() =>
                            updateUser.mutate({ userId: user._id, active: !user.active })
                          }
                          className="transition hover:opacity-80"
                          title={user.active ? "Desactivar" : "Activar"}
                        >
                          {user.active ? (
                            <ToggleRight className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-zinc-600" />
                          )}
                        </button>
                      ) : (
                        <span
                          className={`text-xs font-medium ${user.active ? "text-emerald-400" : "text-zinc-500"}`}
                        >
                          {user.active ? "Activo" : "Inactivo"}
                        </span>
                      )}
                    </td>

                    {/* Last login */}
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleString("es", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Nunca"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      {isSuperAdmin && (
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(user._id)}
                                disabled={updateUser.isPending}
                                className="rounded p-1.5 text-emerald-400 hover:bg-zinc-800"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(user)}
                                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                                title="Editar"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              {!isMe && (
                                <button
                                  onClick={() => setConfirmDelete(user._id)}
                                  className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <h2 className="text-base font-semibold text-zinc-100">
                Nuevo usuario administrador
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(EMPTY_FORM);
                }}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  Nombre *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  Contraseña * (mín. 8 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  Rol
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value as "superadmin" | "support",
                    }))
                  }
                  className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-indigo-500"
                >
                  <option value="support">Soporte (solo lectura)</option>
                  <option value="superadmin">Super Admin (acceso completo)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setForm(EMPTY_FORM);
                  }}
                  className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createUser.isPending}
                  className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
                >
                  {createUser.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Crear usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
            <p className="text-sm font-medium text-zinc-100">
              ¿Eliminar este usuario?
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Esta acción es permanente y no se puede deshacer.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                disabled={deleteUser.isPending}
                onClick={() =>
                  deleteUser.mutate(confirmDelete, {
                    onSuccess: () => setConfirmDelete(null),
                  })
                }
                className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {deleteUser.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
