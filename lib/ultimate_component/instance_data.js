UltimateComponentParent.extend({
	data: function(key) {
		return this.currentData(key);
	},
	currentData: function(key) {
		var data = Template.currentData() || this.componentData();
		return this._prepData(data, key);
	},
	componentData: function(key) {
		var data = this.instance().data  || this.routeData();
		return this._prepData(data, key);
	},
	routeData: function(key) {
		var data = Router.current().data();
		return this._prepData(data, key);
	},
	parentData: function(level, key) {
		var data = Template.parentData(level);
		return this._prepData(data, key);
	},

	
	model: function(key, val, data) {
		data = data || this.data();
		
		if(!data) return;
		
		this._model = null;
		
		if(this._isModel(data)) this._model = data;
		else if(this._isModel(data.model)) this._model = data.model;
		else {
			for(var prop in data) {
				if(data.hasOwnProperty(prop) && this._isModel(data[prop])) {
					this._model = data[key];
					break;
				}
			}
		}
		
		return this._prepData(this._model, key, val);
	},
	currentModel: function(key, val) {
		return this.model(key, val, this.currentData());
	},
	componentModel: function(key, val) {
		return this.model(key, val, this.componentData());
	},
	routeModel: function(key, val) {
		return this.model(key, val, this.routeData());
	},
	parentModel: function(levels, key, val) {
		return this.model(key, val, this.parentData(levels));
	},
	
	
	_isModel: function(data) {
		if(!data.__type) return null;
		return data.__type.indexOf('model_') === 0 || data.__type.indexOf('form_') === 0;
	},
	_prepData: function(data, key, val) {
		if(key) {
			if(val) data[key] = val;
			else return _.isObject(data) ? data[key] : null;
		}
		else return data;
	}
});