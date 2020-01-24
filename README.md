# crow.js
Node.js module for handling a connection to a crow device in Javascript.

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

### future
* reconnection functionality with listener in `open()`
* write usage documentation (with instructive example of responder callback that listens for `^^` messages)
* crow firmware updater program:
https://github.com/devanlai/webdfu
