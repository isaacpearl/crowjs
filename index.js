const SerialPort = require('serialport');
const SerialReadline = require('@serialport/parser-readline');

var crowPort, lineStream;

//TODO: reconnection and better error reporting
const open = async (responder) => {
	//crowPort = await connectCrow();
	try {
		var port = await findCrow();
		crowPort = new SerialPort(port, {
			baudRate: 115200,
		});
		lineStream = crowPort.pipe(new SerialReadline({ delimiter: '\r' }));
		setResponder(responder);
	} catch(err) {
		console.log(`init error: ${err}`);
		lineStream = 0;
		return;
	}
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
		return console.log('Error: ', err.message);
	}
}

//TODO: \r vs \n
const send = async (luaString, uploadType="") => {
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

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
	open,
	close,
	send,
	setResponder
}
