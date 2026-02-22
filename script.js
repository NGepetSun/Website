/**
 * =====================================================
 * MultiWatch - YouTube Multi-Stream Viewer
 * =====================================================
 *
 * CONFIGURATION:
 * Edit the DEFAULT_CHANNELS array below to set which
 * YouTube channels/streams appear automatically when
 * the page loads.
 *
 * Each channel entry supports:
 *   - name: Display name for the channel
 *   - videoId: YouTube video ID (from URL after v=)
 *   - type: "live" | "video" | "channel"
 *
 * You can use:
 *   1. Video IDs:      "dQw4w9WgXcQ"
 *   2. Full URLs:       Parsed automatically
 *   3. Live stream IDs: YouTube live stream video IDs
 *
 * =====================================================
 */

// ============================================================
// DEFAULT CHANNELS CONFIGURATION
// Edit this array to set your preferred YouTube streams/videos
// ============================================================
const DEFAULT_CHANNELS = [
    {
        name: "Lofi Girl",
        videoId: "jfKfPfyJRdk",
        type: "live"
    },
    {
        name: "NASA Live",
        videoId: "21X5lGlDOfg",
        type: "live"
    },
    {
        name: "NHK World Japan",
        videoId: "f0lYkdA-Bf0",
        type: "live"
    },
    {
        name: "DW News",
        videoId: "GE_SfNVNyqk",
        type: "live"
    },
    {
        name: "Al Jazeera English",
        videoId: "gCNeDWCI0vo",
        type: "live"
    },
    {
        name: "France 24 English",
        videoId: "h3MuIUNCCzI",
        type: "live"
    },
    {
        name: "ABC News Australia",
        videoId: "vOTiJkg1voo",
        type: "live"
    },
    {
        name: "Sky News",
        videoId: "9Auq9mYxFEE",
        type: "live"
    },
    {
        name: "Bloomberg TV",
        videoId: "dp8PhLsUcFE",
        type: "live"
    }
];
// ============================================================
// END CONFIGURATION
// ============================================================


/**
 * Application State
 */
const state = {
    activeStreams: [],
    currentLayout: 'grid-2x2',
    sidebarOpen: true,
    theme: localStorage.getItem('multiwatch-theme') || 'dark'
};

/**
 * DOM References
 */
const elements = {
    videoGrid: document.getElementById('videoGrid'),
    channelList: document.getElementById('channelList'),
    channelCount: document.getElementById('channelCount'),
    emptyState: document.getElementById('emptyState'),
    gridContainer: document.getElementById('gridContainer'),
    customUrl: document.getElementById('customUrl'),
    addCustomStream: document.getElementById('addCustomStream'),
    loadDefaults: document.getElementById('loadDefaults'),
    removeAll: document.getElementById('removeAll'),
    toggleSidebar: document.getElementById('toggleSidebar'),
    toggleTheme: document.getElementById('toggleTheme'),
    sidebar: document.getElementById('sidebar'),
    toastContainer: document.getElementById('toastContainer'),
    layoutBtns: document.querySelectorAll('.layout-btn'),
    rotatePrompt: document.getElementById('rotatePrompt'),
    dismissRotate: document.getElementById('dismissRotate')
};

/**
 * Initialize the application
 */
function init() {
    // Apply saved theme
    applyTheme(state.theme);

    // Render channel list
    renderChannelList();

    // Set up event listeners
    setupEventListeners();

    // Set up landscape/orientation features
    setupLandscapeFeatures();

    // Auto-load streams from saved state or defaults
    const savedStreams = loadFromStorage();
    if (savedStreams && savedStreams.length > 0) {
        savedStreams.forEach(stream => addStream(stream, false));
    }

    updateUI();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Layout switcher
    elements.layoutBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const layout = btn.dataset.layout;
            setLayout(layout);
        });
    });

    // Add custom stream
    elements.addCustomStream.addEventListener('click', handleAddCustom);
    elements.customUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddCustom();
    });

    // Load defaults
    elements.loadDefaults.addEventListener('click', loadDefaultChannels);

    // Remove all
    elements.removeAll.addEventListener('click', removeAllStreams);

    // Toggle sidebar
    elements.toggleSidebar.addEventListener('click', toggleSidebar);

    // Toggle theme
    elements.toggleTheme.addEventListener('click', toggleTheme);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

/**
 * Extract video ID from various YouTube URL formats
 */
