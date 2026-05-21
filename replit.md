# SubTeach - Substitute Teacher Management App

## Overview
A React Native Expo application for managing substitute teaching sessions between Schools and Teachers. Built with NativeWind for Tailwind CSS styling and Gluestack UI-inspired component patterns.

## Architecture
- **Framework**: React Native with Expo SDK 54
- **Routing**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native) + StyleSheet
- **State Management**: React Context (AuthContext, SessionContext)
- **Storage**: AsyncStorage (local persistence, will connect to CodeIgniter backend)
- **Backend**: Existing CodeIgniter backend with PostgreSQL (to be integrated)

## User Roles
1. **Teacher** - Registers, accepts teaching session requests, checks in/out, receives payment
2. **School** - Registers, creates teaching sessions, selects teachers, confirms attendance, handles payments, reviews teachers

## Key Features
- Multi-step registration for both Teacher and School roles
- Terms & Conditions acceptance gate after login
- Session creation and management workflow
- Teacher search and selection
- Check-in / attendance confirmation
- Session completion workflow
- Invoice generation and payment proof upload
- Teacher review system
- Notification system for all workflow events

## Project Structure
```
app/
  _layout.tsx              # Root layout with auth routing
  index.tsx                # Welcome screen
  login.tsx                # Login
  register-select.tsx      # Role selection
  register-teacher.tsx     # Multi-step teacher registration
  register-school.tsx      # Multi-step school registration
  terms.tsx                # Terms & Conditions acceptance
  session-detail.tsx       # Session detail with actions
  create-session.tsx       # Create teaching session (school)
  upload-payment.tsx       # Upload payment proof (school)
  review-teacher.tsx       # Review teacher (school)
  (teacher-tabs)/          # Teacher tab navigation
    index.tsx              # Teacher Dashboard
    sessions.tsx           # Teacher Sessions
    notifications.tsx      # Teacher Notifications
    profile.tsx            # Teacher Profile
  (school-tabs)/           # School tab navigation
    index.tsx              # School Dashboard
    teachers.tsx           # Browse/Search Teachers
    sessions.tsx           # School Sessions
    notifications.tsx      # School Notifications
    profile.tsx            # School Profile
contexts/
  AuthContext.tsx           # Authentication state
  SessionContext.tsx        # Sessions, teachers, notifications state
components/
  SessionCard.tsx           # Session display card
  TeacherCard.tsx           # Teacher listing card
  NotificationItem.tsx      # Notification list item
  StepIndicator.tsx         # Registration step indicator
types/
  index.ts                 # TypeScript type definitions
lib/
  storage.ts               # AsyncStorage helpers
  mockData.ts              # Mock data for development
constants/
  Colors.ts                # App color theme
```

## Running
- Dev server runs on port 8081 via Expo
- Use `Dev Server` workflow to start the Expo development server

## Demo Account
- Teacher: sarah.johnson@email.com / password123
