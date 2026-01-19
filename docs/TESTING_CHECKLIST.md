# LaLaLola Testing Checklist

## Quick Copy for Spreadsheet

Copy the table below into Google Sheets or Excel:

---

## User Type Matrix

| User Type | Access Method | Dashboard | Key Activities |
|-----------|---------------|-----------|----------------|
| Guest | Direct visit (no auth) | Index page | View landing, Try demo, Sign up/in |
| Individual | Email/Google auth | MyCareTab | Self-care items, Pep talks, Journal, Stats |
| Parent | Email/Google auth | ParentDashboard | Manage kids, Create chores, Approve completions, Family settings |
| Kid | Family PIN (no auth required) | KidDashboard | View chores, Complete chores, Play with Lola, Earn time |
| Teacher | Email/Google auth + beta approval | TeacherDashboard | Manage classroom, Award points, Start sessions, Manage store |
| Principal | Email/Google auth + school staff | PrincipalDashboard | View school reports, Manage staff, View incidents |
| School Admin | Email/Google auth + school staff | AdminDashboard | Manage schools, Approve teachers, System admin |
| Student | Google auth + classroom join | StudentDashboard | View points, Care for pet, Shop in store |

---

## Detailed Test Scenarios

### GUEST (Unauthenticated)

| # | Action | Expected Result | Pass/Fail | Notes |
|---|--------|-----------------|-----------|-------|
| G1 | Visit homepage | See landing page with Lola | | |
| G2 | Click "Sign In" | Navigate to /auth | | |
| G3 | Click "Sign Up" | Navigate to /auth?mode=signup | | |
| G4 | Visit /join-family?code=XXX | See family code input, "I have a PIN" button visible | | |
| G5 | Visit /join-classroom?code=XXX | See classroom code input | | |
| G6 | Try to access /stats | Redirect to /auth | | |
| G7 | Play with Lola (if allowed) | Can interact with pet demo | | |

### INDIVIDUAL (Self-care user)

| # | Action | Expected Result | Pass/Fail | Notes |
|---|--------|-----------------|-----------|-------|
| I1 | Sign up with email | Account created, see onboarding | | |
| I2 | Set user type as "Individual" | Profile updated | | |
| I3 | View Care Notes tab | See self-care items list | | |
| I4 | Add care items | Items saved to database | | |
| I5 | Complete a care item | Item marked complete, Lola interaction | | |
| I6 | Request pep talk | Pep talk modal shows | | |
| I7 | Write journal entry | Entry saved | | |
| I8 | View stats page | See progress stats | | |
| I9 | Toggle ambient sound | Sound plays/stops | | |
| I10 | Switch habitat (Sofa/Park/Bed) | Background changes | | |

### PARENT

| # | Action | Expected Result | Pass/Fail | Notes |
|---|--------|-----------------|-----------|-------|
| P1 | Sign up and select "Parent" | Profile set as parent | | |
| P2 | Create family | Family created with code | | |
| P3 | Add first kid | Kid added with PIN | | |
| P4 | Add second kid | Multiple kids supported | | |
| P5 | Edit kid details | Changes saved | | |
| P6 | Remove kid | Kid deleted | | |
| P7 | Create chore | Chore added to family | | |
| P8 | Assign chore to specific kid | Chore assignment works | | |
| P9 | Edit chore | Changes saved | | |
| P10 | Delete chore | Chore removed | | |
| P11 | View pending completions | See awaiting approval list | | |
| P12 | Approve completion | Kid earns Lola time | | |
| P13 | Reject completion | Completion rejected | | |
| P14 | View family code | Code displayed for sharing | | |
| P15 | Change family name | Name updated | | |
| P16 | Also mark as teacher | Dual role works | | |

### KID (PIN-based auth)

