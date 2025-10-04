import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useCallback, useRef } from "react";

const useAnchors = (onHashChange?: (newHash: string) => void) => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null); // Conteneur interne

  const buildUrlWithHash = useCallback(
    (anchor: string) => {
      const searchParams = new URLSearchParams(location.search);
      return `${location.pathname}?${searchParams.toString()}#${anchor}`;
    },
    [location.pathname, location.search]
  );

  const scrollToAnchor = useCallback((anchor: string) => {
    if (anchor) {
      const element = document.getElementById(anchor);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);

  const navigateToAnchor = useCallback(
    (anchor: string) => {
      const newUrl = buildUrlWithHash(anchor);

      navigate(newUrl, { replace: true });
      scrollToAnchor(anchor);

      if (onHashChange) {
        onHashChange(`#${anchor}`);
      }
    },
    [buildUrlWithHash, navigate, scrollToAnchor, onHashChange]
  );

  const handleUserScroll = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const elements = scrollContainer.querySelectorAll(".page-view .page");
    if (!elements || elements.length === 0) return;

    let visibleAnchor: string | null = null;

    for (const element of elements) {
      const { top, bottom } = element.getBoundingClientRect();
      if (top >= 0 && bottom <= window.innerHeight) {
        visibleAnchor = element.id;
        break;
      }
    }

    if (visibleAnchor && location.hash !== `#${visibleAnchor}`) {
      const newUrl = buildUrlWithHash(visibleAnchor);

      navigate(newUrl, { replace: true });

      if (onHashChange) {
        onHashChange(`#${visibleAnchor}`);
      }
    }
  }, [buildUrlWithHash, location.hash, navigate, onHashChange]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const eventTypes = ["touchmove", "wheel"];
    for (const eventType of eventTypes) {
      scrollContainer.addEventListener(eventType, handleUserScroll);
    }
    return () => {
      for (const eventType of eventTypes) {
        scrollContainer.removeEventListener(eventType, handleUserScroll);
      }
    };
  }, [handleUserScroll]);

  useEffect(() => {
    const handleHashChange = () => {
      if (onHashChange && location.hash) {
        onHashChange(location.hash);
      }
      const anchor = location.hash.replace("#", "");
      navigateToAnchor(anchor);
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [onHashChange, location.hash, navigateToAnchor]);

  return { navigateToAnchor, scrollContainerRef };
};

export default useAnchors;
