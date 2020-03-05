const crow = require('./index.js');

const luaName = "handshake.js 1";

const luaScript = `--- ${luaName}
function handshake() print'${luaName}' end

function init()
	myMetro = metro.init{ event = myCounter }
	myMetro:start()
end

function myCounter(count)
	crow.tell('count',count)
end
`;

async function test() {
	await crow.open(); // wait for the connection to be established
	handshake();
}

function handshake() {
	console.log(`handshake`)
	crow.setResponder( (data) => {
		console.log(`hs ${data}`);
		if (data.includes(luaName)) {
			//program();
			runtime();
		} else if (data.includes(`attempt to call a nil value (global 'handshake')`)){
			crow.send(luaScript, "save");
		} else if (data.includes('[string "eval"]')) {
			handshake();
		}
	});
	crow.send("handshake()");
}

function runtime() {
	console.log(`runtime`);
	crow.setResponder(console.log);	
	crow.send("print('running program from crow!')");
}

test();
