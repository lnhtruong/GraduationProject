import { Request } from 'express';

export enum UserRole {
  ADMIN = 1,
  STUDENT = 2,
  LECTURER = 3,
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'OPTIONS';

export type AccessLevel = 'public' | 'authenticated' | 'roles';
type PathPattern = string | RegExp;

export interface AccessRule {
  method: HttpMethod | '*';
  pattern: PathPattern;
  access: AccessLevel;
  roles?: UserRole[];
}

interface CompiledAccessRule extends AccessRule {
  matcher: RegExp;
}

const PUBLIC_RULE: AccessRule = {
  method: '*',
  pattern: '**',
  access: 'public',
};

const ACCESS_RULES: AccessRule[] = [
  // Health and auth public flows
  { method: 'GET', pattern: '/health', access: 'public' },
  { method: 'POST', pattern: '/api/auth/register', access: 'public' },
  { method: 'POST', pattern: '/api/auth/login', access: 'public' },
  { method: 'POST', pattern: '/api/auth/refresh', access: 'public' },
  { method: 'POST', pattern: '/api/auth/forgot-password', access: 'public' },
  { method: 'POST', pattern: '/api/auth/check-otp', access: 'public' },
  { method: 'POST', pattern: '/api/auth/logout', access: 'authenticated' },
  { method: 'POST', pattern: '/api/auth/validate', access: 'authenticated' },
  {
    method: 'POST',
    pattern: '/api/auth/issue-token',
    access: 'roles',
    roles: [UserRole.ADMIN],
  },

  // User service
  { method: 'GET', pattern: '/api/users/profile', access: 'authenticated' },
  { method: 'GET', pattern: '/api/users/:id', access: 'authenticated' },
  {
    method: 'GET',
    pattern: '/api/users',
    access: 'roles',
    roles: [UserRole.ADMIN],
  },
  {
    method: 'PATCH',
    pattern: '/api/users/reset/:id',
    access: 'roles',
    roles: [UserRole.ADMIN],
  },
  { method: 'PATCH', pattern: '/api/users/:id', access: 'authenticated' },

  // Course service - public reads
  {
    method: 'GET',
    pattern: '/api/course/courses/stats/overview',
    access: 'roles',
    roles: [UserRole.ADMIN, UserRole.LECTURER],
  },
  {
    method: 'GET',
    pattern: '/api/course/courses/:id/stats/overview',
    access: 'roles',
    roles: [UserRole.ADMIN, UserRole.LECTURER],
  },
  { method: 'GET', pattern: '/api/course/courses', access: 'roles', roles: [UserRole.ADMIN, UserRole.STUDENT] },
  { method: 'GET', pattern: '/api/course/courses/mine', access: 'authenticated' },
  { method: 'GET', pattern: '/api/course/courses/:id', access: 'public' },
  { method: 'GET', pattern: '/api/course/lessons/course', access: 'authenticated' },
  { method: 'GET', pattern: '/api/course/lessons/:id', access: 'authenticated' },
  { method: 'GET', pattern: '/api/course/quizzes', access: 'public' },
  { method: 'GET', pattern: '/api/course/quizzes/lesson/:id', access: 'authenticated' },
  { method: 'GET', pattern: '/api/course/quizzes/:id', access: 'authenticated' },
  { method: 'GET', pattern: '/api/course/lesson-activities', access: 'authenticated' },
  {
    method: 'GET',
    pattern: '/api/course/lesson-activities/:id',
    access: 'authenticated',
  },
  { method: 'GET', pattern: '/api/course/roadmaps', access: 'public' },
  { method: 'GET', pattern: '/api/course/roadmaps/:id', access: 'public' },
  { method: 'GET', pattern: '/api/course/users/:id', access: 'public' },
  { method: 'GET', pattern: '/api/course/feedbacks/check/:courseId', access: 'authenticated' },
  { method: 'GET', pattern: '/api/course/feedbacks/**', access: 'public' },
  {
    method: 'GET',
    pattern: '/api/course/feedback-reactions/**',
    access: 'public',
  },

  // Course service - authenticated and role-based writes
  {
    method: 'POST',
    pattern: '/api/course/courses',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'PATCH',
    pattern: '/api/course/courses/:id',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'DELETE',
    pattern: '/api/course/courses/:id',
    access: 'roles',
    roles: [UserRole.ADMIN],
  },
  {
    method: 'POST',
    pattern: '/api/course/courses/:id/submit-for-review',
    access: 'roles',
    roles: [UserRole.LECTURER],
  },
  {
    method: 'POST',
    pattern: '/api/course/courses/:id/review',
    access: 'roles',
    roles: [UserRole.ADMIN],
  },
  {
    method: 'POST',
    pattern: '/api/course/courses/:id/publish',
    access: 'roles',
    roles: [UserRole.ADMIN],
  },
  {
    method: 'POST',
    pattern: '/api/course/lessons',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'PATCH',
    pattern: '/api/course/lessons/:id',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'DELETE',
    pattern: '/api/course/lessons/:id',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'POST',
    pattern: '/api/course/quizzes',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'POST',
    pattern: '/api/course/quizzes/ai',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'PATCH',
    pattern: '/api/course/quizzes/:id',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'DELETE',
    pattern: '/api/course/quizzes/:id',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'GET',
    pattern: '/api/course/lesson-activities/user',
    access: 'authenticated',
  },
  {
    method: 'POST',
    pattern: '/api/course/lesson-activities',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'PATCH',
    pattern: '/api/course/lesson-activities/:id',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'DELETE',
    pattern: '/api/course/lesson-activities/:id',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'POST',
    pattern: '/api/course/enroll',
    access: 'roles',
    roles: [UserRole.STUDENT, UserRole.LECTURER, UserRole.ADMIN],
  },
  { method: 'GET', pattern: '/api/course/enroll', access: 'authenticated' },
  {
    method: 'GET',
    pattern: '/api/course/enroll/check-mine-exists',
    access: 'authenticated',
  },
  {
    method: 'GET',
    pattern: '/api/course/enroll/:id',
    access: 'authenticated',
  },
  {
    method: 'PATCH',
    pattern: '/api/course/enroll/:id',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'DELETE',
    pattern: '/api/course/enroll/:id',
    access: 'roles',
    roles: [UserRole.ADMIN],
  },
  {
    method: 'POST',
    pattern: '/api/course/lesson-progress',
    access: 'roles',
    roles: [UserRole.ADMIN, UserRole.LECTURER],
  },
  {
    method: 'GET',
    pattern: '/api/course/lesson-progress',
    access: 'authenticated',
  },
  {
    method: 'GET',
    pattern: '/api/course/lesson-progress/:id',
    access: 'authenticated',
  },
  {
    method: 'PATCH',
    pattern: '/api/course/lesson-progress/:id',
    access: 'roles',
    roles: [UserRole.ADMIN, UserRole.LECTURER],
  },
  {
    method: 'DELETE',
    pattern: '/api/course/lesson-progress/:id',
    access: 'roles',
    roles: [UserRole.ADMIN, UserRole.LECTURER],
  },
  {
    method: 'POST',
    pattern: '/api/course/feedbacks',
    access: 'roles',
    roles: [UserRole.STUDENT, UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'PATCH',
    pattern: '/api/course/feedbacks/:id',
    access: 'roles',
    roles: [UserRole.ADMIN],
  },
  {
    method: 'DELETE',
    pattern: '/api/course/feedbacks/:id',
    access: 'roles',
    roles: [UserRole.ADMIN],
  },
  {
    method: 'POST',
    pattern: '/api/course/feedback-reactions',
    access: 'roles',
    roles: [UserRole.STUDENT, UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'DELETE',
    pattern: '/api/course/feedback-reactions/feedback/:id',
    access: 'roles',
    roles: [UserRole.STUDENT, UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'GET',
    pattern: '/api/course/carts',
    access: 'authenticated',
  },
  {
    method: 'POST',
    pattern: '/api/course/carts/items',
    access: 'authenticated',
  },
  {
    method: 'DELETE',
    pattern: '/api/course/carts/items/:courseId',
    access: 'authenticated',
  },
  {
    method: 'DELETE',
    pattern: '/api/course/carts',
    access: 'authenticated',
  },
  {
    method: 'GET',
    pattern: '/api/course/users/profile',
    access: 'authenticated',
  },
  {
    method: 'POST',
    pattern: '/api/course/roadmaps',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'POST',
    pattern: '/api/course/roadmaps/:id/courses',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'POST',
    pattern: '/api/course/roadmaps/:id/courses/bulk',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'PATCH',
    pattern: '/api/course/roadmaps/:id',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'PATCH',
    pattern: '/api/course/roadmaps/:id/courses/reorder',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'PATCH',
    pattern: '/api/course/roadmaps/:id/courses/:courseId',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'DELETE',
    pattern: '/api/course/roadmaps/:id',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'DELETE',
    pattern: '/api/course/roadmaps/:id/courses/:courseId',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },

  // Reports
  {
    method: 'POST',
    pattern: '/api/course/reports',
    access: 'roles',
    roles: [UserRole.STUDENT, UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: 'GET',
    pattern: '/api/course/reports/mine',
    access: 'authenticated',
  },
  {
    method: 'GET',
    pattern: '/api/course/reports',
    access: 'roles',
    roles: [UserRole.ADMIN],
  },
  {
    method: 'GET',
    pattern: '/api/course/reports/:id',
    access: 'roles',
    roles: [UserRole.ADMIN],
  },
  {
    method: 'PATCH',
    pattern: '/api/course/reports/:id/review',
    access: 'roles',
    roles: [UserRole.ADMIN],
  },

  // Media service
  {
    method: 'GET',
    pattern: '/api/media/sse/**',
    access: 'public',
  },
  {
    method: 'POST',
    pattern: '/api/media/webhooks/cloudinary/upload',
    access: 'public',
  },
  {
    method: 'POST',
    pattern: '/api/media/webhooks/ai-model/result',
    access: 'public',
  },
  { method: 'GET', pattern: '/api/media/videos/:id', access: 'authenticated' },
  { method: 'GET', pattern: '/api/media/projects/:id', access: 'authenticated' },
  {
    method: 'GET',
    pattern: '/api/media/mascot_images/:id',
    access: 'public',
  },
  {
    method: '*',
    pattern: '/api/media/mascot_overlays/**',
    access: 'authenticated',
  },
  {
    method: 'GET',
    pattern: '/api/media/videos/user/:type',
    access: 'authenticated',
  },
  {
    method: 'POST',
    pattern: '/api/media/videos',
    access: 'authenticated',
  },
  {
    method: 'PATCH',
    pattern: '/api/media/videos/:id',
    access: 'authenticated',
  },
  {
    method: 'DELETE',
    pattern: '/api/media/videos/:id',
    access: 'authenticated',
  },
  {
    method: 'POST',
    pattern: '/api/media/projects',
    access: 'authenticated',
  },
  {
    method: 'GET',
    pattern: '/api/media/projects/user',
    access: 'authenticated',
  },
  {
    method: 'PATCH',
    pattern: '/api/media/projects/:id',
    access: 'authenticated',
  },
  {
    method: 'DELETE',
    pattern: '/api/media/projects/:id',
    access: 'authenticated',
  },
  {
    method: 'POST',
    pattern: '/api/media/mascot_images',
    access: 'authenticated',
  },
  {
    method: 'GET',
    pattern: '/api/media/mascot_images/user',
    access: 'authenticated',
  },
  {
    method: 'PATCH',
    pattern: '/api/media/mascot_images/:id',
    access: 'authenticated',
  },
  {
    method: 'DELETE',
    pattern: '/api/media/mascot_images/:id',
    access: 'authenticated',
  },
  {
    method: 'POST',
    pattern: '/api/media/cloudinary/sign',
    access: 'authenticated',
  },
  {
    method: 'POST',
    pattern: '/api/media/cloudinary/upload',
    access: 'authenticated',
  },
  {
    method: 'GET',
    pattern: '/api/media/sse/**',
    access: 'public',
  },

  // Bunny/TUS integration endpoints (media service)
  {
    method: 'POST',
    pattern: '/api/media/bunny/videos/init-upload',
    access: 'authenticated',
  },
  {
    method: 'GET',
    pattern: '/api/media/bunny/videos/:bunnyVideoId/status',
    access: 'authenticated',
  },
  {
    method: 'GET',
    pattern: '/api/media/bunny/videos/:bunnyVideoId/play-data',
    access: 'authenticated',
  },
  // Bunny webhook (Bunny will POST here) - allow anonymous; verify HMAC in media_service
  {
    method: 'POST',
    pattern: '/api/media/webhooks/bunny-stream',
    access: 'public',
  },

  { method: 'GET', pattern: '/api/media/notifications', access: 'authenticated' },
  {
    method: 'PUT',
    pattern: '/api/media/notifications/bulk',
    access: 'authenticated',
  },
  {
    method: 'GET',
    pattern: '/api/media/notifications/:id',
    access: 'authenticated',
  },
  {
    method: 'PATCH',
    pattern: '/api/media/notifications/:id',
    access: 'authenticated',
  },

  // Feed
  {
    method: 'GET',
    pattern: '/api/media/feed/stats/creator',
    access: 'roles',
    roles: [UserRole.ADMIN, UserRole.LECTURER],
  },
  {
    method: 'GET',
    pattern: '/api/media/feed/stats/trending',
    access: 'roles',
    roles: [UserRole.ADMIN, UserRole.LECTURER],
  },
  {
    method: 'GET',
    pattern: '/api/media/feed/:id/stats',
    access: 'roles',
    roles: [UserRole.ADMIN, UserRole.LECTURER],
  },
  { method: 'GET', pattern: '/api/media/feed/viewed', access: 'authenticated' },
  { method: 'GET', pattern: '/api/media/feed/saved', access: 'authenticated' },
  {
    method: 'GET',
    pattern: '/api/media/feed/mine',
    access: 'roles',
    roles: [UserRole.ADMIN, UserRole.LECTURER],
  },
  { method: 'GET', pattern: '/api/media/feed/trending', access: 'public' },
  { method: 'GET', pattern: '/api/media/feed/**', access: 'authenticated' },
  {
    method: 'POST',
    pattern: '/api/media/feed/:feedId/comments',
    access: 'authenticated',
    // roles: [UserRole.LECTURER, UserRole.ADMIN],
  },
  {
    method: '*',
    pattern: '/api/media/feed/**',
    access: 'roles',
    roles: [UserRole.LECTURER, UserRole.ADMIN],
  },

  // Payment
  {
    method: 'POST',
    pattern: '/api/payment/payos-callback',
    access: 'public',
  },
  {
    method: 'GET',
    pattern: '/api/payment/return',
    access: 'public',
  },
  {
    method: 'GET',
    pattern: '/api/payment/cancel',
    access: 'public',
  },
  {
    method: 'GET',
    pattern: '/api/payment/order-status/:orderCode',
    access: 'public',
  },
  {
    method: 'POST',
    pattern: '/api/payment/create-payment',
    access: 'authenticated',
  },
  {
    method: 'POST',
    pattern: '/api/payment/buy-now',
    access: 'authenticated',
  },
  {
    method: 'GET',
    pattern: '/api/payment/transactions',
    access: 'authenticated',
  },
  {
    method: 'GET',
    pattern: '/api/payment/transactions/:id',
    access: 'authenticated',
  },

  // Mascot colab
  {
    method: '*',
    pattern: '/api/mascot_colab/**',
    access: 'authenticated',
  },
];

const COMPILED_ACCESS_RULES: CompiledAccessRule[] = ACCESS_RULES.map((rule) => ({
  ...rule,
  matcher:
    typeof rule.pattern === 'string'
      ? compilePathPattern(rule.pattern)
      : rule.pattern,
}));

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }

  return path;
}

function escapeRegexSegment(segment: string): string {
  return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Supported templates: literal path, :param (single segment), * (single segment), ** (rest of path)
function compilePathPattern(template: string): RegExp {
  if (template === '**') {
    return /^.*$/;
  }

  const normalizedTemplate = normalizePath(template);
  const segments = normalizedTemplate.split('/').filter((segment) => segment.length > 0);

  let regex = '^';
  for (const segment of segments) {
    if (segment === '**') {
      regex += '(?:/.*)?';
      break;
    }

    if (segment === '*' || segment.startsWith(':')) {
      regex += '/[^/]+';
      continue;
    }

    regex += `/${escapeRegexSegment(segment)}`;
  }

  if (segments.length === 0) {
    regex += '/';
  }

  regex += '$';
  return new RegExp(regex);
}

export function getAccessRule(req: Request): AccessRule | null {
  if (req.method === 'OPTIONS') {
    return PUBLIC_RULE;
  }

  const normalizedPath = normalizePath(req.path);
  const method = req.method.toUpperCase();

  for (const rule of COMPILED_ACCESS_RULES) {
    const methodMatches = rule.method === '*' || rule.method === method;

    if (methodMatches && rule.matcher.test(normalizedPath)) {
      return rule;
    }
  }

  return null;
}
