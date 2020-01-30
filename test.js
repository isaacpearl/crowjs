const crow = require('./index.js');

crow.open((data) => {
	console.log(data);
});
