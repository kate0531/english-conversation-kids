"use client";

import { type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HomeButton from "@/components/HomeButton";
import { playClick } from "@/lib/sounds";

type WeekNumber = 1 | 2 | 3 | 4;
type CoopMode = "menu" | "pet" | "island" | "cooking" | "drawing";
type MobileInfoSection = "ranking" | "selected" | "logs" | "my";
type MissionDifficulty = "easy" | "medium" | "hard";
type PetMobileSheet = "actions" | "info" | null;
type DrawingMobileSheet = "tools" | "info" | null;
type DrawingTool = "pen" | "line" | "rect" | "circle" | "eraser" | "sticker" | "move" | "bucket";
type DrawingTheme = "blue" | "sunset" | "tropical";
type DrawingSubject = "playground" | "festival" | "sea";

interface DrawingPoint {
  x: number;
  y: number;
}

interface DrawingWeekConfig {
  week: WeekNumber;
  title: string;
  phaseLabel: string;
  mission: string;
  threshold: number;
  successSummary: string;
  successDetail: string;
  failSummary: string;
  failDetail: string;
}

type DrawingStrokeStyle = "solid" | "texture";

interface DrawingStrokeElement {
  id: string;
  kind: "stroke";
  tool: "pen";
  points: DrawingPoint[];
  color: string;
  size: number;
  strokeStyle?: DrawingStrokeStyle;
  userId: string;
  userName: string;
  week: WeekNumber;
}

interface DrawingShapeElement {
  id: string;
  kind: "shape";
  tool: "line" | "rect" | "circle";
  start: DrawingPoint;
  end: DrawingPoint;
  color: string;
  size: number;
  userId: string;
  userName: string;
  week: WeekNumber;
}

interface DrawingStickerElement {
  id: string;
  kind: "sticker";
  sticker: string;
  point: DrawingPoint;
  size: number;
  userId: string;
  userName: string;
  week: WeekNumber;
}

interface DrawingBucketFillElement {
  id: string;
  kind: "bucketFill";
  href: string;
  /** 페인트가 칠해진 픽셀만 1 — 지우개 히트 테스트용 */
  hitMask: Uint8Array;
  userId: string;
  userName: string;
  week: WeekNumber;
}

type DrawingElement = DrawingStrokeElement | DrawingShapeElement | DrawingStickerElement | DrawingBucketFillElement;

interface CoopPlayer {
  id: string;
  name: string;
  points: number;
  avatar: string;
  isMe?: boolean;
}

interface ActionOption {
  id: string;
  label: string;
  delta: number;
  detail: string;
}

interface PermissionProfile {
  title: string;
  description: string;
  canChooseSupport: boolean;
  canLeadTheme: boolean;
}

interface SharedLog {
  id: string;
  week: WeekNumber | 0;
  userId: string;
  userName: string;
  tone: "emerald" | "amber" | "cyan" | "orange" | "violet";
  summary: string;
  detail: string;
}

interface CollectedItem {
  id: string;
  icon: string;
  label: string;
  category: "leader" | "resource" | "support" | "feed" | "temperature" | "skill" | "bond" | "card";
  ownerId: string;
  ownerName: string;
}

interface PetWeekConfig {
  week: WeekNumber;
  title: string;
  phaseLabel: string;
  mission: string;
  threshold: number;
  stageName: string;
  successSummary: string;
  successDetail: string;
  failSummary: string;
  failDetail: string;
  feedOptions: ActionOption[];
  temperatureOptions: ActionOption[];
  skillOptions: ActionOption[];
  bondOptions: ActionOption[];
  surpriseOptions: ActionOption[];
}

interface IslandWeekConfig {
  week: WeekNumber;
  title: string;
  phaseLabel: string;
  mission: string;
  threshold: number;
  stageName: string;
  successSummary: string;
  successDetail: string;
  failSummary: string;
  failDetail: string;
  leaderOptions: ActionOption[];
  resourceOptions: ActionOption[];
  supportOptions: ActionOption[];
}

interface CookingWeekConfig {
  week: WeekNumber;
  title: string;
  phaseLabel: string;
  mission: string;
  threshold: number;
  stageName: string;
  successSummary: string;
  successDetail: string;
  failSummary: string;
  failDetail: string;
  leaderOptions: ActionOption[];
  resourceOptions: ActionOption[];
  supportOptions: ActionOption[];
}

interface MissionRecord {
  attempts: number;
  successes: number;
  totalScore: number;
  bestScore: number;
  bestDifficulty?: MissionDifficulty;
  rewardClaimed?: boolean;
  lastAccuracy?: number;
}

interface TeamNotice {
  id: string;
  week: WeekNumber;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  message: string;
  createdAt: number;
}

interface MissionPrompt {
  text: string;
  baseScore: number;
}

interface ToastNotice {
  id: string;
  title: string;
  body: string;
  tone: "cyan" | "violet" | "emerald";
}

interface MvpRewardState {
  week: WeekNumber;
  userId: string;
  userName: string;
  badge: string;
  title: string;
}

type BrowserSpeechRecognitionCtor = new () => any;

const MOCK_PLAYERS: CoopPlayer[] = [
  { id: "p1", name: "민서", points: 1360, avatar: "🐯" },
  { id: "p2", name: "지우", points: 1210, avatar: "🦊" },
  { id: "p3", name: "윤지", points: 1095, avatar: "🐼", isMe: true },
  { id: "p4", name: "하린", points: 920, avatar: "🐻" },
  { id: "p5", name: "서준", points: 790, avatar: "🐶" },
];

function compressPetConfigs(configs: Record<WeekNumber, PetWeekConfig>): Record<WeekNumber, PetWeekConfig> {
  const thresholdByWeek: Record<WeekNumber, number> = { 1: 55, 2: 60, 3: 66, 4: 72 };
  const scaleNormal = (delta: number) => Math.max(4, Math.min(9, Math.round(delta / 2.6)));
  const scaleBonus = (delta: number) => Math.max(5, Math.min(8, Math.round(delta / 2.2)));

  return {
    1: {
      ...configs[1],
      threshold: thresholdByWeek[1],
      feedOptions: configs[1].feedOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      temperatureOptions: configs[1].temperatureOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      skillOptions: configs[1].skillOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      bondOptions: configs[1].bondOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      surpriseOptions: configs[1].surpriseOptions.map((option) => ({ ...option, delta: scaleBonus(option.delta) })),
    },
    2: {
      ...configs[2],
      threshold: thresholdByWeek[2],
      feedOptions: configs[2].feedOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      temperatureOptions: configs[2].temperatureOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      skillOptions: configs[2].skillOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      bondOptions: configs[2].bondOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      surpriseOptions: configs[2].surpriseOptions.map((option) => ({ ...option, delta: scaleBonus(option.delta) })),
    },
    3: {
      ...configs[3],
      threshold: thresholdByWeek[3],
      feedOptions: configs[3].feedOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      temperatureOptions: configs[3].temperatureOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      skillOptions: configs[3].skillOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      bondOptions: configs[3].bondOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      surpriseOptions: configs[3].surpriseOptions.map((option) => ({ ...option, delta: scaleBonus(option.delta) })),
    },
    4: {
      ...configs[4],
      threshold: thresholdByWeek[4],
      feedOptions: configs[4].feedOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      temperatureOptions: configs[4].temperatureOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      skillOptions: configs[4].skillOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      bondOptions: configs[4].bondOptions.map((option) => ({ ...option, delta: scaleNormal(option.delta) })),
      surpriseOptions: configs[4].surpriseOptions.map((option) => ({ ...option, delta: scaleBonus(option.delta) })),
    },
  };
}

const PET_WEEK_CONFIGS: Record<WeekNumber, PetWeekConfig> = compressPetConfigs({
  1: {
    week: 1,
    title: "1주차",
    phaseLabel: "깨우기",
    mission: "잠든 고양이가 눈을 뜨고 밥을 먹기 시작하게 만들기",
    threshold: 50,
    stageName: "잠든 고양이",
    successSummary: "1주차 성공: 잠든 고양이가 깨어났어요.",
    successDetail: "먹이 냄새와 따뜻한 환경 덕분에 고양이가 천천히 눈을 떴어요.",
    failSummary: "1주차 미달: 아직 잠이 덜 깼어요.",
    failDetail: "먹이와 지원을 더 모으면 다시 깨어날 수 있어요.",
    feedOptions: [
      { id: "p1-feed-1", label: "참치 트릿", delta: 20, detail: "참치 향이 퍼지며 고양이가 반응했어요." },
      { id: "p1-feed-2", label: "따뜻한 우유", delta: 16, detail: "몸을 녹이며 편안하게 깨어날 준비를 해요." },
      { id: "p1-feed-3", label: "연어 사료", delta: 18, detail: "배고픔이 자극되어 움직임이 생겨요." },
    ],
    temperatureOptions: [
      { id: "p1-temp-1", label: "포근한 담요", delta: 14, detail: "체온이 안정돼 몸을 일으키기 쉬워졌어요." },
      { id: "p1-temp-2", label: "햇살 자리 이동", delta: 12, detail: "따뜻한 햇빛이 눈을 뜨게 도와줘요." },
    ],
    skillOptions: [
      { id: "p1-skill-1", label: "깨우기 스킬", delta: 18, detail: "부드러운 자극으로 깨어나는 속도가 빨라졌어요." },
      { id: "p1-skill-2", label: "골골송", delta: 14, detail: "안정감을 주면서 자연스럽게 반응하게 해요." },
    ],
    bondOptions: [
      { id: "p1-bond-1", label: "브러싱 인사", delta: 10, detail: "부드럽게 털을 빗겨 주자 경계심이 조금 풀렸어요." },
      { id: "p1-bond-2", label: "레이저 손짓 놀이", delta: 12, detail: "고양이가 눈을 반쯤 뜨고 장난감 움직임을 따라가기 시작했어요." },
      { id: "p1-bond-3", label: "숨숨집 정리", delta: 9, detail: "안전한 공간이 생겨 조금 더 편하게 몸을 맡겨요." },
    ],
    surpriseOptions: [
      { id: "p1-card-1", label: "응원 부스트 카드", delta: 12, detail: "갑작스러운 응원 파워로 고양이가 귀를 쫑긋 세웠어요." },
      { id: "p1-card-2", label: "간식 보너스 카드", delta: 10, detail: "작은 보너스 간식 덕분에 반응이 더 빨라졌어요." },
      { id: "p1-card-3", label: "장난감 번쩍 카드", delta: 11, detail: "반짝이는 장난감이 호기심을 자극했어요." },
    ],
  },
  2: {
    week: 2,
    title: "2주차",
    phaseLabel: "성장 1",
    mission: "밥 먹는 고양이를 튼튼하고 생기 있게 키우기",
    threshold: 60,
    stageName: "밥 먹는 고양이",
    successSummary: "2주차 성공: 고양이가 더 건강해졌어요.",
    successDetail: "식사와 휴식이 잘 맞아 움직임이 한층 활발해졌어요.",
    failSummary: "2주차 미달: 아직 먹는 데 집중하고 있어요.",
    failDetail: "기운을 더 채우면 다음 성장 단계로 갈 수 있어요.",
    feedOptions: [
      { id: "p2-feed-1", label: "영양 캔식", delta: 18, detail: "건강한 체력이 올라가요." },
      { id: "p2-feed-2", label: "닭가슴살 큐브", delta: 16, detail: "근력이 붙으면서 생기가 돌아요." },
      { id: "p2-feed-3", label: "건강 간식", delta: 14, detail: "전체 컨디션이 안정적으로 올라가요." },
    ],
    temperatureOptions: [
      { id: "p2-temp-1", label: "온열 쿠션", delta: 15, detail: "편안하게 식사 후 회복을 도와줘요." },
      { id: "p2-temp-2", label: "창가 햇살존", delta: 13, detail: "햇빛을 쬐며 생기가 올라와요." },
    ],
    skillOptions: [
      { id: "p2-skill-1", label: "점프 훈련", delta: 18, detail: "근육과 반응 속도가 함께 올라가요." },
      { id: "p2-skill-2", label: "리듬 놀이", delta: 15, detail: "몸이 가벼워지고 반응이 빨라져요." },
    ],
    bondOptions: [
      { id: "p2-bond-1", label: "낚싯대 놀이", delta: 11, detail: "고양이가 스스로 몸을 움직이며 놀이에 집중했어요." },
      { id: "p2-bond-2", label: "햇살 산책", delta: 10, detail: "짧은 이동만으로도 컨디션이 눈에 띄게 좋아졌어요." },
      { id: "p2-bond-3", label: "낮잠 타임", delta: 9, detail: "회복 시간을 가지며 성장 에너지를 안정적으로 모았어요." },
    ],
    surpriseOptions: [
      { id: "p2-card-1", label: "더블 간식 카드", delta: 12, detail: "영양 보너스가 들어와 성장 속도가 빨라졌어요." },
      { id: "p2-card-2", label: "깜짝 장난감 카드", delta: 11, detail: "흥미가 살아나며 반응성이 높아졌어요." },
      { id: "p2-card-3", label: "협동 하이파이브 카드", delta: 10, detail: "팀 분위기가 좋아지자 고양이도 더 활발해졌어요." },
    ],
  },
  3: {
    week: 3,
    title: "3주차",
    phaseLabel: "성장 2",
    mission: "장난감을 쫓는 고양이를 진화 직전까지 성장시키기",
    threshold: 70,
    stageName: "장난감을 쫓는 고양이",
    successSummary: "3주차 성공: 고양이가 더 특별해졌어요.",
    successDetail: "놀이와 훈련을 통해 진화 직전 상태에 도달했어요.",
    failSummary: "3주차 미달: 아직 더 놀고 성장할 시간이 필요해요.",
    failDetail: "에너지와 스킬을 조금 더 채우면 돼요.",
    feedOptions: [
      { id: "p3-feed-1", label: "별빛 참치볼", delta: 20, detail: "진화 에너지가 빠르게 차올랐어요." },
      { id: "p3-feed-2", label: "고단백 파우치", delta: 17, detail: "체력과 회복력이 함께 올라가요." },
      { id: "p3-feed-3", label: "달빛 간식", delta: 15, detail: "밤 활동 감각이 살아나요." },
    ],
    temperatureOptions: [
      { id: "p3-temp-1", label: "달빛 온실", delta: 16, detail: "안정적인 환경에서 더 잘 성장해요." },
      { id: "p3-temp-2", label: "캣타워 조명", delta: 14, detail: "탐색 에너지가 차분하게 모여요." },
    ],
    skillOptions: [
      { id: "p3-skill-1", label: "별자리 추적", delta: 20, detail: "집중력과 감각이 크게 올라가요." },
      { id: "p3-skill-2", label: "섀도 점프", delta: 18, detail: "민첩성과 반응성이 강화돼요." },
    ],
    bondOptions: [
      { id: "p3-bond-1", label: "리본 장식", delta: 12, detail: "특별한 장식에 기분이 좋아져 움직임이 더 가벼워졌어요." },
      { id: "p3-bond-2", label: "포토 타임", delta: 10, detail: "카메라를 의식하며 자신감 있게 포즈를 잡았어요." },
      { id: "p3-bond-3", label: "낚싯대 스피드전", delta: 13, detail: "순간 반응이 살아나며 진화 에너지가 크게 모였어요." },
    ],
    surpriseOptions: [
      { id: "p3-card-1", label: "더블 점프 카드", delta: 12, detail: "순간 추진력이 붙어 성장 게이지가 크게 올랐어요." },
      { id: "p3-card-2", label: "반짝 달빛 카드", delta: 11, detail: "달빛 버프로 집중력이 높아졌어요." },
      { id: "p3-card-3", label: "협력 콤보 카드", delta: 13, detail: "팀 콤보가 터지며 고양이가 신나게 움직였어요." },
    ],
  },
  4: {
    week: 4,
    title: "4주차",
    phaseLabel: "진화",
    mission: "마지막 지원을 모아 달빛 수호묘로 진화시키기",
    threshold: 80,
    stageName: "진화 직전 고양이",
    successSummary: "4주차 성공: 달빛 수호묘가 되었어요.",
    successDetail: "모든 협력 행동이 모여 고양이 시즌이 완성됐어요.",
    failSummary: "4주차 미달: 진화 직전에서 멈췄어요.",
    failDetail: "마지막 힘을 더 모아 다시 도전할 수 있어요.",
    feedOptions: [
      { id: "p4-feed-1", label: "축제 만찬", delta: 22, detail: "최종 진화 에너지가 크게 올라가요." },
      { id: "p4-feed-2", label: "달빛 사료", delta: 18, detail: "진화 안정성이 높아져요." },
      { id: "p4-feed-3", label: "수호 간식", delta: 16, detail: "결말 직전 컨디션을 단단하게 만들어줘요." },
    ],
    temperatureOptions: [
      { id: "p4-temp-1", label: "은빛 온도막", delta: 18, detail: "진화 유지에 맞는 환경을 만들어요." },
      { id: "p4-temp-2", label: "별빛 창가", delta: 15, detail: "달빛 결말에 어울리는 분위기를 만들어요." },
    ],
    skillOptions: [
      { id: "p4-skill-1", label: "수호 오라", delta: 20, detail: "마지막 에너지가 크게 모여요." },
      { id: "p4-skill-2", label: "달빛 도약", delta: 18, detail: "최종 장면으로 이어질 힘을 완성해요." },
    ],
    bondOptions: [
      { id: "p4-bond-1", label: "왕관 세리머니", delta: 13, detail: "진화 직전의 자신감이 최고조로 올라갔어요." },
      { id: "p4-bond-2", label: "달빛 포토존", delta: 11, detail: "반짝이는 연출 속에서 결말 에너지가 모였어요." },
      { id: "p4-bond-3", label: "포옹 응원", delta: 12, detail: "친밀감이 높아지며 마지막 진화 준비가 단단해졌어요." },
    ],
    surpriseOptions: [
      { id: "p4-card-1", label: "피날레 부스트 카드", delta: 14, detail: "피날레 버프가 터지며 결말 직전 힘이 폭발했어요." },
      { id: "p4-card-2", label: "달빛 폭죽 카드", delta: 12, detail: "축제 분위기가 고양이의 기세를 끌어올렸어요." },
      { id: "p4-card-3", label: "응원 물결 카드", delta: 11, detail: "모두의 응원이 한 번에 모이며 진화 직전 기운이 차올랐어요." },
    ],
  },
});

const ISLAND_WEEK_CONFIGS: Record<WeekNumber, IslandWeekConfig> = {
  1: {
    week: 1,
    title: "1주차",
    phaseLabel: "생존",
    mission: "여름 무인도에서 안전한 첫날 생존 기반을 만들기",
    threshold: 50,
    stageName: "해변 생존 시작",
    successSummary: "1주차 성공: 여름 해변에서 생존 거점을 만들었어요.",
    successDetail: "그늘, 물, 불씨가 확보되어 다음 주차를 준비할 수 있어요.",
    failSummary: "1주차 미달: 아직 생존 기반이 약해요.",
    failDetail: "그늘과 물, 기본 자원을 더 모아야 해요.",
    leaderOptions: [
      { id: "i1-lead-1", label: "산호 해변", delta: 18, detail: "잔잔한 파도와 넓은 백사장이 있어 첫 생존 거점으로 적합해요." },
      { id: "i1-lead-2", label: "야자수 만", delta: 15, detail: "그늘 확보가 쉬워 여름 섬에 유리해요." },
    ],
    resourceOptions: [
      { id: "i1-res-1", label: "코코넛 확보", delta: 18, detail: "식수와 열량을 동시에 확보했어요." },
      { id: "i1-res-2", label: "유목 모으기", delta: 16, detail: "불과 거점 제작에 필요한 재료가 모였어요." },
      { id: "i1-res-3", label: "조개 채집", delta: 14, detail: "첫 식량이 생겨 생존이 안정돼요." },
    ],
    supportOptions: [
      { id: "i1-sup-1", label: "그늘막 설치", delta: 16, detail: "햇볕을 피할 수 있는 임시 거점이 완성됐어요." },
      { id: "i1-sup-2", label: "불씨 살리기", delta: 18, detail: "밤에도 버틸 수 있는 불이 살아났어요." },
    ],
  },
  2: {
    week: 2,
    title: "2주차",
    phaseLabel: "자원 확보",
    mission: "탈출에 필요한 핵심 자원을 넉넉하게 모으기",
    threshold: 60,
    stageName: "자원 거점 완성",
    successSummary: "2주차 성공: 탈출용 자원이 눈에 띄게 쌓였어요.",
    successDetail: "식량, 목재, 밧줄 재료가 준비되어 다음 단계를 열었어요.",
    failSummary: "2주차 미달: 자원이 아직 부족해요.",
    failDetail: "탈출 준비를 하려면 추가 수집이 더 필요해요.",
    leaderOptions: [
      { id: "i2-lead-1", label: "야자숲 동선 지휘", delta: 18, detail: "자원 수집 루트가 효율적으로 정리됐어요." },
      { id: "i2-lead-2", label: "암초 구역 탐색", delta: 15, detail: "새로운 재료 위치를 빠르게 찾았어요." },
    ],
    resourceOptions: [
      { id: "i2-res-1", label: "목재 묶음", delta: 18, detail: "뗏목 뼈대를 만들 재료가 쌓였어요." },
      { id: "i2-res-2", label: "넝쿨 밧줄", delta: 16, detail: "묶을 수 있는 튼튼한 줄이 생겼어요." },
      { id: "i2-res-3", label: "말린 식량", delta: 14, detail: "탈출 전 저장 식량이 늘어났어요." },
    ],
    supportOptions: [
      { id: "i2-sup-1", label: "창고 정리", delta: 16, detail: "자원을 쓰기 쉽게 분류했어요." },
      { id: "i2-sup-2", label: "지도 표시", delta: 18, detail: "수집 포인트가 정리되어 효율이 높아졌어요." },
    ],
  },
  3: {
    week: 3,
    title: "3주차",
    phaseLabel: "탈출 준비",
    mission: "여름 바다를 건널 준비를 끝내기",
    threshold: 70,
    stageName: "뗏목 준비 단계",
    successSummary: "3주차 성공: 뗏목과 신호 체계가 거의 완성됐어요.",
    successDetail: "탈출 직전까지 준비가 끝나 마지막 주를 기다리고 있어요.",
    failSummary: "3주차 미달: 아직 준비가 부족해요.",
    failDetail: "부품과 신호 장비를 더 확보해야 해요.",
    leaderOptions: [
      { id: "i3-lead-1", label: "뗏목 설계 지휘", delta: 20, detail: "뗏목 구조가 튼튼해졌어요." },
      { id: "i3-lead-2", label: "신호 모닥불 위치 지정", delta: 16, detail: "도움을 받기 좋은 위치가 잡혔어요." },
    ],
    resourceOptions: [
      { id: "i3-res-1", label: "돛 천 확보", delta: 18, detail: "바람을 받는 준비가 끝났어요." },
      { id: "i3-res-2", label: "방수 상자", delta: 16, detail: "식량과 도구를 안전하게 싣게 되었어요." },
      { id: "i3-res-3", label: "추가 목재", delta: 14, detail: "뗏목 안정성이 올라갔어요." },
    ],
    supportOptions: [
      { id: "i3-sup-1", label: "모닥불 강화", delta: 18, detail: "멀리서도 보일 신호가 완성됐어요." },
      { id: "i3-sup-2", label: "도구 수리", delta: 16, detail: "탈출 직전 필요한 도구가 정상화됐어요." },
    ],
  },
  4: {
    week: 4,
    title: "4주차",
    phaseLabel: "탈출",
    mission: "여름 섬을 떠나 탈출 엔딩까지 도달하기",
    threshold: 80,
    stageName: "탈출 직전",
    successSummary: "4주차 성공: 모두 함께 무인도를 탈출했어요.",
    successDetail: "뗏목, 신호, 식량이 맞물려 여름 무인도 시즌이 끝났어요.",
    failSummary: "4주차 미달: 출항 직전 준비가 모자랐어요.",
    failDetail: "마지막 준비를 더 모아 다시 출항할 수 있어요.",
    leaderOptions: [
      { id: "i4-lead-1", label: "출항 타이밍 지휘", delta: 20, detail: "파도와 바람이 맞는 순간을 잡았어요." },
      { id: "i4-lead-2", label: "구조 신호 지휘", delta: 18, detail: "멀리서도 보이는 구조 신호를 맞췄어요." },
    ],
    resourceOptions: [
      { id: "i4-res-1", label: "최종 식량 적재", delta: 18, detail: "출항용 식량이 충분해졌어요." },
      { id: "i4-res-2", label: "물통 채우기", delta: 16, detail: "긴 이동을 버틸 물이 준비됐어요." },
      { id: "i4-res-3", label: "노 보강", delta: 14, detail: "출항 안정성이 올라갔어요." },
    ],
    supportOptions: [
      { id: "i4-sup-1", label: "돛 점검", delta: 18, detail: "바람을 제대로 받을 수 있게 됐어요." },
      { id: "i4-sup-2", label: "탑승 정리", delta: 16, detail: "출항 전 마지막 정리가 끝났어요." },
    ],
  },
};

const COOKING_WEEK_CONFIGS: Record<WeekNumber, CookingWeekConfig> = {
  1: {
    week: 1,
    title: "1주차",
    phaseLabel: "재료",
    mission: "페페로니 피자에 필요한 기본 재료를 신선하게 모으기",
    threshold: 50,
    stageName: "재료 준비",
    successSummary: "1주차 성공: 페페로니 피자 재료가 준비되었어요.",
    successDetail: "도우, 토마토 소스, 모차렐라, 페페로니가 갖춰져 다음 단계로 넘어갈 수 있어요.",
    failSummary: "1주차 미달: 아직 재료가 부족해요.",
    failDetail: "기본 재료를 더 모아야 페페로니 토핑 준비를 시작할 수 있어요.",
    leaderOptions: [
      { id: "c1-lead-1", label: "페페로니 재료 선정", delta: 18, detail: "메인 쉐프가 오늘의 페페로니 피자 재료 구성을 정했어요." },
      { id: "c1-lead-2", label: "정육·치즈 동선 정리", delta: 15, detail: "도우미들이 페페로니와 치즈를 빠르게 모을 수 있게 동선을 맞췄어요." },
    ],
    resourceOptions: [
      { id: "c1-res-1", label: "밀가루 담기", delta: 18, detail: "도우를 만들 핵심 재료가 준비됐어요." },
      { id: "c1-res-2", label: "토마토 소스 준비", delta: 16, detail: "진한 소스 베이스가 신선하게 준비됐어요." },
      { id: "c1-res-3", label: "모차렐라 고르기", delta: 14, detail: "쭉 늘어나는 치즈 재료가 준비됐어요." },
    ],
    supportOptions: [
      { id: "c1-sup-1", label: "페페로니 손질", delta: 16, detail: "토핑용 페페로니를 바로 쓸 수 있게 정리했어요." },
      { id: "c1-sup-2", label: "냉장 보관 정리", delta: 18, detail: "페페로니와 치즈가 신선하게 유지되도록 정리했어요." },
    ],
  },
  2: {
    week: 2,
    title: "2주차",
    phaseLabel: "레시피",
    mission: "짭짤하고 진한 페페로니 피자 레시피를 완성하기",
    threshold: 60,
    stageName: "레시피 설계",
    successSummary: "2주차 성공: 페페로니 피자 레시피가 완성되었어요.",
    successDetail: "소스, 모차렐라, 페페로니 비율이 잡혀 조리 준비가 쉬워졌어요.",
    failSummary: "2주차 미달: 레시피 조정이 더 필요해요.",
    failDetail: "짠맛과 치즈 비율을 조금 더 맞추면 더 완성도 높은 레시피가 돼요.",
    leaderOptions: [
      { id: "c2-lead-1", label: "소스·치즈 비율 설계", delta: 18, detail: "메인 쉐프가 토마토 소스와 모차렐라 비율을 조정했어요." },
      { id: "c2-lead-2", label: "페페로니 토핑 순서 결정", delta: 15, detail: "굽기 전에 올릴 페페로니 순서를 정리했어요." },
    ],
    resourceOptions: [
      { id: "c2-res-1", label: "오레가노 준비", delta: 18, detail: "페페로니 풍미를 살릴 허브를 준비했어요." },
      { id: "c2-res-2", label: "페페로니 슬라이스 정리", delta: 16, detail: "대표 토핑이 보기 좋게 손질됐어요." },
      { id: "c2-res-3", label: "모차렐라 분량 맞추기", delta: 14, detail: "치즈 양을 고르게 맞춰 담았어요." },
    ],
    supportOptions: [
      { id: "c2-sup-1", label: "레시피 메모", delta: 16, detail: "도우미가 레시피를 정리해 모두가 공유할 수 있게 했어요." },
      { id: "c2-sup-2", label: "짠맛 밸런스 피드백", delta: 18, detail: "간단한 시식으로 짭짤한 맛 균형을 더 다듬었어요." },
    ],
  },
  3: {
    week: 3,
    title: "3주차",
    phaseLabel: "조리",
    mission: "페페로니 토핑을 올리고 굽기 과정을 안정적으로 완성하기",
    threshold: 70,
    stageName: "조리 진행",
    successSummary: "3주차 성공: 페페로니 피자가 맛있게 구워지고 있어요.",
    successDetail: "반죽, 소스, 페페로니, 화덕 타이밍이 잘 맞아 완성 직전 단계에 도달했어요.",
    failSummary: "3주차 미달: 조리 흐름이 아직 불안정해요.",
    failDetail: "반죽 상태와 굽기 타이밍을 조금 더 맞출 필요가 있어요.",
    leaderOptions: [
      { id: "c3-lead-1", label: "반죽 두께 조절", delta: 20, detail: "메인 쉐프가 페페로니 피자 도우 두께를 최적으로 맞췄어요." },
      { id: "c3-lead-2", label: "화덕 온도 지시", delta: 16, detail: "굽기 온도를 조절해 조리 흐름을 안정화했어요." },
    ],
    resourceOptions: [
      { id: "c3-res-1", label: "모차렐라 추가", delta: 18, detail: "치즈 풍미가 더 살아나도록 재료를 보강했어요." },
      { id: "c3-res-2", label: "소스 바르기", delta: 16, detail: "도우 위에 소스를 고르게 펴 발랐어요." },
      { id: "c3-res-3", label: "페페로니 토핑 올리기", delta: 14, detail: "페페로니가 고르게 올라가 먹음직스러워졌어요." },
    ],
    supportOptions: [
      { id: "c3-sup-1", label: "화덕 보조", delta: 18, detail: "도우미가 화덕 앞에서 굽기 타이밍을 맞춰줬어요." },
      { id: "c3-sup-2", label: "커팅 도구 준비", delta: 16, detail: "완성 직후를 대비해 도구를 정리했어요." },
    ],
  },
  4: {
    week: 4,
    title: "4주차",
    phaseLabel: "포장",
    mission: "완성된 페페로니 피자를 포장 상자에 담아 배달 준비 마무리하기",
    threshold: 80,
    stageName: "포장 준비",
    successSummary: "4주차 성공: 페페로니 피자 포장과 배달 준비가 완성되었어요.",
    successDetail: "모두의 협력으로 페페로니 피자가 깔끔하게 포장되어 배달을 떠났어요.",
    failSummary: "4주차 미달: 마지막 포장 준비가 부족했어요.",
    failDetail: "포장 상자 세팅과 마무리 준비를 조금 더 다듬으면 완성될 수 있어요.",
    leaderOptions: [
      { id: "c4-lead-1", label: "포장 구성 정리", delta: 20, detail: "메인 쉐프가 피자와 박스 구성을 깔끔하게 정리했어요." },
      { id: "c4-lead-2", label: "배달 순서 지시", delta: 18, detail: "가장 빠르게 전달될 수 있도록 준비 순서를 맞췄어요." },
    ],
    resourceOptions: [
      { id: "c4-res-1", label: "오레가노 마감", delta: 18, detail: "마지막 허브 향을 더해 완성도를 높였어요." },
      { id: "c4-res-2", label: "핫소스 사이드 준비", delta: 16, detail: "페페로니 피자와 함께 넣을 곁들임을 더했어요." },
      { id: "c4-res-3", label: "피자 박스 세팅", delta: 14, detail: "포장이 잘 되도록 박스를 정돈했어요." },
    ],
    supportOptions: [
      { id: "c4-sup-1", label: "조각 정리", delta: 18, detail: "포장 전에 피자 조각 모양을 깔끔하게 정리했어요." },
      { id: "c4-sup-2", label: "봉투·냅킨 챙기기", delta: 16, detail: "배달 직전 필요한 소품을 함께 준비했어요." },
    ],
  },
};

const PET_INITIAL_LOGS: SharedLog[] = [
  {
    id: "pet-boot-1",
    week: 0,
    userId: "p1",
    userName: "민서",
    tone: "emerald",
    summary: "주도자가 이번 시즌 펫을 고양이로 정했어요.",
    detail: "이번 시즌은 고양이 성장 샘플을 테스트합니다.",
  },
  {
    id: "pet-boot-2",
    week: 1,
    userId: "p4",
    userName: "하린",
    tone: "amber",
    summary: "1주차 시작 전에 참치 트릿을 준비했어요.",
    detail: "잠든 고양이가 냄새를 맡고 반응하기 시작했어요.",
  },
];

const ISLAND_INITIAL_LOGS: SharedLog[] = [
  {
    id: "island-boot-1",
    week: 0,
    userId: "p1",
    userName: "민서",
    tone: "cyan",
    summary: "주도자가 여름 무인도 지형을 먼저 정찰했어요.",
    detail: "야자수와 해변이 있는 안전한 여름 섬을 기본 배경으로 잡았어요.",
  },
  {
    id: "island-boot-2",
    week: 1,
    userId: "p5",
    userName: "서준",
    tone: "amber",
    summary: "코코넛과 유목을 먼저 모아놨어요.",
    detail: "첫 생존 거점을 만들 수 있는 기초 자원이 생겼어요.",
  },
];

const COOKING_INITIAL_LOGS: SharedLog[] = [
  {
    id: "cooking-boot-1",
    week: 0,
    userId: "p1",
    userName: "민서",
    tone: "cyan",
    summary: "메인 쉐프가 이번 협력 게임 메뉴를 페페로니 피자로 정했어요.",
    detail: "이번 협력 게임은 페페로니 피자를 함께 완성하는 요리 프로젝트예요.",
  },
  {
    id: "cooking-boot-2",
    week: 1,
    userId: "p4",
    userName: "하린",
    tone: "amber",
    summary: "도우미가 페페로니 피자 재료 후보를 먼저 정리했어요.",
    detail: "밀가루, 토마토 소스, 모차렐라, 페페로니를 중심으로 준비가 시작됐어요.",
  },
];

const PET_MISSION_PROMPTS: Record<WeekNumber, Record<MissionDifficulty, MissionPrompt[]>> = {
  1: {
    easy: [{ text: "cat", baseScore: 12 }, { text: "cute cat", baseScore: 12 }, { text: "hello cat", baseScore: 12 }],
    medium: [
      { text: "feed the cat", baseScore: 18 },
      { text: "wake the cat", baseScore: 18 },
      { text: "pet the cat", baseScore: 18 },
    ],
    hard: [
      { text: "The sleepy cat wakes up.", baseScore: 26 },
      { text: "The little cat opens its eyes.", baseScore: 26 },
      { text: "Our cat is ready to eat.", baseScore: 26 },
    ],
  },
  2: {
    easy: [{ text: "happy cat", baseScore: 13 }, { text: "strong cat", baseScore: 13 }, { text: "healthy cat", baseScore: 13 }],
    medium: [
      { text: "The cat is healthy.", baseScore: 19 },
      { text: "The cat feels great.", baseScore: 19 },
      { text: "Our cat is active.", baseScore: 19 },
    ],
    hard: [
      { text: "Our cat grows strong every day.", baseScore: 27 },
      { text: "The healthy cat jumps every day.", baseScore: 27 },
      { text: "This cat is getting stronger now.", baseScore: 27 },
    ],
  },
  3: {
    easy: [{ text: "jump cat", baseScore: 14 }, { text: "play cat", baseScore: 14 }, { text: "fast cat", baseScore: 14 }],
    medium: [
      { text: "The playful cat can jump.", baseScore: 20 },
      { text: "The quick cat likes toys.", baseScore: 20 },
      { text: "Our cat can run fast.", baseScore: 20 },
    ],
    hard: [
      { text: "The cat chases the toy under the moon.", baseScore: 28 },
      { text: "The bright cat runs after the toy.", baseScore: 28 },
      { text: "Our playful cat jumps in the moonlight.", baseScore: 28 },
    ],
  },
  4: {
    easy: [{ text: "moon cat", baseScore: 15 }, { text: "magic cat", baseScore: 15 }, { text: "star cat", baseScore: 15 }],
    medium: [
      { text: "The moon cat is ready.", baseScore: 21 },
      { text: "The magic cat is glowing.", baseScore: 21 },
      { text: "Our star cat looks brave.", baseScore: 21 },
    ],
    hard: [
      { text: "The moon guardian cat shines tonight.", baseScore: 30 },
      { text: "The guardian cat glows under the moon.", baseScore: 30 },
      { text: "Our moon cat protects the night sky.", baseScore: 30 },
    ],
  },
};

const PET_CHEER_MESSAGES = [
  "오늘 미션 파이팅!",
  "천천히 해도 괜찮아!",
  "이번 턴 네가 핵심이야!",
  "한 번 더 도전해 보자!",
  "우리 팀 믿고 해 보자!",
];

const ISLAND_MISSION_PROMPTS: Record<WeekNumber, Record<MissionDifficulty, MissionPrompt[]>> = {
  1: {
    easy: [{ text: "save water", baseScore: 12 }, { text: "find food", baseScore: 12 }, { text: "safe island", baseScore: 12 }],
    medium: [
      { text: "We can build a camp.", baseScore: 18 },
      { text: "The team can find water.", baseScore: 18 },
      { text: "Our camp is safe today.", baseScore: 18 },
    ],
    hard: [
      { text: "We build a safe camp on the island.", baseScore: 26 },
      { text: "Our team finds food and water together.", baseScore: 26 },
      { text: "The island camp is ready for the night.", baseScore: 26 },
    ],
  },
  2: {
    easy: [{ text: "collect wood", baseScore: 13 }, { text: "get rope", baseScore: 13 }, { text: "find water", baseScore: 13 }],
    medium: [
      { text: "We need more wood today.", baseScore: 19 },
      { text: "The team can collect rope.", baseScore: 19 },
      { text: "Our group stores food now.", baseScore: 19 },
    ],
    hard: [
      { text: "We collect strong wood for the raft.", baseScore: 27 },
      { text: "Our team stores food for the escape plan.", baseScore: 27 },
      { text: "The group gathers rope and fresh water.", baseScore: 27 },
    ],
  },
  3: {
    easy: [{ text: "build raft", baseScore: 14 }, { text: "send signal", baseScore: 14 }, { text: "fix tools", baseScore: 14 }],
    medium: [
      { text: "The team can build a raft.", baseScore: 20 },
      { text: "We can send a fire signal.", baseScore: 20 },
      { text: "Our tools are ready now.", baseScore: 20 },
    ],
    hard: [
      { text: "The raft is ready for the sea today.", baseScore: 28 },
      { text: "We send a bright signal from the island.", baseScore: 28 },
      { text: "Our team repairs tools for the escape.", baseScore: 28 },
    ],
  },
  4: {
    easy: [{ text: "leave island", baseScore: 15 }, { text: "row boat", baseScore: 15 }, { text: "safe escape", baseScore: 15 }],
    medium: [
      { text: "The boat is ready to go.", baseScore: 21 },
      { text: "We can leave the island now.", baseScore: 21 },
      { text: "Our team starts the escape.", baseScore: 21 },
    ],
    hard: [
      { text: "The team escapes from the island together.", baseScore: 30 },
      { text: "Our boat moves safely across the sea.", baseScore: 30 },
      { text: "We leave the island and reach home tonight.", baseScore: 30 },
    ],
  },
};

const COOKING_MISSION_PROMPTS: Record<WeekNumber, Record<MissionDifficulty, MissionPrompt[]>> = {
  1: {
    easy: [{ text: "make pizza", baseScore: 12 }, { text: "fresh cheese", baseScore: 12 }, { text: "pizza dough", baseScore: 12 }],
    medium: [
      { text: "We need pizza dough.", baseScore: 18 },
      { text: "The team gets fresh cheese.", baseScore: 18 },
      { text: "Our pizza needs sauce now.", baseScore: 18 },
    ],
    hard: [
      { text: "We collect fresh ingredients for the pizza.", baseScore: 26 },
      { text: "Our team prepares dough, cheese, and sauce.", baseScore: 26 },
      { text: "The pizza ingredients are ready for cooking.", baseScore: 26 },
    ],
  },
  2: {
    easy: [{ text: "cook pizza", baseScore: 13 }, { text: "pizza sauce", baseScore: 13 }, { text: "slice cheese", baseScore: 13 }],
    medium: [
      { text: "We spread sauce on the dough.", baseScore: 19 },
      { text: "The chef adds fresh cheese.", baseScore: 19 },
      { text: "Our pizza looks very good.", baseScore: 19 },
    ],
    hard: [
      { text: "We prepare the pizza with sauce and cheese.", baseScore: 27 },
      { text: "The chef designs a great pizza recipe today.", baseScore: 27 },
      { text: "Our team balances the sauce and toppings well.", baseScore: 27 },
    ],
  },
  3: {
    easy: [{ text: "hot pizza", baseScore: 14 }, { text: "bake now", baseScore: 14 }, { text: "turn oven", baseScore: 14 }],
    medium: [
      { text: "The pizza can bake now.", baseScore: 20 },
      { text: "We check the oven together.", baseScore: 20 },
      { text: "Our pizza smells so good.", baseScore: 20 },
    ],
    hard: [
      { text: "The hot pizza bakes well in the oven.", baseScore: 28 },
      { text: "Our team watches the pizza very carefully.", baseScore: 28 },
      { text: "We bake the pizza until it looks perfect.", baseScore: 28 },
    ],
  },
  4: {
    easy: [{ text: "pizza box", baseScore: 15 }, { text: "serve pizza", baseScore: 15 }, { text: "ready now", baseScore: 15 }],
    medium: [
      { text: "The pizza is ready to serve.", baseScore: 21 },
      { text: "We pack the pizza with care.", baseScore: 21 },
      { text: "Our team finishes the order.", baseScore: 21 },
    ],
    hard: [
      { text: "We pack the pizza and finish the delivery.", baseScore: 30 },
      { text: "Our team serves the pizza in a nice box.", baseScore: 30 },
      { text: "The hot pizza is ready for the final order.", baseScore: 30 },
    ],
  },
};

const ISLAND_SURPRISE_OPTIONS: Record<WeekNumber, ActionOption[]> = {
  1: [
    { id: "is-card-1", label: "코코넛 부스트", delta: 7, detail: "식수 확보 속도가 올라갔어요." },
    { id: "is-card-2", label: "그늘막 카드", delta: 6, detail: "쉼터 준비가 빨라졌어요." },
    { id: "is-card-3", label: "불씨 카드", delta: 7, detail: "밤 생존 준비가 쉬워졌어요." },
  ],
  2: [
    { id: "is-card-4", label: "창고 부스트", delta: 7, detail: "자원 정리가 더 빨라졌어요." },
    { id: "is-card-5", label: "로프 카드", delta: 6, detail: "탈출 준비 자원이 늘어났어요." },
    { id: "is-card-6", label: "탐색 카드", delta: 7, detail: "새 자원 위치를 빠르게 찾았어요." },
  ],
  3: [
    { id: "is-card-7", label: "뗏목 부스트", delta: 8, detail: "뗏목 제작 속도가 빨라졌어요." },
    { id: "is-card-8", label: "신호 카드", delta: 7, detail: "도움 요청 준비가 쉬워졌어요." },
    { id: "is-card-9", label: "도구 카드", delta: 6, detail: "탈출 도구 상태가 좋아졌어요." },
  ],
  4: [
    { id: "is-card-10", label: "출항 부스트", delta: 8, detail: "출항 준비가 크게 진척됐어요." },
    { id: "is-card-11", label: "물통 카드", delta: 6, detail: "이동용 식수 준비가 쉬워졌어요." },
    { id: "is-card-12", label: "돛 점검 카드", delta: 7, detail: "마지막 준비가 단단해졌어요." },
  ],
};

const COOKING_SURPRISE_OPTIONS: Record<WeekNumber, ActionOption[]> = {
  1: [
    { id: "co-card-1", label: "도우 부스트", delta: 7, detail: "도우 준비 속도가 빨라졌어요." },
    { id: "co-card-2", label: "치즈 카드", delta: 6, detail: "핵심 재료가 더 늘어났어요." },
    { id: "co-card-3", label: "소스 카드", delta: 7, detail: "소스 준비가 쉬워졌어요." },
  ],
  2: [
    { id: "co-card-4", label: "레시피 부스트", delta: 7, detail: "메뉴 완성도가 올라갔어요." },
    { id: "co-card-5", label: "토핑 카드", delta: 6, detail: "토핑 준비가 빨라졌어요." },
    { id: "co-card-6", label: "쉐프 카드", delta: 7, detail: "주방 흐름이 정리됐어요." },
  ],
  3: [
    { id: "co-card-7", label: "오븐 부스트", delta: 8, detail: "굽기 타이밍이 좋아졌어요." },
    { id: "co-card-8", label: "향기 카드", delta: 6, detail: "피자 완성도가 올라갔어요." },
    { id: "co-card-9", label: "커팅 카드", delta: 7, detail: "마무리 준비가 쉬워졌어요." },
  ],
  4: [
    { id: "co-card-10", label: "박스 부스트", delta: 8, detail: "포장 준비가 빨라졌어요." },
    { id: "co-card-11", label: "서빙 카드", delta: 6, detail: "배달 준비가 단단해졌어요." },
    { id: "co-card-12", label: "피날레 카드", delta: 7, detail: "최종 완성도가 올라갔어요." },
  ],
};

const DRAWING_WEEK_CONFIGS: Record<WeekNumber, DrawingWeekConfig> = {
  1: {
    week: 1,
    title: "1주차",
    phaseLabel: "기획",
    mission: "빈 캔버스에서 시작해 배경 투표를 모으고, 리더가 전체 주제를 정해 주세요.",
    threshold: 30,
    successSummary: "1주차 성공: 배경 기획과 주제가 정리됐어요.",
    successDetail: "배경 투표가 모이고 리더가 이번 공동 그림의 큰 방향을 확정했어요.",
    failSummary: "1주차 미달: 아직 기획이 덜 모였어요.",
    failDetail: "배경 투표와 주제 선택을 더 진행하면 다음 단계로 넘어갈 수 있어요.",
  },
  2: {
    week: 2,
    title: "2주차",
    phaseLabel: "스케치",
    mission: "리더가 정한 주제를 바탕으로 큰 형태와 구도를 스케치해 보세요.",
    threshold: 36,
    successSummary: "2주차 성공: 스케치 구도가 안정적으로 잡혔어요.",
    successDetail: "메인 오브젝트와 배치가 정리되어 다음 주 채색이 쉬워졌어요.",
    failSummary: "2주차 미달: 스케치가 아직 부족해요.",
    failDetail: "큰 형태와 주요 선을 조금 더 추가하면 구도가 또렷해져요.",
  },
  3: {
    week: 3,
    title: "3주차",
    phaseLabel: "채색",
    mission: "스케치 위에 하늘, 바다, 오브젝트 색을 입혀 그림 분위기를 살려 보세요.",
    threshold: 40,
    successSummary: "3주차 성공: 채색이 들어가 그림이 확 살아났어요.",
    successDetail: "큰 면의 색이 정리되어 작품 전체가 훨씬 풍성해졌어요.",
    failSummary: "3주차 미달: 채색이 더 필요해요.",
    failDetail: "비어 있는 면을 더 채우면 완성도가 크게 올라가요.",
  },
  4: {
    week: 4,
    title: "4주차",
    phaseLabel: "스티커 장식",
    mission: "마지막으로 스티커와 마감 장식을 더해 하나의 공동 그림을 완성해 보세요.",
    threshold: 32,
    successSummary: "4주차 성공: 하나의 공동 그림이 완성됐어요.",
    successDetail: "배경, 스케치, 채색, 장식이 모두 쌓여 팀 작품이 완성됐어요.",
    failSummary: "4주차 미달: 마무리 장식이 조금 부족해요.",
    failDetail: "스티커와 포인트 장식을 더하면 완성감이 커져요.",
  },
};

const DRAWING_THEME_OPTIONS: Array<{ id: DrawingTheme; label: string; badge: string; className: string }> = [
  { id: "blue", label: "맑은 파도", badge: "🌊", className: "from-sky-100 via-cyan-50 to-amber-50" },
  { id: "sunset", label: "노을 해변", badge: "🌅", className: "from-orange-100 via-rose-50 to-amber-50" },
  { id: "tropical", label: "야자수 해변", badge: "🌴", className: "from-emerald-100 via-cyan-50 to-yellow-50" },
];

const DRAWING_COLORS = ["#0f172a", "#2563eb", "#14b8a6", "#f97316", "#ef4444", "#d946ef", "#facc15", "#ffffff"];
const DRAWING_STICKERS = ["⭐", "☀️", "☁️", "🌈", "🌴", "🐚", "🐠", "🦀"];
const DRAWING_SURPRISE_OPTIONS: Record<WeekNumber, ActionOption[]> = {
  1: [
    { id: "dr-card-1", label: "배경 번짐 카드", delta: 8, detail: "이번 주 배경 면적을 더 넓게 채울 수 있어요." },
    { id: "dr-card-2", label: "컬러 참고 카드", delta: 7, detail: "배경 톤을 더 안정적으로 고를 수 있어요." },
    { id: "dr-card-3", label: "구도 메모 카드", delta: 6, detail: "리더가 전체 구도를 잡기 쉬워졌어요." },
  ],
  2: [
    { id: "dr-card-4", label: "스케치 연필 카드", delta: 8, detail: "텍스처 연필 선 종류를 팔레트에 추가해요." },
    { id: "dr-card-5", label: "요소 이동 카드", delta: 7, detail: "이동 도구로 길게 눌러 그린 요소를 옮길 수 있어요." },
    { id: "dr-card-6", label: "구도 프레임 카드", delta: 6, detail: "구도 가이드선을 켜거나 끄고, 패널에서 해제할 수 있어요." },
  ],
  3: [
    { id: "dr-card-7", label: "채색 부스트 카드", delta: 8, detail: "페인트통 도구로 닫힌 선 안만 채울 수 있어요." },
    { id: "dr-card-8", label: "팔레트 카드", delta: 7, detail: "색 조합 선택이 더 쉬워졌어요." },
    { id: "dr-card-9", label: "그라데이션 카드", delta: 6, detail: "배경과 오브젝트 색을 더 풍성하게 채울 수 있어요." },
  ],
  4: [
    { id: "dr-card-10", label: "피날레 스티커 카드", delta: 8, detail: "스티커 팔레트에 새 이모지 옵션이 추가돼요." },
    { id: "dr-card-11", label: "반짝 마감 카드", delta: 7, detail: "누를 때마다 사진 액자 색이 바뀌어요." },
    { id: "dr-card-12", label: "팀 데코 카드", delta: 6, detail: "모든 팀원의 스티커 사용 횟수가 늘어나요." },
  ],
};

/** 반짝 마감 카드(dr-card-11): 누를 때마다 순환하는 액자 테두리 색 */
const SPARKLE_FINISH_FRAME_THEMES: ReadonlyArray<{ label: string; border: string; insetLine: string; outerGlow: string }> = [
  { label: "화이트", border: "rgba(255,255,255,0.96)", insetLine: "rgba(148,163,184,0.5)", outerGlow: "rgba(15,23,42,0.2)" },
  { label: "골드", border: "rgba(253,224,71,0.95)", insetLine: "rgba(217,119,6,0.4)", outerGlow: "rgba(180,83,9,0.18)" },
  { label: "로즈", border: "rgba(251,207,232,0.96)", insetLine: "rgba(219,39,119,0.32)", outerGlow: "rgba(190,24,93,0.16)" },
  { label: "시안", border: "rgba(207,250,254,0.96)", insetLine: "rgba(8,145,178,0.35)", outerGlow: "rgba(14,116,144,0.16)" },
  { label: "라일락", border: "rgba(237,233,254,0.97)", insetLine: "rgba(124,58,237,0.3)", outerGlow: "rgba(91,33,182,0.14)" },
  { label: "민트", border: "rgba(209,250,229,0.96)", insetLine: "rgba(5,150,105,0.32)", outerGlow: "rgba(4,120,87,0.14)" },
];

const DRAWING_THEME_VOTE_OPTIONS: Record<WeekNumber, DrawingTheme[]> = {
  1: ["blue", "sunset", "tropical"],
  2: ["blue", "sunset", "tropical"],
  3: ["blue", "sunset", "tropical"],
  4: ["blue", "sunset", "tropical"],
};
const DRAWING_SUBJECT_OPTIONS: Array<{
  id: DrawingSubject;
  label: string;
  badge: string;
  description: string;
}> = [
  { id: "playground", label: "파도 놀이터", badge: "🏖️", description: "튜브와 모래성, 아이템이 많은 해변" },
  { id: "festival", label: "노을 축제", badge: "🎆", description: "노을과 조명, 음악이 있는 여름 축제" },
  { id: "sea", label: "바다 탐험", badge: "🐠", description: "바닷속 친구들과 배가 함께 있는 장면" },
];
const DRAWING_LEADER_MESSAGES = [
  "원하는 배경에 투표해 주세요!",
  "배경 톤부터 같이 맞춰 보자!",
  "스케치는 큰 형태부터 가 보자!",
  "채색은 비슷한 색끼리 묶어 보자!",
  "마지막엔 스티커를 겹치지 않게 붙여 보자!",
  "빈 부분은 자유롭게 채워 보자!",
];

const DRAWING_INITIAL_LOGS: SharedLog[] = [
  {
    id: "drawing-boot-1",
    week: 0,
    userId: "p1",
    userName: "민서",
    tone: "cyan",
    summary: "이번 시즌은 빈 캔버스에서 공동 그림을 완성하는 프로젝트예요.",
    detail: "1주차에는 배경 투표와 주제 결정부터 시작합니다.",
  },
  {
    id: "drawing-boot-2",
    week: 1,
    userId: "p3",
    userName: "윤지",
    tone: "amber",
    summary: "캔버스가 비어 있어 모두의 첫 선택을 기다리고 있어요.",
    detail: "배경 투표를 모아 리더가 첫 주제를 정하게 됩니다.",
  },
];

const DRAWING_MISSION_PROMPTS: Record<WeekNumber, Record<MissionDifficulty, MissionPrompt[]>> = {
  1: {
    easy: [{ text: "blue sky", baseScore: 12 }, { text: "beach theme", baseScore: 12 }, { text: "summer art", baseScore: 12 }],
    medium: [
      { text: "We choose the background first.", baseScore: 18 },
      { text: "Our team starts with a blank canvas.", baseScore: 18 },
      { text: "The leader picks the art theme.", baseScore: 18 },
    ],
    hard: [
      { text: "Our team votes for the best beach background.", baseScore: 26 },
      { text: "The leader chooses a summer scene for the canvas.", baseScore: 26 },
      { text: "We plan the first week before drawing together.", baseScore: 26 },
    ],
  },
  2: {
    easy: [{ text: "draw sketch", baseScore: 13 }, { text: "big outline", baseScore: 13 }, { text: "soft pencil", baseScore: 13 }],
    medium: [
      { text: "We sketch the main objects.", baseScore: 19 },
      { text: "The team draws the outline first.", baseScore: 19 },
      { text: "Our sketch shows the whole scene.", baseScore: 19 },
    ],
    hard: [
      { text: "We draw a clear sketch for the whole summer scene.", baseScore: 27 },
      { text: "The team makes a strong outline before coloring.", baseScore: 27 },
      { text: "Our sketch helps everyone add the next details.", baseScore: 27 },
    ],
  },
  3: {
    easy: [{ text: "paint now", baseScore: 14 }, { text: "bright color", baseScore: 14 }, { text: "fill the sea", baseScore: 14 }],
    medium: [
      { text: "We color the sky and sea.", baseScore: 20 },
      { text: "The team paints the big areas.", baseScore: 20 },
      { text: "Our canvas looks bright now.", baseScore: 20 },
    ],
    hard: [
      { text: "We add bright colors to the whole summer canvas.", baseScore: 28 },
      { text: "The team fills the scene with warm and cool colors.", baseScore: 28 },
      { text: "Our painting looks more alive after the coloring stage.", baseScore: 28 },
    ],
  },
  4: {
    easy: [{ text: "cute sticker", baseScore: 15 }, { text: "final touch", baseScore: 15 }, { text: "finish art", baseScore: 15 }],
    medium: [
      { text: "We decorate the final artwork.", baseScore: 21 },
      { text: "The team adds cute stickers now.", baseScore: 21 },
      { text: "Our canvas is ready to finish.", baseScore: 21 },
    ],
    hard: [
      { text: "We finish the team artwork with bright final stickers.", baseScore: 30 },
      { text: "Our group decorates the canvas for the last stage.", baseScore: 30 },
      { text: "The final artwork shines after the last decoration.", baseScore: 30 },
    ],
  },
};

function getDrawingTokensForWeek(_week: WeekNumber): Record<string, number> {
  return { p1: 8, p2: 7, p3: 6, p4: 5, p5: 5 };
}

function getDrawingPointFromEvent(
  event: ReactPointerEvent<SVGSVGElement>,
  svgRef: RefObject<SVGSVGElement | null>
): DrawingPoint {
  const svg = svgRef.current;
  if (!svg) return { x: 0, y: 0 };
  const rect = svg.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 1000,
    y: ((event.clientY - rect.top) / rect.height) * 700,
  };
}

function getDrawingPath(points: DrawingPoint[]): string {
  if (points.length === 0) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function getDrawingDistance(a: DrawingPoint, b: DrawingPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getTopmostElementAtPoint(elements: DrawingElement[], point: DrawingPoint): DrawingElement | null {
  for (let i = elements.length - 1; i >= 0; i -= 1) {
    if (isDrawingElementHit(elements[i], point)) return elements[i];
  }
  return null;
}

function translateDrawingElement(element: DrawingElement, dx: number, dy: number): DrawingElement {
  if (element.kind === "bucketFill") {
    return element;
  }
  if (element.kind === "sticker") {
    return { ...element, point: { x: element.point.x + dx, y: element.point.y + dy } };
  }
  if (element.kind === "stroke") {
    return { ...element, points: element.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
  }
  return {
    ...element,
    start: { x: element.start.x + dx, y: element.start.y + dy },
    end: { x: element.end.x + dx, y: element.end.y + dy },
  };
}

const PAINT_BUCKET_W = 1000;
const PAINT_BUCKET_H = 700;

/** 4주차 스티커: 두께(4·8·12·18) → 요소 size (render 시 fontSize = size×3, 작음→큼) */
function getStickerSizeFromThickness(thickness: number): number {
  const map: Record<number, number> = { 4: 9, 8: 12, 12: 16, 18: 22 };
  return map[thickness] ?? Math.max(8, Math.round((thickness / 18) * 22));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function drawPaintBoundariesOnCanvas(ctx: CanvasRenderingContext2D, elements: DrawingElement[]) {
  ctx.save();
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = "#000000";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const el of elements) {
    if (el.kind === "sticker" || el.kind === "bucketFill") continue;
    if (el.kind === "stroke") {
      const pts = el.points;
      if (pts.length < 2) continue;
      ctx.lineWidth = Math.max(1, el.size);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      continue;
    }
    if (el.kind === "shape") {
      ctx.lineWidth = Math.max(1, el.size);
      if (el.tool === "line") {
        ctx.beginPath();
        ctx.moveTo(el.start.x, el.start.y);
        ctx.lineTo(el.end.x, el.end.y);
        ctx.stroke();
      } else if (el.tool === "rect") {
        const x = Math.min(el.start.x, el.end.x);
        const y = Math.min(el.start.y, el.end.y);
        const rw = Math.abs(el.end.x - el.start.x);
        const rh = Math.abs(el.end.y - el.start.y);
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, rw, rh, 16);
        } else {
          ctx.rect(x, y, rw, rh);
        }
        ctx.stroke();
      } else {
        const cx = (el.start.x + el.end.x) / 2;
        const cy = (el.start.y + el.end.y) / 2;
        const rx = Math.abs(el.end.x - el.start.x) / 2;
        const ry = Math.abs(el.end.y - el.start.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function floodFillPaintRegion(data: ImageData, seedX: number, seedY: number, fr: number, fg: number, fb: number): boolean {
  const w = data.width;
  const h = data.height;
  const d = data.data;
  const idx = (x: number, y: number) => (y * w + x) * 4;
  if (seedX < 0 || seedX >= w || seedY < 0 || seedY >= h) return false;
  const si = idx(seedX, seedY);
  const tr = d[si];
  const tg = d[si + 1];
  const tb = d[si + 2];
  const ta = d[si + 3];
  const seedSum = tr + tg + tb;
  const matchesSeed = (i: number) => d[i] === tr && d[i + 1] === tg && d[i + 2] === tb && d[i + 3] === ta;
  if (seedSum < 280 || ta < 200) return false;
  if (seedSum < 720) return false;

  const q: [number, number][] = [[seedX, seedY]];
  let qi = 0;
  let filled = 0;
  const maxOps = w * h;

  while (qi < q.length && filled < maxOps) {
    const [x, y] = q[qi]!;
    qi += 1;
    const i = idx(x, y);
    if (!matchesSeed(i)) continue;
    d[i] = fr;
    d[i + 1] = fg;
    d[i + 2] = fb;
    d[i + 3] = 255;
    filled += 1;
    const next: [number, number][] = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of next) {
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const ni = idx(nx, ny);
      if (matchesSeed(ni)) q.push([nx, ny]);
    }
  }
  return filled > 0;
}

function buildPaintBucketDataUrl(
  elements: DrawingElement[],
  point: DrawingPoint,
  fillHex: string
): { href: string; hitMask: Uint8Array } | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = PAINT_BUCKET_W;
  canvas.height = PAINT_BUCKET_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PAINT_BUCKET_W, PAINT_BUCKET_H);
  drawPaintBoundariesOnCanvas(ctx, elements);
  const imageData = ctx.getImageData(0, 0, PAINT_BUCKET_W, PAINT_BUCKET_H);
  const { r: fr, g: fg, b: fb } = hexToRgb(fillHex);
  const sx = Math.floor(point.x);
  const sy = Math.floor(point.y);
  const ok = floodFillPaintRegion(imageData, sx, sy, fr, fg, fb);
  if (!ok) return null;

  const out = ctx.createImageData(PAINT_BUCKET_W, PAINT_BUCKET_H);
  const s = imageData.data;
  const o = out.data;
  const alphaByte = 220;
  for (let i = 0; i < s.length; i += 4) {
    if (s[i] === fr && s[i + 1] === fg && s[i + 2] === fb && s[i + 3] === 255) {
      o[i] = fr;
      o[i + 1] = fg;
      o[i + 2] = fb;
      o[i + 3] = alphaByte;
    } else {
      o[i] = 0;
      o[i + 1] = 0;
      o[i + 2] = 0;
      o[i + 3] = 0;
    }
  }
  const hitMask = new Uint8Array(PAINT_BUCKET_W * PAINT_BUCKET_H);
  for (let y = 0; y < PAINT_BUCKET_H; y += 1) {
    for (let x = 0; x < PAINT_BUCKET_W; x += 1) {
      const i = (y * PAINT_BUCKET_W + x) * 4;
      if (o[i + 3] > 10) hitMask[y * PAINT_BUCKET_W + x] = 1;
    }
  }
  const outCanvas = document.createElement("canvas");
  outCanvas.width = PAINT_BUCKET_W;
  outCanvas.height = PAINT_BUCKET_H;
  const octx = outCanvas.getContext("2d");
  if (!octx) return null;
  octx.putImageData(out, 0, 0);
  return { href: outCanvas.toDataURL("image/png"), hitMask };
}

function isDrawingElementHit(element: DrawingElement, point: DrawingPoint): boolean {
  if (element.kind === "bucketFill") {
    const xi = Math.floor(point.x);
    const yi = Math.floor(point.y);
    if (xi < 0 || xi >= PAINT_BUCKET_W || yi < 0 || yi >= PAINT_BUCKET_H) return false;
    return element.hitMask[yi * PAINT_BUCKET_W + xi] === 1;
  }
  if (element.kind === "sticker") {
    const fontSize = element.size * 3;
    const hitRadius = (fontSize / 2) * 1.15;
    return getDrawingDistance(element.point, point) <= hitRadius;
  }

  if (element.kind === "stroke") {
    return element.points.some((strokePoint) => getDrawingDistance(strokePoint, point) <= element.size + 8);
  }

  const minX = Math.min(element.start.x, element.end.x) - (element.size + 12);
  const maxX = Math.max(element.start.x, element.end.x) + (element.size + 12);
  const minY = Math.min(element.start.y, element.end.y) - (element.size + 12);
  const maxY = Math.max(element.start.y, element.end.y) + (element.size + 12);
  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

function renderDrawingElement(element: DrawingElement): ReactNode {
  if (element.kind === "bucketFill") {
    return (
      <image
        key={element.id}
        href={element.href}
        x={0}
        y={0}
        width={PAINT_BUCKET_W}
        height={PAINT_BUCKET_H}
        preserveAspectRatio="none"
        className="pointer-events-none"
      />
    );
  }
  if (element.kind === "stroke") {
    const isTexture = element.strokeStyle === "texture";
    return (
      <path
        key={element.id}
        d={getDrawingPath(element.points)}
        fill="none"
        stroke={element.color}
        strokeWidth={element.size}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={isTexture ? `${Math.max(2, element.size * 0.85)} ${Math.max(3, element.size * 1.35)}` : undefined}
        opacity={isTexture ? 0.92 : 1}
      />
    );
  }

  if (element.kind === "sticker") {
    return (
      <text
        key={element.id}
        x={element.point.x}
        y={element.point.y}
        fontSize={element.size * 3}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {element.sticker}
      </text>
    );
  }

  if (element.tool === "line") {
    return (
      <line
        key={element.id}
        x1={element.start.x}
        y1={element.start.y}
        x2={element.end.x}
        y2={element.end.y}
        stroke={element.color}
        strokeWidth={element.size}
        strokeLinecap="round"
      />
    );
  }

  if (element.tool === "rect") {
    const x = Math.min(element.start.x, element.end.x);
    const y = Math.min(element.start.y, element.end.y);
    const width = Math.abs(element.end.x - element.start.x);
    const height = Math.abs(element.end.y - element.start.y);
    return (
      <rect
        key={element.id}
        x={x}
        y={y}
        width={width}
        height={height}
        fill={element.week >= 3 ? element.color : "none"}
        fillOpacity={element.week >= 3 ? 0.18 : 0}
        stroke={element.color}
        strokeWidth={element.size}
        rx={16}
      />
    );
  }

  const cx = (element.start.x + element.end.x) / 2;
  const cy = (element.start.y + element.end.y) / 2;
  const rx = Math.abs(element.end.x - element.start.x) / 2;
  const ry = Math.abs(element.end.y - element.start.y) / 2;
  return (
    <ellipse
      key={element.id}
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={element.week >= 3 ? element.color : "none"}
      fillOpacity={element.week >= 3 ? 0.18 : 0}
      stroke={element.color}
      strokeWidth={element.size}
    />
  );
}

function createEmptyMissionBoard(): Record<WeekNumber, Record<string, MissionRecord>> {
  return {
    1: {},
    2: {},
    3: {},
    4: {},
  };
}

function normalizeSpeech(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => Array.from({ length: b.length + 1 }, () => 0));

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function getSpeechMatchScore(target: string, spoken: string): number {
  const normalizedTarget = normalizeSpeech(target);
  const normalizedSpoken = normalizeSpeech(spoken);
  if (!normalizedTarget || !normalizedSpoken) return 0;
  if (normalizedTarget === normalizedSpoken) return 1;
  if (normalizedSpoken.includes(normalizedTarget) || normalizedTarget.includes(normalizedSpoken)) return 0.92;

  const distance = levenshteinDistance(normalizedTarget, normalizedSpoken);
  const maxLength = Math.max(normalizedTarget.length, normalizedSpoken.length);
  return Math.max(0, 1 - distance / maxLength);
}

function getMissionDifficultyLabel(difficulty: MissionDifficulty): string {
  if (difficulty === "easy") return "쉬움";
  if (difficulty === "medium") return "보통";
  return "도전";
}

function calculateMissionScore(week: WeekNumber, difficulty: MissionDifficulty, attemptNumber: number): number {
  const baseScore = PET_MISSION_PROMPTS[week][difficulty][0].baseScore;
  const penalty = Math.max(0, attemptNumber - 1) * 2;
  return Math.max(6, baseScore - penalty);
}

function getMissionPrompt(week: WeekNumber, difficulty: MissionDifficulty, cursor = 0): MissionPrompt {
  const prompts = PET_MISSION_PROMPTS[week][difficulty];
  return prompts[cursor % prompts.length];
}

function calculateMissionScoreFromSet(
  prompts: Record<WeekNumber, Record<MissionDifficulty, MissionPrompt[]>>,
  week: WeekNumber,
  difficulty: MissionDifficulty,
  attemptNumber: number
): number {
  const baseScore = prompts[week][difficulty][0].baseScore;
  const penalty = Math.max(0, attemptNumber - 1) * 2;
  return Math.max(6, baseScore - penalty);
}

function getMissionPromptFromSet(
  prompts: Record<WeekNumber, Record<MissionDifficulty, MissionPrompt[]>>,
  week: WeekNumber,
  difficulty: MissionDifficulty,
  cursor = 0
): MissionPrompt {
  const promptList = prompts[week][difficulty];
  return promptList[cursor % promptList.length];
}

function getMissionSuccessThreshold(difficulty: MissionDifficulty): number {
  if (difficulty === "easy") return 0.62;
  if (difficulty === "medium") return 0.72;
  return 0.8;
}

function getMvpBadge(week: WeekNumber): { badge: string; title: string } {
  if (week === 1) return { badge: "🌙", title: "달빛 응원왕" };
  if (week === 2) return { badge: "🐾", title: "성장 리듬 MVP" };
  if (week === 3) return { badge: "✨", title: "점프 스타 MVP" };
  return { badge: "👑", title: "수호묘 MVP" };
}

function getIslandMvpBadge(week: WeekNumber): { badge: string; title: string } {
  if (week === 1) return { badge: "🏝️", title: "생존 MVP" };
  if (week === 2) return { badge: "🪢", title: "자원 MVP" };
  if (week === 3) return { badge: "🛶", title: "탈출 준비 MVP" };
  return { badge: "🚩", title: "출항 MVP" };
}

function getCookingMvpBadge(week: WeekNumber): { badge: string; title: string } {
  if (week === 1) return { badge: "🧀", title: "재료 MVP" };
  if (week === 2) return { badge: "🍅", title: "레시피 MVP" };
  if (week === 3) return { badge: "🔥", title: "조리 MVP" };
  return { badge: "🍕", title: "피날레 MVP" };
}

function getDrawingMvpBadge(week: WeekNumber): { badge: string; title: string } {
  if (week === 1) return { badge: "🖼️", title: "기획 MVP" };
  if (week === 2) return { badge: "✏️", title: "스케치 MVP" };
  if (week === 3) return { badge: "🎨", title: "채색 MVP" };
  return { badge: "✨", title: "피날레 데코 MVP" };
}

function clampGauge(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getIslandLeaderIcon(label: string): string {
  if (label.includes("산호")) return "🐚";
  if (label.includes("해변")) return "🌴";
  if (label.includes("암초")) return "🌊";
  if (label.includes("야자")) return "🌴";
  if (label.includes("뗏목")) return "⚓";
  if (label.includes("출항")) return "🚩";
  return "🌴";
}

function getIslandResourceIcon(label: string): string {
  if (label.includes("코코넛")) return "🥥";
  if (label.includes("목재")) return "📦";
  if (label.includes("밧줄")) return "➰";
  if (label.includes("식량")) return "🍖";
  if (label.includes("물통")) return "💧";
  if (label.includes("노")) return "🛶";
  if (label.includes("돛")) return "⛵";
  return "📦";
}

function getIslandSupportIcon(label: string): string {
  if (label.includes("그늘막")) return "⛺";
  if (label.includes("불씨")) return "🔥";
  if (label.includes("창고")) return "📦";
  if (label.includes("지도")) return "🗺️";
  if (label.includes("모닥불")) return "🔥";
  if (label.includes("도구")) return "🔧";
  if (label.includes("돛")) return "⛵";
  if (label.includes("탑승")) return "📍";
  return "📦";
}

function getPetFeedIcon(label: string): string {
  if (label.includes("참치")) return "🐟";
  if (label.includes("우유")) return "🥛";
  if (label.includes("연어")) return "🐠";
  if (label.includes("닭가슴살")) return "🍗";
  if (label.includes("간식")) return "🦴";
  if (label.includes("캔식")) return "🥫";
  if (label.includes("파우치")) return "🍲";
  if (label.includes("만찬")) return "🍽️";
  if (label.includes("사료")) return "🥣";
  return "🍖";
}

function getPetTemperatureIcon(label: string): string {
  if (label.includes("담요")) return "🧣";
  if (label.includes("햇살")) return "☀️";
  if (label.includes("쿠션")) return "🛏️";
  if (label.includes("창가")) return "🪟";
  if (label.includes("온실")) return "🏡";
  if (label.includes("조명")) return "💡";
  if (label.includes("온도막")) return "🛡️";
  return "🌡️";
}

function getPetSkillIcon(label: string): string {
  if (label.includes("깨우기")) return "⏰";
  if (label.includes("골골송")) return "🎵";
  if (label.includes("점프")) return "🪀";
  if (label.includes("리듬")) return "🎶";
  if (label.includes("별자리")) return "⭐";
  if (label.includes("점프")) return "✨";
  if (label.includes("오라")) return "🌟";
  if (label.includes("도약")) return "💫";
  return "✨";
}

function getPetBondIcon(label: string): string {
  if (label.includes("브러싱")) return "🪮";
  if (label.includes("레이저")) return "🔴";
  if (label.includes("숨숨집")) return "🏠";
  if (label.includes("낚싯대")) return "🎣";
  if (label.includes("산책")) return "🐾";
  if (label.includes("낮잠")) return "💤";
  if (label.includes("리본")) return "🎀";
  if (label.includes("포토")) return "📸";
  if (label.includes("왕관")) return "👑";
  return "💗";
}

function getPetCardIcon(label: string): string {
  if (label.includes("부스트")) return "🃏";
  if (label.includes("간식")) return "🎁";
  if (label.includes("장난감")) return "🎾";
  if (label.includes("응원")) return "📣";
  return "✨";
}

function getCookingLeaderIcon(label: string): string {
  if (label.includes("재료")) return "🧑‍🍳";
  if (label.includes("시장")) return "🛒";
  if (label.includes("소스")) return "🥫";
  if (label.includes("토핑")) return "🥓";
  if (label.includes("반죽")) return "🥣";
  if (label.includes("화덕")) return "🔥";
  if (label.includes("플레이팅")) return "🍽️";
  if (label.includes("서빙")) return "🛎️";
  return "🧑‍🍳";
}

function getCookingResourceIcon(label: string): string {
  if (label.includes("밀가루")) return "🌾";
  if (label.includes("토마토")) return "🍅";
  if (label.includes("모차렐라")) return "🧀";
  if (label.includes("치즈")) return "🧀";
  if (label.includes("오레가노")) return "🌿";
  if (label.includes("바질")) return "🌿";
  if (label.includes("페페로니")) return "🥓";
  if (label.includes("올리브")) return "🫒";
  if (label.includes("소스")) return "🥫";
  if (label.includes("토핑")) return "🍕";
  if (label.includes("허브")) return "🌿";
  if (label.includes("사이드")) return "🥗";
  if (label.includes("접시")) return "🍽️";
  return "📦";
}

function getCookingSupportIcon(label: string): string {
  if (label.includes("세척")) return "🧼";
  if (label.includes("보관")) return "🧊";
  if (label.includes("메모")) return "📝";
  if (label.includes("피드백")) return "💬";
  if (label.includes("화덕")) return "🔥";
  if (label.includes("도구")) return "🔪";
  if (label.includes("조각")) return "🔺";
  if (label.includes("테이블")) return "🪑";
  return "🛠️";
}

function getPermissionByRank(rank: number): PermissionProfile {
  if (rank === 1) {
    return {
      title: "주도자",
      description: "섬/시즌 방향 선택, 지휘, 지원 행동까지 모두 가능",
      canChooseSupport: true,
      canLeadTheme: true,
    };
  }

  if (rank <= 3) {
    return {
      title: "핵심 서포터",
      description: "자원 확보와 지원 행동을 적극적으로 수행",
      canChooseSupport: true,
      canLeadTheme: false,
    };
  }

  return {
    title: "일반 참여자",
    description: "기본 자원 확보 중심으로 참여",
    canChooseSupport: false,
    canLeadTheme: false,
  };
}

function getCookingPermissionByRank(rank: number): PermissionProfile {
  if (rank === 1) {
    return {
      title: "메인 쉐프",
      description: "메뉴 방향 선택, 핵심 조리 지시, 보조 작업까지 모두 가능",
      canChooseSupport: true,
      canLeadTheme: true,
    };
  }

  if (rank <= 3) {
    return {
      title: "도우미",
      description: "재료 준비와 조리 보조를 적극적으로 담당",
      canChooseSupport: true,
      canLeadTheme: false,
    };
  }

  return {
    title: "주방 참여자",
    description: "기본 재료 준비와 보조 작업 중심으로 참여",
    canChooseSupport: false,
    canLeadTheme: false,
  };
}

function sortPlayersByPoints(players: CoopPlayer[]): CoopPlayer[] {
  return [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.name.localeCompare(b.name);
  });
}

function getTokensForWeek(week: WeekNumber): Record<string, number> {
  if (week === 1) return { p1: 3, p2: 2, p3: 2, p4: 1, p5: 1 };
  if (week === 2) return { p1: 2, p2: 2, p3: 2, p4: 1, p5: 1 };
  if (week === 3) return { p1: 2, p2: 2, p3: 2, p4: 1, p5: 1 };
  return { p1: 3, p2: 2, p3: 2, p4: 1, p5: 1 };
}

function getLogToneClass(tone: SharedLog["tone"]): string {
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-900";
  if (tone === "cyan") return "border-sky-200 bg-sky-50 text-sky-900";
  if (tone === "orange") return "border-orange-200 bg-orange-50 text-orange-900";
  if (tone === "violet") return "border-violet-200 bg-violet-50 text-violet-900";
  return "border-emerald-200 bg-emerald-50 text-emerald-900";
}

function GaugeBar({
  label,
  value,
  tone,
  compact = false,
}: {
  label: string;
  value: number;
  tone: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-1.5"}>
      <div className={`flex items-center justify-between text-slate-600 ${compact ? "shrink-0 gap-1 text-[11px]" : "text-xs"}`}>
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className={`overflow-hidden rounded-full bg-slate-200 ${compact ? "h-2 flex-1" : "h-3"}`}>
        <div className={`h-full rounded-full transition-all duration-300 ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SeasonStepRow({
  currentWeek,
  progressWeek,
  seasonComplete,
  labels,
  className,
}: {
  currentWeek: WeekNumber;
  progressWeek: number;
  seasonComplete: boolean;
  labels: string[];
  className?: string;
}) {
  return (
    <div className={`mt-4 grid grid-cols-4 gap-1.5 sm:gap-2 ${className ?? ""}`}>
      {[1, 2, 3, 4].map((week) => {
        const unlocked = week <= progressWeek || seasonComplete;
        const current = week === currentWeek;
        const cleared = progressWeek > week || (seasonComplete && week === 4);
        return (
          <div
            key={week}
            className={`min-w-0 rounded-xl border px-1.5 py-2 sm:px-2 sm:py-2.5 ${
              current
                ? "border-emerald-300/50 bg-emerald-500/15"
                : cleared
                ? "border-cyan-300/35 bg-cyan-500/10"
                : unlocked
                ? "border-white/15 bg-white/5"
                : "border-white/10 bg-black/15 opacity-60"
            }`}
          >
            <p className="text-center text-[10px] font-semibold text-slate-800 sm:text-xs">{week}주</p>
            <p className="mt-0.5 truncate text-center text-[9px] leading-tight text-slate-500 sm:text-[10px]">{labels[week - 1]}</p>
          </div>
        );
      })}
    </div>
  );
}

function RankingPanel({
  selectedUserId,
  onSelectUser,
  actionTokens,
  players = MOCK_PLAYERS,
  missionRecordsByUser = {},
  mvpUserId,
}: {
  selectedUserId: string;
  onSelectUser: (id: string) => void;
  actionTokens: Record<string, number>;
  players?: CoopPlayer[];
  missionRecordsByUser?: Record<string, MissionRecord>;
  mvpUserId?: string | null;
}) {
  return (
    <div className="rounded-3xl border border-sky-200 bg-white/85 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-sky-500">Ranking</p>
          <h3 className="mt-1 text-lg font-bold">방 랭킹</h3>
        </div>
        <p className="text-[11px] text-slate-500">포인트</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {players.map((player, index) => {
          const rank = index + 1;
          const permission = getPermissionByRank(rank);
          const active = player.id === selectedUserId;
          const missionRecord = missionRecordsByUser[player.id];
          return (
            <button
              key={player.id}
              type="button"
              onClick={() => {
                playClick();
                onSelectUser(player.id);
              }}
              className={`rounded-2xl border px-2.5 py-2 text-left transition ${
                active
                  ? "border-emerald-300 bg-emerald-100"
                  : "border-slate-200 bg-white/90 hover:bg-sky-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sm">
                    {player.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] leading-none text-slate-500">#{rank}</p>
                    <p className="truncate text-xs font-semibold leading-tight text-slate-800">
                      {player.name}
                      {player.isMe ? " (나)" : ""}
                    </p>
                    {mvpUserId === player.id ? <p className="mt-1 text-[10px] font-semibold text-fuchsia-600">이번 주 MVP</p> : null}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-black text-emerald-600">{player.points}P</p>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[10px] leading-none text-slate-500">
                <span className="truncate">{permission.title}</span>
                <span className="shrink-0">{actionTokens[player.id] ?? 0}회</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                <span className="truncate">미션 {missionRecord?.totalScore ?? 0}점</span>
                <span className="shrink-0">성공 {missionRecord?.successes ?? 0}회</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectedUserPanel({
  selectedPlayer,
  selectedPermission,
  currentWeek,
  selectedTokens,
  selectedMissionRecord,
  isMvp = false,
  activeNotice = null,
}: {
  selectedPlayer: CoopPlayer;
  selectedPermission: PermissionProfile;
  currentWeek: WeekNumber;
  selectedTokens: number;
  selectedMissionRecord?: MissionRecord;
  isMvp?: boolean;
  activeNotice?: TeamNotice | null;
}) {
  return (
    <div className="rounded-3xl border border-fuchsia-200 bg-white/85 p-4 space-y-3 shadow-sm">
      <div>
        <p className="text-sm text-fuchsia-500">Permission</p>
        <h3 className="mt-1 text-lg font-bold">권한 요약</h3>
      </div>
      <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
        <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-1.5 py-2">
          <p className="text-fuchsia-400">권한</p>
          <p className="mt-1 truncate font-semibold text-fuchsia-700">{selectedPermission.title}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-2">
          <p className="text-slate-500">주차</p>
          <p className="mt-1 font-semibold text-slate-800">{currentWeek}주차</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-2">
          <p className="text-slate-500">행동권</p>
          <p className="mt-1 font-semibold text-emerald-600">{selectedTokens}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-2">
          <p className="text-slate-500">역할</p>
          <p className="mt-1 truncate font-semibold text-slate-800">
            {selectedPermission.canChooseSupport && selectedPermission.canLeadTheme
              ? "지원 · 주도"
              : selectedPermission.canLeadTheme
              ? "주도"
              : selectedPermission.canChooseSupport
              ? "지원"
              : "기본"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-2 py-2.5">
          <p className="text-emerald-500">포인트</p>
          <p className="mt-1 font-semibold text-emerald-700">{selectedPlayer.points}P</p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-2 py-2.5">
          <p className="text-sky-500">미션 점수</p>
          <p className="mt-1 font-semibold text-sky-700">{selectedMissionRecord?.totalScore ?? 0}점</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-2 py-2.5">
          <p className="text-amber-500">MVP</p>
          <p className="mt-1 font-semibold text-amber-700">{isMvp ? "활성" : "대기"}</p>
        </div>
      </div>
      {activeNotice ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3 text-[11px] text-violet-800">
          <p className="font-semibold">받은 응원 알림</p>
          <p className="mt-1">
            {activeNotice.fromUserName}: {activeNotice.message}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ActionSnapshot({
  currentWeek,
  selectedPermission,
  selectedTokens,
  gaugeLabel,
  gaugeValue,
  gaugeTone,
}: {
  currentWeek: WeekNumber;
  selectedPermission: PermissionProfile;
  selectedTokens: number;
  gaugeLabel: string;
  gaugeValue: number;
  gaugeTone: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-sky-200 bg-white/85 p-3 shadow-sm sm:p-4">
      <div className="grid min-w-0 grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-2xl border border-slate-200 bg-sky-50 px-2 py-3">
          <p className="text-[11px] text-slate-500">주차</p>
          <p className="mt-1 font-semibold text-slate-800">{currentWeek}주차</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-emerald-50 px-2 py-3">
          <p className="text-[11px] text-slate-500">행동권</p>
          <p className="mt-1 font-semibold text-emerald-600">{selectedTokens}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-amber-50 px-2 py-3">
          <p className="text-[11px] text-slate-500">지원</p>
          <p className="mt-1 font-semibold text-slate-800">{selectedPermission.canChooseSupport ? "가능" : "불가"}</p>
        </div>
      </div>
      <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
        <GaugeBar label={gaugeLabel} value={gaugeValue} tone={gaugeTone} compact />
      </div>
    </div>
  );
}

function CompactStorageSummary({
  items,
  accentClass,
  selectedItemId,
  onSelectItem,
}: {
  items: CollectedItem[];
  accentClass: string;
  selectedItemId?: string | null;
  onSelectItem?: (id: string) => void;
}) {
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;
  return (
    <div className="min-w-0 rounded-2xl border border-amber-200 bg-white/85 p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-sm ${accentClass}`}>Storage</p>
          <h4 className="mt-1 text-sm font-bold">이번 주 보관함</h4>
        </div>
        <p className="text-xs text-slate-500">{items.length}개</p>
      </div>
      <div className="mt-3 flex min-h-12 flex-wrap gap-2 rounded-2xl border border-dashed border-amber-200 bg-amber-50/70 p-3">
        {items.length > 0 ? (
          items.slice(0, 8).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                playClick();
                onSelectItem?.(item.id);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-2xl border bg-white text-lg transition ${
                selectedItemId === item.id ? "border-amber-400 ring-2 ring-amber-200" : "border-amber-200 hover:bg-amber-100"
              }`}
              title={`${item.label} · ${item.ownerName}`}
            >
              {item.icon}
            </button>
          ))
        ) : (
          <div className="flex min-h-6 items-center text-sm text-slate-500">아직 없음</div>
        )}
      </div>
      {selectedItem ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-white p-3 text-[11px] text-slate-700">
          <p className="font-semibold text-slate-800">{selectedItem.label}</p>
          <p className="mt-1">{selectedItem.ownerName}이(가) 보관함에 넣었어요.</p>
        </div>
      ) : items.length > 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-amber-200 bg-white/70 p-3 text-[11px] text-slate-500">
          아이템을 누르면 누가 넣었는지 볼 수 있어요.
        </div>
      ) : null}
    </div>
  );
}

function ToastStack({
  notices,
  onDismiss,
}: {
  notices: ToastNotice[];
  onDismiss: (id: string) => void;
}) {
  if (notices.length === 0) return null;

  const toneClassByType: Record<ToastNotice["tone"], string> = {
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-900",
    violet: "border-violet-200 bg-violet-50 text-violet-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  };

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3">
      {notices.map((notice) => (
        <div key={notice.id} className={`pointer-events-auto rounded-2xl border p-4 shadow-lg ${toneClassByType[notice.tone]}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{notice.title}</p>
              <p className="mt-1 text-xs opacity-80">{notice.body}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(notice.id)}
              className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-semibold"
            >
              닫기
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileBottomSheet({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-slate-900/35" />
      <div className="absolute bottom-0 left-0 right-0 max-h-[78vh] rounded-t-[28px] border border-slate-200 bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600"
          >
            닫기
          </button>
        </div>
        <div className="mt-4 max-h-[calc(78vh-5rem)] overflow-y-auto pb-4">{children}</div>
      </div>
    </div>
  );
}

function LogsPanel({
  title,
  subtitle,
  logs,
}: {
  title: string;
  subtitle: string;
  logs: SharedLog[];
}) {
  return (
    <div className="rounded-3xl border border-orange-200 bg-white/85 p-5 shadow-sm">
      <div>
        <p className="text-xs text-amber-500">{subtitle}</p>
        <h3 className="mt-1 text-lg font-bold">{title}</h3>
      </div>
      <div className="mt-4 space-y-3 max-h-[34rem] overflow-auto pr-1">
        {logs.map((log) => (
          <div key={log.id} className={`rounded-2xl border p-3 shadow-sm ${getLogToneClass(log.tone)}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-xs font-semibold leading-tight">{log.summary}</p>
              <span className="shrink-0 text-[10px] opacity-70">{log.userName}</span>
            </div>
            <p className="truncate mt-1 text-[11px] leading-tight opacity-75">{log.detail}</p>
            <p className="mt-1 text-[10px] opacity-55">{log.week === 0 ? "시즌 시작" : `${log.week}주차`}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyContributionPanel({
  title,
  logs,
  emptyText,
}: {
  title: string;
  logs: SharedLog[];
  emptyText: string;
}) {
  return (
    <div className="rounded-3xl border border-emerald-200 bg-white/85 p-5 shadow-sm">
      <div>
        <p className="text-xs text-emerald-500">My Contribution</p>
        <h3 className="mt-1 text-lg font-bold">{title}</h3>
      </div>
      <div className="mt-4 space-y-3">
        {logs.length > 0 ? (
          logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="truncate text-xs font-semibold text-emerald-800">{log.summary}</p>
              <p className="mt-1 truncate text-[11px] text-emerald-700">{log.detail}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 p-3 text-[11px] text-emerald-700">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

function MobileInfoTabs({
  activeSection,
  onChangeSection,
  selectedUserId,
  onSelectUser,
  actionTokens,
  players = MOCK_PLAYERS,
  selectedPlayer,
  selectedPermission,
  currentWeek,
  selectedTokens,
  weekLogs,
  contributionTitle,
  contributionLogs,
  contributionEmptyText,
  selectedMissionRecord,
  isMvp = false,
  activeNotice = null,
  mvpUserId,
  missionRecordsByUser = {},
  className = "lg:hidden",
}: {
  activeSection: MobileInfoSection;
  onChangeSection: (section: MobileInfoSection) => void;
  selectedUserId: string;
  onSelectUser: (id: string) => void;
  actionTokens: Record<string, number>;
  players?: CoopPlayer[];
  selectedPlayer: CoopPlayer;
  selectedPermission: PermissionProfile;
  currentWeek: WeekNumber;
  selectedTokens: number;
  weekLogs: SharedLog[];
  contributionTitle: string;
  contributionLogs: SharedLog[];
  contributionEmptyText: string;
  selectedMissionRecord?: MissionRecord;
  isMvp?: boolean;
  activeNotice?: TeamNotice | null;
  mvpUserId?: string | null;
  missionRecordsByUser?: Record<string, MissionRecord>;
  className?: string;
}) {
  const mobileTabs: Array<{ id: MobileInfoSection; label: string }> = [
    { id: "ranking", label: "랭킹" },
    { id: "selected", label: "권한" },
    { id: "logs", label: "기록" },
    { id: "my", label: "내 기여" },
  ];

  return (
    <section className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 gap-2 rounded-3xl border border-slate-200 bg-white/85 p-2 shadow-sm">
        {mobileTabs.map((tab) => {
          const active = tab.id === activeSection;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playClick();
                onChangeSection(tab.id);
              }}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active ? "bg-sky-100 text-slate-900" : "bg-slate-50 text-slate-600 hover:bg-sky-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeSection === "ranking" ? (
        <RankingPanel
          selectedUserId={selectedUserId}
          onSelectUser={onSelectUser}
          actionTokens={actionTokens}
          players={players}
          mvpUserId={mvpUserId}
          missionRecordsByUser={missionRecordsByUser}
        />
      ) : null}
      {activeSection === "selected" ? (
        <SelectedUserPanel
          selectedPlayer={selectedPlayer}
          selectedPermission={selectedPermission}
          currentWeek={currentWeek}
          selectedTokens={selectedTokens}
          selectedMissionRecord={selectedMissionRecord}
          isMvp={isMvp}
          activeNotice={activeNotice}
        />
      ) : null}
      {activeSection === "logs" ? (
        <LogsPanel title={`${currentWeek}주차 행동 기록`} subtitle="Week Action Trail" logs={weekLogs} />
      ) : null}
      {activeSection === "my" ? (
        <MyContributionPanel
          title={contributionTitle}
          logs={contributionLogs}
          emptyText={contributionEmptyText}
        />
      ) : null}
    </section>
  );
}

function CatFaceStage({
  progressWeek,
  seasonComplete,
}: {
  progressWeek: number;
  seasonComplete: boolean;
}) {
  const cheeks = progressWeek === 2 && !seasonComplete;
  const playful = progressWeek === 3 && !seasonComplete;
  const sleepy = progressWeek <= 1 && !seasonComplete;
  const sparkling = (progressWeek >= 4 && !seasonComplete) || seasonComplete;
  const catFace = seasonComplete ? "😻" : progressWeek <= 1 ? "😽" : progressWeek === 2 ? "😸" : progressWeek === 3 ? "😼" : "😺";
  const bgClass = seasonComplete
    ? "from-fuchsia-300/35 via-cyan-300/25 to-yellow-200/30"
    : progressWeek <= 1
    ? "from-emerald-300/35 via-cyan-300/20 to-fuchsia-300/25"
    : progressWeek === 2
    ? "from-amber-300/30 via-emerald-300/20 to-pink-300/20"
    : progressWeek === 3
    ? "from-cyan-300/30 via-sky-300/20 to-violet-300/20"
    : "from-indigo-300/30 via-fuchsia-300/20 to-yellow-200/20";
  const haloClass = seasonComplete
    ? "bg-gradient-to-br from-yellow-200/25 via-fuchsia-200/15 to-cyan-200/20 border-yellow-100/20"
    : "bg-emerald-200/10 border-emerald-100/15";

  return (
    <div className="relative mx-auto mt-4 flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36">
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br blur-md ${bgClass} ${seasonComplete ? "animate-pulse" : ""}`} />
      <div className={`absolute inset-4 rounded-full border ${haloClass}`} />
      {seasonComplete ? <div className="absolute inset-2 rounded-full border border-white/15 bg-white/[0.03]" /> : null}
      <span className="relative text-6xl leading-none sm:text-7xl">{catFace}</span>
      {seasonComplete ? (
        <>
          <span className="absolute left-3 top-4 text-lg text-yellow-200">✦</span>
          <span className="absolute right-3 top-5 text-lg text-cyan-100">✦</span>
          <span className="absolute left-5 bottom-5 text-base text-fuchsia-100">★</span>
          <span className="absolute right-5 bottom-5 text-base text-yellow-100">★</span>
        </>
      ) : null}
      {sleepy ? (
        <>
          <span className="absolute top-4 right-5 text-lg font-black text-sky-200 rotate-12">Zz</span>
          <span className="absolute top-8 right-1 text-sm font-bold text-sky-100 rotate-6">zz</span>
        </>
      ) : null}
      {cheeks ? (
        <>
          <span className="absolute left-7 top-[5.1rem] text-lg text-pink-300">●</span>
          <span className="absolute right-7 top-[5.1rem] text-lg text-pink-300">●</span>
        </>
      ) : null}
      {playful ? (
        <>
          <span className="absolute left-4 top-4 text-lg">🌸</span>
          <span className="absolute right-4 top-5 text-lg">🎵</span>
          <span className="absolute right-6 bottom-6 text-base">♪</span>
        </>
      ) : null}
      {sparkling ? (
        <>
          <span className="absolute left-4 top-4 text-lg text-yellow-200">✨</span>
          <span className="absolute right-4 top-6 text-base text-cyan-100">✦</span>
          <span className="absolute right-7 bottom-5 text-lg text-yellow-100">✨</span>
        </>
      ) : null}
    </div>
  );
}

function IslandSceneStage({
  progressWeek,
  seasonComplete,
  selectedIsland = "야자수 만",
}: {
  progressWeek: number;
  seasonComplete: boolean;
  selectedIsland?: string;
}) {
  const showEscape = seasonComplete;
  const showCharacters = !seasonComplete;
  const showIsland = !seasonComplete;
  const islandBadge =
    selectedIsland.includes("산호") ? "🐚" : selectedIsland.includes("해변") ? "🌴" : selectedIsland.includes("암초") ? "🌊" : "🌴";
  const gesture = seasonComplete
    ? "🙌"
    : progressWeek <= 1
    ? "🧍"
    : progressWeek === 2
    ? "🧎"
    : progressWeek === 3
    ? "🏃"
    : "🕺";
  const secondaryGesture = seasonComplete
    ? "👋"
    : progressWeek <= 1
    ? "🧍"
    : progressWeek === 2
    ? "🚶"
    : progressWeek === 3
    ? "🏊"
    : "🏄";
  const skyClass = seasonComplete
    ? "from-violet-500/45 via-sky-300/30 to-cyan-200/20"
    : progressWeek <= 1
    ? "from-sky-200/80 via-sky-300/25 to-cyan-200/10"
    : progressWeek === 2
    ? "from-orange-200/75 via-sky-300/20 to-cyan-200/10"
    : progressWeek === 3
    ? "from-orange-300/75 via-amber-200/30 to-sky-200/15"
    : "from-indigo-500/55 via-violet-400/25 to-sky-300/10";
  const seaClass = seasonComplete
    ? "from-blue-500/80 to-cyan-300/35"
    : progressWeek <= 1
    ? "from-blue-400/75 to-cyan-300/25"
    : progressWeek === 2
    ? "from-sky-500/75 to-cyan-300/30"
    : progressWeek === 3
    ? "from-indigo-500/80 to-cyan-300/30"
    : "from-indigo-700/85 to-sky-300/25";
  const sandClass = seasonComplete
    ? "from-yellow-200 to-amber-300"
    : progressWeek <= 1
    ? "from-yellow-100 to-amber-300"
    : progressWeek === 2
    ? "from-amber-100 to-yellow-300"
    : progressWeek === 3
    ? "from-orange-100 to-amber-300"
    : "from-amber-200 to-orange-300";

  return (
    <div className={`relative mx-auto mt-4 h-52 w-full max-w-[30rem] overflow-hidden rounded-[2rem] border border-sky-200/20 bg-gradient-to-b sm:h-64 ${skyClass}`}>
      <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${skyClass}`} />
      <div className="absolute left-1/2 top-8 -translate-x-1/2 text-4xl">
        {seasonComplete ? "🌈" : progressWeek <= 2 ? "☀️" : progressWeek === 3 ? "🌅" : "🌙"}
      </div>
      <div className="absolute left-8 top-16 text-2xl opacity-80">{progressWeek >= 3 ? "☁️" : "⛅"}</div>
      <div className="absolute right-8 top-12 text-xl opacity-70">{seasonComplete ? "⭐" : "🐦"}</div>
      <div className="absolute left-1/2 top-24 h-px w-72 -translate-x-1/2 bg-white/10" />
      <div className={`absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t ${seaClass}`} />
      {showIsland ? (
        <div className={`absolute left-1/2 bottom-10 h-24 w-[25rem] -translate-x-1/2 rounded-[50%] bg-gradient-to-b ${sandClass} shadow-[0_10px_40px_rgba(250,204,21,0.15)]`} />
      ) : null}

      {showIsland ? <div className="absolute left-[5%] bottom-[7.4rem] text-4xl">🌴</div> : null}
      {showIsland ? <div className="absolute left-[18%] bottom-[7.8rem] text-5xl">{islandBadge}</div> : null}
      {showIsland ? <div className="absolute right-[5%] bottom-[7.2rem] text-5xl">🌴</div> : null}

      {showCharacters ? <div className="absolute left-[43%] bottom-[6rem] text-4xl">{gesture}</div> : null}
      {showCharacters ? <div className="absolute left-[56%] bottom-[5.6rem] text-4xl">{secondaryGesture}</div> : null}
      {showEscape ? <div className="absolute left-[18%] top-[7.8rem] text-2xl opacity-80">☁️</div> : null}
      {showEscape ? <div className="absolute right-[18%] top-[8.2rem] text-2xl opacity-75">☁️</div> : null}
      {showEscape ? <div className="absolute left-1/2 top-[8.5rem] -translate-x-1/2 text-3xl">🐦</div> : null}
    </div>
  );
}

function IslandStorageTray({
  items,
}: {
  items: CollectedItem[];
}) {
  const toneClassByCategory: Record<CollectedItem["category"], string> = {
    leader: "border-cyan-300/25 bg-cyan-500/10",
    resource: "border-amber-300/25 bg-amber-500/10",
    support: "border-emerald-300/25 bg-emerald-500/10",
    feed: "border-amber-300/25 bg-amber-500/10",
    temperature: "border-orange-300/25 bg-orange-500/10",
    skill: "border-cyan-300/25 bg-cyan-500/10",
    bond: "border-fuchsia-300/25 bg-fuchsia-500/10",
    card: "border-violet-300/25 bg-violet-500/10",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-sky-200">Storage</p>
          <h4 className="text-base font-bold mt-1">이번 주 보관함</h4>
        </div>
        <p className="text-xs text-white/50">완료 시 초기화</p>
      </div>
      <div className="mt-3 min-h-20 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-3">
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-white ${toneClassByCategory[item.category]}`}
                title={item.label}
              >
                <span className="text-xl leading-none">{item.icon}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-14 items-center justify-center rounded-2xl bg-white/[0.03] text-sm text-white/55">
            아직 없음
          </div>
        )}
      </div>
    </div>
  );
}

function PizzaCookingStage({
  progressWeek,
  seasonComplete,
}: {
  progressWeek: number;
  seasonComplete: boolean;
}) {
  const showPlate = progressWeek <= 2 && !seasonComplete;
  const showTablecloth = progressWeek >= 3 || seasonComplete;
  const showDough = progressWeek === 2 && !seasonComplete;
  const showSauce = progressWeek === 2 && !seasonComplete;
  const showFinishedPizza = progressWeek >= 3 && !seasonComplete;
  const showPizzaBox = progressWeek >= 4 && !seasonComplete;
  const bgClass = seasonComplete
    ? "from-stone-900 via-rose-950/70 to-stone-950"
    : progressWeek === 1
    ? "from-stone-900 via-amber-950/45 to-stone-950"
    : progressWeek === 2
    ? "from-stone-900 via-red-950/45 to-stone-950"
    : progressWeek === 3
    ? "from-stone-900 via-orange-950/55 to-stone-950"
    : "from-stone-900 via-rose-900/60 to-stone-950";
  const glowClass = seasonComplete
    ? "from-yellow-300/15 via-rose-300/10 to-transparent"
    : progressWeek === 1
    ? "from-amber-200/10 via-yellow-200/5 to-transparent"
    : progressWeek === 2
    ? "from-red-300/12 via-orange-300/6 to-transparent"
    : progressWeek === 3
    ? "from-orange-300/14 via-amber-300/8 to-transparent"
    : "from-rose-300/16 via-orange-300/8 to-transparent";

  return (
    <div className={`relative mx-auto mt-4 h-52 w-full max-w-[30rem] overflow-hidden rounded-[2rem] border border-rose-200/15 bg-gradient-to-b sm:h-64 ${bgClass}`}>
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${glowClass}`} />
      {showPlate ? (
        <div className="absolute inset-x-6 bottom-8 h-24 rounded-[2rem] border border-amber-100/10 bg-gradient-to-b from-stone-700/30 to-stone-900/60" />
      ) : null}
      {showTablecloth ? (
        <div
          className="absolute inset-x-5 bottom-6 h-28 rounded-[1.8rem] border border-rose-100/10 shadow-[0_14px_36px_rgba(15,23,42,0.22)]"
          style={{
            backgroundColor: "rgba(255,248,240,0.88)",
            backgroundImage:
              "linear-gradient(0deg, rgba(244,63,94,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(244,63,94,0.12) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      ) : null}
      {showPlate ? (
        <div className="absolute left-1/2 bottom-10 h-28 w-64 -translate-x-1/2 rounded-full border border-white/10 bg-gradient-to-b from-slate-100/85 via-slate-200/65 to-slate-300/30 shadow-[0_16px_40px_rgba(15,23,42,0.3)]" />
      ) : null}
      {showDough ? (
        <div className="absolute left-1/2 bottom-[3.6rem] h-20 w-48 -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-100 via-yellow-200 to-amber-400 shadow-[0_10px_30px_rgba(251,191,36,0.18)]" />
      ) : null}
      {showSauce ? (
        <div className="absolute left-1/2 bottom-[4rem] h-14 w-38 -translate-x-1/2 rounded-full bg-gradient-to-b from-rose-500 to-red-700 opacity-90" />
      ) : null}
      {showFinishedPizza ? (
        <div className="absolute left-1/2 bottom-[2.7rem] -translate-x-1/2 rotate-[28deg] text-[5.8rem] leading-none drop-shadow-[0_10px_24px_rgba(15,23,42,0.35)]">
          🍕
        </div>
      ) : null}
      {showPizzaBox ? (
        <>
          <div className="absolute left-1/2 bottom-[1.05rem] h-8 w-44 -translate-x-1/2 rounded-[0.9rem] border border-amber-100/15 bg-gradient-to-b from-amber-100/70 to-orange-200/40 shadow-[0_8px_28px_rgba(251,191,36,0.22)]" />
          <div className="absolute left-1/2 bottom-[2.15rem] h-6 w-46 -translate-x-1/2 rounded-t-[1rem] rounded-b-[0.35rem] border border-amber-100/15 bg-gradient-to-b from-amber-50/55 to-orange-100/20" />
          <div className="absolute left-1/2 bottom-[2.6rem] h-10 w-48 -translate-x-1/2 rounded-full bg-amber-200/10 blur-md" />
        </>
      ) : null}

      {progressWeek === 2 && !seasonComplete ? <div className="absolute left-[12%] top-[3.7rem] text-3xl">📝</div> : null}
      {progressWeek === 2 && !seasonComplete ? <div className="absolute right-[12%] top-[3.8rem] text-3xl">🎵</div> : null}
      {progressWeek === 2 && !seasonComplete ? <div className="absolute left-1/2 top-[3.6rem] -translate-x-1/2 text-3xl">🥫</div> : null}

      {progressWeek === 3 && !seasonComplete ? <div className="absolute left-[12%] top-[3.8rem] text-3xl">⏲️</div> : null}
      {progressWeek === 3 && !seasonComplete ? <div className="absolute right-[12%] top-[3.8rem] text-3xl">🔥</div> : null}
      {progressWeek === 3 && !seasonComplete ? <div className="absolute left-[14%] bottom-[4.8rem] text-3xl">🔥</div> : null}

      {showPizzaBox ? <div className="absolute left-[18%] top-[4rem] text-[1.7rem] opacity-80">✨</div> : null}
      {showPizzaBox ? <div className="absolute right-[18%] top-[4rem] text-[1.7rem] opacity-80">✨</div> : null}
      {showPizzaBox ? <div className="absolute left-1/2 top-[4.4rem] -translate-x-1/2 text-[1.5rem] opacity-70">💫</div> : null}
      {seasonComplete ? <div className="absolute right-[11%] bottom-[2.3rem] text-3xl">🛎️</div> : null}
    </div>
  );
}

function CookingCoopGame({
  onBackToMenu,
}: {
  onBackToMenu: () => void;
}) {
  const recognitionRef = useRef<any>(null);
  const [players, setPlayers] = useState<CoopPlayer[]>(() => sortPlayersByPoints(MOCK_PLAYERS));
  const [selectedUserId, setSelectedUserId] = useState("p3");
  const [mobileInfoSection, setMobileInfoSection] = useState<MobileInfoSection>("selected");
  const [currentWeek, setCurrentWeek] = useState<WeekNumber>(1);
  const [progressWeek, setProgressWeek] = useState(1);
  const [seasonComplete, setSeasonComplete] = useState(false);
  const [weekResolved, setWeekResolved] = useState(false);
  const [weekStatusMessage, setWeekStatusMessage] = useState("완료 전: 피자 재료를 모으고 주방 역할을 나눠보세요.");
  const [chefGauge, setChefGauge] = useState(4);
  const [ingredientGauge, setIngredientGauge] = useState(4);
  const [helperGauge, setHelperGauge] = useState(0);
  const selectedPizzaPlan = "페페로니 피자";
  const [collectedItems, setCollectedItems] = useState<CollectedItem[]>([]);
  const [selectedStorageItemId, setSelectedStorageItemId] = useState<string | null>(null);
  const [actionTokens, setActionTokens] = useState<Record<string, number>>(() => getTokensForWeek(1));
  const [actionLogs, setActionLogs] = useState<SharedLog[]>(COOKING_INITIAL_LOGS);
  const [actionsTakenThisWeek, setActionsTakenThisWeek] = useState(0);
  const [surpriseCardVisible, setSurpriseCardVisible] = useState(false);
  const [bonusChoicesUnlocked, setBonusChoicesUnlocked] = useState(false);
  const [missionDifficulty, setMissionDifficulty] = useState<MissionDifficulty>("easy");
  const [missionBoard, setMissionBoard] = useState<Record<WeekNumber, Record<string, MissionRecord>>>(() => createEmptyMissionBoard());
  const [missionMessage, setMissionMessage] = useState("카드를 열고 미션을 시작해 보세요.");
  const [missionListening, setMissionListening] = useState(false);
  const [teamNotices, setTeamNotices] = useState<TeamNotice[]>([]);
  const [cheerTargetUserId, setCheerTargetUserId] = useState("p1");
  const [cheerMessage, setCheerMessage] = useState(PET_CHEER_MESSAGES[0]);
  const [toastNotices, setToastNotices] = useState<ToastNotice[]>([]);
  const [latestMissionAccuracy, setLatestMissionAccuracy] = useState<number | null>(null);
  const [mvpReward, setMvpReward] = useState<MvpRewardState | null>(null);
  const [missionPromptCursor, setMissionPromptCursor] = useState<Record<MissionDifficulty, number>>({ easy: 0, medium: 0, hard: 0 });
  const [showFinishInfo, setShowFinishInfo] = useState(false);
  const [missionBurst, setMissionBurst] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<PetMobileSheet>(null);

  const mePlayer = useMemo(() => players.find((player) => player.isMe) ?? players[2] ?? players[0], [players]);
  const selectedPlayer = useMemo(() => players.find((player) => player.id === selectedUserId) ?? players[0], [players, selectedUserId]);
  const selectedRank = useMemo(() => players.findIndex((player) => player.id === selectedPlayer.id) + 1, [players, selectedPlayer.id]);
  const selectedPermission = useMemo(() => getCookingPermissionByRank(selectedRank), [selectedRank]);
  const currentConfig = COOKING_WEEK_CONFIGS[currentWeek];
  const selectedTokens = actionTokens[selectedPlayer.id] ?? 0;
  const canUseActions = !weekResolved && !seasonComplete && selectedTokens > 0;
  const totalGauge = useMemo(() => clampGauge(chefGauge + ingredientGauge + helperGauge), [chefGauge, ingredientGauge, helperGauge]);
  const weekLogs = useMemo(() => actionLogs.filter((log) => log.week === currentWeek || log.week === 0), [actionLogs, currentWeek]);
  const myAllLogs = useMemo(() => actionLogs.filter((log) => log.userId === mePlayer.id), [actionLogs, mePlayer.id]);
  const myFinalWeekLogs = useMemo(() => actionLogs.filter((log) => log.userId === mePlayer.id && log.week === 4), [actionLogs, mePlayer.id]);
  const weekMissionRecords = missionBoard[currentWeek];
  const selectedMissionRecord = weekMissionRecords[selectedPlayer.id];
  const selectedMissionAttempts = selectedMissionRecord?.attempts ?? 0;
  const currentPrompt = getMissionPromptFromSet(COOKING_MISSION_PROMPTS, currentWeek, missionDifficulty, missionPromptCursor[missionDifficulty]);
  const activeNotice = useMemo(
    () => teamNotices.find((notice) => notice.week === currentWeek && notice.toUserId === selectedPlayer.id) ?? null,
    [currentWeek, selectedPlayer.id, teamNotices]
  );
  const topNotice = useMemo(
    () => teamNotices.find((notice) => notice.week === currentWeek && notice.toUserId === selectedPlayer.id) ?? null,
    [currentWeek, selectedPlayer.id, teamNotices]
  );
  const cheerTargets = useMemo(() => players.filter((player) => player.id !== selectedPlayer.id), [players, selectedPlayer.id]);
  const currentMvpUserId = useMemo(() => {
    const entries = Object.entries(weekMissionRecords);
    if (entries.length === 0) return null;
    entries.sort((a, b) => {
      if (b[1].totalScore !== a[1].totalScore) return b[1].totalScore - a[1].totalScore;
      if (b[1].bestScore !== a[1].bestScore) return b[1].bestScore - a[1].bestScore;
      if (a[1].attempts !== b[1].attempts) return a[1].attempts - b[1].attempts;
      const aName = players.find((player) => player.id === a[0])?.name ?? "";
      const bName = players.find((player) => player.id === b[0])?.name ?? "";
      return aName.localeCompare(bName);
    });
    return entries[0][0];
  }, [players, weekMissionRecords]);
  const currentMvpPlayer = useMemo(() => players.find((player) => player.id === currentMvpUserId) ?? null, [currentMvpUserId, players]);
  const canAttemptMission = bonusChoicesUnlocked && !seasonComplete && !weekResolved && selectedMissionAttempts < 3;
  const canResolveWeek = !weekResolved && !seasonComplete && currentMvpUserId !== null && selectedPlayer.id === currentMvpUserId;
  const currentStageLabel = seasonComplete
    ? "배달 완료"
    : progressWeek <= 1
    ? "재료 준비"
    : progressWeek === 2
    ? "레시피 설계"
    : progressWeek === 3
    ? "조리 진행"
    : "포장 준비";

  const pushToast = (title: string, body: string, tone: ToastNotice["tone"]) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToastNotices((prev) => [{ id, title, body, tone }, ...prev].slice(0, 3));
    window.setTimeout(() => setToastNotices((prev) => prev.filter((item) => item.id !== id)), 3200);
  };

  const appendPassiveLog = (tone: SharedLog["tone"], userId: string, userName: string, summary: string, detail: string) => {
    setActionLogs((prev) => [
      { id: `cooking-passive-${Date.now()}-${prev.length}`, week: currentWeek, userId, userName, tone, summary, detail },
      ...prev,
    ]);
  };

  const revealSurpriseCard = () => {
    if (surpriseCardVisible || seasonComplete || weekResolved) return;
    setSurpriseCardVisible(true);
    appendPassiveLog("violet", "system", "SYSTEM", `${currentWeek}주차에 서프라이즈 액션 카드가 등장했어요.`, "카드를 열거나 미션에 성공하면 선택지가 늘어나요.");
  };

  const storeCollectedItem = (icon: string, label: string, category: CollectedItem["category"]) => {
    const itemId = `cooking-stored-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setCollectedItems((prev) => [...prev, { id: itemId, icon, label, category, ownerId: selectedPlayer.id, ownerName: selectedPlayer.name }]);
    setSelectedStorageItemId(itemId);
  };

  const appendLog = (tone: SharedLog["tone"], summary: string, detail: string) => {
    if (actionsTakenThisWeek === 0) revealSurpriseCard();
    setActionLogs((prev) => [
      { id: `cooking-log-${Date.now()}-${prev.length}`, week: currentWeek, userId: selectedPlayer.id, userName: selectedPlayer.name, tone, summary, detail },
      ...prev,
    ]);
    setActionTokens((prev) => ({ ...prev, [selectedPlayer.id]: Math.max(0, (prev[selectedPlayer.id] ?? 0) - 1) }));
    setActionsTakenThisWeek((prev) => prev + 1);
  };

  const grantActionChoiceBoost = (userId: string) => {
    setActionTokens((prev) => ({ ...prev, [userId]: Math.max((prev[userId] ?? 0) * 2, 2) }));
  };

  const moveToNextWeek = (nextWeek: WeekNumber) => {
    setCurrentWeek(nextWeek);
    setProgressWeek(nextWeek);
    setWeekResolved(false);
    setWeekStatusMessage(`좋아요! ${nextWeek}주차로 넘어갔어요.`);
    setChefGauge(nextWeek === 2 ? 3 : nextWeek === 3 ? 3 : 2);
    setIngredientGauge(nextWeek === 2 ? 4 : nextWeek === 3 ? 3 : 2);
    setHelperGauge(0);
    setCollectedItems([]);
    setSelectedStorageItemId(null);
    setActionTokens(getTokensForWeek(nextWeek));
    setActionsTakenThisWeek(0);
    setSurpriseCardVisible(false);
    setBonusChoicesUnlocked(false);
    setMissionDifficulty("easy");
    setMissionMessage("카드를 열고 미션을 시작해 보세요.");
    setLatestMissionAccuracy(null);
    setMissionListening(false);
    setCheerMessage(PET_CHEER_MESSAGES[0]);
    setMvpReward(null);
    setMissionPromptCursor({ easy: 0, medium: 0, hard: 0 });
    setShowFinishInfo(false);
    setMissionBurst(false);
  };

  const resetGame = () => {
    recognitionRef.current?.stop();
    playClick();
    setPlayers(sortPlayersByPoints(MOCK_PLAYERS));
    setSelectedUserId("p3");
    setCurrentWeek(1);
    setProgressWeek(1);
    setSeasonComplete(false);
    setWeekResolved(false);
    setWeekStatusMessage("완료 전: 피자 재료를 모으고 주방 역할을 나눠보세요.");
    setChefGauge(4);
    setIngredientGauge(4);
    setHelperGauge(0);
    setCollectedItems([]);
    setSelectedStorageItemId(null);
    setActionTokens(getTokensForWeek(1));
    setActionLogs(COOKING_INITIAL_LOGS);
    setMobileInfoSection("selected");
    setActionsTakenThisWeek(0);
    setSurpriseCardVisible(false);
    setBonusChoicesUnlocked(false);
    setMissionDifficulty("easy");
    setMissionBoard(createEmptyMissionBoard());
    setMissionMessage("카드를 열고 미션을 시작해 보세요.");
    setMissionListening(false);
    setTeamNotices([]);
    setCheerTargetUserId("p1");
    setCheerMessage(PET_CHEER_MESSAGES[0]);
    setToastNotices([]);
    setLatestMissionAccuracy(null);
    setMvpReward(null);
    setMissionPromptCursor({ easy: 0, medium: 0, hard: 0 });
    setShowFinishInfo(false);
    setMissionBurst(false);
    setMobileSheet(null);
  };

  const handleMissionFailure = (detail: string, accuracy = 0) => {
    setMissionBoard((prev) => {
      const currentRecord = prev[currentWeek][selectedPlayer.id] ?? { attempts: 0, successes: 0, totalScore: 0, bestScore: 0 };
      return {
        ...prev,
        [currentWeek]: {
          ...prev[currentWeek],
          [selectedPlayer.id]: { ...currentRecord, attempts: currentRecord.attempts + 1, lastAccuracy: accuracy },
        },
      };
    });
    appendPassiveLog("orange", selectedPlayer.id, selectedPlayer.name, `${selectedPlayer.name}님이 음성 미션을 다시 시도해요.`, detail);
    setMissionMessage(detail);
    setLatestMissionAccuracy(accuracy);
    setMissionPromptCursor((prev) => ({ ...prev, [missionDifficulty]: prev[missionDifficulty] + 1 }));
  };

  const handleMissionSuccess = (spokenText: string, accuracy: number) => {
    const attemptNumber = selectedMissionAttempts + 1;
    const score = calculateMissionScoreFromSet(COOKING_MISSION_PROMPTS, currentWeek, missionDifficulty, attemptNumber);
    const alreadyRewarded = selectedMissionRecord?.rewardClaimed ?? false;
    setMissionBoard((prev) => {
      const currentRecord = prev[currentWeek][selectedPlayer.id] ?? { attempts: 0, successes: 0, totalScore: 0, bestScore: 0 };
      const nextBestScore = Math.max(currentRecord.bestScore, score);
      return {
        ...prev,
        [currentWeek]: {
          ...prev[currentWeek],
          [selectedPlayer.id]: {
            attempts: currentRecord.attempts + 1,
            successes: currentRecord.successes + 1,
            totalScore: currentRecord.totalScore + score,
            bestScore: nextBestScore,
            bestDifficulty: score >= nextBestScore ? missionDifficulty : currentRecord.bestDifficulty ?? missionDifficulty,
            rewardClaimed: true,
            lastAccuracy: accuracy,
          },
        },
      };
    });
    setPlayers((prev) => sortPlayersByPoints(prev.map((player) => (player.id === selectedPlayer.id ? { ...player, points: player.points + score } : player))));
    setBonusChoicesUnlocked(true);
    if (!alreadyRewarded) grantActionChoiceBoost(selectedPlayer.id);
    storeCollectedItem("🎤", `${getMissionDifficultyLabel(missionDifficulty)} 음성 배지`, "card");
    appendPassiveLog("emerald", selectedPlayer.id, selectedPlayer.name, `${selectedPlayer.name}님이 음성 미션에 성공했어요.`, `난이도 ${getMissionDifficultyLabel(missionDifficulty)}, +${score}P, 인식 문장: "${spokenText}".`);
    setMissionMessage("");
    setLatestMissionAccuracy(accuracy);
    setMissionPromptCursor((prev) => ({ ...prev, [missionDifficulty]: prev[missionDifficulty] + 1 }));
    setMissionBurst(true);
    window.setTimeout(() => setMissionBurst(false), 1800);
    pushToast("음성 미션 성공", `${selectedPlayer.name}이(가) ${score}점을 획득했어요.`, "emerald");
  };

  const startVoiceMission = () => {
    if (!canAttemptMission) {
      setMissionMessage("이 학생은 이번 주 음성 미션을 이미 3번 시도했어요.");
      return;
    }
    if (weekResolved || seasonComplete) return;
    const recognitionWindow = window as Window & { SpeechRecognition?: BrowserSpeechRecognitionCtor; webkitSpeechRecognition?: BrowserSpeechRecognitionCtor };
    const SpeechRecognitionCtor = recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setMissionMessage("이 브라우저에서는 음성 인식을 지원하지 않아요.");
      return;
    }
    recognitionRef.current?.stop();
    playClick();
    setMissionListening(true);
    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const spokenText = Array.from(event.results as ArrayLike<any>).map((result: any) => result[0]?.transcript ?? "").join(" ").trim();
      const accuracy = getSpeechMatchScore(currentPrompt.text, spokenText);
      const successThreshold = getMissionSuccessThreshold(missionDifficulty);
      if (accuracy >= successThreshold) handleMissionSuccess(spokenText, accuracy);
      else handleMissionFailure(`정확도 ${(accuracy * 100).toFixed(0)}% · 다시 도전`, accuracy);
    };
    recognition.onerror = () => handleMissionFailure("음성 인식 오류", 0);
    recognition.onend = () => setMissionListening(false);
    recognition.start();
  };

  const openSurpriseCard = () => {
    if (!surpriseCardVisible) return;
    playClick();
    setBonusChoicesUnlocked(true);
    setMissionMessage("");
    setWeekStatusMessage("서프라이즈 카드가 열렸어요.");
    appendPassiveLog("violet", "system", "SYSTEM", "보너스 액션 카드가 열렸어요.", "이번 주 보너스 행동이 추가로 개방됐어요.");
  };

  const handleSendCheer = () => {
    const targetPlayer = players.find((player) => player.id === cheerTargetUserId);
    if (!targetPlayer || targetPlayer.id === selectedPlayer.id || !selectedPermission.canLeadTheme || !canUseActions) return;
    playClick();
    const notice: TeamNotice = {
      id: `cooking-cheer-${Date.now()}`,
      week: currentWeek,
      fromUserId: selectedPlayer.id,
      fromUserName: selectedPlayer.name,
      toUserId: targetPlayer.id,
      toUserName: targetPlayer.name,
      message: cheerMessage,
      createdAt: Date.now(),
    };
    setTeamNotices((prev) => [notice, ...prev.filter((item) => !(item.week === currentWeek && item.toUserId === targetPlayer.id))]);
    setActionTokens((prev) => ({ ...prev, [targetPlayer.id]: (prev[targetPlayer.id] ?? 0) + 1 }));
    setSelectedUserId(targetPlayer.id);
    appendLog("violet", `${targetPlayer.name}에게 응원을 보냈어요.`, cheerMessage);
    pushToast("응원 알림 전송", `${targetPlayer.name}에게 "${cheerMessage}" 알림을 보냈어요.`, "cyan");
  };

  const handleResolveWeek = () => {
    if (weekResolved || seasonComplete) return;
    if (!currentMvpUserId) {
      setWeekStatusMessage("음성 미션으로 MVP를 먼저 정해 주세요.");
      return;
    }
    if (selectedPlayer.id !== currentMvpUserId) {
      setWeekStatusMessage(`이번 주 완료 권한은 MVP ${currentMvpPlayer?.name ?? ""}에게만 있어요.`);
      return;
    }
    playClick();
    const success = totalGauge >= currentConfig.threshold;
    setActionLogs((prev) => [
      {
        id: `cooking-system-${Date.now()}`,
        week: currentWeek,
        userId: "system",
        userName: "SYSTEM",
        tone: success ? "emerald" : "orange",
        summary: success ? currentConfig.successSummary : currentConfig.failSummary,
        detail: success ? `${currentConfig.successDetail} 이번 주 MVP는 ${currentMvpPlayer?.name ?? selectedPlayer.name}였어요.` : currentConfig.failDetail,
      },
      ...prev,
    ]);
    setCollectedItems([]);
    setSelectedStorageItemId(null);
    if (!success) {
      setActionTokens(getTokensForWeek(currentWeek));
      setWeekStatusMessage(`${currentWeek}주차 준비가 부족해 행동권을 재충전했어요.`);
      return;
    }
    setWeekResolved(true);
    const rewardMeta = getCookingMvpBadge(currentWeek);
    setMvpReward({ week: currentWeek, userId: currentMvpPlayer?.id ?? selectedPlayer.id, userName: currentMvpPlayer?.name ?? selectedPlayer.name, badge: rewardMeta.badge, title: rewardMeta.title });
    pushToast("이번 주 MVP 확정", `${currentMvpPlayer?.name ?? selectedPlayer.name}이(가) ${rewardMeta.title} 보상을 받았어요.`, "violet");
    setCollectedItems((prev) => [
      ...prev,
      { id: `cooking-mvp-${Date.now()}`, icon: rewardMeta.badge, label: `${rewardMeta.title} 배지`, category: "card", ownerId: currentMvpPlayer?.id ?? selectedPlayer.id, ownerName: currentMvpPlayer?.name ?? selectedPlayer.name },
    ]);
    if (currentWeek === 4) {
      setSeasonComplete(true);
      setProgressWeek(5);
      setWeekStatusMessage(`클리어: 피자 요리 완성, 마지막 MVP는 ${currentMvpPlayer?.name ?? selectedPlayer.name}였어요.`);
      return;
    }
    window.setTimeout(() => moveToNextWeek((currentWeek + 1) as WeekNumber), 240);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <ToastStack notices={toastNotices} onDismiss={(id) => setToastNotices((prev) => prev.filter((item) => item.id !== id))} />
      {topNotice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4">
          <div className="w-full max-w-sm rounded-[28px] border border-cyan-200 bg-white p-5 shadow-2xl">
            <p className="text-xs font-semibold text-cyan-700">응원 알림</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{topNotice.message}</p>
            <p className="mt-2 text-sm text-slate-500">{topNotice.fromUserName}이(가) 보냈어요.</p>
            <button type="button" onClick={() => setTeamNotices((prev) => prev.filter((notice) => notice.id !== topNotice.id))} className="mt-4 w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white">
              닫기
            </button>
          </div>
        </div>
      ) : null}
      <section className="rounded-3xl border border-rose-200 bg-white/80 p-3 shadow-sm md:p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black sm:text-lg md:text-xl">협력 게임</h2>
            <p className="text-xs text-slate-500">피자</p>
          </div>
          <button type="button" onClick={() => { playClick(); onBackToMenu(); }} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100">
            게임 선택으로
          </button>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="order-1 min-w-0 rounded-3xl border border-rose-200 bg-white/80 p-4 shadow-sm sm:p-5">
          <div className="relative pr-16">
            <div><p className="text-sm text-rose-500">Progress</p></div>
            <button type="button" onClick={resetGame} className="absolute right-0 top-0 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] text-rose-700 hover:bg-rose-100">초기화</button>
          </div>
          <div className="mt-5 grid min-w-0 gap-4">
            <div className="relative overflow-hidden rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-100 via-orange-50 to-amber-50 p-4 text-center sm:p-6">
              <PizzaCookingStage progressWeek={progressWeek} seasonComplete={seasonComplete} />
              {mvpReward ? <div className="pointer-events-none absolute left-6 top-6 text-3xl animate-bounce">{mvpReward.badge}</div> : null}
              <p className="mt-3 text-xs font-bold text-rose-800 sm:text-sm">{currentStageLabel} · {selectedPizzaPlan}</p>
              {mvpReward ? (
                <div className="mt-3 rounded-2xl border border-yellow-200 bg-yellow-50/90 px-3 py-3 text-left text-[11px] text-yellow-900">
                  <p className="font-semibold">{mvpReward.badge} {mvpReward.userName} 보상 지급</p>
                  <p className="mt-1">{mvpReward.title} 배지가 이번 주 보관함에 추가됐어요.</p>
                </div>
              ) : null}
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <div className="min-w-0 rounded-2xl border border-rose-200 bg-white/85 p-3 shadow-sm sm:p-4">
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs sm:gap-2 sm:text-sm">
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 px-2 py-3"><p className="text-[10px] text-slate-500">주차</p><p className="mt-1 font-semibold text-slate-800">{currentWeek}주차</p></div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-2 py-3"><p className="text-[10px] text-slate-500">단계</p><p className="mt-1 truncate font-semibold text-slate-800">{currentConfig.phaseLabel}</p></div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-2 py-3"><p className="text-[10px] text-slate-500">완성</p><p className="mt-1 font-semibold text-slate-800">{totalGauge}%</p></div>
                  <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 px-2 py-3"><p className="text-[10px] text-slate-500">MVP</p><p className="mt-1 font-semibold text-slate-800">{currentMvpPlayer?.name ?? "대기"}</p></div>
                </div>
                <div className="mt-4 space-y-2">
                  <GaugeBar label="요리 완성도" value={totalGauge} tone="bg-gradient-to-r from-rose-300 via-amber-300 to-emerald-300" />
                  <GaugeBar label="쉐프" value={chefGauge} tone="bg-gradient-to-r from-rose-300 to-orange-300" compact />
                  <GaugeBar label="재료" value={ingredientGauge} tone="bg-gradient-to-r from-amber-300 to-yellow-300" compact />
                  <GaugeBar label="보조" value={helperGauge} tone="bg-gradient-to-r from-emerald-300 to-lime-300" compact />
                </div>
              </div>
              <CompactStorageSummary items={collectedItems} accentClass="text-rose-500" selectedItemId={selectedStorageItemId} onSelectItem={setSelectedStorageItemId} />
            </div>
          </div>
          <SeasonStepRow currentWeek={currentWeek} progressWeek={progressWeek} seasonComplete={seasonComplete} labels={["재료", "레시피", "조리", "포장"]} />
        </div>

        <div className="order-2 min-w-0 rounded-3xl border border-rose-200 bg-white/80 p-4 shadow-sm space-y-5 sm:p-5">
          <div>
            <p className="text-sm text-rose-500">Snapshot + Action</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold sm:text-xl">{currentWeek}주차 선택하기</h3>
              <button type="button" onClick={() => setShowFinishInfo((prev) => !prev)} className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-700">완료 조건</button>
            </div>
            {showFinishInfo ? <p className="mt-2 text-[11px] text-slate-500">이번 주 MVP: {currentMvpPlayer?.name ?? "아직 없음"} / 완료 버튼은 MVP 선택 시에만 활성화돼요.</p> : null}
          </div>

          <div className="grid grid-cols-3 gap-2 md:hidden">
            <button type="button" onClick={() => setMobileSheet("actions")} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs font-semibold text-rose-700">액션 열기</button>
            <button type="button" onClick={() => setMobileSheet("info")} className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3 text-xs font-semibold text-sky-700">정보 보기</button>
            <button type="button" onClick={handleResolveWeek} disabled={!canResolveWeek} className="rounded-2xl bg-rose-400 px-3 py-3 text-xs font-semibold text-white disabled:opacity-50">완료</button>
          </div>

          <div className="hidden md:block space-y-5">
            <div className={`relative overflow-hidden rounded-[28px] border p-4 shadow-sm transition-all ${missionBurst ? "border-fuchsia-400 bg-gradient-to-br from-yellow-100 via-fuchsia-100 to-cyan-100" : "border-violet-200 bg-violet-50/70"}`}>
              {!bonusChoicesUnlocked ? (
                <button type="button" onClick={openSurpriseCard} disabled={!surpriseCardVisible} className={`mx-auto flex min-h-44 w-full max-w-sm flex-col items-center justify-center rounded-[24px] border text-center ${surpriseCardVisible ? "border-violet-300 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg" : "border-violet-200 bg-violet-100/70 text-violet-400 opacity-70"}`}>
                  <span className="text-4xl">🃏</span><p className="mt-3 text-base font-black">서프라이즈 카드</p>
                </button>
              ) : null}
              {bonusChoicesUnlocked && selectedMissionAttempts < 3 ? (
                <div className="mx-auto max-w-sm rounded-[24px] border border-violet-300 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 p-4 text-white shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-semibold text-white/80">미션 카드</p><p className="mt-1 text-sm font-bold">{currentPrompt.text}</p></div>
                    <div className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">{getMissionDifficultyLabel(missionDifficulty)} / {Math.max(0, 3 - selectedMissionAttempts)}회</div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {(["easy", "medium", "hard"] as MissionDifficulty[]).map((difficulty) => (
                      <button key={difficulty} type="button" onClick={() => setMissionDifficulty(difficulty)} className={`rounded-2xl border px-3 py-2 text-left text-xs ${missionDifficulty === difficulty ? "border-white bg-white text-violet-800" : "border-white/25 bg-white/10 text-white"}`}>
                        <p className="font-semibold">{getMissionDifficultyLabel(difficulty)}</p>
                        <p className="mt-1 truncate opacity-80">{getMissionPromptFromSet(COOKING_MISSION_PROMPTS, currentWeek, difficulty, missionPromptCursor[difficulty]).text}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={startVoiceMission} disabled={!canAttemptMission || missionListening || weekResolved || seasonComplete} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-violet-700 disabled:opacity-50">{missionListening ? "듣는 중..." : "미션 시작"}</button>
                    <div className="rounded-xl bg-white/15 px-3 py-2 text-[11px]">점수 {selectedMissionRecord?.totalScore ?? 0}</div>
                    <div className="rounded-xl bg-white/15 px-3 py-2 text-[11px]">정확도 {((latestMissionAccuracy ?? selectedMissionRecord?.lastAccuracy ?? 0) * 100).toFixed(0)}%</div>
                  </div>
                </div>
              ) : null}
              {bonusChoicesUnlocked && selectedMissionAttempts >= 3 ? <div className="mx-auto flex min-h-44 w-full max-w-sm flex-col items-center justify-center rounded-[24px] border border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 text-center text-slate-600 shadow-inner"><span className="text-4xl">🃏</span><p className="mt-3 text-base font-black">미션 완료</p><p className="mt-1 text-xs">카드 사용 종료</p></div> : null}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">1. 메인 쉐프 선택</p>
              <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
                {currentConfig.leaderOptions.map((option) => (
                  <button key={option.id} type="button" onClick={() => { if (!canUseActions || !selectedPermission.canLeadTheme) return; setChefGauge((prev) => clampGauge(prev + Math.max(4, Math.min(9, Math.round(option.delta / 2.6))))); storeCollectedItem(getCookingLeaderIcon(option.label), option.label, "leader"); appendLog("cyan", `${currentWeek}주차에 ${option.label}을(를) 지시했어요.`, option.detail); }} disabled={!canUseActions || !selectedPermission.canLeadTheme} className="min-w-0 rounded-2xl border border-rose-200 bg-rose-50 p-2.5 text-left disabled:opacity-40 sm:p-3">
                    <p className="break-keep text-sm font-semibold text-rose-700">{option.label}</p><p className="mt-2 text-xs text-rose-500">쉐프 +{Math.max(4, Math.min(9, Math.round(option.delta / 2.6)))}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">2. 재료 준비</p>
              <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
                {currentConfig.resourceOptions.map((option) => (
                  <button key={option.id} type="button" onClick={() => { if (!canUseActions) return; setIngredientGauge((prev) => clampGauge(prev + Math.max(4, Math.min(9, Math.round(option.delta / 2.6))))); storeCollectedItem(getCookingResourceIcon(option.label), option.label, "resource"); appendLog("amber", `${currentWeek}주차에 ${option.label}을(를) 준비했어요.`, option.detail); }} disabled={!canUseActions} className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50 p-2.5 text-left disabled:opacity-40 sm:p-3">
                    <p className="break-keep text-sm font-semibold text-amber-700">{option.label}</p><p className="mt-2 text-xs text-amber-600">재료 +{Math.max(4, Math.min(9, Math.round(option.delta / 2.6)))}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">3. 조리 보조</p>
              <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
                {currentConfig.supportOptions.map((option) => (
                  <button key={option.id} type="button" onClick={() => { if (!canUseActions || !selectedPermission.canChooseSupport) return; setHelperGauge((prev) => clampGauge(prev + Math.max(4, Math.min(9, Math.round(option.delta / 2.6))))); storeCollectedItem(getCookingSupportIcon(option.label), option.label, "support"); appendLog("emerald", `${currentWeek}주차에 ${option.label}을(를) 도왔어요.`, option.detail); }} disabled={!canUseActions || !selectedPermission.canChooseSupport} className="min-w-0 rounded-2xl border border-emerald-200 bg-emerald-50 p-2.5 text-left disabled:opacity-40 sm:p-3">
                    <p className="break-keep text-sm font-semibold text-emerald-700">{option.label}</p><p className="mt-2 text-xs text-emerald-600">보조 +{Math.max(4, Math.min(9, Math.round(option.delta / 2.6)))}</p>
                  </button>
                ))}
              </div>
            </div>
            {bonusChoicesUnlocked ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-800">4. 보너스 카드 행동</p>
                <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                  {COOKING_SURPRISE_OPTIONS[currentWeek].map((option) => (
                    <button key={option.id} type="button" onClick={() => { if (!canUseActions) return; setHelperGauge((prev) => clampGauge(prev + option.delta)); storeCollectedItem(getPetCardIcon(option.label), option.label, "card"); appendLog("violet", `${currentWeek}주차 보너스 카드 ${option.label}을(를) 사용했어요.`, option.detail); }} disabled={!canUseActions} className="min-w-0 rounded-2xl border border-violet-200 bg-violet-50 p-2.5 text-left disabled:opacity-40 sm:p-3"><p className="break-keep text-sm font-semibold text-violet-700">{option.label}</p><p className="mt-2 text-xs text-violet-600">보너스 +{option.delta}</p></button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 opacity-100">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm font-semibold text-cyan-700">응원 호출</p><p className="mt-1 text-xs text-cyan-600">주도자는 특정 팀원에게 알림을 보내고 오늘 미션 수행을 독려할 수 있어요.</p></div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-cyan-700">{selectedPermission.canLeadTheme ? "리더 가능" : "리더 전용"}</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[0.9fr_1.3fr_auto]">
                <select value={cheerTargetUserId} onChange={(event) => setCheerTargetUserId(event.target.value)} className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700" disabled={!selectedPermission.canLeadTheme}>
                  {cheerTargets.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                </select>
                <select value={cheerMessage} onChange={(event) => setCheerMessage(event.target.value)} className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700" disabled={!selectedPermission.canLeadTheme}>
                  {PET_CHEER_MESSAGES.map((message) => <option key={message} value={message}>{message}</option>)}
                </select>
                <button type="button" onClick={handleSendCheer} disabled={!selectedPermission.canLeadTheme || !canUseActions} className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">응원 보내기</button>
              </div>
            </div>
            <button type="button" onClick={handleResolveWeek} disabled={!canResolveWeek} className="w-full rounded-2xl bg-rose-400 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{currentWeek}주차 완료하기 {currentMvpPlayer ? `(${currentMvpPlayer.name} 전용)` : ""}</button>
          </div>
        </div>
      </section>

      <MobileInfoTabs activeSection={mobileInfoSection} onChangeSection={setMobileInfoSection} selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} actionTokens={actionTokens} players={players} selectedPlayer={selectedPlayer} selectedPermission={selectedPermission} currentWeek={currentWeek} selectedTokens={selectedTokens} weekLogs={weekLogs} contributionTitle="내 기여 모아보기" contributionLogs={seasonComplete ? myFinalWeekLogs : myAllLogs.slice(0, 4)} contributionEmptyText={seasonComplete ? `4주차에 내가 남긴 행동이 아직 없어요. 마지막 주에는 ${mePlayer.name}를 선택해 요리 마무리 기여를 남겨보세요.` : `아직 내 행동 기록이 없어요. 랭킹에서 ${mePlayer.name}를 선택한 뒤 이번 주 행동을 남겨보세요.`} selectedMissionRecord={selectedMissionRecord} isMvp={selectedPlayer.id === currentMvpUserId} activeNotice={activeNotice} mvpUserId={currentMvpUserId} missionRecordsByUser={weekMissionRecords} className="hidden md:block lg:hidden" />

      <MobileBottomSheet title={mobileSheet === "actions" ? "빠른 액션" : "빠른 정보"} open={mobileSheet !== null} onClose={() => setMobileSheet(null)}>
        {mobileSheet === "actions" ? (
          <div className="space-y-4">
            <div className={`relative overflow-hidden rounded-[24px] border p-4 shadow-sm ${missionBurst ? "border-fuchsia-400 bg-gradient-to-br from-yellow-100 via-fuchsia-100 to-cyan-100" : "border-violet-200 bg-violet-50/70"}`}>
              {!bonusChoicesUnlocked ? (
                <button type="button" onClick={openSurpriseCard} disabled={!surpriseCardVisible} className={`flex min-h-32 w-full flex-col items-center justify-center rounded-[20px] border text-center ${surpriseCardVisible ? "border-violet-300 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white" : "border-violet-200 bg-violet-100/70 text-violet-400 opacity-70"}`}>
                  <span className="text-3xl">🃏</span><p className="mt-2 text-sm font-black">서프라이즈 카드</p>
                </button>
              ) : null}
              {bonusChoicesUnlocked && selectedMissionAttempts < 3 ? (
                <div className="rounded-[20px] border border-violet-300 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 p-4 text-white shadow-lg">
                  <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-semibold text-white/80">미션 카드</p><p className="mt-1 text-sm font-bold">{currentPrompt.text}</p></div><span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">{Math.max(0, 3 - selectedMissionAttempts)}회</span></div>
                  <div className="mt-3 grid grid-cols-3 gap-2">{(["easy", "medium", "hard"] as MissionDifficulty[]).map((difficulty) => <button key={difficulty} type="button" onClick={() => setMissionDifficulty(difficulty)} className={`rounded-2xl border px-2 py-2 text-[11px] font-semibold ${missionDifficulty === difficulty ? "border-white bg-white text-violet-800" : "border-white/25 bg-white/10 text-white"}`}>{getMissionDifficultyLabel(difficulty)}</button>)}</div>
                  <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={startVoiceMission} disabled={!canAttemptMission || missionListening || weekResolved || seasonComplete} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-violet-700 disabled:opacity-50">{missionListening ? "듣는 중..." : "미션 시작"}</button><div className="rounded-xl bg-white/15 px-3 py-2 text-[11px]">점수 {selectedMissionRecord?.totalScore ?? 0}</div></div>
                </div>
              ) : null}
              {bonusChoicesUnlocked && selectedMissionAttempts >= 3 ? <div className="flex min-h-32 w-full flex-col items-center justify-center rounded-[20px] border border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 text-center text-slate-600 shadow-inner"><span className="text-3xl">🃏</span><p className="mt-2 text-sm font-black">미션 완료</p><p className="mt-1 text-[11px]">카드 사용 종료</p></div> : null}
            </div>
            <div className="space-y-3"><p className="text-sm font-semibold text-slate-800">쉐프 / 재료 / 보조</p><div className="grid grid-cols-2 gap-2">
              {[...currentConfig.leaderOptions, ...currentConfig.resourceOptions, ...currentConfig.supportOptions].map((option) => {
                const isLeader = currentConfig.leaderOptions.some((item) => item.id === option.id);
                const isSupport = currentConfig.supportOptions.some((item) => item.id === option.id);
                const blocked = isLeader ? !selectedPermission.canLeadTheme || !canUseActions : isSupport ? !selectedPermission.canChooseSupport || !canUseActions : !canUseActions;
                const delta = Math.max(4, Math.min(9, Math.round(option.delta / 2.6)));
                return (
                  <button key={option.id} type="button" onClick={() => { if (blocked) return; if (isLeader) { setChefGauge((prev) => clampGauge(prev + delta)); storeCollectedItem(getCookingLeaderIcon(option.label), option.label, "leader"); appendLog("cyan", `${currentWeek}주차에 ${option.label}을(를) 지시했어요.`, option.detail); return; } if (isSupport) { setHelperGauge((prev) => clampGauge(prev + delta)); storeCollectedItem(getCookingSupportIcon(option.label), option.label, "support"); appendLog("emerald", `${currentWeek}주차에 ${option.label}을(를) 도왔어요.`, option.detail); return; } setIngredientGauge((prev) => clampGauge(prev + delta)); storeCollectedItem(getCookingResourceIcon(option.label), option.label, "resource"); appendLog("amber", `${currentWeek}주차에 ${option.label}을(를) 준비했어요.`, option.detail); }} disabled={blocked} className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-left text-xs disabled:opacity-40"><p className="font-semibold text-slate-700">{option.label}</p><p className="mt-1 text-[11px] text-slate-500">+{delta}</p></button>
                );
              })}
            </div></div>
            {bonusChoicesUnlocked ? <div className="space-y-3"><p className="text-sm font-semibold text-slate-800">보너스</p><div className="grid grid-cols-2 gap-2">{COOKING_SURPRISE_OPTIONS[currentWeek].map((option) => <button key={option.id} type="button" onClick={() => { if (!canUseActions) return; setHelperGauge((prev) => clampGauge(prev + option.delta)); storeCollectedItem(getPetCardIcon(option.label), option.label, "card"); appendLog("violet", `${currentWeek}주차 보너스 카드 ${option.label}을(를) 사용했어요.`, option.detail); }} disabled={!canUseActions} className="rounded-2xl border border-violet-200 bg-violet-50 p-2.5 text-left text-xs disabled:opacity-40"><p className="font-semibold text-violet-700">{option.label}</p><p className="mt-1 text-[11px] text-violet-600">+{option.delta}</p></button>)}</div></div> : null}
            <div className="space-y-3"><p className="text-sm font-semibold text-slate-800">응원</p><div className="grid gap-2"><select value={cheerTargetUserId} onChange={(event) => setCheerTargetUserId(event.target.value)} className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700" disabled={!selectedPermission.canLeadTheme}>{cheerTargets.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><select value={cheerMessage} onChange={(event) => setCheerMessage(event.target.value)} className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700" disabled={!selectedPermission.canLeadTheme}>{PET_CHEER_MESSAGES.map((message) => <option key={message} value={message}>{message}</option>)}</select><button type="button" onClick={handleSendCheer} disabled={!selectedPermission.canLeadTheme || !canUseActions} className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">응원 보내기</button></div></div>
          </div>
        ) : (
          <MobileInfoTabs activeSection={mobileInfoSection} onChangeSection={setMobileInfoSection} selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} actionTokens={actionTokens} players={players} selectedPlayer={selectedPlayer} selectedPermission={selectedPermission} currentWeek={currentWeek} selectedTokens={selectedTokens} weekLogs={weekLogs} contributionTitle="내 기여 모아보기" contributionLogs={seasonComplete ? myFinalWeekLogs : myAllLogs.slice(0, 4)} contributionEmptyText={seasonComplete ? `4주차에 내가 남긴 행동이 아직 없어요. 마지막 주에는 ${mePlayer.name}를 선택해 요리 마무리 기여를 남겨보세요.` : `아직 내 행동 기록이 없어요. 랭킹에서 ${mePlayer.name}를 선택한 뒤 이번 주 행동을 남겨보세요.`} selectedMissionRecord={selectedMissionRecord} isMvp={selectedPlayer.id === currentMvpUserId} activeNotice={activeNotice} mvpUserId={currentMvpUserId} missionRecordsByUser={weekMissionRecords} className="block" />
        )}
      </MobileBottomSheet>

      <section className="hidden gap-4 lg:grid lg:grid-cols-[1.2fr_0.8fr]">
        <RankingPanel selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} actionTokens={actionTokens} players={players} mvpUserId={currentMvpUserId} missionRecordsByUser={weekMissionRecords} />
        <SelectedUserPanel selectedPlayer={selectedPlayer} selectedPermission={selectedPermission} currentWeek={currentWeek} selectedTokens={selectedTokens} selectedMissionRecord={selectedMissionRecord} isMvp={selectedPlayer.id === currentMvpUserId} activeNotice={activeNotice} />
      </section>

      <section className="hidden gap-4 xl:grid xl:grid-cols-[1.1fr_0.9fr]">
        <LogsPanel title={`${currentWeek}주차 행동 기록`} subtitle="Week Action Trail" logs={weekLogs} />
        <MyContributionPanel title="내 기여 모아보기" logs={seasonComplete ? myFinalWeekLogs : myAllLogs.slice(0, 4)} emptyText={seasonComplete ? `4주차에 내가 남긴 행동이 아직 없어요. 마지막 주에는 ${mePlayer.name}를 선택해 요리 마무리 기여를 남겨보세요.` : `아직 내 행동 기록이 없어요. 랭킹에서 ${mePlayer.name}를 선택한 뒤 이번 주 행동을 남겨보세요.`} />
      </section>
    </main>
  );
}

function CoopMenu({
  onSelect,
}: {
  onSelect: (mode: Exclude<CoopMode, "menu">) => void;
}) {
  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <section className="grid gap-4 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => {
            playClick();
            onSelect("pet");
          }}
          className="rounded-3xl border border-emerald-300/30 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 p-6 text-left hover:bg-emerald-500/25 transition"
        >
          <h3 className="text-2xl font-black text-slate-800">애완동물 키우기</h3>
          <p className="mt-2 text-sm text-slate-600">1주부터 4주까지 고양이를 키우며 성장과 진화를 완성해요.</p>
          <div className="mt-5 min-h-[21rem] rounded-2xl border border-emerald-200/70 bg-white/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">샘플 동물</span>
              <span className="text-sm font-semibold text-emerald-600">고양이</span>
            </div>
            <div className="mt-4 flex min-h-[16rem] items-center justify-center">
              <CatFaceStage progressWeek={2} seasonComplete={false} />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            playClick();
            onSelect("island");
          }}
          className="rounded-3xl border border-sky-300/30 bg-gradient-to-br from-sky-500/20 to-amber-400/10 p-6 text-left hover:bg-sky-500/25 transition"
        >
          <h3 className="text-2xl font-black text-slate-800">무인도 탈출</h3>
          <p className="mt-2 text-sm text-slate-600">여름 무인도에서 생존, 자원 확보, 탈출 준비, 탈출까지 이어지는 협력 게임이에요.</p>
          <div className="mt-5 rounded-2xl border border-sky-200/70 bg-white/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">샘플 계절</span>
              <span className="text-sm font-semibold text-sky-600">여름</span>
            </div>
            <IslandSceneStage progressWeek={3} seasonComplete={false} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            playClick();
            onSelect("cooking");
          }}
          className="rounded-3xl border border-rose-300/30 bg-gradient-to-br from-rose-500/20 to-amber-400/10 p-6 text-left hover:bg-rose-500/25 transition"
        >
          <h3 className="text-2xl font-black text-slate-800">요리하기</h3>
          <p className="mt-2 text-sm text-slate-600">메인 쉐프와 도우미가 함께 재료부터 포장까지 피자를 완성하는 협력 게임이에요.</p>
          <div className="mt-5 rounded-2xl border border-rose-200/70 bg-white/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">샘플 메뉴</span>
              <span className="text-sm font-semibold text-rose-600">피자</span>
            </div>
            <div className="mt-4 flex items-center justify-center">
              <PizzaCookingStage progressWeek={3} seasonComplete={false} />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            playClick();
            onSelect("drawing");
          }}
          className="rounded-3xl border border-violet-300/30 bg-gradient-to-br from-violet-500/20 to-sky-400/10 p-6 text-left hover:bg-violet-500/25 transition"
        >
          <h3 className="text-2xl font-black text-slate-800">공동 그림 그리기</h3>
          <p className="mt-2 text-sm text-slate-600">하나의 주제로 1주부터 4주까지 함께 그림을 완성하는 협력 게임이에요.</p>
          <div className="mt-5 rounded-2xl border border-violet-200/70 bg-white/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">샘플 주제</span>
              <span className="text-sm font-semibold text-violet-600">여름 바닷가</span>
            </div>
            <div className="mt-4 flex min-h-[16rem] items-center justify-center">
              <div className="relative h-44 w-full max-w-[14rem] overflow-hidden rounded-[2rem] border border-violet-200 bg-gradient-to-b from-sky-100 via-cyan-50 to-amber-50">
                <div className="absolute left-1/2 top-6 -translate-x-1/2 text-3xl">☀️</div>
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-blue-300/80 to-cyan-200/40" />
                <div className="absolute left-1/2 bottom-6 h-14 w-40 -translate-x-1/2 rounded-[50%] bg-gradient-to-b from-yellow-100 to-amber-300" />
                <div className="absolute left-5 bottom-11 text-3xl">🌴</div>
                <div className="absolute right-5 bottom-10 text-3xl">🌈</div>
                <div className="absolute left-1/2 top-[4.9rem] -translate-x-1/2 text-3xl">🎨</div>
                <div className="absolute left-[28%] top-[4.2rem] text-xl text-violet-500">〰️</div>
                <div className="absolute right-[20%] top-[5.2rem] text-xl text-rose-400">⭐</div>
              </div>
            </div>
          </div>
        </button>
      </section>
    </main>
  );
}

function PetCoopGame({
  onBackToMenu,
}: {
  onBackToMenu: () => void;
}) {
  const recognitionRef = useRef<any>(null);
  const [players, setPlayers] = useState<CoopPlayer[]>(() => sortPlayersByPoints(MOCK_PLAYERS));
  const [selectedUserId, setSelectedUserId] = useState("p3");
  const [mobileInfoSection, setMobileInfoSection] = useState<MobileInfoSection>("selected");
  const [currentWeek, setCurrentWeek] = useState<WeekNumber>(1);
  const [progressWeek, setProgressWeek] = useState(1);
  const [seasonComplete, setSeasonComplete] = useState(false);
  const [weekResolved, setWeekResolved] = useState(false);
  const [weekStatusMessage, setWeekStatusMessage] = useState("완료 전: 여러 유저를 바꿔가며 행동 흔적을 남겨보세요.");
  const [feedGauge, setFeedGauge] = useState(18);
  const [temperatureGauge, setTemperatureGauge] = useState(0);
  const [skillGauge, setSkillGauge] = useState(0);
  const [bondGauge, setBondGauge] = useState(0);
  const [collectedItems, setCollectedItems] = useState<CollectedItem[]>([]);
  const [selectedStorageItemId, setSelectedStorageItemId] = useState<string | null>(null);
  const [actionTokens, setActionTokens] = useState<Record<string, number>>(() => getTokensForWeek(1));
  const [actionLogs, setActionLogs] = useState<SharedLog[]>(PET_INITIAL_LOGS);
  const [actionsTakenThisWeek, setActionsTakenThisWeek] = useState(0);
  const [surpriseCardVisible, setSurpriseCardVisible] = useState(false);
  const [bonusChoicesUnlocked, setBonusChoicesUnlocked] = useState(false);
  const [missionDifficulty, setMissionDifficulty] = useState<MissionDifficulty>("easy");
  const [missionBoard, setMissionBoard] = useState<Record<WeekNumber, Record<string, MissionRecord>>>(() => createEmptyMissionBoard());
  const [missionMessage, setMissionMessage] = useState("카드를 열고 미션을 시작해 보세요.");
  const [missionTranscript, setMissionTranscript] = useState("");
  const [missionListening, setMissionListening] = useState(false);
  const [teamNotices, setTeamNotices] = useState<TeamNotice[]>([]);
  const [cheerTargetUserId, setCheerTargetUserId] = useState("p1");
  const [cheerMessage, setCheerMessage] = useState(PET_CHEER_MESSAGES[0]);
  const [toastNotices, setToastNotices] = useState<ToastNotice[]>([]);
  const [latestMissionAccuracy, setLatestMissionAccuracy] = useState<number | null>(null);
  const [mvpReward, setMvpReward] = useState<MvpRewardState | null>(null);
  const [missionPromptCursor, setMissionPromptCursor] = useState<Record<MissionDifficulty, number>>({
    easy: 0,
    medium: 0,
    hard: 0,
  });
  const [showFinishInfo, setShowFinishInfo] = useState(false);
  const [missionBurst, setMissionBurst] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<PetMobileSheet>(null);

  const mePlayer = useMemo(() => players.find((player) => player.isMe) ?? players[2] ?? players[0], [players]);
  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedUserId) ?? players[0],
    [players, selectedUserId]
  );
  const selectedRank = useMemo(
    () => players.findIndex((player) => player.id === selectedPlayer.id) + 1,
    [players, selectedPlayer.id]
  );
  const selectedPermission = useMemo(() => getPermissionByRank(selectedRank), [selectedRank]);
  const currentConfig = PET_WEEK_CONFIGS[currentWeek];
  const selectedTokens = actionTokens[selectedPlayer.id] ?? 0;
  const canUseActions = !weekResolved && !seasonComplete && selectedTokens > 0;
  const growthGauge = useMemo(
    () => clampGauge(feedGauge + temperatureGauge + skillGauge + bondGauge),
    [bondGauge, feedGauge, skillGauge, temperatureGauge]
  );
  const weekLogs = useMemo(() => actionLogs.filter((log) => log.week === currentWeek || log.week === 0), [actionLogs, currentWeek]);
  const myAllLogs = useMemo(() => actionLogs.filter((log) => log.userId === mePlayer.id), [actionLogs, mePlayer.id]);
  const myFinalWeekLogs = useMemo(() => actionLogs.filter((log) => log.userId === mePlayer.id && log.week === 4), [actionLogs, mePlayer.id]);
  const weekMissionRecords = missionBoard[currentWeek];
  const selectedMissionRecord = weekMissionRecords[selectedPlayer.id];
  const selectedMissionAttempts = selectedMissionRecord?.attempts ?? 0;
  const currentPrompt = getMissionPrompt(currentWeek, missionDifficulty, missionPromptCursor[missionDifficulty]);
  const activeNotice = useMemo(
    () => teamNotices.find((notice) => notice.week === currentWeek && notice.toUserId === selectedPlayer.id) ?? null,
    [currentWeek, selectedPlayer.id, teamNotices]
  );
  const topNotice = useMemo(
    () => teamNotices.find((notice) => notice.week === currentWeek && notice.toUserId === selectedPlayer.id) ?? null,
    [currentWeek, selectedPlayer.id, teamNotices]
  );
  const cheerTargets = useMemo(() => players.filter((player) => player.id !== selectedPlayer.id), [players, selectedPlayer.id]);
  const currentMvpUserId = useMemo(() => {
    const entries = Object.entries(weekMissionRecords);
    if (entries.length === 0) return null;
    entries.sort((a, b) => {
      if (b[1].totalScore !== a[1].totalScore) return b[1].totalScore - a[1].totalScore;
      if (b[1].bestScore !== a[1].bestScore) return b[1].bestScore - a[1].bestScore;
      if (a[1].attempts !== b[1].attempts) return a[1].attempts - b[1].attempts;
      const aName = players.find((player) => player.id === a[0])?.name ?? "";
      const bName = players.find((player) => player.id === b[0])?.name ?? "";
      return aName.localeCompare(bName);
    });
    return entries[0][0];
  }, [players, weekMissionRecords]);
  const currentMvpPlayer = useMemo(
    () => players.find((player) => player.id === currentMvpUserId) ?? null,
    [currentMvpUserId, players]
  );
  const canAttemptMission = bonusChoicesUnlocked && !seasonComplete && !weekResolved && selectedMissionAttempts < 3;
  const canResolveWeek = !weekResolved && !seasonComplete && currentMvpUserId !== null && selectedPlayer.id === currentMvpUserId;
  const currentStageLabel = seasonComplete
    ? "달빛 수호묘"
    : progressWeek <= 1
    ? "잠든 고양이"
    : progressWeek === 2
    ? "밥 먹는 고양이"
    : progressWeek === 3
    ? "장난감을 쫓는 고양이"
    : "진화 직전 고양이";

  const appendPassiveLog = (
    tone: SharedLog["tone"],
    userId: string,
    userName: string,
    summary: string,
    detail: string
  ) => {
    setActionLogs((prev) => [
      {
        id: `pet-passive-${Date.now()}-${prev.length}`,
        week: currentWeek,
        userId,
        userName,
        tone,
        summary,
        detail,
      },
      ...prev,
    ]);
  };

  const pushToast = (title: string, body: string, tone: ToastNotice["tone"]) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToastNotices((prev) => [{ id, title, body, tone }, ...prev].slice(0, 3));
    window.setTimeout(() => {
      setToastNotices((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  };

  const revealSurpriseCard = () => {
    if (surpriseCardVisible || seasonComplete || weekResolved) return;
    setSurpriseCardVisible(true);
    appendPassiveLog(
      "violet",
      "system",
      "SYSTEM",
      `${currentWeek}주차에 서프라이즈 액션 카드가 등장했어요.`,
      "카드를 열거나 음성 미션에 성공하면 선택지와 행동 기회가 크게 늘어납니다."
    );
  };

  const storeCollectedItem = (icon: string, label: string, category: CollectedItem["category"]) => {
    const itemId = `pet-stored-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setCollectedItems((prev) => [
      ...prev,
      {
        id: itemId,
        icon,
        label,
        category,
        ownerId: selectedPlayer.id,
        ownerName: selectedPlayer.name,
      },
    ]);
    setSelectedStorageItemId(itemId);
  };

  const appendLog = (tone: SharedLog["tone"], summary: string, detail: string) => {
    if (actionsTakenThisWeek === 0) revealSurpriseCard();
    setActionLogs((prev) => [
      {
        id: `pet-log-${Date.now()}-${prev.length}`,
        week: currentWeek,
        userId: selectedPlayer.id,
        userName: selectedPlayer.name,
        tone,
        summary,
        detail,
      },
      ...prev,
    ]);
    setActionTokens((prev) => ({
      ...prev,
      [selectedPlayer.id]: Math.max(0, (prev[selectedPlayer.id] ?? 0) - 1),
    }));
    setActionsTakenThisWeek((prev) => prev + 1);
  };

  const grantActionChoiceBoost = (userId: string) => {
    setActionTokens((prev) => {
      const currentValue = prev[userId] ?? 0;
      return {
        ...prev,
        [userId]: Math.max(currentValue * 2, 2),
      };
    });
  };

  const moveToNextWeek = (nextWeek: WeekNumber) => {
    setCurrentWeek(nextWeek);
    setProgressWeek(nextWeek);
    setWeekResolved(false);
    setWeekStatusMessage(`좋아요! ${nextWeek}주차로 넘어갔어요. 새로운 행동과 미션을 골라 보세요.`);
    setFeedGauge(nextWeek === 2 ? 4 : nextWeek === 3 ? 3 : 2);
    setTemperatureGauge(0);
    setSkillGauge(0);
    setBondGauge(0);
    setCollectedItems([]);
    setSelectedStorageItemId(null);
    setActionTokens(getTokensForWeek(nextWeek));
    setActionsTakenThisWeek(0);
    setSurpriseCardVisible(false);
    setBonusChoicesUnlocked(false);
    setMissionDifficulty("easy");
    setMissionMessage("카드를 열고 미션을 시작해 보세요.");
    setMissionTranscript("");
    setLatestMissionAccuracy(null);
    setMissionListening(false);
    setCheerMessage(PET_CHEER_MESSAGES[0]);
    setMvpReward(null);
    setMissionPromptCursor({ easy: 0, medium: 0, hard: 0 });
    setShowFinishInfo(false);
    setMissionBurst(false);
  };

  const resetPetGame = () => {
    recognitionRef.current?.stop();
    playClick();
    setPlayers(sortPlayersByPoints(MOCK_PLAYERS));
    setSelectedUserId("p3");
    setCurrentWeek(1);
    setProgressWeek(1);
    setSeasonComplete(false);
    setWeekResolved(false);
    setWeekStatusMessage("완료 전: 여러 유저를 바꿔가며 행동 흔적을 남겨보세요.");
    setFeedGauge(4);
    setTemperatureGauge(0);
    setSkillGauge(0);
    setBondGauge(0);
    setCollectedItems([]);
    setSelectedStorageItemId(null);
    setActionTokens(getTokensForWeek(1));
    setActionLogs(PET_INITIAL_LOGS);
    setMobileInfoSection("selected");
    setActionsTakenThisWeek(0);
    setSurpriseCardVisible(false);
    setBonusChoicesUnlocked(false);
    setMissionDifficulty("easy");
    setMissionBoard(createEmptyMissionBoard());
    setMissionMessage("카드를 열고 미션을 시작해 보세요.");
    setMissionTranscript("");
    setLatestMissionAccuracy(null);
    setMissionListening(false);
    setTeamNotices([]);
    setCheerTargetUserId("p1");
    setCheerMessage(PET_CHEER_MESSAGES[0]);
    setToastNotices([]);
    setMvpReward(null);
    setMissionPromptCursor({ easy: 0, medium: 0, hard: 0 });
    setShowFinishInfo(false);
    setMissionBurst(false);
  };

  const handleMissionFailure = (detail: string, spokenText = "", accuracy = 0) => {
    setMissionBoard((prev) => {
      const currentRecord = prev[currentWeek][selectedPlayer.id] ?? {
        attempts: 0,
        successes: 0,
        totalScore: 0,
        bestScore: 0,
      };
      return {
        ...prev,
        [currentWeek]: {
          ...prev[currentWeek],
          [selectedPlayer.id]: {
            ...currentRecord,
            attempts: currentRecord.attempts + 1,
            lastAccuracy: accuracy,
          },
        },
      };
    });
    appendPassiveLog("orange", selectedPlayer.id, selectedPlayer.name, `${selectedPlayer.name}님이 음성 미션을 다시 시도해요.`, detail);
    setMissionMessage(detail);
    setMissionTranscript(spokenText);
    setLatestMissionAccuracy(accuracy);
    setMissionPromptCursor((prev) => ({ ...prev, [missionDifficulty]: prev[missionDifficulty] + 1 }));
  };

  const handleMissionSuccess = (spokenText: string, accuracy: number) => {
    const attemptNumber = selectedMissionAttempts + 1;
    const score = calculateMissionScore(currentWeek, missionDifficulty, attemptNumber);
    const alreadyRewarded = selectedMissionRecord?.rewardClaimed ?? false;

    setMissionBoard((prev) => {
      const currentRecord = prev[currentWeek][selectedPlayer.id] ?? {
        attempts: 0,
        successes: 0,
        totalScore: 0,
        bestScore: 0,
      };
      const nextBestScore = Math.max(currentRecord.bestScore, score);
      return {
        ...prev,
        [currentWeek]: {
          ...prev[currentWeek],
          [selectedPlayer.id]: {
            attempts: currentRecord.attempts + 1,
            successes: currentRecord.successes + 1,
            totalScore: currentRecord.totalScore + score,
            bestScore: nextBestScore,
            bestDifficulty: score >= nextBestScore ? missionDifficulty : currentRecord.bestDifficulty ?? missionDifficulty,
            rewardClaimed: true,
            lastAccuracy: accuracy,
          },
        },
      };
    });
    setPlayers((prev) =>
      sortPlayersByPoints(
        prev.map((player) => (player.id === selectedPlayer.id ? { ...player, points: player.points + score } : player))
      )
    );
    setBonusChoicesUnlocked(true);
    if (!alreadyRewarded) {
      grantActionChoiceBoost(selectedPlayer.id);
    }
    storeCollectedItem("🎤", `${getMissionDifficultyLabel(missionDifficulty)} 음성 미션 배지`, "card");
    appendPassiveLog(
      "emerald",
      selectedPlayer.id,
      selectedPlayer.name,
      `${selectedPlayer.name}님이 음성 미션에 성공했어요.`,
      `난이도 ${getMissionDifficultyLabel(missionDifficulty)}, +${score}P, 인식 문장: "${spokenText}".`
    );
    setMissionMessage(
      `${selectedPlayer.name} 성공! +${score}P`
    );
    setMissionTranscript(spokenText);
    setLatestMissionAccuracy(accuracy);
    setWeekStatusMessage(`${selectedPlayer.name}가 이번 주 MVP 경쟁에서 앞서고 있어요.`);
    setMissionPromptCursor((prev) => ({ ...prev, [missionDifficulty]: prev[missionDifficulty] + 1 }));
    setMissionBurst(true);
    window.setTimeout(() => setMissionBurst(false), 1800);
    pushToast("음성 미션 성공", `${selectedPlayer.name}이(가) ${score}점을 획득했어요.`, "emerald");
  };

  const startVoiceMission = () => {
    if (!canAttemptMission) {
      setMissionMessage("이 학생은 이번 주 음성 미션을 이미 3번 시도했어요.");
      return;
    }
    if (weekResolved || seasonComplete) return;

    const recognitionWindow = window as Window & {
      SpeechRecognition?: BrowserSpeechRecognitionCtor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
    };
    const SpeechRecognitionCtor = recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setMissionMessage("이 브라우저에서는 음성 인식을 지원하지 않아요. Chrome 계열 브라우저에서 테스트해 주세요.");
      return;
    }

    recognitionRef.current?.stop();
    playClick();
    setMissionListening(true);
    setMissionMessage(`"${currentPrompt.text}"`);

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const spokenText = Array.from(event.results as ArrayLike<any>)
        .map((result: any) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      const accuracy = getSpeechMatchScore(currentPrompt.text, spokenText);
      const successThreshold = getMissionSuccessThreshold(missionDifficulty);
      if (accuracy >= successThreshold) {
        handleMissionSuccess(spokenText, accuracy);
      } else {
        handleMissionFailure(`정확도 ${(accuracy * 100).toFixed(0)}% · 다시 도전`, spokenText, accuracy);
      }
    };
    recognition.onerror = (event: any) => {
      handleMissionFailure(`음성 인식 오류: ${event.error}. 다시 시도해 주세요.`);
    };
    recognition.onend = () => {
      setMissionListening(false);
    };
    recognition.start();
  };

  const openSurpriseCard = () => {
    if (!surpriseCardVisible) return;
    playClick();
    setBonusChoicesUnlocked(true);
    setMissionMessage("");
    setWeekStatusMessage("서프라이즈 카드가 열렸어요.");
    appendPassiveLog("violet", "system", "SYSTEM", "보너스 액션 카드가 열렸어요.", "이번 주 보너스 행동 3종이 추가로 개방됐어요.");
  };

  const handleSendCheer = () => {
    const targetPlayer = players.find((player) => player.id === cheerTargetUserId);
    if (!targetPlayer || targetPlayer.id === selectedPlayer.id || !selectedPermission.canLeadTheme || !canUseActions) return;

    playClick();
    const notice: TeamNotice = {
      id: `cheer-${Date.now()}`,
      week: currentWeek,
      fromUserId: selectedPlayer.id,
      fromUserName: selectedPlayer.name,
      toUserId: targetPlayer.id,
      toUserName: targetPlayer.name,
      message: cheerMessage,
      createdAt: Date.now(),
    };

    setTeamNotices((prev) => [notice, ...prev.filter((item) => !(item.week === currentWeek && item.toUserId === targetPlayer.id))]);
    setActionTokens((prev) => ({
      ...prev,
      [targetPlayer.id]: (prev[targetPlayer.id] ?? 0) + 1,
    }));
    setSelectedUserId(targetPlayer.id);
    setBondGauge((prev) => clampGauge(prev + 8));
    appendLog("violet", `${targetPlayer.name}에게 응원을 보냈어요.`, cheerMessage);
    setWeekStatusMessage(`${targetPlayer.name}에게 알림을 보내고 행동권 1개를 추가해 줬어요.`);
    pushToast("응원 알림 전송", `${targetPlayer.name}에게 "${cheerMessage}" 알림을 보냈어요.`, "cyan");
  };

  const handleResolveWeek = () => {
    if (weekResolved || seasonComplete) return;
    if (!currentMvpUserId) {
      setWeekStatusMessage("아직 이번 주 MVP가 없어요. 음성 미션을 수행해 MVP를 먼저 정해 주세요.");
      return;
    }
    if (selectedPlayer.id !== currentMvpUserId) {
      setWeekStatusMessage(`이번 주 완료 권한은 MVP ${currentMvpPlayer?.name ?? ""}에게만 있어요.`);
      return;
    }

    playClick();
    const success = growthGauge >= currentConfig.threshold;

    setActionLogs((prev) => [
      {
        id: `pet-system-${Date.now()}`,
        week: currentWeek,
        userId: "system",
        userName: "SYSTEM",
        tone: success ? "emerald" : "orange",
        summary: success ? currentConfig.successSummary : currentConfig.failSummary,
        detail: success
          ? `${currentConfig.successDetail} 이번 주 MVP는 ${currentMvpPlayer?.name ?? selectedPlayer.name}였어요.`
          : currentConfig.failDetail,
      },
      ...prev,
    ]);
    setCollectedItems([]);
    setSelectedStorageItemId(null);

    if (!success) {
      setActionTokens(getTokensForWeek(currentWeek));
      setWeekStatusMessage(`${currentWeek}주차 게이지가 부족해 행동권을 재충전했어요.`);
      return;
    }

    setWeekResolved(true);
    const rewardMeta = getMvpBadge(currentWeek);
    setMvpReward({
      week: currentWeek,
      userId: currentMvpPlayer?.id ?? selectedPlayer.id,
      userName: currentMvpPlayer?.name ?? selectedPlayer.name,
      badge: rewardMeta.badge,
      title: rewardMeta.title,
    });
    pushToast("이번 주 MVP 확정", `${currentMvpPlayer?.name ?? selectedPlayer.name}이(가) ${rewardMeta.title} 보상을 받았어요.`, "violet");
    setCollectedItems((prev) => [
      ...prev,
      {
        id: `mvp-reward-${Date.now()}`,
        icon: rewardMeta.badge,
        label: `${rewardMeta.title} 배지`,
        category: "card",
        ownerId: currentMvpPlayer?.id ?? selectedPlayer.id,
        ownerName: currentMvpPlayer?.name ?? selectedPlayer.name,
      },
    ]);

    if (currentWeek === 4) {
      setSeasonComplete(true);
      setProgressWeek(5);
      setWeekStatusMessage(`클리어: 달빛 수호묘 완성, 마지막 MVP는 ${currentMvpPlayer?.name ?? selectedPlayer.name}였어요.`);
      return;
    }

    window.setTimeout(() => moveToNextWeek((currentWeek + 1) as WeekNumber), 240);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <ToastStack notices={toastNotices} onDismiss={(id) => setToastNotices((prev) => prev.filter((item) => item.id !== id))} />
      {topNotice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4">
          <div className="w-full max-w-sm rounded-[28px] border border-cyan-200 bg-white p-5 shadow-2xl">
            <p className="text-xs font-semibold text-cyan-700">응원 알림</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{topNotice.message}</p>
            <p className="mt-2 text-sm text-slate-500">{topNotice.fromUserName}이(가) 보냈어요.</p>
            <button
              type="button"
              onClick={() => {
                playClick();
                setTeamNotices((prev) => prev.filter((notice) => notice.id !== topNotice.id));
              }}
              className="mt-4 w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white"
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
      <section className="rounded-3xl border border-emerald-200 bg-white/80 p-3 shadow-sm md:p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black sm:text-lg md:text-xl">협력 게임</h2>
            <p className="text-xs text-slate-500">고양이</p>
          </div>
          <button
            type="button"
            onClick={() => {
              playClick();
              onBackToMenu();
            }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-100"
          >
            게임 선택으로
          </button>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="order-1 min-w-0 rounded-3xl border border-emerald-200 bg-white/80 p-4 shadow-sm sm:p-5">
          <div className="relative pr-16">
            <div>
              <p className="text-sm text-emerald-500">Progress</p>
            </div>
            <button
              type="button"
              onClick={resetPetGame}
              className="absolute right-0 top-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-700 hover:bg-emerald-100"
            >
              초기화
            </button>
          </div>

          <div className="mt-5 grid min-w-0 gap-4">
            <div
              className={`relative overflow-hidden rounded-3xl border p-4 text-center transition-all sm:p-6 ${
                seasonComplete
                  ? "border-yellow-200 bg-gradient-to-br from-yellow-100 via-emerald-50 to-fuchsia-50 shadow-sm"
                  : "border-emerald-200 bg-gradient-to-br from-emerald-100 via-lime-50 to-sky-50"
              }`}
            >
              <CatFaceStage progressWeek={progressWeek} seasonComplete={seasonComplete} />
              {mvpReward ? (
                <>
                  <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-yellow-200/30 via-fuchsia-200/20 to-cyan-200/30" />
                  <div className="pointer-events-none absolute left-6 top-6 text-3xl animate-bounce">{mvpReward.badge}</div>
                  <div className="pointer-events-none absolute right-8 top-8 text-2xl">✨</div>
                  <div className="pointer-events-none absolute left-10 bottom-8 text-2xl">🌟</div>
                </>
              ) : null}
              <p className="mt-3 text-xs font-bold text-emerald-800 sm:text-sm">{currentStageLabel}</p>
              {mvpReward ? (
                <div className="mt-3 rounded-2xl border border-yellow-200 bg-yellow-50/90 px-3 py-3 text-left text-[11px] text-yellow-900">
                  <p className="font-semibold">
                    {mvpReward.badge} {mvpReward.userName} 보상 지급
                  </p>
                  <p className="mt-1">{mvpReward.title} 배지가 이번 주 보관함에 추가됐어요.</p>
                </div>
              ) : null}
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <div className="min-w-0 rounded-2xl border border-emerald-200 bg-white/85 p-3 shadow-sm sm:p-4">
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs sm:gap-2 sm:text-sm">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-2 py-3">
                    <p className="text-[10px] text-slate-500">주차</p>
                    <p className="mt-1 font-semibold text-slate-800">{currentWeek}주차</p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-2 py-3">
                    <p className="text-[10px] text-slate-500">단계</p>
                    <p className="mt-1 truncate font-semibold text-slate-800">{currentConfig.phaseLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 px-2 py-3">
                    <p className="text-[10px] text-slate-500">성장도</p>
                    <p className="mt-1 font-semibold text-slate-800">{growthGauge}%</p>
                  </div>
                  <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 px-2 py-3">
                    <p className="text-[10px] text-slate-500">MVP</p>
                    <p className="mt-1 font-semibold text-slate-800">{currentMvpPlayer?.name ?? "대기"}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <GaugeBar label="주차 합산 게이지" value={growthGauge} tone="bg-gradient-to-r from-emerald-300 to-lime-300" />
                  <GaugeBar label="먹이" value={feedGauge} tone="bg-gradient-to-r from-amber-300 to-yellow-300" compact />
                  <GaugeBar label="환경" value={temperatureGauge} tone="bg-gradient-to-r from-orange-300 to-amber-300" compact />
                  <GaugeBar label="스킬" value={skillGauge} tone="bg-gradient-to-r from-sky-300 to-cyan-300" compact />
                  <GaugeBar label="유대감" value={bondGauge} tone="bg-gradient-to-r from-fuchsia-300 to-pink-300" compact />
                </div>
              </div>
              <CompactStorageSummary
                items={collectedItems}
                accentClass="text-emerald-500"
                selectedItemId={selectedStorageItemId}
                onSelectItem={setSelectedStorageItemId}
              />
            </div>
          </div>

          <SeasonStepRow
            currentWeek={currentWeek}
            progressWeek={progressWeek}
            seasonComplete={seasonComplete}
            labels={["깨우기", "성장 1", "성장 2", "진화"]}
          />
        </div>

        <div className="order-2 min-w-0 rounded-3xl border border-emerald-200 bg-white/80 p-4 shadow-sm space-y-5 sm:p-5">
          <div>
            <p className="text-sm text-emerald-500">Snapshot + Action</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold sm:text-xl">{currentWeek}주차 선택하기</h3>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShowFinishInfo((prev) => !prev);
                }}
                className="rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700"
              >
                완료 조건
              </button>
            </div>
            {showFinishInfo ? (
              <p className="mt-2 text-[11px] text-slate-500">
                이번 주 MVP: {currentMvpPlayer?.name ?? "아직 없음"} / 완료 버튼은 MVP 선택 시에만 활성화돼요.
              </p>
            ) : null}
          </div>

          <ActionSnapshot
            currentWeek={currentWeek}
            selectedPermission={selectedPermission}
            selectedTokens={selectedTokens}
            gaugeLabel="주차 합산 게이지"
            gaugeValue={growthGauge}
            gaugeTone="bg-gradient-to-r from-emerald-400 to-lime-300"
          />

          <div className="grid grid-cols-3 gap-2 md:hidden">
            <button
              type="button"
              onClick={() => {
                playClick();
                setMobileSheet("actions");
              }}
              className="rounded-2xl border border-violet-200 bg-violet-50 px-3 py-3 text-xs font-semibold text-violet-700"
            >
              액션 열기
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMobileSheet("info");
              }}
              className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3 text-xs font-semibold text-sky-700"
            >
              정보 보기
            </button>
            <button
              type="button"
              onClick={handleResolveWeek}
              disabled={!canResolveWeek}
              className="rounded-2xl bg-emerald-400 px-3 py-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              완료
            </button>
          </div>

          <div className="hidden md:block space-y-5">
          <div
            className={`relative overflow-hidden rounded-[28px] border p-4 shadow-sm transition-all ${
              missionBurst
                ? "border-fuchsia-400 bg-gradient-to-br from-yellow-100 via-fuchsia-100 to-cyan-100 shadow-[0_0_30px_rgba(217,70,239,0.25)]"
                : "border-violet-200 bg-violet-50/70"
            }`}
          >
            {missionBurst ? (
              <>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8),_rgba(255,255,255,0))]" />
                <div className="pointer-events-none absolute left-4 top-4 text-2xl">✨</div>
                <div className="pointer-events-none absolute right-4 top-5 text-3xl">🎉</div>
                <div className="pointer-events-none absolute bottom-4 left-8 text-2xl">🌟</div>
                <div className="pointer-events-none absolute bottom-3 right-10 text-2xl">💫</div>
              </>
            ) : null}
            {!bonusChoicesUnlocked ? (
              <button
                type="button"
                onClick={openSurpriseCard}
                disabled={!surpriseCardVisible}
                className={`mx-auto flex min-h-44 w-full max-w-sm flex-col items-center justify-center rounded-[24px] border text-center transition ${
                  surpriseCardVisible
                    ? "border-violet-300 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg hover:scale-[1.01]"
                    : "border-violet-200 bg-violet-100/70 text-violet-400 opacity-70"
                }`}
              >
                <span className="text-4xl">🃏</span>
                <p className="mt-3 text-base font-black">서프라이즈 카드</p>
                <p className="mt-1 text-xs">{surpriseCardVisible ? "탭해서 열기" : "첫 행동 후 등장"}</p>
              </button>
            ) : null}
            {bonusChoicesUnlocked && selectedMissionAttempts < 3 ? (
              <>
                <div className="mx-auto max-w-sm rounded-[24px] border border-violet-300 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 p-4 text-white shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-white/80">미션 카드</p>
                      <p className="mt-1 text-sm font-bold">{currentPrompt.text}</p>
                    </div>
                    <div className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
                      {getMissionDifficultyLabel(missionDifficulty)} / {Math.max(0, 3 - selectedMissionAttempts)}회
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {(["easy", "medium", "hard"] as MissionDifficulty[]).map((difficulty) => {
                      const active = missionDifficulty === difficulty;
                      return (
                        <button
                          key={difficulty}
                          type="button"
                          onClick={() => {
                            playClick();
                            setMissionDifficulty(difficulty);
                          }}
                          className={`rounded-2xl border px-3 py-2 text-left text-xs transition ${
                            active ? "border-white bg-white text-violet-800" : "border-white/25 bg-white/10 text-white"
                          }`}
                        >
                          <p className="font-semibold">{getMissionDifficultyLabel(difficulty)}</p>
                          <p className="mt-1 truncate opacity-80">{getMissionPrompt(currentWeek, difficulty, missionPromptCursor[difficulty]).text}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startVoiceMission}
                      disabled={!canAttemptMission || missionListening || weekResolved || seasonComplete}
                      className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-violet-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {missionListening ? "듣는 중..." : "미션 시작"}
                    </button>
                    <div className="rounded-xl bg-white/15 px-3 py-2 text-[11px]">점수 {selectedMissionRecord?.totalScore ?? 0}</div>
                    <div className="rounded-xl bg-white/15 px-3 py-2 text-[11px]">
                      정확도 {((latestMissionAccuracy ?? selectedMissionRecord?.lastAccuracy ?? 0) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </>
            ) : null}
            {bonusChoicesUnlocked && selectedMissionAttempts >= 3 ? (
              <div className="mx-auto flex min-h-44 w-full max-w-sm flex-col items-center justify-center rounded-[24px] border border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 text-center text-slate-600 shadow-inner opacity-90">
                <span className="text-4xl">🃏</span>
                <p className="mt-3 text-base font-black">미션 완료</p>
                <p className="mt-1 text-xs">카드 사용 종료</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">1. 먹이 선택</p>
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
              {currentConfig.feedOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (!canUseActions) return;
                    playClick();
                    setFeedGauge((prev) => clampGauge(prev + option.delta));
                    storeCollectedItem(getPetFeedIcon(option.label), option.label, "feed");
                    appendLog("amber", `${currentWeek}주차에 ${option.label}을(를) 놨어요.`, option.detail);
                  }}
                  disabled={!canUseActions}
                  className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50 p-2.5 text-left transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40 sm:p-3"
                >
                  <p className="break-keep text-sm font-semibold text-amber-700">{option.label}</p>
                  <p className="mt-2 text-xs text-amber-600">먹이 게이지 +{option.delta}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">2. 환경 조절</p>
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
              {currentConfig.temperatureOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (!canUseActions || !selectedPermission.canChooseSupport) return;
                    playClick();
                    setTemperatureGauge((prev) => clampGauge(prev + option.delta));
                    storeCollectedItem(getPetTemperatureIcon(option.label), option.label, "temperature");
                    appendLog("orange", `${currentWeek}주차에 ${option.label}을(를) 선택했어요.`, option.detail);
                  }}
                  disabled={!selectedPermission.canChooseSupport || !canUseActions}
                  className="min-w-0 rounded-2xl border border-orange-200 bg-orange-50 p-2.5 text-left transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40 sm:p-3"
                >
                  <p className="break-keep text-sm font-semibold text-orange-700">{option.label}</p>
                  <p className="mt-2 text-xs text-orange-600">환경 게이지 +{option.delta}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">3. 능력 스킬</p>
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
              {currentConfig.skillOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (!canUseActions || !selectedPermission.canChooseSupport) return;
                    playClick();
                    setSkillGauge((prev) => clampGauge(prev + option.delta));
                    storeCollectedItem(getPetSkillIcon(option.label), option.label, "skill");
                    appendLog("cyan", `${currentWeek}주차에 ${option.label}을(를) 사용했어요.`, option.detail);
                  }}
                  disabled={!selectedPermission.canChooseSupport || !canUseActions}
                  className="min-w-0 rounded-2xl border border-sky-200 bg-sky-50 p-2.5 text-left transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40 sm:p-3"
                >
                  <p className="break-keep text-sm font-semibold text-sky-700">{option.label}</p>
                  <p className="mt-2 text-xs text-sky-600">스킬 게이지 +{option.delta}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">4. 유대감 행동</p>
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              {currentConfig.bondOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (!canUseActions) return;
                    playClick();
                    setBondGauge((prev) => clampGauge(prev + option.delta));
                    storeCollectedItem(getPetBondIcon(option.label), option.label, "bond");
                    appendLog("violet", `${currentWeek}주차에 ${option.label}을(를) 함께 했어요.`, option.detail);
                  }}
                  disabled={!canUseActions}
                  className="min-w-0 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-2.5 text-left transition hover:bg-fuchsia-100 disabled:cursor-not-allowed disabled:opacity-40 sm:p-3"
                >
                  <p className="break-keep text-sm font-semibold text-fuchsia-700">{option.label}</p>
                  <p className="mt-2 text-xs text-fuchsia-600">유대감 게이지 +{option.delta}</p>
                </button>
              ))}
            </div>
          </div>

          {bonusChoicesUnlocked ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">5. 보너스 카드 행동</p>
              <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                {currentConfig.surpriseOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      if (!canUseActions) return;
                      playClick();
                      setBondGauge((prev) => clampGauge(prev + option.delta));
                      storeCollectedItem(getPetCardIcon(option.label), option.label, "card");
                      appendLog("violet", `${currentWeek}주차 보너스 카드 ${option.label}을(를) 사용했어요.`, option.detail);
                    }}
                    disabled={!canUseActions}
                    className="min-w-0 rounded-2xl border border-violet-200 bg-violet-50 p-2.5 text-left transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40 sm:p-3"
                  >
                    <p className="break-keep text-sm font-semibold text-violet-700">{option.label}</p>
                    <p className="mt-2 text-xs text-violet-600">보너스 선택 +{option.delta}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-700">응원 호출</p>
                <p className="mt-1 text-xs text-cyan-600">주도자는 특정 팀원에게 알림을 보내고 오늘 미션 수행을 독려할 수 있어요.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-cyan-700">
                {selectedPermission.canLeadTheme ? "리더 가능" : "리더 전용"}
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[0.9fr_1.3fr_auto]">
              <select
                value={cheerTargetUserId}
                onChange={(event) => setCheerTargetUserId(event.target.value)}
                className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                {cheerTargets.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
              <select
                value={cheerMessage}
                onChange={(event) => setCheerMessage(event.target.value)}
                className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                {PET_CHEER_MESSAGES.map((message) => (
                  <option key={message} value={message}>
                    {message}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSendCheer}
                disabled={!selectedPermission.canLeadTheme || !canUseActions}
                className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                응원 보내기
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResolveWeek}
            disabled={!canResolveWeek}
            className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {currentWeek}주차 완료하기 {currentMvpPlayer ? `(${currentMvpPlayer.name} 전용)` : ""}
          </button>
          </div>
        </div>
      </section>

      <MobileInfoTabs
        activeSection={mobileInfoSection}
        onChangeSection={setMobileInfoSection}
        selectedUserId={selectedUserId}
        onSelectUser={setSelectedUserId}
        actionTokens={actionTokens}
        players={players}
        selectedPlayer={selectedPlayer}
        selectedPermission={selectedPermission}
        currentWeek={currentWeek}
        selectedTokens={selectedTokens}
        weekLogs={weekLogs}
        contributionTitle="내 기여 모아보기"
        contributionLogs={seasonComplete ? myFinalWeekLogs : myAllLogs.slice(0, 4)}
        contributionEmptyText={
          seasonComplete
            ? `4주차에 내가 남긴 행동이 아직 없어요. 마지막 주에는 ${mePlayer.name}를 선택해 결말 기여를 남겨보세요.`
            : `아직 내 행동 기록이 없어요. 랭킹에서 ${mePlayer.name}를 선택한 뒤 이번 주 행동을 남겨보세요.`
        }
        selectedMissionRecord={selectedMissionRecord}
        isMvp={selectedPlayer.id === currentMvpUserId}
        activeNotice={activeNotice}
        mvpUserId={currentMvpUserId}
        missionRecordsByUser={weekMissionRecords}
        className="hidden md:block lg:hidden"
      />

      <MobileBottomSheet
        title={mobileSheet === "actions" ? "빠른 액션" : "빠른 정보"}
        open={mobileSheet !== null}
        onClose={() => setMobileSheet(null)}
      >
        {mobileSheet === "actions" ? (
          <div className="space-y-4">
            <div
              className={`relative overflow-hidden rounded-[24px] border p-4 shadow-sm transition-all ${
                missionBurst
                  ? "border-fuchsia-400 bg-gradient-to-br from-yellow-100 via-fuchsia-100 to-cyan-100"
                  : "border-violet-200 bg-violet-50/70"
              }`}
            >
              {!bonusChoicesUnlocked ? (
                <button
                  type="button"
                  onClick={openSurpriseCard}
                  disabled={!surpriseCardVisible}
                  className={`flex min-h-32 w-full flex-col items-center justify-center rounded-[20px] border text-center ${
                    surpriseCardVisible
                      ? "border-violet-300 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                      : "border-violet-200 bg-violet-100/70 text-violet-400 opacity-70"
                  }`}
                >
                  <span className="text-3xl">🃏</span>
                  <p className="mt-2 text-sm font-black">서프라이즈 카드</p>
                </button>
              ) : null}
              {bonusChoicesUnlocked && selectedMissionAttempts < 3 ? (
                <div className="rounded-[20px] border border-violet-300 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 p-4 text-white shadow-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-white/80">미션 카드</p>
                      <p className="mt-1 text-sm font-bold">{currentPrompt.text}</p>
                    </div>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
                      {Math.max(0, 3 - selectedMissionAttempts)}회
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as MissionDifficulty[]).map((difficulty) => (
                      <button
                        key={difficulty}
                        type="button"
                        onClick={() => {
                          playClick();
                          setMissionDifficulty(difficulty);
                        }}
                        className={`rounded-2xl border px-2 py-2 text-[11px] font-semibold ${
                          missionDifficulty === difficulty ? "border-white bg-white text-violet-800" : "border-white/25 bg-white/10 text-white"
                        }`}
                      >
                        {getMissionDifficultyLabel(difficulty)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startVoiceMission}
                      disabled={!canAttemptMission || missionListening || weekResolved || seasonComplete}
                      className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-violet-700 disabled:opacity-50"
                    >
                      {missionListening ? "듣는 중..." : "미션 시작"}
                    </button>
                    <div className="rounded-xl bg-white/15 px-3 py-2 text-[11px]">점수 {selectedMissionRecord?.totalScore ?? 0}</div>
                  </div>
                </div>
              ) : null}
              {bonusChoicesUnlocked && selectedMissionAttempts >= 3 ? (
                <div className="flex min-h-32 w-full flex-col items-center justify-center rounded-[20px] border border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 text-center text-slate-600 shadow-inner">
                  <span className="text-3xl">🃏</span>
                  <p className="mt-2 text-sm font-black">미션 완료</p>
                  <p className="mt-1 text-[11px]">카드 사용 종료</p>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">먹이</p>
              <div className="grid grid-cols-2 gap-2">
                {currentConfig.feedOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      if (!canUseActions) return;
                      playClick();
                      setFeedGauge((prev) => clampGauge(prev + option.delta));
                      storeCollectedItem(getPetFeedIcon(option.label), option.label, "feed");
                      appendLog("amber", `${currentWeek}주차에 ${option.label}을(를) 놨어요.`, option.detail);
                    }}
                    disabled={!canUseActions}
                    className="rounded-2xl border border-amber-200 bg-amber-50 p-2.5 text-left text-xs disabled:opacity-40"
                  >
                    <p className="font-semibold text-amber-700">{option.label}</p>
                    <p className="mt-1 text-[11px] text-amber-600">+{option.delta}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">환경 / 스킬 / 유대감</p>
              <div className="grid grid-cols-2 gap-2">
                {[...currentConfig.temperatureOptions, ...currentConfig.skillOptions, ...currentConfig.bondOptions].map((option) => {
                  const isTemp = currentConfig.temperatureOptions.some((item) => item.id === option.id);
                  const isSkill = currentConfig.skillOptions.some((item) => item.id === option.id);
                  const blocked = isTemp || isSkill ? !selectedPermission.canChooseSupport || !canUseActions : !canUseActions;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        if (blocked) return;
                        playClick();
                        if (isTemp) {
                          setTemperatureGauge((prev) => clampGauge(prev + option.delta));
                          storeCollectedItem(getPetTemperatureIcon(option.label), option.label, "temperature");
                          appendLog("orange", `${currentWeek}주차에 ${option.label}을(를) 선택했어요.`, option.detail);
                          return;
                        }
                        if (isSkill) {
                          setSkillGauge((prev) => clampGauge(prev + option.delta));
                          storeCollectedItem(getPetSkillIcon(option.label), option.label, "skill");
                          appendLog("cyan", `${currentWeek}주차에 ${option.label}을(를) 사용했어요.`, option.detail);
                          return;
                        }
                        setBondGauge((prev) => clampGauge(prev + option.delta));
                        storeCollectedItem(getPetBondIcon(option.label), option.label, "bond");
                        appendLog("violet", `${currentWeek}주차에 ${option.label}을(를) 함께 했어요.`, option.detail);
                      }}
                      disabled={blocked}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-left text-xs disabled:opacity-40"
                    >
                      <p className="font-semibold text-slate-700">{option.label}</p>
                      <p className="mt-1 text-[11px] text-slate-500">+{option.delta}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {bonusChoicesUnlocked ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-800">보너스</p>
                <div className="grid grid-cols-2 gap-2">
                  {currentConfig.surpriseOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        if (!canUseActions) return;
                        playClick();
                        setBondGauge((prev) => clampGauge(prev + option.delta));
                        storeCollectedItem(getPetCardIcon(option.label), option.label, "card");
                        appendLog("violet", `${currentWeek}주차 보너스 카드 ${option.label}을(를) 사용했어요.`, option.detail);
                      }}
                      disabled={!canUseActions}
                      className="rounded-2xl border border-violet-200 bg-violet-50 p-2.5 text-left text-xs disabled:opacity-40"
                    >
                      <p className="font-semibold text-violet-700">{option.label}</p>
                      <p className="mt-1 text-[11px] text-violet-600">+{option.delta}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">응원</p>
              <div className="grid gap-2">
                <select
                  value={cheerTargetUserId}
                  onChange={(event) => setCheerTargetUserId(event.target.value)}
                  className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  {cheerTargets.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
                <select
                  value={cheerMessage}
                  onChange={(event) => setCheerMessage(event.target.value)}
                  className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  {PET_CHEER_MESSAGES.map((message) => (
                    <option key={message} value={message}>
                      {message}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleSendCheer}
                  disabled={!selectedPermission.canLeadTheme || !canUseActions}
                  className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  응원 보내기
                </button>
              </div>
            </div>
          </div>
        ) : (
          <MobileInfoTabs
            activeSection={mobileInfoSection}
            onChangeSection={setMobileInfoSection}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
            actionTokens={actionTokens}
            players={players}
            selectedPlayer={selectedPlayer}
            selectedPermission={selectedPermission}
            currentWeek={currentWeek}
            selectedTokens={selectedTokens}
            weekLogs={weekLogs}
            contributionTitle="내 기여 모아보기"
            contributionLogs={seasonComplete ? myFinalWeekLogs : myAllLogs.slice(0, 4)}
            contributionEmptyText={
              seasonComplete
                ? `4주차에 내가 남긴 행동이 아직 없어요. 마지막 주에는 ${mePlayer.name}를 선택해 결말 기여를 남겨보세요.`
                : `아직 내 행동 기록이 없어요. 랭킹에서 ${mePlayer.name}를 선택한 뒤 이번 주 행동을 남겨보세요.`
            }
            selectedMissionRecord={selectedMissionRecord}
            isMvp={selectedPlayer.id === currentMvpUserId}
            activeNotice={activeNotice}
            mvpUserId={currentMvpUserId}
            missionRecordsByUser={weekMissionRecords}
            className="block"
          />
        )}
      </MobileBottomSheet>

      <section className="hidden gap-4 lg:grid lg:grid-cols-[1.2fr_0.8fr]">
        <RankingPanel
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
          actionTokens={actionTokens}
          players={players}
          mvpUserId={currentMvpUserId}
          missionRecordsByUser={weekMissionRecords}
        />
        <SelectedUserPanel
          selectedPlayer={selectedPlayer}
          selectedPermission={selectedPermission}
          currentWeek={currentWeek}
          selectedTokens={selectedTokens}
          selectedMissionRecord={selectedMissionRecord}
          isMvp={selectedPlayer.id === currentMvpUserId}
          activeNotice={activeNotice}
        />
      </section>

      <section className="hidden gap-4 xl:grid xl:grid-cols-[1.1fr_0.9fr]">
        <LogsPanel title={`${currentWeek}주차 행동 기록`} subtitle="Week Action Trail" logs={weekLogs} />
        <MyContributionPanel
          title="내 기여 모아보기"
          logs={seasonComplete ? myFinalWeekLogs : myAllLogs.slice(0, 4)}
          emptyText={
            seasonComplete
              ? `4주차에 내가 남긴 행동이 아직 없어요. 마지막 주에는 ${mePlayer.name}를 선택해 결말 기여를 남겨보세요.`
              : `아직 내 행동 기록이 없어요. 랭킹에서 ${mePlayer.name}를 선택한 뒤 이번 주 행동을 남겨보세요.`
          }
        />
      </section>
    </main>
  );
}

function IslandEscapeGame({
  onBackToMenu,
}: {
  onBackToMenu: () => void;
}) {
  const recognitionRef = useRef<any>(null);
  const [players, setPlayers] = useState<CoopPlayer[]>(() => sortPlayersByPoints(MOCK_PLAYERS));
  const [selectedUserId, setSelectedUserId] = useState("p3");
  const [mobileInfoSection, setMobileInfoSection] = useState<MobileInfoSection>("selected");
  const [currentWeek, setCurrentWeek] = useState<WeekNumber>(1);
  const [progressWeek, setProgressWeek] = useState(1);
  const [seasonComplete, setSeasonComplete] = useState(false);
  const [weekResolved, setWeekResolved] = useState(false);
  const [weekStatusMessage, setWeekStatusMessage] = useState("완료 전: 섬을 정하고 자원을 모아 여름 무인도에서 살아남아 보세요.");
  const [commandGauge, setCommandGauge] = useState(4);
  const [resourceGauge, setResourceGauge] = useState(4);
  const [supportGauge, setSupportGauge] = useState(0);
  const [selectedIsland, setSelectedIsland] = useState("야자수 만");
  const [collectedItems, setCollectedItems] = useState<CollectedItem[]>([]);
  const [selectedStorageItemId, setSelectedStorageItemId] = useState<string | null>(null);
  const [actionTokens, setActionTokens] = useState<Record<string, number>>(() => getTokensForWeek(1));
  const [actionLogs, setActionLogs] = useState<SharedLog[]>(ISLAND_INITIAL_LOGS);
  const [actionsTakenThisWeek, setActionsTakenThisWeek] = useState(0);
  const [surpriseCardVisible, setSurpriseCardVisible] = useState(false);
  const [bonusChoicesUnlocked, setBonusChoicesUnlocked] = useState(false);
  const [missionDifficulty, setMissionDifficulty] = useState<MissionDifficulty>("easy");
  const [missionBoard, setMissionBoard] = useState<Record<WeekNumber, Record<string, MissionRecord>>>(() => createEmptyMissionBoard());
  const [missionMessage, setMissionMessage] = useState("카드를 열고 미션을 시작해 보세요.");
  const [missionListening, setMissionListening] = useState(false);
  const [teamNotices, setTeamNotices] = useState<TeamNotice[]>([]);
  const [cheerTargetUserId, setCheerTargetUserId] = useState("p1");
  const [cheerMessage, setCheerMessage] = useState(PET_CHEER_MESSAGES[0]);
  const [toastNotices, setToastNotices] = useState<ToastNotice[]>([]);
  const [latestMissionAccuracy, setLatestMissionAccuracy] = useState<number | null>(null);
  const [mvpReward, setMvpReward] = useState<MvpRewardState | null>(null);
  const [missionPromptCursor, setMissionPromptCursor] = useState<Record<MissionDifficulty, number>>({ easy: 0, medium: 0, hard: 0 });
  const [showFinishInfo, setShowFinishInfo] = useState(false);
  const [missionBurst, setMissionBurst] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<PetMobileSheet>(null);

  const mePlayer = useMemo(() => players.find((player) => player.isMe) ?? players[2] ?? players[0], [players]);
  const selectedPlayer = useMemo(() => players.find((player) => player.id === selectedUserId) ?? players[0], [players, selectedUserId]);
  const selectedRank = useMemo(() => players.findIndex((player) => player.id === selectedPlayer.id) + 1, [players, selectedPlayer.id]);
  const selectedPermission = useMemo(() => getPermissionByRank(selectedRank), [selectedRank]);
  const currentConfig = ISLAND_WEEK_CONFIGS[currentWeek];
  const selectedTokens = actionTokens[selectedPlayer.id] ?? 0;
  const canUseActions = !weekResolved && !seasonComplete && selectedTokens > 0;
  const totalGauge = useMemo(() => clampGauge(commandGauge + resourceGauge + supportGauge), [commandGauge, resourceGauge, supportGauge]);
  const weekLogs = useMemo(() => actionLogs.filter((log) => log.week === currentWeek || log.week === 0), [actionLogs, currentWeek]);
  const myAllLogs = useMemo(() => actionLogs.filter((log) => log.userId === mePlayer.id), [actionLogs, mePlayer.id]);
  const myFinalWeekLogs = useMemo(() => actionLogs.filter((log) => log.userId === mePlayer.id && log.week === 4), [actionLogs, mePlayer.id]);
  const weekMissionRecords = missionBoard[currentWeek];
  const selectedMissionRecord = weekMissionRecords[selectedPlayer.id];
  const selectedMissionAttempts = selectedMissionRecord?.attempts ?? 0;
  const currentPrompt = getMissionPromptFromSet(ISLAND_MISSION_PROMPTS, currentWeek, missionDifficulty, missionPromptCursor[missionDifficulty]);
  const activeNotice = useMemo(() => teamNotices.find((notice) => notice.week === currentWeek && notice.toUserId === selectedPlayer.id) ?? null, [currentWeek, selectedPlayer.id, teamNotices]);
  const topNotice = useMemo(() => teamNotices.find((notice) => notice.week === currentWeek && notice.toUserId === selectedPlayer.id) ?? null, [currentWeek, selectedPlayer.id, teamNotices]);
  const cheerTargets = useMemo(() => players.filter((player) => player.id !== selectedPlayer.id), [players, selectedPlayer.id]);
  const currentMvpUserId = useMemo(() => {
    const entries = Object.entries(weekMissionRecords);
    if (entries.length === 0) return null;
    entries.sort((a, b) => {
      if (b[1].totalScore !== a[1].totalScore) return b[1].totalScore - a[1].totalScore;
      if (b[1].bestScore !== a[1].bestScore) return b[1].bestScore - a[1].bestScore;
      if (a[1].attempts !== b[1].attempts) return a[1].attempts - b[1].attempts;
      const aName = players.find((player) => player.id === a[0])?.name ?? "";
      const bName = players.find((player) => player.id === b[0])?.name ?? "";
      return aName.localeCompare(bName);
    });
    return entries[0][0];
  }, [players, weekMissionRecords]);
  const currentMvpPlayer = useMemo(() => players.find((player) => player.id === currentMvpUserId) ?? null, [currentMvpUserId, players]);
  const canAttemptMission = bonusChoicesUnlocked && !seasonComplete && !weekResolved && selectedMissionAttempts < 3;
  const canResolveWeek = !weekResolved && !seasonComplete && currentMvpUserId !== null && selectedPlayer.id === currentMvpUserId;
  const currentStageLabel = seasonComplete ? "여름 무인도 탈출 완료" : progressWeek <= 1 ? "해변 생존 시작" : progressWeek === 2 ? "자원 거점 완성" : progressWeek === 3 ? "뗏목 준비 단계" : "탈출 직전";

  const pushToast = (title: string, body: string, tone: ToastNotice["tone"]) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToastNotices((prev) => [{ id, title, body, tone }, ...prev].slice(0, 3));
    window.setTimeout(() => setToastNotices((prev) => prev.filter((item) => item.id !== id)), 3200);
  };
  const appendPassiveLog = (tone: SharedLog["tone"], userId: string, userName: string, summary: string, detail: string) => {
    setActionLogs((prev) => [{ id: `island-passive-${Date.now()}-${prev.length}`, week: currentWeek, userId, userName, tone, summary, detail }, ...prev]);
  };
  const revealSurpriseCard = () => {
    if (surpriseCardVisible || seasonComplete || weekResolved) return;
    setSurpriseCardVisible(true);
    appendPassiveLog("violet", "system", "SYSTEM", `${currentWeek}주차에 서프라이즈 액션 카드가 등장했어요.`, "카드를 열거나 미션에 성공하면 선택지가 늘어나요.");
  };
  const storeCollectedItem = (icon: string, label: string, category: CollectedItem["category"]) => {
    const itemId = `stored-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setCollectedItems((prev) => [...prev, { id: itemId, icon, label, category, ownerId: selectedPlayer.id, ownerName: selectedPlayer.name }]);
    setSelectedStorageItemId(itemId);
  };
  const appendLog = (tone: SharedLog["tone"], summary: string, detail: string) => {
    if (actionsTakenThisWeek === 0) revealSurpriseCard();
    setActionLogs((prev) => [{ id: `island-log-${Date.now()}-${prev.length}`, week: currentWeek, userId: selectedPlayer.id, userName: selectedPlayer.name, tone, summary, detail }, ...prev]);
    setActionTokens((prev) => ({ ...prev, [selectedPlayer.id]: Math.max(0, (prev[selectedPlayer.id] ?? 0) - 1) }));
    setActionsTakenThisWeek((prev) => prev + 1);
  };
  const grantActionChoiceBoost = (userId: string) => {
    setActionTokens((prev) => ({ ...prev, [userId]: Math.max((prev[userId] ?? 0) * 2, 2) }));
  };
  const moveToNextWeek = (nextWeek: WeekNumber) => {
    setCurrentWeek(nextWeek);
    setProgressWeek(nextWeek);
    setWeekResolved(false);
    setWeekStatusMessage(`좋아요! ${nextWeek}주차로 넘어갔어요.`);
    setCommandGauge(nextWeek === 2 ? 3 : nextWeek === 3 ? 3 : 2);
    setResourceGauge(nextWeek === 2 ? 4 : nextWeek === 3 ? 3 : 2);
    setSupportGauge(0);
    setCollectedItems([]);
    setSelectedStorageItemId(null);
    setActionTokens(getTokensForWeek(nextWeek));
    setActionsTakenThisWeek(0);
    setSurpriseCardVisible(false);
    setBonusChoicesUnlocked(false);
    setMissionDifficulty("easy");
    setMissionMessage("카드를 열고 미션을 시작해 보세요.");
    setLatestMissionAccuracy(null);
    setMissionListening(false);
    setCheerMessage(PET_CHEER_MESSAGES[0]);
    setMvpReward(null);
    setMissionPromptCursor({ easy: 0, medium: 0, hard: 0 });
    setShowFinishInfo(false);
    setMissionBurst(false);
  };
  const resetGame = () => {
    recognitionRef.current?.stop();
    playClick();
    setPlayers(sortPlayersByPoints(MOCK_PLAYERS));
    setSelectedUserId("p3");
    setCurrentWeek(1);
    setProgressWeek(1);
    setSeasonComplete(false);
    setWeekResolved(false);
    setWeekStatusMessage("완료 전: 섬을 정하고 자원을 모아 여름 무인도에서 살아남아 보세요.");
    setCommandGauge(4);
    setResourceGauge(4);
    setSupportGauge(0);
    setSelectedIsland("야자수 만");
    setCollectedItems([]);
    setSelectedStorageItemId(null);
    setActionTokens(getTokensForWeek(1));
    setActionLogs(ISLAND_INITIAL_LOGS);
    setMobileInfoSection("selected");
    setActionsTakenThisWeek(0);
    setSurpriseCardVisible(false);
    setBonusChoicesUnlocked(false);
    setMissionDifficulty("easy");
    setMissionBoard(createEmptyMissionBoard());
    setMissionMessage("카드를 열고 미션을 시작해 보세요.");
    setMissionListening(false);
    setTeamNotices([]);
    setCheerTargetUserId("p1");
    setCheerMessage(PET_CHEER_MESSAGES[0]);
    setToastNotices([]);
    setLatestMissionAccuracy(null);
    setMvpReward(null);
    setMissionPromptCursor({ easy: 0, medium: 0, hard: 0 });
    setShowFinishInfo(false);
    setMissionBurst(false);
    setMobileSheet(null);
  };
  const handleMissionFailure = (detail: string, accuracy = 0) => {
    setMissionBoard((prev) => {
      const currentRecord = prev[currentWeek][selectedPlayer.id] ?? { attempts: 0, successes: 0, totalScore: 0, bestScore: 0 };
      return { ...prev, [currentWeek]: { ...prev[currentWeek], [selectedPlayer.id]: { ...currentRecord, attempts: currentRecord.attempts + 1, lastAccuracy: accuracy } } };
    });
    appendPassiveLog("orange", selectedPlayer.id, selectedPlayer.name, `${selectedPlayer.name}님이 음성 미션을 다시 시도해요.`, detail);
    setMissionMessage(detail);
    setLatestMissionAccuracy(accuracy);
    setMissionPromptCursor((prev) => ({ ...prev, [missionDifficulty]: prev[missionDifficulty] + 1 }));
  };
  const handleMissionSuccess = (spokenText: string, accuracy: number) => {
    const attemptNumber = selectedMissionAttempts + 1;
    const score = calculateMissionScoreFromSet(ISLAND_MISSION_PROMPTS, currentWeek, missionDifficulty, attemptNumber);
    const alreadyRewarded = selectedMissionRecord?.rewardClaimed ?? false;
    setMissionBoard((prev) => {
      const currentRecord = prev[currentWeek][selectedPlayer.id] ?? { attempts: 0, successes: 0, totalScore: 0, bestScore: 0 };
      const nextBestScore = Math.max(currentRecord.bestScore, score);
      return {
        ...prev,
        [currentWeek]: {
          ...prev[currentWeek],
          [selectedPlayer.id]: {
            attempts: currentRecord.attempts + 1,
            successes: currentRecord.successes + 1,
            totalScore: currentRecord.totalScore + score,
            bestScore: nextBestScore,
            bestDifficulty: score >= nextBestScore ? missionDifficulty : currentRecord.bestDifficulty ?? missionDifficulty,
            rewardClaimed: true,
            lastAccuracy: accuracy,
          },
        },
      };
    });
    setPlayers((prev) => sortPlayersByPoints(prev.map((player) => (player.id === selectedPlayer.id ? { ...player, points: player.points + score } : player))));
    setBonusChoicesUnlocked(true);
    if (!alreadyRewarded) grantActionChoiceBoost(selectedPlayer.id);
    storeCollectedItem("🎤", `${getMissionDifficultyLabel(missionDifficulty)} 음성 배지`, "card");
    appendPassiveLog("emerald", selectedPlayer.id, selectedPlayer.name, `${selectedPlayer.name}님이 음성 미션에 성공했어요.`, `난이도 ${getMissionDifficultyLabel(missionDifficulty)}, +${score}P, 인식 문장: "${spokenText}".`);
    setMissionMessage("");
    setLatestMissionAccuracy(accuracy);
    setMissionPromptCursor((prev) => ({ ...prev, [missionDifficulty]: prev[missionDifficulty] + 1 }));
    setMissionBurst(true);
    window.setTimeout(() => setMissionBurst(false), 1800);
    pushToast("음성 미션 성공", `${selectedPlayer.name}이(가) ${score}점을 획득했어요.`, "emerald");
  };
  const startVoiceMission = () => {
    if (!canAttemptMission) {
      setMissionMessage("이 학생은 이번 주 음성 미션을 이미 3번 시도했어요.");
      return;
    }
    if (weekResolved || seasonComplete) return;
    const recognitionWindow = window as Window & { SpeechRecognition?: BrowserSpeechRecognitionCtor; webkitSpeechRecognition?: BrowserSpeechRecognitionCtor };
    const SpeechRecognitionCtor = recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setMissionMessage("이 브라우저에서는 음성 인식을 지원하지 않아요.");
      return;
    }
    recognitionRef.current?.stop();
    playClick();
    setMissionListening(true);
    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const spokenText = Array.from(event.results as ArrayLike<any>).map((result: any) => result[0]?.transcript ?? "").join(" ").trim();
      const accuracy = getSpeechMatchScore(currentPrompt.text, spokenText);
      const successThreshold = getMissionSuccessThreshold(missionDifficulty);
      if (accuracy >= successThreshold) handleMissionSuccess(spokenText, accuracy);
      else handleMissionFailure(`정확도 ${(accuracy * 100).toFixed(0)}% · 다시 도전`, accuracy);
    };
    recognition.onerror = () => handleMissionFailure("음성 인식 오류", 0);
    recognition.onend = () => setMissionListening(false);
    recognition.start();
  };
  const openSurpriseCard = () => {
    if (!surpriseCardVisible) return;
    playClick();
    setBonusChoicesUnlocked(true);
    setMissionMessage("");
    setWeekStatusMessage("서프라이즈 카드가 열렸어요.");
    appendPassiveLog("violet", "system", "SYSTEM", "보너스 액션 카드가 열렸어요.", "이번 주 보너스 행동이 추가로 개방됐어요.");
  };
  const handleSendCheer = () => {
    const targetPlayer = players.find((player) => player.id === cheerTargetUserId);
    if (!targetPlayer || targetPlayer.id === selectedPlayer.id || !selectedPermission.canLeadTheme || !canUseActions) return;
    playClick();
    const notice: TeamNotice = { id: `island-cheer-${Date.now()}`, week: currentWeek, fromUserId: selectedPlayer.id, fromUserName: selectedPlayer.name, toUserId: targetPlayer.id, toUserName: targetPlayer.name, message: cheerMessage, createdAt: Date.now() };
    setTeamNotices((prev) => [notice, ...prev.filter((item) => !(item.week === currentWeek && item.toUserId === targetPlayer.id))]);
    setActionTokens((prev) => ({ ...prev, [targetPlayer.id]: (prev[targetPlayer.id] ?? 0) + 1 }));
    setSelectedUserId(targetPlayer.id);
    appendLog("violet", `${targetPlayer.name}에게 응원을 보냈어요.`, cheerMessage);
    pushToast("응원 알림 전송", `${targetPlayer.name}에게 "${cheerMessage}" 알림을 보냈어요.`, "cyan");
  };
  const handleResolveWeek = () => {
    if (weekResolved || seasonComplete) return;
    if (!currentMvpUserId) {
      setWeekStatusMessage("음성 미션으로 MVP를 먼저 정해 주세요.");
      return;
    }
    if (selectedPlayer.id !== currentMvpUserId) {
      setWeekStatusMessage(`이번 주 완료 권한은 MVP ${currentMvpPlayer?.name ?? ""}에게만 있어요.`);
      return;
    }
    playClick();
    const success = totalGauge >= currentConfig.threshold;
    setActionLogs((prev) => [{ id: `island-system-${Date.now()}`, week: currentWeek, userId: "system", userName: "SYSTEM", tone: success ? "emerald" : "orange", summary: success ? currentConfig.successSummary : currentConfig.failSummary, detail: success ? `${currentConfig.successDetail} 이번 주 MVP는 ${currentMvpPlayer?.name ?? selectedPlayer.name}였어요.` : currentConfig.failDetail }, ...prev]);
    setCollectedItems([]);
    setSelectedStorageItemId(null);
    if (!success) {
      setActionTokens(getTokensForWeek(currentWeek));
      setWeekStatusMessage(`${currentWeek}주차 준비가 부족해 행동권을 재충전했어요.`);
      return;
    }
    setWeekResolved(true);
    const rewardMeta = getIslandMvpBadge(currentWeek);
    setMvpReward({ week: currentWeek, userId: currentMvpPlayer?.id ?? selectedPlayer.id, userName: currentMvpPlayer?.name ?? selectedPlayer.name, badge: rewardMeta.badge, title: rewardMeta.title });
    pushToast("이번 주 MVP 확정", `${currentMvpPlayer?.name ?? selectedPlayer.name}이(가) ${rewardMeta.title} 보상을 받았어요.`, "violet");
    setCollectedItems((prev) => [...prev, { id: `island-mvp-${Date.now()}`, icon: rewardMeta.badge, label: `${rewardMeta.title} 배지`, category: "card", ownerId: currentMvpPlayer?.id ?? selectedPlayer.id, ownerName: currentMvpPlayer?.name ?? selectedPlayer.name }]);
    if (currentWeek === 4) {
      setSeasonComplete(true);
      setProgressWeek(5);
      setWeekStatusMessage(`클리어: 여름 무인도 탈출, 마지막 MVP는 ${currentMvpPlayer?.name ?? selectedPlayer.name}였어요.`);
      return;
    }
    window.setTimeout(() => moveToNextWeek((currentWeek + 1) as WeekNumber), 240);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <ToastStack notices={toastNotices} onDismiss={(id) => setToastNotices((prev) => prev.filter((item) => item.id !== id))} />
      {topNotice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4">
          <div className="w-full max-w-sm rounded-[28px] border border-cyan-200 bg-white p-5 shadow-2xl">
            <p className="text-xs font-semibold text-cyan-700">응원 알림</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{topNotice.message}</p>
            <p className="mt-2 text-sm text-slate-500">{topNotice.fromUserName}이(가) 보냈어요.</p>
            <button type="button" onClick={() => setTeamNotices((prev) => prev.filter((notice) => notice.id !== topNotice.id))} className="mt-4 w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white">닫기</button>
          </div>
        </div>
      ) : null}
      <section className="rounded-3xl border border-sky-200 bg-white/80 p-3 shadow-sm md:p-4">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-base font-black sm:text-lg md:text-xl">협력 게임</h2><p className="text-xs text-slate-500">무인도</p></div>
          <button type="button" onClick={() => { playClick(); onBackToMenu(); }} className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 hover:bg-sky-100">게임 선택으로</button>
        </div>
      </section>
      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="order-1 min-w-0 rounded-3xl border border-sky-200 bg-white/80 p-4 shadow-sm sm:p-5">
          <div className="relative pr-16"><div><p className="text-sm text-sky-500">Progress</p></div><button type="button" onClick={resetGame} className="absolute right-0 top-0 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] text-sky-700 hover:bg-sky-100">초기화</button></div>
          <div className="mt-5 grid min-w-0 gap-4">
            <div className="relative overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-100 via-cyan-50 to-amber-50 p-4 text-center sm:p-6">
              <IslandSceneStage progressWeek={progressWeek} seasonComplete={seasonComplete} selectedIsland={selectedIsland} />
              {mvpReward ? <div className="pointer-events-none absolute left-6 top-6 text-3xl animate-bounce">{mvpReward.badge}</div> : null}
              <p className="mt-3 text-xs font-bold text-sky-800 sm:text-sm">{currentStageLabel} · {selectedIsland}</p>
              {mvpReward ? <div className="mt-3 rounded-2xl border border-yellow-200 bg-yellow-50/90 px-3 py-3 text-left text-[11px] text-yellow-900"><p className="font-semibold">{mvpReward.badge} {mvpReward.userName} 보상 지급</p><p className="mt-1">{mvpReward.title} 배지가 이번 주 보관함에 추가됐어요.</p></div> : null}
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <div className="min-w-0 rounded-2xl border border-sky-200 bg-white/85 p-3 shadow-sm sm:p-4">
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs sm:gap-2 sm:text-sm">
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 px-2 py-3"><p className="text-[10px] text-slate-500">주차</p><p className="mt-1 font-semibold text-slate-800">{currentWeek}주차</p></div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-2 py-3"><p className="text-[10px] text-slate-500">단계</p><p className="mt-1 truncate font-semibold text-slate-800">{currentConfig.phaseLabel}</p></div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-2 py-3"><p className="text-[10px] text-slate-500">준비</p><p className="mt-1 font-semibold text-slate-800">{totalGauge}%</p></div>
                  <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 px-2 py-3"><p className="text-[10px] text-slate-500">MVP</p><p className="mt-1 font-semibold text-slate-800">{currentMvpPlayer?.name ?? "대기"}</p></div>
                </div>
                <div className="mt-4 space-y-2">
                  <GaugeBar label="탈출 준비도" value={totalGauge} tone="bg-gradient-to-r from-sky-300 via-cyan-300 to-emerald-300" />
                  <GaugeBar label="지휘" value={commandGauge} tone="bg-gradient-to-r from-sky-300 to-cyan-300" compact />
                  <GaugeBar label="자원" value={resourceGauge} tone="bg-gradient-to-r from-amber-300 to-yellow-300" compact />
                  <GaugeBar label="지원" value={supportGauge} tone="bg-gradient-to-r from-emerald-300 to-lime-300" compact />
                </div>
              </div>
              <CompactStorageSummary items={collectedItems} accentClass="text-sky-500" selectedItemId={selectedStorageItemId} onSelectItem={setSelectedStorageItemId} />
            </div>
          </div>
          <SeasonStepRow currentWeek={currentWeek} progressWeek={progressWeek} seasonComplete={seasonComplete} labels={["생존", "자원 확보", "탈출 준비", "탈출"]} />
        </div>
        <div className="order-2 min-w-0 rounded-3xl border border-sky-200 bg-white/80 p-4 shadow-sm space-y-5 sm:p-5">
          <div>
            <p className="text-sm text-sky-500">Snapshot + Action</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold sm:text-xl">{currentWeek}주차 선택하기</h3>
              <button type="button" onClick={() => setShowFinishInfo((prev) => !prev)} className="rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-sky-700">완료 조건</button>
            </div>
            {showFinishInfo ? <p className="mt-2 text-[11px] text-slate-500">이번 주 MVP: {currentMvpPlayer?.name ?? "아직 없음"} / 완료 버튼은 MVP 선택 시에만 활성화돼요.</p> : null}
          </div>
          <div className="grid grid-cols-3 gap-2 md:hidden">
            <button type="button" onClick={() => setMobileSheet("actions")} className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3 text-xs font-semibold text-sky-700">액션 열기</button>
            <button type="button" onClick={() => setMobileSheet("info")} className="rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-3 text-xs font-semibold text-cyan-700">정보 보기</button>
            <button type="button" onClick={handleResolveWeek} disabled={!canResolveWeek} className="rounded-2xl bg-sky-400 px-3 py-3 text-xs font-semibold text-white disabled:opacity-50">완료</button>
          </div>
          <div className="hidden md:block space-y-5">
            <div className={`relative overflow-hidden rounded-[28px] border p-4 shadow-sm ${missionBurst ? "border-fuchsia-400 bg-gradient-to-br from-yellow-100 via-fuchsia-100 to-cyan-100" : "border-violet-200 bg-violet-50/70"}`}>
              {!bonusChoicesUnlocked ? <button type="button" onClick={openSurpriseCard} disabled={!surpriseCardVisible} className={`mx-auto flex min-h-44 w-full max-w-sm flex-col items-center justify-center rounded-[24px] border text-center ${surpriseCardVisible ? "border-violet-300 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg" : "border-violet-200 bg-violet-100/70 text-violet-400 opacity-70"}`}><span className="text-4xl">🃏</span><p className="mt-3 text-base font-black">서프라이즈 카드</p></button> : null}
              {bonusChoicesUnlocked && selectedMissionAttempts < 3 ? <div className="mx-auto max-w-sm rounded-[24px] border border-violet-300 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 p-4 text-white shadow-xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-white/80">미션 카드</p><p className="mt-1 text-sm font-bold">{currentPrompt.text}</p></div><div className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">{getMissionDifficultyLabel(missionDifficulty)} / {Math.max(0, 3 - selectedMissionAttempts)}회</div></div><div className="mt-3 grid gap-2 sm:grid-cols-3">{(["easy", "medium", "hard"] as MissionDifficulty[]).map((difficulty) => <button key={difficulty} type="button" onClick={() => setMissionDifficulty(difficulty)} className={`rounded-2xl border px-3 py-2 text-left text-xs ${missionDifficulty === difficulty ? "border-white bg-white text-violet-800" : "border-white/25 bg-white/10 text-white"}`}><p className="font-semibold">{getMissionDifficultyLabel(difficulty)}</p><p className="mt-1 truncate opacity-80">{getMissionPromptFromSet(ISLAND_MISSION_PROMPTS, currentWeek, difficulty, missionPromptCursor[difficulty]).text}</p></button>)}</div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={startVoiceMission} disabled={!canAttemptMission || missionListening || weekResolved || seasonComplete} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-violet-700 disabled:opacity-50">{missionListening ? "듣는 중..." : "미션 시작"}</button><div className="rounded-xl bg-white/15 px-3 py-2 text-[11px]">점수 {selectedMissionRecord?.totalScore ?? 0}</div><div className="rounded-xl bg-white/15 px-3 py-2 text-[11px]">정확도 {((latestMissionAccuracy ?? selectedMissionRecord?.lastAccuracy ?? 0) * 100).toFixed(0)}%</div></div></div> : null}
              {bonusChoicesUnlocked && selectedMissionAttempts >= 3 ? <div className="mx-auto flex min-h-44 w-full max-w-sm flex-col items-center justify-center rounded-[24px] border border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 text-center text-slate-600 shadow-inner"><span className="text-4xl">🃏</span><p className="mt-3 text-base font-black">미션 완료</p><p className="mt-1 text-xs">카드 사용 종료</p></div> : null}
            </div>
            <div className="space-y-3"><p className="text-sm font-semibold text-slate-800">1. 섬 선택 및 지휘</p><div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">{currentConfig.leaderOptions.map((option) => { const delta = Math.max(4, Math.min(9, Math.round(option.delta / 2.6))); return <button key={option.id} type="button" onClick={() => { if (!canUseActions || !selectedPermission.canLeadTheme) return; setSelectedIsland(option.label); setCommandGauge((prev) => clampGauge(prev + delta)); storeCollectedItem(getIslandLeaderIcon(option.label), option.label, "leader"); appendLog("cyan", `${currentWeek}주차에 ${option.label} 방향으로 지휘했어요.`, option.detail); }} disabled={!canUseActions || !selectedPermission.canLeadTheme} className="min-w-0 rounded-2xl border border-sky-200 bg-sky-50 p-2.5 text-left disabled:opacity-40 sm:p-3"><p className="break-keep text-sm font-semibold text-sky-700">{option.label}</p><p className="mt-2 text-xs text-sky-600">지휘 +{delta}</p></button>; })}</div></div>
            <div className="space-y-3"><p className="text-sm font-semibold text-slate-800">2. 자원 확보</p><div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">{currentConfig.resourceOptions.map((option) => { const delta = Math.max(4, Math.min(9, Math.round(option.delta / 2.6))); return <button key={option.id} type="button" onClick={() => { if (!canUseActions) return; setResourceGauge((prev) => clampGauge(prev + delta)); storeCollectedItem(getIslandResourceIcon(option.label), option.label, "resource"); appendLog("amber", `${currentWeek}주차에 ${option.label}을(를) 확보했어요.`, option.detail); }} disabled={!canUseActions} className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50 p-2.5 text-left disabled:opacity-40 sm:p-3"><p className="break-keep text-sm font-semibold text-amber-700">{option.label}</p><p className="mt-2 text-xs text-amber-600">자원 +{delta}</p></button>; })}</div></div>
            <div className="space-y-3"><p className="text-sm font-semibold text-slate-800">3. 생존 지원</p><div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">{currentConfig.supportOptions.map((option) => { const delta = Math.max(4, Math.min(9, Math.round(option.delta / 2.6))); return <button key={option.id} type="button" onClick={() => { if (!canUseActions || !selectedPermission.canChooseSupport) return; setSupportGauge((prev) => clampGauge(prev + delta)); storeCollectedItem(getIslandSupportIcon(option.label), option.label, "support"); appendLog("emerald", `${currentWeek}주차에 ${option.label}을(를) 진행했어요.`, option.detail); }} disabled={!canUseActions || !selectedPermission.canChooseSupport} className="min-w-0 rounded-2xl border border-emerald-200 bg-emerald-50 p-2.5 text-left disabled:opacity-40 sm:p-3"><p className="break-keep text-sm font-semibold text-emerald-700">{option.label}</p><p className="mt-2 text-xs text-emerald-600">지원 +{delta}</p></button>; })}</div></div>
            {bonusChoicesUnlocked ? <div className="space-y-3"><p className="text-sm font-semibold text-slate-800">4. 보너스 카드 행동</p><div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">{ISLAND_SURPRISE_OPTIONS[currentWeek].map((option) => <button key={option.id} type="button" onClick={() => { if (!canUseActions) return; setSupportGauge((prev) => clampGauge(prev + option.delta)); storeCollectedItem(getPetCardIcon(option.label), option.label, "card"); appendLog("violet", `${currentWeek}주차 보너스 카드 ${option.label}을(를) 사용했어요.`, option.detail); }} disabled={!canUseActions} className="min-w-0 rounded-2xl border border-violet-200 bg-violet-50 p-2.5 text-left disabled:opacity-40 sm:p-3"><p className="break-keep text-sm font-semibold text-violet-700">{option.label}</p><p className="mt-2 text-xs text-violet-600">보너스 +{option.delta}</p></button>)}</div></div> : null}
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-cyan-700">응원 호출</p><p className="mt-1 text-xs text-cyan-600">주도자는 특정 팀원에게 알림을 보내고 오늘 미션 수행을 독려할 수 있어요.</p></div><span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-cyan-700">{selectedPermission.canLeadTheme ? "리더 가능" : "리더 전용"}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-[0.9fr_1.3fr_auto]"><select value={cheerTargetUserId} onChange={(event) => setCheerTargetUserId(event.target.value)} className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700" disabled={!selectedPermission.canLeadTheme}>{cheerTargets.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><select value={cheerMessage} onChange={(event) => setCheerMessage(event.target.value)} className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700" disabled={!selectedPermission.canLeadTheme}>{PET_CHEER_MESSAGES.map((message) => <option key={message} value={message}>{message}</option>)}</select><button type="button" onClick={handleSendCheer} disabled={!selectedPermission.canLeadTheme || !canUseActions} className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">응원 보내기</button></div></div>
            <button type="button" onClick={handleResolveWeek} disabled={!canResolveWeek} className="w-full rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{currentWeek}주차 완료하기 {currentMvpPlayer ? `(${currentMvpPlayer.name} 전용)` : ""}</button>
          </div>
        </div>
      </section>
      <MobileInfoTabs activeSection={mobileInfoSection} onChangeSection={setMobileInfoSection} selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} actionTokens={actionTokens} players={players} selectedPlayer={selectedPlayer} selectedPermission={selectedPermission} currentWeek={currentWeek} selectedTokens={selectedTokens} weekLogs={weekLogs} contributionTitle="내 기여 모아보기" contributionLogs={seasonComplete ? myFinalWeekLogs : myAllLogs.slice(0, 4)} contributionEmptyText={seasonComplete ? `4주차에 내가 남긴 행동이 아직 없어요. 마지막 주에는 ${mePlayer.name}를 선택해 탈출 기여를 남겨보세요.` : `아직 내 행동 기록이 없어요. 랭킹에서 ${mePlayer.name}를 선택한 뒤 이번 주 행동을 남겨보세요.`} selectedMissionRecord={selectedMissionRecord} isMvp={selectedPlayer.id === currentMvpUserId} activeNotice={activeNotice} mvpUserId={currentMvpUserId} missionRecordsByUser={weekMissionRecords} className="hidden md:block lg:hidden" />
      <MobileBottomSheet title={mobileSheet === "actions" ? "빠른 액션" : "빠른 정보"} open={mobileSheet !== null} onClose={() => setMobileSheet(null)}>
        {mobileSheet === "actions" ? <div className="space-y-4"><div className={`relative overflow-hidden rounded-[24px] border p-4 shadow-sm ${missionBurst ? "border-fuchsia-400 bg-gradient-to-br from-yellow-100 via-fuchsia-100 to-cyan-100" : "border-violet-200 bg-violet-50/70"}`}>{!bonusChoicesUnlocked ? <button type="button" onClick={openSurpriseCard} disabled={!surpriseCardVisible} className={`flex min-h-32 w-full flex-col items-center justify-center rounded-[20px] border text-center ${surpriseCardVisible ? "border-violet-300 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white" : "border-violet-200 bg-violet-100/70 text-violet-400 opacity-70"}`}><span className="text-3xl">🃏</span><p className="mt-2 text-sm font-black">서프라이즈 카드</p></button> : null}{bonusChoicesUnlocked && selectedMissionAttempts < 3 ? <div className="rounded-[20px] border border-violet-300 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 p-4 text-white shadow-lg"><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-semibold text-white/80">미션 카드</p><p className="mt-1 text-sm font-bold">{currentPrompt.text}</p></div><span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">{Math.max(0, 3 - selectedMissionAttempts)}회</span></div><div className="mt-3 grid grid-cols-3 gap-2">{(["easy", "medium", "hard"] as MissionDifficulty[]).map((difficulty) => <button key={difficulty} type="button" onClick={() => setMissionDifficulty(difficulty)} className={`rounded-2xl border px-2 py-2 text-[11px] font-semibold ${missionDifficulty === difficulty ? "border-white bg-white text-violet-800" : "border-white/25 bg-white/10 text-white"}`}>{getMissionDifficultyLabel(difficulty)}</button>)}</div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={startVoiceMission} disabled={!canAttemptMission || missionListening || weekResolved || seasonComplete} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-violet-700 disabled:opacity-50">{missionListening ? "듣는 중..." : "미션 시작"}</button><div className="rounded-xl bg-white/15 px-3 py-2 text-[11px]">점수 {selectedMissionRecord?.totalScore ?? 0}</div></div></div> : null}{bonusChoicesUnlocked && selectedMissionAttempts >= 3 ? <div className="flex min-h-32 w-full flex-col items-center justify-center rounded-[20px] border border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 text-center text-slate-600 shadow-inner"><span className="text-3xl">🃏</span><p className="mt-2 text-sm font-black">미션 완료</p><p className="mt-1 text-[11px]">카드 사용 종료</p></div> : null}</div><div className="space-y-3"><p className="text-sm font-semibold text-slate-800">지휘 / 자원 / 지원</p><div className="grid grid-cols-2 gap-2">{[...currentConfig.leaderOptions, ...currentConfig.resourceOptions, ...currentConfig.supportOptions].map((option) => { const isLeader = currentConfig.leaderOptions.some((item) => item.id === option.id); const isSupport = currentConfig.supportOptions.some((item) => item.id === option.id); const blocked = isLeader ? !selectedPermission.canLeadTheme || !canUseActions : isSupport ? !selectedPermission.canChooseSupport || !canUseActions : !canUseActions; const delta = Math.max(4, Math.min(9, Math.round(option.delta / 2.6))); return <button key={option.id} type="button" onClick={() => { if (blocked) return; if (isLeader) { setSelectedIsland(option.label); setCommandGauge((prev) => clampGauge(prev + delta)); storeCollectedItem(getIslandLeaderIcon(option.label), option.label, "leader"); appendLog("cyan", `${currentWeek}주차에 ${option.label} 방향으로 지휘했어요.`, option.detail); return; } if (isSupport) { setSupportGauge((prev) => clampGauge(prev + delta)); storeCollectedItem(getIslandSupportIcon(option.label), option.label, "support"); appendLog("emerald", `${currentWeek}주차에 ${option.label}을(를) 진행했어요.`, option.detail); return; } setResourceGauge((prev) => clampGauge(prev + delta)); storeCollectedItem(getIslandResourceIcon(option.label), option.label, "resource"); appendLog("amber", `${currentWeek}주차에 ${option.label}을(를) 확보했어요.`, option.detail); }} disabled={blocked} className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-left text-xs disabled:opacity-40"><p className="font-semibold text-slate-700">{option.label}</p><p className="mt-1 text-[11px] text-slate-500">+{delta}</p></button>; })}</div></div>{bonusChoicesUnlocked ? <div className="space-y-3"><p className="text-sm font-semibold text-slate-800">보너스</p><div className="grid grid-cols-2 gap-2">{ISLAND_SURPRISE_OPTIONS[currentWeek].map((option) => <button key={option.id} type="button" onClick={() => { if (!canUseActions) return; setSupportGauge((prev) => clampGauge(prev + option.delta)); storeCollectedItem(getPetCardIcon(option.label), option.label, "card"); appendLog("violet", `${currentWeek}주차 보너스 카드 ${option.label}을(를) 사용했어요.`, option.detail); }} disabled={!canUseActions} className="rounded-2xl border border-violet-200 bg-violet-50 p-2.5 text-left text-xs disabled:opacity-40"><p className="font-semibold text-violet-700">{option.label}</p><p className="mt-1 text-[11px] text-violet-600">+{option.delta}</p></button>)}</div></div> : null}<div className="space-y-3"><p className="text-sm font-semibold text-slate-800">응원</p><div className="grid gap-2"><select value={cheerTargetUserId} onChange={(event) => setCheerTargetUserId(event.target.value)} className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700" disabled={!selectedPermission.canLeadTheme}>{cheerTargets.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><select value={cheerMessage} onChange={(event) => setCheerMessage(event.target.value)} className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700" disabled={!selectedPermission.canLeadTheme}>{PET_CHEER_MESSAGES.map((message) => <option key={message} value={message}>{message}</option>)}</select><button type="button" onClick={handleSendCheer} disabled={!selectedPermission.canLeadTheme || !canUseActions} className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">응원 보내기</button></div></div></div> : <MobileInfoTabs activeSection={mobileInfoSection} onChangeSection={setMobileInfoSection} selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} actionTokens={actionTokens} players={players} selectedPlayer={selectedPlayer} selectedPermission={selectedPermission} currentWeek={currentWeek} selectedTokens={selectedTokens} weekLogs={weekLogs} contributionTitle="내 기여 모아보기" contributionLogs={seasonComplete ? myFinalWeekLogs : myAllLogs.slice(0, 4)} contributionEmptyText={seasonComplete ? `4주차에 내가 남긴 행동이 아직 없어요. 마지막 주에는 ${mePlayer.name}를 선택해 탈출 기여를 남겨보세요.` : `아직 내 행동 기록이 없어요. 랭킹에서 ${mePlayer.name}를 선택한 뒤 이번 주 행동을 남겨보세요.`} selectedMissionRecord={selectedMissionRecord} isMvp={selectedPlayer.id === currentMvpUserId} activeNotice={activeNotice} mvpUserId={currentMvpUserId} missionRecordsByUser={weekMissionRecords} className="block" />}
      </MobileBottomSheet>
      <section className="hidden gap-4 lg:grid lg:grid-cols-[1.2fr_0.8fr]"><RankingPanel selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} actionTokens={actionTokens} players={players} mvpUserId={currentMvpUserId} missionRecordsByUser={weekMissionRecords} /><SelectedUserPanel selectedPlayer={selectedPlayer} selectedPermission={selectedPermission} currentWeek={currentWeek} selectedTokens={selectedTokens} selectedMissionRecord={selectedMissionRecord} isMvp={selectedPlayer.id === currentMvpUserId} activeNotice={activeNotice} /></section>
      <section className="hidden gap-4 xl:grid xl:grid-cols-[1.1fr_0.9fr]"><LogsPanel title={`${currentWeek}주차 행동 기록`} subtitle="Week Action Trail" logs={weekLogs} /><MyContributionPanel title="내 기여 모아보기" logs={seasonComplete ? myFinalWeekLogs : myAllLogs.slice(0, 4)} emptyText={seasonComplete ? `4주차에 내가 남긴 행동이 아직 없어요. 마지막 주에는 ${mePlayer.name}를 선택해 탈출 기여를 남겨보세요.` : `아직 내 행동 기록이 없어요. 랭킹에서 ${mePlayer.name}를 선택한 뒤 이번 주 행동을 남겨보세요.`} /></section>
    </main>
  );
}

function DrawingCoopGame({
  onBackToMenu,
}: {
  onBackToMenu: () => void;
}) {
  const recognitionRef = useRef<any>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const elementsRef = useRef<DrawingElement[]>([]);
  const moveHoldTimerRef = useRef<number | null>(null);
  const moveHoldStartRef = useRef<DrawingPoint | null>(null);
  const moveTargetIdRef = useRef<string | null>(null);
  const lastMovePointerRef = useRef<DrawingPoint | null>(null);
  const [players, setPlayers] = useState<CoopPlayer[]>(() => sortPlayersByPoints(MOCK_PLAYERS));
  const [selectedUserId, setSelectedUserId] = useState("p3");
  const [mobileInfoSection, setMobileInfoSection] = useState<MobileInfoSection>("selected");
  const [currentWeek, setCurrentWeek] = useState<WeekNumber>(1);
  const [progressWeek, setProgressWeek] = useState(1);
  const [seasonComplete, setSeasonComplete] = useState(false);
  const [weekResolved, setWeekResolved] = useState(false);
  const [weekStatusMessage, setWeekStatusMessage] = useState("빈 캔버스에서 시작해 배경 투표와 주제 선택부터 진행해 보세요.");
  const [backgroundTheme, setBackgroundTheme] = useState<DrawingTheme>("blue");
  const [selectedSubject, setSelectedSubject] = useState<DrawingSubject | null>(null);
  const [themeVotes, setThemeVotes] = useState<Record<WeekNumber, Record<string, DrawingTheme>>>(() => ({ 1: {}, 2: {}, 3: {}, 4: {} }));
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [selectedColor, setSelectedColor] = useState("#1e293b");
  const [selectedSize, setSelectedSize] = useState(8);
  const [selectedSticker, setSelectedSticker] = useState(DRAWING_STICKERS[0]);
  const [bonusPaletteColors, setBonusPaletteColors] = useState<string[]>([]);
  const [bonusStickerEmojis, setBonusStickerEmojis] = useState<string[]>([]);
  /** -1: 액자 숨김, 0 이상: SPARKLE_FINISH_FRAME_THEMES 인덱스 */
  const [sparkleFrameStyleIndex, setSparkleFrameStyleIndex] = useState(-1);
  const [sketchTextureUnlocked, setSketchTextureUnlocked] = useState(false);
  const [sketchStrokeStyle, setSketchStrokeStyle] = useState<DrawingStrokeStyle>("solid");
  const [elementMoveUnlocked, setElementMoveUnlocked] = useState(false);
  const [compositionGuideVisible, setCompositionGuideVisible] = useState(false);
  const [movingElementId, setMovingElementId] = useState<string | null>(null);
  const [colorBucketUnlocked, setColorBucketUnlocked] = useState(false);
  const [gradientOverlayLevel, setGradientOverlayLevel] = useState(0);
  const [themeGauge, setThemeGauge] = useState(0);
  const [drawGauge, setDrawGauge] = useState(0);
  const [stickerGauge, setStickerGauge] = useState(0);
  const [actionTokens, setActionTokens] = useState<Record<string, number>>(() => getDrawingTokensForWeek(1));
  const [stickerAllowances, setStickerAllowances] = useState<Record<string, number>>(() => ({ p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 }));
  const [stickerUsages, setStickerUsages] = useState<Record<string, number>>(() => ({ p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 }));
  const [actionLogs, setActionLogs] = useState<SharedLog[]>(DRAWING_INITIAL_LOGS);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  elementsRef.current = elements;
  const [draft, setDraft] = useState<
    | { kind: "pen"; points: DrawingPoint[] }
    | { kind: "shape"; tool: "line" | "rect" | "circle"; start: DrawingPoint; end: DrawingPoint }
    | null
  >(null);
  const [actionsTakenThisWeek, setActionsTakenThisWeek] = useState(0);
  const [surpriseCardVisible, setSurpriseCardVisible] = useState(false);
  const [bonusChoicesUnlocked, setBonusChoicesUnlocked] = useState(false);
  const [missionDifficulty, setMissionDifficulty] = useState<MissionDifficulty>("easy");
  const [missionBoard, setMissionBoard] = useState<Record<WeekNumber, Record<string, MissionRecord>>>(() => createEmptyMissionBoard());
  const [missionMessage, setMissionMessage] = useState("카드를 열고 그림 미션을 시작해 보세요.");
  const [missionListening, setMissionListening] = useState(false);
  const [teamNotices, setTeamNotices] = useState<TeamNotice[]>([]);
  const [leaderMessageTargetUserId, setLeaderMessageTargetUserId] = useState("p1");
  const [leaderMessage, setLeaderMessage] = useState(DRAWING_LEADER_MESSAGES[0]);
  const [toastNotices, setToastNotices] = useState<ToastNotice[]>([]);
  const [latestMissionAccuracy, setLatestMissionAccuracy] = useState<number | null>(null);
  const [mvpReward, setMvpReward] = useState<MvpRewardState | null>(null);
  const [finalCompletedByName, setFinalCompletedByName] = useState<string | null>(null);
  const [missionPromptCursor, setMissionPromptCursor] = useState<Record<MissionDifficulty, number>>({ easy: 0, medium: 0, hard: 0 });
  const [showFinishInfo, setShowFinishInfo] = useState(false);
  const [missionBurst, setMissionBurst] = useState(false);

  const mePlayer = useMemo(() => players.find((player) => player.isMe) ?? players[2] ?? players[0], [players]);
  const selectedPlayer = useMemo(() => players.find((player) => player.id === selectedUserId) ?? players[0], [players, selectedUserId]);
  const selectedRank = useMemo(() => players.findIndex((player) => player.id === selectedPlayer.id) + 1, [players, selectedPlayer.id]);
  const selectedPermission = useMemo(() => getPermissionByRank(selectedRank), [selectedRank]);
  const currentConfig = DRAWING_WEEK_CONFIGS[currentWeek];
  const selectedTokens = actionTokens[selectedPlayer.id] ?? 0;
  const canUseActions = !weekResolved && !seasonComplete && selectedTokens > 0;
  const drawingEnabled = currentWeek >= 2 && canUseActions;
  const stageGauge = useMemo(
    () => (currentWeek === 1 ? themeGauge : currentWeek === 4 ? stickerGauge : drawGauge),
    [currentWeek, drawGauge, stickerGauge, themeGauge]
  );
  const stageGaugeLabel = currentWeek === 1 ? "기획 완성도" : currentWeek === 2 ? "스케치 완성도" : currentWeek === 3 ? "채색 완성도" : "장식 완성도";
  const totalCompletionGauge = useMemo(() => clampGauge(themeGauge + drawGauge + stickerGauge), [themeGauge, drawGauge, stickerGauge]);
  const weekLogs = useMemo(() => actionLogs.filter((log) => log.week === currentWeek || log.week === 0), [actionLogs, currentWeek]);
  const myAllLogs = useMemo(() => actionLogs.filter((log) => log.userId === mePlayer.id), [actionLogs, mePlayer.id]);
  const myFinalWeekLogs = useMemo(() => actionLogs.filter((log) => log.userId === mePlayer.id && log.week === 4), [actionLogs, mePlayer.id]);
  const themeMeta = DRAWING_THEME_OPTIONS.find((theme) => theme.id === backgroundTheme) ?? DRAWING_THEME_OPTIONS[0];
  const subjectMeta = selectedSubject ? DRAWING_SUBJECT_OPTIONS.find((subject) => subject.id === selectedSubject) ?? null : null;
  const planningVotes = themeVotes[1];
  const themeVoteCounts = useMemo(
    () =>
      Object.values(planningVotes).reduce<Record<DrawingTheme, number>>(
        (acc, themeId) => {
          acc[themeId] += 1;
          return acc;
        },
        { blue: 0, sunset: 0, tropical: 0 }
      ),
    [planningVotes]
  );
  const votesSubmitted = Object.keys(planningVotes).length;
  const winningThemeId = useMemo(() => {
    return (Object.entries(themeVoteCounts).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      if (a[0] === backgroundTheme) return -1;
      if (b[0] === backgroundTheme) return 1;
      return 0;
    })[0]?.[0] as DrawingTheme) ?? backgroundTheme;
  }, [backgroundTheme, themeVoteCounts]);
  const paletteColors = useMemo(() => {
    const baseColors = currentWeek === 2 ? ["#1e293b", "#475569", "#94a3b8", "#ffffff"] : DRAWING_COLORS;
    return [...baseColors, ...bonusPaletteColors.filter((color) => !baseColors.includes(color))];
  }, [bonusPaletteColors, currentWeek]);
  const stickerPalette = useMemo(() => [...DRAWING_STICKERS, ...bonusStickerEmojis], [bonusStickerEmojis]);
  const activeColor = paletteColors.includes(selectedColor) ? selectedColor : paletteColors[0];
  const weekMissionRecords = missionBoard[currentWeek];
  const selectedMissionRecord = weekMissionRecords[selectedPlayer.id];
  const selectedMissionAttempts = selectedMissionRecord?.attempts ?? 0;
  const currentPrompt = getMissionPromptFromSet(DRAWING_MISSION_PROMPTS, currentWeek, missionDifficulty, missionPromptCursor[missionDifficulty]);
  const activeNotice = useMemo(() => teamNotices.find((notice) => notice.week === currentWeek && notice.toUserId === selectedPlayer.id) ?? null, [currentWeek, selectedPlayer.id, teamNotices]);
  const topNotice = useMemo(() => teamNotices.find((notice) => notice.week === currentWeek && notice.toUserId === selectedPlayer.id) ?? null, [currentWeek, selectedPlayer.id, teamNotices]);
  const leaderMessageTargets = useMemo(() => players.filter((player) => player.id !== selectedPlayer.id), [players, selectedPlayer.id]);
  const currentMvpUserId = useMemo(() => {
    const entries = Object.entries(weekMissionRecords);
    if (entries.length === 0) return null;
    entries.sort((a, b) => {
      if (b[1].totalScore !== a[1].totalScore) return b[1].totalScore - a[1].totalScore;
      if (b[1].bestScore !== a[1].bestScore) return b[1].bestScore - a[1].bestScore;
      if (a[1].attempts !== b[1].attempts) return a[1].attempts - b[1].attempts;
      const aName = players.find((player) => player.id === a[0])?.name ?? "";
      const bName = players.find((player) => player.id === b[0])?.name ?? "";
      return aName.localeCompare(bName);
    });
    return entries[0][0];
  }, [players, weekMissionRecords]);
  const currentMvpPlayer = useMemo(() => players.find((player) => player.id === currentMvpUserId) ?? null, [currentMvpUserId, players]);
  const canAttemptMission = bonusChoicesUnlocked && !seasonComplete && !weekResolved && selectedMissionAttempts < 3;
  /** 4주차는 진입 시 기본 1회 등으로 allowance가 채워지므로, 미설정(undefined)은 1로 간주 */
  const currentStickerAllowance =
    currentWeek === 4 ? stickerAllowances[selectedPlayer.id] ?? 1 : stickerAllowances[selectedPlayer.id] ?? 0;
  const currentStickerUsage = stickerUsages[selectedPlayer.id] ?? 0;
  const currentStickerRemaining = Math.max(0, currentStickerAllowance - currentStickerUsage);
  const sparkleFrameTheme =
    sparkleFrameStyleIndex >= 0
      ? SPARKLE_FINISH_FRAME_THEMES[sparkleFrameStyleIndex % SPARKLE_FINISH_FRAME_THEMES.length]
      : null;
  const canResolveWeek = !weekResolved && !seasonComplete && stageGauge >= currentConfig.threshold && currentMvpUserId !== null && selectedPlayer.id === currentMvpUserId;
  const currentStageLabel = seasonComplete
    ? "팀 공동 그림 완성"
    : currentWeek === 1
    ? "빈 캔버스에서 기획 중"
    : currentWeek === 2
    ? "연필 스케치를 쌓는 중"
    : currentWeek === 3
    ? "채색으로 분위기를 올리는 중"
    : "스티커와 장식으로 마감 중";
  const subjectBadges = subjectMeta
    ? subjectMeta.id === "festival"
      ? ["🎆", "🎵", "🏮"]
      : subjectMeta.id === "sea"
      ? ["🐠", "⛵", "🪸"]
      : ["🏖️", "🛟", "⛱️"]
    : ["📝", "🎨", "🖼️"];
  const toolOptions: Array<{ id: DrawingTool; label: string; minWeek: number }> = [
    { id: "pen", label: "펜", minWeek: 2 },
    { id: "line", label: "선", minWeek: 2 },
    { id: "rect", label: "사각형", minWeek: 2 },
    { id: "circle", label: "원", minWeek: 2 },
    { id: "move", label: "이동", minWeek: 2 },
    { id: "eraser", label: "지우개", minWeek: 2 },
    { id: "bucket", label: "페인트통", minWeek: 3 },
    { id: "sticker", label: "스티커", minWeek: 4 },
  ];
  const toolLabel = toolOptions.find((item) => item.id === tool)?.label ?? "펜";

  const pushToast = (title: string, body: string, tone: ToastNotice["tone"]) => {
    const id = `drawing-toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToastNotices((prev) => [{ id, title, body, tone }, ...prev].slice(0, 3));
    window.setTimeout(() => setToastNotices((prev) => prev.filter((item) => item.id !== id)), 3200);
  };

  const appendPassiveLog = (tone: SharedLog["tone"], userId: string, userName: string, summary: string, detail: string) => {
    setActionLogs((prev) => [{ id: `drawing-passive-${Date.now()}-${prev.length}`, week: currentWeek, userId, userName, tone, summary, detail }, ...prev]);
  };

  const appendLog = (tone: SharedLog["tone"], summary: string, detail: string) => {
    setActionLogs((prev) => [
      {
        id: `drawing-log-${Date.now()}-${prev.length}`,
        week: currentWeek,
        userId: selectedPlayer.id,
        userName: selectedPlayer.name,
        tone,
        summary,
        detail,
      },
      ...prev,
    ]);
  };

  const revealSurpriseCard = () => {
    if (surpriseCardVisible || seasonComplete || weekResolved) return;
    setSurpriseCardVisible(true);
    appendPassiveLog("violet", "system", "SYSTEM", `${currentWeek}주차에 서프라이즈 미션 카드가 등장했어요.`, "카드를 열어 음성 미션에 성공하면 더 많은 행동권을 받을 수 있어요.");
  };

  const spendAction = (pointGain: number) => {
    if (actionsTakenThisWeek === 0) revealSurpriseCard();
    setActionTokens((prev) => ({
      ...prev,
      [selectedPlayer.id]: Math.max(0, (prev[selectedPlayer.id] ?? 0) - 1),
    }));
    setPlayers((prev) => sortPlayersByPoints(prev.map((player) => (player.id === selectedPlayer.id ? { ...player, points: player.points + pointGain } : player))));
    setActionsTakenThisWeek((prev) => prev + 1);
  };

  const grantExtraDrawTokens = (userId: string) => {
    setActionTokens((prev) => ({ ...prev, [userId]: (prev[userId] ?? 0) + 3 }));
  };

  const resetDrawingGame = () => {
    recognitionRef.current?.stop();
    playClick();
    setPlayers(sortPlayersByPoints(MOCK_PLAYERS));
    setSelectedUserId("p3");
    setMobileInfoSection("selected");
    setCurrentWeek(1);
    setProgressWeek(1);
    setSeasonComplete(false);
    setWeekResolved(false);
    setWeekStatusMessage("빈 캔버스에서 시작해 배경 투표와 주제 선택부터 진행해 보세요.");
    setBackgroundTheme("blue");
    setSelectedSubject(null);
    setThemeVotes({ 1: {}, 2: {}, 3: {}, 4: {} });
    setTool("pen");
    setSelectedColor("#1e293b");
    setSelectedSize(8);
    setSelectedSticker(DRAWING_STICKERS[0]);
    setBonusPaletteColors([]);
    setBonusStickerEmojis([]);
    setSparkleFrameStyleIndex(-1);
    setSketchTextureUnlocked(false);
    setSketchStrokeStyle("solid");
    setElementMoveUnlocked(false);
    setCompositionGuideVisible(false);
    setColorBucketUnlocked(false);
    setMovingElementId(null);
    moveTargetIdRef.current = null;
    lastMovePointerRef.current = null;
    moveHoldStartRef.current = null;
    if (moveHoldTimerRef.current !== null) {
      window.clearTimeout(moveHoldTimerRef.current);
      moveHoldTimerRef.current = null;
    }
    setGradientOverlayLevel(0);
    setThemeGauge(0);
    setDrawGauge(0);
    setStickerGauge(0);
    setActionTokens(getDrawingTokensForWeek(1));
    setStickerAllowances({ p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 });
    setStickerUsages({ p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 });
    setActionLogs(DRAWING_INITIAL_LOGS);
    setElements([]);
    setDraft(null);
    setActionsTakenThisWeek(0);
    setSurpriseCardVisible(false);
    setBonusChoicesUnlocked(false);
    setMissionDifficulty("easy");
    setMissionBoard(createEmptyMissionBoard());
    setMissionMessage("카드를 열고 그림 미션을 시작해 보세요.");
    setMissionListening(false);
    setTeamNotices([]);
    setLeaderMessageTargetUserId("p1");
    setLeaderMessage(DRAWING_LEADER_MESSAGES[0]);
    setToastNotices([]);
    setLatestMissionAccuracy(null);
    setMvpReward(null);
    setFinalCompletedByName(null);
    setMissionPromptCursor({ easy: 0, medium: 0, hard: 0 });
    setShowFinishInfo(false);
    setMissionBurst(false);
  };

  const handleThemeVote = (themeId: DrawingTheme, label: string) => {
    if (!canUseActions || currentWeek !== 1) return;
    const previousVote = planningVotes[selectedPlayer.id];
    if (previousVote === themeId) {
      setWeekStatusMessage(`${selectedPlayer.name}님은 이미 ${label}에 투표했어요.`);
      return;
    }
    playClick();
    setThemeVotes((prev) => ({ ...prev, 1: { ...prev[1], [selectedPlayer.id]: themeId } }));
    setThemeGauge((prev) => clampGauge(prev + 8));
    appendLog("cyan", `${selectedPlayer.name}님이 ${label} 배경에 투표했어요.`, "투표 결과가 리더의 기획 보드에 반영됐어요.");
    spendAction(2);
  };

  const handleApplyTheme = (themeId: DrawingTheme, label: string) => {
    if (!canUseActions || currentWeek !== 1 || !selectedPermission.canLeadTheme) return;
    playClick();
    setBackgroundTheme(themeId);
    setThemeGauge((prev) => clampGauge(prev + 10));
    appendLog("emerald", `${selectedPlayer.name}님이 ${label} 배경을 반영했어요.`, "리더가 투표 결과를 캔버스 기본 배경에 적용했어요.");
    spendAction(4);
  };

  const handleSelectSubject = (subjectId: DrawingSubject, label: string) => {
    if (!canUseActions || currentWeek !== 1 || !selectedPermission.canLeadTheme) return;
    if (selectedSubject === subjectId) {
      setWeekStatusMessage(`이미 이번 시즌 주제가 ${label}(으)로 정해져 있어요.`);
      return;
    }
    playClick();
    setSelectedSubject(subjectId);
    setThemeGauge((prev) => clampGauge(prev + 12));
    appendLog("violet", `${selectedPlayer.name}님이 공동 그림 주제를 ${label}(으)로 정했어요.`, "이제 다음 주부터 같은 주제로 스케치를 시작할 수 있어요.");
    spendAction(4);
  };

  const commitDrawingElement = (element: DrawingElement) => {
    setElements((prev) => [...prev, element]);
    if (element.kind === "bucketFill") {
      setDrawGauge((prev) => clampGauge(prev + 10));
      appendLog("cyan", `${selectedPlayer.name}님이 페인트통으로 영역을 채웠어요.`, "닫힌 선 안쪽으로 색이 퍼졌어요.");
      setWeekStatusMessage("페인트통으로 영역이 채워졌어요.");
      spendAction(3);
      return;
    }
    if (element.kind === "sticker") {
      setStickerUsages((prev) => ({ ...prev, [selectedPlayer.id]: (prev[selectedPlayer.id] ?? 0) + 1 }));
      setStickerGauge((prev) => clampGauge(prev + 9));
      appendLog("violet", `${selectedPlayer.name}님이 ${element.sticker} 스티커를 붙였어요.`, `${currentWeek}주차 그림에 마지막 장식 포인트가 추가됐어요.`);
      setWeekStatusMessage(`스티커 장식이 추가됐어요. 남은 횟수 ${Math.max(0, currentStickerRemaining - 1)}회`);
      spendAction(3);
      return;
    }

    const nextGain = currentWeek === 2 ? 9 : currentWeek === 3 ? 10 : 7;
    setDrawGauge((prev) => clampGauge(prev + nextGain));
    appendLog(
      element.kind === "shape" ? "cyan" : "amber",
      `${selectedPlayer.name}님이 ${element.kind === "shape" ? "도형" : "선"} 작업을 했어요.`,
      `${currentConfig.phaseLabel} 단계 그림이 더 구체적으로 다듬어졌어요.`
    );
    setWeekStatusMessage(currentWeek === 2 ? "스케치 선이 더 또렷해졌어요." : currentWeek === 3 ? "채색 레이어가 더 쌓였어요." : "마무리 선이 추가됐어요.");
    spendAction(3);
  };

  const removeElementAtPoint = (point: DrawingPoint) => {
    const list = elementsRef.current;
    let hit: DrawingElement | null = null;
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (isDrawingElementHit(list[i], point)) {
        hit = list[i];
        break;
      }
    }
    if (!hit) return;
    if (hit.kind === "sticker") {
      setStickerUsages((prev) => ({
        ...prev,
        [hit.userId]: Math.max(0, (prev[hit.userId] ?? 0) - 1),
      }));
      setStickerGauge((prev) => clampGauge(prev - 9));
    }
    setElements((prev) => prev.filter((el) => el.id !== hit!.id));
    appendLog("orange", `${selectedPlayer.name}님이 지우개로 수정했어요.`, "캔버스에서 요소를 지웠어요.");
    setWeekStatusMessage(hit.kind === "sticker" ? "지우개로 스티커를 지웠어요." : "지우개로 일부를 수정했어요.");
    spendAction(2);
  };

  const clearMoveHoldTimer = () => {
    if (moveHoldTimerRef.current !== null) {
      window.clearTimeout(moveHoldTimerRef.current);
      moveHoldTimerRef.current = null;
    }
    moveHoldStartRef.current = null;
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drawingEnabled) return;
    const selectedTool = toolOptions.find((item) => item.id === tool);
    if (!selectedTool || currentWeek < selectedTool.minWeek) return;
    const point = getDrawingPointFromEvent(event, svgRef);

    if (tool === "move") {
      if (currentWeek !== 2 || !elementMoveUnlocked) return;
      clearMoveHoldTimer();
      moveHoldStartRef.current = point;
      moveHoldTimerRef.current = window.setTimeout(() => {
        moveHoldTimerRef.current = null;
        const start = moveHoldStartRef.current;
        moveHoldStartRef.current = null;
        if (!start) return;
        const hit = getTopmostElementAtPoint(elementsRef.current, start);
        if (!hit) return;
        moveTargetIdRef.current = hit.id;
        lastMovePointerRef.current = start;
        setMovingElementId(hit.id);
      }, 420);
      return;
    }

    if (tool === "bucket") {
      if (currentWeek !== 3 || !colorBucketUnlocked) return;
      const built = buildPaintBucketDataUrl(elements, point, activeColor);
      if (!built) {
        setWeekStatusMessage("선으로 닫힌 안쪽을 눌러 주세요. 이미 채워졌거나 막힌 곳은 채워지지 않아요.");
        return;
      }
      playClick();
      commitDrawingElement({
        id: `drawing-bucket-${Date.now()}`,
        kind: "bucketFill",
        href: built.href,
        hitMask: built.hitMask,
        userId: selectedPlayer.id,
        userName: selectedPlayer.name,
        week: 3,
      });
      return;
    }

    if (tool === "eraser") {
      removeElementAtPoint(point);
      return;
    }

    if (tool === "sticker") {
      if (currentWeek !== 4 || currentStickerRemaining <= 0) {
        setWeekStatusMessage(currentWeek !== 4 ? "스티커는 4주차부터 사용할 수 있어요." : "이 유저의 스티커 횟수를 모두 사용했어요.");
        return;
      }
      commitDrawingElement({
        id: `drawing-sticker-${Date.now()}`,
        kind: "sticker",
        sticker: selectedSticker,
        point,
        size: getStickerSizeFromThickness(selectedSize),
        userId: selectedPlayer.id,
        userName: selectedPlayer.name,
        week: currentWeek,
      });
      return;
    }

    if (tool === "pen") {
      setDraft({ kind: "pen", points: [point] });
      return;
    }

    setDraft({ kind: "shape", tool, start: point, end: point });
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = getDrawingPointFromEvent(event, svgRef);

    if (moveTargetIdRef.current) {
      const last = lastMovePointerRef.current;
      const targetId = moveTargetIdRef.current;
      if (last) {
        const dx = point.x - last.x;
        const dy = point.y - last.y;
        lastMovePointerRef.current = point;
        setElements((prev) => prev.map((el) => (el.id === targetId ? translateDrawingElement(el, dx, dy) : el)));
      }
      return;
    }

    if (tool === "move" && moveHoldStartRef.current !== null && moveHoldTimerRef.current !== null) {
      const start = moveHoldStartRef.current;
      if (getDrawingDistance(start, point) > 14) clearMoveHoldTimer();
      return;
    }

    if (!draft) return;
    if (draft.kind === "pen") {
      setDraft((prev) => {
        if (!prev || prev.kind !== "pen") return prev;
        const lastPoint = prev.points[prev.points.length - 1];
        if (getDrawingDistance(lastPoint, point) < 4) return prev;
        return { ...prev, points: [...prev.points, point] };
      });
      return;
    }
    setDraft((prev) => (prev && prev.kind === "shape" ? { ...prev, end: point } : prev));
  };

  const finishPointer = () => {
    clearMoveHoldTimer();
    if (moveTargetIdRef.current) {
      moveTargetIdRef.current = null;
      lastMovePointerRef.current = null;
      setMovingElementId(null);
      appendLog("amber", `${selectedPlayer.name}님이 스케치 요소를 옮겼어요.`, "길게 눌러 잡은 뒤 위치를 조정했어요.");
      setWeekStatusMessage("요소 위치를 옮겼어요.");
      return;
    }
    commitDraft();
  };

  const commitDraft = () => {
    if (!draft || currentWeek < 2) return;
    if (draft.kind === "pen") {
      const points = draft.points.length < 2 ? [...draft.points, draft.points[0]] : draft.points;
      commitDrawingElement({
        id: `drawing-stroke-${Date.now()}`,
        kind: "stroke",
        tool: "pen",
        points,
        color: activeColor,
        size: selectedSize,
        strokeStyle: currentWeek === 2 ? sketchStrokeStyle : undefined,
        userId: selectedPlayer.id,
        userName: selectedPlayer.name,
        week: currentWeek,
      });
      setDraft(null);
      return;
    }

    const width = Math.abs(draft.end.x - draft.start.x);
    const height = Math.abs(draft.end.y - draft.start.y);
    if (width < 6 && height < 6) {
      setDraft(null);
      return;
    }

    commitDrawingElement({
      id: `drawing-shape-${Date.now()}`,
      kind: "shape",
      tool: draft.tool,
      start: draft.start,
      end: draft.end,
      color: activeColor,
      size: selectedSize,
      userId: selectedPlayer.id,
      userName: selectedPlayer.name,
      week: currentWeek,
    });
    setDraft(null);
  };

  const previewDraft: DrawingElement | null = useMemo(() => {
    if (!draft || currentWeek < 2) return null;
    if (draft.kind === "pen") {
      const points = draft.points.length < 2 ? [...draft.points, draft.points[0]] : draft.points;
      return {
        id: "drawing-draft",
        kind: "stroke",
        tool: "pen",
        points,
        color: activeColor,
        size: selectedSize,
        strokeStyle: currentWeek === 2 ? sketchStrokeStyle : undefined,
        userId: selectedPlayer.id,
        userName: selectedPlayer.name,
        week: currentWeek,
      };
    }
    return {
      id: "drawing-draft",
      kind: "shape",
      tool: draft.tool,
      start: draft.start,
      end: draft.end,
      color: activeColor,
      size: selectedSize,
      userId: selectedPlayer.id,
      userName: selectedPlayer.name,
      week: currentWeek,
    };
  }, [activeColor, currentWeek, draft, selectedPlayer.id, selectedPlayer.name, selectedSize, sketchStrokeStyle]);

  const moveToNextWeek = (nextWeek: WeekNumber) => {
    setCurrentWeek(nextWeek);
    setProgressWeek(nextWeek);
    setWeekResolved(false);
    setDraft(null);
    setActionTokens(getDrawingTokensForWeek(nextWeek));
    setActionsTakenThisWeek(0);
    setSurpriseCardVisible(false);
    setBonusChoicesUnlocked(false);
    setMissionDifficulty("easy");
    setMissionMessage("카드를 열고 그림 미션을 시작해 보세요.");
    setLatestMissionAccuracy(null);
    setMissionListening(false);
    setLeaderMessage(DRAWING_LEADER_MESSAGES[Math.min(nextWeek - 1, DRAWING_LEADER_MESSAGES.length - 1)]);
    setMvpReward(null);
    setMissionPromptCursor({ easy: 0, medium: 0, hard: 0 });
    setShowFinishInfo(false);
    setMissionBurst(false);
    setGradientOverlayLevel(0);
    setBonusStickerEmojis([]);
    setSparkleFrameStyleIndex(-1);
    setSketchTextureUnlocked(false);
    setSketchStrokeStyle("solid");
    setElementMoveUnlocked(false);
    setCompositionGuideVisible(false);
    setColorBucketUnlocked(false);
    setMovingElementId(null);
    moveTargetIdRef.current = null;
    lastMovePointerRef.current = null;
    clearMoveHoldTimer();
    setTool(nextWeek === 4 ? "sticker" : "pen");
    setSelectedColor(nextWeek === 2 ? "#1e293b" : DRAWING_COLORS[1]);
    setSelectedSize(nextWeek === 2 ? 6 : 8);
    setThemeGauge(nextWeek === 2 ? 10 : nextWeek === 3 ? 8 : 5);
    setDrawGauge(0);
    setStickerGauge(0);
    setStickerUsages({ p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 });
    setStickerAllowances(nextWeek === 4 ? { p1: 1, p2: 1, p3: 1, p4: 1, p5: 1 } : { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 });
    setWeekStatusMessage(
      nextWeek === 2
        ? "2주차에 들어왔어요. 이제 큰 형태와 구도를 스케치해 보세요."
        : nextWeek === 3
        ? "3주차에 들어왔어요. 스케치 위에 색을 올려 보세요."
        : "4주차에 들어왔어요. 스티커와 장식으로 마무리해 보세요."
    );
  };

  const handleMissionFailure = (detail: string, accuracy = 0) => {
    setMissionBoard((prev) => {
      const currentRecord = prev[currentWeek][selectedPlayer.id] ?? { attempts: 0, successes: 0, totalScore: 0, bestScore: 0 };
      return {
        ...prev,
        [currentWeek]: {
          ...prev[currentWeek],
          [selectedPlayer.id]: { ...currentRecord, attempts: currentRecord.attempts + 1, lastAccuracy: accuracy },
        },
      };
    });
    appendPassiveLog("orange", selectedPlayer.id, selectedPlayer.name, `${selectedPlayer.name}님이 그림 미션을 다시 시도해요.`, detail);
    setMissionMessage(detail);
    setLatestMissionAccuracy(accuracy);
    setMissionPromptCursor((prev) => ({ ...prev, [missionDifficulty]: prev[missionDifficulty] + 1 }));
  };

  const handleMissionSuccess = (spokenText: string, accuracy: number) => {
    const attemptNumber = selectedMissionAttempts + 1;
    const score = calculateMissionScoreFromSet(DRAWING_MISSION_PROMPTS, currentWeek, missionDifficulty, attemptNumber);
    const alreadyRewarded = selectedMissionRecord?.rewardClaimed ?? false;
    setMissionBoard((prev) => {
      const currentRecord = prev[currentWeek][selectedPlayer.id] ?? { attempts: 0, successes: 0, totalScore: 0, bestScore: 0 };
      const nextBestScore = Math.max(currentRecord.bestScore, score);
      return {
        ...prev,
        [currentWeek]: {
          ...prev[currentWeek],
          [selectedPlayer.id]: {
            attempts: currentRecord.attempts + 1,
            successes: currentRecord.successes + 1,
            totalScore: currentRecord.totalScore + score,
            bestScore: nextBestScore,
            bestDifficulty: score >= nextBestScore ? missionDifficulty : currentRecord.bestDifficulty ?? missionDifficulty,
            rewardClaimed: true,
            lastAccuracy: accuracy,
          },
        },
      };
    });
    setPlayers((prev) => sortPlayersByPoints(prev.map((player) => (player.id === selectedPlayer.id ? { ...player, points: player.points + score } : player))));
    setBonusChoicesUnlocked(true);
    if (!alreadyRewarded) grantExtraDrawTokens(selectedPlayer.id);
    if (currentWeek === 4) {
      setStickerAllowances((prev) => ({ ...prev, [selectedPlayer.id]: (prev[selectedPlayer.id] ?? 1) + 1 }));
    }
    appendPassiveLog(
      "emerald",
      selectedPlayer.id,
      selectedPlayer.name,
      `${selectedPlayer.name}님이 그림 미션에 성공했어요.`,
      `난이도 ${getMissionDifficultyLabel(missionDifficulty)}, +${score}P, 추가 행동권 +3${currentWeek === 4 ? ", 스티커 횟수 +1" : ""}, 인식 문장: "${spokenText}".`
    );
    setMissionMessage("미션 성공! 이번 주에 더 많이 그릴 수 있게 됐어요.");
    setLatestMissionAccuracy(accuracy);
    setMissionPromptCursor((prev) => ({ ...prev, [missionDifficulty]: prev[missionDifficulty] + 1 }));
    setMissionBurst(true);
    window.setTimeout(() => setMissionBurst(false), 1800);
    pushToast("그림 미션 성공", `${selectedPlayer.name}이(가) ${score}점을 얻고 추가 행동권을 받았어요.`, "emerald");
  };

  const startVoiceMission = () => {
    if (!canAttemptMission) {
      setMissionMessage("이 학생은 이번 주 그림 미션을 이미 3번 시도했어요.");
      return;
    }
    if (weekResolved || seasonComplete) return;
    const recognitionWindow = window as Window & { SpeechRecognition?: BrowserSpeechRecognitionCtor; webkitSpeechRecognition?: BrowserSpeechRecognitionCtor };
    const SpeechRecognitionCtor = recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setMissionMessage("이 브라우저에서는 음성 인식을 지원하지 않아요.");
      return;
    }
    recognitionRef.current?.stop();
    playClick();
    setMissionListening(true);
    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const spokenText = Array.from(event.results as ArrayLike<any>).map((result: any) => result[0]?.transcript ?? "").join(" ").trim();
      const accuracy = getSpeechMatchScore(currentPrompt.text, spokenText);
      const successThreshold = getMissionSuccessThreshold(missionDifficulty);
      if (accuracy >= successThreshold) handleMissionSuccess(spokenText, accuracy);
      else handleMissionFailure(`정확도 ${(accuracy * 100).toFixed(0)}% · 다시 도전`, accuracy);
    };
    recognition.onerror = () => handleMissionFailure("음성 인식 오류", 0);
    recognition.onend = () => setMissionListening(false);
    recognition.start();
  };

  const openSurpriseCard = () => {
    if (!surpriseCardVisible) return;
    playClick();
    setBonusChoicesUnlocked(true);
    setMissionMessage("");
    setWeekStatusMessage("서프라이즈 카드가 열렸어요. 그림 미션을 시작해 보세요.");
    appendPassiveLog("violet", "system", "SYSTEM", "보너스 미션 카드가 열렸어요.", "이번 주 그림 미션을 수행하면 추가 행동권을 받을 수 있어요.");
  };

  const handleLeaderMessage = () => {
    const targetPlayer = players.find((player) => player.id === leaderMessageTargetUserId);
    if (!targetPlayer || targetPlayer.id === selectedPlayer.id || !selectedPermission.canLeadTheme || !canUseActions) return;
    playClick();
    const notice: TeamNotice = {
      id: `drawing-cheer-${Date.now()}`,
      week: currentWeek,
      fromUserId: selectedPlayer.id,
      fromUserName: selectedPlayer.name,
      toUserId: targetPlayer.id,
      toUserName: targetPlayer.name,
      message: leaderMessage,
      createdAt: Date.now(),
    };
    setTeamNotices((prev) => [notice, ...prev.filter((item) => !(item.week === currentWeek && item.toUserId === targetPlayer.id))]);
    setActionTokens((prev) => ({ ...prev, [targetPlayer.id]: (prev[targetPlayer.id] ?? 0) + 1 }));
    setSelectedUserId(targetPlayer.id);
    appendLog("violet", `${targetPlayer.name}에게 응원을 보냈어요.`, leaderMessage);
    spendAction(2);
    pushToast("응원 알림 전송", `${targetPlayer.name}에게 "${leaderMessage}" 알림을 보냈어요.`, "cyan");
  };

  const handleBonusAction = (option: ActionOption) => {
    if (!canUseActions || !bonusChoicesUnlocked) return;
    playClick();
    if (currentWeek === 1) {
      setThemeGauge((prev) => clampGauge(prev + option.delta));
    } else if (currentWeek === 4) {
      if (option.id !== "dr-card-12") {
        setStickerGauge((prev) => clampGauge(prev + option.delta));
      }
      if (option.id === "dr-card-12") {
        const prevAllow = stickerAllowances[selectedPlayer.id] ?? 1;
        const usageNow = stickerUsages[selectedPlayer.id] ?? 0;
        setStickerAllowances((prev) => {
          const next = { ...prev };
          for (const player of players) {
            const id = player.id;
            next[id] = (prev[id] ?? 1) + 2;
          }
          return next;
        });
        const remainingAfter = Math.max(0, prevAllow + 2 - usageNow);
        setWeekStatusMessage(`팀 데코 카드! ${selectedPlayer.name}님 기준 남은 스티커 ${remainingAfter}회 (허용 횟수 +2)`);
        pushToast("팀 데코 카드", `스티커 허용 +2회 · ${selectedPlayer.name}님 남은 ${remainingAfter}회 (장식 게이지는 오르지 않아요)`, "violet");
      } else if (option.id === "dr-card-10") {
        setBonusStickerEmojis((prev) => [...prev, "🎀", "💖", "📷"]);
      } else if (option.id === "dr-card-11") {
        setSparkleFrameStyleIndex((prev) => {
          const next = prev < 0 ? 0 : (prev + 1) % SPARKLE_FINISH_FRAME_THEMES.length;
          const theme = SPARKLE_FINISH_FRAME_THEMES[next]!;
          setWeekStatusMessage(`반짝 마감: 액자가 ${theme.label} 톤으로 바뀌었어요.`);
          pushToast("반짝 마감 카드", `${theme.label} 액자 — 누를 때마다 색이 바뀌어요.`, "violet");
          return next;
        });
      }
    } else {
      setDrawGauge((prev) => clampGauge(prev + option.delta));
    }

    if (currentWeek === 2 && option.id === "dr-card-4") {
      setSketchTextureUnlocked(true);
      setWeekStatusMessage("스케치 연필 카드로 '텍스처 연필' 선을 팔레트에서 선택할 수 있어요.");
      pushToast("연필 카드", "2주차 도구에서 실선 / 텍스처 연필을 고를 수 있어요.", "violet");
    } else     if (currentWeek === 2 && option.id === "dr-card-5") {
      setElementMoveUnlocked(true);
      setTool("move");
      setWeekStatusMessage("요소 이동 도구가 열렸어요. 이동을 고른 뒤 요소 위를 길게 눌러 옮겨 보세요.");
      pushToast("요소 이동 카드", "이동 도구에서 길게 누르면 스케치를 잡아 옮길 수 있어요.", "violet");
    } else if (currentWeek === 2 && option.id === "dr-card-6") {
      const nextGuide = !compositionGuideVisible;
      setCompositionGuideVisible(nextGuide);
      setWeekStatusMessage(
        nextGuide
          ? "구도 가이드선을 켰어요. 스튜디오 패널의 해제로 끌 수 있어요."
          : "구도 가이드선을 껐어요."
      );
    } else if (currentWeek === 3 && option.id === "dr-card-7") {
      setColorBucketUnlocked(true);
      setTool("bucket");
      setWeekStatusMessage("페인트통이 열렸어요. 닫힌 선 안을 누르면 그 안만 색이 채워져요.");
      pushToast("채색 부스트", "페인트통 도구로 스케치 안쪽만 골라 채울 수 있어요.", "violet");
    } else if (currentWeek === 3 && option.id === "dr-card-8") {
      const paletteBundles = [
        ["#7c3aed", "#fb7185", "#22c55e"],
        ["#38bdf8", "#f97316", "#fde047"],
        ["#6366f1", "#f43f5e", "#10b981"],
        ["#06b6d4", "#a855f7", "#84cc16"],
      ];
      const bundle = paletteBundles[bonusPaletteColors.length % paletteBundles.length];
      setBonusPaletteColors((prev) => [...prev, ...bundle]);
      setWeekStatusMessage("팔레트 카드로 새 색상 세트가 추가됐어요.");
    } else if (currentWeek === 3 && option.id === "dr-card-9") {
      setGradientOverlayLevel((prev) => prev + 1);
      setWeekStatusMessage("그라데이션 카드로 캔버스 그라데이션이 더 진해졌어요.");
    } else if (currentWeek === 4 && option.id === "dr-card-10") {
      setWeekStatusMessage("피날레 스티커 카드로 새 스티커가 팔레트에 추가됐어요.");
    } else if (currentWeek === 4) {
      if (option.id !== "dr-card-12" && option.id !== "dr-card-11") {
        setWeekStatusMessage("장식 보너스로 이번 주 작업량이 늘어났어요.");
      }
    } else {
      setWeekStatusMessage("보너스 카드 효과로 이번 주 작업량이 늘어났어요.");
    }
    appendLog("violet", `${currentWeek}주차 보너스 카드 ${option.label}을(를) 사용했어요.`, option.detail);
    spendAction(3);
  };

  const handleResolveWeek = () => {
    if (weekResolved || seasonComplete) return;
    if (!currentMvpUserId) {
      setWeekStatusMessage("음성 미션으로 이번 주 MVP를 먼저 정해 주세요.");
      return;
    }
    if (selectedPlayer.id !== currentMvpUserId) {
      setWeekStatusMessage(`완료 버튼은 이번 주 MVP ${currentMvpPlayer?.name ?? ""}만 누를 수 있어요.`);
      return;
    }
    if (stageGauge < currentConfig.threshold) {
      setWeekStatusMessage(`${stageGaugeLabel}가 아직 ${currentConfig.threshold}%에 도달하지 않았어요.`);
      return;
    }
    playClick();
    const success = stageGauge >= currentConfig.threshold;
    setActionLogs((prev) => [
      {
        id: `drawing-system-${Date.now()}`,
        week: currentWeek,
        userId: "system",
        userName: "SYSTEM",
        tone: success ? "emerald" : "orange",
        summary: success ? currentConfig.successSummary : currentConfig.failSummary,
        detail: success
          ? `${currentConfig.successDetail}${currentMvpPlayer ? ` 이번 주 미션 MVP는 ${currentMvpPlayer.name}였어요.` : ""}`
          : currentConfig.failDetail,
      },
      ...prev,
    ]);
    if (!success) {
      setActionTokens(getDrawingTokensForWeek(currentWeek));
      setWeekStatusMessage(`${currentWeek}주차 완성도가 부족해 행동권을 재충전했어요.`);
      return;
    }
    setWeekResolved(true);
    const rewardMeta = getDrawingMvpBadge(currentWeek);
    setMvpReward({
      week: currentWeek,
      userId: currentMvpPlayer?.id ?? selectedPlayer.id,
      userName: currentMvpPlayer?.name ?? selectedPlayer.name,
      badge: rewardMeta.badge,
      title: rewardMeta.title,
    });
    pushToast("이번 주 MVP 확정", `${currentMvpPlayer?.name ?? selectedPlayer.name}이(가) ${rewardMeta.title}를 받았어요.`, "violet");
    if (currentWeek === 4) {
      setSeasonComplete(true);
      setProgressWeek(5);
      setFinalCompletedByName(selectedPlayer.name);
      setWeekStatusMessage("시즌 종료: 하나의 공동 그림이 완성됐어요.");
      return;
    }
    window.setTimeout(() => moveToNextWeek((currentWeek + 1) as WeekNumber), 240);
  };

  const renderStudioPanel = (compact = false) => (
    <div className={`rounded-3xl border border-violet-200 bg-white/90 shadow-sm ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-violet-500">Studio Palette</p>
          <h3 className="mt-1 text-lg font-bold">캔버스 도구</h3>
        </div>
        <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">{toolLabel}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {currentWeek === 1
          ? "1주차는 기획 단계라서 투표와 주제 선택이 먼저예요."
          : currentWeek === 2
          ? "2주차는 스케치 중심이라 차분한 색 팔레트로 제한돼요."
          : currentWeek === 3
          ? "3주차는 채색 중심 단계예요."
          : "4주차는 스티커와 마지막 장식을 추가할 수 있어요."}
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-500">도구</p>
          <div className={`mt-2 grid gap-2 ${compact ? "grid-cols-3" : "grid-cols-3"}`}>
            {toolOptions.map((item) => {
              const blocked =
                currentWeek < item.minWeek ||
                (item.id === "sticker" && currentWeek === 4 && currentStickerRemaining <= 0) ||
                (item.id === "move" && (currentWeek !== 2 || !elementMoveUnlocked)) ||
                (item.id === "bucket" && (currentWeek !== 3 || !colorBucketUnlocked));
              const active = tool === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (blocked) return;
                    playClick();
                    setTool(item.id);
                  }}
                  disabled={blocked}
                  className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                    active ? "border-violet-300 bg-violet-500 text-white" : "border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                  } disabled:opacity-40`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          {currentWeek === 2 && elementMoveUnlocked ? (
            <p className="mt-2 text-[11px] leading-snug text-slate-500">
              이동 도구: 캔버스의 선·도형 위를 <span className="font-semibold text-slate-700">길게 누른 뒤</span> 드래그하면 위치를 옮길 수 있어요.
            </p>
          ) : null}
          {currentWeek === 3 && colorBucketUnlocked ? (
            <p className="mt-2 text-[11px] leading-snug text-slate-500">
              페인트통: 스케치·도형으로 <span className="font-semibold text-slate-700">닫힌 안쪽</span>을 누르면 그 영역만 팔레트 색으로 채워져요.
            </p>
          ) : null}
        </div>
        <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-[1.2fr_0.8fr]"}`}>
          <div>
            <p className="text-xs font-semibold text-slate-500">색상</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {paletteColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedColor(color);
                  }}
                  disabled={currentWeek === 1}
                  className={`h-10 w-10 rounded-full border-2 transition ${activeColor === color ? "scale-110 border-slate-900" : "border-white"}`}
                  style={{ backgroundColor: color }}
                  aria-label={`색상 ${color}`}
                />
              ))}
            </div>
            {currentWeek === 2 ? (
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-500">스케치 선 종류</p>
                {sketchTextureUnlocked ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setSketchStrokeStyle("solid");
                      }}
                      className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                        sketchStrokeStyle === "solid"
                          ? "border-violet-400 bg-violet-500 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      실선
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setSketchStrokeStyle("texture");
                      }}
                      className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                        sketchStrokeStyle === "texture"
                          ? "border-amber-400 bg-amber-500 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                      title="점선 느낌의 텍스처 스케치"
                    >
                      텍스처 연필
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-500">「스케치 연필 카드」로 텍스처 선을 해금할 수 있어요.</p>
                )}
              </div>
            ) : null}
            {currentWeek === 2 ? (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 py-2.5">
                <p className="text-xs font-semibold text-slate-600">구도 가이드선</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-600">{compositionGuideVisible ? "표시 중" : "꺼짐"}</span>
                  {compositionGuideVisible ? (
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setCompositionGuideVisible(false);
                        setWeekStatusMessage("구도 가이드선을 껐어요.");
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      해제
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 text-[10px] text-slate-500">「구도 프레임 카드」로 켜고 끌 수 있어요. 켠 뒤에는 여기서 바로 해제할 수도 있어요.</p>
              </div>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">두께</p>
            {currentWeek === 4 ? (
              <p className="mt-1 text-[10px] text-slate-500">4주차: 스티커 크기(작음 → 큼)에 반영돼요.</p>
            ) : null}
            <div className="mt-2 grid grid-cols-4 gap-2">
              {[4, 8, 12, 18].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedSize(size);
                  }}
                  disabled={currentWeek === 1}
                  className={`rounded-2xl border px-2 py-2 text-sm font-semibold ${
                    selectedSize === size ? "border-amber-300 bg-amber-400 text-white" : "border-amber-200 bg-white text-amber-700"
                  } disabled:opacity-40`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-slate-500">스티커</p>
            <span className="text-[11px] text-rose-500">{currentWeek === 4 ? `남은 횟수 ${currentStickerRemaining}회` : "4주차부터 사용 가능"}</span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {stickerPalette.map((sticker, stickerIndex) => (
              <button
                key={`${sticker}-${stickerIndex}`}
                type="button"
                onClick={() => {
                  if (currentWeek < 4 || currentStickerRemaining <= 0) return;
                  playClick();
                  setSelectedSticker(sticker);
                  setTool("sticker");
                }}
                disabled={currentWeek < 4 || currentStickerRemaining <= 0}
                className={`rounded-2xl border bg-white py-3 text-2xl ${
                  selectedSticker === sticker ? "border-rose-300 shadow-sm" : "border-rose-200"
                } disabled:opacity-40`}
              >
                {sticker}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlanningPanel = (compact = false) => (
    <div className={`rounded-3xl border border-emerald-200 bg-white/90 shadow-sm ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-500">Week 1 Planning</p>
          <h3 className="mt-1 text-lg font-bold">배경 투표 + 주제 결정</h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">{votesSubmitted}/5 투표</span>
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">1. 배경 투표</p>
            <p className="text-[11px] text-slate-500">선택한 유저 기준</p>
          </div>
          <div className={`mt-3 grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-3"}`}>
            {DRAWING_THEME_VOTE_OPTIONS[1].map((themeId) => {
              const voteThemeMeta = DRAWING_THEME_OPTIONS.find((theme) => theme.id === themeId) ?? DRAWING_THEME_OPTIONS[0];
              const selectedVote = planningVotes[selectedPlayer.id] === themeId;
              return (
                <div key={themeId} className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xl">{voteThemeMeta.badge}</p>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-emerald-700">{themeVoteCounts[themeId]}표</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-emerald-800">{voteThemeMeta.label}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleThemeVote(themeId, voteThemeMeta.label)}
                      disabled={!canUseActions || currentWeek !== 1}
                      className={`rounded-2xl border px-2 py-2 text-xs font-semibold ${
                        selectedVote ? "border-emerald-300 bg-emerald-500 text-white" : "border-emerald-200 bg-white text-emerald-700"
                      } disabled:opacity-40`}
                    >
                      투표
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTheme(themeId, voteThemeMeta.label)}
                      disabled={!canUseActions || currentWeek !== 1 || !selectedPermission.canLeadTheme}
                      className="rounded-2xl border border-cyan-200 bg-white px-2 py-2 text-xs font-semibold text-cyan-700 disabled:opacity-40"
                    >
                      리더 반영
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 p-3 text-[11px] text-emerald-800">
            현재 반영 배경: {themeMeta.badge} {themeMeta.label} / 최다 득표: {(DRAWING_THEME_OPTIONS.find((theme) => theme.id === winningThemeId) ?? themeMeta).label}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">2. 리더 주제 선택</p>
            <span className="text-[11px] text-slate-500">{selectedPermission.canLeadTheme ? "리더 가능" : "리더 전용"}</span>
          </div>
          <div className={`mt-3 grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-3"}`}>
            {DRAWING_SUBJECT_OPTIONS.map((subject) => {
              const active = selectedSubject === subject.id;
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => handleSelectSubject(subject.id, subject.label)}
                  disabled={!canUseActions || currentWeek !== 1 || !selectedPermission.canLeadTheme}
                  className={`rounded-2xl border p-3 text-left ${
                    active ? "border-violet-300 bg-violet-500 text-white" : "border-violet-200 bg-white text-slate-700"
                  } disabled:opacity-40`}
                >
                  <p className="text-xl">{subject.badge}</p>
                  <p className="mt-2 text-sm font-semibold">{subject.label}</p>
                  <p className={`mt-1 text-xs ${active ? "text-white/80" : "text-slate-500"}`}>{subject.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMissionPanel = (compact = false) => (
    <div className={`relative overflow-hidden rounded-3xl border shadow-sm ${missionBurst ? "border-fuchsia-400 bg-gradient-to-br from-yellow-100 via-fuchsia-100 to-cyan-100" : "border-violet-200 bg-white/90"} ${compact ? "p-4" : "p-5"}`}>
      {!bonusChoicesUnlocked ? (
        <button
          type="button"
          onClick={openSurpriseCard}
          disabled={!surpriseCardVisible}
          className={`flex w-full flex-col items-center justify-center rounded-[24px] border py-8 text-center ${
            surpriseCardVisible ? "border-violet-300 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg" : "border-violet-200 bg-violet-100/70 text-violet-400 opacity-70"
          }`}
        >
          <span className="text-4xl">🃏</span>
          <p className="mt-3 text-base font-black">서프라이즈 미션 카드</p>
          <p className="mt-1 text-xs opacity-80">성공하면 추가 행동권으로 더 그릴 수 있어요.</p>
        </button>
      ) : null}
      {bonusChoicesUnlocked && selectedMissionAttempts < 3 ? (
        <div className="rounded-[24px] border border-violet-300 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 p-4 text-white shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white/80">미션 카드</p>
              <p className="mt-1 text-sm font-bold">{currentPrompt.text}</p>
            </div>
            <div className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">{getMissionDifficultyLabel(missionDifficulty)} / {Math.max(0, 3 - selectedMissionAttempts)}회</div>
          </div>
          <div className={`mt-3 grid gap-2 ${compact ? "grid-cols-3" : "sm:grid-cols-3"}`}>
            {(["easy", "medium", "hard"] as MissionDifficulty[]).map((difficulty) => (
              <button
                key={difficulty}
                type="button"
                onClick={() => setMissionDifficulty(difficulty)}
                className={`rounded-2xl border px-3 py-2 text-left text-xs ${
                  missionDifficulty === difficulty ? "border-white bg-white text-violet-800" : "border-white/25 bg-white/10 text-white"
                }`}
              >
                <p className="font-semibold">{getMissionDifficultyLabel(difficulty)}</p>
                {!compact ? <p className="mt-1 truncate opacity-80">{getMissionPromptFromSet(DRAWING_MISSION_PROMPTS, currentWeek, difficulty, missionPromptCursor[difficulty]).text}</p> : null}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startVoiceMission}
              disabled={!canAttemptMission || missionListening || weekResolved || seasonComplete}
              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-violet-700 disabled:opacity-50"
            >
              {missionListening ? "듣는 중..." : "미션 시작"}
            </button>
            <div className="rounded-xl bg-white/15 px-3 py-2 text-[11px]">점수 {selectedMissionRecord?.totalScore ?? 0}</div>
            <div className="rounded-xl bg-white/15 px-3 py-2 text-[11px]">정확도 {((latestMissionAccuracy ?? selectedMissionRecord?.lastAccuracy ?? 0) * 100).toFixed(0)}%</div>
          </div>
        </div>
      ) : null}
      {bonusChoicesUnlocked && selectedMissionAttempts >= 3 ? (
        <div className="flex min-h-40 w-full flex-col items-center justify-center rounded-[24px] border border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 text-center text-slate-600 shadow-inner">
          <span className="text-4xl">🃏</span>
          <p className="mt-3 text-base font-black">미션 완료</p>
          <p className="mt-1 text-xs">이번 주 카드 사용이 끝났어요.</p>
        </div>
      ) : null}
      <div className="mt-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-3 text-[11px] text-violet-900">
        {missionMessage || "음성 미션에 도전해 MVP를 노려 보세요."}
      </div>
    </div>
  );

  const renderLeaderMessagePanel = (compact = false) => (
    <div className={`min-w-0 overflow-hidden rounded-2xl border border-cyan-200 bg-cyan-50/70 ${compact ? "p-3" : "p-4"}`}>
      <div className={`flex gap-2 ${compact ? "flex-col sm:flex-row sm:items-start sm:justify-between" : "items-start justify-between"}`}>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-cyan-700">응원 호출</p>
          <p className={`mt-1 text-xs text-cyan-600 ${compact ? "line-clamp-2 sm:line-clamp-none" : ""}`}>
            주도자는 특정 팀원에게 알림을 보내고 협력 그림 진행을 독려할 수 있어요.
          </p>
        </div>
        <span className="shrink-0 self-start rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-cyan-700">
          {selectedPermission.canLeadTheme ? "리더 가능" : "리더 전용"}
        </span>
      </div>
      <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-stretch">
        <select
          value={leaderMessageTargetUserId}
          onChange={(event) => setLeaderMessageTargetUserId(event.target.value)}
          className="min-w-0 max-w-full rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700"
          disabled={!selectedPermission.canLeadTheme}
        >
          {leaderMessageTargets.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
        <select
          value={leaderMessage}
          onChange={(event) => setLeaderMessage(event.target.value)}
          className="min-w-0 max-w-full rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700"
          disabled={!selectedPermission.canLeadTheme}
        >
          {DRAWING_LEADER_MESSAGES.map((message) => (
            <option key={message} value={message}>
              {message}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleLeaderMessage}
          disabled={!selectedPermission.canLeadTheme || !canUseActions}
          className="w-full shrink-0 rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
        >
          응원 보내기
        </button>
      </div>
    </div>
  );

  const renderDrawingProgressPanels = () => (
    <>
      <div className="min-w-0 rounded-2xl border border-sky-200 bg-white/85 p-3 shadow-sm sm:p-4">
        <div className="grid grid-cols-4 gap-1.5 text-center text-xs sm:gap-2 sm:text-sm">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 px-2 py-3">
            <p className="text-[10px] text-slate-500">주차</p>
            <p className="mt-1 font-semibold text-slate-800">{currentWeek}주차</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-2 py-3">
            <p className="text-[10px] text-slate-500">단계</p>
            <p className="mt-1 truncate font-semibold text-slate-800">{currentConfig.phaseLabel}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-2 py-3">
            <p className="text-[10px] text-slate-500">행동권</p>
            <p className="mt-1 font-semibold text-emerald-600">{selectedTokens}</p>
          </div>
          <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 px-2 py-3">
            <p className="text-[10px] text-slate-500">MVP</p>
            <p className="mt-1 font-semibold text-slate-800">{currentMvpPlayer?.name ?? "대기"}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <GaugeBar label="기획 완성도" value={themeGauge} tone="bg-gradient-to-r from-cyan-300 to-sky-300" compact />
          <GaugeBar label={currentWeek === 2 ? "스케치 완성도" : currentWeek === 3 ? "채색 완성도" : "드로잉 완성도"} value={drawGauge} tone="bg-gradient-to-r from-violet-300 to-fuchsia-300" compact />
          <GaugeBar label="장식 완성도" value={stickerGauge} tone="bg-gradient-to-r from-amber-300 to-rose-300" compact />
          <GaugeBar label={`${stageGaugeLabel} / 목표 ${currentConfig.threshold}%`} value={stageGauge} tone="bg-gradient-to-r from-cyan-300 via-violet-300 to-amber-300" />
          <GaugeBar label="누적 완성도" value={totalCompletionGauge} tone="bg-gradient-to-r from-emerald-300 via-sky-300 to-fuchsia-300" compact />
        </div>
        <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-3 text-[11px] text-slate-600">{weekStatusMessage}</div>
        {currentWeek === 4 ? (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-[11px] text-rose-700">
            {selectedPlayer.name} 스티커 남은 횟수: {currentStickerRemaining}회
          </div>
        ) : null}
      </div>
      <div className="min-w-0 rounded-2xl border border-amber-200 bg-white/85 p-3 shadow-sm sm:p-4">
        <p className="text-sm text-amber-500">Planning Snapshot</p>
        <h4 className="mt-1 text-sm font-bold text-slate-900">현재 시즌 콘셉트</h4>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
            <p className="text-slate-500">반영 배경</p>
            <p className="mt-1 font-semibold text-slate-800">
              {themeMeta.badge} {themeMeta.label}
            </p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50 px-3 py-3">
            <p className="text-slate-500">리더 주제</p>
            <p className="mt-1 font-semibold text-slate-800">
              {subjectMeta?.badge ?? "📝"} {subjectMeta?.label ?? "미정"}
            </p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3">
            <p className="text-slate-500">최다 득표</p>
            <p className="mt-1 font-semibold text-slate-800">{(DRAWING_THEME_OPTIONS.find((theme) => theme.id === winningThemeId) ?? themeMeta).label}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3">
            <p className="text-slate-500">현재 도구</p>
            <p className="mt-1 font-semibold text-slate-800">{toolLabel}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <ToastStack notices={toastNotices} onDismiss={(id) => setToastNotices((prev) => prev.filter((item) => item.id !== id))} />
      {topNotice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4">
          <div className="w-full max-w-sm rounded-[28px] border border-cyan-200 bg-white p-5 shadow-2xl">
            <p className="text-xs font-semibold text-cyan-700">응원 알림</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{topNotice.message}</p>
            <p className="mt-2 text-sm text-slate-500">{topNotice.fromUserName}이(가) 보냈어요.</p>
            <button
              type="button"
              onClick={() => setTeamNotices((prev) => prev.filter((notice) => notice.id !== topNotice.id))}
              className="mt-4 w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white"
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-3xl border border-violet-200 bg-white/80 p-3 shadow-sm md:p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black sm:text-lg md:text-xl">협력 게임</h2>
            <p className="text-xs text-slate-500">공동 그림 그리기</p>
          </div>
          <button
            type="button"
            onClick={() => {
              playClick();
              onBackToMenu();
            }}
            className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-700 hover:bg-violet-100"
          >
            게임 선택으로
          </button>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="order-1 min-w-0 rounded-3xl border border-violet-200 bg-white/80 p-4 shadow-sm sm:p-5">
          <div className="relative pr-16">
            <div>
              <p className="text-sm text-violet-500">Canvas Progress</p>
              <h3 className="mt-1 text-lg font-bold">
                {currentConfig.title} {currentConfig.phaseLabel}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{currentConfig.mission}</p>
            </div>
            <button
              type="button"
              onClick={resetDrawingGame}
              className="absolute right-0 top-0 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] text-violet-700 hover:bg-violet-100"
            >
              초기화
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-3xl border border-violet-200 bg-white/90 p-3 shadow-sm">
              <div
                className={`relative aspect-[4/3] overflow-hidden rounded-[24px] border border-violet-100 ${
                  currentWeek === 1 && !seasonComplete ? "bg-gradient-to-br from-white via-slate-50 to-white" : `bg-gradient-to-b ${themeMeta.className}`
                }`}
              >
                {gradientOverlayLevel > 0 ? (
                  <>
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, rgba(244,114,182,${Math.min(0.22 + gradientOverlayLevel * 0.08, 0.55)}) 0%, rgba(253,224,71,${Math.min(0.16 + gradientOverlayLevel * 0.06, 0.4)}) 32%, rgba(96,165,250,${Math.min(0.18 + gradientOverlayLevel * 0.08, 0.5)}) 68%, rgba(34,197,94,${Math.min(0.18 + gradientOverlayLevel * 0.06, 0.42)}) 100%)`,
                        mixBlendMode: "multiply",
                      }}
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at 22% 24%, rgba(255,255,255,${Math.min(0.16 + gradientOverlayLevel * 0.04, 0.28)}) 0%, transparent 28%), radial-gradient(circle at 78% 22%, rgba(255,255,255,${Math.min(0.14 + gradientOverlayLevel * 0.04, 0.24)}) 0%, transparent 24%)`,
                      }}
                    />
                  </>
                ) : null}
                {currentWeek >= 2 || seasonComplete ? <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-blue-300/70 to-cyan-200/20" /> : null}
                {currentWeek >= 2 || seasonComplete ? <div className="absolute left-1/2 bottom-6 h-16 w-60 -translate-x-1/2 rounded-[50%] bg-gradient-to-b from-yellow-100/90 to-amber-300/90" /> : null}
                <div className="absolute left-6 top-5 text-2xl opacity-85">{currentWeek === 1 ? "🧻" : themeMeta.badge}</div>
                <div className="absolute right-6 top-5 text-xl opacity-70">{currentWeek <= 2 ? "✏️" : currentWeek === 3 ? "🎨" : "✨"}</div>

                {currentWeek === 1 && !seasonComplete ? (
                  <>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:44px_44px]" />
                    <div className="absolute left-8 top-16 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                      <p className="text-xs font-semibold text-slate-600">배경 투표</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{votesSubmitted}/5명 참여</p>
                    </div>
                    <div className="absolute right-8 top-24 rounded-2xl border border-violet-200 bg-violet-50/90 px-4 py-3 shadow-sm">
                      <p className="text-xs font-semibold text-violet-600">리더 주제</p>
                      <p className="mt-1 text-sm font-bold text-violet-800">{subjectMeta?.label ?? "아직 미정"}</p>
                    </div>
                    <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
                      <span className="text-5xl opacity-80">🖼️</span>
                      <p className="mt-3 text-sm font-semibold text-slate-700">아직 비어 있는 팀 캔버스</p>
                      <p className="mt-1 text-xs text-slate-500">1주차에는 투표와 주제 선택부터 시작해요.</p>
                    </div>
                  </>
                ) : null}

                {currentWeek === 2 ? (
                  <>
                    <div className="absolute left-[18%] top-[26%] text-4xl opacity-20">{subjectBadges[0]}</div>
                    <div className="absolute right-[18%] top-[30%] text-4xl opacity-20">{subjectBadges[1]}</div>
                    <div className="absolute left-1/2 bottom-[22%] -translate-x-1/2 text-5xl opacity-15">{subjectBadges[2]}</div>
                    <div className="absolute inset-x-0 bottom-20 border-t border-dashed border-slate-500/25" />
                  </>
                ) : null}

                {currentWeek === 3 ? (
                  <>
                    <div className="absolute left-[12%] top-[18%] h-20 w-20 rounded-full bg-white/20 blur-xl" />
                    <div className="absolute right-[10%] top-[24%] h-24 w-24 rounded-full bg-pink-200/20 blur-xl" />
                    <div className="absolute left-[26%] bottom-[20%] h-16 w-16 rounded-full bg-cyan-100/20 blur-xl" />
                    {bonusPaletteColors.length > 0 ? (
                      <div className="absolute right-6 bottom-6 flex flex-wrap gap-1 rounded-2xl bg-white/85 px-3 py-2 shadow-sm max-w-[9rem]">
                        {bonusPaletteColors.map((color, index) => (
                          <span key={`${color}-${index}`} className="h-4 w-4 rounded-full border border-white" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}

                {currentWeek === 4 || seasonComplete ? (
                  <>
                    <div className="absolute left-10 top-16 text-2xl">{subjectBadges[0]}</div>
                    <div className="absolute right-10 top-20 text-2xl">{subjectBadges[1]}</div>
                    <div className="absolute left-1/2 top-12 -translate-x-1/2 text-2xl">✨</div>
                    <div className="absolute left-[22%] bottom-16 text-2xl">⭐</div>
                    <div className="absolute right-[24%] bottom-16 text-2xl">🌈</div>
                  </>
                ) : null}
                {seasonComplete && finalCompletedByName ? (
                  <div className="absolute bottom-4 right-4 rounded-full border border-violet-200 bg-white/85 px-3 py-1.5 text-[11px] font-semibold text-violet-800 shadow-sm">
                    완료: {finalCompletedByName}
                  </div>
                ) : null}

                <svg
                  ref={svgRef}
                  viewBox="0 0 1000 700"
                  className={`absolute inset-0 h-full w-full touch-none ${
                    movingElementId ? "cursor-grabbing" : tool === "move" ? "cursor-cell" : tool === "bucket" ? "cursor-crosshair" : ""
                  }`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={finishPointer}
                  onPointerLeave={finishPointer}
                >
                  <rect x="0" y="0" width="1000" height="700" fill="transparent" />
                  {currentWeek === 2 && compositionGuideVisible ? (
                    <g className="pointer-events-none" opacity={0.55}>
                      <rect x="120" y="120" width="760" height="440" fill="none" stroke="#cbd5e1" strokeWidth={3} />
                      <line x1="120" y1="260" x2="880" y2="260" stroke="#cbd5e1" strokeWidth={2} />
                      <line x1="360" y1="120" x2="360" y2="560" stroke="#cbd5e1" strokeWidth={2} />
                      <line x1="610" y1="120" x2="610" y2="560" stroke="#cbd5e1" strokeWidth={2} />
                    </g>
                  ) : null}
                  {elements.filter((el) => el.kind === "bucketFill").map((element) => renderDrawingElement(element))}
                  {elements.filter((el) => el.kind !== "bucketFill").map((element) => renderDrawingElement(element))}
                  {previewDraft ? renderDrawingElement(previewDraft) : null}
                </svg>
                {sparkleFrameTheme && (currentWeek >= 2 || seasonComplete) ? (
                  <div
                    className="pointer-events-none absolute inset-0 z-20 rounded-[24px] border-[12px] border-solid"
                    style={{
                      borderColor: sparkleFrameTheme.border,
                      boxShadow: `0 22px 55px ${sparkleFrameTheme.outerGlow}, inset 0 0 0 1px ${sparkleFrameTheme.insetLine}`,
                    }}
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{currentStageLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    배경: {themeMeta.label} / 주제: {subjectMeta?.label ?? "미정"}
                  </p>
                </div>
                {mvpReward ? <p className="rounded-full bg-yellow-50 px-3 py-1 text-[11px] font-semibold text-yellow-800">{mvpReward.badge} {mvpReward.userName}</p> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2 text-[11px] text-slate-600 md:hidden">
              <span className="font-semibold text-slate-800">
                {currentWeek}주 {currentConfig.phaseLabel}
              </span>
              <span className="text-slate-400">·</span>
              <span>행동 {selectedTokens}</span>
              <span className="text-slate-400">·</span>
              <span>
                {stageGaugeLabel} {stageGauge}%
              </span>
            </div>

            <div className="space-y-3 md:hidden">
              {renderStudioPanel(true)}
              {currentWeek === 1 ? renderPlanningPanel(true) : null}
            </div>

            <details className="group rounded-2xl border border-slate-200 bg-white/95 shadow-sm md:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">진행도 · 스냅샷 · 시즌 단계</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    게이지 · Planning Snapshot · 1~4주 진행
                  </p>
                </div>
                <span className="shrink-0 text-slate-400 transition group-open:rotate-180">▼</span>
              </summary>
              <div className="border-t border-slate-100 px-3 pb-3 pt-2">
                <div className="grid min-w-0 gap-3">{renderDrawingProgressPanels()}</div>
                <SeasonStepRow
                  className="!mt-3 border-t border-slate-100 pt-3"
                  currentWeek={currentWeek}
                  progressWeek={progressWeek}
                  seasonComplete={seasonComplete}
                  labels={["기획", "스케치", "채색", "장식"]}
                />
              </div>
            </details>

            <div className="hidden min-w-0 gap-3 md:grid md:grid-cols-2">{renderDrawingProgressPanels()}</div>

            <div className="hidden md:block">
              <SeasonStepRow currentWeek={currentWeek} progressWeek={progressWeek} seasonComplete={seasonComplete} labels={["기획", "스케치", "채색", "장식"]} />
            </div>

            <details className="group rounded-2xl border border-violet-100 bg-violet-50/40 shadow-sm md:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">미션 · 보너스 · 응원 · 주차 완료</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">그림과 직접 관련 없는 협력/정리 항목은 여기 모았어요.</p>
                </div>
                <span className="shrink-0 text-slate-400 transition group-open:rotate-180">▼</span>
              </summary>
              <div className="space-y-4 border-t border-violet-100/80 px-3 pb-4 pt-3">
                {renderMissionPanel(true)}
                {bonusChoicesUnlocked ? (
                  <div className="rounded-3xl border border-violet-200 bg-white/90 p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-800">보너스 카드 행동</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {DRAWING_SURPRISE_OPTIONS[currentWeek].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleBonusAction(option)}
                          disabled={!canUseActions}
                          className="rounded-2xl border border-violet-200 bg-violet-50 p-3 text-left text-xs disabled:opacity-40"
                        >
                          <p className="font-semibold text-violet-700">{option.label}</p>
                          <p className="mt-1 text-violet-600">+{option.delta}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {renderLeaderMessagePanel(true)}
                <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">주차 완료</p>
                    <button type="button" onClick={() => setShowFinishInfo((prev) => !prev)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                      완료 조건
                    </button>
                  </div>
                  {showFinishInfo ? (
                    <p className="mt-2 text-[11px] text-slate-500">
                      이번 주 MVP: {currentMvpPlayer?.name ?? "아직 없음"} / {stageGaugeLabel}가 {currentConfig.threshold}% 이상이면 MVP만 완료할 수 있어요.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleResolveWeek}
                    disabled={!canResolveWeek}
                    className="mt-3 w-full rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {currentWeek}주차 완료하기 {currentMvpPlayer ? `(${currentMvpPlayer.name} 전용)` : ""}
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>

        <div className="order-2 hidden min-w-0 rounded-3xl border border-violet-200 bg-white/80 p-4 shadow-sm md:block sm:p-5">
          <div>
            <p className="text-sm text-violet-500">Studio + Action</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold sm:text-xl">{currentWeek}주차 작업 보드</h3>
              <button type="button" onClick={() => setShowFinishInfo((prev) => !prev)} className="rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-violet-700">완료 조건</button>
            </div>
            {showFinishInfo ? <p className="mt-2 text-[11px] text-slate-500">이번 주 MVP: {currentMvpPlayer?.name ?? "아직 없음"} / {stageGaugeLabel}가 {currentConfig.threshold}% 이상이면 MVP만 완료할 수 있어요.</p> : null}
          </div>
          <div className="mt-5 space-y-5">
            {renderStudioPanel()}
            {renderPlanningPanel()}
            {renderMissionPanel()}
            {bonusChoicesUnlocked ? (
              <div className="rounded-3xl border border-violet-200 bg-white/90 p-5 shadow-sm">
                <p className="text-sm text-violet-500">Bonus Action</p>
                <h3 className="mt-1 text-lg font-bold">보너스 카드 행동</h3>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {DRAWING_SURPRISE_OPTIONS[currentWeek].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleBonusAction(option)}
                      disabled={!canUseActions}
                      className="rounded-2xl border border-violet-200 bg-violet-50 p-3 text-left disabled:opacity-40"
                    >
                      <p className="text-sm font-semibold text-violet-700">{option.label}</p>
                      <p className="mt-2 text-xs text-violet-600">보너스 +{option.delta}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {renderLeaderMessagePanel()}
            <button
              type="button"
              onClick={handleResolveWeek}
              disabled={!canResolveWeek}
              className="w-full rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {currentWeek}주차 완료하기 {currentMvpPlayer ? `(${currentMvpPlayer.name} 전용)` : ""}
            </button>
          </div>
        </div>
      </section>

      <MobileInfoTabs
        activeSection={mobileInfoSection}
        onChangeSection={setMobileInfoSection}
        selectedUserId={selectedUserId}
        onSelectUser={setSelectedUserId}
        actionTokens={actionTokens}
        players={players}
        selectedPlayer={selectedPlayer}
        selectedPermission={selectedPermission}
        currentWeek={currentWeek}
        selectedTokens={selectedTokens}
        weekLogs={weekLogs}
        contributionTitle="내 기여 모아보기"
        contributionLogs={seasonComplete ? myFinalWeekLogs : myAllLogs.slice(0, 4)}
        contributionEmptyText={
          seasonComplete
            ? `4주차에 내가 남긴 그림 작업이 아직 없어요. 마지막 주에는 ${mePlayer.name}를 선택해 마무리 기여를 남겨보세요.`
            : `아직 내 그림 기록이 없어요. 랭킹에서 ${mePlayer.name}를 선택한 뒤 이번 주 그림을 남겨보세요.`
        }
        selectedMissionRecord={selectedMissionRecord}
        isMvp={selectedPlayer.id === currentMvpUserId}
        activeNotice={activeNotice}
        mvpUserId={currentMvpUserId}
        missionRecordsByUser={weekMissionRecords}
        className="md:hidden"
      />

      <MobileInfoTabs
        activeSection={mobileInfoSection}
        onChangeSection={setMobileInfoSection}
        selectedUserId={selectedUserId}
        onSelectUser={setSelectedUserId}
        actionTokens={actionTokens}
        players={players}
        selectedPlayer={selectedPlayer}
        selectedPermission={selectedPermission}
        currentWeek={currentWeek}
        selectedTokens={selectedTokens}
        weekLogs={weekLogs}
        contributionTitle="내 기여 모아보기"
        contributionLogs={seasonComplete ? myFinalWeekLogs : myAllLogs.slice(0, 4)}
        contributionEmptyText={
          seasonComplete
            ? `4주차에 내가 남긴 그림 작업이 아직 없어요. 마지막 주에는 ${mePlayer.name}를 선택해 마무리 기여를 남겨보세요.`
            : `아직 내 그림 기록이 없어요. 랭킹에서 ${mePlayer.name}를 선택한 뒤 이번 주 그림을 남겨보세요.`
        }
        selectedMissionRecord={selectedMissionRecord}
        isMvp={selectedPlayer.id === currentMvpUserId}
        activeNotice={activeNotice}
        mvpUserId={currentMvpUserId}
        missionRecordsByUser={weekMissionRecords}
        className="hidden md:block lg:hidden"
      />

      <section className="hidden gap-4 lg:grid lg:grid-cols-[1.2fr_0.8fr]">
        <RankingPanel
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
          actionTokens={actionTokens}
          players={players}
          mvpUserId={currentMvpUserId}
          missionRecordsByUser={weekMissionRecords}
        />
        <SelectedUserPanel
          selectedPlayer={selectedPlayer}
          selectedPermission={selectedPermission}
          currentWeek={currentWeek}
          selectedTokens={selectedTokens}
          selectedMissionRecord={selectedMissionRecord}
          isMvp={selectedPlayer.id === currentMvpUserId}
          activeNotice={activeNotice}
        />
      </section>

      <section className="hidden gap-4 xl:grid xl:grid-cols-[1.1fr_0.9fr]">
        <LogsPanel title={`${currentWeek}주차 행동 기록`} subtitle="Week Action Trail" logs={weekLogs} />
        <MyContributionPanel
          title="내 기여 모아보기"
          logs={seasonComplete ? myFinalWeekLogs : myAllLogs.slice(0, 4)}
          emptyText={
            seasonComplete
              ? `4주차에 내가 남긴 그림 작업이 아직 없어요. 마지막 주에는 ${mePlayer.name}를 선택해 마무리 기여를 남겨보세요.`
              : `아직 내 그림 기록이 없어요. 랭킹에서 ${mePlayer.name}를 선택한 뒤 이번 주 그림을 남겨보세요.`
          }
        />
      </section>
    </main>
  );
}

export default function CoopGamePage() {
  const router = useRouter();
  const [mode, setMode] = useState<CoopMode>("menu");

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-50 text-slate-900">
      <header className="border-b border-sky-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <HomeButton
            onClick={() => {
              playClick();
              router.push("/");
            }}
            className="border-sky-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
          />
          <div>
            <h1 className="text-base font-semibold tracking-wide">협력 게임</h1>
            <p className="text-[11px] text-slate-500">게임을 골라 함께 진행해 보세요.</p>
          </div>
        </div>
      </header>

      {mode === "menu" && <CoopMenu onSelect={setMode} />}
      {mode === "pet" && <PetCoopGame onBackToMenu={() => setMode("menu")} />}
      {mode === "island" && <IslandEscapeGame onBackToMenu={() => setMode("menu")} />}
      {mode === "cooking" && <CookingCoopGame onBackToMenu={() => setMode("menu")} />}
      {mode === "drawing" && <DrawingCoopGame onBackToMenu={() => setMode("menu")} />}
    </div>
  );
}
