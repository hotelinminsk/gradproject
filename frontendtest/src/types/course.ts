export interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
  invitationToken?: string;
  isActive?: boolean;
  lastSession?: {
    sessionId: string;
    createdAt: string;
    expiresAtUtc: string;
    isActive: boolean;
  }
}

export interface RosterStudentRow {
  fullName: string;
  gtuStudentId: string;
}


export interface TeacherCourseSummary {
  courseId: string;
  courseName: string;
  courseCode: string;
  createdAt: string;
  isActive: boolean;
  enrollmentCount: number;
  lastSession?: {
    sessionId: string;
    createdAt: string;
    expiresAtUtc?: string;
    isActive: boolean;
  };
  lastSessionAt?: string; // legacy
  nextSessionAt?: string;
  inviteToken?: string;
}

export interface StudentCourseSummary {
  courseId: string;
  courseName: string;
  courseCode: string;
}

export interface CourseRosterEntry {
  rosterId: string;
  courseId: string;
  gtuStudentId: string;
  fullName: string;
  importedAt: string;
}

export interface CourseEnrollmentEntry {
  enrollmentId: string;
  courseId: string;
  studentId: string;
  enrolledAt: string;
  isValidated: boolean;
  student?: {
    fullName: string;
    email: string;
    gtuStudentId: string;
  };
}

export interface AttendanceSessionSummary {
  sessionId: string;
  courseId: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface CourseStudentEntry {
  courseStudentId: string;
  email: string;
  fullname: string;
  gtustudentid: string;
  isVerifiedEnrollment: boolean;
}


export interface TeacherCourseDetail {
  courseId: string;
  courseName: string;
  courseCode: string;
  inviteToken?: string;
  createdAt: string;
  isActive: boolean;
  roster: CourseRosterEntry[];
  enrollments: CourseEnrollmentEntry[];
  sessions: AttendanceSessionSummary[];
  activeSession?: AttendanceSessionSummary | null;
  courseStudents: CourseStudentEntry[];
}

export interface CreateSessionPayload {
  courseId: string;
  teacherLatitude: number;
  teacherLongitude: number;
  maxDistanceMeters: number;
  expiresAtUtc: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  qrToken: string;
  expiresAtUtc: string;
}


export interface CourseSessionV2{
  sessionId: string;
  createdAtUtc: string;
  expiresAtUtc: string;
  isActive: boolean;
  attendeeCount: number
}

export interface TeacherCourseDetailV2{
  courseId: string;
  courseName: string;
  courseCode: string;
  inviteToken: string;
  createdAtUtc: string;
  isActive: boolean;
  roster: CourseRosterEntry[];
  enrollments: CourseEnrollmentEntry[];
  sessions: CourseSessionV2[];
  activeSession?: CourseSessionV2 | null;
  courseStudents: CourseStudentEntry[];
}
