import * as signalR from "@microsoft/signalr";


export const createAttendanceHub = (token: string) => {
  return new signalR.HubConnectionBuilder()
    .withUrl("/hubs/attendance", {
      accessTokenFactory: () => token,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .build();
};
