import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

// tslint:disable-next-line:no-var-requires
const { describe, it } = require('mocha');

import { HTPipe, HTPipeOld, WithAttached, WithInit } from '../src';
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
  MightHaveFinalAuthorize,
  MightHavePreAuthorize,
  MightHaveRespond,
  MightHaveSanitizeResponse,
  OptionallyHasAttachData,
  OptionallyHasDoWork,
  OptionallyHasInitPreContext,
  OptionallyHasSanitizeBody,
  OptionallyHasSanitizeParams,
  PromiseResolveOrSync,
} from '../src/types';

use(chaiAsPromised);

interface MockUser {
  _id: string;
  email: string;
}

type lifecycleTypeValid<
  TPipeIn,
  TPipeOut,
  TPipeContextIn,
  TPipeContextOut
> = TPipeIn extends TPipeContextIn
  ? TPipeContextIn extends TPipeIn
    ? TPipeOut extends TPipeContextOut
      ? TPipeContextOut extends TPipeOut
        ? true
        : never
      : never
    : never
  : never;

async function HTPipeTest<
  TPipe extends OptionallyHasInitPreContext<any, any> &
    OptionallyHasSanitizeParams<any, any> &
    OptionallyHasSanitizeBody<any, any> &
    MightHavePreAuthorize<any, any> &
    OptionallyHasAttachData<any, any> &
    MightHaveFinalAuthorize<any, any> &
    OptionallyHasDoWork<any, any> &
    MightHaveRespond<any, any> &
    MightHaveSanitizeResponse<any, any>,
  TPipeIn,
  TPipeOut,
  TValid extends TPipe extends HasInitPreContext<any, any>
    ? lifecycleTypeValid<
        TPipeIn,
        TPipeOut,
        Parameters<TPipe['initPreContext']>[0],
        ReturnType<TPipe['initPreContext']>
      >
    : TPipe extends HasSanitizeParams<any, any>
    ? lifecycleTypeValid<
        TPipeIn,
        TPipeOut,
        Parameters<TPipe['sanitizeParams']>[0],
        ReturnType<TPipe['sanitizeParams']>
      >
    : TPipe extends HasSanitizeBody<any, any>
    ? lifecycleTypeValid<
        TPipeIn,
        TPipeOut,
        Parameters<TPipe['sanitizeBody']>[0],
        ReturnType<TPipe['sanitizeBody']>
      >
    : TPipe extends HasPreAuthorize<any, any>
    ? lifecycleTypeValid<
        TPipeIn,
        TPipeOut,
        Parameters<TPipe['preAuthorize']>[0],
        ReturnType<TPipe['preAuthorize']>
      >
    : TPipe extends HasAttachData<any, any>
    ? lifecycleTypeValid<
        TPipeIn,
        TPipeOut,
        Parameters<TPipe['attachData']>[0],
        PromiseResolveOrSync<ReturnType<TPipe['attachData']>>
      >
    : TPipe extends HasFinalAuthorize<any, any>
    ? lifecycleTypeValid<
        TPipeIn,
        TPipeOut,
        Parameters<TPipe['finalAuthorize']>[0],
        PromiseResolveOrSync<ReturnType<TPipe['finalAuthorize']>>
      >
    : TPipe extends HasDoWork<any, any>
    ? lifecycleTypeValid<
        TPipeIn,
        TPipeOut,
        Parameters<TPipe['doWork']>[0],
        PromiseResolveOrSync<ReturnType<TPipe['doWork']>>
      >
    : TPipe extends HasRespond<any, any>
    ? lifecycleTypeValid<
        TPipeIn,
        TPipeOut,
        Parameters<TPipe['respond']>[0],
        ReturnType<TPipe['respond']>
      >
    : TPipe extends HasSanitizeResponse<any, any>
    ? lifecycleTypeValid<
        TPipeIn,
        TPipeOut,
        Parameters<TPipe['sanitizeResponse']>[0],
        ReturnType<TPipe['sanitizeResponse']>
      >
    : {} extends TPipe
    ? {} extends TPipeIn
      ? {} extends TPipeOut
        ? true
        : never
      : never
    : never
