
# To-Do

- add tests (including tests ensuring typescript helps where it can)
- upgrade class composition so it's pipeable (like rxjs) instead of pyramid-like
- name things better :-/
- utilize special-purpose mixins so that for example one sanitizeResponse provider can be written and mixed with
multiple authorization classes that have been built.
- meta-handlers for people who don't agree with me that routes should be separated like /byOwner/:id and /byAnyone/:id
  - easy - it can go through all handlers passed to it, and the first one that passes both authorization phases wins.
- make a logo ;)
- make body sanitizer optional for GET handlers?  This is pretty easy - just provide a noop'ed one.
- make a starter project to show it off
- some things are still kind of tied to the "user" special-case of security principal.  Make it abstract enough to
be useful for other principal types and still work well for "user"s.
- support different response types based on send type (json, raw, redirect?)
  - probably should have a defaultResponseType that's configured per handler
- make it framework-configurable (i.e. not tied to express or mongoose!)
  - so split off toHandlerClass and hipHandlerFactory to a separate express file, and make other files for other
lower-level frameworks (e.g. hapi, koa, restify, fastify, even nest? enough already!)
  - likewise for the mongoosey parts
- sanitize query params optionally too
- some applications might want headers too
- check ModelWithFindById's TYPESCRIPT KOSHERNESS - i.e. make sure the handler class will have an instance member
that's typed properly!
- check fromWrappedInstanceMethod's TYPESCRIPT KOSHERNESS - i.e. make sure it complains if method doesn't
exist or method doesn't take TIn and make sure the type of what it returns is KNOWN to be the return value
of the instance method!
- more mongoose/ODM wrappers that prevent nosql/sql injection (in cases that don't use findById)