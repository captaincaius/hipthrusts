import {
  NextFunction as ExpressNextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import {
  assertHipthrustable,
  executeHipthrustable,
  HipRedirectException,
  withDefaultImplementations,
} from './core';
import {
  AttachDataReqsSatisfiedOptional,
  DoWorkReqsSatisfiedOptional,
  FinalAuthReqsSatisfied,
  HasAllNotRequireds,
  HasAllRequireds,
  HasBodyProperOptionals,
  HasInitPreContextProperOptionals,
  HasParamsProperOptionals,
  PreAuthReqsSatisfied,
  RespondReqsSatisfied,
  SanitizeResponseReqsSatisfied,
} from './types';

export function hipExpressHandlerFactory<
  TConf extends HasAllRequireds &
    HasAllNotRequireds &
    HasInitPreContextProperOptionals<TConf> &
    HasParamsProperOptionals<TConf> &
    HasBodyProperOptionals<TConf> &
    PreAuthReqsSatisfied<TConf> &
    AttachDataReqsSatisfiedOptional<TConf> &
    FinalAuthReqsSatisfied<TConf> &
    DoWorkReqsSatisfiedOptional<TConf> &
    RespondReqsSatisfied<TConf> &
    SanitizeResponseReqsSatisfied<TConf>
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
