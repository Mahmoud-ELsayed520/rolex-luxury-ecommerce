/* =====================================================
   ROLEX E-COMMERCE — SHARED UTILITIES
   Used by all pages for consistent auth, cart, orders,
   wallet, and UI behavior.
   ===================================================== */

/* ---------- price formatter ---------- */
var money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
});

/* ---------- HTML escaping ---------- */
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ---------- path helper ---------- */
function basePath() {
    var path = window.location.pathname;
    if (path.indexOf('/pages/') !== -1) return '../';
    if (path.indexOf('/Home%20Page/') !== -1 || path.indexOf('/Home Page/') !== -1) return '../';
    if (path.indexOf('/Login%20Sign%20up%20Page/') !== -1 || path.indexOf('/Login Sign up Page/') !== -1) return '../';
    return '';
}

/* ---------- product image path helper ---------- */
function getProductImagePath(img) {
    if (!img) return '';
    var filename = img.split('/').pop();
    return basePath() + 'Home Page/images/' + filename;
}

/* =====================================================
   AUTH HELPERS
   Canonical keys: currentUser, name, email, id, avatar
   ===================================================== */
function isLoggedIn() {
    try {
        return !!localStorage.getItem('currentUser');
    } catch (e) {
        return false;
    }
}

function getCurrentUser() {
    try {
        var user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) return null;
        return {
            id: user.id || localStorage.getItem('id') || '',
            name: user.name || localStorage.getItem('name') || 'Client',
            email: user.email || localStorage.getItem('email') || '',
            avatar: user.avatar || localStorage.getItem('avatar') || ''
        };
    } catch (e) {
        return null;
    }
}

function logoutUser() {
    try {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('name');
        localStorage.removeItem('id');
        localStorage.removeItem('email');
        localStorage.removeItem('avatar');
    } catch (e) {}
    window.location.href = basePath() + 'Home Page/index.html';
}

function requireAuth(returnPage) {
    if (isLoggedIn()) return true;
    var returnUrl = returnPage || window.location.href;
    window.location.href = basePath() + 'Login Sign up Page/login.html?returnUrl=' + encodeURIComponent(returnUrl);
    return false;
}

/* =====================================================
   CART HELPERS
   Canonical key: cartItems
   ===================================================== */
var CART_KEY = 'cartItems';

function loadCart() {
    try {
        var saved = JSON.parse(localStorage.getItem(CART_KEY));
        if (!Array.isArray(saved)) return [];
        return saved.filter(function(item) {
            return item && typeof item.id === 'string' && Number.isFinite(item.price) && Number.isInteger(item.qty) && item.qty >= 1;
        }).map(function(item) {
            return { id: item.id, name: item.name || 'Watch', price: item.price, img: item.img || '', qty: Math.min(item.qty, 99) };
        });
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {}
}

function getCartCount() {
    var cart = loadCart();
    var total = 0;
    cart.forEach(function(item) { total += item.qty; });
    return total;
}

function getCartTotal(cart) {
    var total = 0;
    cart.forEach(function(item) { total += item.price * item.qty; });
    return total;
}

function addItemToCart(product) {
    var cart = loadCart();
    var existing = cart.find(function(item) { return item.id === product.id; });
    if (existing) {
        existing.qty = Math.min(existing.qty + 1, 99);
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, img: product.img, qty: 1 });
    }
    saveCart(cart);
    return cart;
}

/* =====================================================
   ORDER HELPERS
   Canonical key: rolex_orders
   Orders are tagged with userEmail for per-user filtering.
   ===================================================== */
function getOrders() {
    try {
        var allOrders = JSON.parse(localStorage.getItem('rolex_orders')) || [];
        var user = getCurrentUser();
        if (!user || !user.email) return [];
        var userEmailLower = user.email.toLowerCase();
        return allOrders.filter(function(order) {
            var orderUserEmail = (order.userEmail || order.email || '').toLowerCase();
            return orderUserEmail === userEmailLower;
        });
    } catch (e) {
        return [];
    }
}

function saveOrder(order) {
    try {
        var allOrders = JSON.parse(localStorage.getItem('rolex_orders')) || [];
        allOrders.unshift(order);
        localStorage.setItem('rolex_orders', JSON.stringify(allOrders));
    } catch (e) {}
}

/* =====================================================
   WALLET HELPERS
   Canonical key: rolex_wallet_{email}
   ===================================================== */
function getWallet() {
    var user = getCurrentUser();
    if (!user || !user.email) return { balance: 0, transactions: [] };
    var emailKey = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    try {
        var data = JSON.parse(localStorage.getItem('rolex_wallet_' + emailKey));
        if (data && typeof data.balance === 'number') return data;
    } catch(e) {}
    var initialWallet = { balance: 5000, transactions: [{ type: 'credit', amount: 5000, description: 'Welcome client credit', date: new Date().toISOString() }] };
    try {
        localStorage.setItem('rolex_wallet_' + emailKey, JSON.stringify(initialWallet));
    } catch(e) {}
    return initialWallet;
}

function saveWallet(wallet) {
    var user = getCurrentUser();
    if (!user || !user.email) return;
    var emailKey = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    try {
        localStorage.setItem('rolex_wallet_' + emailKey, JSON.stringify(wallet));
    } catch(e) {}
}

function walletDeduct(amount, description) {
    var wallet = getWallet();
    if (wallet.balance < amount) return false;
    wallet.balance -= amount;
    wallet.transactions.unshift({ type: 'debit', amount: amount, description: description, date: new Date().toISOString() });
    saveWallet(wallet);
    return true;
}

