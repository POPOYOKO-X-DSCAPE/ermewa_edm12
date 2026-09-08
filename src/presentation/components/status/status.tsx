interface IStatus {
  statusType: number;
}

export const Status = ({ statusType }: IStatus) => {
  const statusColor = () => {
    switch (statusType) {
      case 0:
        return "grey";
      case 1:
        return "orange";
      case 2:
        return "green";
      case 3:
        return "red";
      case 4:
        return "black";
      case 5:
        return "lavender";
      default:
        return "black";
    }
  };
  return (
    <div
      style={{
        backgroundColor: statusColor(),
        height: "16px",
        width: "16px",
        borderRadius: "16px",
      }}
    />
  );
};
