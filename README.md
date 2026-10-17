# SlideRep

SlideRep es una aplicación diseñada para ayudar a los jueces en competiciones y entrenamientos de CrossFit a llevar el seguimiento de repeticiones, rondas, tiempos y otros marcadores, todo ello con una interfaz pensada para minimizar la atención visual del juez, permitiéndole mantener el foco en la calidad de los movimientos del atleta.

---

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Start the app

   ```bash
   pnpm start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Local Android builds

Builds run on this machine, without EAS cloud. Requirements: JDK 17 (`JAVA_HOME`) and the Android SDK (`ANDROID_HOME`, licenses accepted — Gradle downloads the NDK/CMake on first build).

```bash
pnpm build:apk    # release APK  → android/app/build/outputs/apk/release/app-release.apk
pnpm build:apk:arm64  # same APK, arm64-v8a only: ~¼ the size, faster build; physical phones only (won't run on an x86_64 emulator)
pnpm build:aab    # release AAB  → android/app/build/outputs/bundle/release/app-release.aab
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Both regenerate `android/` from `app.json` (`expo prebuild --clean`); the folder is git-ignored, so don't edit it by hand. The release build is signed with the template's debug keystore — fine for sideloading, not for the Play Store.

`pnpm build:local` runs the EAS `preview` profile locally instead (`eas build --local`): same output format as the cloud build, but it needs `eas-cli` installed and an `eas login`.

iOS can't be built locally on Linux (it needs macOS + Xcode); use EAS cloud for that.

## Get a fresh project

When you're ready, run:

```bash
pnpm reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
