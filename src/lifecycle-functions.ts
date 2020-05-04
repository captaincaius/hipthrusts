import {
  HasAttachData,
  HasDoWork,
  HasFinalAuthorize,
  HasInitPreContext,
  HasPreAuthorize,
  HasRespond,
  PromiseResolveOrSync,
} from './types';

export function WithInit(
  projector: (context: any) => any
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

export function WithResponse<TWhereToLook extends string>(
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
