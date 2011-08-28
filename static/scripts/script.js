function renderVoteData(vote) {
    //console.log('rendering vote', vote);
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
  //console.log(skript);
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
    var input = $('#skript-' + id + ' input');
    var span = $('<span>' + input.val() + '</span>');
    input.replaceWith(span);
    $.post('/api/vote/' + id, { channel: input.val() }, function(res) {
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
    //console.log("current show", currentShow);

    if (currentShow.status == 'running') {
      $('#show')
        .removeClass('stopped').addClass('running')
        .find('#current-show')
        .find('.current-show-title').html(currentShow.skript.title).end()
        .find('.current-show-author').html(currentShow.skript.author).end()
        .find('span.channel').text(currentShow.skript.channel).end()
        .find('a.channel').attr('href', 'irc://chat.freenode.net/' + currentShow.skript.channel);
    } else {
      $('#show').removeClass('running').addClass('stopped');
    }
}

function handleNextShow(time) {
    time = new Date(time);
    //console.log("Next show: ", time);
    $('#next-show').
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
    if (openId == '#irc') {
      var channel = $('#current-show .channel:first').text().slice(1);
      if (!box.hasClass('running') || (box.hasClass('running') && box.attr('channel') != channel)) {
        box.html('<iframe src="http://webchat.freenode.net?nick=onlooker-.&channels=' + channel + '&uio=MT1mYWxzZSY3PWZhbHNlJjk9dHJ1ZSYxMT0yMQ7f" width="647" height="400"></iframe>');
        box.addClass('running');
        box.attr('channel', channel);
      };
    };
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
    $('#lightbox-background').live('click', function(e){
        e.preventDefault();
        closeLightBox();
    });
    $('.lightbox a.close').live('click', function(e){
        e.preventDefault();
        closeLightBox();
    });
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
    document.socket.on('next show', function(show) {
        if (show) {
            //console.log('next show is', show)
            $('#next-show').
                addClass('upcoming-show').removeClass('no-upcoming-show').
                find('.next-show-title').text(show.title).end().
                find('.next-show-author').text(show.author);
        } else {
            $('#next-show').
                removeClass('upcoming-show').addClass('no-upcoming-show')
        }
    })
    document.socket.on('my vote', function(id) {
        highlightVote(id);
        var hasVoted = id !== null;
        if (!hasVoted) {
            $('#skript-list span.channel').click(function() {
               var input = $('<input />', {'type': 'text', 'name': 'channel', 'value': $(this).html()});
               $(this).replaceWith(input);
               input.focus();
            });
        }
    });
});
