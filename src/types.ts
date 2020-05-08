export type Constructor<T = {}> = new (...args: any[]) => T;

export type PromiseOrSync<T> = Promise<T> | T;
export type PromiseResolveOrSync<T> = T extends Promise<infer U> ? U : T;

export interface HipWorkResponse<ResponseShape> {
  unsafeResponse: ResponseShape;
  status?: number;
}

export type AllAsyncStageKeys = 'attachData' | 'finalAuthorize' | 'doWork';
export type AllSyncStageKeys =
  | 'initPreContext'
  | 'sanitizeParams'
  | 'sanitizeBody'
  | 'preAuthorize'
  | 'respond'
  | 'sanitizeResponse';
export type AllStageKeys = AllAsyncStageKeys | AllSyncStageKeys;

export interface OptionallyHasInitPreContext<TUnsafe, TContextInit> {
  initPreContext?: (unsafe: TUnsafe) => TContextInit;
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

export interface MightHavePreAuthorize<TContextIn, TContextOut> {
  preAuthorize?: (context: TContextIn) => TContextOut;
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

export interface MightHaveRespond<TContextIn, TUnsafeResponse> {
  respond?: (context: TContextIn) => HipWorkResponse<TUnsafeResponse>;
}

export interface HasRespond<TContextIn, TUnsafeResponse> {
  respond: (context: TContextIn) => HipWorkResponse<TUnsafeResponse>;
}

export interface MightHaveSanitizeResponse<TUnsafeResponse, TResponse> {
  sanitizeResponse?: (context: TUnsafeResponse) => TResponse;
}

export interface HasSanitizeResponse<TUnsafeResponse, TResponse> {
  sanitizeResponse: (context: TUnsafeResponse) => TResponse;
}

export type HasAllRequireds = HasPreAuthorize<any, any> &
  HasFinalAuthorize<any, any> &
  HasRespond<any, any> &
  HasSanitizeResponse<any, any>;

export type HasAllNotRequireds = OptionallyHasInitPreContext<any, any> &
  OptionallyHasSanitizeParams<any, any> &
  OptionallyHasSanitizeBody<any, any> &
  OptionallyHasAttachData<any, any> &
  OptionallyHasDoWork<any, any>;

export type HasAllStagesNotOptionals = HasInitPreContext<any, any> &
  HasSanitizeParams<any, any> &
  HasSanitizeBody<any, any> &
  HasPreAuthorize<any, any> &
  HasAttachData<any, any> &
  HasFinalAuthorize<any, any> &
  HasDoWork<any, any> &
  HasRespond<any, any> &
  HasSanitizeResponse<any, any>;

export type HasAllStagesOptionals = OptionallyHasInitPreContext<any, any> &
  OptionallyHasSanitizeParams<any, any> &
  OptionallyHasSanitizeBody<any, any> &
  MightHavePreAuthorize<any, any> &
  OptionallyHasAttachData<any, any> &
  MightHaveFinalAuthorize<any, any> &
  OptionallyHasDoWork<any, any> &
  MightHaveRespond<any, any> &
  MightHaveSanitizeResponse<any, any>;

type IntersectProperties<T> = [T] extends [object]
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

type ObjectValueToAny<T, TKeyProperty extends string | symbol | number> = [
  T
] extends [object]
  ? { [key in keyof T]: any }
  : Record<TKeyProperty, T>;

type NotObjectCase<TOut, TKeyProperty extends string | symbol | number> = [
  TOut
] extends [object]
  ? TOut
  : Record<TKeyProperty, TOut>;

type ReturnedSomewhereUpToPreAuthorizeAuthorize<
  T,
  TOut,
  TKeyProperty extends string | symbol | number
> = [T] extends [HasSanitizeBody<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasSanitizeBody<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasSanitizeParams<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasSanitizeParams<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasInitPreContext<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasInitPreContext<any, NotObjectCase<TOut, TKeyProperty>>
  : never;

export type PreAuthReqsSatisfied<
  T extends HasPreAuthorize<any, any>
> = IntersectProperties<
  {
    [P in keyof Parameters<
      T['preAuthorize']
    >[0]]: ReturnedSomewhereUpToPreAuthorizeAuthorize<
      T,
      Parameters<T['preAuthorize']>[0][P],
      P
    >;
  }
>;

type OptionalAttachDataParams<T> = T extends HasAttachData<any, any>
  ? Parameters<T['attachData']>[0]
  : {};

type ReturnedSomewhereUpToAttachData<
  T,
  TOut,
  TKeyProperty extends string | symbol | number
> = [T] extends [HasPreAuthorize<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasPreAuthorize<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasSanitizeBody<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasSanitizeBody<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasSanitizeParams<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasSanitizeParams<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasInitPreContext<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasInitPreContext<any, NotObjectCase<TOut, TKeyProperty>>
  : never;

export type AttachDataReqsSatisfiedOptional<T> = IntersectProperties<
  {
    [P in keyof OptionalAttachDataParams<T>]: ReturnedSomewhereUpToAttachData<
      T,
      OptionalAttachDataParams<T>[P],
      P
    >;
  }
>;

type ReturnedSomewhereUpToFinalAuthorize<
  T,
  TOut,
  TKeyProperty extends string | symbol | number
> = [T] extends [HasAttachData<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasAttachData<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasPreAuthorize<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasPreAuthorize<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasSanitizeBody<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasSanitizeBody<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasSanitizeParams<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasSanitizeParams<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasInitPreContext<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasInitPreContext<any, NotObjectCase<TOut, TKeyProperty>>
  : never;

export type FinalAuthReqsSatisfied<
  T extends HasFinalAuthorize<any, any>
> = IntersectProperties<
  {
    [P in keyof Parameters<
      T['finalAuthorize']
    >[0]]: ReturnedSomewhereUpToFinalAuthorize<
      T,
      Parameters<T['finalAuthorize']>[0][P],
      P
    >;
  }
>;

type OptionalDoWorkParams<T> = T extends HasDoWork<any, any>
  ? Parameters<T['doWork']>[0]
  : {};

type ReturnedSomewhereUpToDoWork<
  T,
  TOut,
  TKeyProperty extends string | symbol | number
> = [T] extends [HasFinalAuthorize<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasFinalAuthorize<any, TOut>
  : [T] extends [HasAttachData<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasAttachData<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasPreAuthorize<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasPreAuthorize<any, TOut>
  : [T] extends [HasSanitizeBody<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasSanitizeBody<any, TOut>
  : [T] extends [HasSanitizeParams<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasSanitizeParams<any, TOut>
  : [T] extends [HasInitPreContext<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasInitPreContext<any, TOut>
  : never;

export type DoWorkReqsSatisfiedOptional<T> = IntersectProperties<
  {
    [P in keyof OptionalDoWorkParams<T>]: ReturnedSomewhereUpToDoWork<
      T,
      OptionalDoWorkParams<T>[P],
      P
    >;
  }
>;

type ReturnedSomewhereUpToRespond<
  T,
  TOut,
  TKeyProperty extends string | symbol | number
> = [T] extends [HasDoWork<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasDoWork<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasFinalAuthorize<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasFinalAuthorize<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasAttachData<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasAttachData<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasPreAuthorize<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasPreAuthorize<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasSanitizeBody<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasSanitizeBody<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasSanitizeParams<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasSanitizeParams<any, NotObjectCase<TOut, TKeyProperty>>
  : [T] extends [HasInitPreContext<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasInitPreContext<any, NotObjectCase<TOut, TKeyProperty>>
  : never;

export type RespondReqsSatisfied<
  T extends HasRespond<any, any>
> = IntersectProperties<
  {
    [P in keyof Parameters<T['respond']>[0]]: ReturnedSomewhereUpToRespond<
      T,
      Parameters<T['respond']>[0][P],
      P
    >;
  }
>;

type ReturnedSomewhereUpToSanitizeResponse<
  T,
  TOut,
  TKeyProperty extends string | symbol | number
> = [T] extends [HasRespond<any, ObjectValueToAny<TOut, TKeyProperty>>]
  ? HasRespond<any, NotObjectCase<TOut, TKeyProperty>>
  : never;

export type SanitizeResponseReqsSatisfied<
  T extends HasSanitizeResponse<any, any>
> = IntersectProperties<
  {
    [P in keyof Parameters<
      T['sanitizeResponse']
    >[0]]: ReturnedSomewhereUpToSanitizeResponse<
      T,
      Record<P, Parameters<T['sanitizeResponse']>[0][P]>,
      P
    >;
  }
>;

// Not Optionalized

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
