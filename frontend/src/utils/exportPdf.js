import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Builds a real text-based PDF report (title, key stats, and data tables)
// rather than a screenshot of the page - crisper output, smaller file,
// and the numbers stay copy-pasteable/searchable in the PDF.
export function exportAnalyticsPdf({ title, subtitle, stats = [], tables = [] }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  let y = 50;

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(title, marginX, y);
  y += 22;

  if (subtitle) {
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.setTextColor(120);
    doc.text(subtitle, marginX, y);
    doc.setTextColor(0);
    y += 20;
  }

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Generated ${new Date().toLocaleString("en-IN")}`, marginX, y);
  doc.setTextColor(0);
  y += 24;

  // Key stats as a simple row of label/value pairs
  if (stats.length > 0) {
    doc.setFontSize(11);
    const colWidth = (595 - marginX * 2) / stats.length;
    stats.forEach((s, i) => {
      const x = marginX + i * colWidth;
      doc.setFont(undefined, "normal");
      doc.setTextColor(120);
      doc.text(String(s.label), x, y);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0);
      doc.text(String(s.value), x, y + 16);
    });
    y += 40;
  }

  // Each table gets its own heading + autoTable grid
  tables.forEach((t) => {
    if (y > 750) {
      doc.addPage();
      y = 50;
    }
    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text(t.heading, marginX, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [t.columns],
      body: t.rows,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [19, 26, 38] },
      didDrawPage: (data) => {
        y = data.cursor.y;
      }
    });

    y = doc.lastAutoTable.finalY + 24;
  });

  const filename = `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  doc.save(filename);
}
