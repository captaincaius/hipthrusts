import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction as ExpressNextFunction,
} from 'express';
import Boom from 'boom';

type Constructor<T = {}> = new (...args: any[]) => T;

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
  doWork(): Promise<HipWorkResponse<TResBodyUnsafeReturn>>;
  sanitizeResponse(unsafeResponse: TResBodyUnsafeInput): any;
}

export type AnyHipThrustable = HipThrustable<any, any, any, any>;

interface HipWorkResponse<ResponseShape> {
  unsafeResponse: ResponseShape,
  status?: number;
}

export class HipRedirectException {
  constructor(readonly redirectUrl: string, readonly redirectCode = 302) {}
}

async function executeHipthrustable(requestHandler: AnyHipThrustable) {
  try {
    if(!requestHandler.preAuthorize()) {
      throw Boom.forbidden('General pre-authorization lacking for this resource');
    }
  }
  catch(exception) {
    if(exception instanceof HipRedirectException || Boom.isBoom(exception)) {
      // Don't transform redirect exceptions or intentionally constructed boom errors
      throw exception;
    }
    else {
      // All other uncaught exceptions transform to generic 403s here
      throw Boom.forbidden('General pre-authorization lacking for this resource');
    }
  }
  if(requestHandler.attachData) {
    try {
      await requestHandler.attachData();
    }
    catch(exception) {
      if(exception instanceof HipRedirectException || Boom.isBoom(exception)) {
        // Don't transform redirect exceptions or intentionally constructed boom errors
        throw exception;
      }
      else {
        // All other uncaught exceptions transform to generic 404s here
        throw Boom.notFound('Resource not found');
      }
    }
  }
  try {
    if(!(await requestHandler.finalAuthorize())) {
      throw Boom.forbidden('General authorization lacking for this resource');
    }
  }
  catch(exception) {
    if(exception instanceof HipRedirectException || Boom.isBoom(exception)) {
      // Don't transform redirect exceptions or intentionally constructed boom errors
      throw exception;
    }
    else {
      // All other uncaught exceptions transform to generic 403s here
      throw Boom.forbidden('General authorization lacking for this resource');
    }
  }
  try {
    const { unsafeResponse, status } = await requestHandler.doWork();
    const safeResponse = requestHandler.sanitizeResponse(unsafeResponse);
    const responseAndStatus = { response: safeResponse, status: status || 200 };
    return responseAndStatus;
  }
  catch(exception) {
    if(exception instanceof HipRedirectException || Boom.isBoom(exception)) {
      // Don't transform redirect exceptions or intentionally constructed boom errors
      throw exception;
    }
    else {
      // All other uncaught exceptions transform to generic 500s here
      throw Boom.badImplementation('Uncaught exception');
    }
  }
}

async function assertHipthrustable(RequestHandler: Constructor<AnyHipThrustable>) {
  const requiredMethods = [
    'sanitizeParams',
    'sanitizeBody',
    'preAuthorize',
    'finalAuthorize',
    'doWork',
    'sanitizeResponse'
  ];
  for(const method in requiredMethods) {
    if(!RequestHandler.prototype[method] || (typeof RequestHandler.prototype[method]) !== 'function') {
      throw new Error(`Missing instance method "${method}" on supposedly hipthrustable class`);
    }
  }
}


// express-specific!
function toHandlerClass<
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
    unsafeReq: TReq;
    unsafeRes: Express.Response;
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

export function hipHandlerFactory<
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
  const RequestHandler = toHandlerClass(HandlingStrategy);
  return async function(
    req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNextFunction
  ) {
    try {
      const requestHandler = new RequestHandler(req, res);
      const { response, status } = await executeHipthrustable(requestHandler);
      res.status(status).json(response);
    } catch (exception) {
      if (exception instanceof HipRedirectException) {
        res.redirect(exception.redirectCode, exception.redirectUrl);
      }
      else {
        next(exception);
      }
    }
  };
}

// @todo: parameter order?
export function withUserFromReq<
  TSuper extends Constructor,
  TUser extends Constructor
>(Super: TSuper, User: TUser, whereToLook: string = 'user') {
  class WithUser extends Super {
    user_user: InstanceType<TUser>;
    constructor(...args: any[]) {
      super(...args);
      const req = args[0];
      this.user_user = req[whereToLook];
    }
  }
  return WithUser;
}

interface RelativeGetter<TNext, TSource> {
  (source: TSource): Promise<TNext>;
}

interface HasDataAttacher {
  attachData(): Promise<any>;
}

interface OptionallyHasDataAttacher {
  attachData?(): Promise<any>;
}

// @tswtf: why did I need to explicitly add "| any" to TSuper' instance type?
export function AttachDataWith<TWhereToStore extends string, TWhereToLook extends string & keyof InstanceType<TSuper>, TWhatYoullFind, TSuper extends Constructor<Record<TWhereToLook,TWhatYoullFind> & (OptionallyHasDataAttacher)>, TNext>(Super: TSuper, whereToLook: TWhereToLook, getter: RelativeGetter<TNext, TWhatYoullFind>, whereToStore: TWhereToStore): TSuper & Constructor<{[k in TWhereToStore]: TNext} & HasDataAttacher>;
export function AttachDataWith<TWhereToStore extends string, TWhereToLook extends string & keyof InstanceType<TSuper>, TWhatYoullFind, TSuper extends Constructor<Record<TWhereToLook,TWhatYoullFind> & (OptionallyHasDataAttacher)>, TNext>(Super: TSuper, whereToLook: TWhereToLook, getter: RelativeGetter<TNext, TWhatYoullFind>, whereToStore: TWhereToStore) {
  // @ts-ignore
  return class WithRelative extends Super {
    // do-not-at-ts-ignore
    //[whereToStore]: TNext;
    constructor(...args: any[]) {
      super(...args);
    }
    async attachData() {
      // @todo: MAKE SURE THIS WORKS PROPERLY IF THERE'S GAPS IN THE PROTOTYPE CHAIN
      // i.e. chain doesn't break or double-call!!
      if(super.attachData) {
        await super.attachData();
      }
      (<any>this)[whereToStore] = await getter((<any>this)[whereToLook]);
    }
  };
}

