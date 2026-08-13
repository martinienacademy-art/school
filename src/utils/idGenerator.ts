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

export const generateDynamicMatricule = (
  format: string,
  existingIds: string[],
  acronyme: string,
  statut: string = ''
): string => {
  if (!format) return generateNextSequence('M', existingIds, 6); // fallback

  const year = new Date().getFullYear().toString().slice(-2);
  
  // Remplacer les variables de base
  let prefix = format
    .replace(/{YY}/g, year)
    .replace(/{ACRONYME}/g, acronyme || 'ECOLE')
    .replace(/{STATUT}/g, statut);

  // Séparer le format par le tag {SEQ}
  const parts = prefix.split('{SEQ}');
  
  // Si pas de SEQ, le format est statique (problématique mais on retourne tel quel)
  if (parts.length === 1) return prefix;

  const prefixBeforeSeq = parts[0];
  const suffixAfterSeq = parts[1];

  // Trouver tous les matricules qui correspondent au préfixe et suffixe
  const matchingNumericParts = existingIds
    .map(id => {
       if (id && id.startsWith(prefixBeforeSeq) && id.endsWith(suffixAfterSeq)) {
           const seqStr = id.substring(prefixBeforeSeq.length, id.length - suffixAfterSeq.length);
           return parseInt(seqStr, 10);
       }
       return NaN;
    })
    .filter(num => !isNaN(num));

  const maxId = matchingNumericParts.length > 0 ? Math.max(...matchingNumericParts) : 0;
  const nextId = maxId + 1;

  const seqPadded = nextId.toString().padStart(3, '0');

  return `${prefixBeforeSeq}${seqPadded}${suffixAfterSeq}`;
};
