// This is where we handle all job logic (e.g., storing job info, simulating background work).
// Right now it uses in-memory storage (jobStore), but you can later hook this into a database or Redis if needed.

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
require('dotenv').config();

const jobStore = {};

async function startJob(recordingUrl, jobType) {
  const jobId = uuidv4();

  jobStore[jobId] = {
    id: jobId,
    status: 'processing',
    recordingUrl,
    jobType,
    transcript: null,
    downloadUrl: null
  };

  try {
    const response = await axios.post(
      'https://api.deepgram.com/v1/listen',
      {
        url: recordingUrl
      },
      {
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const transcript = response.data?.results?.channels[0]?.alternatives[0]?.transcript;

    // Simulate PDF generation and response
    jobStore[jobId].status = 'done';
    jobStore[jobId].transcript = transcript;
    jobStore[jobId].downloadUrl = `https://dummy.link/${jobId}.pdf`; // Replace with actual

  } catch (err) {
    console.error('Deepgram failed:', err?.response?.data || err.message);
    jobStore[jobId].status = 'failed';
  }

  return jobId;
}

function getJobStatus(jobId) {
  return jobStore[jobId];
}

module.exports = { startJob, getJobStatus };


