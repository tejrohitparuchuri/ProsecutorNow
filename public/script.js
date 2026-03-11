let currentUser = localStorage.getItem('currentUser');
let isAdmin = localStorage.getItem('isAdmin') === 'true';

document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        const userControls = document.getElementById('user-controls');
        if (userControls) userControls.classList.add('hidden');

        const loggedInControls = document.getElementById('logged-in-controls');
        if (loggedInControls) loggedInControls.classList.remove('hidden');

        const welcomeMsg = document.getElementById('welcome-msg');
        if (welcomeMsg) welcomeMsg.innerText = `Welcome, ${currentUser}`;

        const adminBtn = document.getElementById('btn-admin');
        const fileBtn = document.getElementById('btn-file-case');
        const prosBtn = document.getElementById('btn-prosecutor');

        if (isAdmin && adminBtn) {
            adminBtn.classList.remove('hidden');
            if (fileBtn) fileBtn.classList.add('hidden');
            if (prosBtn) prosBtn.classList.add('hidden');
        } else {
            if (adminBtn) adminBtn.classList.add('hidden');
            if (fileBtn) fileBtn.classList.remove('hidden');
            if (prosBtn) prosBtn.classList.remove('hidden');
        }

        if (!window.location.pathname.includes('file-case.html')) {
            loadMyCases();
        }
    } else {
        // If not logged in and on the file-case page, redirect back
        if (window.location.pathname.includes('file-case.html')) {
            alert("You must be logged in to file a case.");
            window.location.href = 'index.html';
        }
    }
});

function showModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function hideModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(s => s.classList.add('hidden'));

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.remove('hidden');
    }
}

function showResult(boxId, message, isError = false) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.innerHTML = message;
    box.className = 'result-box ' + (isError ? 'error' : '');
    box.classList.remove('hidden');
}

async function checkCaseStatus() {
    const progressId = document.getElementById('progress-id-input').value.trim();
    if (!progressId) return alert('Please enter a Progress ID');

    const btn = document.querySelector('.search-btn');
    const oldText = btn.innerText;
    btn.innerText = "Checking...";

    try {
        const response = await fetch(`/api/case-status/${progressId}`);
        const data = await response.json();

        if (data.success) {
            let hearingStr = data.next_hearing_date ? `<br><strong>Next Hearing:</strong> <span style="font-size:1.1rem; color:var(--primary-color);">${data.next_hearing_date}</span>` : '';
            showResult('status-result', `<strong>Case Phase Status:</strong> <span style="font-size:1.1rem; color:var(--text-color);">${data.status}</span>${hearingStr}<br><br><small style="color: #475569;">(Only the status phase is visible. Description details remain hidden for unauthorized users)</small>`);
        } else {
            showResult('status-result', `${data.message}`, true);
        }
    } catch (err) {
        showResult('status-result', `Connection Error`, true);
    }

    btn.innerText = oldText;
}

async function checkCaseDetails() {
    const progressId = document.getElementById('secure-progress-id-input').value.trim();
    if (!progressId) return alert('Please enter your Progress ID');
    if (!currentUser) return alert('You must be logged in to view details');

    const btn = document.querySelectorAll('.search-btn')[1];
    const oldText = btn.innerText;
    btn.innerText = "Fetching Details...";

    try {
        const response = await fetch(`/api/case-details/${progressId}/${currentUser}`);
        const data = await response.json();

        if (data.success) {
            showResult('details-result', `<strong>Case Description Details:</strong><br><br><div style="background: rgba(0,0,0,0.03); padding: 15px; border-radius: 8px; border-left: 3px solid var(--primary-color);">${data.description.replace(/\n/g, '<br>')}</div>`);
        } else {
            showResult('details-result', `<strong>Access Denied</strong><br>${data.message}`, true);
        }
    } catch (err) {
        showResult('details-result', `Connection Error`, true);
    }

    btn.innerText = oldText;
}

async function handleLogin(e) {
    e.preventDefault();
    const userid = document.getElementById('login-userid').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userid, password })
        });
        const data = await response.json();

        if (data.success) {
            currentUser = data.userid;
            isAdmin = data.is_admin;
            localStorage.setItem('currentUser', currentUser);
            localStorage.setItem('isAdmin', isAdmin);

            hideModal('login-modal');

            if (isAdmin) {
                window.location.href = 'admin.html';
                return;
            }

            document.getElementById('user-controls').classList.add('hidden');
            document.getElementById('logged-in-controls').classList.remove('hidden');
            document.getElementById('welcome-msg').innerText = `Welcome, ${currentUser}`;

            const fileBtn = document.getElementById('btn-file-case');
            const prosBtn = document.getElementById('btn-prosecutor');
            if (fileBtn) fileBtn.classList.remove('hidden');
            if (prosBtn) prosBtn.classList.remove('hidden');

            document.getElementById('login-form').reset();

            document.getElementById('status-result').classList.add('hidden');
            document.getElementById('details-result').classList.add('hidden');

            if (!window.location.pathname.includes('file-case.html')) {
                loadMyCases();
            }
        } else {
            alert(data.message || 'Login Failed');
        }
    } catch (err) {
        alert('Server Error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const userid = document.getElementById('reg-userid').value.trim();
    const aadhar_number = document.getElementById('reg-aadhar').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userid, aadhar_number, password })
        });
        const data = await response.json();

        if (data.success) {
            alert('Registration successful! You can now log in.');
            hideModal('register-modal');
            showModal('login-modal');
            document.getElementById('register-form').reset();
            document.getElementById('login-userid').value = userid;
        } else {
            alert(data.message || 'Registration Failed');
        }
    } catch (err) {
        alert('Server Error');
    }
}

