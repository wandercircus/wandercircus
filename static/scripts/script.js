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

function handleCurrentShow(data) {
    console.log(data);
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
    loadSkripts();
    var socket = io.connect('http://localhost');
    socket.on('current show', handleCurrentShow);
});
