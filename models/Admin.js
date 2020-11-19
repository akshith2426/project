const mongoose = require('mongoose');
var today = new Date();

var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

var time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();

var dateTime = date + ' ' + time;
const AdminSchema = new mongoose.Schema({
	attendee_name: {
		type: String,
		required: true
	},
	attendee_email: {
		type: String
	},
	attendee_mobilenum: {
		type: String
	},
	date: {
		type: String,
		default: dateTime
	}
});
const Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin;
