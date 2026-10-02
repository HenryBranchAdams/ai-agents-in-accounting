// Inventory headers are not substantive, source or professional review dates.
export function editionCatalog(catalog, version, date) {
  const value = { ...catalog, corpus_version: version, updated_at: date };
  if (typeof value.coverage_note === 'string' && !value.coverage_note.includes(version))
    value.coverage_note += ` Current inventory edition: ${version}. Inventory associations do not establish adequate coverage, source currency or professional acceptance.`;
  return value;
}
