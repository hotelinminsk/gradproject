import { createAuthSessionProvider } from "./createAuthSessionProvider";
import { StudentProfile, type TeacherProfile } from "@/types/profiles";

export const [TeacherSessionProvider, useTeacherSession] = 
    createAuthSessionProvider<TeacherProfile>("teacher", "/api/teacher/profile");

export const [StudentSessionProvier, useStudentSession] =
    createAuthSessionProvider<StudentProfile>("student", "/api/Student/profile");