| # | Action | Expected Result | Pass/Fail | Notes |
|---|--------|-----------------|-----------|-------|
| K1 | Visit /join-family?code=XXX | See family join page | | |
| K2 | Click "I have a PIN" | See kid selection | | |
| K3 | Select kid and enter PIN | Login successful | | |
| K4 | Wrong PIN | Error shown | | |
| K5 | View assigned chores | Chores list shown | | |
| K6 | Complete a chore | Marked pending approval | | |
| K7 | View Lola time balance | Time shown correctly | | |
| K8 | Play with Lola | Time decrements | | |
| K9 | Feed Lola | Action registered | | |
| K10 | Water Lola | Action registered | | |
| K11 | Put Lola to sleep | Sleep mode works | | |
| K12 | Logout | Returns to family select | | |

### TEACHER

| # | Action | Expected Result | Pass/Fail | Notes |
|---|--------|-----------------|-----------|-------|
| T1 | Sign up as teacher | Waitlist or approved | | |
| T2 | Access teacher dashboard | Dashboard loads | | |
| T3 | Create classroom | Classroom with code created | | |
| T4 | View classroom code | Code displayed | | |
| T5 | Add student manually | Student added | | |
| T6 | Edit student | Changes saved | | |
| T7 | Remove student | Student deleted | | |
| T8 | Award points to student | Points added, logged | | |
| T9 | Start Lola session | Session active | | |
| T10 | Pause session | Timer paused | | |
| T11 | Rotate student turn | Next student selected | | |
| T12 | End session | Session ended | | |
| T13 | Enable class store | Store activated | | |
| T14 | Add store item | Item created | | |
| T15 | View/manage orders | Orders visible | | |
| T16 | Approve order | Order approved | | |
| T17 | Report incident | Incident created | | |
| T18 | View incidents list | All incidents shown | | |
| T19 | Link classroom to school | School linked | | |
| T20 | Also mark as parent | Dual role works | | |

### PRINCIPAL

| # | Action | Expected Result | Pass/Fail | Notes |
|---|--------|-----------------|-----------|-------|
| PR1 | Access principal dashboard | Dashboard loads | | |
| PR2 | View school overview | Stats displayed | | |
| PR3 | View all classrooms | Classroom list shown | | |
| PR4 | View teacher list | Teachers displayed | | |
| PR5 | Invite teacher | Invitation sent | | |
| PR6 | View school-wide incidents | All incidents visible | | |
| PR7 | Generate school reports | Reports generated | | |

### SCHOOL ADMIN

| # | Action | Expected Result | Pass/Fail | Notes |
|---|--------|-----------------|-----------|-------|
| A1 | Access admin dashboard | Dashboard loads | | |
| A2 | View all schools | Schools listed | | |
| A3 | Create new school | School created | | |
| A4 | Edit school | Changes saved | | |
| A5 | Approve teacher beta | Teacher approved | | |
| A6 | View system stats | Stats displayed | | |

### STUDENT (Classroom member)

| # | Action | Expected Result | Pass/Fail | Notes |
|---|--------|-----------------|-----------|-------|
| S1 | Visit /join-classroom?code=XXX | See join page | | |
| S2 | Sign in with Google | Auth successful | | |
| S3 | Join classroom | Added to classroom | | |
| S4 | View student dashboard | Dashboard loads | | |
| S5 | View earned points | Points displayed | | |
| S6 | Browse class store | Items shown | | |
| S7 | Place order | Order submitted | | |
| S8 | View order status | Status shown | | |
| S9 | Link to home kid account | Accounts linked | | |
| S10 | Care for classroom pet | Actions registered | | |

---

## Bug Report Template

| Field | Value |
|-------|-------|
| User Type | |
| Action Attempted | |
| Expected Result | |
| Actual Result | |
| URL/Route | |
| Console Errors | |
| Screenshot | |
| Reproducible? | Yes / No / Sometimes |
| Severity | Critical / High / Medium / Low |

---

## Test Account Setup

Create these test accounts before testing:

1. **Individual**: individual@test.com
2. **Parent**: parent@test.com → Create family "Test Family"
3. **Kid**: Add to Test Family with PIN 1234
4. **Teacher**: teacher@test.com → Needs beta approval
5. **Principal**: principal@test.com → Assign to school
6. **Admin**: admin@test.com → Assign admin role
7. **Student**: student@test.com → Join test classroom
