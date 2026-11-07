package club.nochalant.keys

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(32, 32, 32, 32)
            setBackgroundColor(android.graphics.Color.rgb(7, 7, 9))
        }
        val title = TextView(this).apply {
            text = "NOCHALANT KEYS"
            textSize = 27f
            setTextColor(android.graphics.Color.rgb(255, 65, 77))
            gravity = Gravity.CENTER
        }
        val intro = TextView(this).apply {
            text = "Your people. Your scene. Your keyboard.\n\nEnable Nochalant Keys in your device settings, then select it from the keyboard switcher."
            textSize = 16f
            setTextColor(android.graphics.Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(0, 24, 0, 24)
        }
        val enable = Button(this).apply {
            text = "Enable Nochalant Keys"
            setOnClickListener { startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS)) }
        }
        val choose = Button(this).apply {
            text = "Choose keyboard"
            setOnClickListener {
                val imm = getSystemService(INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
                imm.showInputMethodPicker()
            }
        }
        root.addView(title); root.addView(intro); root.addView(enable); root.addView(choose)
        setContentView(root)
    }
}
