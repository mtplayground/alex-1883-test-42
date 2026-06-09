import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";

import { slugifyHeading } from "../lib/headings";

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(textFromNode).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textFromNode(node.props.children);
  }

  return "";
}

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
  h2: createHeading(2),
  h3: createHeading(3)
};
