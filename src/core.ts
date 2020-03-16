import Boom from '@hapi/boom';
import { Constructor } from './types';

export interface HipThrustable<
  TParamsSafe,
  TBodySafe,
  TResBodyUnsafeReturn extends TResBodyUnsafeInput,
  TResBodyUnsafeInput
> {
  params: TParamsSafe;
  body: TBodySafe;
  // doesn't need composition
  sanitizeParams(unsafeParams: any): TParamsSafe;
  // doesn't need composition
  sanitizeBody(unsafeBody: any): TBodySafe;
  preAuthorize(): boolean;
  attachData?(): Promise<void>;
  finalAuthorize(): Promise<boolean>;
  doWork?(): Promise<void>;
  response(): HipWorkResponse<TResBodyUnsafeReturn>;
  sanitizeResponse(unsafeResponse: TResBodyUnsafeInput): any;
}

export type AnyHipThrustable = HipThrustable<any, any, any, any>;

interface HipWorkResponse<ResponseShape> {
  unsafeResponse: ResponseShape;
  status?: number;
}

export class HipRedirectException {
  constructor(
    public readonly redirectUrl: string,
    public readonly redirectCode = 302
  ) {}
}

export async function executeHipthrustable(requestHandler: AnyHipThrustable) {
  try {
    if (requestHandler.preAuthorize() !== true) {
      throw Boom.forbidden(
        'General pre-authorization lacking for this resource'
      );
    }
  } catch (exception) {
    if (exception instanceof HipRedirectException || Boom.isBoom(exception)) {
      // Don't transform redirect exceptions or intentionally constructed boom errors
      throw exception;
    } else {
      // All other uncaught exceptions transform to generic 403s here
      throw Boom.forbidden(
        'General pre-authorization lacking for this resource'
      );
    }
  }
  if (requestHandler.attachData) {
    try {
      await requestHandler.attachData();
    } catch (exception) {
      if (exception instanceof HipRedirectException || Boom.isBoom(exception)) {
        // Don't transform redirect exceptions or intentionally constructed boom errors
        throw exception;
      } else {
        // All other uncaught exceptions transform to generic 404s here
        throw Boom.notFound('Resource not found');
      }
    }
  }
  try {
    if ((await requestHandler.finalAuthorize()) !== true) {
      throw Boom.forbidden('General authorization lacking for this resource');
    }
  } catch (exception) {
    if (exception instanceof HipRedirectException || Boom.isBoom(exception)) {
      // Don't transform redirect exceptions or intentionally constructed boom errors
      throw exception;
    } else {
      // All other uncaught exceptions transform to generic 403s here
      throw Boom.forbidden('General authorization lacking for this resource');
    }
  }
  try {
    if (requestHandler.doWork) {
      // to keep executeHipthrustable from being too opinionated, it's doWork's responsibility to handle and throw client errors.
      // Any un-boom'ed errors here should be interpreted as server errors
      await requestHandler.doWork();
    }
    const { unsafeResponse, status } = requestHandler.response();
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
  RequestHandler: Constructor<AnyHipThrustable>
) {
  const requiredMethods = [
    'sanitizeParams',
    'sanitizeBody',
    'preAuthorize',
    'finalAuthorize',
    'response',
    'sanitizeResponse',
  ];
  requiredMethods.forEach(method => {
    if (
      !RequestHandler.prototype[method] ||
      typeof RequestHandler.prototype[method] !== 'function'
    ) {
      throw new Error(
        `Missing instance method "${method}" on supposedly hipthrustable class`
      );
    }
  });
}
