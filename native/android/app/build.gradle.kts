plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "club.nochalant.keys"
    compileSdk = 35
    defaultConfig {
        applicationId = "club.nochalant.keys"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }
}
