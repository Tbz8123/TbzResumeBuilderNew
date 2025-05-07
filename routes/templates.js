const express = require('express');
const fs = require('fs');
const path = require('path');
const renderTemplateToImage = require('../utils/renderTemplateToImage');

const router = express.Router();

router.post('/generate-preview', async (req, res) => {
  const { htmlContent, templateId } = req.body;

  const outputPath = path.join(__dirname, `../previews/${templateId}.png`);

  try {
    await renderTemplateToImage(htmlContent, outputPath);
    res.status(200).json({ previewUrl: `/previews/${templateId}.png` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

module.exports = router;