function extractVideoId(input) {
    if (!input) return null;

    input = input.trim();

    // Already a video ID (11 chars alphanumeric with - and _)
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
        return input;
    }

    // Standard YouTube URLs
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) return match[1];
    }

    return null;
}

/**
 * Add a stream to the grid
 */
function addStream(channel, showToast = true) {
    // Check if already active
    if (state.activeStreams.find(s => s.videoId === channel.videoId)) {
        if (showToast) toast('Stream is already active', 'info');
        return;
    }

    // Check max streams based on layout
    const maxStreams = getMaxStreams();
    if (state.activeStreams.length >= maxStreams) {
        if (showToast) toast(`Maximum ${maxStreams} streams for this layout`, 'error');
        return;
    }

    state.activeStreams.push({ ...channel });
    saveToStorage();
    updateUI();
    if (showToast) toast(`Added: ${channel.name}`, 'success');
}

/**
 * Remove a stream from the grid
 */
function removeStream(videoId) {
    const stream = state.activeStreams.find(s => s.videoId === videoId);
    state.activeStreams = state.activeStreams.filter(s => s.videoId !== videoId);
    saveToStorage();
    updateUI();
    if (stream) toast(`Removed: ${stream.name}`, 'info');
}

/**
 * Remove all active streams
 */
function removeAllStreams() {
    if (state.activeStreams.length === 0) return;
    state.activeStreams = [];
    saveToStorage();
    updateUI();
    toast('All streams removed', 'info');
}

/**
 * Load default channels
 */
function loadDefaultChannels() {
    state.activeStreams = [];
    const maxStreams = getMaxStreams();
    const channelsToLoad = DEFAULT_CHANNELS.slice(0, maxStreams);
    channelsToLoad.forEach(ch => {
        state.activeStreams.push({ ...ch });
    });
    saveToStorage();
    updateUI();
    toast(`Loaded ${channelsToLoad.length} default channels`, 'success');
}

/**
 * Handle adding a custom stream from the input
 */
function handleAddCustom() {
    const input = elements.customUrl.value.trim();
    if (!input) {
        toast('Please enter a YouTube URL or Video ID', 'error');
        return;
    }

    const videoId = extractVideoId(input);
    if (!videoId) {
        toast('Invalid YouTube URL or Video ID', 'error');
        return;
    }

    // Check if it matches a default channel
    const defaultMatch = DEFAULT_CHANNELS.find(ch => ch.videoId === videoId);
    const channel = defaultMatch || {
        name: `Stream ${videoId.substring(0, 6)}...`,
        videoId: videoId,
        type: 'video'
    };

    addStream(channel);
    elements.customUrl.value = '';
}

/**
 * Get maximum streams for current layout
 */
function getMaxStreams() {
    const layoutMax = {
        'grid-2x2': 4,
        'grid-1x2': 2,
        'grid-1x3': 3,
        'grid-focus': 5,
        'grid-3x3': 9
    };
    return layoutMax[state.currentLayout] || 4;
}

/**
 * Set the grid layout
 */
function setLayout(layout) {
    state.currentLayout = layout;

    // Update layout buttons
    elements.layoutBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.layout === layout);
    });

    // Apply layout class
    elements.videoGrid.className = `video-grid ${layout}`;

    // Trim active streams if exceeding new layout max
    const max = getMaxStreams();
    if (state.activeStreams.length > max) {
        state.activeStreams = state.activeStreams.slice(0, max);
        saveToStorage();
    }

    updateUI();
}

/**
 * Update the entire UI
 */
function updateUI() {
    renderVideoGrid();
    renderChannelList();
    updateEmptyState();
}

/**
 * Render the video grid with iframes
 */
