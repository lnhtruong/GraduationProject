/**
 * Query Key Factory
 * Creates consistent query keys for caching
 */

export function createKeyFactory(scope: string) {
  return {
    root: [scope] as const,
    list: (params?: unknown) => [scope, "list", params ?? {}] as const,
    detail: (id: string | number) => [scope, "detail", id] as const,
    custom: (...keys: unknown[]) => [scope, ...keys] as const,
  };
}
