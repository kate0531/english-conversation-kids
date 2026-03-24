/** 음성·텍스트 비교용 정규화 */
export function normalizeEnglish(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 단어 단위 겹침 비율 (0~1) — 쉐도잉 유사도 */
export function tokenOverlapRatio(spoken: string, target: string): number {
  const a = normalizeEnglish(spoken).split(" ").filter(Boolean);
  const b = normalizeEnglish(target).split(" ").filter(Boolean);
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let hit = 0;
  for (const w of a) {
    if (setB.has(w)) hit += 1;
  }
  return hit / Math.max(a.length, b.length);
}
