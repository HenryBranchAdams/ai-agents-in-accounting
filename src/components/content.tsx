import type { ReactNode } from "react";
export function intersperse(items: ReactNode[], separator: string): ReactNode {
  return items.flatMap((item, index) => (index ? [separator, item] : [item]));
}
