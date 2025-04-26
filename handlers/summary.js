const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const { createClient } = require('@deepgram/sdk');


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

async function handleSummary(req, res) {
  const recordingUrl = req.body.url;
  const jobId = uuidv4();
  

    // STEP 1: Create a Deepgram client using the API key
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

    // STEP 2: Call the transcribeUrl method with the audio payload and options
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
        {
        url: recordingUrl,
        },
        // STEP 3: Configure Deepgram options for audio analysis
        {
        model: "nova-3",

        // intents: true,
        summarize: "v2",
        // topics: true,
        }
    );
    
    const pdfPath = await generatePDF(jobId, result.results.summary.short, 'Meeting Summary');
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const downloadUrl = `${baseUrl}/pdfs/${jobId}.pdf`;
    res.json({ success: true, downloadUrl });

    if (error) throw error;

    // STEP 4: Print the results
    

    };
 

module.exports = handleSummary;