function renderVideoGrid() {
    elements.videoGrid.innerHTML = '';

    state.activeStreams.forEach(stream => {
        const cell = document.createElement('div');
        cell.className = 'video-cell';

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${stream.videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';

        const overlay = document.createElement('div');
        overlay.className = 'video-overlay';

        const label = document.createElement('div');
        label.className = 'video-label';
        if (stream.type === 'live') {
            label.innerHTML = `<span class="live-dot"></span> LIVE`;
        }
        label.innerHTML += ` ${escapeHtml(stream.name)}`;

        const rightActions = document.createElement('div');
        rightActions.style.cssText = 'display: flex; align-items: center; gap: 4px;';

        // Fullscreen landscape button
        const landscapeBtn = document.createElement('button');
        landscapeBtn.className = 'video-landscape-btn';
        landscapeBtn.title = 'Watch in landscape fullscreen';
        landscapeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M3 8V5C3 3.9 3.9 3 5 3H8M16 3H19C20.1 3 21 3.9 21 5V8M21 16V19C21 20.1 20.1 21 19 21H16M8 21H5C3.9 21 3 20.1 3 19V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        landscapeBtn.addEventListener('click', () => toggleFullscreenLandscape(cell, stream.videoId));

        const closeBtn = document.createElement('button');
        closeBtn.className = 'video-close';
        closeBtn.title = 'Remove stream';
        closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        closeBtn.addEventListener('click', () => removeStream(stream.videoId));

        rightActions.appendChild(landscapeBtn);
        rightActions.appendChild(closeBtn);

        overlay.appendChild(label);
        overlay.appendChild(rightActions);
        cell.appendChild(iframe);
        cell.appendChild(overlay);
        elements.videoGrid.appendChild(cell);
    });

    // After rendering, check orientation
    checkOrientation();
}

/**
 * Render the sidebar channel list
 */
function renderChannelList() {
    elements.channelList.innerHTML = '';
    elements.channelCount.textContent = DEFAULT_CHANNELS.length;

    DEFAULT_CHANNELS.forEach(channel => {
        const isActive = state.activeStreams.some(s => s.videoId === channel.videoId);
        const item = document.createElement('div');
        item.className = `channel-item${isActive ? ' active' : ''}`;

        const initials = channel.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

        item.innerHTML = `
            <div class="channel-avatar">
                ${initials}
                <div class="channel-status"></div>
            </div>
            <div class="channel-info">
                <div class="channel-name">${escapeHtml(channel.name)}</div>
                <div class="channel-type">${channel.type === 'live' ? 'Live Stream' : 'Video'}</div>
            </div>
            <div class="channel-actions">
                ${isActive ? `
                    <button class="channel-action-btn" title="Remove">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    </button>
                ` : `
                    <button class="channel-action-btn" title="Add" style="background: var(--accent); color: white; border-color: var(--accent);">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    </button>
                `}
            </div>
        `;

        // Click on channel item
        item.addEventListener('click', (e) => {
            if (e.target.closest('.channel-action-btn') || e.target.closest('.channel-actions')) return;
            if (isActive) {
                removeStream(channel.videoId);
            } else {
                addStream(channel);
            }
        });

        // Click action button
        const actionBtn = item.querySelector('.channel-action-btn');
        if (actionBtn) {
            actionBtn.addEventListener('click', () => {
                if (isActive) {
                    removeStream(channel.videoId);
                } else {
                    addStream(channel);
                }
            });
        }

        elements.channelList.appendChild(item);
    });
}

/**
 * Update empty state visibility
 */
function updateEmptyState() {
    if (state.activeStreams.length > 0) {
        elements.emptyState.classList.add('hidden');
        elements.videoGrid.style.display = 'grid';
    } else {
        elements.emptyState.classList.remove('hidden');
        elements.videoGrid.style.display = 'none';
    }
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    state.sidebarOpen = !state.sidebarOpen;
    elements.sidebar.classList.toggle('collapsed', !state.sidebarOpen);
}

/**
 * Toggle theme
 */
function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
    localStorage.setItem('multiwatch-theme', state.theme);
}

/**
 * Apply theme
 */
function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboard(e) {
    // Ignore when typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
        case '1': setLayout('grid-2x2'); break;
        case '2': setLayout('grid-1x2'); break;
        case '3': setLayout('grid-1x3'); break;
        case '4': setLayout('grid-focus'); break;
        case '5': setLayout('grid-3x3'); break;
        case 's':
        case 'S':
            toggleSidebar();
            break;
        case 't':
        case 'T':
            toggleTheme();
            break;
        case 'd':
        case 'D':
            loadDefaultChannels();
            break;
        case 'f':
        case 'F':
            // Fullscreen first video cell
            const firstCell = document.querySelector('.video-cell');
            if (firstCell) toggleFullscreenLandscape(firstCell);
            break;
        case 'Escape':
            // Exit any fullscreen landscape
            const fsCell = document.querySelector('.video-cell.fullscreen-landscape');
            if (fsCell) exitFullscreenLandscape(fsCell);
            break;
    }
}

