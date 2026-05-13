# Image-Only Document Handling Guide

## 🎯 Problem

When you upload a DOCX or PDF file that contains **only images** (no text), the system cannot extract any content to generate quiz questions.

### Why?
- The extraction system reads **text** from documents
- Image content requires **OCR (Optical Character Recognition)** to convert visual content to text
- OCR requires additional API calls and processing

---

## ✅ Solutions

### **Option 1: Use an Online OCR Tool (Recommended - Free)**

Best for: Quick conversion, no software installation

**Steps:**
1. Go to one of these free OCR tools:
   - **Google Lens** (easiest): https://lens.google.com
   - **iLovePDF**: https://www.ilovepdf.com/ocr
   - **SmallPDF**: https://smallpdf.com/ocr-pdf
   - **Online OCR**: https://www.onlineocr.net

2. Upload your image or document with images

3. Let the tool extract text

4. Copy the extracted text

5. Paste into a new document (Word or Notepad)

6. Save as `.txt` or `.docx` file

7. Upload the new file to AceIt

---

### **Option 2: Use Google Lens (Super Quick)**

**Steps:**
1. Open Google Lens on your phone: https://lens.google.com
2. Take a photo of your document/image
3. Tap the text icon (T)
4. Copy all extracted text
5. Paste into a `.txt` file
6. Upload to AceIt

---

### **Option 3: Use Your Phone's Built-in Tools**

**iPhone (iOS):**
1. Open Camera
2. Point at document
3. Tap the text icon
4. Tap "Copy" to extract text
5. Paste into Notes or email
6. Convert to `.txt` or `.docx`

**Android:**
1. Open Google Lens (built-in or app)
2. Take photo of document
3. Select text and copy
4. Paste into document
5. Upload

---

## 📝 File Format Guidelines

### ✅ Supported & Working Well

| Format | Requirements | How to Upload |
|--------|-------------|--------------|
| `.txt` | Plain text only | Upload directly |
| `.docx` | **Must contain text** (images optional) | Upload directly |
| `.pdf` | **Must contain text** (images optional) | Convert to DOCX first |

### ❌ Not Yet Supported (Use OCR First)

| Format | Solution |
|--------|----------|
| Image-only PDFs | Use OCR tool, save as DOCX |
| JPG/PNG/GIF images | Use OCR tool, save as TXT |
| Handwritten docs (photos) | Use Google Lens, copy text |

---

## 🚀 Future Improvements

Coming soon:
- [ ] Built-in OCR support (free Tesseract.js)
- [ ] Google Gemini Vision API integration
- [ ] Direct image upload with automatic text extraction
- [ ] Support for image galleries

---

## 🆘 Troubleshooting

### "File is empty or has no text"
**Solution:** File likely contains only images
- Use an OCR tool (see Option 1 above)
- Extract text and save as new file
- Upload new file

### "Insufficient content extracted"
**Solution:** The text extraction may have failed
- Manually re-type key points from your document
- Save as `.txt` file
- Upload

### "No questions generated"
**Solution:** Content may be too short or unclear
- Ensure you have at least 2-3 paragraphs of content
- Content should be educational/study-related
- Increase character count and try again

---

## 📋 Quick Checklist

Before uploading:
- [ ] File is `.txt` or `.docx`
- [ ] File contains actual text (not just images)
- [ ] File is at least 20 characters
- [ ] File size is under 10MB
- [ ] Content is study-related material

---

## 💡 Pro Tips

1. **Batch Convert**: If you have multiple image files, use a tool like ILovePDF to convert all at once

2. **Quality Matters**: Clearer images → Better OCR → Better quiz questions

3. **Manual Editing**: Review OCR'd text before uploading - sometimes OCR makes mistakes

4. **PDF Tip**: Most PDF OCR tools work better than Word-based extraction for scanned documents

5. **Save Time**: Google Lens on your phone is fastest for quick documents

---

## 🔗 Recommended Tools

### Free OCR Tools (Ranked by Ease of Use)

1. **Google Lens** - Instant, no signup needed
2. **iLovePDF** - User-friendly, no signup needed
3. **SmallPDF** - Clean interface, basic plan free
4. **OnlineOCR** - Simple, straightforward

### Desktop Software (if using regularly)

- **Adobe Acrobat Reader** (free tier has OCR)
- **Tesseract OCR** (open-source, free)

---

## 📚 Why Text Extraction Matters

Quiz generation works best when:
- ✅ Content is in **text format**
- ✅ Text is **clear and organized**
- ✅ Content has **multiple concepts/facts**
- ✅ Material is **study-related**

---

## Questions?

Contact support or check the in-app help guide for latest updates on image support!
