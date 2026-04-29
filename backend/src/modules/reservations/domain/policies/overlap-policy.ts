export const hasTimeOverlap = (
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date
): boolean => {
  return firstStart < secondEnd && firstEnd > secondStart;
};
