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
        },
        params: {
          model: 'nova-3',          // More accurate model
          smart_format: true,       // Punctuation, formatting
          language: 'en',           // Optional, but can help
          punctuate: true,          // Add punctuation if smart_format doesn't
          tier: 'enhanced'          // Enables better quality if you’re on a paid plan
        }
      }
    );

    const transcript = response.data?.results?.channels[0]?.alternatives[0]?.transcript;

    jobStore[jobId].status = 'done';
    jobStore[jobId].transcript = transcript || '[No transcript returned]';
    jobStore[jobId].downloadUrl = `https://dummy.link/${jobId}.pdf`;

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
