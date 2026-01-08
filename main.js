// LAMITI SHOP - Main JavaScript
class LamitiShop {
    constructor() {
        this.products = [];
        this.cart = JSON.parse(localStorage.getItem('lamiti-cart')) || [];
        this.orders = JSON.parse(localStorage.getItem('lamiti-orders')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('lamiti-user')) || null;
        this.isAdmin = false;
        
        // Load categories from localStorage or use defaults
        const savedCategories = localStorage.getItem('lamiti-categories');
        const savedSubcategories = localStorage.getItem('lamiti-subcategories');
        const savedCategoryImages = localStorage.getItem('lamiti-category-images');
        
        this.categories = savedCategories ? JSON.parse(savedCategories) : ['femmes', 'hommes', 'accessoires'];
        this.subcategories = savedSubcategories ? JSON.parse(savedSubcategories) : {
            'femmes': ['robes', 'vestes', 'pantalons', 'chaussures'],
            'hommes': ['chemises', 'pantalons', 'vestes', 'chaussures'],
            'accessoires': ['sacs', 'montres', 'lunettes', 'bijoux']
        };
        
        this.categoryImages = savedCategoryImages ? JSON.parse(savedCategoryImages) : {};
        
        // Notification system
        this.notifications = JSON.parse(localStorage.getItem('lamiti-notifications')) || [];
        
        this.init();
    }

    init() {
        this.loadProducts();
        this.initializeAnimations();
        this.bindEvents();
        this.updateCartBadge();
        this.initializeAdmin();
        this.initializeRealTimeUpdates();
        this.optimizeForMobile();
        
        // Initialize order tracking
        this.initializeOrderTracking();
        
        // Initialize notification system
        this.initializeNotificationSystem();
    }

    // Product Management
    loadProducts() {
        const defaultProducts = [
            {
                id: 'prod1',
                name: 'Sac en Cuir Noir',
                category: 'accessoires',
                subcategory: 'sacs',
                price: 129000,
                originalPrice: 159000,
                images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                description: 'Sac en cuir véritable avec finitions impeccables. Parfait pour un usage quotidien.',
                sizes: ['Unique'],
                colors: ['Noir', 'Marron'],
                stock: 15,
                featured: true,
                onSale: true,
                active: true,
                addedAt: new Date('2024-01-15').toISOString()
            },
            {
                id: 'prod2',
                name: 'Blazer Femme Élégant',
                category: 'femmes',
                subcategory: 'vestes',
                price: 89000,
                originalPrice: 89000,
                images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                description: 'Blazer tailleur parfait pour le bureau ou les occasions spéciales.',
                sizes: ['XS', 'S', 'M', 'L', 'XL'],
                colors: ['Beige', 'Noir', 'Gris'],
                stock: 25,
                featured: true,
                onSale: false,
                active: true,
                addedAt: new Date('2024-01-20').toISOString()
            },
            {
                id: 'prod3',
                name: 'Montre de Luxe',
                category: 'accessoires',
                subcategory: 'montres',
                price: 299000,
                originalPrice: 350000,
                images: ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                description: 'Montre suisse avec mouvement automatique et bracelet en cuir.',
                sizes: ['Unique'],
                colors: ['Or', 'Argent'],
                stock: 8,
                featured: false,
                onSale: true,
                active: true,
                addedAt: new Date('2024-02-01').toISOString()
            },
            {
                id: 'prod4',
                name: 'Lunettes de Soleil Design',
                category: 'accessoires',
                subcategory: 'lunettes',
                price: 45000,
                originalPrice: 45000,
                images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                description: 'Lunettes UV400 avec design moderne et protection maximale.',
                sizes: ['Unique'],
                colors: ['Noir', 'Marron', 'Or'],
                stock: 30,
                featured: false,
                onSale: false,
                active: true,
                addedAt: new Date('2024-02-10').toISOString()
            },
            {
                id: 'prod5',
                name: 'Robe Soirée Élégante',
                category: 'femmes',
                subcategory: 'robes',
                price: 185000,
                originalPrice: 220000,
                images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                description: 'Robe de soirée en soie avec détails raffinés.',
                sizes: ['XS', 'S', 'M', 'L'],
                colors: ['Noir', 'Rouge', 'Bleu'],
                stock: 12,
                featured: true,
                onSale: true,
                active: true,
                addedAt: new Date('2024-02-15').toISOString()
            },
            {
                id: 'prod6',
                name: 'Chemise Homme Classique',
                category: 'hommes',
                subcategory: 'chemises',
                price: 65000,
                originalPrice: 65000,
                images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                description: 'Chemise en coton premium avec coupe ajustée.',
                sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                colors: ['Blanc', 'Bleu', 'Gris'],
                stock: 20,
                featured: false,
                onSale: false,
                active: true,
                addedAt: new Date('2024-02-20').toISOString()
            }
        ];

        const savedProducts = localStorage.getItem('lamiti-products');
        this.products = savedProducts ? JSON.parse(savedProducts) : defaultProducts;
        
        if (!savedProducts) {
            localStorage.setItem('lamiti-products', JSON.stringify(this.products));
        }
    }

