const crow = require('./index.js');

async function test() {
	await crow.open((data) => {
		console.log(data);
	});

	await crow.send("x = true", "run");

	await crow.send("print(x)");

}

test();
