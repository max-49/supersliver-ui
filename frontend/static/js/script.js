// SuperSliver UI custom scripts
$(function(){
	// Row click: open placeholder actions modal
	$('tbody tr[data-session-id]').on('click', function(){
		var sid = $(this).data('session-id');
		$('#modalSid').text(sid);
		$('#sessionModal').modal('show');
	});
});
