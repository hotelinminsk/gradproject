export interface AuthResponse {
    token: string;
    userId: string;
    userType: "Teacher" | "Student" | "Admin";
    fullName: string;
    email: string;
    gtuStudentId?: string | null;
    requiresWebAuthn: boolean;
}