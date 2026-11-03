import Paginator from "../../components/ui/Paginator";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
import toast from "react-hot-toast";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useVolunteerAreas } from "../../lib/volunteerAreas";
import ModalWrapper from "../../components/ui/ModalWrapper";

const STATUS_CHIP = {
  pendiente: { label: "Pendiente", cls: "bg-bg/8 text-bg/50" },
  asignado: { label: "Asignado", cls: "bg-acento text-bg" },
  activo: { label: "Activo", cls: "bg-emerald text-white" },
  usuario_creado: { label: "Usuario creado", cls: "bg-emerald text-white" },
};

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
  </div>
);

export default function LeaderVolunteers() {
  const areas = useVolunteerAreas();
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(null);
  const [password, setPassword] = useState("");
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
      <div className="mb-6">
        <h1 className="text-headline-s text-bg font-black">
          Voluntarios asignados
        </h1>
        <p className="text-body-s text-bg/50 mt-0.5">
          Coordina con estos voluntarios. Cuando estén listos, crea su usuario
          para que puedan acceder.
        </p>
      </div>

      {loading ? (
        <Spinner />
      ) : volunteers.length === 0 ? (
        <div className="glass-light rounded-[20px] card-spring text-center py-16">
          <p className="text-body-s text-bg/50">
            No tienes voluntarios asignados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {volunteers.map((v) => {
            const chip = STATUS_CHIP[v.status] || STATUS_CHIP.pendiente;
            const deptLabel =
              areas.find((a) => a.value === v.department)?.title ||
              v.department ||
              v.area;
            return (
              <div
                key={v.ID}
                className="glass-light rounded-[20px] card-spring p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-title-s text-bg font-semibold">
                        {v.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-label-s font-medium ${chip.cls}`}
                      >
                        {chip.label}
                      </span>
                    </div>
                    <p className="text-label-s text-bg/50">{v.email}</p>
                    {v.phone && (
                      <p className="text-label-s text-bg/50">{v.phone}</p>
                    )}
                    {deptLabel && (
                      <p className="text-body-s text-bg mt-0.5">
                        Área: <strong>{deptLabel}</strong>
                      </p>
                    )}
                    {v.message && (
                      <p className="text-body-s text-bg/50 mt-1 line-clamp-2">
                        {v.message}
                      </p>
                    )}
                  </div>
                  {v.status !== "usuario_creado" && (
                    <button
                      onClick={() => setCreateModal(v.ID)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg text-white text-label-m font-medium hover:opacity-90 transition-opacity shrink-0"
                    >
                      Crear usuario
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && <Paginator meta={meta} onPage={setPage} />}
      {/* Modal */}
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
          <h3 className="text-title-l text-bg font-bold mb-2">Crear usuario</h3>
          <p className="text-body-s text-bg/50 mb-4 leading-relaxed">
            Define una contraseña temporal. El voluntario recibirá un correo
            para verificar su cuenta.
          </p>
          <Input
            label="Contraseña temporal"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Mínimo 10 caracteres"
            autoFocus
          />
          <div className="flex gap-2 mt-6">
            <Button
              variant="outlined"
              className="flex-1"
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
              className="flex-1"
              onClick={handleCreateUser}
              disabled={creating || password.length < 10}
            >
              {creating ? "Creando…" : "Crear usuario"}
            </Button>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}
