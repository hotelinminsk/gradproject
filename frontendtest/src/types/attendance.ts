export interface SessionAttendee {
    fullName: string;
    gtuStudentId: string;
    checkedInAtUtc : string;
    distanceMeters? : number;
}

export interface SessionDetail {
    sessionId: string;
    courseId: string;
    createdAt: string;
    expiresAt: string;
    isActive: boolean;
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
