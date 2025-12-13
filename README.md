# 🍽️ Dinner Match (World Class Edition)

A premium family meal planning app designed to be installed on your iPhone as a PWA. Features a stunning dark UI, Swipe-to-Decide gamification, and a Family League Table!

![App Hero](/public/images/hero.png)

## ✨ New Premium Features

- **World-Class UI** - Inspired by top-tier designs with full-screen imagery and bold typography.
- **Swipe to Decide** - Tinder-style swiping to find a meal everyone agrees on.
- **Family League Table** - Compete for points! See who is the most active foodie in the sidebar.
- **Custom Avatars** - Personalized cartoon avatars for every family member.
- **PWA Ready** - Installs on iPhone/Android with full offline support (cached images).

## 🚀 Quick Start

### 1. Install & Run
```bash
npm install
npm start
```

### 2. Connect Your Phone
The app will try to open on `localhost:3000`. To use on your phone:
- **Option A (ngrok)**: Run `ngrok http 3000` and use the https link.
- **Option B (Local IP)**: Run `hostname -I` to find your IP (e.g., `192.168.1.5`) and go to `http://192.168.1.5:3000`.

### 3. Install on iPhone
1. Open the link in **Safari**.
2. Tap **Share** (box with arrow).
3. Tap **Add to Home Screen**.

## 👥 Family Avatars

The app includes custom avatars for:
- **Dad** (Bearded Coder)
- **Mum** (Curly Hair Reader)
- **Ozzie** (Gamer)
- **Dorge** (Bass Player)

*Note: Ensure family names in the app match exactly (e.g., "Dad", "Mum") for avatars to appear.*

## 📂 Project Structure

- `server.js` - Express backend with SQLite.
- `public/` - The premium frontend (HTML/CSS/JS).
- `public/images/` - AI-generated food and avatar assets.
- `public/sw.js` - Service Worker for offline PWA support.

---

**Made with ❤️ for the O'Brien Family**
