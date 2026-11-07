import UIKit

final class KeyboardViewController: UIInputViewController {
    private let rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"]
    private let red = UIColor(red: 1.0, green: 0.25, blue: 0.31, alpha: 1)
    private let panel = UIColor(red: 0.025, green: 0.025, blue: 0.03, alpha: 1)
    private var shifted = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = panel
        view.translatesAutoresizingMaskIntoConstraints = false
        buildKeyboard()
    }

    override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
        // Keep a compact keyboard height while respecting the host app's safe area.
        let height = view.heightAnchor.constraint(equalToConstant: 265)
        height.priority = .defaultHigh
        height.isActive = true
    }

    private func buildKeyboard() {
        let root = UIStackView()
        root.axis = .vertical
        root.spacing = 9
        root.distribution = .fillEqually
        root.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(root)
        NSLayoutConstraint.activate([
            root.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 5),
            root.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -5),
            root.topAnchor.constraint(equalTo: view.topAnchor, constant: 8),
            root.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -8)
        ])

        let suggestions = UIStackView()
        suggestions.axis = .horizontal
        suggestions.distribution = .fillEqually
        ["NOCHALANT", "Your people", "Your scene"].forEach { title in
            let label = UILabel()
            label.text = title
            label.textAlignment = .center
            label.textColor = red
            label.font = .systemFont(ofSize: 13, weight: .medium)
            suggestions.addArrangedSubview(label)
        }
        root.addArrangedSubview(suggestions)

        rows.enumerated().forEach { index, row in
            let line = UIStackView()
            line.axis = .horizontal
            line.spacing = 5
            line.distribution = .fillEqually
            if index == 2 { line.addArrangedSubview(key("⇧", action: #selector(toggleShift), filled: true)) }
            row.forEach { character in
                let title = shifted ? String(character).uppercased() : String(character)
                line.addArrangedSubview(key(title) { [weak self] in
                    self?.textDocumentProxy.insertText(title)
                    self?.shifted = false
                })
            }
            if index == 2 { line.addArrangedSubview(key("⌫", action: #selector(deleteBackward), filled: true)) }
            root.addArrangedSubview(line)
        }

        let bottom = UIStackView()
        bottom.axis = .horizontal
        bottom.spacing = 5
        bottom.distribution = .fillEqually
        bottom.addArrangedSubview(key("123") { [weak self] in self?.showNumbers() })
        bottom.addArrangedSubview(key("☺") { [weak self] in self?.textDocumentProxy.insertText("✨") })
        bottom.addArrangedSubview(key("space") { [weak self] in self?.textDocumentProxy.insertText(" ") })
        bottom.addArrangedSubview(key("↵", action: #selector(handleReturn), filled: true))
        root.addArrangedSubview(bottom)
    }

    private func key(_ title: String, action: @escaping () -> Void) -> UIButton {
        let button = UIButton(type: .system)
        button.setTitle(title, for: .normal)
        button.setTitleColor(red, for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 19, weight: .medium)
        button.backgroundColor = panel
        button.layer.borderColor = red.cgColor
        button.layer.borderWidth = 1.4
        button.layer.cornerRadius = 9
        button.addAction(UIAction { _ in action() }, for: .touchUpInside)
        return button
    }

    private func key(_ title: String, action selector: Selector, filled: Bool = false) -> UIButton {
        let button = key(title) { [weak self] in self?.perform(selector) }
        if filled {
            button.backgroundColor = red
            button.setTitleColor(panel, for: .normal)
        }
        return button
    }

    @objc private func toggleShift() { shifted.toggle(); rebuild() }
    @objc private func deleteBackward() { textDocumentProxy.deleteBackward() }
    @objc private func handleReturn() {
        if textDocumentProxy.returnKeyType == .send || textDocumentProxy.returnKeyType == .go {
            textDocumentProxy.insertText("\n")
        } else {
            textDocumentProxy.insertText("\n")
        }
    }
    private func showNumbers() {
        // Number layout is a separate follow-up iteration; keep this control safe and predictable.
        textDocumentProxy.insertText("")
    }
    private func rebuild() {
        view.subviews.forEach { $0.removeFromSuperview() }
        buildKeyboard()
    }
}
