import type {
  FigurePanel,
  ProjectLink,
  VideoFamily,
} from "../types";
import { videoManifest } from "../generated/videoManifest";

export const navItems = [
  { href: "#abstract", label: "Overview" },
  { href: "#demos", label: "Demos" },
  { href: "#method", label: "Method" },
  { href: "#results", label: "Results" },
  { href: "#citation", label: "Citation" },
];

export const projectLinks: ProjectLink[] = [
  { label: "Paper", href: "https://arxiv.org/abs/2605.00347", state: "live" },
  {
    label: "Models",
    href: "https://huggingface.co/collections/Odysseus-Project/odysseus",
    state: "live",
  },
  { label: "Code", state: "coming-soon" },
];

export const methodFigures: FigurePanel[] = [
  {
    title: "Lightweight supervised initialization",
    caption:
      "Odysseus starts with a lightweight SFT stage that teaches the model environment-specific perception and game knowledge from curated Mario frames before RL begins.",
    src: "assets/figures/protocol_large.pdf.png",
    tag: "SFT data",
  },
  {
    title: "Adapted PPO with a lightweight critic",
    caption:
      "Odysseus replaces expensive token-level value modeling with a small turn-level CNN critic and keeps only positive-advantage samples, making long-horizon VLM RL much more stable and efficient.",
    src: "assets/figures/ppo.pdf.png",
    tag: "RL algorithm design",
  },
  {
    title: "Open training framework with multi-task auto-curriculum",
    caption:
      "Odysseus adds lightweight supervised initialization for game-specific perception, then trains across multiple levels with inverse-trajectory weighting so harder or less-explored levels receive more learning focus over time.",
    src: "assets/figures/auto_curriculum.pdf.png",
    tag: "",
  },
];

export const familyDescriptions: Record<
  VideoFamily,
  { label: string; description: string }
> = {
  land: {
    label: "Super Mario Land (Trained Levels)",
    description:
      "Main long-horizon trajectories on the game used for the core RL study.",
  },
  "land-mid": {
    label: "Super Mario Land (Off-policy and Unseen Scenarios)",
    description:
      "Recovery and continuation examples from intermediate states rather than full rollouts from the start.",
  },
  bros: {
    label: "Super Mario Bros (Cross-game Transfer)",
    description:
      "Cross-game behavior demonstrating transfer beyond the original training environment.",
  },
};

export const videoEntries = videoManifest;

export const authors = [
  { name: "Chengshuai Shi", affiliations: [1], equalContribution: true },
  { name: "Wenzhe Li", affiliations: [1], equalContribution: true },
  { name: "Xinran Liang", affiliations: [1], equalContribution: true },
  { name: "Yizhou Lu", affiliations: [2] },
  { name: "Wenjia Yang", affiliations: [3] },
  { name: "Ruirong Feng", affiliations: [1] },
  { name: "Seth Karten", affiliations: [1] },
  { name: "Ziran Yang", affiliations: [1] },
  { name: "Zihan Ding", affiliations: [1] },
  { name: "Gabriel Sarch", affiliations: [1] },
  { name: "Danqi Chen", affiliations: [1] },
  { name: "Karthik Narasimhan", affiliations: [1] },
  { name: "Chi Jin", affiliations: [1] },
] as const;

export const affiliations = [
  { id: 1, label: "Princeton Language and Intelligence, Princeton University" },
  { id: 2, label: "Fudan University" },
  { id: 3, label: "Tsinghua University" },
] as const;

export const citation = `@article{shi2026odysseus,
  title = {Odysseus: Scaling VLMs to 100+ Turn Decision-Making in Games via Reinforcement Learning},
  author = {Shi, Chengshuai and Li, Wenzhe and Liang, Xinran and Lu, Yizhou and Yang, Wenjia and Feng, Ruirong and Karten, Seth and Yang, Ziran and Ding, Zihan and Sarch, Gabriel and Chen, Danqi and Narasimhan, Karthik and Jin, Chi},
  journal = {arXiv preprint arXiv:2605.00347},
  year = {2026}
}`;
