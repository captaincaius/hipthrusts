import Boom from '@hapi/boom';
import {
  HasAllRequireds,
  HasAttachData,
  HasAttachDataProperOptionals,
  HasBodyProperOptionals,
  HasDoWork,
  HasDoWorkProperOptionals,
  HasFinalAuthorizeProperOptionals,
  HasInitPreContext,
  HasInitPreContextProperOptionals,
  HasParamsProperOptionals,
  HasPreauthProperOptionals,
  HasRespondProperOptionals,
  HasSanitizeBody,
  HasSanitizeParams,
  HasUpToAttachDataProperOptionals,
  HasUpToDoWorkProperOptionals,
  HasUpToFinalAuthorizeProperOptionals,
  HasUpToRespondProperOptionals,
  OptionallyHasAttachData,
  OptionallyHasDoWork,
  OptionallyHasSanitizeBody,
  OptionallyHasSanitizeParams,
  PromiseOrSync,
  PromiseResolveOrSync,
} from './types';

// @todo: MINOR: consider bringing this back to life so complexity of optionality is removed from executeHipthrustable
export function withDefaultImplementations<
  TStrategy extends HasInitPreContext<any, any> &
    OptionallyHasSanitizeParams<any, any> &
    OptionallyHasSanitizeBody<any, any> &
    HasAllRequireds &
    OptionallyHasAttachData<any, any> &
    OptionallyHasDoWork<any, any>
>(
  strategy: TStrategy
): {
  initPreContext: TStrategy['initPreContext'];
  sanitizeParams: TStrategy extends HasSanitizeParams<any, any>
    ? TStrategy['sanitizeParams']
    : () => {};
  sanitizeBody: TStrategy extends HasSanitizeBody<any, any>
    ? TStrategy['sanitizeBody']
    : () => {};
  preAuthorize: TStrategy['preAuthorize'];
  attachData: TStrategy extends HasAttachData<any, any>
    ? TStrategy['attachData']
    : () => {};
  finalAuthorize: TStrategy['finalAuthorize'];
  doWork: TStrategy extends HasDoWork<any, any>
    ? TStrategy['doWork']
    : () => {};
  respond: TStrategy['respond'];
  sanitizeResponse: TStrategy['sanitizeResponse'];
} {
  // @tswtf why isn't typescript smart enough to not require these type assertions below?
  return {
    ...strategy,
    sanitizeParams: (strategy.sanitizeParams
      ? strategy.sanitizeParams
      : () => {
          return {};
        }) as TStrategy extends HasSanitizeParams<any, any>
      ? TStrategy['sanitizeParams']
      : () => {},
    sanitizeBody: (strategy.sanitizeBody ||
      (() => {
        return {};
      })) as TStrategy extends HasSanitizeBody<any, any>
      ? TStrategy['sanitizeBody']
      : () => {},
    attachData: (strategy.attachData ||
      (() => {
        return {};
      })) as TStrategy extends HasAttachData<any, any>
      ? TStrategy['attachData']
      : () => {},
    doWork: (strategy.doWork ||
      (() => {
        return {};
      })) as TStrategy extends HasDoWork<any, any>
      ? TStrategy['doWork']
      : () => {},
  };
}

export function isHasAttachData<TContextIn, TContextOut>(
  thing: OptionallyHasAttachData<TContextIn, TContextOut>
): thing is HasAttachData<TContextIn, TContextOut> {
  return !!(thing && thing.attachData);
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
  // @todo: MINOR: consider swapping these when withDefaultImplementations is fixed
  /*
  TConf extends
    HasSanitizeResponse<any,any>
    & HasInitPreContextProper<TConf>
    & HasParamsProper<TConf>
    & HasBodyProper<TConf>
    & HasPreauthProper<TConf>
    & HasUpToAttachDataProper<TConf>
    & HasAttachDataProper<TConf>
    & HasUpToFinalAuthorizeProper<TConf>
    & HasFinalAuthorizeProper<TConf>
    & HasUpToDoWorkProper<TConf>
    & HasDoWorkProper<TConf>
    & HasUpToRespondProper<TConf>
    & HasRespondProper<TConf>,
  */
  TConf extends HasAllRequireds &
    OptionallyHasSanitizeParams<any, any> &
    OptionallyHasSanitizeBody<any, any> &
    OptionallyHasAttachData<any, any> &
    OptionallyHasDoWork<any, any> &
    HasInitPreContext<any, any> &
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
    HasRespondProperOptionals<TConf>,
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
  // const safeInitialContext = requestHandler.initPreContext ? transformThrow(badDataThrow, requestHandler.initPreContext, unsafe) : {};
  const safeInitPreContext = transformThrowSync(
    badDataThrow,
    requestHandler.initPreContext,
    unsafe
  );
  // @todo: maybe params should throw something different like 400
  const safeParams = requestHandler.sanitizeParams
    ? transformThrowSync(
        badDataThrow,
        requestHandler.sanitizeParams,
        unsafeParams
      )
    : undefined;
  const safeBody = requestHandler.sanitizeBody
    ? transformThrowSync(badDataThrow, requestHandler.sanitizeBody, unsafeBody)
    : undefined;
  const inputsContext = {
    preContext: safeInitPreContext,
    params: safeParams,
    body: safeBody,
  };

  const forbiddenPreAuthThrow = Boom.forbidden(
    'General pre-authorization lacking for this resource'
  );
  // @todo: allow preAuthorize to return more context instead of "true" too.  Anything falsy will be interpreted as an error.  Don't forget || {} after call
  if (
    transformThrowSync(
      forbiddenPreAuthThrow,
      requestHandler.preAuthorize,
      inputsContext
    ) !== true
  ) {
    throw forbiddenPreAuthThrow;
  }
  const preAuthContext = inputsContext;

  const notFoundThrow = Boom.notFound('Resource not found');
  const attachedDataContextOnly = requestHandler.attachData
    ? (await transformThrowPossiblyAsync(
        notFoundThrow,
        requestHandler.attachData,
        preAuthContext
      )) || {}
    : {};
  const attachedDataContext = { ...preAuthContext, ...attachedDataContextOnly };

  const forbiddenFinalAuthThrow = Boom.forbidden(
    'General authorization lacking for this resource'
  );
  // @todo: allow finalAuthorize to return more context instead of "true" too.  Anything falsy will be interpreted as an error.  Don't forget || {} after call
  if (
    (await transformThrowPossiblyAsync(
      forbiddenFinalAuthThrow,
      requestHandler.finalAuthorize,
      attachedDataContext
    )) !== true
  ) {
    throw forbiddenPreAuthThrow;
  }
  const finalAuthContext = attachedDataContext;

  try {
    // @todo: allow doWork to return more context instead of "true" too.  Anything falsy will be interpreted as an error.  Don't forget || {} after call
    if (requestHandler.doWork) {
      await Promise.resolve(requestHandler.doWork(finalAuthContext));
    }
    const doWorkContext = finalAuthContext;

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

export async function assertHipthrustable(
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
