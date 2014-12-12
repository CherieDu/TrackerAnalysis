/* Toggles the blocking state globally. */
function whitelistSite() {
  whitelist = deserialize(options.whitelist) || {};
  siteWhitelist = whitelist[domain] || (whitelist[domain] = {});
  var disconnectWhitelist =
      siteWhitelist.Disconnect || (siteWhitelist.Disconnect = {});
  var serviceWhitelist =
      disconnectWhitelist.services || (disconnectWhitelist.services = {});
  var advertisingWhitelist =
      siteWhitelist.Advertising || (siteWhitelist.Advertising = {});
  var analyticsWhitelist =
      siteWhitelist.Analytics || (siteWhitelist.Analytics = {});
  var socialWhitelist = siteWhitelist.Social || (siteWhitelist.Social = {});
  var trackingUnblocked =
      serviceWhitelist.Facebook && serviceWhitelist.Google &&
          serviceWhitelist.Twitter && advertisingWhitelist.whitelisted &&
              analyticsWhitelist.whitelisted && socialWhitelist.whitelisted &&
                  (siteWhitelist.Content || {}).whitelisted !== false;
  serviceWhitelist.Facebook =
      serviceWhitelist.Google =
          serviceWhitelist.Twitter =
              advertisingWhitelist.whitelisted =
                  analyticsWhitelist.whitelisted =
                      socialWhitelist.whitelisted = !trackingUnblocked;
  advertisingWhitelist.services = analyticsWhitelist.services =
      socialWhitelist.services = {};
  !trackingUnblocked &&
      (siteWhitelist.Content = {whitelisted: true, services: {}});
  options.whitelist = JSON.stringify(whitelist);
  blacklist = deserialize(options.blacklist);
  blacklist && delete blacklist[domain];
  options.blacklist = JSON.stringify(blacklist || {});
  tabApi.reload(tabId);
  return trackingUnblocked;
}

/* Constants. */
var backgroundPage = chrome.extension.getBackgroundPage();
var deserialize = backgroundPage.deserialize;
var updateClosed = deserialize(options.updateClosed);
var recommendsActivated =
    deserialize(options.recommendsExperiment) &&
        !deserialize(options.recommendsClosed);
var tabApi = chrome.tabs;
var whitelist;
var domain;
var tabId;
var siteWhitelist;
var getService = backgroundPage.getService;
var graph;
var addon = CollusionAddon;
var sitesHidden = deserialize(options.sitesHidden);
var ranOnce;
var sidebarCollapsed = parseInt(options.sidebarCollapsed, 10);
var blacklist;
var siteBlacklist;


