import { Alert } from 'react-native';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * Exports a study set as PDF or DOCX format
 * @param {Object} set - Study set with terms and questions
 * @param {String} format - 'pdf' or 'docx'
 * @returns {Promise<void>}
 */
export const exportStudySet = async (set, format = 'pdf') => {
  try {
    if (!set) {
      Alert.alert('Error', 'No study set to export');
      return;
    }

    if (format === 'pdf') {
      await exportAsPDF(set);
    } else if (format === 'docx') {
      await exportAsDocx(set);
    }
  } catch (error) {
    console.error('[exportService] Export error:', error);
    Alert.alert('Export Failed', error.message || 'Could not export study set');
  }
};

const exportAsPDF = async (set) => {
  try {
    await exportPDFWeb(set);
  } catch (error) {
    throw new Error(`PDF export failed: ${error.message}`);
  }
};

/**
 * Exports to PDF on web using jsPDF
 */
const exportPDFWeb = async (set) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const lineHeight = 7;
    let yPosition = margin;

    // Title
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(set.title || 'Study Set', margin, yPosition);
    yPosition += 15;

    // Description
    if (set.description) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      const descLines = doc.splitTextToSize(set.description, pageWidth - 2 * margin);
      doc.text(descLines, margin, yPosition);
      yPosition += descLines.length * lineHeight + 10;
    }

    // Terms/Flashcards
    if (set.terms && set.terms.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text('Flashcards', margin, yPosition);
      yPosition += 12;

      set.terms.forEach((term, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - margin - 30) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(11);
        doc.setTextColor(60);
        doc.text(`${index + 1}. ${term.term}`, margin, yPosition);
        yPosition += lineHeight;

        doc.setFontSize(10);
        doc.setTextColor(100);
        const defLines = doc.splitTextToSize(term.definition, pageWidth - 2 * margin - 5);
        doc.text(defLines, margin + 5, yPosition);
        yPosition += defLines.length * lineHeight + 5;
      });

      yPosition += 5;
    }

    // Questions
    if (set.questions && set.questions.length > 0) {
      if (yPosition > pageHeight - margin - 50) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text('Quiz Questions', margin, yPosition);
      yPosition += 12;

      set.questions.forEach((question, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - margin - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Question
        doc.setFontSize(11);
        doc.setTextColor(60);
        const qLines = doc.splitTextToSize(
          `${index + 1}. ${question.question}`,
          pageWidth - 2 * margin
        );
        doc.text(qLines, margin, yPosition);
        yPosition += qLines.length * lineHeight;

        // Options or answer
        if (question.type === 'multiple_choice' && question.options) {
          doc.setFontSize(10);
          doc.setTextColor(100);
          question.options.forEach((option, i) => {
            const marker = String.fromCharCode(65 + i); // A, B, C, D
            const isCorrect = i === question.correctIndex ? ' ✓' : '';
            const optLine = `  ${marker}. ${option}${isCorrect}`;
            const optLines = doc.splitTextToSize(optLine, pageWidth - 2 * margin - 10);
            doc.text(optLines, margin + 5, yPosition);
            yPosition += optLines.length * lineHeight;
          });
        } else if (question.type === 'true_false') {
          doc.setFontSize(10);
          doc.setTextColor(100);
          const answer = question.correctAnswer ? 'True' : 'False';
          doc.text(`  Answer: ${answer} ✓`, margin + 5, yPosition);
          yPosition += lineHeight;
        }

        // Explanation
        if (question.explanation) {
          doc.setFontSize(9);
          doc.setTextColor(150);
          const expLines = doc.splitTextToSize(
            `Explanation: ${question.explanation}`,
            pageWidth - 2 * margin - 5
          );
          doc.text(expLines, margin + 5, yPosition);
          yPosition += expLines.length * lineHeight;
        }

        yPosition += 5;
      });
    }

    // Save and download
    const fileName = `${set.title || 'StudySet'}_${new Date().getTime()}.pdf`;
    doc.save(fileName);

    Alert.alert('Success', `PDF exported as ${fileName}`);
  } catch (error) {
    throw new Error(`Could not generate PDF: ${error.message}`);
  }
};

