import {createContext, useContext, useEffect, useState} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { authStore } from "@/lib/authStore";
import type { AuthResponse } from "@/types/auth";
import { HubConnection } from "@microsoft/signalr";
import { createAttendanceHub } from "@/lib/signalr";

type Audience = "teacher" | "student" | "admin";

export interface AuthSessionContextValue<TProfile> {
    profile: TProfile | null;
    isLoading: boolean;
    login: (auth: AuthResponse) => void;
    logout: () => void;
    hub? : HubConnection | null;
}


export function createAuthSessionProvider<TProfile>(
    audience: Audience,
    profileEndPoint: string
){
    const AuthSessionContext = createContext<AuthSessionContextValue<TProfile> | null>(null);
    
    function Provider({children}: {
        children: React.ReactNode
    })
    {
        const queryClient = useQueryClient();
        const [token, setToken] = useState<string | null>(() => authStore.getToken(audience));
        const [hub, setHub] = useState<HubConnection | null>(null);

        const logout = () => {
            authStore.clear(audience);
            setToken(null);
            queryClient.removeQueries({queryKey: [audience]});
        };

        const login = (auth: AuthResponse) => {
            authStore.setToken(audience, auth.token);
            setToken(auth.token);
            queryClient.invalidateQueries({queryKey: [audience, "profile"]});
        };

        const query = useQuery<TProfile,Error>({
            queryKey: [audience, "profile", token] as const,
            queryFn: () => apiFetch<TProfile>(profileEndPoint, {audience}),
            enabled: Boolean(token),
            staleTime: 1000 * 60,
            retry: false,
        });

        // keep token in sync across tabs
        useEffect(() => {
            const onStorage = (e: StorageEvent) => {
                if (!e.key) return;
                if (e.key.includes(audience)) {
                    setToken(authStore.getToken(audience));
                }
            };
            window.addEventListener("storage", onStorage);
            return () => window.removeEventListener("storage", onStorage);
        }, [audience]);

        useEffect(() => {
            if (query.isError) {
                // Token invalid/expired; clear session so UI doesn't crash
                logout();
            }
        }, [query.isError]);

        useEffect(() => {
            if(!token) {
                hub?.stop();
                setHub(null);
                return;
            }

            const conn = createAttendanceHub(token);
            setHub(conn);
            conn.start().catch(console.error);
            return () => {
                conn.stop();
            };

        },[token]);

        return (
            <AuthSessionContext.Provider
            value= {{
                profile: (query.data as TProfile | undefined) ?? null,
                isLoading: query.isLoading,
                login,
                logout,
                hub,
            }} 
            >
                {children}
            </AuthSessionContext.Provider>
        );

    }


    const useSession = () => {
        const ctx = useContext(AuthSessionContext);
        if(!ctx) throw new Error("Session context missing");
        return ctx;
    }

    return [Provider, useSession] as const;

}
