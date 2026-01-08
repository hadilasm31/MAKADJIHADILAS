// Configuration globale LAMITI SHOP
const CONFIG = {
    // Informations du site
    siteName: 'LAMITI SHOP',
    siteDescription: 'Boutique de mode et accessoires de qualité',
    siteUrl: 'https://lamiti-shop.com',
    
    // Informations de contact
    contact: {
        email: 'hadilasmakadji31@gmail.com',
        phone: '+241 77 95 03 88',
        address: 'Libreville, Gabon',
        social: {
            facebook: '#',
            instagram: '#',
            twitter: '#'
        }
    },
    
    // Configuration de la boutique
    shop: {
        currency: 'XAF',
        currencySymbol: 'FCFA',
        taxRate: 0.18,
        shippingFee: 0,
        freeShippingThreshold: 50000,
        
        paymentMethods: [
            {
                id: 'card',
                name: 'Carte bancaire',
                icon: '💳',
                description: 'Paiement sécurisé par carte bancaire'
            },
            {
                id: 'mobile',
                name: 'Paiement mobile',
                icon: '📱',
                description: 'Paiement par Orange Money, MTN Money'
            }
        ],
        
        delivery: {
            standardDays: 3,
            expressDays: 1,
            expressFee: 5000
        }
    },
    
    // Configuration admin
    admin: {
        username: 'admin',
        password: 'lamiti2024',
        sessionTimeout: 3600000
    },
    
    // Configuration notifications
    notifications: {
        enabled: true,
        duration: 3000,
        position: 'top-right',
        sound: {
            enabled: true,
            src: 'resources/natifmp3.mp3',
            volume: 0.5
        }
    },
    
    // Configuration images
    images: {
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        placeholder: 'resources/product-placeholder.jpg',
        categoryPlaceholder: 'resources/category-placeholder.jpg'
    }
};

// Données initiales des produits
const INITIAL_PRODUCTS = [
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
        addedAt: '2024-01-15'
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
        addedAt: '2024-01-20'
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
        addedAt: '2024-02-01'
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
        addedAt: '2024-02-10'
    }
];

// Catégories initiales
const INITIAL_CATEGORIES = ['femmes', 'hommes', 'accessoires', 'robes', 'chemises', 'chaussures'];
const INITIAL_SUBCATEGORIES = {
    'femmes': ['robes', 'vestes', 'pantalons', 'chaussures'],
    'hommes': ['chemises', 'pantalons', 'vestes', 'chaussures'],
    'accessoires': ['sacs', 'montres', 'lunettes', 'bijoux'],
    'robes': ['soirée', 'quotidien', 'été', 'hiver'],
    'chemises': ['casual', 'formel', 'manches longues', 'manches courtes'],
    'chaussures': ['talons', 'plates', 'baskets', 'bottes']
};

// Export pour utilisation globale
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.INITIAL_PRODUCTS = INITIAL_PRODUCTS;
    window.INITIAL_CATEGORIES = INITIAL_CATEGORIES;
    window.INITIAL_SUBCATEGORIES = INITIAL_SUBCATEGORIES;
}
