declare module "*.mdx" {
  import type { ComponentType } from "react";

  export interface MdxMetadata {
    description: string;
    label: string;
    title: string;
  }

  export const metadata: MdxMetadata;

  const MDXComponent: ComponentType;
  export default MDXComponent;
}

declare module "*.mdx?manual-raw" {
  const source: string;
  export default source;
}
