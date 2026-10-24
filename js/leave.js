document.addEventListener("DOMContentLoaded", () => {
    const session = getSession();
    if (!session) return;

    const company = getCompany() || { leaveQuota: 18, workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] };

    // ==========================================
    // 1. SHARED HELPERS: WORKING DAYS & OVERLAPS
    // ==========================================

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const workingDaysList = company.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    // Count only working days between 2 dates
    function countWorkingDays(startDateStr, endDateStr) {
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        let count = 0;

        let current = new Date(start);
        while (current <= end) {
            const dayName = dayNames[current.getDay()];
            if (workingDaysList.includes(dayName)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    }

    // Check if dates overlap
    function datesOverlap(startA, endA, startB, endB) {
        return new Date(startA) <= new Date(endB) && new Date(endA) >= new Date(startB);
    }

    // ==========================================
    // 2. EMPLOYEE DASHBOARD: APPLY & VIEW LEAVES
    // ==========================================
    const isEmployeeDashboard = document.getElementById("leaveApplyForm");
    if (isEmployeeDashboard) {
        const leaveModal = document.getElementById("leaveModal");
        const btnOpenLeaveModal = document.getElementById("btnOpenLeaveModal");
        const btnCloseLeaveModal = document.getElementById("btnCloseLeaveModal");
        const btnCancelLeaveModal = document.getElementById("btnCancelLeaveModal");
        const leaveApplyForm = document.getElementById("leaveApplyForm");
        const leaveError = document.getElementById("leaveFormError");
        const myLeavesTableBody = document.getElementById("myLeavesTableBody");

        function renderMyLeaves() {
            const leaves = getLeaves();
            const myLeaves = leaves.filter((l) => String(l.employeeId) === String(session.id));

            myLeavesTableBody.innerHTML = "";
            if (myLeaves.length === 0) {
                myLeavesTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">
              No leave applications submitted yet.
            </td>
          </tr>
        `;
                return;
            }

            myLeaves.sort((a, b) => b.id - a.id);

            myLeaves.forEach((lv) => {
                const tr = document.createElement("tr");
                let badgeClass = "badge-pending";
                if (lv.status === "approved") badgeClass = "badge-approved";
                else if (lv.status === "rejected") badgeClass = "badge-rejected";

                tr.innerHTML = `
          <td><strong>${lv.type}</strong></td>
          <td>${lv.from}</td>
          <td>${lv.to}</td>
          <td>${lv.days} day(s)</td>
          <td>${lv.reason}</td>
          <td><span class="badge ${badgeClass}">${lv.status}</span></td>
          <td style="color: var(--text-muted); font-size: 0.85rem;">${lv.comment || "--"}</td>
        `;
                myLeavesTableBody.appendChild(tr);
            });
        }

        btnOpenLeaveModal.addEventListener("click", () => {
            leaveError.style.display = "none";
            leaveApplyForm.reset();
            leaveModal.style.display = "flex";
        });

        const hideLeaveModal = () => {
            leaveModal.style.display = "none";
        };

        btnCloseLeaveModal.addEventListener("click", hideLeaveModal);
        btnCancelLeaveModal.addEventListener("click", hideLeaveModal);

        // Handle Submit
        leaveApplyForm.addEventListener("submit", (e) => {
            e.preventDefault();
            leaveError.style.display = "none";

            const type = document.getElementById("leaveType").value;
            const fromDate = document.getElementById("leaveFrom").value;
            const toDate = document.getElementById("leaveTo").value;
            const reason = document.getElementById("leaveReason").value.trim();

            if (!fromDate || !toDate || !reason) {
                leaveError.textContent = "Please fill in all leave fields.";
                leaveError.style.display = "block";
                return;
            }

            // Rule 1: From date must be <= To date
            if (new Date(fromDate) > new Date(toDate)) {
                leaveError.textContent = "From Date must be on or before To Date.";
                leaveError.style.display = "block";
                return;
            }

            // Rule 2: Calculate working days
            const daysCount = countWorkingDays(fromDate, toDate);
            if (daysCount === 0) {
                leaveError.textContent = "The selected range does not contain any working days.";
                leaveError.style.display = "block";
                return;
            }

            const allLeaves = getLeaves();
            const myLeaves = allLeaves.filter((l) => String(l.employeeId) === String(session.id));

            // Rule 3: Cannot overlap another leave
            const hasOverlap = myLeaves.some(
                (l) => l.status !== "rejected" && datesOverlap(fromDate, toDate, l.from, l.to)
            );

            if (hasOverlap) {
                leaveError.textContent = "You already have a pending or approved leave in this date range.";
                leaveError.style.display = "block";
                return;
            }

            // Rule 4: Cannot exceed yearly quota
            const approvedDays = myLeaves
                .filter((l) => l.status === "approved")
                .reduce((sum, l) => sum + (Number(l.days) || 0), 0);
            const remainingQuota = (company.leaveQuota || 18) - approvedDays;

            if (daysCount > remainingQuota) {
                leaveError.textContent = `You requested ${daysCount} days, but only have ${remainingQuota} leave(s) remaining.`;
                leaveError.style.display = "block";
                return;
            }

            // Save valid leave application
            const newLeave = {
                id: Date.now(),
                employeeId: session.id,
                employeeName: session.name,
                type,
                from: fromDate,
                to: toDate,
                days: daysCount,
                reason,
                status: "pending",
                comment: ""
            };

            allLeaves.push(newLeave);
            saveLeaves(allLeaves);

            hideLeaveModal();
            renderMyLeaves();
        });

        renderMyLeaves();
    }

    // ==========================================
    // 3. ADMIN PORTAL: LEAVE APPROVAL / REJECTION
    // ==========================================
    const isAdminLeavePage = document.getElementById("adminLeavesTableBody");
    if (isAdminLeavePage) {
        protectPage("admin");

        const reviewModal = document.getElementById("reviewModal");
        const reviewActionForm = document.getElementById("reviewActionForm");
        const reviewLeaveId = document.getElementById("reviewLeaveId");
        const reviewDecision = document.getElementById("reviewDecision");
        const adminComment = document.getElementById("adminComment");
        const btnCancelReview = document.getElementById("btnCancelReview");
        const btnConfirmReview = document.getElementById("btnConfirmReview");
        const reviewModalTitle = document.getElementById("reviewModalTitle");
        const reviewModalSub = document.getElementById("reviewModalSub");

        document.getElementById("navCompanyName").textContent = company.name || "HCM Lite";
        document.getElementById("logoutBtn").addEventListener("click", () => logoutUser());

        function renderAdminLeaves() {
            const leaves = getLeaves();
            const users = getUsers();

            isAdminLeavePage.innerHTML = "";
            if (leaves.length === 0) {
                isAdminLeavePage.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">
              No leave applications in system.
            </td>
          </tr>
        `;
                return;
            }

            leaves.sort((a, b) => b.id - a.id);

            leaves.forEach((lv) => {
                const emp = users.find((u) => String(u.id) === String(lv.employeeId));
                const empName = emp ? emp.name : lv.employeeName || "Unknown";
                const empDept = emp ? emp.department : "";

                let badgeClass = "badge-pending";
                if (lv.status === "approved") badgeClass = "badge-approved";
                else if (lv.status === "rejected") badgeClass = "badge-rejected";

                const tr = document.createElement("tr");
                tr.innerHTML = `
          <td><strong>${empName}</strong> <br><small style="color: var(--text-muted);">${empDept}</small></td>
          <td>${lv.type}</td>
          <td>${lv.from} to ${lv.to}</td>
          <td>${lv.days} day(s)</td>
          <td>${lv.reason}</td>
          <td><span class="badge ${badgeClass}">${lv.status}</span></td>
          <td>
            ${lv.status === "pending"
                        ? `<button class="btn btn-primary btn-sm btn-action" data-id="${lv.id}" data-action="approved" style="margin-right: 6px;">Approve</button>
                   <button class="btn btn-danger btn-sm btn-action" data-id="${lv.id}" data-action="rejected">Reject</button>`
                        : `<small style="color: var(--text-muted);">${lv.comment || "Reviewed"}</small>`
                    }
          </td>
        `;
                isAdminLeavePage.appendChild(tr);
            });

            // Bind action buttons
            document.querySelectorAll(".btn-action").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const leaveId = btn.getAttribute("data-id");
                    const decision = btn.getAttribute("data-action");
                    openReviewModal(leaveId, decision);
                });
            });
        }

        function openReviewModal(leaveId, decision) {
            reviewLeaveId.value = leaveId;
            reviewDecision.value = decision;
            adminComment.value = "";

            reviewModalTitle.textContent = decision === "approved" ? "Approve Leave Request" : "Reject Leave Request";
            reviewModalSub.textContent = `Provide notes/comment for this decision.`;

            btnConfirmReview.className = decision === "approved" ? "btn btn-primary" : "btn btn-danger";
            btnConfirmReview.textContent = decision === "approved" ? "Confirm Approval" : "Confirm Rejection";

            reviewModal.style.display = "flex";
        }

        btnCancelReview.addEventListener("click", () => {
            reviewModal.style.display = "none";
        });

        reviewActionForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const leaveId = reviewLeaveId.value;
            const decision = reviewDecision.value;
            const comment = adminComment.value.trim();

            const leaves = getLeaves();
            const target = leaves.find((l) => String(l.id) === String(leaveId));
            if (target) {
                target.status = decision;
                target.comment = comment;
                saveLeaves(leaves);
            }

            reviewModal.style.display = "none";
            renderAdminLeaves();
        });

        renderAdminLeaves();
    }
});