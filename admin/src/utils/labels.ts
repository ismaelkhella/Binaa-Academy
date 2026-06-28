const GRADE_LABELS: Record<string, string> = {
  GRADE_11: 'الصف الحادي عشر',
  GRADE_12: 'الصف الثاني عشر',
};

const BRANCH_LABELS: Record<string, string> = {
  SCIENTIFIC: 'علمي',
  LITERARY: 'أدبي',
};

const PLAN_LABELS: Record<string, string> = {
  TRIAL: 'تجربة مجانية',
  MONTHLY: 'شهري',
  QUARTERLY: 'فصلي',
  YEARLY: 'سنوي',
};

export function gradeLabel(grade: string | null) {
  return grade ? GRADE_LABELS[grade] ?? grade : '—';
}

export function branchLabel(branch: string | null) {
  return branch ? BRANCH_LABELS[branch] ?? branch : '—';
}

export function planLabel(type: string) {
  return PLAN_LABELS[type] ?? type;
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ar-PS', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} س ${m} د`;
  return `${m} دقيقة`;
}
