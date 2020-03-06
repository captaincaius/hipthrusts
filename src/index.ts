import {
  WithAttached,
  WithFinalAuth,
  WithInit,
  WithPreAuth,
} from './subclassers';
import { Constructor } from './types';

type SyncProjector<TNext, TSource> = (source: TSource) => TNext;

type AnySyncProjector = SyncProjector<any, any>;

type AsyncProjector<TNext, TSource> = (source: TSource) => Promise<TNext>;

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
      if (instanceMethodName === 'finalAuthForAll') {
        return Promise.resolve(true as TOut);
      } else {
        return Promise.resolve(instance[instanceMethodName](arg) as TOut);
      }
    });
  };
}

export function WithNoopPreAuth() {
  return WithPreAuth('defaultNoopAuthUserKey', () => true);
}

export function NoopFinalAuth() {
  return HTPipe(
    WithAttached(
      'defaultNoopAuthUserKey',
      fromWrappedInstanceMethod('finalAuthForAll'),
      'isUserExist'
    ),
    WithFinalAuth('defaultNoopAuthUserKey', 'isUserExist')
  );
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
export * from './subclassers';
