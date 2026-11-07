# Nochalant Keys — iOS keyboard extension

This source is the native iOS keyboard-extension starting point. It is separate from the Next.js website and cannot be installed by a browser.

## Xcode integration

1. Open the Nochalant iOS host-app project in Xcode (the repository currently does not contain an iOS host-app project).
2. Add a **Keyboard Extension** target named `NochalantKeyboard`.
3. Replace the generated `KeyboardViewController.swift` with the source in this folder.
4. Set the extension bundle identifier under the host app bundle identifier.
5. Set the extension deployment target to the supported iOS version.
6. In the extension target's `Info.plist`, set `NSExtensionPointIdentifier` to `com.apple.keyboard-service` and `NSExtensionPrincipalClass` to `$(PRODUCT_MODULE_NAME).KeyboardViewController`.
7. Keep **RequestsOpenAccess** disabled. The keyboard does not need network access or Full Access.
8. Embed the extension in the host app, sign both targets, and test on a physical iPhone.
9. Publish the host app through Apple's normal review process. Users enable it under Settings → General → Keyboard → Keyboards → Add New Keyboard.

## Honest limitations

- iOS users must explicitly enable and select the keyboard.
- Secure text fields and some host apps may switch to Apple's keyboard.
- The keyboard cannot silently install, force itself active, or change Apple's system keyboard.
- This first source version is a visual/typing foundation. Numeric layouts, language switching, autocorrection, dictation and VoiceOver polish need follow-up implementation and device testing.
