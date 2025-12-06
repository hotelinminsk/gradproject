export interface TeacherProfile {
    userId: string;
    fullName: string;
    email: string;
    createdAt: string;
    courseCount: number;
}

export interface StudentProfile {
    userId: string;
    fullName: string;
    email: string;
    gtuStudentId: string | null;
    createdAt: string;
    enrolledCourseCount: number;
}

