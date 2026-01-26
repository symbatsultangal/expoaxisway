# Axisway Project Context

## Project Overview
**Axisway** is an accessibility and volunteer coordination platform designed to connect people with disabilities to volunteers and relevant resources. The application facilitates help requests, accessibility reporting for public places, and volunteer management.

## Tech Stack
*   **Framework:** React Native (via [Expo](https://expo.dev))
*   **Routing:** Expo Router (File-based routing)
*   **Language:** TypeScript
*   **Database:** PostgreSQL (likely Supabase, given the RLS policies and `auth.users` references)
*   **Styling:** Custom theming with React Native primitives

## Key Features
*   **User Roles:** Profiles for Disabled Persons, Volunteers, Partners, Government, and Admins.
*   **Help Requests:** Workflow for requesting, accepting, and tracking assistance (including emergency requests).
*   **Volunteer Management:** Tracking volunteer hours, verification, and certification.
*   **Places & Accessibility:** Database of places with accessibility attributes (ramps, braille, etc.) and validation.
*   **Reporting:** System for reporting accessibility issues or discrimination.
*   **Chat:** Integrated messaging between help request participants.

## Database Schema (`schema.sql`)
The project includes a comprehensive SQL schema defining:
*   `profiles`, `user_roles`, `user_private_info`: User management.
*   `ref_disabilities`, `user_disabilities`: Disability definitions and user associations.
*   `help_requests`, `help_request_volunteers`: core logic for assistance coordination.
*   `places`, `partners`: Location-based data and institutional partners.
*   `chats`, `messages`: Communication.
*   `reports`, `ratings`: Feedback and moderation.
*   **Security:** Extensive Row Level Security (RLS) policies are defined for all tables.

## Project Structure
*   **`app/`**: Application source code (Expo Router).
    *   `_layout.tsx`: Root layout provider (Theme, Stack).
    *   `(tabs)/`: Main tab-based navigation (Home, Explore).
    *   `modal.tsx`: Modal screen example.
*   **`components/`**: Reusable UI components (`ThemedText`, `ThemedView`, `ParallaxScrollView`).
*   **`constants/`**: Configuration constants (Colors, Theme).
*   **`hooks/`**: Custom React hooks (`useColorScheme`, `useThemeColor`).
*   **`scripts/`**: Utility scripts (e.g., `reset-project.js`).
*   **`assets/`**: Static assets (images, fonts).

## Development

### Prerequisites
*   Node.js
*   npm

### Setup & Run
1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Start the Application:**
    ```bash
    npx expo start
    ```
    *   Use `w` for Web, `a` for Android, `i` for iOS.
3.  **Reset Project:**
    To reset the `app/` directory to a blank state:
    ```bash
    npm run reset-project
    ```

### Linting
*   Run linting checks:
    ```bash
    npm run lint
    ```

## Project Constraints & Policies

### Legacy Project / Reference Codebase
*   **Directory:** `axiswaystart/`
*   **Description:** A legacy web application built with:
    *   **React + Vite**
    *   **Supabase** (Backend/Auth/DB)
    *   **Leaflet / React-Leaflet** (Maps)
    *   **React Router**
*   **Rule:** **READ-ONLY**. Do not modify, delete, or refactor files in this directory.
*   **Usage:** Use this project as the **primary reference** for:
    *   Business logic implementation.
    *   Database queries and Supabase integration patterns.
    *   UI/UX flows (adapting from Web to Mobile).
*   **New Development:** All active development occurs in the root `app/` (Expo/React Native) structure.
