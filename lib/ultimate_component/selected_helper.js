Blaze.registerHelper("umSelected", function(val, key, nonSelectedClass, selectedClass) {
	var context = this.model || this;
	console.log("CONTEXT", val, key, context, this);
	if(context[key]) return val === context[key] ? selectedClass : nonSelectedClass;
	else return val === match ? selectedClass : nonSelectedClass;
});