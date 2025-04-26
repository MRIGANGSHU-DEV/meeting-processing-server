const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const fs = require('fs');
const PDFDocument = require('pdfkit');
require('dotenv').config();

function generatePDF(jobId, content, title) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const filePath = `./pdfs/${jobId}.pdf`;

    if (!fs.existsSync('./pdfs')) fs.mkdirSync('./pdfs');
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(content || '[No content]', { align: 'left' });
    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', (err) => reject(err));
  });
}

async function handleTranscript(req, res) {
  const recordingUrl = req.body.url;
  const jobId = uuidv4();

  try {
    const response = await axios.post(
      'https://api.deepgram.com/v1/listen',
      { url: recordingUrl },
      {
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        params: {
          model: 'nova-3',
          smart_format: true,
          language: 'en',
          punctuate: true
        }
      }
    );

    const transcript = response.data?.results?.channels[0]?.alternatives[0]?.transcript;
    const pdfPath = await generatePDF(jobId, transcript, 'Meeting Transcript');

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const downloadUrl = `${baseUrl}/pdfs/${jobId}.pdf`;

    res.json({ success: true, downloadUrl });

  } catch (err) {
    console.error('Transcript Error:', err?.response?.data || err.message);
    res.status(500).json({ success: false, error: 'Failed to process transcript' });
  }
}

module.exports = handleTranscript;
