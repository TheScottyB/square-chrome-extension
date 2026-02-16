# Chrome Extension Architecture - Current State

## 🏗️ System Overview

This Chrome extension implements a multi-agent automation system for Square e-commerce platform tasks, coordinated through a central AgentCoordinator with robust error handling and progress reporting.

## 📁 Project Structure

```
src/
├── agents/                    # Agent system core
│   ├── base/
│   │   └── DOMAgent.ts       # Abstract base class for all agents
│   ├── bulk/
│   │   └── BulkOperationManager.ts  # Handles bulk operations
│   ├── mock/
│   │   └── MockAgents.ts     # Mock implementations for testing
│   ├── square/
│   │   ├── SquareSEOAgent.ts      # SEO optimization agent
│   │   ├── SquareNavigationAgent.ts # Navigation agent
│   │   └── SquareCatalogAgent.ts   # Catalog management agent
│   ├── AgentCoordinator.ts   # Central coordination hub
│   ├── AgentManager.ts       # Legacy agent manager
│   └── types.ts             # Type definitions
├── utils/
│   ├── pageDetectionService.ts # Page context detection
│   └── apiKeyManager.ts      # OpenAI API key management
├── popup.ts                  # Popup interface logic
├── content.ts               # Content script injection
├── background.ts            # Service worker / background script
└── injected.ts             # Page-injected script
```

## 🧩 Core Components

### **AgentCoordinator** - Central Command
- **Purpose**: Orchestrates all agent operations and task routing
- **Key Features**:
  - Automatic agent initialization based on page context
  - Intelligent task routing to appropriate specialized agents
  - Robust fallback to mock agents in popup/testing contexts
  - Inter-agent communication and workflow management
  - Page change monitoring and agent reinitialization

- **Error Handling**: Graceful degradation with mock agents when OpenAI agents fail

### **DOMAgent** - Agent Base Class
- **Abstract Methods**:
  - `buildTools()`: Define agent-specific capabilities
  - `executeTaskInternal()`: Core task execution logic
- **Built-in Features**:
  - Task queuing and retry logic
  - Error handling and reporting
  - Context management
  - Cleanup and lifecycle management

### **Specialized Agents**

#### **SquareSEOAgent**
- **Scope**: Product SEO optimization
- **Capabilities**: Form filling, content generation, meta optimization
- **Current State**: Mock implementation with simulated task execution

#### **SquareNavigationAgent** 
- **Scope**: Square dashboard navigation
- **Capabilities**: Page routing, search, filtering, product selection
- **Current State**: Mock implementation with simulated navigation

#### **SquareCatalogAgent**
- **Scope**: Inventory and catalog management
- **Capabilities**: Product sync, pricing updates, category management
- **Current State**: Mock implementation with simulated catalog operations

### **BulkOperationManager**
- **Purpose**: Handle large-scale automation tasks
- **Features**:
  - Progress tracking with real-time updates
  - Configurable batch sizes and retry logic
  - Operation type routing (`catalog-sync`, `validation`, `image-search`, `inventory-update`)
  - Failure rate simulation and error handling
  - Cleanup of old/stale operations

## 🔄 Communication Flow

### **Popup ↔ Background Script**
```typescript
// Popup sends messages for automation control
chrome.runtime.sendMessage({ action: 'startAutomation', config: {...} })

// Background script handles agent coordination messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'agentCoordinatorReady': // Agent initialization complete
    case 'getApiKey': // API key retrieval
  }
})
```

### **Content Script ↔ AgentCoordinator**
```typescript
// AgentCoordinator notifies background of readiness
chrome.runtime.sendMessage({
  action: 'agentCoordinatorReady',
  agentCount: this.agents.size,
  pageContext: this.context.page
})

// Handles external messages for task execution
handleExternalMessage(message, sender, sendResponse) {
  // Routes: executeTask, executeWorkflow, getStatus, updateSEO, navigateToItem
}
```

### **Agent Task Flow**
1. **Task Creation**: BulkOperationManager creates tasks
2. **Task Routing**: AgentCoordinator routes to appropriate agent
3. **Task Execution**: Specialized agent executes with DOM manipulation
4. **Progress Reporting**: Results flow back through coordinator to UI
5. **Error Handling**: Failures trigger retry logic or fallback strategies

## 🎯 Page Context Detection

### **PageContext Type System**
```typescript
type PageType = 'item-detail' | 'items-library' | 'inventory' | 'dashboard' | 'unknown'

interface PageContext {
  url: string
  pageType: PageType
  itemId?: string
  hasEditAccess: boolean
}
```

### **Agent Initialization Logic**
- **Square pages**: Initialize navigation agent
- **Item pages**: Initialize SEO agent
- **Catalog pages**: Initialize catalog agent  
- **All contexts**: Initialize mock agents for testing

## 🛡️ Error Handling Strategy

### **Layered Error Handling**
1. **Agent Level**: Individual task failures with retry logic
2. **Coordinator Level**: Agent routing failures with fallbacks
3. **Communication Level**: Message passing failures with graceful degradation
4. **UI Level**: User-facing error messages with actionable guidance

### **Mock Agent Fallbacks**
- **Trigger**: When OpenAI Agent constructor fails (popup context, API issues)
- **Behavior**: Simulate task execution with realistic delays and failure rates
- **Benefit**: Extension remains functional for testing and development

### **Connection Error Handling**
- **Chrome Runtime Messages**: Wrapped in try-catch blocks
- **Background Script Availability**: Graceful handling when service worker is unavailable
- **API Failures**: Fallback to cached data or degraded functionality

## 📊 Current Capabilities

### **✅ Working Features**
- Extension loads without errors in popup and content script contexts
- AgentCoordinator initializes successfully with appropriate agents
- Bulk operations execute with progress reporting UI
- Mock agents simulate realistic task execution with delays/failures
- Message passing between all extension components works reliably
- TypeScript compilation is clean with proper type definitions
- Build system produces working Chrome extension package

### **🔄 Mock Implementations**
- All agents currently use mock implementations with simulated results
- BulkOperationManager simulates realistic bulk operation scenarios
- Progress reporting works with mock data and timing
- Error scenarios are simulated for testing error handling paths

## 🚀 Next Phase Requirements

### **Priority Implementation Targets**
1. **Real DOM Manipulation**: Replace mock agents with actual Square page interaction
2. **OpenAI Integration**: Implement content generation for SEO tasks
3. **Spocket API Integration**: Add external data source for catalog sync
4. **Enhanced Error Recovery**: Handle real-world failure scenarios
5. **Performance Optimization**: Handle large-scale bulk operations efficiently

### **Architecture Readiness**
- ✅ **Foundation**: Solid base with proper separation of concerns
- ✅ **Error Handling**: Comprehensive error handling at all levels
- ✅ **Extensibility**: Easy to add new agent types and capabilities
- ✅ **Testing**: Mock system enables comprehensive testing
- ✅ **Communication**: Reliable message passing between all components
- ✅ **UI Integration**: Working progress reporting and user interface

---

**Architecture Status**: ✅ **Solid Foundation Ready for Phase 2**  
**Code Quality**: ✅ **Production-ready error handling and structure**  
**Next Step**: 🚀 **Begin real agent implementation on live Square pages**
