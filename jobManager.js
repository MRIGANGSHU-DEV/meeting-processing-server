// This is where we handle all job logic (e.g., storing job info, simulating background work).
// Right now it uses in-memory storage (jobStore), but you can later hook this into a database or Redis if needed.

const { v4: uuidv4 } = require('uuid');

const jobStore = {}; // In-memory for now

function startJob(recordingUrl, jobType) {
  const jobId = uuidv4();

  jobStore[jobId] = {
    id: jobId,
    status: 'processing',
    recordingUrl,
    jobType,
    downloadUrl: null
  };

  // Simulate long processing job (we'll plug in real logic later)
  setTimeout(() => {
    jobStore[jobId].status = 'done';
    jobStore[jobId].downloadUrl = `https://dummy.link/result-${jobId}.pdf`;
  }, 15 * 1000); // Simulate 5 mins

  return jobId;
}

function getJobStatus(jobId) {
  return jobStore[jobId];
}

module.exports = { startJob, getJobStatus };
