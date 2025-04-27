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
    doc.fontSize(12);

    const lines = content.split('\n');

    lines.forEach((line) => {
      const speakerMatch = line.match(/^(Speaker \d+):\s*(.*)/);
      if (speakerMatch) {
        const speaker = speakerMatch[1];
        const text = speakerMatch[2];

        doc.font('Helvetica-Bold').text(`${speaker}: `, { continued: true });
        doc.font('Helvetica').text(text);
        doc.moveDown(0.5);
      } else {
        if (line.trim() !== '') {
          doc.font('Helvetica').text(line);
          doc.moveDown(0.5);
        } else {
          doc.moveDown();
        }
      }
    });

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
          punctuate: true,
          diarize: true,
          paragraphs: true   // ⭐ Make sure you request paragraphs
        }
      }
    );

    console.log(JSON.stringify(response.data, null, 2));

    // 🧠 Extract paragraphs instead of utterances
    const paragraphs = response.data?.results?.channels[0]?.alternatives[0]?.paragraphs?.paragraphs;

    let formattedTranscript = '';

    if (paragraphs && paragraphs.length > 0) {
      const merged = [];

      let currentSpeaker = null;
      let currentText = [];

      paragraphs.forEach(paragraph => {
        const speaker = paragraph.speaker !== undefined ? `Speaker ${paragraph.speaker}` : 'Unknown Speaker';
        const text = paragraph.sentences.map(sentence => sentence.text).join(' ');

        if (speaker === currentSpeaker) {
          currentText.push(text);
        } else {
          if (currentSpeaker !== null) {
            merged.push({ speaker: currentSpeaker, text: currentText.join(' ') });
          }
          currentSpeaker = speaker;
          currentText = [text];
        }
      });

      // push last speaker block
      if (currentSpeaker !== null) {
        merged.push({ speaker: currentSpeaker, text: currentText.join(' ') });
      }

      formattedTranscript = merged.map(block => `${block.speaker}: ${block.text}`).join('\n\n');
    } else {
      // fallback
      formattedTranscript = response.data?.results?.channels[0]?.alternatives[0]?.transcript || '[No content]';
    }


    const pdfPath = await generatePDF(jobId, formattedTranscript, 'Meeting Transcript');

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const downloadUrl = `${baseUrl}/pdfs/${jobId}.pdf`;

    res.json({ success: true, downloadUrl });

  } catch (err) {
    console.error('Transcript Error:', err?.response?.data || err.message);
    res.status(500).json({ success: false, error: 'Failed to process transcript' });
  }
}

module.exports = handleTranscript;
