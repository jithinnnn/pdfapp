const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;

const app = express();
const port = 3001;

app.use(bodyParser.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint to handle PDF file upload
app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    // Save the uploaded PDF buffer
    const filePath = `uploads/${Date.now()}.pdf`;
    await fs.writeFile(filePath, req.file.buffer);

    res.status(200).json({ message: 'PDF file uploaded successfully', filePath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to retrieve and display the stored PDF file
app.get('/pdf/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = `uploads/${filename}`;

    // Check if the file exists
    const exists = await fs.access(filePath).then(() => true).catch(() => false);

    if (exists) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'PDF file not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to extract selected pages and create a new PDF
app.post('/extract-pages', async (req, res) => {
  try {
    const { filePath, selectedPages } = req.body;

    // Load the original PDF
    const originalPDFBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(originalPDFBytes);

    // Create a new PDF with selected pages
    const newPDFDoc = await PDFDocument.create();
    for (const pageNumber of selectedPages) {
      const [copiedPage] = await newPDFDoc.copyPages(pdfDoc, [pageNumber - 1]);
      newPDFDoc.addPage(copiedPage);
    }

    // Save the new PDF
    const newPDFBytes = await newPDFDoc.save();
    const newFilePath = `uploads/newPDF_${Date.now()}.pdf`;
    await fs.writeFile(newFilePath, newPDFBytes);

    res.status(200).json({ message: 'New PDF created successfully', newFilePath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});