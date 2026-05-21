# SLV PG — Sri Lakshmi Venkateswara Women's PG
## Operational & System Documentation

Welcome to **SLV PG (Sri Lakshmi Venkateswara Women’s PG)**, a premium, mobile-responsive, state-of-the-art Web Application designed to manage rooms, tenants, financials, documents, visitor check-ins, and public reviews seamlessly. 

This document explains the architecture of the application, how the modules function, and step-by-step guides for **Admins (Owners)**, **Tenants**, and **Guests**.

---

## 🛠️ Technology Stack & Architecture

To avoid complex setup procedures and environment blocks on local systems, the SLV PG Web App is constructed as a **high-fidelity, single-page application (SPA)** utilizing:
- **Core Structure**: Semantic HTML5 with dynamic component templates.
- **Styling System**: Premium Custom HSL Hues & CSS Variables, offering responsive layout grids, custom scrollbars, dark glassmorphism backgrounds, and fluid animations.
- **Application Engine**: Pure ES6 Javascript modular design (`app.js`, `auth.js`, `rooms.js`, `finance.js`, `tenants.js`, `documents.js`, `reviews.js`, `visit.js`, `notifications.js`).
- **Database Layer**: High-speed local database engine backed by `localStorage` persistence (`data.js`). This ensures all data additions, edits, check-ins, and payments remain saved permanently across browser sessions.
- **Iconography & Fonts**: Google Fonts (Inter + Poppins) and FontAwesome v6 for visual excellence.

---

## 📂 Project Structure & Module Definitions

All application files are located in your workspace: `f:\AI Notes\AgenticAICode\SLVPG\`

```
SLVPG/
├── index.html              # Main application viewport and resource loader
├── css/
│   └── styles.css          # Premium stylesheets, animations, grid systems, and HSL colors
└── js/
    ├── data.js             # High-speed data engine and automatic database seeding
    ├── auth.js             # Secure simulator for Mobile + OTP login, signup & guests
    ├── notifications.js    # Notification dispatching engine (dues, reviews, site visits)
    ├── rooms.js            # Floor planner, bed allocations, & occupancy indicators
    ├── tenants.js          # Profiles, occupation details, notice periods, and histories
    ├── finance.js          # Dues tracker, collections, payment register & CSV exports
    ├── documents.js        # Tenant verification locker (Aadhar, photos, etc.)
    ├── reviews.js          # Resident feedback engine with admin approvals
    ├── visit.js            # Site-visit scheduler and booking calendar
    └── app.js              # Central core router, dashboard components, and modals
```

---

## 🔄 User Roles & Simulated OTP Login

The app supports three dedicated logins. To access the simulated OTP login, use any of the pre-loaded phone numbers below.

> **Note:**
> When you click **Send OTP**, the app simulates SMS dispatching and instantly displays a premium Info Box showing the 6-digit OTP code for effortless testing.

### 1. Admin/Owner View (`9999999999`)
* **Dashboard Summary**: Real-time cards displaying Active Tenants, Vacant Beds, Monthly Collected Revenue, Pending Dues count, and Site Visit Requests.
* **Floor Plan & Occupancy**: Visual room-by-room, bed-by-bed floor plan showing occupancy slots (AC and Non-AC).
* **Tenant Lifecycle Manager**: Form to onboard new tenants, allocate vacant rooms and specific beds, and process tenant checkouts/vacating.
* **Rent Register**: Register showing every payment transaction. Record cash, UPI, or NEFT payments, and download CSV reports.
* **Smart Reminders**: Broadcast automated pending due warnings instantly to both the Admin alert feed and matching tenants' boards.
* **Documents Vault**: Admin dashboard to view, verify, or download uploaded resident ID proofs.
* **Feedback Moderator**: Moderate reviews submitted by visitors. Approved reviews are immediately posted to the public dashboard.

### 2. Tenant View (`9876543210` - Priya / `9876543211` - Ananya)
* **My Dashboard**: Displays customized room details (Room no, Bed assigned, rent cycle), outstanding dues, and total months paid.
* **Finance History**: Chronological transaction history.
* **Document Locker**: Residents can upload photos and required digital IDs (Aadhar, PAN, Voter ID, Passport) directly for review.
* **Instant Notifications**: Automated alerts showing if rent is due, or when payments have successfully cleared.

### 3. Guest View (Public)
* **Explore Rooms**: Inspect rent rates, room formats (AC vs. Non-AC), and active bed availabilities.
* **Public Reviews**: Read feedback written by real residents (showing only approved reviews).
* **Booking Site Visits**: Interactive visit scheduler allowing the user to select dates, preferred timeslots, and the purpose of the visit.

---

## 💎 Features Walkthrough

### 🏠 Rooms & Bed Management
The hostel contains **6 floors with 4 rooms per floor and 4 beds per room (96 total beds)**:
- Rooms ending in `.01` and `.02` are designated as premium **AC Rooms** (₹8,000/bed).
- Rooms ending in `.03` and `.04` are designated as comfortable **Non-AC Rooms** (₹6,000/bed).
- Selecting any room cell opens a bed allocator modal showing exactly who occupies which bed, who is vacant, and resident profile details.

### 💰 Finance & Rent Tracker
- **Dues Engine**: Calculates expected rent for every active tenant on the 1st of each month.
- **Dues Date**: Due by the 5th of every month.
- **Payment Collection Status**: Premium visual progress bar showcasing overall payment percentage.
- **CSV Data Exporter**: Instant download of reports containing rooms, tenants list, or finance logs directly to your system with one click.

### 📁 Tenant Document Vault
- High-fidelity visual system verifying crucial resident items.
- Status badges: **Pending** and **Verified**.
- Safe, simulated client-side file upload interface.

---

## 🚀 How to Run the App Instantly

No compiler or packages required!

1. Open your file explorer and navigate to: `f:\AI Notes\AgenticAICode\SLVPG\`
2. Double-click `index.html` or open it with any web browser (Chrome, Edge, Firefox).
3. The app is live and fully persistent!
