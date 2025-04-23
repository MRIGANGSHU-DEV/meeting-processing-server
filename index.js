// This is where the Express app is created.
// It sets up the server, handles API routes like /start-job and /job-status/:id.

const express = require('express');
const cors = require('cors');
const { startJob, getJobStatus } = require('./jobManager');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/start-job', async (req, res) => {
  const { recordingUrl, jobType } = req.body;

  if (!recordingUrl || !jobType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const jobId = await startJob(recordingUrl, jobType);
  res.status(202).json({ jobId });
});

app.get('/job-status/:id', (req, res) => {
  const jobId = req.params.id;
  const status = getJobStatus(jobId);

  if (!status) return res.status(404).json({ error: 'Job not found' });

  res.json(status);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