function walletCredit(amount, description) {
    var wallet = getWallet();
    wallet.balance += amount;
    wallet.transactions.unshift({ type: 'credit', amount: amount, description: description, date: new Date().toISOString() });
    saveWallet(wallet);
}

/* =====================================================
   SHARED UI: Cart badge + Account menu + Footer
   ===================================================== */
function initSharedUI() {
    updateCartBadge();
    initAccountMenu();
    initFooter();
}

function updateCartBadge() {
    var badges = document.querySelectorAll('.cart-count');
    var count = getCartCount();
    badges.forEach(function(badge) {
        if (count > 99) badge.textContent = '99+';
        else badge.textContent = count;
        if (count > 0) badge.classList.add('show');
        else badge.classList.remove('show');
    });
}

function initAccountMenu() {
    var accountLink = document.querySelector('.contact-content a[aria-label="Account"]');
    if (!accountLink) return;
    if (accountLink.parentNode && accountLink.parentNode.classList.contains('user-menu-wrapper')) return;

    var bp = basePath();
    var user = getCurrentUser();

    var wrapper = document.createElement('div');
    wrapper.className = 'user-menu-wrapper';
    wrapper.style.cssText = 'position:relative; display:inline-flex; align-items:center;';
    accountLink.parentNode.insertBefore(wrapper, accountLink);
    wrapper.appendChild(accountLink);

    var dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.style.cssText = 'position:absolute; top:calc(100% + 12px); right:0; width:210px; background:#121212; border:1px solid rgba(201,162,39,0.3); border-radius:4px; padding:10px 0; box-shadow:0 15px 35px rgba(0,0,0,0.8); display:none; flex-direction:column; z-index:1000;';

    if (user) {
        accountLink.title = 'Logged in as ' + user.name;
        accountLink.href = '#';
        dropdown.innerHTML =
            '<span style="padding:8px 16px 10px; font-size:11px; letter-spacing:1.5px; color:#C9A227; text-transform:uppercase; border-bottom:1px solid #282828; font-weight:600; display:block;">' + escapeHtml(user.name) + '</span>' +
            '<a href="' + bp + 'pages/orders.html" style="padding:10px 16px; font-size:13px; color:#ccc; display:flex; align-items:center; gap:10px; text-decoration:none;"><i class="bx bx-package"></i> My Orders</a>' +
            '<a href="' + bp + 'pages/wallet.html" style="padding:10px 16px; font-size:13px; color:#ccc; display:flex; align-items:center; gap:10px; text-decoration:none;"><i class="bx bx-wallet"></i> My Wallet</a>' +
            '<a href="' + bp + 'pages/cart.html" style="padding:10px 16px; font-size:13px; color:#ccc; display:flex; align-items:center; gap:10px; text-decoration:none;"><i class="bx bx-cart"></i> My Cart</a>' +
            '<button type="button" class="signout-btn" style="padding:10px 16px; font-size:13px; color:#ccc; display:flex; align-items:center; gap:10px; background:transparent; border:none; width:100%; text-align:left; cursor:pointer; font-family:inherit;"><i class="bx bx-log-out"></i> Sign Out</button>';

        accountLink.addEventListener('click', function(e) {
            e.preventDefault();
            dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
        });

        wrapper.appendChild(dropdown);
        dropdown.querySelector('.signout-btn').addEventListener('click', logoutUser);
    } else {
        accountLink.href = bp + 'Login Sign up Page/login.html';
    }

    document.addEventListener('click', function(e) {
        if (!wrapper.contains(e.target)) dropdown.style.display = 'none';
    });
}

function initFooter() {
    var footer = document.getElementById('footer');
    if (!footer || footer.innerHTML.trim()) return;

    var bp = basePath();
    footer.innerHTML =
        '<div style="text-align:center; padding:3.5rem 0 2rem; border-top:1px solid rgba(201,162,39,0.2); background:#090909; width:100%;">' +
            '<div style="font-family:\'Cormorant Garamond\', Georgia, serif; font-size:1.7rem; letter-spacing:0.32em; color:#C9A227; margin-bottom:1.2rem; font-weight:600;">ROLEX</div>' +
            '<div style="display:flex; justify-content:center; gap:2rem; margin-bottom:1.5rem; flex-wrap:wrap;">' +
                '<a href="' + bp + 'Home Page/index.html" style="color:rgba(255,255,255,0.7); text-decoration:none; font-size:0.8rem; letter-spacing:0.18em; text-transform:uppercase;">Home</a>' +
                '<a href="' + bp + 'Home Page/index.html#collection" style="color:rgba(255,255,255,0.7); text-decoration:none; font-size:0.8rem; letter-spacing:0.18em; text-transform:uppercase;">Collection</a>' +
                '<a href="' + bp + 'pages/cart.html" style="color:rgba(255,255,255,0.7); text-decoration:none; font-size:0.8rem; letter-spacing:0.18em; text-transform:uppercase;">Cart</a>' +
                '<a href="' + bp + 'pages/orders.html" style="color:rgba(255,255,255,0.7); text-decoration:none; font-size:0.8rem; letter-spacing:0.18em; text-transform:uppercase;">Orders</a>' +
                '<a href="' + bp + 'pages/wallet.html" style="color:rgba(255,255,255,0.7); text-decoration:none; font-size:0.8rem; letter-spacing:0.18em; text-transform:uppercase;">Wallet</a>' +
            '</div>' +
            '<p style="color:#555; font-size:0.8rem; letter-spacing:0.05em;">&copy; 2026 Rolex. All rights reserved.</p>' +
        '</div>';
}
