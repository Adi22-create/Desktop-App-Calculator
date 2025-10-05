class UIManager {
  constructor() {
    this.modals = new Map();
    this.initialize();
  }

  initialize() {
    this.setupEventListeners();
    console.log('UI Manager initialized');
  }

  setupEventListeners() {
    // Navigation event listeners
    document.querySelectorAll('[data-tab]').forEach(button => {
      button.addEventListener('click', (e) => {
        const tabName = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });

    // Global export button
    const exportAllBtn = document.getElementById('exportAllBtn');
    if (exportAllBtn) {
      exportAllBtn.addEventListener('click', () => this.exportAllData());
    }

    // Set up module-specific event listeners
    this.setupProjectsListeners();
    this.setupResourcesListeners();
    this.setupProductivityListeners();
    this.setupMasterListeners();
    this.setupCalculatorListeners();
  }

  switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.add('hidden');
    });

    // Remove active class from all nav items
    document.querySelectorAll('[data-tab]').forEach(button => {
      button.classList.remove('active');
    });

    // Show selected tab
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
      targetTab.classList.remove('hidden');
    }

    // Add active class to selected nav item
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }

    // Update state
    window.stateManager.setCurrentTab(tabName);

    // Refresh data for the tab
    this.refreshTabData(tabName);
  }

  refreshTabData(tabName) {
    switch (tabName) {
      case 'projects':
        this.renderProjectsTable();
        break;
      case 'resources':
        this.renderResourcesTable();
        this.updateProjectFilterDropdown();
        break;
      case 'productivity':
        this.renderProductivityTable();
        this.updateProductivityProjectDropdown();
        break;
      case 'master':
        this.renderMasterTable();
        this.updateMasterFilters();
        break;
      case 'calculator':
        this.updateCalculatorDropdowns();
        this.renderCalculatorHistory();
        break;
    }
  }

  // Projects Module
  setupProjectsListeners() {
    const addBtn = document.getElementById('addProjectBtn');
    const bulkUploadBtn = document.getElementById('bulkUploadProjectsBtn');
    const saveBtn = document.getElementById('saveProjectsBtn');

    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddProjectModal());
    }
    if (bulkUploadBtn) {
      bulkUploadBtn.addEventListener('click', () => this.showBulkUploadModal('projects'));
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveProjects());
    }
  }

  renderProjectsTable() {
    const tbody = document.getElementById('projectsTableBody');
    if (!tbody) return;

    const projects = window.stateManager.getProjects();
    tbody.innerHTML = '';

    projects.forEach((project, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <input type="text" value="${this.escapeHtml(project['Project Name'] || '')}" 
                 class="input-field" data-field="Project Name" data-index="${index}">
        </td>
        <td>
          <input type="text" value="${this.escapeHtml(project['Description'] || '')}" 
                 class="input-field" data-field="Description" data-index="${index}">
        </td>
        <td>
          <div class="flex gap-2">
            <button class="text-danger hover:text-red-700" onclick="uiManager.deleteProject(${index})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Add event listeners for inline editing
    tbody.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        const field = e.target.getAttribute('data-field');
        const project = { ...projects[index] };
        project[field] = e.target.value;
        window.stateManager.updateProject(index, project);
      });
    });
  }

  showAddProjectModal() {
    const modal = this.createModal('Add New Project', `
      <form id="addProjectForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
          <input type="text" id="projectName" class="input-field" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea id="projectDescription" class="input-field" rows="3"></textarea>
        </div>
        <div class="flex gap-3 justify-end">
          <button type="button" class="btn-secondary" onclick="uiManager.closeModal('addProject')">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            <i class="fas fa-plus"></i>
            Add Project
          </button>
        </div>
      </form>
    `);

    modal.querySelector('#addProjectForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('projectName').value.trim();
      const description = document.getElementById('projectDescription').value.trim();

      if (!name) {
        this.showToast('Project name is required', 'error');
        return;
      }

      // Check for duplicate
      const existing = window.stateManager.getProjects().find(p => p['Project Name'] === name);
      if (existing) {
        this.showToast('Project name already exists', 'error');
        return;
      }

      window.stateManager.addProject({
        'Project Name': name,
        'Description': description
      });

      this.renderProjectsTable();
      this.closeModal('addProject');
      this.showToast('Project added successfully', 'success');
    });

    this.showModal('addProject', modal);
  }

  async saveProjects() {
    const success = await window.stateManager.saveProjects();
    if (success) {
      this.showToast('Projects saved successfully', 'success');
    } else {
      this.showToast('Error saving projects', 'error');
    }
  }

  deleteProject(index) {
    if (confirm('Are you sure you want to delete this project? This will also remove it from resources and productivity mappings.')) {
      window.stateManager.deleteProject(index);
      this.renderProjectsTable();
      this.showToast('Project deleted successfully', 'success');
    }
  }

  // Resources Module
  setupResourcesListeners() {
    const addBtn = document.getElementById('addResourceBtn');
    const bulkUploadBtn = document.getElementById('bulkUploadResourcesBtn');
    const saveBtn = document.getElementById('saveResourcesBtn');
    const filterSelect = document.getElementById('projectFilter');

    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddResourceModal());
    }
    if (bulkUploadBtn) {
      bulkUploadBtn.addEventListener('click', () => this.showBulkUploadModal('resources'));
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveResources());
    }
    if (filterSelect) {
      filterSelect.addEventListener('change', () => this.renderResourcesTable());
    }
  }

  renderResourcesTable() {
    const tbody = document.getElementById('resourcesTableBody');
    const filter = document.getElementById('projectFilter')?.value || '';
    if (!tbody) return;

    let resources = window.stateManager.getResources();
    
    // Apply project filter
    if (filter) {
      resources = resources.filter(resource => {
        const assignedProjects = resource['Assigned Projects'] || '';
        return assignedProjects.includes(filter);
      });
    }

    tbody.innerHTML = '';

    resources.forEach((resource, originalIndex) => {
      // Find the actual index in the full array
      const actualIndex = window.stateManager.getResources().findIndex(r => r === resource);
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <input type="text" value="${this.escapeHtml(resource['Resource Name'] || '')}" 
                 class="input-field" data-field="Resource Name" data-index="${actualIndex}">
        </td>
        <td>
          <div class="relative">
            <select multiple class="input-field h-20" data-field="Assigned Projects" data-index="${actualIndex}">
              ${this.getProjectOptions(resource['Assigned Projects'])}
            </select>
          </div>
        </td>
        <td>
          <input type="text" value="${this.escapeHtml(resource['Description'] || '')}" 
                 class="input-field" data-field="Description" data-index="${actualIndex}">
        </td>
        <td>
          <div class="flex gap-2">
            <button class="text-danger hover:text-red-700" onclick="uiManager.deleteResource(${actualIndex})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Add event listeners for inline editing
    tbody.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        const field = e.target.getAttribute('data-field');
        const allResources = window.stateManager.getResources();
        const resource = { ...allResources[index] };
        
        if (field === 'Assigned Projects') {
          const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
          resource[field] = selectedOptions.join(', ');
        } else {
          resource[field] = e.target.value;
        }
        
        window.stateManager.updateResource(index, resource);
      });
    });
  }

  getProjectOptions(assignedProjects) {
    const projects = window.stateManager.getProjects();
    const assigned = (assignedProjects || '').split(',').map(p => p.trim()).filter(p => p);
    
    return projects.map(project => {
      const projectName = project['Project Name'];
      const selected = assigned.includes(projectName) ? 'selected' : '';
      return `<option value="${this.escapeHtml(projectName)}" ${selected}>${this.escapeHtml(projectName)}</option>`;
    }).join('');
  }

  updateProjectFilterDropdown() {
    const select = document.getElementById('projectFilter');
    if (!select) return;

    const projects = window.stateManager.getProjects();
    select.innerHTML = '<option value="">All Projects</option>';
    
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project['Project Name'];
      option.textContent = project['Project Name'];
      select.appendChild(option);
    });
  }

  async saveResources() {
    const success = await window.stateManager.saveResources();
    if (success) {
      this.showToast('Resources saved successfully', 'success');
    } else {
      this.showToast('Error saving resources', 'error');
    }
  }

  showAddResourceModal() {
    const modal = this.createModal('Add New Resource', `
      <form id="addResourceForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Resource Name *</label>
          <input type="text" id="resourceName" class="input-field" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Assigned Projects</label>
          <select multiple id="assignedProjects" class="input-field h-32">
            ${this.getProjectOptionsForModal()}
          </select>
          <div class="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple projects</div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea id="resourceDescription" class="input-field" rows="3"></textarea>
        </div>
        <div class="flex gap-3 justify-end">
          <button type="button" class="btn-secondary" onclick="uiManager.closeModal('addResource')">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            <i class="fas fa-plus"></i>
            Add Resource
          </button>
        </div>
      </form>
    `);

    modal.querySelector('#addResourceForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('resourceName').value.trim();
      const description = document.getElementById('resourceDescription').value.trim();
      const assignedSelect = document.getElementById('assignedProjects');
      const assignedProjects = Array.from(assignedSelect.selectedOptions).map(option => option.value);

      if (!name) {
        this.showToast('Resource name is required', 'error');
        return;
      }

      window.stateManager.addResource({
        'Resource Name': name,
        'Assigned Projects': assignedProjects.join(', '),
        'Description': description
      });

      this.renderResourcesTable();
      this.closeModal('addResource');
      this.showToast('Resource added successfully', 'success');
    });

    this.showModal('addResource', modal);
  }

  getProjectOptionsForModal() {
    const projects = window.stateManager.getProjects();
    return projects.map(project => {
      const projectName = project['Project Name'];
      return `<option value="${this.escapeHtml(projectName)}">${this.escapeHtml(projectName)}</option>`;
    }).join('');
  }

  deleteResource(index) {
    if (confirm('Are you sure you want to delete this resource?')) {
      window.stateManager.deleteResource(index);
      this.renderResourcesTable();
      this.showToast('Resource deleted successfully', 'success');
    }
  }

  // Productivity Module
  setupProductivityListeners() {
    const projectSelect = document.getElementById('productivityProjectSelect');
    const addBtn = document.getElementById('addProductivityBtn');
    const bulkUploadBtn = document.getElementById('bulkUploadProductivityBtn');
    const saveBtn = document.getElementById('saveProductivityBtn');

    if (projectSelect) {
      projectSelect.addEventListener('change', () => this.renderProductivityTable());
    }
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddProductivityModal());
    }
    if (bulkUploadBtn) {
      bulkUploadBtn.addEventListener('click', () => this.showBulkUploadModal('productivity'));
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveProductivity());
    }
  }

  renderProductivityTable() {
    const tbody = document.getElementById('productivityTableBody');
    const projectSelect = document.getElementById('productivityProjectSelect');
    if (!tbody || !projectSelect) return;

    const selectedProject = projectSelect.value;
    if (!selectedProject) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center text-gray-500">Please select a project</td></tr>';
      return;
    }

    const productivity = window.stateManager.getProductivityForProject(selectedProject);
    tbody.innerHTML = '';

    productivity.forEach((prod, index) => {
      // Find the actual index in the full productivity array
      const actualIndex = window.stateManager.getProductivity().findIndex(p => p === prod);
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <input type="number" value="${prod['Productivity Value'] || ''}" 
                 class="input-field" data-field="Productivity Value" data-index="${actualIndex}" min="1">
        </td>
        <td>
          <div class="relative">
            <span class="absolute left-3 top-2 text-gray-500">$</span>
            <input type="number" value="${prod['Rate'] || ''}" 
                   class="input-field pl-8" data-field="Rate" data-index="${actualIndex}" min="0" step="0.01">
          </div>
        </td>
        <td>
          <div class="flex gap-2">
            <button class="text-danger hover:text-red-700" onclick="uiManager.deleteProductivity(${actualIndex})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Add event listeners for inline editing
    tbody.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        const field = e.target.getAttribute('data-field');
        const allProductivity = window.stateManager.getProductivity();
        const prod = { ...allProductivity[index] };
        prod[field] = e.target.value;
        window.stateManager.updateProductivity(index, prod);
      });
    });
  }

  updateProductivityProjectDropdown() {
    const select = document.getElementById('productivityProjectSelect');
    if (!select) return;

    const projects = window.stateManager.getProjects();
    select.innerHTML = '<option value="">Select Project</option>';
    
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project['Project Name'];
      option.textContent = project['Project Name'];
      select.appendChild(option);
    });
  }

  showAddProductivityModal() {
    const projectSelect = document.getElementById('productivityProjectSelect');
    const selectedProject = projectSelect ? projectSelect.value : '';
    
    if (!selectedProject) {
      this.showToast('Please select a project first', 'error');
      return;
    }

    const modal = this.createModal('Add Productivity Mapping', `
      <form id="addProductivityForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Project</label>
          <input type="text" value="${this.escapeHtml(selectedProject)}" class="input-field bg-gray-100" readonly>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Productivity Value *</label>
          <input type="number" id="productivityValue" class="input-field" min="1" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Rate ($) *</label>
          <div class="relative">
            <span class="absolute left-3 top-2 text-gray-500">$</span>
            <input type="number" id="productivityRate" class="input-field pl-8" min="0" step="0.01" required>
          </div>
        </div>
        <div class="flex gap-3 justify-end">
          <button type="button" class="btn-secondary" onclick="uiManager.closeModal('addProductivity')">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            <i class="fas fa-plus"></i>
            Add Mapping
          </button>
        </div>
      </form>
    `);

    modal.querySelector('#addProductivityForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const productivity = document.getElementById('productivityValue').value;
      const rate = document.getElementById('productivityRate').value;

      if (!productivity || !rate) {
        this.showToast('All fields are required', 'error');
        return;
      }

      // Check for duplicate productivity value for this project
      const existing = window.stateManager.getProductivityForProject(selectedProject);
      if (existing.find(p => p['Productivity Value'] == productivity)) {
        this.showToast('Productivity value already exists for this project', 'error');
        return;
      }

      window.stateManager.addProductivity({
        'Project Name': selectedProject,
        'Productivity Value': productivity,
        'Rate': rate
      });

      this.renderProductivityTable();
      this.closeModal('addProductivity');
      this.showToast('Productivity mapping added successfully', 'success');
    });

    this.showModal('addProductivity', modal);
  }

  deleteProductivity(index) {
    if (confirm('Are you sure you want to delete this productivity mapping?')) {
      window.stateManager.deleteProductivity(index);
      this.renderProductivityTable();
      this.showToast('Productivity mapping deleted successfully', 'success');
    }
  }

  async saveProductivity() {
    const success = await window.stateManager.saveProductivity();
    if (success) {
      this.showToast('Productivity mappings saved successfully', 'success');
      // Refresh master database
      this.refreshTabData('master');
    } else {
      this.showToast('Error saving productivity mappings', 'error');
    }
  }

  // Master Database Module
  setupMasterListeners() {
    const refreshBtn = document.getElementById('refreshMasterBtn');
    const exportBtn = document.getElementById('exportMasterBtn');
    
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        window.stateManager.updateMasterDatabase();
        this.renderMasterTable();
        this.showToast('Master database refreshed', 'success');
      });
    }
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportMasterView());
    }

    // Filter listeners
    ['masterProjectFilter', 'masterResourceFilter', 'masterMinRate', 'masterMaxRate'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => this.renderMasterTable());
      }
    });
  }

  renderMasterTable() {
    const tbody = document.getElementById('masterTableBody');
    if (!tbody) return;

    let masterData = window.stateManager.getMaster();
    
    // Apply filters
    const projectFilter = document.getElementById('masterProjectFilter')?.value || '';
    const resourceFilter = document.getElementById('masterResourceFilter')?.value || '';
    const minRate = parseFloat(document.getElementById('masterMinRate')?.value) || 0;
    const maxRate = parseFloat(document.getElementById('masterMaxRate')?.value) || Infinity;

    masterData = masterData.filter(row => {
      const rate = parseFloat(row.Rate) || 0;
      return (
        (projectFilter === '' || row.Project === projectFilter) &&
        (resourceFilter === '' || row.Resource === resourceFilter) &&
        rate >= minRate &&
        rate <= maxRate
      );
    });

    tbody.innerHTML = '';

    masterData.forEach((row, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${this.escapeHtml(row.Project || '')}</td>
        <td>${this.escapeHtml(row.Resource || '')}</td>
        <td>${this.escapeHtml(row.Productivity || '')}</td>
        <td>${window.csvManager.formatCurrency(row.Rate)}</td>
        <td>${this.escapeHtml(row.Description || '')}</td>
        <td>
          <div class="flex gap-2">
            <button class="text-primary hover:text-blue-700" onclick="uiManager.editMasterRow(${index})">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  updateMasterFilters() {
    const projects = [...new Set(window.stateManager.getMaster().map(row => row.Project))].filter(Boolean);
    const resources = [...new Set(window.stateManager.getMaster().map(row => row.Resource))].filter(Boolean);

    const projectFilter = document.getElementById('masterProjectFilter');
    const resourceFilter = document.getElementById('masterResourceFilter');

    if (projectFilter) {
      projectFilter.innerHTML = '<option value="">All Projects</option>';
      projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project;
        option.textContent = project;
        projectFilter.appendChild(option);
      });
    }

    if (resourceFilter) {
      resourceFilter.innerHTML = '<option value="">All Resources</option>';
      resources.forEach(resource => {
        const option = document.createElement('option');
        option.value = resource;
        option.textContent = resource;
        resourceFilter.appendChild(option);
      });
    }
  }

  // Calculator Module
  setupCalculatorListeners() {
    const projectSelect = document.getElementById('calcProjectSelect');
    const resourceSelect = document.getElementById('calcResourceSelect');
    const productivitySelect = document.getElementById('calcProductivitySelect');
    const transactionsInput = document.getElementById('calcTransactions');
    const calculateBtn = document.getElementById('calculateBtn');
    const clearBtn = document.getElementById('clearCalculatorBtn');
    const saveBtn = document.getElementById('saveCalculationBtn');
    const exportHistoryBtn = document.getElementById('exportCalculatorHistoryBtn');

    if (projectSelect) {
      projectSelect.addEventListener('change', () => {
        this.updateCalculatorResourceDropdown();
        this.updateCalculatorProductivityDropdown();
        this.clearCalculatorResults();
      });
    }

    if (resourceSelect) {
      resourceSelect.addEventListener('change', () => {
        this.clearCalculatorResults();
      });
    }

    if (productivitySelect) {
      productivitySelect.addEventListener('change', () => {
        this.updateCalculatorRate();
      });
    }

    if (transactionsInput) {
      transactionsInput.addEventListener('input', () => {
        this.updateCalculatorTotal();
      });
    }

    if (calculateBtn) {
      calculateBtn.addEventListener('click', () => this.calculateTotal());
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearCalculator());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCalculation());
    }

    if (exportHistoryBtn) {
      exportHistoryBtn.addEventListener('click', () => this.exportCalculatorHistory());
    }
  }

  updateCalculatorDropdowns() {
    // Update project dropdown
    const projectSelect = document.getElementById('calcProjectSelect');
    if (projectSelect) {
      const projects = window.stateManager.getProjects();
      projectSelect.innerHTML = '<option value="">Select Project</option>';
      
      projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project['Project Name'];
        option.textContent = project['Project Name'];
        projectSelect.appendChild(option);
      });
    }
  }

  updateCalculatorResourceDropdown() {
    const projectSelect = document.getElementById('calcProjectSelect');
    const resourceSelect = document.getElementById('calcResourceSelect');
    
    if (!projectSelect || !resourceSelect) return;

    const selectedProject = projectSelect.value;
    resourceSelect.innerHTML = '<option value="">Select Resource</option>';
    
    if (selectedProject) {
      const resources = window.stateManager.getResourcesForProject(selectedProject);
      resources.forEach(resource => {
        const option = document.createElement('option');
        option.value = resource['Resource Name'];
        option.textContent = resource['Resource Name'];
        resourceSelect.appendChild(option);
      });
    }
  }

  updateCalculatorProductivityDropdown() {
    const projectSelect = document.getElementById('calcProjectSelect');
    const productivitySelect = document.getElementById('calcProductivitySelect');
    
    if (!projectSelect || !productivitySelect) return;

    const selectedProject = projectSelect.value;
    productivitySelect.innerHTML = '<option value="">Select Productivity</option>';
    
    if (selectedProject) {
      const productivity = window.stateManager.getProductivityForProject(selectedProject);
      productivity.forEach(prod => {
        const option = document.createElement('option');
        option.value = prod['Productivity Value'];
        option.textContent = `Level ${prod['Productivity Value']}`;
        productivitySelect.appendChild(option);
      });
    }
  }

  updateCalculatorRate() {
    const projectSelect = document.getElementById('calcProjectSelect');
    const productivitySelect = document.getElementById('calcProductivitySelect');
    const rateDisplay = document.getElementById('calcRateDisplay');
    
    if (!projectSelect || !productivitySelect || !rateDisplay) return;

    const project = projectSelect.value;
    const productivity = productivitySelect.value;
    
    if (project && productivity) {
      const rate = window.stateManager.getRateForProductivity(project, productivity);
      rateDisplay.textContent = window.csvManager.formatCurrency(rate);
      this.updateCalculatorTotal();
    } else {
      rateDisplay.textContent = '$0.00';
    }
  }

  updateCalculatorTotal() {
    const rateDisplay = document.getElementById('calcRateDisplay');
    const transactionsInput = document.getElementById('calcTransactions');
    const totalDisplay = document.getElementById('calcTotalDisplay');
    
    if (!rateDisplay || !transactionsInput || !totalDisplay) return;

    const rateText = rateDisplay.textContent.replace('$', '').replace(',', '');
    const rate = parseFloat(rateText) || 0;
    const transactions = parseFloat(transactionsInput.value) || 0;
    const total = rate * transactions;
    
    totalDisplay.textContent = window.csvManager.formatCurrency(total);
  }

  calculateTotal() {
    this.updateCalculatorRate();
    this.showToast('Calculation updated', 'success');
  }

  clearCalculator() {
    document.getElementById('calcProjectSelect').value = '';
    document.getElementById('calcResourceSelect').innerHTML = '<option value="">Select Resource</option>';
    document.getElementById('calcProductivitySelect').innerHTML = '<option value="">Select Productivity</option>';
    document.getElementById('calcTransactions').value = '';
    document.getElementById('calcRateDisplay').textContent = '$0.00';
    document.getElementById('calcTotalDisplay').textContent = '$0.00';
  }

  clearCalculatorResults() {
    document.getElementById('calcRateDisplay').textContent = '$0.00';
    document.getElementById('calcTotalDisplay').textContent = '$0.00';
  }

  async saveCalculation() {
    const project = document.getElementById('calcProjectSelect').value;
    const resource = document.getElementById('calcResourceSelect').value;
    const productivity = document.getElementById('calcProductivitySelect').value;
    const transactions = parseFloat(document.getElementById('calcTransactions').value);
    const rateText = document.getElementById('calcRateDisplay').textContent.replace('$', '').replace(',', '');
    const rate = parseFloat(rateText);
    const totalText = document.getElementById('calcTotalDisplay').textContent.replace('$', '').replace(',', '');
    const total = parseFloat(totalText);

    if (!project || !resource || !productivity || !transactions) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    const entry = {
      'Timestamp': window.csvManager.getCurrentTimestamp(),
      'Project': project,
      'Resource': resource,
      'Productivity': productivity,
      'Transactions': transactions,
      'Rate': rate,
      'Total': total
    };

    window.stateManager.addCalculatorEntry(entry);
    const success = await window.stateManager.saveCalculatorHistory();
    
    if (success) {
      this.showToast('Calculation saved successfully', 'success');
      this.renderCalculatorHistory();
    } else {
      this.showToast('Error saving calculation', 'error');
    }
  }

  renderCalculatorHistory() {
    const container = document.getElementById('calculatorHistory');
    if (!container) return;

    const history = window.stateManager.getCalculatorHistory().slice(-10).reverse(); // Show last 10 entries
    container.innerHTML = '';

    if (history.length === 0) {
      container.innerHTML = '<div class="text-center text-gray-500">No calculations saved yet</div>';
      return;
    }

    history.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'bg-gray-50 rounded-lg p-3 border';
      div.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-medium text-gray-800">${this.escapeHtml(entry.Project)} - ${this.escapeHtml(entry.Resource)}</h4>
          <span class="text-sm text-gray-500">${new Date(entry.Timestamp).toLocaleString()}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>Productivity: Level ${entry.Productivity}</div>
          <div>Transactions: ${entry.Transactions}</div>
          <div>Rate: ${window.csvManager.formatCurrency(entry.Rate)}</div>
          <div class="font-semibold text-success">Total: ${window.csvManager.formatCurrency(entry.Total)}</div>
        </div>
      `;
      container.appendChild(div);
    });
  }

  // Utility methods
  async exportAllData() {
    const success = await window.csvManager.exportAllData('excel');
    if (success) {
      this.showToast('Data exported successfully', 'success');
    } else {
      this.showToast('Error exporting data', 'error');
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type} animate-fade-in`;
    toast.innerHTML = `
      <div class="flex items-center justify-between">
        <span>${this.escapeHtml(message)}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
        <div class="flex justify-between items-center p-6 border-b">
          <h3 class="text-lg font-semibold text-gray-800">${this.escapeHtml(title)}</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="p-6">
          ${content}
        </div>
      </div>
    `;
    return modal;
  }

  showModal(id, modal) {
    const container = document.getElementById('modalContainer');
    if (container) {
      this.modals.set(id, modal);
      container.appendChild(modal);
      container.classList.remove('hidden');
    }
  }

  closeModal(id) {
    const modal = this.modals.get(id);
    if (modal && modal.parentElement) {
      modal.remove();
      this.modals.delete(id);
      
      // Hide container if no more modals
      if (this.modals.size === 0) {
        document.getElementById('modalContainer').classList.add('hidden');
      }
    }
  }

  showBulkUploadModal(module) {
    const modal = this.createModal(`Bulk Upload ${module.charAt(0).toUpperCase() + module.slice(1)}`, `
      <form id="bulkUploadForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Upload CSV/Excel File</label>
          <input type="file" id="uploadFile" class="input-field" accept=".csv,.xlsx,.xls" required>
          <div class="text-sm text-gray-500 mt-1">Supported formats: CSV, Excel (.xlsx, .xls)</div>
        </div>
        <div id="previewContainer" class="hidden">
          <label class="block text-sm font-medium text-gray-700 mb-2">Preview (First 10 rows)</label>
          <div class="border rounded-lg p-4 max-h-64 overflow-auto">
            <div id="previewTable"></div>
          </div>
        </div>
        <div id="validationErrors" class="hidden">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 class="text-red-800 font-medium mb-2">Validation Errors:</h4>
            <ul id="errorsList" class="text-red-700 text-sm space-y-1"></ul>
          </div>
        </div>
        <div class="flex gap-3 justify-end">
          <button type="button" class="btn-secondary" onclick="uiManager.closeModal('bulkUpload')">
            Cancel
          </button>
          <button type="button" id="previewBtn" class="btn-secondary">
            <i class="fas fa-eye"></i>
            Preview
          </button>
          <button type="submit" id="uploadBtn" class="btn-primary" disabled>
            <i class="fas fa-upload"></i>
            Upload Data
          </button>
        </div>
      </form>
    `);

    const fileInput = modal.querySelector('#uploadFile');
    const previewBtn = modal.querySelector('#previewBtn');
    const uploadBtn = modal.querySelector('#uploadBtn');
    let uploadData = null;

    fileInput.addEventListener('change', () => {
      uploadBtn.disabled = true;
      document.getElementById('previewContainer').classList.add('hidden');
      document.getElementById('validationErrors').classList.add('hidden');
    });

    previewBtn.addEventListener('click', async () => {
      const file = fileInput.files[0];
      if (!file) {
        this.showToast('Please select a file', 'error');
        return;
      }

      try {
        const data = await window.csvManager.parseUploadedFile(file);
        const validation = this.validateBulkUploadData(data, module);
        
        // Show preview
        this.showBulkUploadPreview(data.slice(0, 10), module);
        
        if (validation.valid) {
          uploadBtn.disabled = false;
          uploadData = data;
          document.getElementById('validationErrors').classList.add('hidden');
        } else {
          uploadBtn.disabled = true;
          this.showValidationErrors(validation.errors);
        }
        
        document.getElementById('previewContainer').classList.remove('hidden');
      } catch (error) {
        this.showToast('Error parsing file: ' + error.message, 'error');
      }
    });

    modal.querySelector('#bulkUploadForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!uploadData) {
        this.showToast('Please preview the data first', 'error');
        return;
      }

      const success = await this.processBulkUpload(uploadData, module);
      if (success) {
        this.closeModal('bulkUpload');
        this.showToast(`${module} data uploaded successfully`, 'success');
        this.refreshTabData(module);
      }
    });

    this.showModal('bulkUpload', modal);
  }

  validateBulkUploadData(data, module) {
    const requiredFields = {
      'projects': ['Project Name'],
      'resources': ['Resource Name'],
      'productivity': ['Project Name', 'Productivity Value', 'Rate']
    };

    const fields = requiredFields[module] || [];
    return window.csvManager.validateCSVData(data, fields);
  }

  showBulkUploadPreview(data, module) {
    const container = document.getElementById('previewTable');
    if (!container || data.length === 0) return;

    const headers = Object.keys(data[0]);
    let html = '<table class="table"><thead><tr>';
    
    headers.forEach(header => {
      html += `<th>${this.escapeHtml(header)}</th>`;
    });
    html += '</tr></thead><tbody>';

    data.forEach(row => {
      html += '<tr>';
      headers.forEach(header => {
        html += `<td>${this.escapeHtml(row[header] || '')}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  showValidationErrors(errors) {
    const container = document.getElementById('errorsList');
    if (!container) return;

    container.innerHTML = '';
    errors.forEach(error => {
      const li = document.createElement('li');
      li.textContent = error;
      container.appendChild(li);
    });

    document.getElementById('validationErrors').classList.remove('hidden');
  }

  async processBulkUpload(data, module) {
    try {
      switch (module) {
        case 'projects':
          return await window.csvManager.mergeCSV('projects.csv', data, 'Project Name');
        case 'resources':
          return await window.csvManager.mergeCSV('resources.csv', data, 'Resource Name');
        case 'productivity':
          // For productivity, we need to ensure project exists
          const validData = data.filter(row => {
            const project = window.stateManager.getProjects().find(p => p['Project Name'] === row['Project Name']);
            return project !== undefined;
          });
          return await window.csvManager.mergeCSV('productivity.csv', validData, 'Project Name,Productivity Value');
        default:
          return false;
      }
    } catch (error) {
      console.error('Error processing bulk upload:', error);
      return false;
    }
  }

  async exportCalculatorHistory() {
    try {
      const history = window.stateManager.getCalculatorHistory();
      if (history.length === 0) {
        this.showToast('No calculation history to export', 'warning');
        return;
      }

      const csv = Papa.unparse(history);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `calculator_history_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showToast('Calculator history exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting calculator history:', error);
      this.showToast('Error exporting calculator history', 'error');
    }
  }

  async exportMasterView() {
    try {
      const masterData = window.stateManager.getMaster();
      if (masterData.length === 0) {
        this.showToast('No master data to export', 'warning');
        return;
      }

      const csv = Papa.unparse(masterData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `master_database_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showToast('Master database exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting master view:', error);
      this.showToast('Error exporting master view', 'error');
    }
  }

  editMasterRow(index) {
    // Since master database is derived, we need to find the source data
    this.showToast('Master database is read-only. Edit data in Projects, Resources, or Productivity sections.', 'warning');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create global instance
window.uiManager = new UIManager();