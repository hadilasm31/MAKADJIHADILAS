// Gestionnaire Admin LAMITI SHOP
class AdminManager {
    constructor() {
        this.isAdmin = false;
        this.notifications = [];
        this.init();
    }

    init() {
        this.checkAdminSession();
        this.bindEvents();
        this.loadNotifications();
        
        if (this.isAdmin) {
            this.showDashboard();
            this.initAdminFeatures();
        }
    }

    // Vérification session admin
    checkAdminSession() {
        const adminSession = localStorage.getItem('lamiti-admin');
        if (adminSession) {
            try {
                const session = JSON.parse(adminSession);
                const now = new Date();
                const loginTime = new Date(session.loginTime);
                const sessionDuration = now - loginTime;
                
                if (sessionDuration < CONFIG.admin.sessionTimeout) {
                    this.isAdmin = true;
                    return true;
                } else {
                    localStorage.removeItem('lamiti-admin');
                }
            } catch (error) {
                localStorage.removeItem('lamiti-admin');
            }
        }
        return false;
    }

    // Connexion admin
    login(username, password) {
        if (username === CONFIG.admin.username && password === CONFIG.admin.password) {
            this.isAdmin = true;
            
            localStorage.setItem('lamiti-admin', JSON.stringify({
                username,
                loginTime: new Date().toISOString()
            }));
            
            this.showDashboard();
            window.shop.showNotification('Connexion admin réussie', 'success');
            return true;
        }
        
        window.shop.showNotification('Identifiants incorrects', 'error');
        return false;
    }

    logout() {
        this.isAdmin = false;
        localStorage.removeItem('lamiti-admin');
        location.reload();
    }

    // Affichage dashboard
    showDashboard() {
        const loginSection = document.getElementById('admin-login');
        const dashboardSection = document.getElementById('admin-dashboard');
        
        if (loginSection) loginSection.style.display = 'none';
        if (dashboardSection) dashboardSection.style.display = 'block';
        
        this.loadDashboardStats();
        this.initCharts();
    }

