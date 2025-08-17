import React, { useState } from "react";
import ApexCharts from "apexcharts";
import jsPDF from "jspdf";

/**
 * ExportReportApex - adapted to accept chart descriptors like:
 *   { type: "line", title: "X", labels: [...], series: [...] }
 * or the previous shapes:
 *   { options: {...}, series: [...]}  OR  { config: {...} }
 *
 * Produces a PDF with 4 charts/page (2x2) using ApexCharts.dataURI()
 */
export default function ExportReportApex({
  businessSummary = "",
  insightsText = "",
  charts = [],
  filename = "apex_report.pdf"
}) {
  const [busy, setBusy] = useState(false);
  const PX_PER_MM = 96 / 25.4; // ~3.78 px/mm

  // build Apex config from different descriptor shapes
  const buildApexConfig = (desc, targetPxWidth, targetPxHeight) => {
    // if full config provided, use it (but still enforce size + light theme)
    if (desc && desc.config && typeof desc.config === "object") {
      const cfg = { ...desc.config };
      cfg.chart = { ...(cfg.chart || {}), animations: { ...(cfg.chart?.animations || {}), enabled: false }, background: "#ffffff", toolbar: { show: false }, width: targetPxWidth, height: targetPxHeight };
      cfg.theme = { ...(cfg.theme || {}), mode: "light" };
      return cfg;
    }

    // start building from options/series if present
    const base = { ...(desc.options || {}) };

    // normalize series: if desc.series exists, prefer it
    let series = desc.series || (base.series ? base.series : []);
    // If series is a simple numeric array (e.g. [1,2,3]) convert to [{ name, data }]
    if (Array.isArray(series) && series.length && (typeof series[0] === "number" || typeof series[0] === "string")) {
      series = [{ name: desc.title || "Series", data: series }];
    }

    // If series is array but elements are objects with 'y' etc (heatmap/boxPlot shapes) we pass through
    // Now map by type to proper options
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
      theme: { ...(base.theme || {}), mode: "light" }
    };

    // For common chart types set categories/labels
    if (type === "pie" || type === "donut") {
      // Apex pie expects series: [values] and options.labels = [...]
      // If series is [{name,data}] convert to values
      if (Array.isArray(series) && series.length && typeof series[0] === "object" && "data" in series[0] === false) {
        // e.g. series already like [10,20,30]
        cfg.series = series;
      } else if (Array.isArray(series) && series.length && series[0] && Array.isArray(series[0].data)) {
        // if supplied as [{name, data: [..]}], flatten to values (take first dataset)
        cfg.series = series[0].data;
      } else if (Array.isArray(series) && typeof series[0] === "number") {
        cfg.series = series;
      } else {
        // fallback: keep provided series
      }
      if (desc.labels) cfg.labels = desc.labels;
    } else if (type === "heatmap") {
      // heatmap expects series of objects with name/data: leave as-is
      if (desc.labels) {
        // apex heatmap may use x-axis categories per series data; don't force
      }
    } else if (type === "boxPlot") {
      // boxPlot expects series in a specific structure, assume desc.series is already correct
    } else {
      // default: line/area/bar/scatter etc -> set xaxis.categories from labels if present
      if (desc.labels && desc.labels.length) {
        cfg.xaxis = { ...(cfg.xaxis || {}), categories: desc.labels };
      }
      // ensure series is Apex-style: array of { name, data }
      if (Array.isArray(series) && series.length && typeof series[0] !== "object") {
        cfg.series = [{ name: desc.title || "Series", data: series }];
      } else {
        cfg.series = series;
      }
    }

    // Give a readable default title plugin if not present
    if (!cfg.title && desc.title) {
      cfg.title = { text: desc.title, align: "left", style: { color: "#111", fontSize: "14px" } };
    } else if (cfg.title && typeof cfg.title === "string") {
      cfg.title = { text: cfg.title, align: "left" };
    }

    // small visual defaults for PDF legibility
    cfg.stroke = { ...(cfg.stroke || {}), width: cfg.stroke?.width ?? 2 };
    if (!cfg.legend) cfg.legend = { ...(cfg.legend || {}), labels: { colors: "#222" } };

    return cfg;
  };

  // render an Apex descriptor to a PNG/SVG data URI using off-screen container
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
        // fallback convert svg to base64
        const svg = data.svg;
        const svg64 = btoa(unescape(encodeURIComponent(svg)));
        const img64 = "data:image/svg+xml;base64," + svg64;
        await chart.destroy();
        document.body.removeChild(container);
        return { imgURI: img64, widthPx: targetPxWidth, heightPx: targetPxHeight };
      }

      // ensure image loads (so we can measure natural size)
      const img = new Image();
      img.src = imgURI;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      const widthPx = img.naturalWidth || targetPxWidth;
      const heightPx = img.naturalHeight || targetPxHeight;

      await chart.destroy();
      document.body.removeChild(container);

      return { imgURI, widthPx, heightPx };
    } catch (err) {
      try { document.body.removeChild(container); } catch (e) { /* ignore */ }
      throw err;
    }
  };

  // light markdown-ish -> plain text for PDF (minimal)
  const markdownToPlain = (md) => {
    if (!md) return "";
    let t = md;
    t = t.replace(/```[\s\S]*?```/g, match => "\n[code]\n" + match.replace(/```/g, "") + "\n[/code]\n");
    t = t.replace(/^#{1,6}\s*(.*)$/gm, (m, g1) => `\n${g1.toUpperCase()}\n`);
    t = t.replace(/^\s*[-*+]\s+/gm, "• ");
    t = t.replace(/^\s*\d+\.\s+/gm, "• ");
    t = t.replace(/\*\*(.*?)\*\*/g, "$1");
    t = t.replace(/\*(.*?)\*/g, "$1");
    t = t.replace(/\[(.*?)\]\(.*?\)/g, "$1");
    t = t.replace(/\n{3,}/g, "\n\n");
    return t.trim();
  };

  const handleExport = async () => {
    if (!charts || charts.length === 0) {
      if (!window.confirm("No charts provided — continue and export text only?")) return;
    }
    setBusy(true);

    try {
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;

      // header
      let cursorY = 20;
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Data Report", margin, cursorY);
      cursorY += 10;

      // business summary
      if (businessSummary) {
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(businessSummary, usableW);
        const lh = 7;
        if (cursorY + lines.length * lh > pageH - margin) {
          pdf.addPage();
          cursorY = margin;
        }
        pdf.text(lines, margin, cursorY);
        cursorY += lines.length * lh + 6;
      }

      // insights (plain)
      if (insightsText) {
        const plain = markdownToPlain(insightsText);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(plain, usableW);
        const lh = 7;
        if (cursorY + lines.length * lh > pageH - margin) {
          pdf.addPage();
          cursorY = margin;
        }
        pdf.text(lines, margin, cursorY);
        cursorY += lines.length * lh + 8;
      }

      // start charts on new page if space low
      if (cursorY > margin + usableH / 3) {
        pdf.addPage();
        cursorY = margin;
      }

      // grid 2x2
      const cols = 2;
      const rows = 2;
      const chartsPerPage = cols * rows;
      const cellW_mm = usableW / cols;
      const cellH_mm = usableH / rows;

      const targetPxWidth = Math.round(cellW_mm * PX_PER_MM * 2); // 2x for quality
      const targetPxHeight = Math.round(cellH_mm * PX_PER_MM * 2);

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
        const aspect = heightPx / widthPx;
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

        // caption
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

  return (
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
  );
}
