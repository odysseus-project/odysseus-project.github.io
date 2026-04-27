export type LinkState = "live" | "coming-soon";

export interface ProjectLink {
  label: string;
  href?: string;
  state: LinkState;
}

export interface FigurePanel {
  title: string;
  caption: string;
  src: string;
  tag: string;
}

export type VideoFamily = "land" | "land-mid" | "bros";
export type VideoVariant = "base" | "improved";

export interface VideoEntry {
  id: string;
  family: VideoFamily;
  familyLabel: string;
  scenarioId: string;
  scenarioLabel: string;
  variant: VideoVariant;
  variantLabel: string;
  videoSrc: string;
  posterSrc: string;
  statLabel: string;
  sortKey: string;
}
