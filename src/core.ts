import Boom from '@hapi/boom';
import {
  AttachDataReqsSatisfiedOptional,
  DoWorkReqsSatisfiedOptional,
  FinalAuthReqsSatisfied,
  HasAllNotRequireds,
  HasAllRequireds,
  HasAllStagesNotOptionals,
  HasAttachData,
  HasDoWork,
  HasFinalAuthorize,
  HasInitPreContext,
  HasPreAuthorize,
  HasRespond,
  HasSanitizeBody,
  HasSanitizeParams,
  HasSanitizeResponse,
  MightHaveFinalAuthorize,
  MightHavePreAuthorize,
  MightHaveRespond,
  MightHaveSanitizeResponse,
  OptionallyHasAttachData,
  OptionallyHasDoWork,
  OptionallyHasInitPreContext,
  OptionallyHasSanitizeBody,
  OptionallyHasSanitizeParams,
  PreAuthReqsSatisfied,
  PromiseOrSync,
  PromiseResolveOrSync,
  RespondReqsSatisfied,
  SanitizeResponseReqsSatisfied,
} from './types';

export function withDefaultImplementations<
  TStrategy extends HasAllNotRequireds &
    HasAllRequireds &
    PreAuthReqsSatisfied<TStrategy> &
    AttachDataReqsSatisfiedOptional<TStrategy> &
    FinalAuthReqsSatisfied<TStrategy> &
    DoWorkReqsSatisfiedOptional<TStrategy> &
    RespondReqsSatisfied<TStrategy> &
    SanitizeResponseReqsSatisfied<TStrategy>
>(strategy: TStrategy): HasAllStagesNotOptionals {
  return {
    initPreContext:
      strategy.initPreContext ||
      (() => {
        return {};
      }),
    sanitizeParams:
      strategy.sanitizeParams ||
      (() => {
        return {};
      }),
    sanitizeBody:
      strategy.sanitizeBody ||
      (() => {
        return {};
      }),
    preAuthorize: strategy.preAuthorize,
    attachData:
      strategy.attachData ||
      (() => {
        return {};
      }),
    finalAuthorize: strategy.finalAuthorize,
    doWork:
      strategy.doWork ||
      (() => {
        return {};
      }),
    respond: strategy.respond,
    sanitizeResponse: strategy.sanitizeResponse,
  };
}

export function isHasInitPreContext<TContextIn, TContextOut>(
  thing: OptionallyHasInitPreContext<TContextIn, TContextOut>
): thing is HasInitPreContext<TContextIn, TContextOut> {
  return !!(thing && thing.initPreContext);
}

export function isHasAttachData<TContextIn, TContextOut>(
  thing: OptionallyHasAttachData<TContextIn, TContextOut>
): thing is HasAttachData<TContextIn, TContextOut> {
  return !!(thing && thing.attachData);
}

export function isHasDoWork<TContextIn, TContextOut>(
  thing: OptionallyHasDoWork<TContextIn, TContextOut>
): thing is HasDoWork<TContextIn, TContextOut> {
  return !!(thing && thing.doWork);
}

export function isHasFinalAuthorize<TContextIn, TContextOut>(
  thing: MightHaveFinalAuthorize<TContextIn, TContextOut>
): thing is HasFinalAuthorize<TContextIn, TContextOut> {
  return !!(thing && thing.finalAuthorize);
}

export function isHasPreAuthorize<TContextIn, TContextOut>(
  thing: MightHavePreAuthorize<TContextIn, TContextOut>
): thing is HasPreAuthorize<TContextIn, TContextOut> {
  return !!(thing && thing.preAuthorize);
}

export function isHasSanitizeParams<TContextIn, TContextOut>(
  thing: OptionallyHasSanitizeParams<TContextIn, TContextOut>
): thing is HasSanitizeParams<TContextIn, TContextOut> {
  return !!(thing && thing.sanitizeParams);
}

export function isHasSanitizeBody<TContextIn, TContextOut>(
  thing: OptionallyHasSanitizeBody<TContextIn, TContextOut>
): thing is HasSanitizeBody<TContextIn, TContextOut> {
  return !!(thing && thing.sanitizeBody);
}

export function isHasSanitizeResponse<TContextIn, TContextOut>(
  thing: MightHaveSanitizeResponse<TContextIn, TContextOut>
): thing is HasSanitizeResponse<TContextIn, TContextOut> {
  return !!(thing && thing.sanitizeResponse);
}

export function isHasRespond<TContextIn, TContextOut>(
  thing: MightHaveRespond<TContextIn, TContextOut>
): thing is HasRespond<TContextIn, TContextOut> {
  return !!(thing && thing.respond);
}

export function authorizationPassed<TAuthOut extends boolean | object>(
  authOut: TAuthOut
) {
  return (
    authOut === true ||
    (authOut && typeof authOut === 'object' && Object.keys(authOut).length > 0)
  );
}

export class HipRedirectException {
  constructor(
    public readonly redirectUrl: string,
    public readonly redirectCode = 302
  ) {}
}

function transformThrowSync<TOrigFn extends (param: any) => any>(
  toThrow: any,
  origFn: TOrigFn,
  origParam: Parameters<TOrigFn>[0]
): ReturnType<TOrigFn> {
  try {
    return origFn(origParam);
  } catch (exception) {
    if (exception instanceof HipRedirectException || Boom.isBoom(exception)) {
      // Don't transform redirect exceptions or intentionally constructed boom errors
      throw exception;
    } else {
      // All other uncaught exceptions transform to whatever is requested
      throw toThrow;
    }
  }
}

