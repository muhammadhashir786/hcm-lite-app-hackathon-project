// Ensure Employee role only
protectPage("employee");

document.addEventListener("DOMContentLoaded", () => {
    const session = getSession();
    const company = getCompany() || { startTime: "09:00", graceMinutes: 15, leaveQuota: 18 };

    // Setup UI basics
    if (company.name) {
        document.getElementById("navCompanyName").textContent = company.name;
    }
    document.getElementById("empNameDisplay").textContent = session.name;
    document.getElementById("empDeptDisplay").textContent = session.department || "Staff";
    document.getElementById("logoutBtn").addEventListener("click", () => logoutUser());

    // Elements
    const btnCheckIn = document.getElementById("btnCheckIn");
    const btnCheckOut = document.getElementById("btnCheckOut");
    const punchStatusText = document.getElementById("punchStatusText");
    const attendanceTableBody = document.getElementById("attendanceTableBody");

    // Helper: Format today date string (YYYY-MM-DD)
    function getTodayString() {
        return new Date().toISOString().split("T")[0];
    }

    // Helper: Current Time (HH:MM)
    function getCurrentTimeString() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    }

    // Calculate working hours between two HH:MM strings
    function calculateHours(inTime, outTime) {
        if (!inTime || !outTime) return 0;
        const [inH, inM] = inTime.split(":").map(Number);
        const [outH, outM] = outTime.split(":").map(Number);
        const diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
        return diffMinutes > 0 ? (diffMinutes / 60).toFixed(1) : 0;
    }

    // Determine if late based on company settings
    function isLateArrival(checkInTime, ruleStartTime, graceMinutes) {
        const [inH, inM] = checkInTime.split(":").map(Number);
        const [startH, startM] = ruleStartTime.split(":").map(Number);

        const actualInMinutes = inH * 60 + inM;
        const allowedMinutes = startH * 60 + startM + Number(graceMinutes);

        return actualInMinutes > allowedMinutes;
    }

    // Sync punch button states with today's record
    function updatePunchState() {
        const today = getTodayString();
        const attendance = getAttendance();
        const myTodayRecord = attendance.find(
            (a) => String(a.employeeId) === String(session.id) && a.date === today
        );

        if (!myTodayRecord) {
            btnCheckIn.disabled = false;
            btnCheckOut.disabled = true;
            punchStatusText.textContent = "Status: Not checked in yet today.";
        } else if (myTodayRecord.checkIn && !myTodayRecord.checkOut) {
            btnCheckIn.disabled = true;
            btnCheckOut.disabled = false;
            punchStatusText.textContent = `Status: Checked in at ${myTodayRecord.checkIn}. Punch out pending.`;
        } else {
            btnCheckIn.disabled = true;
            btnCheckOut.disabled = true;
            punchStatusText.textContent = `Status: Completed for today (In: ${myTodayRecord.checkIn} | Out: ${myTodayRecord.checkOut}).`;
        }
    }

    // Render personal attendance records and stats
    function renderMyAttendance() {
        const attendance = getAttendance();
        const leaves = getLeaves();
        const myRecords = attendance.filter((a) => String(a.employeeId) === String(session.id));

        // Calculate Summary Stats
        const presentCount = myRecords.filter((a) => a.status === "present").length;
        const lateCount = myRecords.filter((a) => a.status === "late").length;
        const halfDayCount = myRecords.filter((a) => a.status === "halfday").length;

        // Approved leaves count
        const myApprovedLeaves = leaves.filter(
            (l) => String(l.employeeId) === String(session.id) && l.status === "approved"
        );
        const usedLeaveDays = myApprovedLeaves.reduce((acc, curr) => acc + (Number(curr.days) || 0), 0);
        const remainingLeaves = Math.max(0, (company.leaveQuota || 18) - usedLeaveDays);

        document.getElementById("statPresentDays").textContent = presentCount;
        document.getElementById("statLateDays").textContent = lateCount;
        document.getElementById("statHalfDays").textContent = halfDayCount;
        document.getElementById("statLeavesLeft").textContent = remainingLeaves;

        // Render Table
        attendanceTableBody.innerHTML = "";
        if (myRecords.length === 0) {
            attendanceTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
            No attendance history found.
          </td>
        </tr>
      `;
            return;
        }

        // Sort descending by date
        myRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        myRecords.forEach((rec) => {
            const hours = calculateHours(rec.checkIn, rec.checkOut);
            const tr = document.createElement("tr");

            let badgeClass = "badge-present";
            if (rec.status === "late") badgeClass = "badge-late";
            else if (rec.status === "halfday") badgeClass = "badge-halfday";
            else if (rec.status === "absent") badgeClass = "badge-absent";

            tr.innerHTML = `
        <td>${rec.date}</td>
        <td>${rec.checkIn || "--:--"}</td>
        <td>${rec.checkOut || "--:--"}</td>
        <td>${hours > 0 ? hours + " hrs" : "--"}</td>
        <td><span class="badge ${badgeClass}">${rec.status}</span></td>
      `;
            attendanceTableBody.appendChild(tr);
        });
    }

    // Handle Check-In Button Click
    btnCheckIn.addEventListener("click", () => {
        const today = getTodayString();
        const currentTime = getCurrentTimeString();
        const attendance = getAttendance();

        // Determine present or late
        const isLate = isLateArrival(currentTime, company.startTime || "09:00", company.graceMinutes || 15);
        const status = isLate ? "late" : "present";

        const newRecord = {
            id: Date.now(),
            employeeId: session.id,
            date: today,
            checkIn: currentTime,
            checkOut: null,
            status: status
        };

        attendance.push(newRecord);
        saveAttendance(attendance);

        updatePunchState();
        renderMyAttendance();
    });

    // Handle Check-Out Button Click
    btnCheckOut.addEventListener("click", () => {
        const today = getTodayString();
        const currentTime = getCurrentTimeString();
        const attendance = getAttendance();

        const recordIndex = attendance.findIndex(
            (a) => String(a.employeeId) === String(session.id) && a.date === today
        );

        if (recordIndex !== -1) {
            const checkInTime = attendance[recordIndex].checkIn;
            const hoursWorked = calculateHours(checkInTime, currentTime);

            attendance[recordIndex].checkOut = currentTime;

            // Rule: Under 5 hours = half day
            if (hoursWorked < 5) {
                attendance[recordIndex].status = "halfday";
            }

            saveAttendance(attendance);
            updatePunchState();
            renderMyAttendance();
        }
    });

    // Initial load
    updatePunchState();
    renderMyAttendance();
});