interface IsFinalAuth<TPrincipal> {
  (principal: TPrincipal): Promise<boolean>;
}

interface OptionallyHasFinalAuth {
  finalAuthorize?(): Promise<boolean>;
}

export function FinalAuthorizeWith<TPrincipalKey extends string & keyof InstanceType<TSuper>, TPrincipal extends InstanceType<TSuper>[TPrincipalKey], TAuthKey extends string, TSuper extends Constructor<Record<TAuthKey,IsFinalAuth<TPrincipal>> & (OptionallyHasFinalAuth)>>(Super: TSuper, principalKey: TPrincipalKey, authorizerKey: TAuthKey) {
  // @ts-ignore
  return class WithFinalAuthorize extends Super {
    // do-not-at-ts-ignore
    //[whereToStore]: TNext;
    constructor(...args: any[]) {
      super(...args);
    }
    async finalAuthorize() {
      // @todo: MAKE SURE THIS WORKS PROPERLY IF THERE'S GAPS IN THE PROTOTYPE CHAIN
      // i.e. chain doesn't break or double-call!!
      if(super.finalAuthorize) {
        if(!await super.finalAuthorize()) {
          return false;
        }
      }
      return await (<any>this)[authorizerKey]((<any>this)[principalKey]);
    }
  };
}

interface HasValidateSync {
  validateSync(): {errors: any[]}
}
interface HasToObject<T> {
  toObject(): T
}

export function SanitizeParamsWith<TSuper extends Constructor, TSafeParam extends ReturnType<TInstance['toObject']>, TModel extends Constructor<HasValidateSync & HasToObject<any>>, TInstance extends InstanceType<TModel>>(Super: TSuper, Model: TModel) {
  return class WithSanitizedParams extends Super {
    constructor(...args: any[]) {
      super(...args);
    }
    sanitizeParams(unsafeParams: any) {
      const doc = new Model(unsafeParams);
      const validateErrors = doc.validateSync();
      if(validateErrors.errors && Array.isArray(validateErrors.errors) && validateErrors.errors.length) {
        throw Boom.badRequest('Params not valid');
      }
      //@tswtf: why do I need to force this?!
      return <TSafeParam>doc.toObject();
    }
  }
}

export function SanitizeBodyWith<TSuper extends Constructor, TSafeBody extends ReturnType<TInstance['toObject']>, TModel extends Constructor<HasValidateSync & HasToObject<any>>, TInstance extends InstanceType<TModel>>(Super: TSuper, Model: TModel) {
  return class WithSanitizedParams extends Super {
    constructor(...args: any[]) {
      super(...args);
    }
    sanitizeBody(unsafeBody: any) {
      const doc = new Model(unsafeBody);
      const validateErrors = doc.validateSync();
      if(validateErrors.errors && Array.isArray(validateErrors.errors) && validateErrors.errors.length) {
        throw Boom.badRequest('Body not valid');
      }
      //@tswtf: why do I need to force this?!
      return <TSafeBody>doc.toObject();
    }
  }
}

export function SanitizeResponseWith<TSuper extends Constructor, TSafeResponse extends ReturnType<TInstance['toObject']>, TModel extends Constructor<HasToObject<any>>, TInstance extends InstanceType<TModel>>(Super: TSuper, Model: TModel) {
  return class WithSanitizedParams extends Super {
    constructor(...args: any[]) {
      super(...args);
    }
    sanitizeResponse(unsafeResponse: any) {
      const doc = new Model(unsafeResponse);
      //@tswtf: why do I need to force this?!
      return <TSafeResponse>doc.toObject();
    }
  }
}

interface FunctionTaking<TIn> {
  (param: TIn): any;
}

type HasTypedFunctionOn<T, K extends string> = Record<K, FunctionTaking<T>>;

export function fromWrappedInstanceMethod<TIn, TOut extends ReturnType<TInstance[TMethodName]>, TInstance extends HasTypedFunctionOn<TIn, TMethodName>, TMethodName extends string>(instanceMethodName: TMethodName) {
  return function(instance: TInstance) {
    return Promise.resolve(function(arg: TIn): Promise<TOut> {
      return Promise.resolve(<TOut>instance[instanceMethodName](arg));
    });
  }
}

interface ModelWithFindById<TInstance = any> {
  findById(id: string): {exec(): Promise<TInstance>}
}

export function findByIdAndRequire(Model: ModelWithFindById) {
  return function(id: string) {
    return Model.findById(id).exec()
      .then(result=> {
        if(!result) {
          throw Boom.notFound('Resource not found');
        }
        return result;
      });
  }
}

// @todo: make helpers for:
// - generating a principal ID accessor (configure your user model's ID)
// - generating an assigned ID accessor (configure your other model's owner/assigned/etc ID)
// - helper using the two to generate an instance method that can be attached to a model (e.g. generate isOwner())
export interface ResolvesPrincipalId<Tprincipal> {
  (principal: Tprincipal): string;
}
export interface ResolvesAssignedId<Tdoc> {
  (principal: Tdoc): string;
}