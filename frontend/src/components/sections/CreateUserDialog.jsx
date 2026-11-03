import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../lib/apiClient";
import ModalWrapper from "../ui/ModalWrapper";
import Input, { Select } from "../ui/Input";
import Button from "../ui/Button";

export default function CreateUserDialog({ onClose, onCreated }) {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const change = (key) => (event) =>
    setForm((values) => ({ ...values, [key]: event.target.value }));
  const close = () => {
    if (!busy) onClose();
  };
  const submit = async (event) => {
    event.preventDefault();
    if (busy || created) return;
    if (new TextEncoder().encode(form.password).length > 72) {
      setError("La contraseña admite hasta 72 bytes. Reduce su longitud.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await apiClient.post("/admin/users", {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        role: isAdmin ? form.role : "member",
      });
      setCreated(data.user);
      setForm((values) => ({ ...values, password: "" }));
      onCreated?.(data.user);
    } catch (failure) {
      setError(
        failure.response?.data?.error ||
          "No se pudo crear la cuenta. Tus datos siguen aquí para reintentar.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <ModalWrapper
      ariaLabel="Crear cuenta de usuario"
      busy={busy}
      onClose={close}
    >
      <h2 className="text-24 font-bold">Crear cuenta</h2>
      {created ? (
        <div className="mt-4 space-y-4" role="status">
          <p className="text-15">
            <strong>{created.name}</strong> ya tiene una cuenta. Se preparó el
            correo de verificación para {created.email}; deberá verificarlo
            antes de ingresar.
          </p>
          <p className="text-13 text-bg/65">
            El equipo puede consultar el estado del envío en Correos. La cuenta
            creada no confirma que el mensaje haya llegado a la bandeja de
            entrada.
          </p>
          <Button onClick={close}>Listo</Button>
        </div>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={submit}>
          <p className="text-14 text-bg/65">
            Usa el correo de la persona. Define una contraseña individual y
            compártela con ella por el canal acordado.
          </p>
          {error && (
            <p
              role="alert"
              className="rounded-[12px] border border-rose/30 p-3 text-14"
            >
              {error}
            </p>
          )}
          <fieldset disabled={busy} className="space-y-4">
            <Input
              label="Nombre completo"
              value={form.name}
              onChange={change("name")}
              maxLength={100}
              required
              autoComplete="off"
            />
            <Input
              label="Correo de la persona"
              type="email"
              value={form.email}
              onChange={change("email")}
              maxLength={254}
              required
              autoComplete="off"
            />
            <Input
              label="Contraseña inicial"
              type="password"
              value={form.password}
              onChange={change("password")}
              minLength={10}
              maxLength={72}
              required
              autoComplete="new-password"
              helperText="Mínimo 10 caracteres. La persona podrá cambiarla desde Recuperar contraseña."
            />
            {isAdmin && (
              <Select
                label="Rol de la cuenta"
                value={form.role}
                onChange={change("role")}
                options={[
                  { value: "member", label: "Miembro" },
                  { value: "leader", label: "Líder" },
                  { value: "volunteer", label: "Voluntario" },
                  { value: "admin", label: "Administrador" },
                ]}
                required
              />
            )}
            {!isAdmin && (
              <p className="text-13 text-bg/65">
                Se creará una cuenta de miembro. Los otros roles los asigna un
                administrador.
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? "Creando…" : "Crear cuenta"}
            </Button>
          </fieldset>
        </form>
      )}
    </ModalWrapper>
  );
}
