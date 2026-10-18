<div align="center">

# Claugravity

<p>A local bridge connecting Claude extensions with Google Antigravity.</p>

[![Version](https://img.shields.io/badge/version-0.1--beta-3b82f6.svg?style=for-the-badge)](https://github.com/Yamiru/Claugravity/blob/main/.version)
[![License](https://img.shields.io/badge/license-MIT-10b981.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-6366f1.svg?style=for-the-badge)](#compatibility)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-f59e0b.svg?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Local Only](https://img.shields.io/badge/architecture-local--only%20%7C%20zero--telemetry-8b5cf6.svg?style=for-the-badge)](#architecture)

</div>

---

## What Claugravity does

Google Antigravity and Claude organize extensions differently:

| Claude ecosystem | Antigravity environment | What Claugravity does |
| :--- | :--- | :--- |
| Slash commands (`/skill-name`) | `SKILL.md` with YAML frontmatter | Converts markdown instructions into Antigravity skill directories |
| `CLAUDE.md` files | `AGENTS.md` and `GEMINI.md` | Maps system instructions to Antigravity global directive paths |
| Claude marketplace repositories | `~/.gemini/config/plugins/` | Clones or copies packages into native Antigravity structures |
| Claude MCP servers | `~/.gemini/antigravity/mcp_config.json` | Registers server configurations in Antigravity tool definitions |

Claugravity runs locally on your computer. It reads Claude repositories, adapts them into Antigravity format, and places them into your `~/.gemini/` configuration folders.

---

> [!IMPORTANT]
> ### Restart Antigravity after making changes
> Antigravity reads its skills, rules, and plugins once when it starts up. Whenever you install, update, or remove a package in Claugravity, restart your Antigravity application or IDE so it loads the updated configuration files.

---

## Security and design

### NVIDIA Agent Skills security inspector
Before activating skills, Claugravity runs static security checks inspired by NVIDIA Agent Skills guidelines. It flags:
- Dangerous shell execution patterns such as piped downloads (`curl | bash`, `wget | sh`) or PowerShell memory download cradles.
- Hardcoded API tokens, credentials, or private keys left in instruction text.

### Progressive disclosure
Antigravity loads full skill markdown files only when an agent invokes them. Claugravity formats YAML frontmatter with short, single-line summaries so the agent's base system prompt stays small.

### Collision and health detection
When duplicate skills exist across built-in Antigravity folders, standalone folders, and marketplace plugins, Claugravity identifies the conflict and offers clean consolidation.

---

## Supported operating systems & Antigravity releases

Claugravity is tested and compatible with all official Google Antigravity platforms and builds:

| Operating system | Architectures & packages | Status | Notes |
| :--- | :--- | :---: | :--- |
| **🍎 macOS** | Apple Silicon (`.dmg`), Intel (`.dmg`) | Supported | Native Apple Silicon (M1/M2/M3/M4) and Intel x86_64 execution |
| **🪟 Windows** | Windows x64 (`.exe`), Windows ARM64 (`.exe`) | Supported | Tested on Windows 10/11 x64 and Snapdragon ARM64 devices |
| **🐧 Linux** | Linux x64 (`.tar.gz`), Linux ARM64 (`.tar.gz`) | Supported | Debian, Ubuntu, Fedora, Arch, Raspberry Pi OS, and cloud ARM servers |

Works out of the box with both:
- **Google Antigravity App** (Desktop application)
- **Google Antigravity IDE** (Developer environment)

Configuration and skills resolve automatically to `~/.gemini/` on Unix-like systems and `%USERPROFILE%\.gemini\` on Windows.

---

## How Claugravity handles plugins

Claugravity provides full lifecycle management for plugins and skills:

1. **Installing:**
   - Accepts Git repository URLs or local directory paths.
   - Converts Claude commands, manifests, and instructions into Antigravity `SKILL.md` files with valid YAML frontmatter.
   - Copies clean package assets into `~/.gemini/config/plugins/<name>/` and records them in the internal installation registry.
2. **Loading & Discovery:**
   - Scans installed plugins, standalone skills, and Antigravity core tools on startup.
   - Displays real-time status, equipped tools, origins, and file sizes across the web dashboard and CLI.
3. **Modifying & Updating:**
   - Compares installed plugins against upstream Git repositories and tags.
   - Updates packages in place with one click or via `node src/cli.js update <id>`.
   - Allows creating new custom Antigravity skills directly through the web form.
4. **Uninstalling:**
   - Safely removes the plugin folder from disk (`~/.gemini/config/plugins/<name>`).
   - Unregisters the package from the installation database without leaving orphaned files.

---

## Versioning rules

Claugravity tracks version state through the [`.version`](https://github.com/Yamiru/Claugravity/blob/main/.version) file:
- **Versions `0.1` through `0.9`**: Beta releases. The dashboard displays `v0.1 (Beta)` and checks GitHub for newer tags.
- **Versions `1.0` and higher**: Stable releases.
- The built-in update checker triggers only when the GitHub version is strictly newer than your local version.

---

## Quick start

### Prerequisites
- [Node.js](https://nodejs.org/) 18.0.0 or newer
- [Git](https://git-scm.com/) installed and available in your system path

### 1. Clone and install

```bash
git clone https://github.com/Yamiru/Claugravity.git
cd Claugravity
npm install
```

### 2. Start the web interface

```bash
npm start
```

Open your browser at:
```text
http://localhost:4321
```

Click the version button in the top right to verify your release status against GitHub.

---

## Command line interface (CLI)

You can manage packages directly from your terminal:

```bash
# Search available items across cloned marketplaces
node src/cli.js search superpowers

# Run the health checker to detect collisions
node src/cli.js skills-check

# Install a package into Antigravity
node src/cli.js install superpowers@superpowers-marketplace

# Check for updates against upstream Git remotes
node src/cli.js check

# Update an installed package
node src/cli.js update "superpowers@superpowers-marketplace"

# Convert an arbitrary Claude package folder on disk
node src/cli.js convert "/path/to/claude-plugin"
```

---

## File layout on disk

Claugravity places converted files into the following paths:

| Component | Target path |
| :--- | :--- |
| Standalone skills | `~/.gemini/config/skills/<name>/SKILL.md` |
| Marketplace plugins | `~/.gemini/config/plugins/<name>/` |
| System directives | `~/.gemini/GEMINI.md` and `~/.gemini/config/superpowers/AGENTS.md` |
| MCP tool configs | `~/.gemini/antigravity/mcp_config.json` |

---

## Tests

Run the test suite with:

```bash
npm test
```

---

## License

Claugravity is free, open-source software released under the [MIT License](LICENSE).
