type Audience = "teacher" | "student" | "admin";

const TOKEN_KEYS: Record<Audience, string> = {
    teacher: "teacher_jwt",
    student: "student_jwt",
    admin: "admin_jwt"
};

export const authStore = {
    getToken(audience: Audience){
        return localStorage.getItem(TOKEN_KEYS[audience]);
    },
    setToken(audience: Audience, token: string) {
        localStorage.setItem(TOKEN_KEYS[audience], token);
    },
    clear(audience: Audience){
        localStorage.removeItem(TOKEN_KEYS[audience]);
    }
};

