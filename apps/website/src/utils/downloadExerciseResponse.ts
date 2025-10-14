type ExerciseData = {
  title: string;
  description: string;
  response: string;
};

const sanitizeFilename = (title: string): string => {
  return title
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'exercise-response';
};

export const downloadAsText = ({ title, description, response }: ExerciseData): void => {
  const timestamp = new Date().toLocaleString();
  const content = `Exercise: ${title}
Downloaded: ${timestamp}

Prompt:
${description}

Response:
${response}`;

  const filename = sanitizeFilename(title);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${filename}.txt`;
  link.click();

  URL.revokeObjectURL(url);
};
