/**
 * Report Export
 *
 * Export generated reports to various formats.
 */

import type {
  GeneratedReport,
  ReportFormat,
  ReportGenerationOptions,
  ReportColors,
  ChartData,
} from './types';
import { getColorScheme } from './templates';

/**
 * Export report to specified format
 */
export function exportReport(
  report: GeneratedReport,
  format: ReportFormat,
  options: Partial<ReportGenerationOptions> = {}
): string {
  switch (format) {
    case 'html':
      return exportToHtml(report, options);
    case 'markdown':
      return exportToMarkdown(report, options);
    case 'json':
      return exportToJson(report, options);
    case 'pdf':
      return exportToPdfHtml(report, options);
    case 'docx':
      return exportToDocx(report, options);
    default:
      throw new Error(`Unknown export format: ${format}`);
  }
}

/**
 * Export to HTML
 */
export function exportToHtml(
  report: GeneratedReport,
  options: Partial<ReportGenerationOptions> = {}
): string {
  const colors = report.config.customColors || getColorScheme(report.config.colorScheme);

  const cssStyles = generateCssStyles(colors);
  const sectionsHtml = report.content.sections.map((s) => s.html).join('\n');
  const chartsHtml = generateChartsHtml(report.content.charts, colors);

  const tocHtml = report.content.tableOfContents
    ? `
      <div class="table-of-contents">
        <h2>Table of Contents</h2>
        <ul>
          ${report.content.tableOfContents.map((entry) => `
            <li><a href="#${entry.sectionId}">${entry.title}</a></li>
          `).join('')}
        </ul>
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="${report.config.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.config.title}</title>
  <style>
    ${cssStyles}
  </style>
</head>
<body>
  <div class="report-container">
    ${tocHtml}
    ${sectionsHtml}
    ${chartsHtml}
    ${report.config.footerText ? `
      <footer class="report-footer">
        <p>${report.config.footerText}</p>
      </footer>
    ` : ''}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Export to Markdown
 */
export function exportToMarkdown(
  report: GeneratedReport,
  _options: Partial<ReportGenerationOptions> = {}
): string {
  const toc = report.content.tableOfContents
    ? `## Table of Contents\n\n${report.content.tableOfContents.map((entry) => `- [${entry.title}](#${entry.sectionId.toLowerCase().replace(/\s+/g, '-')})`).join('\n')}\n\n---\n\n`
    : '';

  const sections = report.content.sections.map((s) => s.markdown).join('\n\n---\n\n');

  const footer = report.config.footerText
    ? `\n\n---\n\n*${report.config.footerText}*`
    : '';

  return `${toc}${sections}${footer}`;
}

/**
 * Export to JSON
 */
export function exportToJson(
  report: GeneratedReport,
  options: Partial<ReportGenerationOptions> = {}
): string {
  const output = {
    id: report.id,
    config: report.config,
    generatedAt: report.generatedAt,
    generationDuration: report.generationDuration,
    sections: report.content.sections.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      content: s.markdown,
    })),
    charts: report.content.charts,
    tableOfContents: report.content.tableOfContents,
    warnings: report.warnings,
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Export to PDF-ready HTML (for PDF generation libraries)
 */
export function exportToPdfHtml(
  report: GeneratedReport,
  options: Partial<ReportGenerationOptions> = {}
): string {
  const colors = report.config.customColors || getColorScheme(report.config.colorScheme);
  const { margins, paperSize, orientation } = report.config;

  const pageSizes: Record<string, { width: string; height: string }> = {
    letter: { width: '8.5in', height: '11in' },
    a4: { width: '210mm', height: '297mm' },
    legal: { width: '8.5in', height: '14in' },
  };

  const size = pageSizes[paperSize];

  const pdfStyles = `
    @page {
      size: ${size.width} ${size.height} ${orientation === 'landscape' ? 'landscape' : 'portrait'};
      margin: ${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .page-break {
        page-break-before: always;
      }

      .no-break {
        page-break-inside: avoid;
      }
    }

    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: ${colors.text};
    }

    h1 { font-size: 24pt; color: ${colors.primary}; }
    h2 { font-size: 18pt; color: ${colors.primary}; margin-top: 24pt; }
    h3 { font-size: 14pt; color: ${colors.secondary}; margin-top: 16pt; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
    }

    th, td {
      padding: 8pt;
      border: 1pt solid ${colors.border};
      text-align: left;
    }

    th {
      background: ${colors.primary}10;
      font-weight: 600;
    }

    .header-section {
      text-align: center;
      border-bottom: 2pt solid ${colors.primary};
      padding-bottom: 20pt;
      margin-bottom: 20pt;
    }

    .stat-card {
      display: inline-block;
      width: 30%;
      text-align: center;
      padding: 12pt;
      border: 1pt solid ${colors.border};
      margin: 4pt;
    }

    .finding-card {
      border: 1pt solid ${colors.border};
      border-left: 3pt solid ${colors.primary};
      padding: 12pt;
      margin: 8pt 0;
    }

    footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9pt;
      color: ${colors.textLight};
      padding: 8pt;
      border-top: 1pt solid ${colors.border};
    }

    ${options.watermark ? `
      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 72pt;
        color: ${colors.border};
        opacity: 0.3;
        pointer-events: none;
        z-index: 1000;
      }
    ` : ''}
  `;

  const sectionsHtml = report.content.sections.map((s, i) => `
    <div id="${s.id}" class="section ${i > 0 ? 'page-break' : ''}">
      ${s.html}
    </div>
  `).join('\n');

  return `
<!DOCTYPE html>
<html lang="${report.config.language}">
<head>
  <meta charset="UTF-8">
  <title>${report.config.title}</title>
  <style>
    ${pdfStyles}
  </style>
</head>
<body>
  ${options.watermark ? `<div class="watermark">${options.watermark}</div>` : ''}

  <div class="report-content">
    ${sectionsHtml}
  </div>

  ${report.config.footerText ? `
    <footer>
      ${report.config.footerText}
    </footer>
  ` : ''}
</body>
</html>
  `.trim();
}

