# Desktop App Calculator

A comprehensive Electron desktop application for project management, resource allocation, and productivity tracking with local CSV data storage.

## Features

### 🏗️ Core Modules
1. **Projects Management** - Create, edit, and manage projects
2. **Resources Management** - Assign resources to projects with multi-project support
3. **Productivity Mapping** - Define productivity levels and rates per project
4. **Master Database** - Aggregated view of all data with advanced filtering
5. **Calculator** - Calculate costs and maintain calculation history

### 🔧 Key Capabilities
- **Local CSV Storage** - All data stored locally in `/data` folder
- **Bulk Import/Export** - Support for CSV and Excel file operations
- **State Persistence** - Remembers window size and last active tab
- **Real-time Sync** - Data automatically synced between modules
- **Validation & Backup** - Robust data validation with automatic backups

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Clone or extract the application
cd desktop-app-calculator

# Install dependencies
npm install
# or
yarn install

# Build CSS
npm run build:css

# Start the application
npm start
```

### Development Mode
```bash
# Run with CSS hot reload
npm run dev
```

## File Structure

```
/app/
├── data/                    # CSV data storage
│   ├── projects.csv         # Projects data
│   ├── resources.csv        # Resources data
│   ├── productivity.csv     # Productivity mappings
│   ├── master.csv          # Master database
│   ├── calculator_history.csv # Calculation history
│   └── backup/             # Automatic backups
├── src/
│   ├── main.js             # Electron main process
│   ├── preload.js          # Secure IPC bridge
│   ├── index.html          # Main application UI
│   ├── js/
│   │   ├── app.js          # Application entry point
│   │   ├── csvManager.js   # CSV operations
│   │   ├── stateManager.js # State management
│   │   └── uiManager.js    # UI interactions
│   └── styles/
│       ├── input.css       # Tailwind input
│       └── output.css      # Compiled CSS
└── package.json
```

## Usage Guide

### 1. Projects Module
- **Add Project**: Click "Add New Project" to create projects
- **Bulk Upload**: Import multiple projects from CSV/Excel files
- **Inline Editing**: Edit project details directly in the table
- **Delete**: Remove projects (also removes from resources and productivity)

### 2. Resources Module
- **Multi-Project Assignment**: Assign resources to multiple projects
- **Filter by Project**: View resources filtered by specific projects
- **Bulk Operations**: Import resource data with project assignments

### 3. Productivity Mapping
- **Project-Specific Rates**: Define productivity levels and rates per project
- **Dynamic Pricing**: Each project can have different rate structures
- **Validation**: Prevents duplicate productivity levels per project

### 4. Master Database
- **Aggregated View**: See all data combined in one view
- **Advanced Filtering**: Filter by project, resource, rate range
- **Export Options**: Export filtered views to CSV/Excel
- **Read-Only**: Edit source data in respective modules

### 5. Calculator
- **Cost Calculation**: Select project, resource, productivity level
- **Real-Time Updates**: Rates auto-populate based on selections
- **History Tracking**: All calculations saved with timestamps
- **Export History**: Download calculation history as CSV

## Data Management

### CSV File Structure

**projects.csv**
```csv
Project Name,Description
Project A,Description for Project A
```

**resources.csv**
```csv
Resource Name,Assigned Projects,Description
John Doe,"Project A, Project B",Senior Developer
```

**productivity.csv**
```csv
Project Name,Productivity Value,Rate
Project A,10,50.00
Project A,20,75.00
```

**calculator_history.csv**
```csv
Timestamp,Project,Resource,Productivity,Transactions,Rate,Total
2024-10-05T18:30:00.000Z,Project A,John Doe,10,5,50.00,250.00
```

### Import/Export Features
- **Supported Formats**: CSV, Excel (.xlsx, .xls)
- **Bulk Upload**: Preview data before import with validation
- **Duplicate Prevention**: Automatic duplicate detection and filtering
- **Export All**: Combine all data into Excel workbook or ZIP file
- **Backup System**: Automatic backups before any save operation

## Keyboard Shortcuts
- **Ctrl/Cmd + S**: Save current tab data
- **Ctrl/Cmd + 1-5**: Switch between tabs (1=Projects, 2=Resources, etc.)

## Technical Details

### Architecture
- **Main Process**: Electron main process handles file operations and window management
- **Renderer Process**: Single-page application with tab-based navigation
- **IPC Communication**: Secure preload scripts for main-renderer communication
- **State Management**: Centralized state with real-time synchronization

### Libraries Used
- **Electron**: Desktop application framework
- **Tailwind CSS**: Utility-first CSS framework
- **PapaParse**: CSV parsing and generation
- **SheetJS**: Excel file operations
- **Electron Store**: Persistent application state
- **Font Awesome**: Icons

### Security Features
- **Context Isolation**: Enabled for security
- **Node Integration**: Disabled in renderer
- **Preload Scripts**: Secure IPC communication
- **Input Validation**: Comprehensive data validation
- **Backup System**: Automatic backups before changes

## Troubleshooting

### Common Issues

1. **Application won't start**
   - Ensure Node.js is installed
   - Run `npm install` to install dependencies
   - Check console for error messages

2. **CSV files not loading**
   - Check `/data` directory exists
   - Verify CSV file format matches expected structure
   - Check file permissions

3. **Import/Export not working**
   - Verify file format is supported (CSV, Excel)
   - Check file headers match expected structure
   - Ensure sufficient disk space

### Development

```bash
# Run linting
npm run lint

# Build for distribution
npm run build

# Clean build
npm run clean
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper testing
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using Electron, Tailwind CSS, and modern web technologies**
