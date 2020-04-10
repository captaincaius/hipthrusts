import { isHasAttachData, isHasPreAuthorize } from './core';
import { WithFinalAuth, WithPreAuth } from './subclassers';
import {
  HasAttachData,
  HasPreAuthorize,
  OptionallyHasAttachData,
  OptionallyHasPreAuthorize,
  PromiseResolveOrSync,
} from './types';

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
  return WithPreAuth(() => true);
}

export function NoopFinalAuth() {
  return WithFinalAuth(() => true);
}

// @todo: implement all the other HTPipe*'s - note that each one will be slightly different based on their specifics...
// i.e. can return bool vs not, possibly async vs sync only, mandatory vs not mandatory...
// then the final master HTPipe will just build an object out of all the sub-HTPipe*'s

// left has attachData AND right has attachData AND left's return keys that exist in right's parameters are assignable to right's correspondingly
export function HTPipeAttachData<
  TLeft extends HasAttachData<
    any,
    TRight extends HasAttachData<any, any>
      ? Pick<
          Parameters<TRight['attachData']>[0],
          keyof PromiseResolveOrSync<
            ReturnType<
              TLeft extends HasAttachData<any, any>
                ? TLeft['attachData']
                : () => {}
            >
          >
        >
      : any
  >,
  TRight extends HasAttachData<any, any>,
  TContextInLeft extends Parameters<TLeft['attachData']>[0],
  TContextInRight extends Parameters<TRight['attachData']>[0],
  TContextOutLeft extends PromiseResolveOrSync<ReturnType<TLeft['attachData']>>,
  TContextOutRight extends PromiseResolveOrSync<
    ReturnType<TRight['attachData']>
  >
>(
  left: TLeft,
  right: TRight
): HasAttachData<
  TContextInLeft & Omit<TContextInRight, keyof TContextOutLeft>,
  TContextOutRight & Omit<TContextOutLeft, keyof TContextOutRight>
>;

// left has attachData and right does not
// if right has attachData, left's return keys that exist in right's parameters must be assignable to right's correspondingly
// this conditional type is necessary to disqualify left-and-right cases that fell through the first overload because of the type incompatibility so they aren't grouped in with the left-only cases
export function HTPipeAttachData<
  TLeft extends HasAttachData<
    any,
    TRight extends HasAttachData<any, any>
      ? Pick<
          Parameters<TRight['attachData']>[0],
          keyof PromiseResolveOrSync<
            ReturnType<
              TLeft extends HasAttachData<any, any>
                ? TLeft['attachData']
                : () => {}
            >
          >
        >
      : any
  >,
  TRight extends OptionallyHasAttachData<any, any>,
  TContextInLeft extends Parameters<TLeft['attachData']>[0],
  TContextOutLeft extends PromiseResolveOrSync<ReturnType<TLeft['attachData']>>
>(left: TLeft, right: TRight): HasAttachData<TContextInLeft, TContextOutLeft>;

// right has attachData and left does not
// this conditional type is necessary to disqualify left-and-right cases that fell through the first overload because of the type incompatibility so they aren't grouped in with the right-only cases
export function HTPipeAttachData<
  TLeft extends OptionallyHasAttachData<
    any,
    TRight extends HasAttachData<any, any>
      ? Pick<
          Parameters<TRight['attachData']>[0],
          keyof PromiseResolveOrSync<
            ReturnType<
              TLeft extends HasAttachData<any, any>
                ? TLeft['attachData']
                : () => {}
            >
          >
        >
      : any
  >,
  TRight extends HasAttachData<any, any>,
  TContextInRight extends Parameters<TRight['attachData']>[0],
  TContextOutRight extends PromiseResolveOrSync<
    ReturnType<TRight['attachData']>
  >
>(left: TLeft, right: TRight): HasAttachData<TContextInRight, TContextOutRight>;

// right and left doesn't have attachData
// this conditional type is necessary to disqualify left-and-right cases that fell through the first overload because of the type incompatibility so they aren't grouped in with the right-only cases
export function HTPipeAttachData<
  TLeft extends OptionallyHasAttachData<
    any,
    TRight extends HasAttachData<any, any>
      ? Pick<
          Parameters<TRight['attachData']>[0],
          keyof PromiseResolveOrSync<
            ReturnType<
              TLeft extends HasAttachData<any, any>
                ? TLeft['attachData']
                : () => {}
            >
          >
        >
      : any
  >,
  TRight extends OptionallyHasAttachData<any, any>
>(left: TLeft, right: TRight): {};

// main function
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

// left has preAuthorize and right has preAuthorize
export function HTPipePreAuthorize<
  TLeft extends HasPreAuthorize<
    any,
    | boolean
    | (TRight extends HasPreAuthorize<any, any>
        ? Pick<
            Parameters<TRight['preAuthorize']>[0],
            keyof ReturnType<
              TLeft extends HasPreAuthorize<any, any>
                ? TLeft['preAuthorize']
                : () => {}
            >
          >
        : any)
  >,
  TRight extends HasPreAuthorize<any, any>,
  TContextInLeft extends Parameters<TLeft['preAuthorize']>[0],
  TContextInRight extends Parameters<TRight['preAuthorize']>[0],
  TContextOutLeft extends ReturnType<TLeft['preAuthorize']>,
  TContextOutRight extends ReturnType<TRight['preAuthorize']>
