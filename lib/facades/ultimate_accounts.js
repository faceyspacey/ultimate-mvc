Ultimate('UltimateAccounts').extends(UltimateFacade, {
	allowedMethods: ['onLogin', 'onCreateUser', 'onLoginFailure', 'validateNewUser', 'validateLoginAttempt', 'config', 'ui'],
		
	onStart: function(self) {	
		var methods = self.getMethods();
		
		if(methods.onLogin) Accounts.onLogin(methods.onLogin);
		if(methods.onCreateUser) Accounts.onCreateUser(methods.onCreateUser);
		if(methods.onLoginFailure) Accounts.onLoginFailure(methods.onLoginFailure);
		
		if(methods.validateNewUser) Accounts.validateNewUser(methods.validateNewUser);
		if(methods.validateLoginAttempt) Accounts.validateLoginAttempt(methods.validateLoginAttempt);
		
		var config = _.isFunction(methods.config) ? methods.config() : methods.config;
		var ui = _.isFunction(methods.ui) ? methods.ui() : methods.ui;
		
		Accounts.config(config);
		Accounts.ui.config(ui);
	}
});