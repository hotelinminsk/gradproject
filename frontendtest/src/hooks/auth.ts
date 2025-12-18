import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { startRegistration } from "@simplewebauthn/browser";

// --- Device Reset / Recovery Hooks ---

export const useBeginDeviceReset = () => {
    return useMutation({
        mutationFn: async (payload: { userId: string; gtuId?: string }) => {
            return apiFetch<{ userId: string }>("/api/otp/reset/begin", {
                method: "POST",
                body: {
                    userId: payload.userId,
                    GTUId: payload.gtuId || "RESET_REQUEST"
                },
            });
        },
        onError: (err: any) => toast.error(err?.message ?? "Sıfırlama başlatılamadı"),
    });
};

export const useConfirmDeviceReset = () => {
    return useMutation({
        mutationFn: async (payload: { userId: string; otp: string }) => {
            return apiFetch<{ success: boolean; enrollToken: string }>("/api/otp/reset/confirm", {
                method: "POST",
                body: { userId: payload.userId, OTP: payload.otp },
            });
        },
        onSuccess: () => toast.success("Cihaz sıfırlandı. Yeni cihazınızı kaydedebilirsiniz."),
        onError: (err: any) => toast.error(err?.message ?? "Sıfırlama başarısız"),
    });
};

// --- WebAuthn Registration Hook (Reusable) ---

// Helper to convert Base64URL to Standard Base64
export const base64UrlToBase64 = (input: string) => {
    let output = input.replace(/-/g, "+").replace(/_/g, "/");
    switch (output.length % 4) {
        case 0: break;
        case 2: output += "=="; break;
        case 3: output += "="; break;
        default: throw "Illegal base64url string!";
    }
    return output;
};

export const useRegisterDevice = () => {
    return useMutation({
        mutationFn: async (payload: { userId: string; deviceName: string; enrollToken?: string }) => {
            // 1. Begin Registration
            const beginRes = await apiFetch<any>("/api/auth/register-webauthn/begin", {
                method: "POST",
                body: {
                    userId: payload.userId,
                    deviceName: payload.deviceName,
                    enrollToken: payload.enrollToken // Optional, for recovery flow
                },
                audience: "student"
            });

            // 2. Browser interaction
            const attResp = await startRegistration(beginRes);

            // 3. Complete Registration
            // Backend expects byte[] for RawId, AttestationObject, ClientDataJSON.
            // JSON serialization requires Standard Base64 for byte[], but simplewebauthn returns Base64URL.
            const completeRes = await apiFetch<any>("/api/auth/register-webauthn/complete", {
                method: "POST",
                body: {
                    userId: payload.userId,
                    enrollToken: payload.enrollToken,
                    id: attResp.id,
                    rawId: base64UrlToBase64(attResp.rawId),
                    type: attResp.type,
                    clientDataJSON: base64UrlToBase64(attResp.response.clientDataJSON),
                    attestationObject: base64UrlToBase64(attResp.response.attestationObject),
                    deviceName: payload.deviceName
                },
                audience: "student"
            });

            // Save Credential ID for future check-ins
            localStorage.setItem("student_credential_id", attResp.id);
            localStorage.setItem("student_device_name", payload.deviceName);

            return completeRes;
        },
        onSuccess: () => {
            toast.success("Cihaz başarıyla kaydedildi!");
        },
        onError: (err: any) => {
            console.error(err);
            toast.error(err?.message ?? "Cihaz kaydı başarısız.");
        }
    });
};
