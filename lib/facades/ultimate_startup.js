Ultimate('UltimateStartup').extends(UltimateFacade, {
	abstract: true,
	deniedMethods: ['onStartup', 'autorun', 'subscribe', 'subscribeLimit', 'autorunHandler', 'subscribeHandler', 'subscribeLimitHandler'], //handled by runReactiveMethods & Setup
	mixins: Meteor.isClient ? [UltimateReactive] : null,
	
	onFacadeStartup: function() {	
	
		_.each(this.getMethods(), function(method) {
			Meteor.startup(method);
		});
		
    //only client can run the reactive autorun/subscribe/subscribeLimit methods
		if(Meteor.isClient) Meteor.startup(this.runReactiveMethods.bind(this));
	}
});