    // Initialize notification system
    initializeNotificationSystem() {
        // Check for admin notifications every 5 seconds
        setInterval(() => {
            this.checkAdminNotifications();
        }, 5000);
    }

    // Check for admin notifications
    checkAdminNotifications() {
        // Load notifications from localStorage
        this.notifications = JSON.parse(localStorage.getItem('lamiti-notifications')) || [];
        
        // Trigger bell animation if there are unread notifications
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const adminBell = document.getElementById('notification-bell');
        
        if (adminBell && unreadCount > 0) {
            adminBell.classList.add('ringing');
        }
    }

    // Add notification for admin
    addAdminNotification(type, title, message, data = {}) {
        const notification = {
            id: 'notif_' + Date.now(),
            type: type,
            title: title,
            message: message,
            data: data,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        // Add to notifications array
        this.notifications.unshift(notification);
        
        // Keep only last 50 notifications
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }
        
        // Save to localStorage
        localStorage.setItem('lamiti-notifications', JSON.stringify(this.notifications));
        
        // Play notification sound
        this.playNotificationSound();
        
        // Update admin notification badge if admin is open
        this.updateAdminNotificationBadge();
        
        // Trigger bell animation
        this.triggerAdminBellAnimation();
    }

    // Update admin notification badge
    updateAdminNotificationBadge() {
        const badge = document.getElementById('notification-count');
        if (badge) {
            const unreadCount = this.notifications.filter(n => !n.read).length;
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    // Trigger admin bell animation
    triggerAdminBellAnimation() {
        const bell = document.getElementById('notification-bell');
        if (bell) {
            bell.classList.add('ringing');
            
            // Stop animation after 3 seconds
            setTimeout(() => {
                bell.classList.remove('ringing');
            }, 3000);
        }
    }

    // Cart Management - MODIFIÉ POUR LES NOTIFICATIONS ADMIN
    addToCart(productId, quantity = 1, size = null, color = null) {
        const product = this.products.find(p => p.id === productId);
        if (!product || product.stock < quantity) {
            this.showNotification('Stock insuffisant!', 'error');
            return false;
        }

        // Check if item already exists in cart
        const existingItem = this.cart.find(item => 
            item.productId === productId && 
            item.size === size && 
            item.color === color
        );

        if (existingItem) {
            if (product.stock < existingItem.quantity + quantity) {
                this.showNotification('Stock insuffisant!', 'error');
                return false;
            }
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                productId,
                quantity,
                size,
                color,
                addedAt: new Date().toISOString()
            });
        }

        this.saveCart();
        this.updateCartBadge();
        this.showNotification('Article ajouté au panier!', 'success');
        this.animateAddToCart();
        
        // NOTIFICATION ADMIN - Nouvelle addition au panier
        this.addAdminNotification(
            'cart_add',
            'Nouvel article ajouté au panier',
            `Le produit "${product.name}" a été ajouté au panier`,
            {
                productId: productId,
                productName: product.name,
                quantity: quantity,
                totalItems: this.cart.reduce((sum, item) => sum + item.quantity, 0),
                timestamp: new Date().toISOString()
            }
        );
        
        // Close any open modals
        this.closeAllModals();
        return true;
    }

