# Role-Based Authentication and Route Guard Summary

This document summarizes how the current system implements authentication, authorization, and frontend route protection.

## 1. Roles in the System

The application currently recognizes these roles:

- `ADMIN`
- `USER`
- `ASSET_MANAGER`
- `TECHNICIAN`

These roles are defined in:

- [src/main/java/com/smartcampus/auth/model/UserRole.java](D:/Projects/paf%20hasi/it3030-paf-2026-smart-campus-groupXX-/src/main/java/com/smartcampus/auth/model/UserRole.java)

## 2. Backend Authentication Model

The backend uses **JWT bearer authentication**.

### 2.1 Login and token issuing

Authentication endpoints are exposed in:

- [src/main/java/com/smartcampus/auth/controller/AuthController.java](D:/Projects/paf%20hasi/it3030-paf-2026-smart-campus-groupXX-/src/main/java/com/smartcampus/auth/controller/AuthController.java)

Available auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`

The login/register services are implemented in:

- [src/main/java/com/smartcampus/auth/service/AuthService.java](D:/Projects/paf%20hasi/it3030-paf-2026-smart-campus-groupXX-/src/main/java/com/smartcampus/auth/service/AuthService.java)

When login succeeds, the backend returns an `AuthResponse` containing:

- `token`
- `expiresAt`
- `user`

### 2.2 JWT contents

JWT creation and parsing are handled in:

- [src/main/java/com/smartcampus/auth/service/JwtService.java](D:/Projects/paf%20hasi/it3030-paf-2026-smart-campus-groupXX-/src/main/java/com/smartcampus/auth/service/JwtService.java)

The token includes:

- subject = user id
- `name`
- `email`
- `role`
- issue time
- expiry time

So the token carries both identity and role information.

## 3. Backend Request Authentication Flow

The security configuration is defined in:

- [src/main/java/com/smartcampus/auth/config/SecurityConfig.java](D:/Projects/paf%20hasi/it3030-paf-2026-smart-campus-groupXX-/src/main/java/com/smartcampus/auth/config/SecurityConfig.java)

### 3.1 What SecurityConfig does

It configures Spring Security to:

- disable session-based auth
- use stateless JWT auth
- allow `/api/auth/**` without login
- require authentication for almost everything else
- return `401 Unauthorized` when no valid login is present
- return `403 Forbidden` when the user is authenticated but lacks permission

This line is the default rule:

- `anyRequest().authenticated()`

That means every request is blocked unless:

1. it is explicitly public, or
2. a valid JWT is attached

### 3.2 JWT filter

Incoming requests are processed by:

- [src/main/java/com/smartcampus/auth/security/JwtAuthenticationFilter.java](D:/Projects/paf%20hasi/it3030-paf-2026-smart-campus-groupXX-/src/main/java/com/smartcampus/auth/security/JwtAuthenticationFilter.java)

The flow is:

1. Read the `Authorization` header
2. Check for `Bearer <token>`
3. Parse the JWT
4. Extract the user id from token subject
5. Load the real user from the database
6. Resolve the user role
7. Create a Spring Security authentication object
8. Store it in `SecurityContextHolder`

After that, Spring treats the request as authenticated.

## 4. Backend Role-Based Authorization

The project uses **method-level authorization** with `@PreAuthorize`.

This is enabled by:

- `@EnableMethodSecurity`

in:

- [src/main/java/com/smartcampus/auth/config/SecurityConfig.java](D:/Projects/paf%20hasi/it3030-paf-2026-smart-campus-groupXX-/src/main/java/com/smartcampus/auth/config/SecurityConfig.java)

### 4.1 Example authorization patterns

Common patterns used in controllers:

- `@PreAuthorize("isAuthenticated()")`
  Any logged-in user can access

- `@PreAuthorize("hasRole('ADMIN')")`
  Only admin can access

- `@PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")`
  Either admin or asset manager can access

- `@PreAuthorize("hasRole('USER')")`
  Only student/user role can access

### 4.2 Current meaning in practice

Examples from the current implementation:

- Asset management create/update/delete:
  `ADMIN` or `ASSET_MANAGER`

- Asset list page APIs:
  authenticated users, then frontend restricts route usage depending on page

- Asset ratings:
  only `USER` can create/update rating

So authorization is enforced on the backend, not only in the UI.

## 5. Authenticated User Object

Once a JWT is accepted, the backend stores a principal object of type:

- [src/main/java/com/smartcampus/auth/security/AuthenticatedUser.java](D:/Projects/paf%20hasi/it3030-paf-2026-smart-campus-groupXX-/src/main/java/com/smartcampus/auth/security/AuthenticatedUser.java)

This object contains:

- `userId`
- `userName`
- `email`
- `role`

Controllers can access this through Spring Security `Authentication`.

That is how backend code knows:

- who is making the request
- which role they have

## 6. Frontend Authentication State

Frontend auth utilities are in:

- [src/utils/auth.js](D:/Projects/paf%20hasi/it3030-paf-2026-smart-campus-groupXX-/src/utils/auth.js)

### 6.1 What the frontend stores

After login, the frontend saves auth data in `localStorage`:

- token
- user id
- user name
- user role
- optional avatar/email metadata

The main keys are:

- `smartCampusAuth`
- `authToken`

### 6.2 Frontend helper functions

Important helpers:

- `setAuthState(authResponse)`
  Saves token + user info after login

- `getAuthState()`
  Reads stored auth state

- `getCurrentUser()`
  Returns the logged-in user object

- `getAuthToken()`
  Returns the JWT token

- `isAuthenticated()`
  Returns true only if token and user id exist and token is not expired

- `hasRole()` / `hasAnyRole()`
  Used for role checks in the UI

## 7. Frontend API Authentication

API calls use:

- [src/services/apiClient.js](D:/Projects/paf%20hasi/it3030-paf-2026-smart-campus-groupXX-/src/services/apiClient.js)

This Axios client automatically:

1. reads the stored JWT using `getAuthToken()`
2. attaches it as:
   `Authorization: Bearer <token>`

So frontend pages do not need to manually add the auth header each time.

## 8. Frontend Route Guards

Frontend route protection is implemented in:

- [src/App.jsx](D:/Projects/paf%20hasi/it3030-paf-2026-smart-campus-groupXX-/src/App.jsx)

### 8.1 Route guard components

There are three important wrappers:

- `PublicOnlyRoute`
  Used for pages like login/register
  If already logged in, user is redirected away from auth pages

- `PrivateRoute`
  Blocks unauthenticated users
  If not logged in, redirect to `/login`

- `RoleRoute`
  Checks the logged-in user role
  If the role is not allowed, redirect to that user’s default dashboard

### 8.2 How route protection happens

The route protection flow is:

1. User tries to open a route
2. `PrivateRoute` checks if a valid login exists
3. If logged in, `RoleRoute` checks whether the role is allowed
4. If role is allowed, page renders
5. If role is not allowed, user is redirected to their default dashboard

This means route access is protected even if a user manually types a URL.

### 8.3 Examples from current routes

Current examples:

- `/assets`
  only `ADMIN` and `ASSET_MANAGER`

- `/assets/:assetId`
  only `ADMIN` and `ASSET_MANAGER`

- `/asset-list`
  only `USER`

- `/asset-list/:assetId`
  only `USER`

- `/dashboard/admin`
  only `ADMIN`

- `/dashboard/user`
  only `USER`

This is how the app prevents cross-role page access in the frontend.

## 9. Sidebar Access Control

Sidebar item visibility is implemented in:

- [src/components/Sidebar.jsx](D:/Projects/paf%20hasi/it3030-paf-2026-smart-campus-groupXX-/src/components/Sidebar.jsx)

The sidebar uses the current stored user role to decide what menu items to show.

### 9.1 Current logic

- `hasManagerAccess`
  true for `ADMIN` and `ASSET_MANAGER`

- `hasAdminAccess`
  true only for `ADMIN`

Then menu items are added conditionally:

- `Assets`
  shown only to `ADMIN` and `ASSET_MANAGER`

- `Asset List`
  shown only to `USER`

- admin-only items such as:
  - booking requests
  - incident tickets
  - audit logs
  - user management
  - settings

So the sidebar is filtered by role for better UX.

## 10. Why Sidebar Hiding Alone Is Not Enough

The system correctly uses **both**:

- sidebar filtering
- route guards

This is important because:

- sidebar filtering improves the interface
- route guards prevent manual URL access in the frontend
- backend `@PreAuthorize` prevents unauthorized API access even if someone bypasses the UI

So access control exists in three layers:

1. backend JWT authentication
2. backend role authorization
3. frontend route and menu restrictions

## 11. Overall Access Control Flow

End-to-end flow:

1. User logs in
2. Backend returns JWT + user role
3. Frontend stores token and user info in local storage
4. Axios sends JWT on future API requests
5. Backend JWT filter authenticates the request
6. Spring Security checks controller role rules
7. Frontend route guards decide if the page can open
8. Sidebar only shows the pages relevant to that role

## 12. Current Strength of the Design

The current system already has a proper structure for role-based access:

- authentication is centralized with JWT
- backend is the real source of enforcement
- frontend route guards improve safety and UX
- sidebar visibility keeps the UI role-specific

That means the project is not relying on only hidden buttons or only hidden routes. It uses layered access control, which is the correct approach.