function logout() {
    currentUser = null;
    isAdmin = false;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAdmin');

    const userControls = document.getElementById('user-controls');
    if (userControls) userControls.classList.remove('hidden');

    const loggedInControls = document.getElementById('logged-in-controls');
    if (loggedInControls) loggedInControls.classList.add('hidden');

    showSection('default-section');

    const secureProgressInput = document.getElementById('secure-progress-id-input');
    if (secureProgressInput) secureProgressInput.value = '';

    const detailsResult = document.getElementById('details-result');
    if (detailsResult) detailsResult.classList.add('hidden');

    const myCasesList = document.getElementById('my-cases-list');
    if (myCasesList) myCasesList.innerHTML = '';
}

async function loadMyCases() {
    const myCasesList = document.getElementById('my-cases-list');
    if (!myCasesList || !currentUser) return;

    myCasesList.innerHTML = '<p>Loading your cases...</p>';

    try {
        const response = await fetch(`/api/my-cases/${currentUser}`);
        const data = await response.json();

        if (data.success) {
            if (data.cases.length === 0) {
                myCasesList.innerHTML = '<div class="result-box">No previously filed cases found under this account.</div>';
                return;
            }

            let htmlString = '';
            data.cases.forEach(c => {
                let hearingStr = c.next_hearing_date ? `<strong>Next Hearing:</strong> <span style="color:var(--primary-color);">${c.next_hearing_date}</span><br>` : '';
                let prosStr = c.prosecutor_id ? `<strong>Prosecutor ID:</strong> <span style="color:var(--text-color);">${c.prosecutor_id}</span><br>` : '';
                htmlString += `
                    <div class="result-box" style="margin-bottom: 15px; border-left: 3px solid var(--primary-color);">
                        <strong>Case ID:</strong> ${c.case_id} <br>
                        <strong>Progress ID:</strong> <span style="color:var(--text-color);">${c.progress_id}</span><br>
                        <strong>Status Phase:</strong> ${c.status} <br>
                        ${hearingStr}
                        ${prosStr}
                        <hr style="border-color: rgba(0,0,0,0.1); margin: 10px 0;">
                        <strong>Description Details:</strong><br>
                        <small style="color:#475569;">${c.description.replace(/\n/g, '<br>')}</small>
                    </div>
                `;
            });
            myCasesList.innerHTML = htmlString;
        } else {
            myCasesList.innerHTML = '<div class="result-box error">Failed to load cases.</div>';
        }
    } catch (err) {
        myCasesList.innerHTML = '<div class="result-box error">Connection Error fetching cases.</div>';
    }
}

async function submitNewCase(e) {
    e.preventDefault();

    if (!currentUser) {
        alert("You must be logged in.");
        return;
    }

    const btn = document.getElementById('submit-case-btn');
    const oldText = btn.innerText;
    btn.innerText = "Submitting...";
    btn.disabled = true;

    const payload = {
        userid: currentUser,
        category: document.getElementById('fc-category').value,
        victim_name: document.getElementById('fc-victim').value.trim(),
        phone_number: document.getElementById('fc-phone').value.trim(),
        relationship: document.getElementById('fc-relation').value.trim(),
        description: document.getElementById('fc-desc').value.trim()
    };

    try {
        const response = await fetch('/api/file-case', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (data.success) {
            document.getElementById('file-case-form').reset();
            showResult('new-case-result', `<strong>Case Filed Successfully!</strong><br><br>
            Your Unique Case ID: <span style="color:var(--primary-color); font-weight:bold;">${data.case_id}</span><br>
            Your Tracking Progress ID: <span style="color:var(--text-color); font-weight:bold;">${data.progress_id}</span><br><br>
            <small>Please save these IDs. They will not be shown again.</small>`);
        } else {
            showResult('new-case-result', `${data.message}`, true);
        }
    } catch (err) {
        showResult('new-case-result', `Connection Error`, true);
    }

    btn.innerText = oldText;
    btn.disabled = false;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const floatingToggle = document.getElementById('floating-toggle');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        if (floatingToggle) {
            if (sidebar.classList.contains('collapsed')) {
                floatingToggle.classList.remove('hidden');
            } else {
                floatingToggle.classList.add('hidden');
            }
        }
    }
}
