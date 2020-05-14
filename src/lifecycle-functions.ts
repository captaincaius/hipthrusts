export function InitPreContext(projector: (context: any) => any) {
  return {
    initPreContext: projector,
  };
}

export function SanitizeParams(projector: (context: any) => any) {
  return {
    sanitizeParams: projector,
  };
}

export function SanitizeBody(projector: (context: any) => any) {
  return {
    sanitizeBody: projector,
  };
}

export function PreAuthorize(projector: (context: any) => any) {
  return {
    preAuthorize: projector,
  };
}

export function AttachData(projector: (context: any) => any) {
  return {
    attachData: projector,
  };
}

export function FinalAuthorize(projector: (context: any) => any) {
  return {
    finalAuthorize: projector,
  };
}

export function DoWork(projector: (context: any) => any) {
  return {
    doWork: projector,
  };
}

export function Respond(
  projector: (htCtx: any) => any,
  successStatusCode: number
) {
  return {
    respond: (htCtx: any) => {
      return {
        unsafeResponse: projector(htCtx),
        status: successStatusCode,
      };
    },
  };
}

export function SanitizeResponse(projector: (context: any) => any) {
  return {
    sanitizeResponse: projector,
  };
}
