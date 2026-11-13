<div align="center">

# 🚀 Portfolio Architect Pro

### AI-assisted portfolio builder — guided 6-step wizard, three templates, cloud storage and one-click publishing

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=white) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white) ![Gemini API](https://img.shields.io/badge/Gemini_API-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE) ![Last commit](https://img.shields.io/github/last-commit/shiroonigami23-ui/student-portfolio?style=flat-square) ![Repo size](https://img.shields.io/github/repo-size/shiroonigami23-ui/student-portfolio?style=flat-square) ![Top language](https://img.shields.io/github/languages/top/shiroonigami23-ui/student-portfolio?style=flat-square) ![Status](https://img.shields.io/badge/status-active-blueviolet?style=flat-square)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/shiroonigami23-ui/student-portfolio?quickstart=1) [![Download ZIP](https://img.shields.io/badge/Download-ZIP-2ea44f?style=flat-square&logo=github)](https://github.com/shiroonigami23-ui/student-portfolio/archive/refs/heads/main.zip)

[**🚀 Live Demo**](https://shiroonigami23-ui.github.io/student-portfolio/) · [**Overview**](#-overview) · [**Features**](#-features) · [**Architecture**](#-architecture) · [**Getting Started**](#-getting-started) · [**Roadmap**](#-roadmap)

</div>

---

## 📖 Overview

**Portfolio Architect** helps students and professionals build a polished portfolio in minutes. A **six-step wizard** collects basics, experience, education, skills and more; an **AI text enhancer** rewrites descriptions, generates bullet points and fixes grammar, and a **first-draft generator** produces a whole starting portfolio from a role description. Choose from **Modern, Classic or Bold** templates, store images on **Cloudinary**, save to **Firebase**, and share a live link.

### ✨ Highlights

- **AI writing assistant** and first-draft generator
- **3 templates** — modern, classic, bold
- **Cloud persistence** with Firebase + Cloudinary
- **Live** at [shiroonigami23-ui.github.io/student-portfolio](https://shiroonigami23-ui.github.io/student-portfolio/)

## 🧩 Features

| Feature | What it does |
|---|---|
| **Wizard** | 6 guided sections |
| **AI enhancer** | Improve text, bullets, grammar (`ai.js`) |
| **Draft generator** | Portfolio from a role prompt |
| **Templates** | `templates/modern.js`, `classic.js`, `bold.js` |
| **Editor** | `editor.js` live editing |
| **Storage** | `firebase.js`, `storage.js`, `cloudinary.js` |
| **Validation** | `validator.js` |
| **Notifications** | `notifications.js` |

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Front-end | Vanilla JavaScript, HTML, CSS |
| AI | Gemini API |
| Backend | Firebase |
| Media | Cloudinary |
| Hosting | GitHub Pages |

## 🏗 Architecture



```mermaid
flowchart LR
  U[User] --> W[Wizard]
  W --> AI[ai.js\nGemini]
  W --> ED[editor.js]
  ED --> T[Templates\nmodern · classic · bold]
  ED --> FB[(Firebase)]
  ED --> CL[(Cloudinary images)]
  T --> PUB[Public portfolio link]
```

➡️ Full design notes, data flow and design decisions: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

## 📁 Project Structure

```text
student-portfolio/
├── index.html · app.js · ui.js · modal.js
├── ai.js · editor.js · portfolio.js · validator.js · notifications.js
├── firebase.js · storage.js · cloudinary.js · config.js
└── templates/{modern,classic,bold}.js
```

## 🚀 Getting Started

### 1. Get the code

Pick whichever method suits you:

| Method | Command |
|---|---|
| **HTTPS** | `git clone https://github.com/shiroonigami23-ui/student-portfolio.git` |
| **SSH** | `git clone git@github.com:shiroonigami23-ui/student-portfolio.git` |
| **GitHub CLI** | `gh repo clone shiroonigami23-ui/student-portfolio` |
| **ZIP** | [Download](https://github.com/shiroonigami23-ui/student-portfolio/archive/refs/heads/main.zip) and extract |
| **Codespaces** | [Open in browser](https://codespaces.new/shiroonigami23-ui/student-portfolio?quickstart=1) — zero local setup, dev container preconfigured |

> 🔑 **Using SSH for the first time?** Generate a key with `ssh-keygen -t ed25519 -C "you@example.com"`, add the `.pub` contents at **GitHub → Settings → SSH and GPG keys**, then test with `ssh -T git@github.com`.

### 2. Install & set up

```bash
cd student-portfolio
python3 -m http.server 8080      # configure keys in config.js first
```

### 3. Run

Or use the live app: **https://shiroonigami23-ui.github.io/student-portfolio/**

## 🗺 Roadmap

**v1 (done)**

- [x] Wizard, AI enhancer, templates, cloud save

**v1.1**

- [ ] PDF résumé export
- [ ] Custom domains
- [ ] More templates

**v2.0**

- [ ] GitHub/LinkedIn import
- [ ] Analytics on portfolio views

➡️ Detailed plan, milestones and long-term vision: **[docs/ROADMAP.md](docs/ROADMAP.md)**

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "feat: add amazing feature"`
4. Push the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request against `main`

Check the [issues page](https://github.com/shiroonigami23-ui/student-portfolio/issues) and the [roadmap](docs/ROADMAP.md) for ideas on where to help.

## 📜 Changelog

See [CHANGELOG.md](CHANGELOG.md) for the release history.

## 📄 License

Distributed under the **MIT** license. See [LICENSE](LICENSE) for details.

## 👤 Author

**Aryan Singh Chandel** (Shiro)

[![GitHub](https://img.shields.io/badge/GitHub-shiroonigami23--ui-181717?style=flat-square&logo=github)](https://github.com/shiroonigami23-ui)

<div align="center">

⭐ **If you find this project useful, consider giving it a star!** ⭐

</div>
