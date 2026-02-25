import createHttpError from 'http-errors';

export const parseZoomLink = (link?: string | null): { meetingNumber: string; meetingPassword: string } => {
  if (!link) {
    throw new createHttpError.InternalServerError('Invalid or missing zoom link');
  }

  const matches = /\/j\/(\d+)\?pwd=([a-zA-Z0-9]+)/.exec(link);
  if (!matches) {
    throw new createHttpError.InternalServerError('Invalid or missing zoom link');
  }

  const [, number, password] = matches;
  if (!number) {
    throw new createHttpError.InternalServerError('Zoom link missing meeting number');
  }

  if (!password) {
    throw new createHttpError.InternalServerError('Zoom link missing password');
  }

  return { meetingNumber: number, meetingPassword: password };
};
