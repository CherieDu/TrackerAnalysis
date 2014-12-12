// @author: conmarap

$(document).ready(function() {
    var ev = '[data-dismiss="modal"]';
    
    function openModal(id) {
        $(id).fadeIn();
        
        setTimeout(function() {
            var dialog = $(id + " > .modal-dialog");
            
            if(dialog.length > 0) {
                dialog = $(dialog[0]);
                dialog.toggleClass("modal-dialog-closed");
            }
        }, 200);
    }
    
    function closeModal(item) {
        var _item = $(item).parent().parent().parent().parent();
        _item.fadeOut();
        $(_item.find(".modal-dialog")[0]).addClass("modal-dialog-closed");
    }
    
    function closeThis(item) {
        $(item).fadeOut();
        $($(item).find(".modal-dialog")[0]).addClass("modal-dialog-closed");
    }
    
    $(document).on("click", ev, function(e) {
        closeModal(this);
    });
    
    $(".modal").on("click", function(e) {
        if($(e.target).hasClass("modal")) {
            console.log("REMOVE");
            closeThis(e.target);
        }
    });
    
    // Button handler
    $("#show-data-table").on("click", function(e) {
        openModal($(this).attr("data-toggle"));
    });
    
    openModal("#thismodal");
});