const exportAsDocx = async (set) => {
  try {
    await exportDocxWeb(set);
  } catch (error) {
    throw new Error(`DOCX export failed: ${error.message}`);
  }
};

/**
 * Exports to DOCX on web using docx library
 */
const exportDocxWeb = async (set) => {
  try {
    const sections = [];

    // Title
    sections.push(
      new Paragraph({
        text: set.title || 'Study Set',
        heading: 'Heading1',
        spacing: { after: 200 },
      })
    );

    // Description
    if (set.description) {
      sections.push(
        new Paragraph({
          text: set.description,
          spacing: { after: 200 },
        })
      );
    }

    // Flashcards section
    if (set.terms && set.terms.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Flashcards',
          heading: 'Heading2',
          spacing: { before: 200, after: 100 },
        })
      );

      set.terms.forEach((term, index) => {
        sections.push(
          new Paragraph({
            text: `${index + 1}. Term: ${term.term}`,
            spacing: { after: 50 },
            indent: { left: 400 },
          })
        );
        sections.push(
          new Paragraph({
            text: `Definition: ${term.definition}`,
            spacing: { after: 100 },
            indent: { left: 400 },
          })
        );
      });
    }

    // Questions section
    if (set.questions && set.questions.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Quiz Questions',
          heading: 'Heading2',
          spacing: { before: 200, after: 100 },
        })
      );

      set.questions.forEach((question, index) => {
        sections.push(
          new Paragraph({
            text: `${index + 1}. ${question.question}`,
            spacing: { after: 50 },
            indent: { left: 200 },
          })
        );

        // Options or answer
        if (question.type === 'multiple_choice' && question.options) {
          question.options.forEach((option, i) => {
            const marker = String.fromCharCode(65 + i);
            const isCorrect = i === question.correctIndex ? ' ✓' : '';
            sections.push(
              new Paragraph({
                text: `${marker}. ${option}${isCorrect}`,
                spacing: { after: 25 },
                indent: { left: 600 },
              })
            );
          });
        } else if (question.type === 'true_false') {
          const answer = question.correctAnswer ? 'True' : 'False';
          sections.push(
            new Paragraph({
              text: `Answer: ${answer} ✓`,
              spacing: { after: 50 },
              indent: { left: 600 },
            })
          );
        }

        // Explanation
        if (question.explanation) {
          sections.push(
            new Paragraph({
              text: `Explanation: ${question.explanation}`,
              spacing: { after: 100 },
              indent: { left: 400 },
              italics: true,
            })
          );
        }
      });
    }

    const doc = new Document({
      sections: [{ children: sections }],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `${set.title || 'StudySet'}_${new Date().getTime()}.docx`;

    // Create blob URL and download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    Alert.alert('Success', `DOCX exported as ${fileName}`);
  } catch (error) {
    throw new Error(`Could not generate DOCX: ${error.message}`);
  }
};

/**
 * Export quiz results after taking a quiz
 */
export const exportQuizResults = async (set, results, format = 'pdf') => {
  try {
    if (!set || !results) {
      Alert.alert('Error', 'No quiz results to export');
      return;
    }

    // Enhance questions with user answers and results
    const enhancedQuestions = set.questions.map((q, index) => ({
      ...q,
      userAnswer: results[index]?.userAnswer,
      isCorrect: results[index]?.isCorrect,
    }));

    const enhancedSet = {
      ...set,
      questions: enhancedQuestions,
    };

    if (format === 'pdf') {
      await exportAsPDF(enhancedSet);
    } else if (format === 'docx') {
      await exportAsDocx(enhancedSet);
    }
  } catch (error) {
    console.error('[exportService] Quiz export error:', error);
    Alert.alert('Export Failed', error.message || 'Could not export quiz results');
  }
};
