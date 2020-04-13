export type Constructor<T = {}> = new (...args: any[]) => T;

export type PromiseOrSync<T> = Promise<T> | T;
export type PromiseResolveOrSync<T> = T extends Promise<infer U> ? U : T;

export interface HipWorkResponse<ResponseShape> {
  unsafeResponse: ResponseShape;
  status?: number;
}

// @todo: maybe this needs some rework to ensure it's not express-biased
export interface HasInitPreContext<TUnsafe, TContextInit> {
  initPreContext: (unsafe: TUnsafe) => TContextInit;
}

// @todo: should all these contexts be constrained to be object-like?

export interface OptionallyHasSanitizeParams<TUnsafeParams, TSafeParams> {
  sanitizeParams?: (unsafeParams: TUnsafeParams) => TSafeParams;
}

export interface HasSanitizeParams<TUnsafeParams, TSafeParams> {
  sanitizeParams: (unsafeParams: TUnsafeParams) => TSafeParams;
}

export interface OptionallyHasSanitizeBody<TUnsafeBody, TSafeBody> {
  sanitizeBody?: (unsafeBody: TUnsafeBody) => TSafeBody;
}

export interface HasSanitizeBody<TUnsafeBody, TSafeBody> {
  sanitizeBody: (unsafeBody: TUnsafeBody) => TSafeBody;
}

// @todo: should TContextOut be constrained to be object-like or booly?
export interface HasPreAuthorize<TContextIn, TContextOut> {
  preAuthorize: (context: TContextIn) => TContextOut;
}

export interface OptionallyHasAttachData<TContextIn, TContextOut> {
  attachData?: (context: TContextIn) => PromiseOrSync<TContextOut>;
}

export interface HasAttachData<TContextIn, TContextOut> {
  attachData: (context: TContextIn) => PromiseOrSync<TContextOut>;
}

// @todo: should TContextOut be constrained to be object-like or booly?
export interface MightHaveFinalAuthorize<TContextIn, TContextOut> {
  finalAuthorize?: (context: TContextIn) => PromiseOrSync<TContextOut>;
}

export interface HasFinalAuthorize<TContextIn, TContextOut> {
  finalAuthorize: (context: TContextIn) => PromiseOrSync<TContextOut>;
}

export interface OptionallyHasDoWork<TContextIn, TContextOut> {
  doWork?: (context: TContextIn) => PromiseOrSync<TContextOut>;
}

export interface HasDoWork<TContextIn, TContextOut> {
  doWork: (context: TContextIn) => PromiseOrSync<TContextOut>;
}

export interface HasRespond<TContextIn, TUnsafeResponse> {
  respond: (context: TContextIn) => HipWorkResponse<TUnsafeResponse>;
}

export interface HasSanitizeResponse<TUnsafeResponse, TResponse> {
  sanitizeResponse: (context: TUnsafeResponse) => TResponse;
}

export type HasAllRequireds = HasPreAuthorize<any, any> &
  HasFinalAuthorize<any, any> &
  HasRespond<any, any> &
  HasSanitizeResponse<any, any>;
// @todo: We should also provide a Has* that Has* all the requireds and OptionallyHas*'s all the optionals.

type IntersectProperties<T> = T extends object
  ? { [K in keyof T]: (arg: T[K]) => void } extends Record<
      keyof T,
      (arg: infer A) => void
    >
    ? A
    : never
  : T;

/*
type Funcs = {
  a: () => void;
  v: (text: string) => number;
};
type IPFuncs = IntersectProperties<Funcs>;
// type IPFuncs = (() => void) & ((text: string) => number) 👍

type Foo = { a: string; b: number };
type Bar = IntersectProperties<Foo>;
// type Bar = string & number 😕
*/

// @todo These HasUpTo*'s below unfortunately don't give you a very good message :(
// Therefore, we should rebuild all the exported types from HasPreauthProper and on using IntersectProperties like so...
// It'll probably make all the code below HasBodyProper obsolete :)
/*
type ReturnedSomewhereUpToFinalAuthorize<T> = HasAttachData<any, T> | HasPreAuthorize<any, T>;

type FinalAuthReqsSatisfied<T extends HasFinalAuthorize<any, any>> = IntersectProperties<
  {
    [P in keyof Parameters<T['finalAuthorize']>[0]]: ReturnedSomewhereUpToFinalAuthorize<Record<P,Parameters<T['finalAuthorize']>[0][P]>>
  }
>;
*/
// Start with the "optionalized" section below

