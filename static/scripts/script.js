function loadSkripts() {
    $.getJSON('/api/skripts', function(resp) {
        $.each(resp, function(id, skript) {
            showSkript(skript);
        });
    });
}

function showSkript(skript) {
    $('#templates .skript').
        clone().
        find('.title').html(skript.title).end().
        find('.author').html(skript.author).end().
        find('.start-link').click(function() {
            startSkript(skript.id);
        }).end().
        appendTo('#skript-list');
}

function startSkript(id) {
    $.post('/api/start/' + id);
}

$(document).ready(function() {
    loadSkripts();
    var socket = io.connect('http://localhost');
    socket.on('current show', function (data) {
      console.log(data);
      //socket.emit('my other event', { my: 'data' });
    });
});