    // Événements
    bindEvents() {
        // Login form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('admin-username').value;
                const password = document.getElementById('admin-password').value;
                this.login(username, password);
            });
        }

        // Notifications admin
        document.addEventListener('adminNotification', (e) => {
            this.handleAdminNotification(e.detail);
        });

        // Mises à jour données
        document.addEventListener('shopDataUpdate', () => {
            if (this.isAdmin) {
                this.loadDashboardStats();
                this.updateCharts();
            }
        });
    }

    // Fonctionnalités admin
    initAdminFeatures() {
        this.setupNotificationSystem();
        this.startRealTimeUpdates();
    }

    // Notifications
    loadNotifications() {
        this.notifications = JSON.parse(localStorage.getItem('lamiti-notifications') || '[]');
        this.updateNotificationBadge();
    }

    addNotification(notification) {
        notification.id = Date.now();
        notification.timestamp = new Date().toISOString();
        notification.read = false;
        
        this.notifications.unshift(notification);
        
        // Garder seulement les 50 dernières
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }
        
        localStorage.setItem('lamiti-notifications', JSON.stringify(this.notifications));
        this.updateNotificationBadge();
        this.updateNotificationPanel();
        
        // Son de notification
        this.playNotificationSound();
        
        // Animation cloche
        this.animateNotificationBell();
    }

    handleAdminNotification(detail) {
        if (!this.isAdmin) return;
        
        let notification;
        
        switch (detail.type) {
            case 'new_order':
                notification = {
                    type: 'new_order',
                    title: 'Nouvelle commande !',
                    message: `Commande ${detail.order.id} de ${detail.order.customer.firstName} ${detail.order.customer.lastName} - ${window.shop.formatPrice(detail.order.total)}`,
                    orderId: detail.order.id,
                    orderTotal: detail.order.total
                };
                break;
                
            case 'low_stock':
                notification = {
                    type: 'low_stock',
                    title: 'Stock faible',
                    message: `Le produit "${detail.product.name}" est en stock faible (${detail.product.stock} restants)`,
                    productId: detail.product.id
                };
                break;
                
            default:
                return;
        }
        
        this.addNotification(notification);
        
        // Notification système
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico'
            });
        }
    }

    // Statistiques dashboard
    loadDashboardStats() {
        if (!window.shop) return;
        
        const stats = {
            'total-products': window.shop.products.length,
            'total-orders': window.shop.orders.length,
            'total-revenue': window.shop.orders.reduce((sum, order) => sum + order.total, 0),
            'low-stock-items': window.shop.getLowStockProducts().length,
            'pending-orders': window.shop.orders.filter(o => o.status === 'pending').length,
            'completed-orders': window.shop.orders.filter(o => o.status === 'delivered').length
        };

        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'total-revenue') {
                    element.textContent = window.shop.formatPrice(value);
                } else {
                    element.textContent = value;
                }
            }
        });
    }

    // Charts
    initCharts() {
        if (typeof echarts === 'undefined') return;
        
        this.initSalesChart();
        this.initCategoriesChart();
    }

    initSalesChart() {
        const chartEl = document.getElementById('sales-chart');
        if (!chartEl) return;
        
        const chart = echarts.init(chartEl);
        
        // Données exemple
        const option = {
            title: {
                text: 'Ventes des 6 derniers mois',
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            tooltip: { trigger: 'axis' },
            xAxis: {
                type: 'category',
                data: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                axisLabel: { fontSize: 12 }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    formatter: '{value} FCFA',
                    fontSize: 12
                }
            },
            series: [{
                data: [120000, 200000, 150000, 80000, 70000, 110000],
                type: 'line',
                smooth: true,
                itemStyle: { color: '#d4af37' },
                areaStyle: { color: 'rgba(212, 175, 55, 0.3)' }
            }],
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            }
        };
        
        chart.setOption(option);
        
        // Redimensionnement
        window.addEventListener('resize', () => chart.resize());
    }

    initCategoriesChart() {
        const chartEl = document.getElementById('categories-chart');
        if (!chartEl || !window.shop) return;
        
        const chart = echarts.init(chartEl);
        const categoryStats = window.shop.getCategoryStats();
        const chartData = Object.entries(categoryStats).map(([name, value]) => ({
            value,
            name: name.charAt(0).toUpperCase() + name.slice(1)
        }));

        const option = {
            title: {
                text: 'Répartition par catégorie',
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            tooltip: { trigger: 'item' },
            series: [{
                type: 'pie',
                radius: '50%',
                data: chartData,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };
        
        chart.setOption(option);
        window.addEventListener('resize', () => chart.resize());
    }

    updateCharts() {
        if (typeof echarts === 'undefined') return;
        
        const charts = ['sales-chart', 'categories-chart'];
        charts.forEach(id => {
            const chart = echarts.getInstanceByDom(document.getElementById(id));
            if (chart) {
                chart.resize();
            }
        });
    }

    // Gestion des produits (tableau)
    loadProductsTable() {
        if (!window.shop) return;
        
        const tableBody = document.getElementById('products-table-body');
        if (!tableBody) return;

        let html = '';
        
        window.shop.products.forEach(product => {
            const stockClass = product.stock < 5 ? 'text-red-600 font-semibold' : '';
            const statusClass = product.active ? 'status-confirmed' : 'status-cancelled';
            const statusText = product.active ? 'Actif' : 'Inactif';
            const toggleIcon = product.active ? '✅' : '⏸️';
            const saleStatus = product.onSale ? 'Oui' : 'Non';
            
            html += `
                <tr data-product-id="${product.id}">
                    <td>
                        <div class="table-image">
                            <img src="${product.images[0] || CONFIG.images.placeholder}" alt="${product.name}">
                        </div>
                    </td>
                    <td>
                        <div class="font-semibold">${product.name}</div>
                        <div class="text-sm text-gray-600">${product.description.substring(0, 50)}...</div>
                    </td>
                    <td class="capitalize">${product.category}</td>
                    <td class="font-semibold">${window.shop.formatPrice(product.price)}</td>
                    <td class="${stockClass}">${product.stock}</td>
                    <td>${saleStatus}</td>
                    <td>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit-btn" onclick="editProduct('${product.id}')" title="Modifier">✏️</button>
                            <button class="action-btn toggle-btn ${product.active ? 'active' : ''}" onclick="toggleProduct('${product.id}')" title="${product.active ? 'Désactiver' : 'Activer'}">
                                ${toggleIcon}
                            </button>
                            <button class="action-btn delete-btn" onclick="deleteProduct('${product.id}')" title="Supprimer">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    }

    // Gestion des commandes
    loadOrdersTable() {
        if (!window.shop) return;
        
        const tableBody = document.getElementById('orders-table-body');
        if (!tableBody) return;

        let html = '';
        
        window.shop.orders.forEach(order => {
            const paymentMethod = order.paymentMethod === 'card' ? 'Carte' : 'Mobile';
            
            html += `
                <tr data-order-id="${order.id}">
                    <td class="font-mono text-sm">${order.id}</td>
                    <td>
                        <div class="font-semibold">${order.customer.firstName} ${order.customer.lastName}</div>
                        <div class="text-sm text-gray-600">${order.customer.email}</div>
                    </td>
                    <td class="text-sm">${new Date(order.orderDate).toLocaleDateString('fr-FR')}</td>
                    <td class="font-semibold">${window.shop.formatPrice(order.total)}</td>
                    <td>
                        <span class="order-status status-${order.status}">
                            ${window.shop.getStatusLabel(order.status)}
                        </span>
                    </td>
                    <td>${paymentMethod}</td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit-btn" onclick="viewOrderDetails('${order.id}')" title="Voir détails">👁️</button>
                            <button class="action-btn edit-btn" onclick="openUpdateOrderStatusModal('${order.id}')" title="Mettre à jour">🔄</button>
                            <button class="action-btn delete-btn" onclick="deleteOrder('${order.id}')" title="Supprimer">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    }

    // Système de notifications
    setupNotificationSystem() {
        this.updateNotificationBadge();
        this.updateNotificationPanel();
        
        // Vérifier les nouvelles commandes
        setInterval(() => this.checkForNewOrders(), 5000);
    }

    checkForNewOrders() {
        if (!window.shop || !this.isAdmin) return;
        
        const lastCheck = localStorage.getItem('lamiti-last-order-check') || 0;
        const newOrders = window.shop.orders.filter(order => {
            const orderTime = new Date(order.orderDate).getTime();
            return orderTime > lastCheck && order.status === 'pending';
        });
        
        newOrders.forEach(order => {
            this.addNotification({
                type: 'new_order',
                title: 'Nouvelle commande !',
                message: `Nouvelle commande de ${order.customer.firstName} ${order.customer.lastName}`,
                orderId: order.id,
                orderTotal: order.total
            });
        });
        
        if (window.shop.orders.length > 0) {
            const latestOrder = window.shop.orders[window.shop.orders.length - 1];
            localStorage.setItem('lamiti-last-order-check', new Date(latestOrder.orderDate).getTime());
        }
    }

    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notification-count');
        const bell = document.getElementById('notification-bell');
        
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
        
        if (bell) {
            if (unreadCount > 0) {
                bell.classList.add('ringing');
            } else {
                bell.classList.remove('ringing');
            }
        }
    }

    updateNotificationPanel() {
        const container = document.getElementById('notifications-list');
        if (!container) return;
        
        const unreadNotifications = this.notifications.filter(n => !n.read);
        const readNotifications = this.notifications.filter(n => n.read);
        
        let html = '';
        
        // Non lues
        unreadNotifications.forEach(notification => {
            html += this.createNotificationHTML(notification, true);
        });
        
        // Lues
        readNotifications.forEach(notification => {
            html += this.createNotificationHTML(notification, false);
        });
        
        if (this.notifications.length === 0) {
            html = '<div class="notification-item text-center text-gray-500">Aucune notification</div>';
        }
        
        container.innerHTML = html;
    }

    createNotificationHTML(notification, isUnread) {
        const timeAgo = this.getTimeAgo(notification.timestamp);
        const orderLink = notification.orderId ? 
            `<span class="notification-item-order" onclick="viewOrderFromNotification('${notification.orderId}')">
                Voir la commande
            </span>` : '';
        
        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" onclick="markNotificationAsRead(${notification.id})">
                <div class="notification-item-title">
                    <span>${notification.title}</span>
                    <span class="notification-item-time">${timeAgo}</span>
                </div>
                <div class="notification-item-message">${notification.message}</div>
                ${orderLink}
            </div>
        `;
    }

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

    playNotificationSound() {
        try {
            const audio = new Audio(CONFIG.notifications.sound.src);
            audio.volume = CONFIG.notifications.sound.volume;
            audio.play().catch(e => console.log('Erreur audio admin:', e));
        } catch (error) {
            console.log('Audio admin non disponible');
        }
    }

    animateNotificationBell() {
        const bell = document.getElementById('notification-bell');
        if (bell) {
            bell.classList.add('ringing');
            setTimeout(() => bell.classList.remove('ringing'), 3000);
        }
    }

    // Mises à jour temps réel
    startRealTimeUpdates() {
        setInterval(() => this.checkRealTimeUpdates(), 3000);
    }

    checkRealTimeUpdates() {
        // Vérifier les mises à jour de statut
        const updatedOrders = JSON.parse(localStorage.getItem('lamiti-updated-orders') || '[]');
        
        updatedOrders.forEach(updatedOrder => {
            const existingOrder = window.shop.orders.find(o => o.id === updatedOrder.id);
            
            if (existingOrder && existingOrder.status !== updatedOrder.status) {
                this.addNotification({
                    type: 'order_update',
                    title: 'Mise à jour de commande',
                    message: `La commande ${updatedOrder.id} est maintenant "${window.shop.getStatusLabel(updatedOrder.status)}"`,
                    orderId: updatedOrder.id,
                    orderStatus: updatedOrder.status
                });
            }
        });
        
        localStorage.setItem('lamiti-updated-orders', JSON.stringify([]));
    }
}

// Initialisation admin
let adminManager = null;

document.addEventListener('DOMContentLoaded', () => {
    adminManager = new AdminManager();
    window.adminManager = adminManager;
});

// Fonctions globales admin
function toggleNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    if (panel) {
        panel.classList.toggle('show');
        
        if (panel.classList.contains('show') && adminManager) {
            adminManager.markAllNotificationsAsRead();
        }
    }
}

function markNotificationAsRead(notificationId) {
    if (adminManager) {
        adminManager.markNotificationAsRead(notificationId);
    }
}

function viewOrderFromNotification(orderId) {
    toggleNotificationPanel();
    
    // Naviguer vers la section commandes
    showSection('orders');
    
    // Ouvrir les détails
    setTimeout(() => {
        viewOrderDetails(orderId);
    }, 500);
}

function showSection(sectionName) {
    // Masquer toutes les sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section demandée
    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
        section.classList.add('active');
    }
    
    // Mettre à jour le menu
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.sidebar-link[onclick*="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Export pour tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminManager;
}
