declare module "svg-to-pdfkit" {
  const SVGtoPDF: (
    doc: PDFKit.PDFDocument,
    svg: string,
    x?: number,
    y?: number,
    options?: { width?: number; height?: number; preserveAspectRatio?: string; assumePt?: boolean; warningCallback?: (warning: string) => void },
  ) => void;
  export default SVGtoPDF;
}
