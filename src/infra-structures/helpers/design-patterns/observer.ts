import type { Observer } from "../types";

const createObservable = <T>(initialValue: T) => {
	let value = initialValue;
	const observers: Observer<T>[] = [];

	const subscribe = (observer: Observer<T>) => {
		observers.push(observer);
		observer(value);

		return () => {
			const index = observers.indexOf(observer);
			if (index !== -1) {
				observers.splice(index, 1);
			}
		};
	};

	const updateValue = (newValue: T) => {
		if (value !== newValue) {
			value = newValue;
			for (const observer of observers) {
				observer(value);
			}
		}
	};

	const getValue = (): T => value;

	return { subscribe, updateValue, getValue };
};

export default createObservable;
