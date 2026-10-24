// Authentication helper functions

// User Login function
function loginUser(email, password) {
    const users = getUsers();
    const matchedUser = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (!matchedUser) {
        return { success: false, message: "Invalid email or password." };
    }

    // Session save karo (password session me store nahi karte security ke liye)
    const sessionUser = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role, // 'admin' ya 'employee'
        department: matchedUser.department || "",
        salary: matchedUser.salary || 0
    };

    saveSession(sessionUser);
    return { success: true, user: sessionUser };
}

// User Logout function
function logoutUser() {
    clearSession();
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    window.location.href = isInPagesFolder ? "../index.html" : "index.html";
}

// Route Protection Guard
function protectPage(requiredRole = null) {
    const session = getSession();
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    const loginPath = isInPagesFolder ? "../index.html" : "index.html";
    const adminDashboardPath = isInPagesFolder ? "admin.html" : "pages/admin.html";
    const employeeDashboardPath = isInPagesFolder ? "employee.html" : "pages/employee.html";

    // Agar user logged in nahi hai
    if (!session) {
        window.location.href = loginPath;
        return;
    }

    // Agar specific role required hai aur match nahi hota
    if (requiredRole && session.role !== requiredRole) {
        if (session.role === "employee") {
            window.location.href = employeeDashboardPath;
        } else if (session.role === "admin") {
            window.location.href = adminDashboardPath;
        }
    }
}

// --- Index / Login Page Controller ---
document.addEventListener("DOMContentLoaded", () => {
    const setupBox = document.getElementById("setupBox");
    const loginBox = document.getElementById("loginBox");

    // Agar hum index.html page par nahi hain toh aage execute na ho
    if (!setupBox && !loginBox) return;

    // Agar pehle se logged-in session exist karta hai toh direct redirect karo
    const session = getSession();
    if (session) {
        window.location.href = session.role === "admin" ? "pages/admin.html" : "pages/employee.html";
        return;
    }

    const company = getCompany();

    // First-run setup check
    if (!company) {
        setupBox.style.display = "block";
    } else {
        const displayCompanyName = document.getElementById("displayCompanyName");
        if (displayCompanyName) {
            displayCompanyName.textContent = company.name;
        }
        loginBox.style.display = "block";
    }

    // First-Run Setup Form Submit
    const setupForm = document.getElementById("setupForm");
    if (setupForm) {
        setupForm.addEventListener("submit", (e) => {
            e.preventDefault();
            let isValid = true;

            const compName = document.getElementById("companyName").value.trim();
            const adminName = document.getElementById("adminName").value.trim();
            const adminEmail = document.getElementById("adminEmail").value.trim();
            const adminPass = document.getElementById("adminPassword").value.trim();

            // Form validation
            if (!compName) {
                document.getElementById("group-compName").classList.add("has-error");
                isValid = false;
            } else {
                document.getElementById("group-compName").classList.remove("has-error");
            }

            if (!adminName) {
                document.getElementById("group-adminName").classList.add("has-error");
                isValid = false;
            } else {
                document.getElementById("group-adminName").classList.remove("has-error");
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(adminEmail)) {
                document.getElementById("group-adminEmail").classList.add("has-error");
                isValid = false;
            } else {
                document.getElementById("group-adminEmail").classList.remove("has-error");
            }

            if (adminPass.length < 4) {
                document.getElementById("group-adminPass").classList.add("has-error");
                isValid = false;
            } else {
                document.getElementById("group-adminPass").classList.remove("has-error");
            }

            if (!isValid) return;

            // Default company settings as per rule doc
            const companyData = {
                name: compName,
                startTime: "09:00",
                graceMinutes: 15,
                leaveQuota: 18,
                workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
            };

            const adminUser = {
                id: Date.now(),
                name: adminName,
                email: adminEmail,
                password: adminPass,
                role: "admin",
                department: "Management",
                salary: 0
            };

            saveCompany(companyData);
            saveUsers([adminUser]);

            // Auto login admin and redirect
            loginUser(adminEmail, adminPass);
            window.location.href = "pages/admin.html";
        });
    }

    // Regular Login Form Submit
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const pass = document.getElementById("loginPassword").value.trim();
            const loginAlert = document.getElementById("loginAlert");

            if (loginAlert) loginAlert.style.display = "none";

            if (!email || !pass) {
                if (loginAlert) {
                    loginAlert.textContent = "Please fill in all fields.";
                    loginAlert.style.display = "block";
                }
                return;
            }

            const authResult = loginUser(email, pass);
            if (authResult.success) {
                window.location.href = authResult.user.role === "admin" ? "pages/admin.html" : "pages/employee.html";
            } else {
                if (loginAlert) {
                    loginAlert.textContent = authResult.message;
                    loginAlert.style.display = "block";
                }
            }
        });
    }
});