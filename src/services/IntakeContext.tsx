import React, { createContext, useContext, useEffect, useState } from "react";
import { initialIntakeState, type IntakeState } from "../types/intake";
import { loadSession, saveSession } from "./session";

interface IntakeContextValue {
  state: IntakeState;
  setState: React.Dispatch<React.SetStateAction<IntakeState>>;
  reset: () => void;
}

const IntakeContext = createContext<IntakeContextValue | null>(null);

export function IntakeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<IntakeState>(() => loadSession());

  useEffect(() => {
    saveSession(state);
  }, [state]);

  const reset = () => setState(initialIntakeState);

  return <IntakeContext.Provider value={{ state, setState, reset }}>{children}</IntakeContext.Provider>;
}

export function useIntake() {
  const ctx = useContext(IntakeContext);
  if (!ctx) throw new Error("useIntake must be used within IntakeProvider");
  return ctx;
}
