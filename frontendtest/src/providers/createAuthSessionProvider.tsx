import {createContext, useContext} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { authStore } from "@/lib/authStore";
import type { AuthResponse } from "@/types/auth";

type Audience = "teacher" | "student" | "admin";

export interface AuthSessionContextValue<TProfile> {
    profile: TProfile | null;
    isLoading: boolean;
    login: (auth: AuthResponse) => void;
    logout: () => void;
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
        const token = authStore.getToken(audience);

        const logout = () => {
            authStore.clear(audience);
            queryClient.removeQueries({queryKey: [audience]});
        };

        const login = (auth: AuthResponse) => {
            authStore.setToken(audience, auth.token);
            queryClient.invalidateQueries({queryKey: [audience, "profile"]});
        };

        const query = useQuery({
            queryKey: [audience, "profile", token],
            queryFn: () => apiFetch<TProfile>(profileEndPoint, {audience}),
            enabled: Boolean(token),
            staleTime: 1000 * 60,
            retry: false,
            onError: () => {
                // Token invalid/expired; clear session so UI doesn't crash
                logout();
            },
        });

        return (
            <AuthSessionContext.Provider
            value= {{
                profile: query.data ?? null,
                isLoading: query.isLoading,
                login,
                logout,
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
