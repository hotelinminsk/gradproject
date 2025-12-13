

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
  description?: string;
  firstSessionAt?: string;
  sessionCount?: number;
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
  description?: string;
  firstSessionAt?: string;
  teacherName?: string;
  schedules?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  latestSession?: {
    sessionId: string;
    sessionCreatedAt: string;
    sessionExpiredAt: string;
    sessionIsActive: boolean;
    isAttended: boolean;
  } | null;
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
  attendeeCount?: number;
}

export interface CourseStudentEntry {
  courseStudentId: string;
  email: string;
  fullName: string;
  gtuStudentId: string;
  isVerifiedEnrollment: boolean;
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


export interface CourseSessionV2 {
  sessionId: string;
  createdAtUtc: string;
  expiresAtUtc: string;
  isActive: boolean;
  attendeeCount: number
}

export interface TeacherCourseDetailV2 {
  courseId: string;
  courseName: string;
  courseCode: string;
  description?: string;
  inviteToken: string;
  createdAtUtc: string;
  firstSessionAt?: string;
  isActive: boolean;
  roster: CourseRosterEntry[];
  enrollments: CourseEnrollmentEntry[];
  sessions: CourseSessionV2[];
  activeSession?: CourseSessionV2 | null;
  courseStudents: CourseStudentEntry[];
}

export interface CourseSchedule {
  dayOfWeek: number;
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
}

export interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
  invitationToken?: string;
  isActive?: boolean;
  firstSessionAt?: string;
  lastSession?: {
    sessionId: string;
    createdAt: string;
    expiresAtUtc: string;
    isActive: boolean;
  };
  schedules?: CourseSchedule[];
}

// ... existing interfaces ...

export interface TeacherCourseDetail {
  courseId: string;
  courseName: string;
  courseCode: string;
  description?: string;
  inviteToken?: string;
  createdAt: string;
  firstSessionAt?: string;
  isActive: boolean;
  roster: CourseRosterEntry[];
  enrollments: CourseEnrollmentEntry[];
  sessions: AttendanceSessionSummary[];
  activeSession?: AttendanceSessionSummary | null;
  courseStudents: CourseStudentEntry[];
  schedules?: CourseSchedule[];
}

// ...

export interface CreateCoursePayload {
  courseName: string;
  courseCode: string;
  description?: string;
  firstSessionAt?: string;
  schedules?: CourseSchedule[];
}