/**
 * Export to DOCX-compatible HTML (for conversion libraries)
 */
export function exportToDocx(
  report: GeneratedReport,
  _options: Partial<ReportGenerationOptions> = {}
): string {
  // DOCX export creates a simplified HTML that can be converted to DOCX
  // by libraries like html-docx-js or mammoth

  const sections = report.content.sections.map((s) => `
    <div class="section">
      <h2>${s.title}</h2>
      ${s.html}
    </div>
  `).join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${report.config.title}</title>
  <style>
    body { font-family: 'Calibri', sans-serif; font-size: 11pt; }
    h1 { font-size: 24pt; }
    h2 { font-size: 18pt; }
    h3 { font-size: 14pt; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 8px; }
  </style>
</head>
<body>
  <h1>${report.config.title}</h1>
  ${report.config.subtitle ? `<p>${report.config.subtitle}</p>` : ''}

  ${sections}
</body>
</html>
  `.trim();
}

/**
 * Generate CSS styles for HTML export
 */
function generateCssStyles(colors: ReportColors): string {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: ${colors.text};
      background: ${colors.background};
    }

    .report-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px;
    }

    h1 {
      font-size: 28px;
      color: ${colors.primary};
      margin-bottom: 8px;
    }

    h2 {
      font-size: 22px;
      color: ${colors.primary};
      margin-top: 40px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${colors.border};
    }

    h3 {
      font-size: 18px;
      color: ${colors.secondary};
      margin-top: 24px;
      margin-bottom: 12px;
    }

    p {
      margin-bottom: 12px;
    }

    ul, ol {
      margin-left: 24px;
      margin-bottom: 16px;
    }

    li {
      margin-bottom: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    th, td {
      padding: 12px;
      border: 1px solid ${colors.border};
      text-align: left;
    }

    th {
      background: ${colors.primary}10;
      font-weight: 600;
    }

    tr:nth-child(even) {
      background: ${colors.border}50;
    }

    .section {
      margin-bottom: 40px;
    }

    .stat-card {
      display: inline-block;
      padding: 20px;
      background: ${colors.background};
      border: 1px solid ${colors.border};
      border-radius: 8px;
      text-align: center;
      min-width: 150px;
    }

    .finding-card,
    .drug-response-card,
    .trait-card,
    .risk-card,
    .recommendation-card {
      padding: 16px;
      border: 1px solid ${colors.border};
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .finding-card {
      border-left: 4px solid ${colors.primary};
    }

    .table-of-contents {
      background: ${colors.border}30;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 40px;
    }

    .table-of-contents ul {
      list-style: none;
      margin-left: 0;
    }

    .table-of-contents a {
      color: ${colors.primary};
      text-decoration: none;
    }

    .table-of-contents a:hover {
      text-decoration: underline;
    }

    .report-footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid ${colors.border};
      text-align: center;
      color: ${colors.textLight};
      font-size: 12px;
    }

    .chart-container {
      margin: 20px 0;
      padding: 20px;
      background: ${colors.background};
      border: 1px solid ${colors.border};
      border-radius: 8px;
    }

    .chart-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .chart-subtitle {
      font-size: 12px;
      color: ${colors.textLight};
      margin-bottom: 16px;
    }

    @media print {
      body {
        font-size: 11pt;
      }

      .report-container {
        max-width: none;
        padding: 0;
      }

      h2 {
        page-break-after: avoid;
      }

      .finding-card,
      .drug-response-card,
      .trait-card,
      .risk-card {
        page-break-inside: avoid;
      }
    }
  `;
}

/**
 * Generate HTML for charts (placeholder for actual chart rendering)
 */
function generateChartsHtml(charts: ChartData[], colors: ReportColors): string {
  // Note: Actual chart rendering would be done client-side with a library like Chart.js
  // This generates placeholder containers with data attributes

  return charts.map((chart) => `
    <div class="chart-container" id="chart-${chart.id}" data-chart='${JSON.stringify(chart)}'>
      <div class="chart-title">${chart.title}</div>
      ${chart.subtitle ? `<div class="chart-subtitle">${chart.subtitle}</div>` : ''}
      <div class="chart-placeholder" style="
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${colors.border}30;
        border-radius: 4px;
      ">
        <span style="color: ${colors.textLight};">
          Chart: ${chart.type} (${chart.labels.length} data points)
        </span>
      </div>
    </div>
  `).join('\n');
}

/**
 * Calculate file size of exported content
 */
export function calculateExportSize(content: string): number {
  return new TextEncoder().encode(content).length;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  report: GeneratedReport,
  format: ReportFormat
): string {
  const date = new Date().toISOString().split('T')[0];
  const title = report.config.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const extensions: Record<ReportFormat, string> = {
    pdf: 'pdf',
    html: 'html',
    markdown: 'md',
    json: 'json',
    docx: 'docx',
  };

  return `${title}-${date}.${extensions[format]}`;
}
