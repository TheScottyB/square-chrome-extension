# Square Chrome Extension 🚀

AI-powered Chrome extension for Square Dashboard automation - solving the Spocket image sync problem and beyond.

## 🎯 The Problem We're Solving

When using Spocket (dropshipping supplier) with Square:
- Only ONE product image syncs automatically
- Merchants must manually download and upload every additional image
- This process is tedious for stores with hundreds of products
- No bulk operations available in Square's UI

After spending 4 hours with 5 AI agents trying to make Puppeteer work (Chrome v136 security issues), we pivoted to a Chrome extension that gives us direct DOM access while users are logged in.

## ✨ Features

### Current Implementation
- **🤖 AI-Powered Agents**: Specialized agents for different Square operations
- **🏭 Factory Pattern**: Smart agent instantiation based on page context
- **🔄 Message Passing**: Secure communication between content scripts and background workers
- **🧪 Mock Agents**: Fallback agents for testing and development
- **📊 Bulk Operations**: Batch processing with progress tracking
- **🧪 Integration Tests**: Comprehensive Playwright test suite

### Planned Features
- **🖼️ Spocket Image Sync**: One-click sync of all product images
- **🔍 SEO Optimization**: Bulk update titles, descriptions, and meta tags
- **📦 Catalog Management**: Batch inventory updates and pricing
- **🧭 Smart Navigation**: Advanced search and automation workflows

## 🏗️ Architecture

```
┌─────────────────────┐
│   Chrome Extension  │
├─────────────────────┤
│   Popup UI         │ ← User Interface
├─────────────────────┤
│ Background Worker  │ ← Coordination & Chrome APIs
├─────────────────────┤
│  Content Scripts   │ ← DOM Access & Automation
├─────────────────────┤
│ Enhanced Agents    │
│ ├─ SEO Agent      │ ← SEO Optimization
│ ├─ Navigation     │ ← Page Navigation
│ ├─ Catalog Agent  │ ← Product Management
│ └─ Image Agent*   │ ← Spocket Sync (Planned)
└─────────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20.11.0+ (managed by Volta)
- PNPM 8.15.1+ (managed by Volta)
- Chrome browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/TheScottyB/square-chrome-extension.git
cd square-chrome-extension
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the extension:
```bash
pnpm run build
```

4. Load in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development

```bash
# Run in development mode with hot reload
pnpm run dev

# Run tests
pnpm test

# Run integration tests
pnpm test:integration

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## 🛠️ Tech Stack

- **TypeScript**: Type-safe development
- **Chrome Extension Manifest V3**: Modern extension architecture
- **Vite**: Fast build tooling
- **Playwright**: Integration testing
- **Zod**: Runtime type validation
- **AI Agents**: OpenAI SDK integration (optional)

## 📋 Current Status

### ✅ Completed
- [x] Project infrastructure setup
- [x] Agent architecture with factory pattern
- [x] Enhanced agents for SEO, Navigation, and Catalog
- [x] TypeScript configuration
- [x] Chrome extension manifest
- [x] Integration test framework
- [x] Git repository

### 🚧 In Progress
- [ ] Install dependencies and configure build
- [ ] Implement content script
- [ ] Create popup UI functionality
- [ ] Add Spocket image sync agent

### 📅 Roadmap
See our [ROADMAP.md](ROADMAP.md) for detailed plans and [open issues](https://github.com/TheScottyB/square-chrome-extension/issues) for current tasks.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built after extensive attempts with Puppeteer revealed Chrome v136 security limitations
- Inspired by the real pain of manual image management in Square
- Thanks to all the AI agents who helped debug the Puppeteer approach 😄

## 📞 Contact

- GitHub: [@TheScottyB](https://github.com/TheScottyB)
- Project Link: [https://github.com/TheScottyB/square-chrome-extension](https://github.com/TheScottyB/square-chrome-extension)

---

**Note**: This extension is not affiliated with Square, Inc. or Spocket. It's an independent tool to help merchants automate their workflows.
