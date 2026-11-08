import type { Look } from "./Toon";

/** Episode cast. Designs are reused verbatim across scenes for consistency. */
export const CAST: Record<string, Look> = {
  worker: { id: "worker", skin: "#f1c27d", hair: "#3e2723", hairStyle: "messy", shirt: "#e3f2fd", pants: "#263238", tie: "#e53935", shoes: "#1b1b1b" },
  passenger: { id: "passenger", skin: "#c68642", hair: "#1a1a1a", hairStyle: "bun", shirt: "#ff8a65", pants: "#5d4037", shoes: "#3e2723", backpack: "#26a69a" },
  pilot: { id: "pilot", skin: "#e0ac69", hair: "#212121", hairStyle: "neat", shirt: "#ffffff", pants: "#1a2a4a", tie: "#1a2a4a", hat: "pilot", coat: "#1a2a4a" },
  athlete: { id: "athlete", skin: "#8d5524", hair: "#111111", hairStyle: "short", shirt: "#00c853", pants: "#212121", headband: "#ff1744", sleeveless: true, shorts: true, shoes: "#ff1744" },
  chef: { id: "chef", skin: "#ffdbac", hair: "#6d4c41", hairStyle: "short", shirt: "#fafafa", pants: "#424242", hat: "chef", apron: "#ffffff" },
  scientist: { id: "scientist", skin: "#f1c27d", hair: "#f5f5f5", hairStyle: "wild", shirt: "#4fc3f7", pants: "#37474f", coat: "#fafafa", glasses: true },
  teacher: { id: "teacher", skin: "#e0ac69", hair: "#4e342e", hairStyle: "bun", shirt: "#7e57c2", pants: "#311b92", glasses: true, skirt: true },
  student: { id: "student", skin: "#ffdbac", hair: "#212121", hairStyle: "messy", shirt: "#ffeb3b", pants: "#1565c0", shoes: "#fafafa" },
};
