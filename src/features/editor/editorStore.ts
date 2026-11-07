import { create } from "zustand";

interface EditorState {
  input: string;
  setInput: (input: string) => void;
}

// The text in the main window lives here so other parts of the app (the recent list) can fill it.
export const useEditor = create<EditorState>((set) => ({
  input: "",
  setInput: (input) => set({ input }),
}));
