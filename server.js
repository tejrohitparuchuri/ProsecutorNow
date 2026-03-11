const express = require('express');
const oracledb = require('oracledb');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dbConfig = {
    user: process.env.DB_USER || "hr",
    password: process.env.DB_PASSWORD || "welcome",
    connectString: process.env.DB_CONNECTIONSTRING || "localhost/XEPDB1",
};

const MOCK_DB = {
    users: [
        { userid: 'jd1', aadhar_number: 'N/A', password: '123', is_admin: true }
    ],
    cases: [
        { case_id: "IND-1001", progress_id: "PG-001X", status: "Beginning", category: "Other", date_filed: "2026-03-01T10:00:00.000Z", description: "Initial filing of public interest litigation against alleged illegal construction. Waiting for the first bench assignation.", owner_userid: "user1", prosecutor_id: null },
        { case_id: "IND-1002", progress_id: "PG-002Y", status: "Hearing", category: "Civil Dispute", date_filed: "2026-03-02T14:30:00.000Z", description: "Second hearing regarding the civil contract dispute. Both parties have submitted their evidence and final arguments are underway.", owner_userid: "user2", prosecutor_id: null }
    ],
    prosecutors: [
        { id: "P-001", name: "Adv. Vikram Sharma", specialty: "Criminal Law", experience: "12 Years", available: true },
        { id: "P-002", name: "Adv. Priya Desai", specialty: "Family & Divorce", experience: "8 Years", available: true },
        { id: "P-003", name: "Adv. Rohan Mehta", specialty: "Business & Corporate", experience: "15 Years", available: true }
    ]
};

for (let i = 1; i <= 15; i++) {
    MOCK_DB.users.push({
        userid: `user${i}`,
        aadhar_number: `1234567890${i.toString().padStart(2, '0')}`,
        password: '123'
    });
}

app.get('/api/case-status/:progressId', async (req, res) => {
    const { progressId } = req.params;

    try {
        const caseRecord = MOCK_DB.cases.find(c => c.progress_id === progressId);
        if (caseRecord) {
            res.json({ success: true, status: caseRecord.status, next_hearing_date: caseRecord.next_hearing_date });
        } else {
            res.status(404).json({ success: false, message: 'Case not found for the given Progress ID' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { userid, password } = req.body;
    try {
        const user = MOCK_DB.users.find(u => u.userid === userid && u.password === password);
        if (user) {
            res.json({ success: true, message: "Logged in successfully", userid: user.userid, is_admin: user.is_admin || false });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/register', async (req, res) => {
    const { userid, aadhar_number, password } = req.body;
    try {
        const exists = MOCK_DB.users.find(u => u.userid === userid || u.aadhar_number === aadhar_number);
        if (exists) {
            return res.status(400).json({ success: false, message: "User ID or Aadhar already exists" });
        }
        MOCK_DB.users.push({ userid, aadhar_number, password });
        res.json({ success: true, message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

app.post('/api/file-case', async (req, res) => {
    const { userid, category, victim_name, phone_number, relationship, description } = req.body;
    try {
        const generateId = (prefix) => prefix + Math.random().toString(36).substring(2, 8).toUpperCase();

        let case_id, progress_id;
        do { case_id = generateId('IND-'); } while (MOCK_DB.cases.find(c => c.case_id === case_id));
        do { progress_id = generateId('PG-'); } while (MOCK_DB.cases.find(c => c.progress_id === progress_id));

        const fullDescription = `Category: ${category}\nVictim: ${victim_name}\nPhone: ${phone_number}\nRelationship: ${relationship}\n\nAdditional Details:\n${description}`;

        const newCase = {
            case_id,
            progress_id,
            status: "Beginning",
            category: category,
            date_filed: new Date().toISOString(),
            description: fullDescription,
            owner_userid: userid
        };

        MOCK_DB.cases.push(newCase);
        res.json({ success: true, progress_id, case_id, message: "Case filed successfully." });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/case-details/:progressId/:userid', async (req, res) => {
    const { progressId, userid } = req.params;
    try {
        const caseRecord = MOCK_DB.cases.find(c => c.progress_id === progressId && c.owner_userid === userid);
        if (caseRecord) {
            res.json({ success: true, description: caseRecord.description });
        } else {
            res.status(403).json({ success: false, message: "Cannot fetch description. Case either doesn't exist or doesn't belong to you." });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get('/api/my-cases/:userid', async (req, res) => {
    const { userid } = req.params;
    try {
        const userCases = MOCK_DB.cases.filter(c => c.owner_userid === userid);
        res.json({ success: true, cases: userCases });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get('/api/all-cases', async (req, res) => {
    try {
        res.json({ success: true, cases: MOCK_DB.cases });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post('/api/update-case-status', async (req, res) => {
    const { case_id, status, next_hearing_date } = req.body;
    try {
        const caseRecord = MOCK_DB.cases.find(c => c.case_id === case_id);
        if (caseRecord) {
            caseRecord.status = status;
            if (next_hearing_date !== undefined) caseRecord.next_hearing_date = next_hearing_date;
            res.json({ success: true, message: "Status updated successfully" });
        } else {
            res.status(404).json({ success: false, message: "Case not found" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get('/api/prosecutors', async (req, res) => {
    try {
        res.json({ success: true, prosecutors: MOCK_DB.prosecutors });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post('/api/assign-prosecutor', async (req, res) => {
    const { case_id, prosecutor_id, userid } = req.body;
    try {
        const caseRecord = MOCK_DB.cases.find(c => c.case_id === case_id && c.owner_userid === userid);
        if (!caseRecord) {
            return res.status(403).json({ success: false, message: "Case not found or unauthorized access" });
        }

        const prosecutor = MOCK_DB.prosecutors.find(p => p.id === prosecutor_id);
        if (!prosecutor) {
            return res.status(404).json({ success: false, message: "Prosecutor not found" });
        }

        caseRecord.prosecutor_id = prosecutor_id;
        res.json({ success: true, message: "Prosecutor recruited successfully for the case." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Judicial Portal is running on http://localhost:${PORT}`);
});
