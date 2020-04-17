import {
  isHasAttachData,
  isHasDoWork,
  isHasFinalAuthorize,
  isHasInitPreContext,
  isHasPreAuthorize,
  isHasRespond,
  isHasSanitizeBody,
  isHasSanitizeParams,
  isHasSanitizeResponse,
} from './core';
import { WithFinalAuth, WithPreAuth } from './subclassers';
import {
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

export function HTPipe2<
  TLeft extends OptionallyHasInitPreContext<
    any,
    TRight extends HasInitPreContext<any, any>
      ? Pick<
          Parameters<TRight['initPreContext']>[0],
          keyof PromiseResolveOrSync<
            ReturnType<
              TLeft extends HasInitPreContext<any, any>
                ? TLeft['initPreContext']
                : () => {}
            >
          >
        >
      : any
  > &
    OptionallyHasAttachData<
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
  TRight extends OptionallyHasInitPreContext<any, any> &
    OptionallyHasAttachData<any, any>
>(left: TLeft, right: TRight) {
  type TLeftInitPreContextIn = TLeft extends HasInitPreContext<any, any>
    ? Parameters<TLeft['initPreContext']>[0]
    : never;
  type TRightInitPreContextIn = TRight extends HasInitPreContext<any, any>
    ? Parameters<TRight['initPreContext']>[0]
    : never;
  type TLeftInitPreContextOut = TLeft extends HasInitPreContext<any, any>
    ? PromiseResolveOrSync<ReturnType<TLeft['initPreContext']>>
    : never;
  type TRightInitPreContextOut = TRight extends HasInitPreContext<any, any>
    ? PromiseResolveOrSync<ReturnType<TRight['initPreContext']>>
    : never;
  type TLeftAttachDataIn = TLeft extends HasAttachData<any, any>
    ? Parameters<TLeft['attachData']>[0]
    : never;
  type TRightAttachDataIn = TRight extends HasAttachData<any, any>
    ? Parameters<TRight['attachData']>[0]
    : never;
  type TLeftAttachDataOut = TLeft extends HasAttachData<any, any>
    ? PromiseResolveOrSync<ReturnType<TLeft['attachData']>>
    : never;
  type TRightAttachDataOut = TRight extends HasAttachData<any, any>
    ? PromiseResolveOrSync<ReturnType<TRight['attachData']>>
    : never;
  return {
    ...((isHasInitPreContext(left) && isHasInitPreContext(right)
      ? {
          attachData: async () => {
            const leftOut =
              (await Promise.resolve(left.initPreContext(context))) || {};
            const rightIn = {
              ...context,
              ...leftOut,
            };
            const rightOut =
              (await Promise.resolve(right.initPreContext(rightIn))) || {};
            return { ...leftOut, ...rightOut };
          },
        }
      : isHasInitPreContext(left)
      ? { initPreContext: left.initPreContext }
      : isHasInitPreContext(right)
      ? { initPreContext: left.initPreContext }
      : {}) as TLeft extends HasInitPreContext<any, any>
      ? TRight extends HasInitPreContext<any, any>
        ? HasInitPreContext<
            TLeftInitPreContextIn &
              Omit<TRightInitPreContextIn, keyof TLeftInitPreContextOut>,
            TRightInitPreContextOut &
              Omit<TLeftInitPreContextOut, keyof TRightInitPreContextOut>
          >
        : { initPreContext: TLeft['initPreContext'] }
      : TRight extends HasInitPreContext<any, any>
      ? { initPreContext: TRight['initPreContext'] }
      : {}),
    ...((isHasAttachData(left) && isHasAttachData(right)
      ? {
          attachData: async () => {
            const leftOut =
              (await Promise.resolve(left.attachData(context))) || {};
            const rightIn = {
              ...context,
              ...leftOut,
            };
            const rightOut =
              (await Promise.resolve(right.attachData(rightIn))) || {};
            return { ...leftOut, ...rightOut };
          },
        }
      : isHasAttachData(left)
      ? { attachData: left.attachData }
      : isHasAttachData(right)
      ? { attachData: left.attachData }
      : {}) as TLeft extends HasAttachData<any, any>
      ? TRight extends HasAttachData<any, any>
        ? HasAttachData<
            TLeftAttachDataIn &
              Omit<TRightAttachDataIn, keyof TLeftAttachDataOut>,
            TRightAttachDataOut &
              Omit<TLeftAttachDataOut, keyof TRightAttachDataOut>
          >
        : { attachData: TLeft['attachData'] }
      : TRight extends HasAttachData<any, any>
      ? { attachData: TRight['attachData'] }
      : {}),
  };
}

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

function authorizationPassed<TAuthOut extends boolean | object>(
  authOut: TAuthOut
) {
  return (
    authOut === true ||
    (authOut && typeof authOut === 'object' && Object.keys(authOut).length > 0)
  );
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
  TContextInLeft &
    Omit<
      TContextInRight,
      TContextOutLeft extends boolean ? keyof {} : keyof TContextOutLeft
    >,
  TContextOutRight &
    Omit<
      TContextOutLeft,
      TContextOutRight extends boolean ? keyof {} : keyof TContextOutRight
    >
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
  TRight extends MightHavePreAuthorize<any, any>,
  TContextInLeft extends Parameters<TLeft['preAuthorize']>[0],
  TContextOutLeft extends ReturnType<TLeft['preAuthorize']>
>(left: TLeft, right: TRight): HasPreAuthorize<TContextInLeft, TContextOutLeft>;

// right has preAuthorize and left does not
export function HTPipePreAuthorize<
  TLeft extends MightHavePreAuthorize<
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
  TLeft extends MightHavePreAuthorize<
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
  TRight extends MightHavePreAuthorize<any, any>
>(left: TLeft, right: TRight): {};

// main preAuthorize HTPipe
export function HTPipePreAuthorize<
  TLeft extends MightHavePreAuthorize<any, any>,
  TRight extends MightHavePreAuthorize<any, any>,
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
        const leftPassed = authorizationPassed(leftOut);
        if (!leftPassed) {
          return false;
        }
        const leftContextOut = leftPassed === true ? {} : leftOut;
        const rightIn = {
          ...context,
          ...leftContextOut,
        };
        const rightOut = right.preAuthorize(rightIn);
        const rightPassed = authorizationPassed(rightOut);
        if (!rightPassed) {
          return false;
        }
        if (leftOut === true && rightOut === true) {
          return true;
        }
        const rightContextOut = rightOut === true ? {} : rightOut;
        return {
          ...leftContextOut,
          ...rightContextOut,
        };
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

// left has finalAuthorize and right has finalAuthorize
export function HTPipeFinalAuthorize<
  TLeft extends HasFinalAuthorize<
    any,
    | boolean
    | (TRight extends HasFinalAuthorize<any, any>
        ? Pick<
            Parameters<TRight['finalAuthorize']>[0],
            keyof PromiseResolveOrSync<
              ReturnType<
                TLeft extends HasFinalAuthorize<any, any>
                  ? TLeft['finalAuthorize']
                  : () => {}
              >
            >
          >
        : any)
  >,
  TRight extends HasFinalAuthorize<any, any>,
  TContextInLeft extends Parameters<TLeft['finalAuthorize']>[0],
  TContextInRight extends Parameters<TRight['finalAuthorize']>[0],
  TContextOutLeft extends PromiseResolveOrSync<
    ReturnType<TLeft['finalAuthorize']>
  >,
  TContextOutRight extends PromiseResolveOrSync<
    ReturnType<TRight['finalAuthorize']>
  >
>(
  left: TLeft,
  right: TRight
): HasFinalAuthorize<
  TContextInLeft &
    Omit<
      TContextInRight,
      TContextOutLeft extends boolean ? keyof {} : keyof TContextOutLeft
    >,
  TContextOutRight &
    Omit<
      TContextOutLeft,
      TContextOutRight extends boolean ? keyof {} : keyof TContextOutRight
    >
>;

// left has finalAuthorize and right does not
export function HTPipeFinalAuthorize<
  TLeft extends HasFinalAuthorize<
    any,
    | boolean
    | (TRight extends HasFinalAuthorize<any, any>
        ? Pick<
            Parameters<TRight['finalAuthorize']>[0],
            keyof PromiseResolveOrSync<
              ReturnType<
                TLeft extends HasFinalAuthorize<any, any>
                  ? TLeft['finalAuthorize']
                  : () => {}
              >
            >
          >
        : any)
  >,
  TRight extends MightHaveFinalAuthorize<any, any>,
  TContextInLeft extends Parameters<TLeft['finalAuthorize']>[0],
  TContextOutLeft extends PromiseResolveOrSync<
    ReturnType<TLeft['finalAuthorize']>
  >
>(
  left: TLeft,
  right: TRight
): HasFinalAuthorize<TContextInLeft, TContextOutLeft>;

// right has finalAuthorize and left does not
export function HTPipeFinalAuthorize<
  TLeft extends MightHaveFinalAuthorize<
    any,
    | boolean
    | (TRight extends HasFinalAuthorize<any, any>
        ? Pick<
            Parameters<TRight['finalAuthorize']>[0],
            keyof PromiseResolveOrSync<
              ReturnType<
                TLeft extends HasFinalAuthorize<any, any>
                  ? TLeft['finalAuthorize']
                  : () => {}
              >
            >
          >
        : any)
  >,
  TRight extends HasFinalAuthorize<any, any>,
  TContextInRight extends Parameters<TRight['finalAuthorize']>[0],
  TContextOutRight extends PromiseResolveOrSync<
    ReturnType<TRight['finalAuthorize']>
  >
>(
  left: TLeft,
  right: TRight
): HasFinalAuthorize<TContextInRight, TContextOutRight>;

// right and left doesn't have preAuthorize
export function HTPipeFinalAuthorize<
  TLeft extends MightHaveFinalAuthorize<
    any,
    | boolean
    | (TRight extends HasFinalAuthorize<any, any>
        ? Pick<
            Parameters<TRight['finalAuthorize']>[0],
            keyof PromiseResolveOrSync<
              ReturnType<
                TLeft extends HasFinalAuthorize<any, any>
                  ? TLeft['finalAuthorize']
                  : () => {}
              >
            >
          >
        : any)
  >,
  TRight extends MightHaveFinalAuthorize<any, any>
>(left: TLeft, right: TRight): {};

// finalAuthorize main function
export function HTPipeFinalAuthorize<
  TLeft extends MightHaveFinalAuthorize<any, any>,
  TRight extends MightHaveFinalAuthorize<any, any>,
  TContextInLeft extends TLeft extends HasFinalAuthorize<any, any>
    ? Parameters<TLeft['finalAuthorize']>[0]
    : never,
  TContextInRight extends TRight extends HasFinalAuthorize<any, any>
    ? Parameters<TRight['finalAuthorize']>[0]
    : never,
  TContextOutLeft extends TLeft extends HasFinalAuthorize<any, any>
    ? PromiseResolveOrSync<ReturnType<TLeft['finalAuthorize']>>
    : never,
  TContextOutRight extends TRight extends HasFinalAuthorize<any, any>
    ? PromiseResolveOrSync<ReturnType<TRight['finalAuthorize']>>
    : never
>(left: TLeft, right: TRight) {
  if (isHasFinalAuthorize(left) && isHasFinalAuthorize(right)) {
    return {
      finalAuthorize: async (
        context: TContextOutLeft extends TContextInRight
          ? TContextInLeft
          : TContextInRight & TContextInLeft
      ) => {
        const leftOut = await Promise.resolve(left.finalAuthorize(context));
        const leftPassed = authorizationPassed(leftOut);
        if (!leftPassed) {
          return false;
        }
        const leftContextOut = leftOut === true ? {} : leftOut;
        const rightIn = {
          ...context,
          ...leftContextOut,
        };
        const rightOut = await Promise.resolve(right.finalAuthorize(rightIn));
        const rightPassed = authorizationPassed(rightOut);
        if (!rightPassed) {
          return false;
        }
        if (leftOut === true && rightOut === true) {
          return true;
        }
        const rightContextOut = rightOut === true ? {} : rightOut;
        return {
          ...leftContextOut,
          ...rightContextOut,
        };
      },
    };
  } else if (isHasFinalAuthorize(left)) {
    return { finalAuthorize: left.finalAuthorize };
  } else if (isHasFinalAuthorize(right)) {
    return { finalAuthorize: right.finalAuthorize };
  } else {
    return {};
  }
}

// left has initPreContext and right has initPreContext
export function HTPipeInitPreContext<
  TLeft extends HasInitPreContext<
    any,
    TRight extends HasInitPreContext<any, any>
      ? Pick<
          Parameters<TRight['initPreContext']>[0],
          keyof ReturnType<
            TLeft extends HasInitPreContext<any, any>
              ? TLeft['initPreContext']
              : () => {}
          >
        >
      : any
  >,
  TRight extends HasInitPreContext<any, any>,
  TContextInLeft extends Parameters<TLeft['initPreContext']>[0],
  TContextInRight extends Parameters<TRight['initPreContext']>[0],
  TContextOutLeft extends ReturnType<TLeft['initPreContext']>,
  TContextOutRight extends ReturnType<TRight['initPreContext']>
>(
  left: TLeft,
  right: TRight
): HasInitPreContext<
  TContextInLeft & Omit<TContextInRight, keyof TContextOutLeft>,
  TContextOutRight & Omit<TContextOutLeft, keyof TContextOutRight>
>;

// left has initPreContext and right doesn't
export function HTPipeInitPreContext<
  TLeft extends HasInitPreContext<
    any,
    TRight extends HasInitPreContext<any, any>
      ? Pick<
          Parameters<TRight['initPreContext']>[0],
          keyof ReturnType<
            TLeft extends HasInitPreContext<any, any>
              ? TLeft['initPreContext']
              : () => {}
          >
        >
      : any
  >,
  TRight extends OptionallyHasInitPreContext<any, any>,
  TContextInLeft extends Parameters<TLeft['initPreContext']>[0],
  TContextOutLeft extends ReturnType<TLeft['initPreContext']>
>(
  left: TLeft,
  right: TRight
): HasInitPreContext<TContextInLeft, TContextOutLeft>;

// right has initPreContext and left doesn't
export function HTPipeInitPreContext<
  TLeft extends OptionallyHasInitPreContext<
    any,
    TRight extends HasInitPreContext<any, any>
      ? Pick<
          Parameters<TRight['initPreContext']>[0],
          keyof ReturnType<
            TLeft extends HasInitPreContext<any, any>
              ? TLeft['initPreContext']
              : () => {}
          >
        >
      : any
  >,
  TRight extends HasInitPreContext<any, any>,
  TContextInRight extends Parameters<TRight['initPreContext']>[0],
  TContextOutRight extends ReturnType<TRight['initPreContext']>
>(
  left: TLeft,
  right: TRight
): HasInitPreContext<TContextInRight, TContextOutRight>;

// right and left doesn't have initPreContext
export function HTPipeInitPreContext<
  TLeft extends OptionallyHasInitPreContext<
    any,
    TRight extends HasInitPreContext<any, any>
      ? Pick<
          Parameters<TRight['initPreContext']>[0],
          keyof ReturnType<
            TLeft extends HasInitPreContext<any, any>
              ? TLeft['initPreContext']
              : () => {}
          >
        >
      : any
  >,
  TRight extends OptionallyHasInitPreContext<any, any>
>(left: TLeft, right: TRight): {};

// main initPreContext HTPipe function
export function HTPipeInitPreContext<
  TLeft extends OptionallyHasInitPreContext<any, any>,
  TRight extends OptionallyHasInitPreContext<any, any>,
  TContextInLeft extends TLeft extends HasInitPreContext<any, any>
    ? Parameters<TLeft['initPreContext']>[0]
    : never,
  TContextInRight extends TRight extends HasInitPreContext<any, any>
    ? Parameters<TRight['initPreContext']>[0]
    : never,
  TContextOutLeft extends TLeft extends HasInitPreContext<any, any>
    ? ReturnType<TLeft['initPreContext']>
    : never,
  TContextOutRight extends TRight extends HasInitPreContext<any, any>
    ? ReturnType<TRight['initPreContext']>
    : never
>(left: TLeft, right: TRight) {
  if (isHasInitPreContext(left) && isHasInitPreContext(right)) {
    return {
      initPreContext: (
        context: TContextOutLeft extends TContextInRight
          ? TContextInLeft
          : TContextInRight & TContextInLeft
      ) => {
        const leftOut = left.initPreContext(context) || {};
        const rightIn = {
          ...context,
          ...leftOut,
        };
        const rightOut = right.initPreContext(rightIn) || {};
        return {
          ...leftOut,
          ...rightOut,
        };
      },
    };
  } else if (isHasInitPreContext(left)) {
    return { initPreContext: left.initPreContext };
  } else if (isHasInitPreContext(right)) {
    return { initPreContext: right.initPreContext };
  } else {
    return {};
  }
}

// left has doWork and right has doWork
export function HTPipeDoWork<
  TLeft extends HasDoWork<
    any,
    | void
    | (TRight extends HasDoWork<any, any>
        ? Pick<
            Parameters<TRight['doWork']>[0],
            keyof PromiseResolveOrSync<
              ReturnType<
                TLeft extends HasDoWork<any, any> ? TLeft['doWork'] : () => {}
              >
            >
          >
        : any)
  >,
  TRight extends HasDoWork<any, any>,
  TContextInLeft extends Parameters<TLeft['doWork']>[0],
  TContextInRight extends Parameters<TRight['doWork']>[0],
  TContextOutLeft extends PromiseResolveOrSync<ReturnType<TLeft['doWork']>>,
  TContextOutRight extends PromiseResolveOrSync<ReturnType<TLeft['doWork']>>
>(
  left: TLeft,
  right: TRight
): HasDoWork<
  TContextInLeft &
    Omit<
      TContextInRight,
      TContextOutLeft extends void ? keyof {} : keyof TContextOutLeft
    >,
  TContextOutRight &
    Omit<
      TContextOutLeft,
      TContextOutRight extends void ? keyof {} : keyof TContextOutRight
    >
>;

// left has doWork, right doesn't
export function HTPipeDoWork<
  TLeft extends HasDoWork<
    any,
    | void
    | (TRight extends HasDoWork<any, any>
        ? Pick<
            Parameters<TRight['doWork']>[0],
            keyof PromiseResolveOrSync<
              ReturnType<
                TLeft extends HasDoWork<any, any> ? TLeft['doWork'] : () => {}
              >
            >
          >
        : any)
  >,
  TRight extends OptionallyHasDoWork<any, any>,
  TContextInLeft extends Parameters<TLeft['doWork']>[0],
  TContextOutLeft extends PromiseResolveOrSync<TLeft['doWork']>
>(left: TLeft, right: TRight): HasDoWork<TContextInLeft, TContextOutLeft>;

// right has do doWork, left doesn't
export function HTPipeDoWork<
  TLeft extends OptionallyHasDoWork<
    any,
    | void
    | (TRight extends HasDoWork<any, any>
        ? Pick<
            Parameters<TRight['doWork']>[0],
            keyof PromiseResolveOrSync<
              ReturnType<
                TLeft extends HasDoWork<any, any> ? TLeft['doWork'] : () => {}
              >
            >
          >
        : any)
  >,
  TRight extends HasDoWork<any, any>,
  TContextInRight extends Parameters<TRight['doWork']>[0],
  TContextOutRight extends PromiseResolveOrSync<ReturnType<TRight['doWork']>>
>(left: TLeft, right: TRight): HasDoWork<TContextInRight, TContextOutRight>;

// right and left doesn't have doWork
export function HTPipeDoWork<
  TLeft extends OptionallyHasDoWork<
    any,
    | void
    | (TRight extends HasDoWork<any, any>
        ? Pick<
            Parameters<TRight['doWork']>[0],
            keyof PromiseResolveOrSync<
              ReturnType<
                TLeft extends HasDoWork<any, any> ? TLeft['doWork'] : () => {}
              >
            >
          >
        : any)
  >,
  TRight extends OptionallyHasDoWork<any, any>
>(left: TLeft, right: TRight): {};

// main doWork HTPipe
export function HTPipeDoWork<
  TLeft extends OptionallyHasDoWork<any, any>,
  TRight extends OptionallyHasDoWork<any, any>,
  TContextInLeft extends TLeft extends HasDoWork<any, any>
    ? Parameters<TLeft['doWork']>[0]
    : never,
  TContextInRight extends TRight extends HasDoWork<any, any>
    ? Parameters<TRight['doWork']>[0]
    : never,
  TContextOutLeft extends TLeft extends HasDoWork<any, any>
    ? PromiseResolveOrSync<ReturnType<TLeft['doWork']>>
    : never,
  TContextOutRight extends TRight extends HasDoWork<any, any>
    ? PromiseResolveOrSync<ReturnType<TRight['doWork']>>
    : never
>(left: TLeft, right: TRight) {
  if (isHasDoWork(left) && isHasDoWork(right)) {
    return {
      doWork: async (
        context: TContextOutLeft extends TContextInRight
          ? TContextInLeft
          : TContextInRight & TContextInLeft
      ) => {
        const leftOut = (await Promise.resolve(left.doWork(context))) || {};
        const rightIn = {
          ...context,
          ...leftOut,
        };
        const rightOut = (await Promise.resolve(right.doWork(rightIn))) || {};
        return { ...leftOut, ...rightOut };
      },
    };
  } else if (isHasDoWork(left)) {
    return { doWork: left.doWork };
  } else if (isHasDoWork(right)) {
    return { doWork: right.doWork };
  } else {
    return {};
  }
}

// left has respond and right has respond
export function HTPipeRespond<
  TLeft extends HasRespond<
    any,
    TRight extends HasRespond<any, any> ? Parameters<TRight['respond']>[0] : any
  >,
  TRight extends HasRespond<any, any>,
  TContextInLeft extends Parameters<TLeft['respond']>[0],
  TContextOutRight extends ReturnType<TRight['respond']>
>(left: TLeft, right: TRight): HasRespond<TContextInLeft, TContextOutRight>;

// left has respond and right doesn't
export function HTPipeRespond<
  TLeft extends HasRespond<
    any,
    TRight extends HasRespond<any, any> ? Parameters<TRight['respond']>[0] : any
  >,
  TRight extends MightHaveRespond<any, any>,
  TContextInLeft extends Parameters<TLeft['respond']>[0],
  TContextOutLeft extends ReturnType<TLeft['respond']>
>(left: TLeft, right: TRight): HasRespond<TContextInLeft, TContextOutLeft>;

// right has respond and left doesn't
export function HTPipeRespond<
  TLeft extends MightHaveRespond<
    any,
    TRight extends HasRespond<any, any> ? Parameters<TRight['respond']>[0] : any
  >,
  TRight extends HasRespond<any, any>,
  TContextInRight extends Parameters<TRight['respond']>[0],
  TContextOutRight extends ReturnType<TRight['respond']>
>(left: TLeft, right: TRight): HasRespond<TContextInRight, TContextOutRight>;

// right and left doesn't have respond
export function HTPipeRespond<
  TLeft extends MightHaveRespond<
    any,
    TRight extends HasRespond<any, any> ? Parameters<TRight['respond']>[0] : any
  >,
  TRight extends MightHaveRespond<any, any>
>(left: TLeft, right: TRight): {};

// main respond HTPipe function
export function HTPipeRespond<
  TLeft extends MightHaveRespond<any, any>,
  TRight extends MightHaveRespond<any, any>,
  TContextInLeft extends TLeft extends HasRespond<any, any>
    ? Parameters<TLeft['respond']>[0]
    : never
>(left: TLeft, right: TRight) {
  if (isHasRespond(left) && isHasRespond(right)) {
    return {
      respond: (context: TContextInLeft) => {
        const leftOut = left.respond(context);
        const rightOut = right.respond(leftOut.unsafeResponse);
        return {
          unsafeResponse: rightOut.unsafeResponse,
          status:
            rightOut.status === undefined ? leftOut.status : rightOut.status,
        };
      },
    };
  } else if (isHasRespond(left)) {
    return { respond: left.respond };
  } else if (isHasRespond(right)) {
    return { respond: right.respond };
  } else {
    return {};
  }
}

// left has sanitizeParams and right has sanitizeParams
export function HTPipeSanitizeParams<
  TLeft extends HasSanitizeParams<
    any,
    TRight extends HasSanitizeParams<any, any>
      ? Parameters<TRight['sanitizeParams']>[0]
      : any
  >,
  TRight extends HasSanitizeParams<any, any>,
  TContextInLeft extends Parameters<TLeft['sanitizeParams']>[0],
  TContextOutRight extends ReturnType<TRight['sanitizeParams']>
>(
  left: TLeft,
  right: TRight
): HasSanitizeParams<TContextInLeft, TContextOutRight>;

// left has sanitizeParams and right doesn't
export function HTPipeSanitizeParams<
  TLeft extends HasSanitizeParams<
    any,
    TRight extends HasSanitizeParams<any, any>
      ? Parameters<TRight['sanitizeParams']>[0]
      : any
  >,
  TRight extends OptionallyHasSanitizeParams<any, any>,
  TContextInLeft extends Parameters<TLeft['sanitizeParams']>[0],
  TContextOutLeft extends ReturnType<TLeft['sanitizeParams']>
>(
  left: TLeft,
  right: TRight
): HasSanitizeParams<TContextInLeft, TContextOutLeft>;

// right has sanitizeParams and left doesn't
export function HTPipeSanitizeParams<
  TLeft extends OptionallyHasSanitizeParams<
    any,
    TRight extends HasSanitizeParams<any, any>
      ? Parameters<TRight['sanitizeParams']>[0]
      : any
  >,
  TRight extends HasSanitizeParams<any, any>,
  TContextInRight extends Parameters<TRight['sanitizeParams']>[0],
  TContextOutRight extends ReturnType<TRight['sanitizeParams']>[0]
>(
  left: TLeft,
  right: TRight
): HasSanitizeParams<TContextInRight, TContextOutRight>;

// left and right doesn't have sanitizeParams
export function HTPipeSanitizeParams<
  TLeft extends OptionallyHasSanitizeParams<
    any,
    TRight extends HasSanitizeParams<any, any>
      ? Parameters<TRight['sanitizeParams']>[0]
      : any
  >,
  TRight extends OptionallyHasSanitizeParams<any, any>
>(left: TLeft, right: TRight): {};

// main sanitizeParams HTPipe function
export function HTPipeSanitizeParams<
  TLeft extends OptionallyHasSanitizeParams<any, any>,
  TRight extends OptionallyHasSanitizeParams<any, any>,
  TContextInLeft extends TLeft extends HasSanitizeParams<any, any>
    ? Parameters<TLeft['sanitizeParams']>[0]
    : never
>(left: TLeft, right: TRight) {
  if (isHasSanitizeParams(left) && isHasSanitizeParams(right)) {
    return {
      sanitizeParams: (context: TContextInLeft) => {
        const leftOut = left.sanitizeParams(context) || {};
        const rightOut = right.sanitizeParams(leftOut) || {};
        return rightOut;
      },
    };
  } else if (isHasSanitizeParams(left)) {
    return { sanitizeParams: left.sanitizeParams };
  } else if (isHasSanitizeParams(right)) {
    return { sanitizeParams: right.sanitizeParams };
  } else {
    return {};
  }
}

// left has sanitizeBody and right has sanitizeBody
export function HTPipeSanitizeBody<
  TLeft extends HasSanitizeBody<
    any,
    TRight extends HasSanitizeBody<any, any>
      ? Parameters<TRight['sanitizeBody']>[0]
      : any
  >,
  TRight extends HasSanitizeBody<any, any>,
  TContextInLeft extends Parameters<TLeft['sanitizeBody']>[0],
  TContextOutRight extends ReturnType<TRight['sanitizeBody']>
>(
  left: TLeft,
  right: TRight
): HasSanitizeBody<TContextInLeft, TContextOutRight>;

// left has sanitizeBody and right doesn't
export function HTPipeSanitizeBody<
  TLeft extends HasSanitizeBody<
    any,
    TRight extends HasSanitizeBody<any, any>
      ? Parameters<TRight['sanitizeBody']>[0]
      : any
  >,
  TRight extends OptionallyHasSanitizeBody<any, any>,
  TContextInLeft extends Parameters<TLeft['sanitizeBody']>[0],
  TContextOutLeft extends ReturnType<TLeft['sanitizeBody']>
>(left: TLeft, right: TRight): HasSanitizeBody<TContextInLeft, TContextOutLeft>;

// right has sanitizeBody and left doesn't
export function HTPipeSanitizeBody<
  TLeft extends OptionallyHasSanitizeBody<
    any,
    TRight extends HasSanitizeBody<any, any>
      ? Parameters<TRight['sanitizeBody']>[0]
      : any
  >,
  TRight extends HasSanitizeBody<any, any>,
  TContextInRight extends Parameters<TRight['sanitizeBody']>[0],
  TContextOutRight extends ReturnType<TRight['sanitizeBody']>[0]
>(
  left: TLeft,
  right: TRight
): HasSanitizeBody<TContextInRight, TContextOutRight>;

// left and right doesn't have sanitizeBody
export function HTPipeSanitizeBody<
  TLeft extends OptionallyHasSanitizeBody<
    any,
    TRight extends HasSanitizeBody<any, any>
      ? Parameters<TRight['sanitizeBody']>[0]
      : any
  >,
  TRight extends OptionallyHasSanitizeBody<any, any>
>(left: TLeft, right: TRight): {};

// main sanitizeBody HTPipe function
export function HTPipeSanitizeBody<
  TLeft extends OptionallyHasSanitizeBody<any, any>,
  TRight extends OptionallyHasSanitizeBody<any, any>,
  TContextInLeft extends TLeft extends HasSanitizeBody<any, any>
    ? Parameters<TLeft['sanitizeBody']>[0]
    : never
>(left: TLeft, right: TRight) {
  if (isHasSanitizeBody(left) && isHasSanitizeBody(right)) {
    return {
      sanitizeBody: (context: TContextInLeft) => {
        const leftOut = left.sanitizeBody(context) || {};
        const rightOut = right.sanitizeBody(leftOut) || {};
        return rightOut;
      },
    };
  } else if (isHasSanitizeBody(left)) {
    return { sanitizeBody: left.sanitizeBody };
  } else if (isHasSanitizeBody(right)) {
    return { sanitizeBody: right.sanitizeBody };
  } else {
    return {};
  }
}

// left has sanitizeResponse and right has sanitizeResponse
export function HTPipeSanitizeResponse<
  TLeft extends HasSanitizeResponse<
    any,
    TRight extends HasSanitizeResponse<any, any>
      ? Parameters<TRight['sanitizeResponse']>[0]
      : any
  >,
  TRight extends HasSanitizeResponse<any, any>,
  TContextInLeft extends Parameters<TLeft['sanitizeResponse']>[0],
  TContextOutRight extends ReturnType<TRight['sanitizeResponse']>
>(
  left: TLeft,
  right: TRight
): HasSanitizeResponse<TContextInLeft, TContextOutRight>;

// left has sanitizeResponse and right doesn't
export function HTPipeSanitizeResponse<
  TLeft extends HasSanitizeResponse<
    any,
    TRight extends HasSanitizeResponse<any, any>
      ? Parameters<TRight['sanitizeResponse']>[0]
      : any
  >,
  TRight extends MightHaveSanitizeResponse<any, any>,
  TContextInLeft extends Parameters<TLeft['sanitizeResponse']>[0],
  TContextOutLeft extends ReturnType<TLeft['sanitizeResponse']>
>(
  left: TLeft,
  right: TRight
): HasSanitizeResponse<TContextInLeft, TContextOutLeft>;

// right has sanitizeResponse and left doesn't
export function HTPipeSanitizeResponse<
  TLeft extends MightHaveSanitizeResponse<
    any,
    TRight extends HasSanitizeResponse<any, any>
      ? Parameters<TRight['sanitizeResponse']>[0]
      : any
  >,
  TRight extends HasSanitizeResponse<any, any>,
  TContextInRight extends Parameters<TRight['sanitizeResponse']>[0],
  TContextOutRight extends ReturnType<TRight['sanitizeResponse']>[0]
>(
  left: TLeft,
  right: TRight
): HasSanitizeResponse<TContextInRight, TContextOutRight>;

// left and right doesn't have sanitizeResponse
export function HTPipeSanitizeResponse<
  TLeft extends MightHaveSanitizeResponse<
    any,
    TRight extends HasSanitizeResponse<any, any>
      ? Parameters<TRight['sanitizeResponse']>[0]
      : any
  >,
  TRight extends MightHaveSanitizeResponse<any, any>
>(left: TLeft, right: TRight): {};

// main sanitizeResponse HTPipe function
export function HTPipeSanitizeResponse<
  TLeft extends MightHaveSanitizeResponse<any, any>,
  TRight extends MightHaveSanitizeResponse<any, any>,
  TContextInLeft extends TLeft extends HasSanitizeResponse<any, any>
    ? Parameters<TLeft['sanitizeResponse']>[0]
    : never
>(left: TLeft, right: TRight) {
  if (isHasSanitizeResponse(left) && isHasSanitizeResponse(right)) {
    return {
      sanitizeResponse: (context: TContextInLeft) => {
        const leftOut = left.sanitizeResponse(context) || {};
        const rightOut = right.sanitizeResponse(leftOut) || {};
        return rightOut;
      },
    };
  } else if (isHasSanitizeResponse(left)) {
    return { sanitizeResponse: left.sanitizeResponse };
  } else if (isHasSanitizeResponse(right)) {
    return { sanitizeResponse: right.sanitizeResponse };
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
