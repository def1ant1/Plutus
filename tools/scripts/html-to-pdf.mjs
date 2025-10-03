import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { once } from 'node:events';
import puppeteer from 'puppeteer';
import PDFDocument from 'pdfkit';

if (!process.env.PUPPETEER_CACHE_DIR) {
  process.env.PUPPETEER_CACHE_DIR = path.join(process.env.HOME ?? '/root', '.cache/puppeteer');
}

const [,, htmlPath, pdfPath] = process.argv;

if (!htmlPath || !pdfPath) {
  console.error('Usage: node tools/scripts/html-to-pdf.mjs <input.html> <output.pdf>');
  process.exit(1);
}

const resolvedHtml = path.resolve(htmlPath);
const resolvedPdf = path.resolve(pdfPath);

try {
  await fs.access(resolvedHtml);
} catch (err) {
  console.error(`HTML artifact not found: ${resolvedHtml}`);
  process.exit(1);
}

const html = await fs.readFile(resolvedHtml, 'utf8');

let generated = false;
try {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: puppeteer.executablePath(),
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: resolvedPdf,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
  });
  await browser.close();
  generated = true;
  console.log(`Generated PDF artifact ${resolvedPdf}`);
} catch (error) {
  console.warn(`Puppeteer PDF generation failed (${error.message}); emitting fallback PDF.`);
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const stream = createWriteStream(resolvedPdf);
  doc.pipe(stream);
  doc.fontSize(18).text('Plutus API Contract', { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Source HTML artifact: ${resolvedHtml}`);
  doc.moveDown();
  doc.text('Fallback PDF generated automatically because Chromium dependencies are unavailable in this runtime.');
  doc.moveDown();
  doc.text(`Renderer error: ${error.message}`);
  doc.end();
  await once(stream, 'finish');
  generated = true;
  console.log(`Generated fallback PDF artifact ${resolvedPdf}`);
}

if (!generated) {
  process.exitCode = 1;
}
