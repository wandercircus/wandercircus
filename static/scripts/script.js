function renderVoteData(vote) {
    var skript = $('#skript-' + vote.id);
    skript.find('.vote-number').html(vote.votes);
    skript.find('.vote-bar').animate( { width: (500 * vote.votePercentage) + 'px'}, 300);
    if (vote.channel) {
      skript
        .find('span.channel')
        .find('span').html('#' + vote.channel).end()
        .removeClass('choose').addClass('fixed');
    } else {
      skript
        .find('span.channel')
        .removeClass('fixed').addClass('choose');
    };
}

function renderSkript(skript) {
    $('#templates .skript').
        clone().
        attr('id', 'skript-' + skript.id).
        find('.title').html(skript.title).end().
        find('.author').html(skript.author).end().
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
    $.post('/api/vote/' + id, { channel: $('#skript-' + id + ' .channel input').val() }, function(res) {
        highlightVote(id);
    });
}

function highlightVote(id) {
    $('#skript-' + id).addClass('voted-for');
}

function handleShowTimes(data) {
    handleCurrentShow(data.current);
    handleNextShow(data.next);
}

function handleCurrentShow(data) {
    console.log("current show: " + data);
    var currentShow = JSON.parse(data);

    if (currentShow.status == 'running') {
      $('.current-show')
        .find('.name').html(currentShow.skript.title).end()
        .removeClass('stopped').addClass('running');
    } else {
      $('.current-show').removeClass('running').addClass('stopped');
    }
}


function handleNextShow(time) {
    // TODO implement
    time = new Date(time);
    console.log("Next show: ", time);
    $('#next-show').
        find('.time').html(time.toLocaleString()).end().
        find('.countdown').countdown({'until': time});
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
    });
});