type AllInitsReqs = HasInitPreContext<any, any> &
  HasSanitizeParams<any, any> &
  HasSanitizeBody<any, any>;
export type HasInitPreContextProper<
  T extends HasPreAuthorize<any, any>
> = HasInitPreContext<any, Parameters<T['preAuthorize']>[0]['preContext']>;
export type HasParamsProper<
  T extends HasPreAuthorize<any, any>
> = HasSanitizeParams<any, Parameters<T['preAuthorize']>[0]['params']>;
export type HasBodyProper<
  T extends HasPreAuthorize<any, any>
> = HasSanitizeBody<any, Parameters<T['preAuthorize']>[0]['body']>;
interface AllInitsOut<T extends AllInitsReqs> {
  preContext: ReturnType<T['initPreContext']>;
  params: ReturnType<T['sanitizeParams']>;
  body: ReturnType<T['sanitizeBody']>;
}
type PreauthReqs = AllInitsReqs;
type PreauthReqsAndNext = PreauthReqs & HasAttachData<any, any>;
type PreauthOutputLeftoversNeeded<T extends PreauthReqsAndNext> = Omit<
  Parameters<T['attachData']>[0],
  keyof AllInitsOut<T>
>;
export type HasPreauthProper<T extends PreauthReqsAndNext> = HasPreAuthorize<
  any,
  {} extends PreauthOutputLeftoversNeeded<T>
    ? boolean | {}
    : PreauthOutputLeftoversNeeded<T>
>;
type PreauthOut<T extends PreauthReqs & HasPreAuthorize<any, any>> = ReturnType<
  T['preAuthorize']
> extends boolean
  ? AllInitsOut<T>
  : AllInitsOut<T> & ReturnType<T['preAuthorize']>;
export type HasUpToAttachDataProper<
  T extends PreauthReqsAndNext & HasPreAuthorize<any, any>
> = PreauthOut<T> extends Parameters<T['attachData']>[0] ? {} : never;

type AttachDataReqs = PreauthReqs & HasPreAuthorize<any, any>;
type AttachDataReqsAndNext = AttachDataReqs & HasFinalAuthorize<any, any>;
type AttachDataOutputLeftoversNeeded<T extends AttachDataReqsAndNext> = Omit<
  Parameters<T['finalAuthorize']>[0],
  keyof PreauthOut<T>
>;
export type HasAttachDataProper<
  T extends AttachDataReqsAndNext
> = HasAttachData<any, AttachDataOutputLeftoversNeeded<T>>;
type AttachDataOut<
  T extends AttachDataReqs & HasAttachData<any, any>
> = PreauthOut<T> & PromiseResolveOrSync<ReturnType<T['attachData']>>;
export type HasUpToFinalAuthorizeProper<
  T extends AttachDataReqsAndNext & HasAttachData<any, any>
> = AttachDataOut<T> extends Parameters<T['finalAuthorize']>[0] ? {} : never;

type FinalAuthorizeReqs = AttachDataReqsAndNext & HasAttachData<any, any>;
type FinalAuthorizeReqsAndNext = FinalAuthorizeReqs & HasDoWork<any, any>;
type FinalAuthorizeOutputLeftoversNeeded<
  T extends FinalAuthorizeReqsAndNext
> = Omit<Parameters<T['doWork']>[0], keyof AttachDataOut<T>>;
export type HasFinalAuthorizeProper<
  T extends FinalAuthorizeReqsAndNext
> = HasFinalAuthorize<
  any,
  {} extends FinalAuthorizeOutputLeftoversNeeded<T>
    ? boolean | {}
    : FinalAuthorizeOutputLeftoversNeeded<T>
>;
type FinalAuthorizeOut<
  T extends FinalAuthorizeReqs & HasFinalAuthorize<any, any>
> = PromiseResolveOrSync<ReturnType<T['finalAuthorize']>> extends boolean
  ? AttachDataOut<T>
  : AttachDataOut<T> & PromiseResolveOrSync<ReturnType<T['finalAuthorize']>>;