/* Paints the graph UI. */
function renderGraph() {
  if (SAFARI) {
    $("#list").hide();
    $("#chart svg").remove();
    safari.self.width = 706;
    safari.self.height = 490;
    $("body").add("#update").add("#chart").addClass("safari");
    $("#update .safari").show();
    $("#logo").attr({
      src: "../images/chrollusion/safari.png", alt: "Collusion for Safari"
    });
  } else {
    if (!deserialize(options.promoHidden)) {
      options.promoHidden = true;

      setTimeout(function() {
        chrome.browserAction.setBadgeText({text: ""});
      }, 200);
    }

    $("#update .chrome").show();
    $("#logo").attr({
      src: "../images/chrollusion/greenlogo.jpg", alt: "Collusion for Chrome", 
      style: "height : 80; width: 200",
    });
  }

  updateClosed || $("#update").show();
  recommendsActivated && $("#recommends").show();

  $("a").click(function() {
    tabApi.create({url: $(this).attr("href")});
    return false;
  });

  $("#domain-infos").hide();
  whitelist = deserialize(options.whitelist) || {};
$("#show-tracking-list").html("Show tracker list");
$("#show-data-table").html("What data do they collect");

  tabApi.query({currentWindow: true, active: true}, function(tabs) {
    var tab = tabs[0];
    domain = backgroundPage.GET(tab.url);
    tabId = tab.id; 
    siteWhitelist = whitelist[domain] || (whitelist[domain] = {});
    var serviceWhitelist = (siteWhitelist.Disconnect || {}).services || {};
  
    if (
      serviceWhitelist.Facebook && serviceWhitelist.Google &&
          serviceWhitelist.Twitter &&
              (siteWhitelist.Advertising || {}).whitelisted &&
                  (siteWhitelist.Analytics || {}).whitelisted &&
                      (siteWhitelist.Content || {}).whitelisted &&
                          (siteWhitelist.Social || {}).whitelisted
    ) {
      $("#unblock-tracking").addClass("invisible").html("Block tracking sites");
    } else {
      $("#unblock-tracking").html("Unblock tracking sites");
    }
  });

  if (!deserialize(options.browsingHardened)) {
    $("#disable-wifi").addClass("invisible").html("Enable Wi-Fi security");
  } else {
    $("#disable-wifi").removeClass("invisible").html("Disable Wi-Fi security");
  }

  $("#show-instructions").hide();
  var runner = GraphRunner.Runner({
    width: sidebarCollapsed ? SAFARI ? 697 : 700 : SAFARI ? 485 : 484,
    height:
        updateClosed ?
            (SAFARI ? 495 : (recommendsActivated ? 434 : 484)) :
                (SAFARI ? 454 : (recommendsActivated ? 387 : 446)),
    hideFavicons: false
  });
  graph = runner.graph;

  if (addon.isInstalled()) {
    // You should only ever see this page if the addon is installed, anyway
    graph.update(backgroundPage.LOG);

    if (!ranOnce) {
      ranOnce = true;

      $("#update .close").click(function() {
        options.updateClosed = true;
        window.location.reload();
      });

      $("#recommends .close").click(function() {
        setTimeout(function() {
          options.recommendsClosed = true;
          window.location.reload();
        }, 100);
      });

      if (sidebarCollapsed) {
        $("#show-sidebar").show();
        $("#chart").addClass("fullscreen");
      } else {
        $("#sidebar").show();
        $("#chart").removeClass("fullscreen");
      }

    function isBlocked(host, trackerInfo) {
      trackerInfo = trackerInfo || {};
      var childService = getService(host);
      var parentService = getService(domain);
      var category = trackerInfo.category || null;
      var categoryWhitelist = siteWhitelist[category] || {};
      var name = trackerInfo.name || null;
      return !(
        childService && parentService && childService.name == parentService.name
      ) && (
        category != 'Content' && !categoryWhitelist.whitelisted &&
            !(categoryWhitelist.services || {})[name] ||
                (siteBlacklist[category] || {})[name]
      );
    }


    //Cherie
      $("#show-tracking-list").click(function() {
        $(this).text("Hide tracker list");
        var d3trackerList = d3.selectAll("line.tracker")[0];
        var n = d3trackerList.length;
        console.log("d3trackerList");
        console.log(d3trackerList);
        console.log("n");
        console.log(n);
        var onetracker = d3trackerList[0].__data__;       
        console.log("onetracker");
        console.log(onetracker); 
        var trackerList = [];

        var i = 0;
        for ( i = 0; i < n; i = i + 1){
            trackerList.push(d3trackerList[i].__data__);
        }
        console.log("trackerList");
        console.log(trackerList); 
        
        var list = $("#Cherie-show-trackerlist");
        if (list.hasClass("invisible")){
            $(this).text("Show tracker list");
            list.empty();
            list.removeClass("invisible");

        }else{ 
            list.empty();

            list.append("<h3>Tracker List: </h3>");

            for ( i = 0; i < n; i = i + 1){
              var item = $('<li><a></a></li>');
              item.find("a").text(trackerList[i].name).attr("href", "http://" + trackerList[i].name);
              
              if(trackerList[i].trackerInfo != false){
                var Tcategory = trackerList[i].trackerInfo.category;
                if (Tcategory == "Content"){
                  item.find("a").attr("style", "background-color:#4DB8FF");
                }
                else if (Tcategory == "Social"){
                  item.find("a").attr("style", "background-color:#F3E7FF");
                }  
                else if (Tcategory == "Analytics"){
                  item.find("a").attr("style", "background-color:#DFFFDF");
                }   
                else if (Tcategory == "Advertising"){
                  item.find("a").attr("style", "background-color:#FFFFB2");
                }  
                else if (Tcategory == "Disconnect"){
                  item.find("a").attr("style", "background-color:#E8A3FF");
                }
              }
              //item.find("a").text(trackerList[i].name).attr("href", "http://" + trackerList[i].name);
              list.append(item);
            }          
            list.append("<br>");

            list.append("<div></div>")
            var categoryChart = list.find("div");

            categoryChart.append("<h2>Category chart:</h2>");

            var categoryChartTable = categoryChart.find("h2");
            categoryChartTable.append("<li style=\"background-color:#FFFFB2\">Advertising</li>");
            categoryChartTable.append("<li style=\"background-color:#F3E7FF\">Social</li>");
            categoryChartTable.append("<li style=\"background-color:#DFFFDF\">Analytics</li>");
            categoryChartTable.append("<li style=\"background-color:#4DB8FF\">Content</li>");
            categoryChartTable.append("<li style=\"background-color:#E8A3FF\">Popular</li>");
            categoryChartTable.append("<br>");

            list.addClass("invisible");
        }
          //
       });


//       $("#show-data-table").click(function() {
//         $(this).append(

// // <div class="modal" id="thismodal">
// //     <div class="modal-dialog modal-dialog-closed modal-fill">
// //         <div class="modal-content">
// //             <div class="modal-header">
// //                 <span class="modal-title">This is my awesome modal</span>
// //                 <button type="button" class="close" data-dismiss="modal" data-remove="#thismodal">
// //                     <span aria-hidden="true">&times;</span>
// //                 </button>
// //             </div>
// //             <div class="modal-body">
// //                 <div class"par">
// //                   This is my awesome modal; it was inspired by the one in <a href="http://getbootstrap.com">Twitter Bootstrap</a>, but written completely from scratch and enhanced to be responsive and nice to look at.
// //                 </div>
// //                 <p class="par">
// //                   <b>You have two options:</b> To open it up as a simple modal, small and limited to the top of the... you have to do is add the class <span class="code">modal-fill</span> to it.
// //                 </p>
// //                 <div class="par">
// //                     Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit 
// //                 </div>
// //             </div>
// //             <div class="modal-footer">
                
// //             </div>
// //         </div>
// //     </div>
// // </div>

// // );


//       }


      $("#unblock-tracking").click(function() {
        var trackingUnblocked = whitelistSite();
        $(this).
          toggleClass("invisible").
          text((trackingUnblocked ? "Unblock" : "Block") + " tracking sites");
        d3.selectAll("line.tracker").classed("hidden", !trackingUnblocked);
        $(".whitelisting img")[0].alt =
            trackingUnblocked ? "Whitelist" : "Blacklist";
        $(".whitelisting.text").
          text((trackingUnblocked ? "Whitelist" : "Blacklist") + " site");
      });

      $("#disable-wifi").click(function() {
        var wifiDisabled =
            options.browsingHardened = !deserialize(options.browsingHardened);
        $(this).
          toggleClass("invisible").
          text((wifiDisabled ? "Disable" : "Enable") + " Wi-Fi security");
        $(".wifi input")[0].checked = wifiDisabled;
      });

      $("#hide-sidebar").click(function() {
        sidebarCollapsed = options.sidebarCollapsed = 3;

        $("#sidebar").slideUp(function() {
          $("#chart svg").remove();

          setTimeout(function() { $("#show-sidebar").slideDown(100); }, 400);

          $("#chart").addClass("fullscreen");
          renderGraph();
        });
      });

      $("#show-instructions").click(function() {
        $("#domain-infos, #show-instructions").hide();
        $(".live-data").show();
      });

      $("#show-sidebar").click(function() {
        delete options.sidebarCollapsed;
        sidebarCollapsed = options.sidebarCollapsed;

        $("#show-sidebar").slideUp(100, function() {
          $("#chart svg").remove();
          $("#sidebar, .live-data, #show-instructions").slideDown();
          $("#chart").removeClass("fullscreen");
          renderGraph();
        });
      });

      $("#show-list").click(function() {
        options.displayMode = "list";

        $("#graph").fadeOut(function() {
          $("#chart svg").remove();

          if (SAFARI) {
            safari.self.width = 200;
            safari.self.height = 306;
          }

          var previousScene = currentScene;
          currentScene = getScene();
          SCENES.push(previousScene);
          $(".visualization img")[0].src =
              "../images/" + currentScene + "/1.png";
          d3.selectAll(".total").remove();
          d3.selectAll(".subtotal").remove();

          $("#list").fadeIn(function() { renderGraphs(); });
        });
      });
    }
  }
}




