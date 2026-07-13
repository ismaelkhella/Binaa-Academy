const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('admin_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'خطأ في الخادم' }));
    throw new Error(err.message || 'Request failed');
  }

  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; admin: { name: string } }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getDashboard: () => request<DashboardStats>('/admin/dashboard'),

  getStudents: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Student[]>('/admin/students' + qs);
  },

  getStudent: (id: string) => request<StudentDetail>('/admin/students/' + id),

  updateStudent: (id: string, data: Partial<Student>) =>
    request('/admin/students/' + id, { method: 'PUT', body: JSON.stringify(data) }),

  grantSubscription: (id: string, planType: string, durationDays?: number, subjectIds?: string[]) =>
    request('/admin/students/' + id + '/subscription/grant', {
      method: 'POST',
      body: JSON.stringify({ planType, durationDays, subjectIds }),
    }),

  freezeSubscription: (id: string, freeze: boolean, reason?: string) =>
    request('/admin/students/' + id + '/subscription/freeze', {
      method: 'POST',
      body: JSON.stringify({ freeze, reason }),
    }),

  getVideos: () => request<Video[]>('/admin/videos'),

  createVideo: (data: CreateVideoInput) =>
    request('/admin/videos', { method: 'POST', body: JSON.stringify(data) }),

  deleteVideo: (id: string) =>
    request('/admin/videos/' + id, { method: 'DELETE' }),

  getSubjects: () => request<Subject[]>('/admin/subjects'),

  createSubject: (data: { name: string; grade: string; branch: string; priceIls?: number; teacherId?: string }) =>
    request<Subject>('/admin/subjects', { method: 'POST', body: JSON.stringify(data) }),

  updateSubject: (id: string, data: { priceIls?: number; teacherId?: string | null }) =>
    request<Subject>('/admin/subjects/' + id, { method: 'PUT', body: JSON.stringify(data) }),

  getPlans: () => request<Plan[]>('/admin/plans'),

  updatePlan: (id: string, data: Partial<Plan>) =>
    request('/admin/plans/' + id, { method: 'PUT', body: JSON.stringify(data) }),

  getTeachers: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ teachers: Teacher[]; total: number; page: number; limit: number }>('/admin/teachers' + qs);
  },

  getTeachersDashboard: () => request<TeachersDashboardData>('/admin/teachers/dashboard'),

  createTeacher: (data: { name: string; phone: string; bio?: string; avatarUrl?: string; commissionRate?: number; subjectId?: string }) =>
    request<any>('/admin/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ url: string }>('/admin/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

export interface DashboardStats {
  students: { total: number; active: number; trial: number };
  subscriptions: { thisMonth: number; lastMonth: number };
  revenue: { thisMonth: number; currency: string };
  content: { totalVideos: number; completionRate: number };
  recentStudents: Array<{ id: string; phone: string; name: string | null; grade: string | null; createdAt: string }>;
  topVideos: Array<{ videoId: string; title: string; subject: string; views: number }>;
}

export interface Student {
  id: string;
  phone: string;
  name: string | null;
  grade: string | null;
  branch: string | null;
  parentPhone: string | null;
  isActive: boolean;
  createdAt: string;
  viewsCount: number;
  subscription: { planType: string; planName: string; endDate: string; isFrozen: boolean } | null;
}

export interface StudentDetail extends Student {
  subscriptions: Array<{
    id: string;
    plan: { nameAr: string; type: string };
    endDate: string;
    isActive: boolean;
    isFrozen: boolean;
    subjects: Array<{ subject: { id: string; name: string } }>;
  }>;
  videoViews: Array<{
    viewCount: number;
    lastViewed: string;
    completed: boolean;
    video: { title: string; subject?: { name: string } };
  }>;
  quizResults?: Array<{
    id: string;
    score: number;
    totalQuestions: number;
    createdAt: string;
    quiz: { title: string; subject?: { name: string } };
  }>;
  dailyGoals?: Array<{
    id: string;
    title: string;
    completed: boolean;
    dueDate: string;
  }>;
  studySessions?: Array<{
    id: string;
    durationMin: number;
    date: string;
  }>;
}

export interface VideoQuestion {
  id: string;
  videoId: string;
  text: string;
  options: string;
  answer: string;
}

export interface Video {
  id: string;
  subjectId: string;
  title: string;
  description: string | null;
  status: string;
  durationSec: number;
  unitNumber: number;
  subject: { name: string; grade: string; branch: string };
  teacher: { name: string } | null;
  _count: { videoViews: number };
  pdfUrl?: string | null;
  questions?: VideoQuestion[];
}

export interface CreateVideoInput {
  subjectId: string;
  title: string;
  description?: string;
  streamUrl?: string;
  status?: string;
  pdfUrl?: string;
  questions?: { text: string; options: string[]; answer: string }[];
}

export interface Subject {
  id: string;
  name: string;
  grade: string;
  branch: string;
  priceIls: number;
  teacherId?: string | null;
  teacher: { id: string; name: string } | null;
  _count: { videos: number };
}

export interface Plan {
  id: string;
  type: string;
  nameAr: string;
  durationDays: number;
  priceIls: number;
  discountPercent: number;
  videosPerSubject: number;
  isActive: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  commissionRate: number;
  user: { phone: string };
  _count: { subjects: number; videos: number };
  email?: string;
  specialty?: string;
  grade?: string;
  lessons?: number;
  rating?: number;
  status?: string;
  avatar?: string;
}

export interface TeachersDashboardData {
  stats: {
    totalTeachers: number;
    activeClasses: number;
    performanceRating: number;
    contentHours: number;
  };
  applications: Array<{
    id: string;
    name: string;
    title: string;
    timeText: string;
  }>;
  topTeachers: Array<{
    id: string;
    name: string;
    satisfactionRate: number;
    avatar: string;
  }>;
}
