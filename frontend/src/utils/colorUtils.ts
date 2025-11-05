/**
 * 문자열을 해시하여 일관된 색상을 생성합니다.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * HSL 색상을 생성합니다.
 */
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * 과목명을 기반으로 일관된 색상을 생성합니다.
 */
export function getCourseColor(courseName: string): { background: string; border: string; text: string } {
  const hash = hashString(courseName);
  
  // 색상 팔레트 (채도와 명도를 조정하여 보기 좋은 색상 생성)
  const hue = hash % 360;
  const saturation = 65 + (hash % 20); // 65-85%
  const lightness = 85 + (hash % 10); // 85-95% (밝은 배경)
  
  const backgroundColor = hslToHex(hue, saturation, lightness);
  const borderColor = hslToHex(hue, saturation, lightness - 20); // 더 어두운 테두리
  const textColor = hslToHex(hue, saturation, 25); // 어두운 텍스트
  
  return {
    background: backgroundColor,
    border: borderColor,
    text: textColor
  };
}

/**
 * 미리 정의된 색상 팔레트
 */
const PREDEFINED_COLORS = [
  { background: '#E3F2FD', border: '#2196F3', text: '#0D47A1' }, // Blue
  { background: '#F3E5F5', border: '#9C27B0', text: '#4A148C' }, // Purple
  { background: '#E8F5E9', border: '#4CAF50', text: '#1B5E20' }, // Green
  { background: '#FFF3E0', border: '#FF9800', text: '#E65100' }, // Orange
  { background: '#FCE4EC', border: '#E91E63', text: '#880E4F' }, // Pink
  { background: '#E0F2F1', border: '#009688', text: '#004D40' }, // Teal
  { background: '#FFF9C4', border: '#FBC02D', text: '#F57F17' }, // Yellow
  { background: '#FFEBEE', border: '#F44336', text: '#B71C1C' }, // Red
  { background: '#E8EAF6', border: '#3F51B5', text: '#1A237E' }, // Indigo
  { background: '#F1F8E9', border: '#8BC34A', text: '#33691E' }, // Light Green
];

/**
 * 과목명을 기반으로 미리 정의된 색상 팔레트에서 색상을 선택합니다.
 */
export function getCoursePredefinedColor(courseName: string): { background: string; border: string; text: string } {
  const hash = hashString(courseName);
  const index = hash % PREDEFINED_COLORS.length;
  return PREDEFINED_COLORS[index];
}

/**
 * 과목 ID를 기반으로 색상을 캐시합니다.
 */
const colorCache = new Map<string, { background: string; border: string; text: string }>();

export function getCachedCourseColor(courseId: number, courseName: string): { background: string; border: string; text: string } {
  const key = `${courseId}-${courseName}`;
  
  if (!colorCache.has(key)) {
    colorCache.set(key, getCoursePredefinedColor(courseName));
  }
  
  return colorCache.get(key)!;
}
