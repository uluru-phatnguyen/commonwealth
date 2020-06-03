import { Request, Response, NextFunction } from 'express';
import Errors from './errors';
import { factory, formatFilename } from '../../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export default async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }

  const subscriptions = await models.Subscription.findAll({
    where: { subscriber_id: req.user.id },
  });
  return res.json({ status: 'Success', result: subscriptions.map((s) => s.toJSON()) });
};
