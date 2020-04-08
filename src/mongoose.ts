import Boom from '@hapi/boom';
import { WithAttached } from './subclassers';
import {
  Constructor,
  HasDoWork,
  HasSanitizeBody,
  HasSanitizeParams,
  HasSanitizeResponse,
} from './types';
// tslint:disable-next-line:no-var-requires
const mask = require('json-mask');

interface ModelWithFindById<TInstance = any> {
  findById(id: string): { exec(): Promise<TInstance> };
}

interface ModelWithFindOne<TInstance = any> {
  findOne(options: any): { exec(): Promise<TInstance> };
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

  function findOneByRequired(Model: ModelWithFindOne, fieldName: string) {
    // tslint:disable-next-line:only-arrow-functions
    return async function(fieldValue: any) {
      if (!fieldValue || !fieldValue.toString()) {
        throw Boom.badRequest('Missing dependent resource value');
      }
      const result = await Model.findOne({
        [fieldName]: {
          $eq: fieldValue,
        },
      }).exec();
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
    TInstance extends ReturnType<TDocFactory>,
    TUnsafeParam
  >(DocFactory: TDocFactory): HasSanitizeParams<TSafeParam, TUnsafeParam> {
    return {
      sanitizeParams: (unsafeParams: TUnsafeParam) => {
        const doc = DocFactory(unsafeParams);
        const validateErrors = doc.validateSync();
        if (validateErrors !== undefined) {
          throw Boom.badRequest('Params not valid');
        }
        // @tswtf: why do I need to force this?!
        return doc.toObject({ transform: stripIdTransform }) as TSafeParam;
      },
    };
  }

  function WithSaveOnDocument(
    propertyKeyOfDocument: string
  ): HasDoWork<any, any> {
    return {
      doWork: async (context: any) => {
        if (context[propertyKeyOfDocument]) {
          try {
            return await context[propertyKeyOfDocument].save();
          } catch (err) {
            throw Boom.badData(
              'Unable to save. Please check if data sent was valid.'
            );
          }
        } else {
          throw Boom.badRequest('Resource not found');
        }
      },
    };
  }

  function WithUpdateDocument(
    propertyKeyOfDocument: string,
    propertyKeyWithNewData: string = 'body'
  ): HasDoWork<any, any> {
    return {
      doWork: async (context: any) => {
        if (context[propertyKeyOfDocument]) {
          return await context[propertyKeyOfDocument].set(
            context[propertyKeyWithNewData]
          );
        } else {
          throw Boom.badRequest('Resource not found');
        }
      },
    };
  }

  // @note: sanitize body validates modified only!  This is cause you usually will only send fields to update.
  function WithBodySanitized<
    TSafeBody extends ReturnType<TInstance['toObject']>,
    TDocFactory extends DocumentFactory<any>,
    TInstance extends ReturnType<TDocFactory>,
    TUnsafeBody
  >(DocFactory: TDocFactory): HasSanitizeBody<TSafeBody, TUnsafeBody> {
    return {
      sanitizeBody: (unsafeBody: TUnsafeBody) => {
        const doc = DocFactory(unsafeBody);
        const validateErrors = doc.validateSync(undefined, {
          validateModifiedOnly: true,
        });
        if (validateErrors !== undefined) {
          throw Boom.badRequest('Body not valid');
        }
        // @tswtf: why do I need to force this?!
        return doc.toObject({ transform: stripIdTransform }) as TSafeBody;
      },
    };
  }

  function WithRequestBodyIgnored() {
    return WithBodySanitized(
      documentFactoryFromForRequest(dtoSchemaObj({}, ''))
    );
  }

  function WithResponseSanitized<
    TSafeResponse extends ReturnType<TInstance['toObject']>,
    TDocFactory extends DocumentFactory<any>,
    TInstance extends ReturnType<TDocFactory>
  >(DocFactory: TDocFactory): HasSanitizeResponse<any, any> {
    return {
      sanitizeResponse: (unsafeResponse: any) => {
        const doc = DocFactory(unsafeResponse);
        // @tswtf: why do I need to force this?!
        return doc.toObject() as TSafeResponse;
      },
    };
  }

  function WithPojoToDocument(modelClass: any) {
    return WithAttached((pojo: any) => Promise.resolve(new modelClass(pojo)));
  }

  return {
    WithBodySanitized,
    WithParamsSanitized,
    WithPojoToDocument,
    WithRequestBodyIgnored,
    WithResponseSanitized,
    WithSaveOnDocument,
    documentFactoryFromForRequest,
    documentFactoryFromForResponse,
    dtoSchemaObj,
    findByIdRequired,
    findOneByRequired,
    stripIdTransform,
  };
}
