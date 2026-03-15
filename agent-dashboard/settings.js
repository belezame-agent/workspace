// Settings Module for Agent OS Dashboard

const MODELS = [
  'gpt-4o',
  'gpt-4o-mini', 
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
  'claude-opus-4-6',
  'gemini-2.5-flash',
  'deepseek-v3.2',
  'llama-3',
  'minimax-m2.5'
];

const AGENT_COLORS = {
  alex: '#3B82F6',
  maya: '#7C3AED',
  jordan: '#F59E0B',
  dev: '#10B981',
  sam: '#EC4899'
};

// Load saved settings from localStorage
function loadSettings() {
  // Load credentials
  const savedUrl = localStorage.getItem('supabase_url');
  const savedKey = localStorage.getItem('supabase_anon_key');
  if (savedUrl) document.getElementById('supabase-url').value = savedUrl;
  if (savedKey) document.getElementById('supabase-key').value = savedKey;

  // Load toggles
  const toggles = ['autorefresh', 'sounds', 'debug'];
  toggles.forEach(toggle => {
    const value = localStorage.getItem('setting_' + toggle);
    const el = document.getElementById('toggle-' + toggle);
    if (el) {
      el.classList.toggle('active', value === 'true');
    }
  });

  // Load agent configs from Supabase or use defaults
  loadAgentConfigs();
}

