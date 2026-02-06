import type { CorrectionPoint } from "@/types/freeTalking";

/** mock 교정 포인트 5줄 (School Life - After School 기준) */
export const MOCK_CORRECTIONS: CorrectionPoint[] = [
  {
    koExplanation: "문장의 첫 글자는 대문자로 시작해요.",
    enCorrected: "I play soccer after school.",
  },
  {
    koExplanation: "동작이 반복될 때는 'play'를 그대로 써요.",
    enCorrected: "I play with my friends.",
  },
  {
    koExplanation: "'좋아하다'는 'like + -ing' 형태를 써요.",
    enCorrected: "Yes, I like playing after school.",
  },
  {
    koExplanation: "장소를 말할 때 'at'을 써요.",
    enCorrected: "We play at the playground.",
  },
  {
    koExplanation: "의문문에서는 'do'를 앞에 써요.",
    enCorrected: "Do you like playing after school?",
  },
];

/** mock 대화 요약 */
export const MOCK_SUMMARY =
  "방과 후 운동장 근처에서 친구 Hailey와 만나서, 방과 후에 뭐 하는지, 누구랑 노는지 이야기했어요. 친구가 재미있어 보인다고 하며 마무리했어요.";
