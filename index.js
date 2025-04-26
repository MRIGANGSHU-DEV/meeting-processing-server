const express = require('express');
const cors = require('cors'); // ✅ ADD THIS
const app = express();

const handleTranscript = require('./handlers/transcript');
const handleSummary = require('./handlers/summary');
const path = require('path');

app.use(cors()); // ✅ AND THIS

app.use(express.json());
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

app.post('/api/transcript', handleTranscript);
app.post('/api/summary', handleSummary);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
