import React, { useRef, useState } from "react";
import ApexCharts from "apexcharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ReactMarkdown from "react-markdown";

/**
 * ExportReportApex - improved:
 * - Renders markdown beautifully and normalizes characters.
 * - Produces charts 2x2 per page with fixed cell aspect (no vertical stretching).
 * - Places insights on page intelligently, slices long insights across pages.
 *
 * Props:
 *  - businessSummary: string
 *  - insightsText: string (markdown)
 *  - charts: array of chart descriptors (see previous messages)
 *  - filename: string
 */
export default function ExportReportApex({
  businessSummary = "",
  insightsText = "",
  charts = [],
  filename = "apex_report.pdf"
}) {
  const [busy, setBusy] = useState(false);
  const hiddenRef = useRef(null);
  const PX_PER_MM = 96 / 25.4; // ~3.78 px/mm

  // --- helpers ---------------------------------------------------------------

  // Normalize and clean text to avoid mojibake / control chars
  const cleanText = (s) => {
    if (!s && s !== "") return "";
    try {
      let t = String(s);
      // Normalize (NFKC to collapse composed forms), remove invisible controls & replacement char
      t = t.normalize("NFKC").replace(/[\u0000-\u001F\u007F-\u009F\uFFFD]/g, "");
      return t;
    } catch (e) {
      return String(s);
    }
  };

  // Build apex config from descriptor and force white theme and sizes
  const buildApexConfig = (desc, targetPxWidth, targetPxHeight) => {
    if (desc && desc.config && typeof desc.config === "object") {
      const cfg = { ...desc.config };
      cfg.chart = {
        ...(cfg.chart || {}),
        animations: { ...(cfg.chart?.animations || {}), enabled: false },
        background: "#ffffff",
        toolbar: { show: false },
        width: targetPxWidth,
        height: targetPxHeight
      };
      cfg.theme = { ...(cfg.theme || {}), mode: "light" };
      cfg.stroke = { ...(cfg.stroke || {}), width: cfg.stroke?.width ?? 2 };
      return cfg;
    }

    const base = { ...(desc.options || {}) };
    let series = desc.series || base.series || [];

    if (Array.isArray(series) && series.length && (typeof series[0] === "number" || typeof series[0] === "string")) {
      series = [{ name: desc.title || "Series", data: series }];
    }

    const type = desc.type || (base.chart && base.chart.type) || "line";

    const cfg = {
      ...base,
      series,
      chart: {
        ...(base.chart || {}),
        type,
        animations: { ...(base.chart?.animations || {}), enabled: false },
        background: "#ffffff",
        toolbar: { show: false },
        width: targetPxWidth,
        height: targetPxHeight
      },
      theme: { ...(base.theme || {}), mode: "light" },
    };

    if ((type === "pie" || type === "donut") && desc.labels) cfg.labels = desc.labels;
    if (!(type === "pie" || type === "donut" || type === "heatmap" || type === "boxPlot") && desc.labels) {
      cfg.xaxis = { ...(cfg.xaxis || {}), categories: desc.labels };
    }
    if (!cfg.title && desc.title) {
      cfg.title = { text: desc.title, align: "left", style: { color: "#111", fontSize: "14px" } };
    } else if (typeof cfg.title === "string") {
      cfg.title = { text: cfg.title, align: "left" };
    }

    cfg.stroke = { ...(cfg.stroke || {}), width: cfg.stroke?.width ?? 2 };
    if (!cfg.legend) cfg.legend = { ...(cfg.legend || {}), labels: { colors: "#222" } };

    return cfg;
  };

  // Render apex to dataURL using offscreen container
  const renderApexToDataUrl = async (desc, targetPxWidth, targetPxHeight) => {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-99999px";
    container.style.top = "0px";
    container.style.width = `${targetPxWidth}px`;
    container.style.height = `${targetPxHeight}px`;
    container.style.background = "#fff";
    container.style.boxSizing = "border-box";
    document.body.appendChild(container);

    try {
      const config = buildApexConfig(desc, targetPxWidth, targetPxHeight);
      if (!config.series) config.series = desc.series || [];
      const chart = new ApexCharts(container, config);
      await chart.render();

      const data = await chart.dataURI();
      const imgURI = data && (data.imgURI || data.img || data.svg || data.svgURI);

      if (!imgURI && data && data.svg) {
        const svg = data.svg;
        const svg64 = btoa(unescape(encodeURIComponent(svg)));
        const img64 = "data:image/svg+xml;base64," + svg64;
        await chart.destroy();
        document.body.removeChild(container);
        return { imgURI: img64, widthPx: targetPxWidth, heightPx: targetPxHeight };
      }

      // ensure image loads to measure natural size
      const img = new Image();
      img.src = imgURI;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

      const widthPx = img.naturalWidth || targetPxWidth;
      const heightPx = img.naturalHeight || targetPxHeight;

      await chart.destroy();
      document.body.removeChild(container);

      return { imgURI, widthPx, heightPx };
    } catch (err) {
      try { document.body.removeChild(container); } catch {}
      throw err;
    }
  };

  // Capture the hidden markdown node to a canvas (html2canvas)
  const captureMarkdownCanvas = async (node, scale = 2) => {
    return html2canvas(node, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollY: -window.scrollY
    });
  };

  // Slice a canvas into chunks (in px) with given max height (px). Returns array of dataURLs.
  const sliceCanvasToDataUrls = (canvas, maxHeightPx) => {
    const slices = [];
    const fullW = canvas.width;
    const fullH = canvas.height;
    let y = 0;
    while (y < fullH) {
      const h = Math.min(maxHeightPx, fullH - y);
      const tmp = document.createElement("canvas");
      tmp.width = fullW;
      tmp.height = h;
      const ctx = tmp.getContext("2d");
      ctx.drawImage(canvas, 0, y, fullW, h, 0, 0, fullW, h);
      slices.push(tmp.toDataURL("image/png"));
      y += h;
    }
    return slices;
  };

  // --- main handler ---------------------------------------------------------

  const handleExport = async () => {
    if (!charts || charts.length === 0) {
      if (!window.confirm("No charts provided — continue and export text only?")) return;
    }
    setBusy(true);

    try {
      // Prepare PDF
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;

      // Header
      let cursorY = 20;
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Data Report", margin, cursorY);
      cursorY += 10;

      // Business summary (text)
      if (businessSummary) {
        const summary = cleanText(businessSummary);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(summary, usableW);
        const lh = 7;
        if (cursorY + lines.length * lh > pageH - margin) {
          pdf.addPage();
          cursorY = margin;
        }
        pdf.text(lines, margin, cursorY);
        cursorY += lines.length * lh + 6;
      }

      // --- INSIGHTS: render the markdown into hidden DOM (already rendered in JSX below) and capture it ---
      let insightsPlacedHeight_mm = 0;
      const cleanedInsights = cleanText(insightsText);
      if (cleanedInsights) {
        // ensure hiddenRef has updated ReactMarkdown content; it's rendered in JSX using cleanedInsights
        // Capture the node
        const node = hiddenRef.current?.querySelector("#pdf-insights");
        if (node) {
          // capture with html2canvas at good scale
          const canvas = await captureMarkdownCanvas(node, Math.max(2, window.devicePixelRatio || 2));
          // compute canvas height in mm
          const canvasHeightPx = canvas.height;
          const canvasWidthPx = canvas.width;
          const canvasHeightMm = canvasHeightPx / PX_PER_MM;

          // remaining mm on current page
          const remainingMm = pageH - margin - cursorY;

          // If canvas fits into remaining, place directly. Otherwise slice into page-height pieces.
          if (canvasHeightMm <= remainingMm) {
            // place entire image
            const imgData = canvas.toDataURL("image/png");
            // scale image to usableW width in mm, preserve aspect ratio
            const drawW_mm = usableW;
            const drawH_mm = (canvasHeightPx / canvasWidthPx) * drawW_mm;
            pdf.addImage(imgData, "PNG", margin, cursorY, drawW_mm, drawH_mm);
            cursorY += drawH_mm + 6;
            insightsPlacedHeight_mm = drawH_mm;
          } else {
            // Need to split: compute max height in px corresponding to remaining and subsequent full-page heights
            const remainingPx = Math.floor(remainingMm * PX_PER_MM);
            // slice canvas into dataurls where each slice corresponds to max slice height (remaining + full pages)
            // first slice height = remainingPx (may be small); subsequent slices maxHeight = Math.floor(usableH * PX_PER_MM)
            const firstSlicePx = remainingPx > 0 ? remainingPx : 0;
            const pageSlicePx = Math.floor(usableH * PX_PER_MM);

            let slicesDataUrls = [];
            if (firstSlicePx > 0) {
              // take first slice from y=0
              const fullSlices = sliceCanvasToDataUrls(canvas, pageSlicePx);
              // if first slice px < pageSlicePx, we still used fullSlices; we'll place progressively
              slicesDataUrls = fullSlices;
            } else {
              // no room on current page, use full page slices
              slicesDataUrls = sliceCanvasToDataUrls(canvas, pageSlicePx);
            }

            // Now place slices sequentially:
            let placed = false;
            let yOffsetMm = cursorY;
            for (let si = 0; si < slicesDataUrls.length; si++) {
              const dataUrl = slicesDataUrls[si];
              const img = new Image();
              img.src = dataUrl;
              // measure px dims by creating temp image object (already encoded consistent width)
              await new Promise((res) => (img.onload = res));
              const wPx = img.naturalWidth;
              const hPx = img.naturalHeight;
              const drawW_mm = usableW;
              const drawH_mm = (hPx / wPx) * drawW_mm;

              // If placing first slice and there is room, place on current page, else new page
              if (!placed) {
                if (cursorY + drawH_mm <= pageH - margin) {
                  pdf.addImage(dataUrl, "PNG", margin, cursorY, drawW_mm, drawH_mm);
                  cursorY += drawH_mm + 6;
                  placed = true;
                  continue;
                } else {
                  // start on new page
                  pdf.addPage();
                  cursorY = margin;
                }
              }

              // place remaining slices each on new page top
              if (si > 0 && cursorY !== margin) {
                pdf.addPage();
                cursorY = margin;
              }
              pdf.addImage(dataUrl, "PNG", margin, cursorY, drawW_mm, drawH_mm);
              cursorY += drawH_mm + 6;
            }
            insightsPlacedHeight_mm = (canvasHeightPx / canvasWidthPx) * usableW; // approximate
          }
        }
      }

      // After placing insights, ensure charts start on a fresh page if not enough remaining space
      const minimalChartStartThreshold = margin + usableH * 0.25; // if cursorY past 25% of page, start charts on new page
      if (cursorY > minimalChartStartThreshold) {
        pdf.addPage();
        cursorY = margin;
      }

      // --- CHARTS: 2x2 grid per page ---------------------------------------------
      const cols = 2;
      const rows = 2;
      const chartsPerPage = cols * rows;
      const cellW_mm = usableW / cols;
      const cellH_mm = usableH / rows;

      // choose a target px width and height that match the cell aspect ratio to avoid stretching
      const targetPxWidth = Math.round(cellW_mm * PX_PER_MM * 2); // 2x for quality
      // compute height to match cell aspect ratio exactly
      const targetPxHeight = Math.round(targetPxWidth * (cellH_mm / cellW_mm));

      let chartIndexOnPage = 0;

      for (let i = 0; i < charts.length; i++) {
        const desc = charts[i];
        let imgObj = null;
        try {
          imgObj = await renderApexToDataUrl(desc, targetPxWidth, targetPxHeight);
        } catch (err) {
          console.error("Apex render error for chart index", i, err);
          continue;
        }
        if (!imgObj) continue;

        const { imgURI, widthPx, heightPx } = imgObj;
        // Use the expected cell aspect (we generated at targetPxHeight matching cell ratio)
        const aspect = (heightPx / widthPx) || (cellH_mm / cellW_mm);
        let drawW_mm = cellW_mm;
        let drawH_mm = drawW_mm * aspect;
        if (drawH_mm > cellH_mm) {
          drawH_mm = cellH_mm;
          drawW_mm = drawH_mm / aspect;
        }

        const col = chartIndexOnPage % cols;
        const row = Math.floor(chartIndexOnPage / cols);
        const x = margin + col * cellW_mm + (cellW_mm - drawW_mm) / 2;
        const y = margin + row * cellH_mm + (cellH_mm - drawH_mm) / 2;

        pdf.addImage(imgURI, "PNG", x, y, drawW_mm, drawH_mm);

        // caption (if fit)
        const title = desc.title || (desc.options && desc.options.title && desc.options.title.text) || "";
        if (title) {
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          const capLines = pdf.splitTextToSize(title, cellW_mm - 6);
          const capY = y + drawH_mm + 3;
          if (capY + capLines.length * 5 <= margin + (row + 1) * cellH_mm) {
            pdf.text(capLines, margin + col * cellW_mm + 3, capY);
          }
        }

        chartIndexOnPage++;
        if (chartIndexOnPage >= chartsPerPage) {
          chartIndexOnPage = 0;
          if (i < charts.length - 1) pdf.addPage();
        }
      }

      pdf.save(filename);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to generate PDF. See console for details.");
    } finally {
      setBusy(false);
    }
  };

  // --- Render hidden markdown container used for capture and the button --------
  const cleaned = cleanText(insightsText);

  return (
    <>
      {/* Hidden container — styled for readable markdown when captured */}
      <div
        ref={hiddenRef}
        aria-hidden
        style={{
          position: "absolute",
          left: -99999,
          top: 0,
          width: 900,
          padding: 12,
          background: "#fff",
          color: "#111",
          boxSizing: "border-box",
          fontFamily: "'Inter', Arial, sans-serif",
          lineHeight: 1.5
        }}
      >
        <div id="pdf-insights" style={{ color: "#111" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Insights</div>
          <div style={{ fontSize: 12 }}>
            <ReactMarkdown
              // For safety, we render simple markdown; ReactMarkdown won't run arbitrary HTML
            >
              {cleaned}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={busy}
        style={{
          background: busy ? "#94D3A2" : "#10B981",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 6,
          border: "none",
          cursor: busy ? "wait" : "pointer",
          marginLeft: 8
        }}
      >
        {busy ? "Generating PDF..." : "Download Apex-driven PDF"}
      </button>
    </>
  );
}
