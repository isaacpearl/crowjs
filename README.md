# crow.js
Node.js module for connecting to and communicating with a crow eurorack module via JavaScript.

## Installation
TODO: publish to npm using this guide: https://docs.npmjs.com/creating-node-js-modules

## API
TODO: use apidoc module to generate api documentation

### haskell-ish api documentation from initial development notes:
```
open :: response_callback -> ()
close :: ()

upload_type{ execute
           , reset_and_execute
           , reset_and_save_and_execute
           }
error_state{ badstring
           , badtype
           , badconnection
send :: lua_string -> upload_type -> error_state
update_response_callback :: response_callback -> ()
```

## Future
* reconnection functionality with listener in `open()`
* write usage documentation (with instructive example of responder callback that listens for `^^` messages)
* crow firmware update program (https://github.com/devanlai/webdfu)
