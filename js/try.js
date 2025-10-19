// ===== SWIPER =====
var swiper = new Swiper(".mySwiper", {
    loop: true,
    navigation: {
        nextEl: ".fa-arrow-right",
        prevEl: ".fa-arrow-left",
    },
});

// ===== ELEMENT SELECTORS =====
const cartIcon = document.querySelector('.cart-icon');
const cartTab = document.querySelector('.cart-tab');
const closeBtn = document.querySelector('.close-btn');
const cardList = document.querySelector('.card-list');
const cartList = document.querySelector('.cart-list');
const cartTotal = document.querySelector('.cart-total');
const cartValue = document.querySelector('.cart-value');
const hamburger = document.querySelector('.hamberger');
const mobileMenu = document.querySelector('.mobile-menu');
const bars = document.querySelector('.fa-bars');
const backToTop = document.querySelector('.back-to-top');
const themeToggles = document.querySelectorAll('.theme-toggle');

// ===== CART OPEN/CLOSE =====
cartIcon?.addEventListener('click', () => {
    cartTab.classList.add("cart-tab-active");
    // Show skeleton cart items if cart is empty
    if (addProduct.length === 0) {
        showSkeletonCartItems();
    }
});
closeBtn?.addEventListener('click', () => cartTab.classList.remove("cart-tab-active"));
hamburger?.addEventListener('click', () => {
    mobileMenu.classList.toggle("mobile-menu-active");
    bars.classList.toggle("fa-xmark");
    bars.classList.toggle("fa-bars");
});

window.addEventListener('scroll', () => {
    if (window.scrollY > 400) backToTop?.classList.add('visible');
    else backToTop?.classList.remove('visible');
});

backToTop?.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== THEME TOGGLE =====
const applySmoothTransition = () => {
    document.documentElement.classList.add('theme-transition');
    setTimeout(() => document.documentElement.classList.remove('theme-transition'), 600);
};

const updateThemeIcons = theme => {
    themeToggles.forEach(toggle => {
        const icon = toggle.querySelector('i');
        const label = toggle.querySelector('span');
        if (theme === 'dark') {
            icon.classList.replace('fa-moon', 'fa-sun');
            toggle.classList.add('dark');
            if (label) label.textContent = 'Light Mode ☀️';
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            toggle.classList.remove('dark');
            if (label) label.textContent = 'Dark Mode 🌙';
        }
        icon.classList.add('rotate-icon');
        setTimeout(() => icon.classList.remove('rotate-icon'), 600);
    });
};

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applySmoothTransition();
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
};

themeToggles.forEach(toggle => toggle.addEventListener('click', toggleTheme));

const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
};
initTheme();

// ===== PRODUCTS & CART =====
let productList = [];
let addProduct = [];

// ===== FAVORITES (WISHLIST) =====
const FAVORITES_STORAGE_KEY = 'foodie:favorites';
let favoriteIds = new Set();

const loadFavorites = () => {
    try {
        const raw = localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]';
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) favoriteIds = new Set(arr);
    } catch (_) { favoriteIds = new Set(); }
};

const saveFavorites = () => {
    try { localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favoriteIds])); } catch (_) {}
};

const isFavorite = id => favoriteIds.has(id);
const toggleFavorite = id => {
    if (favoriteIds.has(id)) favoriteIds.delete(id); else favoriteIds.add(id);
    saveFavorites();
};
loadFavorites();

