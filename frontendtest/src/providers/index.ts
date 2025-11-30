import { createAuthSessionProvider } from "./createAuthSessionProvider";
import type { TeacherProfile } from "@/types/profiles";

export const [TeacherSessionProvider, useTeacherSession] = 
    createAuthSessionProvider<TeacherProfile>("teacher", "/api/teacher/profile");