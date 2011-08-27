function loadSkripts() {
    $.getJSON('/api/skripts', function(resp) {
        resp.forEach(function(skript) {
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
});