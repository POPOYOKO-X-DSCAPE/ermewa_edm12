import classNames from "classnames";
import { Document, Page } from "react-pdf";
import { Abstract } from "../../../../abstract";
import { Stack } from "../../../../abstract/stack";
import {
  pandaContainer,
  pandaThumbnail,
  pandaThumbnailContainer,
  pandaThumbnails,
  stylePageNumber,
} from "./styles";
import { ThumbnailItemWrapper } from "./thumbnail-wrapper";

export type PdfThumbnailsProps = {
  pdfUrl: string;
  numPages: number;
  onPageClick: (index: number) => void;
  onPageCopy?: (index: number) => void;
  renderItem?: (index: number, node: React.ReactNode) => React.ReactNode;
};

export const PdfThumbnails = ({
  pdfUrl,
  numPages,
  onPageClick,
  onPageCopy,
  renderItem,
}: PdfThumbnailsProps) => (
  <Document file={pdfUrl} className={pandaContainer}>
    <Stack
      className={classNames(pandaThumbnails, "scrollable-thumbnails")}
      grow
      scrollable
    >
      {Array.from({ length: numPages }, (_, i) => {
        const baseNode = (
          <ThumbnailItemWrapper index={i} onCopy={onPageCopy} key={String(i)}>
            <Page
              pageNumber={i + 1}
              className={classNames(pandaThumbnail, pandaThumbnailContainer)}
              width={80}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onClick={() => onPageClick(i)}
            />
            <span className={stylePageNumber}>
              {i + 1}/{numPages}
            </span>
          </ThumbnailItemWrapper>
        );

        return renderItem ? renderItem(i, baseNode) : baseNode;
      })}
    </Stack>
  </Document>
);
