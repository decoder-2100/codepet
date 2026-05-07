import type { PetConfig } from "../types";

export interface PetPreset {
  name: string;
  label: string;
  config: PetConfig;
}

export const PET_PRESETS: PetPreset[] = [
  {
    name: "orange-cat",
    label: "橘猫 Orange Cat",
    config: {
      parts: { body: "chubby", head: "cat", eyes: "normal", mouth: "smile", tail: "cat", accessories: ["scarf"] },
      colors: { primary: "#F0A070", secondary: "#FAD0B0", eye: "#3D3835", accessory: "#E07060" },
    },
  },
  {
    name: "code-bear",
    label: "代码熊 Code Bear",
    config: {
      parts: { body: "round", head: "bear", eyes: "big", mouth: "grin", tail: "bear", accessories: ["glasses", "bowtie"] },
      colors: { primary: "#B8956A", secondary: "#D4C0A0", eye: "#2D2A28", accessory: "#3A5070" },
    },
  },
  {
    name: "golden",
    label: "金毛 Golden Retriever",
    config: {
      parts: { body: "golden", head: "golden", eyes: "warm", mouth: "happy-smile", tail: "golden-tail", accessories: ["bowtie"] },
      colors: { primary: "#D4A050", secondary: "#E8C880", eye: "#5C3A1E", accessory: "#8B6914" },
    },
  },
  {
    name: "fox-coder",
    label: "小狐 FoxCoder",
    config: {
      parts: { body: "tall", head: "fox", eyes: "anime", mouth: "smile", tail: "fox", accessories: ["codeBubble"] },
      colors: { primary: "#E87850", secondary: "#F0C0A0", eye: "#3D3835", accessory: "#F0B040" },
    },
  },
  {
    name: "alien-hacker",
    label: "AlienHacker",
    config: {
      parts: { body: "tall", head: "alien", eyes: "big", mouth: "oShape", tail: "alien", accessories: ["headphone", "coffee"] },
      colors: { primary: "#60B880", secondary: "#80D0A0", eye: "#2D2A28", accessory: "#A878C0" },
    },
  },
  {
    name: "husky",
    label: "哈士奇 Husky",
    config: {
      parts: { body: "husky", head: "husky", eyes: "blue", mouth: "smirk", tail: "curled-tail", accessories: ["scarf"] },
      colors: { primary: "#B0B8C0", secondary: "#F0F0F4", eye: "#4A90D9", accessory: "#5C6B7A" },
    },
  },
];
