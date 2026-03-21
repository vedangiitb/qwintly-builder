export const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value ?? "");
  } catch {
    return "\"[unserializable]\"";
  }
};

export const truncateString = (value: string, maxLen: number) => {
  if (value.length <= maxLen) return value;
  return value.slice(0, maxLen) + "...(truncated)";
};

export const truncateSerialized = (value: unknown, maxLen: number) => {
  const text = safeStringify(value);
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...(truncated)";
};
