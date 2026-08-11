import { lazy, type ComponentType } from "react";

export function lazyNamed<T extends Record<string, ComponentType<any>>>(
  importer: () => Promise<T>,
  exportName: keyof T
) {
  return lazy(() =>
    importer().then(module => ({ default: module[exportName] }))
  );
}