>(
  pipe: TPipe,
  lifecycleStage:
    | 'empty'
    | 'initPreContext'
    | 'sanitizeParams'
    | 'sanitizeBody'
    | 'preAuthorize'
    | 'attachData'
    | 'finalAuthorize'
    | 'doWork'
    | 'respond'
    | 'sanitizeResponse',
  pipeIn: TPipeIn,
  pipeOut: TPipeOut,
  valid: TValid
) {
  if (lifecycleStage !== 'empty') {
    const pipedLifecycleStage = pipe[lifecycleStage];

    if (pipedLifecycleStage) {
      let pipedLifecycleStageResult: any;
      if (
        lifecycleStage === 'attachData' ||
        lifecycleStage === 'doWork' ||
        lifecycleStage === 'finalAuthorize'
      ) {
        pipedLifecycleStageResult = await pipedLifecycleStage(pipeIn);
      } else {
        pipedLifecycleStageResult = pipedLifecycleStage(pipeIn);
      }
      if (
        pipedLifecycleStageResult &&
        typeof pipedLifecycleStageResult === 'object'
      ) {
        expect(Object.keys(pipedLifecycleStageResult).length).to.be.equal(
          Object.keys(pipeOut).length
        );
        if (Object.keys(pipedLifecycleStageResult).length > 0) {
          Object.keys(pipeOut).forEach(key => {
            expect(pipedLifecycleStageResult).to.has.property(key);
            expect(pipedLifecycleStageResult[key]).to.be.equal(
              (pipeOut as any)[key]
            );
          });
        }
      } else if (
        pipedLifecycleStageResult &&
        typeof pipedLifecycleStageResult === 'boolean'
      ) {
        expect(pipedLifecycleStageResult).to.be.equal(pipeOut);
      }
    } else {
      // tslint:disable-next-line:no-unused-expression
      expect(pipedLifecycleStage).to.not.be.empty;
    }
  } else {
    expect(pipe).to.be.eql({});
  }
}