    // Order Management - MODIFIÉ POUR LES NOTIFICATIONS ADMIN
    createOrder(customerInfo, shippingAddress, paymentMethod) {
        if (this.cart.length === 0) {
            this.showNotification('Votre panier est vide!', 'error');
            return null;
        }

        const orderId = 'ORD-' + Date.now();
        const order = {
            id: orderId,
            customer: customerInfo,
            items: [...this.cart],
            total: this.calculateTotal(),
            status: 'pending',
            statusHistory: [
                {
                    status: 'pending',
                    timestamp: new Date().toISOString(),
                    note: 'Commande créée'
                }
            ],
            orderDate: new Date().toISOString(),
            shippingAddress,
            paymentMethod,
            trackingCode: this.generateTrackingCode(),
            estimatedDelivery: this.calculateEstimatedDelivery(),
            updates: []
        };

        // Update stock
        this.cart.forEach(item => {
            const product = this.products.find(p => p.id === item.productId);
            if (product) {
                product.stock -= item.quantity;
            }
        });

        this.orders.push(order);
        this.saveOrders();
        this.saveProducts();
        
        // Clear cart
        this.cart = [];
        this.saveCart();
        this.updateCartBadge();

        // NOTIFICATION ADMIN - Nouvelle commande
        this.addAdminNotification(
            'new_order',
            'Nouvelle commande!',
            `Nouvelle commande de ${order.customer.firstName} ${order.customer.lastName} - ${this.formatPrice(order.total)}`,
            {
                orderId: orderId,
                customerName: `${order.customer.firstName} ${order.customer.lastName}`,
                totalAmount: order.total,
                itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
                timestamp: new Date().toISOString()
            }
        );

        // Send confirmation email simulation
        this.sendOrderConfirmation(order);

        // Store customer order reference
        this.storeCustomerOrder(order.customer.email, orderId);

        return order;
    }

    // Updated order status management - MODIFIÉ POUR LES NOTIFICATIONS
    updateOrderStatus(orderId, newStatus, note = null) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            const oldStatus = order.status;
            order.status = newStatus;
            
            // Add to status history
            if (!order.statusHistory) {
                order.statusHistory = [];
            }
            
            order.statusHistory.push({
                status: newStatus,
                timestamp: new Date().toISOString(),
                note: note || `Statut changé de "${this.getStatusLabel(oldStatus)}" à "${this.getStatusLabel(newStatus)}"`
            });
            
            order.lastUpdate = new Date().toISOString();
            this.saveOrders();
            
            // Add to updates for real-time notification
            order.updates = order.updates || [];
            order.updates.push({
                type: 'status_change',
                oldStatus: oldStatus,
                newStatus: newStatus,
                timestamp: new Date().toISOString(),
                message: note || `Votre commande est maintenant "${this.getStatusLabel(newStatus)}"`
            });
            
            // NOTIFICATION ADMIN - Mise à jour de statut
            this.addAdminNotification(
                'order_update',
                'Mise à jour de commande',
                `La commande ${orderId} est maintenant "${this.getStatusLabel(newStatus)}"`,
                {
                    orderId: orderId,
                    oldStatus: oldStatus,
                    newStatus: newStatus,
                    customerName: `${order.customer.firstName} ${order.customer.lastName}`,
                    timestamp: new Date().toISOString()
                }
            );
            
            // Notify customer
            this.sendStatusUpdateNotification(order);
            
            return true;
        }
        return false;
    }

    // Fonction pour jouer le son de notification
    playNotificationSound() {
        // Vérifier si nous sommes dans l'admin
        if (document.getElementById('notification-sound')) {
            const sound = document.getElementById('notification-sound');
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => {
                    console.log('Audio playback failed:', e);
                });
            }
        } else {
            // Pour les autres pages, créer un élément audio temporaire
            try {
                const audio = new Audio('resources/natifmp3.mp3');
                audio.volume = 0.5;
                audio.play().catch(e => {
                    console.log('Audio playback failed:', e);
                });
            } catch (e) {
                console.log('Audio not available:', e);
            }
        }
    }

    // UI Functions avec son pour notifications
    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Jouer le son pour les notifications importantes
        if (type === 'success' || type === 'info') {
            this.playNotificationSound();
        }
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
    }

    // Reste du code inchangé...
    // ... [Le reste du code reste identique à l'original]
}

// Initialize the shop when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.shop = new LamitiShop();
});
