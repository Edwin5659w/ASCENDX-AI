import { Response } from 'express';

export const sendSuccess = <T>(res: Response, data: T, status = 200): void => {
  res.status(status).json({ success: true, data });
};

export const sendMessage = (res: Response, message: string, status = 200): void => {
  res.status(status).json({ success: true, message });
};
