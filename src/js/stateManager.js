class StateManager {
  constructor() {
    this.electronAPI = window.electronAPI;
    this.state = {
      currentTab: 'projects',
      data: {
        projects: [],
        resources: [],
        productivity: [],
        master: [],
        calculatorHistory: []
      },
      filters: {
        projectFilter: '',
        resourceFilter: '',
        minRate: '',
        maxRate: ''
      },
      unsavedChanges: {
        projects: false,
        resources: false,
        productivity: false
      }
    };
    this.initialize();
  }

  async initialize() {
    try {
      // Load app state from electron store
      const appState = await this.electronAPI.getAppState();
      this.state.currentTab = appState.lastActiveTab || 'projects';
      
      // Load all CSV data
      await this.loadAllData();
      
      console.log('State manager initialized successfully');
    } catch (error) {
      console.error('Error initializing state manager:', error);
    }
  }

  async loadAllData() {
    try {
      const csvManager = window.csvManager;
      
      // Load all CSV files
      const [projects, resources, productivity, master, calculatorHistory] = await Promise.all([
        csvManager.loadCSV('projects.csv'),
        csvManager.loadCSV('resources.csv'),
        csvManager.loadCSV('productivity.csv'),
        csvManager.loadCSV('master.csv'),
        csvManager.loadCSV('calculator_history.csv')
      ]);
      
      this.state.data = {
        projects,
        resources,
        productivity,
        master,
        calculatorHistory
      };
      
      // Update master database from other sources
      this.updateMasterDatabase();
      
      console.log('All data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  updateMasterDatabase() {
    try {
      const master = [];
      
      // Build master database from projects, resources, and productivity
      this.state.data.projects.forEach(project => {
        const projectName = project['Project Name'];
        if (!projectName) return;
        
        // Get resources for this project
        const projectResources = this.state.data.resources.filter(resource => {
          const assignedProjects = resource['Assigned Projects'] || '';
          return assignedProjects.split(',').map(p => p.trim()).includes(projectName);
        });
        
        // Get productivity mappings for this project
        const productivityMappings = this.state.data.productivity.filter(p => 
          p['Project Name'] === projectName
        );
        
        if (projectResources.length === 0) {
          // Project with no resources
          productivityMappings.forEach(prodMapping => {
            master.push({
              'Project': projectName,
              'Resource': '',
              'Productivity': prodMapping['Productivity Value'] || '',
              'Rate': prodMapping['Rate'] || '',
              'Description': project['Description'] || ''
            });
          });
        } else {
          // Project with resources
          projectResources.forEach(resource => {
            if (productivityMappings.length === 0) {
              // Resource with no productivity mapping
              master.push({
                'Project': projectName,
                'Resource': resource['Resource Name'] || '',
                'Productivity': '',
                'Rate': '',
                'Description': resource['Description'] || project['Description'] || ''
              });
            } else {
              // Resource with productivity mappings
              productivityMappings.forEach(prodMapping => {
                master.push({
                  'Project': projectName,
                  'Resource': resource['Resource Name'] || '',
                  'Productivity': prodMapping['Productivity Value'] || '',
                  'Rate': prodMapping['Rate'] || '',
                  'Description': resource['Description'] || project['Description'] || ''
                });
              });
            }
          });
        }
      });
      
      this.state.data.master = master;
    } catch (error) {
      console.error('Error updating master database:', error);
    }
  }

  async saveAppState() {
    try {
      await this.electronAPI.saveAppState({
        lastActiveTab: this.state.currentTab
      });
    } catch (error) {
      console.error('Error saving app state:', error);
    }
  }

  setCurrentTab(tabName) {
    this.state.currentTab = tabName;
    this.saveAppState();
  }

  setUnsavedChanges(module, hasChanges) {
    this.state.unsavedChanges[module] = hasChanges;
  }

  hasUnsavedChanges() {
    return Object.values(this.state.unsavedChanges).some(changed => changed);
  }

  getProjects() {
    return this.state.data.projects;
  }

  getResources() {
    return this.state.data.resources;
  }

  getProductivity() {
    return this.state.data.productivity;
  }

  getMaster() {
    return this.state.data.master;
  }

  getCalculatorHistory() {
    return this.state.data.calculatorHistory;
  }

  getResourcesForProject(projectName) {
    return this.state.data.resources.filter(resource => {
      const assignedProjects = resource['Assigned Projects'] || '';
      return assignedProjects.split(',').map(p => p.trim()).includes(projectName);
    });
  }

  getProductivityForProject(projectName) {
    return this.state.data.productivity.filter(p => p['Project Name'] === projectName);
  }

  getRateForProductivity(projectName, productivityValue) {
    const mapping = this.state.data.productivity.find(p => 
      p['Project Name'] === projectName && 
      p['Productivity Value'] == productivityValue
    );
    return mapping ? parseFloat(mapping['Rate']) || 0 : 0;
  }

  addProject(project) {
    this.state.data.projects.push(project);
    this.setUnsavedChanges('projects', true);
  }

  updateProject(index, project) {
    if (index >= 0 && index < this.state.data.projects.length) {
      this.state.data.projects[index] = project;
      this.setUnsavedChanges('projects', true);
    }
  }

  deleteProject(index) {
    if (index >= 0 && index < this.state.data.projects.length) {
      const projectName = this.state.data.projects[index]['Project Name'];
      
      // Remove project
      this.state.data.projects.splice(index, 1);
      
      // Remove from resources
      this.state.data.resources.forEach(resource => {
        const assignedProjects = resource['Assigned Projects'] || '';
        const projects = assignedProjects.split(',').map(p => p.trim());
        const filteredProjects = projects.filter(p => p !== projectName);
        resource['Assigned Projects'] = filteredProjects.join(', ');
      });
      
      // Remove from productivity
      this.state.data.productivity = this.state.data.productivity.filter(p => 
        p['Project Name'] !== projectName
      );
      
      this.setUnsavedChanges('projects', true);
      this.setUnsavedChanges('resources', true);
      this.setUnsavedChanges('productivity', true);
    }
  }

  addResource(resource) {
    this.state.data.resources.push(resource);
    this.setUnsavedChanges('resources', true);
  }

  updateResource(index, resource) {
    if (index >= 0 && index < this.state.data.resources.length) {
      this.state.data.resources[index] = resource;
      this.setUnsavedChanges('resources', true);
    }
  }

  deleteResource(index) {
    if (index >= 0 && index < this.state.data.resources.length) {
      this.state.data.resources.splice(index, 1);
      this.setUnsavedChanges('resources', true);
    }
  }

  addProductivity(productivity) {
    this.state.data.productivity.push(productivity);
    this.setUnsavedChanges('productivity', true);
  }

  updateProductivity(index, productivity) {
    if (index >= 0 && index < this.state.data.productivity.length) {
      this.state.data.productivity[index] = productivity;
      this.setUnsavedChanges('productivity', true);
    }
  }

  deleteProductivity(index) {
    if (index >= 0 && index < this.state.data.productivity.length) {
      this.state.data.productivity.splice(index, 1);
      this.setUnsavedChanges('productivity', true);
    }
  }

  addCalculatorEntry(entry) {
    this.state.data.calculatorHistory.push(entry);
    // Calculator history doesn't need unsaved changes tracking as it auto-saves
  }

  async saveProjects() {
    const success = await window.csvManager.saveCSV('projects.csv', this.state.data.projects);
    if (success) {
      this.setUnsavedChanges('projects', false);
    }
    return success;
  }

  async saveResources() {
    const success = await window.csvManager.saveCSV('resources.csv', this.state.data.resources);
    if (success) {
      this.setUnsavedChanges('resources', false);
    }
    return success;
  }

  async saveProductivity() {
    const success = await window.csvManager.saveCSV('productivity.csv', this.state.data.productivity);
    if (success) {
      this.setUnsavedChanges('productivity', false);
      // Also update master database
      this.updateMasterDatabase();
      await window.csvManager.saveCSV('master.csv', this.state.data.master);
    }
    return success;
  }

  async saveCalculatorHistory() {
    return await window.csvManager.saveCSV('calculator_history.csv', this.state.data.calculatorHistory);
  }

  async saveMaster() {
    this.updateMasterDatabase();
    return await window.csvManager.saveCSV('master.csv', this.state.data.master);
  }
}

// Create global instance
window.stateManager = new StateManager();