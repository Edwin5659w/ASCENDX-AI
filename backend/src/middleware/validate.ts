import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, part: RequestPart = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const firstMessage = result.error.errors[0]?.message ?? 'Validación fallida';
      res.status(400).json({
        success: false,
        error: firstMessage,
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    req[part] = result.data;
    next();
  };
