import { Header } from "@radix-ui/react-accordion";

type Audience = "student" | "teacher" |"admin" |null;

export function getAuthToken(which: Audience){
    if(which == "student") return localStorage.getItem("student_jwt");
    if(which == "teacher") return localStorage.getItem("teacher_jwt");
    if(which == "admin") return localStorage.getItem("admin_jwt");
    

    return null;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://localhost:7270";

export async function apiFetch<T>(path: string,
    {method = "GET", body, audience=null, headers}:
    {method?: string; body?: any; audience?: Audience; headers?: HeadersInit} = {}
) {
    const reqHeaders = new Headers(headers);
    if(body && !(body instanceof FormData)){
        reqHeaders.set("Content-Type", "application/json");
        body = JSON.stringify(body);
    }

    const token = getAuthToken(audience);
  if (token) reqHeaders.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { method, body, headers: reqHeaders });

  if(!res.ok){
    const problem = await res.json().catch(() => ({}));
    throw new Error(problem.error ?? res.statusText);
  }
  return (await res.json()) as T;
}


