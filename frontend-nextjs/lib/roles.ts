/**
 * Role constants — khớp với DB: roles table INSERT thứ tự ADMIN, STUDENT, LECTURER
 * DB: INSERT INTO roles (name) VALUES ('ADMIN'), ('STUDENT'), ('LECTURER')
 *   → id=1: ADMIN | id=2: STUDENT | id=3: LECTURER
 */
export const ROLES = {
  ADMIN: 1,
  STUDENT: 2,
  LECTURER: 3,
} as const;

export type RoleValue = (typeof ROLES)[keyof typeof ROLES];

/**
 * Check if user role can access the instructor (Teacher Mode) dashboard.
 * LECTURER = giảng viên, ADMIN = có thể quản lý toàn bộ.
 */
export function canAccessInstructor(role?: number): boolean {
  return role === ROLES.LECTURER || role === ROLES.ADMIN;
}

export function getRoleName(role: number): string {
  switch (role) {
    case ROLES.ADMIN:
      return "Quản trị viên";
    case ROLES.STUDENT:
      return "Học viên";
    case ROLES.LECTURER:
      return "Giảng viên";
    default:
      return "Không xác định";
  }
}
