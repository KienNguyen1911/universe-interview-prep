export interface Section {
  id: string;
  level: number;
  title: string;
}

export function parseMarkdownPlan(markdown: string): Section[] {
  const regex = /^(#{1,6})\s+(.*)$/gm;
  const sections: Section[] = [];
  let match;
  let idCounter = 0;

  while ((match = regex.exec(markdown)) !== null) {
    sections.push({
      id: `section-${idCounter++}`,
      level: match[1].length,
      title: match[2].trim(),
    });
  }

  return sections;
}
