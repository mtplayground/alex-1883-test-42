export interface ContentHeading {
  id: string;
  level: 2 | 3;
  text: string;
}

function plainHeadingText(value: string): string {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~]/g, "")
    .trim();
}

export function slugifyHeading(value: string): string {
  return plainHeadingText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function extractHeadings(source: string): ContentHeading[] {
  return source
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{2,3})\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => {
      const marker = match[1] ?? "";
      const rawText = match[2] ?? "";
      const text = plainHeadingText(rawText);

      return {
        id: slugifyHeading(text),
        level: marker.length as 2 | 3,
        text
      };
    });
}
