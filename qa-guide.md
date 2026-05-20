# QA 서브에이전트 상세 가이드

> CLAUDE.md 섹션 7에서 참조. UI 개발 QA 시에만 이 파일을 읽는다.

## 빌드 & 실행 명령어

### Android
```bash
npx expo run:android
# 또는 직접 빌드
emulator -list-avds && emulator -avd {AVD} -no-window -no-audio &
adb wait-for-device
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n {패키지명}/{액티비티명}
```

### iOS
```bash
npx expo run:ios
# 또는 직접 빌드
xcrun simctl list devices available
xcrun simctl boot "iPhone 15 Pro"
xcodebuild -workspace ios/App.xcworkspace -scheme App \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  -derivedDataPath .tmp/build build
xcrun simctl install booted .tmp/build/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch booted {번들ID}
```

## 로그 수집
```bash
# Android
adb logcat --pid=$(adb shell pidof -s {패키지명}) -d > .tmp/qa_android.log
adb logcat *:E --pid=$(adb shell pidof -s {패키지명}) -d

# iOS
xcrun simctl spawn booted log show --predicate 'subsystem == "{번들ID}"' --last 2m > .tmp/qa_ios.log
```

## 스크린샷 & UI 분석
```bash
# Android
adb shell screencap -p /sdcard/qa_screen.png && adb pull /sdcard/qa_screen.png .tmp/
adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml .tmp/
adb shell input keyevent KEYCODE_BACK

# iOS
xcrun simctl io booted screenshot .tmp/qa_ios_screen.png
xcrun simctl openurl booted "myapp://screen/settings"
xcrun simctl io booted screenshot .tmp/qa_ios_after.png
```

> 좌표 기반 탭(input tap x y)은 해상도마다 달라 사용하지 않는다.

## 다크모드 테스트
```bash
# Android
adb shell cmd uimode night yes
adb shell screencap -p /sdcard/qa_dark.png && adb pull /sdcard/qa_dark.png .tmp/
adb shell cmd uimode night no

# iOS
xcrun simctl ui booted appearance dark
xcrun simctl io booted screenshot .tmp/qa_ios_dark.png
xcrun simctl ui booted appearance light
```

## 해상도 테스트

### Android
```bash
adb shell wm size 1080x1920   # FHD
adb shell screencap -p /sdcard/qa_fhd.png && adb pull /sdcard/qa_fhd.png .tmp/
adb shell wm size 1440x3200   # QHD+
adb shell screencap -p /sdcard/qa_qhd.png && adb pull /sdcard/qa_qhd.png .tmp/
adb shell wm size reset
```

### iOS — 필수 기기
```bash
for device in "iPhone SE (3rd generation)" "iPhone 15 Pro" "iPhone 15 Pro Max"; do
  xcrun simctl boot "$device" 2>/dev/null
  xcrun simctl install "$device" {앱경로}
  xcrun simctl launch "$device" {번들ID}
  sleep 3
  xcrun simctl io "$device" screenshot ".tmp/qa_${device// /_}.png"
  xcrun simctl shutdown "$device"
done
```

## 플랫폼 고유 테스트

### Android
```bash
# 화면 회전
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 1
adb shell screencap -p /sdcard/qa_land.png && adb pull /sdcard/qa_land.png .tmp/
adb shell settings put system user_rotation 0
```

### iOS
```bash
# 상태바 오버라이드 (스크린샷용)
xcrun simctl status_bar booted override --time "9:41" --batteryLevel 100

# 접근성 폰트 크기
xcrun simctl spawn booted defaults write com.apple.Accessibility \
  PreferredContentSizeCategoryName UICTContentSizeCategoryAccessibilityExtraLarge
```

## QA 보고 형식
```
📱 QA: {앱명} — {플랫폼}
🔧 빌드: ✅/❌  📝 타입: ✅/❌  🖱️ 기능: ✅/⚠️  🎨 UI: ✅/⚠️  📱 호환: ✅/⚠️
스크린샷: .tmp/qa_*.png | 로그: .tmp/qa_*.log
{이상 항목 + 수정 내역}
```
