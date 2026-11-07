import UIKit

final class KeyboardViewController: UIInputViewController {
    private let red = UIColor(red: 1, green: 0.25, blue: 0.31, alpha: 1)
    private let panel = UIColor(red: 0.025, green: 0.025, blue: 0.03, alpha: 1)
    private var shifted = false
    private var mode = 0 // 0 letters, 1 numbers, 2 symbols
    private var root: UIStackView?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = panel
        view.translatesAutoresizingMaskIntoConstraints = false
        buildKeyboard()
    }

    private func buildKeyboard() {
        root?.removeFromSuperview()
        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 8
        stack.distribution = .fillEqually
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 5),
            stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -5),
            stack.topAnchor.constraint(equalTo: view.topAnchor, constant: 7),
            stack.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -7)
        ])
        root = stack

        let suggestions = UIStackView()
        suggestions.axis = .horizontal
        suggestions.distribution = .fillEqually
        ["“One”", "Two", "Three"].forEach { title in
            let label = UILabel()
            label.text = title
            label.textAlignment = .center
            label.textColor = red
            label.font = .systemFont(ofSize: 17, weight: .medium)
            suggestions.addArrangedSubview(label)
        }
        stack.addArrangedSubview(suggestions)

        let rows: [String] = mode == 0
            ? ["qwertyuiop", "asdfghjkl", "zxcvbnm"]
            : mode == 1
                ? ["1234567890", "@#$%&-*+()", "!\"':;/?"]
                : ["~`|•√π÷×¶∆", "£¢€¥^°={}\\", "%©®™✓[]<>"]

        rows.enumerated().forEach { index, row in
            let line = UIStackView()
            line.axis = .horizontal
            line.spacing = 5
            line.distribution = .fillEqually
            if mode == 0 && index == 2 {
                line.addArrangedSubview(key("⇧", filled: true) { [weak self] in
                    self?.shifted.toggle(); self?.buildKeyboard()
                })
            }
            for character in row {
                let value = String(character)
                let title = shifted && mode == 0 ? value.uppercased() : value
                line.addArrangedSubview(key(title) { [weak self] in
                    self?.textDocumentProxy.insertText(title)
                    if self?.shifted == true { self?.shifted = false; self?.buildKeyboard() }
                })
            }
            if mode == 0 && index == 2 {
                line.addArrangedSubview(key("⌫", filled: true) { [weak self] in self?.textDocumentProxy.deleteBackward() })
            }
            stack.addArrangedSubview(line)
        }

        let bottom = UIStackView()
        bottom.axis = .horizontal
        bottom.spacing = 5
        bottom.distribution = .fillProportionally
        bottom.addArrangedSubview(key(mode == 0 ? "123" : mode == 1 ? "#+=" : "ABC", filled: true) { [weak self] in
            guard let self else { return }
            self.mode = self.mode == 0 ? 1 : self.mode == 1 ? 2 : 0
            self.buildKeyboard()
        })
        bottom.addArrangedSubview(key("☺", filled: true) { [weak self] in self?.textDocumentProxy.insertText("😊") })
        bottom.addArrangedSubview(key("space") { [weak self] in self?.textDocumentProxy.insertText(" ") })
        bottom.addArrangedSubview(key("↵", filled: true) { [weak self] in self?.textDocumentProxy.insertText("\n") })
        stack.addArrangedSubview(bottom)
    }

    private func key(_ title: String, filled: Bool = false, action: @escaping () -> Void) -> UIButton {
        let button = UIButton(type: .system)
        button.setTitle(title, for: .normal)
        button.setTitleColor(filled ? panel : red, for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: title == "space" ? 16 : 19, weight: .medium)
        button.backgroundColor = filled ? red : panel
        button.layer.borderColor = red.cgColor
        button.layer.borderWidth = 1.5
        button.layer.cornerRadius = 9
        button.addAction(UIAction { _ in action() }, for: .touchUpInside)
        return button
    }
}
