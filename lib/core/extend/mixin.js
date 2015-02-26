Function.extend({
	mixin: function(Parent) { 
		this.mixinStatic(Parent);
		this.mixinInstance(Parent);
	},
	mixinStatic: function(Parent) { 
		for(var prop in Parent) {
			if(Parent.hasOwnProperty(prop) && !/construct|class|className|__type|parent|constructor|onStartup|___proto/.test(prop)) {
				if(_.isObject(Parent[prop]) && !_.isFunction(Parent[prop])) {
					this[prop] = {};
					_.extend(this[prop], Parent[prop]);
				}
				this[prop] = Parent[prop];
			}
		}
	},
	mixinInstance: function(Parent) { 
		for(var prop in Parent.prototype) {
			if(Parent.prototype.hasOwnProperty(prop) && !/construct|className|__type|onStartup|parent/.test(prop)) {
				if(_.isObject(Parent.prototype[prop]) && !_.isFunction(Parent.prototype[prop])) {
					this.prototype[prop] = {};
					_.extend(this.prototype[prop], Parent.prototype[prop]);
				}
				this.prototype[prop] = Parent.prototype[prop];
			}
		}
	}
});