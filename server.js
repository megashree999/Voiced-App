const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve static files (optional, if you're using front-end files)
app.use(express.static('public'));

// Add a route to handle requests to the root
app.get('/', (req, res) => {
    res.send('Hello, World!');  // You can return any HTML or JSON here
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


// MySQL connection setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Mega@_999',
    database: 'transcription_app'
});

db.connect((err) => {
    if (err) {
        console.error('MySQL connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL');
});

// Route to save transcription
app.post('/api/save-transcription', (req, res) => {
    const { text, language, confidence, timestamp } = req.body;

    const query = 'INSERT INTO transcriptions (text, language, confidence, timestamp) VALUES (?, ?, ?, ?)';
    const values = [text, language, confidence, timestamp];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Failed to insert:', err);
            return res.status(500).json({ error: 'Database insert failed' });
        }
        res.status(200).json({ message: 'Transcription saved', id: results.insertId });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
