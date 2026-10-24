// Smart Helper Chat Widget for Admin and Employee Dashboards

document.addEventListener("DOMContentLoaded", () => {
    const session = getSession();
    if (!session) return;

    const company = getCompany() || { startTime: "09:00", graceMinutes: 15, leaveQuota: 18 };

    // 1. Inject Chat Widget UI into DOM dynamically
    const chatContainer = document.createElement("div");
    chatContainer.id = "smartHelperWidget";
    chatContainer.innerHTML = `
    <!-- Floating Toggle Button -->
    <button id="helperToggleBtn" style="
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 12px 20px;
      font-size: 0.9rem;
      font-weight: 600;
      box-shadow: var(--shadow-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 999;
    ">
      <span>AI</span> Smart Helper
    </button>

    <!-- Chat Box Window -->
    <div id="helperChatWindow" style="
      display: none;
      position: fixed;
      bottom: 80px;
      right: 24px;
      width: 340px;
      height: 420px;
      background: #fff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      flex-direction: column;
      z-index: 1000;
      overflow: hidden;
    ">
      <!-- Header -->
      <div style="background: var(--primary); color: #fff; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-weight: 600; font-size: 0.95rem;">Smart Helper</div>
        <button id="helperCloseBtn" style="background: none; border: none; color: #fff; font-size: 1.2rem; cursor: pointer;">&times;</button>
      </div>

      <!-- Messages Body -->
      <div id="helperMessages" style="flex: 1; padding: 14px; overflow-y: auto; font-size: 0.85rem; display: flex; flex-direction: column; gap: 10px; background: #f8fafc;">
        <div style="background: #e2e8f0; padding: 8px 12px; border-radius: 8px; align-self: flex-start; max-width: 85%;">
          Hello ${session.name}! Ask me anything about employees, attendance, or leaves.
        </div>
      </div>

      <!-- Input Area -->
      <form id="helperForm" style="display: flex; border-top: 1px solid var(--border-color); padding: 8px; background: #fff;">
        <input type="text" id="helperInput" placeholder="Type a question..." style="flex: 1; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px; font-size: 0.85rem; outline: none;" required />
        <button type="submit" class="btn btn-primary btn-sm" style="margin-left: 6px;">Send</button>
      </form>
    </div>
  `;
    document.body.appendChild(chatContainer);

    const toggleBtn = document.getElementById("helperToggleBtn");
    const chatWindow = document.getElementById("helperChatWindow");
    const closeBtn = document.getElementById("helperCloseBtn");
    const messagesBox = document.getElementById("helperMessages");
    const helperForm = document.getElementById("helperForm");
    const helperInput = document.getElementById("helperInput");

    // Toggle open/close
    toggleBtn.addEventListener("click", () => {
        chatWindow.style.display = chatWindow.style.display === "flex" ? "none" : "flex";
        if (chatWindow.style.display === "flex") {
            helperInput.focus();
        }
    });

    closeBtn.addEventListener("click", () => {
        chatWindow.style.display = "none";
    });

    // Append message bubble
    function addMessage(text, isUser = false) {
        const bubble = document.createElement("div");
        bubble.style.padding = "8px 12px";
        bubble.style.borderRadius = "8px";
        bubble.style.maxWidth = "85%";
        bubble.style.fontSize = "0.85rem";
        bubble.style.lineHeight = "1.4";

        if (isUser) {
            bubble.style.background = "var(--primary)";
            bubble.style.color = "#fff";
            bubble.style.alignSelf = "flex-end";
        } else {
            bubble.style.background = "#e2e8f0";
            bubble.style.color = "var(--text-main)";
            bubble.style.alignSelf = "flex-start";
        }

        bubble.textContent = text;
        messagesBox.appendChild(bubble);
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    // Answer engine using real localStorage data
    function generateAnswer(query) {
        const q = query.toLowerCase();
        const today = new Date().toISOString().split("T")[0];
        const users = getUsers();
        const employees = users.filter((u) => u.role === "employee");
        const attendance = getAttendance();
        const leaves = getLeaves();

        // ==========================================
        // ADMIN QUERIES
        // ==========================================
        if (session.role === "admin") {
            // 1. Employee Count
            if (q.includes("employee") && (q.includes("how many") || q.includes("count") || q.includes("total"))) {
                return `We currently have ${employees.length} active employee(s) registered.`;
            }

            // 2. Who is on leave today
            if (q.includes("leave") && (q.includes("who") || q.includes("today"))) {
                const todayLeaves = leaves.filter(
                    (l) => l.status === "approved" && l.from <= today && l.to >= today
                );
                if (todayLeaves.length === 0) {
                    return "No employees are on leave today.";
                }
                const names = todayLeaves.map((l) => l.employeeName || "Employee").join(", ");
                return `${todayLeaves.length} employee(s) on leave today: ${names}.`;
            }

            // 3. Who was late today
            if (q.includes("late") && (q.includes("who") || q.includes("today"))) {
                const todayLate = attendance.filter((a) => a.date === today && a.status === "late");
                if (todayLate.length === 0) {
                    return "No employees arrived late today.";
                }
                const lateNames = todayLate
                    .map((a) => {
                        const emp = employees.find((u) => String(u.id) === String(a.employeeId));
                        return `${emp ? emp.name : "Employee"} (${a.checkIn})`;
                    })
                    .join(", ");
                return `${todayLate.length} employee(s) were late today: ${lateNames}.`;
            }

            // 4. Today's attendance summary
            if (q.includes("present") || q.includes("attendance")) {
                const todayPresent = attendance.filter((a) => a.date === today && (a.status === "present" || a.status === "late"));
                return `Today, ${todayPresent.length} out of ${employees.length} employees have punched attendance.`;
            }

            return "You can ask me: 'How many employees do we have?', 'Who is on leave today?', or 'Who was late today?'.";
        }

        // ==========================================
        // EMPLOYEE QUERIES (Own data only)
        // ==========================================
        if (session.role === "employee") {
            const myApprovedLeaves = leaves.filter(
                (l) => String(l.employeeId) === String(session.id) && l.status === "approved"
            );
            const usedDays = myApprovedLeaves.reduce((sum, l) => sum + (Number(l.days) || 0), 0);
            const remainingQuota = Math.max(0, (company.leaveQuota || 18) - usedDays);

            // 1. Remaining leaves
            if (q.includes("leave") && (q.includes("left") || q.includes("remaining") || q.includes("how many") || q.includes("balance"))) {
                return `You have ${remainingQuota} leave day(s) remaining out of your yearly quota of ${company.leaveQuota || 18}.`;
            }

            // 2. Was I late today
            if (q.includes("late") || q.includes("status")) {
                const myToday = attendance.find(
                    (a) => String(a.employeeId) === String(session.id) && a.date === today
                );
                if (!myToday) return "You have not checked in yet today.";
                if (myToday.status === "late") return `Yes, you were marked Late today (Checked in at ${myToday.checkIn}).`;
                if (myToday.status === "halfday") return `You are currently marked as Half Day (Worked under 5 hours).`;
                return `You arrived on time today! (Checked in at ${myToday.checkIn}).`;
            }

            // 3. Work hours
            if (q.includes("hour") || q.includes("time") || q.includes("worked")) {
                const myToday = attendance.find(
                    (a) => String(a.employeeId) === String(session.id) && a.date === today
                );
                if (!myToday || !myToday.checkOut) {
                    return "You haven't completed a full punch-out session today to tally hours.";
                }
                return `Today you checked in at ${myToday.checkIn} and checked out at ${myToday.checkOut}.`;
            }

            return "You can ask me: 'How many leaves do I have left?' or 'Was I late today?'.";
        }

        return "How may I assist you with HCM Lite today?";
    }

    // Handle Form Submit
    helperForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = helperInput.value.trim();
        if (!text) return;

        addMessage(text, true);
        helperInput.value = "";

        setTimeout(() => {
            const reply = generateAnswer(text);
            addMessage(reply, false);
        }, 300);
    });
});