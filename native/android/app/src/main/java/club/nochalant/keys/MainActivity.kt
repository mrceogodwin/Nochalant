package club.nochalant.keys

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.SeekBar
import android.widget.Switch
import android.widget.TextView

class MainActivity : Activity() {
    private val prefs by lazy { getSharedPreferences("nochalant_keys", MODE_PRIVATE) }
    private val red = android.graphics.Color.rgb(255, 65, 77)
    private val black = android.graphics.Color.rgb(7, 7, 9)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(28, 36, 28, 36)
            setBackgroundColor(black)
        }
        val title = TextView(this).apply {
            text = "NOCHALANT KEYS"
            textSize = 27f
            setTextColor(red)
            gravity = Gravity.CENTER
        }
        val intro = TextView(this).apply {
            text = "Your people. Your scene. Your keyboard.\nEnable your keyboard, then make every tap sound like Nochalant."
            textSize = 15f
            setTextColor(android.graphics.Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(0, 20, 0, 28)
        }
        root.addView(title)
        root.addView(intro)
        val soundTitle = TextView(this).apply {
            text = "KEYBOARD SOUND EXPERIENCE"
            textSize = 14f
            setTextColor(red)
            setPadding(0, 8, 0, 8)
        }
        root.addView(soundTitle)
        val soundSwitch = Switch(this).apply {
            text = "Enable Nochalant sounds"
            setTextColor(android.graphics.Color.WHITE)
            isChecked = prefs.getBoolean("keyboard_sounds_enabled", false)
            setOnCheckedChangeListener { _, checked ->
                prefs.edit().putBoolean("keyboard_sounds_enabled", checked).apply()
                if (checked) NochalantSoundEngine.play(this@MainActivity, "preview", 37)
            }
        }
        root.addView(soundSwitch)
        val volumeLabel = TextView(this).apply {
            text = "Sound volume"
            textSize = 14f
            setTextColor(android.graphics.Color.WHITE)
            setPadding(0, 18, 0, 4)
        }
        root.addView(volumeLabel)
        val volume = SeekBar(this).apply {
            max = 100
            progress = (prefs.getFloat("keyboard_sound_volume", 0.55f) * 100).toInt()
            progressTintList = android.content.res.ColorStateList.valueOf(red)
            thumbTintList = android.content.res.ColorStateList.valueOf(red)
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(seekBar: SeekBar?, value: Int, fromUser: Boolean) {
                    prefs.edit().putFloat("keyboard_sound_volume", value / 100f).apply()
                }
                override fun onStartTrackingTouch(seekBar: SeekBar?) {}
                override fun onStopTrackingTouch(seekBar: SeekBar?) {
                    if (soundSwitch.isChecked) NochalantSoundEngine.play(this@MainActivity, "preview", 81)
                }
            })
        }
        root.addView(volume)
        val preview = Button(this).apply {
            text = "Preview a Nochalant sound"
            setOnClickListener {
                if (!soundSwitch.isChecked) {
                    soundSwitch.isChecked = true
                } else {
                    NochalantSoundEngine.play(this@MainActivity, "preview", (System.nanoTime() % 100).toInt())
                }
            }
        }
        root.addView(preview)
        val enable = Button(this).apply {
            text = "Enable keyboard"
            setOnClickListener { startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS)) }
        }
        val choose = Button(this).apply {
            text = "Choose Nochalant Keys"
            setOnClickListener {
                val imm = getSystemService(INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
                imm.showInputMethodPicker()
            }
        }
        root.addView(enable)
        root.addView(choose)
        setContentView(root)
    }
}
