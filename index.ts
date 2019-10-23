import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction as ExpressNextFunction,
} from 'express';
import Boom from '@hapi/boom';

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

class HipRedirectException {
  constructor(readonly redirectUrl: string, readonly redirectCode = 302) {}
}

async function executeHipthrustable(requestHandler: AnyHipThrustable) {
  try {
    if(requestHandler.preAuthorize() !== true) {
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
    if((await requestHandler.finalAuthorize()) !== true) {
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
  for(const methodIdx in requiredMethods) {
    const method = requiredMethods[methodIdx];
    if(!RequestHandler.prototype[method] || (typeof RequestHandler.prototype[method]) !== 'function') {
      throw new Error(`Missing instance method "${method}" on supposedly hipthrustable class`);
    }
  }
}


// express-specific!
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

function hipExpressHandlerFactory<
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

// @fixme: delete me :)
/*
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
*/

interface SyncProjector<TNext, TSource> {
  (source: TSource): TNext;
}
type AnySyncProjector = SyncProjector<any, any>;

interface AsyncProjector<TNext, TSource> {
  (source: TSource): Promise<TNext>;
}
type AnyAsyncProjector = AsyncProjector<any, any>;

interface HasDataAttacher {
  attachData(): Promise<any>;
}

interface OptionallyHasDataAttacher {
  attachData?(): Promise<any>;
}

interface IsFinalAuth<TPrincipal> {
  (principal: TPrincipal): Promise<boolean>;
}

interface OptionallyHasFinalAuth {
  finalAuthorize?(): Promise<boolean>;
}

interface IsPreAuth<TPrincipal> {
  (principal: TPrincipal): boolean;
}

interface OptionallyHasPreAuth {
  preAuthorize?(): boolean;
}

/*
// @tswtf: why did I need to explicitly add "| any" to TSuper' instance type?
export function AttachDataWith<TWhereToStore extends string, TWhereToLook extends string & keyof InstanceType<TSuper>, TWhatYoullFind, TSuper extends Constructor<Record<TWhereToLook,TWhatYoullFind> & (OptionallyHasDataAttacher)>, TNext>(Super: TSuper, whereToLook: TWhereToLook, projector: AsyncProjector<TNext, TWhatYoullFind>, whereToStore: TWhereToStore): TSuper & Constructor<{[k in TWhereToStore]: TNext} & HasDataAttacher>;
export function AttachDataWith<TWhereToStore extends string, TWhereToLook extends string & keyof InstanceType<TSuper>, TWhatYoullFind, TSuper extends Constructor<Record<TWhereToLook,TWhatYoullFind> & (OptionallyHasDataAttacher)>, TNext>(Super: TSuper, whereToLook: TWhereToLook, projector: AsyncProjector<TNext, TWhatYoullFind>, whereToStore: TWhereToStore) {
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
      (<any>this)[whereToStore] = await projector((<any>this)[whereToLook]);
    }
  };
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

export function PreAuthorizeWith<TPrincipalKey extends string & keyof InstanceType<TSuper>, TPrincipal extends InstanceType<TSuper>[TPrincipalKey], TAuthKey extends string, TSuper extends Constructor<Record<TAuthKey,IsFinalAuth<TPrincipal>> & (OptionallyHasPreAuth)>>(Super: TSuper, principalKey: TPrincipalKey, authorizer: IsPreAuth<TPrincipal>) {
  // @ts-ignore
  return class WithFinalAuthorize extends Super {
    // do-not-at-ts-ignore
    //[whereToStore]: TNext;
    constructor(...args: any[]) {
      super(...args);
    }
    async preAuthorize() {
      // @todo: MAKE SURE THIS WORKS PROPERLY IF THERE'S GAPS IN THE PROTOTYPE CHAIN
      // i.e. chain doesn't break or double-call!!
      if(super.preAuthorize) {
        if(!super.preAuthorize()) {
          return false;
        }
      }
      return authorizer((<any>this)[principalKey]);
    }
  };
}
*/

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

interface HasValidateSync {
  validateSync(paths?: any, options?: any): {errors: any[]}
}
interface HasToObject<T> {
  toObject(options?: any): T
}

/*
function SanitizeParamsWith<TSuper extends Constructor, TSafeParam extends ReturnType<TInstance['toObject']>, TModel extends Constructor<HasValidateSync & HasToObject<any>>, TInstance extends InstanceType<TModel>>(Super: TSuper, Model: TModel) {
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

function SanitizeBodyWith<TSuper extends Constructor, TSafeBody extends ReturnType<TInstance['toObject']>, TModel extends Constructor<HasValidateSync & HasToObject<any>>, TInstance extends InstanceType<TModel>>(Super: TSuper, Model: TModel) {
  return class WithSanitizedBody extends Super {
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

function SanitizeResponseWith<TSuper extends Constructor, TSafeResponse extends ReturnType<TInstance['toObject']>, TModel extends Constructor<HasToObject<any>>, TInstance extends InstanceType<TModel>>(Super: TSuper, Model: TModel) {
  return class WithSanitizedResponse extends Super {
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
*/

interface ModelWithFindById<TInstance = any> {
  findById(id: string): {exec(): Promise<TInstance>}
}

function findByIdAndRequire(Model: ModelWithFindById) {
  return async function(id: string) {
    // prevent accidental searching for all from previous stages
    // (e.g. if someone forgot to make id param required in schema so
    // validation passes when it shouldn't - this example is b/c
    // mongoose won't initialize with invalid ObjectIds passed to it.
    if(!id || !(id.toString())) {
      // @fixme: use something else...
      throw Boom.notFound('Resource not found');
    }
    const result = await Model.findById(id).exec();
    if(!result) {
      throw Boom.notFound('Resource not found');
    }
    return result;
  }
}

/*
// @todo: make helpers for:
// - generating a principal ID accessor (configure your user model's ID)
// - generating an assigned ID accessor (configure your other model's owner/assigned/etc ID)
// - helper using the two to generate an instance method that can be attached to a model (e.g. generate isOwner())
interface ResolvesPrincipalId<Tprincipal> {
  (principal: Tprincipal): string;
}
interface ResolvesAssignedId<Tdoc> {
  (principal: Tdoc): string;
}
*/

function assigneeCheckersOnIdKey<TPrincipalIdKey extends string>(principalIdKey: TPrincipalIdKey) {
  return {
    idOnKeyIs<TIdKey extends string>(idKey: TIdKey) {
      return function<TPrincipal extends Record<TPrincipalIdKey, string>>(this:Record<TIdKey, string>, principal: TPrincipal) {
        return (
          principal &&
          this &&
          principal[principalIdKey] &&
          this[idKey] &&
          principal[principalIdKey].toString()==this[idKey].toString()
        );
      }
    }
  }
}

function roleCheckersOnRoleKey<TRoleKey extends string>(roleKey: TRoleKey) {
  return {
    roleIsOneOf(roles: string[]) {
      return function checker(principal: Record<TRoleKey, string>) {
        return roles && roles.length && principal && principal[roleKey] && roles.includes(principal[roleKey]);
      }
    },
    oneOfRolesIsOneOf(roles: string[]) {
      return function checker(principal: Record<TRoleKey, string[]>) {
        if(roles && roles.length && principal && principal[roleKey] && principal[roleKey].length) {
          for(let roleIdx in roles) {
            if(principal[roleKey].includes(roles[roleIdx])) {
              return true;
            }
          }
        }
        return false;
      }
    }
  };
}

function AddInitData<TWhereToLook extends string, TProjector extends AnySyncProjector, TNext extends ReturnType<TProjector>, TWhatYoullFind extends Parameters<TProjector>[0], TWhereToStore extends string>(whereToLook: TWhereToLook, projector: TProjector, whereToStore: TWhereToStore) {
  return function<TSuper extends Constructor>(Super: TSuper): TSuper & Constructor<Record<TWhereToStore, TNext>> {
    // @ts-ignore
    return class WithInitData extends Super {
      // do-not-at-ts-ignore
      //[whereToStore]: TNext;
      constructor(...args: any[]) {
        super(...args);
        const req = args[0];
        (<any>this)[whereToStore] = projector(req[whereToLook]);
      }
    };
  };
}

//export function PreAuthorizeWith<TPrincipalKey extends string & keyof InstanceType<TSuper>, TPrincipal extends InstanceType<TSuper>[TPrincipalKey], TAuthKey extends string, TSuper extends Constructor<Record<TAuthKey,IsFinalAuth<TPrincipal>> & (OptionallyHasPreAuth)>>(Super: TSuper, principalKey: TPrincipalKey, authorizer: IsPreAuth<TPrincipal>) {
export function AddPreAuth<TPrincipalKey extends string, TPrincipal>(principalKey: TPrincipalKey, authorizer: IsPreAuth<TPrincipal>) {
  return function<TSuper extends Constructor<Record<TPrincipalKey,TPrincipal> & (OptionallyHasPreAuth)>>(Super: TSuper) {
    // @ts-ignore
    return class WithPreAuthorize extends Super {
      // do-not-at-ts-ignore
      //[whereToStore]: TNext;
      constructor(...args: any[]) {
        super(...args);
      }
      preAuthorize() {
        // @todo: MAKE SURE THIS WORKS PROPERLY IF THERE'S GAPS IN THE PROTOTYPE CHAIN
        // i.e. chain doesn't break or double-call!!
        if(super.preAuthorize) {
          if(!super.preAuthorize()) {
            return false;
          }
        }
        return authorizer((<any>this)[principalKey]);
      }
    };
  };
}

type PromiseResolveType<T> = T extends Promise<infer T> ? T : never;

function AddAttachData<TWhereToLook extends string, TProjector extends AnyAsyncProjector, TNext extends PromiseResolveType<ReturnType<TProjector>>, TWhatYoullFind extends Parameters<TProjector>[0], TWhereToStore extends string>(whereToLook: TWhereToLook, projector: TProjector, whereToStore: TWhereToStore) {
  return function<TSuper extends Constructor<Record<TWhereToLook,TWhatYoullFind> & (OptionallyHasDataAttacher)>>(Super: TSuper): TSuper & Constructor<Record<TWhereToStore, TNext> & HasDataAttacher> {
    // @ts-ignore
    return class WithAttachData extends Super {
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
        (<any>this)[whereToStore] = await projector((<any>this)[whereToLook]);
      }
    };
  };
}

export function AddFinalAuth<TPrincipalKey extends string, TAuthKey extends string>(principalKey: TPrincipalKey, authorizerKey: TAuthKey) {
  return function<TSuper extends Constructor<Record<TPrincipalKey,any> & Record<TAuthKey,IsFinalAuth<InstanceType<TSuper>[TPrincipalKey]>> & (OptionallyHasFinalAuth)>>(Super: TSuper) {
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
  };
}

export function AddInitDataTo<TWhereToStore extends string, TWhereToLook extends string, TWhatYoullFind, TSuper extends Constructor, TNext>(Super: TSuper, whereToLook: TWhereToLook, projector: AnySyncProjector, whereToStore: TWhereToStore) {
  return AddInitData(whereToLook, projector, whereToStore)(Super);
}

export function AddPreAuthTo<TPrincipalKey extends string & keyof InstanceType<TSuper>, TPrincipal extends InstanceType<TSuper>[TPrincipalKey], TAuthKey extends string, TSuper extends Constructor<Record<TPrincipalKey,any> & Record<TAuthKey,IsFinalAuth<TPrincipal>> & (OptionallyHasPreAuth)>>(Super: TSuper, principalKey: TPrincipalKey, authorizer: IsPreAuth<TPrincipal>) {
  return AddPreAuth(principalKey, authorizer)(Super);
}

export function AddAttachDataTo<TWhereToStore extends string, TWhereToLook extends string & keyof InstanceType<TSuper>, TWhatYoullFind, TSuper extends Constructor<Record<TWhereToLook,TWhatYoullFind> & (OptionallyHasDataAttacher)>, TNext>(Super: TSuper, whereToLook: TWhereToLook, projector: AsyncProjector<TNext, TWhatYoullFind>, whereToStore: TWhereToStore): TSuper & Constructor<{[k in TWhereToStore]: TNext} & HasDataAttacher>;
export function AddAttachDataTo<TWhereToStore extends string, TWhereToLook extends string & keyof InstanceType<TSuper>, TWhatYoullFind, TSuper extends Constructor<Record<TWhereToLook,TWhatYoullFind> & (OptionallyHasDataAttacher)>, TNext>(Super: TSuper, whereToLook: TWhereToLook, projector: AsyncProjector<TNext, TWhatYoullFind>, whereToStore: TWhereToStore) {
  return AddAttachData(whereToLook,projector,whereToStore)(Super);
}

function AddFinalAuthTo<TPrincipalKey extends string & keyof InstanceType<TSuper>, TPrincipal extends InstanceType<TSuper>[TPrincipalKey], TAuthKey extends string, TSuper extends Constructor<Record<TPrincipalKey,any> & Record<TAuthKey,IsFinalAuth<TPrincipal>> & (OptionallyHasFinalAuth)>>(Super: TSuper, principalKey: TPrincipalKey, authorizerKey: TAuthKey) {
  return AddFinalAuth(principalKey, authorizerKey)(Super);
}

function stripIdTransform(doc: any, ret: {_id: any}, options: any) {
  delete ret._id;
  return ret;
}

// @note for docs: NEVER use _id - mongoose gives it special treatment
// also, ALWAYS rememver to make required fields required cause mongoose will STRIP invalid fields first!
// figure out how to make that security gotcha harder to happen
function AddSanitizeParams<TSafeParam extends ReturnType<TInstance['toObject']>, TModel extends Constructor<HasValidateSync & HasToObject<any>>, TInstance extends InstanceType<TModel>>(Model: TModel) {
  return function<TSuper extends Constructor>(Super: TSuper) {
    return class WithSanitizedParams extends Super {
      constructor(...args: any[]) {
        super(...args);
      }
      sanitizeParams(unsafeParams: any) {
        const doc = new Model(unsafeParams);
        const validateErrors = doc.validateSync();
        if(validateErrors !== undefined) {
          throw Boom.badRequest('Params not valid');
        }
        //@tswtf: why do I need to force this?!
        return <TSafeParam>doc.toObject({transform: stripIdTransform});
      }
    };
  };
}

// @note: sanitize body validates modified only!  This is cause you usually will only send fields to update.
function AddSanitizeBody<TSafeBody extends ReturnType<TInstance['toObject']>, TModel extends Constructor<HasValidateSync & HasToObject<any>>, TInstance extends InstanceType<TModel>>(Model: TModel) {
  return function<TSuper extends Constructor>(Super: TSuper) {
    return class WithSanitizedBody extends Super {
      constructor(...args: any[]) {
        super(...args);
      }
      sanitizeBody(unsafeBody: any) {
        const doc = new Model(unsafeBody);
        const validateErrors = doc.validateSync(undefined, {validateModifiedOnly: true});
        if(validateErrors !== undefined) {
          throw Boom.badRequest('Body not valid');
        }
        //@tswtf: why do I need to force this?!
        return <TSafeBody>doc.toObject({transform: stripIdTransform});
      }
    }
  }
}

function AddSanitizeResponse<TSafeResponse extends ReturnType<TInstance['toObject']>, TModel extends Constructor<HasToObject<any>>, TInstance extends InstanceType<TModel>>(Model: TModel) {
  return function<TSuper extends Constructor>(Super: TSuper) {
    return class WithSanitizedResponse extends Super {
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
}

function AddSanitizeParamsTo<TSuper extends Constructor, TSafeParam extends ReturnType<TInstance['toObject']>, TModel extends Constructor<HasValidateSync & HasToObject<any>>, TInstance extends InstanceType<TModel>>(Super: TSuper, Model: TModel) {
  AddSanitizeParams(Model)(Super);
}

function AddSanitizeBodyTo<TSuper extends Constructor, TSafeBody extends ReturnType<TInstance['toObject']>, TModel extends Constructor<HasValidateSync & HasToObject<any>>, TInstance extends InstanceType<TModel>>(Super: TSuper, Model: TModel) {
  AddSanitizeBody(Model)(Super);
}
function AddSanitizeResponseTo<TSuper extends Constructor, TSafeResponse extends ReturnType<TInstance['toObject']>, TModel extends Constructor<HasToObject<any>>, TInstance extends InstanceType<TModel>>(Super: TSuper, Model: TModel) {
  AddSanitizeResponse(Model)(Super);
}

interface ClassExtender<TClassIn, TClassOut> {
  (ClassIn: TClassIn): TClassOut;
}

function composeExtenders<ClassIn>(): ClassExtender<ClassIn, ClassIn>;
function composeExtenders<ClassIn, A>(fn1: ClassExtender<ClassIn, A>): ClassExtender<ClassIn, A>;
function composeExtenders<ClassIn, A, B>(fn1: ClassExtender<ClassIn, A>, fn2: ClassExtender<A, B>): ClassExtender<ClassIn, B>;
function composeExtenders<ClassIn, A, B, C>(fn1: ClassExtender<ClassIn, A>, fn2: ClassExtender<A, B>, fn3: ClassExtender<B, C>): ClassExtender<ClassIn, C>;
function composeExtenders<ClassIn, A, B, C, D>(fn1: ClassExtender<ClassIn, A>, fn2: ClassExtender<A, B>, fn3: ClassExtender<B, C>, fn4: ClassExtender<C, D>): ClassExtender<ClassIn, D>;
function composeExtenders<ClassIn, A, B, C, D, E>(fn1: ClassExtender<ClassIn, A>, fn2: ClassExtender<A, B>, fn3: ClassExtender<B, C>, fn4: ClassExtender<C, D>, fn5: ClassExtender<D, E>): ClassExtender<ClassIn, E>;
function composeExtenders<ClassIn, A, B, C, D, E, F>(fn1: ClassExtender<ClassIn, A>, fn2: ClassExtender<A, B>, fn3: ClassExtender<B, C>, fn4: ClassExtender<C, D>, fn5: ClassExtender<D, E>, fn6: ClassExtender<E, F>): ClassExtender<ClassIn, F>;
function composeExtenders<ClassIn, A, B, C, D, E, F, G>(fn1: ClassExtender<ClassIn, A>, fn2: ClassExtender<A, B>, fn3: ClassExtender<B, C>, fn4: ClassExtender<C, D>, fn5: ClassExtender<D, E>, fn6: ClassExtender<E, F>, fn7: ClassExtender<F, G>): ClassExtender<ClassIn, G>;
function composeExtenders<ClassIn, A, B, C, D, E, F, G, H>(fn1: ClassExtender<ClassIn, A>, fn2: ClassExtender<A, B>, fn3: ClassExtender<B, C>, fn4: ClassExtender<C, D>, fn5: ClassExtender<D, E>, fn6: ClassExtender<E, F>, fn7: ClassExtender<F, G>, fn8: ClassExtender<G, H>): ClassExtender<ClassIn, H>;
function composeExtenders<ClassIn, A, B, C, D, E, F, G, H, I>(fn1: ClassExtender<ClassIn, A>, fn2: ClassExtender<A, B>, fn3: ClassExtender<B, C>, fn4: ClassExtender<C, D>, fn5: ClassExtender<D, E>, fn6: ClassExtender<E, F>, fn7: ClassExtender<F, G>, fn8: ClassExtender<G, H>, fn9: ClassExtender<H, I>): ClassExtender<ClassIn, I>;
function composeExtenders<ClassIn, A, B, C, D, E, F, G, H, I>(fn1: ClassExtender<ClassIn, A>, fn2: ClassExtender<A, B>, fn3: ClassExtender<B, C>, fn4: ClassExtender<C, D>, fn5: ClassExtender<D, E>, fn6: ClassExtender<E, F>, fn7: ClassExtender<F, G>, fn8: ClassExtender<G, H>, fn9: ClassExtender<H, I>, ...fns: Array<ClassExtender<any,any>>): ClassExtender<ClassIn, {}>;

function composeExtenders(...fns: Array<ClassExtender<any, any>>) {
  if(!fns) {
    return (inClass: any) => inClass;
  }
  if(fns.length===1) {
    return fns[0];
  }
  return function composed<TSuper>(Super: TSuper) {
    return fns.reduce((prev, fn)=>fn(prev), Super);
  }
}

export const htCore = {
  HipRedirectException,
}

export const htDeclarative = {
  AddInitData,
  AddPreAuth,
  AddAttachData,
  AddFinalAuth,
  AddInitDataTo,
  AddPreAuthTo,
  AddAttachDataTo,
  AddFinalAuthTo,
  composeExtenders,
}

export const htExpress = {
  hipHandlerFactory: hipExpressHandlerFactory,
}

export const htMongoose = {
  findByIdAndRequire,
  AddSanitizeParams,
  AddSanitizeBody,
  AddSanitizeResponse,
  AddSanitizeParamsTo,
  AddSanitizeBodyTo,
  AddSanitizeResponseTo,
}

export const htUsers = {
   roleCheckersOnRoleKey,
   assigneeCheckersOnIdKey,
}
