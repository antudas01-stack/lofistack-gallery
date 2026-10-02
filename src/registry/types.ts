/** The plain labels LofiStack uses to check components stay different. */
export const COMPONENT_TYPES = [
  "button",
  "form",
  "card",
  "modal",
  "navbar",
  "table",
  "loader",
  "section",
  "chart",
  "input",
] as const;

export type ComponentType = (typeof COMPONENT_TYPES)[number];

export interface PropDoc {
  name: string;
  type: string;
  default?: string;
  description: string;
  required?: boolean;
}

export interface ComponentEntry {
  /** URL segment: /components/<slug> */
  slug: string;
  name: string;
  type: ComponentType;
  /** Challenge week the component was submitted in. */
  week: number;
  /** ISO date the component was added. */
  addedOn: string;
  summary: string;
  description: string;
  /** Repo-relative path to the component source shown on the page. */
  sourcePath: string;
  /** Short import + usage example. */
  usage: string;
  props: PropDoc[];
  states: string[];
  accessibility: string[];
  /** Final prompt used to build the component (required for submission). */
  prompt: string;
}
