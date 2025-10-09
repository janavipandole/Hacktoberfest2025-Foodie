var swiper = new Swiper(".mySwiper", {
    loop: true,
    navigation: {
        nextEl: ".fa-arrow-right",
        prevEl: ".fa-arrow-left",
    },
});

const cartIcon = document.querySelector('.cart-icon');
const cartTab = document.querySelector('.cart-tab');
const closeBtn = document.querySelector('.close-btn');
const cardList = document.querySelector('.card-list');
const cartList = document.querySelector('.cart-list');
const cartTotal = document.querySelector('.cart-total');
const cartValue = document.querySelector('.cart-value');
const hamberger = document.querySelector('.hamberger')
const mobileMenu = document.querySelector('.mobile-menu');
const bars = document.querySelector('.fa-bars');
const backToTop = document.querySelector('.back-to-top');
const themeToggles = document.querySelectorAll('.theme-toggle');

cartIcon.addEventListener('click', () => cartTab.classList.add("cart-tab-active"));
closeBtn.addEventListener('click', () => cartTab.classList.remove("cart-tab-active"));
hamberger.addEventListener('click', () => mobileMenu.classList.toggle("mobile-menu-active"));
hamberger.addEventListener('click', () => { bars.classList.toggle("fa-xmark"); bars.classList.toggle("fa-bars") });

window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
        backToTop && backToTop.classList.add('visible');
    } else {
        backToTop && backToTop.classList.remove('visible');
    }
});

backToTop && backToTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Theme toggle functionality
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
};

const updateThemeIcons = (theme) => {
    themeToggles.forEach(toggle => {
        const icon = toggle.querySelector('i');
        const label = toggle.querySelector('span');

        if (theme === 'dark') {
            icon.className = 'fa-solid fa-sun';
            toggle.classList.add('dark');
            if (label) label.textContent = 'Light Mode';
        } else {
            icon.className = 'fa-solid fa-moon';
            toggle.classList.remove('dark');
            if (label) label.textContent = 'Dark Mode';
        }
    });
};

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
};

themeToggles.forEach(toggle => {
    toggle.addEventListener('click', toggleTheme);
});

initTheme();

let produtList = [];
let AddProduct = [];

const updateTotalPrice = () => {
    let totalPrice = 0;
    let totalQualtity = 0;

    document.querySelectorAll('.item').forEach(item => {
        const quantity = parseInt(item.querySelector('.quatity-value').textContent);
        const price = parseFloat(item.querySelector('.item-total').textContent.replace('$', ''));

        totalPrice += price;
        totalQualtity += quantity;
    })

    cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
    cartValue.textContent = totalQualtity;
}

// === Show Cards ===
const showCards = () => {
    cardList.innerHTML = "";
    produtList.forEach(product => {
        const orderCard = document.createElement('div');
        orderCard.classList.add('order-card');

        orderCard.innerHTML = `
          <div class="card-image">
            <img src="${product.image}" alt="">
            </div>
            <h4>${product.name}</h4>
            <h4 class="price">${product.price}</h4>
            <div class="card-action">
                <a href="#" class="btn card-btn" data-id="${product.id}">Add to Cart</a>
            </div>
        `;

        // Open modal on card click (but not button)
        orderCard.addEventListener("click", (e) => {
            if (!e.target.classList.contains('card-btn') && 
                !e.target.classList.contains('qty-btn') &&
                !e.target.closest('.card-action')) {
                openFoodModal(product);
            }
        });
        
        // Handle add to cart button
        const cardBtn = orderCard.querySelector('.card-btn');
        cardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCardButton(product, orderCard);
        });
        
        cardList.appendChild(orderCard);
    });
}

