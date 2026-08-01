export const generateNextSequence = (
  prefix: string,
  existingIds: string[],
  paddingLength: number = 3
): string => {
  if (!existingIds || existingIds.length === 0) {
    return `${prefix}-${'1'.padStart(paddingLength, '0')}`;
  }

  const numericParts = existingIds
    .map(id => {
      const parts = id.split('-');
      if (parts.length > 1 && parts[0] === prefix) {
        return parseInt(parts[1], 10);
      }
      return NaN;
    })
    .filter(num => !isNaN(num));

  if (numericParts.length === 0) {
    return `${prefix}-${'1'.padStart(paddingLength, '0')}`;
  }

  const maxId = Math.max(...numericParts);
  const nextId = maxId + 1;

  return `${prefix}-${nextId.toString().padStart(paddingLength, '0')}`;
};
