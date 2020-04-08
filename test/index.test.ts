import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import { HTPipe, HTPipeAttachData, WithAttached, WithInit } from '../src';
import { PromiseOrSync } from '../src/types';

use(chaiAsPromised);

interface MockUser {
  _id: string;
  email: string;
}

describe('HipThrusTS', () => {
  // Bellow we have commented tests for old hipthrusts class implementation
  // It's needed because in a future we will bring back the posibility for hipthrusts to guess the type of new function in HTPipe
  // describe('HipThrusTS declarative', () => {
  //   describe('WithInit', () => {
  //     class Base {
  //       public existingField = 'Hyrule';
  //       constructor(...args: any[]) {
  //         // empty - tslint shutup
  //       }
  //     }
  //     const AddUserFromReqUser = WithInit(
  //       'user',
  //       (user: MockUser) => user,
  //       'user_user'
  //     );

  //     const UserAddedRequest = AddUserFromReqUser(Base);

  //     const req = { user: { _id: 'link', email: 'link@example.com' } };
  //     const hipRequestInstance = new UserAddedRequest(req);
  //     it('attaches a properly typed member to all request instances', () => {
  //       // tslint:disable-next-line:prefer-const
  //       let isToMockUserTypeOkay: typeof hipRequestInstance.user_user extends MockUser
  //         ? true
  //         : false;
  //       let isFromMockUserTypeOkay: MockUser extends typeof hipRequestInstance.user_user
  //         ? true
  //         : false;
  //       // @ts-expect-error
  //       isToMockUserTypeOkay = false;
  //       // @ts-expect-error
  //       isFromMockUserTypeOkay = false;

  //       // tslint:disable-next-line:prefer-const
  //       let fromMockUserIdTypeIsOkay: typeof hipRequestInstance.user_user._id extends string
  //         ? true
  //         : false;
  //       // @ts-expect-error
  //       fromMockUserIdTypeIsOkay = false;

  //       // tslint:disable-next-line:prefer-const
  //       let mockUserEmailTypeIsOkay: typeof hipRequestInstance.user_user.email extends string
  //         ? true
  //         : false;
  //       // @ts-expect-error
  //       mockUserEmailTypeIsOkay = false;

  //       expect(hipRequestInstance.user_user.email).to.be.equal(
  //         'link@example.com'
  //       );
  //     });
  //     it('retains the base class members', () => {
  //       // tslint:disable-next-line:prefer-const
  //       let existingFieldTypeIsOkay: typeof hipRequestInstance.existingField extends string
  //         ? true
  //         : false;
  //       // @ts-expect-error
  //       existingFieldTypeIsOkay = false;

  //       expect(hipRequestInstance.existingField).to.be.equal('Hyrule');
  //     });
  //   });
  //   describe('WithAttached', () => {
  //     const AddThingIdFromParams = WithAttached(
  //       'params',
  //       (params: { id: string }) => Promise.resolve(params.id),
  //       'thingId'
  //     );

  //     // todo: add test to ensure synchronous projectors are rejected
  //     // todo: add test to check for race conditions

  //     it('compile-time-errors-out when extending a class that lacks the right member', () => {
  //       class BaseWithoutParams {
  //         public existingField = 'Hyrule';
  //         constructor(...args: any[]) {
  //           // empty - tslint shutup
  //         }
  //       }
  //       // @todo: fix like the HTPipe stuff (no assign) - this may not actually work!
  //       // tslint:disable-next-line:prefer-const
  //       let typeFromBaseWithoutParamsIsOkay: typeof BaseWithoutParams extends Parameters<
  //         typeof AddThingIdFromParams
  //       >[0]
  //         ? true
  //         : false = false;
  //       let typeToBaseWithoutParamsIsOkay: Parameters<
  //         typeof AddThingIdFromParams
  //       >[0] extends typeof BaseWithoutParams
  //         ? true
  //         : false = false;
  //       // @ts-expect-error
  //       typeFromBaseWithoutParamsIsOkay = true;
  //       // @ts-expect-error
  //       typeToBaseWithoutParamsIsOkay = true;
  //     });
  //     it('compile-time-errors-out when extending a class that has the right member but it does not satisfy the projector', () => {
  //       class BaseWithMistypedParams {
  //         public existingField = 'Hyrule';
  //         public params = {};
  //         constructor(...args: any[]) {
  //           // empty - tslint shutup
  //         }
  //       }
  //       // @todo: fix like the HTPipe stuff (no assign) - this may not actually work!
  //       // tslint:disable-next-line:prefer-const
  //       let typeFromBaseWithMistypedParamsIsOkay: typeof BaseWithMistypedParams extends Parameters<
  //         typeof AddThingIdFromParams
  //       >[0]
  //         ? true
  //         : false = false;
  //       let typeToBaseWithMistypedParamsIsOkay: Parameters<
  //         typeof AddThingIdFromParams
  //       >[0] extends typeof BaseWithMistypedParams
  //         ? true
  //         : false = false;
  //       // @ts-expect-error
  //       typeFromBaseWithMistypedParamsIsOkay = true;
  //       // @ts-expect-error
  //       typeToBaseWithMistypedParamsIsOkay = true;
  //     });
  //     describe('with a proper superclass', () => {
  //       class BaseWithProperParams {
  //         public existingField = 'Hyrule';
  //         public params = { id: 'stringy', somethingelse: 1986 };
  //         constructor(...args: any[]) {
  //           // empty - tslint shutup
  //         }
  //       }
  //       it('pleases the compiler', () => {
  //         // @todo: fix like the HTPipe stuff (no assign) - this may not actually work!
  //         // tslint:disable-next-line:prefer-const
  //         let typeIsOkay: typeof BaseWithProperParams extends Parameters<
  //           typeof AddThingIdFromParams
  //         >[0]
  //           ? true
  //           : false = true;
  //         // @ts-expect-error
  //         typeIsOkay = false;
  //       });
  //       describe('when wrapping it and creating an instance', () => {
  //         const RequestWithParamId = AddThingIdFromParams(BaseWithProperParams);

  //         const req = {};
  //         const requestWithParamId = new RequestWithParamId(req);
  //         it('news up an instance with the new member typed properly', () => {
  //           // tslint:disable-next-line:prefer-const
  //           let thingIdTypeIsOkay: typeof requestWithParamId.thingId extends string
  //             ? true
  //             : false;
  //           // @ts-expect-error
  //           thingIdTypeIsOkay = false;
  //         });
  //         it('news up instances that retain the base class members and type them properly', () => {
  //           // tslint:disable-next-line:prefer-const
  //           let thingIdTypeIsOkay: typeof requestWithParamId.existingField extends string
  //             ? true
  //             : false;
  //           // @ts-expect-error
  //           thingIdTypeIsOkay = false;

  //           expect(requestWithParamId.existingField).to.be.equal('Hyrule');
  //         });
  //         it('news up instances that have the attachData lifecycle stage', () => {
  //           // tslint:disable-next-line:prefer-const
  //           let thingIdFromTypeIsOkay: ReturnType<
  //             typeof requestWithParamId.attachData
  //           > extends Promise<any>
  //             ? true
  //             : false = true;
  //           let thingIdToTypeIsOkay: Promise<any> extends ReturnType<
  //             typeof requestWithParamId.attachData
  //           >
  //             ? true
  //             : false = true;
  //           // @ts-expect-error
  //           thingIdFromTypeIsOkay = false;
  //           // @ts-expect-error
  //           thingIdToTypeIsOkay = false;
  //         });
  //         describe('after calling attachData', () => {
  //           it('news up instances that can call the attachData lifecycle stage', async () => {
  //             await requestWithParamId.attachData();
  //             expect(requestWithParamId.thingId).to.be.equal('stringy');
  //           });
  //         });
  //       });
  //     });
  //   });
  //   describe('htPipe', () => {
  //     interface Grandparent {
  //       gName: string;
  //       parent: {
  //         pName: string;
  //         child: {
  //           name: string;
  //           age: number;
  //         };
  //       };
  //     }
  //     const AddWholeFamily = HTPipe(
  //       WithAttached(
  //         'grandparent',
  //         (grandparent: Grandparent) => Promise.resolve(grandparent.parent),
  //         'parent'
  //       ),
  //       WithAttached(
  //         'parent',
  //         parent => Promise.resolve(parent.child),
  //         'child'
  //       ),
  //       WithAttached(
  //         'grandparent',
  //         grandparent => Promise.resolve(grandparent.gName),
  //         'gName'
  //       ),
  //       WithAttached(
  //         'child',
  //         (child: { name: string; age: number; boyfriend: string }) =>
  //           Promise.resolve(child.age),
  //         'childAge'
  //       )
  //     );
  //     class BaseWithProperParams {
  //       public grandparent = {
  //         favFood: 'Veggies',
  //         gName: 'Gramps',
  //         parent: {
  //           child: { name: 'Zelda', age: 33, boyfriend: 'Link' },
  //           pName: 'Daphnes',
  //         },
  //       };
  //       public existingField = 'Hyrule';
  //       constructor(...args: any[]) {
  //         // empty - tslint shutup
  //       }
  //     }
  //     const HappyFamily = AddWholeFamily(BaseWithProperParams);
  //     const happyFamily = new HappyFamily();
  //     it('gets properly typed members from all composers', () => {
  //       // these two are to ensure it's not "any" :-/
  //       // do NOT assign the next one!  TS is too smart for its own good
  //       // tslint:disable-next-line:prefer-const
  //       let isTypedRightFromChildAge: typeof happyFamily.childAge extends number
  //         ? true
  //         : false = true;
  //       // tslint:disable-next-line:prefer-const
  //       let isTypedRightToChildAge: number extends typeof happyFamily.childAge
  //         ? true
  //         : false = true;
  //       // @ts-expect-error
  //       isTypedRightFromChildAge = false;
  //       // @ts-expect-error
  //       isTypedRightToChildAge = false;
  //       // just make sure the other two exist cause the above ensures they're properly typed
  //       let happyFamilyParentExistType: typeof happyFamily.parent extends any
  //         ? true
  //         : false;
  //       let happyFamilyChildExistType: typeof happyFamily.child extends any
  //         ? true
  //         : false;
  //       // @ts-expect-error
  //       happyFamilyParentExistType = false;
  //       // @ts-expect-error
  //       happyFamilyChildExistType = false;
  //     });
  //     it('gets all members after attachData() is called', async () => {
  //       await happyFamily.attachData();
  //       expect(happyFamily.childAge).to.be.equal(33);
  //     });
  //   });
  // });
  describe('Hipthrusts functional only', () => {
    describe('HTPipeAttachData', () => {
      it('attaches properly typed data from left and right sync data attacher', () => {
        const left = {
          attachData(context: { a: string }) {
            return { b: 4 };
          },
        };

        const rightFullyCovered = {
          attachData(context: { b: number }) {
            return { c: 4 };
          },
        };

        const pipedAtoBC = HTPipeAttachData(left, rightFullyCovered);

        interface CorrectParam {
          a: string;
        }
        type CorrectReturnValue = PromiseOrSync<{ b: number; c: number }>;
        type ParamAssignableToCorrect = CorrectParam extends Parameters<
          typeof pipedAtoBC.attachData
        >[0]
          ? true
          : false;
        type ParamAssignableFromCorrect = Parameters<
          typeof pipedAtoBC.attachData
        >[0] extends CorrectParam
          ? true
          : false;
        type ReturnAssignableToCorrect = CorrectReturnValue extends ReturnType<
          typeof pipedAtoBC.attachData
        >
          ? true
          : false;
        type ReturnAssignableFromCorrect = ReturnType<
          typeof pipedAtoBC.attachData
        > extends CorrectReturnValue
          ? true
          : false;
        // @ts-expect-error
        const paramAssignableToCorrectShouldFail: ParamAssignableToCorrect = false;
        // @ts-expect-error
        const paramAssignableFromCorrectShouldFail: ParamAssignableFromCorrect = false;
        // @ts-expect-error
        const returnAssignableToCorrectShouldFail: ReturnAssignableToCorrect = false;
        // @ts-expect-error
        const returnAssignableFromCorrectShouldFail: ReturnAssignableFromCorrect = false;
      });
      it('attaches properly typed data from left sync data attacher and right not fully covered sync data attacher', () => {
        const left = {
          attachData(context: { a: string }) {
            return { b: 4 };
          },
        };

        const rightPartiallyCovered = {
          attachData(context: { b: number; other: string }) {
            return { c: 4 };
          },
        };

        const pipedAOtoBC1 = HTPipeAttachData(left, rightPartiallyCovered);

        interface CorrectParam {
          a: string;
          other: string;
        }
        type CorrectReturnValue = PromiseOrSync<{ b: number; c: number }>;
        type ParamAssignableToCorrect = CorrectParam extends Parameters<
          typeof pipedAOtoBC1.attachData
        >[0]
          ? true
          : false;
        type ParamAssignableFromCorrect = Parameters<
          typeof pipedAOtoBC1.attachData
        >[0] extends CorrectParam
          ? true
          : false;
        type ReturnAssignableToCorrect = CorrectReturnValue extends ReturnType<
          typeof pipedAOtoBC1.attachData
        >
          ? true
          : false;
        type ReturnAssignableFromCorrect = ReturnType<
          typeof pipedAOtoBC1.attachData
        > extends CorrectReturnValue
          ? true
          : false;
        // @ts-expect-error
        const paramAssignableToCorrectShouldFail: ParamAssignableToCorrect = false;
        // @ts-expect-error
        const paramAssignableFromCorrectShouldFail: ParamAssignableFromCorrect = false;
        // @ts-expect-error
        const returnAssignableToCorrectShouldFail: ReturnAssignableToCorrect = false;
        // @ts-expect-error
        const returnAssignableFromCorrectShouldFail: ReturnAssignableFromCorrect = false;
      });
      it('attaches data from left sync data attached and right not covered sync data attacher', () => {
        const left = {
          attachData(context: { a: string }) {
            return { b: 4 };
          },
        };
        const rightNotCovered = {
          attachData(context: { other: string }) {
            return { c: 4 };
          },
        };

        const pipedNotCoveredError = HTPipeAttachData(left, rightNotCovered);

        interface CorrectParam {
          a: string;
          other: string;
        }
        type CorrectReturnValue = PromiseOrSync<{ b: number; c: number }>;
        type ParamAssignableToCorrect = CorrectParam extends Parameters<
          typeof pipedNotCoveredError.attachData
        >[0]
          ? true
          : false;
        type ParamAssignableFromCorrect = Parameters<
          typeof pipedNotCoveredError.attachData
        >[0] extends CorrectParam
          ? true
          : false;
        type ReturnAssignableToCorrect = CorrectReturnValue extends ReturnType<
          typeof pipedNotCoveredError.attachData
        >
          ? true
          : false;
        type ReturnAssignableFromCorrect = ReturnType<
          typeof pipedNotCoveredError.attachData
        > extends CorrectReturnValue
          ? true
          : false;
        // @ts-expect-error
        const paramAssignableToCorrectShouldFail: ParamAssignableToCorrect = false;
        // @ts-expect-error
        const paramAssignableFromCorrectShouldFail: ParamAssignableFromCorrect = false;
        // @ts-expect-error
        const returnAssignableToCorrectShouldFail: ReturnAssignableToCorrect = false;
        // @ts-expect-error
        const returnAssignableFromCorrectShouldFail: ReturnAssignableFromCorrect = false;
      });
      it('attaches properly typed data from left sync data attacher only', () => {
        const left = {
          attachData(context: { a: string }) {
            return { b: 4 };
          },
        };

        const pipedLeftOnly = HTPipeAttachData(left, {});

        interface CorrectParam {
          a: string;
        }
        type CorrectReturnValue = PromiseOrSync<{ b: number }>;
        type ParamAssignableToCorrect = CorrectParam extends Parameters<
          typeof pipedLeftOnly.attachData
        >[0]
          ? true
          : false;
        type ParamAssignableFromCorrect = Parameters<
          typeof pipedLeftOnly.attachData
        >[0] extends CorrectParam
          ? true
          : false;
        type ReturnAssignableToCorrect = CorrectReturnValue extends ReturnType<
          typeof pipedLeftOnly.attachData
        >
          ? true
          : false;
        type ReturnAssignableFromCorrect = ReturnType<
          typeof pipedLeftOnly.attachData
        > extends CorrectReturnValue
          ? true
          : false;
        // @ts-expect-error
        const paramAssignableToCorrectShouldFail: ParamAssignableToCorrect = false;
        // @ts-expect-error
        const paramAssignableFromCorrectShouldFail: ParamAssignableFromCorrect = false;
        // @ts-expect-error
        const returnAssignableToCorrectShouldFail: ReturnAssignableToCorrect = false;
        // @ts-expect-error
        const returnAssignableFromCorrectShouldFail: ReturnAssignableFromCorrect = false;
      });
      it('attaches properly typed data from right sync data attacher only', () => {
        const rightPartiallyCovered = {
          attachData(context: { b: number; other: string }) {
            return { c: 4 };
          },
        };

        const pipedRightOnly = HTPipeAttachData({}, rightPartiallyCovered);

        interface CorrectParam {
          b: number;
          other: string;
        }
        type CorrectReturnValue = PromiseOrSync<{ c: number }>;
        type ParamAssignableToCorrect = CorrectParam extends Parameters<
          typeof pipedRightOnly.attachData
        >[0]
          ? true
          : false;
        type ParamAssignableFromCorrect = Parameters<
          typeof pipedRightOnly.attachData
        >[0] extends CorrectParam
          ? true
          : false;
        type ReturnAssignableToCorrect = CorrectReturnValue extends ReturnType<
          typeof pipedRightOnly.attachData
        >
          ? true
          : false;
        type ReturnAssignableFromCorrect = ReturnType<
          typeof pipedRightOnly.attachData
        > extends CorrectReturnValue
          ? true
          : false;
        // @ts-expect-error
        const paramAssignableToCorrectShouldFail: ParamAssignableToCorrect = false;
        // @ts-expect-error
        const paramAssignableFromCorrectShouldFail: ParamAssignableFromCorrect = false;
        // @ts-expect-error
        const returnAssignableToCorrectShouldFail: ReturnAssignableToCorrect = false;
        // @ts-expect-error
        const returnAssignableFromCorrectShouldFail: ReturnAssignableFromCorrect = false;
      });
      it('no attaches data when left and right is empty objects', () => {
        const pipedWithEmptyObjectsOnly = HTPipeAttachData({}, {});

        type ParamAssignableToCorrect = {} extends typeof pipedWithEmptyObjectsOnly
          ? true
          : false;
        type ParamAssignableFromCorrect = typeof pipedWithEmptyObjectsOnly extends {}
          ? true
          : false;
        type ReturnAssignableToCorrect = {} extends typeof pipedWithEmptyObjectsOnly
          ? true
          : false;
        type ReturnAssignableFromCorrect = typeof pipedWithEmptyObjectsOnly extends {}
          ? true
          : false;
        // @ts-expect-error
        const paramAssignableToCorrectShouldFail: ParamAssignableToCorrect = false;
        // @ts-expect-error
        const paramAssignableFromCorrectShouldFail: ParamAssignableFromCorrect = false;
        // @ts-expect-error
        const returnAssignableToCorrectShouldFail: ReturnAssignableToCorrect = false;
        // @ts-expect-error
        const returnAssignableFromCorrectShouldFail: ReturnAssignableFromCorrect = false;
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

        function expectErrorWithHTPipeAttachData() {
          // @ts-expect-error
          const pipedError = HTPipeAttachData(leftBad, rightFullyCovered);
        }
      });

      // async paths

      it('attaches properly typed data from left and right async data attacher', () => {
        const left = {
          attachData(context: { a: string }) {
            return Promise.resolve({ b: 4 });
          },
        };

        const rightFullyCovered = {
          attachData(context: { b: number }) {
            return Promise.resolve({ c: 4 });
          },
        };

        const pipedAtoBC = HTPipeAttachData(left, rightFullyCovered);

        interface CorrectParam {
          a: string;
        }
        type CorrectReturnValue = PromiseOrSync<{ b: number; c: number }>;
        type ParamAssignableToCorrect = CorrectParam extends Parameters<
          typeof pipedAtoBC.attachData
        >[0]
          ? true
          : false;
        type ParamAssignableFromCorrect = Parameters<
          typeof pipedAtoBC.attachData
        >[0] extends CorrectParam
          ? true
          : false;
        type ReturnAssignableToCorrect = CorrectReturnValue extends ReturnType<
          typeof pipedAtoBC.attachData
        >
          ? true
          : false;
        type ReturnAssignableFromCorrect = ReturnType<
          typeof pipedAtoBC.attachData
        > extends CorrectReturnValue
          ? true
          : false;
        // @ts-expect-error
        const paramAssignableToCorrectShouldFail: ParamAssignableToCorrect = false;
        // @ts-expect-error
        const paramAssignableFromCorrectShouldFail: ParamAssignableFromCorrect = false;
        // @ts-expect-error
        const returnAssignableToCorrectShouldFail: ReturnAssignableToCorrect = false;
        // @ts-expect-error
        const returnAssignableFromCorrectShouldFail: ReturnAssignableFromCorrect = false;
      });
      it('attaches properly typed data from left async data attacher and right not fully covered async data attacher', () => {
        const left = {
          attachData(context: { a: string }) {
            return Promise.resolve({ b: 4 });
          },
        };
        const rightPartiallyCovered = {
          attachData(context: { b: number; other: string }) {
            return Promise.resolve({ c: 4 });
          },
        };
        const pipedAOtoBC1 = HTPipeAttachData(left, rightPartiallyCovered);

        interface CorrectParam {
          a: string;
          other: string;
        }
        type CorrectReturnValue = PromiseOrSync<{ b: number; c: number }>;
        type ParamAssignableToCorrect = CorrectParam extends Parameters<
          typeof pipedAOtoBC1.attachData
        >[0]
          ? true
          : false;
        type ParamAssignableFromCorrect = Parameters<
          typeof pipedAOtoBC1.attachData
        >[0] extends CorrectParam
          ? true
          : false;
        type ReturnAssignableToCorrect = CorrectReturnValue extends ReturnType<
          typeof pipedAOtoBC1.attachData
        >
          ? true
          : false;
        type ReturnAssignableFromCorrect = ReturnType<
          typeof pipedAOtoBC1.attachData
        > extends CorrectReturnValue
          ? true
          : false;
        // @ts-expect-error
        const paramAssignableToCorrectShouldFail: ParamAssignableToCorrect = false;
        // @ts-expect-error
        const paramAssignableFromCorrectShouldFail: ParamAssignableFromCorrect = false;
        // @ts-expect-error
        const returnAssignableToCorrectShouldFail: ReturnAssignableToCorrect = false;
        // @ts-expect-error
        const returnAssignableFromCorrectShouldFail: ReturnAssignableFromCorrect = false;
      });
      it('attaches data from left async data attached and right not covered async data attacher', () => {
        const left = {
          attachData(context: { a: string }) {
            return Promise.resolve({ b: 4 });
          },
        };
        const rightNotCovered = {
          attachData(context: { other: string }) {
            return Promise.resolve({ c: 4 });
          },
        };

        const pipedNotCoveredError = HTPipeAttachData(left, rightNotCovered);

        interface CorrectParam {
          a: string;
          other: string;
        }
        type CorrectReturnValue = PromiseOrSync<{ b: number; c: number }>;
        type ParamAssignableToCorrect = CorrectParam extends Parameters<
          typeof pipedNotCoveredError.attachData
        >[0]
          ? true
          : false;
        type ParamAssignableFromCorrect = Parameters<
          typeof pipedNotCoveredError.attachData
        >[0] extends CorrectParam
          ? true
          : false;
        type ReturnAssignableToCorrect = CorrectReturnValue extends ReturnType<
          typeof pipedNotCoveredError.attachData
        >
          ? true
          : false;
        type ReturnAssignableFromCorrect = ReturnType<
          typeof pipedNotCoveredError.attachData
        > extends CorrectReturnValue
          ? true
          : false;
        // @ts-expect-error
        const paramAssignableToCorrectShouldFail: ParamAssignableToCorrect = false;
        // @ts-expect-error
        const paramAssignableFromCorrectShouldFail: ParamAssignableFromCorrect = false;
        // @ts-expect-error
        const returnAssignableToCorrectShouldFail: ReturnAssignableToCorrect = false;
        // @ts-expect-error
        const returnAssignableFromCorrectShouldFail: ReturnAssignableFromCorrect = false;
      });
      it('attaches properly typed data from left async data attacher only', () => {
        const left = {
          attachData(context: { a: string }) {
            return Promise.resolve({ b: 4 });
          },
        };

        const pipedLeftOnly = HTPipeAttachData(left, {});

        interface CorrectParam {
          a: string;
        }
        type CorrectReturnValue = PromiseOrSync<{ b: number }>;
        type ParamAssignableToCorrect = CorrectParam extends Parameters<
          typeof pipedLeftOnly.attachData
        >[0]
          ? true
          : false;
        type ParamAssignableFromCorrect = Parameters<
          typeof pipedLeftOnly.attachData
        >[0] extends CorrectParam
          ? true
          : false;
        type ReturnAssignableToCorrect = CorrectReturnValue extends ReturnType<
          typeof pipedLeftOnly.attachData
        >
          ? true
          : false;
        type ReturnAssignableFromCorrect = ReturnType<
          typeof pipedLeftOnly.attachData
        > extends CorrectReturnValue
          ? true
          : false;
        // @ts-expect-error
        const paramAssignableToCorrectShouldFail: ParamAssignableToCorrect = false;
        // @ts-expect-error
        const paramAssignableFromCorrectShouldFail: ParamAssignableFromCorrect = false;
        // @ts-expect-error
        const returnAssignableToCorrectShouldFail: ReturnAssignableToCorrect = false;
        // @ts-expect-error
        const returnAssignableFromCorrectShouldFail: ReturnAssignableFromCorrect = false;
      });
      it('attaches properly typed data from right async data attacher only', () => {
        const rightPartiallyCovered = {
          attachData(context: { b: number; other: string }) {
            return Promise.resolve({ c: 4 });
          },
        };

        const pipedRightOnly = HTPipeAttachData({}, rightPartiallyCovered);

        interface CorrectParam {
          b: number;
          other: string;
        }
        type CorrectReturnValue = PromiseOrSync<{ c: number }>;
        type ParamAssignableToCorrect = CorrectParam extends Parameters<
          typeof pipedRightOnly.attachData
        >[0]
          ? true
          : false;
        type ParamAssignableFromCorrect = Parameters<
          typeof pipedRightOnly.attachData
        >[0] extends CorrectParam
          ? true
          : false;
        type ReturnAssignableToCorrect = CorrectReturnValue extends ReturnType<
          typeof pipedRightOnly.attachData
        >
          ? true
          : false;
        type ReturnAssignableFromCorrect = ReturnType<
          typeof pipedRightOnly.attachData
        > extends CorrectReturnValue
          ? true
          : false;
        // @ts-expect-error
        const paramAssignableToCorrectShouldFail: ParamAssignableToCorrect = false;
        // @ts-expect-error
        const paramAssignableFromCorrectShouldFail: ParamAssignableFromCorrect = false;
        // @ts-expect-error
        const returnAssignableToCorrectShouldFail: ReturnAssignableToCorrect = false;
        // @ts-expect-error
        const returnAssignableFromCorrectShouldFail: ReturnAssignableFromCorrect = false;
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

        function expectErrorWithHTPipeAttachData() {
          // @ts-expect-error
          const pipedError = HTPipeAttachData(leftBad, rightFullyCovered);
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
