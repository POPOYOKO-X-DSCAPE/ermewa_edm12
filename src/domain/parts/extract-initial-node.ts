const extractInitialNode = () => {
  const urlParams = new URLSearchParams(window.location.search);

  const fld = urlParams.get("FLD") || "";

  const [name, sid] = fld.split("$");

  const nature = urlParams.get("NAT");
  const document = urlParams.get("DOC");

  return {
    folder: { name, sid },
    nature,
    document,
  };
};

export default extractInitialNode;
