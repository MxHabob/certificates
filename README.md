# Certificate Generator - مولد الشهادات

A production-ready, high-performance web application for generating certificates from Excel data with customizable templates. Built with React, TypeScript, and PDF-lib.

## Features

- 📊 **Excel/CSV Import**: Parse student data from Excel or CSV files
- 🎨 **Template Customization**: Upload PNG templates and position fields dynamically
- 🎯 **Drag & Drop Fields**: Intuitive interface for positioning text fields on certificates
- 🌍 **Arabic Support**: Full RTL support with Arabic text reshaping
- 📄 **Batch PDF Generation**: Generate individual PDFs or a single combined PDF
- ⚡ **Performance Optimized**: Web Worker-based PDF generation with caching
- 🎛️ **Field Controls**: Adjust font size, color, alignment, and position
- 👀 **Live Preview**: Preview certificates before generation
- 💾 **Auto-save**: Persistent state with undo/redo functionality
- 🌙 **Dark Mode**: Beautiful dark/light theme support

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI components
- **State Management**: Zustand with persistence
- **PDF Generation**: PDF-lib with Web Workers
- **Arabic Text**: Arabic-reshaper
- **Build**: Vite with optimized production builds

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t certificate-generator .
```

### Run Container

```bash
docker run -d -p 80:80 certificate-generator
```

The application will be available at `http://localhost`

## Production Features

### Performance Optimizations

- ✅ Font and template caching
- ✅ Web Worker-based PDF generation
- ✅ Code splitting and chunk optimization
- ✅ Asset optimization and compression
- ✅ Production-ready nginx configuration

### Fixed Issues

- ✅ **Field Positioning**: Fixed zoom-aware drag calculations
- ✅ **Template Scaling**: Correct template-to-PDF dimension mapping
- ✅ **Error Handling**: Comprehensive error messages and validation
- ✅ **Type Safety**: Full TypeScript coverage with proper types
- ✅ **Resource Caching**: Font and template caching for faster generation

## Usage

1. **Upload Data**: Select an Excel (.xlsx, .xls) or CSV file with student data
2. **Upload Template**: Upload a PNG template image
3. **Add Fields**: 
   - Add static text fields
   - Add dynamic fields from Excel columns
4. **Position Fields**: Drag fields to desired positions on the template
5. **Customize**: Adjust font size, color, and alignment
6. **Preview**: Use the preview dialog to check certificates
7. **Generate**: Choose between individual PDFs (ZIP) or a single combined PDF

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── providers/       # Context providers
├── hooks/               # Custom React hooks
│   └── use-certificate-store.ts  # Zustand store
├── lib/                 # Utilities and services
│   ├── constants.ts     # Application constants
│   ├── excel-parser.ts  # Excel/CSV parsing
│   ├── pdf/             # PDF generation
│   └── utils.ts         # Helper functions
└── types/               # TypeScript type definitions
```

## Constants & Configuration

All application constants are centralized in `src/lib/constants.ts`:
- Conversion factors (mm to px/pt)
- Default values
- Performance settings
- Error messages
- File validation rules

## Build Optimizations

The build process includes:
- Tree shaking for unused code
- Code splitting by vendor, PDF libraries, and UI components
- Minification with Terser
- Console removal in production
- Optimized asset organization

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
- TypeScript types are properly defined
- Error handling is comprehensive
- Code follows the existing patterns
- Performance optimizations are considered
