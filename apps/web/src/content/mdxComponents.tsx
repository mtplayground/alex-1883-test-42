import { Children, type ComponentPropsWithoutRef } from "react";

import { Callout } from "../components/content/Callout";
import { CodeBlock } from "../components/content/CodeBlock";
import { slugifyHeading } from "../lib/headings";
import { textFromNode } from "../lib/reactText";

function createHeading(level: 2 | 3) {
  const Heading = ({
    children,
    ...props
  }: ComponentPropsWithoutRef<`h${typeof level}`>) => {
    const text = Children.toArray(children).map(textFromNode).join("");
    const id = slugifyHeading(text);
    const Tag = `h${level}` as const;

    return (
      <Tag id={id} {...props}>
        {children}
      </Tag>
    );
  };

  return Heading;
}

export const mdxComponents = {
  Callout,
  h2: createHeading(2),
  h3: createHeading(3),
  pre: CodeBlock
};
