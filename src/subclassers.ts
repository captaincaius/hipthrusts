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
} from './types';

export function WithInit(
  projector: (context: any) => any
): HasInitPreContext<any, any> {
  return {
    initPreContext: projector,
  };
}

export function WithParams(
  projector: (context: any) => any
): HasSanitizeParams<any, any> {
  return {
    sanitizeParams: projector,
  };
}

export function WithBody(
  projector: (context: any) => any
): HasSanitizeBody<any, any> {
  return {
    sanitizeBody: projector,
  };
}

export function WithPreAuth(
  projector: (context: any) => any
): HasPreAuthorize<any, any> {
  return {
    preAuthorize: projector,
  };
}

export function WithAttached(
  projector: (context: any) => any
): HasAttachData<any, any> {
  return {
    attachData: projector,
  };
}

export function WithFinalAuth(
  projector: (context: any) => any
): HasFinalAuthorize<any, any> {
  return {
    finalAuthorize: projector,
  };
}

export function WithDoWork(
  projector: (context: any) => any
): HasDoWork<any, any> {
  return {
    doWork: projector,
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

export function WithSafeResponse(
  projector: (context: any) => any
): HasSanitizeResponse<any, any> {
  return {
    sanitizeResponse: projector,
  };
}
