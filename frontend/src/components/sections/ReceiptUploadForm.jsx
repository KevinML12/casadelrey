import { useEffect, useRef, useState } from "react";
import apiClient from "../../lib/apiClient";
import { FieldLight } from "../ui/Glass";
import useFilePreview from "../../hooks/useFilePreview";
import { useDonationPurposeResource } from "../../lib/donationPurposes";
import { submissionKey, clearSubmissionKey } from "../../lib/submissionKey";

export default function ReceiptUploadForm({
  eventId = null,
  purpose = "donacion",
  defaultAmount = "",
  defaultName = "",
  defaultEmail = "",
  defaultPhone = "",
  onSuccess,
  onSubmitReceipt,
  correction = null,
  lockIdentity = false,
}) {
  const purposeResource = useDonationPurposeResource();
  const purposes = purposeResource.purposes;
  const uploadController = useRef(null);
  useEffect(
    () => () => {
      uploadSequence.current++;
      uploadController.current?.abort();
    },
    [],
  );
  const [form, setForm] = useState({
    payer_name: defaultName,
    payer_email: defaultEmail,
    payer_phone: defaultPhone,
    amount: defaultAmount,
    bank_name: "",
    reference_number: "",
    receipt_image_url: "",
    donation_purpose: "",
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [receiptID, setReceiptID] = useState(null);
  const [resultMessage, setResultMessage] = useState("");
  const busy = useRef(false);
  const uploadSequence = useRef(0);
  const { preview, showFile } = useFilePreview();
  const set = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const sequence = ++uploadSequence.current;
    setError("");
    if (
      file.size > 10 * 1024 * 1024 ||
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
      ].includes(file.type)
    ) {
      setError("Selecciona una imagen o PDF de hasta 10 MB.");
      return;
    }
    setUploading(true);
    uploadController.current?.abort();
    const controller = new AbortController();
    uploadController.current = controller;
    try {
      const data = new FormData();
      data.append("file", file);
      const result = await apiClient.post("/receipts/upload", data, {
        signal: controller.signal,
      });
      if (sequence !== uploadSequence.current) return;
      setForm((current) => ({
        ...current,
        receipt_image_url: result.data.url,
      }));
      showFile(file);
    } catch (err) {
      if (sequence === uploadSequence.current)
        setError(
          err.response?.data?.error ||
            "No se pudo subir el archivo. Tus datos siguen aquí.",
        );
    } finally {
      if (sequence === uploadSequence.current) setUploading(false);
    }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (busy.current || uploading) return;
    setError("");
    if (!correction && purpose === "donacion" && !purposes.length) {
      setError("Espera a que el equipo publique un destino disponible.");
      return;
    }
    if (!form.receipt_image_url) {
      setError("Sube el comprobante antes de continuar.");
      return;
    }
    const data = {
      ...form,
      event_id: eventId,
      purpose,
      amount: Number(form.amount),
      donation_purpose: form.donation_purpose || purposes[0]?.value || "",
    };
    if (
      !correction &&
      (!Number.isFinite(data.amount) ||
        data.amount <= 0 ||
        !form.payer_email.trim())
    ) {
      setError("Revisa el monto y tu correo electrónico.");
      return;
    }
    busy.current = true;
    setSubmitting(true);
    try {
      let result;
      if (correction)
        result = await apiClient.put(`/receipts/${correction.id}/resubmit`, {
          token: correction.token,
          receipt_image_url: form.receipt_image_url,
          bank_name: form.bank_name,
          reference_number: form.reference_number,
        });
      else if (onSubmitReceipt) result = await onSubmitReceipt(data);
      else {
        const key = await submissionKey("receipt", data);
        result = await apiClient.post("/receipts", data, {
          headers: { "Idempotency-Key": key },
        });
        clearSubmissionKey("receipt");
      }
      setReceiptID(result?.data?.id);
      setResultMessage(
        result?.data?.message ||
          "El equipo revisará el comprobante y te notificará por correo.",
      );
      setSent(true);
      onSuccess?.(result?.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "No se pudo enviar. Conservamos tus datos para reintentar.",
      );
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };
  if (sent)
    return (
      <div className="py-6 space-y-3" role="status">
        <h3 className="text-24 font-bold text-bg">Comprobante recibido</h3>
        <p className="text-15 text-bg/75">{resultMessage}</p>
        {receiptID && (
          <p className="text-13 text-bg/60">
            Referencia de seguimiento: {receiptID}
          </p>
        )}
      </div>
    );
  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <p
          role="alert"
          className="rounded-[12px] border border-rose/30 bg-white/75 p-3 text-14 text-bg"
        >
          {error}
        </p>
      )}
      {!correction && (
        <div className="space-y-3">
          <p className="text-13 font-semibold text-bg/60">Tus datos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldLight
              label="Nombre completo *"
              value={form.payer_name}
              onChange={set("payer_name")}
              autoComplete="name"
              maxLength={100}
              readOnly={lockIdentity}
              required
            />
            <FieldLight
              label="Teléfono"
              value={form.payer_phone}
              onChange={set("payer_phone")}
              autoComplete="tel"
              type="tel"
              maxLength={30}
            />
          </div>
          <FieldLight
            label="Correo electrónico *"
            type="email"
            value={form.payer_email}
            onChange={set("payer_email")}
            autoComplete="email"
            readOnly={lockIdentity}
            required
          />
        </div>
      )}
      {!correction && purpose === "donacion" && (
        <FieldLight
          as="select"
          label="Destino de la donación"
          value={form.donation_purpose || purposes[0]?.value || ""}
          onChange={set("donation_purpose")}
          required
        >
          <option value="" disabled>
            Seleccionar destino…
          </option>
          {purposes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.title}
            </option>
          ))}
        </FieldLight>
      )}
      {!correction &&
        purpose === "donacion" &&
        (purposeResource.loading ||
          purposeResource.error ||
          !purposes.length) && (
          <div
            role={purposeResource.loading ? "status" : "alert"}
            className="text-14 text-bg"
          >
            <p>
              {purposeResource.loading
                ? "Cargando destinos…"
                : purposeResource.error
                  ? "No se pudieron cargar los destinos."
                  : "Todavía no hay destinos publicados para recibir este aporte."}
            </p>
            {purposeResource.error && (
              <button
                type="button"
                onClick={purposeResource.retry}
                className="min-h-11 px-3 mt-2 border border-bg/30 rounded-[10px] focus-ring"
              >
                Reintentar destinos
              </button>
            )}
          </div>
        )}
      <div className="space-y-3">
        <p className="text-13 font-semibold text-bg/60">Datos del depósito</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldLight
            label="Monto depositado (Q) *"
            type="number"
            min={purpose === "donacion" ? 10 : defaultAmount || 0.01}
            max={10000000}
            step="0.01"
            value={form.amount}
            onChange={set("amount")}
            readOnly={!!correction}
            required
          />
          <FieldLight
            label="Banco"
            value={form.bank_name}
            onChange={set("bank_name")}
            maxLength={100}
            placeholder="Banco del depósito"
          />
        </div>
        <FieldLight
          label="Número de referencia / No. de boleta"
          value={form.reference_number}
          onChange={set("reference_number")}
          maxLength={100}
        />
      </div>
      <div className="space-y-3">
        <p className="text-13 font-semibold text-bg/60">Comprobante privado</p>
        {form.receipt_image_url && (
          <div className="space-y-3">
            {preview?.type.startsWith("image/") ? (
              <img
                src={preview.url}
                alt="Vista previa del comprobante"
                className="w-full max-h-80 object-contain rounded-[12px] bg-white/35"
              />
            ) : (
              <p className="text-14 text-bg">
                PDF cargado. Se abrirá completo para revisión.
              </p>
            )}
            <p className="text-12 text-bg/65">
              El archivo se comparte únicamente con el equipo autorizado de
              revisión.
            </p>
          </div>
        )}
        <label className="block rounded-[12px] border border-dashed border-bg/35 bg-white/25 p-4 cursor-pointer focus-within:ring-2 focus-within:ring-bg">
          <span className="block text-14 font-semibold text-bg mb-2">
            {uploading
              ? "Subiendo…"
              : form.receipt_image_url
                ? "Cambiar archivo"
                : "Seleccionar foto o PDF"}
          </span>
          <input
            aria-label="Archivo del comprobante"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            onChange={upload}
            disabled={uploading || submitting}
            className="block w-full text-12 text-bg file:mr-3 file:rounded-[8px] file:border-0 file:bg-bg file:px-3 file:py-2 file:text-white"
          />
          <span className="block mt-2 text-12 text-bg/65">
            JPG, PNG, WebP, GIF o PDF · Hasta 10 MB · Conservamos la calidad del
            archivo.
          </span>
        </label>
      </div>
      <button
        type="submit"
        disabled={
          submitting ||
          uploading ||
          !form.receipt_image_url ||
          (!correction && purpose === "donacion" && !purposes.length)
        }
        className="w-full min-h-12 rounded-[12px] bg-bg text-white font-bold text-15 px-5 py-3 disabled:opacity-45 transition-opacity duration-150 hover:opacity-90 focus-ring"
      >
        {submitting
          ? "Enviando…"
          : correction
            ? "Enviar corrección"
            : onSubmitReceipt
              ? "Enviar comprobante y registrar"
              : "Enviar comprobante"}
      </button>
      <p className="text-12 text-bg/65">
        Subir un archivo no confirma el pago. El equipo verifica el depósito
        antes de aprobarlo.
      </p>
    </form>
  );
}