// Show toast notification
const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        ${message}
    `;
    
    const container = document.querySelector('.toast-container');
    container.appendChild(toast);
    
    // Trigger reflow for animation
    toast.offsetHeight;
    toast.classList.add('show');
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

const updateTotalPrice = () => {
    let totalPrice = 0;
    let totalQuantity = 0;

    cartList.querySelectorAll('.item').forEach(item => {
        const quantity = parseInt(item.querySelector('.quantity-value').textContent);
        const price = parseFloat(item.querySelector('.item-total').textContent.replace(/[₹$]/g, ''));
        totalPrice += price;
        totalQuantity += quantity;
    });

    cartTotal.textContent = `₹${totalPrice.toFixed(2)}`;
    cartValue.textContent = totalQuantity;
};

// ===== UPDATE CARD BUTTON STATE =====
const updateCardButton = (card, product) => {
    const existProduct = addProduct.find(item => item.id === product.id);
    const buttonContainer = card.querySelector('.card-btn-container');
    
    if (existProduct && existProduct.quantity > 0) {
        // Show quantity selector
        buttonContainer.innerHTML = `
            <div class="quantity-selector flex">
                <button class="qty-btn minus-btn" data-id="${product.id}">
                    <i class="fa-solid fa-minus"></i>
                </button>
                <span class="qty-display">${existProduct.quantity}</span>
                <button class="qty-btn plus-btn" data-id="${product.id}">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        `;
        
        // Add event listeners to quantity buttons
        const minusBtn = buttonContainer.querySelector('.minus-btn');
        const plusBtn = buttonContainer.querySelector('.plus-btn');
        
        minusBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            decreaseQuantity(product, card);
        });
        
        plusBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            increaseQuantity(product, card);
        });
    } else {
        // Show "Add to Cart" button
        buttonContainer.innerHTML = `
            <a href="#" class="btn card-btn">Add to Cart</a>
        `;
        
        buttonContainer.querySelector('.card-btn').addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(product, card);
        });
    }
};

// ===== INCREASE QUANTITY =====
const increaseQuantity = (product, card) => {
    const price = parseFloat(product.price.replace(/[₹$]/g, ''));
    let existProduct = addProduct.find(item => item.id === product.id);
    
    if (existProduct) {
        existProduct.quantity++;
        
        // Update cart item
        const cartItem = [...cartList.querySelectorAll('.item')]
            .find(item => item.querySelector('.detail h4').textContent === product.name);
        if (cartItem) {
            const quantityValue = cartItem.querySelector('.quantity-value');
            const itemTotal = cartItem.querySelector('.item-total');
            quantityValue.textContent = existProduct.quantity;
            itemTotal.textContent = `₹${(existProduct.quantity * price).toFixed(2)}`;
        }
        
        // Update card button
        updateCardButton(card, product);
        updateTotalPrice();
    }
};

// ===== DECREASE QUANTITY =====
const decreaseQuantity = (product, card) => {
    const price = parseFloat(product.price.replace(/[₹$]/g, ''));
    let existProduct = addProduct.find(item => item.id === product.id);
    
    if (existProduct) {
        existProduct.quantity--;
        
        if (existProduct.quantity === 0) {
            // Remove from cart
            addProduct = addProduct.filter(item => item.id !== product.id);
            
            const cartItem = [...cartList.querySelectorAll('.item')]
                .find(item => item.querySelector('.detail h4').textContent === product.name);
            if (cartItem) cartItem.remove();
        } else {
            // Update cart item
            const cartItem = [...cartList.querySelectorAll('.item')]
                .find(item => item.querySelector('.detail h4').textContent === product.name);
            if (cartItem) {
                const quantityValue = cartItem.querySelector('.quantity-value');
                const itemTotal = cartItem.querySelector('.item-total');
                quantityValue.textContent = existProduct.quantity;
                itemTotal.textContent = `₹${(existProduct.quantity * price).toFixed(2)}`;
            }
        }
        
        // Update card button
        updateCardButton(card, product);
        updateTotalPrice();
    }
};

// ===== ADD TO CART =====
const addToCart = (product, card) => {
    const price = parseFloat(product.price.replace(/[₹$]/g, ''));
    let existProduct = addProduct.find(item => item.id === product.id);

    if (existProduct) {
        increaseQuantity(product, card);
        showToast(`Added another ${product.name} to cart`);
        return;
    }

    product.quantity = 1;
    addProduct.push(product);
    showToast(`${product.name} added to cart`);

    const cartItem = document.createElement('div');
    cartItem.classList.add('item');
    cartItem.innerHTML = `
        <div class="images-container"><img src="${product.image}"></div>
        <div class="detail">
            <h4>${product.name}</h4>
            <h4 class="item-total">₹${price.toFixed(2)}</h4>
        </div>
        <div class="flex">
            <a href="#" class="quantity-btn minus"><i class="fa-solid fa-minus"></i></a>
            <h4 class="quantity-value">1</h4>
            <a href="#" class="quantity-btn plus"><i class="fa-solid fa-plus"></i></a>
        </div>
    `;
    cartList.appendChild(cartItem);
    updateTotalPrice();

    const plusBtn = cartItem.querySelector('.plus');
    const minusBtn = cartItem.querySelector('.minus');
    const quantityValue = cartItem.querySelector('.quantity-value');
    const itemTotal = cartItem.querySelector('.item-total');

    plusBtn.addEventListener('click', e => {
        e.preventDefault();
        product.quantity++;
        quantityValue.textContent = product.quantity;
        itemTotal.textContent = `₹${(product.quantity * price).toFixed(2)}`;
        updateTotalPrice();
        updateCardButton(card, product);
    });

    minusBtn.addEventListener('click', e => {
        e.preventDefault();
        if (product.quantity > 1) {
            product.quantity--;
            quantityValue.textContent = product.quantity;
            itemTotal.textContent = `₹${(product.quantity * price).toFixed(2)}`;
            updateTotalPrice();
            updateCardButton(card, product);
        } else {
            cartItem.remove();
            addProduct = addProduct.filter(item => item.id !== product.id);
            updateTotalPrice();
            updateCardButton(card, product);
        }
    });
    
    // Update the card button to show quantity selector
    updateCardButton(card, product);
};

// ===== CHECKOUT =====
const checkoutBtn = document.querySelector('.check-out');
checkoutBtn?.addEventListener('click', e => {
    e.preventDefault();
    if (addProduct.length === 0) return alert('Your cart is empty!');

    const checkoutData = addProduct.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: product.quantity
    }));

    sessionStorage.setItem('checkoutCart', JSON.stringify(checkoutData));
    window.location.href = '../HTML/checkout.html';
});

// ===== RENDER PRODUCT CARDS =====
const showCards = list => {
    if (!cardList) return;
    cardList.innerHTML = '';
    if (!list || list.length === 0) {
        const msg = document.createElement('div');
        msg.classList.add('no-items-message');
        msg.textContent = 'Oops! No items available.';
        cardList.appendChild(msg);
        return;
    }

    list.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('order-card');
        const favActive = isFavorite(product.id);
        card.innerHTML = `
            <button class="fav-btn${favActive ? ' active' : ''}" aria-label="Toggle favorite" aria-pressed="${favActive}" title="${favActive ? 'Remove from favorites' : 'Add to favorites'}">
                <i class="${favActive ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <div class="card-image"><img src="${product.image}" alt="${product.name}"></div>
            <h4>${product.name}</h4>
            <h4 class="price">₹${parseFloat(product.price.replace(/[₹$]/g, '')).toFixed(2)}</h4>
            <div class="card-btn-container"></div>
        `;
        
        // Initialize button state
        updateCardButton(card, product);
        
        card.addEventListener('click', e => {
            if (!e.target.closest('.card-btn-container') && !e.target.closest('.fav-btn')) {
                openFoodModal(product);
            }
        });

        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product.id);
            const nowActive = isFavorite(product.id);
            favBtn.classList.toggle('active', nowActive);
            favBtn.setAttribute('aria-pressed', String(nowActive));
            favBtn.setAttribute('title', nowActive ? 'Remove from favorites' : 'Add to favorites');
            const icon = favBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-solid', nowActive);
                icon.classList.toggle('fa-regular', !nowActive);
            }
        });
        cardList.appendChild(card);
    });
};

// ===== SEARCH + PRICE FILTER =====
const priceSelector = document.getElementById('priceSelector');
const selected = priceSelector?.querySelector('.selected');
const options = priceSelector?.querySelectorAll('.options li');
let currentPriceFilter = 'all';
let favoritesOnly = false;

selected?.addEventListener('click', () => priceSelector.classList.toggle('open'));
options?.forEach(opt => {
    opt.addEventListener('click', e => {
        currentPriceFilter = e.target.dataset.value;
        selected.textContent = e.target.textContent + ' ▾';
        priceSelector.classList.remove('open');
        applyFilters();
    });
});
document.addEventListener('click', e => {
    if (!priceSelector.contains(e.target)) priceSelector.classList.remove('open');
});

const searchInput = document.getElementById('search');
searchInput?.addEventListener('input', applyFilters);

const favToggle = document.getElementById('favToggle');
favToggle?.addEventListener('click', e => {
    e.preventDefault();
    favoritesOnly = !favoritesOnly;
    favToggle.classList.toggle('active', favoritesOnly);
    favToggle.setAttribute('aria-pressed', String(favoritesOnly));
    applyFilters();
});

function applyFilters() {
    if (!productList) return;
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = productList.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm);
        const price = parseFloat(p.price.replace(/[₹$]/g, ''));
        let matchesPrice = true;

        if (currentPriceFilter === 'low') matchesPrice = price < 100;
        else if (currentPriceFilter === 'mid') matchesPrice = price >= 100 && price <= 200;
        else if (currentPriceFilter === 'high') matchesPrice = price > 200;

        const matchesFavorite = !favoritesOnly || isFavorite(p.id);
        return matchesSearch && matchesPrice && matchesFavorite;
    });
    showCards(filtered);
}

// ===== MODAL =====
const modal = document.getElementById('foodModal');
const modalImage = document.getElementById('modalImage');
const modalName = document.getElementById('modalName');
const modalPrice = document.getElementById('modalPrice');
const modalDescription = document.getElementById('modalDescription');
const modalAddBtn = document.getElementById('addToCartBtn');
const modalViewBtn = document.getElementById('viewCartBtn');
const modalClose = document.querySelector('#foodModal .close');

function openFoodModal(product) {
    modalImage.src = product.image;
    modalName.textContent = product.name;
    modalPrice.textContent = `₹${parseFloat(product.price.replace(/[₹$]/g, '')).toFixed(2)}`;
    modalDescription.textContent = product.description || "No description available.";
    modal.style.display = 'flex';
    
    modalAddBtn.onclick = () => { 
        const card = [...cardList.querySelectorAll('.order-card')].find(c => 
            c.querySelector('h4').textContent === product.name
        );
        addToCart(product, card); 
        modal.style.display = 'none'; 
    };
    modalViewBtn.onclick = () => { cartTab.classList.add('cart-tab-active'); modal.style.display = 'none'; };
}

modalClose?.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
document.addEventListener('keydown', e => { if (e.key === "Escape") modal.style.display = 'none'; });

// ===== SKELETON LOADERS =====
const createSkeletonCard = () => {
    const skeleton = document.createElement('div');
    skeleton.classList.add('skeleton-card');
    skeleton.innerHTML = `
        <div class="skeleton skeleton-fav"></div>
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-price"></div>
        <div class="skeleton skeleton-btn"></div>
    `;
    return skeleton;
};

const createSkeletonCartItem = () => {
    const skeleton = document.createElement('div');
    skeleton.classList.add('skeleton-cart-item');
    skeleton.innerHTML = `
        <div class="skeleton skeleton-cart-image"></div>
        <div class="skeleton-cart-detail">
            <div class="skeleton skeleton-cart-text"></div>
            <div class="skeleton skeleton-cart-total"></div>
        </div>
        <div class="skeleton-cart-quantity">
            <div class="skeleton skeleton-cart-btn"></div>
            <div class="skeleton skeleton-cart-value"></div>
            <div class="skeleton skeleton-cart-btn"></div>
        </div>
    `;
    return skeleton;
};

const showSkeletonCards = (count = 6) => {
    if (!cardList) return;
    cardList.innerHTML = '';
    for (let i = 0; i < count; i++) {
        cardList.appendChild(createSkeletonCard());
    }
};

const showSkeletonCartItems = (count = 3) => {
    if (!cartList) return;
    cartList.innerHTML = '';
    for (let i = 0; i < count; i++) {
        cartList.appendChild(createSkeletonCartItem());
    }
};

// ===== INIT APP =====
const loadProducts = async (retryCount = 0) => {
    try {
        // Show skeleton loading state
        showSkeletonCards();

        const res = await fetch('../products.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        productList = data;
        showCards(productList);
    } catch (error) {
        console.error('Failed to load products:', error);
        if (cardList) {
            cardList.innerHTML = '<div class="error">Unable to load products. Please check your connection and try again.</div>';
            // Add retry button
            const retryBtn = document.createElement('button');
            retryBtn.textContent = 'Retry';
            retryBtn.className = 'retry-btn';
            retryBtn.onclick = () => loadProducts(retryCount + 1);
            cardList.appendChild(retryBtn);
        }
    }
};

loadProducts();
