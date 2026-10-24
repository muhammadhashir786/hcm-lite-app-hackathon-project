// Ensure Admin role only
protectPage("admin");

document.addEventListener("DOMContentLoaded", () => {
    // Brand name & Logout handling
    const company = getCompany();
    if (company) {
        document.getElementById("navCompanyName").textContent = company.name;
    }
    document.getElementById("logoutBtn").addEventListener("click", () => logoutUser());

    // UI Elements
    const employeesTableBody = document.getElementById("employeesTableBody");
    const searchInput = document.getElementById("searchInput");
    const departmentFilter = document.getElementById("departmentFilter");

    const modal = document.getElementById("employeeModal");
    const openAddModalBtn = document.getElementById("openAddModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelModalBtn = document.getElementById("cancelModalBtn");
    const employeeForm = document.getElementById("employeeForm");
    const modalTitle = document.getElementById("modalTitle");

    // Inputs
    const idInput = document.getElementById("employeeId");
    const nameInput = document.getElementById("empName");
    const emailInput = document.getElementById("empEmail");
    const passInput = document.getElementById("empPassword");
    const deptInput = document.getElementById("empDept");
    const salaryInput = document.getElementById("empSalary");
    const emailError = document.getElementById("empEmailError");

    // Modal display toggles
    function openModal(editMode = false) {
        clearFormErrors();
        modalTitle.textContent = editMode ? "Edit Employee" : "Add New Employee";
        modal.style.display = "flex";
    }

    function closeModal() {
        employeeForm.reset();
        idInput.value = "";
        clearFormErrors();
        modal.style.display = "none";
    }

    function clearFormErrors() {
        document.querySelectorAll(".form-group").forEach((grp) => grp.classList.remove("has-error"));
    }

    openAddModalBtn.addEventListener("click", () => openModal(false));
    closeModalBtn.addEventListener("click", closeModal);
    cancelModalBtn.addEventListener("click", closeModal);

    // Render Employee Rows
    function renderEmployees() {
        const users = getUsers();
        const employees = users.filter((u) => u.role === "employee");

        const query = searchInput.value.trim().toLowerCase();
        const dept = departmentFilter.value;

        const filtered = employees.filter((emp) => {
            const matchSearch =
                emp.name.toLowerCase().includes(query) || emp.email.toLowerCase().includes(query);
            const matchDept = dept === "ALL" || emp.department === dept;
            return matchSearch && matchDept;
        });

        employeesTableBody.innerHTML = "";

        if (filtered.length === 0) {
            employeesTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
            No employees found.
          </td>
        </tr>
      `;
            return;
        }

        filtered.forEach((emp) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td style="font-weight: 600;">${emp.name}</td>
        <td>${emp.email}</td>
        <td><span class="badge" style="background: #e2e8f0; color: #334155;">${emp.department || "General"}</span></td>
        <td>Rs. ${Number(emp.salary).toLocaleString()}</td>
        <td>
          <button class="btn btn-outline btn-sm edit-btn" data-id="${emp.id}" style="margin-right: 6px;">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${emp.id}">Delete</button>
        </td>
      `;
            employeesTableBody.appendChild(tr);
        });

        // Attach row events
        document.querySelectorAll(".edit-btn").forEach((btn) => {
            btn.addEventListener("click", () => handleEdit(btn.getAttribute("data-id")));
        });

        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(btn.getAttribute("data-id")));
        });
    }

    // Edit Employee
    function handleEdit(id) {
        const users = getUsers();
        const emp = users.find((u) => String(u.id) === String(id));
        if (!emp) return;

        idInput.value = emp.id;
        nameInput.value = emp.name;
        emailInput.value = emp.email;
        passInput.value = emp.password;
        deptInput.value = emp.department;
        salaryInput.value = emp.salary;

        openModal(true);
    }

    // Delete Employee
    function handleDelete(id) {
        if (!confirm("Are you sure you want to remove this employee?")) return;
        const users = getUsers();
        const updatedUsers = users.filter((u) => String(u.id) !== String(id));
        saveUsers(updatedUsers);
        renderEmployees();
    }

    // Handle Form Submit with Strict Validation Rules
    employeeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        let isValid = true;
        clearFormErrors();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passInput.value.trim();
        const dept = deptInput.value;
        const salary = parseFloat(salaryInput.value);
        const existingId = idInput.value;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const users = getUsers();

        // 1. Name Check
        if (!name) {
            document.getElementById("group-empName").classList.add("has-error");
            isValid = false;
        }

        // 2. Email Checks
        if (!emailRegex.test(email)) {
            emailError.textContent = "Please enter a valid email format.";
            document.getElementById("group-empEmail").classList.add("has-error");
            isValid = false;
        } else {
            // Check if email already used by another user
            const duplicateEmail = users.some(
                (u) => u.email.toLowerCase() === email.toLowerCase() && String(u.id) !== String(existingId)
            );
            if (duplicateEmail) {
                emailError.textContent = "This email is already in use.";
                document.getElementById("group-empEmail").classList.add("has-error");
                isValid = false;
            }
        }

        // 3. Password Check
        if (password.length < 4) {
            document.getElementById("group-empPassword").classList.add("has-error");
            isValid = false;
        }

        // 4. Department Check
        if (!dept) {
            document.getElementById("group-empDept").classList.add("has-error");
            isValid = false;
        }

        // 5. Salary Check (> 0)
        if (isNaN(salary) || salary <= 0) {
            document.getElementById("group-empSalary").classList.add("has-error");
            isValid = false;
        }

        if (!isValid) return;

        if (existingId) {
            // Edit existing user
            const userIndex = users.findIndex((u) => String(u.id) === String(existingId));
            if (userIndex !== -1) {
                users[userIndex] = {
                    ...users[userIndex],
                    name,
                    email,
                    password,
                    department: dept,
                    salary
                };
            }
        } else {
            // Create new employee (Auto login ready)
            users.push({
                id: Date.now(),
                name,
                email,
                password,
                role: "employee",
                department: dept,
                salary
            });
        }

        saveUsers(users);
        closeModal();
        renderEmployees();
    });

    // Filter & Search input events
    searchInput.addEventListener("input", renderEmployees);
    departmentFilter.addEventListener("change", renderEmployees);

    // Initial table render
    renderEmployees();
});