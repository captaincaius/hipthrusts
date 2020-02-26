import { Constructor } from './types';

type SyncProjector<TNext, TSource> = (source: TSource) => TNext;

type AnySyncProjector = SyncProjector<any, any>;

type AsyncProjector<TNext, TSource> = (source: TSource) => Promise<TNext>;

type AnyAsyncProjector = AsyncProjector<any, any>;

interface HasDataAttacher {
  attachData(): Promise<any>;
}

interface OptionallyHasDataAttacher {
  attachData?(): Promise<any>;
}

type IsFinalAuth<TPrincipal> = (principal: TPrincipal) => Promise<boolean>;

interface OptionallyHasFinalAuth {
  finalAuthorize?(): Promise<boolean>;
}

type IsPreAuth<TPrincipal> = (principal: TPrincipal) => boolean;

interface OptionallyHasPreAuth {
  preAuthorize?(): boolean;
}

type FunctionTaking<TIn> = (param: TIn) => any;

type HasTypedFunctionOn<T, K extends string> = Record<K, FunctionTaking<T>>;

export function fromWrappedInstanceMethod<
  TIn,
  TOut extends ReturnType<TInstance[TMethodName]>,
  TInstance extends HasTypedFunctionOn<TIn, TMethodName>,
  TMethodName extends string
>(instanceMethodName: TMethodName) {
  // tslint:disable-next-line:only-arrow-functions
  return function(instance: TInstance) {
    // tslint:disable-next-line:only-arrow-functions
    return Promise.resolve(function(arg: TIn): Promise<TOut> {
      return Promise.resolve(instance[instanceMethodName](arg) as TOut);
    });
  };
}

export function WithInit<
  TKnown,
  TSuperConstraint extends Constructor<TKnown>,
  TFrameworkKey extends string,
  TWhatYoullFind extends Parameters<TProjector>[0],
  TProjector extends AnySyncProjector,
  TNext extends ReturnType<TProjector>,
  TWhereToStore extends string
>(
  frameworkKey: TFrameworkKey,
  projector: TProjector,
  whereToStore: TWhereToStore
) {
  // tslint:disable-next-line:only-arrow-functions
  return function<TSuper extends TSuperConstraint>(
    Super: TSuper
  ): TSuper & Constructor<Record<TWhereToStore, TNext>> {
    // @ts-ignore
    return class WithInitData extends Super {
      // do-not-at-ts-ignore
      // [whereToStore]: TNext;
      constructor(...args: any[]) {
        super(...args);
        const req = args[0];
        (this as any)[whereToStore] = projector(req[frameworkKey]);
      }
    };
  };
}

export function WithPreAuth<
  TPrincipalKey extends string,
  TAuthorizer extends IsPreAuth<any>,
  TPrincipal extends Parameters<TAuthorizer>[0]
>(principalKey: TPrincipalKey, authorizer: TAuthorizer) {
  // tslint:disable-next-line:only-arrow-functions
  return function<
    TSuper extends Constructor<
      Record<TPrincipalKey, TPrincipal> & OptionallyHasPreAuth
    >
  >(Super: TSuper) {
    // @ts-ignore
    return class WithPreAuthorize extends Super {
      // do-not-at-ts-ignore
      // [whereToStore]: TNext;
      constructor(...args: any[]) {
        super(...args);
      }
      public preAuthorize() {
        // @todo: MAKE SURE THIS WORKS PROPERLY IF THERE'S GAPS IN THE PROTOTYPE CHAIN
        // i.e. chain doesn't break or double-call!!
        if (super.preAuthorize) {
          if (super.preAuthorize() !== true) {
            return false;
          }
        }
        return authorizer((this as any)[principalKey]);
      }
    };
  };
}

type PromiseResolveType<T> = T extends Promise<infer R> ? R : never;

export function WithAttached<
  TKnown,
  TSuperConstraint extends Constructor<
    Record<TWhereToLook, TWhatYoullFind> & TKnown
  >,
  TWhereToLook extends string,
  TWhatYoullFind extends Parameters<TProjector>[0],
  TProjector extends AsyncProjector<
    any,
    TWhereToLook extends keyof TKnown ? TKnown[TWhereToLook] : any
  >,
  TNext extends PromiseResolveType<ReturnType<TProjector>>,
  TWhereToStore extends string
>(
  whereToLook: TWhereToLook,
  projector: TProjector,
  whereToStore: TWhereToStore
) {
  // tslint:disable-next-line:only-arrow-functions
  return function<TSuper extends TSuperConstraint>(
    Super: TSuper
  ): TSuper & Constructor<Record<TWhereToStore, TNext> & HasDataAttacher> {
    // @ts-ignore
    return class WithAttachData extends Super {
      // do-not-at-ts-ignore
      // [whereToStore]: TNext;
      constructor(...args: any[]) {
        super(...args);
      }
      public async attachData() {
        // @todo: MAKE SURE THIS WORKS PROPERLY IF THERE'S GAPS IN THE PROTOTYPE CHAIN
        // i.e. chain doesn't break or double-call!!
        if (super.attachData) {
          await super.attachData();
        }
        (this as any)[whereToStore] = await projector(
          (this as any)[whereToLook]
        );
      }
    };
  };
}

