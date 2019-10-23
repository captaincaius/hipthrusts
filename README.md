# HipThrusTS Web API Framework

Build stronger, leaner backends with HipThrusTS

## WHO is HipThrusTS for?

You:

- Are building a node.js web API that:
  - has a data model
  - serves users you can't entirely trust, and therefore:
    - should prevent unauthorized access of resources (e.g. ownership-based, role-based, etc.)
    - should protect manipulation of protected fields on individual resources (e.g. foreign keys, primary keys)
    - should prevent protected data leakage
- Agree with the core assumption of this framework - that every request handler that's secure has 5 mandatory
concerns to fulfull:
  1. sanitizing its inputs
  2. authorizing access
  3. gathering data
  4. doing something (this is where lower-level frameworks leave you to dump everything)
  5. sanitizing its response to prevent data leakage
  - Note that you can always make any of these concerns a no-op explicitly, but when using HipThrusTS, that
  takes effort and is easy to identify during code review when it happens.

Chances are if your API is going to be on the internet, that's you.

## HipThrusTS Philosophy

- A request handler must be SECURE by default.  HipThrusTS will only accept a handler if all security concerns
are provided.
- Request handlers should be SIMPLE and small - route handler should be easy to review, and shouldn't need anything
fancy like dependency injection or too much indirection.
- DRYness and reusability should be maximized.
  - Several request handlers need to ensure ownership?  Specify it once.
  - Several requests need to sanitize inputs the same way?  Specify it once.
  - Helpers are even provided for common scenarios (e.g. role-based pre-authorization, ownership-based authorization,
  assignee-based authorization, data population, sanitization...).
- TYPESCRIPT and JAVASCRIPT friendly! \o/
- HTTP status codes should make sense by default depending on where uncaught exceptions are thrown, and shouldn't
reveal any potentially sensitive information.
- All the benefits should NOT come at any expense when compared to dumping all the concerns in a single middleware -
for example, context can be shared among the lifecycle stages.
- Separation of concerns should be encouraged architecturally.  You'll find that by using HipThrusTS, you'll naturally
end up with thinner controllers that delegate more appropriately.
- Delegate as much as possible to other packages that do their job well and are already being used.
  - An ODM/ORM like mongoose is incredibly good at validation of objects against a defined schema, and shouldn't be
reinvented.
  - HTTP frameworks like express, hapi, fastify, restify, whatevertheeffcomesnextify, etc. do their job just
  fine - some might be faster, some might be cleaner and more feature-rich and helpful with things like
  authentication (I'm lookin' at you, hapi :P).  But there's no need for HipThrusTS to get in the way of whichever
  you choose.
  - Speaking of authentication, that's also a concern that's pretty well taken care of, so there's no need to get
  in the way of whatever a project uses.  A thin adapter is used just once and you can forget about it thereafter.
- Handlers should be as declarative as possible
- Extensibility should allow building any kinds of authorization models


## HipThrusTS Architecture

### Request Handler

