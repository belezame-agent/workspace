document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      tabContents.forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('fade-in');
      });
      const activeTab = document.getElementById(`${tabName}-tab`);
      if(activeTab) {
        activeTab.classList.remove('hidden');
        activeTab.classList.add('fade-in');
        setTimeout(() => {
          if(tabName === 'dashboard' && typeof loadDashboard === 'function') {
            loadDashboard();
            startDashboardRefresh();
          } else if(tabName === 'agents' && typeof loadAgentsTab === 'function') {
            loadAgentsTab();
            if(typeof stopDashboardRefresh === 'function') stopDashboardRefresh();
          } else if(tabName === 'tasks' && typeof loadTasksTab === 'function') {
            loadTasksTab();
            if(typeof stopDashboardRefresh === 'function') stopDashboardRefresh();
          } else if(tabName === 'settings' && typeof loadSettings === 'function') {
            loadSettings();
            if(typeof stopDashboardRefresh === 'function') stopDashboardRefresh();
          }
        }, 100);
      }
    });
  });
  
  document.getElementById('filter-category')?.addEventListener('change', () => {
    if(typeof renderKanbanBoard === 'function') renderKanbanBoard();
  });
  document.getElementById('filter-priority')?.addEventListener('change', () => {
    if(typeof renderKanbanBoard === 'function') renderKanbanBoard();
  });
  
  if(typeof loadDashboard === 'function') {
    loadDashboard();
    startDashboardRefresh();
  }
});
