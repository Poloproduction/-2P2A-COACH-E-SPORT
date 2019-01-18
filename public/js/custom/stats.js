// default values
var dropDownValue = 'pc';

$(function(){
    var submitBtn = $('#submit');
    var epicNickName = $('#epicNickName');
    var results = $('#results');


    
    submitBtn.click(function(){
        var data = {};
        data.epicNickName = epicNickName.val().toLowerCase();
        data.dropDownValue = dropDownValue.toLowerCase();
        $.ajax({
            type: "POST",
            url: '/stats',
            dataType: 'json',
            data: data,
            success: function(data){
                data = JSON.parse(data);
                displayData(data);
            }
        });
        resetResult();
    });

    function resetResult(){
        results.html('');
        epicNickName.val('');
    }

    function displayData(data){
        var epicUserHandle = data.epicUserHandle;
        var list = '<ul class="list-group">' +
                        '<li>' + 'Solo: ' + data.stats.p2.top1.value + '</li>' +
                        '<li>' + 'Duos: ' + data.stats.p10.top1.value + '</li>' +
                        '<li>' + 'Teams: ' + data.stats.p9.top1.value + '</li>' +
                    '</ul>';
        var template = '<div>' +
                            '<h5>' + epicUserHandle + '</h5>' +
                            '<div>' +
                                '<h5>' + 'Wins' + '</h5>' +
                               ' <p>' + list + '</p>' +
                            '</div>' +
                        '</div>';
        results.html(template);
    }
});

$('.input').on('input', function(e) {
    $('button').html('Find ' + $(e.target).val() + '\'s stats');
});

$('.platform-box').click(function() {
    $(this).find('.platform').prop('checked', true);
    $('.platform-box').removeClass('selected');
    $(this).addClass('selected');
    dropDownValue = $(this).find('.platform').val();
});

$('input[type=radio]').click(function() {
	$('.platform-box').removeClass('selected');
    $(this).parent().toggleClass('selected');
});