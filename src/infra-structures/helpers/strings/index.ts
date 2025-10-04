export function formatText(input: string, format: string, placeholder = '#'): string {
  let formatted = '';
  let inputIndex = 0;

  for (let i = 0; i < format.length; i++) {
      if (format[i] === placeholder) {
          if (inputIndex < input.length) {
              formatted += input[inputIndex];
              inputIndex++;
          }
      } else {
          formatted += format[i];
      }
  }

  return formatted;
};
