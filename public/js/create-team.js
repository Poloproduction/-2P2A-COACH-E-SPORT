$('.input').on('input', function(e) {
    if($(e.target).val()) {
        $('button').html('Create ' + $(e.target).val());
    }
    else {
        $('button').html('Create your team');
    }
});

$('.offer-box').click(function() {
    $(this).find('.offer').prop('checked', true);
    $('.offer-box').removeClass('selected');
    $(this).addClass('selected');
});

$('input[type=radio]').click(function() {
	$('.offer-box').removeClass('selected');
	$(this).parent().toggleClass('selected');
});