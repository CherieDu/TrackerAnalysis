/*!
 * Ghostery for Chrome
 * http://www.ghostery.com/
 *
 * Copyright 2014 Ghostery, Inc. All rights reserved.
 * See https://www.ghostery.com/eula for license.
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'lib/i18n',
	'tpl/panel',
	'tpl/_panel_app',
	'lib/utils',
	// modules below this line do not return useful values
	'bootstrap', // jQuery plugin
	'jqueryui' // For animating classes
], function ($, _, Backbone, i18n, panel_tpl, panel_app_tpl, utils) {
	var t = i18n.t;

	var Models = {
		Panel: Backbone.Model.extend({
			defaults: {
				language: 'en'
			}
		}),
		Tracker: Backbone.Model.extend({
			defaults: {
				language: 'en'
			}
		})
	},

	Collections = {
		Trackers: Backbone.Collection.extend({
			model: Models.Tracker,
			comparator: function (tracker) {
				return tracker.get('name').toLowerCase();
			}
		})
	},

	Views = {
		Panel: Backbone.View.extend({
			tagName: 'div',
			template: panel_tpl,
			initialize: function () {
				this.model.on('change:trackers change:conf', this.renderTrackers, this);
				this.model.on('change:whitelisted change:trackers change:pauseBlocking', this.updatePauseBlocking, this);
				this.model.on('change:whitelisted change:validProtocol', this.updateWhitelistSite, this);
				this.model.on('change:whitelisted change:trackers change:page change:pauseBlocking change:validProtocol', this.updateGhosteryFindingsText, this);
				this.model.on('change:needsReload', this.updateNotification, this);
				this.model.on('change:language', this.updateLanguage, this);


				this.model.set('tooltipTimer', null);

				i18n.init(this.model.get('language'));
			},
			events: {
				'click #settings-button': 'toggleSettings',
				'click #pause-blocking-button': 'setPauseBlocking',
				'click #whitelisting-button': 'setWhitelistSite',
				'click .reload': 'reloadTab',





				'click #options-button': function () {
					sendMessage('openOptions');
					this.hidePanel();
				},
				'click #support-button': function () {
					openTab('https://www.ghostery.com/feedback');
					this.hidePanel();
				},
				'click #about-button': function () {
					sendMessage('openAbout');
					this.hidePanel();
				},
				'click #share-button': function () {
					openTab('https://www.ghostery.com/share');
					this.hidePanel();
				}
			},

			// Render functions
			render: function () {
				this.$el.html(this.template(this.model.toJSON()));
				return this;
			},
			renderTrackers: function () {
				var Trackers,
					appsMap = [],
					trackers = this.model.get('trackers'),
					conf = this.model.get('conf'),
					/*page = this.model.get('page'),*/
					frag = document.createDocumentFragment(),
					validProtocol = this.model.get('validProtocol');

				if (!trackers || trackers.length === 0) {
					// Set apps div text
					this.$('#apps-div').empty();
					this.$('#apps-div')
						.append($('<div class="no-trackers"><div class="vertical-center">' +
							t(validProtocol ? 'panel_no_trackers_found' : 'panel_not_scanned') +
							'</div></div>'));
				} else {
					var page = this.model.get('page');

					this.$('#apps-div').empty().scrollTop(0);

					trackers.forEach(function (app) {
						appsMap.push({
							id: app.id,
							name: app.name,
							category: app.cat,
							tags: app.tags,
							sources: app.sources,
							hasCompatibilityIssue: app.hasCompatibilityIssue,
							blocked: app.blocked,
							siteSpecificUnblocked: (conf.site_specific_unblocks.hasOwnProperty(page.host) && conf.site_specific_unblocks[page.host].indexOf(+app.id) >= 0),
							globalBlocked: conf.selected_app_ids.hasOwnProperty(app.id),
							// TODO panel-wide stuff inside each model, yucky
							expand_sources: this.model.get('conf').expand_sources,
							pauseBlocking: this.model.get('pauseBlocking'),
							page_host: page.host
						});
					}, this);

					Trackers = new Collections.Trackers(appsMap);
					Trackers.each(function (tracker) {
						frag.appendChild((new Views.Tracker({
							model: tracker
						})).render().el);
					});

					this.$('#apps-div').append(frag);
				}
			},

			// Set functions
			setPauseBlocking: function () {
				if (this.$('#pause-blocking-button').hasClass('disabled')) {
					return;
				}
				sendMessage('panelPauseToggle');
				this.model.set('pauseBlocking', !this.model.get('pauseBlocking'));
				this.setNeedsReload('pauseBlocking');
			},

			initializeStartingStates: function () {
				var needsReload = utils.deepClone(this.model.get("needsReload"));

				// Initialize starting state for deciding whether you actually need to reload
				// If it's part of the needsReload object (stored in tabInfo) then it
				// will only be set the first time you open the panel after a page load
				if (!needsReload.startingStates) {
					needsReload.startingStates = [];
					if (this.model.get("pauseBlocking")) {
						needsReload.startingStates.push("pauseBlocking");
					}

				}

				sendMessage('needsReload', {
					needsReload: needsReload
				});
				this.model.set('needsReload', needsReload);
			},
			setNeedsReload: function (updated) {
				// Backbone doesn't recognize adding/removing an item from
				// an object or array as 'changing' it, clone to create new ref
				var needsReload = utils.deepClone(this.model.get('needsReload'));

				// Add/remove what changed to needsReload object
				if (needsReload.changes[updated]) {
					delete needsReload.changes[updated];
				} else {
					needsReload.changes[updated] = true;
				}

				sendMessage('needsReload', {
					needsReload: needsReload
				});
				this.model.set('needsReload', needsReload);
			},

			// Update functions
			updateLanguage: function () {
				i18n.init(this.model.get('language'));
				this.render();
				this.updateGhosteryFindingsText();
			},
			updatePauseBlocking: function () {
				var $button = this.$('#pause-blocking-button');

				if (!this.model.get('validProtocol')) {
					$button.addClass('disabled');
					return;
				}

				$button.removeClass('disabled');

				if (this.model.get('pauseBlocking')) {
					$button.children().text(t('panel_button_resume_blocking'));
					this.$('.app-global-blocking').addClass('paused');
				} else {
					$button.children().text(t('panel_button_pause_blocking'));
					this.$('.app-global-blocking').removeClass('paused');
				}
			},

			updateGhosteryFindingsText: function () {
				var $panel_title = this.$('#ghostery-findings-text'),
					num_apps = (this.model.get('trackers') ? this.model.get('trackers').length : 0),
					validProtocol = this.model.get('validProtocol'),
					paused = this.model.get('pauseBlocking');

				// Set findings panel host
				this.$('#website-url').text(validProtocol ? this.model.get('page').host : '');

				// Set findings panel title
				if (!validProtocol) {
					$panel_title.html(t('panel_title_not_scanned'));
				} else if (paused) {
					// Pulled the span placeholders out of this string so we can reuse without
					$panel_title.html(t('panel_title_paused', "<span class='yellow'>", "</span>"));
				} else {
					$panel_title.html(t('panel_title_' + (num_apps == 1 ? 'singular' : 'plural'), num_apps));
				}
			},
			getNeedsReload: function () {
				var needsReload = this.model.get("needsReload"),
					start = needsReload.startingStates;

				// Wasn't paused on load, any change needs reload
				if (!start || start.length === 0) {
					return _.size(needsReload.changes) > 0;

				// Was whitelisted on load, only need reload if whitelist turned off and paused not turned on
				} 
			},
			updateNotification: function () {
				var paused = this.model.get('pauseBlocking'),
					needsReload,
					that = this,
					newNotification;

				needsReload = this.getNeedsReload();

				if (paused && needsReload) {
					newNotification = "pr";
				} else if (paused) {
					newNotification = "p";
				} else if (needsReload) {
					newNotification = "r";
				} else {
					newNotification = "n";
				}

				// Don't refresh the notification if it hasn't changed
				// Update (and initially set) currentNotification
				if (!this.currentNotification || this.currentNotification !== newNotification) {
					this.hideNotification();

					// Delay showing to notification to allow hiding to finish and
					// ensure all backbone models have been updated
					setTimeout(function () { that.showNotification(newNotification); }, 100);

					this.currentNotification = newNotification;
				}
			},
			showNotification: function (newNotification) {
				// 6 possible states of the notification:
				// nothing, reload, pause, pause + reload, whitelist, whitelist + reload
				switch (newNotification) {
					case 'n':
						break;
					case 'r':
						this.$("#reload").addClass("showing", "fast");
						this.$("#apps-div").addClass("notification", "fast");
						break;
					case 'p':
						this.$("#paused").addClass("showing", "fast");
						this.$("#apps-div").addClass("notification", "fast");
						this.arrowTimeout = setTimeout(function () { $("#paused-arrow").addClass("showing", "fast"); }, 350);
						break;
					case 'pr':
						this.$("#paused").addClass("showing-double", "fast");
						this.$("#apps-div").addClass("notification-double", "fast");
						this.arrowTimeout = setTimeout(function () { $("#paused-arrow").addClass("showing", "fast"); }, 350);
						break;
					case 'w':
						this.$("#whitelisted").addClass("showing", "fast");
						this.$("#apps-div").addClass("notification", "fast");
						this.arrowTimeout = setTimeout(function () { $("#whitelisted-arrow").addClass("showing", "fast"); }, 350);
						break;
					case 'wr':
						this.$("#whitelisted").addClass("showing-double", "fast");
						this.$("#apps-div").addClass("notification-double", "fast");
						this.arrowTimeout = setTimeout(function () { $("#whitelisted-arrow").addClass("showing", "fast"); }, 350);
						break;
				}
			},
			hideNotification: function () {
				if (this.arrowTimeout) {
					clearTimeout(this.arrowTimeout);
				}
				this.$("#reload, #paused, #whitelisted").removeClass("showing showing-double", "fast");
				this.$("#apps-div").removeClass("notification notification-double", "fast");
				this.$("#paused-arrow, #whitelisted-arrow").removeClass("showing", "fast");
			},


			// Toggle functions
			toggleSettings: function () {
				this.$('#apps-div').animate({ top: (this.$('#settings').is(':visible') ? '55px' : '105px') }, {
					duration: 'fast'
				});
				this.$('#settings-button').toggleClass('selected', this.$('#settings').is(':hidden'));
				this.$('#settings').slideToggle({
					duration: 'fast',
					complete: _.bind(function () {
						this.$('#settings-button').toggleClass('selected', !this.$('#settings').is(':hidden'));
					}, this)
				});
			},

			// returns true when we just changed a particular attribute, and only that attribute
			justChangedOnly: function (attr) {
				return this.model.changed.hasOwnProperty(attr) && _.size(this.model.changed) == 1;
			},

			reloadTab: function (e) {
				sendMessage('reloadTab');
				this.hidePanel();
				e.preventDefault();
			},

			hidePanel: function () {
				if (this.$('#settings').is(':visible')) {
					this.toggleSettings();
				}
				sendMessage('panelClose');
			},

			handleLink: function (e) {
				openTab(e.target.href);
				this.hidePanel();
				e.preventDefault();
			},

			tooltip: function (element) {
				var $tooltip = this.$('#tooltip');

				// Reset timer
				this.model.set('tooltipTimer', null);

				function determineLocation(windowWidth, windowHeight, mouseX, mouseY) {
					var top,
						right,
						bottom,
						left;

					if (mouseX > windowWidth / 2) {
						left = 'auto';
						right = (windowWidth - mouseX) + 'px';
					} else {
						left = mouseX + 'px';
						right = 'auto';
					}

					if (mouseY > windowHeight / 2) {
						top = 'auto';
						bottom = (windowHeight - mouseY) + 'px';
					} else {
						top = mouseY + 'px';
						bottom = 'auto';
					}

					return {
						top: top,
						right: right,
						bottom: bottom,
						left: left
					};
				}

				$(element)
					.unbind('mouseenter mouseout')
					.bind({
						mouseenter: _.bind(function (e) {
							var tooltipTimer = this.model.get('tooltipTimer');

							if (tooltipTimer !== null) {
								window.clearTimeout(tooltipTimer);
								$tooltip.text(element.getAttribute('title'));
								$tooltip.css(determineLocation($(window).width(), $(window).height(), e.pageX, e.pageY));
								$tooltip.show();
							} else {
								this.model.set('tooltipTimer', window.setTimeout(function () {
									$tooltip.text(element.getAttribute('title'));
									$tooltip.css(determineLocation($(window).width(), $(window).height(), e.pageX, e.pageY));
									$tooltip.show();
								}, 1500));
							}
						}, this),
						mouseout: _.bind(function () {
							var tooltipTimer = this.model.get('tooltipTimer');

							if (tooltipTimer !== null) {
								window.clearTimeout(tooltipTimer);
							}

							this.model.set('tooltipTimer', window.setTimeout(_.bind(function () {
								this.model.set('tooltipTimer', null);
								$tooltip.fadeOut({
									duration: 'fast'
								});
							}, this), 10));
						}, this)
					});
			},


		}),

		Tracker: Backbone.View.extend({
			tagName: 'div',
			className: 'app-div',
			template: panel_app_tpl,
			initialize: function () {
				this.model.on('change:globalBlocked', this.updateGlobalBlock, this);
				this.model.on('change:siteSpecificUnblocked', this.updateSiteSelectiveUnblock, this);
			},
			events: {
				'click .app-info-container': 'toggleSources',
				'mousedown .app-global-blocking': 'setGlobalBlock',
				'click .app-site-blocking': 'setSiteSpecificUnblock',
				'click .app-moreinfo-link': 'handleLink',
				'click .app-src-link': 'handleLink'
			},

			// Render functions
			render: function () {
				this.$el.html(this.template(this.model.toJSON()));

				this.$('.tracker-alert').tooltip({
					placement: function (tooltip, ele) {
						var $container = $('#apps-div'),
							containerHeight = $container.height(),
							tooltipHeight = 48,
							tooltipOffsetTop = $(ele).offset().top;

						return tooltipOffsetTop > containerHeight - tooltipHeight ? 'top' : 'bottom';
					}
				});

				return this;
			},

			// Set functions
			setGlobalBlock: function () {
				var blocked = this.model.get('globalBlocked'),
					app_id = this.model.get('id');

				sendMessage('panelSelectedAppsUpdate', {
					app_id: app_id,
					app_selected: !blocked
				});

				this.model.set('globalBlocked', !blocked);
				panel.setNeedsReload(app_id);
			},

			setSiteSpecificUnblock: function () {
				var unblocked = this.model.get('siteSpecificUnblocked'),
					app_id = this.model.get('id');

				sendMessage('panelSiteSpecificUnblockUpdate', {
					app_id: app_id,
					siteSpecificUnblocked: !unblocked
				});

				this.model.set('siteSpecificUnblocked', !unblocked);
				panel.setNeedsReload("site_" + app_id);
			},

			// Update functions
			updateGlobalBlock: function () {
				var blocked = this.model.get('globalBlocked');

				this.$('.blocking-controls')
					.tooltip('destroy')
					.tooltip({
						trigger: 'manual',
						title: t('panel_tracker_global_block_message_' + (blocked ? 'blocked' : 'unblocked')),
						placement: 'left'
					})
					.tooltip('show');

				window.clearTimeout(this.model.get('tooltipTimer'));
				this.model.set('tooltipTimer', window.setTimeout(_.bind(function () {
					this.$('.blocking-controls').tooltip('destroy');
				}, this), 1400));

				if (!blocked) {
					this.$('.app-global-blocking').animate({ 'background-position-x': '-17px' }, {
						duration: 'fast',
						complete: function () {
							$(this).removeClass('blocked').addClass('unblocked');
							$(this).parent().removeClass('blocked').addClass('unblocked');
						}
					});
				} else {
					this.$('.app-global-blocking').animate({ 'background-position-x': '3px' }, {
						duration: 'fast',
						complete: function () {
							$(this).removeClass('unblocked').addClass('blocked');
							$(this).parent().removeClass('unblocked').addClass('blocked');
						}
					});
				}
			},
			updateSiteSelectiveUnblock: function () {
				var siteSpecificUnblocked = this.model.get('siteSpecificUnblocked'),
					host = panel.model.get('page').host;

				if (siteSpecificUnblocked) {
					this.$('.blocking-controls')
						.tooltip('destroy')
						.tooltip({
							trigger: 'manual',
							html: true,
							title: t('panel_tracker_site_specific_unblock_message', host),
							placement: 'left'
						})
						.tooltip('show');

					window.clearTimeout(this.model.get('tooltipTimer'));
					this.model.set('tooltipTimer', window.setTimeout(_.bind(function () {
						this.$('.blocking-controls').tooltip('destroy');
					}, this), 1400));
				}

				if (siteSpecificUnblocked) {
					this.$('.app-site-blocking')
						.removeClass('off').addClass('on')
						.attr('title', t('panel_tracker_site_specific_unblock_tooltip_on', this.model.get('name'), host));
				} else {
					this.$('.app-site-blocking')
						.removeClass('on').addClass('off')
						.attr('title', t('panel_tracker_site_specific_unblock_tooltip_off', this.model.get('name'), host));
				}
			},

			// Toggle functions
			toggleSources: function () {
				this.$('.app-arrow').toggleClass('down', !this.$('.app-srcs-container').is(':visible'));

				this.$('.app-moreinfo').slideToggle({
					duration: 'fast'
				});

				this.$('.app-srcs-container').slideToggle({
					duration: 'fast',
					complete: _.bind(function () {
						this.$('.app-arrow').toggleClass('down', this.$('.app-srcs-container').is(':visible'));
					}, this)
				});
			},

			handleLink: function (e) {
				openTab(e.target.href);
				panel.hidePanel();
				e.preventDefault();
			}
		})
	};

	function openTab(url) {
		sendMessage('openTab', { url: url });
		window.close();
	}

	// hack to keep the above identical to safari
	// TODO standardize on messaging (lowest common denominator)
	function sendMessage(name, message) {
		if (name == 'panelClose') {
			window.close();
		} else {
			// New chrome vs old chrome messaging
			(chrome.runtime && chrome.runtime.sendMessage || chrome.extension.sendMessage)({
				name: name,
				message: message
			});
		}
	}

	var panel = new Views.Panel({
		model: new Models.Panel({})
	});

	return panel;

});
