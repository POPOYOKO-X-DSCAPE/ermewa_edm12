import { RiDeleteBinLine, RiFileCopyLine } from "@remixicon/react";
import { css } from "@styles";
import classNames from "classnames";
import type { ReactNode } from "react";
import { Stack } from "../../../../abstract/stack";
import { Button } from "../../../button";
import { stylePageNumber } from "./styles";

export type ThumbnailItemWrapperProps = {
  index: number;
  children: ReactNode;
  onRemove?: (index: number) => void;
  onCopy?: (index: number) => void;
};

const style = css({
  gap: "s.margin.s",
  position: "relative",
});

export const ThumbnailItemWrapper = ({
  index,
  children,
  onRemove,
  onCopy,
}: ThumbnailItemWrapperProps) => (
  <Stack direction="row" alignItems="center" grow className={style}>
    {children}
    <Stack direction="column" className={classNames(style)}>
      {onCopy ? (
        <Button level="secondary" onClick={() => onCopy(index)}>
          <RiFileCopyLine size={12} />
        </Button>
      ) : null}
      {onRemove ? (
        <Button level="secondary" onClick={() => onRemove(index)}>
          <RiDeleteBinLine size={12} />
        </Button>
      ) : null}
    </Stack>
  </Stack>
);
