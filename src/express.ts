import {
  NextFunction as ExpressNextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import {
  assertHipthrustable,
  executeHipthrustable,
  HipRedirectException,
  HipThrustable,
} from './core';
import { Constructor } from './types';

function toExpressHandlerClass<
  TReq extends ExpressRequest,
  TParamsSafe,
  TBodySafe,
  TResBodyUnsafeReturn extends TResBodyUnsafeInput,
  TResBodyUnsafeInput,
  TStrategy extends Constructor<
    HipThrustable<
      TParamsSafe,
      TBodySafe,
      TResBodyUnsafeReturn,
      TResBodyUnsafeInput
    >
  >
>(Strategy: TStrategy) {
  return class extends Strategy {
    protected unsafeReq: TReq;
    protected unsafeRes: Express.Response;
    constructor(...args: any[]) {
      super(...args);
      const req = args[0];
      const res = args[1];
      this.unsafeReq = req;
      this.unsafeRes = res;
      this.params = this.sanitizeParams(req.params);
      this.body = this.sanitizeBody(req.body);
    }
  };
}

export function hipExpressHandlerFactory<
  TParamsSafe,
  TBodySafe,
  TResBodyUnsafeReturn extends TResBodyUnsafeInput,
  TResBodyUnsafeInput
>(
  HandlingStrategy: Constructor<
    HipThrustable<
      TParamsSafe,
      TBodySafe,
      TResBodyUnsafeReturn,
      TResBodyUnsafeInput
    >
  >
) {
  assertHipthrustable(HandlingStrategy);
  const RequestHandler = toExpressHandlerClass(HandlingStrategy);
  return async (
    req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNextFunction
  ) => {
    try {
      const requestHandler = new RequestHandler(req, res);
      const { response, status } = await executeHipthrustable(requestHandler);
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
