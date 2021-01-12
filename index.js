const SerialPort = require('serialport');
const SerialReadline = require('@serialport/parser-readline');

let crowPort, lineStream;

//TODO: reconnection and better error reporting, also default console.log responder

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
		return;
	}
} 

async function findCrow() {
	let ports = await SerialPort.list();
	let portpath = "";
	ports.forEach((item) => {
		if (item.vendorId == 0483 && item.productId == 5740) {
			console.log(`found crow by ~~ ${item.manufacturer} ~~ !`);
			portPath = item.path;
		} })
	return portPath;
}

const setResponder = (responder) => {
	lineStream.removeAllListeners('data');
	lineStream.on('data', responder);
}

// crowPort will disconnect automatically on program close, use this for strange edge cases
const close = () => {
	crowPort.close(checkError);
}

function checkError(err) {
	if(err) {
		return console.log('Error: ', err.message);
	}
}

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
			await sleep(10); //this can potentially be lower, but must be > 500
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
	setResponder,
	sleep
}
