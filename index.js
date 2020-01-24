const SerialPort = require('serialport');
const SerialReadline = require('@serialport/parser-readline');

var crowPort, lineStream;

//TODO: reconnection
const open = async (responder) => {
	crowPort = await connectCrow();
	try {
		lineStream = crowPort.pipe(new SerialReadline({ delimiter: '\r' }));
		setResponder(responder);
	} catch(err) {
		console.log(`init error: ${err}`);
		lineStream = 0;
		return;
	}
}

async function connectCrow() {
	var crow;
	try {
		const port = await findCrow();
		crow = new SerialPort(port, {
			baudRate: 115200,
		});
	} catch (err) {
		console.log(`error on connection: ${err.message}`);
	}
	return crow;
}

async function findCrow() {
	var ports = await SerialPort.list(); //does this need to await?
	var portpath = "";
	ports.forEach((item) => {
		if (item.vendorId == 0483 && item.productId == 5740) {
			console.log(`found crow by ~~ ${item.manufacturer} ~~ !`);
			portPath = item.comName;
		}
	})
	return portPath;
}

const setResponder = (responder) => {
	lineStream.on('data', responder);
}

const close = () => {
	crowPort.close(checkError);
}

function checkError(err) {
	if(err) {
		return console.log('Error on write: ', err.message);
	}
}

const send = (luaString, uploadType="") => {
    switch(uploadType) {
        case "run":
	        crowPort.write("^^s", checkError);
	        await sleep(100);
	        crowPort.write(luaString+"\n", checkError);
	        crowPort.write("^^e", checkError);
            break;
        case "save":
	        crowPort.write("^^s", checkError);
	        await sleep(100);
	        crowPort.write(luaString+"\n", checkError);
	        crowPort.write("^^w", checkError);
            break;
        default:
	        crowPort.write(luaString+"\n", checkError);
            break;
    }
}

module.exports = {
	open,
    close,
    send,
    setResponder
}