export function WithResponse<
  TKnown,
  TSuperConstraint extends Constructor<
    Record<TWhereToLook, TWhatYoullFind> & TKnown
  >,
  TWhereToLook extends string,
  TWhatYoullFind,
  TWhereToStore extends string
>(whereToLook: TWhereToLook) {
  // tslint:disable-next-line:only-arrow-functions
  return function<TSuper extends TSuperConstraint>(
    Super: TSuper
  ): TSuper &
    Constructor<Record<TWhereToStore, TWhatYoullFind> & HasDataAttacher> {
    // @ts-ignore
    return class WithResponseData extends Super {
      constructor(...args: any[]) {
        super(...args);
      }
      public response() {
        return { unsafeResponse: (this as any)[whereToLook] };
      }
    };
  };
}

export function WithFinalAuth<
  TPrincipalKey extends string,
  TAuthKey extends string
>(principalKey: TPrincipalKey, authorizerKey: TAuthKey) {
  // tslint:disable-next-line:only-arrow-functions
  return function<
    TSuper extends Constructor<
      Record<TPrincipalKey, any> &
        Record<TAuthKey, IsFinalAuth<InstanceType<TSuper>[TPrincipalKey]>> &
        OptionallyHasFinalAuth
    >
  >(Super: TSuper) {
    // @ts-ignore
    return class WithFinalAuthorize extends Super {
      // do-not-at-ts-ignore
      // [whereToStore]: TNext;
      constructor(...args: any[]) {
        super(...args);
      }
      public async finalAuthorize() {
        // @todo: MAKE SURE THIS WORKS PROPERLY IF THERE'S GAPS IN THE PROTOTYPE CHAIN
        // i.e. chain doesn't break or double-call!!
        if (super.finalAuthorize) {
          if ((await super.finalAuthorize()) !== true) {
            return false;
          }
        }
        return await (this as any)[authorizerKey]((this as any)[principalKey]);
      }
    };
  };
}

export function NoopFinalAuth() {
  // tslint:disable-next-line:only-arrow-functions
  return function<TSuper extends Constructor>(Super: TSuper) {
    return class WithFinalAuthorize extends Super {
      constructor(...args: any[]) {
        super(...args);
      }
      public async finalAuthorize() {
        return true;
      }
    };
  };
}

export function WithInitTo<
  TWhereToStore extends string,
  TWhereToLook extends string,
  TWhatYoullFind,
  TSuper extends Constructor<Record<TWhereToLook, TWhatYoullFind>>,
  TNext
>(
  Super: TSuper,
  whereToLook: TWhereToLook,
  projector: AnySyncProjector,
  whereToStore: TWhereToStore
) {
  return WithInit(whereToLook, projector, whereToStore)(Super);
}

export function WithPreAuthTo<
  TPrincipalKey extends string & keyof InstanceType<TSuper>,
  TPrincipal extends InstanceType<TSuper>[TPrincipalKey],
  TAuthKey extends string,
  TSuper extends Constructor<
    Record<TPrincipalKey, any> &
      Record<TAuthKey, IsFinalAuth<TPrincipal>> &
      OptionallyHasPreAuth
  >
>(
  Super: TSuper,
  principalKey: TPrincipalKey,
  authorizer: IsPreAuth<TPrincipal>
) {
  return WithPreAuth(principalKey, authorizer)(Super);
}

export function WithAttachedTo<
  TWhereToStore extends string,
  TWhereToLook extends string & keyof InstanceType<TSuper>,
  TWhatYoullFind,
  TSuper extends Constructor<
    Record<TWhereToLook, TWhatYoullFind> & OptionallyHasDataAttacher
  >,
  TNext
>(
  Super: TSuper,
  whereToLook: TWhereToLook,
  projector: AsyncProjector<TNext, TWhatYoullFind>,
  whereToStore: TWhereToStore
): TSuper & Constructor<{ [k in TWhereToStore]: TNext } & HasDataAttacher>;
export function WithAttachedTo<
  TWhereToStore extends string,
  TWhereToLook extends string & keyof InstanceType<TSuper>,
  TWhatYoullFind,
  TSuper extends Constructor<
    Record<TWhereToLook, TWhatYoullFind> & OptionallyHasDataAttacher
  >,
  TNext
>(
  Super: TSuper,
  whereToLook: TWhereToLook,
  projector: AsyncProjector<TNext, TWhatYoullFind>,
  whereToStore: TWhereToStore
) {
  return WithAttached(whereToLook, projector, whereToStore)(Super);
}

