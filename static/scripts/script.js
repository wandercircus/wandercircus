function renderVoteData(vote) {
    var skript = $('#skript-' + vote.id);
    skript.find('.vote-number').html(vote.votes);
    skript.find('.vote-bar').animate( { width: (500 * vote.votePercentage) + 'px'}, 300);
}

function renderSkript(skript) {
  console.log(skript);
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
    jQuery.post('/api/vote/' + id, function(res) {
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
    console.log("Next show: ", new Date(time));
}

$(document).ready(function() {
    $.getJSON('/api/skripts', function(skripts) {
      console.log(skripts);
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
