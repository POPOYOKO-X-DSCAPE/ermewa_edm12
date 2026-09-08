import { useCallback, useEffect, useState } from "react";

const useMobile = (breakpoint = 768) => {
	const [isMobile, setIsMobile] = useState(false);

	const handleResize = useCallback(() => {
		setIsMobile(window.innerWidth <= breakpoint);
	}, [breakpoint]);

	useEffect(() => {
		handleResize();
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, [handleResize]);

	return isMobile;
};

export default useMobile;
