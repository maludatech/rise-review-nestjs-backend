export const normalize = <T>(value: unknown): T | undefined => {
  if (value === null || value === undefined) return undefined;
  return value as T;
};
