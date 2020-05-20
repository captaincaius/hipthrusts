export function InitPreContext<
  TContextIn extends object,
  TContextOut extends object
>(projector: (htCtx: TContextIn) => TContextOut) {
  return {
    initPreContext: projector,
  };
}

export function SanitizeParams<
  TContextIn extends object,
  TContextOut extends object
>(projector: (htCtx: TContextIn) => TContextOut) {
  return {
    sanitizeParams: projector,
  };
}

export function SanitizeBody<
  TContextIn extends object,
  TContextOut extends object
>(projector: (htCtx: TContextIn) => TContextOut) {
  return {
    sanitizeBody: projector,
  };
}

export function PreAuthorize<
  TContextIn extends object,
  TContextOut extends object | boolean
>(projector: (htCtx: TContextIn) => TContextOut) {
  return {
    preAuthorize: projector,
  };
}

export function AttachData<
  TContextIn extends object,
  TContextOut extends object
>(projector: (htCtx: TContextIn) => TContextOut) {
  return {
    attachData: projector,
  };
}

export function FinalAuthorize<
  TContextIn extends object,
  TContextOut extends object | boolean
>(projector: (htCtx: TContextIn) => TContextOut) {
  return {
    finalAuthorize: projector,
  };
}

export function DoWork<
  TContextIn extends object,
  TContextOut extends object | void
>(projector: (htCtx: TContextIn) => TContextOut) {
  return {
    doWork: projector,
  };
}

export function Respond<TContextIn extends object, TContextOut extends object>(
  projector: (htCtx: TContextIn) => TContextOut,
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

export function SanitizeResponse<
  TContextIn extends object,
  TContextOut extends object
>(projector: (htCtx: TContextIn) => TContextOut) {
  return {
    sanitizeResponse: projector,
  };
}
