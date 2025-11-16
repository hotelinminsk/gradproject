export interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
  invitationToken?: string;
  isActive?: boolean;
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
  lastSessionAt?: string;
  nextSessionAt?: string;
  inviteLink?: string;
  invitationToken?: string;
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
  courseInvitationToken?: string;
  createdAt: string;
  isActive: boolean;
  roster: CourseRosterEntry[];
  enrollments: CourseEnrollmentEntry[];
  sessions: AttendanceSessionSummary[];
  courseStudents: CourseStudentEntry[];
}
