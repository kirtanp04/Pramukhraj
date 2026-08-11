import { Suspense, type ComponentType, type ReactNode } from "react";

type LazyRouteProps = {
  component: ComponentType<any>;
  componentProps?: Record<string, unknown>;
  children?: ReactNode;
};

export function LazyRoute({
  component: Component,
  componentProps,
  children,
}: LazyRouteProps) {
  return (
    <Suspense fallback={<TopBarLoader />}>
      <Component {...componentProps}>{children}</Component>
    </Suspense>
  );
}

export function TopBarLoader() {
  return (
    <div
      aria-label="Loading page"
      className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-teal-deep/20"
      role="status"
    >
      <div className="h-full w-1/3 animate-pulse bg-turmeric" />
    </div>
  );
}
