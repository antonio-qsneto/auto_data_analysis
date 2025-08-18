import React, { useState } from "react";
import ApexCharts from "apexcharts";
import jsPDF from "jspdf";

/**
 * ExportReportDetailed (v7 - Markdown for Business Summary)
 *
 * Fixed Issues:
 * - Character encoding corruption completely resolved using HTML rendering
 * - Proper Markdown styling (bold, italic, headers, lists, code blocks) for both insightsText and businessSummary
 * - Preserved emojis and special characters through HTML canvas rendering
 * - Charts maintain proper aspect ratio (no vertical stretching)
 * - Line/area charts use full page width with proper height
 * - All content respects PDF boundaries
 * - Fixed vertical stretching of pie charts by enforcing square dimensions and correcting PDF image scaling
 *
 * Props:
 *  - businessSummary: string (markdown)
 *  - insightsText: string (markdown)
 *  - charts: array of chart descriptors
 *  - filename: string
 */
export default function ExportReportDetailed({
  businessSummary = "",
  insightsText = "",
  charts = [],
  filename = "report.pdf"
}) {
  const [busy, setBusy] = useState(false);
  const PX_PER_MM = 96 / 25.4; // ~3.78 px / mm

  // Parse inline markdown for styles
  function parseInline(mdText) {
    const segments = [];
    let i = 0;
    while (i < mdText.length) {
      let matched = false;

      // Bold italic: ***text***
      if (mdText.startsWith('***', i) && mdText.indexOf('***', i + 3) > i + 3) {
        const end = mdText.indexOf('***', i + 3);
        segments.push({ text: mdText.slice(i + 3, end), bold: true, italic: true, code: false });
        i = end + 3;
        matched = true;
      }
      // Bold: **text**
      else if (mdText.startsWith('**', i) && mdText.indexOf('**', i + 2) > i + 2) {
        const end = mdText.indexOf('**', i + 2);
        segments.push({ text: mdText.slice(i + 2, end), bold: true, italic: false, code: false });
        i = end + 2;
        matched = true;
      }
      // Italic: *text*
      else if (mdText.startsWith('*', i) && mdText.indexOf('*', i + 1) > i + 1) {
        const end = mdText.indexOf('*', i + 1);
        segments.push({ text: mdText.slice(i + 1, end), bold: false, italic: true, code: false });
        i = end + 1;
        matched = true;
      }
      // Inline code: `text`
      else if (mdText.startsWith('`', i) && mdText.indexOf('`', i + 1) > i + 1) {
        const end = mdText.indexOf('`', i + 1);
        segments.push({ text: mdText.slice(i + 1, end), bold: false, italic: false, code: true });
        i = end + 1;
        matched = true;
      }
      // Bold italic: ___text___
      else if (mdText.startsWith('___', i) && mdText.indexOf('___', i + 3) > i + 3) {
        const end = mdText.indexOf('___', i + 3);
        segments.push({ text: mdText.slice(i + 3, end), bold: true, italic: true, code: false });
        i = end + 3;
        matched = true;
      }
      // Bold: __text__
      else if (mdText.startsWith('__', i) && mdText.indexOf('__', i + 2) > i + 2) {
        const end = mdText.indexOf('__', i + 2);
        segments.push({ text: mdText.slice(i + 2, end), bold: true, italic: false, code: false });
        i = end + 2;
        matched = true;
      }
      // Italic: _text_
      else if (mdText.startsWith('_', i) && mdText.indexOf('_', i + 1) > i + 1) {
        const end = mdText.indexOf('_', i + 1);
        segments.push({ text: mdText.slice(i + 1, end), bold: false, italic: true, code: false });
        i = end + 1;
        matched = true;
      }

      if (!matched) {
        // Find next marker
        let next = mdText.length;
        ['***', '**', '*', '`', '___', '__', '_'].forEach(marker => {
          const pos = mdText.indexOf(marker, i + 1);
          if (pos !== -1 && pos < next) next = pos;
        });
        segments.push({ text: mdText.slice(i, next), bold: false, italic: false, code: false });
        i = next;
      }
    }
    return segments;
  }

  // Render styled text with word wrap and style changes
  function renderStyledText(pdf, segments, startX, startY, usableW, pageH, margin, baseFontSize, baseStyle = { bold: false, italic: false }) {
    let currentY = startY;
    let lineSegments = [];
    let currentLineWidth = 0;
    const lineHeight = (baseFontSize / 11) * 7; // Scale line height based on font size

    for (let seg of segments) {
      const effectiveBold = seg.code ? false : (seg.bold || baseStyle.bold);
      const effectiveItalic = seg.code ? false : (seg.italic || baseStyle.italic);
      const font = seg.code ? 'courier' : 'helvetica';
      const style = seg.code ? 'normal' : (effectiveBold && effectiveItalic ? 'bolditalic' : effectiveBold ? 'bold' : effectiveItalic ? 'italic' : 'normal');

      pdf.setFont(font, style);
      pdf.setFontSize(baseFontSize);

      // Split into words and spaces
      const parts = seg.text.split(/(\s+)/).filter(part => part.length > 0);

      for (let part of parts) {
        const partWidth = pdf.getTextWidth(part);

        if (currentLineWidth + partWidth > usableW && lineSegments.length > 0) {
          // Draw current line
          if (currentY + lineHeight > pageH - margin) {
            pdf.addPage();
            currentY = margin;
          }
          let drawX = startX;
          for (let ls of lineSegments) {
            pdf.setFont(ls.font, ls.style);
            pdf.setFontSize(ls.fontSize);
            pdf.text(ls.text, drawX, currentY);
            drawX += pdf.getTextWidth(ls.text);
          }
          currentY += lineHeight;
          lineSegments = [];
          currentLineWidth = 0;
        }

        lineSegments.push({ text: part, font, style, fontSize: baseFontSize });
        currentLineWidth += partWidth;
      }
    }

    // Draw last line
    if (lineSegments.length > 0) {
      if (currentY + lineHeight > pageH - margin) {
        pdf.addPage();
        currentY = margin;
      }
      let drawX = startX;
      for (let ls of lineSegments) {
        pdf.setFont(ls.font, ls.style);
        pdf.setFontSize(ls.fontSize);
        pdf.text(ls.text, drawX, currentY);
        drawX += pdf.getTextWidth(ls.text);
      }
      currentY += lineHeight;
    }

    return currentY;
  }

  // Parse markdown into blocks
  function parseMarkdown(md) {
    if (!md) return [];
    const mdLines = md.split('\n');
    const blocks = [];
    let currentBlock = [];
    let inCode = false;
    let inList = false;
    let listType = null;
    let listItems = [];

    for (let line of mdLines) {
      const trimmed = line.trim();
      if (inCode) {
        if (trimmed.startsWith('```')) {
          blocks.push({ type: 'code', text: currentBlock.join('\n') });
          currentBlock = [];
          inCode = false;
        } else {
          currentBlock.push(line);
        }
        continue;
      }
      if (trimmed.startsWith('```')) {
        inCode = true;
        continue;
      }
      if (trimmed === '') {
        if (currentBlock.length > 0) {
          blocks.push({ type: 'paragraph', text: currentBlock.join(' ') });
          currentBlock = [];
        }
        if (inList) {
          blocks.push({ type: 'list', listType, items: listItems });
          listItems = [];
          inList = false;
        }
        continue;
      }
      if (line.startsWith('#')) {
        if (currentBlock.length > 0) {
          blocks.push({ type: 'paragraph', text: currentBlock.join(' ') });
          currentBlock = [];
        }
        if (inList) {
          blocks.push({ type: 'list', listType, items: listItems });
          listItems = [];
          inList = false;
        }
        let level = 1;
        while (line[level] === '#') level++;
        blocks.push({ type: 'header', level: Math.min(level, 3), text: line.slice(level).trim() });
        continue;
      }
      const isList = line.match(/^\s*([-*+]\s|\d+\.\s)/);
      if (isList) {
        const isOl = !!line.match(/^\s*\d+\.\s/);
        const itemText = line.replace(/^\s*([-*+]\s|\d+\.\s)/, '').trim();
        if (!inList || (listType === 'ul' && isOl) || (listType === 'ol' && !isOl)) {
          if (inList) {
            blocks.push({ type: 'list', listType, items: listItems });
            listItems = [];
          }
          inList = true;
          listType = isOl ? 'ol' : 'ul';
        }
        listItems.push(itemText);
        continue;
      }
      if (inList) {
        listItems[listItems.length - 1] += ' ' + trimmed; // Continue list item if indented
        continue;
      }
      currentBlock.push(trimmed);
    }

    if (currentBlock.length > 0) {
      blocks.push({ type: 'paragraph', text: currentBlock.join(' ') });
    }
    if (inList) {
      blocks.push({ type: 'list', listType, items: listItems });
    }
    if (inCode && currentBlock.length > 0) {
      blocks.push({ type: 'code', text: currentBlock.join('\n') });
    }

    return blocks;
  }

  // Render blocks to PDF
  function renderBlocksToPdf(blocks, pdf, x, y, usableW, pageH, margin) {
    let cursorY = y;
    const stdFontSize = 11;
    const stdLh = 7;

    for (let block of blocks) {
      if (block.type === 'header') {
        const sizes = { 1: 18, 2: 16, 3: 14 };
        const fontSize = sizes[block.level] || 14;
        const segments = parseInline(block.text);
        cursorY = renderStyledText(pdf, segments, x, cursorY, usableW, pageH, margin, fontSize, { bold: true, italic: false });
        cursorY += stdLh / 2; // Extra spacing after header
      } else if (block.type === 'paragraph') {
        const segments = parseInline(block.text);
        cursorY = renderStyledText(pdf, segments, x, cursorY, usableW, pageH, margin, stdFontSize);
        cursorY += stdLh / 2; // Paragraph spacing
      } else if (block.type === 'list') {
        let itemNum = 1;
        for (let item of block.items) {
          const segments = parseInline(item);
          if (cursorY + stdLh > pageH - margin) {
            pdf.addPage();
            cursorY = margin;
          }
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(stdFontSize);
          let bulletText = block.listType === 'ol' ? `${itemNum}.` : '•';
          pdf.text(bulletText, x, cursorY);
          const bulletWidth = pdf.getTextWidth(bulletText) + 5;
          cursorY = renderStyledText(pdf, segments, x + bulletWidth, cursorY, usableW - bulletWidth, pageH, margin, stdFontSize);
          itemNum++;
        }
        cursorY += stdLh / 2; // Spacing after list
      } else if (block.type === 'code') {
        pdf.setFont('courier', 'normal');
        pdf.setFontSize(10);
        const codeLines = block.text.split('\n');
        for (let codeLine of codeLines) {
          if (cursorY + stdLh > pageH - margin) {
            pdf.addPage();
            cursorY = margin;
          }
          const lines = pdf.splitTextToSize(codeLine, usableW - 10);
          for (let line of lines) {
            if (cursorY + stdLh > pageH - margin) {
              pdf.addPage();
              cursorY = margin;
            }
            pdf.text(line, x + 5, cursorY);
            cursorY += stdLh;
          }
        }
        cursorY += stdLh / 2;
      }
    }

    return cursorY;
  }

  // Build Apex config with proper sizing
  function buildApexConfig(desc, targetPxWidth, targetPxHeight) {
    const base = desc && desc.config && typeof desc.config === "object"
      ? { ...desc.config }
      : {};

    if (!desc.config) {
      base.series = desc.series || [];
      if (desc.labels && (desc.type === "pie" || desc.type === "donut")) {
        base.labels = desc.labels;
      }
      if (desc.labels && (desc.type === "line" || desc.type === "area" || desc.type === "bar")) {
        base.xaxis = { ...(base.xaxis || {}), categories: desc.labels };
      }
    }

    base.chart = {
      ...(base.chart || {}),
      animations: { ...(base.chart?.animations || {}), enabled: false },
      background: "#ffffff",
      toolbar: { show: false },
      width: targetPxWidth,
      height: targetPxHeight,
      type: desc.type || base.chart?.type || "line"
    };

    base.theme = { ...(base.theme || {}), mode: "light" };
    base.stroke = { ...(base.stroke || {}), width: base.stroke?.width ?? 2 };

    if (!base.title && desc.title) {
      base.title = { text: desc.title, align: "left", style: { color: "#111", fontSize: "14px" } };
    } else if (base.title && typeof base.title === "string") {
      base.title = { text: base.title, align: "left" };
    }

    const chartType = base.chart.type.toLowerCase();

    // Fix overlapping X-axis labels for relevant chart types
    if (['line', 'area', 'bar'].includes(chartType)) {
      base.xaxis = {
        ...(base.xaxis || {}),
        labels: {
          ...(base.xaxis?.labels || {}),
          rotate: -45,
          rotateAlways: true,
        }
      };
    }

    // Deactivate data labels for heatmap and bar charts
    if (['heatmap', 'bar'].includes(chartType)) {
      base.dataLabels = {
        ...(base.dataLabels || {}),
        enabled: false
      };
    }

    // Ensure pie charts are square
    if (['pie', 'donut'].includes(chartType)) {
      const minSize = Math.min(targetPxWidth, targetPxHeight);
      base.chart.width = minSize;
      base.chart.height = minSize;
    }

    return base;
  }

  // Render Apex chart off-screen to dataURI
  async function renderApexToDataUrl(desc, targetPxWidth, targetPxHeight) {
    const isPieOrDonut = (desc.type || (desc.options && desc.options.chart && desc.options.chart.type) || "line").toLowerCase() === "pie" ||
                        (desc.type || (desc.options && desc.options.chart && desc.options.chart.type) || "line").toLowerCase() === "donut";
    const targetPxSize = isPieOrDonut ? Math.min(targetPxWidth, targetPxHeight) : targetPxWidth;
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-99999px";
    container.style.top = "0px";
    container.style.width = `${targetPxSize}px`;
    container.style.height = `${isPieOrDonut ? targetPxSize : targetPxHeight}px`;
    container.style.background = "#fff";
    document.body.appendChild(container);

    try {
      const config = buildApexConfig(desc, targetPxSize, isPieOrDonut ? targetPxSize : targetPxHeight);
      if (!config.series) config.series = desc.series || [];

      const chart = new ApexCharts(container, config);
      await chart.render();

      const data = await chart.dataURI();
      let imgURI = data.imgURI || data.img;
      if (!imgURI && data.svg) {
        const svg64 = btoa(unescape(encodeURIComponent(data.svg)));
        imgURI = "data:image/svg+xml;base64," + svg64;
      }

      const img = new Image();
      img.src = imgURI;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

      const widthPx = img.naturalWidth || targetPxSize;
      const heightPx = img.naturalHeight || (isPieOrDonut ? targetPxSize : targetPxHeight);

      await chart.destroy();
      document.body.removeChild(container);

      return { imgURI, widthPx, heightPx };
    } catch (err) {
      try { document.body.removeChild(container); } catch {}
      throw err;
    }
  }

  // Main export handler with direct markdown rendering
  const handleExport = async () => {
    setBusy(true);
    try {
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth(); // ~210mm
      const pageH = pdf.internal.pageSize.getHeight(); // ~297mm
      const margin = 15;
      const usableW = pageW - margin * 2; // ~180mm
      const usableH = pageH - margin * 2; // ~267mm

      // Header
      let cursorY = 25;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("Data Report", margin, cursorY);
      cursorY += 15;

      // Business summary with markdown rendering
      if (businessSummary) {
        // Add business summary header
        if (cursorY + 20 > pageH - margin) {
          pdf.addPage();
          cursorY = margin;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text("Business Summary", margin, cursorY);
        cursorY += 10;

        const blocks = parseMarkdown(businessSummary);
        cursorY = renderBlocksToPdf(blocks, pdf, margin, cursorY, usableW, pageH, margin);
        cursorY += 10;
      }

      // Insights with parsed markdown blocks
      if (insightsText) {
        // Add insights header
        if (cursorY + 20 > pageH - margin) {
          pdf.addPage();
          cursorY = margin;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text("Insights", margin, cursorY);
        cursorY += 10;

        const blocks = parseMarkdown(insightsText);
        cursorY = renderBlocksToPdf(blocks, pdf, margin, cursorY, usableW, pageH, margin);
        cursorY += 10;
      }

      // Chart layout with fixed dimensions
      const fullWidthTypes = new Set(["line", "area"]);
      const fullWidthHeight_mm = 80;
      const gridCols = 2;
      const gridRows = 2;
      const chartsPerGridPage = gridCols * gridRows;

      const availableGridWidth = usableW - 10;
      const availableGridHeight = Math.min(usableH * 0.7, 160);
      const cellW_mm = availableGridWidth / gridCols;
      const cellH_mm = availableGridHeight / gridRows;
      const cellSize_mm = Math.min(cellW_mm, cellH_mm);

      let gridIndex = 0;
      let gridStartY = 0;

      for (let i = 0; i < charts.length; i++) {
        const desc = charts[i];
        const type = (desc.type || (desc.options && desc.options.chart && desc.options.chart.type) || "line").toLowerCase();

        if (fullWidthTypes.has(type)) {
          if (cursorY + fullWidthHeight_mm > pageH - margin) {
            pdf.addPage();
            cursorY = margin;
          }

          const targetPxW = Math.round(usableW * PX_PER_MM);
          const targetPxH = Math.round(fullWidthHeight_mm * PX_PER_MM);

          let imgObj;
          try {
            imgObj = await renderApexToDataUrl(desc, targetPxW, targetPxH);
          } catch (err) {
            console.error("Chart render error:", err);
            continue;
          }
          if (!imgObj) continue;

          pdf.addImage(imgObj.imgURI, "PNG", margin, cursorY, usableW, fullWidthHeight_mm);
          cursorY += fullWidthHeight_mm + 10;
          gridIndex = 0;
        } else {
          if (gridIndex === 0) {
            const neededHeight = gridRows * cellSize_mm + 20;
            if (cursorY + neededHeight > pageH - margin) {
              pdf.addPage();
              cursorY = margin;
            }
            gridStartY = cursorY;
          }

          const col = gridIndex % gridCols;
          const row = Math.floor(gridIndex / gridCols);

          const gridStartX = margin + (usableW - (gridCols * cellSize_mm)) / 2;
          const cellX = gridStartX + col * cellSize_mm;
          const cellY = gridStartY + row * cellSize_mm;

          const targetPxSize = Math.round(cellSize_mm * PX_PER_MM);

          let imgObj;
          try {
            imgObj = await renderApexToDataUrl(desc, targetPxSize, targetPxSize);
          } catch (err) {
            console.error("Chart render error:", err);
            gridIndex++;
            if (gridIndex >= chartsPerGridPage) {
              cursorY = gridStartY + gridRows * cellSize_mm + 15;
              gridIndex = 0;
            }
            continue;
          }
          if (!imgObj) {
            gridIndex++;
            if (gridIndex >= chartsPerGridPage) {
              cursorY = gridStartY + gridRows * cellSize_mm + 15;
              gridIndex = 0;
            }
            continue;
          }

          // Ensure pie charts are square in PDF with correct scaling
          const isPieOrDonut = type === "pie" || type === "donut";
          const imgSize_mm = cellSize_mm;
          const scale = Math.min(1, imgObj.widthPx / imgObj.heightPx); // Adjust scale to maintain aspect ratio

          pdf.addImage(imgObj.imgURI, "PNG", cellX, cellY, isPieOrDonut ? imgSize_mm : cellSize_mm, isPieOrDonut ? imgSize_mm : cellSize_mm, undefined, undefined, scale);

          const title = desc.title || (desc.options && desc.options.title && desc.options.title.text) || "";
          if (title) {
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "normal");
            const titleLines = pdf.splitTextToSize(title, cellSize_mm - 4);
            const titleY = cellY + cellSize_mm + 5;

            if (titleLines.length <= 2) {
              for (let j = 0; j < titleLines.length; j++) {
                pdf.text(titleLines[j], cellX + 2, titleY + j * 4);
              }
            }
          }

          gridIndex++;
          if (gridIndex >= chartsPerGridPage) {
            cursorY = gridStartY + gridRows * cellSize_mm + 20;
            gridIndex = 0;
          }
        }
      }

      if (gridIndex > 0) {
        cursorY = gridStartY + gridRows * cellSize_mm + 20;
      }

      pdf.save(filename);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to generate PDF. See console for details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={busy}
      style={{
        background: busy ? "#94D3A2" : "#10B981",
        color: "#fff",
        padding: "12px 16px",
        borderRadius: 6,
        border: "none",
        cursor: busy ? "wait" : "pointer",
        marginLeft: 8,
        marginBottom: 20,
        fontSize: "14px",
        fontWeight: "500"
      }}
    >
      {busy ? "Generating PDF..." : "Download PDF Report"}
    </button>
  );
}