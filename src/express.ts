import {
  NextFunction as ExpressNextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import {
  assertHipthrustable,
  executeHipthrustable,
  HipRedirectException,
} from './core';
import {
  HasAllRequireds,
  HasAttachDataProperOptionals,
  HasBodyProperOptionals,
  HasDoWorkProperOptionals,
  HasFinalAuthorizeProperOptionals,
  HasInitPreContext,
  HasInitPreContextProperOptionals,
  HasParamsProperOptionals,
  HasPreauthProperOptionals,
  HasRespondProperOptionals,
  HasUpToAttachDataProperOptionals,
  HasUpToDoWorkProperOptionals,
  HasUpToFinalAuthorizeProperOptionals,
  HasUpToRespondProperOptionals,
} from './types';

interface ExpressInitialUnsafeContext {
  req: ExpressRequest;
  res: ExpressResponse;
}

export function hipExpressHandlerFactory<
  TConf extends HasAllRequireds &
    HasInitPreContextProperOptionals<TConf> &
    HasParamsProperOptionals<TConf> &
    HasBodyProperOptionals<TConf> &
    HasPreauthProperOptionals<TConf> &
    HasUpToAttachDataProperOptionals<TConf> &
    HasAttachDataProperOptionals<TConf> &
    HasUpToFinalAuthorizeProperOptionals<TConf> &
    HasFinalAuthorizeProperOptionals<TConf> &
    HasUpToDoWorkProperOptionals<TConf> &
    HasDoWorkProperOptionals<TConf> &
    HasUpToRespondProperOptionals<TConf> &
    HasRespondProperOptionals<TConf>
>(handlingStrategy: TConf) {
  assertHipthrustable(handlingStrategy);
  // @todo: MINOR: consider bringing this back - it's tricky though cause you need to
  // trick typescript into knowing it's assignable to executeHipthrustable's param!
  // const fullHipthrustable = withDefaultImplementations(handlingStrategy);
  return async (
    req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNextFunction
  ) => {
    try {
      const { response, status } = await executeHipthrustable(
        handlingStrategy,
        { req, res },
        req.params,
        req.body
      );
      res.status(status).json(response);
    } catch (exception) {
      if (exception instanceof HipRedirectException) {
        res.redirect(exception.redirectCode, exception.redirectUrl);
      } else {
        next(exception);
      }
    }
  };
}
