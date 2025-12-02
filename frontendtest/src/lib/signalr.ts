import * as signalR from "@microsoft/signalr";

// Always point to backend API (do not use window origin, Vite runs on a different port)
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
  "https://localhost:7270";

export const createAttendanceHub = (token: string) => {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE}/hubs/attendance`, {
      accessTokenFactory: () => token,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .build();
};
