function loadPage(pageName) {
    $.ajax({
        url : '../public/template/' + pageName + '.ejs',
        type : 'GET',
        success : function(page) {
            $('.form').html(page);
        }
    });
}

$('.actions button').click(function() {
    var $buttonId = $(this).attr('id');

    if($buttonId != 'login' && $buttonId != 'join') {
        return;
    }

    if(!$(this).hasClass('active')) {
        $('.actions button').toggleClass('active');
        
        loadPage($buttonId);
    }
});

loadPage('login');