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
        find('.title').html(skript.title).end().
        find('.author').html(skript.author).end().
        find('.vote').click(function() {
            castVote(skript.id);
        }).end().
        appendTo('#skript-list');
}

function castVote(id) {
    document.socket.emit('vote', {'id': id});
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
      loadSkripts(JSON.parse(skripts));
    });
    document.socket.on('current show', handleCurrentShow);
    document.socket.on('vote', function(socket) {
      console.log('received a vote ' + socket.toString());
    });
});
