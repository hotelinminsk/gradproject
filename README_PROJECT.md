GTU Attendance PWA — Backend + Domain Overview

Project summary
- Cross‑platform attendance system (Android/iOS/Web) implemented as a PWA. Teachers create courses, upload rosters, share invite links; students enroll and check in using QR + GPS. Device lock is enforced with WebAuthn (platform authenticators), and the system includes weekly/monthly reporting and per‑session present/absent lists.

Tech stack
- Backend: ASP.NET Core 9, EF Core, SQL Server
- AuthN/Z: JWT (role claims Student/Teacher), Fido2NetLib 4.x (WebAuthn)
- Data import: EPPlus for Excel (XLSX)
- Cache: IMemoryCache (dev) for WebAuthn challenges, OTP, and enroll nonce/tokens
- Frontend: Next.js/React (separate app in `frontendvercel/`, currently mocks) + a minimal local WebAuthn test page served by the API

Repository structure
- backend/
  - GtuAttendance.Core: Entities (domain model)
  - GtuAttendance.Infrastructure: EF Core DbContext, migrations, services, error types
  - GtuAttendance.Api: Controllers (Auth, Attendance, Course, Reports, TeacherInvites), DTOs, Program
- frontendvercel/: Next.js app scaffold with UI mocks

Core domain model (selected)
- User (TPH) → Student, Teacher
  - TPH discriminator `UserType`: "Student" | "Teacher"
  - `GtuStudentId` is nullable on base User, required + unique only for Student
- Course
  - TeacherId, CourseName, CourseCode, InvitationToken, IsActive, CreatedAt
  - Navigation: Roster (CourseRoster), Enrollments (CourseEnrollment), Sessions (AttendanceSession)
- CourseRoster (FullName, GtuStudentId) — imported from CSV/XLSX
- CourseEnrollment (CourseId, StudentId, IsValidated) — unique per student in a course
- WebAuthnCredential (Id, UserId, CredentialId[byte[]], PublicKey[byte[]], SignatureCounter, UserHandle[byte[]], DeviceName, Transports, IsActive)
- AttendanceSession (SessionId, CourseId, TeacherId, QRCodeToken, TeacherLatitude/Longitude, MaxDistanceMeters, ExpiresAt, IsActive, Secret[byte[]], CodeStepSeconds)
- AttendanceRecord (SessionId, CourseId, StudentId, StudentLatitude/Longitude, DistanceFromTeacherMeters, IsWithinRange, DeviceCredentialId, CheckInTime, SyncedAt)
- TeacherInvite (Token, ExpiresAt, MaxUses, UsedCount, EmailDomain, IsActive)

Key backend features
1) Authentication
   - Teacher/Student registration + login (JWT)
   - Teacher registration gated by `TeacherInvite` tokens (rotating, expiring, optional domain limit)

2) WebAuthn (Fido2NetLib 4.x)
   - Registration: `register-webauthn/begin` → browser `navigator.credentials.create` → `register-webauthn/complete`
   - Login: `login-webauthn/begin` → `navigator.credentials.get` → `login-webauthn/complete`
   - Platform‑only authenticator + UV=Required; reject synced passkeys at register; one active credential policy recommended
   - 4.x result mappings: `Id`→CredentialId, `SignCount`→SignatureCounter, `options.User.Id`→UserHandle, `Type`→"public-key"
   - Assertion owner callback (`IsUserHandleOwnerOfCredentialIdAsync`) provided to verify userHandle ownership

3) Attendance flow (rotating QR + in‑app nonce)
   - Teacher creates session with GPS + policy (max distance, expiry)
   - Rotating QR code: short‑lived code derived from session Secret via HMAC(time step); UI polls `/qr` endpoint
   - Student begins check‑in (nonce) → scans QR (sessionId+code) → submits nonce + code + GPS + deviceCredentialId
   - Server validates (nonce, rotating code window, enrollment, device credential ownership, time window) and stores AttendanceRecord with distance & IsWithinRange
   - Close session endpoint; get active session by course endpoint

4) Reporting
   - Overview: totals, average attendance %, weekly buckets, last session stats (denominator by Enrolled or Roster)
   - Weekly and Monthly: time‑range aggregates with %
   - Per‑session present/absent lists (present from AttendanceRecords; absent from Enrollments or Roster)

API endpoints (by controller)

AuthController (`api/Auth`)
- POST `register-student` → Register Student (returns JWT; RequiresWebAuthn=true)
- POST `login-teacher` → Teacher login (JWT)
- POST `register-teacher` → Requires `InviteToken`; validates TeacherInvite; returns JWT
- POST `register-webauthn/begin` → returns CredentialCreateOptions (bound to origin)
- POST `register-webauthn/complete` → verify attestation; persist WebAuthnCredential
- POST `login-webauthn/begin` → returns AssertionOptions + allow list
- POST `login-webauthn/complete` → verify assertion (includes owner callback); update counter; return JWT

