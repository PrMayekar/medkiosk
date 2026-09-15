import { initialIntakeState, type IntakeState } from "../types/intake";

const STORAGE_KEY = "medikiosk.session.v1";

/**
 * Demo-only session persistence via localStorage, so a page refresh
 * doesn't immediately destroy an in-progress intake. This is explicitly
 * NOT a database and holds no long-term patient record.
 */
export function loadSession(): IntakeState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialIntakeState;
    const parsed = JSON.parse(raw);
    return { ...initialIntakeState, ...parsed };
  } catch {
    return initialIntakeState;
  }
}

export function saveSession(state: IntakeState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — non-fatal for a demo.
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
