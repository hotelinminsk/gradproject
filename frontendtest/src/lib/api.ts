import { authStore } from "./authStore";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://localhost:7270";

type Audience = "teacher" | "student" | "admin";

type ApiOptions = Omit<RequestInit, "body"> & {
  audience?: Audience;
  body?: BodyInit | Record<string,unknown>;
}


export async function apiFetch<T>(path: string, options: ApiOptions = {}){
  const {audience, body, headers, ...rest} = options;
  const reqHeaders = new Headers(headers);


  let payload: BodyInit | undefined;

  if(body instanceof FormData || typeof body === "string" || body instanceof Blob){
    payload = body;
  }else if(body){
    reqHeaders.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }

  if(audience){
    const token = authStore.getToken(audience);
    if(token) reqHeaders.set("Authorization", `Bearer ${token}`);

  }

  const response = await fetch(`${API_BASE}${path}`,{
    ...rest,
    headers: reqHeaders,
    body: payload
  });


  if(!response.ok){
    const problem = await response.json().catch(() => ({}));
    throw new Error(problem.error ?? response.statusText);
  }


  return (await response.json()) as T;


}