/**
 * PDFs module (student viewer).
 *
 * Architecture
 * ------------
 * modules/pdfs/
 *   components/
 *     PdfViewerHeader.tsx   — back + title + download
 *     PdfWebView.tsx        — WebView that opens the PDF URL
 *     PdfLoadingOverlay.tsx — spinner while preparing / opening
 *     PdfErrorPanel.tsx     — error message + Retry
 *   hooks/usePdfSource.ts   — network + cache → viewer URI
 *   screens/PdfViewerScreen.tsx
 *   utils/
 *     pdfCache.ts           — expo-file-system offline cache
 *     resolvePdfViewerUri.ts
 *     sharePdf.ts           — expo-sharing download/share
 *
 * Flow
 * ----
 * ChapterContent taps PDF → PdfViewer { courseId, chapterId, pdfId }
 * Screen loads chapter detail → finds PdfPublic (file_url)
 * usePdfSource caches file under Paths.cache/pdfs/{id}.pdf
 * WebView opens resolved URI; header Download uses share sheet
 */
export { PdfViewerScreen } from './screens/PdfViewerScreen';
export { PdfWebView } from './components/PdfWebView';
export { PdfViewerHeader } from './components/PdfViewerHeader';
export { PdfLoadingOverlay } from './components/PdfLoadingOverlay';
export { PdfErrorPanel } from './components/PdfErrorPanel';
export { usePdfSource } from './hooks/usePdfSource';
export { ensurePdfCached, getCachedPdfUri } from './utils/pdfCache';
export { shareOrDownloadPdf } from './utils/sharePdf';
