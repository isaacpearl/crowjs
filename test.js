const crow = require('./index.js');
const fs = require('fs');

//TODO: unit testing
//TODO: test uploadMulitpleFiles() or remove

const uploadScript = async (filePath) => {
    await crow.sleep(200);
	const script = fs.readFileSync(filePath, "utf8");
    crow.send(script, "save");	
    await crow.sleep(100);
    return;
};

const getCrowMessageArgs = (data) => {
	const newString = data.replace(/[()]/g, '');
	const args = newString.split(',');
	return args;
}

const parseCrowData = (data) => {
    if (data.includes('^^')) {
        const splitData = data.split('('); //first element is message header, second is args
        const messageHeader = splitData[0];
        const messageArgs = getCrowMessageArgs(splitData[1]); // will be undefined for message with no args
        switch(messageHeader) {
            case "^^test_init_message":
                console.log(`Inititalized test script`);
                break;
            case "^^test_message_with_args":
                console.log(`Test caret message arguments:`);
                console.log(messageArgs);
                break;
            default:
                console.log(data);
                break;
        }
    }
    return;
};

const test = async () => {
    const crowConnection = await crow.open(parseCrowData);
    if (crowConnection) {
        await uploadScript(`./exampleLuaScripts/euclidean.lua`);
        //await uploadScript(`./exampleLuaScripts/test.lua`);
        //await crow.send("^^p", "caret");
        //await uploadScript(`./exampleLuaScripts/test.lua`);
        //await crow.send("^^p", "caret");
        /*
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
        */
        console.log(`now return`)
        return;
    }
};


test();
