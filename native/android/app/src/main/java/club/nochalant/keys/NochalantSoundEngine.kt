package club.nochalant.keys

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Handler
import android.os.Looper
import kotlin.math.PI
import kotlin.math.sin

/** Original procedural Nochalant sound palette: 100 variants, maximum 300 ms each. */
object NochalantSoundEngine {
    private const val SAMPLE_RATE = 44100
    private const val DURATION_MS = 300
    private var activeTrack: AudioTrack? = null

    fun play(context: Context, event: String, seed: Int = 0) {
        val prefs = context.getSharedPreferences("nochalant_keys", Context.MODE_PRIVATE)
        if (!prefs.getBoolean("keyboard_sounds_enabled", false)) return
        val volume = prefs.getFloat("keyboard_sound_volume", 0.55f).coerceIn(0f, 1f)
        if (volume <= 0f) return
        val family = when (event) {
            "delete" -> 1
            "shift" -> 2
            "space" -> 3
            "return" -> 4
            "layout" -> 5
            "emoji" -> 6
            "preview" -> 7
            else -> 0
        }
        val variant = Math.floorMod(seed, 100)
        val frequency = 430.0 + variant * 7.1 + family * 61.0
        val frames = SAMPLE_RATE * DURATION_MS / 1000
        val pcm = ShortArray(frames)
        for (i in 0 until frames) {
            val t = i.toDouble() / SAMPLE_RATE
            val attack = (t / 0.008).coerceIn(0.0, 1.0)
            val envelope = attack * kotlin.math.exp(-t * (8.0 + family * 0.8))
            val fundamental = sin(2.0 * PI * frequency * t)
            val harmonic = sin(2.0 * PI * frequency * (1.48 + (variant % 7) * 0.035) * t)
            val overtone = sin(2.0 * PI * frequency * (2.0 + (family % 3) * 0.17) * t)
            val transient = sin(2.0 * PI * frequency * 3.1 * t) * kotlin.math.exp(-t * 48.0)
            val sample = (fundamental * 0.62 + harmonic * 0.23 + overtone * 0.10 + transient * 0.05) * envelope * volume * 10500.0
            pcm[i] = sample.toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }
        try {
            activeTrack?.let { old ->
                try { if (old.playState == AudioTrack.PLAYSTATE_PLAYING) old.stop() } catch (_: Exception) {}
                old.release()
            }
            val track = AudioTrack.Builder()
                .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
                .setAudioFormat(AudioFormat.Builder().setEncoding(AudioFormat.ENCODING_PCM_16BIT).setSampleRate(SAMPLE_RATE).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
                .setTransferMode(AudioTrack.MODE_STATIC)
                .setBufferSizeInBytes(pcm.size * 2)
                .build()
            activeTrack = track
            track.write(pcm, 0, pcm.size, AudioTrack.WRITE_BLOCKING)
            track.play()
            Handler(Looper.getMainLooper()).postDelayed({
                if (activeTrack === track) {
                    try { if (track.playState == AudioTrack.PLAYSTATE_PLAYING) track.stop() } catch (_: Exception) {}
                    track.release()
                    activeTrack = null
                }
            }, DURATION_MS.toLong() + 40L)
        } catch (_: Exception) {
            // Never interrupt typing if audio playback is unavailable.
        }
    }
}
