import { isHasAttachData } from './core';
import {
  WithAttached,
  WithFinalAuth,
  WithInit,
  WithPreAuth,
} from './subclassers';
import {
  Constructor,
  HasAttachData,
  OptionallyHasAttachData,
  PromiseResolveOrSync,
} from './types';

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
      return Promise.resolve(instance[instanceMethodName](arg) as TOut);
    });
  };
}

export function WithNoopPreAuth() {
  return WithPreAuth('user_user', () => true);
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

// @todo: implement all the other HTPipe*'s - note that each one will be slightly different based on their specifics...
// i.e. can return bool vs not, possibly async vs sync only, mandatory vs not mandatory...
// then the final master HTPipe will just build an object out of all the sub-HTPipe*'s
export function HTPipeAttachData<
  TLeft extends OptionallyHasAttachData<
    any,
    TRight extends HasAttachData<any, any>
      ? Partial<Parameters<TRight['attachData']>[0]>
      : any
  >,
  TRight extends OptionallyHasAttachData<any, any>,
  TContextInLeft extends TLeft extends HasAttachData<any, any>
    ? Parameters<TLeft['attachData']>[0]
    : {},
  TContextInRight extends TRight extends HasAttachData<any, any>
    ? Parameters<TRight['attachData']>[0]
    : {},
  TContextOutLeft extends TLeft extends HasAttachData<any, any>
    ? PromiseResolveOrSync<ReturnType<TLeft['attachData']>>
    : {},
  TContextOutRight extends TRight extends HasAttachData<any, any>
    ? PromiseResolveOrSync<ReturnType<TRight['attachData']>>
    : {}
>(
  left: TLeft,
  right: TRight
): HasAttachData<
  TContextInLeft & Omit<TContextInRight, keyof TContextOutLeft>,
  TContextOutLeft & TContextOutRight
>;
// @todo: consider for better DX, making the above NOT Optionally_, and making 3 more variants that spit out more direct
// TLeft, TRight, and {} types instead.  CAREFUL: Make sure that if the constraint on TLeft is violated, it isn't allowed by
// another overload by accident! i.e. make sure that if one of left's outputs has a type mismatch with one of right's inputs, it errors!
// CAREFUL: these names mean different things above and below O.o
export function HTPipeAttachData<
  TLeft extends OptionallyHasAttachData<any, any>,
  TRight extends OptionallyHasAttachData<any, any>,
  TContextInLeft extends TLeft extends HasAttachData<any, any>
    ? Parameters<TLeft['attachData']>[0]
    : never,
  TContextInRight extends TRight extends HasAttachData<any, any>
    ? Parameters<TRight['attachData']>[0]
    : never,
  TContextOutLeft extends TLeft extends HasAttachData<any, any>
    ? PromiseResolveOrSync<ReturnType<TLeft['attachData']>>
    : never,
  TContextOutRight extends TRight extends HasAttachData<any, any>
    ? PromiseResolveOrSync<ReturnType<TRight['attachData']>>
    : never
>(left: TLeft, right: TRight) {
  if (isHasAttachData(left) && isHasAttachData(right)) {
    return {
      attachData: async (
        context: TContextOutLeft extends TContextInRight
          ? TContextInLeft
          : TContextInRight & TContextInLeft
      ) => {
        const leftOut = (await Promise.resolve(left.attachData(context))) || {};
        const rightIn = {
          ...context,
          ...leftOut,
        };
        const rightOut =
          (await Promise.resolve(right.attachData(rightIn))) || {};
        return { ...leftOut, ...rightOut };
      },
    };
  } else if (isHasAttachData(left)) {
    // return { attachData: (context: TContextInLeft) => left.attachData(context) };
    return { attachData: left.attachData };
  } else if (isHasAttachData(right)) {
    // return { attachData: (context: TContextInRight) => right.attachData(context) };
    return { attachData: right.attachData };
  } else {
    return {};
  }
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
