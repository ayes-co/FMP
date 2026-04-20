// Page startup
document.addEventListener('DOMContentLoaded', () => {
    initSlider();
    initProductButtons();
    initWishlistButtons();
    updateWishlistSummary();
    renderCart();
    updateCartCount();
    initFirebaseAuth();
    initSignupForm();
    initLoginForm();
    initContactForm();
});

// Slider
function initSlider() {
    const sliderContainer = document.querySelector('.slider-container');
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (!sliderContainer || !slides.length) {
        return;
    }

    let currentIndex = 0;
    let autoSlide;

    function updateSlider() {
        sliderContainer.style.transform = `translateX(-${currentIndex * 25}%)`;
    }

    function startAutoSlide() {
        clearInterval(autoSlide);
        autoSlide = setInterval(() => {
            currentIndex = (currentIndex < slides.length - 1) ? currentIndex + 1 : 0;
            updateSlider();
        }, 5000);
    }

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : slides.length - 1;
            updateSlider();
            startAutoSlide();
        });

        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex < slides.length - 1) ? currentIndex + 1 : 0;
            updateSlider();
            startAutoSlide();
        });
    }

    updateSlider();
    startAutoSlide();
}

// Cart helpers
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function parsePrice(priceText) {
    return Number.parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
}

function formatPrice(price) {
    return `Rs. ${price.toLocaleString()}`;
}

// Product actions
function initProductButtons() {
    const addButtons = document.querySelectorAll('.product-card .add-to-cart-btn');

    addButtons.forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.product-card');
            if (!card) {
                return;
            }

            const name = card.querySelector('h3')?.textContent?.trim() || 'Product';
            const price = parsePrice(card.querySelector('p')?.textContent || '$0');
            const image = card.querySelector('img')?.getAttribute('src') || '';

            addToCart(name, price, image);
            button.textContent = 'Added';

            setTimeout(() => {
                button.textContent = 'Add to Cart';
            }, 1200);
        });
    });
}

// Wishlist actions
function initWishlistButtons() {
    const wishlistAddButtons = document.querySelectorAll('.wishlist-card .wishlist-btn:not(.secondary-btn)');
    const wishlistRemoveButtons = document.querySelectorAll('.wishlist-card .secondary-btn');

    wishlistAddButtons.forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.wishlist-card');
            if (!card) {
                return;
            }

            const name = card.querySelector('h3')?.textContent?.trim() || 'Product';
            const price = parsePrice(card.querySelector('.wishlist-card-content span')?.textContent || '$0');
            const image = card.querySelector('img')?.getAttribute('src') || '';

            addToCart(name, price, image);
            button.textContent = 'Added';
            updateWishlistSummary();

            setTimeout(() => {
                button.textContent = 'Add to Cart';
            }, 1200);

            window.location.href = 'add to cart.html';
        });
    });

    wishlistRemoveButtons.forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.wishlist-card');
            if (card) {
                card.remove();
                updateWishlistSummary();
            }
        });
    });
}

function updateWishlistSummary() {
    const wishlistCards = document.querySelectorAll('.wishlist-card');
    const summaryNumbers = document.querySelectorAll('.wishlist-summary-card strong');

    if (!wishlistCards.length || !summaryNumbers.length) {
        return;
    }

    summaryNumbers[0].textContent = String(wishlistCards.length).padStart(2, '0');
}

// Cart UI
function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const cartLink = document.querySelector('a[href="add to cart.html"]');
    if (cartLink) {
        let countBadge = cartLink.querySelector('.cart-count');
        if (!countBadge) {
            countBadge = document.createElement('span');
            countBadge.className = 'cart-count';
            cartLink.appendChild(countBadge);
        }
        countBadge.textContent = totalItems;
        countBadge.style.display = totalItems > 0 ? 'inline' : 'none';
    }
}

function addToCart(name, price, image) {
    let cart = getCart();
    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, image, quantity: 1 });
    }

    saveCart(cart);
    updateCartCount();
}

