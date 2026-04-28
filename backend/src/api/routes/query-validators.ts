export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

export const isValidDateString = (value: unknown): value is string => {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
};
