// Presentation state only; command interpretation belongs to the shared domain.
(function (root) {
  const api = {
    select(definition, matches) {
      return { key: matches[0]?.key, visualId: definition.id, ambiguous: matches.length > 1 };
    },
    matchesFilters(entry, conflict, category, state) {
      return (
        (category === 'all' || entry?.category === category) &&
        (state === 'all' ||
          (state === 'assigned' && !!entry) ||
          (state === 'idle' && !entry) ||
          (state === 'conflict' && conflict) ||
          (state === 'uncertain' && !!entry && !entry.certain))
      );
    },
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.CS2InputState = api;
})(typeof window !== 'undefined' ? window : globalThis);
