_.extend(Ultimate, {
  setupModel: function(methods) {
    var collectionName = methods.collection;

    if(!collectionName) {
    	if(this.parent.className == 'UltimateUser') {
    		collectionName = methods.collection = Meteor.users; //make sure it has wrapped collection class from hooks
    	}
      	else if(this.parent.prototype.collection) return; //class will use parent's collection
      	else collectionName = (this.className + 's').toLowerCase(); //pluralize + lowercase model name to make collection name
    }

    var collection;

    if(_.isObject(collectionName) && !_.isArray(collectionName)) collection = collectionName;
    else {
      if(_.isArray(collectionName)) {
        var collectionObjectName = collectionName[0];
        collectionName = collectionName[1];
      }
      else { //if(_.isString(collectionName))
        var parts = collectionName.split('_'),
          collectionObjectName = '';

        _.each(parts, function(part) {
          collectionObjectName += part.capitalizeOnlyFirstLetter();
        });
      }

      if(Ultimate.globalScope[collectionObjectName]) collection = Ultimate.globalScope[collectionObjectName];
      else collection = Ultimate.globalScope[collectionObjectName] = new Meteor.Collection(collectionName);
      //eval(collectionObjectName + ' = new Meteor.Collection(' + collectionName + ')'); //assign collection within package scope
    }

    this._assignCollection(collection, methods);
    this.collection = collection; //assign so setupHooks has easy access to it below
    this.setupHooks(this.parent.prototype, this.class.prototype); //make sure hooks from possible parent models are added too
  },
  _assignCollection: function(collection, methods) {
    methods.collection = this.class.collection = collection;
    Ultimate.collections[collection._name] = collection;

    var Class = this.class;

    collection._transform = function(doc) {
      return doc.className ? new Ultimate.classes[doc.className](doc) : new Class(doc);
    };
  },


	setupHooks: function(methods, proto) {
		this.hookMethods = methods; //methods may come from methods map or parent.prototype
		this.hookProto = proto || this.proto; //proto may be standard proto or supplied by Behavior
		
		this.setupDatetimes();

		if(methods.onBeforeInsert) this.onBeforeInsert();
		if(methods.onBeforeUpdate) this.onBeforeUpdate();
		if(methods.onBeforeRemove) this.onBeforeRemove();
		if(methods.onAfterInsert) this.onAfterInsert();
		if(methods.onAfterUpdate) this.onAfterUpdate();
		if(methods.onAfterRemove) this.onAfterRemove();
		if(methods.onAfterFindOne) this.onAfterFindOne();
		if(methods.onBeforeFind) this.onBeforeFind();
		if(methods.onAfterFind) this.onAfterFind();
		if(methods.onBeforeFindOne) this.onBeforeFindOne();
	
		if(methods.validateOnInsert) this.validateInsert();
		if(methods.validateOnUpdate) this.validateUpdate();
		
		delete this.hookMethods;
		delete this.hookProto;
	},
	
	
	_addEventHandler: function(name) {
		//eg: this.hookProto.on('beforeInsert', methods.onBeforeInsert)
		var onName = 'on'+name.capitalizeOnlyFirstLetter();
		this.hookProto.on(name, this.hookMethods[onName]); //the value of methods[onName] could be  simply `true` so that the event is emitted for later-attached handlers
		
		delete this.hookProto[onName]; 
		
		return this._shouldNotAddHook(name);
	},
	_shouldNotAddHook: function(name) {
		var addedHooks = this.hookProto.___addedHooks || {},
			shouldNotAddHook = addedHooks[name]; //only add the hook once, the first time

		addedHooks[name] = true;
		this.hookProto.___addedHooks = addedHooks;
		return shouldNotAddHook;
	},
	
	
	setupDatetimes: function() {
		if(this._shouldNotAddHook('datetimes')) return;

		this.collection.before.insert(function(userId, doc) {
			doc.created_at = doc.updated_at = new Date;
		});

		this.collection.before.update(function(userId, doc, fieldNames, modifier) {
			modifier.$set.updated_at = new Date;
		});
	},
	onBeforeInsert: function() {
		if(this._addEventHandler('beforeInsert')) return;

		var newFunc = function(userId, doc) {
			var model = this.transform();		
			model.emit.apply(model, ['beforeInsert', userId, this]);
			
			for(var prop in doc) delete doc[prop];	
			_.extend(doc, model.getMongoAttributesForSave(true));
		};

		this.collection.before.insert(newFunc);
	},
	onBeforeUpdate: function() {
		if(this._addEventHandler('beforeUpdate')) return;
		
		var newFunc = function(userId, doc, fieldNames, modifier, options) {
			if(doc._local || modifier._local) return; 
		
			var model = this.transform();		
			_.extend(model, modifier.$set);

			model.emit.apply(model, ['beforeUpdate', userId, this, fieldNames, modifier, options]);
			
			modifier.$set = model.getMongoAttributesForSave();
		};

		this.collection.before.update(newFunc);
	},
	onBeforeRemove: function() {
		if(this._addEventHandler('beforeRemove')) return;
		
		var newFunc = function(userId, doc) {
			var model = this.transform();		
			model.emit.apply(model, ['beforeRemove', userId, this]);
		};

		this.collection.before.remove(newFunc);
	},
	onAfterInsert: function() {
		if(this._addEventHandler('afterInsert')) return;
		
		var newFunc = function(userId, doc) {
			var model = this.transform();	
			console.log("AFTER INSERT", model._id, this._id);	
			model.emit.apply(model, ['afterInsert', userId, this]);
		};

		this.collection.after.insert(newFunc);
	},
	onAfterUpdate: function() {
		if(this._addEventHandler('afterUpdate')) return;
		
		var newFunc = function(userId, doc, fieldNames, modifier, options) {
			var model = this.transform();		
			model.emit.apply(model, ['afterUpdate', userId, this, fieldNames, modifier, options]);
		};

		this.collection.after.update(newFunc);
	},
	onAfterRemove: function() {
		if(this._addEventHandler('afterRemove')) return;
		
		var newFunc = function(userId, doc) {
			var model = this.transform();		
			model.emit.apply(model, ['afterRemove', userId, this]);
		};

		this.collection.after.remove(newFunc);
	},
	
	
	onBeforeFindOne: function() {
		if(this._addEventHandler('beforeFindOne')) return;
		
		var model = this.hookProto;
		
		var newFunc = function(userId, selector, options) {
			model.emit.apply(model, ['beforeFindOne', userId, selector, options, this]);
		};
		
		this.collection.before.findOne(newFunc);		
	},
	onAfterFindOne: function() {
		if(this._addEventHandler('affterFindOne')) return;
		
		var newFunc = function(userId, selector, options, doc) {
			var model = this.tansform ? this.transform(doc) : new Ultimate.classes[doc.className](doc);
			model.emit.apply(model, ['afterFindOne', userId, selector, options, this]);
		};
	
		this.collection.after.findOne(newFunc);
	},
	
	
	onBeforeFind: function() {
		if(this._addEventHandler('beforeFind')) return;
		
		var model = this.hookProto;
		
		var newFunc = function(userId, selector, options) {
			model.emit.apply(model, ['beforeFind', userId, selector, options, this]);
		};
		
		this.collection.before.find(newFunc);
	},
	onAfterFind: function() {
		if(this._addEventHandler('afterFind')) return;
		
		var model = this.hookProto;
		
		var newFunc = function(userId, selector, options, cursor) {
			model.emit.apply(model, ['afterFind', userId, selector, options, cursor, this]);
		};
		
		this.collection.after.find(newFunc);		
	},
	
	
	validateInsert: function() {
		if(this._shouldNotAddHook('validateOnInsert')) return;
		
		var newFunc = function() {
			var model = this.transform(),
				errors = model.isValidMultipleForms(model.validateOnInsert); //array of forms to validate
			
			if(!_.isEmpty(errors[0])) throw new Meteor.Error('invalid-insert', errors.join('\n'));		
		};
		
		this.collection.before.insert(newFunc);
	},
	validateUpdate: function() {
		if(this._shouldNotAddHook('validateOnUpdate')) return;
		
		var newFunc = function() {
			var model = this.transform(),
				errors = model.isValidMultipleForms(model.validateOnUpdate); //array of forms to validate
		
			if(!_.isEmpty(errors[0])) throw new Meteor.Error('invalid-update', errors.join('\n'));	
		};
		
		this.collection.before.update(newFunc);
	}
});


