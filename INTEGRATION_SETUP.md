# Square Chrome Extension Integration Setup

This Chrome extension is designed to work with the Square Inventory Management System. After separating from the main project, you'll need to configure the connection.

## Prerequisites

1. **Square Inventory Management Server**: You need the main Square inventory project running with an API server
2. **Chrome Browser**: For loading and testing the extension
3. **API Endpoints**: Configure the endpoints in `data-connector.js`

## Setup Instructions

### 1. Configure API Endpoints

Edit `data-connector.js` and update the endpoints to match your Square inventory server:

```javascript
const endpoints = [
  'http://localhost:3000/api/catalog', // Your main server port
  'http://localhost:8080/api/catalog', // Alternative port
  'http://localhost:4000/api/catalog', // Another alternative
];
```

### 2. Set Up API Server (in main Square project)

In your main Square inventory project, you'll need to create an API endpoint that serves catalog data:

```javascript
// Example Express.js endpoint
app.get('/api/catalog', (req, res) => {
  const catalogData = {
    items: [], // Your Square catalog items
    categories: [], // Your categories
    lastUpdate: Date.now()
  };
  res.json(catalogData);
});
```

### 3. CORS Configuration

Make sure your API server allows requests from the Chrome extension:

```javascript
app.use(cors({
  origin: 'chrome-extension://*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 4. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select this extension directory
4. The extension should now appear in your extensions list

### 5. Test Integration

1. Start your Square inventory management server
2. Open Square Dashboard in Chrome
3. Click the extension icon to open the popup
4. Check the console for connection status

## Data Structure

The extension expects the following data structure from your API:

```javascript
{
  items: [
    {
      id: "ITEM_ID",
      name: "Item Name",
      category_data: { name: "category-name" },
      item_data: {
        name: "Item Name",
        description: "Item description"
      },
      seo: {
        title: "SEO Title",
        description: "SEO Description"
      },
      images: []
    }
  ],
  categories: [
    {
      id: "CAT_ID",
      name: "category-name"
    }
  ],
  lastUpdate: 1625097600000
}
```

## Development Workflow

1. **Standalone Development**: The extension can now be developed independently
2. **API Integration**: Connect to your Square inventory server via HTTP API
3. **Testing**: Load in Chrome and test with real Square Dashboard pages
4. **Distribution**: Use the build scripts to package for distribution

## Troubleshooting

### Extension Not Connecting to API

1. Check that your server is running on the configured port
2. Verify CORS headers are properly set
3. Check browser console for fetch errors
4. Ensure the API endpoint returns the expected data structure

### Data Not Loading

1. Open extension popup and check connection status
2. View background script logs: Chrome Extensions → Inspect views: background page
3. Check if data is being stored: `chrome.storage.local.get(console.log)`

## Project Structure

```
square-chrome-extension/
├── manifest.json           # Extension configuration
├── background.js           # Service worker
├── content.js             # Content script for Square pages
├── popup.html/js          # Extension popup UI
├── data-connector.js      # API integration layer
├── spocket-content.js     # Spocket integration
└── src/                   # TypeScript source files
    ├── agents/            # Agent-based automation
    └── utils/             # Utility functions
```

This separation allows the Chrome extension to be:
- Developed independently
- Distributed separately
- Connected to any Square inventory management system via API
- Maintained with its own versioning and release cycle