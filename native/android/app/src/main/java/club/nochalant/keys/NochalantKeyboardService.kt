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
    private var mode = 0 // letters, numbers, symbols

    override fun onCreateInputView(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(black)
            setPadding(dp(4), dp(8), dp(4), dp(8))
        }
        addRow(root, listOf("“One”", "Two", "Three"), suggestions = true)
        val rows = when (mode) {
            0 -> listOf("qwertyuiop", "asdfghjkl", "zxcvbnm")
            1 -> listOf("1234567890", "@#$%&-*+()", "!\\\"':;/?")
            else -> listOf("~`|•√π÷×¶∆", "£¢€¥^°={}\\\\", "%©®™✓[]<>")
        }
        rows.forEachIndexed { index, row ->
            val keys = mutableListOf<String>()
            if (mode == 0 && index == 2) keys.add("⇧")
            keys.addAll(row.map { if (shifted && mode == 0) it.uppercase() else it.toString() })
            if (mode == 0 && index == 2) keys.add("⌫")
            addRow(root, keys)
        }
        addRow(root, listOf(if (mode == 0) "123" else if (mode == 1) "#+=" else "ABC", "☺", "space", "↵"))
        return root
    }

    private fun addRow(root: LinearLayout, keys: List<String>, suggestions: Boolean = false) {
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }
        keys.forEach { label ->
            val special = label in listOf("⇧", "⌫", "↵", "123", "#+=", "ABC", "☺")
            val button = Button(this).apply {
                text = label
                isAllCaps = false
                textSize = if (suggestions) 13f else if (label == "space") 14f else 18f
                setTextColor(if (special) black else red)
                setBackgroundColor(if (special) red else Color.TRANSPARENT)
                typeface = Typeface.DEFAULT
                setOnClickListener { handleKey(label) }
            }
            row.addView(button, LinearLayout.LayoutParams(0, dp(if (suggestions) 38 else 49), 1f).apply {
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
            "123" -> { mode = 1; setInputView(onCreateInputView()) }
            "#+=" -> { mode = 2; setInputView(onCreateInputView()) }
            "ABC" -> { mode = 0; setInputView(onCreateInputView()) }
            "☺" -> connection.commitText("😊", 1)
            "“One”" -> connection.commitText("One", 1)
            "Two" -> connection.commitText("Two", 1)
            "Three" -> connection.commitText("Three", 1)
            else -> {
                connection.commitText(if (shifted) key.uppercase() else key, 1)
                if (shifted) { shifted = false; setInputView(onCreateInputView()) }
            }
        }
    }

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
}
