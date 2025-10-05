// Main application entry point
class DesktopCalculatorApp {
  constructor() {
    this.initialize();
  }

  async initialize() {
    try {
      console.log('Initializing Desktop Calculator App...');
      
      // Wait for all managers to be ready
      await this.waitForManagers();
      
      // Set up initial UI state
      this.setupInitialState();
      
      console.log('Desktop Calculator App initialized successfully!');
    } catch (error) {
      console.error('Error initializing app:', error);
      this.showErrorMessage('Failed to initialize application. Please refresh the page.');
    }
  }

  async waitForManagers() {
    // Wait for managers to be available
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      if (window.csvManager && window.stateManager && window.uiManager) {
        // Wait a bit more for state manager to finish initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Managers failed to initialize within timeout');
    }
  }

  setupInitialState() {
    // Get the current tab from state manager
    const currentTab = window.stateManager.state.currentTab;
    
    // Switch to the saved tab (this will also refresh data)
    window.uiManager.switchTab(currentTab);
    
    // Set up window beforeunload handler for unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (window.stateManager.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to close?';
        return e.returnValue;
      }
    });
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S to save current tab
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveCurrentTab();
      }
      
      // Ctrl/Cmd + 1-5 to switch tabs
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const tabs = ['projects', 'resources', 'productivity', 'master', 'calculator'];
        const tabIndex = parseInt(e.key) - 1;
        if (tabs[tabIndex]) {
          window.uiManager.switchTab(tabs[tabIndex]);
        }
      }
    });
  }

  async saveCurrentTab() {
    const currentTab = window.stateManager.state.currentTab;
    let success = false;
    
    try {
      switch (currentTab) {
        case 'projects':
          success = await window.stateManager.saveProjects();
          break;
        case 'resources':
          success = await window.stateManager.saveResources();
          break;
        case 'productivity':
          success = await window.stateManager.saveProductivity();
          break;
        default:
          window.uiManager.showToast('Nothing to save in this tab', 'warning');
          return;
      }
      
      if (success) {
        window.uiManager.showToast(`${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} saved successfully`, 'success');
      } else {
        window.uiManager.showToast('Error saving data', 'error');
      }
    } catch (error) {
      console.error('Error saving current tab:', error);
      window.uiManager.showToast('Error saving data', 'error');
    }
  }

  showErrorMessage(message) {
    // Create error overlay
    const errorOverlay = document.createElement('div');
    errorOverlay.className = 'fixed inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center z-50';
    errorOverlay.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4 text-center">
        <div class="text-red-500 text-6xl mb-4">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Application Error</h2>
        <p class="text-gray-600 mb-6">${message}</p>
        <button onclick="location.reload()" class="btn-primary">
          <i class="fas fa-refresh"></i>
          Refresh Page
        </button>
      </div>
    `;
    
    document.body.appendChild(errorOverlay);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DesktopCalculatorApp();
  });
} else {
  new DesktopCalculatorApp();
}