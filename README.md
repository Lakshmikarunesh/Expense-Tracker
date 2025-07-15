# BudgetSync - Progressive Web App

A comprehensive personal budget and expense tracker that works offline and automatically syncs when the internet is available.

# Live : 
https://expense-tracker-two-gamma-36.vercel.app/

## Features

### 🚀 Core Features
- **Expense Management**: Add, edit, and delete expenses with categories, dates, and notes
- **Budget Goals**: Set monthly budget limits per category with real-time tracking
- **Offline Support**: Full functionality without internet connection using IndexedDB
- **Background Sync**: Automatic data synchronization when connection is restored
- **Interactive Charts**: Canvas-based pie charts, bar graphs, and progress rings
- **PWA Support**: Install as a native app on mobile and desktop

### 📊 Data & Analytics
- Category-wise spending analysis
- Weekly spending trends
- Budget consumption tracking
- Real-time budget alerts and notifications
- Export data to CSV or JSON formats

### 🎨 User Experience
- Clean, modern interface with dark mode support
- Fully responsive design (mobile-first)
- Smooth animations and micro-interactions
- Network status indicators
- Background notifications for budget alerts

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Storage**: IndexedDB for offline data persistence
- **Charts**: Custom Canvas API implementations
- **PWA**: Service Worker with background sync
- **Icons**: Lucide React
- **Build Tool**: Vite

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

4. **Preview Production Build**:
   ```bash
   npm run preview
   ```

## Project Structure

```
src/
├── components/
│   ├── Charts/           # Canvas-based chart components
│   ├── Layout/          # Navigation and layout components
│   ├── UI/              # Reusable UI components
│   ├── Dashboard.tsx    # Main dashboard view
│   ├── ExpenseForm.tsx  # Add/edit expense form
│   ├── ExpenseHistory.tsx # Expense list with filtering
│   └── BudgetSettings.tsx # Budget management
├── services/
│   ├── indexedDB.ts     # IndexedDB operations
│   ├── syncService.ts   # Background sync logic
│   └── exportService.ts # Data export functionality
├── utils/
│   ├── networkDetection.ts # Network status monitoring
│   └── backgroundSync.ts    # Background task management
├── types/
│   └── index.ts         # TypeScript type definitions
└── App.tsx              # Main application component
```

## Key Features Explained


## 🌐 API Usage Summary:

Network Information API	: Detect network status to trigger sync or defer it
Canvas API	: Render budget and spending visuals
Background Tasks API	: Auto-sync data and send alerts in background

### Offline-First Architecture
- All data stored locally in IndexedDB
- Network Information API for connection detection
- Automatic sync queue for offline operations
- Service Worker for background sync

### Budget Management
- Monthly budget limits per category
- Real-time spending tracking
- Visual progress indicators
- Automatic alerts at 80% and 100% usage

### Data Visualization
- Custom Canvas-based charts for better performance
- Pie charts for category distribution
- Bar charts for weekly spending trends
- Progress rings for budget consumption

### Progressive Web App
- Installable on mobile and desktop
- Offline functionality
- Push notifications for budget alerts
- App-like experience

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile browsers with PWA support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