export type HasUpToDoWorkProper<
  T extends FinalAuthorizeReqsAndNext & HasFinalAuthorize<any, any>
> = FinalAuthorizeOut<T> extends Parameters<T['doWork']>[0] ? {} : never;

type DoWorkReqs = FinalAuthorizeReqsAndNext & HasFinalAuthorize<any, any>;
type DoWorkReqsAndNext = DoWorkReqs & HasRespond<any, any>;
type DoWorkOutputLeftoversNeeded<T extends DoWorkReqsAndNext> = Omit<
  Parameters<T['respond']>[0],
  keyof FinalAuthorizeOut<T>
>;
export type HasDoWorkProper<T extends DoWorkReqsAndNext> = HasDoWork<
  any,
  DoWorkOutputLeftoversNeeded<T>
>;
type DoWorkOut<T extends DoWorkReqs & HasDoWork<any, any>> = FinalAuthorizeOut<
  T
> &
  PromiseResolveOrSync<ReturnType<T['finalAuthorize']>>;
export type HasUpToRespondProper<
  T extends DoWorkReqsAndNext & HasDoWork<any, any>
> = DoWorkOut<T> extends Parameters<T['respond']>[0] ? {} : never;

type RespondReqs = DoWorkReqsAndNext & HasDoWork<any, any>;
type RespondReqsAndNext = RespondReqs & HasSanitizeResponse<any, any>;
export type HasRespondProper<
  T extends HasSanitizeResponse<any, any>
> = HasRespond<any, Parameters<T['sanitizeResponse']>[0]>;

// optionalized

export type HasInitPreContextProperOptionals<
  T extends HasPreAuthorize<any, any>
> = Parameters<T['preAuthorize']>[0]['preContext'] extends {}
  ? HasInitPreContext<any, Parameters<T['preAuthorize']>[0]['preContext']>
  : {};
export type HasParamsProperOptionals<
  T extends HasPreAuthorize<any, any>
> = Parameters<T['preAuthorize']>[0]['params'] extends {}
  ? HasSanitizeParams<any, Parameters<T['preAuthorize']>[0]['params']>
  : {};
export type HasBodyProperOptionals<
  T extends HasPreAuthorize<any, any>
> = Parameters<T['preAuthorize']>[0]['body'] extends {}
  ? HasSanitizeBody<any, Parameters<T['preAuthorize']>[0]['body']>
  : {};
type PreContextOutOptionals<T> = T extends HasInitPreContext<any, any>
  ? { preContext: ReturnType<T['initPreContext']> }
  : {};
type ParamsOutOptionals<T> = T extends HasSanitizeParams<any, any>
  ? { params: ReturnType<T['sanitizeParams']> }
  : {};
type BodyOutOptionals<T> = T extends HasSanitizeBody<any, any>
  ? { body: ReturnType<T['sanitizeBody']> }
  : {};
type AllInitsOutOptionals<T> = PreContextOutOptionals<T> &
  ParamsOutOptionals<T> &
  BodyOutOptionals<T>;

type PreauthOutputLeftoversNeededOptionals<T> = T extends HasAttachData<
  any,
  any
>
  ? Omit<Parameters<T['attachData']>[0], keyof AllInitsOutOptionals<T>>
  : {};
export type HasPreauthProperOptionals<T> = HasPreAuthorize<
  any,
  {} extends PreauthOutputLeftoversNeededOptionals<T>
    ? boolean | {}
    : PreauthOutputLeftoversNeededOptionals<T>
>;
type PreauthOutOptionals<T extends HasPreAuthorize<any, any>> = ReturnType<
  T['preAuthorize']
> extends boolean
  ? AllInitsOutOptionals<T>
  : AllInitsOutOptionals<T> & ReturnType<T['preAuthorize']>;
type AttachDataParamOptional<T> = T extends HasAttachData<any, any>
  ? Parameters<T['attachData']>[0]
  : {};
export type HasUpToAttachDataProperOptionals<
  T extends HasPreAuthorize<any, any>
> = PreauthOutOptionals<T> extends AttachDataParamOptional<T> ? {} : never;

type AttachDataReqsOptionals = HasPreAuthorize<any, any>;
type AttachDataReqsAndNextOptionals = AttachDataReqsOptionals &
  HasFinalAuthorize<any, any>;
