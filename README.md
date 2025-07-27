<p align="center">
  <a href="https://www.instagram.com/__ziyxn_/"> <img src="https://github.com/c-o-d-e-xx/c-o-d-e-xx/blob/main/img/bixby1.jpeg" width="500" alt="Profile"/> </a>
</p>

<p align="center">
<strong>🌟 A S T R A W A 🌟</strong>
</p>
<p align="center">
<a href="https://github.com/c-o-d-e-xx/AstraWa/stargazers"><img src="https://img.shields.io/github/stars/c-o-d-e-xx/AstraWa?color=black&logo=github&logoColor=black&style=for-the-badge" alt="Stars" /></a>
<a href="https://github.com/c-o-d-e-xx/AstraWa/network/members"> <img src="https://img.shields.io/github/forks/c-o-d-e-xx/AstraWa?color=black&logo=github&logoColor=black&style=for-the-badge" /></a>
<a href="https://github.com/c-o-d-e-xx/AstraWa/blob/master/LICENSE"> <img src="https://img.shields.io/badge/License- MIT license -blueviolet?style=for-the-badge" alt="License" /> </a>
<a href="https://www.javascript.com"> <img src="https://img.shields.io/badge/Written%20in-Javascript-skyblue?style=for-the-badge&logo=javascript" alt="javascript" /> </a>
<a href="https://nodejs.org/en"> <img src="https://img.shields.io/badge/FRAMEWORK-nodejs-green?style=for-the-badge&logo=nodejs" alt="nodejs" /> </a>
<a href="https://www.npmjs.com/package/@whiskeysockets/baileys/v/6.6.0"> <img src="https://img.shields.io/npm/v/@whiskeysockets/baileys?color=white&label=baileys&logo=javascript&logoColor=blue&style=for-the-badge" /></a>
<a href="https://github.com/c-o-d-e-xx/AstraWa"> <img src="https://img.shields.io/github/repo-size/c-o-d-e-xx/AstraWa?color=skyblue&logo=github&logoColor=blue&style=for-the-badge" /></a>
<a href="https://github.com/c-o-d-e-xx/AstraWa/commits/master"> <img src="https://img.shields.io/github/last-commit/c-o-d-e-xx/AstraWa?color=black&logo=github&logoColor=black&style=for-the-badge&branch=master" /></a>
</p>
<br><br><br>

## 🌟 What is AstraWa?

AstraWa is an advanced WhatsApp bot built with a dynamic modular architecture. It features a sophisticated module management system that allows for easy extension and customization while maintaining excellent performance and reliability.

### ✨ Key Features

- 🔧 **Dynamic Module System** - Load, unload, and reload modules without restarting
- 📦 **Modular Architecture** - Clean separation of concerns with organized code structure
- 🎯 **Auto-Generated Menus** - Menus are automatically generated from loaded modules
- 🚀 **High Performance** - Optimized for speed and reliability
- 🛡️ **Advanced Security** - Built-in permission system and security features
- 🌐 **Web Interface** - Monitor and manage your bot through a web dashboard
- 📱 **Multi-Platform** - Works on various hosting platforms

### 🏗️ Architecture

```
AstraWa/
├── core/                    # Core system files
│   ├── AstraWa.js          # Main bot class
│   ├── ModuleManager.js    # Dynamic module management
│   ├── handlers/           # Event and message handlers
│   ├── database/           # Database utilities
│   └── message/            # Message serialization
├── utils/                  # Utility functions
│   ├── helpers/            # Helper functions
│   ├── media/              # Media processing
│   └── validation/         # Input validation
├── modules/                # Bot modules
│   ├── core.js            # Core commands
│   ├── media.js           # Media commands
│   ├── downloader.js      # Download commands
│   ├── group.js           # Group management
│   ├── utility.js         # Utility commands
│   └── admin.js           # Admin commands
├── config.js              # Configuration
└── index.js               # Entry point
```

### 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/c-o-d-e-xx/AstraWa.git
   cd AstraWa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp config.env.example config.env
   # Edit config.env with your settings
   ```

4. **Start the bot**
   ```bash
   npm start
   ```

### 📦 Module Development

Creating a new module is simple:

```javascript
module.exports = {
    info: {
        name: "My Module",
        description: "Description of my module",
        version: "1.0.0",
        category: "custom"
    },

    commands: [
        {
            pattern: "mycommand",
            desc: "My custom command",
            usage: "mycommand <args>",
            fromMe: false,
            function: async (message, match) => {
                await message.send("Hello from my module!");
            }
        }
    ],

    events: [
        {
            type: "all",
            function: async (message) => {
                // Handle all messages
            }
        }
    ]
};
```

### 🔧 Configuration

Key configuration options:

- `SESSION_ID` - Your WhatsApp session ID
- `BOT_INFO` - Bot information (name, owner, image)
- `WORKTYPE` - Bot work mode (public/private)
- `PREFIX` - Command prefix
- `API_KEY` - API key for external services

### 📊 Web Dashboard

Access the web dashboard at `http://localhost:8080` to:
- Monitor bot status
- View module statistics
- Reload modules
- Check system health

### 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 🙏 Acknowledgments

- Built with [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)
- Inspired by the WhatsApp bot community
- Special thanks to all contributors

### 📞 Support

- 🐛 [Report Issues](https://github.com/c-o-d-e-xx/AstraWa/issues)
- 💬 [Discussions](https://github.com/c-o-d-e-xx/AstraWa/discussions)
- 📧 Contact: [Your Email]

---

<p align="center">
Made with ❤️ by <a href="https://github.com/c-o-d-e-xx">Codex</a>
</p>