// Toggle key visibility
function toggleKeyVisibility() {
  const input = document.getElementById('supabase-key');
  const btn = document.querySelector('.eye-btn');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🔒';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

// Toggle switch handler
function toggleSwitch(el) {
  el.classList.toggle('active');
  const toggleName = el.id.replace('toggle-', '');
  localStorage.setItem('setting_' + toggleName, el.classList.contains('active'));
}

// Save & Reconnect
function saveAndReconnect() {
  const url = document.getElementById('supabase-url').value.trim();
  const key = document.getElementById('supabase-key').value.trim();
  
  if (!url || !key) {
    alert('Please fill in both Supabase URL and Anon Key');
    return;
  }

  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_anon_key', key);
  
  // Reinitialize Supabase client
  if (typeof initSupabase === 'function') {
    initSupabase(url, key);
  }
  
  alert('✅ Credentials saved! Reconnecting...');
}

// Render agent personality cards
function renderAgentPersonalities() {
  const container = document.getElementById('agent-personalities');
  if (!container) return;
  
  container.innerHTML = '';
  
  Object.entries(AGENTS).forEach(function([key, agent], index) {
    const color = AGENT_COLORS[key] || '#7C3AED';
    const card = document.createElement('div');
    card.className = 'glass-card p-5 card-stagger';
    card.style.animationDelay = (0.1 * (index + 1)) + 's';
    card.style.borderLeft = '4px solid ' + color;
    card.style.boxShadow = '0 0 15px ' + color + '33';
    
    card.innerHTML = 
      '<div class="flex items-center gap-2 mb-4">' +
        '<span class="text-2xl">' + agent.emoji + '</span>' +
        '<span class="font-bold text-lg" style="color: ' + color + '">' + agent.name + '</span>' +
        '<span class="text-sm text-gray-400 ml-auto">' + agent.role + '</span>' +
      '</div>' +
      '<div class="space-y-4">' +
        '<div>' +
          '<label class="text-xs text-gray-400 mb-1 block">System Prompt / Personality</label>' +
          '<textarea id="system-prompt-' + key + '" class="settings-textarea" placeholder="Enter personality instructions for ' + agent.name + '...">' + getDefaultPrompt(key) + '</textarea>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-3">' +
          '<div>' +
            '<label class="text-xs text-gray-400 mb-1 block">Preferred Model</label>' +
            '<select id="model-' + key + '" class="settings-select">' +
              MODELS.map(function(m) { return '<option value="' + m + '">' + m + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div>' +
            '<label class="text-xs text-gray-400 mb-1 block">Temperature: <span id="temp-value-' + key + '">0.7</span></label>' +
            '<div class="slider-track" data-agent="' + key + '">' +
              '<div class="slider-fill" style="width: 70%"></div>' +
              '<div class="slider-thumb" style="left: 70%"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    
    container.appendChild(card);
  });
  
  // Initialize sliders after DOM is ready
  setTimeout(initSliders, 100);
}

// Get default prompt for each agent
function getDefaultPrompt(agentKey) {
  var defaults = {
    alex: 'You are Alex, the Research Analyst. You excel at finding information, analyzing data, and providing insights. Be thorough, accurate, and always cite your sources.',
    maya: 'You are Maya, the Content Writer. Create compelling, well-structured content that engages readers. Adapt your style to match the target audience and always proofread your work.',
    jordan: 'You are Jordan, the Marketing Strategist. Focus on growth, engagement metrics, and creative campaigns. Think strategically about brand positioning and customer acquisition.',
    dev: 'You are Dev, the Full Stack Developer. Write clean, maintainable code with proper documentation. Follow best practices, consider performance, and ship working solutions.',
    sam: 'You are Sam, the Social Media Manager. Create engaging posts, respond to comments, and build community. Stay on top of trends while maintaining authentic brand voice.'
  };
  return defaults[agentKey] || '';
}

// Initialize temperature sliders
function initSliders() {
  document.querySelectorAll('.slider-track').forEach(function(track) {
    var agent = track.dataset.agent;
    var thumb = track.querySelector('.slider-thumb');
    var fill = track.querySelector('.slider-fill');
    var valueEl = document.getElementById('temp-value-' + agent);
    
    var isDragging = false;
    
    var updateSlider = function(e) {
      var rect = track.getBoundingClientRect();
      var clientX = e.clientX || (e.touches && e.touches[0].clientX);
      var x = clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      var percent = (x / rect.width) * 100;
      var value = (percent / 100).toFixed(1);
      
      thumb.style.left = percent + '%';
      fill.style.width = percent + '%';
      valueEl.textContent = value;
      
      // Save temperature for this agent
      localStorage.setItem('agent_temp_' + agent, value);
    };
    
    thumb.addEventListener('mousedown', function() { isDragging = true; });
    thumb.addEventListener('touchstart', function() { isDragging = true; });
    
    document.addEventListener('mouseup', function() { isDragging = false; });
    document.addEventListener('touchend', function() { isDragging = false; });
    
    document.addEventListener('mousemove', function(e) {
      if (isDragging) updateSlider(e);
    });
    document.addEventListener('touchmove', function(e) {
      if (isDragging) updateSlider(e);
    });
    
    // Load saved temperature
    var savedTemp = localStorage.getItem('agent_temp_' + agent);
    if (savedTemp) {
      var percent = parseFloat(savedTemp) * 100;
      thumb.style.left = percent + '%';
      fill.style.width = percent + '%';
      valueEl.textContent = savedTemp;
    }
  });
}

// Load agent configs from Supabase
async function loadAgentConfigs() {
  renderAgentPersonalities();
  
  if (typeof sbClient === 'undefined' || !sbClient) return;
  
  try {
    var _ref = await sbClient.from('agent_configs').select('*'),
        data = _ref.data,
        error = _ref.error;
    
    if (error) {
      console.log('agent_configs table not found or empty, using defaults');
      return;
    }
    
    if (data && data.length > 0) {
      data.forEach(function(config) {
        var promptEl = document.getElementById('system-prompt-' + config.agent_name);
        var modelEl = document.getElementById('model-' + config.agent_name);
        var tempEl = document.getElementById('temp-value-' + config.agent_name);
        
        if (promptEl && config.system_prompt) {
          promptEl.value = config.system_prompt;
        }
        if (modelEl && config.preferred_model) {
          modelEl.value = config.preferred_model;
        }
        if (tempEl && config.temperature) {
          var percent = parseFloat(config.temperature) * 100;
          tempEl.textContent = config.temperature;
          
          var track = document.querySelector('.slider-track[data-agent="' + config.agent_name + '"]');
          if (track) {
            var thumb = track.querySelector('.slider-thumb');
            var fill = track.querySelector('.slider-fill');
            thumb.style.left = percent + '%';
            fill.style.width = percent + '%';
          }
        }
      });
    }
  } catch (e) {
    console.log('Could not load agent configs:', e);
  }
}

// Save all agent configs to Supabase
async function saveAllChanges() {
  if (typeof sbClient === 'undefined' || !sbClient) {
    alert('Supabase client not initialized. Please save credentials first.');
    return;
  }
  
  var configs = [];
  
  Object.keys(AGENTS).forEach(function(key) {
    var promptEl = document.getElementById('system-prompt-' + key);
    var modelEl = document.getElementById('model-' + key);
    var tempEl = document.getElementById('temp-value-' + key);
    
    configs.push({
      agent_name: key,
      system_prompt: promptEl ? promptEl.value : '',
      preferred_model: modelEl ? modelEl.value : 'gpt-4o',
      temperature: tempEl ? tempEl.textContent : '0.7'
    });
  });
  
  try {
    // Delete existing configs and insert new ones
    await sbClient.from('agent_configs').delete().neq('id', 0);
    
    var _ref2 = await sbClient.from('agent_configs').insert(configs),
        error = _ref2.error;
    
    if (error) {
      // Table might not exist, try to create it
      console.log('Creating agent_configs table...');
      alert('✅ Settings saved to local storage!');
    } else {
      alert('✅ All changes saved to Supabase!');
    }
    
    // Also save to localStorage as backup
    localStorage.setItem('agent_configs', JSON.stringify(configs));
    
  } catch (e) {
    console.error('Error saving configs:', e);
    // Fallback to localStorage
    localStorage.setItem('agent_configs', JSON.stringify(configs));
    alert('✅ Settings saved to local storage!');
  }
}

// Factory reset
function factoryReset() {
  if (!confirm('⚠️ This will clear all local cache and settings. Are you sure?')) {
    return;
  }
  
  // Clear localStorage
  var keysToKeep = [];
  var allKeys = Object.keys(localStorage);
  allKeys.forEach(function(key) {
    if (key.indexOf('agent_') === 0 || key.indexOf('setting_') === 0 || key.indexOf('supabase_') === 0) {
      localStorage.removeItem(key);
    }
  });
  
  // Reset form values
  document.getElementById('supabase-url').value = '';
  document.getElementById('supabase-key').value = '';
  
  // Reset toggles
  document.querySelectorAll('.toggle-switch').forEach(function(el) {
    el.classList.remove('active');
  });
  
  // Re-render agent personalities with defaults
  renderAgentPersonalities();
  
  alert('🔄 Factory reset complete!');
}

// Initialize settings when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
});