import Boom from '@hapi/boom';
import { Constructor } from './types';

type SyncProjector<TNext, TSource> = (source: TSource) => TNext;

type AnySyncProjector = SyncProjector<any, any>;

type AsyncProjector<TNext, TSource> = (source: TSource) => Promise<TNext>;

type AnyAsyncProjector = AsyncProjector<any, any>;

export interface HasDataAttacher {
  attachData(): Promise<any>;
}

type IsFinalAuth<TPrincipal> = (principal: TPrincipal) => Promise<boolean>;

type IsPreAuth<TPrincipal> = (principal: TPrincipal) => boolean;

type FunctionTaking<TIn> = (param: TIn) => any;

type HasTypedFunctionOn<T, K extends string> = Record<K, FunctionTaking<T>>;

export function WithInit<
  TKnown,
  TSuperConstraint extends Constructor<TKnown>,
  TFrameworkKey extends string,
  TWhatYoullFind extends Parameters<TProjector>[0],
  TProjector extends AnySyncProjector,
  TNext extends ReturnType<TProjector>,
  TWhereToStore extends string
>(
  frameworkKey: TFrameworkKey,
  projector: TProjector,
  whereToStore: TWhereToStore
) {
  // tslint:disable-next-line:only-arrow-functions
  return function<TSuper extends TSuperConstraint>(
    Super: TSuper
  ): TSuper & Constructor<Record<TWhereToStore, TNext>> {
    // @ts-ignore
    return class WithInitData extends Super {
      // do-not-at-ts-ignore
      // [whereToStore]: TNext;
      constructor(...args: any[]) {
        super(...args);
        const req = args[0];
        (this as any)[whereToStore] = projector(req[frameworkKey]);
      }
    };
  };
}

export function WithPreAuth<TAuthorizer extends IsPreAuth<any>>(
  authorizer: TAuthorizer
) {
  // tslint:disable-next-line:only-arrow-functions
  return function<TSuper extends Constructor<Parameters<TAuthorizer>[0]>>(
    Super: TSuper
  ) {
    // @ts-ignore
    return class WithPreAuthorize extends Super {
      // do-not-at-ts-ignore
      // [whereToStore]: TNext;
      constructor(...args: any[]) {
        super(...args);
      }
      public preAuthorize() {
        // @todo: MAKE SURE THIS WORKS PROPERLY IF THERE'S GAPS IN THE PROTOTYPE CHAIN
        // i.e. chain doesn't break or double-call!!
        if (super.preAuthorize) {
          if (super.preAuthorize() !== true) {
            return false;
          }
        }
        return authorizer(this);
      }
    };
  };
}

export function WithResponse<
  TKnown,
  TSuperConstraint extends Constructor<
    Record<TWhereToLook, TWhatYoullFind> & TKnown
  >,
  TWhereToLook extends string,
  TWhatYoullFind,
  TWhereToStore extends string
>(whereToLook: TWhereToLook, successStatusCode: number) {
  // tslint:disable-next-line:only-arrow-functions
  return function<TSuper extends TSuperConstraint>(
    Super: TSuper
  ): TSuper &
    Constructor<Record<TWhereToStore, TWhatYoullFind> & HasDataAttacher> {
    // @ts-ignore
    return class WithResponseData extends Super {
      constructor(...args: any[]) {
        super(...args);
      }
      public response() {
        return {
          status: successStatusCode,
          unsafeResponse: (this as any)[whereToLook],
        };
      }
    };
  };
}

export function WithFinalAuth<TProjector extends AnyAsyncProjector>(
  projector: TProjector
) {
  // tslint:disable-next-line:only-arrow-functions
  return function<TSuper extends Constructor<Parameters<TProjector>[0]>>(
    Super: TSuper
  ) {
    // @ts-ignore
    return class WithFinalAuthorize extends Super {
      // do-not-at-ts-ignore
      // [whereToStore]: TNext;
      constructor(...args: any[]) {
        super(...args);
      }
      public async finalAuthorize() {
        // @todo: MAKE SURE THIS WORKS PROPERLY IF THERE'S GAPS IN THE PROTOTYPE CHAIN
        // i.e. chain doesn't break or double-call!!
        if (super.finalAuthorize) {
          if ((await super.finalAuthorize()) !== true) {
            return false;
          }
        }
        return await projector(this);
      }
    };
  };
}

type PromiseResolveType<T> = T extends Promise<infer R> ? R : never;

export function WithAttached<
  TKnown,
  TSuperConstraint extends Constructor<Record<any, TWhatYoullFind> & TKnown>,
  TWhatYoullFind extends Parameters<TProjector>[0],
  TProjector extends AnyAsyncProjector,
  TNext extends PromiseResolveType<ReturnType<TProjector>>,
  TWhereToStore extends string
>(projector: TProjector, whereToStore: TWhereToStore) {
  // tslint:disable-next-line:only-arrow-functions
  return function<TSuper extends TSuperConstraint>(
    Super: TSuper
  ): TSuper & Constructor<Record<TWhereToStore, TNext> & HasDataAttacher> {
    // @ts-ignore
    return class WithAttachData extends Super {
      // do-not-at-ts-ignore
      // [whereToStore]: TNext;
      constructor(...args: any[]) {
        super(...args);
      }
      public async attachData() {
        // @todo: MAKE SURE THIS WORKS PROPERLY IF THERE'S GAPS IN THE PROTOTYPE CHAIN
        // i.e. chain doesn't break or double-call!!
        if (super.attachData) {
          await super.attachData();
        }
        (this as any)[whereToStore] = await projector(this);
      }
    };
  };
}

export function WithDoWork<
  TProjector extends AnyAsyncProjector,
  TSuperConstraint extends Constructor<Record<any, any>>
>(projector: TProjector) {
  // tslint:disable-next-line:only-arrow-functions
  return function<TSuper extends TSuperConstraint>(
    Super: TSuper
  ): TSuper & Constructor<Record<any, any>> {
    // tslint:disable-next-line:no-shadowed-variable
    return class WithDoWork extends Super {
      constructor(...args: any[]) {
        super(...args);
      }
      public async doWork() {
        // @todo: MAKE SURE THIS WORKS PROPERLY IF THERE'S GAPS IN THE PROTOTYPE CHAIN
        // i.e. chain doesn't break or double-call!!
        if (super.doWork) {
          super.doWork();
        }
        await projector(this);
      }
    };
  };
}
