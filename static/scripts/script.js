function loadSkripts(skripts) {
    console.log(skripts);
    $.each(skripts, function(id, skript) {
        showSkript(skript);
    });
}

function showSkript(skript) {
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
}

function castVote(id) {
    jQuery.post('/api/vote/' + id, function(res) {
        $('#skript-' + id).addClass('voted-for');
    });
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

$(document).ready(function() {
    document.socket = io.connect('/');
    document.socket.on('skripts', function(skripts) {
      loadSkripts(skripts);
    });
    document.socket.on('current show', handleCurrentShow);
    document.socket.on('votes', function(data) {
      console.log('received a vote ', data.toString());
    });
});
