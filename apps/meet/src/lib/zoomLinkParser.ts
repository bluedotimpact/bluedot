import createHttpError from 'http-errors';

export const parseZoomLink = (link: string): { meetingNumber: string, meetingPassword: string } => {
  const matches = link.match(/\/j\/(\d+)\?pwd=([a-zA-Z0-9]+)/);
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