/**
 * Show toast notification
 */
function toast(message, type = 'info') {
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${type}`;

    const icons = {
        success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#2ed573" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#ff4757" stroke-width="2"/><path d="M15 9L9 15M9 9L15 15" stroke="#ff4757" stroke-width="2" stroke-linecap="round"/></svg>',
        info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#6c5ce7" stroke-width="2"/><path d="M12 16V12M12 8H12.01" stroke="#6c5ce7" stroke-width="2" stroke-linecap="round"/></svg>'
    };

    toastEl.innerHTML = `${icons[type] || icons.info} <span>${escapeHtml(message)}</span>`;
    elements.toastContainer.appendChild(toastEl);

    setTimeout(() => {
        toastEl.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toastEl.remove(), 300);
    }, 3000);
}

/**
 * Save state to localStorage
 */
function saveToStorage() {
    try {
        localStorage.setItem('multiwatch-streams', JSON.stringify(state.activeStreams));
    } catch (e) {
        // localStorage not available
    }
}

/**
 * Load state from localStorage
 */
function loadFromStorage() {
    try {
        const data = localStorage.getItem('multiwatch-streams');
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Setup landscape orientation features
 */
function setupLandscapeFeatures() {
    // Dismiss rotate prompt
    if (elements.dismissRotate) {
        elements.dismissRotate.addEventListener('click', () => {
            elements.rotatePrompt.classList.remove('visible');
            sessionStorage.setItem('multiwatch-rotate-dismissed', 'true');
        });
    }

    // Show rotate prompt on mobile portrait if streams are active
    checkOrientation();
    window.addEventListener('orientationchange', checkOrientation);
    if (screen.orientation) {
        screen.orientation.addEventListener('change', checkOrientation);
    }
    window.addEventListener('resize', checkOrientation);

    // Listen for fullscreen changes to restore state
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
}

/**
 * Check device orientation and show rotate prompt if needed
 */
function checkOrientation() {
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
    const isPortrait = window.innerHeight > window.innerWidth;
    const dismissed = sessionStorage.getItem('multiwatch-rotate-dismissed');

    if (isMobile && isPortrait && state.activeStreams.length > 0 && !dismissed) {
        elements.rotatePrompt.classList.add('visible');
    } else {
        elements.rotatePrompt.classList.remove('visible');
    }
}

/**
 * Toggle fullscreen landscape mode for a video cell
 */
function toggleFullscreenLandscape(videoCell, videoId) {
    if (videoCell.classList.contains('fullscreen-landscape')) {
        exitFullscreenLandscape(videoCell);
    } else {
        enterFullscreenLandscape(videoCell);
    }
}

/**
 * Enter fullscreen landscape mode
 */
function enterFullscreenLandscape(videoCell) {
    // Try native fullscreen API first
    const elem = videoCell;
    const requestFullscreen = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreens || elem.msRequestFullscreen;

    if (requestFullscreen) {
        requestFullscreen.call(elem).then(() => {
            // Try to lock orientation to landscape
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {
                    // Orientation lock not supported or not allowed — fall back gracefully
                });
            }
        }).catch(() => {
            // Fullscreen not available — use CSS-based fullscreen
            videoCell.classList.add('fullscreen-landscape');
            document.body.style.overflow = 'hidden';
        });
    } else {
        // Fallback: CSS fullscreen
        videoCell.classList.add('fullscreen-landscape');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Exit fullscreen landscape mode
 */
function exitFullscreenLandscape(videoCell) {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        const exitFn = document.exitFullscreen || document.webkitExitFullscreen;
        if (exitFn) {
            exitFn.call(document).catch(() => {});
        }
    }

    videoCell.classList.remove('fullscreen-landscape');
    document.body.style.overflow = '';

    // Unlock orientation
    if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
    }
}

/**
 * Handle fullscreen change events
 */
function handleFullscreenChange() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        // Exited fullscreen — clean up any fullscreen-landscape classes
        const fullscreenCells = document.querySelectorAll('.video-cell.fullscreen-landscape');
        fullscreenCells.forEach(cell => {
            cell.classList.remove('fullscreen-landscape');
        });
        document.body.style.overflow = '';

        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    }
}

// ============================================================
// Initialize the app
// ============================================================
document.addEventListener('DOMContentLoaded', init);