// Handle card button click (Add to Cart or quantity change)
const handleCardButton = (product, orderCard) => {
    const cardAction = orderCard.querySelector('.card-action');
    const existingProduct = AddProduct.find(item => item.id === product.id);
    
    if (!existingProduct) {
        // Add product to cart first
        addToCartSilently(product);
        
        // Change button to quantity selector
        cardAction.innerHTML = `
            <div class="quantity-selector flex" data-id="${product.id}">
                <a href="#" class="qty-btn minus-btn"><i class="fa-solid fa-minus"></i></a>
                <span class="qty-display">1</span>
                <a href="#" class="qty-btn plus-btn"><i class="fa-solid fa-plus"></i></a>
            </div>
        `;
        
        // Add event listeners to quantity buttons
        const minusBtn = cardAction.querySelector('.minus-btn');
        const plusBtn = cardAction.querySelector('.plus-btn');
        const qtyDisplay = cardAction.querySelector('.qty-display');
        
        plusBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentQty = parseInt(qtyDisplay.textContent);
            const newQty = currentQty + 1;
            qtyDisplay.textContent = newQty;
            updateCartQuantity(product, newQty);
        });
        
        minusBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentQty = parseInt(qtyDisplay.textContent);
            const newQty = currentQty - 1;
            
            if (newQty <= 0) {
                // Remove from cart and reset button
                removeFromCart(product.id);
                cardAction.innerHTML = `<a href="#" class="btn card-btn" data-id="${product.id}">Add to Cart</a>`;
                
                const newBtn = cardAction.querySelector('.card-btn');
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCardButton(product, orderCard);
                });
            } else {
                qtyDisplay.textContent = newQty;
                updateCartQuantity(product, newQty);
            }
        });
    }
}

// Update cart quantity
const updateCartQuantity = (product, newQty) => {
    const cartItem = findCartItemByProductId(product.id);
    if (!cartItem) return;
    
    const quantityValue = cartItem.querySelector('.quatity-value');
    const itemTotal = cartItem.querySelector('.item-total');
    const price = parseFloat(product.price.replace('$', ''));
    
    quantityValue.textContent = newQty;
    itemTotal.textContent = `$${(newQty * price).toFixed(2)}`;
    updateTotalPrice();
}

// Find cart item by product ID
const findCartItemByProductId = (productId) => {
    const items = cartList.querySelectorAll('.item');
    for (let item of items) {
        const dataId = item.getAttribute('data-id');
        if (dataId && parseInt(dataId) === productId) {
            return item;
        }
    }
    return null;
}

// Remove from cart
const removeFromCart = (productId) => {
    const cartItem = findCartItemByProductId(productId);
    if (cartItem) {
        cartItem.classList.add('slide-out');
        setTimeout(() => {
            cartItem.remove();
            AddProduct = AddProduct.filter(item => item.id !== productId);
            updateTotalPrice();
        }, 200);
    }
}

// Add to cart silently (without alert)
const addToCartSilently = (product) => {
    let quantity = 1;
    let price = parseFloat(product.price.replace('$', ''));

    const existProduct = AddProduct.find(item => item.id === product.id);
    if (existProduct) {
        return;
    }

    AddProduct.push(product);

    const cartItem = document.createElement('div');
    cartItem.classList.add('item');
    cartItem.setAttribute('data-id', product.id);

    cartItem.innerHTML = `
     <div class="images-container">
    <img src="${product.image}">
    </div>

    <div class="detail">
    <h4>${product.name}</h4>
    <h4 class="item-total">${product.price}</h4>
    </div>

    <div class="flex">
    <a href="#" class="quatity-btn minus"><i class="fa-solid fa-minus"></i></a>
    <h4 class="quatity-value">1</h4>
    <a href="#" class="quatity-btn plus"><i class="fa-solid fa-plus"></i></a>
    </div>
    `;

    cartList.appendChild(cartItem);
    updateTotalPrice();

    const plusBtn = cartItem.querySelector('.plus');
    const minusBtn = cartItem.querySelector('.minus');
    const quantityValue = cartItem.querySelector('.quatity-value');
    const itemTotal = cartItem.querySelector('.item-total');

    plusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        quantity = parseInt(quantityValue.textContent);
        quantity++;
        quantityValue.textContent = quantity;
        itemTotal.textContent = `$${(quantity * price).toFixed(2)}`;
        updateTotalPrice();
        
        // Update card quantity display
        updateCardDisplay(product.id, quantity);
    })

    minusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        quantity = parseInt(quantityValue.textContent);

        if (quantity > 1) {
            quantity--;
            quantityValue.textContent = quantity;
            itemTotal.textContent = `$${(quantity * price).toFixed(2)}`;
            updateTotalPrice();
            
            // Update card quantity display
            updateCardDisplay(product.id, quantity);
        } else {
            cartItem.classList.add('slide-out');

            setTimeout(() => {
                cartItem.remove();
                updateTotalPrice();
                AddProduct = AddProduct.filter(item => item.id !== product.id);
                
                // Reset card button
                resetCardButton(product.id);
            }, 200);
        }
    })
}

