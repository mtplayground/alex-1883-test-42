import type { ComponentType } from "react";

import ErrorsContent, { metadata as errorsMetadata } from "./errors.mdx";
import errorsSource from "./errors.mdx?manual-raw";
import GettingStartedContent, {
  metadata as gettingStartedMetadata
} from "./getting-started.mdx";
import gettingStartedSource from "./getting-started.mdx?manual-raw";
import OwnershipContent, { metadata as ownershipMetadata } from "./ownership.mdx";
import ownershipSource from "./ownership.mdx?manual-raw";
import TypesContent, { metadata as typesMetadata } from "./types.mdx";
import typesSource from "./types.mdx?manual-raw";
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

function createSection(
  section: Omit<ManualSection, "headings"> & { source: string }
): ManualSection {
  return {
    Component: section.Component,
    headings: extractHeadings(section.source),
    id: section.id,
    metadata: section.metadata,
    path: section.path
  };
}

const gettingStartedSection = createSection({
  Component: GettingStartedContent,
  id: "getting-started",
  metadata: gettingStartedMetadata,
  path: "/",
  source: gettingStartedSource
});

const ownershipSection = createSection({
  Component: OwnershipContent,
  id: "ownership",
  metadata: ownershipMetadata,
  path: "/ownership",
  source: ownershipSource
});

const typesSection = createSection({
  Component: TypesContent,
  id: "types",
  metadata: typesMetadata,
  path: "/types",
  source: typesSource
});

const errorsSection = createSection({
  Component: ErrorsContent,
  id: "errors",
  metadata: errorsMetadata,
  path: "/errors",
  source: errorsSource
});

export const manualSections = [
  gettingStartedSection,
  ownershipSection,
  typesSection,
  errorsSection
] satisfies ManualSection[];
export const defaultManualSection = gettingStartedSection;

export function findManualSection(sectionId: string | undefined) {
  if (!sectionId) {
    return defaultManualSection;
  }

  return manualSections.find((section) => section.id === sectionId);
}