OTPController (`api/OTP`)
- POST `reset/begin` → issue OTP (dev logs) + attempt counter
- POST `reset/confirm` → validate OTP; deactivate credentials; (optional) issue enroll token for re‑enroll

CourseController (`api/Course`)
- POST `` → Create course (Teacher) → returns `InvitationToken`
- GET `/{courseId}/invite-link` → Read invitation token
- POST `/{courseId}/upload-roster` → CSV/XLSX import (FullName,GtuStudentId); duplicate safe
- POST `enroll-by-invite` (Student) → token → match roster → create CourseEnrollment
- GET `mine/teacher` / `mine/student` → list teacher created / student enrolled courses

AttendanceController (`api/Attendance`)
- POST `createsession` (Teacher) → creates AttendanceSession (GPS, expiry, max distance)
- GET `sessions/{sessionId}/qr-poll` (Teacher) → returns rotating code + TTL
- POST `check-in/begin` (Student) → returns per‑user nonce (cached, short‑lived)
- POST `check-in/complete` (Student) → { sessionId, code, nonce, lat, lon, deviceCredentialId } → validates & writes AttendanceRecord
- POST `sessions/{sessionId}/close` (Teacher) → idempotently mark session inactive
- GET `courses/{courseId}/active-session` (Teacher) → returns active session for course if any

ReportsController (`api/Reports`)
- GET `course/{courseId}/overview?from&to&denom=enrolled|roster`
- GET `course/{courseId}/weekly?from&to&denom=`
- GET `course/{courseId}/monthly?from&to&denom=`
- GET `course/{courseId}/sessions/{sessionId}/attendance?denom=&includeInvalid=` → present/absent lists

TeacherInvitesController (`api/TeacherInvites`)
- POST `` (header `X-Admin-Key`) → create invite token (ExpiresAt, MaxUses, optional EmailDomain)

Development/test notes
- WebAuthn origin
  - For localhost over HTTP: set `Fido2:Origin` to `http://localhost:{port}` and open the test page on the same origin
  - For HTTPS: trust dev cert (`dotnet dev-certs https --trust`), run the https profile, set `Fido2:Origin` to `https://localhost:{httpsPort}`
  - RpId should be `localhost`
  - After changing Origin, always re‑run the “begin” step (old options must not be reused)

- Local WebAuthn test page
  - We serve a helper at `wwwroot/webauthn-test.html` (enable static files in Program.cs)
  - Open `{origin}/webauthn-test.html`, paste JWT + UserId, and use the buttons to exercise register/login; it handles ArrayBuffer → base64 conversion

- Migrations (EF Core)
  - Add: `dotnet ef migrations add <Name> --project backend/GtuAttendance.Infrastructure --startup-project backend/GtuAttendance.Api --context AppDbContext`
  - Update: `dotnet ef database update --project backend/GtuAttendance.Infrastructure --startup-project backend/GtuAttendance.Api --context AppDbContext`
  - Dev reset: `dotnet ef database drop --force` then re‑add migrations from current model

Indices (add as needed)
- AttendanceRecords (SessionId, IsWithinRange)
- AttendanceRecords (CourseId, CheckInTime)
- AttendanceSessions (CourseId, CreatedAt)

Security policies
- Platform‑only WebAuthn + UV=Required
- Reject synced passkeys at registration (IsBackedUp / IsBackupEligible) to enforce single‑device lock
- One active credential per student recommended (OTP reset + re‑enroll)
- Rotating QR + in‑app nonce to prevent link sharing outside the classroom
- JWT role gates (Student/Teacher); teacher registration gated by invite tokens

Running the API
- From `backend/GtuAttendance.Api/`:
  - HTTP: `dotnet run --launch-profile http` (e.g., http://localhost:5184)
  - HTTPS: `dotnet run --launch-profile https` (e.g., https://localhost:7270)
  - Ensure `appsettings.Development.json` has matching `Fido2:Origin`

Frontend
- `frontendvercel/` contains a Next.js scaffold with UI mocks; it’s ready to be wired to the API (replace mock calls with real endpoints and JWT handling). For quick WebAuthn testing, prefer `webauthn-test.html`.

Roadmap / next
- Frontend wiring (teacher dashboards, student check‑in UI)
- Optional: per‑attendance WebAuthn assertion, accuracy threshold on GPS, distributed cache for challenges in multi‑instance
- Admin UI for invites and course/roster management