describe('HipThrusTS', () => {
  /*
  describe('HipThrusTS declarative', () => {
    describe('WithInit', () => {
      class Base {
        public existingField = 'Hyrule';
        constructor(...args: any[]) {
          // empty - tslint shutup
        }
      }
      const AddUserFromReqUser = WithInit(
        'user',
        (user: MockUser) => user,
        'user_user'
      );

      const UserAddedRequest = AddUserFromReqUser(Base);

      const req = { user: { _id: 'link', email: 'link@example.com' } };
      const hipRequestInstance = new UserAddedRequest(req);
      it('attaches a properly typed member to all request instances', () => {
        // tslint:disable-next-line:prefer-const
        let isToMockUserTypeOkay: typeof hipRequestInstance.user_user extends MockUser
          ? true
          : false;
        let isFromMockUserTypeOkay: MockUser extends typeof hipRequestInstance.user_user
          ? true
          : false;
        // @ts-expect-error
        isToMockUserTypeOkay = false;
        // @ts-expect-error
        isFromMockUserTypeOkay = false;

        // tslint:disable-next-line:prefer-const
        let fromMockUserIdTypeIsOkay: typeof hipRequestInstance.user_user._id extends string
          ? true
          : false;
        // @ts-expect-error
        fromMockUserIdTypeIsOkay = false;

        // tslint:disable-next-line:prefer-const
        let mockUserEmailTypeIsOkay: typeof hipRequestInstance.user_user.email extends string
          ? true
          : false;
        // @ts-expect-error
        mockUserEmailTypeIsOkay = false;

        expect(hipRequestInstance.user_user.email).to.be.equal(
          'link@example.com'
        );
      });
      it('retains the base class members', () => {
        // tslint:disable-next-line:prefer-const
        let existingFieldTypeIsOkay: typeof hipRequestInstance.existingField extends string
          ? true
          : false;
        // @ts-expect-error
        existingFieldTypeIsOkay = false;

        expect(hipRequestInstance.existingField).to.be.equal('Hyrule');
      });
    });
    describe('WithAttached', () => {
      const AddThingIdFromParams = WithAttached(
        'params',
        (params: { id: string }) => Promise.resolve(params.id),
        'thingId'
      );

      // todo: add test to ensure synchronous projectors are rejected
      // todo: add test to check for race conditions

      it('compile-time-errors-out when extending a class that lacks the right member', () => {
        class BaseWithoutParams {
          public existingField = 'Hyrule';
          constructor(...args: any[]) {
            // empty - tslint shutup
          }
        }
        // @todo: fix like the HTPipeOld stuff (no assign) - this may not actually work!
        // tslint:disable-next-line:prefer-const
        let typeFromBaseWithoutParamsIsOkay: typeof BaseWithoutParams extends Parameters<
          typeof AddThingIdFromParams
        >[0]
          ? true
          : false = false;
        let typeToBaseWithoutParamsIsOkay: Parameters<
          typeof AddThingIdFromParams
        >[0] extends typeof BaseWithoutParams
          ? true
          : false = false;
        // @ts-expect-error
        typeFromBaseWithoutParamsIsOkay = true;
        // @ts-expect-error
        typeToBaseWithoutParamsIsOkay = true;
      });
      it('compile-time-errors-out when extending a class that has the right member but it does not satisfy the projector', () => {
        class BaseWithMistypedParams {
          public existingField = 'Hyrule';
          public params = {};
          constructor(...args: any[]) {
            // empty - tslint shutup
          }
        }
        // @todo: fix like the HTPipeOld stuff (no assign) - this may not actually work!
        // tslint:disable-next-line:prefer-const
        let typeFromBaseWithMistypedParamsIsOkay: typeof BaseWithMistypedParams extends Parameters<
          typeof AddThingIdFromParams
        >[0]
          ? true
          : false = false;
        let typeToBaseWithMistypedParamsIsOkay: Parameters<
          typeof AddThingIdFromParams
        >[0] extends typeof BaseWithMistypedParams
          ? true
          : false = false;
        // @ts-expect-error
        typeFromBaseWithMistypedParamsIsOkay = true;
        // @ts-expect-error
        typeToBaseWithMistypedParamsIsOkay = true;
      });
      describe('with a proper superclass', () => {
        class BaseWithProperParams {
          public existingField = 'Hyrule';
          public params = { id: 'stringy', somethingelse: 1986 };
          constructor(...args: any[]) {
            // empty - tslint shutup
          }
        }
        it('pleases the compiler', () => {
          // @todo: fix like the HTPipeOld stuff (no assign) - this may not actually work!
          // tslint:disable-next-line:prefer-const
          let typeIsOkay: typeof BaseWithProperParams extends Parameters<
            typeof AddThingIdFromParams
          >[0]
            ? true
            : false = true;
          // @ts-expect-error
          typeIsOkay = false;
        });
        describe('when wrapping it and creating an instance', () => {
          const RequestWithParamId = AddThingIdFromParams(BaseWithProperParams);

          const req = {};
          const requestWithParamId = new RequestWithParamId(req);
          it('news up an instance with the new member typed properly', () => {
            // tslint:disable-next-line:prefer-const
            let thingIdTypeIsOkay: typeof requestWithParamId.thingId extends string
              ? true
              : false;
            // @ts-expect-error
            thingIdTypeIsOkay = false;
          });
          it('news up instances that retain the base class members and type them properly', () => {
            // tslint:disable-next-line:prefer-const
            let thingIdTypeIsOkay: typeof requestWithParamId.existingField extends string
              ? true
              : false;
            // @ts-expect-error
            thingIdTypeIsOkay = false;

            expect(requestWithParamId.existingField).to.be.equal('Hyrule');
          });
          it('news up instances that have the attachData lifecycle stage', () => {
            // tslint:disable-next-line:prefer-const
            let thingIdFromTypeIsOkay: ReturnType<
              typeof requestWithParamId.attachData
            > extends Promise<any>
              ? true
              : false = true;
            let thingIdToTypeIsOkay: Promise<any> extends ReturnType<
              typeof requestWithParamId.attachData
            >
              ? true
              : false = true;
            // @ts-expect-error
            thingIdFromTypeIsOkay = false;
            // @ts-expect-error
            thingIdToTypeIsOkay = false;
          });
          describe('after calling attachData', () => {
            it('news up instances that can call the attachData lifecycle stage', async () => {
              await requestWithParamId.attachData();
              expect(requestWithParamId.thingId).to.be.equal('stringy');
            });
          });
        });
      });
    });
    describe('htPipe', () => {
      interface Grandparent {
        gName: string;
        parent: {
          pName: string;
          child: {
            name: string;
            age: number;
          };
        };
      }
      const AddWholeFamily = HTPipeOld(
        WithAttached(
          'grandparent',
          (grandparent: Grandparent) => Promise.resolve(grandparent.parent),
          'parent'
        ),
        WithAttached(
          'parent',
          parent => Promise.resolve(parent.child),
          'child'
        ),
        WithAttached(
          'grandparent',
          grandparent => Promise.resolve(grandparent.gName),
          'gName'
        ),
        WithAttached(
          'child',
          (child: { name: string; age: number; boyfriend: string }) =>
            Promise.resolve(child.age),
          'childAge'
        )
      );
      class BaseWithProperParams {
        public grandparent = {
          favFood: 'Veggies',
          gName: 'Gramps',
          parent: {
            child: { name: 'Zelda', age: 33, boyfriend: 'Link' },
            pName: 'Daphnes',
          },
        };
        public existingField = 'Hyrule';
        constructor(...args: any[]) {
          // empty - tslint shutup
        }
      }
      const HappyFamily = AddWholeFamily(BaseWithProperParams);
      const happyFamily = new HappyFamily();
      it('gets properly typed members from all composers', () => {
        // these two are to ensure it's not "any" :-/
        // do NOT assign the next one!  TS is too smart for its own good
        // tslint:disable-next-line:prefer-const
        let isTypedRightFromChildAge: typeof happyFamily.childAge extends number
          ? true
          : false = true;
        // tslint:disable-next-line:prefer-const
        let isTypedRightToChildAge: number extends typeof happyFamily.childAge
          ? true
          : false = true;
        // @ts-expect-error
        isTypedRightFromChildAge = false;
        // @ts-expect-error
        isTypedRightToChildAge = false;
        // just make sure the other two exist cause the above ensures they're properly typed
        let happyFamilyParentExistType: typeof happyFamily.parent extends any
          ? true
          : false;
        let happyFamilyChildExistType: typeof happyFamily.child extends any
          ? true
          : false;
        // @ts-expect-error
        happyFamilyParentExistType = false;
        // @ts-expect-error
        happyFamilyChildExistType = false;
      });
      it('gets all members after attachData() is called', async () => {
        await happyFamily.attachData();
        expect(happyFamily.childAge).to.be.equal(33);
      });
    });
  });
*/
  describe('Hipthrusts functional only', () => {
    // @todo: add test coverage for non-explicit-type-specification too!
    // @todo: add test coverage for SINGLE-OPERATOR and ZERO-OPERATOR pipes
    // @todo: add test coverage for TRIPLE-OPERATOR pipes
    // @todo: add test coverage for QUADRUPLE-AND-MORE-OPERATOR pipes (use empty objects)
    // @todo: add test coverage for multi-stage operators

    describe('HTPipe2', () => {
      it('works with three operators', () => {
        const left = {
          attachData(context: { a: string }) {
            return { b: 4 };
          },
        };

        const midNotCovered = {
          attachData(context: { d: number }) {
            return { e: 4 };
          },
        };

        const rightFullyCovered = {
          attachData(context: { b: number }) {
            return { c: 4 };
          },
        };

        const triple = HTPipe(left, midNotCovered, rightFullyCovered);
      });
      it('attaches properly typed data from left and right sync data attacher', async () => {
        const aPassedIn = 'some string';
        const bPassedIn = 4;
        const cReturned = 6;
        const left = {
          attachData(context: { a: string }) {
            expect(context.a).to.be.equal(aPassedIn);
            return { b: bPassedIn };
          },
        };

        const rightFullyCovered = {
          attachData(context: { b: number }) {
            expect(context.b).to.be.equal(bPassedIn);
            return { c: cReturned };
          },
        };

        const pipedAtoBC = HTPipe(left, rightFullyCovered);

        await HTPipeTest(
          pipedAtoBC,
          'attachData',
          { a: aPassedIn },
          { b: bPassedIn, c: cReturned },
          true
        );

        async function HTPipeTypeMismatchTest() {
          await HTPipeTest(
            pipedAtoBC,
            'attachData',
            { a: aPassedIn },
            { b: bPassedIn },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedAtoBC,
            'attachData',
            {},
            { b: bPassedIn, c: cReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedAtoBC,
            'attachData',
            { a: aPassedIn },
            { b: bPassedIn, c: cReturned, other: 'some string' },
            // @ts-expect-error
            true
          );
        }
      });
      it('attaches right sync output instead of left sync output if right output sync transform left output type', async () => {
        const aPassedIn = 5;
        const bPassedIn = 'some string';
        const bReturned = 4;

        const left = {
          attachData(context: { a: number }) {
            expect(context.a).to.be.equal(aPassedIn);
            return { b: bPassedIn };
          },
        };

        const rightTransformLeftOutputType = {
          attachData(context: { b: string }) {
            expect(context.b).to.be.equal(bPassedIn);
            return { b: bReturned };
          },
        };

        const pipedAToBStringToBNumber = HTPipe(
          left,
          rightTransformLeftOutputType
        );

        await HTPipeTest(
          pipedAToBStringToBNumber,
          'attachData',
          { a: aPassedIn },
          { b: bReturned },
          true
        );

        async function HTPipeTypeMismatchTest() {
          await HTPipeTest(
            pipedAToBStringToBNumber,
            'attachData',
            { a: aPassedIn },
            { b: bPassedIn },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedAToBStringToBNumber,
            'attachData',
            {},
            { b: bReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedAToBStringToBNumber,
            'attachData',
            { a: aPassedIn },
            {},
            // @ts-expect-error
            true
          );
        }
      });
      it('attaches properly typed data from left sync data attacher and right not fully covered sync data attacher', async () => {
        const aPassedIn = 'some string';
        const bReturned = 4;
        const otherPassedIn = 'other string';
        const cReturned = 6;

        const left = {
          attachData(context: { a: string }) {
            expect(context.a).to.be.equal(aPassedIn);
            return { b: bReturned };
          },
        };

        const rightPartiallyCovered = {
          attachData(context: { b: number; other: string }) {
            expect(context.other).to.be.equal(otherPassedIn);
            expect(context.b).to.be.equal(bReturned);
            return { c: cReturned };
          },
        };

        const pipedAOtoBC1 = HTPipe(left, rightPartiallyCovered);

        await HTPipeTest(
          pipedAOtoBC1,
          'attachData',
          { a: aPassedIn, other: otherPassedIn },
          { b: bReturned, c: cReturned },
          true
        );

        async function HTPipeTypeMismatchTest() {
          await HTPipeTest(
            pipedAOtoBC1,
            'attachData',
            { a: aPassedIn, other: otherPassedIn },
            { b: bReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedAOtoBC1,
            'attachData',
            {},
            { b: bReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedAOtoBC1,
            'attachData',
            { a: aPassedIn },
            {},
            // @ts-expect-error
            true
          );
        }
      });
      it('attaches data from left sync data attached and right not covered sync data attacher', async () => {
        const aPassedIn = 'some string';
        const otherPassedIn = 'other string';
        const bReturned = 4;
        const cReturned = 6;

        const left = {
          attachData(context: { a: string }) {
            expect(context.a).to.be.equal(aPassedIn);
            return { b: bReturned };
          },
        };
        const rightNotCovered = {
          attachData(context: { other: string }) {
            expect(context.other).to.be.equal(otherPassedIn);
            return { c: cReturned };
          },
        };

        const pipedNotCovered = HTPipe(left, rightNotCovered);

        await HTPipeTest(
          pipedNotCovered,
          'attachData',
          { a: aPassedIn, other: otherPassedIn },
          { b: bReturned, c: cReturned },
          true
        );

        async function HTPipeTypeMismatchTest() {
          await HTPipeTest(
            pipedNotCovered,
            'attachData',
            { a: aPassedIn, other: otherPassedIn },
            { b: bReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedNotCovered,
            'attachData',
            {},
            { b: bReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedNotCovered,
            'attachData',
            { a: aPassedIn },
            {},
            // @ts-expect-error
            true
          );
        }
      });
      it('attaches properly typed data from left sync data attacher only', async () => {
        const aPassedIn = 'some string';
        const bReturned = 4;

        const left = {
          attachData(context: { a: string }) {
            expect(context.a).to.be.equals(aPassedIn);
            return { b: bReturned };
          },
        };

        const pipedLeftOnly = HTPipe(left, {});

        await HTPipeTest(
          pipedLeftOnly,
          'attachData',
          { a: aPassedIn },
          { b: bReturned },
          true
        );

        async function HTPipeTypeMismatchTest() {
          await HTPipeTest(
            pipedLeftOnly,
            'attachData',
            { a: aPassedIn, someOtherParam: 'some string' },
            { b: bReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedLeftOnly,
            'attachData',
            {},
            { b: bReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedLeftOnly,
            'attachData',
            { a: aPassedIn },
            {},
            // @ts-expect-error
            true
          );
        }
      });
      it('attaches properly typed data from right sync data attacher only', async () => {
        const bPassedIn = 5;
        const otherPassedIn = 'other string';
        const cReturned = 4;

        const rightPartiallyCovered = {
          attachData(context: { b: number; other: string }) {
            expect(context.b).to.be.equal(bPassedIn);
            expect(context.other).to.be.equal(otherPassedIn);
            return { c: cReturned };
          },
        };

        const pipedRightOnly = HTPipe({}, rightPartiallyCovered);

        await HTPipeTest(
          pipedRightOnly,
          'attachData',
          { b: bPassedIn, other: otherPassedIn },
          { c: cReturned },
          true
        );

        async function HTPipeTypeMismatchTest() {
          await HTPipeTest(
            pipedRightOnly,
            'attachData',
            {
              b: bPassedIn,
              other: otherPassedIn,
              someOtherParam: 'some string',
            },
            { c: cReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedRightOnly,
            'attachData',
            {},
            { c: cReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedRightOnly,
            'attachData',
            { b: bPassedIn },
            {},
            // @ts-expect-error
            true
          );
        }
      });
      it('no attaches data when left and right is empty objects', async () => {
        const pipedWithEmptyObjectsOnly = HTPipe({}, {});

        await HTPipeTest(pipedWithEmptyObjectsOnly, 'empty', {}, {}, true);

        async function HTPipeTypeMismatchTest() {
          await HTPipeTest(
            pipedWithEmptyObjectsOnly,
            'empty',
            { a: 'some string' },
            {},
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedWithEmptyObjectsOnly,
            'empty',
            {},
            { b: 'some string' },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedWithEmptyObjectsOnly,
            'empty',
            { a: 'some string' },
            { b: 'some string' },
            // @ts-expect-error
            true
          );
        }
      });
      it('no attaches data when left sync outputs have type mismatch with right inputs', () => {
        const leftBad = {
          attachData(context: { a: string }) {
            return { b: 'bad' };
          },
        };
        const rightFullyCovered = {
          attachData(context: { b: number }) {
            return { c: 4 };
          },
        };

        function expectErrorWithHTPipe2() {
          // @ts-expect-error
          const pipedError = HTPipe(leftBad, rightFullyCovered);
        }
      });

      // async paths

      it('attaches properly typed data from left and right async data attacher', async () => {
        const aPassedIn = 'some string';
        const bPassedIn = 4;
        const cReturned = 6;

        const left = {
          attachData(context: { a: string }) {
            expect(context.a).to.be.equal(aPassedIn);
            return Promise.resolve({ b: bPassedIn });
          },
        };

        const rightFullyCovered = {
          attachData(context: { b: number }) {
            expect(context.b).to.be.equal(bPassedIn);
            return Promise.resolve({ c: cReturned });
          },
        };

        const pipedAtoBC = HTPipe(left, rightFullyCovered);

        await HTPipeTest(
          pipedAtoBC,
          'attachData',
          { a: aPassedIn },
          { b: bPassedIn, c: cReturned },
          true
        );

        async function HTPipeTypeMismatchTest() {
          await HTPipeTest(
            pipedAtoBC,
            'attachData',
            { a: aPassedIn },
            { b: bPassedIn },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedAtoBC,
            'attachData',
            {},
            { b: bPassedIn, c: cReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedAtoBC,
            'attachData',
            { a: aPassedIn },
            { b: bPassedIn, c: cReturned, other: 'some string' },
            // @ts-expect-error
            true
          );
        }
      });
      it('attaches right async output instead of left async output if right output async transform left output type', async () => {
        const aPassedIn = 5;
        const bPassedIn = 'some string';
        const bReturned = 6;

        const left = {
          attachData(context: { a: number }) {
            expect(context.a).to.be.equal(aPassedIn);
            return Promise.resolve({ b: bPassedIn });
          },
        };

        const rightTransformLeftOutputType = {
          attachData(context: { b: string }) {
            expect(context.b).to.be.equal(bPassedIn);
            return Promise.resolve({ b: bReturned });
          },
        };

        const pipedAToBStringToBNumber = HTPipe(
          left,
          rightTransformLeftOutputType
        );

        async function HTPipeTypeMismatchTest() {
          await HTPipeTest(
            pipedAToBStringToBNumber,
            'attachData',
            { a: aPassedIn },
            { b: bPassedIn },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedAToBStringToBNumber,
            'attachData',
            {},
            { b: bReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedAToBStringToBNumber,
            'attachData',
            { a: aPassedIn },
            {},
            // @ts-expect-error
            true
          );
        }
      });
      it('attaches properly typed data from left async data attacher and right not fully covered async data attacher', async () => {
        const aPassedIn = 'some string';
        const bPassedIn = 4;
        const otherPassedIn = 'other string';
        const cReturned = 6;

        const left = {
          attachData(context: { a: string }) {
            expect(context.a).to.be.equal(aPassedIn);
            return Promise.resolve({ b: bPassedIn });
          },
        };
        const rightPartiallyCovered = {
          attachData(context: { b: number; other: string }) {
            expect(context.b).to.be.equal(bPassedIn);
            expect(context.other).to.be.equal(otherPassedIn);
            return Promise.resolve({ c: cReturned });
          },
        };
        const pipedAOtoBC1 = HTPipe(left, rightPartiallyCovered);

        await HTPipeTest(
          pipedAOtoBC1,
          'attachData',
          { a: aPassedIn, other: otherPassedIn },
          { b: bPassedIn, c: cReturned },
          true
        );

        async function HTPipeTypeMismatchTest() {
          await HTPipeTest(
            pipedAOtoBC1,
            'attachData',
            { a: aPassedIn, other: otherPassedIn },
            { b: bPassedIn },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedAOtoBC1,
            'attachData',
            {},
            { b: bPassedIn },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedAOtoBC1,
            'attachData',
            { a: aPassedIn },
            {},
            // @ts-expect-error
            true
          );
        }
      });
      it('attaches data from left async data attached and right not covered async data attacher', async () => {
        const aPassedIn = 'some string';
        const otherPassedIn = 'other string';
        const bReturned = 4;
        const cReturned = 6;

        const left = {
          attachData(context: { a: string }) {
            expect(context.a).to.be.equal(aPassedIn);
            return Promise.resolve({ b: bReturned });
          },
        };
        const rightNotCovered = {
          attachData(context: { other: string }) {
            expect(context.other).to.be.equal(otherPassedIn);
            return Promise.resolve({ c: cReturned });
          },
        };

        const pipedNotCovered = HTPipe(left, rightNotCovered);

        await HTPipeTest(
          pipedNotCovered,
          'attachData',
          { a: aPassedIn, other: otherPassedIn },
          { b: bReturned, c: cReturned },
          true
        );

        async function HTPipeTypeMismatchTest() {
          await HTPipeTest(
            pipedNotCovered,
            'attachData',
            { a: aPassedIn, other: otherPassedIn },
            { b: bReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedNotCovered,
            'attachData',
            {},
            { b: bReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedNotCovered,
            'attachData',
            { a: aPassedIn },
            {},
            // @ts-expect-error
            true
          );
        }
      });
      it('attaches properly typed data from left async data attacher only', async () => {
        const aPassedIn = 'some string';
        const bReturned = 4;

        const left = {
          attachData(context: { a: string }) {
            expect(context.a).to.be.equal(aPassedIn);
            return Promise.resolve({ b: bReturned });
          },
        };

        const pipedLeftOnly = HTPipe(left, {});

        await HTPipeTest(
          pipedLeftOnly,
          'attachData',
          { a: aPassedIn },
          { b: bReturned },
          true
        );

        async function HTPipeTypeMismatchTest() {
          await HTPipeTest(
            pipedLeftOnly,
            'attachData',
            { a: aPassedIn, someOtherParam: 'some string' },
            { b: bReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedLeftOnly,
            'attachData',
            {},
            { b: bReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedLeftOnly,
            'attachData',
            { a: aPassedIn },
            {},
            // @ts-expect-error
            true
          );
        }
      });
      it('attaches properly typed data from right async data attacher only', async () => {
        const bPassedIn = 6;
        const otherPassedIn = 'other string';
        const cReturned = 4;

        const rightPartiallyCovered = {
          attachData(context: { b: number; other: string }) {
            expect(context.b).to.be.equal(bPassedIn);
            expect(context.other).to.be.equal(otherPassedIn);
            return Promise.resolve({ c: cReturned });
          },
        };

        const pipedRightOnly = HTPipe({}, rightPartiallyCovered);

        await HTPipeTest(
          pipedRightOnly,
          'attachData',
          { b: bPassedIn, other: otherPassedIn },
          { c: cReturned },
          true
        );

        async function HTPipeTypeMismatchTest() {
          await HTPipeTest(
            pipedRightOnly,
            'attachData',
            {
              b: bPassedIn,
              other: otherPassedIn,
              someOtherParam: 'some string',
            },
            { c: cReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedRightOnly,
            'attachData',
            {},
            { c: cReturned },
            // @ts-expect-error
            true
          );

          await HTPipeTest(
            pipedRightOnly,
            'attachData',
            { b: bPassedIn },
            {},
            // @ts-expect-error
            true
          );
        }
      });
      it('no attaches data when left async outputs have type mismatch with right inputs', () => {
        const leftBad = {
          attachData(context: { a: string }) {
            return Promise.resolve({ b: 'bad' });
          },
        };
        const rightFullyCovered = {
          attachData(context: { b: number }) {
            return Promise.resolve({ c: 4 });
          },
        };

        function expectErrorWithHTPipe2() {
          // @ts-expect-error
          const pipedError = HTPipe(leftBad, rightFullyCovered);
        }
      });
    });
  });
});

// @fixme: MAKE TESTS OUT OF EVERYTHING BELOW!
// cover withDefault cases too
// for each stage cover:
// - happy path from previous stage normal
// - happy path from way before normal
// - happy path from previous stage with extra keys in object PROVIDED
// - happy path from way before normal with extra keys in object PROVIDED
// - sad path missing that particular key altogether
// - sad path provided by previous but type mismatch
// - sad path ONLY PARTIALLY provided by previous (e.g. provided params: {a: string}, requesting params: {a: string, b: number})
// - sad path provided by way before but type mismatch
// - sad path ONLY PARTIALLY provided way before (e.g. provided params: {a: string}, requesting params: {a: string, b: number})
/*
const blah2 = {
    initPreContext() {
        return {};
    },
    sanitizeParams() {
        return {
            ting: 5
        };
    },
    sanitizeBody() {
        return {
            ting: 5
        };
    },
    preAuthorize(context: {params: {ting: number}, body: {}}) {
        return {asdf: {ting: 4}};
    },
    attachData(context: {asdf: {ting: number}}) {
        return {adOut: 4, ddd: "hi"};
    },
    finalAuthorize(context: {ddd: string}) {
        return {};
    },
    doWork(context: {}) {
      return {};
    },
    respond(context: {}) {
      return {unsafeResponse: {}};
    },
    sanitizeResponse(unsafeResponse: {}) {
      return {};
    }
}
hipExpressHandlerFactory(blah2);
*/