export function WithFinalAuthTo<
  TPrincipalKey extends string & keyof InstanceType<TSuper>,
  TPrincipal extends InstanceType<TSuper>[TPrincipalKey],
  TAuthKey extends string,
  TSuper extends Constructor<
    Record<TPrincipalKey, any> &
      Record<TAuthKey, IsFinalAuth<TPrincipal>> &
      OptionallyHasFinalAuth
  >
>(Super: TSuper, principalKey: TPrincipalKey, authorizerKey: TAuthKey) {
  return WithFinalAuth(principalKey, authorizerKey)(Super);
}

type ClassExtender<TClassIn, TClassOut> = (ClassIn: TClassIn) => TClassOut;

// todo: Add an htMix too b/c this REQUIRES that a param has been provided
// by one of the previous subclassers in the pipe
export function HTPipe<ClassIn>(): ClassExtender<ClassIn, ClassIn>;
export function HTPipe<ClassIn, A>(
  fn1: ClassExtender<ClassIn, A>
): ClassExtender<ClassIn, A>;
export function HTPipe<ClassIn, A, B>(
  fn1: ClassExtender<ClassIn, A>,
  fn2: ClassExtender<A, B>
): ClassExtender<ClassIn, B>;
export function HTPipe<ClassIn, A, B, C>(
  fn1: ClassExtender<ClassIn, A>,
  fn2: ClassExtender<A, B>,
  fn3: ClassExtender<B, C>
): ClassExtender<ClassIn, C>;
export function HTPipe<ClassIn, A, B, C, D>(
  fn1: ClassExtender<ClassIn, A>,
  fn2: ClassExtender<A, B>,
  fn3: ClassExtender<B, C>,
  fn4: ClassExtender<C, D>
): ClassExtender<ClassIn, D>;
export function HTPipe<ClassIn, A, B, C, D, E>(
  fn1: ClassExtender<ClassIn, A>,
  fn2: ClassExtender<A, B>,
  fn3: ClassExtender<B, C>,
  fn4: ClassExtender<C, D>,
  fn5: ClassExtender<D, E>
): ClassExtender<ClassIn, E>;
export function HTPipe<ClassIn, A, B, C, D, E, F>(
  fn1: ClassExtender<ClassIn, A>,
  fn2: ClassExtender<A, B>,
  fn3: ClassExtender<B, C>,
  fn4: ClassExtender<C, D>,
  fn5: ClassExtender<D, E>,
  fn6: ClassExtender<E, F>
): ClassExtender<ClassIn, F>;
export function HTPipe<ClassIn, A, B, C, D, E, F, G>(
  fn1: ClassExtender<ClassIn, A>,
  fn2: ClassExtender<A, B>,
  fn3: ClassExtender<B, C>,
  fn4: ClassExtender<C, D>,
  fn5: ClassExtender<D, E>,
  fn6: ClassExtender<E, F>,
  fn7: ClassExtender<F, G>
): ClassExtender<ClassIn, G>;
export function HTPipe<ClassIn, A, B, C, D, E, F, G, H>(
  fn1: ClassExtender<ClassIn, A>,
  fn2: ClassExtender<A, B>,
  fn3: ClassExtender<B, C>,
  fn4: ClassExtender<C, D>,
  fn5: ClassExtender<D, E>,
  fn6: ClassExtender<E, F>,
  fn7: ClassExtender<F, G>,
  fn8: ClassExtender<G, H>
): ClassExtender<ClassIn, H>;
export function HTPipe<ClassIn, A, B, C, D, E, F, G, H, I>(
  fn1: ClassExtender<ClassIn, A>,
  fn2: ClassExtender<A, B>,
  fn3: ClassExtender<B, C>,
  fn4: ClassExtender<C, D>,
  fn5: ClassExtender<D, E>,
  fn6: ClassExtender<E, F>,
  fn7: ClassExtender<F, G>,
  fn8: ClassExtender<G, H>,
  fn9: ClassExtender<H, I>
): ClassExtender<ClassIn, I>;
export function HTPipe<ClassIn, A, B, C, D, E, F, G, H, I>(
  fn1: ClassExtender<ClassIn, A>,
  fn2: ClassExtender<A, B>,
  fn3: ClassExtender<B, C>,
  fn4: ClassExtender<C, D>,
  fn5: ClassExtender<D, E>,
  fn6: ClassExtender<E, F>,
  fn7: ClassExtender<F, G>,
  fn8: ClassExtender<G, H>,
  fn9: ClassExtender<H, I>,
  ...fns: Array<ClassExtender<any, any>>
): ClassExtender<ClassIn, {}>;

export function HTPipe(...fns: Array<ClassExtender<any, any>>) {
  if (!fns) {
    return (inClass: any) => inClass;
  }
  if (fns.length === 1) {
    return fns[0];
  }
  return function piped<TSuper>(Super: TSuper) {
    return fns.reduce((prev, fn) => fn(prev), Super);
  };
}

export * from './core';
export * from './express';
export * from './mongoose';
export * from './user';
