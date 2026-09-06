import type { IngestionSuccessResponse } from "../types/ingestion.types";

export type IngestionStatus =
  | "idle"
  | "uploading"
  | "success"
  | "error";

export interface IngestionState {
  status: IngestionStatus;
  file?: File;
  progress: number;
  result?: IngestionSuccessResponse;
  error?: string;
}

export interface IngestionStore {
  getState: () => IngestionState;
  subscribe: (listener: (state: IngestionState) => void) => () => void;
  selectFile: (file: File) => void;
  startUpload: () => void;
  updateProgress: (progress: number) => void;
  completeUpload: (result: IngestionSuccessResponse) => void;
  failUpload: (message: string) => void;
  reset: () => void;
}

const initialState: IngestionState = {
  status: "idle",
  progress: 0
};

export function createIngestionStore(): IngestionStore {
  let state: IngestionState = { ...initialState };
  const listeners = new Set<(nextState: IngestionState) => void>();

  function update(nextState: IngestionState) {
    state = nextState;
    listeners.forEach((listener) => listener(state));
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    selectFile: (file) =>
      update({
        status: "idle",
        file,
        progress: 0
      }),
    startUpload: () =>
      update({
        ...state,
        status: "uploading",
        progress: 0,
        result: undefined,
        error: undefined
      }),
    updateProgress: (progress) =>
      update({
        ...state,
        status: "uploading",
        progress: Math.min(100, Math.max(0, progress)),
        error: undefined
      }),
    completeUpload: (result) =>
      update({
        ...state,
        status: "success",
        progress: 100,
        result,
        error: undefined
      }),
    failUpload: (message) =>
      update({
        ...state,
        status: "error",
        error: message
      }),
    reset: () => update({ ...initialState })
  };
}

export const ingestionStore = createIngestionStore();
