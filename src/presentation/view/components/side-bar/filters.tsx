import {
  Disclosure,
  DisclosureContent,
  DisclosureProvider,
  Radio,
  useDisclosureStore,
} from "@ariakit/react";
import { Checkbox, Stack } from "@packages/ui";
import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiFilter2Line,
} from "@remixicon/react";
import { Status } from "@src/presentation/components/status/status";
import { createComponent } from "@src/core/component.builder";
import { useState } from "react";
import { css } from "../../../../../../../styled-system/css";

const styles = {
  disclosure: css({
    padding: "s.padding.m",
    borderBottom:
      "1px solid color-mix(in srgb, var(--colors-s-fg-default-initial) 40%, transparent)",
    cursor: "pointer",
    backgroundColor: "s.bg.elevated.initial",
    _hover: {
      backgroundColor: "s.bg.elevated.hover",
    },
  }),
  disclosureContent: css({
    padding: "s.padding.m",
    gap: "s.padding.m",
  }),
  radios: css({
    gap: "s.padding.m",
  }),
  radio: css({
    gap: "s.padding.xxs",
  }),
  checkboxes: css({
    gap: "s.padding.m",
  }),
};

export const Filters = createComponent(
  ({
    models: {
      folderTreeModel: { filters },
      i18nModel: { i18n },
    },
    controllers: {
      folderTreeController: { setSidebarFilters },
    },
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    const disclosure = useDisclosureStore({
      open: isOpen,
      setOpen: (open: boolean) => {
        setIsOpen(open);
      },
    });

    const toggleStatus = (status: number) => {
      const current = filters?.statuses ?? [];

      const next = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status];

      setSidebarFilters({ statuses: next });
    };

    const toggleMandatory = (value: boolean) => {
      setSidebarFilters({ mandatoryOnly: value });
    };

    return (
      <Stack>
        <DisclosureProvider>
          <Disclosure store={disclosure}>
            <Stack
              grow
              direction="row"
              alignItems="center"
              className={styles.disclosure}
            >
              <Stack grow direction="row">
                <RiFilter2Line />
                {i18n.t("sidebarFilters")}
              </Stack>
              {isOpen ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
            </Stack>
          </Disclosure>

          <DisclosureContent store={disclosure}>
            <Stack className={styles.disclosureContent}>
              <Stack direction="row" className={styles.radios}>
                <Stack direction="row" className={styles.radio}>
                  <Radio
                    value="mandatory"
                    checked={filters?.mandatoryOnly === true}
                    onChange={() => toggleMandatory(true)}
                  />
                  {i18n.t("sidebarMandatoryOnly")}
                </Stack>

                <Stack direction="row" className={styles.radio}>
                  <Radio
                    value="all"
                    checked={!filters?.mandatoryOnly}
                    onChange={() => toggleMandatory(false)}
                  />
                  {i18n.t("sidebarAll")}
                </Stack>
              </Stack>

              <Stack direction="row" className={styles.checkboxes}>
                {[0, 1, 2, 3, 4, 5].map((status) => (
                  <Checkbox
                    key={status}
                    checked={filters?.statuses?.includes(status) ?? false}
                    ariaLabel={`${i18n.t("viewerStatus")} ${status}`}
                    onValueChange={() => toggleStatus(status)}
                    label={<Status statusType={status} />}
                  />
                ))}
              </Stack>
            </Stack>
          </DisclosureContent>
        </DisclosureProvider>
      </Stack>
    );
  },
);
