// Admin functionality for LAMITI SHOP
class AdminManager {
    constructor() {
        this.isAdmin = false;
        this.notifications = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAdminSession();
        this.loadNotifications();
    }

    bindEvents() {
        // Login form submission
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }

        // Login button click
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }

        // Enter key in login form
        const usernameInput = document.getElementById('admin-username');
        const passwordInput = document.getElementById('admin-password');
        
        if (usernameInput && passwordInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleAdminLogin();
                }
            });
            
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleAdminLogin();
                }
            });
        }
        
        // Listen for data updates
        document.addEventListener('shopDataUpdate', () => {
            if (this.isAdmin) {
                this.loadDashboardStats();
                this.updateCategoriesChart();
                this.loadCustomerStats();
                this.updateNotificationPanel();
            }
        });
        
        // Initialize notification system
        this.initializeNotificationSystem();
    }

    // Initialize notification system
    initializeNotificationSystem() {
        // Load notifications
        this.loadNotifications();
        
        // Check for new notifications every 3 seconds
        setInterval(() => {
            this.checkNewNotifications();
        }, 3000);
        
        // Update notification bell
        this.updateNotificationBell();
    }

    // Load notifications from localStorage
    loadNotifications() {
        this.notifications = JSON.parse(localStorage.getItem('lamiti-notifications')) || [];
    }

    // Check for new notifications
    checkNewNotifications() {
        const oldCount = this.notifications.length;
        const newNotifications = JSON.parse(localStorage.getItem('lamiti-notifications')) || [];
        
        if (newNotifications.length > oldCount) {
            // New notifications found
            this.notifications = newNotifications;
            
            // Play notification sound
            this.playNotificationSound();
            
            // Update UI
            this.updateNotificationBell();
            this.updateNotificationPanel();
            
            // Trigger bell animation
            this.triggerBellAnimation();
        }
    }

    // Play notification sound
    playNotificationSound() {
        const notificationSound = document.getElementById('notification-sound');
        if (notificationSound) {
            notificationSound.currentTime = 0;
            notificationSound.play().catch(e => {
                console.log('Audio playback failed:', e);
            });
        }
    }

    // Trigger bell animation
    triggerBellAnimation() {
        const bell = document.getElementById('notification-bell');
        if (bell) {
            bell.classList.add('ringing');
            
            // Stop animation after 3 seconds
            setTimeout(() => {
                bell.classList.remove('ringing');
            }, 3000);
        }
    }

    // Update notification bell
    updateNotificationBell() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notification-count');
        const bell = document.getElementById('notification-bell');
        
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
        
        if (bell && unreadCount > 0) {
            bell.classList.add('ringing');
        } else if (bell) {
            bell.classList.remove('ringing');
        }
    }

    // Update notification panel
    updateNotificationPanel() {
        const container = document.getElementById('notifications-list');
        if (!container) return;
        
        const unreadNotifications = this.notifications.filter(n => !n.read);
        const readNotifications = this.notifications.filter(n => n.read);
        
        let html = '';
        
        // Unread notifications
        unreadNotifications.forEach((notification, index) => {
            html += this.createNotificationHTML(notification, index, true);
        });
        
        // Read notifications
        readNotifications.forEach((notification, index) => {
            html += this.createNotificationHTML(notification, index + unreadNotifications.length, false);
        });
        
        if (this.notifications.length === 0) {
            html = `
                <div class="notification-item" style="text-align: center; color: #666;">
                    Aucune notification
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    // Create notification HTML
    createNotificationHTML(notification, index, isUnread) {
        const timeAgo = this.getTimeAgo(notification.timestamp);
        
        let actionButton = '';
        if (notification.type === 'new_order' && notification.data.orderId) {
            actionButton = `
                <button onclick="viewOrderFromNotification('${notification.data.orderId}')" 
                        class="text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                    Voir la commande
                </button>
            `;
        } else if (notification.type === 'cart_add' && notification.data.productId) {
            actionButton = `
                <button onclick="viewProductFromNotification('${notification.data.productId}')" 
                        class="text-sm bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                    Voir le produit
                </button>
            `;
        }
        
        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" onclick="markNotificationAsRead(${index})">
                <div class="notification-item-title">
                    <span>${notification.title}</span>
                    <span class="notification-item-time">${timeAgo}</span>
                </div>
                <div class="notification-item-message">${notification.message}</div>
                ${actionButton}
            </div>
        `;
    }

    // Get time ago
    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours} h`;
        if (diffDays < 7) return `Il y a ${diffDays} j`;
        return past.toLocaleDateString('fr-FR');
    }

    // Mark notification as read
    markNotificationAsRead(index) {
        if (this.notifications[index]) {
            this.notifications[index].read = true;
            localStorage.setItem('lamiti-notifications', JSON.stringify(this.notifications));
            this.updateNotificationBell();
            this.updateNotificationPanel();
        }
    }

    // Mark all notifications as read
    markAllNotificationsAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        localStorage.setItem('lamiti-notifications', JSON.stringify(this.notifications));
        this.updateNotificationBell();
        this.updateNotificationPanel();
    }

    // Clear all notifications
    clearAllNotifications() {
        if (confirm('Êtes-vous sûr de vouloir effacer toutes les notifications ?')) {
            this.notifications = [];
            localStorage.setItem('lamiti-notifications', JSON.stringify(this.notifications));
            this.updateNotificationBell();
            this.updateNotificationPanel();
        }
    }

    // Toggle notification panel
    toggleNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        if (panel) {
            panel.classList.toggle('show');
            
            if (panel.classList.contains('show')) {
                // Mark all as read when opening panel
                this.markAllNotificationsAsRead();
            }
        }
    }

    checkAdminSession() {
        const adminSession = localStorage.getItem('lamiti-admin');
        if (adminSession) {
            try {
                const session = JSON.parse(adminSession);
                const now = new Date();
                const loginTime = new Date(session.loginTime);
                const sessionDuration = now - loginTime;
                
                // Check if session is still valid (1 hour)
                if (sessionDuration < 3600000) {
                    this.isAdmin = true;
                    this.showAdminDashboard();
                    this.loadAdminContent();
                } else {
                    // Session expired
                    localStorage.removeItem('lamiti-admin');
                }
            } catch (error) {
                console.error('Invalid admin session:', error);
                localStorage.removeItem('lamiti-admin');
            }
        }
    }

    handleAdminLogin() {
        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value.trim();

        // Simple admin authentication (demo)
        if (username === 'admin' && password === 'lamiti2024') {
            this.isAdmin = true;
            
            // Save admin session
            localStorage.setItem('lamiti-admin', JSON.stringify({
                username,
                loginTime: new Date().toISOString()
            }));
            
            this.showAdminDashboard();
            this.showNotification('Connexion admin réussie!', 'success');
            this.loadAdminContent();
        } else {
            this.showNotification('Identifiants incorrects!', 'error');
            
            // Add shake animation to form
            const loginContainer = document.querySelector('.login-container');
            if (loginContainer) {
                loginContainer.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    loginContainer.style.animation = '';
                }, 500);
            }
        }
    }

    showAdminDashboard() {
        const loginSection = document.getElementById('admin-login');
        const dashboardSection = document.getElementById('admin-dashboard');
        
        if (loginSection && dashboardSection) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
        }
    }

    loadAdminContent() {
        // Load dashboard stats
        this.loadDashboardStats();
        
        // Initialize charts
        this.initializeCharts();
        
        // Load products
        this.loadAdminProducts();
        this.loadMobileProducts();
        
        // Load categories
        this.loadAdminCategories();
        
        // Load orders
        this.loadAdminOrders();
        this.loadMobileOrders();
        
        // Load customers
        this.loadAdminCustomers();
        this.loadMobileCustomers();
        
        // Load customer stats
        this.loadCustomerStats();
        
        // Load low stock
        this.loadLowStockProducts();
        this.loadMobileLowStock();
        
        // Load notifications
        this.updateNotificationPanel();
    }

    // Reste du code inchangé...
    // ... [Le reste du code reste identique à l'original]
}

// Initialize admin manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});

// Global functions for notifications
function toggleNotificationPanel() {
    if (window.adminManager) {
        window.adminManager.toggleNotificationPanel();
    }
}

function markNotificationAsRead(index) {
    if (window.adminManager) {
        window.adminManager.markNotificationAsRead(index);
    }
}

function markAllNotificationsAsRead() {
    if (window.adminManager) {
        window.adminManager.markAllNotificationsAsRead();
    }
}

function clearAllNotifications() {
    if (window.adminManager) {
        window.adminManager.clearAllNotifications();
    }
}

function viewOrderFromNotification(orderId) {
    // Close notification panel
    toggleNotificationPanel();
    
    // Show orders section
    showSection('orders');
    
    // Find and highlight the order
    setTimeout(() => {
        const orderRow = document.querySelector(`[data-order-id="${orderId}"]`);
        if (orderRow) {
            // Scroll to the order
            orderRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight the order
            orderRow.style.backgroundColor = '#fff3cd';
            setTimeout(() => {
                orderRow.style.backgroundColor = '';
            }, 3000);
            
            // Open order details
            viewOrderDetails(orderId);
        } else {
            // If order not found in current view, reload orders
            if (window.adminManager) {
                window.adminManager.loadAdminOrders();
                window.adminManager.loadMobileOrders();
            }
            setTimeout(() => {
                viewOrderFromNotification(orderId);
            }, 500);
        }
    }, 500);
}

function viewProductFromNotification(productId) {
    // Close notification panel
    toggleNotificationPanel();
    
    // Show products section
    showSection('products');
    
    // Find and highlight the product
    setTimeout(() => {
        const productRow = document.querySelector(`[data-product-id="${productId}"]`);
        if (productRow) {
            // Scroll to the product
            productRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight the product
            productRow.style.backgroundColor = '#d4edda';
            setTimeout(() => {
                productRow.style.backgroundColor = '';
            }, 3000);
            
            // Open product edit
            editProduct(productId);
        } else {
            // If product not found in current view, reload products
            if (window.adminManager) {
                window.adminManager.loadAdminProducts();
                window.adminManager.loadMobileProducts();
            }
            setTimeout(() => {
                viewProductFromNotification(productId);
            }, 500);
        }
    }, 500);
}
