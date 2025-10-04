export const formatDate = (date: Date | number) => {
	const dateInstance: Date = date instanceof Date ? date : new Date(date);
	const year = dateInstance.getFullYear();
	const month = dateInstance.getMonth() + 1;
	const day = dateInstance.getDate();

	return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
};

export const formatDateToLongString = (date: Date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0"); // Les mois commencent à 0 en JS, donc on ajoute 1
	const day = String(date.getDate()).padStart(2, "0");

	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	const seconds = String(date.getSeconds()).padStart(2, "0");

	const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};
