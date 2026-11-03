import Paginator from "../../components/ui/Paginator";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import Input, { Select } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Chip from "../../components/ui/Chip";
import { useVolunteerAreas } from "../../lib/volunteerAreas";
import VolunteerReports from "../../components/sections/VolunteerReports";
import ModalWrapper from "../../components/ui/ModalWrapper";

const STATUS_CHIP = {
  pendiente: { label: "Pendiente", color: "default" },
  asignado: { label: "Asignado", color: "primary" },
  coordinando: { label: "Coordinando", color: "secondary" },
  usuario_creado: { label: "Usuario creado", color: "tertiary" },
};

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-acento animate-spin" />
  </div>
);

function EmptyState({ isAdmin }) {
  return (
    <div className="flex flex-col items-center py-20 gap-4 text-bg/50">
      <div className="text-center">
        <p className="text-body-l text-bg font-medium">Sin voluntarios</p>
        <p className="text-body-s text-bg/50 mt-1">
          {isAdmin
            ? "Las inscripciones del formulario público aparecerán aquí."
            : "Los voluntarios asignados a ti aparecerán aquí."}
        </p>
      </div>
    </div>
  );
}

export default function AdminVolunteers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  // Departamentos reales (DB, editable desde /admin/volunteer-areas) --
  // antes esta lista tenia su PROPIA copia hardcodeada (DEPT_LABEL).
  const areas = useVolunteerAreas();
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [createModal, setCreateModal] = useState(null);
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("registrations");
  const [creating, setCreating] = useState(false);

  const load = useCallback(
    () =>
      apiClient
        .get(`/admin/volunteers?page=${page}`)
        .then((r) => {
          setVolunteers(r.data?.data || r.data || []);
          setMeta(r.data?.meta || null);
          if (r.data?.meta?.pages && page > r.data.meta.pages)
            setPage(r.data.meta.pages);
        })
        .catch(() => toast.error("Error al cargar voluntarios"))
        .finally(() => setLoading(false)),
    [page],
  );

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (isAdmin)
      apiClient
        .get("/admin/leaders")
        .then((r) => setLeaders(r.data?.data || r.data || []))
        .catch(() => {});
  }, [isAdmin]);

  const handleAssign = async (id, leaderId) => {
    if (!leaderId) return;
    setAssigning(id);
    try {
      await apiClient.put(`/admin/volunteers/${id}/assign`, {
        leader_id: Number(leaderId),
      });
      toast.success("Voluntario asignado");
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Error al asignar");
    } finally {
      setAssigning(null);
    }
  };

  const handleCreateUser = async () => {
    if (!createModal || password.length < 10) {
      toast.error("Contraseña mínimo 10 caracteres");
      return;
    }
    setCreating(true);
    try {
      await apiClient.post(`/admin/volunteers/${createModal}/create-user`, {
        password,
      });
      toast.success("Usuario creado. El aviso de verificación quedó en cola.");
      setCreateModal(null);
      setPassword("");
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Error al crear usuario");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-headline-s text-bg font-black leading-tight">
          Voluntarios
        </h1>
        <p className="text-body-s text-bg/50 mt-0.5">
          {isAdmin
            ? "Inscripciones de interés. Asigna a un líder y crea usuarios."
            : "Voluntarios asignados a ti."}
        </p>
      </div>

      {isAdmin && (
        <div
          className="flex flex-wrap gap-3 mb-5"
          role="group"
          aria-label="Vista de voluntariado"
        >
          <Button
            variant={tab === "registrations" ? "filled" : "outlined"}
            onClick={() => setTab("registrations")}
          >
            Inscripciones
          </Button>
          <Button
            variant={tab === "reports" ? "filled" : "outlined"}
            onClick={() => setTab("reports")}
          >
            Reportes de servicio
          </Button>
        </div>
      )}
      {tab === "reports" ? (
        <VolunteerReports administrative />
      ) : loading ? (
        <Spinner />
      ) : volunteers.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring">
          <EmptyState isAdmin={isAdmin} />
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {volunteers.map((v) => {
            const chip = STATUS_CHIP[v.status] || STATUS_CHIP.pendiente;
            const deptLabel =
              areas.find((a) => a.value === v.department)?.title ||
              v.department ||
              v.area;
            return (
              <div
                key={v.ID}
                className="flex flex-wrap items-start gap-4 p-5 hover:bg-bg/8 transition-colors"
              >
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-body-l text-bg font-medium">
                      {v.name}
                    </span>
                    <Chip color={chip.color}>{chip.label}</Chip>
                    {deptLabel && <Chip color="secondary">{deptLabel}</Chip>}
                  </div>
                  <p className="text-body-s text-bg/50">{v.email}</p>
                  {v.phone && (
                    <p className="text-body-s text-bg/50">{v.phone}</p>
                  )}
                  {v.message && (
                    <p className="text-body-s text-bg/50 mt-2 line-clamp-2 leading-relaxed">
                      {v.message}
                    </p>
                  )}
                </div>

                {/* Trailing actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {isAdmin && v.status !== "usuario_creado" && (
                    <div className="w-40">
                      <Select
                        aria-label={`Líder asignado a ${v.name}`}
                        value={v.assigned_leader_id || ""}
                        onChange={(e) => handleAssign(v.ID, e.target.value)}
                        disabled={!!assigning}
                        options={leaders.map((l) => ({
                          value: l.id,
                          label: l.name,
                        }))}
                        placeholder="Sin asignar"
                        className="text-label-m"
                      />
                    </div>
                  )}
                  {v.status !== "usuario_creado" && (
                    <Button
                      variant="tonal"
                      size="sm"
                      onClick={() => setCreateModal(v.ID)}
                    >
                      Crear usuario
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "registrations" && !loading && (
        <Paginator meta={meta} onPage={setPage} />
      )}
      {/* M3 Dialog — crear usuario */}
      {createModal && (
        <ModalWrapper
          ariaLabel="Crear usuario voluntario"
          busy={creating}
          onClose={() => {
            if (!creating) {
              setCreateModal(null);
              setPassword("");
            }
          }}
        >
          <h3 className="text-headline-s text-bg font-black text-center mb-2">
            Crear usuario
          </h3>
          <p className="text-body-m text-bg/50 text-center mb-6 leading-relaxed">
            Se creará la cuenta con el nombre y correo del voluntario. Define
            una contraseña temporal.
          </p>

          <Input
            label="Contraseña temporal"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Mínimo 10 caracteres"
            autoFocus
          />

          <div className="flex gap-3 mt-6">
            <Button
              variant="text"
              className="flex-1 justify-center"
              disabled={creating}
              onClick={() => {
                setCreateModal(null);
                setPassword("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="filled"
              className="flex-1 justify-center"
              onClick={handleCreateUser}
              disabled={creating || password.length < 10}
            >
              {creating ? "Creando…" : "Crear"}
            </Button>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}
