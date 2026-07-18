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

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
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

  updateVideo: (id: string, data: Partial<CreateVideoInput>) =>
    request('/admin/videos/' + id, { method: 'PUT', body: JSON.stringify(data) }),

  archiveVideo: (id: string) =>
    request('/admin/videos/' + id, { method: 'PUT', body: JSON.stringify({ status: 'DRAFT' }) }),

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

  /** Upload with progress events (percent + speed) via XHR, since fetch has no upload progress. */
  uploadFileWithProgress: (file: File, onProgress: (p: UploadProgress) => void, signal?: AbortSignal) => {
    return new Promise<{ url: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      const makeAbortError = () => {
        const e = new Error('تم إلغاء الرفع');
        e.name = 'AbortError';
        return e;
      };

      if (signal) {
        if (signal.aborted) { reject(makeAbortError()); return; }
        signal.addEventListener('abort', () => xhr.abort(), { once: true });
      }

      const startTime = Date.now();

      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        const elapsedSec = (Date.now() - startTime) / 1000;
        const loadedMB = e.loaded / (1024 * 1024);
        onProgress({
          percent: Math.min(100, Math.round((e.loaded / e.total) * 100)),
          loadedMB,
          totalMB: e.total / (1024 * 1024),
          speedMBps: elapsedSec > 0.2 ? loadedMB / elapsedSec : 0,
        });
      };

      xhr.onload = () => {
        if (xhr.status === 401) {
          localStorage.removeItem('admin_token');
          window.location.href = '/login';
          reject(new Error('Unauthorized'));
          return;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { reject(new Error('استجابة غير صالحة من الخادم')); }
        } else {
          // 413 comes from the hosting proxy on the published site (request size cap),
          // usually with a non-JSON body — give a specific, actionable message.
          let msg = xhr.status === 413
            ? 'فشل الرفع: حجم الفيديو أكبر من الحد الذي يسمح به الخادم المنشور'
            : 'فشل الرفع';
          try { msg = JSON.parse(xhr.responseText).message || msg; } catch { /* keep default */ }
          reject(new Error(msg));
        }
      };
      xhr.onerror = () => reject(new Error('خطأ في الاتصال بالخادم'));
      xhr.onabort = () => reject(makeAbortError());
      // No xhr.timeout on purpose: it caps TOTAL duration and would kill legitimate
      // large video uploads. Users can cancel via the AbortSignal instead.

      xhr.open('POST', `${API_BASE}/admin/upload`);
      const token = getToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  },
};

export interface UploadProgress {
  percent: number;   // 0–100
  loadedMB: number;  // megabytes uploaded so far
  totalMB: number;   // total megabytes
  speedMBps: number; // average upload speed in MB/s
}

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
