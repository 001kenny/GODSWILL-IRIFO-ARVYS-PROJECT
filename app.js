const STORAGE_KEY = "studentManagementStudents";

const elements = {
    tableBody: document.getElementById("studentTableBody"),
    emptyState: document.getElementById("emptyState"),
    searchInput: document.getElementById("searchInput"),
    openModalBtn: document.getElementById("openRegisterBtn"),
    closeModalBtn: document.getElementById("closeModalBtn"),
    cancelBtn: document.getElementById("cancelBtn"),
    modalOverlay: document.getElementById("modalOverlay"),
    modalTitle: document.getElementById("modalTitle"),
    submitBtn: document.getElementById("submitBtn"),
    form: document.getElementById("studentForm"),
    studentId: document.getElementById("studentId"),
    fullName: document.getElementById("fullName"),
    studentNumber: document.getElementById("studentNumber"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    course: document.getElementById("course"),
    totalCount: document.getElementById("totalCount"),
    courseCount: document.getElementById("courseCount"),
    newestEntry: document.getElementById("newestEntry"),
    studentSummary: document.getElementById("studentSummary"),
    toast: document.getElementById("toast")
};

let students = loadStudents();

function loadStudents() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function saveStudents() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}

function getInitials(name) {
    return name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join("");
}

function getAvatarColor(name) {
    const colors = ["#55767f", "#668c7a", "#94775d", "#697c98", "#7a6f8f", "#8c7d5d"];
    const index = [...name].reduce((total, character) => total + character.charCodeAt(0), 0) % colors.length;
    return colors[index];
}

function renderStudents() {
    const query = elements.searchInput.value.trim().toLowerCase();
    const filtered = students.filter(student =>
        [student.fullName, student.studentNumber, student.email, student.course, student.phone]
            .some(value => value.toLowerCase().includes(query))
    );

    elements.tableBody.innerHTML = "";

    filtered.forEach(student => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <div class="student-cell">
                    <div class="student-avatar" style="background:${getAvatarColor(student.fullName)}">${escapeHtml(getInitials(student.fullName))}</div>
                    <div>
                        <strong>${escapeHtml(student.fullName)}</strong>
                        <span>${escapeHtml(student.email)}</span>
                    </div>
                </div>
            </td>
            <td><span class="student-id">${escapeHtml(student.studentNumber)}</span></td>
            <td>${escapeHtml(student.course)}</td>
            <td>${escapeHtml(student.phone)}</td>
            <td><span class="status">Active</span></td>
            <td class="action-cell">
                <button class="action-btn edit" type="button" data-action="edit" data-id="${student.id}" title="Edit student" aria-label="Edit ${escapeHtml(student.fullName)}">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
                </button>
                <button class="action-btn delete" type="button" data-action="delete" data-id="${student.id}" title="Delete student" aria-label="Delete ${escapeHtml(student.fullName)}">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></svg>
                </button>
            </td>`;
        elements.tableBody.appendChild(row);
    });

    const hasResults = filtered.length > 0;
    elements.emptyState.classList.toggle("visible", !hasResults);
    document.querySelector("table").style.display = hasResults ? "table" : "none";

    updateStats();
}

function updateStats() {
    elements.totalCount.textContent = students.length;
    elements.courseCount.textContent = new Set(students.map(student => student.course)).size;
    elements.newestEntry.textContent = students.length ? students[students.length - 1].studentNumber : "—";
    elements.studentSummary.textContent = students.length
        ? `${students.length} student${students.length === 1 ? "" : "s"} in the directory`
        : "No students registered yet";
}

function openModal(student = null) {
    elements.form.reset();
    elements.studentId.value = "";

    if (student) {
        elements.modalTitle.textContent = "Update Student";
        elements.submitBtn.textContent = "Save Changes";
        elements.studentId.value = student.id;
        elements.fullName.value = student.fullName;
        elements.studentNumber.value = student.studentNumber;
        elements.email.value = student.email;
        elements.phone.value = student.phone;
        elements.course.value = student.course;
    } else {
        elements.modalTitle.textContent = "Register Student";
        elements.submitBtn.textContent = "Register Student";
    }

    elements.modalOverlay.classList.add("open");
    elements.modalOverlay.setAttribute("aria-hidden", "false");
    setTimeout(() => elements.fullName.focus(), 150);
}

function closeModal() {
    elements.modalOverlay.classList.remove("open");
    elements.modalOverlay.setAttribute("aria-hidden", "true");
}

function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => elements.toast.classList.remove("show"), 2400);
}

function generateId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

elements.form.addEventListener("submit", event => {
    event.preventDefault();

    const studentData = {
        fullName: elements.fullName.value.trim(),
        studentNumber: elements.studentNumber.value.trim(),
        email: elements.email.value.trim(),
        phone: elements.phone.value.trim(),
        course: elements.course.value
    };

    const existingId = elements.studentId.value;

    if (existingId) {
        students = students.map(student =>
            student.id === existingId ? { ...student, ...studentData } : student
        );
        showToast("Student information updated");
    } else {
        students.push({ id: generateId(), ...studentData });
        showToast("Student registered successfully");
    }

    saveStudents();
    renderStudents();
    closeModal();
});

elements.tableBody.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const student = students.find(item => item.id === button.dataset.id);
    if (!student) return;

    if (button.dataset.action === "edit") {
        openModal(student);
    }

    if (button.dataset.action === "delete") {
        const confirmed = window.confirm(`Delete ${student.fullName} from the student list?`);
        if (confirmed) {
            students = students.filter(item => item.id !== student.id);
            saveStudents();
            renderStudents();
            showToast("Student deleted");
        }
    }
});

elements.openModalBtn.addEventListener("click", () => openModal());
elements.closeModalBtn.addEventListener("click", closeModal);
elements.cancelBtn.addEventListener("click", closeModal);
elements.searchInput.addEventListener("input", renderStudents);

elements.modalOverlay.addEventListener("click", event => {
    if (event.target === elements.modalOverlay) closeModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && elements.modalOverlay.classList.contains("open")) {
        closeModal();
    }
});

renderStudents();
