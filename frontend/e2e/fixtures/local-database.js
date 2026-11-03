import { execFileSync } from "node:child_process";
import { createHash, createDecipheriv } from "node:crypto";

// Only controlled test identities in the disposable local database. This reads
// the token an email would carry; transport credentials never enter the runner.
function localValue(email, expression, table, extra = "") {
  const db = new URL(process.env.DATABASE_URL || "http://invalid");
  if (
    process.env.CDR_LOCAL_E2E !== "1" ||
    db.hostname !== "127.0.0.1" ||
    db.pathname !== "/cdr_e2e" ||
    !/^[\w.+-]+@example\.invalid$/.test(email)
  )
    throw new Error("Only isolated authentication fixtures may be read");
  const recipient = table === "users" ? "email" : "recipient";
  return execFileSync(
    "psql",
    [
      "-X",
      "-A",
      "-t",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      `SELECT ${expression} FROM ${table} WHERE ${recipient}='${email}' AND deleted_at IS NULL ${extra};`,
    ],
    {
      encoding: "utf8",
      env: {
        PATH: process.env.PATH,
        PGHOST: db.hostname,
        PGPORT: db.port,
        PGUSER: decodeURIComponent(db.username),
        PGPASSWORD: decodeURIComponent(db.password),
        PGDATABASE: "cdr_e2e",
        PGSSLMODE: "disable",
      },
    },
  ).trim();
}
export function localAuthToken(email, column) {
  if (!["verification_token", "reset_token"].includes(column))
    throw new Error("Unsupported fixture field");
  return localValue(email, column, "users");
}
export function localMailLinks(email) {
  const encoded = localValue(
    email,
    "payload",
    "email_messages",
    "AND payload <> '' ORDER BY id DESC LIMIT 1",
  );
  const encrypted = Buffer.from(encoded, "base64");
  const key = createHash("sha256")
    .update("casadelrey/email-outbox/v1/" + process.env.JWT_SECRET)
    .digest();
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    encrypted.subarray(0, 12),
  );
  decipher.setAuthTag(encrypted.subarray(-16));
  const message = JSON.parse(
    Buffer.concat([
      decipher.update(encrypted.subarray(12, -16)),
      decipher.final(),
    ]).toString(),
  );
  return [...message.html.matchAll(/href="([^"]+)"/g)].map((match) =>
    match[1].replaceAll("&amp;", "&"),
  );
}
