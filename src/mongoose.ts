import Boom from '@hapi/boom';
import { Constructor } from './types';

interface ModelWithFindById<TInstance = any> {
  findById(id: string): { exec(): Promise<TInstance> };
}

interface HasValidateSync {
  validateSync(paths?: any, options?: any): { errors: any[] };
}
interface HasToObject<T> {
  toObject(options?: any): T;
}

export function findByIdRequired(Model: ModelWithFindById) {
  // tslint:disable-next-line:only-arrow-functions
  return async function(id: string) {
    // prevent accidental searching for all from previous stages
    // (e.g. if someone forgot to make id param required in schema so
    // validation passes when it shouldn't - this example is b/c
    // mongoose won't initialize with invalid ObjectIds passed to it.
    if (!id || !id.toString()) {
      throw Boom.badRequest('Missing dependent resource ID');
    }
    const result = await Model.findById(id).exec();
    if (!result) {
      throw Boom.notFound('Resource not found');
    }
    return result;
  };
}

export function stripIdTransform(doc: any, ret: { _id: any }, options: any) {
  delete ret._id;
  return ret;
}

// @note for docs: NEVER use _id - mongoose gives it special treatment
// also, ALWAYS rememver to make required fields required cause mongoose will STRIP invalid fields first!
// figure out how to make that security gotcha harder to happen
export function WithParamsSanitized<
  TSafeParam extends ReturnType<TInstance['toObject']>,
  TModel extends Constructor<HasValidateSync & HasToObject<any>>,
  TInstance extends InstanceType<TModel>
>(Model: TModel) {
  // tslint:disable-next-line:only-arrow-functions
  return function<TSuper extends Constructor>(Super: TSuper) {
    return class WithSanitizedParams extends Super {
      constructor(...args: any[]) {
        super(...args);
      }
      public sanitizeParams(unsafeParams: any) {
        const doc = new Model(unsafeParams);
        const validateErrors = doc.validateSync();
        if (validateErrors !== undefined) {
          throw Boom.badRequest('Params not valid');
        }
        // @tswtf: why do I need to force this?!
        return doc.toObject({ transform: stripIdTransform }) as TSafeParam;
      }
    };
  };
}

// @note: sanitize body validates modified only!  This is cause you usually will only send fields to update.
export function WithBodySanitized<
  TSafeBody extends ReturnType<TInstance['toObject']>,
  TModel extends Constructor<HasValidateSync & HasToObject<any>>,
  TInstance extends InstanceType<TModel>
>(Model: TModel) {
  // tslint:disable-next-line:only-arrow-functions
  return function<TSuper extends Constructor>(Super: TSuper) {
    return class WithSanitizedBody extends Super {
      constructor(...args: any[]) {
        super(...args);
      }
      public sanitizeBody(unsafeBody: any) {
        const doc = new Model(unsafeBody);
        const validateErrors = doc.validateSync(undefined, {
          validateModifiedOnly: true,
        });
        if (validateErrors !== undefined) {
          throw Boom.badRequest('Body not valid');
        }
        // @tswtf: why do I need to force this?!
        return doc.toObject({ transform: stripIdTransform }) as TSafeBody;
      }
    };
  };
}

export function WithResponseSanitized<
  TSafeResponse extends ReturnType<TInstance['toObject']>,
  TModel extends Constructor<HasToObject<any>>,
  TInstance extends InstanceType<TModel>
>(Model: TModel) {
  // tslint:disable-next-line:only-arrow-functions
  return function<TSuper extends Constructor>(Super: TSuper) {
    return class WithSanitizedResponse extends Super {
      constructor(...args: any[]) {
        super(...args);
      }
      public sanitizeResponse(unsafeResponse: any) {
        const doc = new Model(unsafeResponse);
        // @tswtf: why do I need to force this?!
        return doc.toObject() as TSafeResponse;
      }
    };
  };
}

export function WithParamsSanitizedTo<
  TSuper extends Constructor,
  TSafeParam extends ReturnType<TInstance['toObject']>,
  TModel extends Constructor<HasValidateSync & HasToObject<any>>,
  TInstance extends InstanceType<TModel>
>(Super: TSuper, Model: TModel) {
  WithParamsSanitized(Model)(Super);
}

export function WithBodySanitizedTo<
  TSuper extends Constructor,
  TSafeBody extends ReturnType<TInstance['toObject']>,
  TModel extends Constructor<HasValidateSync & HasToObject<any>>,
  TInstance extends InstanceType<TModel>
>(Super: TSuper, Model: TModel) {
  WithBodySanitized(Model)(Super);
}

export function WithResponseSanitizedTo<
  TSuper extends Constructor,
  TSafeResponse extends ReturnType<TInstance['toObject']>,
  TModel extends Constructor<HasToObject<any>>,
  TInstance extends InstanceType<TModel>
>(Super: TSuper, Model: TModel) {
  WithResponseSanitized(Model)(Super);
}
