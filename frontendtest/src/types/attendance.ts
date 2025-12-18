export interface SessionAttendee {
    fullName: string;
    gtuStudentId: string;
    checkedInAtUtc: string;
    distanceMeters?: number;
}

export interface SessionDetail {
    sessionId: string;
    courseId: string;
    courseName: string;
    courseCode: string;
    createdAt: string;
    expiresAt: string;
    isActive: boolean;
    latitude: number;
    longitude: number;
    attendees: SessionAttendee[];
}

export interface SessionQrPoll {
    sessionId: string;
    code: string;
    expiresInSeconds: number;
}

export interface SessionSummary {
    sessionId: string;
    courseId: string;
    courseName?: string;
    courseCode?: string;
    createdAt: string;
    expiresAt: string;
    isActive: boolean;
    attendeeCount?: number;
}

export interface ActiveSessionInfo {
    sessionId: string;
    courseId: string;
    expiresAt: string;
    isActive: boolean;
}

export interface BeginCheckInRequest {
    sessionId: string;
}

export interface BeginCheckInResponse {
    nonce: string;
}

export interface CheckInRequest {
    sessionId: string;
    nonce: string;
    code: string;
    latitude: number;
    longitude: number;
    deviceCredentialId: string;
}

export interface CheckInResponse {
    status: string;
    distanceFromTeacherMeters: number;
    isWithinRange: boolean;
    checkInTime: string;
}
