function renderVoteData(vote) {
    console.log('rendering vote', vote);
    var skript = $('#skript-' + vote.id);
    skript.find('.vote-number').text(vote.votes);
    skript.find('.vote-bar').animate( { width: '' + (vote.votePercentage * 100) + '%'}, 300);
    if (vote.channel) {
      skript
        .find('.channel').text(vote.channel)
        .removeClass('choose').addClass('fixed');
    } else {
        var channel = skript.find('.channel');
        if (vote.setup){
            channel.html(vote.setup.irc.channel);
        }
        channel.removeClass('fixed').addClass('choose');
    }
}

function renderSkript(skript) {
    $('#templates .skript').
        clone().
        attr('id', 'skript-' + skript.id).
        find('.title').text(skript.title).end().
        find('.author').text(skript.author).end().
        find('.vote').click(function() {
            castVote(skript.id);
        }).end().
        appendTo('#skript-list');

    renderVoteData(skript);
}

function loadSkripts(skripts) {
    $.each(skripts, function(id, skript) {
        renderSkript(skript);
    });
}

function castVote(id) {
    $.post('/api/vote/' + id, { channel: $('#skript-' + id + ' input').val() }, function(res) {
        highlightVote(id);
    });
}

function highlightVote(id) {
    if (id) {
        $('#skript-' + id).addClass('voted-for');
        $('#skript-list').addClass('vote-casted')
    } else {
        $('.skript').removeClass('voted-for');
        $('#skript-list').removeClass('vote-casted')
    }
}

function handleShowTimes(data) {
    handleNextShow(data.next);
    handleCurrentShow(data.current);
}

function handleCurrentShow(currentShow) {
    console.log("current show", currentShow);

    if (currentShow.status == 'running') {
      $('#show')
        .removeClass('stopped').addClass('running')
        .find('.current-show')
        .find('.name').html(currentShow.skript.title).end();
    } else {
      $('#show').removeClass('running').addClass('stopped');
    }
}


function handleNextShow(time) {
    time = new Date(time);
    console.log("Next show: ", time);
    $('.next-show').
        find('.time').html(time.toLocaleString()).end().
        find('.countdown').removeClass('hasCountdown').html('').end().
        find('.countdown').countdown({
            until: time,
            layout: '<span class="clock-letter">{m10}</span>' +
                     '<span class="clock-letter">{m1}</span>' + ':' +
                     '<span class="clock-letter">{s10}</span>' +
                     '<span class="clock-letter">{s1}</span>'
        });
}

var openLightBox = function(openId){
    var box = $(openId);
    box.fadeIn();
    box.css({
        'margin-top' : -(box.height() + 80) / 2,
        'margin-left' : -(box.width() + 80) / 2
    });
    $('#lightbox-background').css({'filter' : 'alpha(opacity=80)'}).fadeIn();
    var closeLightBox = function(){
        location.hash = "";
        $("body").css({"overflow": "auto"});
        $('#lightbox-background, .lightbox').fadeOut();
    };
    $('#lightbox-background').live('click', closeLightBox);
    $('.lightbox a.close').live('click', closeLightBox);
    $("body").css({"overflow": "hidden"});
};

$(document).ready(function() {
    $(".open-lightbox").click(function(e){
        openLightBox($(this).attr("href"));
    });
    if (location.hash.length > 1){
        openLightBox(location.hash);
    }
    $.getJSON('/api/skripts', function(skripts) {
      loadSkripts(skripts);
    });

    document.socket = io.connect('/');
    document.socket.on('show times', handleShowTimes);
    document.socket.on('votes', function(votes) {
        $.each(votes, function(id, vote) {
            renderVoteData(vote);
        });
    });
    document.socket.on('my vote', function(id) {
        highlightVote(id);
        var hasVoted = id !== null;
        if (!hasVoted) {
            $('span.channel').click(function() {
               var input = $('<input />', {'type': 'text', 'name': 'channel', 'value': $(this).html()});
               $(this).replaceWith(input);
               input.focus();
            });
        }
    });
});
