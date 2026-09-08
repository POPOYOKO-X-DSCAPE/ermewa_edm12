import { css } from "@styles";
import { useState } from "react";

export const DefaultAnchor = () => {
	const [isHover, setIsHover] = useState(false);

	const styles = {
		container: css({
			zIndex: 100,
			width: 16,
			height: "100%",
			backgroundColor: "transparent",
			position: "absolute",
			top: 0,
			right: -16,
			cursor: "w-resize",
			display: "flex",
			flexDirection: "column",
			alignItems: "start",
			transition: "all .8s ease-in-out",
		}),
		bar: css({
			bg: "b.colors.black",
			opacity: !isHover ? "10%" : "80%",
			height: "100%",
			width: "2px",
			transition: "all .2s ease-in-out",
		}),
	};

	return (
		<div
			className={styles.container}
			onMouseEnter={() => setIsHover(true)}
			onMouseLeave={() => setIsHover(false)}
		>
			<div className={styles.bar} />
		</div>
	);
};
