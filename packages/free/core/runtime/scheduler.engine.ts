type Task = () => void;

export const createScheduler = () => {
	const queue = new Set<Task>();

	let scheduled = false;

	const flush = () => {
		scheduled = false;

		const tasks = Array.from(queue);

		queue.clear();

		for (const task of tasks) {
			task();
		}
	};

	const schedule = (task: Task) => {
		queue.add(task);

		if (scheduled) return;

		scheduled = true;

		queueMicrotask(flush);
	};

	return {
		schedule,
	};
};
