/**
 * @deprecated 서버 API /api/speaking/evaluate 사용. 타입만 유지.
 */
export interface CorrectionResult {
  corrected: string;
  feedback: string;
  score: number;
}
