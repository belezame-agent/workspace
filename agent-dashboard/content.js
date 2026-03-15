// Content Tab - Editorial Calendar & Production Tracker
const SUPABASE_URL = 'https://svdibokdzetmzivfvepf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2ZGlib2tkemV0bXppdmZ2ZXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODk0MDIsImV4cCI6MjA4OTA2NTQwMn0.seParGlECiuaV1CoJkQv3_V25z4E4rsS-jiTkVNrTjs';
let sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Make globally available for other files
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.sbClient = sbClient;
let contentTasks = [];
let productionFunnelChart = null;

async function loadContentTab() {
    if (!sbClient) return;
    const { data: tasks, error } = await sbClient.from('todos').select('*').order('due_date', { ascending: true });
    if (error) {
        console.error('Error loading content:', error);
        return;
    }
    contentTasks = tasks || [];
    renderContentStats();
    renderContentFeed();
}

function renderContentStats() {
    // Filter for content-heavy categories: Work, Marketing
    const contentCategories = ['Work', 'Marketing'];
    const contentTasksFiltered = contentTasks.filter(t => contentCategories.includes(t.category));
    
    // Production Funnel - status distribution
    const todoCount = contentTasksFiltered.filter(t => t.status === 'todo').length;
    const inProgressCount = contentTasksFiltered.filter(t => t.status === 'in_progress').length;
    const doneCount = contentTasksFiltered.filter(t => t.status === 'done').length;
    
    // Render funnel chart
    const ctx = document.getElementById('production-funnel-chart');
    if (ctx) {
        if (productionFunnelChart) productionFunnelChart.destroy();
        productionFunnelChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['To Do', 'In Progress', 'Done'],
                datasets: [{
                    data: [todoCount, inProgressCount, doneCount],
                    backgroundColor: ['#3B82F6', '#F59E0B', '#10B981'],
                    borderRadius: 6,
                    barThickness: 24
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { 
                        beginAtZero: true, 
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#9CA3AF' }
                    },
                    y: { 
                        grid: { display: false },
                        ticks: { color: '#E5E7EB', font: { weight: 'bold' } }
                    }
                }
            }
        });
    }
    
    // Risk Indicator
    const riskTasks = contentTasks.filter(t => t.track_status === 'At Risk' || t.track_status === 'Off Track');
    const riskCountEl = document.getElementById('content-risk-count');
    if (riskCountEl) {
        riskCountEl.textContent = riskTasks.length;
    }
    
    // Next Up - Urgent task with nearest due_date
    const urgentTasks = contentTasks
        .filter(t => t.priority === 'Urgent' && t.status !== 'done')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    
    const nextUpTitleEl = document.getElementById('next-up-title');
    const nextUpDateEl = document.getElementById('next-up-date');
    
    if (urgentTasks.length > 0) {
        const nextTask = urgentTasks[0];
        if (nextUpTitleEl) nextUpTitleEl.textContent = nextTask.title;
        if (nextUpDateEl) nextUpDateEl.textContent = `Due: ${formatDate(nextTask.due_date)}`;
    } else {
        if (nextUpTitleEl) nextUpTitleEl.textContent = '—';
        if (nextUpDateEl) nextUpDateEl.textContent = 'No urgent tasks';
    }
}

function renderContentFeed() {
    const listEl = document.getElementById('content-feed-list');
    if (!listEl) return;
    
    const categoryFilter = document.getElementById('content-filter-category')?.value || '';
    const statusFilter = document.getElementById('content-filter-status')?.value || '';
    const hideArchived = document.getElementById('content-filter-archived')?.checked || false;
    
    let filtered = [...contentTasks];
    
    // Sort content-heavy categories first
    const categoryOrder = { 'Work': 1, 'Marketing': 2, 'Development': 3, 'Personal': 4 };
    filtered.sort((a, b) => {
        const orderA = categoryOrder[a.category] || 5;
        const orderB = categoryOrder[b.category] || 5;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.due_date) - new Date(b.due_date);
    });
    
    if (categoryFilter) filtered = filtered.filter(t => t.category === categoryFilter);
    if (statusFilter) filtered = filtered.filter(t => t.status === statusFilter);
    if (hideArchived) filtered = filtered.filter(t => t.status !== 'done' || t.archived);
    
    if (filtered.length === 0) {
        listEl.innerHTML = '<p class="text-gray-400 text-center py-8">No content tasks found</p>';
        return;
    }
    
    listEl.innerHTML = filtered.map((task, idx) => renderContentRow(task, idx)).join('');
}

