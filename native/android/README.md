# Nochalant Keys — Android input method

The Android keyboard service source is provided as a native integration starting point. It is not part of the Next.js browser build.

## Host-app integration

1. Add this Kotlin source to an Android application module.
2. Add a keyboard service declaration to the app manifest:

```xml
<service
    android:name=".NochalantKeyboardService"
    android:label="Nochalant Keys"
    android:permission="android.permission.BIND_INPUT_METHOD"
    android:exported="true">
    <intent-filter>
        <action android:name="android.view.InputMethod" />
    </intent-filter>
    <meta-data
        android:name="android.view.im"
        android:resource="@xml/nochalant_keyboard" />
</service>
```

3. Create `res/xml/nochalant_keyboard.xml`:

```xml
<input-method xmlns:android="http://schemas.android.com/apk/res/android">
    <subtype android:label="English (US)" android:imeSubtypeLocale="en_US" android:imeSubtypeMode="keyboard" />
</input-method>
```

4. Build, sign and install the Android host app.
5. Users enable Nochalant Keys in Android Settings → System → Languages & input → On-screen keyboard → Manage keyboards, then select it from the keyboard switcher.

## Privacy

This initial keyboard service does not request Internet permission or send typed content anywhere. Do not add analytics, network access, clipboard collection or Full Access-like functionality without a clear need and transparent consent.

## Limitations

The source is a starter implementation, not a release-ready keyboard. Number/symbol layouts, emoji/sticker panels, autocorrection, multilingual support, accessibility and device-specific sizing still require implementation and testing.
