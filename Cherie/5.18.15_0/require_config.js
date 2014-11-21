/*jshint unused:false */
var require = {
	baseUrl: '.',
	paths: {
		tpl: "data/templates/precompiled",
		jquery: "scripts/lib/vendor/jquery-1.7.2",
		jqueryui: "scripts/lib/vendor/jquery-ui-1.10.4.custom",
		underscore: "scripts/lib/vendor/underscore-1.4.3",
		backbone: "scripts/lib/vendor/backbone-0.9.10",
		apprise: "scripts/lib/vendor/apprise/apprise-1.5.full",
		tiptip: "scripts/lib/vendor/tipTip/jquery.tipTip",
		moment: "scripts/lib/vendor/moment/moment",
		scrollintogreatness: "scripts/lib/vendor/jquery.scrollintogreatness-2.0.0",
		bootstrap: "scripts/lib/vendor/bootstrap/bootstrap"
	},
	shim: {
		underscore: {
			exports: "_"
		},
		backbone: {
			deps: ["underscore", "jquery"],
			exports: "Backbone"
		},
		apprise: {
			exports: "apprise"
		},
		tiptip: {
			deps: ["jquery"]
		},
		scrollintogreatness: {
			deps: ["jquery"]
		},
		bootstrap: {
			deps: ["jquery"]
		}
	},
	waitSeconds: 0
};
