document.addEventListener("DOMContentLoaded", () => {

    // --- MOBILE HAMBURGER ---
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.links');

    if (toggle && links) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            links.classList.toggle('open');
        });
    }

    // --- NAVBAR SCROLL EFFECT ---
    const nav = document.getElementById("navbar");
    if (nav) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 50) nav.classList.add("scrolled");
            else nav.classList.remove("scrolled");
        });
    }

    // --- ANIMATIONS (Reveal on Scroll) ---
    const reveals = document.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add("active");
        });
    }, { threshold: 0.15 });

    reveals.forEach(el => revealObserver.observe(el));

    // --- NUMBER COUNTERS ---
    const counters = document.querySelectorAll(".counter");
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = +counter.getAttribute('data-target');
                const duration = 2000;
                const increment = target / (duration / 16);

                let current = 0;
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.innerText = Math.ceil(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.innerText = target;
                    }
                };
                updateCounter();
                counterObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));


    // --- PRODUCTS DATA (MOCK) ---
    const products = [
        { id: 1, name: "Tábua Rústica Premium", price: 299.90, category: "rustica", image: "images/board.jpeg", description: "Madeira nobre com acabamento natural." },
        { id: 2, name: "Tábua Churrasco Pro", price: 349.90, category: "corte", image: "images/board2.jpeg", description: "Canaleta profunda para líquidos." },
        { id: 3, name: "Tábua Elegance", price: 189.90, category: "servir", image: "images/board3.jpeg", description: "Design fino para servir queijos e frios." },
        { id: 4, name: "Conjunto Petisqueira", price: 129.90, category: "servir", image: "images/board.jpeg", description: "Ideal para reuniões e entradas." },
        { id: 5, name: "Bloco de Corte Master", price: 499.00, category: "corte", image: "images/board2.jpeg", description: "Espessura dupla para uso intenso." },
        { id: 6, name: "Tábua Orgânica", price: 259.90, category: "rustica", image: "images/board3.jpeg", description: "Formas naturais da árvore preservadas." }
    ];

    // --- RENDER PRODUCTS ---
    const productsGrid = document.getElementById("productsGrid");
    if (productsGrid) {
        function renderProducts(items) {
            productsGrid.innerHTML = items.map(product => `
            <div class="store-card fade-in-up">
                <div class="card-img-wrapper">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="card-content">
                    <span class="product-cat">${product.category}</span>
                    <h3>${product.name}</h3>
                    <p style="color:#aaa; font-size:0.9rem; margin-bottom:10px;">${product.description}</p>
                    <span class="price">R$ ${product.price.toFixed(2).replace('.', ',')}</span>
                    <button class="add-cart-btn" onclick="addToCart(${product.id})">
                        <i class="fas fa-shopping-bag"></i> Adicionar
                    </button>
                </div>
            </div>
        `).join('');
        }

        renderProducts(products);

        // --- FILTERS ---
        const searchInput = document.getElementById("searchInput");
        const categoryFilter = document.getElementById("categoryFilter");
        const sortFilter = document.getElementById("sortFilter");

        function filterProducts() {
            let filtered = [...products];
            const query = searchInput.value.toLowerCase();
            const category = categoryFilter.value;
            const sort = sortFilter.value;

            if (query) filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
            if (category !== 'all') filtered = filtered.filter(p => p.category === category);

            if (sort === 'low') filtered.sort((a, b) => a.price - b.price);
            if (sort === 'high') filtered.sort((a, b) => b.price - a.price);

            renderProducts(filtered);
        }

        searchInput.addEventListener("input", filterProducts);
        categoryFilter.addEventListener("change", filterProducts);
        sortFilter.addEventListener("change", filterProducts);
    }


    // --- CART LOGIC ---
    let cart = JSON.parse(localStorage.getItem("tabaumCart")) || [];
    const cartSidebar = document.getElementById("cartSidebar");
    const cartOverlay = document.getElementById("cartOverlay");
    const cartItemsContainer = document.getElementById("cartItems");
    const cartTotalEl = document.getElementById("cartTotal");
    const cartCountEl = document.getElementById("cartCount");

    // Global scope for onclick access styling
    window.addToCart = function (id) {
        const product = products.find(p => p.id === id);
        const existing = cart.find(item => item.id === id);

        if (existing) {
            existing.qty++;
        } else {
            cart.push({ ...product, qty: 1 });
        }

        updateCart();
        openCart();
    };

    window.removeFromCart = function (id) {
        cart = cart.filter(item => item.id !== id);
        updateCart();
    };

    window.changeQty = function (id, delta) {
        const item = cart.find(item => item.id === id);
        if (item) {
            item.qty += delta;
            if (item.qty <= 0) removeFromCart(id);
            else updateCart();
        }
    };

    function updateCart() {
        localStorage.setItem("tabaumCart", JSON.stringify(cart));

        // Update Count
        if (cartCountEl) {
            cartCountEl.innerText = cart.reduce((acc, item) => acc + item.qty, 0);
        }

        // Render Items
        if (cartItemsContainer) {
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Seu carrinho está vazio.</div>';
                cartTotalEl.innerText = "R$ 0,00";
                return;
            }

            cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <span class="item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
                    <div class="item-quantity">
                        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
                        <button class="remove-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `).join('');

            // Calc Total
            const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
            cartTotalEl.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
        }
    }

    function openCart() {
        if (cartSidebar) {
            cartSidebar.classList.add("open");
            cartOverlay.classList.add("open");
        }
    }

    function closeCart() {
        if (cartSidebar) {
            cartSidebar.classList.remove("open");
            cartOverlay.classList.remove("open");
        }
    }

    // Cart Triggers
    const cartBtn = document.getElementById("cartBtn");
    const closeCartBtn = document.getElementById("closeCart");
    // These might be null on index.html if we don't add the cart icon there, 
    // but the script runs on all pages. Adding safe checks.

    if (cartBtn) cartBtn.addEventListener("click", openCart);
    if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

    // Initialize Cart on Load
    updateCart();

    // --- AUTHENTICATION STATE ---
    function checkAuth() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        const loginBtns = document.querySelectorAll('.login-btn, [href="login.html"]');

        if (token && user) {
            loginBtns.forEach(btn => {
                // Determine if it's the icon-only button (nav) or text button
                if (btn.classList.contains('login-btn')) {
                    btn.innerHTML = `<i class="fas fa-user-check"></i> ${user.name.split(' ')[0]}`;
                } else if (btn.innerHTML.includes('fa-user-circle')) {
                    btn.innerHTML = `<i class="fas fa-user-check"></i>`;
                }

                // Change link to prevent going to login page again (optional, or add logout menu)
                btn.href = "#";
                btn.onclick = (e) => {
                    e.preventDefault();
                    if (confirm("Deseja sair da sua conta?")) {
                        logout();
                    }
                };
            });
        }
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    }

    checkAuth();
});
