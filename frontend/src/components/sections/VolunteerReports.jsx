import { useCallback, useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
import Button from "../ui/Button";

const LABELS = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export default function VolunteerReports({
  administrative = false,
  revision = 0,
}) {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await apiClient.get(
        `${administrative ? "/admin/volunteer-reports" : "/volunteer/reports"}?page=${page}&limit=10`,
      );
      setReports(data.data || []);
      setPages(data.meta?.pages || 1);
    } catch {
      setError("No se pudieron cargar los reportes de servicio.");
    } finally {
      setLoading(false);
    }
  }, [administrative, page]);
  useEffect(() => {
    load();
  }, [load, revision]);
  const review = async (id, status) => {
    setBusy(id);
    try {
      await apiClient.put(`/admin/volunteer-reports/${id}/approve`, { status });
      await load();
    } catch {
      setError("No se pudo guardar la revisión. Puedes volver a intentarlo.");
    } finally {
      setBusy(null);
    }
  };
  return (
    <section aria-label="Reportes de servicio" className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-20 font-bold text-bg">Reportes de servicio</h2>
        <Button size="sm" onClick={load} disabled={loading}>
          Actualizar reportes
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="text-bg bg-white/80 border border-rose/40 p-4 rounded-[12px]"
        >
          {error}
        </p>
      )}
      {loading ? (
        <p role="status" className="p-5 text-bg/65">
          Cargando reportes…
        </p>
      ) : reports.length ? (
        reports.map((report) => (
          <article
            key={report.ID}
            aria-label={`Reporte de ${report.volunteer_name}`}
            className="glass-light rounded-[16px] p-5 space-y-3 text-bg"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold">{report.volunteer_name}</h3>
                <p className="text-14 text-bg/70">
                  {report.area} · {report.service_date}
                </p>
              </div>
              <span className="text-13 font-bold rounded-lg px-3 py-2 bg-bg/8">
                {LABELS[report.status] || report.status}
              </span>
            </div>
            {report.leader_name && (
              <p className="text-14">Responsable: {report.leader_name}</p>
            )}
            <p className="text-14">
              Asistencia del equipo: {report.team_attendance}
            </p>
            {report.notes && (
              <p className="text-14 whitespace-pre-wrap [overflow-wrap:anywhere]">
                {report.notes}
              </p>
            )}
            {report.photo_url && (
              <a
                href={report.photo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center font-semibold text-14 underline focus-ring rounded-lg"
              >
                Ver fotografía del reporte
              </a>
            )}
            {administrative && report.status === "pendiente" && (
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => review(report.ID, "aprobado")}
                >
                  {busy === report.ID ? "Guardando…" : "Aprobar reporte"}
                </Button>
                <Button
                  size="sm"
                  variant="outlined"
                  disabled={busy !== null}
                  onClick={() => review(report.ID, "rechazado")}
                >
                  Rechazar reporte
                </Button>
              </div>
            )}
          </article>
        ))
      ) : (
        <p className="glass-light rounded-[16px] p-5 text-bg/65">
          Todavía no hay reportes de servicio.
        </p>
      )}
      {pages > 1 && (
        <div className="flex flex-wrap justify-between gap-3 items-center text-bg">
          <Button
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Anterior
          </Button>
          <span className="text-13">
            {page} de {pages}
          </span>
          <Button
            size="sm"
            disabled={loading || page >= pages}
            onClick={() => setPage((value) => value + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </section>
  );
}
