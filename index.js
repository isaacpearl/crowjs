const SerialPort = require('serialport');
const SerialReadline = require('@serialport/parser-readline');

let crowPort, lineStream;

//TODO: reconnection and better error reporting

/*
 * Opens connection to a Crow module and sets a responder function
 *
 * @param   {Function} responder A function which is run on all input recieved from the serial port
 *
 * @returns {Object} The new lineStream object for Crow
 */
const open = async (responder=console.log) => {
    try {
		let port = await findCrow();
		crowPort = new SerialPort(port, {
			baudRate: 115200,
		});
		lineStream = crowPort.pipe(new SerialReadline({ delimiter: '\r' }));
		setResponder(responder);
	} catch(err) {
		console.log(`init error: ${err}`);
		lineStream = 0;
	}
    return lineStream;
}; 

/*
 * Searches all available serial ports for a connected Crow module
 *
 * @returns {String} The path to the serial port Crow is connected on
 */
const findCrow = async () => {
	let ports = await SerialPort.list();
	let portPath;
	ports.forEach((item) => {
		if (item.vendorId == 0483 && item.productId == 5740) {
			console.log(`found crow by ~~ ${item.manufacturer} ~~ !`);
			portPath = item.path;
        } 
    });
    if (!portPath) {
        throw Error("No crow module detected");
    }
    return portPath;
};

/*
 * Assigns a new responder function to Crow's line stream object
 *
 * @param   {Function} responder A function which is run on all input recieved from the serial port
 */
const setResponder = (responder) => {
    console.log(`setting responder:`)
    console.log(responder)
	lineStream.removeAllListeners('data');
    lineStream.on('data', responder);
    return;
};

// crowPort will disconnect automatically on program close, use this for strange edge cases
const close = () => {
	crowPort.close(checkError);
    return;
};

const checkError = (err) => {
	if (err) {
		return console.log('Error: ', err.message);
    } else {
        return;
    }
};

/*
 * Upload a lua script contained in mulitple parts (may be neccessary for very long scripts)
 *
 * @param   {String[]} scripts An array of scripts as strings
 */
const uploadMultipleFiles = async (scripts) => {
    const fileNames = Object.keys(scripts);
    crowPort.write("^^s", checkError);
    for (const name of fileNames) {
        crowPort.write(scripts[name]+"\n");
        await sleep(500);
    };
    await sleep(500);
    writeLua(crowPort, "^^e");
    return;
};

/*
 * Send a command or script to Crow
 *
 * @param   {String} luaString A valid lua script or caret command (see druid source code for caret messages examples)
 * @param   {String} uploadType How we want crow to run/save the script
 */
const send = async (luaString, uploadType="") => {
	switch(uploadType) {
		case "run":
			crowPort.write("^^s", checkError);
			await sleep(200); //wait to allocate buffer
			crowPort.write(luaString+"\n", checkError);
			crowPort.write("^^e", checkError);
			await sleep(100); //wait for lua environment to process the lua string
			break;
		case "save":
			crowPort.write("^^s", checkError);
			await sleep(200);
            crowPort.write(luaString+"\n", checkError);
			crowPort.write("^^w", checkError);
			await sleep(100);
			break;
        case "caret":
            crowPort.write(luaString+"\n", checkError);
            await sleep(100);
            break;
        default:
            crowPort.write(luaString+"\n", checkError);
			break;
	}
    return;
};

/*
 * Convert a JavaScript object or array to a string representation of a Lua table
 *
 * @param   {Object} o The object or array to convert to a Lua string
 */
const objectToTableStr = (o) => {
    let tableString = `{`;
    const isArray = Array.isArray(o);
    // If o is an object, properties is set to fields, else properties is set to the array elements
    const properties = isArray ? o : Object.keys(o);
    for (let i = 0; i < properties.length; i++) {
		const property = properties[i];
        const value = isArray ? property : o[property];
		let valueString = "";
		switch(typeof(value)) {
			case "object":
				valueString = `${objectToTableStr(value)}`;
				break;
			case "string":
				valueString = ` "${value}"`;
				break;
			case "number": 
			case "boolean":
				valueString = ` ${value}`;
				break;
			default:
				break;
		}
		tableString += isArray ? valueString : `${property} =${valueString}`;
		if (i != properties.length-1) {
			tableString += ", "
		} else {
			tableString += ' }';
		}
	}
	return tableString;
}

/*
 * Generate the string representation for a valid Lua function call
 *
 * @param   {String} functionName The function to call
 * @param   {Array} args The function's arguments
 *
 * @returns {String} The lua function call as a string, for sending to Crow over serial
 */
const getLuaCallString = (functionName, args=[]) => {
    let luaStr = `${functionName}(`;
    for (let i = 0; i < args.length; i++) {
        switch(typeof(args[i])) {
			case "object":
				luaStr += objectToTableStr(args[i]);
				break;
			case "string":
				luaStr += `"${args[i]}"`;
				break;
			case "number": 
			case "boolean":
				luaStr += `${args[i]}`;
				break;
			default:
				break;
		}
        if (i+1 < args.length) {
            luaStr += `, `;
        }
    }
    luaStr += ')';
    return luaStr;
};

/*
 * Call an arbitrary Lua function with an array of arguments
 *
 * @param   {String} functionName The function to call
 * @param   {Array} args The function's arguments
 */
const luaCall = async (functionName, args) => {
    const luaStr = getLuaCallString(functionName, args);
    //console.log(luaStr)
    await send(luaStr, "run"); 
    return;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
	open,
	close,
    getLuaCallString,
    luaCall,
    objectToTableStr,
	send,
	setResponder,
	sleep
}
