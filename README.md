# saimon - AI/ML Labs

A visually stunning, fully dark-mode website showcasing Simon Bermudez Enterprises Inc.'s AI/ML Labs subsidiary, featuring a NVIDIA Tesla  GPU cluster and open-source AI/ML stack.

## 🚀 Features

- **Pure HTML + Vanilla JS** - No frameworks, maximum portability
- **Three.js WebGL** - Stunning 3D graphics and animations
- **Tailwind CSS** - Dark mode enabled by default
- **Responsive Design** - Works on all devices
- **Accessibility First** - WCAG compliant with reduced motion support
- **Performance Optimized** - 60fps cap and efficient rendering

## 🛠 Tech Stack

- **Three.js r160+** - 3D graphics library
- **Tailwind CSS 3.x** - Utility-first CSS framework
- **Vite** - Build tool and dev server
- **Vanilla JavaScript** - ES modules and modern APIs
- **GSAP** - Animation library (optional animations)

## 🏗 Project Structure

```
saimon/
├── index.html              # Main HTML file
├── src/
│   └── main.js             # Main JavaScript application
├── styles/
│   └── main.css            # Tailwind CSS and custom styles
├── public/
│   ├── models/             # 3D models (GLB/GLTF)
│   └── logos/              # Tool logos and assets
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.cjs     # Tailwind CSS configuration
└── postcss.config.cjs      # PostCSS configuration
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern browser with WebGL support

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd saimon
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## 📱 Sections Overview

### 1. Hero Section
- Full-viewport 3D animated GPU card
- Particle system background
- Responsive typography with neon glow effects

### 2. About the Lab
- Mission statement and lab specifications
- Parallax particle field background
- Technical details about the Tesla  cluster

### 3. GPU Cluster Showcase
- Horizontally scrollable carousel
- Individual 3D GPU card representations
- Real-time specifications display

### 4. Open-Source Toolbox
- 10 carefully selected AI/ML tools
- Direct GitHub links and descriptions
- Hover effects and smooth transitions

### 5. Contact Section
- Client-side form validation
- Responsive design
- Accessibility compliant

## 🎨 Design System

### Colors
- **Background:** `#0d1117` (dark-bg)
- **Text:** `#e6edf3` (dark-text)  
- **Accent Cyan:** `#00ffd1` (neon-cyan)
- **Accent Pink:** `#ff4d97` (neon-pink)
- **Gray Variants:** `#21262d`, `#30363d`, `#484f58`

### Typography
- **Font:** JetBrains Mono (monospace)
- **Weights:** 400 (regular), 600 (medium), 700 (bold)

## ⚡ Performance Optimizations

- **WebGL Optimizations:**
  - 60fps frame rate cap
  - Efficient particle systems
  - LOD (Level of Detail) for 3D models
  - Power preference settings

- **Loading Optimizations:**
  - Lazy loading of 3D models
  - Progressive enhancement
  - Compressed textures and models

- **Accessibility:**
  - Respects `prefers-reduced-motion`
  - Keyboard navigation support
  - Screen reader compatible
  - High contrast mode support

## 🔧 Customization

### Adding New 3D Models
1. Place GLB/GLTF files in `public/models/`
2. Load using Three.js GLTFLoader in `src/main.js`
3. Optimize models for web (< 5MB recommended)

### Modifying Animations
- Animation logic is in the `animate()` method
- Use `this.isReducedMotion` to respect user preferences
- All animations are throttled and optimized

### Updating Content
- Tool information: Edit the tools section in `index.html`
- About section: Modify the about section content
- Styling: Update `tailwind.config.cjs` for theme changes

## 📊 GPU Cluster Specifications

Our Tesla  cluster features:
- **4x NVIDIA Tesla ** GPU cards
- **96GB total VRAM** (24GB per card)
- **15,360 CUDA cores** total
- **Pascal architecture** with high-precision computing
- **Self-hosted infrastructure** for complete data control

## 🛡 Browser Support

- **Modern browsers** with WebGL 2.0 support
- **Chrome 80+**, **Firefox 75+**, **Safari 14+**, **Edge 80+**
- **Mobile browsers** with WebGL support
- Graceful degradation for older browsers

## 🤝 Contributing

This is a showcase project for saimon. For suggestions or improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🏢 About

**saimon** is the AI/ML Labs subsidiary of **Simon Bermudez Enterprises Inc.**, dedicated to advancing artificial intelligence and machine learning through cutting-edge research and open-source technologies.

---

Built with ❤️ and powered by Tesla  GPUs
