export function WithInit(projector: (context: any) => any) {
  return {
    initPreContext: projector,
  };
}

export function WithParams(projector: (context: any) => any) {
  return {
    sanitizeParams: projector,
  };
}

export function WithBody(projector: (context: any) => any) {
  return {
    sanitizeBody: projector,
  };
}

export function WithPreAuth(projector: (context: any) => any) {
  return {
    preAuthorize: projector,
  };
}

export function WithAttached(projector: (context: any) => any) {
  return {
    attachData: projector,
  };
}

export function WithFinalAuth(projector: (context: any) => any) {
  return {
    finalAuthorize: projector,
  };
}

export function WithDoWork(projector: (context: any) => any) {
  return {
    doWork: projector,
  };
}

export function WithResponse<TWhereToLook extends string>(
  whereToLook: TWhereToLook,
  successStatusCode: number
) {
  return {
    respond: (context: any) => {
      return {
        unsafeResponse: context[whereToLook],
        status: successStatusCode,
      };
    },
  };
}

export function WithSafeResponse(projector: (context: any) => any) {
  return {
    sanitizeResponse: projector,
  };
}
