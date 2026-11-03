import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
import toast from "react-hot-toast";
import Button, { IconButton } from "../../components/ui/Button";
import Input, { Select } from "../../components/ui/Input";
import Chip, { FilterChip } from "../../components/ui/Chip";
import Paginator from "../../components/ui/Paginator";
import AdminResourceState from "../../components/ui/AdminResourceState";
import CellCodePicker from "../../components/ui/CellCodePicker";
import CreateUserDialog from "../../components/sections/CreateUserDialog";

const ROLES = ["member", "leader", "volunteer", "admin"];

const ROLE_CONFIG = {
  admin: { label: "Admin", color: "error", icon: "shield" },
  leader: { label: "Líder", color: "primary", icon: "star" },
  volunteer: { label: "Voluntario", color: "secondary", icon: "favorite" },
  member: { label: "Miembro", color: "default", icon: "person" },
};

// Modal para editar el código de célula de un líder
function CellModal({ user, onClose, onSaved }) {
  const [cellCode, setCellCode] = useState(user.cell_code || "");
  const [cellType, setCellType] = useState(user.cell_type || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/admin/users/${user.ID}/cell`, {
        cell_code: cellCode,
        cell_type: cellType,
      });
      toast.success("Código de célula actualizado");
      onSaved(user.ID, cellCode, cellType);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg/40" onClick={onClose} />
      <div className="relative glass-light rounded-2xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-title-l text-bg font-bold">Código de célula</h3>
            <p className="text-body-s text-bg/50 mt-0.5">{user.name}</p>
          </div>
          <IconButton
            onClick={onClose}
            className="text-20 leading-none"
            aria-label="Cerrar"
          >
            ×
          </IconButton>
        </div>

        <CellCodePicker
          cellCode={cellCode}
          cellType={cellType}
          onChange={({ cell_code, cell_type }) => {
            setCellCode(cell_code);
            setCellType(cell_type);
          }}
        />

        <div className="flex gap-3 mt-6 pt-4 border-t border-bg/10">
          <Button
            variant="filled"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 justify-center"
          >
            {saving ? "Guardando…" : "Guardar"}
          </Button>
          <Button variant="text" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

function RoleSelect({ userId, name, currentRole, onUpdated }) {
  const [saving, setSaving] = useState(false);

  const change = async (e) => {
    const role = e.target.value;
    setSaving(true);
    try {
      await apiClient.put(`/admin/users/${userId}/role`, { role });
      toast.success("Rol actualizado");
      onUpdated(userId, role);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Select
      aria-label={`Rol de ${name}`}
      value={currentRole}
      onChange={change}
      disabled={saving}
      options={ROLES.map((r) => ({
        value: r,
        label: ROLE_CONFIG[r]?.label || r,
      }))}
      className="text-label-m"
    />
  );
}

function UserAvatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  return (
    <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center shrink-0">
      <span className="text-label-l text-white font-bold">
        {initials || "?"}
      </span>
    </div>
  );
}

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-acento animate-spin" />
  </div>
);

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [cellModal, setCellModal] = useState(null); // user object o null
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");
    const timer = setTimeout(
      () => {
        const params = new URLSearchParams({ page, q: search, role: filter });
        apiClient
          .get(`/admin/users?${params}`, { signal: controller.signal })
          .then(({ data }) => {
            if (active) {
              setUsers(data.data || data || []);
              setMeta(data.meta || null);
              if (data.meta?.pages && page > data.meta.pages)
                setPage(data.meta.pages);
            }
          })
          .catch((failure) => {
            if (active && failure.code !== "ERR_CANCELED")
              setError("No se pudieron cargar los usuarios.");
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      },
      search ? 250 : 0,
    );
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [page, search, filter, revision]);

  const updateRole = (id, role) =>
    setUsers((prev) => prev.map((u) => (u.ID === id ? { ...u, role } : u)));

  const updateCell = (id, cell_code, cell_type) =>
    setUsers((prev) =>
      prev.map((u) => (u.ID === id ? { ...u, cell_code, cell_type } : u)),
    );

  const filtered = users;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {creating && (
        <CreateUserDialog
          onClose={() => setCreating(false)}
          onCreated={() => {
            setPage(1);
            setRevision((value) => value + 1);
          }}
        />
      )}
      {cellModal && (
        <CellModal
          user={cellModal}
          onClose={() => setCellModal(null)}
          onSaved={updateCell}
        />
      )}

      {/* Page header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-s text-bg font-black leading-tight">
            Usuarios
          </h1>
          <p className="text-body-s text-bg/50 mt-0.5">
            {meta?.total ?? users.length} personas encontradas
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>Crear cuenta</Button>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <Input
            value={search}
            label="Buscar usuarios"
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Buscar por nombre o correo…"
          />
        </div>
      </div>

      {/* Filter chips por rol */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <FilterChip
          selected={filter === ""}
          icon="apps"
          onClick={() => {
            setPage(1);
            setFilter("");
          }}
        >
          Todos
        </FilterChip>
        {ROLES.map((r) => {
          const cfg = ROLE_CONFIG[r];
          return (
            <FilterChip
              key={r}
              selected={filter === r}
              icon={cfg.icon}
              onClick={() => {
                setPage(1);
                setFilter(r);
              }}
            >
              {cfg.label}
            </FilterChip>
          );
        })}
      </div>

      {/* Lista */}
      <div className="glass-light rounded-[24px] card-spring overflow-hidden">
        {error ? (
          <AdminResourceState
            error={error}
            onRetry={() => setRevision((value) => value + 1)}
          />
        ) : loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4 text-bg/50">
            <div className="text-center">
              <p className="text-body-l text-bg font-medium">Sin resultados</p>
              <p className="text-body-s text-bg/50 mt-1">
                {search
                  ? `No hay usuarios que coincidan con "${search}".`
                  : "No hay usuarios con ese rol."}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-bg/8">
            {filtered.map((u) => {
              const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.member;
              return (
                <div
                  key={u.ID}
                  className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-bg/8 transition-colors"
                >
                  {/* Avatar */}
                  <UserAvatar name={u.name} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-body-l text-bg font-medium truncate">
                        {u.name || "(sin nombre)"}
                      </span>
                      <Chip color={cfg.color} icon={cfg.icon}>
                        {cfg.label}
                      </Chip>
                      {u.cell_code && (
                        <Chip color="default">{u.cell_code}</Chip>
                      )}
                    </div>
                    <p className="text-body-s text-bg/50 truncate">{u.email}</p>
                    {u.cell_type && (
                      <p className="text-label-s text-bg/50 capitalize mt-0.5">
                        {u.cell_type}
                      </p>
                    )}
                  </div>

                  {/* Botón código célula — solo visible para líderes */}
                  {u.role === "leader" && (
                    <button
                      onClick={() => setCellModal(u)}
                      className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-lg border border-bg/10 text-label-m text-bg/50 hover:border-acento hover:text-bg transition-colors font-mono"
                      title="Editar código de célula"
                    >
                      {u.cell_code || "Sin código"}
                    </button>
                  )}

                  {/* Role selector */}
                  <div className="shrink-0 w-40">
                    <RoleSelect
                      userId={u.ID}
                      name={u.name}
                      currentRole={u.role}
                      onUpdated={updateRole}
                    />
                  </div>

                  {/* Date */}
                  <p className="text-label-s text-bg/50 shrink-0 hidden sm:block">
                    {u.CreatedAt
                      ? new Date(u.CreatedAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {!loading && !error && <Paginator meta={meta} onPage={setPage} />}
    </div>
  );
}