// Render cart table and totals
function renderCart() {
    const cartItemsBody = document.getElementById('cartItems');
    const subtotalElement = document.getElementById('subtotal');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');

    if (!cartItemsBody || !subtotalElement || !taxElement || !totalElement) {
        return;
    }

    const cart = getCart();

    if (!cart.length) {
        cartItemsBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Your cart is empty</td></tr>';
        subtotalElement.textContent = 'Rs. 0';
        taxElement.textContent = 'Rs. 0';
        totalElement.textContent = 'Rs. 0';
        return;
    }

    cartItemsBody.innerHTML = cart.map((item, index) => {
        const itemTotal = item.price * item.quantity;

        return `
            <tr>
                <td class="cart-product-info">
                    <img src="${item.image}" alt="${item.name}" class="cart-product-image">
                    <span>${item.name}</span>
                </td>
                <td>${formatPrice(item.price)}</td>
                <td>
                    <div class="cart-qty-controls">
                        <button class="qty-btn" type="button" data-action="decrease" data-index="${index}">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" type="button" data-action="increase" data-index="${index}">+</button>
                    </div>
                </td>
                <td>${formatPrice(itemTotal)}</td>
                <td><button class="remove-cart-btn" type="button" data-index="${index}">Remove</button></td>
            </tr>
        `;
    }).join('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    subtotalElement.textContent = formatPrice(Math.round(subtotal));
    taxElement.textContent = formatPrice(Math.round(tax));
    totalElement.textContent = formatPrice(Math.round(total));

    cartItemsBody.querySelectorAll('.qty-btn').forEach(button => {
        button.addEventListener('click', () => {
            updateCartQuantity(Number(button.dataset.index), button.dataset.action);
        });
    });

    cartItemsBody.querySelectorAll('.remove-cart-btn').forEach(button => {
        button.addEventListener('click', () => {
            removeCartItem(Number(button.dataset.index));
        });
    });
}

// Change item quantity in cart
function updateCartQuantity(index, action) {
    const cart = getCart();
    const item = cart[index];

    if (!item) {
        return;
    }

    if (action === 'increase') {
        item.quantity += 1;
    } else if (action === 'decrease') {
        item.quantity -= 1;
    }

    if (item.quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCart(cart);
    updateCartCount();
    renderCart();
}

// Remove one item from cart
function removeCartItem(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    updateCartCount();
    renderCart();
}

// Firebase config
var firebaseConfig = {
    apiKey: "AIzaSyCtJMx4tTyzaL7jVQev3T47_WOGKF0vi-w",
    authDomain: "fmp-project-19ca8.firebaseapp.com",
    projectId: "fmp-project-19ca8",
    storageBucket: "fmp-project-19ca8.firebasestorage.app",
    messagingSenderId: "988843337159",
    appId: "1:988843337159:web:52bd41f6b08726d54165e2",
    measurementId: "G-2H0ZD8545C"
};

// Firebase setup
function initFirebaseAuth() {
    if (typeof firebase === 'undefined') {
        return;
    }

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
}

// Signup input references
var userName = document.getElementById("userName");
var userEmail = document.getElementById("userEmail");
var userPass = document.getElementById("userPass");

// Create new account
function signUp() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        alert('Firebase is not loaded on this page.');
        return;
    }

    var fullNameInput = document.getElementById('fullname') || userName;
    var emailInput = document.getElementById('email') || userEmail;
    var passwordInput = document.getElementById('password') || userPass;
    var confirmInput = document.getElementById('confirm');

    if (!emailInput || !passwordInput) {
        return;
    }

    if (confirmInput && passwordInput.value !== confirmInput.value) {
        alert('Password and confirm password do not match.');
        return;
    }

    firebase.auth().createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
        .then((userCredential) => {
            var user = userCredential.user;

            if (fullNameInput && fullNameInput.value.trim()) {
                return user.updateProfile({
                    displayName: fullNameInput.value.trim()
                }).then(() => user);
            }

            return user;
        })
        .then(() => {
            alert('Account created successfully. Please log in.');
            window.location.href = './login.html';
        })
        .catch((error) => {
            console.log(error.message);
            alert(error.message);
        });
}


// Login input references
var loginEmail = document.getElementById("loginEmail");
var loginPass = document.getElementById("loginPass");

// Log user in
function signIn() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        alert('Firebase is not loaded on this page.');
        return;
    }

    var loginEmailInput = document.getElementById('loginEmail') || document.getElementById('email');
    var loginPassInput = document.getElementById('loginPass') || document.getElementById('password');

    if (!loginEmailInput || !loginPassInput) {
        return;
    }

    if (!loginEmailInput.value.trim() || !loginPassInput.value.trim()) {
        alert('Please enter your email and password.');
        return;
    }

    firebase.auth().signInWithEmailAndPassword(loginEmailInput.value, loginPassInput.value)
        .then((userCredential) => {
            var user = userCredential.user;
            console.log(user);
            window.location.href = "./home.html";
        })
        .catch((error) => {
            console.log(error.message);
            alert(error.message);
        });
}

// Signup form submit handler
function initSignupForm() {
    var signupForm = document.getElementById('signupForm');

    if (!signupForm) {
        return;
    }

    signupForm.addEventListener('submit', (event) => {
        event.preventDefault();
        signUp();
    });
}

// Login form submit handler
function initLoginForm() {
    var loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        signIn();
    });
}

// Contact form submit handler
function initContactForm() {
    var contactForm = document.querySelector('.contact-form');
    var contactButton = contactForm ? contactForm.querySelector('button[type="submit"]') : null;

    if (!contactForm || !contactButton) {
        return;
    }

    contactButton.addEventListener('click', (event) => {
        event.preventDefault();

        var fields = contactForm.querySelectorAll('input, textarea');
        var hasEmptyField = Array.from(fields).some((field) => !field.value.trim());

        if (hasEmptyField) {
            alert('Please fill all fields.');
            return;
        }

        alert('Your message has been sent successfully.');
        fields.forEach((field) => {
            field.value = '';
        });
    });
}
