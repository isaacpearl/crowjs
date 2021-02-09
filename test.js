const crow = require('./index.js');

async function test() {

    const crowConnection = await crow.open((data) => {
		console.log(data);
    });

    if (crowConnection) {
        await crow.send("^^p", "caret");
        await crow.luaCall("print", [
            "Hello world!",
            true,
            0,
            [1, "array element"],
            {
                cat: "meow",
                dog: "woof",
                age: 100,
                correct: true,
            }
        ]);
    }

}

test();