function renderContentRow(task, idx) {
    const priorityColors = {
        'Urgent': '#EF4444',
        'Normal': '#3B82F6',
        'Someday': '#6B7280'
    };
    
    const trackIcons = {
        'On Track': '✅',
        'At Risk': '⚠️',
        'Off Track': '🚨'
    };
    
    const categoryColors = {
        'Work': '#7C3AED',
        'Marketing': '#F59E0B',
        'Development': '#10B981',
        'Personal': '#06B6D4'
    };
    
    const borderColor = priorityColors[task.priority] || '#6B7280';
    const categoryColor = categoryColors[task.category] || '#6B7280';
    const trackIcon = trackIcons[task.track_status] || '✅';
    
    // Status options for dropdown
    const statusOptions = [
        { value: 'todo', label: 'To Do' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'done', label: 'Done' }
    ];
    
    const currentStatus = task.status || 'todo';
    
    return `
        <div class="content-row glass-card p-4 rounded-lg card-stagger" style="animation-delay: ${idx * 0.05}s; border-left: 4px solid ${borderColor};" data-task-id="${task.id}">
            <div class="flex items-center gap-4">
                <!-- Date Badge -->
                <div class="flex-shrink-0 w-16 text-center">
                    <span class="text-lg font-bold text-white">${formatDateShort(task.due_date)}</span>
                </div>
                
                <!-- Title & Category -->
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-white truncate">${task.title}</p>
                    <span class="inline-block px-2 py-0.5 rounded text-xs font-bold mt-1" style="background: rgba(${hexToRgb(categoryColor)}, 0.2); color: ${categoryColor};">${task.category}</span>
                </div>
                
                <!-- Track Status Icon -->
                <div class="flex-shrink-0 text-2xl" title="${task.track_status}">
                    ${trackIcon}
                </div>
                
                <!-- Status Toggle Dropdown -->
                <div class="flex-shrink-0">
                    <select onchange="updateContentStatus('${task.id}', this.value)" 
                            class="bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm text-white cursor-pointer hover:bg-white/20 transition"
                            style="min-width: 120px;">
                        ${statusOptions.map(opt => `
                            <option value="${opt.value}" ${currentStatus === opt.value ? 'selected' : ''}>${opt.label}</option>
                        `).join('')}
                    </select>
                </div>
                
                <!-- Edit Button -->
                <button onclick="editContentTask('${task.id}')" class="flex-shrink-0 px-3 py-1.5 rounded bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition text-sm">
                    ✏️
                </button>
            </div>
        </div>
    `;
}

async function updateContentStatus(taskId, newStatus) {
    if (!sbClient) return;
    
    const { error } = await sbClient.from('todos').update({ status: newStatus }).eq('id', taskId);
    if (error) {
        console.error('Error updating status:', error);
        return;
    }
    
    // Update local state
    contentTasks = contentTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    
    // Refresh stats and feed
    renderContentStats();
    renderContentFeed();
    
    // Also update Kanban if loaded
    if (typeof renderKanbanBoard === 'function') {
        loadTasksTab();
    }
    
    // Show quick feedback
    showToast('Status updated!');
}

function editContentTask(taskId) {
    const task = contentTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Use the existing edit modal from Kanban
    document.getElementById('edit-task-id').value = taskId;
    document.getElementById('edit-title').value = task.title;
    document.getElementById('edit-category').value = task.category;
    document.getElementById('edit-priority').value = task.priority;
    document.getElementById('edit-track-status').value = task.track_status;
    document.getElementById('edit-due-date').value = task.due_date;
    document.getElementById('edit-modal').classList.remove('hidden');
}

function showQuickAddForm() {
    document.getElementById('quick-add-modal').classList.remove('hidden');
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('quick-due-date').value = tomorrow.toISOString().split('T')[0];
}

function closeQuickAddModal() {
    document.getElementById('quick-add-modal').classList.add('hidden');
    document.getElementById('quick-title').value = '';
    document.getElementById('quick-priority').value = 'Normal';
}

async function saveQuickAdd(e) {
    e.preventDefault();
    if (!sbClient) return;
    
    const newTask = {
        title: document.getElementById('quick-title').value,
        category: document.getElementById('quick-category').value,
        priority: document.getElementById('quick-priority').value,
        due_date: document.getElementById('quick-due-date').value,
        status: 'todo',
        track_status: 'On Track',
        completed: false
    };
    
    const { data, error } = await sbClient.from('todos').insert(newTask).select();
    if (error) {
        console.error('Error adding task:', error);
        return;
    }
    
    if (data) {
        contentTasks.unshift(...data);
    }
    
    closeQuickAddModal();
    renderContentStats();
    renderContentFeed();
    showToast('Content idea added!');
}

async function batchArchiveDone() {
    if (!sbClient) return;
    
    const doneTasks = contentTasks.filter(t => t.status === 'done');
    if (doneTasks.length === 0) {
        showToast('No completed tasks to archive');
        return;
    }
    
    if (!confirm(`Archive ${doneTasks.length} completed tasks?`)) return;
    
    const taskIds = doneTasks.map(t => t.id);
    const { error } = await sbClient.from('todos').update({ archived: true }).in('id', taskIds);
    
    if (error) {
        console.error('Error archiving:', error);
        return;
    }
    
    contentTasks = contentTasks.map(t => taskIds.includes(t.id) ? { ...t, archived: true } : t);
    renderContentStats();
    renderContentFeed();
    showToast(`${doneTasks.length} tasks archived`);
}

function formatDate(dateStr) {
    if (!dateStr) return 'No date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '100, 100, 100';
}

function showToast(message) {
    // Simple toast notification
    const existing = document.getElementById('content-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'content-toast';
    toast.className = 'fixed bottom-20 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 2000);
}

// Auto-refresh content when tab is selected
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.nav-tab');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            if (tabName === 'content' && sbClient) {
                loadContentTab();
            }
        });
    });
    
    // Update saveTask to also refresh content tab
    const originalSaveTask = window.saveTask;
    window.saveTask = async function(e) {
        if (originalSaveTask) {
            await originalSaveTask(e);
        }
        // Refresh content tab if it exists
        if (document.getElementById('content-tab') && !document.getElementById('content-tab').classList.contains('hidden')) {
            loadContentTab();
        }
    };
});