Remember the five concerns above?  At the lowest level (which you CAN but shouldn't need to work with), a HipThrusTS
request handler must fulfill its contract by providing the following:

- sanitizeParams(unsafeParams: any): TParamsSafe;
  - This method should accept the parameters on the URL and return a sanitized representation.
- sanitizeBody(unsafeBody: any): TBodySafe;
  - This method should accept the body and return a sanitized representation.
- preAuthorize(): boolean;
  - This synchronous method is for any authorization that can be done before any database operations need to be done.
- attachData?(): Promise<void>;
  - This async method is for gathering any data needed (optional).
- finalAuthorize(): Promise<boolean>;
  - This async method is for any authorization that needs to be done after data is gathered.
- doWork(): Promise<HipWorkResponse<TResBodyUnsafeReturn>>;
  - Perform the actual work this endpoint should, and return the endpoint's response before sanitization.
- sanitizeResponse(unsafeResponse: TResBodyUnsafeInput): any;
  - Sanitize the response appropriate for this particular user or security principal (i.e. hide fields they
  shouldn't see like passwords or security tokens).

This contract is fulfilled via any class that implements the HipThrustable interface, which contains the above
as its instance methods.

At this point you might be asking a few questions, so let's interrupt this overview with a quick interview between
you and HipThrusts:

## FAQ

- You: You telling me I have to write 5 functions instead of one?
- HT: Yeah but that's where the inheritance and mixins and helpers help you!  Given an API, you'll probably have
just a few different authorizations based on the various ways the security principal / user relates to the data
examples might include anonymous, owner, teacher, assignee, etc.  Using the helpers, you'll define classes for
each of these needed, and that will generally take care of preAuthorize, attachData, and FinalAuthorize.  All
that's left for each type of request is input/output sanitization and doWork().  Often even those can be grouped
too!  See the practical example below.

- You: My API isn't very CRUD-focused, and my methods do very specific out-of-the-ordinary things.  Will you get
in my way?
  - HT: Nope.  You can use as much or as little of me as you want.  If your specific goals mean every doWork()
should be custom-written without extra layers of abstraction, you can still benefit from the security benefits.

- You: Well what about all that data I made you gather for authorization purposes?  I don't want to have to get
it again!  Won't splitting my code up make me unable to share much-needed context among the different concerns?
  - HT: Lucky for you, everything you get HipThrusTS to gather for prior stages of the lifecycle becomes exposed
to you!  It's just like if you were to write all 5 concerns into one big nasty hard-to-review single express
middleware.  As a bonus, if you're using typescript, it will even be typed properly!

- You: What?  How?
  - HT: I got you cuz.

- You: Come on - do you want me to use you or not?
  - HT: Okay okay.  HipThrusTS exploits typescript/ES6 classes very differently than the other high-level
  frameworks like NestJS and FoalTS.  Contrast their mapping between programming constructs and duties to mine:

### Other OO Web Frameworks

- Class: Entire controller that groups a set of related response handlers (same collection, etc)
- Instance method: One specific response handler callback (similar to a single express middleware)
- Instance: Meaningless - the class is essentially a singleton, so "this" is shared by ALL requests

### HipThrusTS

- Class: A description of a SINGLE ENDPOINT's response handler's lifecycle stages
- Instance method: One of the lifecycle stages mentioned above (preAuth, doWork, etc.)
- Instance: A single actual request/response that's individually instantiated for every request!

Because of this (pun totally intended), "this" is shared by all the mandatory stages of a single request's
lifecycle, and that's where context shared among lifecycle stages lives.  "this" is the new local middleware
function scope!  You can have your cake (well-defined mandatory concerns), and eat it (keep a cohesive shared
context) too.

As far as I can tell, HipThrusTS is the first node.js web API framework using this architecture.

NOTE: THE ABOVE IS ONLY MEANT TO CONTRAST HIPTHRUSTS WITH WHAT ALREADY EXISTS (AND SERVE AS A SALES PITCH)!
NONE OF THE ABOVE WAS MEANT AS DISRESPECT TO THE HARD-WORKING AUTHORS OF ANY OTHER LIBRARIES!

In fact, there's no reason you can't use HipThrusTS on top of any of those!  PRs are welcome from anyone 
who would like to write the wrappers ;).

...interview continued below...

- You: Wow!  I think I love you
  - HT: I love code review

- You: That didn't go as planned - let's see some code then
  - HT: My pleasure

## Example

```typescript
// src/config/hipthrusts.ts
import { withUserFromReq, EmptyClass } from 'hipthrusts';
import { UserModel } from '../models/user.ts';

// ...

// Provide every request/response instance has an instance-scoped
// member shaped as the InstanceType of UserModel - by default it
// will be grabbed from req.user, but this can be overridden.
export const MyHTBase = withUserFromReq(EmptyClass, UserModel);
// Note: this will be available for all stages because it's attached
// in the constructor.

// ...
```

```typescript
// src/api/thing.controller.ts

// ThingModel is your base model, and the others are derived from it
// with subsets of fields picked, meant for various sanitizations
// (input or output) needed.
import {
  ThingModel,
  ThingIDOnlyModel,
  ThingOwnerEditableModel,
  ThingOwnerVisibleModel
} from '../models/thing.ts';
import { HasRole } from '../models/user.ts';
import {
  AttachDataWith,
  FinalAuthorizeWith,
  PreAuthorizeWith,
  hipHandlerFactory
} from 'hipthrusts';
import { Router } from 'express';

const ByIDParam = SanitizeParamsWith(MyHTBase, ThingIDOnlyModel);

// Define a base class to be extended/mixed for any endpoints for
// an "owner"
const RequireOwner = PreAuthorizeWith(
  FinalAuthorizeWith(
    AttachDataWith(
      AttachDataWith(
        AttachDataWith(
          ByIDParam,
          'params',
          params=>Promise.resolve(params.id),
          'thingId'
        ),
        'thingId', findByIdAndRequire(ThingModel), 'thing'
      ),
      'thing',
      fromWrappedInstanceMethod('isOwner'),
      'isThingOwner'
    ), 'user_user', 'isThingOwner'
  ),
  HasRole(['thingAuthor'])
);
// Now you can apply this to any handlers that need ownership
// required! \o/

// My philosophy is that if different types of users need different
// authorizations, sanitizations, etc, they should have separate
// URLs prefixed by their relationship to the resource (e.g. byOwner)
// If you don't like it, help implement meta-handlers :)
Router.get('byOwner/:id',
  hipHandlerFactory(
    // if there are fields that certain principals shouldn't see,
    // they can be sanitized with different models
    class GetThingById extends SanitizeResponseWith(
      RequireOwner,
      ThingOwnerVisibleModel
    ) {
      async doWork() {
        // note that this.thing was provided by RequireOwner - it's
        // typed too!
        return { unsafeResponse: this.thing };
      }
    }
  )
);

Router.put('byOwner/:id',
  hipHandlerFactory(
    // make sure owners can't mess up protected fields on a resource
    // (foreign keys, IDs, etc) by using a different model for
    // sanitization
    class UpdateThingById extends SanitizeBodyWith(
      SanitizeResponseWith(
        RequireOwner,
        ThingIDOnlyModel
      ),
      ThingOwnerEditableModel
    ) {
      async doWork() {
        this.thing.set(this.body);
        await this.thing.save();
        // allow specifying status codes
        return { unsafeResponse: this.thing, code: 201 };
      }
    }
  )
);

```

## Current High-Level Plans

(i.e. things you can help with)

- Take the class factories to the next level by:
  - implementing special-purpose HipThrusTS-aware mixins
  - supporting a pipeable syntax similar to rxjs's pipeable operators
  instead of the current onion syntax
- Support frameworks other than express.
- Support ODM/ORMs other than mongoose.
- Support "meta-handlers" for people that don't share my philosophy
that separate authorizations warrant separate URLs.
- Create helpers for basic CRUD operations.
- Create a "recipes" layer on top of what currently exists that can
spit out multiple handlers so one can simply declare "I have a 'thing'
with 'owners' defined like this, 'creaters' defined like this, 'readers'
defined like this. Owners should be able to modify, creaters should be
able to create, and readers should be able to create".
- Better documentation, semantics, and tests.
- Create a starter

## Why the name "HipThrusTS"

It's a pun.  Hip thrusts are a great excercise invented by Dr. Bret
Contreras, PHD for strengthening the glute muscles.  This library is
made for strengthening your digital back-end, so it seemed like an
appropriate name.  He was kind enough to give permission to use the
name.  He's one of the world's leading experts in sport science, so
check out [his website](https://bretcontreras.com/) and follow him
anywhere you can if fitness is one of your interests.

