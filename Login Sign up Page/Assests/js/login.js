const passInput = document.getElementById("login-pass");
const togglePassBtn = document.getElementById("togglePassBtn");

// Helper to get returnUrl
function getReturnUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('returnUrl') || sessionStorage.getItem('returnUrl');
}

// Safe destination validator to prevent open redirects
function getSafeReturnUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    let decoded;
    try {
        decoded = decodeURIComponent(rawUrl).trim();
    } catch (e) {
        return null;
    }

    // Block dangerous protocols explicitly
    if (/^(javascript|data|vbscript):/i.test(decoded)) return null;

    // Check if it's a full URL with an origin
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(decoded)) {
        try {
            const parsed = new URL(decoded, window.location.href);
            // Only allow if same origin as current page
            if (window.location.origin && parsed.origin === window.location.origin) {
                return parsed.pathname + parsed.search + parsed.hash;
            }
            return null; // External origin -> blocked
        } catch (e) {
            return null;
        }
    }

    // Block protocol-relative URLs (//example.com)
    if (decoded.startsWith('//') || decoded.startsWith('\\\\')) return null;

    // Block control characters / whitespace hacks
    if (/[\r\n\t]/.test(decoded)) return null;

    // Relative internal paths are safe
    return decoded;
}

const safeUrl = getSafeReturnUrl(getReturnUrl());
if (safeUrl) {
    sessionStorage.setItem('returnUrl', safeUrl);
    // Link to signup should preserve returnUrl
    const signupLink = document.querySelector('a[href*="signup.html"]');
    if (signupLink) {
        signupLink.href = 'signup.html?returnUrl=' + encodeURIComponent(safeUrl);
    }
} else {
    sessionStorage.removeItem('returnUrl');
}

// تفعيل إظهار وإخفاء الباسورد مع أيقونة الساعة
togglePassBtn.addEventListener("click", () => {
    const isPassword = passInput.getAttribute("type") === "password";

    if (isPassword) {
        passInput.setAttribute("type", "text");
        togglePassBtn.classList.add("active");
    } else {
        passInput.setAttribute("type", "password");
        togglePassBtn.classList.remove("active");
    }
});

const email = document.querySelector("#login-email");
const pass = document.querySelector("#login-pass");
const form = document.forms[0];
const former = document.querySelector("#form-error");
const rememberMe = document.querySelector("#rememberMe");

let data = [];

// جلب المستخدمين من الـ API
let xhr = new XMLHttpRequest();
xhr.open('GET', 'https://6ab193d69751d2b03e6d5aaa.mockapi.io/project/users');
xhr.send();

xhr.addEventListener('readystatechange', () => {
    if (xhr.readyState === 4 && xhr.status === 200) {
        try {
            data = JSON.parse(xhr.responseText);
        } catch (e) {}
    }
});

form.addEventListener("submit", (e) => {
    e.preventDefault();

    // دمج مستخدمي الـ API مع المستخدمين المسجلين محلياً وحساب تجريبي جاهز لضمان العمل دائماً
    let localUsers = [];
    try {
        localUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    } catch (err) {}

    const demoUsers = [
        { id: "demo-1", name: "Alexander Sterling", email: "client@rolex.com", password: "Rolex@123" }
    ];

    const allUsers = [...demoUsers, ...data, ...localUsers];

    // البحث عن مستخدم يطابق الإيميل وكلمة المرور
    const inputEmail = email.value.trim().toLowerCase();
    const inputPass = pass.value.trim();

    const userFound = allUsers.find(user => 
        (user.email && user.email.trim().toLowerCase() === inputEmail) && 
        user.password === inputPass
    );

    if (userFound) {
        const id = userFound.id || Date.now();
        const name = userFound.name || "Client";
        const avatar = userFound.avatar || "";

        // حفظ بيانات تسجيل الدخول في localStorage
        localStorage.setItem("currentUser", JSON.stringify(userFound));
        localStorage.setItem("name", name);
        localStorage.setItem("id", id);
        localStorage.setItem("email", userFound.email || inputEmail);
        if (avatar) localStorage.setItem("avatar", avatar);

        // التحويل للصفحة المطلوبة إذا كانت آمنة أو الصفحة الرئيسية
        const targetUrl = getSafeReturnUrl(getReturnUrl());
        sessionStorage.removeItem('returnUrl');

        if (targetUrl) {
            window.location.assign(targetUrl);
        } else {
            document.location.assign(`../Home%20Page/index.html?id=${id}`);
        }
    } else {
        former.style.display = "inline-block";
    }
});