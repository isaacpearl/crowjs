const crow = require('./index.js');

async function test() {

    const crowConnection = await crow.open((data) => {
		console.log(data);
    });

    console.log(crowConnection)

    if (crowConnection) {
        await crow.send("x = true", "run");
        await crow.send("print(x)");
        await crow.luaCall("print", ["Hello world!", true, 0, [1, "array element"], {cat: "meow", dog: "woof", age: 100}]);
    }

}

test();
