import {
  HasAttachData,
  HasDoWork,
  HasFinalAuthorize,
  HasInitPreContext,
  HasPreAuthorize,
  HasRespond,
  PromiseResolveOrSync,
} from './types';

// @fixme: redo all these functionally!

type SyncProjector<TNext, TSource> = (source: TSource) => TNext;

type AnySyncProjector = SyncProjector<any, any>;

export interface HasDataAttacher {
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

export function WithInit(
  projector: AnySyncProjector
): HasInitPreContext<any, any> {
  return {
    initPreContext: projector,
  };
}

export function WithPreAuth(
  projector: PromiseResolveOrSync<any>
): HasPreAuthorize<any, any> {
  return {
    preAuthorize: projector,
  };
}

export function WithDoWork(
  projector: PromiseResolveOrSync<any>
): HasDoWork<any, any> {
  return {
    doWork: projector,
  };
}

export function WithFinalAuth(
  projector: PromiseResolveOrSync<any>
): HasFinalAuthorize<any, any> {
  return {
    finalAuthorize: projector,
  };
}

export function WithAttached(
  projector: PromiseResolveOrSync<any>
): HasAttachData<any, any> {
  return {
    attachData: projector,
  };
}

export function WithResponseFunctional<TWhereToLook extends string>(
  whereToLook: TWhereToLook,
  successStatusCode: number
): HasRespond<any, any> {
  return {
    respond: (context: any) => {
      return {
        unsafeResponse: context[whereToLook],
        status: successStatusCode,
      };
    },
  };
}
