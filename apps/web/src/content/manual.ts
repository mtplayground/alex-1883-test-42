import type { ComponentType } from "react";

import GettingStartedContent, {
  metadata as gettingStartedMetadata
} from "./getting-started.mdx";
import gettingStartedSource from "./getting-started.mdx?raw";
import { extractHeadings, type ContentHeading } from "../lib/headings";

export interface ManualSection {
  Component: ComponentType;
  headings: ContentHeading[];
  id: string;
  metadata: {
    description: string;
    label: string;
    title: string;
  };
  path: string;
}

const gettingStartedSection: ManualSection = {
  Component: GettingStartedContent,
  headings: extractHeadings(gettingStartedSource),
  id: "getting-started",
  metadata: gettingStartedMetadata,
  path: "/"
};

export const manualSections = [gettingStartedSection] satisfies ManualSection[];
export const defaultManualSection = gettingStartedSection;