// Original addToCart with alert
const addToCart = (product) => {
    const existProduct = AddProduct.find(item => item.id === product.id);
    if (existProduct) {
        alert("Product is Already in the cart you can increase the quantity from cart");
        return;
    }
    
    addToCartSilently(product);
}

// Update card display quantity
const updateCardDisplay = (productId, quantity) => {
    const qtySelector = document.querySelector(`.quantity-selector[data-id="${productId}"]`);
    if (qtySelector) {
        const qtyDisplay = qtySelector.querySelector('.qty-display');
        if (qtyDisplay) {
            qtyDisplay.textContent = quantity;
        }
    }
}

// Reset card button to "Add to Cart"
const resetCardButton = (productId) => {
    const qtySelector = document.querySelector(`.quantity-selector[data-id="${productId}"]`);
    if (qtySelector) {
        const product = produtList.find(p => p.id === productId);
        const orderCard = qtySelector.closest('.order-card');
        const cardAction = orderCard.querySelector('.card-action');
        
        cardAction.innerHTML = `<a href="#" class="btn card-btn" data-id="${productId}">Add to Cart</a>`;
        
        const newBtn = cardAction.querySelector('.card-btn');
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCardButton(product, orderCard);
        });
    }
}

const initApp = () => {
    fetch('products.json').then
        (response => response.json()).then
        (data => {
            produtList = data;
            showCards();
        })
}

initApp();

// Modal Feature Implement
const modal = document.getElementById("foodModal");
const modalImage = document.getElementById("modalImage");
const modalName = document.getElementById("modalName");
const modalPrice = document.getElementById("modalPrice");
const modalDescription = document.getElementById("modalDescription");
const modalAddBtn = document.getElementById("addToCartBtn");
const modalViewBtn = document.getElementById("viewCartBtn");
const modalClose = document.querySelector(".modal .close");

function openFoodModal(product) {
    modalImage.src = product.image;
    modalName.textContent = product.name;
    modalPrice.textContent = product.price;
    modalDescription.textContent = product.description || "No description available.";
    modal.style.display = "flex";

    modalAddBtn.onclick = () => {
        const existingProduct = AddProduct.find(item => item.id === product.id);
        if (!existingProduct) {
            const orderCard = findOrderCardById(product.id);
            if (orderCard) {
                handleCardButton(product, orderCard);
            }
        } else {
            alert("Product is already in the cart!");
        }
        modal.style.display = "none";
    };

    modalViewBtn.onclick = () => {
        modal.style.display = "none";
        cartTab.classList.add("cart-tab-active");
    };
}

// Find order card by product ID
const findOrderCardById = (productId) => {
    const cardActions = cardList.querySelectorAll('.card-action');
    for (let action of cardActions) {
        const btn = action.querySelector('[data-id]');
        if (btn && parseInt(btn.getAttribute('data-id')) === productId) {
            return action.closest('.order-card');
        }
    }
    return null;
}

modalClose.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
document.addEventListener("keydown", e => { if (e.key === "Escape") modal.style.display = "none"; });