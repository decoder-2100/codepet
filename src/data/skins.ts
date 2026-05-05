export interface Skin {
  name: string;
  label: string;
  bgColor: string;
  uiColor: string;
  accentColor: string;
  textColor: string;
  bubbleBg: string;
}

export const SKINS: Record<string, Skin> = {
  matrix: {
    name: "matrix",
    label: "黑客帝国 Matrix",
    bgColor: "rgba(0, 10, 0, 0.85)",
    uiColor: "#00ff41",
    accentColor: "#003b00",
    textColor: "#00ff41",
    bubbleBg: "rgba(0, 20, 0, 0.95)",
  },
  retro: {
    name: "retro",
    label: "复古终端 Retro Terminal",
    bgColor: "rgba(10, 5, 0, 0.85)",
    uiColor: "#ffb347",
    accentColor: "#5c3a00",
    textColor: "#ffb347",
    bubbleBg: "rgba(20, 10, 0, 0.95)",
  },
  hologram: {
    name: "hologram",
    label: "全息投影 Hologram",
    bgColor: "rgba(0, 10, 20, 0.85)",
    uiColor: "#00d4ff",
    accentColor: "#004466",
    textColor: "#00d4ff",
    bubbleBg: "rgba(0, 15, 30, 0.95)",
  },
};
