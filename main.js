// Classe principale LAMITI SHOP
class LamitiShop {
    constructor() {
        this.products = [];
        this.cart = [];
        this.orders = [];
        this.currentUser = null;
        this.isAdmin = false;
        this.categories = [];
        this.subcategories = {};
        this.categoryImages = {};
        
        this.loadAllData();
        this.init();
    }

    // Chargement des données
    loadAllData() {
        // Charger les produits
        const savedProducts = localStorage.getItem('lamiti-products');
        this.products = savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS;
        
        if (!savedProducts) {
            localStorage.setItem('lamiti-products', JSON.stringify(this.products));
        }

        // Charger le panier
        const savedCart = localStorage.getItem('lamiti-cart');
        this.cart = savedCart ? JSON.parse(savedCart) : [];

        // Charger les commandes
        const savedOrders = localStorage.getItem('lamiti-orders');
        this.orders = savedOrders ? JSON.parse(savedOrders) : [];

        // Charger l'utilisateur
        const savedUser = localStorage.getItem('lamiti-user');
        this.currentUser = savedUser ? JSON.parse(savedUser) : null;

        // Charger les catégories
        const savedCategories = localStorage.getItem('lamiti-categories');
        const savedSubcategories = localStorage.getItem('lamiti-subcategories');
        const savedCategoryImages = localStorage.getItem('lamiti-category-images');
        
        this.categories = savedCategories ? JSON.parse(savedCategories) : INITIAL_CATEGORIES;
        this.subcategories = savedSubcategories ? JSON.parse(savedSubcategories) : INITIAL_SUBCATEGORIES;
        this.categoryImages = savedCategoryImages ? JSON.parse(savedCategoryImages) : {};

        // Charger la session admin
        const adminSession = localStorage.getItem('lamiti-admin');
        if (adminSession) {
            try {
                const session = JSON.parse(adminSession);
                const now = new Date();
                const loginTime = new Date(session.loginTime);
                const sessionDuration = now - loginTime;
                
                if (sessionDuration < CONFIG.admin.sessionTimeout) {
                    this.isAdmin = true;
                } else {
                    localStorage.removeItem('lamiti-admin');
                }
            } catch (error) {
                localStorage.removeItem('lamiti-admin');
            }
        }
    }

    // Initialisation
    init() {
        this.bindEvents();
        this.updateCartBadge();
        this.initNotifications();
        
        if (this.isAdmin) {
            this.initAdminFeatures();
        }
    }

