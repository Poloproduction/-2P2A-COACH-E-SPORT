// default values
var dropDownValue = 'pc';

$(function() {
    $('#submit').click(function(e) {
        e.preventDefault();

        var data = {};

        var $epicNickName = $('#epicNickName').val();

        if($epicNickName == '') {
            sendAlert('Warning', 'Please type a Fortnite username', 'exclamation-circle');
            return;
        }

        $('#stats-general').hide();
        $('#stats-type').hide();
        $('.stats-box').show();
        $('.loading').show();

        data.epicNickName = $epicNickName.toLowerCase();
        data.dropDownValue = dropDownValue.toLowerCase();

        $.ajax({
            type: 'POST',
            url: '/stats',
            dataType: 'json',
            data: data,
            success: function(data) {
                data = JSON.parse(data);
                var res = displayData(data);

                $('.loading').hide();

                if (res === true) {
                    $('.stats-box h2').html(data.epicUserHandle + '\'s statistics');
                    
                    $('#stats-general').show();

                    var x = window.matchMedia("(max-width: 1240px)");
                    responsiveStats(x);
                    x.addListener(responsiveStats);
                } else {
                    $('.stats-box').hide();
                }
            }
        });
    });

    function displayData(data) {
        if(data.error) {
            sendAlert('Information', data.error, '');
            return false;
        }
        
        $('.stats-games').html(data.lifeTimeStats[7].value);
        $('.stats-kills').html(data.lifeTimeStats[10].value);
        $('.stats-kd').html(data.lifeTimeStats[11].value);
        $('.stats-score').html(data.lifeTimeStats[6].value);
        $('.stats-top1').html(data.lifeTimeStats[8].value);
        
        $('.stats-solo .number').html(data.stats.p2.matches.value);
        $('.stats-solo-top1').html(data.stats.p2.top1.value);
        $('.stats-solo-top10').html(data.stats.p2.top10.value);
        $('.stats-solo-top25').html(data.stats.p2.top25.value);
        $('.stats-solo-kills').html(data.stats.p2.kills.value);
        $('.stats-solo-kd').html(data.stats.p2.kd.value);
        $('.stats-solo-score').html(data.stats.p2.score.value);
        $('.stats-solo-score-match').html(data.stats.p2.scorePerMatch.value);
        
        $('.stats-duo .number').html(data.stats.p10.matches.value);
        $('.stats-duo-top1').html(data.stats.p10.top1.value);
        $('.stats-duo-top5').html(data.stats.p10.top5.value);
        $('.stats-duo-top12').html(data.stats.p10.top12.value);
        $('.stats-duo-kills').html(data.stats.p10.kills.value);
        $('.stats-duo-kd').html(data.stats.p10.kd.value);
        $('.stats-duo-score').html(data.stats.p10.score.value);
        $('.stats-duo-score-match').html(data.stats.p10.scorePerMatch.value);
        
        $('.stats-squad .number').html(data.stats.p9.matches.value);
        $('.stats-squad-top1').html(data.stats.p9.top1.value);
        $('.stats-squad-top3').html(data.stats.p9.top3.value);
        $('.stats-squad-top6').html(data.stats.p9.top6.value);
        $('.stats-squad-kills').html(data.stats.p9.kills.value);
        $('.stats-squad-kd').html(data.stats.p9.kd.value);
        $('.stats-squad-score').html(data.stats.p9.score.value);
        $('.stats-squad-score-match').html(data.stats.p9.scorePerMatch.value);

        return true;
    }
});

$('.input').on('input', function(e) {
    if($(e.target).val()) {
        $('button').html('Find ' + $(e.target).val() + '\'s stats');
    }
    else {
        $('button').html('Find player\'s stats');
    }
    
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

function responsiveStats(x) {
    if (x.matches) {
        $('#stats-type').css('display', 'block');
        $('#stats-general-content').css('display', 'block');
    } else {
        $('#stats-type').css('display', 'flex');
        $('#stats-general-content').css('display', 'flex');
    }
}