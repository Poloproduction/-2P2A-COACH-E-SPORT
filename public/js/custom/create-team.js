$('.input').on('input', function(e) {
    $('button').html('Create ' + $(e.target).val());
});