    // Événements globaux
    bindEvents() {
        // Événement pour les mises à jour de données
        document.addEventListener('shopDataUpdate', () => {
            this.notifyDataChange();
        });

        // Écouteur pour recherche
        document.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('search-input') && e.key === 'Enter') {
                this.handleSearch(e.target.value);
            }
        });
    }

    // Formatage des prix
    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: CONFIG.shop.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price).replace(CONFIG.shop.currency, CONFIG.shop.currencySymbol);
    }

    // Gestion du panier
    addToCart(productId, quantity = 1, size = null, color = null) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.showNotification('Produit non trouvé', 'error');
            return false;
        }

        if (product.stock < quantity) {
            this.showNotification('Stock insuffisant', 'error');
            return false;
        }

        const existingItem = this.cart.find(item => 
            item.productId === productId && 
            item.size === size && 
            item.color === color
        );

        if (existingItem) {
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
        this.showNotification('Produit ajouté au panier', 'success');
        
        // Animation
        this.animateCartIcon();
        
        // Événement de mise à jour
        this.triggerCartUpdate();
        
        return true;
    }

    removeFromCart(productId, size = null, color = null) {
        this.cart = this.cart.filter(item => 
            !(item.productId === productId && 
              item.size === size && 
              item.color === color)
        );
        
        this.saveCart();
        this.updateCartBadge();
        this.showNotification('Article retiré du panier', 'info');
        this.triggerCartUpdate();
    }

    updateCartQuantity(productId, quantity, size = null, color = null) {
        const item = this.cart.find(item => 
            item.productId === productId && 
            item.size === size && 
            item.color === color
        );
        
        if (item) {
            const product = this.products.find(p => p.id === productId);
            if (product && product.stock >= quantity) {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartBadge();
                this.triggerCartUpdate();
            } else {
                this.showNotification('Stock insuffisant', 'error');
            }
        }
    }

    // Sauvegarde des données
    saveCart() {
        localStorage.setItem('lamiti-cart', JSON.stringify(this.cart));
        this.notifyDataChange();
    }

    saveProducts() {
        localStorage.setItem('lamiti-products', JSON.stringify(this.products));
        this.notifyDataChange();
    }

    saveOrders() {
        localStorage.setItem('lamiti-orders', JSON.stringify(this.orders));
        this.notifyDataChange();
    }

    saveCategories() {
        localStorage.setItem('lamiti-categories', JSON.stringify(this.categories));
        localStorage.setItem('lamiti-subcategories', JSON.stringify(this.subcategories));
        this.notifyDataChange();
    }

    saveCategoryImages() {
        localStorage.setItem('lamiti-category-images', JSON.stringify(this.categoryImages));
        this.notifyDataChange();
    }

    // Commandes
    createOrder(customerInfo, shippingAddress, paymentMethod, notes = '') {
        if (this.cart.length === 0) {
            this.showNotification('Votre panier est vide', 'error');
            return null;
        }

        const orderId = 'ORD-' + Date.now();
        const trackingCode = 'TRK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
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
            trackingCode,
            estimatedDelivery: this.calculateEstimatedDelivery(),
            updates: [],
            notes
        };

        // Mettre à jour le stock
        this.cart.forEach(item => {
            const product = this.products.find(p => p.id === item.productId);
            if (product) {
                product.stock -= item.quantity;
            }
        });

        this.orders.push(order);
        this.saveOrders();
        this.saveProducts();
        
        // Vider le panier
        this.cart = [];
        this.saveCart();
        this.updateCartBadge();

        // Stocker la référence client
        this.storeCustomerOrder(customerInfo.email, orderId);

        // Envoyer confirmation
        this.sendOrderConfirmation(order);

        // Notification admin
        this.triggerAdminNotification(order);

        // Événement de nouvelle commande
        const event = new CustomEvent('newOrderCreated', { detail: { order } });
        document.dispatchEvent(event);

        return order;
    }

    calculateTotal() {
        return this.cart.reduce((total, item) => {
            const product = this.products.find(p => p.id === item.productId);
            return total + (product ? product.price * item.quantity : 0);
        }, 0);
    }

    calculateEstimatedDelivery() {
        const date = new Date();
        date.setDate(date.getDate() + CONFIG.shop.delivery.standardDays);
        return date.toISOString();
    }

    // Notifications
    showNotification(message, type = 'info', duration = CONFIG.notifications.duration) {
        const container = document.getElementById('notification-container');
        if (!container) {
            this.createNotificationContainer();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        document.getElementById('notification-container').appendChild(notification);
        
        // Afficher
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Jouer le son
        if (CONFIG.notifications.sound.enabled && (type === 'success' || type === 'info')) {
            this.playNotificationSound();
        }
        
        // Supprimer automatiquement
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
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    playNotificationSound() {
        try {
            const audio = new Audio(CONFIG.notifications.sound.src);
            audio.volume = CONFIG.notifications.sound.volume;
            audio.play().catch(e => console.log('Erreur audio:', e));
        } catch (error) {
            console.log('Audio non disponible');
        }
    }

    initNotifications() {
        this.createNotificationContainer();
    }

    // Mise à jour du badge panier
    updateCartBadge() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Mettre à jour tous les badges
        document.querySelectorAll('.cart-badge').forEach(badge => {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'flex' : 'none';
        });
    }

    // Animation du panier
    animateCartIcon() {
        const cartIcons = document.querySelectorAll('.cart-icon');
        cartIcons.forEach(icon => {
            icon.classList.add('bounce');
            setTimeout(() => icon.classList.remove('bounce'), 600);
        });
    }

    // Événements
    triggerCartUpdate() {
        const event = new CustomEvent('cartUpdated', {
            detail: { cart: this.cart, total: this.calculateTotal() }
        });
        document.dispatchEvent(event);
    }

    notifyDataChange() {
        const event = new CustomEvent('shopDataUpdate', {
            detail: {
                products: this.products,
                cart: this.cart,
                orders: this.orders,
                categories: this.categories,
                subcategories: this.subcategories
            }
        });
        document.dispatchEvent(event);
    }

    triggerAdminNotification(order) {
        if (this.isAdmin) {
            const event = new CustomEvent('adminNotification', {
                detail: { order, type: 'new_order' }
            });
            document.dispatchEvent(event);
        }
    }

    // Gestion des produits (admin)
    addProduct(productData) {
        const newProduct = {
            id: 'prod' + Date.now(),
            ...productData,
            active: true,
            addedAt: new Date().toISOString()
        };
        
        this.products.push(newProduct);
        this.saveProducts();
        this.showNotification('Produit ajouté avec succès', 'success');
        
        return newProduct;
    }

    updateProduct(productId, updates) {
        const index = this.products.findIndex(p => p.id === productId);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updates };
            this.saveProducts();
            this.showNotification('Produit mis à jour', 'success');
            return true;
        }
        return false;
    }

    deleteProduct(productId) {
        this.products = this.products.filter(p => p.id !== productId);
        this.saveProducts();
        this.showNotification('Produit supprimé', 'info');
        return true;
    }

    toggleProductStatus(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            product.active = !product.active;
            this.saveProducts();
            this.showNotification(
                product.active ? 'Produit activé' : 'Produit désactivé',
                'info'
            );
            return true;
        }
        return false;
    }

    // Gestion des catégories
    addCategory(categoryName, subcategories = [], image = null) {
        const normalizedName = categoryName.trim().toLowerCase();
        
        if (!this.categories.includes(normalizedName)) {
            this.categories.push(normalizedName);
            this.subcategories[normalizedName] = subcategories;
            
            if (image) {
                this.categoryImages[normalizedName] = image;
                this.saveCategoryImages();
            }
            
            this.saveCategories();
            this.showNotification(`Catégorie "${categoryName}" ajoutée`, 'success');
            return true;
        }
        
        this.showNotification('Cette catégorie existe déjà', 'error');
        return false;
    }

    deleteCategory(categoryName) {
        if (this.categories.includes(categoryName)) {
            // Vérifier si la catégorie contient des produits
            const hasProducts = this.products.some(p => p.category === categoryName);
            if (hasProducts) {
                this.showNotification('Impossible de supprimer: catégorie contient des produits', 'error');
                return false;
            }
            
            this.categories = this.categories.filter(c => c !== categoryName);
            delete this.subcategories[categoryName];
            
            if (this.categoryImages[categoryName]) {
                delete this.categoryImages[categoryName];
                this.saveCategoryImages();
            }
            
            this.saveCategories();
            this.showNotification(`Catégorie "${categoryName}" supprimée`, 'info');
            return true;
        }
        return false;
    }

    // Recherche
    handleSearch(query) {
        if (query.trim()) {
            if (window.location.pathname.includes('products.html')) {
                // Si déjà sur la page produits, filtrer
                this.filterProducts(query);
            } else {
                // Sinon rediriger
                window.location.href = `products.html?search=${encodeURIComponent(query.trim())}`;
            }
        }
    }

    filterProducts(query) {
        // Implémentation spécifique à la page produits
        if (typeof filterProductsOnPage === 'function') {
            filterProductsOnPage(query);
        }
    }

    // Utilitaires
    getProductById(productId) {
        return this.products.find(p => p.id === productId);
    }

    getOrderById(orderId) {
        return this.orders.find(o => o.id === orderId);
    }

    getOrderByTrackingCode(trackingCode) {
        return this.orders.find(o => o.trackingCode === trackingCode);
    }

    getCustomerOrders(email) {
        const customerOrders = JSON.parse(localStorage.getItem('lamiti-customer-orders') || '{}');
        const orderIds = customerOrders[email] || [];
        return this.orders.filter(order => orderIds.includes(order.id));
    }

    storeCustomerOrder(email, orderId) {
        let customerOrders = JSON.parse(localStorage.getItem('lamiti-customer-orders') || '{}');
        if (!customerOrders[email]) {
            customerOrders[email] = [];
        }
        if (!customerOrders[email].includes(orderId)) {
            customerOrders[email].push(orderId);
            localStorage.setItem('lamiti-customer-orders', JSON.stringify(customerOrders));
        }
    }

    // Statistiques
    getCategoryStats() {
        const stats = {};
        this.categories.forEach(category => {
            stats[category] = this.products.filter(p => p.category === category).length;
        });
        return stats;
    }

    getLowStockProducts(threshold = 5) {
        return this.products.filter(p => p.stock <= threshold && p.active);
    }

    // Mise à jour statut commande
    updateOrderStatus(orderId, newStatus, note = null) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return false;

        const oldStatus = order.status;
        order.status = newStatus;
        
        if (!order.statusHistory) {
            order.statusHistory = [];
        }
        
        order.statusHistory.push({
            status: newStatus,
            timestamp: new Date().toISOString(),
            note: note || `Statut changé de "${this.getStatusLabel(oldStatus)}" à "${this.getStatusLabel(newStatus)}"`
        });
        
        order.lastUpdate = new Date().toISOString();
        
        // Ajouter aux mises à jour
        order.updates = order.updates || [];
        order.updates.push({
            type: 'status_change',
            oldStatus,
            newStatus,
            timestamp: new Date().toISOString(),
            message: note || `Votre commande est maintenant "${this.getStatusLabel(newStatus)}"`
        });
        
        this.saveOrders();
        
        // Notification
        const event = new CustomEvent('orderStatusUpdated', {
            detail: { orderId, newStatus, message: note }
        });
        document.dispatchEvent(event);
        
        return true;
    }

    getStatusLabel(status) {
        const labels = {
            'pending': 'En attente',
            'confirmed': 'Confirmée',
            'shipped': 'Expédiée',
            'delivered': 'Livrée',
            'cancelled': 'Annulée'
        };
        return labels[status] || status;
    }

    // Admin
    initAdminFeatures() {
        console.log('Fonctionnalités admin activées');
    }

    // Confirmation email (simulée)
    sendOrderConfirmation(order) {
        console.log(`Email de confirmation envoyé à ${order.customer.email}`);
        const confirmations = JSON.parse(localStorage.getItem('lamiti-order-confirmations') || '[]');
        confirmations.push({
            orderId: order.id,
            email: order.customer.email,
            sentAt: new Date().toISOString()
        });
        localStorage.setItem('lamiti-order-confirmations', JSON.stringify(confirmations));
    }
}

// Initialisation globale
let shopInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    shopInstance = new LamitiShop();
    window.shop = shopInstance;
    
    // Initialisation de la navbar
    initNavbar();
    
    // Démarrer les vérifications automatiques
    startAutoChecks();
});

// Fonctions globales
function initNavbar() {
    // Scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
    
    // Recherche
    document.querySelectorAll('.search-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && window.shop) {
                window.shop.handleSearch(e.target.value);
            }
        });
    });
}

function startAutoChecks() {
    // Vérifier les mises à jour de commandes toutes les 30 secondes
    setInterval(() => {
        if (window.shop && window.shop.currentUser) {
            checkOrderUpdates();
        }
    }, 30000);
}

function checkOrderUpdates() {
    // Implémentation spécifique à la page
}

// Fonctions utilitaires globales
function formatPrice(price) {
    return window.shop ? window.shop.formatPrice(price) : '';
}

function showNotification(message, type = 'info') {
    if (window.shop) {
        window.shop.showNotification(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Export pour tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LamitiShop, CONFIG };
}
