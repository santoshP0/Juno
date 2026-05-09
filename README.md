# 🌙 Juno — Period & Women's Health Tracker

A privacy-first, fully offline, beautifully designed period and women's health tracker for Android.

> **100% standalone · 100% offline · 100% private**  
> No accounts · No servers · No tracking · Ever.

---

## Features

| Feature | Description |
|---|---|
| 🔴 Cycle tracking | Log period days, predict next cycle, see fertile window |
| 📅 Calendar view | Color-coded calendar with period, fertile, and ovulation days |
| 📝 Daily log | Flow, symptoms, mood, sleep, BBT, weight, cervical mucus, notes |
| 📊 Insights | Charts and stats for cycle length, BBT, weight, symptom patterns |
| 🔒 Privacy lock | PIN + biometric (fingerprint/face) app lock |
| 📚 Articles | 35 bundled health articles, fully offline |
| 🔔 Notifications | Local-only reminders for period, fertile window, ovulation |
| 💾 Backup | Export/import JSON backup + CSV export |
| 🌙 Dark mode | Full light + dark theme support |
| 🎯 Modes | Tracking / TTC / Pregnancy / Birth Control / Perimenopause |

---

## Tech Stack

- **Framework:** Expo SDK 52 (managed workflow)
- **Language:** TypeScript (strict mode)
- **Navigation:** expo-router (file-based)
- **State:** Zustand + AsyncStorage persistence
- **Database:** expo-sqlite (local SQLite)
- **Secure storage:** expo-secure-store (PIN)
- **UI:** NativeWind (Tailwind for RN) + custom components
- **Animations:** react-native-reanimated v3
- **Charts:** react-native-gifted-charts
- **Date utils:** date-fns

---

## Setup

### Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android Studio (for emulator) or a physical Android device

### Install

```bash
git clone <repo-url>
cd juno
npm install
```

### Start development server

```bash
npx expo start
```

Press `a` to open on Android emulator, or scan the QR code with Expo Go on a physical device.

### Run on Android emulator directly

```bash
npx expo run:android
```

---

## Architecture Overview

### Offline-First Design

Juno has zero network calls at runtime. Here's how each feature works offline:

| Feature | How it works offline |
|---|---|
| Cycle data | Stored in SQLite via expo-sqlite |
| User settings | Stored in AsyncStorage via Zustand persist |
| PIN / biometrics | expo-secure-store + expo-local-authentication |
| Notifications | Scheduled locally via expo-notifications |
| Articles | Bundled as JSON in `constants/articles.json` |
| Backup | Written to local file system, shared via OS share sheet |

### Folder Structure

```
juno/
├── app/                    # expo-router screens
│   ├── (onboarding)/       # 6 onboarding screens
│   ├── (tabs)/             # Main tab screens
│   ├── log/[date].tsx      # Daily log screen
│   ├── article/[id].tsx    # Article reader
│   ├── settings/           # All settings screens
│   └── lock.tsx            # App lock screen
├── components/
│   ├── ui/                 # Base UI (Button, Card, Input, Typography)
│   └── widgets/            # Domain widgets (CycleRing, PinPad, etc.)
├── stores/                 # Zustand stores (user, cycle, settings)
├── lib/
│   ├── db/                 # SQLite schema, migrations, queries
│   ├── predictions/        # Cycle prediction algorithm
│   ├── notifications/      # Local notification scheduling
│   └── backup/             # Export/import logic
├── constants/              # Colors, theme, content, articles.json
├── hooks/                  # useTheme, useAppLock, useCycle
└── types/                  # TypeScript types
```

### Prediction Algorithm

Located in `lib/predictions/algorithm.ts`:

1. Collects up to 6 most recent completed cycles
2. Averages cycle lengths and period lengths
3. Calculates standard deviation → confidence range
4. Projects next period, ovulation, fertile window from latest cycle start
5. If BBT data exists, detects temperature shift to refine ovulation estimate
6. Adjusts automatically as more cycles are logged

---

## How to Add New Articles

1. Open `constants/articles.json`
2. Add a new object following the `Article` interface:

```json
{
  "id": "your-article-id",
  "title": "Article Title",
  "summary": "Brief 1-2 sentence description.",
  "category": "cycle_basics",
  "readingTimeMinutes": 5,
  "content": "## Section\\n\\nBody text here...",
  "tags": ["tag1", "tag2", "tag3"]
}
```

Valid categories: `cycle_basics`, `health_conditions`, `nutrition`, `fitness`, `mental_health`, `sexual_health`, `pregnancy`, `perimenopause`, `ttc`

Content supports basic markdown: `## Heading`, `- bullet points`, plain paragraphs.

---

## Build for Play Store

### Prerequisites

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Configure your project ID in `app.json` under `extra.eas.projectId`

### Production AAB (Play Store)

```bash
eas build --platform android --profile production
```

### Production APK (sideload / testing)

```bash
eas build --platform android --profile production-apk
```

### Submit to Play Store

```bash
eas submit --platform android --profile production
```

You'll need a `google-service-account.json` for automated submission (see EAS docs).

---

## Running Tests

```bash
npm test
```

Unit tests for the prediction algorithm are in:
`lib/predictions/__tests__/algorithm.test.ts`

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Single-row user profile |
| `cycles` | Period cycle records |
| `daily_logs` | One row per logged date |
| `settings` | Key-value app settings |
| `bookmarks` | Bookmarked article IDs |
| `schema_version` | Migration tracking |

Schema is initialized in `lib/db/schema.ts` and migrations are in `lib/db/migrations.ts`.

---

## Privacy

See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) for full details.

**TL;DR:** All data lives on your device. No internet connection is ever made. No data is ever shared with anyone.

---

## License

MIT — see LICENSE file.
