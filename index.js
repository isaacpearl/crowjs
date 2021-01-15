const SerialPort = require('serialport');
const SerialReadline = require('@serialport/parser-readline');

let crowPort, lineStream;

//TODO: reconnection and better error reporting

const open = async (responder=console.log) => {
	//crowPort = await connectCrow();
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

const findCrow = async () => {
	let ports = await SerialPort.list();
	let portPath;
	ports.forEach((item) => {
		if (item.vendorId == 0483 && item.productId == 5740) {
			console.log(`found crow by ~~ ${item.manufacturer} ~~ !`);
			portPath = item.path;
        } 
    });
    if (portPath) {
	    return portPath;
    } else {
        throw Error("No crow module detected");
        return;
    }
};

const setResponder = (responder) => {
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

const send = async (luaString, uploadType="") => {
	switch(uploadType) {
		case "run":
			crowPort.write("^^s", checkError);
			await sleep(10); //wait to allocate buffer
			crowPort.write(luaString+"\n", checkError);
			crowPort.write("^^e", checkError);
			await sleep(10); //wait for lua environment to process the lua string
			break;
		case "save":
			crowPort.write("^^s", checkError);
			await sleep(10);
			crowPort.write(luaString+"\n", checkError);
			crowPort.write("^^w", checkError);
			await sleep(10);
			break;
		default:
			crowPort.write(luaString+"\n", checkError);
			break;
	}
    return;
};

// js object or array to string representation of equivalent lua table
const objectToTableStr = (o) => {
	let tableString = `{`;
	const properties = Array.isArray(o) ? o : Object.keys(o);
	for (let i = 0; i < properties.length; i++) {
		const property = properties[i];
		let valueToAdd = "";
        //TODO: fix array case
        console.log(typeof(o[property]))
        console.log(o[property])
		switch(typeof(o[property])) {
			case "object":
				valueToAdd = `${objectToTableStr(o[property])}`;
				break;
			case "string":
				valueToAdd = ` "${o[property]}"`;
				break;
			case "number": 
			case "boolean":
				valueToAdd = ` ${o[property]}`;
				break;
			default:
				break;
		}
		tableString += Array.isArray(o) ? valueToAdd : `${property} = ${valueToAdd}`;
		if (i != properties.length-1) {
			tableString += ", "
		} else {
			tableString += ' }';
		}
	}
	return tableString;
}

const getLuaCallString = (functionName, args) => {
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

const luaCall = async (functionName, args) => {
    const luaStr = getLuaCallString(functionName, args);
    console.log(luaStr)
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
