import Boom from '@hapi/boom';
import { WithAttached, WithDoWork } from './subclassers';
import { Constructor } from './types';
// tslint:disable-next-line:no-var-requires
const mask = require('json-mask');

interface ModelWithFindById<TInstance = any> {
  findById(id: string): { exec(): Promise<TInstance> };
}

interface HasValidateSync {
  validateSync(paths?: any, options?: any): { errors: any[] };
}
interface HasToObject<T> {
  toObject(options?: any): T;
}

export function htMongooseFactory(mongoose: any) {
  function findByIdRequired(Model: ModelWithFindById) {
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

  function stripIdTransform(doc: any, ret: { _id: any }, options: any) {
    delete ret._id;
    return ret;
  }

  function deepWipeDefault(obj: any): any {
    if (Array.isArray(obj)) {
      // if this looks weird, realize that "enum" takes an array ;)
      return obj.map(elm => deepWipeDefault(elm));
    } else if (typeof obj === 'object' && !obj.instanceOfSchema) {
      return Object.keys(obj).reduce((acc, key) => {
        return {
          ...acc,
          ...(key === 'default' ? {} : { [key]: deepWipeDefault(obj[key]) }),
        };
      }, {});
    } else {
      return obj;
    }
  }

  function dtoSchemaObj(schemaConfigObject: any, maskConfig: string) {
    return deepWipeDefault(mask(schemaConfigObject, maskConfig));
  }

  type DocumentFactory<T> = (
    obj: any,
    ...rest: any
  ) => HasValidateSync & HasToObject<T>;

  function documentFactoryFromForRequest(schemaConfigObject: any) {
    const schema = new mongoose.Schema(schemaConfigObject, {
      _id: false,
      id: false,
    });

    return (initializerPojo: any) =>
      new mongoose.Document(initializerPojo, schema);
  }

  function documentFactoryFromForResponse(schemaConfigObject: any) {
    const schema = new mongoose.Schema(schemaConfigObject, {
      _id: true,
      id: true,
    });

    return (initializerPojo: any) =>
      new mongoose.Document(initializerPojo, schema);
  }

  // @note for docs: NEVER use _id - mongoose gives it special treatment
  // also, ALWAYS rememver to make required fields required cause mongoose will STRIP invalid fields first!
  // figure out how to make that security gotcha harder to happen
  function WithParamsSanitized<
    TSafeParam extends ReturnType<TInstance['toObject']>,
    TDocFactory extends DocumentFactory<any>,
    TInstance extends ReturnType<TDocFactory>
  >(DocFactory: TDocFactory) {
    // tslint:disable-next-line:only-arrow-functions
    return function<TSuper extends Constructor>(Super: TSuper) {
      return class WithSanitizedParams extends Super {
        constructor(...args: any[]) {
          super(...args);
        }
        public sanitizeParams(unsafeParams: any) {
          const doc = DocFactory(unsafeParams);
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

  function WithSaveOnDocument(entityToCreate: string) {
    return WithDoWork(async requestData => {
      if (Object.keys(requestData).includes(entityToCreate)) {
        return await requestData[entityToCreate].save();
      } else {
        throw Boom.badRequest('Resource not found');
      }
    });
  }

  function WithUpdateByBody(entityToUpdate: string, updateWithEntity: string) {
    return WithDoWork(async requestData => {
      if (Object.keys(requestData).includes(entityToUpdate)) {
        await requestData[entityToUpdate].set(requestData[updateWithEntity]);
        return await requestData[entityToUpdate].save();
      } else {
        throw Boom.badRequest('Resource not found');
      }
    });
  }

  // @note: sanitize body validates modified only!  This is cause you usually will only send fields to update.
  function WithBodySanitized<
    TSafeBody extends ReturnType<TInstance['toObject']>,
    TDocFactory extends DocumentFactory<any>,
    TInstance extends ReturnType<TDocFactory>
  >(DocFactory?: TDocFactory) {
    // tslint:disable-next-line:only-arrow-functions
    return function<TSuper extends Constructor>(Super: TSuper) {
      return class WithSanitizedBody extends Super {
        constructor(...args: any[]) {
          super(...args);
        }
        public sanitizeBody(unsafeBody: any) {
          if (DocFactory) {
            const doc = DocFactory(unsafeBody);
            const validateErrors = doc.validateSync(undefined, {
              validateModifiedOnly: true,
            });
            if (validateErrors !== undefined) {
              throw Boom.badRequest('Body not valid');
            }
            // @tswtf: why do I need to force this?!
            return doc.toObject({ transform: stripIdTransform }) as TSafeBody;
          } else {
            return {};
          }
        }
      };
    };
  }

  function WithGetRequestBodyIgnored() {
    return WithBodySanitized();
  }

  function WithResponseSanitized<
    TSafeResponse extends ReturnType<TInstance['toObject']>,
    TDocFactory extends DocumentFactory<any>,
    TInstance extends ReturnType<TDocFactory>
  >(DocFactory: TDocFactory) {
    // tslint:disable-next-line:only-arrow-functions
    return function<TSuper extends Constructor>(Super: TSuper) {
      return class WithSanitizedResponse extends Super {
        constructor(...args: any[]) {
          super(...args);
        }
        public sanitizeResponse(unsafeResponse: any) {
          const doc = DocFactory(unsafeResponse.toObject());
          // @tswtf: why do I need to force this?!
          return doc.toObject() as TSafeResponse;
        }
      };
    };
  }

  function WithPojoToDocument(
    pojoKey: string,
    modelClass: any,
    newDocKey: string
  ) {
    return WithAttached(
      pojoKey,
      pojo => Promise.resolve(new modelClass(pojo)),
      newDocKey
    );
  }

  function WithParamsSanitizedTo<
    TSuper extends Constructor,
    TSafeParam extends ReturnType<TInstance['toObject']>,
    TDocFactory extends DocumentFactory<any>,
    TInstance extends ReturnType<TDocFactory>
  >(Super: TSuper, DocFactory: TDocFactory) {
    WithParamsSanitized(DocFactory)(Super);
  }

  function WithBodySanitizedTo<
    TSuper extends Constructor,
    TSafeBody extends ReturnType<TInstance['toObject']>,
    TDocFactory extends DocumentFactory<any>,
    TInstance extends ReturnType<TDocFactory>
  >(Super: TSuper, DocFactory: TDocFactory) {
    WithBodySanitized(DocFactory)(Super);
  }

  function WithResponseSanitizedTo<
    TSuper extends Constructor,
    TSafeResponse extends ReturnType<TInstance['toObject']>,
    TDocFactory extends DocumentFactory<any>,
    TInstance extends ReturnType<TDocFactory>
  >(Super: TSuper, DocFactory: TDocFactory) {
    WithResponseSanitized(DocFactory)(Super);
  }

  return {
    WithBodySanitized,
    WithBodySanitizedTo,
    WithGetRequestBodyIgnored,
    WithParamsSanitized,
    WithParamsSanitizedTo,
    WithPojoToDocument,
    WithResponseSanitized,
    WithResponseSanitizedTo,
    WithSaveOnDocument,
    WithUpdateByBody,
    documentFactoryFromForRequest,
    documentFactoryFromForResponse,
    dtoSchemaObj,
    findByIdRequired,
    stripIdTransform,
  };
}
