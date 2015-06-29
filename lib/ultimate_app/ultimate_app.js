UltimateApp = Ultimate('UltimateApp').extends(UltimateModel, {
	abstract: true,
	collection: 'apps',
	//keepCollections; [], //collections that shouldn't be reset, to be set by child classes
	
	//should be overriden by child classes for what's inserted on application startup
	environments: {
		development: {},
		production: {}
	},

	environment: function() {
		if(typeof Config != 'undefined') return Config.environment();
		else return 'development'; //if developer doesn't want to use UltimateConfig, should overwrite this method
	},
	isDevelopment: function() {
		return this.environment() == 'development';
	}
}, {
	environment: function() {
		return this.prototype.environment();
	},
	environments: function() {
		return this.prototype.environments;
	},
	isDevelopment: function() {
		return this.prototype.isDevelopment();
	},
	current: function() {
		var app = Apps.findOne({environment: this.environment()});
		return Apps.findOne({environment: this.environment()});
	},
	onClassStartup: function() {
		//only call on child classes, but allow them to use onStartup without this.callParent('onStartup')
		if(this.isAbstract()) return; 
		Meteor.subscribe('app');
	}
}, {}, {
	reset: function(dontAddApps) {
		if(this.isDevelopment()) this.resetDatabase(dontAddApps); //client can't reset db if not in development
	}
}, {}, {}, {}, {
	resetDatabase: function(dontAddApps) {
		var collections = Ultimate.collections;
		
		_.each(collections, function(collection) {
			var name = collection._name;
			
			if(_.contains(this.keepCollections, name)) return;
			if(name == this.collection._name ) return;
				
			var selector = {};
			
			if(name == 'users') selector._id = {$ne: Ultimate.userId()}
			collection.remove(selector);
		}, this);
		
		this.insertApps(dontAddApps);
		this.emit('reset');
		this.prototype.emit('reset');
	},
	onClassStartup: function() {
		//only call on child classes, but allow them to use onStartup without this.callParent('onStartup')
		if(this.isAbstract()) return; 
		
		this.insertApps();
		this.publishApp();
		
		FastRender.onAllRoutes(function(path) {
		  this.subscribe('app');
		});
	},
	insertApps: function(dontAddApps) {
		if(dontAddApps) {
			_.each(this.environments(), function(app, name) {
				this.update({environment: name}, {$set: {started_at: new Date }});
			}, this);
			
			return;
		}
		
		if(Apps.find().count() > 1) return;

		_.each(this.environments(), function(app, name) {
			app = UltimateUtilities.extract(app, this);
			app.environment = name;
			
			//Upsert from child Model, setting appropriate className to App models.
			//Use upsert so there isn't a moment where there is no Apps in collection if reseting
			this.upsert({environment: name}, app);
		}, this);
	},
	publishApp: function() {
		Meteor.publish('app', function() {
			return Apps.find({environment: this.environment()});
		}.bind(this));
	}
});