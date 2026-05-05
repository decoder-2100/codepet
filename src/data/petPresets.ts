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
    name: "bug-bot",
    label: "BugBot",
    config: {
      parts: { body: "robot", head: "robot", eyes: "dot", mouth: "straight", tail: "robot", accessories: ["keyboard"] },
      colors: { primary: "#404A55", secondary: "#5A6570", eye: "#4ADE80", accessory: "#8EA0B0" },
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
    name: "meowtrix",
    label: "Meowtrix",
    config: {
      parts: { body: "chubby", head: "cat", eyes: "dead", mouth: "straight", tail: "cat", accessories: ["hat", "keyboard"] },
      colors: { primary: "#2D2D35", secondary: "#3A3A45", eye: "#4ADE80", accessory: "#505868" },
    },
  },
];
