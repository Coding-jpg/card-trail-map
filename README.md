# Card Trail Mapping System

A production-ready static website for GitHub Pages that visualizes content as interconnected Cards and Lines. Built with React, TypeScript, and Tailwind CSS.

## 🎯 Features

- **Card-Line Architecture**: Everything is modeled as Cards (nodes) and Lines (relations)
- **Markdown Authoring**: Write content in `_cards/**.md` and `_trails/*.md`
- **Scrollytelling**: Step-by-step focusing on nodes with preset actions
- **Interactive Board**: Pan, zoom, filter, and explore relationships
- **Build Pipeline**: Automated compilation of Markdown to JSON
- **GitHub Pages Ready**: Complete CI/CD workflow included

## 🚀 Quick Start

1. **Clone and install**:
   ```bash
   git clone <your-repo-url>
   cd card-trail-map
   npm install
   ```

2. **Generate data and start development**:
   ```bash
   npm run gen
   npm run dev
   ```

3. **Visit the application**:
   - Board view: `http://localhost:5173/board`
   - Story mode: `http://localhost:5173/board/story`

## 📁 Project Structure

```
├── _cards/           # Markdown content for cards
│   ├── profile/      # Profile cards
│   ├── goals/        # Goal cards  
│   ├── hobbies/      # Hobby cards
│   ├── skills/       # Skill cards
│   └── projects/     # Project cards
├── _trails/          # Markdown for scrollytelling trails
├── scripts/          # Build scripts for JSON generation
├── public/           # Generated JSON files and static assets
├── src/              # React application source
└── .github/workflows/ # GitHub Actions for deployment
```

## ✍️ Content Authoring

### Cards (`_cards/**.md`)

Every card is a Markdown file with YAML frontmatter:

```yaml
---
id: my-card
kind: project  # profile | goal | hobby | skill | project
title: "My Awesome Project"
subtitle: "Full-stack web application"
badges: ["NEW", "UPDATED"]
tags: ["react", "typescript"]
pos: { x: 100, y: 200 }  # Optional positioning

# Relations (auto-generate Lines)
uses: ["skill-react", "skill-typescript"]
inspired_by: ["hobby-music"]
supports: ["goal-q1-2025"]
relates: ["other-card-id"]

# Kind-specific metadata
year: 2024
stack: ["React", "Node.js", "PostgreSQL"]
metrics:
  - label: "Users"
    value: "1.2K+"
---

# Card Content

Write your detailed content here in Markdown.
Wiki-links like [[other-card]] create automatic relations.
```

### Trails (`_trails/*.md`)

Define scrollytelling sequences:

```yaml
---
id: intro
title: "Introduction Journey"
steps:
  - id: overview
    actions:
      - type: overview
        zoom: 0.5
  - id: focus-profile  
    actions:
      - type: focus
        card: profile
        zoom: 1.0
      - type: pin
        card: important-goal
---
```

## 🎮 Controls & Navigation

### Board Mode (`/board`)
- **Mouse**: Pan (drag) and zoom (wheel)
- **Keyboard**: 
  - `0` - Overview
  - `F` - Toggle filters
  - `M` - Toggle minimap
  - `ESC` - Clear selection

### Story Mode (`/board/story`)
- **Scroll**: Navigate between steps
- **Keyboard**: 
  - `↑/↓` - Previous/next step
  - `Home/End` - First/last step

## 🔧 Build Commands

```bash
# Generate JSON from Markdown
npm run gen:cards    # Build cards.json and lines.json
npm run gen:trails   # Build trails.json
npm run gen          # Build all

# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
```

## 🎨 Customization

### Theme & Colors

Edit `src/index.css` for design system tokens:

```css
:root {
  /* Card type colors */
  --card-profile: 107 114 128;    /* gray-500 */
  --card-goal: 14 165 233;        /* sky-500 */
  --card-hobby: 245 158 11;       /* amber-500 */
  --card-skill: 34 197 94;        /* emerald-500 */
  --card-project: 167 139 250;    /* violet-400 */
}
```

### Add New Card Types

1. Update `CardKind` type in `src/types/index.ts`
2. Add colors to design system in `src/index.css`
3. Update Card component rendering logic
4. Add to build scripts validation

## 📦 Deployment

### GitHub Pages (Recommended)

1. **Enable GitHub Pages** in repository settings
2. **Push to main branch** - GitHub Actions will automatically:
   - Generate JSON from Markdown
   - Build the React application  
   - Deploy to GitHub Pages

### Manual Deployment

```bash
npm run gen
npm run build
# Deploy ./dist folder to your hosting provider
```

## 🧩 Architecture

### Data Flow
```
Markdown Files → Build Scripts → JSON Files → React App → Interactive Visualization
```

### Key Components
- **Board**: Main visualization container with pan/zoom
- **Card**: Individual content nodes with type-specific rendering
- **Line**: Connections between cards with different visual styles
- **FilterDock**: Advanced filtering and search capabilities
- **MiniMap**: Overview navigation aid
- **BoardController**: Centralized state management for animations

### Performance Features
- Frustum culling (only render visible cards)
- Lazy loading for images and heavy content
- Optimized re-renders with memoization
- SVG-based rendering with HTML overlay for best performance

## 🔍 Troubleshooting

### Build Issues
- Ensure all referenced card IDs exist
- Check YAML frontmatter syntax
- Verify required fields for each card kind

### Development Issues
- Clear browser cache if cards don't appear
- Check browser console for JSON loading errors
- Ensure `public/` directory contains generated JSON files

## 📝 License

MIT License - feel free to use this system for your own projects!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the build process
5. Submit a pull request

---

Built with ❤️ using React, TypeScript, and Tailwind CSS