>(
  left: TLeft,
  right: TRight
): HasPreAuthorize<
  TContextInLeft & Omit<TContextInRight, keyof TContextOutLeft>,
  TContextOutRight & Omit<TContextOutLeft, keyof TContextOutRight>
>;

// left has preAuthorize and right does not
export function HTPipePreAuthorize<
  TLeft extends HasPreAuthorize<
    any,
    | boolean
    | (TRight extends HasPreAuthorize<any, any>
        ? Pick<
            Parameters<TRight['preAuthorize']>[0],
            keyof ReturnType<
              TLeft extends HasPreAuthorize<any, any>
                ? TLeft['preAuthorize']
                : () => {}
            >
          >
        : any)
  >,
  TRight extends OptionallyHasPreAuthorize<any, any>,
  TContextInLeft extends Parameters<TLeft['preAuthorize']>[0],
  TContextOutLeft extends ReturnType<TLeft['preAuthorize']>
>(left: TLeft, right: TRight): HasPreAuthorize<TContextInLeft, TContextOutLeft>;

// right has preAuthorize and left does not
export function HTPipePreAuthorize<
  TLeft extends OptionallyHasPreAuthorize<
    any,
    | boolean
    | (TRight extends HasPreAuthorize<any, any>
        ? Pick<
            Parameters<TRight['preAuthorize']>[0],
            keyof ReturnType<
              TLeft extends HasPreAuthorize<any, any>
                ? TLeft['preAuthorize']
                : () => {}
            >
          >
        : any)
  >,
  TRight extends HasPreAuthorize<any, any>,
  TContextInRight extends Parameters<TRight['preAuthorize']>[0],
  TContextOutRight extends ReturnType<TRight['preAuthorize']>
>(
  left: TLeft,
  right: TRight
): HasPreAuthorize<TContextInRight, TContextOutRight>;

// right and left doesn't have preAuthorize
export function HTPipePreAuthorize<
  TLeft extends OptionallyHasPreAuthorize<
    any,
    | boolean
    | (TRight extends HasPreAuthorize<any, any>
        ? Pick<
            Parameters<TRight['preAuthorize']>[0],
            keyof ReturnType<
              TLeft extends HasPreAuthorize<any, any>
                ? TLeft['preAuthorize']
                : () => {}
            >
          >
        : any)
  >,
  TRight extends OptionallyHasPreAuthorize<any, any>
>(left: TLeft, right: TRight): {};

// main preAuthorize HTPipe
export function HTPipePreAuthorize<
  TLeft extends OptionallyHasPreAuthorize<any, any>,
  TRight extends OptionallyHasPreAuthorize<any, any>,
  TContextInLeft extends TLeft extends HasPreAuthorize<any, any>
    ? Parameters<TLeft['preAuthorize']>[0]
    : never,
  TContextInRight extends TRight extends HasPreAuthorize<any, any>
    ? Parameters<TRight['preAuthorize']>[0]
    : never,
  TContextOutLeft extends TLeft extends HasPreAuthorize<any, any>
    ? ReturnType<TLeft['preAuthorize']>
    : never,
  TContextOutRight extends TRight extends HasPreAuthorize<any, any>
    ? ReturnType<TRight['preAuthorize']>
    : never
>(left: TLeft, right: TRight) {
  if (isHasPreAuthorize(left) && isHasPreAuthorize(right)) {
    return {
      preAuthorize: (
        context: TContextOutLeft extends TContextInRight
          ? TContextInLeft
          : TContextInRight & TContextInLeft
      ) => {
        const leftOut = left.preAuthorize(context);
        const leftOutIsBoolean = leftOut === true || leftOut === false;
        if (leftOutIsBoolean) {
          if (leftOut) {
            const rightOut = right.preAuthorize(context);
            const rightOutIsBoolean = rightOut === true || rightOut === false;
            if (rightOutIsBoolean) {
              if (rightOut) {
                return rightOut;
              } else {
                return false;
              }
            } else {
              if (Object.keys(rightOut).length > 0) {
                return rightOut;
              } else {
                return false;
              }
            }
          } else {
            return false;
          }
        } else {
          if (Object.keys(leftOut).length > 0) {
            const rightIn = {
              ...context,
              ...leftOut,
            };
            const rightOut = right.preAuthorize(rightIn);
            const rightOutIsBoolean = rightOut === true || rightOut === false;
            if (rightOutIsBoolean) {
              if (rightOut) {
                return rightOut;
              } else {
                return false;
              }
            } else {
              if (Object.keys(rightOut).length > 0) {
                return rightOut;
              } else {
                return false;
              }
            }
          } else {
            return false;
          }
        }
      },
    };
  } else if (isHasPreAuthorize(left)) {
    return {
      preAuthorize: left.preAuthorize,
    };
  } else if (isHasPreAuthorize(right)) {
    return {
      preAuthorize: right.preAuthorize,
    };
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
