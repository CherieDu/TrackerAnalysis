define(function(require){
var t=require("lib/i18n").t;
return function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<div id="tooltip" class="message"></div>\n<div id="close-panel"></div>\n<div id="header">\n\t<div id="header-icon"></div>\n\t<div id="header-text">\n\t\t<div id="ghostery-findings">\n\t\t\t<div id="ghostery-findings-text" class="ellipsis">\n\t\t\t\t'+
((__t=( t('panel_title_not_scanned') ))==null?'':_.escape(__t))+
'\n\t\t\t</div>\n\t\t\t<div id="website-info">\n\t\t\t\t<div id="website-url" class="ellipsis"></div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t<div class="tooltip" id="settings-button" title="'+
((__t=( t('panel_tooltip_settings') ))==null?'':_.escape(__t))+
'">\n\t</div>\n</div>\n\n<div id="settings" class="no-select">\n\t<div class="settings-buttons" id="options-button">'+
((__t=( t('panel_settings_options') ))==null?'':_.escape(__t))+
'</div>\n\t<div class="settings-buttons" id="support-button">'+
((__t=( t('panel_settings_support') ))==null?'':_.escape(__t))+
'</div>\n\t<div class="settings-buttons" id="about-button">'+
((__t=( t('panel_settings_about') ))==null?'':_.escape(__t))+
'</div>\n\t<div class="settings-buttons" id="share-button">'+
((__t=( t('panel_settings_share') ))==null?'':_.escape(__t))+
'</div>\n</div>\n\n<div id="apps-div">\n\t<div class="no-trackers">\n\t\t<div class="vertical-center">\n\t\t\t'+
((__t=( t('panel_not_scanned') ))==null?'':__t)+
'\n\t\t</div>\n\t</div>\n</div>\n\n<div id="reload">'+
((__t=( t('panel_needs_reload') ))==null?'':__t)+
'</div>\n<div id="whitelisted">'+
((__t=( t('panel_title_whitelisted',"", "") + "<br>" + t('panel_needs_reload') ))==null?'':__t)+
'</div>\n<div id="paused">'+
((__t=( t('panel_title_paused', "", "") + "<br>" + t('panel_needs_reload') ))==null?'':__t)+
'</div>\n<div id="paused-arrow"></div>\n<div id="whitelisted-arrow"></div>\n\n<div id="footer" class="no-select">\n\t<div unselectable="on" class="footer-button ellipsis left" id="pause-blocking-button" style="margin-left: 7px;" title="'+
((__t=( t('panel_button_pause_blocking_tooltip') ))==null?'':_.escape(__t))+
'">\n\t\t<div class="footer-button-desc">'+
((__t=( t('panel_button_pause_blocking') ))==null?'':_.escape(__t))+
'</div>\n\t</div>\n\t<div unselectable="on" class="footer-button ellipsis left disabled" id="whitelisting-button" title="'+
((__t=( t('panel_button_whitelist_site_tooltip') ))==null?'':_.escape(__t))+
'">\n\t\t<div class="footer-button-desc">'+
((__t=( t('panel_button_whitelist_site') ))==null?'':_.escape(__t))+
'</div>\n\t</div>\n\t<div class="footer-button left tooltip" id="help-button" title="'+
((__t=( t('panel_tooltip_help') ))==null?'':_.escape(__t))+
'</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>\n';
}
return __p;
};
});