const memory = new Map();
// Retain only a digest and random key, never payment or contact details.
export async function submissionKey(scope, payload) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const fingerprint = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  let previous = memory.get(scope);
  try {
    previous ||= JSON.parse(sessionStorage.getItem(`submission:${scope}`));
  } catch {
    /* An invalid or unavailable cache cannot block submission. */
  }
  if (
    previous?.fingerprint === fingerprint &&
    /^[0-9a-f-]{36}$/.test(previous?.key || "")
  )
    return previous.key;
  const key = crypto.randomUUID();
  memory.set(scope, { fingerprint, key });
  try {
    sessionStorage.setItem(
      `submission:${scope}`,
      JSON.stringify({ fingerprint, key }),
    );
  } catch {
    /* Private browsing can disallow storage. */
  }
  return key;
}

export function clearSubmissionKey(scope) {
  memory.delete(scope);
  try {
    sessionStorage.removeItem(`submission:${scope}`);
  } catch {
    /* Storage is optional. */
  }
}
