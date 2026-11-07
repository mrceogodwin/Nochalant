package club.nochalant.keys

import android.inputmethodservice.InputMethodService
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.graphics.Color
import android.graphics.Typeface

class NochalantKeyboardService : InputMethodService() {
    private val red = Color.rgb(255, 65, 77)
    private val black = Color.rgb(7, 7, 9)
    private var shifted = false

    override fun onCreateInputView(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(black)
            setPadding(4, 8, 4, 8)
        }
        addRow(root, listOf("NOCHALANT", "Your people", "Your scene"), suggestions = true)
        addRow(root, "qwertyuiop".map { it.toString() })
        addRow(root, "asdfghjkl".map { it.toString() })
        addRow(root, listOf("⇧") + "zxcvbnm".map { it.toString() } + "⌫")
        addRow(root, listOf("123", "☺", "space", "↵"))
        return root
    }

    private fun addRow(root: LinearLayout, keys: List<String>, suggestions: Boolean = false) {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        keys.forEach { label ->
            val button = Button(this).apply {
                text = label
                isAllCaps = false
                textSize = if (suggestions) 12f else 18f
                setTextColor(if (label == "⇧" || label == "⌫" || label == "↵" || label == "123" || label == "☺") black else red)
                setBackgroundColor(if (label == "⇧" || label == "⌫" || label == "↵" || label == "123" || label == "☺") red else Color.TRANSPARENT)
                typeface = Typeface.DEFAULT
                setOnClickListener { handleKey(label) }
            }
            row.addView(button, LinearLayout.LayoutParams(0, if (suggestions) dp(34) else dp(48), 1f).apply {
                setMargins(dp(2), dp(3), dp(2), dp(3))
            })
        }
        root.addView(row, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
    }

    private fun handleKey(key: String) {
        val connection = currentInputConnection ?: return
        when (key) {
            "⇧" -> { shifted = !shifted; setInputView(onCreateInputView()) }
            "⌫" -> connection.deleteSurroundingText(1, 0)
            "space" -> connection.commitText(" ", 1)
            "↵" -> connection.commitText("\n", 1)
            "123", "☺" -> { /* Dedicated number and sticker panels are next iteration. */ }
            else -> {
                connection.commitText(if (shifted) key.uppercase() else key, 1)
                shifted = false
            }
        }
    }

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
}
