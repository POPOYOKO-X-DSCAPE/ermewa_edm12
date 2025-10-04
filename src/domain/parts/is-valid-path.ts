const BASENAME = import.meta.env.PROD ? "/app/EDM12" : "";

const isValidPath = () => {
  const path = location.pathname.replace(BASENAME, "").replace(/^\/+/, "");
  const parts = path.split("/").filter(Boolean);
  return parts.length >= 2 && !parts.some((part) => part.includes("*"));
};

export default isValidPath;
