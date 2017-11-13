angular
.module("WidgetConfig", [])
.constant("CONFIG", {
    options : {
	      baseUrl: "https://{{your_org_domain}}.okta.com",
        clientId: "{{clientId}}",
        redirectUri: "{{redirectUri}}",
        features: {
            rememberMe: true,
            smsRecovery: true,
            selfServiceUnlock: true,
            multiOptionalFactorEnroll: true
          },
        logo: 'images/LOGO.png',
  	    authScheme: "OAUTH2",
  	    authParams: {
    	      responseType: ["id_token", "token"],
    	      responseMode: "okta_post_message",
    	      scopes : [
      		      "openid",
      		      "email",
      		      "profile",
      		      "address",
      		      "phone"
    	      ]
  	    }
    }
});
