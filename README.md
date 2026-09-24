# VKU Room Booking App (DatPhongHoc) - Mini-Project 2

A mobile and web application built with **React Native (Expo)**, **Zustand** (State Management), and **Firebase Realtime Database** for managing and booking study rooms at VKU (Vietnam - Korea University of Information and Communication Technology).

---

## 🚀 Live Demo & Video Deliverables
* **Expo Go / Web Link:** [Insert your Expo project link or deployment URL here]
* **Video Demo (2-3 mins):** [Insert YouTube / Google Drive link to your phone walkthrough video here]

---

## ✨ Key Features
1. **User Authentication:** Secure email/password login and registration synchronized with Firebase Database.
2. **Room Discovery & Filtering:** Browse study rooms by building, capacity, and available amenities.
3. **Smart Booking & Conflict Prevention:** Real-time checking to prevent overlapping time slots for both rooms and users.
4. **Local & Cloud Sync:** Offline-first caching using AsyncStorage combined with Firebase Realtime Database and Cloudflare D1 integration.
5. **Notifications:** Local push notifications for room booking reminders.

---

## 🛠️ Tech Stack
* **Frontend:** React Native, Expo, Expo Router / Navigation, Ionicons
* **State Management:** Zustand
* **Database & Backend:** Firebase Realtime Database, Cloudflare D1 (API integration), AsyncStorage

---

## 📦 Project Structure
```text
├── src/
│   ├── components/       # Reusable UI components & Modals
│   ├── constants/        # App colors, time slots, schema definitions
│   ├── database/         # Local DB service & schema logic
│   ├── screens/          # Main application screens (Login, RoomList, Booking, Profile)
│   ├── services/         # Firebase service, Cloudflare API, Notifications
│   └── store/            # Zustand global state management
├── App.js                # Root application entry point
├── app.json              # Expo configuration
└── package.json          # Dependencies and scripts