function transformThrowPossiblyAsync<
  TOrigFn extends (param: any) => PromiseOrSync<any>
>(
  toThrow: any,
  origFn: TOrigFn,
  origParam: Parameters<TOrigFn>[0]
): Promise<PromiseResolveOrSync<ReturnType<TOrigFn>>> {
  return Promise.resolve(origFn(origParam)).catch(exception => {
    if (exception instanceof HipRedirectException || Boom.isBoom(exception)) {
      // Don't transform redirect exceptions or intentionally constructed boom errors
      throw exception;
    } else {
      // All other uncaught exceptions transform to whatever is requested
      throw toThrow;
    }
  });
}

export async function executeHipthrustable<
  TConf extends HasAllStagesNotOptionals &
    PreAuthReqsSatisfied<TConf> &
    AttachDataReqsSatisfiedOptional<TConf> &
    FinalAuthReqsSatisfied<TConf> &
    DoWorkReqsSatisfiedOptional<TConf> &
    RespondReqsSatisfied<TConf> &
    SanitizeResponseReqsSatisfied<TConf>,
  TUnsafe,
  TUnsafeParams,
  TUnsafeBody
>(
  requestHandler: TConf,
  unsafe: TUnsafe,
  unsafeParams: TUnsafeParams,
  unsafeBody: TUnsafeBody
) {
  const badDataThrow = Boom.badData('User input sanitization failure');
  const safeInitPreContext = transformThrowSync(
    badDataThrow,
    requestHandler.initPreContext,
    unsafe
  );
  // @todo: maybe params should throw something different like 400
  const safeParams = transformThrowSync(
    badDataThrow,
    requestHandler.sanitizeParams,
    unsafeParams
  );
  const safeBody = transformThrowSync(
    badDataThrow,
    requestHandler.sanitizeBody,
    unsafeBody
  );
  const inputsContext = {
    preContext: safeInitPreContext,
    params: safeParams,
    body: safeBody,
  };

  const forbiddenPreAuthThrow = Boom.forbidden(
    'General pre-authorization lacking for this resource'
  );

  const preAuthorizeResult = transformThrowSync(
    forbiddenPreAuthThrow,
    requestHandler.preAuthorize,
    inputsContext
  );

  const preAuthorizePassed = authorizationPassed(preAuthorizeResult);

  if (!preAuthorizePassed) {
    throw forbiddenPreAuthThrow;
  }

  const preAuthorizeContextOut =
    preAuthorizeResult === true ? {} : preAuthorizeResult;

  const preAuthContext = {
    ...inputsContext,
    ...preAuthorizeContextOut,
  };

  const notFoundThrow = Boom.notFound('Resource not found');
  const attachedDataContextOnly =
    (await transformThrowPossiblyAsync(
      notFoundThrow,
      requestHandler.attachData,
      preAuthContext
    )) || {};
  const attachedDataContext = { ...preAuthContext, ...attachedDataContextOnly };

  const forbiddenFinalAuthThrow = Boom.forbidden(
    'General authorization lacking for this resource'
  );

  const finalAuthorizeResult = await transformThrowPossiblyAsync(
    forbiddenFinalAuthThrow,
    requestHandler.finalAuthorize,
    attachedDataContext
  );

  const finalAuthorizePassed = authorizationPassed(
    finalAuthorizeResult as object | boolean
  );

  if (!finalAuthorizePassed) {
    throw forbiddenPreAuthThrow;
  }

  const finalAuthorizeContextOut =
    finalAuthorizeResult === true ? {} : (finalAuthorizeResult as object);

  const finalAuthContext = {
    ...attachedDataContext,
    ...finalAuthorizeContextOut,
  };

  try {
    // to keep executeHipthrustable from being too opinionated, it's doWork's responsibility to handle and throw client errors.
    // Any un-boom'ed errors here should be interpreted as server errors
    const doWorkContextOnly =
      (await Promise.resolve(requestHandler.doWork(finalAuthContext))) || {};

    const doWorkContext = { ...finalAuthContext, ...doWorkContextOnly };

    const { unsafeResponse, status } = requestHandler.respond(doWorkContext);
    const safeResponse = requestHandler.sanitizeResponse(unsafeResponse);
    const responseAndStatus = { response: safeResponse, status: status || 200 };
    return responseAndStatus;
  } catch (exception) {
    if (exception instanceof HipRedirectException || Boom.isBoom(exception)) {
      // Don't transform redirect exceptions or intentionally constructed boom errors
      throw exception;
    } else {
      // All other uncaught exceptions transform to generic 500s here
      throw Boom.badImplementation('Uncaught exception');
    }
  }
}

export function assertHipthrustable(
  requestHandler: HasAllRequireds & Record<string, any>
) {
  const requiredMethods = [
    'preAuthorize',
    'finalAuthorize',
    'respond',
    'sanitizeResponse',
  ];
  requiredMethods.forEach(method => {
    if (
      !requestHandler[method] ||
      typeof requestHandler[method] !== 'function'
    ) {
      throw new Error(
        `Missing instance method "${method}" on supposedly hipthrustable class`
      );
    }
  });
}
