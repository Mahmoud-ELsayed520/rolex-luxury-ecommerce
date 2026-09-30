// Helper to get returnUrl
function getReturnUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('returnUrl') || sessionStorage.getItem('returnUrl');
}

function getSafeReturnUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    let decoded;
    try {
        decoded = decodeURIComponent(rawUrl).trim();
    } catch (e) {
        return null;
    }
    if (/^(javascript|data|vbscript):/i.test(decoded)) return null;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(decoded)) {
        try {
            const parsed = new URL(decoded, window.location.href);
            if (window.location.origin && parsed.origin === window.location.origin) {
                return parsed.pathname + parsed.search + parsed.hash;
            }
            return null;
        } catch (e) {
            return null;
        }
    }
    if (decoded.startsWith('//') || decoded.startsWith('\\\\')) return null;
    if (/[\r\n\t]/.test(decoded)) return null;
    return decoded;
}

const returnUrl = getSafeReturnUrl(getReturnUrl());
if (returnUrl) {
    sessionStorage.setItem('returnUrl', returnUrl);
    const loginLink = document.querySelector('a[href*="login.html"]');
    if (loginLink) {
        loginLink.href = 'login.html?returnUrl=' + encodeURIComponent(returnUrl);
    }
} else {
    sessionStorage.removeItem('returnUrl');
}

const togglePassBtn = document.getElementById("togglePassBtn");

togglePassBtn.addEventListener("click", () => {
    // التحقق من نوع الحقل الحالي
    const isPassword = pass.getAttribute("type") === "password";

    if (isPassword) {
        pass.setAttribute("type", "text");
        togglePassBtn.classList.add("active"); // إظهار علامات الساعة وتوهجها
    } else {
        pass.setAttribute("type", "password");
        togglePassBtn.classList.remove("active"); // إخفاء علامات الساعة
    }
});



// Validate Functions

function validate_name(name) {
    name = name.trim();
    let name_pattern = /^[a-zA-Z\s]{3,15}$/;
    return name_pattern.test(name);
}
function validate_email(email) {
    email = email.trim();
    let email_pattern = /^\w+@[a-zA-Z]+\.(com|edu|org)$/;
    return email_pattern.test(email);
}
function validate_number(number) {
    number = number.trim();
    let number_pattern = /^\+2(010|011|012|015)\d{8}$/;
    return number_pattern.test(number);
}
function validate_pass(password) {
    password = password.trim();
    let password_pattern = /^[a-zA-Z]+@\d+$/;
    return password_pattern.test(password);
}



// catch elements & Event Listener

form = document.forms[0];
former = document.getElementById("form-error");
formValue = false;


Name = document.getElementById("name");
Nameer = document.getElementById("name-error");
NameValue = false

email = document.getElementById("email");
emailer = document.getElementById("email-error");
emailValue = false;

number = document.getElementById("number");
numberer = document.getElementById("number-error");
numberValue = false;

pass = document.getElementById("pass");
passer = document.getElementById("pass-error");
passValue = false;


Name.addEventListener("input", (e) => {
    if (validate_name(Name.value)) {
        Name.style.border = "4px solid green";
        Nameer.style.display = "none";
        NameValue = true;
    }
    else {
        Nameer.style.display = "block";
        Name.style.border = "4px solid red";
        NameValue = false;
    }
})
email.addEventListener("input", (e) => {
    if (validate_email(email.value)) {
        email.style.border = "4px solid green";
        emailer.style.display = "none";
        emailValue = true;
    }
    else {
        emailer.style.display = "block";
        email.style.border = "4px solid red";
        emailValue = false;
    }
})
number.addEventListener("input", (e) => {
    if (validate_number(number.value)) {
        number.style.border = "4px solid green";
        numberer.style.display = "none";
        numberValue = true;
    }
    else {
        numberer.style.display = "block";
        number.style.border = "4px solid red";
        numberValue = false;
    }
})
pass.addEventListener("input", (e) => {
    if (validate_pass(pass.value)) {
        pass.style.border = "4px solid green";
        passer.style.display = "none";
        passValue = true;
    }
    else {
        passer.style.display = "block";
        pass.style.border = "4px solid red";
        passValue = false;
    }
})

form.addEventListener("submit" , (e)=>{
    if(NameValue & emailValue & numberValue & passValue){
        e.preventDefault();
        former.style.display = "none";
// بنخزن البيانات عشان نعرف نتحكم فيها
            const data = {
                id: Date.now(),
                name: Name.value.trim(),
                email: email.value.trim(),
                number: number.value.trim(),
                password: pass.value.trim()
            };

            // حفظ المستخدم محلياً لضمان إمكانية تسجيل الدخول فوراً
            let localUsers = [];
            try {
                localUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
            } catch(err) {}
            localUsers.push(data);
            localStorage.setItem('registeredUsers', JSON.stringify(localUsers));

            // حولنا البيانات لـ أسترينج عشان نقدر نبعتها
            const jsondata = JSON.stringify(data);
            // بنبعت البيانات
            const xhr = new XMLHttpRequest();

            xhr.open("POST", "https://6ab193d69751d2b03e6d5aaa.mockapi.io/project/users");
            xhr.setRequestHeader("content-type", "application/json");
            xhr.send(jsondata);

            let redirected = false;
            const doRedirect = () => {
                if (!redirected) {
                    redirected = true;
                    const targetReturn = getReturnUrl();
                    if (targetReturn) {
                        document.location.assign("login.html?returnUrl=" + encodeURIComponent(targetReturn));
                    } else {
                        document.location.assign("login.html");
                    }
                }
            };

            xhr.addEventListener("readystatechange", (e) => {
                if (xhr.readyState == 4) {
                    doRedirect();
                }
            });

            // Fallback timeout in case API takes too long
            setTimeout(doRedirect, 2000);
        
        
    }
    else{
        e.preventDefault();
        former.style.display = "inline-block";
    }
})