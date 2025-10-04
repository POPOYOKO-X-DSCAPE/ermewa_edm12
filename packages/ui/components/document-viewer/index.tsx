import { Heading, HeadingLevel } from "@ariakit/react";
import {
  RiFlipHorizontal2Line,
  RiFlipVertical2Line,
  RiZoomInLine,
  RiZoomOutLine,
} from "@remixicon/react";
import { css } from "@styles";
import classNames from "classnames";
import { type JSX, useState } from "react";
import { Loader } from "../../../../projects/ermewa_edm12/src/presentation/components/loader";

import { documentStatusMap } from "../../../../projects/ermewa_ui-vwr/src/infrastructure/init";
import { Stack } from "../../abstract/stack";
import { Button } from "../button";
import { type ZoomMode, useZoom } from "./logic/use-zoom";
import { DefaultViewer } from "./viewers/default";
import { EmailViewer } from "./viewers/email";
import { JsonViewer } from "./viewers/json";
// import { PdfViewer } from "./viewers/pdf";
import { PdfViewer } from "./viewers/pdf/index";
import { XmlViewer } from "./viewers/xml";

const pandaHeader = css({
  padding: "c.documentViewer.padding",
  gap: "c.documentViewer.gap",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  bg: "c.documentViewer.bg",
});

const pandaZoom = css({
  display: "flex",
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  gap: "c.documentViewerZoom.gap",
  padding: "c.documentViewer.padding",
  backgroundColor: "s.bg.elevated.initial",
});

const pandaAction = css({
  gap: "c.documentViewer.gap",
  flex: 0,
});

const styleStatus = css({
  display: "flex",
  width: "12px",
  height: "12px",
  borderRadius: "100%",
  backgroundColor: "orange",
});

const styleMeta = css({
  gap: "s.margin.s",
});

interface Action {
  id: string;
  label: string;
  onClick: () => void;
  renderModal?: () => JSX.Element | null;
}

interface DocumentViewerProps {
  url: string;
  name: string;
  date?: string;
  expires?: string;
  status?: number;
  type:
    | "pdf"
    | "jpg"
    | "jpeg"
    | "mpeg"
    | "svg"
    | "mp4"
    | "txt"
    | "json"
    | "xml"
    | "msg"
    | "unknown";
  error: string | null;
  loading: boolean;
  actions?: Action[];
  className?: string;
  onPdfPageCopy?: (pdfPageUrl: string) => void;
  readonly: boolean;
}

export const DocumentViewer = ({
  url,
  name,
  date,
  expires,
  status,
  type,
  error,
  loading,
  actions,
  onPdfPageCopy,
  readonly = false,
}: DocumentViewerProps) => {
  const [effectiveZoom, setEffectiveZoom] = useState(1);
  const {
    previousZoomMode,
    zoomMode,
    setZoomMode,
    currentZoom,
    zoomIn,
    zoomOut,
    canZoomIn,
    canZoomOut,
  } = useZoom(effectiveZoom);

  const currentStatus = status && documentStatusMap[status];

  if (loading) {
    return (
      <Stack
        grow
        direction="column"
        alignItems="center"
        justifyContent="center"
      >
        <p>Chargement du document...</p>
        <Loader />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack
        grow
        direction="column"
        alignItems="center"
        justifyContent="center"
      >
        <p style={{ color: "red" }}>{error}</p>
      </Stack>
    );
  }

  if (!url) return null;

  const isPdf = type === "pdf" || url.toLowerCase().endsWith(".pdf");
  const isJson = type === "json" || url.toLowerCase().endsWith(".json");
  const isXml = type === "xml" || url.toLowerCase().endsWith(".xml");
  const isEmail =
    ["msg", "eml"].includes(type) || url.toLowerCase().endsWith(".msg");
  const canZoom = type === "pdf" || ["jpg, jpeg, mpeg, svg"].includes(type);

  return (
    <Stack direction="column" grow>
      <Stack
        className={classNames(pandaHeader)}
        direction="row"
        alignItems="center"
      >
        <HeadingLevel>
          <Stack>
            <Heading>{name}</Heading>
            <Stack direction="row" className={styleMeta}>
              {currentStatus && (
                <Stack
                  direction="row"
                  className={styleMeta}
                  alignItems="center"
                >
                  <span
                    className={styleStatus}
                    style={{
                      backgroundColor: currentStatus.backgroundColor,
                    }}
                  />
                  {currentStatus.label}
                </Stack>
              )}
              |{date && <span>Date: {date}</span>} |{" "}
              {expires && <span>Expires: {expires}</span>}
            </Stack>
          </Stack>
        </HeadingLevel>

        {actions && (
          <Stack
            direction="row"
            className={classNames(pandaAction)}
            justifyContent="end"
          >
            {actions.map(({ label, onClick, id }) => (
              <Button key={id} onClick={onClick} level="secondary">
                {label}
              </Button>
            ))}
          </Stack>
        )}
      </Stack>

      {/* TODO: check styles : priority (pdf, email, xml, json ...) */}

      {isPdf ? (
        <PdfViewer
          pdfUrl={url}
          onPageCopy={onPdfPageCopy}
          currentZoom={currentZoom}
          zoomMode={zoomMode as ZoomMode}
          onZoomChange={setEffectiveZoom}
          mode={readonly ? "view" : "edit"}
          onPagesChange={(pages) => {
            console.log("new page order");
            console.log(pages);
          }}
          overlayChildren={[
            {
              position: ["bottom", "left"],
              children: (
                <Stack
                  className={classNames(pandaZoom)}
                  direction="row"
                  alignItems="center"
                  grow
                >
                  <b>Zoom:</b> {Math.round(effectiveZoom * 100)}%
                  <Button
                    onClick={() => {
                      setZoomMode("custom");
                      zoomOut(effectiveZoom);
                    }}
                    level="secondary"
                    disabled={!canZoomOut}
                  >
                    <RiZoomOutLine size={12} />
                  </Button>
                  <Button
                    onClick={() => {
                      setZoomMode("custom");
                      zoomIn(effectiveZoom);
                    }}
                    level="secondary"
                    disabled={!canZoomIn}
                  >
                    <RiZoomInLine size={12} />
                  </Button>
                  <Button
                    onClick={() => {
                      if (
                        zoomMode === "fit-height" ||
                        (zoomMode === "custom" &&
                          previousZoomMode === "fit-height")
                      ) {
                        setZoomMode("fit-width");
                      } else {
                        setZoomMode("fit-height");
                      }
                    }}
                    level={zoomMode === "custom" ? "secondary" : "primary"}
                  >
                    {zoomMode === "fit-height" ||
                    (zoomMode === "custom" &&
                      previousZoomMode === "fit-height") ? (
                      <RiFlipVertical2Line size={12} />
                    ) : (
                      <RiFlipHorizontal2Line size={12} />
                    )}
                  </Button>
                </Stack>
              ),
            },
          ]}
        />
      ) : isJson ? (
        <JsonViewer url={url} />
      ) : isXml ? (
        <XmlViewer url={url} />
      ) : isEmail ? (
        <EmailViewer url={url} />
      ) : (
        <DefaultViewer
          url={url}
          type={type}
          currentZoom={currentZoom}
          onZoomChange={setEffectiveZoom}
        />
      )}

      {actions?.map((action) => action.renderModal?.())}
    </Stack>
  );
};