type AttachDataOutputLeftoversNeededOptionals<
  T extends AttachDataReqsAndNextOptionals
> = Omit<Parameters<T['finalAuthorize']>[0], keyof PreauthOutOptionals<T>>;
export type HasAttachDataProperOptionals<
  T extends AttachDataReqsAndNextOptionals
> = {} extends AttachDataOutputLeftoversNeededOptionals<T>
  ? {}
  : HasAttachData<any, AttachDataOutputLeftoversNeededOptionals<T>>;
type AttachDataOutOptionals<
  T extends AttachDataReqsOptionals
> = T extends HasAttachData<any, any>
  ? PreauthOutOptionals<T> & PromiseResolveOrSync<ReturnType<T['attachData']>>
  : PreauthOutOptionals<T>;
export type HasUpToFinalAuthorizeProperOptionals<
  T extends AttachDataReqsAndNextOptionals
> = AttachDataOutOptionals<T> extends Parameters<T['finalAuthorize']>[0]
  ? {}
  : never;

type FinalAuthorizeReqsOptionals = AttachDataReqsAndNextOptionals;
type FinalAuthorizeReqsAndNextOptionals = FinalAuthorizeReqsOptionals;
type FinalAuthorizeOutputLeftoversNeededOptionals<
  T extends FinalAuthorizeReqsAndNextOptionals
> = T extends HasDoWork<any, any>
  ? Omit<Parameters<T['doWork']>[0], keyof AttachDataOutOptionals<T>>
  : {};
export type HasFinalAuthorizeProperOptionals<
  T extends FinalAuthorizeReqsAndNextOptionals
> = HasFinalAuthorize<
  any,
  {} extends FinalAuthorizeOutputLeftoversNeededOptionals<T>
    ? boolean | {}
    : FinalAuthorizeOutputLeftoversNeededOptionals<T>
>;
type FinalAuthorizeOutOptionals<
  T extends FinalAuthorizeReqsOptionals & HasFinalAuthorize<any, any>
> = PromiseResolveOrSync<ReturnType<T['finalAuthorize']>> extends boolean
  ? AttachDataOutOptionals<T>
  : AttachDataOutOptionals<T> &
      PromiseResolveOrSync<ReturnType<T['finalAuthorize']>>;
type DoWorkParamOptional<T> = T extends HasDoWork<any, any>
  ? Parameters<T['doWork']>[0]
  : {};
export type HasUpToDoWorkProperOptionals<
  T extends FinalAuthorizeReqsAndNextOptionals & HasFinalAuthorize<any, any>
> = FinalAuthorizeOutOptionals<T> extends DoWorkParamOptional<T> ? {} : never;

type DoWorkReqsOptionals = FinalAuthorizeReqsAndNextOptionals &
  HasFinalAuthorize<any, any>;
type DoWorkReqsAndNextOptionals = DoWorkReqsOptionals & HasRespond<any, any>;
type DoWorkOutputLeftoversNeededOptionals<
  T extends DoWorkReqsAndNextOptionals
> = Omit<Parameters<T['respond']>[0], keyof FinalAuthorizeOutOptionals<T>>;
export type HasDoWorkProperOptionals<
  T extends DoWorkReqsAndNextOptionals
> = {} extends DoWorkOutputLeftoversNeededOptionals<T>
  ? {}
  : HasDoWork<any, DoWorkOutputLeftoversNeededOptionals<T>>;
type DoWorkOutOptionals<
  T extends DoWorkReqsOptionals
> = FinalAuthorizeOutOptionals<T> &
  PromiseResolveOrSync<ReturnType<T['finalAuthorize']>>;
export type HasUpToRespondProperOptionals<
  T extends DoWorkReqsAndNextOptionals
> = DoWorkOutOptionals<T> extends Parameters<T['respond']>[0] ? {} : never;

type RespondReqsOptionals = DoWorkReqsAndNextOptionals;
type RespondReqsAndNextOptionals = RespondReqsOptionals &
  HasSanitizeResponse<any, any>;
export type HasRespondProperOptionals<
  T extends HasSanitizeResponse<any, any>
> = HasRespond<any, Parameters<T['sanitizeResponse']>[0]>;
