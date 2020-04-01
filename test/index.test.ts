import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';
import { expectType } from 'tsd';

import { HTPipe, WithAttached, WithInit } from '../src';

use(chaiAsPromised);

interface MockUser {
  _id: string;
  email: string;
}

describe('HipThrusTS', () => {
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
        expectType<MockUser>(hipRequestInstance.user_user);
        expectType<string>(hipRequestInstance.user_user._id);
        expectType<string>(hipRequestInstance.user_user.email);
        expect(hipRequestInstance.user_user.email).to.be.equal(
          'link@example.com'
        );
      });
      it('retains the base class members', () => {
        expectType<string>(hipRequestInstance.existingField);
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
        // @todo: fix like the HTPipe stuff (no assign) - this may not actually work!
        const typeIsOkay: typeof BaseWithoutParams extends Parameters<
          typeof AddThingIdFromParams
        >[0]
          ? true
          : false = false;
        expectType<false>(typeIsOkay);
      });
      it('compile-time-errors-out when extending a class that has the right member but it does not satisfy the projector', () => {
        class BaseWithMistypedParams {
          public existingField = 'Hyrule';
          public params = {};
          constructor(...args: any[]) {
            // empty - tslint shutup
          }
        }
        // @todo: fix like the HTPipe stuff (no assign) - this may not actually work!
        const typeIsOkay: typeof BaseWithMistypedParams extends Parameters<
          typeof AddThingIdFromParams
        >[0]
          ? true
          : false = false;
        expectType<false>(typeIsOkay);
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
          // @todo: fix like the HTPipe stuff (no assign) - this may not actually work!
          const typeIsOkay: typeof BaseWithProperParams extends Parameters<
            typeof AddThingIdFromParams
          >[0]
            ? true
            : false = true;
          expectType<true>(typeIsOkay);
        });
        describe('when wrapping it and creating an instance', () => {
          const RequestWithParamId = AddThingIdFromParams(BaseWithProperParams);

          const req = {};
          const requestWithParamId = new RequestWithParamId(req);
          it('news up an instance with the new member typed properly', () => {
            expectType<string>(requestWithParamId.thingId);
          });
          it('news up instances that retain the base class members and type them properly', () => {
            expectType<string>(requestWithParamId.existingField);
            expect(requestWithParamId.existingField).to.be.equal('Hyrule');
          });
          it('news up instances that have the attachData lifecycle stage', () => {
            expectType<() => Promise<any>>(requestWithParamId.attachData);
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
      const AddWholeFamily = HTPipe(
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
        WithAttached('child', child => Promise.resolve(child.age), 'childAge')
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
        let isTypedRightThenTrue: typeof happyFamily.childAge extends number
          ? true
          : false;
        // tslint:disable-next-line:prefer-const
        let isTypedRight: typeof isTypedRightThenTrue extends true
          ? true
          : false = true;
        // just make sure the other two exist cause the above ensures they're properly typed
        expectType<any>(happyFamily.parent);
        expectType<any>(happyFamily.child);
      });
      it('gets all members after attachData() is called', async () => {
        await happyFamily.attachData();
        expect(happyFamily.childAge).to.be.equal(33);
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

// @fixme: MAKE TESTS OUT OF EVERYTHING BELOW!
// also test the types come out correct (not too broad and not too narrow!)
/*
const left = {
  attachData(context: {a: string}) {
    return {b: 4};
  }
}
const leftBad = {
  attachData(context: {a: string}) {
    return {b: "bad"};
  }
}
const rightFullyCovered = {
  attachData(context: {b: number}) {
    return {c: 4};
  }
}
const rightPartiallyCovered = {
  attachData(context: {b: number, other: string}) {
    return {c: 4};
  }
}
const rightNotCovered = {
  attachData(context: {other: string}) {
    return {c: 4};
  }
}

const pipedError = HTPipeAttachData(leftBad,rightFullyCovered);
const pipedAtoBC = HTPipeAttachData(left,rightFullyCovered);
const pipedAOtoBC1 = HTPipeAttachData(left,rightPartiallyCovered);
const pipedAOtoBC2 = HTPipeAttachData(left,rightPartiallyCovered);
const pipedLeftOnly = HTPipeAttachData(left,{});
const pipedRightOnly = HTPipeAttachData({},rightPartiallyCovered);
const pipedNoneToNone = HTPipeAttachData({},{});
// @todo: ALSO ADD ALL THE ABOVE PATHS BUT W/ ASYNC!
*/
